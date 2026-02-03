import { query } from '@config/database.config';

type ChatSession = {
  id: number;
  store_user_id: number;
  session_id: string;
  created_at: Date;
};

type ChatMessage = {
  id: number;
  session_id: string;
  role: string;
  content: string;
  metadata?: Record<string, any>;
  created_at: Date;
};

class ChatRepository {
  async createSession(storeUserId: number): Promise<string> {
    const result = await query(
      `INSERT INTO chat_sessions (store_user_id)
       VALUES ($1)
       RETURNING session_id`,
      [storeUserId]
    );
    return result.rows[0].session_id;
  }

  async getSession(sessionId: string): Promise<ChatSession | null> {
    const result = await query(
      'SELECT id, store_user_id, session_id, created_at FROM chat_sessions WHERE session_id = $1',
      [sessionId]
    );
    return result.rows[0] || null;
  }

  async addMessage(
    sessionId: string,
    role: string,
    content: string,
    metadata?: Record<string, any>
  ): Promise<void> {
    await query(
      `INSERT INTO chat_messages (session_id, role, content, metadata)
       VALUES ($1, $2, $3, $4)`,
      [sessionId, role, content, metadata ? JSON.stringify(metadata) : null]
    );
  }

  async getMessages(sessionId: string, limit: number = 10): Promise<ChatMessage[]> {
    const result = await query(
      `SELECT id, session_id, role, content, metadata, created_at
       FROM chat_messages
       WHERE session_id = $1
       ORDER BY created_at DESC
       LIMIT $2`,
      [sessionId, limit]
    );
    return result.rows.reverse();
  }
}

export default new ChatRepository();
