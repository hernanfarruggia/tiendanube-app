-- Enable pgvector
CREATE EXTENSION IF NOT EXISTS vector;

-- Credentials (replaces db.json)
CREATE TABLE credentials (
  id SERIAL PRIMARY KEY,
  user_id INTEGER UNIQUE NOT NULL,
  access_token TEXT NOT NULL,
  token_type VARCHAR(50) DEFAULT 'bearer',
  scope TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Product cache (local copy from Tiendanube)
CREATE TABLE products (
  id SERIAL PRIMARY KEY,
  store_user_id INTEGER NOT NULL,
  product_id VARCHAR(100) NOT NULL,
  name_en TEXT,
  name_pt TEXT,
  name_es TEXT,
  description_en TEXT,
  description_pt TEXT,
  description_es TEXT,
  price DECIMAL(10,2),
  images JSONB,
  raw_data JSONB,
  last_synced_at TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(store_user_id, product_id)
);

-- Vector embeddings for semantic search
CREATE TABLE product_embeddings (
  id SERIAL PRIMARY KEY,
  product_id INTEGER REFERENCES products(id) ON DELETE CASCADE,
  language VARCHAR(5) NOT NULL,
  embedding_text TEXT NOT NULL,
  embedding VECTOR(1536),
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(product_id, language)
);

-- Chat sessions and messages
CREATE TABLE chat_sessions (
  id SERIAL PRIMARY KEY,
  store_user_id INTEGER NOT NULL,
  session_id UUID UNIQUE DEFAULT gen_random_uuid(),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE chat_messages (
  id SERIAL PRIMARY KEY,
  session_id UUID REFERENCES chat_sessions(session_id) ON DELETE CASCADE,
  role VARCHAR(20) NOT NULL,
  content TEXT NOT NULL,
  metadata JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_products_store_user ON products(store_user_id);
CREATE INDEX idx_chat_sessions_store_user ON chat_sessions(store_user_id);
CREATE INDEX idx_chat_messages_session ON chat_messages(session_id);
CREATE INDEX idx_product_embeddings_vector ON product_embeddings
  USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);
