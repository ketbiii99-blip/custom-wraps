// Episode 01 — "غصن الشوك" (The Thorny Branch)
// Sources: Sahih al-Bukhari 652, Sahih Muslim 1914 · Qur'an 99:7
window.EPISODE = {
  id: 'ep01',
  duration: 28,
  brand: { ar: 'قِنديل', en: 'QINDEEL' },
  action: { stopAt: 8.6, resumeAt: 11.9, dawnFrom: 12.2, dawnTo: 20 },
  cues: [
    { t0: 0.2, t1: 3.5, lines: [
      { at: 0, cls: 'big', html: 'عملٌ لا يأخذُ منك<br>إلّا لحظة…' },
      { at: 1.25, cls: 'big gold', html: 'غفرَ اللهُ لرجلٍ بسببه' },
    ]},
    { t0: 3.9, t1: 6.2, lines: [
      { at: 0, cls: 'mid', html: 'رجلٌ يمشي في طريقه…' },
    ]},
    { t0: 6.5, t1: 9.0, lines: [
      { at: 0, cls: 'mid', html: 'فوجدَ <span class="gold">غصنَ شوكٍ</span><br>على الطريق' },
    ]},
    { t0: 9.3, t1: 12.2, lines: [
      { at: 0, cls: 'mid', html: 'فأزاحَه عن الطريق' },
      { at: 1.3, cls: 'small', html: 'عملٌ بسيط… لكن انظرْ إلى جزائه' },
    ]},
    { t0: 12.6, t1: 18.5, card: true, lines: [
      { at: 0, cls: 'label', html: 'قال رسولُ الله <span class="pbuh">ﷺ</span>' },
      { at: 0.35, cls: 'hadith', html: '«بَيْنَمَا رَجُلٌ يَمْشِي بِطَرِيقٍ، وَجَدَ غُصْنَ شَوْكٍ عَلَى الطَّرِيقِ فَأَخَّرَهُ، <span class="gold">فَشَكَرَ اللَّهُ لَهُ فَغَفَرَ لَهُ</span>»' },
      { at: 0.9, cls: 'source', html: 'متفق عليه · البخاري (٦٥٢) ومسلم (١٩١٤)' },
    ]},
    { t0: 18.9, t1: 23.5, lines: [
      { at: 0, cls: 'mid', html: 'فلا تحتقرْ خيرًا مهما صغُر' },
      { at: 0.8, cls: 'ayah', html: '﴿فَمَن يَعۡمَلۡ مِثۡقَالَ ذَرَّةٍ خَيۡرٗا يَرَهُۥ﴾' },
      { at: 1.2, cls: 'source', html: 'سورة الزلزلة · الآية ٧' },
    ]},
    { t0: 23.9, t1: 28.5, lines: [
      { at: 0, cls: 'big', html: 'ما <span class="gold">«الغصنُ»</span> الذي<br>ستُزيحه اليوم؟' },
      { at: 0.9, cls: 'small', html: 'اكتبْه في التعليقات' },
      { at: 1.5, cls: 'follow', html: 'تابِع <b>قِنديل</b> · درسٌ جديد كلَّ يوم' },
    ]},
  ],
  subs: [
    { t0: 0.2, t1: 1.45, text: 'A deed that takes only a moment…' },
    { t0: 1.45, t1: 3.5, text: '…and Allah forgave a man because of it.' },
    { t0: 3.9, t1: 6.2, text: 'A man was walking along a road…' },
    { t0: 6.5, t1: 9.0, text: 'He came across a thorny branch lying in the way.' },
    { t0: 9.3, t1: 10.6, text: 'So he moved it aside.' },
    { t0: 10.6, t1: 12.2, text: 'A small act… but look at its reward.' },
    { t0: 12.6, t1: 15.4, text: 'The Prophet ﷺ said: a man found a thorny branch on the road and removed it…' },
    { t0: 15.4, t1: 18.5, text: '“…so Allah appreciated his deed and forgave him.”<small>Bukhari 652 · Muslim 1914</small>' },
    { t0: 18.9, t1: 19.7, text: 'So never belittle a good deed, however small.' },
    { t0: 19.7, t1: 23.5, text: '“So whoever does an atom’s weight of good will see it.”<small>Qur’an 99:7</small>' },
    { t0: 23.9, t1: 28.5, text: 'What “branch” will you move out of the way today?<small>Tell us in the comments</small>' },
  ],
};
