export function Logo({ compact = false }: { compact?: boolean }) {
  return (
    <div className="logo">
      <div className="logo-plate">
        <span className="logo-steam" />
        <div className="logo-word">لَمّة</div>
        <div className="logo-place">في بيت قنون</div>
      </div>
      {!compact && <div className="logo-sub">اللّمة تحلى بالتحدّي</div>}
    </div>
  )
}
