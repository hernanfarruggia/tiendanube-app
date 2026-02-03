import OpenAI from 'openai';

if (!process.env.OPENAI_API_KEY) {
  throw new Error('OPENAI_API_KEY environment variable is required');
}

export const openaiClient = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export const openaiConfig = {
  model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
  embeddingModel: process.env.OPENAI_EMBEDDING_MODEL || 'text-embedding-3-small',
  maxTokens: parseInt(process.env.OPENAI_MAX_TOKENS || '500', 10),
  temperature: parseFloat(process.env.OPENAI_TEMPERATURE || '0.7'),
  embeddingBatchSize: parseInt(process.env.EMBEDDING_BATCH_SIZE || '50', 10),
  vectorSearchLimit: parseInt(process.env.VECTOR_SEARCH_LIMIT || '5', 10),
};
