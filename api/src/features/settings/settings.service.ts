import settingsRepository from '@database/repositories/SettingsRepository';

const DEFAULT_SYSTEM_PROMPT = `You are a helpful shopping assistant for a Tiendanube store.
Help customers find products through conversation.

Guidelines:
- Ask clarifying questions if request is vague
- Recommend 3-5 specific products when you have enough info
- Be conversational and friendly
- Keep responses under 100 words
- If products don't match well, say so honestly`;

type StoreSettings = {
  store_user_id: number;
  system_prompt?: string;
  primary_color: string;
  secondary_color: string;
  placeholder_text?: string;
  welcome_message?: string;
  search_position: string;
  enabled: boolean;
};

class SettingsService {
  async getSettings(storeUserId: number): Promise<StoreSettings> {
    const settings = await settingsRepository.getSettings(storeUserId);

    return {
      store_user_id: storeUserId,
      system_prompt: settings?.system_prompt || DEFAULT_SYSTEM_PROMPT,
      primary_color: settings?.primary_color || '#667eea',
      secondary_color: settings?.secondary_color || '#764ba2',
      placeholder_text: settings?.placeholder_text || undefined,
      welcome_message: settings?.welcome_message || undefined,
      search_position: settings?.search_position || 'header',
      enabled: settings?.enabled !== undefined ? settings.enabled : true,
    };
  }

  async updateSettings(storeUserId: number, settings: Partial<StoreSettings>): Promise<void> {
    await settingsRepository.updateSettings(storeUserId, settings);
  }

  getDefaultSystemPrompt(): string {
    return DEFAULT_SYSTEM_PROMPT;
  }

  async resetToDefaults(storeUserId: number): Promise<void> {
    await settingsRepository.resetToDefaults(storeUserId);
  }
}

export default new SettingsService();
