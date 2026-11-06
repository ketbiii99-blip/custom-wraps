// Demo data only. Prices, stores and offers are sample values for the prototype,
// not real retailer data. Replace with a backend/API in production.
window.OFFERS_DATA = {
  emirates: ["أبوظبي", "دبي", "الشارقة", "عجمان", "أم القيوين", "رأس الخيمة", "الفجيرة"],

  categories: [
    { id: "all", name: "الكل", icon: "layout-grid", bg: "#ede9fe" },
    { id: "grocery", name: "مواد غذائية", icon: "carrot", bg: "#dcfce7" },
    { id: "electronics", name: "إلكترونيات", icon: "monitor", bg: "#e0f2fe" },
    { id: "fashion", name: "ملابس", icon: "shirt", bg: "#fee2e2" },
    { id: "home", name: "المنزل", icon: "sofa", bg: "#ffedd5" },
    { id: "beauty", name: "عطور وتجميل", icon: "spray-can", bg: "#fce7f3" },
    { id: "kids", name: "أطفال", icon: "baby", bg: "#fef9c3" },
    { id: "more", name: "أخرى", icon: "ellipsis", bg: "#e0e7ff" }
  ],

  subCategories: {
    grocery: [
      { id: "dairy", name: "ألبان", icon: "milk" },
      { id: "meat", name: "لحوم ودواجن", icon: "beef" },
      { id: "veg", name: "خضروات وفواكه", icon: "apple" },
      { id: "bakery", name: "مخبوزات", icon: "croissant" },
      { id: "drinks", name: "مشروبات", icon: "cup-soda" },
      { id: "canned", name: "معلبات", icon: "package" }
    ]
  },

  // logo: optional path to the store's official logo (put the file in assets/logos/).
  // Stores without a logo file show a coloured name badge instead.
  // Products can also take img: "assets/products/<id>.jpg" for a real photo; otherwise an icon is shown.
  stores: [
    { id: "lulu", name: "لولو هايبرماركت", en: "Lulu", color: "#d71920", type: "super", offers: 320 },
    { id: "carrefour", name: "كارفور", en: "Carrefour", color: "#1e4fa3", type: "super", offers: 280, logo: "assets/logos/carrefour.svg" },
    { id: "spinneys", name: "سبينيس", en: "Spinneys", color: "#2f7d32", type: "super", offers: 210 },
    { id: "unioncoop", name: "جمعية الاتحاد", en: "Union Coop", color: "#0b6e99", type: "super", offers: 195 },
    { id: "choithrams", name: "تشويترامز", en: "Choithrams", color: "#9b1c1c", type: "super", offers: 140 },
    { id: "nesto", name: "نستو", en: "Nesto", color: "#b91c1c", type: "super", offers: 160 },
    { id: "sharafdg", name: "شرف دي جي", en: "Sharaf DG", color: "#d4a100", type: "electronics", offers: 420 },
    { id: "amazon", name: "أمازون", en: "amazon.ae", color: "#232f3e", type: "online", offers: 510, logo: "assets/logos/amazon.svg" },
    { id: "noon", name: "نون", en: "noon", color: "#e6c200", type: "online", offers: 470 },
    { id: "ikea", name: "إيكيا", en: "IKEA", color: "#0058a3", type: "home", offers: 150, logo: "assets/logos/ikea.svg" },
    { id: "homecentre", name: "هوم سنتر", en: "Home Centre", color: "#374151", type: "home", offers: 120 },
    { id: "ace", name: "إيس", en: "ACE", color: "#c8102e", type: "home", offers: 90 },
    { id: "centrepoint", name: "سنتربوينت", en: "Centrepoint", color: "#e85d1f", type: "fashion", offers: 175 },
    { id: "max", name: "ماكس", en: "max", color: "#1d4ed8", type: "fashion", offers: 130 },
    { id: "brandsforless", name: "براندز فور لس", en: "Brands For Less", color: "#ca8a04", type: "fashion", offers: 110 }
  ],

  // prices: map of storeId -> current price (AED). "old" is the reference price.
  products: [
    { id: "p1", name: "أرز بسمتي 5 كيلو", cat: "grocery", sub: "canned", icon: "wheat", old: 45,
      prices: { lulu: 29, carrefour: 32.5, unioncoop: 33, spinneys: 36 }, until: "2026-11-30", featured: true },
    { id: "p2", name: "مياه معدنية 1.5 لتر (6 عبوات)", cat: "grocery", sub: "drinks", icon: "droplets", old: 16.8,
      prices: { carrefour: 12, lulu: 12.75, unioncoop: 13.5, spinneys: 14.25 }, until: "2026-11-20" },
    { id: "p3", name: "زيت دوار الشمس 1.5 لتر", cat: "grocery", sub: "canned", icon: "droplet", old: 17.5,
      prices: { unioncoop: 13.5, lulu: 14, carrefour: 14.95 }, until: "2026-11-25" },
    { id: "p4", name: "حليب طازج 2 لتر", cat: "grocery", sub: "dairy", icon: "milk", old: 12,
      prices: { lulu: 9.5, carrefour: 9.75, spinneys: 10.5, unioncoop: 9.25 }, until: "2026-11-15" },
    { id: "p5", name: "صدور دجاج 1 كيلو", cat: "grocery", sub: "meat", icon: "drumstick", old: 32,
      prices: { carrefour: 24.95, lulu: 23.5, spinneys: 27, nesto: 22.75, choithrams: 26 }, until: "2026-11-18" },
    { id: "p6", name: "خبز توست أبيض", cat: "grocery", sub: "bakery", icon: "croissant", old: 7,
      prices: { lulu: 5.25, carrefour: 5, unioncoop: 5.5 }, until: "2026-11-12" },
    { id: "p7", name: "تفاح أحمر 1 كيلو", cat: "grocery", sub: "veg", icon: "apple", old: 9.5,
      prices: { spinneys: 7.25, lulu: 6.5, carrefour: 6.95, unioncoop: 6.75 }, until: "2026-11-14" },
    { id: "p8", name: "منظف غسيل 3 كيلو", cat: "home", sub: null, icon: "washing-machine", old: 58,
      prices: { carrefour: 41.2, lulu: 44, unioncoop: 48.75 }, until: "2026-11-30" },
    { id: "p9", name: "سماعات لاسلكية", cat: "electronics", sub: null, icon: "headphones", old: 499,
      prices: { sharafdg: 349, carrefour: 379, lulu: 369, amazon: 339, noon: 345 }, until: "2026-12-05", featured: true },
    { id: "p10", name: "تلفزيون ذكي 55 بوصة", cat: "electronics", sub: null, icon: "tv", old: 2299,
      prices: { sharafdg: 1599, carrefour: 1649, lulu: 1699 }, until: "2026-11-28", featured: true },
    { id: "p11", name: "هاتف ذكي 128 جيجا", cat: "electronics", sub: null, icon: "smartphone", old: 1899,
      prices: { sharafdg: 1499, carrefour: 1549, amazon: 1479, noon: 1489 }, until: "2026-11-22" },
    { id: "p12", name: "طاولة جانبية خشب", cat: "home", sub: null, icon: "armchair", old: 149,
      prices: { ikea: 99, ace: 115, homecentre: 109 }, until: "2026-12-10" },
    { id: "p13", name: "قميص قطني رجالي", cat: "fashion", sub: null, icon: "shirt", old: 89,
      prices: { centrepoint: 49, max: 45, brandsforless: 52, lulu: 55 }, until: "2026-11-30" },
    { id: "p14", name: "عطر نسائي 100 مل", cat: "beauty", sub: null, icon: "flower-2", old: 320,
      prices: { lulu: 219, carrefour: 239 }, until: "2026-11-30" },
    { id: "p15", name: "حفاضات أطفال (مقاس 4)", cat: "kids", sub: null, icon: "baby", old: 75,
      prices: { carrefour: 52, lulu: 54.5, unioncoop: 49.9 }, until: "2026-11-26" },
    { id: "p16", name: "شامبو 400 مل", cat: "beauty", sub: null, icon: "spray-can", old: 24,
      prices: { carrefour: 18.7, unioncoop: 21.9, lulu: 19.5 }, until: "2026-11-21" }
  ],

  banners: [
    { title: "عروض المواد الغذائية", sub: "خصومات حتى 40%", cat: "grocery", icon: "carrot", from: "#f97316", to: "#ef4444" },
    { title: "أسبوع الإلكترونيات", sub: "أفضل الأسعار في الإمارات", cat: "electronics", icon: "tv", from: "#6d28d9", to: "#2563eb" },
    { title: "جدّد منزلك", sub: "عروض الأثاث والأدوات", cat: "home", icon: "sofa", from: "#0d9488", to: "#16a34a" }
  ]
};
