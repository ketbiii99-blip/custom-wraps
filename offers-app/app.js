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
    custom: load("custom", []),      // merchant-added offers
    merchant: load("merchant", null),
    history: [],
  };
  const persist = () => { ["emirate", "favs", "favStores", "cart", "custom", "merchant"].forEach((k) => save(k, S[k])); };

  // ---------- helpers ----------
  const products = () => D.products.concat(S.custom);
  const store = (id) => D.stores.find((s) => s.id === id) || { id, name: id, short: "?", color: "#64748b" };
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

  function toast(msg) {
    const t = $("#toast"); t.textContent = msg; t.classList.add("show");
    clearTimeout(toast.t); toast.t = setTimeout(() => t.classList.remove("show"), 1800);
  }

  // ---------- router ----------
  let current = { name: "home", params: {} };
  function go(name, params = {}, push = true) {
    if (push) S.history.push(current);
    current = { name, params };
    render();
    screen.scrollTop = 0;
  }
  function back() { current = S.history.pop() || { name: "home", params: {} }; render(); }

  const tabs = [
    { id: "home", label: "الرئيسية", icon: "🏠" },
    { id: "stores", label: "المتاجر", icon: "🏬" },
    { id: "favs", label: "المفضلة", icon: "❤️" },
    { id: "compare", label: "قارن", icon: "🛒" },
    { id: "account", label: "حسابي", icon: "👤" },
  ];
  function renderNav() {
    const n = Object.keys(S.cart).length;
    $("#nav").innerHTML = tabs.map((t) => `
      <button class="${current.name === t.id ? "on" : ""}" data-tab="${t.id}">
        <span>${t.icon}</span>${t.label}${t.id === "compare" && n ? `<em class="count">${n}</em>` : ""}
      </button>`).join("");
  }

  // ---------- components ----------
  const header = (title, opts = {}) => `
    <div class="topbar">
      <button class="icon-btn" data-act="back" aria-label="رجوع">→</button>
      <h1>${title}</h1>
      ${opts.right || `<span class="icon-btn"></span>`}
    </div>`;

  function pcard(p) {
    const b = best(p);
    const fav = S.favs.includes(p.id), inCart = !!S.cart[p.id];
    return `
    <div class="pcard" data-open="${p.id}">
      <div class="pimg">${p.emoji}<span class="badge">خصم ${pct(p)}%</span></div>
      <div class="pinfo">
        <h5>${esc(p.name)}</h5>
        <div class="store">${store(b.store).name}${Object.keys(p.prices).length > 1 ? ` · ${Object.keys(p.prices).length} متاجر` : ""}</div>
        <div class="price"><b>${aed(b.price)}</b><s>${aed(p.old)}</s></div>
      </div>
      <div class="pact">
        <button class="heart ${fav ? "on" : ""}" data-fav="${p.id}" aria-label="مفضلة">${fav ? "♥" : "♡"}</button>
        <button class="plus ${inCart ? "added" : ""}" data-cart="${p.id}" aria-label="أضف للمقارنة">${inCart ? "✓" : "+"}</button>
      </div>
    </div>`;
  }
  const mini = (p) => `
    <div class="mini" data-open="${p.id}">
      <div class="pimg">${p.emoji}<span class="badge">-${pct(p)}%</span></div>
      <h6>${esc(p.name)}</h6><b>${aed(best(p).price)}</b>
    </div>`;
  const slogo = (s) => `<div class="slogo" style="background:${s.color}">${s.short}</div>`;

  // ---------- screens ----------
  const V = {};

  V.home = () => {
    const featured = products().filter((p) => p.featured).concat(products().slice(0, 4));
    const uniq = [...new Map(featured.map((p) => [p.id, p])).values()];
    return `
    <div class="topbar">
      <div class="brand"><div class="mark">%</div><b>OFFERS</b></div>
      <button class="icon-btn" data-act="notify" aria-label="الإشعارات">🔔<i class="dot"></i></button>
    </div>
    <label class="select">📍
      <select id="emirate">${D.emirates.map((e) => `<option ${e === S.emirate ? "selected" : ""}>${e}</option>`).join("")}</select>
    </label>
    <div class="search">🔍<input id="q" placeholder="ابحث عن أي منتج أو متجر..." /><span>⌗</span></div>
    <div class="cats">${D.categories.map((c) => `
      <button class="cat" data-cat="${c.id}"><div class="ic" style="background:${c.bg}">${c.icon}</div>${c.name}</button>`).join("")}
    </div>
    <div class="section-h"><h3>أبرز العروض اليوم</h3><a href="#" data-cat="all">عرض الكل</a></div>
    <div class="banner-wrap"><div class="banners" id="banners">${D.banners.map((b) => `
      <div class="banner" style="background:linear-gradient(120deg,${b.from},${b.to})">
        <div><h4>${b.title}</h4><small>${b.sub}</small><button class="btn-w" data-cat="${b.cat}">تصفح الآن</button></div>
        <div class="art">${b.emoji}</div>
      </div>`).join("")}</div></div>
    <div class="dots" id="dots">${D.banners.map((_, i) => `<i class="${i ? "" : "on"}"></i>`).join("")}</div>
    <div class="section-h"><h3>الأكثر توفيراً</h3></div>
    <div class="list">${uniq.sort((a, b) => pct(b) - pct(a)).slice(0, 5).map(pcard).join("")}</div>
    <p class="disclaimer">نسخة تجريبية — جميع الأسعار والعروض بيانات وهمية للعرض فقط.</p>`;
  };

  V.category = ({ cat = "all", sub = null, q = "", sort = "discount" }) => {
    const c = D.categories.find((x) => x.id === cat) || D.categories[0];
    let list = products().filter((p) => (cat === "all" || cat === "more" || p.cat === cat) && (!sub || p.sub === sub));
    if (q) list = products().filter((p) => p.name.includes(q) || Object.keys(p.prices).some((s) => store(s).name.includes(q)));
    const sorter = { discount: (a, b) => pct(b) - pct(a), low: (a, b) => best(a).price - best(b).price, high: (a, b) => best(b).price - best(a).price };
    list.sort(sorter[sort]);
    const subs = D.subCategories[cat];
    return `
    ${header(q ? `نتائج: ${esc(q)}` : c.name)}
    ${subs ? `<div class="cats">
      <button class="cat ${!sub ? "active" : ""}" data-sub=""><div class="ic" style="background:#ede9fe">🔲</div>الكل</button>
      ${subs.map((s) => `<button class="cat ${sub === s.id ? "active" : ""}" data-sub="${s.id}"><div class="ic" style="background:#f3f4f6">${s.icon}</div>${s.name}</button>`).join("")}
    </div>` : `<div class="chips">${D.categories.filter((x) => x.id !== "more").map((x) => `<button class="chip ${x.id === cat ? "on" : ""}" data-cat="${x.id}">${x.name}</button>`).join("")}</div>`}
    <div class="toolbar">
      <select id="sort">
        <option value="discount" ${sort === "discount" ? "selected" : ""}>الترتيب: الأعلى خصماً</option>
        <option value="low" ${sort === "low" ? "selected" : ""}>السعر: من الأقل</option>
        <option value="high" ${sort === "high" ? "selected" : ""}>السعر: من الأعلى</option>
      </select>
    </div>
    <div class="list">${list.length ? list.map(pcard).join("") : `<div class="empty"><div>🔎</div>لا توجد عروض مطابقة</div>`}</div>`;
  };

  V.product = ({ id }) => {
    const p = product(id); if (!p) return V.home();
    const b = best(p), fav = S.favs.includes(p.id);
    const rows = Object.entries(p.prices).sort((a, c) => a[1] - c[1]);
    const similar = products().filter((x) => x.cat === p.cat && x.id !== p.id).slice(0, 6);
    return `
    ${header("", { right: `<button class="icon-btn heart ${fav ? "on" : ""}" data-fav="${p.id}">${fav ? "♥" : "♡"}</button>` })}
    <div class="detail">
      <div class="hero">${p.emoji}<span class="badge">خصم ${pct(p)}%</span></div>
      <h2>${esc(p.name)}</h2>
      <div class="store" style="color:var(--muted);margin:4px 0 8px">${store(b.store).name}</div>
      <div class="price"><b>${aed(b.price)}</b><s>${aed(p.old)}</s></div>
      <div class="infobox">
        <div>📅 يسري العرض حتى: ${fmtDate(p.until)}</div>
        <div>📍 جميع فروع ${S.emirate}</div>
        <div>🛍️ متوفر في الفروع أو عبر المتجر الإلكتروني</div>
      </div>
      <div class="section-h"><h3>الأسعار في المتاجر</h3></div>
      <div class="store-prices">${rows.map(([sid, v], i) => `
        <div class="row ${i ? "" : "best"}"><span>${store(sid).name}${i ? "" : '<span class="tag">الأرخص</span>'}</span><b>${aed(v)}</b></div>`).join("")}
      </div>
      <div style="display:flex;gap:8px">
        <button class="btn" data-cart="${p.id}">${S.cart[p.id] ? "✓ في قائمة المقارنة" : "＋ أضف لقائمة المقارنة"}</button>
        <button class="btn ghost" style="width:auto" data-act="share">↗</button>
      </div>
      <button class="btn ghost" style="margin-top:8px" data-store="${b.store}">زيارة صفحة المتجر</button>
      ${similar.length ? `<div class="section-h" style="margin-top:18px"><h3>منتجات مشابهة</h3></div><div class="hscroll">${similar.map(mini).join("")}</div>` : ""}
    </div>`;
  };

  V.stores = ({ type = "all", q = "" }) => {
    const types = [["all", "الكل"], ["super", "سوبرماركت"], ["electronics", "إلكترونيات"], ["fashion", "أزياء"], ["home", "منزل"]];
    const list = D.stores.filter((s) => (type === "all" || s.type === type) && (!q || s.name.includes(q)));
    return `
    <div class="topbar"><span class="icon-btn"></span><h1>المتاجر</h1><span class="icon-btn"></span></div>
    <div class="search">🔍<input id="sq" value="${esc(q)}" placeholder="ابحث عن متجر..." /></div>
    <div class="chips">${types.map(([id, n]) => `<button class="chip ${id === type ? "on" : ""}" data-stype="${id}">${n}</button>`).join("")}</div>
    <div class="list">${list.map((s) => `
      <div class="srow" data-store="${s.id}">
        ${slogo(s)}
        <div class="grow"><h5>${s.name}</h5><small>${s.offers} عرض</small></div>
        <button class="heart ${S.favStores.includes(s.id) ? "on" : ""}" data-favstore="${s.id}">${S.favStores.includes(s.id) ? "♥" : "♡"}</button>
        <span style="color:#9ca3af">‹</span>
      </div>`).join("")}</div>`;
  };

  V.store = ({ id }) => {
    const s = store(id);
    const list = products().filter((p) => p.prices[id] != null);
    return `
    ${header(s.name)}
    <div class="srow" style="margin-bottom:12px">${slogo(s)}<div class="grow"><h5>${s.name}</h5><small>${s.offers} عرض في ${S.emirate}</small></div></div>
    <div class="list">${list.map(pcard).join("") || `<div class="empty"><div>🏷️</div>لا توجد عروض حالياً</div>`}</div>`;
  };

  V.favs = () => {
    const list = products().filter((p) => S.favs.includes(p.id));
    const st = D.stores.filter((s) => S.favStores.includes(s.id));
    return `
    <div class="topbar"><span class="icon-btn"></span><h1>المفضلة</h1><span class="icon-btn"></span></div>
    ${st.length ? `<div class="section-h"><h3>متاجري</h3></div><div class="hscroll" style="margin-bottom:12px">${st.map((s) => `<div data-store="${s.id}">${slogo(s)}</div>`).join("")}</div>` : ""}
    <div class="list">${list.map(pcard).join("") || `<div class="empty"><div>♡</div>اضغط على القلب لحفظ العروض هنا</div>`}</div>`;
  };

  V.compare = ({ mode = "all" }) => {
    const ids = Object.keys(S.cart).filter(product);
    if (!ids.length) return `
      <div class="topbar"><span class="icon-btn"></span><h1>مقارنة الأسعار</h1><span class="icon-btn"></span></div>
      <div class="empty"><div>🛒</div>أضف منتجات بالضغط على <b>+</b> لمقارنة سعر سلتك في كل المتاجر</div>
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
    <div class="topbar"><button class="icon-btn" data-act="clear" title="مسح">🗑️</button><h1>مقارنة الأسعار</h1><span class="icon-btn"></span></div>
    <div class="cmp"><table>
      <thead><tr><th class="prod">المنتجات</th>${totals.map((t) => `
        <th><div class="slogo" style="width:60px;height:30px;font-size:12px;margin:auto;background:${store(t.sid).color}">${store(t.sid).short}</div>
        <span class="avail">${t.have}/${items.length}</span></th>`).join("")}</tr></thead>
      <tbody>${items.map((p) => {
        const cheapest = best(p).store;
        return `<tr><td class="prod">${p.emoji} ${esc(p.name)}<br/>
          <span class="qty"><button data-qty="${p.id}" data-d="-1">−</button>${S.cart[p.id]}<button data-qty="${p.id}" data-d="1">+</button></span></td>
          ${totals.map((t) => {
            const v = p.prices[t.sid];
            if (v == null) return `<td class="na">—</td>`;
            const hl = mode === "multi" ? t.sid === cheapest : t.sid === bestT.sid;
            return `<td class="${hl ? "cheap" : ""}">${(v * S.cart[p.id]).toFixed(2)}${hl ? " ✓" : ""}</td>`;
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
      <div class="section-h" style="margin-top:0"><h3>مميزات التطبيق</h3></div>
      ${[["🏬", "جميع العروض من جميع المتاجر في مكان واحد"], ["📍", "تغطية جميع الإمارات"], ["🔍", "بحث سهل ومتقدم"], ["%", "عرض نسبة الخصم والسعر السابق"], ["🛒", "مقارنة سعر السلة بين المتاجر"], ["🔔", "إشعارات بالعروض الجديدة"], ["❤️", "مفضلة العروض والمتاجر"], ["↗", "مشاركة العروض مع الآخرين"]]
        .map(([i, t]) => `<div class="feat"><span>${i}</span>${t}</div>`).join("")}
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
      <label>اسم المتجر<input name="name" required placeholder="مثال: متجر تجريبي" /></label>
      <label>البريد الإلكتروني<input name="email" type="email" required placeholder="store@example.com" /></label>
      <label>كلمة المرور<input name="pw" type="password" required minlength="6" /></label>
      <button class="btn" type="submit">تسجيل دخول المتجر</button>
      <button class="btn ghost" type="submit">إنشاء حساب جديد</button>
    </form>`;

  V.dashboard = () => {
    if (!S.merchant) return V.merchantLogin();
    const mine = S.custom;
    return `
    ${header("لوحة تحكم المتجر")}
    <div class="srow" style="margin-bottom:12px"><div class="slogo" style="background:var(--primary)">🏪</div><div class="grow"><h5>${esc(S.merchant.name)}</h5><small>${mine.length} عرض منشور</small></div></div>
    <div class="dash">
      <button data-go="addOffer"><span>➕</span>إضافة عرض جديد</button>
      <button data-act="myoffers"><span>🏷️</span>إدارة العروض</button>
      <button data-act="soon"><span>📍</span>الفروع والمواقع</button>
      <button data-act="soon"><span>🖼️</span>منتجات العروض</button>
      <button data-act="soon"><span>🗓️</span>المدفوعات</button>
      <button data-act="soon"><span>📊</span>الإحصائيات</button>
    </div>
    <div id="myoffers" style="margin-top:14px" class="list">${mine.map(pcard).join("")}</div>
    <button class="btn ghost" style="margin-top:14px" data-act="logout">تسجيل الخروج</button>`;
  };

  V.addOffer = () => `
    ${header("إضافة عرض جديد")}
    <form class="form" id="oform">
      <div class="upload">📷<br/>إضافة صور المنتج<br/><small>(سيتم دعم رفع الصور مع الخادم)</small></div>
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
      <label>اختيار الفروع<select name="branches"><option>جميع الفروع</option>${D.emirates.map((e) => `<option>${e}</option>`).join("")}</select></label>
      <button class="btn" type="submit">حفظ ونشر العرض</button>
    </form>`;

  // ---------- render ----------
  let bannerTimer;
  function render() {
    clearInterval(bannerTimer);
    screen.innerHTML = (V[current.name] || V.home)(current.params);
    renderNav();
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
  document.addEventListener("click", (e) => {
    const t = e.target.closest("[data-tab],[data-cat],[data-sub],[data-open],[data-fav],[data-favstore],[data-cart],[data-store],[data-stype],[data-mode],[data-qty],[data-go],[data-act]");
    if (!t) return;
    const ds = t.dataset;
    if (t.tagName === "A") e.preventDefault();

    if (ds.fav) { e.stopPropagation(); const i = S.favs.indexOf(ds.fav); i < 0 ? S.favs.push(ds.fav) : S.favs.splice(i, 1); persist(); toast(i < 0 ? "تمت الإضافة للمفضلة" : "تمت الإزالة من المفضلة"); return render(); }
    if (ds.favstore) { e.stopPropagation(); const i = S.favStores.indexOf(ds.favstore); i < 0 ? S.favStores.push(ds.favstore) : S.favStores.splice(i, 1); persist(); return render(); }
    if (ds.cart) { e.stopPropagation(); if (S.cart[ds.cart]) { delete S.cart[ds.cart]; toast("أزيل من قائمة المقارنة"); } else { S.cart[ds.cart] = 1; toast("أضيف لقائمة المقارنة 🛒"); } persist(); return render(); }
    if (ds.qty) { const q = (S.cart[ds.qty] || 0) + Number(ds.d); if (q <= 0) delete S.cart[ds.qty]; else S.cart[ds.qty] = q; persist(); return render(); }
    if (ds.tab) { S.history = []; return go(ds.tab, {}, false); }
    if (ds.cat !== undefined) { const c = ds.cat === "more" ? "all" : ds.cat; return current.name === "category" ? go("category", { ...current.params, cat: c, sub: null, q: "" }, false) : go("category", { cat: c }); }
    if (ds.sub !== undefined) return go("category", { ...current.params, sub: ds.sub || null }, false);
    if (ds.open) return go("product", { id: ds.open });
    if (ds.store) return go("store", { id: ds.store });
    if (ds.stype) return go("stores", { type: ds.stype }, false);
    if (ds.mode) return go("compare", { mode: ds.mode }, false);
    if (ds.go) return go(ds.go);
    switch (ds.act) {
      case "back": return back();
      case "notify": return toast("ستصلك إشعارات بالعروض الجديدة في " + S.emirate);
      case "share": {
        const p = product(current.params.id);
        const text = `${p.name} بسعر ${aed(best(p).price)} بدلاً من ${aed(p.old)} — عبر تطبيق أوفرس`;
        if (navigator.share) navigator.share({ title: "OFFERS", text }).catch(() => {});
        else navigator.clipboard?.writeText(text).then(() => toast("تم نسخ العرض للمشاركة"), () => toast(text));
        return;
      }
      case "clear": S.cart = {}; persist(); return render();
      case "logout": S.merchant = null; persist(); S.history = []; return go("account", {}, false);
      case "myoffers": return $("#myoffers")?.scrollIntoView({ behavior: "smooth" });
      case "soon": return toast("قريباً في النسخة الكاملة");
    }
  });

  document.addEventListener("change", (e) => {
    if (e.target.id === "emirate") { S.emirate = e.target.value; persist(); toast("تم اختيار " + S.emirate); }
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
    if (f.id === "mform") { S.merchant = { name: fd.name, email: fd.email }; persist(); toast("مرحباً " + fd.name); S.history = [{ name: "account", params: {} }]; return go("dashboard", {}, false); }
    if (f.id === "oform") {
      const old = +fd.old, price = +fd.price;
      if (price >= old) return toast("السعر الجديد يجب أن يكون أقل من السابق");
      if (fd.until < fd.from) return toast("تاريخ النهاية قبل تاريخ البداية");
      const sid = "m_" + S.merchant.name;
      if (!D.stores.find((s) => s.id === sid)) D.stores.push({ id: sid, name: S.merchant.name, short: S.merchant.name.slice(0, 2), color: "#5b21b6", type: "super", offers: 0 });
      const cat = D.categories.find((c) => c.id === fd.cat);
      S.custom.push({ id: "c" + Date.now(), name: fd.name, cat: fd.cat, sub: null, emoji: cat ? cat.icon : "🏷️", old, prices: { [sid]: price }, until: fd.until, featured: true });
      persist(); toast("تم نشر العرض ✅"); back();
    }
  });

  // restore merchant store records
  if (S.merchant) D.stores.push({ id: "m_" + S.merchant.name, name: S.merchant.name, short: S.merchant.name.slice(0, 2), color: "#5b21b6", type: "super", offers: S.custom.length });

  render();
  setTimeout(() => $("#splash").classList.add("hide"), 1600);
})();
