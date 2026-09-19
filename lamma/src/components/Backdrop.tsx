/** خلفية زخرفية: فوانيس معلّقة وأفق نخيل — بسيطة وما تزاحم المحتوى. */
export function Backdrop() {
  return (
    <div className="backdrop" aria-hidden="true">
      <Lantern className="backdrop-lamp start" />
      <Lantern className="backdrop-lamp end" />
      <svg className="backdrop-palms" viewBox="0 0 1200 260" preserveAspectRatio="none">
        <defs>
          <linearGradient id="palmGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#0d0704" stopOpacity="0.1" />
            <stop offset="100%" stopColor="#0d0704" stopOpacity="0.95" />
          </linearGradient>
        </defs>
        <path
          d="M0 260 L0 210 Q120 170 240 205 Q360 150 480 200 Q600 140 720 195 Q840 155 960 205 Q1080 170 1200 212 L1200 260 Z"
          fill="url(#palmGrad)"
        />
        {[110, 340, 620, 890, 1090].map((x, i) => (
          <g
            key={x}
            transform={`translate(${x} ${248 - (i % 2) * 12}) scale(${1.5 + (i % 3) * 0.3})`}
            fill="#0b0503"
            opacity="0.9"
          >
            <path d="M-5 0 C -3 -30 2 -58 6 -86 L 12 -86 C 9 -56 5 -28 4 0 Z" />
            <path d="M8 -88 C -18 -104 -46 -106 -68 -94 C -44 -98 -22 -94 -4 -84 Z" />
            <path d="M8 -88 C 34 -104 62 -106 84 -94 C 60 -98 38 -94 20 -84 Z" />
            <path d="M8 -90 C -14 -112 -38 -124 -60 -124 C -38 -116 -20 -104 -4 -88 Z" />
            <path d="M8 -90 C 30 -112 54 -124 76 -124 C 54 -116 36 -104 20 -88 Z" />
            <path d="M8 -92 C -2 -118 -12 -136 -28 -148 C -16 -128 -8 -110 -4 -92 Z" />
            <path d="M8 -92 C 18 -118 28 -136 44 -148 C 32 -128 24 -110 20 -92 Z" />
            <circle cx="8" cy="-88" r="5" />
          </g>
        ))}
      </svg>
    </div>
  )
}

function Lantern({ className }: { className: string }) {
  return (
    <svg className={className} viewBox="0 0 80 150" fill="none">
      <path d="M40 0v26" stroke="#8a6a3a" strokeWidth="3" />
      <path d="M26 28h28l8 12H18z" fill="#7d5a2c" />
      <path d="M20 40h40l6 58a8 8 0 0 1-8 9H22a8 8 0 0 1-8-9z" fill="#3a2414" stroke="#8a6a3a" strokeWidth="2" />
      <ellipse cx="40" cy="74" rx="14" ry="22" fill="#f0c463" opacity="0.92" />
      <ellipse cx="40" cy="74" rx="24" ry="34" fill="#e4b64c" opacity="0.22" />
      <path d="M22 110h36l4 10H18z" fill="#7d5a2c" />
      <circle cx="40" cy="128" r="5" fill="#8a6a3a" />
    </svg>
  )
}
