/**
 * Loads .env.local and verifies external API credentials without printing secrets.
 * Usage: node --env-file=.env.local scripts/verify-api-keys.mjs
 */

function stripTrailingSlash(u) {
  return u.replace(/\/+$/, "");
}

async function checkSupabaseRest(url, key, label) {
  const base = stripTrailingSlash(url);
  const res = await fetch(`${base}/rest/v1/__key_probe_nonexistent_table__`, {
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
    },
  });
  if (res.status === 401 || res.status === 403) {
    return { ok: false, detail: `${label}: rejected (${res.status})` };
  }
  // Valid JWT typically yields 404 / PGRST205 unknown relation
  if (res.status === 404) {
    return { ok: true, detail: `${label}: accepted by PostgREST` };
  }
  const text = await res.text().catch(() => "");
  return {
    ok: false,
    detail: `${label}: unexpected HTTP ${res.status}${text ? ` (${text.slice(0, 120)})` : ""}`,
  };
}

async function checkSupabaseAuthHealth(url, anonKey) {
  const base = stripTrailingSlash(url);
  const headers =
    anonKey ?
      { apikey: anonKey, Authorization: `Bearer ${anonKey}` }
    : {};
  const res = await fetch(`${base}/auth/v1/health`, { headers });
  if (!res.ok) {
    return { ok: false, detail: `Supabase Auth health: HTTP ${res.status}` };
  }
  return { ok: true, detail: "Supabase Auth health: reachable" };
}

async function checkOpenAICompatible(baseURL, apiKey, label) {
  const url = `${stripTrailingSlash(baseURL)}/models`;
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${apiKey}` },
  });
  if (res.status === 401 || res.status === 403) {
    return { ok: false, detail: `${label}: rejected (${res.status})` };
  }
  if (!res.ok) {
    return { ok: false, detail: `${label}: HTTP ${res.status}` };
  }
  return { ok: true, detail: `${label}: list models OK` };
}

function has(s) {
  return Boolean(s?.trim());
}

const results = [];

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
const supabaseAnon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();
const supabaseService = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();

if (!has(supabaseUrl)) {
  results.push({ ok: false, detail: "NEXT_PUBLIC_SUPABASE_URL: missing" });
} else {
  if (!has(supabaseAnon)) {
    results.push({ ok: false, detail: "NEXT_PUBLIC_SUPABASE_ANON_KEY: missing" });
    results.push(await checkSupabaseAuthHealth(supabaseUrl));
  } else {
    results.push(await checkSupabaseAuthHealth(supabaseUrl, supabaseAnon));
    results.push(await checkSupabaseRest(supabaseUrl, supabaseAnon, "Supabase anon key"));
  }
  if (!has(supabaseService)) {
    results.push({ ok: false, detail: "SUPABASE_SERVICE_ROLE_KEY: missing" });
  } else {
    results.push(await checkSupabaseRest(supabaseUrl, supabaseService, "Supabase service_role key"));
  }
}

const openrouterKey = process.env.OPENROUTER_API_KEY?.trim();
const openaiKey = process.env.OPENAI_API_KEY?.trim();
const jinaKey = process.env.JINA_API_KEY?.trim();

if (has(openrouterKey)) {
  results.push(
    await checkOpenAICompatible("https://openrouter.ai/api/v1", openrouterKey, "OpenRouter"),
  );
} else if (has(openaiKey)) {
  const base = process.env.OPENAI_BASE_URL?.trim() || "https://api.openai.com/v1";
  results.push(await checkOpenAICompatible(base, openaiKey, "OpenAI (chat/embeddings path)"));
} else {
  results.push({
    ok: false,
    detail: "OPENROUTER_API_KEY / OPENAI_API_KEY: none set (chat + embeddings need one or Jina+OpenRouter combo per app)",
  });
}

if (has(jinaKey)) {
  results.push(await checkOpenAICompatible("https://api.jina.ai/v1", jinaKey, "Jina embeddings"));
} else if (!has(openaiKey)) {
  results.push({
    ok: false,
    detail: "JINA_API_KEY: missing (needed for embeddings unless OPENAI_API_KEY is set)",
  });
}

const enc = process.env.USER_SETTINGS_ENCRYPTION_KEY?.trim();
if (!enc) {
  results.push({
    ok: false,
    detail: "USER_SETTINGS_ENCRYPTION_KEY: missing (required for encrypted user settings)",
  });
} else if (enc.length < 24) {
  results.push({
    ok: false,
    detail: `USER_SETTINGS_ENCRYPTION_KEY: too short (${enc.length} chars, use >= 24)`,
  });
} else {
  results.push({ ok: true, detail: "USER_SETTINGS_ENCRYPTION_KEY: present and long enough" });
}

console.log("\nAPI key / env verification\n");
let allOk = true;
for (const r of results) {
  const mark = r.ok ? "✓" : "✗";
  console.log(`${mark} ${r.detail}`);
  if (!r.ok) allOk = false;
}
console.log("");
process.exit(allOk ? 0 : 1);
