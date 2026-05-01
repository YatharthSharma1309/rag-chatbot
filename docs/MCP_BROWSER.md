# Browser control MCP (Cursor)

Cursor can drive a real browser via **MCP servers**. Common options:

## Playwright MCP (recommended)

1. Open **Cursor Settings → MCP** (or edit your MCP config).
2. Add a server that exposes Playwright browser tools (the official Cursor docs list **Playwright** as a supported integration when enabled for your workspace).
3. After it connects, you can ask the agent to navigate, snapshot pages, click, fill forms, and capture network traffic — useful for validating this app’s login → upload → chat flow.

Typical workflow:

- Ensure `npm run dev` is running (or your deployed URL).
- Ask the agent to open the app, confirm the **Sign in / Register** gate, and step through smoke checks.

## Puppeteer / Chrome DevTools MCP

Some teams use a **Puppeteer** or **Chrome DevTools Protocol** MCP instead. The pattern is the same: configure the MCP server in Cursor, then invoke browser actions through the agent.

## This repository

- **Automated UI checks**: `npm run test:e2e` runs Playwright tests (starts dev server unless `PLAYWRIGHT_SKIP_WEBSERVER=1`).
- **Manual MCP**: Managed in Cursor — not checked into git (often `.mcp.json` is local-only).

If `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` are unset, the client throws on load — set them in `.env.local` before browser testing.
