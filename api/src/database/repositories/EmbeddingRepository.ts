import { query } from '@config/database.config';

type Embedding = {
  store_user_id: number;
  product_id: string;
  language: string;
  embedding_text: string;
  embedding: number[];
};

type SimilarProduct = {
  product_id: string;
  similarity: number;
};

class EmbeddingRepository {
  async upsert(embedding: Embedding): Promise<void> {
    await query(
      `INSERT INTO product_embeddings (store_user_id, product_id, language, embedding_text, embedding)
       VALUES ($1, $2, $3, $4, $5::vector)
       ON CONFLICT (store_user_id, product_id, language)
       DO UPDATE SET embedding_text = $4, embedding = $5::vector, created_at = NOW()`,
      [
        embedding.store_user_id,
        embedding.product_id,
        embedding.language,
        embedding.embedding_text,
        JSON.stringify(embedding.embedding),
      ]
    );
  }

  async findSimilar(
    embedding: number[],
    storeUserId: number,
    language: string,
    limit: number = 5
  ): Promise<SimilarProduct[]> {
    const result = await query(
      `SELECT product_id, 1 - (embedding <=> $1::vector) as similarity
       FROM product_embeddings
       WHERE store_user_id = $2 AND language = $3
       ORDER BY embedding <=> $1::vector
       LIMIT $4`,
      [JSON.stringify(embedding), storeUserId, language, limit]
    );

    return result.rows;
  }

  async deleteByProductId(storeUserId: number, productId: string): Promise<void> {
    await query(
      'DELETE FROM product_embeddings WHERE store_user_id = $1 AND product_id = $2',
      [storeUserId, productId]
    );
  }

  async hasEmbeddings(storeUserId: number): Promise<boolean> {
    const result = await query(
      'SELECT EXISTS(SELECT 1 FROM product_embeddings WHERE store_user_id = $1) as exists',
      [storeUserId]
    );
    return result.rows[0]?.exists || false;
  }

  async getProductIds(storeUserId: number): Promise<string[]> {
    const result = await query(
      'SELECT DISTINCT product_id FROM product_embeddings WHERE store_user_id = $1',
      [storeUserId]
    );
    return result.rows.map((row) => row.product_id);
  }

  async countEmbeddings(storeUserId: number): Promise<number> {
    const result = await query(
      'SELECT COUNT(DISTINCT product_id) as count FROM product_embeddings WHERE store_user_id = $1',
      [storeUserId]
    );
    return parseInt(result.rows[0]?.count || '0', 10);
  }
}

export default new EmbeddingRepository();
