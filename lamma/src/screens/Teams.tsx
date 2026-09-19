import type { TeamId } from '../types'
import { useGame } from '../state/GameProvider'

export function Teams() {
  const { state, dispatch } = useGame()
  const assigned = new Set([...state.teams.A.players, ...state.teams.B.players])
  const unassigned = state.players.filter((p) => !assigned.has(p))

  return (
    <div className="screen">
      <div className="screen-head">
        <div>
          <h1 className="screen-title">سمّوا فرقكم</h1>
          <p className="screen-sub">غيّروا الأسماء واسحبوا اللاعبين بين الفريقين</p>
        </div>
        <button className="btn btn-ghost" onClick={() => dispatch({ type: 'GOTO', phase: 'players' })}>
          ← رجوع
        </button>
      </div>

      <div className="teams-grid">
        {(['A', 'B'] as TeamId[]).map((id) => {
          const team = state.teams[id]
          const otherId: TeamId = id === 'A' ? 'B' : 'A'
          return (
            <div key={id} className={`team-card ${id === 'B' ? 'b' : 'a'}`}>
              <label className="label">{id === 'A' ? 'الفريق الأول' : 'الفريق الثاني'}</label>
              <input
                className="field"
                value={team.name}
                maxLength={22}
                onChange={(e) => dispatch({ type: 'SET_TEAM_NAME', team: id, name: e.target.value })}
              />
              <div className="divider" />
              <div className="label">الأعضاء ({team.players.length})</div>
              <div className="team-players">
                {team.players.length === 0 && <span className="muted tiny">ما فيه أحد بعد</span>}
                {team.players.map((p) => (
                  <button
                    key={p}
                    className="powerup-mini"
                    style={{ cursor: 'pointer' }}
                    title="انقل للفريق الثاني"
                    onClick={() => dispatch({ type: 'MOVE_PLAYER', name: p, team: otherId })}
                  >
                    {p} <span aria-hidden="true">⇄</span>
                  </button>
                ))}
              </div>
            </div>
          )
        })}
      </div>

      {unassigned.length > 0 && (
        <div className="panel">
          <div className="label">لاعبين بدون فريق — اختر لهم فريق</div>
          <div className="player-grid">
            {unassigned.map((p) => (
              <div key={p} className="player-pill">
                <span className="grow">{p}</span>
                <button className="btn btn-sm" onClick={() => dispatch({ type: 'MOVE_PLAYER', name: p, team: 'A' })}>
                  {state.teams.A.name}
                </button>
                <button className="btn btn-sm btn-dark" onClick={() => dispatch({ type: 'MOVE_PLAYER', name: p, team: 'B' })}>
                  {state.teams.B.name}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="row row-end" style={{ gap: 12 }}>
        <button className="btn btn-lg btn-cream" onClick={() => dispatch({ type: 'AUTO_SPLIT' })}>
          🔀 قسّمنا عشوائي
        </button>
        <button className="btn btn-lg" onClick={() => dispatch({ type: 'GOTO', phase: 'categories' })}>
          اختاروا علومكم ←
        </button>
      </div>
    </div>
  )
}
