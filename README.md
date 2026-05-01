# RAG Chatbot — NotebookLM-style PDF chat

**Sources + studio workflow:** configure AI → upload a PDF → brief & study export on the left; streaming **RAG chat** with **[#n] citations** on the right. **Next.js 14**, **Supabase** (Auth + **pgvector**), embeddings via **Jina** or **OpenAI**, chat via **OpenRouter** with **per-user encrypted keys**.

> Portfolio demo: cookie-based Supabase sessions, middleware refresh, signed-in APIs, document ownership checks, and streaming UX.

## Quick start

1. `npm install` → copy `.env.example` → `.env.local` and fill Supabase + `USER_SETTINGS_ENCRYPTION_KEY` + embedding key (`JINA_API_KEY` and/or `OPENAI_API_KEY`).
2. Supabase **SQL Editor**: run `supabase/schema.sql`.
3. Supabase **Auth**: enable Email (and optionally Google). Add redirect URL `{your-origin}/auth/callback` — **same host** as the browser (`localhost` vs `127.0.0.1`).
4. `npm run dev` → sign in → **AI settings** (OpenRouter key + model) → upload a PDF.

---

## Contents

- [Feature highlights](#feature-highlights)
- [Architecture](#architecture)
- [Tech stack](#tech-stack)
- [Repository layout](#repository-layout)
- [Setup (detailed)](#setup-detailed)
- [Scripts](#scripts)
- [Deploy](#deploy)
- [Costs](#costs)
- [Behavior & troubleshooting](#behavior--troubleshooting)
- [License](#license)

---

## Feature highlights

| Area | What you get |
|------|----------------|
| **Auth** | Email/password, Google OAuth, password reset; PKCE-safe `/auth/callback`; cookies shared by browser, middleware, and APIs |
| **Security** | PDF/chat/brief/study/chunk APIs require a session; `documentId` must belong to `user.id`; OpenRouter secret encrypted server-side |
| **RAG** | Drag-drop PDF → chunk → embed → `match_document_chunks` (cosine) → streamed answers with citations |
| **NotebookLM-style** | Auto brief (`/api/summary`), study pack + **CSV** flashcards (`front`,`back`), citation inspector (`/api/chunks-preview`) |
| **Quality** | TypeScript, ESLint, Playwright E2E (dev server on **:4173** for tests — see `playwright.config.ts`) |

---

## Architecture

```
 Browser                          Next.js                         Supabase
 ───────                          ───────                         ────────
 useAuth + cookies                middleware → getUser()          Auth (JWT)
 fetch /api/* (cookies)    →      routes → getUser() + ownership   Postgres + pgvector
                                  └── /api/upload | chat | summary | study-export
                                      chunks-preview | user/settings
```

---

## Tech stack

| Layer | Choice |
|-------|--------|
| App | Next.js 14 App Router, TypeScript, Tailwind, shadcn-style UI |
| Auth | Supabase Auth + `@supabase/ssr` |
| Vectors | Supabase pgvector + RPC similarity search |
| Embeddings | Jina (768-d) and/or OpenAI — server config |
| Chat | OpenRouter + Vercel AI SDK streaming |
| Tests | Playwright |

---

## Repository layout

```
app/
  api/           upload, chat, summary, study-export, chunks-preview, user/settings
  auth/          callback (session cookies), update-password
  page.tsx       signed-out marketing + AuthForms vs signed-in workspace
components/      chat, upload, auth, study export, brief, …
hooks/           use-auth.ts
lib/             RAG, embeddings, Supabase clients, auth helpers, crypto settings
middleware.ts    refresh auth cookies on navigations
supabase/schema.sql
e2e/             Playwright specs
```

---

## Setup (detailed)

**Prerequisites:** Node 18.17+, npm, Supabase project, embedding API key(s), OpenRouter account (users paste keys in-app).

### Supabase

1. New project → **SQL Editor** → paste/run `supabase/schema.sql`.
2. **Authentication → URL configuration**
   - **Site URL:** the origin users open in the browser (e.g. `http://localhost:3000` for dev).
   - **Redirect URLs:** add your app callback(s), matching hostname exactly (`localhost` vs `127.0.0.1` matters):
     - `http://localhost:3000/auth/callback`
     - production: `https://your-domain.com/auth/callback`
   - Optional wildcard if Supabase supports your pattern (see [Redirect URLs](https://supabase.com/docs/guides/auth/redirect-urls)).
3. **Authentication → Providers → Email:** enable for password sign-up/sign-in.

#### Connect Google (Google Cloud Console ↔ Supabase)

Credentials are stored **only in the Supabase dashboard** for this app — nothing Google-related goes in `.env.local`.

**A. Google Cloud Console** ([console.cloud.google.com](https://console.cloud.google.com))

1. Select or create a project.
2. **APIs & Services → OAuth consent screen:** choose **External** (or **Internal** for Workspace-only), fill app name/support email, add scopes **`openid`**, **`email`**, **`profile`** (usually added by default), add test users if the app is in **Testing**.
3. **APIs & Services → Credentials → Create credentials → OAuth client ID → Web application.**
4. **Authorized JavaScript origins:** `http://localhost:3000` and your production origin(s).
5. **Authorized redirect URIs:** add **exactly** (replace with your Supabase project host from **Project Settings → API → Project URL**):

   `https://<your-project-ref>.supabase.co/auth/v1/callback`

   This is Supabase’s OAuth callback — **not** your Next.js `/auth/callback`. Supabase redirects to your app after exchanging with Google.

6. Copy the **Client ID** and **Client secret**.

**B. Supabase Dashboard**

1. **Authentication → Providers → Google:** enable, paste **Client ID** and **Client secret**, save.
2. Confirm **URL configuration** (step 2 above) still lists `{your-origin}/auth/callback`.

Then use **Continue with Google** on the home page; you should be redirected to Google and back to `/auth/callback`.

### Environment

```bash
cp .env.example .env.local
```

Required pieces:

| Variable | Role |
|----------|------|
| `NEXT_PUBLIC_SUPABASE_URL` | Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Browser + server anon client |
| `SUPABASE_SERVICE_ROLE_KEY` | Server-only DB (never expose) |
| `USER_SETTINGS_ENCRYPTION_KEY` | Encrypt stored OpenRouter keys |
| `JINA_API_KEY` / `OPENAI_API_KEY` | Embeddings (see `.env.example` for options) |

Full list and comments: **`.env.example`**.

### Run & verify

```bash
npm run dev          # http://localhost:3000
npm run lint && npm run type-check && npm run build
npm run test:e2e     # uses http://127.0.0.1:4173 by default
```

---

## Scripts

| Command | Purpose |
|---------|---------|
| `npm run dev` | Next.js dev server |
| `npm run build` / `npm run start` | Production build / serve |
| `npm run lint` | ESLint |
| `npm run type-check` | `tsc --noEmit` |
| `npm run test:e2e` | Playwright |

---

## Deploy

Mirror `.env.local` in your host (e.g. Vercel): all `NEXT_PUBLIC_*`, service role, encryption key, embedding keys. Register production **`/auth/callback`** in Supabase.

Large PDFs + Hobby timeouts: uploads/embeddings may need a higher plan or async ingestion — see route `maxDuration` limits.

---

## Costs

Roughly negligible for demos; depends on **Jina vs OpenAI** embeddings and **OpenRouter** model — many cheap/free chat models exist ([openrouter.ai](https://openrouter.ai)).

---

## Behavior & troubleshooting

- Chat is scoped by **`documentId`** and **your** rows in `documents`.
- Missing retrieval: prompt instructs the model to admit no context.
- **`pdf-parse` test PDF error**: dynamic import in upload route avoids it.
- **`vector` extension**: applied via `schema.sql`.
- Streaming routes use **`runtime = "nodejs"`**.
- Auth drops after OAuth/email link: fix redirect URLs and hostname consistency (`localhost` vs `127.0.0.1`).

---

## License

MIT — fork, ship, showcase.
