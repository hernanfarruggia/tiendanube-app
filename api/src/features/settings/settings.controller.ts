import { Request, Response } from 'express';
import settingsService from './settings.service';

class SettingsController {
  async getSettings(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req.user as any)?.user_id;
      if (!userId) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const settings = await settingsService.getSettings(userId);
      res.json(settings);
    } catch (error) {
      console.error('Get settings error:', error);
      res.status(500).json({
        error: 'Failed to get settings',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  async updateSettings(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req.user as any)?.user_id;
      if (!userId) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      await settingsService.updateSettings(userId, req.body);
      res.json({ success: true });
    } catch (error) {
      console.error('Update settings error:', error);
      res.status(500).json({
        error: 'Failed to update settings',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  async resetSettings(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req.user as any)?.user_id;
      if (!userId) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      await settingsService.resetToDefaults(userId);
      res.json({ success: true });
    } catch (error) {
      console.error('Reset settings error:', error);
      res.status(500).json({
        error: 'Failed to reset settings',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }
}

export default new SettingsController();
