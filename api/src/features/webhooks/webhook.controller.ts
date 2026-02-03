import { Request, Response } from 'express';
import crypto from 'crypto';
import webhookService from './webhook.service';

class WebhookController {
  private verifySignature(payload: string, signature: string): boolean {
    if (!process.env.CLIENT_SECRET) {
      console.error('[Webhook] CLIENT_SECRET not configured - rejecting webhook');
      return false;
    }

    const hash = crypto
      .createHmac('sha256', process.env.CLIENT_SECRET)
      .update(payload)
      .digest('hex');

    return hash === signature;
  }

  async productCreate(req: Request, res: Response): Promise<void> {
    try {
      const signature = req.headers['x-tiendanube-signature'] as string;
      const payload = JSON.stringify(req.body);

      if (!this.verifySignature(payload, signature)) {
        res.status(401).json({ error: 'Invalid signature' });
        return;
      }

      const { store_id, id } = req.body;

      if (!store_id || !id) {
        res.status(400).json({ error: 'Missing required fields' });
        return;
      }

      await webhookService.handleProductCreate(store_id, id.toString());

      res.json({ success: true });
    } catch (error) {
      console.error('[Webhook] Product create error:', error);
      res.status(500).json({ error: 'Failed to process webhook' });
    }
  }

  async productUpdate(req: Request, res: Response): Promise<void> {
    try {
      const signature = req.headers['x-tiendanube-signature'] as string;
      const payload = JSON.stringify(req.body);

      if (!this.verifySignature(payload, signature)) {
        res.status(401).json({ error: 'Invalid signature' });
        return;
      }

      const { store_id, id } = req.body;

      if (!store_id || !id) {
        res.status(400).json({ error: 'Missing required fields' });
        return;
      }

      await webhookService.handleProductUpdate(store_id, id.toString());

      res.json({ success: true });
    } catch (error) {
      console.error('[Webhook] Product update error:', error);
      res.status(500).json({ error: 'Failed to process webhook' });
    }
  }

  async productDelete(req: Request, res: Response): Promise<void> {
    try {
      const signature = req.headers['x-tiendanube-signature'] as string;
      const payload = JSON.stringify(req.body);

      if (!this.verifySignature(payload, signature)) {
        res.status(401).json({ error: 'Invalid signature' });
        return;
      }

      const { store_id, id } = req.body;

      if (!store_id || !id) {
        res.status(400).json({ error: 'Missing required fields' });
        return;
      }

      await webhookService.handleProductDelete(store_id, id.toString());

      res.json({ success: true });
    } catch (error) {
      console.error('[Webhook] Product delete error:', error);
      res.status(500).json({ error: 'Failed to process webhook' });
    }
  }
}

export default new WebhookController();
