(function () {
  const $ = (id) => document.getElementById(id);
  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  let token = null, status = "pending";
  try { token = sessionStorage.getItem("offers:admin"); } catch {}

  async function api(path, opts = {}) {
    const res = await fetch(path, { ...opts, headers: { "Content-Type": "application/json", ...(token ? { Authorization: "Bearer " + token } : {}) } });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw Object.assign(new Error(data.error || "تعذر الاتصال بالخادم"), { status: res.status });
    return data;
  }
  function msg(id, text, ok) { const m = $(id); m.textContent = text; m.className = "msg show " + (ok ? "ok" : "err"); }

  async function start() {
    try {
      const me = token && await api("/api/me");
      if (!me || me.role !== "admin") throw new Error();
      $("login").hidden = true; $("panel").hidden = false; $("logout").hidden = false; $("who").textContent = me.email;
      const stores = await api("/api/stores");
      $("store_id").innerHTML = stores.map((s) => `<option value="${esc(s.id)}">${esc(s.name)} — ${esc(s.en)}</option>`).join("");
      loadRows(); loadDemo();
    } catch { token = null; $("login").hidden = false; $("panel").hidden = true; $("logout").hidden = true; $("who").textContent = ""; }
  }

  async function loadRows() {
    const rows = await api("/api/admin/offers?status=" + status);
    $("empty").hidden = rows.length > 0;
    $("rows").innerHTML = rows.map((r) => `
      <tr>
        <td><b>${esc(r.product)}</b>${r.source_note ? `<div class="snip">${esc(r.source_note)}</div>` : ""}</td>
        <td>${esc(r.store)}</td>
        <td class="num">${r.price.toFixed(2)}</td>
        <td class="num">${r.old_price ? r.old_price.toFixed(2) : "—"}</td>
        <td class="num">${esc(r.starts_on || "…")} ← ${esc(r.ends_on || "…")}</td>
        <td><span class="pill ${esc(r.source_type)}">${esc(r.source_type)}</span>
          ${r.source_url ? `<br/><a href="${esc(r.source_url)}" target="_blank" rel="noopener noreferrer">فتح المصدر</a>` : ""}</td>
        <td>${r.status === "pending" ? `<div class="row">
          <button class="ok" data-review="${r.id}" data-action="approve">موافقة</button>
          <button class="bad" data-review="${r.id}" data-action="reject">رفض</button></div>` : esc(r.review_note || "")}</td>
      </tr>`).join("");
  }

  $("loginForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    try {
      const r = await api("/api/auth/login", { method: "POST", body: JSON.stringify({ email: $("email").value, password: $("password").value }) });
      if (r.user.role !== "admin") throw new Error("هذا الحساب ليس حساب مسؤول");
      token = r.token; try { sessionStorage.setItem("offers:admin", token); } catch {}
      start();
    } catch (err) { msg("loginMsg", err.message); }
  });

  $("logout").addEventListener("click", async () => {
    await api("/api/auth/logout", { method: "POST" }).catch(() => {});
    token = null; try { sessionStorage.removeItem("offers:admin"); } catch {}
    start();
  });

  $("offerForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    const v = (id) => $(id).value.trim();
    try {
      await api("/api/admin/offers", { method: "POST", body: JSON.stringify({
        store_id: v("store_id"), product_name_ar: v("product_name_ar"), product_name_en: v("product_name_en") || null,
        category: v("category"), price: v("price"), old_price: v("old_price") || null, starts_on: v("starts_on") || null,
        ends_on: v("ends_on"), emirates: [v("emirates")], source_type: v("source_type"), source_url: v("source_url") || null }) });
      msg("offerMsg", "تم نشر العرض", true);
      ["product_name_ar", "product_name_en", "price", "old_price"].forEach((id) => ($(id).value = ""));
      if (status === "approved") loadRows();
    } catch (err) { msg("offerMsg", err.message); }
  });

  $("tabs").addEventListener("click", (e) => {
    const b = e.target.closest("[data-status]"); if (!b) return;
    status = b.dataset.status;
    document.querySelectorAll("#tabs button").forEach((x) => x.classList.toggle("on", x === b));
    loadRows();
  });

  $("rows").addEventListener("click", async (e) => {
    const b = e.target.closest("[data-review]"); if (!b) return;
    b.disabled = true;
    try { await api(`/api/admin/offers/${b.dataset.review}/review`, { method: "POST", body: JSON.stringify({ action: b.dataset.action }) }); loadRows(); }
    catch (err) { b.disabled = false; b.textContent = err.message; }
  });

  $("importBtn").addEventListener("click", async () => {
    const f = $("importFile").files[0];
    if (!f) return msg("importMsg", "اختر ملف JSON أولاً");
    try {
      const r = await api("/api/admin/import", { method: "POST", body: await f.text() });
      msg("importMsg", `أضيف ${r.added} عرضاً لقائمة المراجعة` + (r.skipped.length ? `، وتم تخطي ${r.skipped.length} (${r.skipped.slice(0, 3).map((s) => s.reason).join("، ")})` : ""), true);
      if (status === "pending") loadRows();
    } catch (err) { msg("importMsg", err.message); }
  });

  async function loadDemo() {
    const n = (await api("/api/admin/stats")).filter((r) => r.source_type === "demo").reduce((s, r) => s + r.n, 0);
    $("demoCard").hidden = n === 0; $("demoCount").textContent = n;
  }
  $("clearDemo").addEventListener("click", () => { $("clearDemoYes").hidden = false; });
  $("clearDemoYes").addEventListener("click", async () => {
    try { const r = await api("/api/admin/clear-demo", { method: "POST" }); msg("demoMsg", `حُذف ${r.deleted} عرضاً تجريبياً`, true); $("clearDemoYes").hidden = true; loadDemo(); }
    catch (err) { msg("demoMsg", err.message); }
  });

  const d = new Date(); d.setDate(d.getDate() + 7);
  $("ends_on").value = d.toISOString().slice(0, 10);
  start();
})();
