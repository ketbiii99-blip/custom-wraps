import { useMemo, useState } from 'react'
import type { Points, TeamId } from '../types'
import { useGame } from '../state/GameProvider'
import { CategoryIcon } from '../components/CategoryIcon'
import { TeamScore } from '../components/TeamScore'
import { getCategory } from '../lib/bank'
import { POINT_TIERS, other, remainingCells } from '../state/gameState'

export function Board() {
  const { state, dispatch, bank } = useGame()
  const [confirmExit, setConfirmExit] = useState(false)

  const columns = useMemo(
    () =>
      state.categories.map((categoryId) => ({
        category: getCategory(bank, categoryId),
        categoryId,
        cells: POINT_TIERS.flatMap((points: Points) =>
          state.board.filter((c) => c.category === categoryId && c.points === points),
        ),
      })),
    [state.categories, state.board, bank],
  )

  const left = remainingCells(state.board)

  return (
    <div className="screen board-wrap">
      <div className="screen-head" style={{ gap: 12 }}>
        <div className="row" style={{ gap: 14, alignItems: 'baseline' }}>
          <h2 className="screen-title" style={{ fontSize: 'clamp(1.4rem, 2.4vw, 2.4rem)' }}>
            لَمّة في بيت قنون
          </h2>
          <span className="chip">باقي {left} سؤال</span>
        </div>
        <div className="row" style={{ gap: 10 }}>
          <span className="turn-flag" style={{ fontSize: '1rem', padding: '10px 20px' }}>
            الدور على: {state.teams[state.activeTeam].name}
          </span>
          <button
            className="btn btn-sm btn-ghost"
            onClick={() => dispatch({ type: 'SET_ACTIVE_TEAM', team: other(state.activeTeam) })}
          >
            بدّل الدور ⇄
          </button>
          <button className="btn btn-sm btn-ghost" onClick={() => setConfirmExit(true)}>
            خروج
          </button>
        </div>
      </div>

      <div className="board">
        {columns.map((col) => (
          <div className="board-col" key={col.categoryId}>
            <div className="board-cat">
              <CategoryIcon icon={col.category?.icon ?? '❓'} alt={col.category?.name ?? ''} />
              <span className="board-cat-name">{col.category?.name ?? col.categoryId}</span>
            </div>
            {col.cells.map((cell) => (
              <button
                key={cell.key}
                className={`tile${cell.status === 'done' ? ' done' : ''}`}
                data-points={cell.points}
                data-won={cell.wonBy ?? undefined}
                disabled={cell.status === 'done' || !cell.questionId}
                title={cell.status === 'done' ? 'انلعب هالسؤال' : `${cell.points} نقطة`}
                onClick={() => dispatch({ type: 'OPEN_CELL', cellKey: cell.key })}
              >
                <span>{cell.points}</span>
              </button>
            ))}
          </div>
        ))}
      </div>

      <div className="team-bar">
        {(['A', 'B'] as TeamId[]).map((id) => (
          <TeamScore
            key={id}
            team={state.teams[id]}
            active={state.activeTeam === id}
            compact
            onPick={() => dispatch({ type: 'SET_ACTIVE_TEAM', team: id })}
          />
        ))}
      </div>

      {confirmExit && (
        <div className="modal-backdrop" onClick={() => setConfirmExit(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3 className="screen-title" style={{ fontSize: '1.8rem' }}>تبون تطلعون؟</h3>
            <p className="muted" style={{ margin: '12px 0 20px' }}>
              اللعبة تنحفظ تلقائياً وتقدرون تكمّلونها من زر «كمّل اللعبة».
            </p>
            <div className="row row-end" style={{ gap: 12 }}>
              <button className="btn btn-ghost" onClick={() => setConfirmExit(false)}>
                لا، نكمّل
              </button>
              <button className="btn btn-red" onClick={() => dispatch({ type: 'GOTO', phase: 'home' })}>
                نعم، اطلع
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
