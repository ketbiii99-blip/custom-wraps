(function () {
  const D = window.OFFERS_DATA;
  const $ = (s) => document.querySelector(s);
  const screen = $("#screen");

  // ---------- persistent state ----------
  const load = (k, d) => { try { const v = localStorage.getItem("offers:" + k); return v ? JSON.parse(v) : d; } catch { return d; } };
  const save = (k, v) => { try { localStorage.setItem("offers:" + k, JSON.stringify(v)); } catch {} };

  const S = {
    emirate: load("emirate", "أبوظبي"),
    favs: load("favs", []),          // product ids
    favStores: load("favStores", []),
    cart: load("cart", {}),          // productId -> qty
    custom: load("custom", []).map((o) => (o.emoji ? { ...o, icon: "tag", emoji: undefined } : o)), // merchant-added offers
    merchant: load("merchant", null), // { name, email, token? }
    live: false,                       // true when prices come from the server
    myOffers: [],
    history: [],
    loc: load("loc", null),            // { lat, lng, label, source: "gps" | "area" }
    theme: load("theme", "auto"),      // "auto" | "light" | "dark"
    pop: null, bump: false, dir: "fwd",
  };
  const persist = () => { ["emirate", "favs", "favStores", "cart", "custom", "merchant", "loc", "theme"].forEach((k) => save(k, S[k])); };

  // ---------- helpers ----------
  const products = () => (S.live ? D.products : D.products.concat(S.custom));
  const store = (id) => D.stores.find((s) => s.id === id) || { id, name: id, en: "?", color: "#64748b" };
  const ic = window.ic;
  const pimg = (p, size) => `${p.img ? `<img src="${p.img}" alt="" />` : ""}${ic(p.icon || "tag", size || 40)}`;
  const product = (id) => products().find((p) => p.id === id);
  const best = (p) => {
    let bid = null, bp = Infinity;
    for (const [sid, v] of Object.entries(p.prices)) if (v < bp) { bp = v; bid = sid; }
    return { store: bid, price: bp };
  };
  const pct = (p) => Math.round((1 - best(p).price / p.old) * 100);
  const aed = (n) => `${Number(n).toFixed(n % 1 ? 2 : 0)} درهم`;
  const fmtDate = (s) => new Date(s).toLocaleDateString("ar-AE", { day: "numeric", month: "long", year: "numeric" });
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

  // ---------- location ----------
  // Distance in km between two {lat,lng} points (haversine).
  function km(a, b) {
    const R = 6371, rad = Math.PI / 180, dLat = (b.lat - a.lat) * rad, dLng = (b.lng - a.lng) * rad;
    const h = Math.sin(dLat / 2) ** 2 + Math.cos(a.lat * rad) * Math.cos(b.lat * rad) * Math.sin(dLng / 2) ** 2;
    return 2 * R * Math.asin(Math.sqrt(h));
  }
  const fmtKm = (d) => (d < 1 ? `${Math.round(d * 1000)} م` : `${d < 10 ? d.toFixed(1) : Math.round(d)} كم`);
  const ONLINE = new Set(["amazon", "noon"]);
  /** Nearest branch of a store to the shopper, or null (online store / no location / no branches). */
  function nearest(storeId) {
    if (!S.loc || ONLINE.has(storeId)) return null;
    let bestB = null, bestD = Infinity;
    for (const b of D.branches || []) if (b.store === storeId) { const d = km(S.loc, b); if (d < bestD) { bestD = d; bestB = b; } }
    return bestB ? { branch: bestB, d: bestD } : null;
  }
  const kmTag = (n) => (n ? `<span class="km ${n.d > 15 ? "far" : ""}">${ic("navigation", 12)} ${fmtKm(n.d)}</span>` : "");
  const mapsUrl = (b) => "https://www.google.com/maps/search/?api=1&query=" + encodeURIComponent(b.q);
  function setLoc(loc) {
    S.loc = loc;
    // the emirate follows the location: take the emirate of the closest known area
    let e = S.emirate, d0 = Infinity;
    for (const a of D.areas) { const d = km(loc, a); if (d < d0) { d0 = d; e = a.emirate; } }
    S.emirate = e; persist();
    if (S.live) loadLive().then(render).catch(() => {}); else render();
  }
  function useGps() {
    if (!navigator.geolocation) return toast("المتصفح لا يدعم تحديد الموقع، اختر منطقتك");
    toast("جارٍ تحديد موقعك…");
    navigator.geolocation.getCurrentPosition(
      (p) => { setLoc({ lat: p.coords.latitude, lng: p.coords.longitude, label: "موقعي الحالي", source: "gps" }); toast("تم تحديد موقعك"); if (current.name === "location") back(); },
      () => toast("لم نتمكن من الوصول لموقعك، اختر منطقتك من القائمة"),
      { enableHighAccuracy: false, timeout: 8000, maximumAge: 600000 });
  }

  // ---------- theme ----------
  function applyTheme() {
    const r = document.documentElement;
    if (S.theme === "auto") r.removeAttribute("data-theme"); else r.setAttribute("data-theme", S.theme);
  }

  function toast(msg) {
    const t = $("#toast"); t.textContent = msg; t.classList.add("show");
    clearTimeout(toast.t); toast.t = setTimeout(() => t.classList.remove("show"), 1800);
  }

  // ---------- router ----------
  let current = { name: "home", params: {} };
  function go(name, params = {}, push = true) {
    S.dir = "fwd";
    if (push) S.history.push(current);
    current = { name, params };
    render();
    screen.scrollTop = 0;
  }
  function back() { S.dir = "back"; current = S.history.pop() || { name: "home", params: {} }; render(); }

  const tabs = [
    { id: "home", label: "الرئيسية", icon: "house" },
    { id: "stores", label: "المتاجر", icon: "store" },
    { id: "nearby", label: "قريب مني", icon: "radar", center: true },
    { id: "favs", label: "المفضلة", icon: "heart" },
    { id: "account", label: "حسابي", icon: "user" },
  ];
  function renderNav() {
    const nf = S.favs.length;
    $("#nav").innerHTML = tabs.map((t) => `
      <button class="${current.name === t.id ? "on" : ""} ${t.center ? "center" : ""}" data-tab="${t.id}" aria-label="${t.label}">
        <span>${ic(t.icon, t.center ? 24 : 22)}</span>${t.label}${t.id === "favs" && nf ? `<em class="count ${S.bump ? "bump" : ""}">${nf}</em>` : ""}
      </button>`).join("");
    // floating compare bar while the basket has items (not on the compare screen itself)
    const n = Object.keys(S.cart).filter(product).length;
    const bar = $("#cbar");
    if (n && !["compare", "addOffer", "merchantLogin", "location"].includes(current.name)) {
      bar.hidden = false;
      bar.innerHTML = `<span class="icon-btn" style="background:transparent;color:inherit">${ic("shopping-cart")}</span>
        <div class="grow"><b>${n} ${n === 1 ? "منتج" : "منتجات"} في سلتك</b><br/><small>قارن سعر السلة في كل المتاجر</small></div>
        <button class="btn" data-tab="compare">قارن الآن</button>`;
    } else bar.hidden = true;
  }

  // ---------- components ----------
  const header = (title, opts = {}) => `
    <div class="topbar">
      <button class="icon-btn" data-act="back" aria-label="رجوع">${ic("arrow-right")}</button>
      <h1>${title}</h1>
      ${opts.right || `<span class="icon-btn"></span>`}
    </div>`;

  function pcard(p, i = 0) {
    const b = best(p);
    const fav = S.favs.includes(p.id), inCart = !!S.cart[p.id];
    const n = nearest(b.store);
    return `
    <div class="pcard rise" style="--i:${Math.min(i, 8)}" data-open="${p.id}">
      <div class="pimg">${pimg(p)}<span class="badge">خصم ${pct(p)}%</span></div>
      <div class="pinfo">
        <h5>${esc(p.name)}</h5>
        <div class="store">${store(b.store).name}${n ? ` · ${esc(n.branch.name)}` : ""}${Object.keys(p.prices).length > 1 ? ` · ${Object.keys(p.prices).length} متاجر` : ""} ${kmTag(n)}</div>
        <div class="price"><b>${aed(b.price)}</b><s>${aed(p.old)}</s></div>
      </div>
      <div class="pact">
        <button class="heart ${fav ? "on" : ""} ${S.pop === p.id ? "pop" : ""}" data-fav="${p.id}" aria-label="مفضلة">${ic("heart", 20)}</button>
        <button class="plus ${inCart ? "added" : ""}" data-cart="${p.id}" aria-label="أضف للمقارنة">${ic(inCart ? "check" : "plus", 18)}</button>
      </div>
    </div>`;
  }
  const mini = (p) => `
    <div class="mini" data-open="${p.id}">
      <div class="pimg">${pimg(p, 34)}<span class="badge">-${pct(p)}%</span></div>
      <h6>${esc(p.name)}</h6><b>${aed(best(p).price)}</b>
    </div>`;
  const slogo = (s, cls = "") => `<div class="slogo ${cls}" style="--c:${s.color}">${s.logo ? `<img src="${s.logo}" alt="${s.en}" />` : ""}<span>${esc(s.en)}</span></div>`;

  // ---------- server ----------
  // When the app is served by server/server.js it loads real offers from /api.
  // Opened as a plain file (or the API is down) it keeps the built-in demo data.
  async function api(path, opts = {}) {
    const headers = { "Content-Type": "application/json" };
    if (S.merchant?.token) headers.Authorization = "Bearer " + S.merchant.token;
    const res = await fetch(path, { ...opts, headers });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw Object.assign(new Error(data.error || "تعذر الاتصال بالخادم"), { status: res.status });
    return data;
  }
  async function loadLive() {
    const em = encodeURIComponent(S.emirate);
    const [stores, prods] = await Promise.all([api("/api/stores"), api("/api/offers?emirate=" + em)]);
    D.stores = stores; D.products = prods;
  }
  async function loadMine() {
    try { S.myOffers = await api("/api/merchant/offers"); }
    catch (e) { if (e.status === 401) { S.merchant = null; persist(); } }
  }
  async function boot() {
    if (!/^https?:$/.test(location.protocol)) return;
    try {
      await loadLive();
      S.live = true;
      if (S.merchant && !S.merchant.token) { S.merchant = null; persist(); } // demo-only login from before
      if (S.merchant) await loadMine();
      render();
    } catch { /* no server: stay on demo data */ }
  }
  async function merchantAuth(mode, fd) {
    try {
      const r = await api("/api/auth/" + mode, { method: "POST", body: JSON.stringify(
        mode === "register" ? { store_name: fd.name, email: fd.email, password: fd.pw } : { email: fd.email, password: fd.pw }) });
      if (r.user.role !== "merchant") return toast("استخدم لوحة الإدارة لحسابات المسؤولين");
      S.merchant = { name: r.user.name, email: r.user.email, token: r.token }; persist();
      await loadMine();
      toast("مرحباً " + r.user.name); S.history = [{ name: "account", params: {} }]; go("dashboard", {}, false);
    } catch (e) { toast(e.message); }
  }
  async function submitOffer(fd) {
    try {
      await api("/api/merchant/offers", { method: "POST", body: JSON.stringify({
        product_name_ar: fd.name, category: fd.cat, price: fd.price, old_price: fd.old,
        starts_on: fd.from, ends_on: fd.until, emirates: [fd.branches] }) });
      await loadMine();
      toast("أُرسل العرض للمراجعة"); back();
    } catch (e) { toast(e.message); }
  }
  const SOURCE_AR = { flyer: "نشرة عروض المتجر", admin: "موقع المتجر", feed: "بيانات المتجر", merchant: "المتجر نفسه", research: "مصدر منشور", demo: "بيانات تجريبية" };
  function sourceLine(p, sid) {
    const o = (p.offers || []).find((x) => x.store_id === sid);
    if (!o) return "";
    const when = o.updated_at ? new Date(o.updated_at.replace(" ", "T") + "Z").toLocaleDateString("ar-AE") : "";
    const link = o.source_url ? ` · <a href="${esc(o.source_url)}" target="_blank" rel="noopener noreferrer">المصدر</a>` : "";
    return `<div>${ic("check", 18)} المصدر: ${SOURCE_AR[o.source_type] || o.source_type}${when ? ` · آخر تحديث ${when}` : ""}${link}</div>`;
  }

  // ---------- screens ----------
  const V = {};

  V.home = () => {
    const featured = products().filter((p) => p.featured).concat(products().slice(0, 4));
    const uniq = [...new Map(featured.map((p) => [p.id, p])).values()];
    const hour = new Date().getHours();
    const hello = hour < 12 ? "صباح الخير" : hour < 18 ? "مساء الخير" : "مساء النور";
    const near = nearbyStores().slice(0, 8);
    return `
    <div class="hero-top">
      <div class="topbar">
        <div class="brand"><div class="mark">${ic("percent", 22)}</div><b>OFFERS</b></div>
        <div style="display:flex;gap:8px">
          <button class="icon-btn" data-tab="compare" aria-label="قارن">${ic("shopping-cart")}</button>
          <button class="icon-btn" data-act="notify" aria-label="الإشعارات">${ic("bell")}<i class="dot"></i></button>
        </div>
      </div>
      <div class="greet">${hello} 👋<b>أفضل العروض حولك اليوم</b></div>
      <button class="loc-chip" data-go="location" style="margin-top:12px">
        <i class="pulse"></i>${ic("map-pin", 18)} ${S.loc ? esc(S.loc.label) : "حدّد موقعك لعروض قريبة"}
        <small>${esc(S.emirate)} ${ic("chevron-down", 14)}</small>
      </button>
      <div class="search">${ic("search", 20)}<input id="q" placeholder="ابحث عن أي منتج أو متجر..." />${ic("scan-line", 20)}</div>
    </div>
    <div class="cats">${D.categories.map((c, i) => `
      <button class="cat rise" style="--i:${i};--tint:${c.bg}" data-cat="${c.id}"><div class="ic">${ic(c.icon, 26)}</div>${c.name}</button>`).join("")}
    </div>
    ${near.length ? `
    <div class="section-h"><h3>${ic("radar", 20)} متاجر قريبة منك</h3><a href="#" data-tab="nearby">الخريطة</a></div>
    <div class="near-strip">${near.map((x, i) => `
      <button class="near-card rise" style="--i:${i}" data-store="${x.s.id}">
        ${slogo(x.s, "sm")}<b>${esc(x.s.name)}</b><small>${esc(x.b.name)}</small>${kmTag(x)}
      </button>`).join("")}</div>` : `
    <button class="card" data-go="location" style="width:100%;display:flex;gap:12px;align-items:center;margin-bottom:16px;text-align:right">
      <span class="go">${ic("locate-fixed")}</span><span><b>اعرض العروض القريبة منك</b><br/><small style="color:var(--muted)">فعّل الموقع أو اختر منطقتك</small></span>
    </button>`}
    <div class="section-h"><h3>${ic("flame", 20)} أبرز العروض اليوم</h3><a href="#" data-cat="all">عرض الكل</a></div>
    <div class="banner-wrap"><div class="banners" id="banners">${D.banners.map((b) => `
      <div class="banner" style="background:linear-gradient(120deg,${b.from},${b.to})">
        <div><h4>${b.title}</h4><small>${b.sub}</small><button class="btn-w" data-cat="${b.cat}">تصفح الآن</button></div>
        <div class="art">${ic(b.icon, 76)}</div>
      </div>`).join("")}</div></div>
    <div class="dots" id="dots">${D.banners.map((_, i) => `<i class="${i ? "" : "on"}"></i>`).join("")}</div>
    <div class="section-h"><h3>${ic("sparkles", 20)} الأكثر توفيراً</h3></div>
    <div class="list">${uniq.sort((a, b) => pct(b) - pct(a)).slice(0, 5).map(pcard).join("")}</div>
    <p class="disclaimer">${!S.live || products().some((p) => (p.offers || []).some((o) => o.source_type === "demo"))
      ? "نسخة تجريبية — الأسعار المعروضة بيانات تجريبية للعرض فقط. مواقع الفروع تقريبية." : "الأسعار من نشرات وعروض المتاجر الرسمية. تحقّق من السعر في المتجر."}</p>`;
  };

  /** Physical stores with their nearest branch, closest first. */
  function nearbyStores(type = "all") {
    return D.stores.filter((s) => type === "all" || s.type === type)
      .map((s) => { const n = nearest(s.id); return n && { s, b: n.branch, d: n.d }; })
      .filter(Boolean).sort((a, b) => a.d - b.d);
  }

  V.nearby = ({ type = "all" }) => {
    if (!S.loc) return `
      ${header("قريب مني")}
      <div class="radar"><div class="sweep"></div><i class="me"></i></div>
      <p class="sheet-note" style="text-align:center">نحتاج موقعك لعرض الفروع والعروض الأقرب إليك.</p>
      <button class="btn" data-act="gps">${ic("locate-fixed", 18)} استخدم موقعي الحالي</button>
      <button class="btn ghost" style="margin-top:8px" data-go="location">اختر منطقتك</button>`;
    const all = [];
    for (const b of D.branches || []) {
      const s = store(b.store);
      if (type !== "all" && s.type !== type) continue;
      all.push({ s, b, d: km(S.loc, b) });
    }
    all.sort((a, b) => a.d - b.d);
    const shown = all.slice(0, 12);
    const onRadar = shown.slice(0, 9);
    // Radar scale: square-root so nearby branches get room; the outer ring is a round number of km.
    const maxD = Math.max(2, ...onRadar.map((x) => x.d));
    const nice = [1, 2, 3, 5, 10, 15, 20, 30, 50, 80, 120, 200].find((v) => v >= maxD) || Math.ceil(maxD);
    const rad = (d) => Math.sqrt(Math.min(1, d / nice)) * 35 + 4; // % of the radar's half-width
    const rings = [nice / 9, nice * 4 / 9, nice].map((d) => ({ d, r: rad(d) }));
    const placed = [];
    const pos = (x) => {
      const dy = (x.b.lat - S.loc.lat) * 111, dx = (x.b.lng - S.loc.lng) * 111 * Math.cos(S.loc.lat * Math.PI / 180);
      let a = Math.atan2(dy, dx), r = rad(x.d), p;
      // nudge around the circle until the pin doesn't sit on top of an earlier one
      for (let k = 0; k < 24; k++) {
        p = { left: 50 + r * Math.cos(a), top: 50 - r * Math.sin(a) };
        if (!placed.some((q) => Math.abs(q.left - p.left) < 13 && Math.abs(q.top - p.top) < 8)) break;
        a += (k % 2 ? -1 : 1) * 0.28 * (k + 1);
      }
      placed.push(p); return p;
    };
    const types = [["all", "الكل"], ["super", "سوبرماركت"], ["electronics", "إلكترونيات"], ["home", "منزل"], ["fashion", "أزياء"]];
    return `
    ${header("قريب مني", { right: `<button class="icon-btn" data-go="location" aria-label="تغيير الموقع">${ic("map-pin")}</button>` })}
    <button class="loc-chip" data-go="location"><i class="pulse"></i>${esc(S.loc.label)}<small>${esc(S.emirate)}</small></button>
    <div class="chips">${types.map(([id, n]) => `<button class="chip ${id === type ? "on" : ""}" data-ntype="${id}">${n}</button>`).join("")}</div>
    <div class="radar" role="img" aria-label="خريطة الفروع القريبة">
      ${rings.map((g) => `<div class="ring" style="width:${g.r * 2}%;height:${g.r * 2}%"><span>${fmtKm(g.d)}</span></div>`).join("")}
      <div class="sweep"></div><i class="me"></i>
      ${onRadar.map((x, i) => { const p = pos(x); return `<button class="pin" style="--i:${i};left:${p.left}%;top:${p.top}%" data-store="${x.s.id}" aria-label="${esc(x.s.name)} ${esc(x.b.name)}">${slogo(x.s, "sm")}</button>`; }).join("")}
    </div>
    <div class="section-h"><h3>${ic("route", 20)} الأقرب إليك</h3></div>
    <div class="list">${shown.map((x, i) => {
      const count = products().filter((p) => p.prices[x.s.id] != null).length;
      return `<div class="srow rise" style="--i:${Math.min(i, 8)};cursor:pointer" data-store="${x.s.id}">
        ${slogo(x.s)}
        <div class="grow"><h5>${esc(x.s.name)}</h5><small>${esc(x.b.name)} · ${count} عرض</small><br/>${kmTag(x)}</div>
        <a class="go" href="${mapsUrl(x.b)}" target="_blank" rel="noopener noreferrer" aria-label="الاتجاهات">${ic("navigation", 18)}</a>
      </div>`; }).join("") || `<div class="empty"><div>${ic("store", 48)}</div>لا توجد فروع من هذا النوع</div>`}</div>
    <p class="disclaimer">مواقع الفروع تقريبية. اضغط على السهم لفتح الاتجاهات في خرائط Google.</p>`;
  };

  V.location = () => `
    ${header("موقعك")}
    <p class="sheet-note">نستخدم موقعك فقط لترتيب الفروع والعروض حسب القرب منك، ولا نحفظه إلا على جهازك.</p>
    <button class="btn" data-act="gps">${ic("locate-fixed", 18)} استخدم موقعي الحالي</button>
    <div class="section-h" style="margin-top:18px"><h3>أو اختر منطقتك</h3></div>
    <div class="area-list">${D.areas.map((a, i) => `
      <button class="area rise ${S.loc && S.loc.label === a.name ? "on" : ""}" style="--i:${Math.min(i, 8)}" data-area="${i}">
        <b>${a.name}</b><small>${a.emirate}</small></button>`).join("")}</div>`;

  V.category = ({ cat = "all", sub = null, q = "", sort = "discount" }) => {
    const c = D.categories.find((x) => x.id === cat) || D.categories[0];
    let list = products().filter((p) => (cat === "all" || cat === "more" || p.cat === cat) && (!sub || p.sub === sub));
    if (q) list = products().filter((p) => p.name.includes(q) || Object.keys(p.prices).some((s) => store(s).name.includes(q)));
    const dist = (p) => Math.min(...Object.keys(p.prices).map((sid) => nearest(sid)?.d ?? (ONLINE.has(sid) ? 999 : 9999)));
    const sorter = { discount: (a, b) => pct(b) - pct(a), low: (a, b) => best(a).price - best(b).price, high: (a, b) => best(b).price - best(a).price, near: (a, b) => dist(a) - dist(b) };
    list.sort(sorter[sort]);
    const subs = D.subCategories[cat];
    return `
    ${header(q ? `نتائج: ${esc(q)}` : c.name)}
    ${subs ? `<div class="cats">
      <button class="cat ${!sub ? "active" : ""}" data-sub=""><div class="ic" style="--tint:#ede9fe">${ic("layout-grid", 24)}</div>الكل</button>
      ${subs.map((s) => `<button class="cat ${sub === s.id ? "active" : ""}" data-sub="${s.id}"><div class="ic" style="--tint:#dcfce7">${ic(s.icon, 24)}</div>${s.name}</button>`).join("")}
    </div>` : `<div class="chips">${D.categories.filter((x) => x.id !== "more").map((x) => `<button class="chip ${x.id === cat ? "on" : ""}" data-cat="${x.id}">${x.name}</button>`).join("")}</div>`}
    <div class="toolbar">
      <select id="sort">
        <option value="discount" ${sort === "discount" ? "selected" : ""}>الترتيب: الأعلى خصماً</option>
        <option value="low" ${sort === "low" ? "selected" : ""}>السعر: من الأقل</option>
        <option value="high" ${sort === "high" ? "selected" : ""}>السعر: من الأعلى</option>
        ${S.loc ? `<option value="near" ${sort === "near" ? "selected" : ""}>الأقرب إليّ</option>` : ""}
      </select>
    </div>
    <div class="list">${list.length ? list.map(pcard).join("") : `<div class="empty"><div>${ic("search", 48)}</div>لا توجد عروض مطابقة</div>`}</div>`;
  };

  V.product = ({ id }) => {
    const p = product(id); if (!p) return V.home();
    const b = best(p), fav = S.favs.includes(p.id);
    const rows = Object.entries(p.prices).sort((a, c) => a[1] - c[1]);
    const similar = products().filter((x) => x.cat === p.cat && x.id !== p.id).slice(0, 6);
    return `
    ${header("", { right: `<button class="icon-btn heart ${fav ? "on" : ""}" data-fav="${p.id}">${ic("heart")}</button>` })}
    <div class="detail">
      <div class="hero">${pimg(p, 110)}<span class="badge">خصم ${pct(p)}%</span></div>
      <h2>${esc(p.name)}</h2>
      <div class="store" style="color:var(--muted);margin:4px 0 8px">${store(b.store).name}</div>
      <div class="price"><b class="countup" data-to="${b.price}">${aed(b.price)}</b><s>${aed(p.old)}</s></div>
      ${p.old > b.price ? `<span class="save-pill">${ic("sparkles", 14)} توفّر ${aed(Math.round((p.old - b.price) * 100) / 100)}</span>` : ""}
      <div class="infobox">
        <div>${ic("calendar", 18)} ${p.until ? `يسري العرض حتى: ${fmtDate(p.until)}` : "عرض مستمر"}</div>
        <div>${ic("map-pin", 18)} ${(() => { const n = nearest(b.store); return n ? `أقرب فرع: ${esc(store(b.store).name)} ${esc(n.branch.name)} · ${fmtKm(n.d)} · <a href="${mapsUrl(n.branch)}" target="_blank" rel="noopener noreferrer">الاتجاهات</a>` : `جميع فروع ${esc(S.emirate)}`; })()}</div>
        <div>${ic("shopping-bag", 18)} متوفر في الفروع أو عبر المتجر الإلكتروني</div>
        ${sourceLine(p, b.store)}
      </div>
      <div class="section-h"><h3>الأسعار في المتاجر</h3></div>
      <div class="store-prices">${rows.map(([sid, v], i) => { const n = nearest(sid); return `
        <div class="row ${i ? "" : "best"}">
          <span class="sname">${slogo(store(sid), "sm")}<span class="meta"><span>${store(sid).name}${i ? "" : '<span class="tag">الأرخص</span>'}</span>
            <small>${n ? `${esc(n.branch.name)} · ${fmtKm(n.d)}` : ONLINE.has(sid) ? "توصيل للمنزل" : ""}</small></span></span>
          <span class="end"><b>${aed(v)}</b>${n ? `<a class="go" href="${mapsUrl(n.branch)}" target="_blank" rel="noopener noreferrer" aria-label="الاتجاهات">${ic("navigation", 16)}</a>` : ""}</span>
        </div>`; }).join("")}
      </div>
      <div style="display:flex;gap:8px">
        <button class="btn" data-cart="${p.id}">${ic(S.cart[p.id] ? "check" : "plus", 18)} ${S.cart[p.id] ? "في قائمة المقارنة" : "أضف لقائمة المقارنة"}</button>
        <button class="btn ghost" style="width:auto" data-act="share">${ic("share-2", 20)}</button>
      </div>
      <button class="btn ghost" style="margin-top:8px" data-store="${b.store}">زيارة صفحة المتجر</button>
      ${similar.length ? `<div class="section-h" style="margin-top:18px"><h3>منتجات مشابهة</h3></div><div class="hscroll">${similar.map(mini).join("")}</div>` : ""}
    </div>`;
  };

  V.stores = ({ type = "all", q = "" }) => {
    const types = [["all", "الكل"], ["super", "سوبرماركت"], ["online", "أونلاين"], ["electronics", "إلكترونيات"], ["fashion", "أزياء"], ["home", "منزل"]];
    const list = D.stores.filter((s) => (type === "all" || s.type === type) && (!q || s.name.includes(q)))
      .sort((a, b) => (nearest(a.id)?.d ?? 1e4) - (nearest(b.id)?.d ?? 1e4));
    return `
    <div class="topbar"><span class="icon-btn"></span><h1>المتاجر</h1><span class="icon-btn"></span></div>
    <div class="search">${ic("search", 20)}<input id="sq" value="${esc(q)}" placeholder="ابحث عن متجر..." /></div>
    <div class="chips">${types.map(([id, n]) => `<button class="chip ${id === type ? "on" : ""}" data-stype="${id}">${n}</button>`).join("")}</div>
    <div class="list">${list.map((s) => `
      <div class="srow" data-store="${s.id}">
        ${slogo(s)}
        <div class="grow"><h5>${s.name}</h5><small>${s.offers} عرض${nearest(s.id) ? ` · ${esc(nearest(s.id).branch.name)}` : ONLINE.has(s.id) ? " · أونلاين" : ""}</small> ${kmTag(nearest(s.id))}</div>
        <button class="heart ${S.favStores.includes(s.id) ? "on" : ""}" data-favstore="${s.id}">${ic("heart", 20)}</button>
        <span style="color:var(--muted)">${ic("chevron-left", 18)}</span>
      </div>`).join("")}</div>`;
  };

  V.store = ({ id }) => {
    const s = store(id);
    const list = products().filter((p) => p.prices[id] != null);
    return `
    ${header(s.name)}
    <div class="srow" style="margin-bottom:12px">${slogo(s)}<div class="grow"><h5>${s.name}</h5><small>${s.offers} عرض في ${S.emirate}</small></div></div>
    ${(() => {
      const br = (D.branches || []).filter((b) => b.store === id).map((b) => ({ b, d: S.loc ? km(S.loc, b) : null })).sort((a, c) => (a.d ?? 0) - (c.d ?? 0)).slice(0, 4);
      return br.length ? `<div class="near-strip">${br.map((x) => `<a class="near-card" href="${mapsUrl(x.b)}" target="_blank" rel="noopener noreferrer" style="text-decoration:none;color:inherit">
        <b>${esc(x.b.name)}</b><small>${esc(x.b.emirate)}</small>${x.d != null ? kmTag(x) : ""}<span class="link">${ic("navigation", 12)} الاتجاهات</span></a>`).join("")}</div>` : "";
    })()}
    <div class="list">${list.map(pcard).join("") || `<div class="empty"><div>${ic("tag", 48)}</div>لا توجد عروض حالياً</div>`}</div>`;
  };

  V.favs = () => {
    const list = products().filter((p) => S.favs.includes(p.id));
    const st = D.stores.filter((s) => S.favStores.includes(s.id));
    return `
    <div class="topbar"><span class="icon-btn"></span><h1>المفضلة</h1><span class="icon-btn"></span></div>
    ${st.length ? `<div class="section-h"><h3>متاجري</h3></div><div class="hscroll" style="margin-bottom:12px">${st.map((s) => `<div data-store="${s.id}">${slogo(s)}</div>`).join("")}</div>` : ""}
    <div class="list">${list.map(pcard).join("") || `<div class="empty"><div>${ic("heart", 48)}</div>اضغط على القلب لحفظ العروض هنا</div>`}</div>`;
  };

  function burst() {
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const el = document.createElement("div"); el.className = "burst";
    const colors = ["#ff9a2e", "#f2456b", "#7c3aed", "#10b981", "#fbbf24"];
    el.innerHTML = Array.from({ length: 28 }, (_, i) => `<i style="background:${colors[i % 5]};--x:${(Math.random() - .5) * 360}px;--y:${-120 - Math.random() * 260}px;--r:${Math.random() * 720}deg"></i>`).join("");
    document.querySelector(".app").appendChild(el); setTimeout(() => el.remove(), 1300);
  }

  V.compare = ({ mode = "all" }) => {
    const ids = Object.keys(S.cart).filter(product);
    if (!ids.length) return `
      <div class="topbar"><span class="icon-btn"></span><h1>مقارنة الأسعار</h1><span class="icon-btn"></span></div>
      <div class="empty"><div>${ic("shopping-cart", 48)}</div>أضف منتجات بالضغط على <b>+</b> لمقارنة سعر سلتك في كل المتاجر</div>
      <button class="btn" data-cat="all">تصفح العروض</button>`;
    const items = ids.map(product);
    const sids = [...new Set(items.flatMap((p) => Object.keys(p.prices)))];
    const totals = sids.map((sid) => {
      let sum = 0, have = 0;
      items.forEach((p) => { if (p.prices[sid] != null) { sum += p.prices[sid] * S.cart[p.id]; have++; } });
      return { sid, sum, have };
    }).sort((a, b) => (b.have - a.have) || (a.sum - b.sum));
    const full = totals.filter((t) => t.have === items.length);
    const bestT = (full[0] || totals[0]);
    // multi-select: cheapest store per item
    let multiSum = 0;
    items.forEach((p) => { multiSum += best(p).price * S.cart[p.id]; });
    const worst = Math.max(...full.map((t) => t.sum), bestT.sum);

    return `
    <div class="topbar"><button class="icon-btn" data-act="clear" title="مسح">${ic("trash-2")}</button><h1>مقارنة الأسعار</h1><span class="icon-btn"></span></div>
    <div class="cmp"><table>
      <thead><tr><th class="prod">المنتجات</th>${totals.map((t) => `
        <th>${slogo(store(t.sid), "th")}
        <span class="avail">${t.have}/${items.length}</span></th>`).join("")}</tr></thead>
      <tbody>${items.map((p) => {
        const cheapest = best(p).store;
        return `<tr><td class="prod"><span class="tiny">${pimg(p, 18)}</span> ${esc(p.name)}<br/>
          <span class="qty"><button data-qty="${p.id}" data-d="-1">−</button>${S.cart[p.id]}<button data-qty="${p.id}" data-d="1">+</button></span></td>
          ${totals.map((t) => {
            const v = p.prices[t.sid];
            if (v == null) return `<td class="na">—</td>`;
            const hl = mode === "multi" ? t.sid === cheapest : t.sid === bestT.sid;
            return `<td class="${hl ? "cheap" : ""}">${(v * S.cart[p.id]).toFixed(2)}</td>`;
          }).join("")}</tr>`;
      }).join("")}</tbody>
      <tfoot><tr><td class="prod">الإجمالي (درهم)</td>${totals.map((t) => `<td class="${t.sid === bestT.sid ? "bestcol" : ""}">${t.sum.toFixed(2)}${t.have < items.length ? "*" : ""}</td>`).join("")}</tr></tfoot>
    </table></div>
    <div class="seg"><button class="${mode === "all" ? "on" : ""}" data-mode="all">متجر واحد</button><button class="${mode === "multi" ? "on" : ""}" data-mode="multi">عدة متاجر</button></div>
    <div class="summary">${mode === "multi"
      ? `أقل تكلفة بالشراء من عدة متاجر<br/><b>${multiSum.toFixed(2)} درهم</b>`
      : `أفضل سعر لسلتك: <b>${store(bestT.sid).name}</b><br/><b>${bestT.sum.toFixed(2)} درهم</b>${worst > bestT.sum ? ` — توفير ${(worst - bestT.sum).toFixed(2)} درهم` : ""}`}
    </div>
    <p class="disclaimer">* المتجر لا يوفر كل المنتجات في السلة</p>`;
  };

  V.account = () => `
    <div class="topbar"><span class="icon-btn"></span><h1>حسابي</h1><span class="icon-btn"></span></div>
    <div class="card" style="margin-bottom:12px">
      <div class="section-h" style="margin-top:0"><h3>المظهر</h3></div>
      <div class="theme-pick">${[["light", "sun", "نهاري"], ["dark", "moon", "ليلي"], ["auto", "sun-moon", "تلقائي"]]
        .map(([id, icon, n]) => `<button class="${S.theme === id ? "on" : ""}" data-theme-set="${id}">${ic(icon)}${n}</button>`).join("")}</div>
    </div>
    <button class="card loc-chip" data-go="location" style="margin-bottom:12px"><i class="pulse"></i>${ic("map-pin", 18)} ${S.loc ? esc(S.loc.label) : "حدّد موقعك"}<small>${esc(S.emirate)}</small></button>
    <div class="card" style="margin-bottom:12px">
      <div class="section-h" style="margin-top:0"><h3>مميزات التطبيق</h3></div>
      ${[["store", "جميع العروض من جميع المتاجر في مكان واحد"], ["map-pin", "تغطية جميع الإمارات"], ["search", "بحث سهل ومتقدم"], ["percent", "عرض نسبة الخصم والسعر السابق"], ["shopping-cart", "مقارنة سعر السلة بين المتاجر"], ["bell", "إشعارات بالعروض الجديدة"], ["heart", "مفضلة العروض والمتاجر"], ["share-2", "مشاركة العروض مع الآخرين"]]
        .map(([i, t]) => `<div class="feat"><span>${ic(i, 18)}</span>${t}</div>`).join("")}
    </div>
    <div class="card">
      <div class="section-h" style="margin-top:0"><h3>هل تملك متجراً؟</h3></div>
      <p style="font-size:13.5px;color:var(--muted);margin-bottom:10px">سجّل متجرك وانشر عروضك لآلاف المتسوقين في الإمارات.</p>
      <button class="btn orange" data-go="${S.merchant ? "dashboard" : "merchantLogin"}">${S.merchant ? "لوحة تحكم المتجر" : "تسجيل المتاجر"}</button>
    </div>`;

  V.merchantLogin = () => `
    ${header("تسجيل المتاجر في أوفرس")}
    <div class="steps">${[["1", "إنشاء حساب تجاري", "#5b21b6"], ["2", "إضافة معلومات المتجر", "#f97316"], ["3", "إضافة العروض والمنتجات", "#16a34a"], ["4", "مراجعة ونشر العروض", "#2563eb"]]
      .map(([n, t, c]) => `<div><i style="background:${c}">${n}</i>${t}</div>`).join("")}</div>
    <form class="form card" id="mform">
      <label>اسم المتجر (للحساب الجديد)<input name="name" placeholder="مثال: متجر تجريبي" /></label>
      <label>البريد الإلكتروني<input name="email" type="email" required placeholder="store@example.com" autocomplete="username" /></label>
      <label>كلمة المرور<input name="pw" type="password" required minlength="${S.live ? 8 : 6}" autocomplete="current-password" /></label>
      <button class="btn" type="submit" value="login">تسجيل دخول المتجر</button>
      <button class="btn ghost" type="submit" value="register">إنشاء حساب جديد</button>
    </form>`;

  V.dashboard = () => {
    if (!S.merchant) return V.merchantLogin();
    const mine = S.live ? S.myOffers : S.custom;
    const statusAr = { pending: "بانتظار المراجعة", approved: "منشور", rejected: "مرفوض" };
    const list = S.live
      ? mine.map((o) => `<div class="srow"><div class="grow"><h5>${esc(o.product)}</h5>
          <small>${aed(o.price)}${o.old_price ? ` بدلاً من ${aed(o.old_price)}` : ""} · حتى ${esc(o.ends_on || "—")}</small></div>
          <span class="state ${o.status}">${statusAr[o.status]}</span></div>`).join("")
      : mine.map(pcard).join("");
    return `
    ${header("لوحة تحكم المتجر")}
    <div class="srow" style="margin-bottom:12px"><div class="slogo" style="--c:var(--primary)">${ic("store", 24)}</div><div class="grow"><h5>${esc(S.merchant.name)}</h5><small>${mine.length} عرض</small></div></div>
    <div class="dash">
      <button data-go="addOffer"><span>${ic("plus")}</span>إضافة عرض جديد</button>
      <button data-act="myoffers"><span>${ic("tag")}</span>إدارة العروض</button>
      <button data-act="soon"><span>${ic("map-pin")}</span>الفروع والمواقع</button>
      <button data-act="soon"><span>${ic("image")}</span>منتجات العروض</button>
      <button data-act="soon"><span>${ic("credit-card")}</span>المدفوعات</button>
      <button data-act="soon"><span>${ic("bar-chart-3")}</span>الإحصائيات</button>
    </div>
    <div id="myoffers" style="margin-top:14px" class="list">${list}</div>
    <button class="btn ghost" style="margin-top:14px" data-act="logout">تسجيل الخروج</button>`;
  };

  V.addOffer = () => `
    ${header("إضافة عرض جديد")}
    <form class="form" id="oform">
      <div class="upload">${ic("camera", 32)}<br/>إضافة صور المنتج<br/><small>(رفع الصور قريباً)</small></div>
      <label>اسم المنتج *<input name="name" required placeholder="مثل: أرز بسمتي 5 كيلو" /></label>
      <label>القسم<select name="cat">${D.categories.filter((c) => !["all", "more"].includes(c.id)).map((c) => `<option value="${c.id}">${c.name}</option>`).join("")}</select></label>
      <div class="two">
        <label>السعر السابق (درهم)<input name="old" type="number" step="0.01" min="0.01" required /></label>
        <label>السعر الجديد (درهم)<input name="price" type="number" step="0.01" min="0.01" required /></label>
      </div>
      <div class="two">
        <label>تاريخ بداية العرض<input name="from" type="date" required /></label>
        <label>تاريخ نهاية العرض<input name="until" type="date" required /></label>
      </div>
      <label>الإمارة<select name="branches"><option value="all">جميع الإمارات</option>${D.emirates.map((e) => `<option>${e}</option>`).join("")}</select></label>
      <button class="btn" type="submit">${S.live ? "إرسال العرض للمراجعة" : "حفظ ونشر العرض"}</button>
    </form>`;

  // ---------- render ----------
  let bannerTimer;
  function render() {
    clearInterval(bannerTimer);
    applyTheme();
    screen.innerHTML = (V[current.name] || V.home)(current.params);
    if (S.dir) { screen.classList.remove("enter-fwd", "enter-back"); void screen.offsetWidth; screen.classList.add("enter-" + S.dir); S.dir = null; }
    renderNav();
    S.pop = null; S.bump = false;
    // price count-up on the product page
    document.querySelectorAll(".countup").forEach((el) => {
      const to = +el.dataset.to, t0 = performance.now(), dur = 700;
      if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
      const step = (t) => { const k = Math.min(1, (t - t0) / dur), e = 1 - Math.pow(1 - k, 3); el.textContent = aed(Math.round(to * e * 100) / 100); if (k < 1) requestAnimationFrame(step); else el.textContent = aed(to); };
      requestAnimationFrame(step);
    });
    if (current.name === "home") {
      let i = 0;
      bannerTimer = setInterval(() => {
        const b = $("#banners"); if (!b) return;
        i = (i + 1) % D.banners.length;
        b.style.transform = `translateX(${i * 100}%)`; // RTL: positive moves to next
        document.querySelectorAll("#dots i").forEach((d, k) => d.classList.toggle("on", k === i));
      }, 3500);
    }
    const today = new Date().toISOString().slice(0, 10);
    const f = $("#oform"); if (f) { f.from.value = today; }
  }

  // ---------- events ----------
  // Missing logo or product photo: drop the image so the badge/icon underneath shows.
  document.addEventListener("error", (e) => { if (e.target.tagName === "IMG") e.target.remove(); }, true);
  document.addEventListener("click", (e) => {
    const t = e.target.closest("[data-tab],[data-cat],[data-sub],[data-open],[data-fav],[data-favstore],[data-cart],[data-store],[data-stype],[data-ntype],[data-area],[data-theme-set],[data-mode],[data-qty],[data-go],[data-act]");
    if (!t) return;
    if (e.target.closest('a[href]:not([href="#"])')) return; // real links (directions, sources) just open
    const ds = t.dataset;
    if (t.tagName === "A") e.preventDefault();

    if (ds.fav) { e.stopPropagation(); const i = S.favs.indexOf(ds.fav); if (i < 0) { S.favs.push(ds.fav); S.pop = ds.fav; S.bump = true; } else S.favs.splice(i, 1); persist(); toast(i < 0 ? "تمت الإضافة للمفضلة" : "تمت الإزالة من المفضلة"); return render(); }
    if (ds.favstore) { e.stopPropagation(); const i = S.favStores.indexOf(ds.favstore); i < 0 ? S.favStores.push(ds.favstore) : S.favStores.splice(i, 1); persist(); return render(); }
    if (ds.cart) { e.stopPropagation(); if (S.cart[ds.cart]) { delete S.cart[ds.cart]; toast("أزيل من قائمة المقارنة"); } else { S.cart[ds.cart] = 1; toast("أضيف لقائمة المقارنة"); } persist(); return render(); }
    if (ds.qty) { const q = (S.cart[ds.qty] || 0) + Number(ds.d); if (q <= 0) delete S.cart[ds.qty]; else S.cart[ds.qty] = q; persist(); return render(); }
    if (ds.tab) { S.history = ds.tab === "home" ? [] : [{ name: "home", params: {} }]; go(ds.tab, {}, false); if (ds.tab === "compare" && Object.keys(S.cart).length > 1) burst(); return; }
    if (ds.cat !== undefined) { const c = ds.cat === "more" ? "all" : ds.cat; return current.name === "category" ? go("category", { ...current.params, cat: c, sub: null, q: "" }, false) : go("category", { cat: c }); }
    if (ds.sub !== undefined) return go("category", { ...current.params, sub: ds.sub || null }, false);
    if (ds.open) return go("product", { id: ds.open });
    if (ds.store) return go("store", { id: ds.store });
    if (ds.stype) return go("stores", { type: ds.stype }, false);
    if (ds.ntype) return go("nearby", { type: ds.ntype }, false);
    if (ds.area !== undefined) { const a = D.areas[+ds.area]; setLoc({ lat: a.lat, lng: a.lng, label: a.name, source: "area" }); toast("الموقع: " + a.name); return back(); }
    if (ds.themeSet) { S.theme = ds.themeSet; persist(); return render(); }
    if (ds.mode) return go("compare", { mode: ds.mode }, false);
    if (ds.go) return go(ds.go);
    switch (ds.act) {
      case "back": return back();
      case "gps": return useGps();
      case "notify": return toast("ستصلك إشعارات بالعروض الجديدة في " + S.emirate);
      case "share": {
        const p = product(current.params.id);
        const text = `${p.name} بسعر ${aed(best(p).price)} بدلاً من ${aed(p.old)} — عبر تطبيق أوفرس`;
        if (navigator.share) navigator.share({ title: "OFFERS", text }).catch(() => {});
        else navigator.clipboard?.writeText(text).then(() => toast("تم نسخ العرض للمشاركة"), () => toast(text));
        return;
      }
      case "clear": S.cart = {}; persist(); return render();
      case "logout": if (S.merchant?.token) api("/api/auth/logout", { method: "POST" }).catch(() => {}); S.merchant = null; S.myOffers = []; persist(); S.history = []; return go("account", {}, false);
      case "myoffers": return $("#myoffers")?.scrollIntoView({ behavior: "smooth" });
      case "soon": return toast("قريباً في النسخة الكاملة");
    }
  });

  document.addEventListener("change", (e) => {
    if (e.target.id === "emirate") { S.emirate = e.target.value; persist(); toast("تم اختيار " + S.emirate); if (S.live) loadLive().then(render); }
    if (e.target.id === "sort") go("category", { ...current.params, sort: e.target.value }, false);
  });

  document.addEventListener("keydown", (e) => {
    if (e.key !== "Enter") return;
    if (e.target.id === "q" && e.target.value.trim()) go("category", { cat: "all", q: e.target.value.trim() });
  });
  document.addEventListener("input", (e) => {
    if (e.target.id === "sq") {
      const v = e.target.value; go("stores", { ...current.params, q: v }, false);
      const el = $("#sq"); el.focus(); el.setSelectionRange(v.length, v.length);
    }
  });

  document.addEventListener("submit", (e) => {
    e.preventDefault();
    const f = e.target, fd = Object.fromEntries(new FormData(f));
    if (f.id === "mform" && S.live) return merchantAuth(e.submitter?.value === "register" ? "register" : "login", fd);
    if (f.id === "mform") { S.merchant = { name: fd.name || fd.email, email: fd.email }; persist(); toast("مرحباً " + S.merchant.name); S.history = [{ name: "account", params: {} }]; return go("dashboard", {}, false); }
    if (f.id === "oform" && S.live) return submitOffer(fd);
    if (f.id === "oform") {
      const old = +fd.old, price = +fd.price;
      if (price >= old) return toast("السعر الجديد يجب أن يكون أقل من السابق");
      if (fd.until < fd.from) return toast("تاريخ النهاية قبل تاريخ البداية");
      const sid = "m_" + S.merchant.name;
      if (!D.stores.find((s) => s.id === sid)) D.stores.push({ id: sid, name: S.merchant.name, en: S.merchant.name, color: "#5b21b6", type: "super", offers: 0 });
      const cat = D.categories.find((c) => c.id === fd.cat);
      S.custom.push({ id: "c" + Date.now(), name: fd.name, cat: fd.cat, sub: null, icon: cat ? cat.icon : "tag", old, prices: { [sid]: price }, until: fd.until, featured: true });
      persist(); toast("تم نشر العرض"); back();
    }
  });

  // restore merchant store records
  if (S.merchant) D.stores.push({ id: "m_" + S.merchant.name, name: S.merchant.name, en: S.merchant.name, color: "#5b21b6", type: "super", offers: S.custom.length });

  render();
  setTimeout(() => $("#splash").classList.add("hide"), 2300);
  boot();
})();
