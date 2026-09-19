import { formatTime } from '../lib/utils'

export function Timer({ value, total }: { value: number; total: number }) {
  const pct = Math.max(0, Math.min(100, (value / Math.max(total, 1)) * 100))
  const low = value <= 10 && value > 0
  const done = value === 0
  return (
    <div className={`timer${low ? ' low' : ''}${done ? ' done' : ''}`} role="timer" aria-live="off">
      <span aria-hidden="true" style={{ fontSize: '1.4rem' }}>⏳</span>
      <span className="timer-value">{done ? 'انتهى' : formatTime(value)}</span>
      <div className="timer-track">
        <div className="timer-fill" style={{ width: `${pct}%` }} />
      </div>
    </div>
  )
}
