import { useMemo } from 'react'
import type { TeamId } from '../types'
import { useGame } from '../state/GameProvider'
import { Confetti } from '../components/Confetti'
import { TeamScore } from '../components/TeamScore'
import { buildBoard } from '../state/gameState'

export function Winner() {
  const { state, dispatch, bank } = useGame()
  const a = state.teams.A
  const b = state.teams.B

  const winner = useMemo(() => {
    if (a.score === b.score) return null
    return a.score > b.score ? a : b
  }, [a, b])

  return (
    <div className="screen">
      <Confetti />
      <div className="winner-screen">
        <div className="trophy" aria-hidden="true">🏆</div>
        <div className="winner-word">كفو!</div>

        {winner ? (
          <>
            <div className="winner-tag">فريق</div>
            <div className="winner-team">{winner.name}</div>
            <div className="winner-tag">كسب لَمّة الليلة</div>
          </>
        ) : (
          <>
            <div className="winner-team">تعادل!</div>
            <div className="winner-tag">اللّمة انتهت بالتساوي — نعيدها؟</div>
          </>
        )}

        <div className="final-scores">
          {(['A', 'B'] as TeamId[]).map((id) => (
            <TeamScore
              key={id}
              team={state.teams[id]}
              active={winner?.id === id}
              activeLabel="الفائز 🏆"
              showPowerUps={false}
              compact
            />
          ))}
        </div>

        <div className="row row-center" style={{ gap: 16, marginTop: 10 }}>
          <button className="btn btn-xl" onClick={() => dispatch({ type: 'NEW_GAME' })}>
            لعبة جديدة
          </button>
          <button
            className="btn btn-xl btn-cream"
            onClick={() => dispatch({ type: 'REMATCH', board: buildBoard(bank, state.categories) })}
          >
            إعادة نفس الفئات
          </button>
        </div>
      </div>
    </div>
  )
}
