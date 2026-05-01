-- Initial RAG schema for local `supabase start` and remote migrations.
-- Mirrors supabase/schema.sql (dashboard copy); safe to re-run via IF NOT EXISTS.

create extension if not exists vector;

create table if not exists public.documents (
  id           uuid primary key,
  filename     text not null,
  page_count   int,
  char_count   int,
  chunk_count  int,
  created_at   timestamptz not null default now()
);

create table if not exists public.document_chunks (
  id           bigserial primary key,
  document_id  uuid not null references public.documents(id) on delete cascade,
  chunk_index  int not null,
  content      text not null,
  embedding    vector(768) not null,
  created_at   timestamptz not null default now()
);

create index if not exists document_chunks_embedding_idx
  on public.document_chunks
  using ivfflat (embedding vector_cosine_ops)
  with (lists = 100);

create index if not exists document_chunks_document_id_idx
  on public.document_chunks (document_id);

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

alter table public.documents        enable row level security;
alter table public.document_chunks  enable row level security;

alter table public.documents
  add column if not exists user_id uuid references auth.users (id) on delete cascade;

create index if not exists documents_user_id_idx on public.documents (user_id);

create table if not exists public.user_settings (
  user_id uuid primary key references auth.users (id) on delete cascade,
  encrypted_openrouter_key text,
  preferred_chat_model text not null default 'openai/gpt-oss-20b:free',
  updated_at timestamptz not null default now()
);

alter table public.user_settings enable row level security;

drop policy if exists "user_settings_select_own" on public.user_settings;
drop policy if exists "user_settings_insert_own" on public.user_settings;
drop policy if exists "user_settings_update_own" on public.user_settings;

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
