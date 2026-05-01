-- Per-user encrypted OpenRouter key + preferred chat model (API uses service role).
-- Safe to re-run alongside create policy if not exists patterns via outer migrations.

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
