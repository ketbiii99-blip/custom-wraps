/** يقبل رمز تعبيري أو رابط صورة (يبدأ بـ / أو http) */
export function CategoryIcon({ icon, alt }: { icon: string; alt: string }) {
  const isImage = /^(https?:|\/|data:|\.)/.test(icon)
  return (
    <span className="cat-icon">
      {isImage ? <img src={icon} alt={alt} /> : icon}
    </span>
  )
}
