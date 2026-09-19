import { useMemo } from 'react'

const COLORS = ['#e4b64c', '#c2632a', '#7d1f2e', '#f7ecdd', '#2f7a4f', '#14526f']

export function Confetti({ count = 90 }: { count?: number }) {
  const pieces = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => ({
        id: i,
        left: Math.random() * 100,
        delay: Math.random() * 3.5,
        duration: 3.4 + Math.random() * 3,
        color: COLORS[i % COLORS.length],
        size: 7 + Math.random() * 9,
        round: Math.random() > 0.72,
      })),
    [count],
  )

  return (
    <div className="confetti" aria-hidden="true">
      {pieces.map((p) => (
        <i
          key={p.id}
          style={{
            insetInlineStart: `${p.left}%`,
            background: p.color,
            width: p.size,
            height: p.round ? p.size : p.size * 1.7,
            borderRadius: p.round ? '50%' : 3,
            animationDelay: `${p.delay}s`,
            animationDuration: `${p.duration}s`,
          }}
        />
      ))}
    </div>
  )
}
