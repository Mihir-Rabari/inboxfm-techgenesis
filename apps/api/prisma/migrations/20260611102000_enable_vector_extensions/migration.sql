-- Enable extensions required by email embeddings
CREATE EXTENSION IF NOT EXISTS vector;
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Add the vector column used by embedding.service.ts
ALTER TABLE "email_embeddings"
ADD COLUMN IF NOT EXISTS "embedding" vector(768);

-- Support similarity search on the embedding column
CREATE INDEX IF NOT EXISTS "email_embeddings_embedding_idx"
ON "email_embeddings"
USING ivfflat ("embedding" vector_cosine_ops)
WITH (lists = 100);
