/**
 * One-time apply: creates public.user_settings + RLS (same as supabase/user_settings.sql).
 * Requires DATABASE_URL in .env.local — Supabase Dashboard → Project Settings → Database → Connection string → URI.
 */
import { readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const sqlFile = resolve(root, "supabase", "user_settings.sql");

function loadEnvLocal() {
  const out = {};
  try {
    const raw = readFileSync(resolve(root, ".env.local"), "utf8");
    for (const line of raw.split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eq = trimmed.indexOf("=");
      if (eq <= 0) continue;
      const key = trimmed.slice(0, eq).trim();
      let val = trimmed.slice(eq + 1).trim();
      if (
        (val.startsWith('"') && val.endsWith('"')) ||
        (val.startsWith("'") && val.endsWith("'"))
      ) {
        val = val.slice(1, -1);
      }
      out[key] = val;
    }
  } catch {
    // missing .env.local
  }
  return out;
}

const env = { ...process.env, ...loadEnvLocal() };
const dbUrl = env.DATABASE_URL?.trim();
if (!dbUrl) {
  console.error(
    "Missing DATABASE_URL. Add it to .env.local (Supabase → Project Settings → Database → Connection string → URI, often “Direct connection”), then run again.",
  );
  process.exit(1);
}

const r = spawnSync(
  "npx",
  ["--yes", "supabase@latest", "db", "query", "-f", sqlFile, "--db-url", dbUrl, "--agent=no"],
  { stdio: "inherit", cwd: root, env },
);

process.exit(r.status === null ? 1 : r.status);
