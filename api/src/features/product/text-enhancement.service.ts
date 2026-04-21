import { openaiClient } from '../../config/openai.client';

type Language = 'es' | 'pt';

const PRODUCT_PROMPTS = {
  es: `Eres un experto en e-commerce latinoamericano.
Genera sinónimos y términos de búsqueda que clientes usarían para este producto.

Reglas:
- Incluye variaciones regionales (remera→camiseta/playera/polera)
- Agrega términos de búsqueda comunes
- Máximo 50 palabras
- Formato: términos separados por comas

Producto:
{text}

Términos adicionales:`,

  pt: `Você é um especialista em e-commerce brasileiro.
Gere sinônimos e termos de busca que clientes usariam para encontrar este produto.

Regras:
- Inclua variações regionais brasileiras (blusa→camiseta/camisa)
- Adicione termos de busca comuns
- Máximo 50 palavras
- Formato: separado por vírgulas

Produto:
{text}

Termos adicionais:`,
};

const QUERY_PROMPTS = {
  es: `Expande esta búsqueda con sinónimos y variaciones regionales latinoamericanas.

Reglas:
- Mantén la intención original
- Incluye variaciones comunes (remera/camiseta/playera)
- Máximo 30 palabras
- Formato: términos separados por comas

Búsqueda: {query}

Expansión:`,

  pt: `Expanda esta busca com sinônimos e variações regionais brasileiras.

Reglas:
- Mantenha a intenção original
- Inclua variações comuns (blusa/camiseta/camisa)
- Máximo 30 palavras
- Formato: separado por vírgulas

Busca: {query}

Expansão:`,
};

class TextEnhancementService {
  async enrichProductText(productText: string, language: Language): Promise<string> {
    const prompt = PRODUCT_PROMPTS[language].replace('{text}', productText);

    try {
      const response = await openaiClient.chat.completions.create(
        {
          model: 'gpt-4o-mini',
          messages: [{ role: 'user', content: prompt }],
          max_tokens: 100,
          temperature: 0.3,
        },
        { timeout: 3000 }
      );

      const enrichedTerms = response.choices[0]?.message?.content?.trim() || '';
      return enrichedTerms;
    } catch (error) {
      console.error('Product text enrichment failed:', error);
      throw error;
    }
  }

  async enrichQuery(query: string, language: Language): Promise<string> {
    const prompt = QUERY_PROMPTS[language].replace('{query}', query);

    try {
      const response = await openaiClient.chat.completions.create(
        {
          model: 'gpt-4o-mini',
          messages: [{ role: 'user', content: prompt }],
          max_tokens: 100,
          temperature: 0.3,
        },
        { timeout: 3000 }
      );

      const expandedQuery = response.choices[0]?.message?.content?.trim() || '';
      return `${query}, ${expandedQuery}`;
    } catch (error) {
      console.error('Query enrichment failed:', error);
      throw error;
    }
  }
}

const textEnhancementService = new TextEnhancementService();
export default textEnhancementService;
