import React from "react";
import { AbsoluteFill, Img, random, useCurrentFrame } from "remotion";
import { tex } from "../lib";

/** Animated film grain built from pre-rendered noise tiles. */
export const Grain: React.FC<{ opacity: number; seed?: string }> = ({
  opacity,
  seed = "g",
}) => {
  const f = useCurrentFrame();
  if (opacity <= 0) return null;
  const tile = Math.floor(random(`${seed}${f}`) * 8);
  const ox = Math.floor(random(`${seed}x${f}`) * 540);
  const oy = Math.floor(random(`${seed}y${f}`) * 540);
  const tiles = [];
  for (let r = 0; r < 5; r++) {
    for (let c = 0; c < 3; c++) {
      tiles.push(
        <Img
          key={`${r}-${c}`}
          src={tex(`grain_${tile}.png`)}
          style={{
            position: "absolute",
            left: c * 540 - ox,
            top: r * 540 - oy,
            width: 540,
            height: 540,
          }}
        />,
      );
    }
  }
  return (
    <AbsoluteFill
      style={{ mixBlendMode: "overlay", opacity, pointerEvents: "none" }}
    >
      {tiles}
    </AbsoluteFill>
  );
};

export const Vignette: React.FC<{ strength: number; color?: string }> = ({
  strength,
  color = "0,0,0",
}) => (
  <AbsoluteFill
    style={{
      background: `radial-gradient(ellipse 75% 60% at 50% 48%, rgba(${color},0) 55%, rgba(${color},${strength}) 100%)`,
      pointerEvents: "none",
    }}
  />
);

/** Scratches, dust and gate flicker for archival footage. */
export const FilmDamage: React.FC<{ opacity: number }> = ({ opacity }) => {
  const f = useCurrentFrame();
  if (opacity <= 0) return null;
  const scratches = [0, 1, 2].map((i) => {
    const life = Math.floor(f / 7) + i * 13;
    const on = random(`sc-on${life}`) > 0.45;
    if (!on) return null;
    const x = random(`sc-x${life}`) * 1080 + Math.sin(f * 0.7 + i) * 3;
    const top = random(`sc-t${life}`) * 900;
    return (
      <div
        key={i}
        style={{
          position: "absolute",
          left: x,
          top,
          width: 1.4,
          height: 500 + random(`sc-h${life}`) * 900,
          background: "rgba(255,248,230,0.55)",
          filter: "blur(0.5px)",
        }}
      />
    );
  });
  const dust = new Array(7).fill(0).map((_, i) => {
    if (random(`d-on${f}-${i}`) < 0.55) return null;
    const s = 2 + random(`d-s${f}-${i}`) * 7;
    return (
      <div
        key={`d${i}`}
        style={{
          position: "absolute",
          left: random(`d-x${f}-${i}`) * 1080,
          top: random(`d-y${f}-${i}`) * 1920,
          width: s,
          height: s * (0.4 + random(`d-r${f}-${i}`)),
          borderRadius: "50%",
          background:
            random(`d-c${f}-${i}`) > 0.5
              ? "rgba(20,12,6,0.75)"
              : "rgba(255,246,225,0.7)",
          filter: "blur(0.6px)",
        }}
      />
    );
  });
  return (
    <AbsoluteFill style={{ opacity, pointerEvents: "none" }}>
      {scratches}
      {dust}
    </AbsoluteFill>
  );
};

/** Soft warm dust motes drifting through a light beam. */
export const Motes: React.FC<{
  opacity: number;
  count?: number;
  seed?: string;
  color?: string;
}> = ({ opacity, count = 22, seed = "m", color = "255,214,150" }) => {
  const f = useCurrentFrame();
  if (opacity <= 0) return null;
  return (
    <AbsoluteFill style={{ opacity, pointerEvents: "none" }}>
      {new Array(count).fill(0).map((_, i) => {
        const x0 = random(`${seed}x${i}`) * 1080;
        const y0 = random(`${seed}y${i}`) * 1920;
        const sp = 0.25 + random(`${seed}s${i}`) * 0.6;
        const size = 2 + random(`${seed}z${i}`) * 5;
        const x = x0 + Math.sin(f * 0.02 * sp + i) * 40 + f * 0.25;
        const y = ((y0 - f * sp * 1.4) % 1920 + 1920) % 1920;
        const tw = 0.5 + 0.5 * Math.sin(f * 0.08 + i * 1.7);
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: x,
              top: y,
              width: size,
              height: size,
              borderRadius: "50%",
              background: `rgba(${color},${0.35 + 0.5 * tw})`,
              filter: `blur(${size > 5 ? 2 : 1}px)`,
            }}
          />
        );
      })}
    </AbsoluteFill>
  );
};
