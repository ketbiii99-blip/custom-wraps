// Episode — "كلمتان" (Two words). Minimal line-art format, rendered by engine/minimal.html.
// Source: Sahih al-Bukhari 6682, Sahih Muslim 2694. One continuous narration take; `keys` are its word times.
const V = 0.5; // narration starts here
window.EPISODE = {
  id: 'ep09', title: 'كلمتان', duration: 17.4, page: 'minimal.html',
  brand: { ar: 'أثَر', en: 'ATHAR' },
  keys: { voiceAt: V, kalimatan: 3.22, khafifatan: 4.04, lisanEnd: 6.02, thaqilatan: 6.02, mizan: 7.16, habibatan: 8.0, sub1: 10.04, sub2: 12.26, end: 13.9 },
  caps: [
    { t0: V - 0.1, t1: V + 3.18, html: '<div class="ar">قال رسولُ الله <span class="p">ﷺ</span></div><div class="en">The Messenger of Allah ﷺ said:</div>' },
    { t0: V + 3.2, t1: V + 6.0, html: '<div class="ar">«كلمتان <span class="g">خفيفتان</span> على اللسان»</div><div class="en">“Two words, light on the tongue…</div>' },
    { t0: V + 6.02, t1: V + 7.98, html: '<div class="ar"><span class="g">ثقيلتان</span> في الميزان</div><div class="en">…heavy on the scale…</div>' },
    { t0: V + 8.0, t1: V + 10.0, html: '<div class="ar"><span class="g">حبيبتان</span> إلى الرحمن</div><div class="en">…beloved to the Most Merciful:</div>' },
    { t0: V + 10.04, t1: V + 12.22, html: '<div class="en">SubhanAllahi wa bihamdih<br>Glory be to Allah, and praise be to Him</div>' },
    { t0: V + 12.26, t1: V + 14.2, html: '<div class="en">SubhanAllahil-Azeem<br>Glory be to Allah, the Almighty”</div>' },
    { t0: V + 14.3, t1: 18, html: '<div class="cta">قُلها الآن… و<b>اكتبها</b> في التعليقات</div><div class="src">متفق عليه · البخاري (٦٦٨٢) ومسلم (٢٦٩٤)</div><div class="en" style="font-size:30px">Say them now · Bukhari 6682 · Muslim 2694</div>' },
  ],
};
