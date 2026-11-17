// Episode — "الفرح بالتوبة" (Joy at your return). Rendered by engine/farah.html.
// Source: Sahih Muslim 2747 (the story of the lost camel). One narration take; `keys` are its word times
// (seconds into the clip). A breath of P seconds is inserted after «قائمةً عنده» so the reunion can land.
const V = 0.6, P = 1.5;
const cap = (a, b, cls, html) => ({ t0: V + a, t1: V + b, cls, html });
window.EPISODE = {
  id: 'ep11', title: 'الفرح بالتوبة', duration: 37.0, page: 'farah.html',
  brand: { ar: 'أثَر', en: 'ATHAR' },
  keys: { voiceAt: V, hook: 0, qal: 4.22, lallahu: 7.06, ahadikum: 11.72, rahila: 13.24, falat: 14.7, infalatat: 15.38, alayha: 16.64, ayisa: 18.9,
    ata: 19.94, idtajaa: 21.34, qad: 22.9, baina: 24.4, idha: 26.28, qaima: 27.5, mahma: 28.82 + P, irji: 30.16 + P, end: 31.4 + P },
  caps: [
    cap(0, 4.1, 'ar hero', 'هل تعلمُ مَن<br><span class="g">يفرحُ بعودتِك</span><br>أكثرَ ممّا تتخيّل؟'),
    cap(0, 4.1, 'en', 'Do you know who rejoices at your return,<br>more than you can imagine?'),
    cap(4.22, 6.95, 'ar hero', 'قالَ رسولُ الله <span class="p">ﷺ</span>'),
    cap(4.22, 6.95, 'en', 'The Messenger of Allah ﷺ said:'),
    cap(7.06, 11.6, 'ar hero', '«لَلَّهُ <span class="g">أشدُّ فرحًا</span><br>بتوبةِ عبدِه<br>حينَ يتوبُ إليه'),
    cap(7.06, 11.6, 'en', '“Allah rejoices more at the repentance of His servant, when he turns back to Him…'),
    cap(11.72, 15.3, 'ar', 'من أحدِكم كانَ على راحلتِه<br>بأرضٍ فَلاة'),
    cap(11.72, 15.3, 'en', '…than one of you who was riding his camel<br>through an empty desert.'),
    cap(15.38, 18.8, 'ar', 'فانفلتَتْ منه<br>وعليها طعامُه وشرابُه'),
    cap(15.38, 18.8, 'en', 'It slipped away from him,<br>carrying his food and his water.'),
    cap(18.9, 19.86, 'ar', 'فأيِسَ منها'),
    cap(18.9, 19.86, 'en', 'He lost all hope of finding it.'),
    cap(19.94, 24.3, 'ar', 'فأتى شجرةً فاضطجعَ في ظلِّها<br>قد أيِسَ من راحلتِه'),
    cap(19.94, 24.3, 'en', 'So he came to a tree and lay down in its shade, having given up.'),
    cap(24.4, 28.75 + P, 'ar', 'فبَيْنا هو كذلك<br>إذا هو بها <span class="g">قائمةً عندَه</span>…»'),
    cap(24.4, 28.75 + P, 'en', 'And while he was like that, there it was,<br>standing right beside him…”'),
    cap(28.82 + P, 40, 'ar hero', 'فمهما ابتعدتَ…<br><span class="g">ارجِعْ إليه</span>'),
    cap(28.82 + P, 40, 'en', 'However far you have gone,<br>come back to Him.'),
    cap(30.16 + P, 40, 'src', 'رواه مسلم (٢٧٤٧) · Sahih Muslim 2747'),
  ],
};
