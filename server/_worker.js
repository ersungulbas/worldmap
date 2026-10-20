// worldmap.tech server: static files come from Workers static assets (site/); /api/code keeps anonymous
// restore codes in D1. Bindings are set in wrangler.jsonc: assets as `ASSETS`, D1 database as `DB`.
//
//   POST   /api/code          {s:"TRDEFR"}  -> 201 {code, u}
//   GET    /api/code/:code                  -> {s, u}
//   PUT    /api/code/:code    {s:"TRDE"}    -> {u}
//   DELETE /api/code/:code                  -> 204
//
// s is the visitor's countries as concatenated ISO codes; u is the last-change time (ms).
// Nothing else is stored: no IP, no name, no email.

const ALPHABET = "0123456789ABCDEFGHJKMNPQRSTVWXYZ";      // Crockford base32: no I, L, O, U
const CODE = /^[0-9A-HJKMNP-TV-Z]{8}$/;
const SEL = /^(?:[A-Z]{2}){0,300}$/;
const KEEP_MS = 730 * 86400000;                            // drop codes unused for 24 months
const DAY = 86400000;

// Best-effort abuse limit (code guessing, filling the database). Counters live only in this isolate's
// memory for a few seconds; IP addresses are never written anywhere.
const WINDOW_MS = 10000, MAX_CALLS = 20, MAX_NEW = 5;
const hits = new Map();
function tooMany(req){
  const ip = req.headers.get("cf-connecting-ip");
  if (!ip) return false;
  const now = Date.now();
  let h = hits.get(ip);
  if (!h || now - h.t > WINDOW_MS){
    if (hits.size > 10000) for (const [k, v] of hits) if (now - v.t > WINDOW_MS) hits.delete(k);
    h = {t: now, n: 0, w: 0}; hits.set(ip, h);
  }
  h.n++; if (req.method === "POST") h.w++;
  return h.n > MAX_CALLS || h.w > MAX_NEW;
}

let tableReady = false;
async function db(env){
  if (!tableReady){
    await env.DB.prepare("CREATE TABLE IF NOT EXISTS maps (code TEXT PRIMARY KEY, s TEXT NOT NULL, c INTEGER NOT NULL, u INTEGER NOT NULL, a INTEGER NOT NULL)").run();
    tableReady = true;
  }
  return env.DB;
}

const json = (data, status = 200) => new Response(JSON.stringify(data), {
  status, headers: {"content-type": "application/json; charset=utf-8", "cache-control": "no-store", "x-robots-tag": "noindex"}
});

async function readSel(req){
  const t = await req.text();
  if (t.length > 2048) return null;
  try { const b = JSON.parse(t); return typeof b.s === "string" && SEL.test(b.s) ? b.s : null; } catch { return null; }
}

function newCode(){
  const b = crypto.getRandomValues(new Uint8Array(8));
  let c = ""; for (const x of b) c += ALPHABET[x & 31];
  return c;
}

async function codes(req, env, ctx, url){
  if (!env.DB) return json({error: "storage not configured"}, 503);
  const m = url.pathname.match(/^\/api\/code(?:\/([^/]*))?\/?$/);
  if (!m) return json({error: "not found"}, 404);
  // writes only from our own pages
  if (req.method !== "GET" && req.method !== "HEAD"){
    const origin = req.headers.get("origin");
    if (origin && origin !== url.origin) return json({error: "forbidden"}, 403);
  }
  const id = m[1] ? m[1].toUpperCase() : "";
  const DB = await db(env), now = Date.now();

  if (!id){
    if (req.method !== "POST") return json({error: "method not allowed"}, 405);
    const s = await readSel(req);
    if (s === null) return json({error: "bad request"}, 400);
    for (let i = 0; i < 5; i++){
      const c = newCode();
      try {
        await DB.prepare("INSERT INTO maps (code, s, c, u, a) VALUES (?1, ?2, ?3, ?3, ?3)").bind(c, s, now).run();
        if (Math.random() < 0.02) ctx.waitUntil(DB.prepare("DELETE FROM maps WHERE a < ?1").bind(now - KEEP_MS).run());
        return json({code: c, u: now}, 201);
      } catch (e){ if (!/UNIQUE|constraint/i.test(String(e))) throw e; }
    }
    return json({error: "try again"}, 503);
  }

  if (!CODE.test(id)) return json({error: "not found"}, 404);
  if (req.method === "GET"){
    const r = await DB.prepare("SELECT s, u FROM maps WHERE code = ?1").bind(id).first();
    if (!r) return json({error: "not found"}, 404);
    ctx.waitUntil(DB.prepare("UPDATE maps SET a = ?2 WHERE code = ?1 AND a < ?3").bind(id, now, now - DAY).run());
    return json(r);
  }
  if (req.method === "PUT"){
    const s = await readSel(req);
    if (s === null) return json({error: "bad request"}, 400);
    const r = await DB.prepare("UPDATE maps SET s = ?2, u = ?3, a = ?3 WHERE code = ?1").bind(id, s, now).run();
    return r.meta.changes ? json({u: now}) : json({error: "not found"}, 404);
  }
  if (req.method === "DELETE"){
    await DB.prepare("DELETE FROM maps WHERE code = ?1").bind(id).run();
    return new Response(null, {status: 204, headers: {"cache-control": "no-store"}});
  }
  return json({error: "method not allowed"}, 405);
}

export default {
  async fetch(req, env, ctx){
    const url = new URL(req.url);
    if (url.pathname.startsWith("/api/")){
      try {
        if (tooMany(req)) return new Response(JSON.stringify({error: "too many requests"}), {status: 429,
          headers: {"content-type": "application/json; charset=utf-8", "cache-control": "no-store", "retry-after": "10"}});
        if (url.pathname.startsWith("/api/code")) return await codes(req, env, ctx, url);
        return json({error: "not found"}, 404);
      } catch (e){
        return json({error: "server error"}, 500);
      }
    }
    return env.ASSETS.fetch(req);
  }
};
