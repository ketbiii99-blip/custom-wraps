import type { PowerUpDef } from '../types'

/** وسائل المساعدة الأصلية للعبة — كل فريق يختار ثلاث منها. */
export const POWER_UPS: PowerUpDef[] = [
  {
    id: 'fazaa',
    name: 'فزعة',
    tagline: 'اطلب مساعدة من شخص',
    description: 'يحق للفريق يطلب فزعة من أي شخص حاضر في اللمّة لمدة ٣٠ ثانية.',
    icon: '🤝',
  },
  {
    id: 'khoth_rahtak',
    name: 'خذ راحتك',
    tagline: 'وقت إضافي للسؤال',
    description: 'يضيف ٣٠ ثانية إضافية على مؤقّت السؤال الحالي.',
    icon: '⏳',
  },
  {
    id: 'tsib_tkhib',
    name: 'يا تصيب يا تخيب',
    tagline: 'فرصتين للإجابة',
    description: 'يعطي الفريق فرصتين للإجابة بدل فرصة وحدة.',
    icon: '🎯',
  },
  {
    id: 'hawwilha',
    name: 'حوّلها عليهم',
    tagline: 'ارمِ السؤال للفريق الثاني',
    description: 'ينتقل السؤال للفريق الثاني — وإذا جاوبوا غلط يخسرون قيمة السؤال.',
    icon: '🔁',
  },
  {
    id: 'dablha',
    name: 'دبّلها',
    tagline: 'مضاعفة نقاط السؤال',
    description: 'تتضاعف نقاط السؤال الحالي… بس الخسارة تتضاعف بعد لو تحوّل عليكم.',
    icon: '✖️',
  },
  {
    id: 'oloum_ganoun',
    name: 'علوم قنون',
    tagline: 'احصل على تلميح',
    description: 'يكشف تلميح بسيط يقرّبكم من الإجابة.',
    icon: '💡',
  },
]

export const POWER_UP_MAP: Record<string, PowerUpDef> = Object.fromEntries(
  POWER_UPS.map((p) => [p.id, p]),
)

export const POWER_UPS_PER_TEAM = 3
