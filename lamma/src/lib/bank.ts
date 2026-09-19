import type { Category, Question, QuestionBank } from '../types'
import baseCategories from '../data/categories.json'
import baseQuestions from '../data/questions.json'
import { BANK_KEY, readJSON, writeJSON, removeKey } from './storage'

/**
 * بنك الأسئلة: يبدأ من ملفات JSON داخل src/data،
 * وأي تعديل من لوحة التحكم /admin ينحفظ في localStorage ويطغى على الملفات.
 */
export const DEFAULT_BANK: QuestionBank = {
  categories: baseCategories as Category[],
  questions: baseQuestions as Question[],
}

let cache: QuestionBank | null = null
const listeners = new Set<(bank: QuestionBank) => void>()

function clone(bank: QuestionBank): QuestionBank {
  return JSON.parse(JSON.stringify(bank)) as QuestionBank
}

export function loadBank(): QuestionBank {
  if (cache) return cache
  const stored = readJSON<QuestionBank>(BANK_KEY)
  cache =
    stored && Array.isArray(stored.categories) && Array.isArray(stored.questions)
      ? stored
      : clone(DEFAULT_BANK)
  return cache
}

export function saveBank(bank: QuestionBank): void {
  cache = bank
  writeJSON(BANK_KEY, bank)
  listeners.forEach((fn) => fn(bank))
}

export function resetBank(): QuestionBank {
  removeKey(BANK_KEY)
  cache = clone(DEFAULT_BANK)
  listeners.forEach((fn) => fn(cache as QuestionBank))
  return cache
}

export function subscribeBank(fn: (bank: QuestionBank) => void): () => void {
  listeners.add(fn)
  return () => listeners.delete(fn)
}

export function getCategory(bank: QuestionBank, id: string): Category | undefined {
  return bank.categories.find((c) => c.id === id)
}

export function questionsFor(bank: QuestionBank, categoryId: string, points: number): Question[] {
  return bank.questions.filter((q) => q.category === categoryId && q.points === points)
}

/** الفئات الجاهزة للعب: لازم فيها سؤالين على الأقل لكل مستوى. */
export function playableCategories(bank: QuestionBank): Category[] {
  return bank.categories.filter((c) =>
    ([200, 400, 600] as const).every((p) => questionsFor(bank, c.id, p).length >= 1),
  )
}

export function categoryReadiness(bank: QuestionBank, categoryId: string) {
  return {
    200: questionsFor(bank, categoryId, 200).length,
    400: questionsFor(bank, categoryId, 400).length,
    600: questionsFor(bank, categoryId, 600).length,
  }
}

export function exportBankJSON(bank: QuestionBank): string {
  return JSON.stringify(bank, null, 2)
}

export function parseBankJSON(text: string): QuestionBank {
  const parsed = JSON.parse(text) as Partial<QuestionBank>
  if (!parsed || !Array.isArray(parsed.categories) || !Array.isArray(parsed.questions)) {
    throw new Error('الملف لازم يحتوي على categories و questions')
  }
  return { categories: parsed.categories, questions: parsed.questions }
}
