import { openaiClient, openaiConfig } from '@config/openai.client';
import chatRepository from '@database/repositories/ChatRepository';
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

    const history = await chatRepository.getMessages(sessionId, 5);

    const searchResults = await vectorSearchService.semanticSearch(
      message,
      storeUserId,
      language,
      5
    );

    const systemPrompt = this.buildSystemPrompt(searchResults);
    const conversationHistory = this.buildConversationHistory(history);

    const completion = await openaiClient.chat.completions.create({
      model: openaiConfig.model,
      messages: [
        { role: 'system', content: systemPrompt },
        ...conversationHistory,
        { role: 'user', content: message },
      ],
      max_tokens: openaiConfig.maxTokens,
      temperature: openaiConfig.temperature,
    });

    const assistantMessage = completion.choices[0].message.content || '';

    await chatRepository.addMessage(sessionId, 'user', message);
    await chatRepository.addMessage(sessionId, 'assistant', assistantMessage, {
      products: searchResults.map((r) => r.product.id),
    });

    const needsClarification = this.detectClarificationNeeded(assistantMessage, searchResults);

    return {
      message: assistantMessage,
      products: needsClarification ? [] : searchResults.map((r) => r.product),
      needsClarification,
      sessionId,
    };
  }

  private buildSystemPrompt(searchResults: any[]): string {
    const productInfo =
      searchResults.length > 0
        ? searchResults
            .map(
              (r, i) =>
                `${i + 1}. ${r.product.name?.es || r.product.name?.en || 'Product'} - $${r.product.price || 'N/A'}`
            )
            .join('\n')
        : 'No exact matches found.';

    return `You are a helpful shopping assistant for a Tiendanube store.
Help customers find products through conversation.

Guidelines:
- Ask clarifying questions if request is vague
- Recommend 3-5 specific products when you have enough info
- Be conversational and friendly
- Keep responses under 100 words
- If products don't match well, say so honestly

Available Products:
${productInfo}

When recommending products, describe them naturally and mention why they match the customer's needs.`;
  }

  private buildConversationHistory(
    history: any[]
  ): Array<{ role: 'user' | 'assistant'; content: string }> {
    return history.map((msg) => ({
      role: msg.role as 'user' | 'assistant',
      content: msg.content,
    }));
  }

  private detectClarificationNeeded(message: string, searchResults: any[]): boolean {
    if (searchResults.length === 0) return true;

    const clarificationKeywords = [
      '?',
      'qué tipo',
      'cuál',
      'específicamente',
      'más detalles',
      'what kind',
      'which',
      'specifically',
      'que tipo',
      'qual',
    ];

    return clarificationKeywords.some((keyword) => message.toLowerCase().includes(keyword));
  }
}

export default new ChatService();
