export interface ISyncResponse {
  synced: number;
  embeddings: number;
  errors?: number;
  message?: string;
}

export interface ISyncStatus {
  hasSynced: boolean;
  productCount: number;
  embeddingCount: number;
}
