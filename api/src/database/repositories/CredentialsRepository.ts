import { query } from '@config/database.config';
import { TiendanubeAuthInterface } from '@features/auth';
import { HttpErrorException } from '@utils';

class CredentialsRepository {
  async save(credential: TiendanubeAuthInterface): Promise<void> {
    await query(
      `INSERT INTO credentials (user_id, access_token, token_type, scope)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (user_id)
       DO UPDATE SET access_token = $2, token_type = $3, scope = $4, updated_at = NOW()`,
      [credential.user_id, credential.access_token, credential.token_type, credential.scope]
    );
  }

  async findOne(user_id: number): Promise<TiendanubeAuthInterface> {
    const result = await query(
      'SELECT user_id, access_token, token_type, scope FROM credentials WHERE user_id = $1',
      [user_id]
    );

    if (result.rows.length === 0) {
      throw new HttpErrorException(
        'Read our documentation on how to authenticate your app'
      ).setStatusCode(404);
    }

    return result.rows[0];
  }

  async findFirst(): Promise<TiendanubeAuthInterface> {
    const result = await query(
      'SELECT user_id, access_token, token_type, scope FROM credentials LIMIT 1'
    );

    if (result.rows.length === 0) {
      throw new HttpErrorException(
        'Read our documentation on how to authenticate your app'
      ).setStatusCode(404);
    }

    return result.rows[0];
  }
}

export default new CredentialsRepository();
