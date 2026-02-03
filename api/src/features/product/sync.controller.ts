import { Request, Response } from 'express';
import syncService from './sync.service';
import embeddingRepository from '@database/repositories/EmbeddingRepository';

class SyncController {
  async sync(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req.user as any)?.user_id;
      if (!userId) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const result = await syncService.syncAllProducts(userId);

      res.json({
        success: true,
        synced: result.synced,
        embeddings: result.embeddings,
        errors: result.errors,
      });
    } catch (error) {
      console.error('Sync error:', error);
      res.status(500).json({
        error: 'Failed to sync products',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  async status(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req.user as any)?.user_id;
      if (!userId) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const hasEmbeddings = await embeddingRepository.hasEmbeddings(userId);
      const count = await embeddingRepository.countEmbeddings(userId);

      res.json({
        hasSynced: hasEmbeddings,
        productCount: count,
        embeddingCount: count * 3,
      });
    } catch (error) {
      console.error('Status error:', error);
      res.status(500).json({
        error: 'Failed to get sync status',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  async placeholders(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req.user as any)?.user_id;
      if (!userId) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const placeholders = await syncService.generatePlaceholders(userId);

      res.json({ placeholders });
    } catch (error) {
      console.error('Placeholders error:', error);
      res.status(500).json({
        error: 'Failed to generate placeholders',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }
}

export default new SyncController();
