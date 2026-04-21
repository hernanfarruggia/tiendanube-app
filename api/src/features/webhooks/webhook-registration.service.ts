import { tiendanubeApiClient } from '@config';

class WebhookRegistrationService {
  async registerWebhooks(storeUserId: number): Promise<void> {
    const baseUrl = process.env.API_BASE_URL;

    const webhooks = [
      { event: 'product/created', url: `${baseUrl}/webhooks/product/create` },
      { event: 'product/updated', url: `${baseUrl}/webhooks/product/update` },
      { event: 'product/deleted', url: `${baseUrl}/webhooks/product/delete` },
    ];

    try {
      // First, delete any existing webhooks to avoid duplicates
      await this.unregisterWebhooks(storeUserId);

      // Then register new webhooks
      for (const webhook of webhooks) {
        await tiendanubeApiClient.post(`${storeUserId}/webhooks`, webhook);
        console.log(`[Webhook] Registered: ${webhook.event}`);
      }
    } catch (error) {
      console.error('[Webhook] Registration failed:', error);
      throw error;
    }
  }

  async unregisterWebhooks(storeUserId: number): Promise<void> {
    try {
      // tiendanubeApiClient interceptor already returns response.data
      const webhooks = await tiendanubeApiClient.get(`${storeUserId}/webhooks`) as any[];

      if (!webhooks || webhooks.length === 0) {
        console.log('[Webhook] No webhooks to unregister');
        return;
      }

      for (const webhook of webhooks) {
        await tiendanubeApiClient.delete(`${storeUserId}/webhooks/${webhook.id}`);
        console.log(`[Webhook] Unregistered: ${webhook.event}`);
      }
    } catch (error) {
      console.error('[Webhook] Unregistration failed:', error);
      // Don't throw - allow registration to continue even if unregistration fails
    }
  }
}

export default new WebhookRegistrationService();
