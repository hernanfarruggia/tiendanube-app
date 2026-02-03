-- Store settings for AI search customization
CREATE TABLE store_settings (
  id SERIAL PRIMARY KEY,
  store_user_id INTEGER UNIQUE NOT NULL,
  system_prompt TEXT,
  primary_color VARCHAR(7) DEFAULT '#667eea',
  secondary_color VARCHAR(7) DEFAULT '#764ba2',
  placeholder_text TEXT,
  welcome_message TEXT,
  search_position VARCHAR(20) DEFAULT 'header',
  enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_store_settings_user ON store_settings(store_user_id);
