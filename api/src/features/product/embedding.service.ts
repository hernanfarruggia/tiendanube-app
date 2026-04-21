import { openaiClient, openaiConfig } from '@config/openai.client';
import embeddingRepository from '@database/repositories/EmbeddingRepository';
import textEnhancementService from './text-enhancement.service';

export type Product = {
  id: string | number;
  name?: { es?: string; en?: string; pt?: string };
  description?: { es?: string; en?: string; pt?: string };
  tags?: string | string[];
  categories?: Array<{ name?: { es?: string; en?: string; pt?: string } }>;
  attributes?: Array<{ name?: string; values?: Array<{ value?: string }> }>;
  variants?: Array<{ price?: string; stock?: number }>;
  price?: string;
};

type Language = 'pt' | 'es';

class EmbeddingService {
  async generateEmbedding(text: string): Promise<number[]> {
    const response = await openaiClient.embeddings.create({
      model: openaiConfig.embeddingModel,
      input: text,
    });
    return response.data[0].embedding;
  }

  async generateEmbeddings(texts: string[]): Promise<number[][]> {
    const batches: string[][] = [];
    for (let i = 0; i < texts.length; i += openaiConfig.embeddingBatchSize) {
      batches.push(texts.slice(i, i + openaiConfig.embeddingBatchSize));
    }

    const allEmbeddings: number[][] = [];
    for (const batch of batches) {
      const response = await openaiClient.embeddings.create({
        model: openaiConfig.embeddingModel,
        input: batch,
      });
      allEmbeddings.push(...response.data.map((item) => item.embedding));
    }

    return allEmbeddings;
  }

  async createProductEmbeddingText(product: Product, lang: Language): Promise<string> {
    const parts: string[] = [];

    const name = product.name?.[lang] || product.name?.es || product.name?.pt;
    if (name) parts.push(name);

    const description = product.description?.[lang] || product.description?.es || product.description?.pt;
    if (description) parts.push(description);

    if (product.tags) {
      const tagsStr = Array.isArray(product.tags) ? product.tags.join(', ') : product.tags;
      if (tagsStr) parts.push(`Tags: ${tagsStr}`);
    }

    if (product.categories && product.categories.length > 0) {
      const categoryName =
        product.categories[0].name?.[lang] ||
        product.categories[0].name?.es ||
        product.categories[0].name?.pt;
      if (categoryName) parts.push(`Category: ${categoryName}`);
    }

    if (product.price) {
      parts.push(`Price: ${product.price}`);
    }

    if (product.attributes && product.attributes.length > 0) {
      const attrs = product.attributes
        .map((attr) => {
          const values = attr.values?.map((v) => v.value).filter(Boolean);
          return values && values.length > 0 ? `${attr.name}: ${values.join(', ')}` : null;
        })
        .filter(Boolean);
      if (attrs.length > 0) parts.push(`Attributes: ${attrs.join('; ')}`);
    }

    if (product.variants && product.variants.length > 0) {
      const variantInfo = product.variants
        .slice(0, 3)
        .map((v) => `${v.price || ''}${v.stock !== undefined ? ` (stock: ${v.stock})` : ''}`)
        .filter((v) => v.trim())
        .join(', ');
      if (variantInfo) parts.push(`Variants: ${variantInfo}`);
    }

    const basicText = parts.join('\n');

    try {
      const enrichedTerms = await textEnhancementService.enrichProductText(basicText, lang);
      return `${basicText}\n\nRelated terms: ${enrichedTerms}`;
    } catch (error) {
      console.warn('Product enrichment failed, using original text:', error);
      return basicText;
    }
  }

  async syncProductEmbedding(
    productId: string,
    product: Product,
    storeUserId: number
  ): Promise<void> {
    const languages: Language[] = ['es', 'pt'];

    const embeddingTextsPromises = languages.map((lang) =>
      this.createProductEmbeddingText(product, lang)
    );
    const embeddingTexts = await Promise.all(embeddingTextsPromises);

    const embeddings = await this.generateEmbeddings(embeddingTexts);

    for (let i = 0; i < languages.length; i++) {
      await embeddingRepository.upsert({
        store_user_id: storeUserId,
        product_id: productId,
        language: languages[i],
        embedding_text: embeddingTexts[i],
        embedding: embeddings[i],
      });
    }
  }
}

export default new EmbeddingService();
