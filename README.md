# RAG Chatbot — Chat with your PDFs

An AI chatbot that lets you upload PDF documents and ask questions about their content. Built with Next.js 14, OpenAI (embeddings + GPT-4o-mini), and Supabase pgvector for vector search.

> **Portfolio project.** Demonstrates a production-ready RAG (Retrieval-Augmented Generation) pipeline with streaming responses, source citations, and a clean modern UI.

## Prerequisites

- **Node.js** 18.17 or newer (recommended for Next.js 14)
- **npm** (or compatible package manager)
- Accounts on **OpenAI** (API key + billing) and **Supabase** (free tier is enough for demos)

## Features

- PDF upload with drag-and-drop (react-dropzone)
- Server-side PDF text extraction (pdf-parse)
- Chunking with sliding-window overlap and sentence-boundary preference
- OpenAI `text-embedding-3-small` embeddings, batched
- Vector storage and similarity search via Supabase pgvector (cosine distance)
- Streaming chat responses (Vercel AI SDK)
- Inline source citations like `[#1] [#2]`
- Tailwind + shadcn/ui dark mode
- Deploy in one click to Vercel

## Architecture

```
┌─────────────┐    upload      ┌──────────────┐
│   Browser   │ ─────────────► │ /api/upload  │
│ (drag PDF)  │                │  pdf-parse   │
└─────────────┘                │  chunk()     │
                               │  embed()     │
                               └──────┬───────┘
                                      │
                                      ▼
                               ┌──────────────┐
                               │   Supabase   │
                               │   pgvector   │
                               └──────┬───────┘
                                      │ rpc(match_document_chunks)
                                      ▼
┌─────────────┐    streamed    ┌──────────────┐
│   Browser   │ ◄───────────── │  /api/chat   │
│ (chat UI)   │   tokens       │  RAG prompt  │
└─────────────┘                │  GPT-4o-mini │
                               └──────────────┘
```

## Tech stack

| Layer    | Tech |
|----------|------|
| Framework | Next.js 14 (App Router, RSC) |
| Language | TypeScript |
| Styling | Tailwind CSS, shadcn/ui patterns |
| LLM | OpenAI GPT-4o-mini (chat) + text-embedding-3-small |
| Vector DB | Supabase Postgres + pgvector |
| Streaming | Vercel AI SDK (`ai` package) |
| Hosting | Vercel |

## Project structure

```
rag-chatbot/
├── app/
│   ├── api/
│   │   ├── upload/route.ts   # PDF ingest pipeline
│   │   └── chat/route.ts     # Streaming RAG chat
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx
├── components/
│   ├── ui/                   # shadcn-style primitives
│   ├── chat.tsx              # Chat panel (streaming)
│   ├── upload.tsx            # PDF dropzone
│   └── message.tsx           # Markdown message bubble
├── lib/
│   ├── embeddings.ts         # chunkText + embedChunks
│   ├── openai.ts             # OpenAI client
│   ├── supabase.ts           # Supabase admin client
│   └── utils.ts              # cn()
├── supabase/
│   └── schema.sql            # pgvector tables + RPC
├── .env.example
└── package.json
```

## Setup

### 1. Install

```bash
git clone <your-repo-url> rag-chatbot
cd rag-chatbot
npm install
```

### 2. Create the Supabase project

1. Go to [supabase.com](https://supabase.com) → New Project
2. Wait for it to provision (about a minute)
3. Open **SQL Editor** → **New query**
4. Paste the contents of `supabase/schema.sql` → **Run**
5. Open **Settings → API** and copy:
   - Project URL
   - `anon` public key
   - `service_role` key (server-side only — never expose to the browser)

### 3. Get your OpenAI key

1. Go to [platform.openai.com/api-keys](https://platform.openai.com/api-keys)
2. Create a new key
3. Add billing (about $1 of credit goes a long way for testing)

### 4. Configure env vars

```bash
cp .env.example .env.local
```

**Required for the app as shipped** (server routes use these only):

| Variable | Purpose |
|----------|---------|
| `OPENAI_API_KEY` | Embeddings + chat completions |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Server-side DB access (**never** expose to the browser) |

**Optional**

| Variable | Purpose |
|----------|---------|
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Reserved for a future browser client / RLS + auth; not read by current API routes |
| `OPENAI_CHAT_MODEL` | Defaults to `gpt-4o-mini` |
| `OPENAI_EMBEDDING_MODEL` | Defaults to `text-embedding-3-small` (must stay 1536-dim to match `schema.sql`) |

Copy values from `.env.example` and replace placeholders with real keys.

### 5. Run locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) and drop a PDF onto the upload area.

## Deploy to Vercel

```bash
npm i -g vercel
vercel
```

When prompted, set the same environment variables as in `.env.local`. After the first deploy:

```bash
vercel --prod
```

You'll get a live URL like `https://rag-chatbot-yourname.vercel.app` — paste it into your portfolio.

> **Note on `maxDuration`**: PDF embedding can be slow on the Vercel Hobby plan (10s timeout). The upload route requests 60s; on Hobby this is silently capped to 10s. For multi-megabyte PDFs, either upgrade or process embeddings async. The chat route stays well under 30s.

## Cost (per typical session)

| Action | Approx. cost |
|--------|-------------|
| Embedding a 20-page PDF | $0.0002 |
| One chat turn (with 5-chunk RAG context) | $0.0005 |
| 100 chat turns | ~$0.05 |

Effectively free for portfolio demos.

## What I built / learned

- Designed a chunking strategy that respects sentence boundaries while maintaining overlap for cross-chunk context
- Wired the Vercel AI SDK's streaming response into a custom React fetch reader (no `useChat` hook — full control over the message format)
- Wrote a Postgres RPC (`match_document_chunks`) to keep similarity-search logic close to the data
- Ensured `pdf-parse` is dynamically imported on the server only (avoids the well-known top-level test-file bug at build time)
- Streaming UX: the assistant message bubble updates token-by-token as bytes arrive

## Behavior notes

- **Scoped retrieval**: After upload, chat requests pass `documentId` so vector search only considers chunks from that PDF. Without a document loaded, the chat input stays disabled.
- **No matches**: If similarity search returns nothing, the system prompt still allows the model to answer from general knowledge but instructs it to tell the user no document context was found.
- **Single-document UX**: The UI is oriented around one active PDF per session; uploading again resets the chat for the new file.

## Troubleshooting

**`pdf-parse` build error referencing `./test/data/05-versions-space.pdf`** — solved by importing dynamically inside the route handler. Already done in `/api/upload`.

**`extension "vector" does not exist`** — you need to run `create extension vector` in your Supabase SQL editor (already in `schema.sql`).

**Streaming hangs in production** — confirm `runtime = "nodejs"` in the route file. Edge runtime does not support all streaming patterns out of the box for this app.

**Cosine vs Euclidean** — the index uses `vector_cosine_ops`, and the RPC uses the `<=>` operator (cosine distance). Stay consistent; mixing distance functions makes the index useless.

## License

MIT — yours to fork, ship, and put on your resume.
