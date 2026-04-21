import { Request, Response } from 'express';
import chatRepository from '@database/repositories/ChatRepository';
import chatService from './chat.service';

class ChatController {
  async createSession(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req.user as any)?.user_id;
      if (!userId) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const sessionId = await chatRepository.createSession(userId);

      res.json({ session_id: sessionId });
    } catch (error) {
      console.error('Create session error:', error);
      res.status(500).json({
        error: 'Failed to create session',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  async sendMessage(req: Request, res: Response): Promise<void> {
    try {
      const { message, session_id, store_id, language } = req.body;

      if (!message || !session_id || !store_id) {
        res.status(400).json({ error: 'Missing required fields' });
        return;
      }

      let session = await chatRepository.getSession(session_id);
      if (!session) {
        await chatRepository.createSessionWithId(session_id, store_id);
        // session = await chatRepository.getSession(session_id);
      }

      const response = await chatService.chat(message, session_id, store_id, language || 'es_AR');

      res.json(response);
    } catch (error) {
      console.error('Send message error:', error);
      res.status(500).json({
        error: 'Failed to process message',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  async getHistory(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req.user as any)?.user_id;
      if (!userId) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const { sessionId } = req.params;

      const session = await chatRepository.getSession(sessionId);
      if (!session || session.store_user_id !== userId) {
        res.status(404).json({ error: 'Session not found' });
        return;
      }

      const messages = await chatRepository.getMessages(sessionId, 50);

      res.json({ messages });
    } catch (error) {
      console.error('Get history error:', error);
      res.status(500).json({
        error: 'Failed to get history',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }
}

export default new ChatController();
