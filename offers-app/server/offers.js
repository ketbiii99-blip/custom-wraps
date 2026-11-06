// Offer rules shared by every route: validation, product matching, live listing, review.
const CATEGORIES = ["grocery", "electronics", "fashion", "home", "beauty", "kids", "more"];
const EMIRATES = ["all", "أبوظبي", "دبي", "الشارقة", "عجمان", "أم القيوين", "رأس الخيمة", "الفجيرة"];
const SOURCE_TYPES = ["merchant", "admin", "flyer", "feed", "research", "demo"];
const CATEGORY_ICON = { grocery: "carrot", electronics: "monitor", fashion: "shirt", home: "sofa", beauty: "spray-can", kids: "baby", more: "tag" };

class ValidationError extends Error {
  constructor(field, message) { super(message); this.field = field; this.status = 400; }
}

const today = () => new Date().toISOString().slice(0, 10);
const isDate = (s) => typeof s === "string" && /^\d{4}-\d{2}-\d{2}$/.test(s) && !isNaN(Date.parse(s));
const money = (v) => Math.round(Number(v) * 100) / 100;
const cleanText = (s, max) => String(s ?? "").replace(/\s+/g, " ").trim().slice(0, max);

/** Validate raw input and return a normalised offer. Throws ValidationError with an Arabic message. */
function validateOffer(input) {
  const name = cleanText(input.product_name_ar ?? input.name, 120);
  if (name.length < 2) throw new ValidationError("product_name_ar", "اسم المنتج مطلوب");
  const category = input.category ?? input.cat;
  if (!CATEGORIES.includes(category)) throw new ValidationError("category", "القسم غير صحيح");

  const price = money(input.price);
  if (!(price > 0) || price > 1e6) throw new ValidationError("price", "السعر الجديد غير صحيح");
  let old_price = input.old_price ?? input.old;
  old_price = old_price === null || old_price === undefined || old_price === "" ? null : money(old_price);
  if (old_price !== null && !(old_price > price)) throw new ValidationError("old_price", "السعر السابق يجب أن يكون أعلى من السعر الجديد");

  const starts_on = input.starts_on || null, ends_on = input.ends_on || input.until || null;
  if (starts_on !== null && !isDate(starts_on)) throw new ValidationError("starts_on", "تاريخ البداية غير صحيح");
  if (ends_on !== null && !isDate(ends_on)) throw new ValidationError("ends_on", "تاريخ النهاية غير صحيح");
  if (starts_on && ends_on && ends_on < starts_on) throw new ValidationError("ends_on", "تاريخ النهاية قبل تاريخ البداية");

  let emirates = input.emirates ?? ["all"];
  if (typeof emirates === "string") emirates = [emirates];
  if (!Array.isArray(emirates) || !emirates.length || emirates.some((e) => !EMIRATES.includes(e)))
    throw new ValidationError("emirates", "اختر إمارة صحيحة");

  let source_url = input.source_url ? cleanText(input.source_url, 500) : null;
  if (source_url && !/^https?:\/\//i.test(source_url)) throw new ValidationError("source_url", "رابط المصدر يجب أن يبدأ بـ https://");

  return {
    name, name_en: input.product_name_en ? cleanText(input.product_name_en, 160) : null, category,
    price, old_price, starts_on, ends_on, emirates: emirates.includes("all") ? ["all"] : emirates,
    source_url, source_note: input.source_note ? cleanText(input.source_note, 500) : null,
    img: typeof input.img === "string" && /^(assets\/|https:\/\/)/.test(input.img) ? input.img : null,
    icon: typeof input.icon === "string" && /^[a-z0-9-]{1,40}$/.test(input.icon) ? input.icon : null,
  };
}

function findOrCreateProduct(db, o) {
  const found = db.prepare("SELECT id FROM products WHERE name_ar = ? AND category = ?").get(o.name, o.category);
  if (found) return found.id;
  const r = db.prepare("INSERT INTO products (name_ar, name_en, category, icon, img) VALUES (?, ?, ?, ?, ?)")
    .run(o.name, o.name_en, o.category, o.icon || CATEGORY_ICON[o.category], o.img);
  return Number(r.lastInsertRowid);
}

/** Insert one offer. The caller decides store, status and source; input is untrusted. */
function createOffer(db, input, { store_id, status, source_type, user_id = null }) {
  if (!SOURCE_TYPES.includes(source_type)) throw new Error("bad source_type");
  if (!db.prepare("SELECT 1 FROM stores WHERE id = ?").get(store_id)) throw new ValidationError("store_id", "المتجر غير موجود");
  const o = validateOffer(input);
  db.exec("BEGIN");
  try {
    const product_id = findOrCreateProduct(db, o);
    const r = db.prepare(`INSERT INTO offers
      (product_id, store_id, price, old_price, starts_on, ends_on, emirates, source_type, source_url, source_note, status, submitted_by, reviewed_by)
      VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)`).run(
      product_id, store_id, o.price, o.old_price, o.starts_on, o.ends_on, JSON.stringify(o.emirates),
      source_type, o.source_url, o.source_note, status, user_id, status === "approved" ? user_id : null);
    db.exec("COMMIT");
    return Number(r.lastInsertRowid);
  } catch (e) { db.exec("ROLLBACK"); throw e; }
}

/**
 * Live offers grouped per product, in the shape the app already renders:
 * { id, name, cat, icon, img, old, prices: {storeId: price}, until, offers: [...] }
 * Live = approved, started, not ended, and covering the chosen emirate.
 */
function liveProducts(db, { cat, q, store, emirate, productId, limit = 200 } = {}) {
  const where = ["o.status = 'approved'", "(o.starts_on IS NULL OR o.starts_on <= :today)", "(o.ends_on IS NULL OR o.ends_on >= :today)"];
  const params = { today: today() };
  if (cat && CATEGORIES.includes(cat)) { where.push("p.category = :cat"); params.cat = cat; }
  if (store) { where.push("o.store_id = :store"); params.store = String(store); }
  if (productId) { where.push("p.id = :pid"); params.pid = Number(productId); }
  if (emirate && EMIRATES.includes(emirate) && emirate !== "all") {
    where.push(`(o.emirates LIKE '%"all"%' OR o.emirates LIKE :em)`); params.em = `%"${emirate}"%`;
  }
  if (q) {
    where.push("(p.name_ar LIKE :q OR p.name_en LIKE :q OR s.name_ar LIKE :q OR s.name_en LIKE :q)");
    params.q = `%${String(q).slice(0, 60).replace(/[%_]/g, "")}%`;
  }
  const rows = db.prepare(`
    SELECT p.id pid, p.name_ar, p.name_en, p.category, p.sub, p.icon, p.img,
           o.id oid, o.store_id, o.price, o.old_price, o.starts_on, o.ends_on, o.emirates,
           o.source_type, o.source_url, o.updated_at
    FROM offers o JOIN products p ON p.id = o.product_id JOIN stores s ON s.id = o.store_id
    WHERE ${where.join(" AND ")}
    ORDER BY p.id, o.price`).all(params);

  const byProduct = new Map();
  for (const r of rows) {
    let p = byProduct.get(r.pid);
    if (!p) {
      p = { id: String(r.pid), name: r.name_ar, name_en: r.name_en, cat: r.category, sub: r.sub, icon: r.icon, img: r.img,
            old: null, prices: {}, until: null, updated_at: null, offers: [] };
      byProduct.set(r.pid, p);
    }
    if (p.prices[r.store_id] !== undefined) continue; // keep the cheapest live offer per store
    p.prices[r.store_id] = r.price;
    if (r.old_price && (p.old === null || r.old_price > p.old)) p.old = r.old_price;
    if (r.ends_on && (!p.until || r.ends_on > p.until)) p.until = r.ends_on;
    if (!p.updated_at || r.updated_at > p.updated_at) p.updated_at = r.updated_at;
    p.offers.push({ id: r.oid, store_id: r.store_id, price: r.price, old_price: r.old_price, starts_on: r.starts_on,
      ends_on: r.ends_on, emirates: JSON.parse(r.emirates), source_type: r.source_type, source_url: r.source_url, updated_at: r.updated_at });
  }
  // Products with no reference price use their highest current price so the % badge stays honest (0% if one store).
  const list = [...byProduct.values()].map((p) => ({ ...p, old: p.old ?? Math.max(...Object.values(p.prices)) }));
  return list.slice(0, limit);
}

function reviewOffer(db, id, action, reviewer, note) {
  if (!["approve", "reject"].includes(action)) throw new ValidationError("action", "إجراء غير صحيح");
  const r = db.prepare(`UPDATE offers SET status = ?, reviewed_by = ?, review_note = ?, updated_at = datetime('now')
    WHERE id = ? AND status = 'pending'`).run(action === "approve" ? "approved" : "rejected", reviewer, note ? cleanText(note, 300) : null, Number(id));
  return r.changes === 1;
}

module.exports = { CATEGORIES, EMIRATES, ValidationError, validateOffer, createOffer, liveProducts, reviewOffer, today };
