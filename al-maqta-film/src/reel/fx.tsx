import React from "react";
import { AbsoluteFill, Easing, random, useCurrentFrame } from "remotion";
import { FONTS, k } from "../lib";

/** Beat grid: 120 bpm at 30 fps. */
export const BEAT = 15;

/** Exponential decay that fires at `at`. */
export const hit = (f: number, at: number, decay = 5) => (f < at ? 0 : Math.exp(-(f - at) / decay));
export const hits = (f: number, ats: number[], decay = 5) =>
  ats.reduce((m, a) => Math.max(m, hit(f, a, decay)), 0);

export const EXPO_OUT = Easing.bezier(0.16, 1, 0.3, 1);
export const OVERSHOOT = Easing.bezier(0.2, 1.6, 0.4, 1);
export const WHIP = Easing.bezier(0.7, 0, 0.3, 1);

/**
 * A camera over a shot: translate / rotate / scale plus optional chromatic
 * split and horizontal motion blur, each driven per frame.
 */
export const Cam: React.FC<{
  id: string;
  s?: number;
  x?: number;
  y?: number;
  r?: number;
  rgb?: number;
  blurX?: number;
  origin?: string;
  children: React.ReactNode;
}> = ({ id, s = 1, x = 0, y = 0, r = 0, rgb = 0, blurX = 0, origin = "50% 50%", children }) => {
  const filters: string[] = [];
  if (rgb > 0.4) filters.push(`url(#${id}-rgb)`);
  if (blurX > 0.4) filters.push(`url(#${id}-blur)`);
  return (
    <AbsoluteFill style={{ overflow: "hidden" }}>
      <svg width={0} height={0} style={{ position: "absolute" }}>
        <filter id={`${id}-rgb`} x="-5%" y="-5%" width="110%" height="110%" colorInterpolationFilters="sRGB">
          <feColorMatrix in="SourceGraphic" type="matrix" values="1 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 1 0" result="r" />
          <feOffset in="r" dx={rgb} dy={rgb * 0.3} result="ro" />
          <feColorMatrix in="SourceGraphic" type="matrix" values="0 0 0 0 0 0 1 0 0 0 0 0 0 0 0 0 0 0 1 0" result="g" />
          <feColorMatrix in="SourceGraphic" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 1 0 0 0 0 0 1 0" result="b" />
          <feOffset in="b" dx={-rgb} dy={-rgb * 0.3} result="bo" />
          <feBlend in="ro" in2="g" mode="screen" result="rg" />
          <feBlend in="rg" in2="bo" mode="screen" />
        </filter>
        <filter id={`${id}-blur`} x="-10%" y="0" width="120%" height="100%">
          <feGaussianBlur stdDeviation={`${blurX} ${blurX * 0.04}`} />
        </filter>
      </svg>
      <AbsoluteFill
        style={{
          transform: `translate(${x}px, ${y}px) rotate(${r}deg) scale(${s})`,
          transformOrigin: origin,
          filter: filters.length ? filters.join(" ") : undefined,
        }}
      >
        {children}
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

/** Camera shake that spikes on each hit. */
export const shake = (f: number, ats: number[], amp = 26, seed = "sh") => {
  const e = hits(f, ats, 4);
  return {
    x: (random(`${seed}x${f}`) - 0.5) * 2 * amp * e,
    y: (random(`${seed}y${f}`) - 0.5) * 2 * amp * e,
    r: (random(`${seed}r${f}`) - 0.5) * 2 * 1.2 * e,
  };
};

export const Flash: React.FC<{ ats: number[]; color?: string; strength?: number; decay?: number }> = ({
  ats,
  color = "#fff",
  strength = 0.9,
  decay = 2.5,
}) => {
  const f = useCurrentFrame();
  const o = hits(f, ats, decay) * strength;
  if (o < 0.01) return null;
  return <AbsoluteFill style={{ background: color, opacity: o, pointerEvents: "none" }} />;
};

/** One word or line slamming into place: big, blurred, then locked. */
export const Slam: React.FC<{
  at: number;
  out?: number;
  from?: number;
  children: React.ReactNode;
  style?: React.CSSProperties;
  font?: string;
  size?: number;
  color?: string;
  weight?: number;
}> = ({ at, out = 9999, from = 2.4, children, style, font = FONTS.alexandria, size = 120, color = "#fff", weight = 900 }) => {
  const f = useCurrentFrame();
  if (f < at || f > out + 8) return null;
  const t = f - at;
  const inP = k(t, [0, 7], [0, 1], OVERSHOOT);
  const outP = k(f, [out, out + 6], [0, 1], Easing.bezier(0.6, 0, 1, 0.5));
  return (
    <div
      dir="rtl"
      lang="ar"
      style={{
        position: "absolute",
        left: 0,
        width: 1080,
        textAlign: "center",
        fontFamily: font,
        fontWeight: weight,
        fontSize: size,
        lineHeight: 1.15,
        color,
        transform: `scale(${from + (1 - from) * inP + outP * 1.6})`,
        opacity: Math.min(1, t / 2) * (1 - outP),
        filter: `blur(${Math.max(0, 6 - t * 1.5) + outP * 12}px)`,
        textShadow: "0 6px 0 rgba(0,0,0,0.25), 0 10px 40px rgba(0,0,0,0.55)",
        ...style,
      }}
    >
      {children}
    </div>
  );
};

/** VHS-style tracking noise used while time rewinds. */
export const Tracking: React.FC<{ strength: number }> = ({ strength }) => {
  const f = useCurrentFrame();
  if (strength <= 0) return null;
  return (
    <AbsoluteFill style={{ pointerEvents: "none", opacity: strength }}>
      {new Array(6).fill(0).map((_, i) => {
        const y = ((random(`tb${i}`) * 1920 + f * (60 + i * 25)) % 2100) - 100;
        const h = 6 + random(`th${i}${Math.floor(f / 2)}`) * 40;
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: 0,
              top: y,
              width: 1080,
              height: h,
              background: "rgba(255,255,255,0.22)",
              mixBlendMode: "overlay",
              transform: `translateX(${(random(`tx${i}${f}`) - 0.5) * 60}px)`,
              filter: "blur(2px)",
            }}
          />
        );
      })}
      <AbsoluteFill
        style={{
          backgroundImage: "repeating-linear-gradient(to bottom, rgba(0,0,0,0.22) 0px, rgba(0,0,0,0.22) 2px, transparent 2px, transparent 5px)",
        }}
      />
    </AbsoluteFill>
  );
};

/** Expanding ring of light: the shockwave of a drop. */
export const Shockwave: React.FC<{ at: number; x: number; y: number; color?: string }> = ({ at, x, y, color = "255,226,160" }) => {
  const f = useCurrentFrame();
  const t = f - at;
  if (t < 0 || t > 22) return null;
  const r = k(t, [0, 22], [40, 1500], EXPO_OUT);
  const o = k(t, [0, 22], [1, 0]);
  return (
    <div
      style={{
        position: "absolute",
        left: x - r,
        top: y - r,
        width: r * 2,
        height: r * 2,
        borderRadius: "50%",
        border: `${18 * o + 2}px solid rgba(${color},${o})`,
        boxShadow: `0 0 80px rgba(${color},${o}), inset 0 0 60px rgba(${color},${o * 0.6})`,
        mixBlendMode: "screen",
      }}
    />
  );
};

/** Diagonal light streak sweeping across the frame. */
export const Sweep: React.FC<{ at: number; dur?: number; color?: string }> = ({ at, dur = 14, color = "255,236,190" }) => {
  const f = useCurrentFrame();
  const t = f - at;
  if (t < 0 || t > dur) return null;
  const x = k(t, [0, dur], [-700, 1500], WHIP);
  return (
    <AbsoluteFill style={{ mixBlendMode: "screen", pointerEvents: "none" }}>
      <div
        style={{
          position: "absolute",
          left: x,
          top: -400,
          width: 220,
          height: 2800,
          transform: "rotate(18deg)",
          background: `linear-gradient(to right, rgba(${color},0), rgba(${color},0.75), rgba(${color},0))`,
          filter: "blur(18px)",
        }}
      />
    </AbsoluteFill>
  );
};
