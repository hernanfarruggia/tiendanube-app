import { query } from '@config/database.config';

type StoreSettings = {
  store_user_id: number;
  system_prompt?: string;
  primary_color?: string;
  secondary_color?: string;
  placeholder_text?: string;
  welcome_message?: string;
  search_position?: string;
  enabled?: boolean;
};

class SettingsRepository {
  async getSettings(storeUserId: number): Promise<StoreSettings | null> {
    const result = await query(
      'SELECT * FROM store_settings WHERE store_user_id = $1',
      [storeUserId]
    );
    return result.rows[0] || null;
  }

  async updateSettings(storeUserId: number, settings: Partial<StoreSettings>): Promise<void> {
    const {
      system_prompt,
      primary_color,
      secondary_color,
      placeholder_text,
      welcome_message,
      search_position,
      enabled,
    } = settings;

    await query(
      `INSERT INTO store_settings (
        store_user_id, system_prompt, primary_color, secondary_color,
        placeholder_text, welcome_message, search_position, enabled
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      ON CONFLICT (store_user_id)
      DO UPDATE SET
        system_prompt = COALESCE($2, store_settings.system_prompt),
        primary_color = COALESCE($3, store_settings.primary_color),
        secondary_color = COALESCE($4, store_settings.secondary_color),
        placeholder_text = COALESCE($5, store_settings.placeholder_text),
        welcome_message = COALESCE($6, store_settings.welcome_message),
        search_position = COALESCE($7, store_settings.search_position),
        enabled = COALESCE($8, store_settings.enabled),
        updated_at = NOW()`,
      [
        storeUserId,
        system_prompt,
        primary_color,
        secondary_color,
        placeholder_text,
        welcome_message,
        search_position,
        enabled,
      ]
    );
  }

  async resetToDefaults(storeUserId: number): Promise<void> {
    await query('DELETE FROM store_settings WHERE store_user_id = $1', [storeUserId]);
  }
}

export default new SettingsRepository();
