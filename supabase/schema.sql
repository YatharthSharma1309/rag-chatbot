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
-- jina-embeddings-v2-base-en produces 768-dimension vectors (free via Jina AI)
create table if not exists public.document_chunks (
  id           bigserial primary key,
  document_id  uuid not null references public.documents(id) on delete cascade,
  chunk_index  int not null,
  content      text not null,
  embedding    vector(768) not null,
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
-- security definer + search_path = '' prevents search-path injection.
create or replace function public.match_document_chunks(
  query_embedding vector(768),
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
security definer
set search_path = ''
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

-- 6. Row-level security
-- Service-role key (used server-side) bypasses RLS.
-- RLS blocks direct anon/authenticated access to the tables.
alter table public.documents        enable row level security;
alter table public.document_chunks  enable row level security;

-- 7. Multi-tenant documents (nullable for legacy rows before auth; new uploads always set user_id)
alter table public.documents
  add column if not exists user_id uuid references auth.users (id) on delete cascade;

create index if not exists documents_user_id_idx on public.documents (user_id);

-- 8. Per-user encrypted OpenRouter key + preferred chat model (read/written via Next.js API + service role)
create table if not exists public.user_settings (
  user_id uuid primary key references auth.users (id) on delete cascade,
  encrypted_openrouter_key text,
  preferred_chat_model text not null default 'openai/gpt-oss-20b:free',
  updated_at timestamptz not null default now()
);

alter table public.user_settings enable row level security;

create policy "user_settings_select_own"
  on public.user_settings for select to authenticated
  using (auth.uid() = user_id);

create policy "user_settings_insert_own"
  on public.user_settings for insert to authenticated
  with check (auth.uid() = user_id);

create policy "user_settings_update_own"
  on public.user_settings for update to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
