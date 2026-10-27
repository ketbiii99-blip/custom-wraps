import React from "react";
import { AbsoluteFill } from "remotion";
import { H, W } from "../lib";

type P = { x: number; y: number };

const dot = (a: P, b: P) => a.x * b.x + a.y * b.y;

/** Sutherland–Hodgman clip of a polygon against the half plane n·X >= c. */
const clip = (poly: P[], n: P, c: number): P[] => {
  const out: P[] = [];
  for (let i = 0; i < poly.length; i++) {
    const a = poly[i];
    const b = poly[(i + 1) % poly.length];
    const da = dot(n, a) - c;
    const db = dot(n, b) - c;
    if (da >= 0) out.push(a);
    if (da * db < 0) {
      const t = da / (da - db);
      out.push({ x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t });
    }
  }
  return out;
};

const toCss = (poly: P[]) =>
  poly.length < 3
    ? "polygon(0 0, 0 0, 0 0)"
    : `polygon(${poly.map((p) => `${p.x.toFixed(1)}px ${p.y.toFixed(1)}px`).join(",")})`;

const toSvg = (poly: P[]) =>
  poly.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ");

/**
 * A page lifting from its bottom-right corner, as if caught by wind, folding
 * back over itself to reveal whatever is rendered beneath.
 */
export const PagePeel: React.FC<{
  progress: number;
  wobble: number;
  backColor: string;
  children: React.ReactNode;
}> = ({ progress, wobble, backColor, children }) => {
  if (progress <= 0) return <AbsoluteFill>{children}</AbsoluteFill>;
  const C: P = { x: W, y: H };
  const base = Math.atan2(-H, -W) + wobble;
  const n: P = { x: Math.cos(base), y: Math.sin(base) };
  const span = Math.abs(dot({ x: -W, y: -H }, n));
  const s = progress * span * 1.02;
  const c = s + dot(n, C);
  const rect: P[] = [
    { x: 0, y: 0 },
    { x: W, y: 0 },
    { x: W, y: H },
    { x: 0, y: H },
  ];
  const kept = clip(rect, n, c);
  const peeled = clip(rect, { x: -n.x, y: -n.y }, -c);
  const flap = peeled.map((p) => {
    const dd = dot(n, p) - c;
    return { x: p.x - 2 * dd * n.x, y: p.y - 2 * dd * n.y };
  });
  // A point on the fold line, for gradients.
  const F: P = { x: C.x + n.x * s, y: C.y + n.y * s };
  return (
    <AbsoluteFill>
      <AbsoluteFill style={{ clipPath: toCss(kept) }}>{children}</AbsoluteFill>
      <svg
        width={W}
        height={H}
        style={{ position: "absolute", inset: 0, overflow: "visible" }}
      >
        <defs>
          <linearGradient
            id="peel-shadow"
            gradientUnits="userSpaceOnUse"
            x1={F.x}
            y1={F.y}
            x2={F.x - n.x * 160}
            y2={F.y - n.y * 160}
          >
            <stop offset="0" stopColor="#000" stopOpacity="0.55" />
            <stop offset="1" stopColor="#000" stopOpacity="0" />
          </linearGradient>
          <linearGradient
            id="peel-back"
            gradientUnits="userSpaceOnUse"
            x1={F.x}
            y1={F.y}
            x2={F.x + n.x * 520}
            y2={F.y + n.y * 520}
          >
            <stop offset="0" stopColor="#fff8e6" />
            <stop offset="0.12" stopColor={backColor} />
            <stop offset="1" stopColor="#8a6a3e" />
          </linearGradient>
          <filter id="peel-drop" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow
              dx={n.x * 18}
              dy={n.y * 18}
              stdDeviation="16"
              floodColor="#000"
              floodOpacity="0.5"
            />
          </filter>
        </defs>
        {peeled.length > 2 ? (
          <polygon points={toSvg(peeled)} fill="url(#peel-shadow)" />
        ) : null}
        {flap.length > 2 ? (
          <polygon
            points={toSvg(flap)}
            fill="url(#peel-back)"
            filter="url(#peel-drop)"
          />
        ) : null}
      </svg>
    </AbsoluteFill>
  );
};
