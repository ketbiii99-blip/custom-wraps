// Run: node --test server/
const test = require("node:test");
const assert = require("node:assert/strict");
const { open } = require("./db");
const { seed } = require("./seed");
const { createServer } = require("./server");
const { liveProducts, createOffer } = require("./offers");

async function setup() {
  process.env.ADMIN_EMAIL = "admin@test.local";
  process.env.ADMIN_PASSWORD = "admin-pass-123";
  const db = open(":memory:");
  seed(db, { log: () => {} });
  const srv = createServer(db);
  await new Promise((r) => srv.listen(0, r));
  const base = `http://127.0.0.1:${srv.address().port}`;
  const call = async (path, { token, body, method } = {}) => {
    const res = await fetch(base + path, { method: method || (body ? "POST" : "GET"),
      headers: { "Content-Type": "application/json", ...(token ? { Authorization: "Bearer " + token } : {}) },
      body: body ? JSON.stringify(body) : undefined });
    return { status: res.status, body: await res.json().catch(() => null) };
  };
  return { db, srv, call };
}

const future = (days) => new Date(Date.now() + days * 864e5).toISOString().slice(0, 10);

test("merchant offer stays hidden until an admin approves it", async (t) => {
  const { srv, call } = await setup(); t.after(() => srv.close());

  const reg = await call("/api/auth/register", { body: { store_name: "بقالة الاختبار", email: "m@test.local", password: "merchant-1" } });
  assert.equal(reg.status, 201);
  const mt = reg.body.token;

  const add = await call("/api/merchant/offers", { token: mt, body: { product_name_ar: "عصير مانجو 1 لتر", category: "grocery", price: 6.5, old_price: 9, ends_on: future(10) } });
  assert.equal(add.status, 201);
  assert.equal(add.body.status, "pending");

  let live = await call("/api/offers?q=" + encodeURIComponent("مانجو"));
  assert.equal(live.body.length, 0, "pending offer must not be public");

  // merchants cannot reach admin routes
  assert.equal((await call("/api/admin/offers", { token: mt })).status, 403);
  assert.equal((await call(`/api/admin/offers/${add.body.id}/review`, { token: mt, body: { action: "approve" } })).status, 403);

  const login = await call("/api/auth/login", { body: { email: "admin@test.local", password: "admin-pass-123" } });
  const at = login.body.token;
  const queue = await call("/api/admin/offers?status=pending", { token: at });
  assert.ok(queue.body.some((o) => o.id === add.body.id));

  assert.equal((await call(`/api/admin/offers/${add.body.id}/review`, { token: at, body: { action: "approve" } })).status, 200);
  assert.equal((await call(`/api/admin/offers/${add.body.id}/review`, { token: at, body: { action: "approve" } })).status, 409, "second review is rejected");

  live = await call("/api/offers?q=" + encodeURIComponent("مانجو"));
  assert.equal(live.body.length, 1);
  assert.equal(live.body[0].prices[reg.body.user.store_id], 6.5);
  assert.equal(live.body[0].offers[0].source_type, "merchant");
});

test("a merchant cannot post an offer for another store", async (t) => {
  const { srv, call } = await setup(); t.after(() => srv.close());
  const reg = await call("/api/auth/register", { body: { store_name: "متجر", email: "x@test.local", password: "merchant-1" } });
  const add = await call("/api/merchant/offers", { token: reg.body.token,
    body: { store_id: "carrefour", product_name_ar: "منتج", category: "grocery", price: 5, ends_on: future(3) } });
  const mine = await call("/api/merchant/offers", { token: reg.body.token });
  assert.equal(add.status, 201);
  assert.equal(mine.body.length, 1);
  const queue = await call("/api/admin/offers", { token: (await call("/api/auth/login", { body: { email: "admin@test.local", password: "admin-pass-123" } })).body.token });
  assert.equal(queue.body.find((o) => o.id === add.body.id).store_id, reg.body.user.store_id);
});

test("validation errors are clear and nothing is saved", async (t) => {
  const { srv, call } = await setup(); t.after(() => srv.close());
  const at = (await call("/api/auth/login", { body: { email: "admin@test.local", password: "admin-pass-123" } })).body.token;
  const bad = await call("/api/admin/offers", { token: at, body: { store_id: "lulu", product_name_ar: "أرز", category: "grocery", price: 50, old_price: 40, ends_on: future(5) } });
  assert.equal(bad.status, 400);
  assert.equal(bad.body.field, "old_price");
  assert.equal((await call("/api/admin/offers", { token: at, body: { store_id: "nope", product_name_ar: "أرز", category: "grocery", price: 5 } })).status, 400);
  assert.equal((await call("/api/auth/login", { body: { email: "admin@test.local", password: "wrong" } })).status, 401);
  assert.equal((await call("/api/me")).status, 401);
});

test("expired and future offers are not shown; cheapest store wins", () => {
  const db = open(":memory:"); seed(db, { demo: false, log: () => {} });
  const base = { name: "حليب 1 لتر", category: "grocery" };
  createOffer(db, { ...base, price: 5, ends_on: "2020-01-01" }, { store_id: "lulu", status: "approved", source_type: "flyer" });
  createOffer(db, { ...base, price: 4, starts_on: future(5), ends_on: future(9) }, { store_id: "nesto", status: "approved", source_type: "flyer" });
  createOffer(db, { ...base, price: 6, old_price: 7, ends_on: future(3) }, { store_id: "carrefour", status: "approved", source_type: "flyer" });
  createOffer(db, { ...base, price: 5.5, ends_on: future(3) }, { store_id: "unioncoop", status: "approved", source_type: "flyer" });
  const [p] = liveProducts(db, {});
  assert.deepEqual(p.prices, { unioncoop: 5.5, carrefour: 6 });
  assert.equal(p.old, 7);
});

test("emirate filter keeps all-UAE offers and that emirate only", () => {
  const db = open(":memory:"); seed(db, { demo: false, log: () => {} });
  createOffer(db, { name: "خبز", category: "grocery", price: 3, emirates: ["دبي"] }, { store_id: "lulu", status: "approved", source_type: "flyer" });
  createOffer(db, { name: "خبز", category: "grocery", price: 3.5 }, { store_id: "nesto", status: "approved", source_type: "flyer" });
  assert.deepEqual(Object.keys(liveProducts(db, { emirate: "أبوظبي" })[0].prices), ["nesto"]);
  assert.equal(Object.keys(liveProducts(db, { emirate: "دبي" })[0].prices).length, 2);
});

test("import puts researched offers in the review queue and skips expired ones", async (t) => {
  const { srv, call } = await setup(); t.after(() => srv.close());
  const at = (await call("/api/auth/login", { body: { email: "admin@test.local", password: "admin-pass-123" } })).body.token;
  const r = await call("/api/admin/import", { token: at, body: { offers: [
    { store_id: "carrefour", product_name_ar: "زيت زيتون", category: "grocery", price: 29, old_price: 35, ends_on: future(4), source_url: "https://example.com/a" },
    { store_id: "lulu", product_name_ar: "قديم", category: "grocery", price: 2, ends_on: "2020-01-01" },
    { store_id: "lulu", product_name_ar: "بلا سعر", category: "grocery" },
  ] } });
  assert.equal(r.body.added, 1);
  assert.equal(r.body.skipped.length, 2);
  const live = await call("/api/offers?q=" + encodeURIComponent("زيتون"));
  assert.equal(live.body.length, 0);
});

test("static server refuses paths outside the app", async (t) => {
  const { srv } = await setup(); t.after(() => srv.close());
  const port = srv.address().port;
  for (const p of ["/server/data/offers.db", "/server/db.js", "/../README.md", "/%2e%2e/etc/passwd"]) {
    const res = await fetch(`http://127.0.0.1:${port}${p}`);
    assert.equal(res.status, 404, p);
  }
  assert.equal((await fetch(`http://127.0.0.1:${port}/`)).status, 200);
});

test("sign-in is limited to 10 attempts per 15 minutes", async (t) => {
  const { srv, call } = await setup(); t.after(() => srv.close());
  let last;
  for (let i = 0; i < 11; i++) last = await call("/api/auth/login", { body: { email: "nobody@test.local", password: "x" } });
  assert.equal(last.status, 429);
});

test("pages are served with security headers", async (t) => {
  const { srv } = await setup(); t.after(() => srv.close());
  const res = await fetch(`http://127.0.0.1:${srv.address().port}/`);
  assert.match(res.headers.get("content-security-policy"), /frame-ancestors 'none'/);
  assert.equal(res.headers.get("x-frame-options"), "DENY");
});
