// OFFERS API + static file server. Zero dependencies: node:http + node:sqlite.
//   node server/server.js            (PORT=8080 by default)
const http = require("node:http");
const fs = require("node:fs");
const path = require("node:path");
const { open } = require("./db");
const { seed } = require("./seed");
const auth = require("./auth");
const { createOffer, liveProducts, reviewOffer, ValidationError, today } = require("./offers");

const PORT = Number(process.env.PORT || 8080);
const ROOT = path.join(__dirname, "..");
const MAX_BODY = 1024 * 1024;

const log = (level, msg, extra = {}) => console.log(JSON.stringify({ t: new Date().toISOString(), level, msg, ...extra }));

function createServer(db) {
  const routes = [];
  const route = (method, pattern, handler, opts = {}) => routes.push({ method, re: new RegExp(`^${pattern}$`), handler, ...opts });

  // ---- public ----
  route("GET", "/api/health", () => ({ ok: true, db: !!db.prepare("SELECT 1 x").get() }));
  route("GET", "/api/stores", () => db.prepare("SELECT id, name_ar name, name_en en, color, type, logo FROM stores ORDER BY name_en").all()
    .map((s) => ({ ...s, offers: db.prepare(`SELECT COUNT(*) n FROM offers WHERE store_id = ? AND status = 'approved'
      AND (ends_on IS NULL OR ends_on >= ?)`).get(s.id, today()).n })));
  route("GET", "/api/offers", ({ query }) => liveProducts(db, {
    cat: query.get("cat"), q: query.get("q"), store: query.get("store"), emirate: query.get("emirate") }));
  route("GET", "/api/products/(\\d+)", ({ m }) => {
    const [p] = liveProducts(db, { productId: m[1] });
    if (!p) throw httpError(404, "العرض غير موجود أو انتهى");
    return p;
  });

  // ---- accounts ----
  route("POST", "/api/auth/register", ({ body }) => {
    const name = String(body.store_name || "").trim().slice(0, 80), email = String(body.email || "").trim().slice(0, 120);
    const pw = String(body.password || "");
    if (name.length < 2) throw new ValidationError("store_name", "اسم المتجر مطلوب");
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) throw new ValidationError("email", "البريد الإلكتروني غير صحيح");
    if (pw.length < 8) throw new ValidationError("password", "كلمة المرور 8 أحرف على الأقل");
    if (db.prepare("SELECT 1 FROM users WHERE email = ?").get(email)) throw httpError(409, "هذا البريد مسجّل مسبقاً، سجّل الدخول");
    db.exec("BEGIN");
    try {
      const storeId = "m" + Date.now().toString(36);
      db.prepare("INSERT INTO stores (id, name_ar, name_en, color, type) VALUES (?, ?, ?, '#5b21b6', 'other')").run(storeId, name, name);
      const u = db.prepare("INSERT INTO users (email, name, password_hash, role, store_id) VALUES (?, ?, ?, 'merchant', ?)")
        .run(email, name, auth.hashPassword(pw), storeId);
      db.exec("COMMIT");
      const token = auth.createSession(db, Number(u.lastInsertRowid));
      return { status: 201, body: { token, user: { name, email, role: "merchant", store_id: storeId } } };
    } catch (e) { db.exec("ROLLBACK"); throw e; }
  });
  route("POST", "/api/auth/login", ({ body }) => {
    const u = db.prepare("SELECT * FROM users WHERE email = ?").get(String(body.email || "").trim());
    if (!u || !auth.verifyPassword(String(body.password || ""), u.password_hash)) throw httpError(401, "البريد أو كلمة المرور غير صحيحة");
    return { token: auth.createSession(db, u.id), user: { name: u.name, email: u.email, role: u.role, store_id: u.store_id } };
  });
  route("POST", "/api/auth/logout", ({ req }) => { auth.deleteSession(db, req); return { ok: true }; });
  route("GET", "/api/me", ({ user }) => user, { role: "any" });

  // ---- merchants: their own store only; offers wait for review ----
  route("GET", "/api/merchant/offers", ({ user }) => ownOffers(user.store_id), { role: "merchant" });
  route("POST", "/api/merchant/offers", ({ body, user }) => {
    const id = createOffer(db, body, { store_id: user.store_id, status: "pending", source_type: "merchant", user_id: user.id });
    return { status: 201, body: { id, status: "pending" } };
  }, { role: "merchant" });

  // ---- admin ----
  route("GET", "/api/admin/offers", ({ query }) => {
    const status = ["pending", "approved", "rejected"].includes(query.get("status")) ? query.get("status") : "pending";
    return db.prepare(`SELECT o.*, p.name_ar product, p.category, s.name_ar store FROM offers o
      JOIN products p ON p.id = o.product_id JOIN stores s ON s.id = o.store_id
      WHERE o.status = ? ORDER BY o.created_at DESC, o.id DESC LIMIT 300`).all(status).map((r) => ({ ...r, emirates: JSON.parse(r.emirates) }));
  }, { role: "admin" });
  // Offers typed in by the team from a store's flyer or website go live immediately.
  route("POST", "/api/admin/offers", ({ body, user }) => {
    const source_type = ["admin", "flyer", "feed"].includes(body.source_type) ? body.source_type : "admin";
    const id = createOffer(db, body, { store_id: String(body.store_id || ""), status: "approved", source_type, user_id: user.id });
    return { status: 201, body: { id, status: "approved" } };
  }, { role: "admin" });
  route("POST", "/api/admin/offers/(\\d+)/review", ({ m, body, user }) => {
    if (!reviewOffer(db, m[1], body.action, user.id, body.note)) throw httpError(409, "العرض ليس بانتظار المراجعة");
    return { ok: true };
  }, { role: "admin" });
  // Bulk import (e.g. researched-offers.json). Everything lands in the review queue.
  route("POST", "/api/admin/import", ({ body, user }) => importOffers(db, body, user.id), { role: "admin" });

  function ownOffers(storeId) {
    return db.prepare(`SELECT o.id, p.name_ar product, o.price, o.old_price, o.starts_on, o.ends_on, o.status, o.review_note, o.created_at
      FROM offers o JOIN products p ON p.id = o.product_id WHERE o.store_id = ? ORDER BY o.id DESC LIMIT 200`).all(storeId);
  }

  return http.createServer(async (req, res) => {
    const started = Date.now();
    const url = new URL(req.url, "http://x");
    try {
      if (!url.pathname.startsWith("/api/")) return serveStatic(url.pathname, res);
      const r = routes.find((x) => x.method === req.method && x.re.test(url.pathname));
      if (!r) throw httpError(404, "Not found");
      const user = auth.userFromRequest(db, req);
      if (r.role && !user) throw httpError(401, "سجّل الدخول أولاً");
      if (r.role && r.role !== "any" && user.role !== r.role) throw httpError(403, "لا تملك صلاحية لهذا الإجراء");
      const body = req.method === "POST" ? await readJson(req) : {};
      const out = await r.handler({ req, m: url.pathname.match(r.re), query: url.searchParams, body, user });
      const wrapped = out && out.status && out.body ? out : { status: 200, body: out };
      send(res, wrapped.status, wrapped.body);
    } catch (e) {
      const status = e.status || 500;
      if (status >= 500) log("error", "request failed", { path: url.pathname, err: e.stack });
      send(res, status, { error: status >= 500 ? "حدث خطأ في الخادم، حاول مرة أخرى" : e.message, field: e.field });
    } finally {
      if (url.pathname.startsWith("/api/")) log("info", "request", { method: req.method, path: url.pathname, status: res.statusCode, ms: Date.now() - started });
    }
  });
}

function importOffers(db, body, userId) {
  const list = Array.isArray(body) ? body : body.offers;
  if (!Array.isArray(list)) throw new ValidationError("offers", "الملف لا يحتوي على قائمة عروض");
  const result = { added: 0, skipped: [] };
  list.slice(0, 2000).forEach((o, i) => {
    try {
      if (o.ends_on && o.ends_on < today()) throw new ValidationError("ends_on", "العرض منتهي");
      createOffer(db, { ...o, source_note: o.seen_snippet || o.source_note },
        { store_id: String(o.store_id || ""), status: "pending", source_type: "research", user_id: userId });
      result.added++;
    } catch (e) {
      if (!(e instanceof ValidationError)) throw e;
      result.skipped.push({ index: i, product: o.product_name_ar || o.product_name_en, reason: e.message });
    }
  });
  return result;
}

const httpError = (status, message) => Object.assign(new Error(message), { status });

function send(res, status, body) {
  res.writeHead(status, { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff" });
  res.end(JSON.stringify(body));
}

function readJson(req) {
  return new Promise((resolve, reject) => {
    let size = 0; const chunks = [];
    req.on("data", (c) => { size += c.length; if (size > MAX_BODY) { reject(httpError(413, "الطلب كبير جداً")); req.destroy(); } else chunks.push(c); });
    req.on("end", () => {
      if (!chunks.length) return resolve({});
      try { const v = JSON.parse(Buffer.concat(chunks).toString("utf8")); resolve(v && typeof v === "object" ? v : {}); }
      catch { reject(httpError(400, "صيغة البيانات غير صحيحة")); }
    });
    req.on("error", reject);
  });
}

const TYPES = { ".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".css": "text/css; charset=utf-8",
  ".json": "application/json", ".svg": "image/svg+xml", ".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".webp": "image/webp" };
const PUBLIC = /^\/(index\.html|admin\.html|admin\.js|app\.js|data\.js|icons\.js|styles\.css|manifest\.json|assets\/[\w./-]+)$/;

function serveStatic(pathname, res) {
  if (pathname === "/") pathname = "/index.html";
  if (pathname === "/admin") pathname = "/admin.html";
  const file = path.normalize(path.join(ROOT, pathname));
  if (!PUBLIC.test(pathname) || !file.startsWith(ROOT + path.sep) || !fs.existsSync(file)) {
    res.writeHead(404, { "Content-Type": "text/plain" }); return res.end("Not found");
  }
  res.writeHead(200, { "Content-Type": TYPES[path.extname(file)] || "application/octet-stream", "X-Content-Type-Options": "nosniff" });
  fs.createReadStream(file).pipe(res);
}

if (require.main === module) {
  const db = open();
  seed(db, { log: (m) => log("info", m) });
  createServer(db).listen(PORT, () => log("info", `OFFERS running on http://localhost:${PORT}  (admin: /admin)`));
}

module.exports = { createServer, importOffers };
