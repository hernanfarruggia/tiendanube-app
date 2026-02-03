import { openaiConfig } from '@config/openai.client';
import { tiendanubeApiClient } from '@config';
import embeddingRepository from '@database/repositories/EmbeddingRepository';
import embeddingService from './embedding.service';

type SearchResult = {
  product: any;
  similarity: number;
};

class VectorSearchService {
  async semanticSearch(
    query: string,
    storeUserId: number,
    language: string = 'es',
    limit: number = openaiConfig.vectorSearchLimit
  ): Promise<SearchResult[]> {
    const queryEmbedding = await embeddingService.generateEmbedding(query);

    const similarProducts = await embeddingRepository.findSimilar(
      queryEmbedding,
      storeUserId,
      language,
      limit * 2
    );

    const filteredProducts = similarProducts.filter((p) => p.similarity >= 0.7);

    const topProducts = filteredProducts.slice(0, limit);

    const productsWithData = await Promise.all(
      topProducts.map(async (item) => {
        try {
          const product = await tiendanubeApiClient.get(
            `${storeUserId}/products/${item.product_id}`
          );
          return {
            product,
            similarity: item.similarity,
          };
        } catch (error) {
          console.error(`Failed to fetch product ${item.product_id}:`, error);
          return null;
        }
      })
    );

    return productsWithData.filter((p): p is SearchResult => p !== null);
  }
}

export default new VectorSearchService();
