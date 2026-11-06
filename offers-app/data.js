// Demo data only. Prices, stores and offers are sample values for the prototype,
// not real retailer data. Replace with a backend/API in production.
window.OFFERS_DATA = {
  emirates: ["أبوظبي", "دبي", "الشارقة", "عجمان", "أم القيوين", "رأس الخيمة", "الفجيرة"],

  categories: [
    { id: "all", name: "الكل", icon: "🟦", bg: "#ede9fe" },
    { id: "grocery", name: "مواد غذائية", icon: "🥬", bg: "#dcfce7" },
    { id: "electronics", name: "إلكترونيات", icon: "💻", bg: "#e0f2fe" },
    { id: "fashion", name: "ملابس", icon: "👕", bg: "#fee2e2" },
    { id: "home", name: "المنزل", icon: "🏠", bg: "#ffedd5" },
    { id: "beauty", name: "عطور وتجميل", icon: "🧴", bg: "#fce7f3" },
    { id: "kids", name: "أطفال", icon: "🧸", bg: "#fef9c3" },
    { id: "more", name: "أخرى", icon: "✨", bg: "#e0e7ff" }
  ],

  subCategories: {
    grocery: [
      { id: "dairy", name: "ألبان", icon: "🥛" },
      { id: "meat", name: "لحوم ودواجن", icon: "🥩" },
      { id: "veg", name: "خضروات وفواكه", icon: "🍎" },
      { id: "bakery", name: "مخبوزات", icon: "🍞" },
      { id: "drinks", name: "مشروبات", icon: "🥤" },
      { id: "canned", name: "معلبات", icon: "🥫" }
    ]
  },

  stores: [
    { id: "lulu", name: "لولو هايبرماركت", short: "Lulu", color: "#d71920", type: "super", offers: 320 },
    { id: "carrefour", name: "كارفور", short: "C4", color: "#1e4fa3", type: "super", offers: 280 },
    { id: "spinneys", name: "سبينيس", short: "Sp", color: "#2f7d32", type: "super", offers: 210 },
    { id: "unioncoop", name: "جمعية الاتحاد", short: "UC", color: "#0b6e99", type: "super", offers: 195 },
    { id: "sharafdg", name: "شرف دي جي", short: "DG", color: "#f4b400", type: "electronics", offers: 420 },
    { id: "ikea", name: "إيكيا", short: "IK", color: "#0058a3", type: "home", offers: 150 },
    { id: "centrepoint", name: "سنتربوينت", short: "CP", color: "#e85d1f", type: "fashion", offers: 175 },
    { id: "ace", name: "إيس", short: "ACE", color: "#c8102e", type: "home", offers: 90 }
  ],

  // prices: map of storeId -> current price (AED). "old" is the reference price.
  products: [
    { id: "p1", name: "أرز بسمتي 5 كيلو", cat: "grocery", sub: "canned", emoji: "🍚", old: 45,
      prices: { lulu: 29, carrefour: 32.5, unioncoop: 33, spinneys: 36 }, until: "2026-11-30", featured: true },
    { id: "p2", name: "مياه معدنية 1.5 لتر (6 عبوات)", cat: "grocery", sub: "drinks", emoji: "💧", old: 16.8,
      prices: { carrefour: 12, lulu: 12.75, unioncoop: 13.5, spinneys: 14.25 }, until: "2026-11-20" },
    { id: "p3", name: "زيت دوار الشمس 1.5 لتر", cat: "grocery", sub: "canned", emoji: "🫒", old: 17.5,
      prices: { unioncoop: 13.5, lulu: 14, carrefour: 14.95 }, until: "2026-11-25" },
    { id: "p4", name: "حليب طازج 2 لتر", cat: "grocery", sub: "dairy", emoji: "🥛", old: 12,
      prices: { lulu: 9.5, carrefour: 9.75, spinneys: 10.5, unioncoop: 9.25 }, until: "2026-11-15" },
    { id: "p5", name: "صدور دجاج 1 كيلو", cat: "grocery", sub: "meat", emoji: "🍗", old: 32,
      prices: { carrefour: 24.95, lulu: 23.5, spinneys: 27 }, until: "2026-11-18" },
    { id: "p6", name: "خبز توست أبيض", cat: "grocery", sub: "bakery", emoji: "🍞", old: 7,
      prices: { lulu: 5.25, carrefour: 5, unioncoop: 5.5 }, until: "2026-11-12" },
    { id: "p7", name: "تفاح أحمر 1 كيلو", cat: "grocery", sub: "veg", emoji: "🍎", old: 9.5,
      prices: { spinneys: 7.25, lulu: 6.5, carrefour: 6.95, unioncoop: 6.75 }, until: "2026-11-14" },
    { id: "p8", name: "منظف غسيل 3 كيلو", cat: "home", sub: null, emoji: "🧺", old: 58,
      prices: { carrefour: 41.2, lulu: 44, unioncoop: 48.75 }, until: "2026-11-30" },
    { id: "p9", name: "سماعات لاسلكية", cat: "electronics", sub: null, emoji: "🎧", old: 499,
      prices: { sharafdg: 349, carrefour: 379, lulu: 369 }, until: "2026-12-05", featured: true },
    { id: "p10", name: "تلفزيون ذكي 55 بوصة", cat: "electronics", sub: null, emoji: "📺", old: 2299,
      prices: { sharafdg: 1599, carrefour: 1649, lulu: 1699 }, until: "2026-11-28", featured: true },
    { id: "p11", name: "هاتف ذكي 128 جيجا", cat: "electronics", sub: null, emoji: "📱", old: 1899,
      prices: { sharafdg: 1499, carrefour: 1549 }, until: "2026-11-22" },
    { id: "p12", name: "طاولة جانبية خشب", cat: "home", sub: null, emoji: "🪑", old: 149,
      prices: { ikea: 99, ace: 115 }, until: "2026-12-10" },
    { id: "p13", name: "قميص قطني رجالي", cat: "fashion", sub: null, emoji: "👔", old: 89,
      prices: { centrepoint: 49, lulu: 55 }, until: "2026-11-30" },
    { id: "p14", name: "عطر نسائي 100 مل", cat: "beauty", sub: null, emoji: "🌸", old: 320,
      prices: { lulu: 219, carrefour: 239 }, until: "2026-11-30" },
    { id: "p15", name: "حفاضات أطفال (مقاس 4)", cat: "kids", sub: null, emoji: "👶", old: 75,
      prices: { carrefour: 52, lulu: 54.5, unioncoop: 49.9 }, until: "2026-11-26" },
    { id: "p16", name: "شامبو 400 مل", cat: "beauty", sub: null, emoji: "🧴", old: 24,
      prices: { carrefour: 18.7, unioncoop: 21.9, lulu: 19.5 }, until: "2026-11-21" }
  ],

  banners: [
    { title: "عروض المواد الغذائية", sub: "خصومات حتى 40%", cat: "grocery", emoji: "🥕🍅🍋", from: "#f97316", to: "#ef4444" },
    { title: "أسبوع الإلكترونيات", sub: "أفضل الأسعار في الإمارات", cat: "electronics", emoji: "📺🎧📱", from: "#6d28d9", to: "#2563eb" },
    { title: "جدّد منزلك", sub: "عروض الأثاث والأدوات", cat: "home", emoji: "🛋️🪑🧺", from: "#0d9488", to: "#16a34a" }
  ]
};
