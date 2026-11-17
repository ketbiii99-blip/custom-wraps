// Episode — "المُفلِس" (The truly bankrupt). Rendered by engine/muflis.html.
// Source: Sahih Muslim 2581. One continuous narration take; `keys` are its word times (seconds into the clip).
const V = 0.3; // narration starts here
window.EPISODE = {
  id: 'ep10', title: 'المُفلِس', duration: 39.2, page: 'muflis.html',
  brand: { ar: 'أثَر', en: 'ATHAR' },
  keys: { voiceAt: V, hook: 0, laysa: 1.98, qal: 3.34, inna: 6.74, yati: 8.74, salah: 10.26, siyam: 11.36, zakah: 12.18, wa_yati: 13.12,
    shatam: 14.08, qadhaf: 15.06, akal: 16.44, safak: 18.04, darab: 19.66, yuta: 20.92, hadha2: 23.24, faniyat: 25.26, ukhidha: 28.02, turihat: 29.72,
    nar: 31.4, ihfaz: 32.68, la_tuhdi: 34.52, end: 36.19 },
  beats: ['hook', 'laysa', 'inna', 'salah', 'siyam', 'zakah', 'wa_yati', 'shatam', 'qadhaf', 'akal', 'safak', 'darab', 'yuta', 'hadha2', 'faniyat', 'ukhidha', 'nar', 'ihfaz', 'la_tuhdi'],
  caps: [
    { t0: V + 0.0, t1: V + 1.95, html: '<div class="ar">أتدري مَن <span class="g">المُفلِس</span>؟</div><div class="en">Do you know who is truly bankrupt?</div>' },
    { t0: V + 1.98, t1: V + 3.3, html: '<div class="ar">ليس مَن لا مالَ له</div><div class="en">Not the one with no money.</div>' },
    { t0: V + 3.34, t1: V + 6.7, html: '<div class="ar">قال رسولُ الله <span class="p">ﷺ</span></div><div class="en">The Messenger of Allah ﷺ said:</div>' },
    { t0: V + 6.74, t1: V + 13.08, html: '<div class="ar">«إنّ المفلس من أمّتي يأتي يوم القيامة<br><span class="g">بصلاةٍ وصيامٍ وزكاة</span></div><div class="en">“The bankrupt of my nation comes on the Day of Resurrection with prayer, fasting and charity…</div>' },
    { t0: V + 13.12, t1: V + 20.88, html: '<div class="ar">ويأتي قد <span class="r">شتم هذا، وقذف هذا، وأكل مال هذا، وسفك دم هذا، وضرب هذا</span></div><div class="en">…but he insulted one, slandered another, consumed another’s wealth, shed another’s blood, and struck another.</div>' },
    { t0: V + 20.92, t1: V + 24.54, html: '<div class="ar">فيُعطى هذا من <span class="g">حسناته</span>، وهذا من <span class="g">حسناته</span></div><div class="en">So each of them is given from his good deeds.</div>' },
    { t0: V + 24.58, t1: V + 30.96, html: '<div class="ar">فإن <span class="r">فنيت حسناته</span> قبل أن يُقضى ما عليه،<br>أُخذ من خطاياهم فطُرحت عليه</div><div class="en">And if his good deeds run out before he has paid, their sins are taken and cast upon him…</div>' },
    { t0: V + 31.0, t1: V + 32.62, html: '<div class="ar">ثمّ <span class="r">طُرح في النار</span>»</div><div class="en">…then he is thrown into the Fire.”</div>' },
    { t0: V + 32.68, t1: 40, top: 1400, html: '<div class="en">Guard your good deeds. Don’t hand them to those you wrong.</div><div class="src">رواه مسلم (٢٥٨١) · Muslim 2581</div>' },
  ],
};
