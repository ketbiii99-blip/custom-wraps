import { useGame } from '../state/GameProvider'
import { POWER_UPS, POWER_UPS_PER_TEAM } from '../data/powerups'
import { buildBoard, other } from '../state/gameState'
import { pickRandom } from '../lib/utils'

export function PowerUpSelect() {
  const { state, dispatch, bank } = useGame()
  const team = state.teams[state.powerUpTurn]
  const chosen = team.powerUps.map((p) => p.id)
  const bothReady =
    state.teams.A.powerUps.length === POWER_UPS_PER_TEAM &&
    state.teams.B.powerUps.length === POWER_UPS_PER_TEAM
  const meReady = chosen.length === POWER_UPS_PER_TEAM

  function startGame() {
    dispatch({ type: 'START_BOARD', board: buildBoard(bank, state.categories) })
  }

  return (
    <div className="screen">
      <div className="screen-head">
        <div>
          <h1 className="screen-title">مساعداتكم في اللّمة</h1>
          <p className="screen-sub">كل فريق يختار ٣ مساعدات — وكل مساعدة تنستخدم مرة وحدة بس</p>
        </div>
        <button className="btn btn-ghost" onClick={() => dispatch({ type: 'GOTO', phase: 'categories' })}>
          ← رجوع
        </button>
      </div>

      <div className="panel row" style={{ alignItems: 'center', gap: 18 }}>
        <span className="turn-flag" style={{ fontSize: '1.1rem', padding: '10px 22px' }}>
          الدور على: {team.name}
        </span>
        <span className="muted">
          اخترتوا {chosen.length} من {POWER_UPS_PER_TEAM}
        </span>
        <div className="spacer" />
        <button
          className="btn btn-sm btn-cream"
          onClick={() => {
            const random = pickRandom(POWER_UPS.map((p) => p.id), POWER_UPS_PER_TEAM)
            chosen.forEach((id) => dispatch({ type: 'TOGGLE_POWERUP', team: team.id, id }))
            random.forEach((id) => dispatch({ type: 'TOGGLE_POWERUP', team: team.id, id }))
          }}
        >
          🎲 اختيار عشوائي
        </button>
        <button
          className="btn btn-sm btn-ghost"
          onClick={() => dispatch({ type: 'SET_POWERUP_TURN', team: other(state.powerUpTurn) })}
        >
          بدّل الدور ⇄
        </button>
      </div>

      <div className="powerup-grid">
        {POWER_UPS.map((p) => {
          const selected = chosen.includes(p.id)
          const full = !selected && chosen.length >= POWER_UPS_PER_TEAM
          return (
            <button
              key={p.id}
              className={`powerup-card${selected ? ' selected' : ''}`}
              disabled={full}
              onClick={() => dispatch({ type: 'TOGGLE_POWERUP', team: team.id, id: p.id })}
            >
              <span className="powerup-medal" aria-hidden="true">{p.icon}</span>
              <span>
                <span className="powerup-name">{p.name}</span>
                <br />
                <span className="powerup-tag">{p.tagline}</span>
                <br />
                <span className="powerup-tag tiny">{p.description}</span>
              </span>
            </button>
          )
        })}
      </div>

      <div className="row row-end screen-actions" style={{ gap: 12 }}>
        {!bothReady && meReady && (
          <button
            className="btn btn-lg btn-cream"
            onClick={() => dispatch({ type: 'SET_POWERUP_TURN', team: other(state.powerUpTurn) })}
          >
            دور {state.teams[other(state.powerUpTurn)].name} ←
          </button>
        )}
        <button className="btn btn-lg" disabled={!bothReady} onClick={startGame}>
          يلا على اللوحة 🎬
        </button>
      </div>
    </div>
  )
}
