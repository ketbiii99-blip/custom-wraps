// Episode 01 — "غصن الشوك" (The Thorny Branch)
// Sources: Sahih al-Bukhari 652, Sahih Muslim 1914 · Qur'an 99:7
// Timings follow the Arabic voice-over (see `voice` at the bottom).
window.EPISODE = {
  id: 'ep01',
  duration: 44.5,
  brand: { ar: 'قِنديل', en: 'QINDEEL' },
  action: { stopAt: 9.3, resumeAt: 14.4, rewardAt: 14.6, dawnFrom: 15.2, dawnTo: 27 },
  cues: [
    { t0: 0.2, t1: 6.4, lines: [
      { at: 0, cls: 'big', html: 'عملٌ لا يأخذُ منك<br>إلّا لحظة…' },
      { at: 3.2, cls: 'big gold', html: 'غفرَ اللهُ لرجلٍ بسببه' },
    ]},
    { t0: 6.7, t1: 9.5, lines: [
      { at: 0, cls: 'mid', html: 'فوجدَ <span class="gold">غصنَ شوكٍ</span><br>على الطريق' },
    ]},
    { t0: 9.8, t1: 16.2, lines: [
      { at: 0, cls: 'mid', html: 'فأزاحَه عن الطريق' },
      { at: 2.2, cls: 'small', html: 'عملٌ بسيط… لكن انظرْ إلى جزائه' },
    ]},
    { t0: 16.5, t1: 28.9, card: true, lines: [
      { at: 0, cls: 'label', html: 'قال رسولُ الله <span class="pbuh">ﷺ</span>' },
      { at: 0.5, cls: 'hadith', html: '«بَيْنَمَا رَجُلٌ يَمْشِي بِطَرِيقٍ، وَجَدَ غُصْنَ شَوْكٍ عَلَى الطَّرِيقِ فَأَخَّرَهُ، <span class="gold">فَشَكَرَ اللَّهُ لَهُ فَغَفَرَ لَهُ</span>»' },
      { at: 1.2, cls: 'source', html: 'متفق عليه · البخاري (٦٥٢) ومسلم (١٩١٤)' },
    ]},
    { t0: 29.2, t1: 38.1, lines: [
      { at: 0, cls: 'mid', html: 'فلا تحتقرْ خيرًا مهما صغُر' },
      { at: 4.0, cls: 'ayah', html: '﴿فَمَن يَعۡمَلۡ مِثۡقَالَ ذَرَّةٍ خَيۡرٗا يَرَهُۥ﴾' },
      { at: 4.5, cls: 'source', html: 'سورة الزلزلة · الآية ٧' },
    ]},
    { t0: 38.3, t1: 45, lines: [
      { at: 0, cls: 'big', html: 'ما <span class="gold">«الغصنُ»</span> الذي<br>ستُزيحه اليوم؟' },
      { at: 3.0, cls: 'small', html: 'اكتبْه في التعليقات' },
      { at: 3.8, cls: 'follow', html: 'تابِع <b>قِنديل</b> · درسٌ جديد كلَّ يوم' },
    ]},
  ],
  subs: [
    { t0: 0.2, t1: 3.4, text: 'A deed that takes only a moment…' },
    { t0: 3.4, t1: 6.4, text: '…and Allah forgave a man because of it.' },
    { t0: 6.7, t1: 9.5, text: 'He came across a thorny branch lying in the road.' },
    { t0: 9.8, t1: 11.9, text: 'So he moved it aside.' },
    { t0: 11.9, t1: 16.2, text: 'A small act… but look at its reward.' },
    { t0: 16.5, t1: 19.3, text: 'The Messenger of Allah ﷺ said:' },
    { t0: 19.3, t1: 26.0, text: '“A man walking along a road found a thorny branch on it and moved it aside…' },
    { t0: 26.0, t1: 28.9, text: '…so Allah appreciated his deed and forgave him.”<small>Bukhari 652 · Muslim 1914</small>' },
    { t0: 29.2, t1: 32.3, text: 'So never belittle a good deed, however small.' },
    { t0: 32.3, t1: 38.1, text: '“So whoever does an atom’s weight of good will see it.”<small>Qur’an 99:7</small>' },
    { t0: 38.3, t1: 45, text: 'What “branch” will you move out of the way today?<small>Tell us in the comments</small>' },
  ],
  // Voice-over clips (generated: ElevenLabs via Higgsfield, voice "Arthur", sped up 1.15x) and where each starts.
  // The Qur'an verse is deliberately NOT read by the synthetic voice; it is shown in silence.
  voice: [
    { at: 0.3, text: 'عَمَلٌ لا يَأخُذُ مِنكَ إلّا لَحظة... غَفَرَ اللهُ لِرَجُلٍ بِسَبَبِه.' },
    { at: 6.8, text: 'فَوَجَدَ غُصنَ شَوكٍ على الطَّريق.' },
    { at: 9.9, text: 'فَأزاحَهُ عَنِ الطَّريق.' },
    { at: 12.0, text: 'عَمَلٌ بَسيط، لكنِ انظُرْ إلى جَزائِه.' },
    { at: 16.6, text: 'قَالَ رَسُولُ اللَّهِ، صَلَّى اللَّهُ عَلَيْهِ وَسَلَّمَ: بَيْنَمَا رَجُلٌ يَمْشِي بِطَرِيقٍ، وَجَدَ غُصْنَ شَوْكٍ عَلَى الطَّرِيقِ فَأَخَّرَهُ، فَشَكَرَ اللَّهُ لَهُ، فَغَفَرَ لَهُ.' },
    { at: 29.3, text: 'فلا تَحتَقِرْ خَيرًا مَهما صَغُر. قالَ اللهُ تعالى:' },
    { at: 38.4, text: 'ما الغُصنُ الذي سَتُزيحُهُ اليوم؟ اكتُبْهُ في التَّعليقات.' },
  ],
};
