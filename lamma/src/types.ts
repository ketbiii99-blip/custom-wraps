/** أنواع الأسئلة المدعومة في محرك اللعبة. */
export type QuestionType =
  | 'text'
  | 'image'
  | 'audio'
  | 'video'
  | 'multiple_choice'
  | 'guess_the_person'
  | 'guess_the_image'

export type Points = 200 | 400 | 600

export interface QuestionMedia {
  /** رابط صورة تظهر مع السؤال (ملف داخل public/assets أو رابط خارجي) */
  image?: string | null
  /** رابط مقطع صوتي */
  audio?: string | null
  /** رابط فيديو */
  video?: string | null
  /** صورة تظهر مع الإجابة (مثلاً وجه الشخصية كاملاً) */
  answerImage?: string | null
}

export interface Question {
  id: string
  /** معرّف الفئة — لازم يطابق id في categories.json */
  category: string
  points: Points
  type: QuestionType
  question: string
  answer: string
  hint?: string | null
  /** خيارات الاختيار من متعدد (لنوع multiple_choice فقط) */
  choices?: string[] | null
  media?: QuestionMedia | null
}

export interface Category {
  id: string
  name: string
  description: string
  /** رمز تعبيري أو رابط صورة (يبدأ بـ / أو http) */
  icon: string
}

export interface QuestionBank {
  categories: Category[]
  questions: Question[]
}

export type TeamId = 'A' | 'B'

export interface PowerUpDef {
  id: string
  name: string
  tagline: string
  description: string
  icon: string
}

export interface TeamPowerUp {
  id: string
  used: boolean
}

export interface Team {
  id: TeamId
  name: string
  players: string[]
  score: number
  powerUps: TeamPowerUp[]
}

export type CellStatus = 'open' | 'done'

export interface BoardCell {
  /** مفتاح فريد: `${category}:${points}:${slot}` */
  key: string
  category: string
  points: Points
  slot: 0 | 1
  questionId: string | null
  status: CellStatus
  /** الفريق اللي كسب النقاط (إن وُجد) */
  wonBy: TeamId | null
}

export interface ActiveQuestion {
  cellKey: string
  questionId: string | null
  /** الفريق صاحب الدور الأصلي */
  owner: TeamId
  /** الفريق اللي يجاوب حالياً (يتغيّر مع «حوّلها عليهم») */
  answering: TeamId
  revealed: boolean
  doubled: boolean
  hintShown: boolean
  transferred: boolean
  secondChance: boolean
  helpCalled: boolean
  extraTimeGiven: boolean
  timeLeft: number
  running: boolean
}

export type Phase =
  | 'home'
  | 'players'
  | 'teams'
  | 'categories'
  | 'powerups'
  | 'board'
  | 'question'
  | 'winner'

export interface GameState {
  version: number
  phase: Phase
  players: string[]
  teams: Record<TeamId, Team>
  /** الفئات المختارة بالترتيب (٦ فئات) */
  categories: string[]
  /** اختيارات كل فريق للفئات */
  picks: Record<TeamId, string[]>
  pickingTeam: TeamId
  powerUpTurn: TeamId
  activeTeam: TeamId
  board: BoardCell[]
  current: ActiveQuestion | null
  startedAt: number | null
  finishedAt: number | null
  defaultTimer: number
}
