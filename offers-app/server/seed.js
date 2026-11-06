// Loads stores (always) and demo offers (only into an empty database, unless SEED_DEMO=0).
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const crypto = require("node:crypto");
const { createOffer } = require("./offers");
const { hashPassword } = require("./auth");

function readAppData() {
  const ctx = { window: {} };
  vm.runInNewContext(fs.readFileSync(path.join(__dirname, "..", "data.js"), "utf8"), ctx);
  return ctx.window.OFFERS_DATA;
}

function seed(db, { demo = process.env.SEED_DEMO !== "0", log = console.log } = {}) {
  const D = readAppData();
  const upsert = db.prepare(`INSERT INTO stores (id, name_ar, name_en, color, type, logo) VALUES (?,?,?,?,?,?)
    ON CONFLICT(id) DO UPDATE SET name_ar = excluded.name_ar, name_en = excluded.name_en, color = excluded.color,
      type = excluded.type, logo = excluded.logo`);
  for (const s of D.stores) upsert.run(s.id, s.name, s.en, s.color, s.type, s.logo || null);

  const hasOffers = db.prepare("SELECT COUNT(*) n FROM offers").get().n > 0;
  if (demo && !hasOffers) {
    const until = new Date(Date.now() + 30 * 864e5).toISOString().slice(0, 10);
    for (const p of D.products) {
      for (const [store_id, price] of Object.entries(p.prices)) {
        createOffer(db, { name: p.name, category: p.cat, price, old_price: p.old, ends_on: until, icon: p.icon, img: p.img,
          source_note: "بيانات تجريبية" }, { store_id, status: "approved", source_type: "demo" });
      }
      if (p.sub) db.prepare("UPDATE products SET sub = ? WHERE name_ar = ?").run(p.sub, p.name);
    }
    log("Seeded demo offers (source_type = demo). Remove them with: node server/cli.js clear-demo");
  }

  // First admin: from ADMIN_EMAIL / ADMIN_PASSWORD, or a generated password printed once.
  if (!db.prepare("SELECT 1 FROM users WHERE role = 'admin'").get()) {
    const email = process.env.ADMIN_EMAIL || "admin@offers.local";
    const pw = process.env.ADMIN_PASSWORD || crypto.randomBytes(9).toString("base64url");
    db.prepare("INSERT INTO users (email, name, password_hash, role) VALUES (?, ?, ?, 'admin')").run(email, "Admin", hashPassword(pw));
    log(`Created admin account: ${email}` + (process.env.ADMIN_PASSWORD ? "" : `  password: ${pw}  (shown once - change it by setting ADMIN_PASSWORD on a fresh DB)`));
  }
}

module.exports = { seed, readAppData };
