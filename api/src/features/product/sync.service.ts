import { tiendanubeApiClient } from '@config';
import embeddingRepository from '@database/repositories/EmbeddingRepository';
import embeddingService, { type Product } from './embedding.service';

type SyncResult = {
  synced: number;
  embeddings: number;
  errors: number;
};

class SyncService {
  async syncAllProducts(storeUserId: number): Promise<SyncResult> {
    const result: SyncResult = { synced: 0, embeddings: 0, errors: 0 };

    try {
      const products = await this.fetchAllProducts(storeUserId);

      for (const product of products) {
        try {
          await embeddingService.syncProductEmbedding(
            product.id.toString(),
            product,
            storeUserId
          );
          result.synced++;
          result.embeddings += 3;
        } catch (error) {
          console.error(`Failed to sync product ${product.id}:`, error);
          result.errors++;
        }
      }
    } catch (error) {
      console.error('Failed to fetch products from Tiendanube:', error);
      throw error;
    }

    return result;
  }

  async syncSingleProduct(storeUserId: number, productId: string): Promise<void> {
    try {
      const product = await tiendanubeApiClient.get(`${storeUserId}/products/${productId}`) as Product;
      await embeddingService.syncProductEmbedding(productId, product, storeUserId);
    } catch (error) {
      console.error(`Failed to sync product ${productId}:`, error);
      throw error;
    }
  }

  async deleteProduct(storeUserId: number, productId: string): Promise<void> {
    await embeddingRepository.deleteByProductId(storeUserId, productId);
  }

  async generatePlaceholders(storeUserId: number): Promise<string[]> {
    try {
      const hasEmbeddings = await embeddingRepository.hasEmbeddings(storeUserId);
      if (!hasEmbeddings) {
        return this.getDefaultPlaceholders();
      }

      const products = await this.fetchAllProducts(storeUserId);

      if (products.length === 0) {
        return this.getDefaultPlaceholders();
      }

      const placeholders: string[] = [];
      const languages = ['es', 'pt', 'en'] as const;

      for (const product of products.slice(0, 15)) {
        for (const lang of languages) {
          const name = product.name?.[lang] || product.name?.es || product.name?.en;
          if (name && placeholders.length < 15) {
            const templates = [
              `¿Buscas ${name.toLowerCase()}?`,
              `Busco ${name.toLowerCase()}`,
              `Quiero ${name.toLowerCase()}`,
              `${name}`,
            ];
            placeholders.push(templates[Math.floor(Math.random() * templates.length)]);
          }
          if (placeholders.length >= 15) break;
        }
        if (placeholders.length >= 15) break;
      }

      if (products[0].categories && products[0].categories.length > 0) {
        const category =
          products[0].categories[0].name?.es ||
          products[0].categories[0].name?.en ||
          products[0].categories[0].name?.pt;
        if (category) {
          placeholders.push(`Productos de ${category.toLowerCase()}`);
        }
      }

      return placeholders.slice(0, 15);
    } catch (error) {
      console.error('Failed to generate placeholders:', error);
      return this.getDefaultPlaceholders();
    }
  }

  private async fetchAllProducts(storeUserId: number): Promise<Product[]> {
    let allProducts: Product[] = [];
    let page = 1;
    const perPage = 50;

    while (true) {
      try {
        const products = await tiendanubeApiClient.get(
          `${storeUserId}/products?page=${page}&per_page=${perPage}`
        ) as Product[];

        if (!products || products.length === 0) break;

        allProducts = allProducts.concat(products);

        if (products.length < perPage) break;

        page++;
      } catch (error) {
        console.error(`Failed to fetch page ${page}:`, error);
        break;
      }
    }

    return allProducts;
  }

  private getDefaultPlaceholders(): string[] {
    return [
      '¿Buscas un regalo especial?',
      'Productos en oferta',
      'Lo más vendido',
      '¿Qué necesitas hoy?',
      'Busco algo para...',
      'Quiero un producto de...',
      '¿Tienes productos de...?',
      'Necesito ayuda para encontrar...',
      'Busco regalos para cumpleaños',
      'Productos nuevos',
      '¿Qué me recomendas?',
      'Busco ofertas',
      'Productos populares',
      '¿Tienen productos de calidad?',
      'Quiero comprar...',
    ];
  }
}

export default new SyncService();
