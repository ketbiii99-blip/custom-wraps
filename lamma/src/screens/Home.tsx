import { Logo } from '../components/Logo'
import { useGame } from '../state/GameProvider'

export function Home() {
  const { dispatch, savedGame, resumeGame, discardSaved } = useGame()

  return (
    <div className="screen">
      <div className="center-stack">
        <Logo />

        <div className="row row-center" style={{ gap: 18 }}>
          <button className="btn btn-xl" onClick={() => dispatch({ type: 'NEW_GAME' })}>
            يلا نبدأ
          </button>
          {savedGame && (
            <button className="btn btn-xl btn-cream" onClick={resumeGame}>
              كمّل اللعبة
            </button>
          )}
        </div>

        {savedGame && (
          <div className="row row-center tiny muted" style={{ gap: 12 }}>
            <span>
              فيه لعبة ما خلصت — {savedGame.teams.A.name} {savedGame.teams.A.score} × {savedGame.teams.B.score}{' '}
              {savedGame.teams.B.name}
            </span>
            <button className="btn btn-sm btn-ghost" onClick={discardSaved}>
              احذفها
            </button>
          </div>
        )}

        <div className="row row-center muted" style={{ gap: 26, marginTop: 10 }}>
          <span className="chip">☕ ٦ فئات</span>
          <span className="chip">❓ ٣٦ سؤال</span>
          <span className="chip">🤝 فريقين</span>
        </div>
      </div>

      <div className="row row-center tiny muted">
        <a href="#/admin" style={{ color: 'inherit', textDecoration: 'none', opacity: 0.45 }}>
          ⚙︎ لوحة الأسئلة
        </a>
      </div>
    </div>
  )
}
