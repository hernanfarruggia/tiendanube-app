import { tiendanubeApiClient } from '@config';

class WebhookRegistrationService {
  async registerWebhooks(storeUserId: number): Promise<void> {
    const baseUrl = process.env.API_BASE_URL || 'http://localhost:8000';

    const webhooks = [
      { event: 'product/created', url: `${baseUrl}/api/webhooks/product/create` },
      { event: 'product/updated', url: `${baseUrl}/api/webhooks/product/update` },
      { event: 'product/deleted', url: `${baseUrl}/api/webhooks/product/delete` },
    ];

    try {
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
      const { data: webhooks } = await tiendanubeApiClient.get(`${storeUserId}/webhooks`);

      for (const webhook of webhooks) {
        await tiendanubeApiClient.delete(`${storeUserId}/webhooks/${webhook.id}`);
        console.log(`[Webhook] Unregistered: ${webhook.event}`);
      }
    } catch (error) {
      console.error('[Webhook] Unregistration failed:', error);
    }
  }
}

export default new WebhookRegistrationService();
