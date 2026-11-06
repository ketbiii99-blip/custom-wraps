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

  // Real branch locations (mall / area names). Coordinates are approximate, for distance only;
  // directions open Google Maps with the branch name. Confirm each one before launch.
  branches: [
    { store: "lulu", name: "الوحدة مول", emirate: "أبوظبي", lat: 24.4706, lng: 54.3725, q: "Lulu Hypermarket Al Wahda Mall Abu Dhabi" },
    { store: "lulu", name: "مشرف مول", emirate: "أبوظبي", lat: 24.4360, lng: 54.4120, q: "Lulu Hypermarket Mushrif Mall Abu Dhabi" },
    { store: "lulu", name: "الخالدية مول", emirate: "أبوظبي", lat: 24.4677, lng: 54.3496, q: "Lulu Hypermarket Khalidiyah Mall Abu Dhabi" },
    { store: "lulu", name: "البرشاء", emirate: "دبي", lat: 25.1149, lng: 55.1960, q: "Lulu Hypermarket Al Barsha Dubai" },
    { store: "lulu", name: "القصيص", emirate: "دبي", lat: 25.2786, lng: 55.3812, q: "Lulu Hypermarket Al Qusais Dubai" },
    { store: "lulu", name: "شارع الوحدة", emirate: "الشارقة", lat: 25.3197, lng: 55.3907, q: "Lulu Hypermarket Al Wahda Street Sharjah" },
    { store: "lulu", name: "عجمان", emirate: "عجمان", lat: 25.3983, lng: 55.4790, q: "Lulu Hypermarket Ajman" },
    { store: "lulu", name: "الفجيرة", emirate: "الفجيرة", lat: 25.1237, lng: 56.3361, q: "Lulu Hypermarket Fujairah" },
    { store: "lulu", name: "رأس الخيمة", emirate: "رأس الخيمة", lat: 25.7870, lng: 55.9480, q: "Lulu Hypermarket Ras Al Khaimah" },
    { store: "carrefour", name: "مول الإمارات", emirate: "دبي", lat: 25.1181, lng: 55.2006, q: "Carrefour Mall of the Emirates" },
    { store: "carrefour", name: "سيتي سنتر ديرة", emirate: "دبي", lat: 25.2522, lng: 55.3322, q: "Carrefour City Centre Deira" },
    { store: "carrefour", name: "سيتي سنتر مردف", emirate: "دبي", lat: 25.2166, lng: 55.4079, q: "Carrefour City Centre Mirdif" },
    { store: "carrefour", name: "مارينا مول", emirate: "أبوظبي", lat: 24.4760, lng: 54.3215, q: "Carrefour Marina Mall Abu Dhabi" },
    { store: "carrefour", name: "ياس مول", emirate: "أبوظبي", lat: 24.4886, lng: 54.6086, q: "Carrefour Yas Mall" },
    { store: "carrefour", name: "سيتي سنتر الشارقة", emirate: "الشارقة", lat: 25.3253, lng: 55.3984, q: "Carrefour City Centre Sharjah" },
    { store: "carrefour", name: "سيتي سنتر عجمان", emirate: "عجمان", lat: 25.4012, lng: 55.4780, q: "Carrefour City Centre Ajman" },
    { store: "carrefour", name: "سيتي سنتر الفجيرة", emirate: "الفجيرة", lat: 25.1295, lng: 56.3135, q: "Carrefour City Centre Fujairah" },
    { store: "carrefour", name: "المنار مول", emirate: "رأس الخيمة", lat: 25.7880, lng: 55.9540, q: "Carrefour Manar Mall Ras Al Khaimah" },
    { store: "spinneys", name: "ذا سبرينغز سوق", emirate: "دبي", lat: 25.0597, lng: 55.1753, q: "Spinneys The Springs Souk Dubai" },
    { store: "spinneys", name: "ميركاتو مول", emirate: "دبي", lat: 25.2163, lng: 55.2526, q: "Spinneys Mercato Mall Dubai" },
    { store: "unioncoop", name: "الوصل", emirate: "دبي", lat: 25.1934, lng: 55.2443, q: "Union Coop Al Wasl Dubai" },
    { store: "unioncoop", name: "الطوار", emirate: "دبي", lat: 25.2585, lng: 55.3836, q: "Union Coop Al Twar Dubai" },
    { store: "choithrams", name: "أم سقيم", emirate: "دبي", lat: 25.1555, lng: 55.2160, q: "Choithrams Umm Suqeim Dubai" },
    { store: "nesto", name: "النهدة", emirate: "الشارقة", lat: 25.2995, lng: 55.3725, q: "Nesto Hypermarket Al Nahda Sharjah" },
    { store: "nesto", name: "مويلح", emirate: "الشارقة", lat: 25.3020, lng: 55.4520, q: "Nesto Hypermarket Muwaileh Sharjah" },
    { store: "sharafdg", name: "مول الإمارات", emirate: "دبي", lat: 25.1185, lng: 55.2002, q: "Sharaf DG Mall of the Emirates" },
    { store: "sharafdg", name: "دبي فستيفال سيتي", emirate: "دبي", lat: 25.2220, lng: 55.3530, q: "Sharaf DG Dubai Festival City" },
    { store: "sharafdg", name: "ياس مول", emirate: "أبوظبي", lat: 24.4884, lng: 54.6083, q: "Sharaf DG Yas Mall" },
    { store: "ikea", name: "دبي فستيفال سيتي", emirate: "دبي", lat: 25.2224, lng: 55.3525, q: "IKEA Dubai Festival City" },
    { store: "ikea", name: "جبل علي", emirate: "دبي", lat: 25.0012, lng: 55.1260, q: "IKEA Jebel Ali" },
    { store: "ikea", name: "جزيرة ياس", emirate: "أبوظبي", lat: 24.4868, lng: 54.6045, q: "IKEA Yas Island" },
    { store: "homecentre", name: "أوايسس سنتر", emirate: "دبي", lat: 25.1608, lng: 55.2322, q: "Home Centre Oasis Centre Dubai" },
    { store: "ace", name: "دبي فستيفال سيتي", emirate: "دبي", lat: 25.2213, lng: 55.3557, q: "ACE Dubai Festival City" },
    { store: "ace", name: "جزيرة ياس", emirate: "أبوظبي", lat: 24.4853, lng: 54.6081, q: "ACE Yas Island" },
    { store: "centrepoint", name: "أوايسس سنتر", emirate: "دبي", lat: 25.1610, lng: 55.2325, q: "Centrepoint Oasis Centre Dubai" },
    { store: "centrepoint", name: "صحارى سنتر", emirate: "الشارقة", lat: 25.2975, lng: 55.3740, q: "Centrepoint Sahara Centre Sharjah" },
    { store: "max", name: "الغرير سنتر", emirate: "دبي", lat: 25.2665, lng: 55.3175, q: "Max Al Ghurair Centre Dubai" },
    { store: "brandsforless", name: "البرشاء", emirate: "دبي", lat: 25.1110, lng: 55.2010, q: "Brands For Less Al Barsha Dubai" }
  ],

  // Areas a shopper can pick when GPS is off or not allowed.
  areas: [
    { name: "دبي مارينا", emirate: "دبي", lat: 25.0805, lng: 55.1403 },
    { name: "وسط مدينة دبي", emirate: "دبي", lat: 25.1972, lng: 55.2744 },
    { name: "البرشاء", emirate: "دبي", lat: 25.1123, lng: 55.1964 },
    { name: "ديرة", emirate: "دبي", lat: 25.2697, lng: 55.3095 },
    { name: "مردف", emirate: "دبي", lat: 25.2183, lng: 55.4206 },
    { name: "كورنيش أبوظبي", emirate: "أبوظبي", lat: 24.4764, lng: 54.3436 },
    { name: "جزيرة ياس", emirate: "أبوظبي", lat: 24.4884, lng: 54.6087 },
    { name: "مدينة خليفة", emirate: "أبوظبي", lat: 24.4196, lng: 54.5776 },
    { name: "المجاز", emirate: "الشارقة", lat: 25.3260, lng: 55.3830 },
    { name: "كورنيش عجمان", emirate: "عجمان", lat: 25.4130, lng: 55.4450 },
    { name: "أم القيوين", emirate: "أم القيوين", lat: 25.5650, lng: 55.5530 },
    { name: "رأس الخيمة", emirate: "رأس الخيمة", lat: 25.7895, lng: 55.9432 },
    { name: "الفجيرة", emirate: "الفجيرة", lat: 25.1288, lng: 56.3265 }
  ],

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
