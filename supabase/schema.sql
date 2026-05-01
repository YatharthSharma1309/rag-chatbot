-- ────────────────────────────────────────────────────────────
-- RAG Chatbot — Supabase schema
-- Run this in the Supabase SQL Editor (Dashboard → SQL Editor → New query)
-- ────────────────────────────────────────────────────────────

-- 1. Enable the pgvector extension
create extension if not exists vector;

-- 2. Documents table — one row per uploaded PDF
create table if not exists public.documents (
  id           uuid primary key,
  filename     text not null,
  page_count   int,
  char_count   int,
  chunk_count  int,
  created_at   timestamptz not null default now()
);

-- 3. Chunks table — one row per text chunk + embedding
-- text-embedding-3-small produces 1536-dimension vectors
create table if not exists public.document_chunks (
  id           bigserial primary key,
  document_id  uuid not null references public.documents(id) on delete cascade,
  chunk_index  int not null,
  content      text not null,
  embedding    vector(1536) not null,
  created_at   timestamptz not null default now()
);

-- 4. Vector index — IVFFlat is the right starting point under ~1M rows
-- (Use HNSW if you scale up: create index ... using hnsw (embedding vector_cosine_ops);)
create index if not exists document_chunks_embedding_idx
  on public.document_chunks
  using ivfflat (embedding vector_cosine_ops)
  with (lists = 100);

create index if not exists document_chunks_document_id_idx
  on public.document_chunks (document_id);

-- 5. RPC for similarity search
-- Called from /api/chat with the user's query embedding.
create or replace function public.match_document_chunks(
  query_embedding vector(1536),
  match_count int default 5,
  filter_document_id uuid default null
)
returns table (
  id bigint,
  document_id uuid,
  chunk_index int,
  content text,
  similarity float
)
language plpgsql
as $$
begin
  return query
  select
    dc.id,
    dc.document_id,
    dc.chunk_index,
    dc.content,
    1 - (dc.embedding <=> query_embedding) as similarity
  from public.document_chunks dc
  where filter_document_id is null or dc.document_id = filter_document_id
  order by dc.embedding <=> query_embedding
  limit match_count;
end;
$$;

-- 6. (Optional) Row-level security
-- The app uses the service-role key, which bypasses RLS, so this is here
-- as a starting point if you later add user auth and want per-user docs.
-- alter table public.documents       enable row level security;
-- alter table public.document_chunks enable row level security;
