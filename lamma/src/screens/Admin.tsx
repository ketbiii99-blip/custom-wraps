import { useMemo, useRef, useState } from 'react'
import type { Category, Points, Question, QuestionBank, QuestionType } from '../types'
import {
  DEFAULT_BANK,
  categoryReadiness,
  exportBankJSON,
  loadBank,
  parseBankJSON,
  resetBank,
  saveBank,
} from '../lib/bank'
import { Toast } from '../components/Toast'
import { uid } from '../lib/utils'

const TYPE_LABELS: Record<QuestionType, string> = {
  text: 'نصّي',
  image: 'صورة',
  audio: 'صوت',
  video: 'فيديو',
  multiple_choice: 'اختيار من متعدد',
  guess_the_person: 'منو هذا؟',
  guess_the_image: 'خمّن الصورة',
}

const POINTS: Points[] = [200, 400, 600]

type Tab = 'questions' | 'categories' | 'data'

export function Admin() {
  const [bank, setBank] = useState<QuestionBank>(() => loadBank())
  const [tab, setTab] = useState<Tab>('questions')
  const [toast, setToast] = useState<string | null>(null)

  function commit(next: QuestionBank, message?: string) {
    saveBank(next)
    setBank({ ...next })
    if (message) setToast(message)
  }

  const sizeKB = useMemo(() => Math.round(JSON.stringify(bank).length / 1024), [bank])

  return (
    <div className="app-shell admin">
      <div className="screen">
        <div className="screen-head">
          <div>
            <h1 className="screen-title">لوحة الأسئلة</h1>
            <p className="screen-sub">أضف وعدّل فئاتك وأسئلتك — كل شي ينحفظ في هالجهاز</p>
          </div>
          <div className="row" style={{ gap: 10 }}>
            <span className="chip">{bank.categories.length} فئة</span>
            <span className="chip">{bank.questions.length} سؤال</span>
            <span className="chip" title="حجم البنك المحفوظ">{sizeKB} كيلوبايت</span>
            <a className="btn btn-sm btn-ghost" href="#/">← رجوع للّعبة</a>
          </div>
        </div>

        <div className="admin-tabs">
          {(
            [
              ['questions', '❓ الأسئلة'],
              ['categories', '🗂️ الفئات'],
              ['data', '💾 استيراد وتصدير'],
            ] as [Tab, string][]
          ).map(([id, label]) => (
            <button
              key={id}
              className={`btn btn-sm ${tab === id ? 'btn-gold' : 'btn-ghost'}`}
              onClick={() => setTab(id)}
            >
              {label}
            </button>
          ))}
        </div>

        {tab === 'questions' && <QuestionsTab bank={bank} commit={commit} />}
        {tab === 'categories' && <CategoriesTab bank={bank} commit={commit} />}
        {tab === 'data' && <DataTab bank={bank} commit={commit} setToast={setToast} />}
      </div>

      {toast && <Toast message={toast} onDone={() => setToast(null)} />}
    </div>
  )
}

/* ------------------------------- الأسئلة ------------------------------- */

function emptyQuestion(categoryId: string): Question {
  return {
    id: uid('q'),
    category: categoryId,
    points: 200,
    type: 'text',
    question: '',
    answer: '',
    hint: '',
    choices: [],
    media: { image: null, audio: null, video: null, answerImage: null },
  }
}

function QuestionsTab({
  bank,
  commit,
}: {
  bank: QuestionBank
  commit: (next: QuestionBank, message?: string) => void
}) {
  const [filterCat, setFilterCat] = useState('')
  const [filterPoints, setFilterPoints] = useState('')
  const [search, setSearch] = useState('')
  const [editing, setEditing] = useState<Question | null>(null)

  const rows = bank.questions.filter(
    (q) =>
      (!filterCat || q.category === filterCat) &&
      (!filterPoints || q.points === Number(filterPoints)) &&
      (!search ||
        q.question.includes(search) ||
        q.answer.includes(search) ||
        q.id.includes(search)),
  )

  function save(q: Question) {
    const exists = bank.questions.some((x) => x.id === q.id)
    const questions = exists
      ? bank.questions.map((x) => (x.id === q.id ? q : x))
      : [...bank.questions, q]
    commit({ ...bank, questions }, exists ? 'تم حفظ السؤال' : 'تمت إضافة السؤال')
    setEditing(null)
  }

  function remove(id: string) {
    if (!confirm('متأكد تبي تحذف هالسؤال؟')) return
    commit({ ...bank, questions: bank.questions.filter((q) => q.id !== id) }, 'تم حذف السؤال')
  }

  return (
    <>
      <div className="panel row" style={{ gap: 12 }}>
        <select className="field" style={{ maxWidth: 260 }} value={filterCat} onChange={(e) => setFilterCat(e.target.value)}>
          <option value="">كل الفئات</option>
          {bank.categories.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
        <select className="field" style={{ maxWidth: 180 }} value={filterPoints} onChange={(e) => setFilterPoints(e.target.value)}>
          <option value="">كل المستويات</option>
          {POINTS.map((p) => (
            <option key={p} value={p}>{p} نقطة</option>
          ))}
        </select>
        <input
          className="field grow"
          placeholder="بحث في السؤال أو الإجابة…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <button
          className="btn"
          disabled={bank.categories.length === 0}
          onClick={() => setEditing(emptyQuestion(filterCat || bank.categories[0]?.id || ''))}
        >
          + سؤال جديد
        </button>
      </div>

      <div className="admin-scroll">
        <table className="admin-table">
          <thead>
            <tr>
              <th style={{ width: 90 }}>النقاط</th>
              <th style={{ width: 170 }}>الفئة</th>
              <th>السؤال</th>
              <th style={{ width: 200 }}>الإجابة</th>
              <th style={{ width: 130 }}>النوع</th>
              <th style={{ width: 150 }}>إجراءات</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((q) => (
              <tr key={q.id}>
                <td><span className="badge-points" data-p={q.points}>{q.points}</span></td>
                <td>{bank.categories.find((c) => c.id === q.category)?.name ?? q.category}</td>
                <td>{q.question || <span className="muted">(فارغ)</span>}</td>
                <td className="muted">{q.answer}</td>
                <td className="tiny">{TYPE_LABELS[q.type] ?? q.type}</td>
                <td>
                  <div className="row" style={{ gap: 8 }}>
                    <button className="btn btn-sm btn-ghost" onClick={() => setEditing(q)}>تعديل</button>
                    <button className="btn btn-sm btn-red" onClick={() => remove(q.id)}>حذف</button>
                  </div>
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={6} className="muted" style={{ padding: 24, textAlign: 'center' }}>
                  ما فيه أسئلة مطابقة
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {editing && (
        <QuestionModal
          bank={bank}
          question={editing}
          onCancel={() => setEditing(null)}
          onSave={save}
        />
      )}
    </>
  )
}

function QuestionModal({
  bank,
  question,
  onSave,
  onCancel,
}: {
  bank: QuestionBank
  question: Question
  onSave: (q: Question) => void
  onCancel: () => void
}) {
  const [draft, setDraft] = useState<Question>({
    ...question,
    media: question.media ?? { image: null, audio: null, video: null, answerImage: null },
  })
  const fileRef = useRef<HTMLInputElement>(null)

  function patch(p: Partial<Question>) {
    setDraft((d) => ({ ...d, ...p }))
  }
  function patchMedia(p: Partial<NonNullable<Question['media']>>) {
    setDraft((d) => ({ ...d, media: { ...(d.media ?? {}), ...p } }))
  }

  function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 1.5 * 1024 * 1024) {
      alert('الصورة كبيرة — يفضّل أقل من ١.٥ ميجابايت، أو حطها في مجلد public/assets واستخدم المسار')
    }
    const reader = new FileReader()
    reader.onload = () => patchMedia({ image: String(reader.result) })
    reader.readAsDataURL(file)
  }

  const valid = draft.question.trim() && draft.answer.trim() && draft.category

  return (
    <div className="modal-backdrop" onClick={onCancel}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h3 className="screen-title" style={{ fontSize: '1.8rem' }}>
          {bank.questions.some((q) => q.id === question.id) ? 'تعديل سؤال' : 'سؤال جديد'}
        </h3>
        <div className="divider" />

        <div className="form-grid">
          <div>
            <label className="label">الفئة</label>
            <select className="field" value={draft.category} onChange={(e) => patch({ category: e.target.value })}>
              {bank.categories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="label">النقاط</label>
            <select
              className="field"
              value={draft.points}
              onChange={(e) => patch({ points: Number(e.target.value) as Points })}
            >
              {POINTS.map((p) => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="label">نوع السؤال</label>
            <select
              className="field"
              value={draft.type}
              onChange={(e) => patch({ type: e.target.value as QuestionType })}
            >
              {Object.entries(TYPE_LABELS).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </div>

          <div className="full">
            <label className="label">نص السؤال</label>
            <textarea className="field" value={draft.question} onChange={(e) => patch({ question: e.target.value })} />
          </div>

          <div className="full">
            <label className="label">الإجابة</label>
            <input className="field" value={draft.answer} onChange={(e) => patch({ answer: e.target.value })} />
          </div>

          <div className="full">
            <label className="label">تلميح (اختياري — يظهر مع مساعدة «علوم قنون»)</label>
            <input className="field" value={draft.hint ?? ''} onChange={(e) => patch({ hint: e.target.value })} />
          </div>

          {draft.type === 'multiple_choice' && (
            <div className="full">
              <label className="label">الخيارات (كل خيار في سطر)</label>
              <textarea
                className="field"
                value={(draft.choices ?? []).join('\n')}
                onChange={(e) => patch({ choices: e.target.value.split('\n').filter((x) => x.trim()) })}
              />
            </div>
          )}

          <div className="full">
            <label className="label">صورة السؤال (مسار مثل /assets/pic.jpg أو رابط)</label>
            <div className="row" style={{ gap: 10 }}>
              <input
                className="field grow"
                value={draft.media?.image ?? ''}
                placeholder="/assets/my-photo.jpg"
                onChange={(e) => patchMedia({ image: e.target.value || null })}
              />
              <button className="btn btn-sm btn-cream" onClick={() => fileRef.current?.click()}>
                ⬆︎ ارفع صورة
              </button>
              <input ref={fileRef} type="file" accept="image/*" hidden onChange={onFile} />
            </div>
            {draft.media?.image && (
              <img
                src={draft.media.image}
                alt="معاينة"
                style={{ maxHeight: 140, marginTop: 10, borderRadius: 12 }}
              />
            )}
          </div>

          <div>
            <label className="label">رابط صوت</label>
            <input
              className="field"
              value={draft.media?.audio ?? ''}
              placeholder="/assets/clip.mp3"
              onChange={(e) => patchMedia({ audio: e.target.value || null })}
            />
          </div>

          <div>
            <label className="label">رابط فيديو</label>
            <input
              className="field"
              value={draft.media?.video ?? ''}
              placeholder="/assets/clip.mp4"
              onChange={(e) => patchMedia({ video: e.target.value || null })}
            />
          </div>

          <div className="full">
            <label className="label">صورة تظهر مع الإجابة (اختياري)</label>
            <input
              className="field"
              value={draft.media?.answerImage ?? ''}
              onChange={(e) => patchMedia({ answerImage: e.target.value || null })}
            />
          </div>
        </div>

        <div className="row row-end" style={{ gap: 12, marginTop: 20 }}>
          <button className="btn btn-ghost" onClick={onCancel}>إلغاء</button>
          <button className="btn btn-gold" disabled={!valid} onClick={() => onSave(draft)}>
            حفظ
          </button>
        </div>
      </div>
    </div>
  )
}

/* ------------------------------- الفئات ------------------------------- */

function CategoriesTab({
  bank,
  commit,
}: {
  bank: QuestionBank
  commit: (next: QuestionBank, message?: string) => void
}) {
  const [editing, setEditing] = useState<Category | null>(null)

  function save(cat: Category) {
    const exists = bank.categories.some((c) => c.id === cat.id)
    const categories = exists
      ? bank.categories.map((c) => (c.id === cat.id ? cat : c))
      : [...bank.categories, cat]
    commit({ ...bank, categories }, exists ? 'تم حفظ الفئة' : 'تمت إضافة الفئة')
    setEditing(null)
  }

  function remove(cat: Category) {
    const count = bank.questions.filter((q) => q.category === cat.id).length
    if (!confirm(`حذف «${cat.name}» مع ${count} سؤال؟`)) return
    commit(
      {
        categories: bank.categories.filter((c) => c.id !== cat.id),
        questions: bank.questions.filter((q) => q.category !== cat.id),
      },
      'تم حذف الفئة',
    )
  }

  return (
    <>
      <div className="panel row row-end">
        <button
          className="btn"
          onClick={() => setEditing({ id: uid('cat'), name: '', description: '', icon: '⭐' })}
        >
          + فئة جديدة
        </button>
      </div>

      <div className="admin-scroll">
        <table className="admin-table">
          <thead>
            <tr>
              <th style={{ width: 70 }}>الرمز</th>
              <th>الاسم</th>
              <th>الوصف</th>
              <th style={{ width: 200 }}>الأسئلة (٢٠٠ / ٤٠٠ / ٦٠٠)</th>
              <th style={{ width: 150 }}>إجراءات</th>
            </tr>
          </thead>
          <tbody>
            {bank.categories.map((c) => {
              const r = categoryReadiness(bank, c.id)
              const ready = r[200] >= 2 && r[400] >= 2 && r[600] >= 2
              return (
                <tr key={c.id}>
                  <td style={{ fontSize: '1.6rem' }}>
                    {/^(https?:|\/|data:)/.test(c.icon) ? <img src={c.icon} alt="" style={{ width: 40, borderRadius: 8 }} /> : c.icon}
                  </td>
                  <td style={{ fontWeight: 800 }}>{c.name}<div className="tiny muted">{c.id}</div></td>
                  <td className="muted">{c.description}</td>
                  <td>
                    <span className="chip tiny" style={{ color: ready ? '#9fe0b8' : '#ffb39f' }}>
                      {r[200]} / {r[400]} / {r[600]} {ready ? '✓ جاهزة' : '— تحتاج سؤالين بكل مستوى'}
                    </span>
                  </td>
                  <td>
                    <div className="row" style={{ gap: 8 }}>
                      <button className="btn btn-sm btn-ghost" onClick={() => setEditing(c)}>تعديل</button>
                      <button className="btn btn-sm btn-red" onClick={() => remove(c)}>حذف</button>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {editing && (
        <div className="modal-backdrop" onClick={() => setEditing(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3 className="screen-title" style={{ fontSize: '1.8rem' }}>بيانات الفئة</h3>
            <div className="divider" />
            <div className="form-grid">
              <div>
                <label className="label">المعرّف (بالإنجليزي، بدون مسافات)</label>
                <input
                  className="field"
                  value={editing.id}
                  onChange={(e) => setEditing({ ...editing, id: e.target.value.trim() })}
                />
              </div>
              <div>
                <label className="label">الرمز (إيموجي أو مسار صورة)</label>
                <input
                  className="field"
                  value={editing.icon}
                  onChange={(e) => setEditing({ ...editing, icon: e.target.value })}
                />
              </div>
              <div className="full">
                <label className="label">الاسم</label>
                <input
                  className="field"
                  value={editing.name}
                  onChange={(e) => setEditing({ ...editing, name: e.target.value })}
                />
              </div>
              <div className="full">
                <label className="label">وصف قصير</label>
                <input
                  className="field"
                  value={editing.description}
                  onChange={(e) => setEditing({ ...editing, description: e.target.value })}
                />
              </div>
            </div>
            <div className="row row-end" style={{ gap: 12, marginTop: 20 }}>
              <button className="btn btn-ghost" onClick={() => setEditing(null)}>إلغاء</button>
              <button
                className="btn btn-gold"
                disabled={!editing.id || !editing.name}
                onClick={() => save(editing)}
              >
                حفظ
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

/* --------------------------- استيراد وتصدير --------------------------- */

function DataTab({
  bank,
  commit,
  setToast,
}: {
  bank: QuestionBank
  commit: (next: QuestionBank, message?: string) => void
  setToast: (m: string) => void
}) {
  const importRef = useRef<HTMLInputElement>(null)

  function exportJSON() {
    const blob = new Blob([exportBankJSON(bank)], { type: 'application/json;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `lamma-bank-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(url)
    setToast('تم تصدير بنك الأسئلة')
  }

  function importJSON(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      try {
        const next = parseBankJSON(String(reader.result))
        commit(next, `تم استيراد ${next.questions.length} سؤال`)
      } catch (err) {
        alert('ما قدرنا نقرأ الملف: ' + (err as Error).message)
      }
    }
    reader.readAsText(file)
    e.target.value = ''
  }

  return (
    <div className="teams-grid">
      <div className="panel">
        <h3 className="screen-title" style={{ fontSize: '1.5rem' }}>تصدير</h3>
        <p className="muted" style={{ margin: '10px 0 18px' }}>
          نزّل نسخة JSON من كل الفئات والأسئلة — تقدر تحطها في <code>src/data</code> أو ترجّعها لاحقاً.
        </p>
        <button className="btn btn-block" onClick={exportJSON}>⬇︎ صدّر JSON</button>
      </div>

      <div className="panel">
        <h3 className="screen-title" style={{ fontSize: '1.5rem' }}>استيراد</h3>
        <p className="muted" style={{ margin: '10px 0 18px' }}>
          ارفع ملف JSON فيه <code>categories</code> و <code>questions</code> — بيستبدل البنك الحالي.
        </p>
        <button className="btn btn-block btn-cream" onClick={() => importRef.current?.click()}>
          ⬆︎ استورد JSON
        </button>
        <input ref={importRef} type="file" accept="application/json,.json" hidden onChange={importJSON} />
      </div>

      <div className="panel">
        <h3 className="screen-title" style={{ fontSize: '1.5rem' }}>إرجاع الأصل</h3>
        <p className="muted" style={{ margin: '10px 0 18px' }}>
          يرجّع البنك للأسئلة الجاهزة في الملفات ({DEFAULT_BANK.questions.length} سؤال) ويمسح تعديلاتك المحفوظة.
        </p>
        <button
          className="btn btn-block btn-red"
          onClick={() => {
            if (!confirm('متأكد؟ بتروح كل تعديلاتك المحفوظة في هالجهاز')) return
            commit(resetBank(), 'رجعنا البنك الأصلي')
          }}
        >
          ↺ رجّع الأسئلة الأصلية
        </button>
      </div>
    </div>
  )
}
