import syncService from '@features/product/sync.service';

class WebhookService {
  async handleProductCreate(storeUserId: number, productId: string): Promise<void> {
    try {
      await syncService.syncSingleProduct(storeUserId, productId);
      console.log(`[Webhook] Product created: ${productId}`);
    } catch (error) {
      console.error(`[Webhook] Failed to handle product create:`, error);
      throw error;
    }
  }

  async handleProductUpdate(storeUserId: number, productId: string): Promise<void> {
    try {
      await syncService.syncSingleProduct(storeUserId, productId);
      console.log(`[Webhook] Product updated: ${productId}`);
    } catch (error) {
      console.error(`[Webhook] Failed to handle product update:`, error);
      throw error;
    }
  }

  async handleProductDelete(storeUserId: number, productId: string): Promise<void> {
    try {
      await syncService.deleteProduct(storeUserId, productId);
      console.log(`[Webhook] Product deleted: ${productId}`);
    } catch (error) {
      console.error(`[Webhook] Failed to handle product delete:`, error);
      throw error;
    }
  }
}

export default new WebhookService();
