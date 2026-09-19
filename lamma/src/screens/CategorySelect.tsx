import type { TeamId } from '../types'
import { useGame } from '../state/GameProvider'
import { CategoryIcon } from '../components/CategoryIcon'
import { playableCategories } from '../lib/bank'
import { CATEGORIES_PER_TEAM, other } from '../state/gameState'
import { pickRandom } from '../lib/utils'

export function CategorySelect() {
  const { state, dispatch, bank } = useGame()
  const categories = playableCategories(bank)
  const picks = state.picks
  const picking = state.pickingTeam
  const pickingTeam = state.teams[picking]
  const done = picks.A.length === CATEGORIES_PER_TEAM && picks.B.length === CATEGORIES_PER_TEAM

  function ownerOf(id: string): TeamId | null {
    if (picks.A.includes(id)) return 'A'
    if (picks.B.includes(id)) return 'B'
    return null
  }

  function randomAll() {
    const chosen = pickRandom(
      categories.map((c) => c.id),
      CATEGORIES_PER_TEAM * 2,
    )
    dispatch({
      type: 'SET_CATEGORIES',
      picks: { A: chosen.slice(0, CATEGORIES_PER_TEAM), B: chosen.slice(CATEGORIES_PER_TEAM) },
    })
  }

  return (
    <div className="screen">
      <div className="screen-head">
        <div>
          <h1 className="screen-title">اختاروا علومكم</h1>
          <p className="screen-sub">
            كل فريق يختار ٣ فئات — المجموع ٦ فئات و٣٦ سؤال
          </p>
        </div>
        <button className="btn btn-ghost" onClick={() => dispatch({ type: 'GOTO', phase: 'teams' })}>
          ← رجوع
        </button>
      </div>

      <div className="panel row" style={{ alignItems: 'center', gap: 18 }}>
        {!done ? (
          <>
            <span className="turn-flag" style={{ fontSize: '1.1rem', padding: '10px 22px' }}>
              الدور على: {pickingTeam.name}
            </span>
            <span className="muted">
              اختاروا {CATEGORIES_PER_TEAM - picks[picking].length} فئات إضافية
            </span>
            <button
              className="btn btn-sm btn-ghost"
              onClick={() => dispatch({ type: 'SET_PICKING_TEAM', team: other(picking) })}
            >
              بدّل الدور ⇄
            </button>
          </>
        ) : (
          <span className="turn-flag" style={{ fontSize: '1.1rem', padding: '10px 22px' }}>
            ✓ اكتملت الفئات الست
          </span>
        )}
        <div className="spacer" />
        <button className="btn btn-sm btn-cream" onClick={randomAll}>
          🎲 اختيار عشوائي
        </button>
      </div>

      <div className="category-grid">
        {categories.map((c) => {
          const owner = ownerOf(c.id)
          const takenByOther = owner !== null && owner !== picking
          const full = picks[picking].length >= CATEGORIES_PER_TEAM && owner !== picking
          return (
            <button
              key={c.id}
              className={[
                'category-card',
                owner === 'A' ? 'picked-a' : '',
                owner === 'B' ? 'picked-b' : '',
                takenByOther || full ? 'taken' : '',
              ]
                .filter(Boolean)
                .join(' ')}
              disabled={takenByOther || full}
              onClick={() => dispatch({ type: 'TOGGLE_CATEGORY', categoryId: c.id })}
            >
              {owner && (
                <span className={`pick-badge ${owner === 'A' ? 'a' : 'b'}`}>
                  {state.teams[owner].name}
                </span>
              )}
              <CategoryIcon icon={c.icon} alt={c.name} />
              <span className="cat-name">{c.name}</span>
              <span className="cat-desc">{c.description}</span>
            </button>
          )
        })}
      </div>

      <div className="row row-end screen-actions">
        <button
          className="btn btn-lg"
          disabled={!done}
          onClick={() => dispatch({ type: 'GOTO', phase: 'powerups' })}
        >
          اختاروا مساعداتكم ←
        </button>
      </div>
    </div>
  )
}
