import { openaiClient, openaiConfig } from '@config/openai.client';
import chatRepository, { ChatMessage } from '@database/repositories/ChatRepository';
import vectorSearchService from '@features/product/vector-search.service';
import embeddingRepository from '@database/repositories/EmbeddingRepository';

type ChatResponse = {
  message: string;
  products: any[];
  needsClarification: boolean;
  sessionId: string;
};

class ChatService {
  async chat(
    message: string,
    sessionId: string,
    storeUserId: number,
    language: string = 'es'
  ): Promise<ChatResponse> {
    const hasEmbeddings = await embeddingRepository.hasEmbeddings(storeUserId);
    if (!hasEmbeddings) {
      throw new Error('Please sync products first');
    }

    const history = await chatRepository.getMessages(sessionId, 25);

    // Step 1: Analyze conversation context (detect focus change + build search context)
    const searchContext = await this.analyzeConversationContext(history, message, language);

    // Step 2: Search for products
    const searchResults = await vectorSearchService.semanticSearch(
      searchContext,
      storeUserId,
      language.split('_')[0] as 'es' | 'pt',
      5
    );

    // Step 3: Decide if we need clarification BEFORE calling the model
    const needsClarification = this.shouldAskForClarification(searchResults);

    // Step 4: Build appropriate prompt based on clarification need
    const systemPrompt = needsClarification
      ? this.buildClarificationPrompt(searchContext, language)
      : this.buildRecommendationPrompt(searchResults, language);

    // Step 5: Call model
    let assistantMessage = '';
    try {
      console.log('[Chat] 🔍 Request to OpenAI:', {
        model: openaiConfig.model,
        maxTokens: openaiConfig.maxTokens,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: searchContext },
        ],
        needsClarification,
      });

      const completion = await openaiClient.chat.completions.create({
        model: openaiConfig.model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: searchContext },
        ],
        max_completion_tokens: openaiConfig.maxTokens,
      });

      // Log full response for debugging
      console.log('[Chat] 📦 OpenAI response:', JSON.stringify(completion, null, 2));

      assistantMessage = completion.choices[0].message.content?.trim() || '';

      // Handle empty response
      if (!assistantMessage) {
        console.error('[Chat] ⚠️ Model returned EMPTY content', {
          model: openaiConfig.model,
          finishReason: completion.choices[0].finish_reason,
          refusal: completion.choices[0].message.refusal,
          usage: completion.usage,
        });
        assistantMessage = this.getFallbackMessage(language, needsClarification);
      }
    } catch (error) {
      console.error('[Chat] ❌ OpenAI API error:', error);
      assistantMessage = this.getFallbackMessage(language, needsClarification);
    }

    // Step 6: Save messages
    await chatRepository.addMessage(sessionId, 'user', message);
    await chatRepository.addMessage(sessionId, 'assistant', assistantMessage, {
      products: searchResults.map((r) => r.product.id),
    });

    return {
      message: assistantMessage,
      products: needsClarification ? [] : searchResults.map((r) => r.product),
      needsClarification,
      sessionId,
    };
  }

  /**
   * Determines if we should ask for clarification BEFORE calling the model
   */
  private shouldAskForClarification(searchResults: any[]): boolean {
    // No products found
    if (searchResults.length === 0) return true;

    // Low similarity scores (average below 0.75)
    // const avgSimilarity =
    //   searchResults.reduce((sum, r) => sum + r.similarity, 0) / searchResults.length;
    // if (avgSimilarity < 0.70) return true;

    return false;
  }

  /**
   * Analiza el contexto conversacional para determinar qué buscar
   * Detecta cambios de foco y construye contexto de búsqueda óptimo
   * @returns Texto optimizado para búsqueda semántica
   */
  private async analyzeConversationContext(
    history: ChatMessage[],
    newMessage: string,
    language: string
  ): Promise<string> {
    // Si no hay historial, usar mensaje directamente
    if (history.length === 0) {
      return newMessage;
    }

    // Construir historial reciente (últimos 10 mensajes)
    const recentHistory = history.slice(-10);
    const historyText = recentHistory
      .map((msg) => `${msg.role}: ${msg.content}`)
      .join('\n');

    try {
      const completion = await openaiClient.chat.completions.create({
        model: openaiConfig.model,
        response_format: { type: 'json_object' },
        messages: [
          {
            role: 'system',
            content: `Eres un experto en análisis de conversaciones de e-commerce.

Analiza el historial de conversación y el nuevo mensaje del usuario.

Tu tarea:
1. Determina si el nuevo mensaje cambia el foco de búsqueda (ej: de "remeras" a "pantalones")
2. Genera un contexto de búsqueda óptimo para encontrar productos

Reglas:
- Si cambió el foco: usa SOLO el nuevo mensaje
- Si NO cambió: combina información relevante del historial + nuevo mensaje
- Extrae: categoría, atributos (color, talle, marca), contexto de uso
- Ignora: saludos, preguntas genéricas, confirmaciones
- Máximo 100 palabras

Retorna JSON:
{
  "focusChanged": boolean,
  "searchContext": "texto optimizado para búsqueda de productos"
}`,
          },
          {
            role: 'user',
            content: `Historial:\n${historyText}\n\nNuevo mensaje: ${newMessage}`,
          },
        ],
        temperature: 0.3,
        max_tokens: 200,
      });

      const content = completion.choices[0].message.content?.trim();
      if (!content) {
        console.warn('[Chat] Empty response from analyzeConversationContext');
        return newMessage;
      }

      const parsed = JSON.parse(content);
      const searchContext = parsed.searchContext || newMessage;

      console.log(
        `[Chat] Context analysis: focusChanged=${parsed.focusChanged}, context="${searchContext}"`
      );

      return searchContext;
    } catch (error) {
      console.error('[Chat] Error in analyzeConversationContext:', error);
      // Fallback: usar solo mensaje nuevo
      return newMessage;
    }
  }

  /**
   * Builds a prompt specifically for asking clarification questions
   */
  private buildClarificationPrompt(userMessage: string, language: string): string {
    const examples = {
      es: `Ejemplos de clarificación:
- Usuario: "busco ropa" → "¿Qué tipo de prenda estás buscando? Por ejemplo: remera, pantalón, vestido..."
- Usuario: "algo para correr" → "¿Buscas zapatillas o ropa deportiva?"
- Usuario: "un regalo" → "¿Para quién es el regalo y cuál es tu presupuesto aproximado?"`,
      pt: `Exemplos de esclarecimento:
- Usuário: "procuro roupa" → "Que tipo de roupa você está procurando? Por exemplo: camiseta, calça, vestido..."
- Usuário: "algo para correr" → "Você está procurando tênis ou roupas esportivas?"
- Usuário: "um presente" → "Para quem é o presente e qual é o seu orçamento aproximado?"`,
    };

    return `Eres un asistente que atiende una tienda online. El cliente esta buscando lo siguiente:

    "${userMessage}"

Pero no tenemos suficientes datos todavía.

Tu tarea es: Preguntar UNA pregunta especfícia para entender lo que el usuario necesita.

Guias:
- Preguntar por: categoria, caso de uso, rango de precios, estilo, color, o necesidades especificas segun la conversacion
- Se amistoso y conversacional
- No respondas con mas de 30 palabras
- Responde en ${language.includes('es') ? 'ESPAÑOL' : 'PORTUGUÉS' }

${examples[language as keyof typeof examples] || examples.es}`;
  }

  /**
   * Builds a prompt for product recommendations
   */
  private buildRecommendationPrompt(searchResults: any[], language: string): string {
    const productInfo = searchResults
      .map(
        (r, i) =>
          `${i + 1}. ${r.product.name?.es || r.product.name?.pt || 'Product'} - $${r.product.price || 'N/A'} (relevancia: ${(r.similarity * 100).toFixed(0)}%)`
      )
      .join('\n');

    return `Eres un asistente que atiende una tienda online.

Tu tarea: Recomendar productos que hagan match con los requerimientos del usuario.

Guias:
- Revisa los productos de la lista debajo, califica y recomienda del mejor al peor.
- Explica un breve detalle de cada uno.
- Manten tu respuesta menor a 150 palabras.
- Responde in ${language.includes('es') ? 'ESPAÑOL' : 'PORTUGUÉS' }

Productos:
${productInfo}

Describelos naturalmente y menciona porqué son buenas recomendaciones.`;
  }

  /**
   * Fallback message when model fails or returns empty
   */
  private getFallbackMessage(language: string, isClearing: boolean): string {
    const messages = {
      es: isClearing
        ? '¿Podrías darme más detalles sobre lo que buscas? Por ejemplo, ¿qué tipo de producto te interesa?'
        : 'Disculpa, tuve un problema procesando tu mensaje. ¿Podrías reformularlo?',
      pt: isClearing
        ? 'Você poderia me dar mais detalhes sobre o que está procurando? Por exemplo, que tipo de produto te interessa?'
        : 'Desculpe, tive um problema processando sua mensagem. Você poderia reformulá-la?',
    };

    return messages[language as keyof typeof messages] || messages.es;
  }

}

export default new ChatService();
