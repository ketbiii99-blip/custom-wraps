import { useEffect, useRef, useState } from 'react'
import type { Team, TeamId } from '../types'
import { POWER_UP_MAP } from '../data/powerups'
import { formatScore } from '../lib/utils'

interface Props {
  team: Team
  active?: boolean
  showPowerUps?: boolean
  compact?: boolean
  /** نص الشارة اللي تظهر فوق الفريق المميّز */
  activeLabel?: string
  onPick?: () => void
}

export function TeamScore({
  team,
  active = false,
  showPowerUps = true,
  compact = false,
  activeLabel = 'دوركم',
  onPick,
}: Props) {
  const [bump, setBump] = useState(false)
  const prev = useRef(team.score)

  useEffect(() => {
    if (prev.current !== team.score) {
      prev.current = team.score
      setBump(true)
      const t = setTimeout(() => setBump(false), 620)
      return () => clearTimeout(t)
    }
  }, [team.score])

  return (
    <div
      className={`team-card ${team.id === 'B' ? 'b' : 'a'}${active ? ' active' : ''}${compact ? ' compact' : ''}`}
      onClick={onPick}
      style={onPick ? { cursor: 'pointer' } : undefined}
    >
      <div className="scoreboard-team">
        <div className="grow" style={{ minWidth: 160 }}>
          <div className="team-name">
            <span aria-hidden="true">👥</span>
            {team.name}
            {active && <span className="turn-flag">{activeLabel}</span>}
          </div>
          {team.players.length > 0 && (
            <div className="team-players">
              {team.players.map((p) => (
                <span key={p} className="powerup-mini">{p}</span>
              ))}
            </div>
          )}
        </div>
        <div className={`team-score${bump ? ' bump' : ''}`}>{formatScore(team.score)}</div>
      </div>

      {showPowerUps && team.powerUps.length > 0 && (
        <div className="team-players" style={{ marginTop: 12 }}>
          {team.powerUps.map((p) => {
            const def = POWER_UP_MAP[p.id]
            if (!def) return null
            return (
              <span key={p.id} className={`powerup-mini${p.used ? ' used' : ''}`}>
                <span aria-hidden="true">{def.icon}</span> {def.name}
              </span>
            )
          })}
        </div>
      )}
    </div>
  )
}

export function teamAccent(id: TeamId): string {
  return id === 'A' ? 'var(--team-a)' : 'var(--team-b)'
}
