# Upwork Portfolio Listing — RAG Chatbot

Use the text below verbatim when adding this project to your Upwork portfolio. Replace the `[live]` and `[repo]` placeholders with your real Vercel URL and GitHub repo URL.

---

## Title (60 char max — Upwork's hard limit)

**AI RAG Chatbot — Chat with your PDFs (Next.js + OpenAI)**

## Short description (one-liner shown in search)

Production-grade RAG chatbot. Upload a PDF, ask questions, get streamed answers with source citations.

## Full project description

I built a full-stack AI document chatbot that lets users upload a PDF and chat with its contents. The system extracts text, chunks it intelligently, embeds each chunk with OpenAI's `text-embedding-3-small`, and stores the vectors in Supabase pgvector. When a user asks a question, the app embeds the query, runs a cosine-similarity search, builds a RAG prompt with the top-5 chunks, and streams the GPT-4o-mini response back to the browser token-by-token.

**Live demo:** [your-app.vercel.app]
**Source code:** [github.com/yourname/rag-chatbot]

### Tech I used
- **Next.js 14** (App Router, Server Actions, Route Handlers)
- **TypeScript** strict mode end-to-end
- **OpenAI** — embeddings + GPT-4o-mini with streaming
- **Supabase** Postgres + pgvector for vector search (custom RPC)
- **Tailwind CSS** + shadcn-style components for the UI
- **Vercel AI SDK** for response streaming
- Deployed on **Vercel** with serverless functions

### What it demonstrates
- End-to-end RAG pipeline design (chunking strategy, overlap, embedding batching)
- Production patterns: streaming responses, error boundaries, type-safe APIs, env var hygiene
- Database design: pgvector schema, IVFFlat index, similarity-search RPC
- Modern React: server components, client islands, custom fetch streaming reader
- Clean UX: drag-drop upload, live token streaming, source citations, dark mode

### Outcome
Users get accurate, source-cited answers from their documents in seconds. Cost is roughly $0.0002 to ingest a 20-page PDF and $0.0005 per chat turn — effectively free for personal use, and trivially scalable.

---

## Skills tags to add (Upwork lets you pick up to 15)

```
React, Next.js, TypeScript, Node.js, OpenAI API, GPT-4, RAG,
Vector Database, Supabase, PostgreSQL, pgvector, Tailwind CSS,
Vercel, Full Stack Development, AI Chatbot
```

## Cover letter snippet (paste when applying for AI/RAG gigs)

> I recently built and shipped a production-style RAG chatbot — Next.js 14, OpenAI embeddings, Supabase pgvector, streaming GPT-4o-mini responses with source citations. Live demo: [your-url]. Source: [your-repo]. Happy to walk you through the architecture or adapt it to your use case (private docs, custom auth, multi-tenant, etc.).

## README screenshot/video tips for the GitHub repo

A polished README dramatically increases click-through. Add these in order at the top of `README.md`:

1. **Hero screenshot** — a clean PNG of the running app with a real PDF loaded and a chat bubble visible. 1600×900 ish.
2. **30-second Loom** — record yourself uploading a PDF and asking 2 questions. Embed as a thumbnail link: `[![Demo](thumbnail.png)](https://loom.com/share/xxx)`
3. **Live URL badge** — `[![Live Demo](https://img.shields.io/badge/demo-live-success)](https://your-app.vercel.app)`
4. **Tech badges** — Next.js, TypeScript, OpenAI, Supabase logos via shields.io
5. **One-paragraph value prop** before any setup instructions

## Pricing reference (April 2026 Upwork rates for this stack)

| Tier | Hourly range |
|------|--------------|
| Junior (Rising Talent) | $25–40 |
| Mid (1+ year, this kind of portfolio) | $45–75 |
| Senior (2+ years, niche RAG/AI) | $80–150+ |

A working RAG demo plus 2–3 complementary projects (e.g. the four others on your list) is typically enough to clear $50/hr at the Rising Talent stage.
