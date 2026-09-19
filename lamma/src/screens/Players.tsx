import { useRef, useState } from 'react'
import { useGame } from '../state/GameProvider'

export function Players() {
  const { state, dispatch } = useGame()
  const [name, setName] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  function add() {
    const trimmed = name.trim()
    if (!trimmed) return
    dispatch({ type: 'ADD_PLAYER', name: trimmed })
    setName('')
    inputRef.current?.focus()
  }

  return (
    <div className="screen">
      <div className="screen-head">
        <div>
          <h1 className="screen-title">من موجود في اللّمة؟</h1>
          <p className="screen-sub">أضف أسماء الحاضرين — وبعدين نقسّمهم فريقين</p>
        </div>
        <button className="btn btn-ghost" onClick={() => dispatch({ type: 'GOTO', phase: 'home' })}>
          ← رجوع
        </button>
      </div>

      <div className="panel">
        <div className="row" style={{ gap: 12 }}>
          <input
            ref={inputRef}
            className="field grow"
            style={{ minWidth: 220 }}
            placeholder="اكتب اسم اللاعب…"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && add()}
          />
          <button className="btn btn-lg" onClick={add} disabled={!name.trim()}>
            + أضف لاعب
          </button>
        </div>

        {state.players.length > 0 && (
          <>
            <div className="divider" />
            <div className="player-grid">
              {state.players.map((p, i) => (
                <div key={p} className="player-pill">
                  <span className="player-avatar">{i + 1}</span>
                  <span className="grow">{p}</span>
                  <button
                    className="icon-btn"
                    aria-label={`احذف ${p}`}
                    onClick={() => dispatch({ type: 'REMOVE_PLAYER', name: p })}
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          </>
        )}

        {state.players.length === 0 && (
          <p className="muted" style={{ marginTop: 16 }}>
            ما فيه لاعبين بعد… تقدر تبدأ بدون أسماء بعد، بس اللمّة أحلى بالأسماء 😄
          </p>
        )}
      </div>

      <div className="row row-end" style={{ gap: 12 }}>
        <button
          className="btn btn-lg btn-cream"
          disabled={state.players.length < 2}
          onClick={() => {
            dispatch({ type: 'AUTO_SPLIT' })
            dispatch({ type: 'GOTO', phase: 'teams' })
          }}
        >
          🔀 قسّمنا عشوائي
        </button>
        <button className="btn btn-lg" onClick={() => dispatch({ type: 'GOTO', phase: 'teams' })}>
          التالي ←
        </button>
      </div>
    </div>
  )
}
