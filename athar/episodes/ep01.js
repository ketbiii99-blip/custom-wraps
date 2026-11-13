// Episode 01 — "غصن الشوك" (The Thorny Branch)
// Sources: Sahih al-Bukhari 652, Sahih Muslim 1914 · Qur'an 99:7
// Timings follow the Arabic voice-over (see `voice` at the bottom).
window.EPISODE = {
  id: 'ep01',
  duration: 47.1,
  brand: { ar: 'أثَر', en: 'ATHAR' },
  action: { stopAt: 9.0, resumeAt: 13.8, rewardAt: 14.0, dawnFrom: 14.6, dawnTo: 26 },
  cues: [
    { t0: 0.2, t1: 6.1, lines: [
      { at: 0, cls: 'big', html: 'عملٌ لا يأخذُ منك<br>إلّا لحظة…' },
      { at: 2.7, cls: 'big gold', html: 'غفرَ اللهُ لرجلٍ بسببه' },
    ]},
    { t0: 6.4, t1: 9.2, lines: [
      { at: 0, cls: 'mid', html: 'فوجدَ <span class="gold">غصنَ شوكٍ</span><br>في طريقه' },
    ]},
    { t0: 9.5, t1: 15.5, lines: [
      { at: 0, cls: 'mid', html: 'فأزاحَه جانبًا' },
      { at: 2.3, cls: 'small', html: 'عملٌ بسيط… لكن انظرْ إلى جزائه' },
    ]},
    { t0: 15.8, t1: 28.4, card: true, lines: [
      { at: 0, cls: 'label', html: 'قال رسولُ الله <span class="pbuh">ﷺ</span>' },
      { at: 0.5, cls: 'hadith', html: '«بَيْنَمَا رَجُلٌ يَمْشِي بِطَرِيقٍ، وَجَدَ غُصْنَ شَوْكٍ عَلَى الطَّرِيقِ فَأَخَّرَهُ، <span class="gold">فَشَكَرَ اللَّهُ لَهُ فَغَفَرَ لَهُ</span>»' },
      { at: 1.2, cls: 'source', html: 'متفق عليه · البخاري (٦٥٢) ومسلم (١٩١٤)' },
    ]},
    { t0: 28.7, t1: 41.1, lines: [
      { at: 0, cls: 'mid', html: 'فلا تحتقرْ خيرًا مهما صغُر' },
      { at: 4.6, cls: 'ayah', html: '﴿فَمَن يَعۡمَلۡ مِثۡقَالَ ذَرَّةٍ خَيۡرٗا يَرَهُۥ﴾' },
      { at: 5.1, cls: 'source', html: 'سورة الزلزلة · الآية ٧ · بصوت مشاري العفاسي' },
    ]},
    { t0: 41.4, t1: 47.6, lines: [
      { at: 0, cls: 'big', html: 'ما <span class="gold">«الغصنُ»</span> الذي<br>ستُزيحه اليوم؟' },
      { at: 2.0, cls: 'small', html: 'اكتبْه في التعليقات' },
      { at: 2.8, cls: 'follow', html: 'تابِع <b>أثَر</b> · درسٌ جديد كلَّ يوم' },
    ]},
  ],
  subs: [
    { t0: 0.2, t1: 2.9, text: 'A deed that takes only a moment…' },
    { t0: 2.9, t1: 6.1, text: '…and Allah forgave a man because of it.' },
    { t0: 6.4, t1: 9.2, text: 'He came across a thorny branch in his path.' },
    { t0: 9.5, t1: 11.8, text: 'So he moved it aside.' },
    { t0: 11.8, t1: 15.5, text: 'A small act… but look at its reward.' },
    { t0: 15.8, t1: 18.6, text: 'The Messenger of Allah ﷺ said:' },
    { t0: 18.6, t1: 24.8, text: '“A man walking along a road found a thorny branch on it and moved it aside…' },
    { t0: 24.8, t1: 28.4, text: '…so Allah appreciated his deed and forgave him.”<small>Bukhari 652 · Muslim 1914</small>' },
    { t0: 28.7, t1: 31.4, text: 'So never belittle a good deed, however small.' },
    { t0: 31.4, t1: 33.2, text: 'Allah, the Most High, says:' },
    { t0: 33.2, t1: 41.1, text: '“So whoever does an atom’s weight of good will see it.”<small>Qur’an 99:7 · recited by Mishary Alafasy</small>' },
    { t0: 41.4, t1: 47.6, text: 'What “branch” will you move out of the way today?<small>Tell us in the comments</small>' },
  ],
  // Voice-over: generated narration (ElevenLabs v4 via Higgsfield, cloned native voice "Athar narrator", natural speed; every clip levelled to the same mean volume) and where each clip starts.
  // The Qur'an verse is a human recitation (Mishary Rashid Alafasy, everyayah.com 099007.mp3), never synthetic.
  voice: [
    { at: 0.3, text: 'عَمَلٌ لا يأخذُ منكَ إلّا لَحظة... غَفَرَ اللهُ لرجُلٍ بسببِه.' },
    { at: 6.5, text: 'فوجدَ غُصنَ شَوكٍ في طريقِه.' },
    { at: 9.6, text: 'فأزاحَهُ جانِبًا.' },
    { at: 11.9, text: 'عَمَلٌ بسيط، لكنِ انظُرْ إلى جَزائِه.' },
    { at: 15.9, text: 'قَالَ رَسُولُ اللَّهِ، صَلَّى اللَّهُ عَلَيْهِ وَسَلَّمَ: بَيْنَمَا رَجُلٌ يَمْشِي بِطَرِيقٍ، وَجَدَ غُصْنَ شَوْكٍ عَلَى الطَّرِيقِ فَأَخَّرَهُ، فَشَكَرَ اللَّهُ لَهُ، فَغَفَرَ لَهُ.' },
    { at: 28.8, text: 'فلا تَحتَقِرْ خيرًا مهما صَغُر. قالَ اللهُ تعالى:' },
    { at: 33.7, recitation: 'Qur\'an 99:7 — Mishary Rashid Alafasy' },
    { at: 41.5, text: 'ما الغُصنُ الذي ستُزيحُهُ اليوم؟ اكتُبْهُ في التعليقات.' },
  ],
};
