const crypto = require("node:crypto");

const SESSION_DAYS = 30;

function hashPassword(pw) {
  const salt = crypto.randomBytes(16);
  const hash = crypto.scryptSync(pw, salt, 64);
  return `scrypt$${salt.toString("hex")}$${hash.toString("hex")}`;
}

function verifyPassword(pw, stored) {
  const [alg, saltHex, hashHex] = String(stored).split("$");
  if (alg !== "scrypt" || !saltHex || !hashHex) return false;
  const hash = crypto.scryptSync(pw, Buffer.from(saltHex, "hex"), 64);
  const want = Buffer.from(hashHex, "hex");
  return want.length === hash.length && crypto.timingSafeEqual(want, hash);
}

// Tokens are random; only their SHA-256 is stored, so a copied database can't be used to sign in.
const sha = (t) => crypto.createHash("sha256").update(t).digest("hex");
const bearer = (req) => (/^Bearer (.+)$/.exec(req.headers.authorization || "") || [])[1];

function createSession(db, userId) {
  const token = crypto.randomBytes(32).toString("base64url");
  const expires = new Date(Date.now() + SESSION_DAYS * 864e5).toISOString();
  db.prepare("INSERT INTO sessions (token_hash, user_id, expires_at) VALUES (?, ?, ?)").run(sha(token), userId, expires);
  return token;
}

function userFromRequest(db, req) {
  const token = bearer(req);
  if (!token) return null;
  const row = db.prepare(`
    SELECT u.id, u.email, u.name, u.role, u.store_id FROM sessions s JOIN users u ON u.id = s.user_id
    WHERE s.token_hash = ? AND s.expires_at > ?`).get(sha(token), new Date().toISOString());
  return row ? { ...row } : null;
}

function deleteSession(db, req) {
  const token = bearer(req);
  if (token) db.prepare("DELETE FROM sessions WHERE token_hash = ?").run(sha(token));
}

module.exports = { hashPassword, verifyPassword, createSession, userFromRequest, deleteSession };
