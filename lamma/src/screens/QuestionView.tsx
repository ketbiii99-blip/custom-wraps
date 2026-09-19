import { useEffect, useMemo, useState } from 'react'
import { useGame } from '../state/GameProvider'
import { Timer } from '../components/Timer'
import { POWER_UPS } from '../data/powerups'
import { getCategory } from '../lib/bank'
import { isMediaUrl } from '../lib/utils'
import { EXTRA_TIME } from '../state/gameState'

export function QuestionView() {
  const { state, dispatch, bank, questionById } = useGame()
  const current = state.current
  const [menuOpen, setMenuOpen] = useState(false)
  const [judged, setJudged] = useState<'correct' | 'wrong' | null>(null)

  const question = questionById(current?.questionId ?? null)
  const cell = state.board.find((c) => c.key === current?.cellKey)
  const category = getCategory(bank, cell?.category ?? '')
  const answeringTeam = current ? state.teams[current.answering] : null

  const totalTime = useMemo(
    () => state.defaultTimer + (current?.extraTimeGiven ? EXTRA_TIME : 0),
    [state.defaultTimer, current?.extraTimeGiven],
  )

  // المؤقّت
  useEffect(() => {
    if (!current?.running) return
    const t = setInterval(() => dispatch({ type: 'TICK' }), 1000)
    return () => clearInterval(t)
  }, [current?.running, dispatch])

  // اختصارات لوحة المفاتيح للمقدّم
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === ' ') {
        e.preventDefault()
        dispatch({ type: 'SET_RUNNING', running: !current?.running })
      }
      if (e.key === 'Enter' && !current?.revealed) dispatch({ type: 'REVEAL' })
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [current?.running, current?.revealed, dispatch])

  if (!current || !cell) return null

  const worth = cell.points * (current.doubled ? 2 : 1)

  function judge(correct: boolean) {
    setJudged(correct ? 'correct' : 'wrong')
    dispatch({ type: 'JUDGE', correct })
  }

  function next() {
    setJudged(null)
    dispatch({ type: 'CLOSE_QUESTION' })
  }

  const availablePowerUps = answeringTeam
    ? answeringTeam.powerUps.filter((p) => !p.used)
    : []

  return (
    <div className={`question-screen${judged === 'wrong' ? ' shake' : ''}${judged === 'correct' ? ' flash-correct' : ''}`}>
      <div className="question-top">
        <div className="question-meta">
          <span aria-hidden="true">{category?.icon}</span>
          <span>{category?.name}</span>
          <span className={`points-badge${current.doubled ? ' doubled' : ''}`}>
            {worth} {current.doubled && '×٢'}
          </span>
        </div>

        <Timer value={current.timeLeft} total={totalTime} />

        <div className="row" style={{ gap: 10 }}>
          <span className="turn-flag" style={{ padding: '10px 20px' }}>
            {current.transferred ? 'محوّل إلى: ' : 'دور: '}
            {answeringTeam?.name}
          </span>
          <button
            className="btn btn-sm btn-ghost"
            onClick={() => dispatch({ type: 'SET_RUNNING', running: !current.running })}
          >
            {current.running ? '⏸ إيقاف' : '▶ تشغيل'}
          </button>
        </div>
      </div>

      <div className="question-body">
        {current.helpCalled && <div className="chip">🤝 فزعة! مسموح تطلبون مساعدة من شخص</div>}
        {current.secondChance && <div className="chip">🎯 يا تصيب يا تخيب — عندكم فرصتين</div>}

        {question ? (
          <>
            <h2 className="question-text">{question.question}</h2>

            {question.media && (
              <div className="question-media row row-center">
                {isMediaUrl(question.media.image) && (
                  <img src={question.media.image} alt="صورة السؤال" />
                )}
                {isMediaUrl(question.media.audio) && (
                  <audio src={question.media.audio} controls autoPlay />
                )}
                {isMediaUrl(question.media.video) && (
                  <video src={question.media.video} controls autoPlay />
                )}
              </div>
            )}

            {question.type === 'multiple_choice' && question.choices && question.choices.length > 0 && (
              <div className="choices">
                {question.choices.map((choice, i) => (
                  <div key={choice + i} className="choice">
                    {['أ', 'ب', 'ج', 'د', 'هـ', 'و'][i] ?? i + 1} — {choice}
                  </div>
                ))}
              </div>
            )}

            {current.hintShown && question.hint && (
              <div className="hint-box">💡 تلميح: {question.hint}</div>
            )}

            {current.revealed && (
              <div className="answer-box">
                <div className="answer-label">الإجابة الصحيحة</div>
                <div className="answer-text">{question.answer}</div>
                {isMediaUrl(question.media?.answerImage) && (
                  <img
                    src={question.media?.answerImage ?? ''}
                    alt="صورة الإجابة"
                    style={{ maxHeight: '26vh', borderRadius: 18, marginTop: 14 }}
                  />
                )}
              </div>
            )}
          </>
        ) : (
          <h2 className="question-text">ما فيه سؤال مربوط بهالخانة — أضف أسئلة من لوحة /admin</h2>
        )}
      </div>

      <div className="question-actions">
        {!current.revealed && (
          <>
            <button
              className="btn btn-lg btn-cream"
              disabled={availablePowerUps.length === 0}
              onClick={() => setMenuOpen(true)}
            >
              🎁 استخدم مساعدة
            </button>
            <button className="btn btn-lg btn-gold" onClick={() => dispatch({ type: 'REVEAL' })}>
              أظهر الإجابة
            </button>
          </>
        )}

        {current.revealed && judged === null && (
          <>
            <button className="btn btn-lg btn-green" onClick={() => judge(true)}>
              ✓ إجابة صحيحة
            </button>
            <button className="btn btn-lg btn-red" onClick={() => judge(false)}>
              ✕ إجابة خاطئة
            </button>
          </>
        )}

        {judged !== null && (
          <>
            <span className="chip" style={{ fontSize: '1.2rem', padding: '14px 24px' }}>
              {judged === 'correct'
                ? `✓ ${answeringTeam?.name} +${worth}`
                : current.transferred
                  ? `✕ ${answeringTeam?.name} −${worth}`
                  : '✕ ما حد كسب النقاط'}
            </span>
            <button className="btn btn-lg" onClick={next}>
              السؤال الجاي ←
            </button>
          </>
        )}
      </div>

      {menuOpen && (
        <div className="modal-backdrop" onClick={() => setMenuOpen(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3 className="screen-title" style={{ fontSize: '1.8rem' }}>
              مساعدات {answeringTeam?.name}
            </h3>
            <div className="divider" />
            <div className="powerup-grid">
              {POWER_UPS.filter((p) => answeringTeam?.powerUps.some((tp) => tp.id === p.id)).map((p) => {
                const owned = answeringTeam?.powerUps.find((tp) => tp.id === p.id)
                const blocked =
                  owned?.used ||
                  (p.id === 'hawwilha' && current.transferred) ||
                  (p.id === 'oloum_ganoun' && !question?.hint) ||
                  current.revealed
                return (
                  <button
                    key={p.id}
                    className="powerup-card"
                    disabled={blocked}
                    onClick={() => {
                      dispatch({ type: 'USE_POWERUP', id: p.id })
                      setMenuOpen(false)
                    }}
                  >
                    <span className="powerup-medal" aria-hidden="true">{p.icon}</span>
                    <span>
                      <span className="powerup-name">{p.name}</span>
                      <br />
                      <span className="powerup-tag">{owned?.used ? 'انستخدمت' : p.tagline}</span>
                    </span>
                  </button>
                )
              })}
            </div>
            {availablePowerUps.length === 0 && (
              <p className="muted" style={{ marginTop: 16 }}>خلصت مساعداتكم 😅</p>
            )}
            <div className="row row-end" style={{ marginTop: 18 }}>
              <button className="btn btn-ghost" onClick={() => setMenuOpen(false)}>
                إغلاق
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
