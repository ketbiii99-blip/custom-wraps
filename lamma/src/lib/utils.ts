export function shuffle<T>(input: readonly T[]): T[] {
  const arr = [...input]
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[arr[i], arr[j]] = [arr[j], arr[i]]
  }
  return arr
}

export function pickRandom<T>(input: readonly T[], count: number): T[] {
  return shuffle(input).slice(0, count)
}

export function uid(prefix = 'id'): string {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`
}

/** الأرقام العربية الهندية اختيارية — نستخدم الأرقام اللاتينية للوضوح على الشاشة الكبيرة */
export function formatScore(n: number): string {
  return new Intl.NumberFormat('ar-AE', { useGrouping: true }).format(n)
}

export function formatTime(seconds: number): string {
  const s = Math.max(0, Math.round(seconds))
  const m = Math.floor(s / 60)
  const r = s % 60
  return m > 0 ? `${m}:${String(r).padStart(2, '0')}` : String(r)
}

export function isMediaUrl(value?: string | null): value is string {
  return typeof value === 'string' && value.trim().length > 0
}
