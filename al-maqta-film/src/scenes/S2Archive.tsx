import React from "react";
import { AbsoluteFill, Easing, Img, random, useCurrentFrame } from "remotion";
import { FilmDamage, Grain, Vignette } from "../components/Film";
import { EASE_OUT, FONTS, H, W, img, k } from "../lib";

// archive_main.png is 920×918; it is shown full-bleed, cropped to its right
// half so the watchtower sits in the right third of the vertical frame.
const S = H / 918;
const LEFT = -330 * S;
const PHOTO_W = 920 * S;

// The old-crossing print (archive_bridge.png, 441×339).
const PRINT_SCALE = 1.9;
const PRINT_W = 441 * PRINT_SCALE;
const PRINT_H = 339 * PRINT_SCALE;
const BORDER = 26;
const PRINT_X = (W - PRINT_W) / 2;
const PRINT_Y = 860;

const Photo: React.FC<{ style?: React.CSSProperties }> = ({ style }) => (
  <Img
    src={img("archive_main.png")}
    style={{ position: "absolute", left: LEFT, top: 0, width: PHOTO_W, height: H, ...style }}
  />
);

const Title: React.FC<{ f: number }> = ({ f }) => {
  const p = k(f, [44, 60], [0, 1], EASE_OUT);
  // a press-printed title: a few uneven exposures before it settles
  const flicker = f < 60 ? 0.75 + 0.25 * random(`t${f}`) : 1;
  return (
    <div
      dir="rtl"
      lang="ar"
      style={{
        position: "absolute",
        top: 270,
        width: W,
        textAlign: "center",
        fontFamily: FONTS.amiri,
        fontWeight: 700,
        fontSize: 92,
        color: "#1c120a",
        opacity: p * flicker * k(f, [146, 162], [1, 0]),
        transform: `scale(${1.06 - 0.06 * p})`,
        filter: `blur(${(1 - p) * 4}px)`,
        textShadow: "0 0 2px rgba(28,18,10,0.5), 0 0 22px rgba(240,226,200,0.6)",
      }}
    >
      هنا بدأت حكاية العبور
      <div
        style={{
          margin: "18px auto 0",
          width: 360 * k(f, [56, 80], [0, 1]),
          height: 2,
          background: "#2a1b10",
          opacity: 0.6,
        }}
      />
    </div>
  );
};

const Print: React.FC<{ f: number }> = ({ f }) => {
  const enter = k(f, [66, 100], [0, 1], Easing.bezier(0.2, 0.9, 0.25, 1));
  const freeze = k(f, [146, 176], [0, 1], Easing.bezier(0.5, 0, 0.3, 1));
  const lines = k(f, [156, 188], [0, 1], Easing.bezier(0.6, 0, 0.2, 1));
  const drift = f < 146 ? Math.sin(f * 0.05) * 6 : Math.sin(146 * 0.05) * 6;
  const rot = (1 - enter) * 9 - 2.2 * (1 - freeze) + (drift * 0.05) * (1 - freeze);
  const ty = (1 - enter) * 1300 + drift * (1 - freeze);
  const ext = lines * 1200;
  const line = (style: React.CSSProperties) => (
    <div style={{ position: "absolute", background: "rgba(232,240,255,0.85)", ...style }} />
  );
  return (
    <div
      style={{
        position: "absolute",
        left: PRINT_X - BORDER,
        top: PRINT_Y - BORDER,
        width: PRINT_W + BORDER * 2,
        height: PRINT_H + BORDER * 2,
        transform: `translateY(${ty}px) rotate(${rot}deg)`,
        opacity: enter > 0 ? 1 : 0,
      }}
    >
      {/* paper border fading into drafting lines */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: "#ece2cc",
          opacity: 1 - freeze,
          boxShadow: `0 30px 70px rgba(0,0,0,${0.55 * (1 - freeze)})`,
          borderRadius: 3,
        }}
      />
      <div style={{ position: "absolute", left: BORDER, top: BORDER, width: PRINT_W, height: PRINT_H, overflow: "hidden" }}>
        <Img
          src={img("archive_bridge.png")}
          style={{
            width: PRINT_W,
            height: PRINT_H,
            filter: "sepia(0.5) contrast(1.08)",
            transform: `scale(${1.08 - 0.08 * enter + 0.03 * freeze})`,
          }}
        />
        {/* the same photograph re-exposed as a blueprint negative */}
        <Img
          src={img("archive_bridge.png")}
          style={{
            position: "absolute",
            inset: 0,
            width: PRINT_W,
            height: PRINT_H,
            opacity: freeze * k(f, [176, 192], [1, 0.25]),
            filter: "grayscale(1) invert(1) sepia(1) saturate(5) hue-rotate(178deg) brightness(0.75) contrast(1.6)",
            transform: `scale(${1.08 - 0.08 * enter + 0.03 * freeze})`,
            mixBlendMode: "normal",
          }}
        />
      </div>
      {/* the print's edges extend into construction lines across the frame */}
      {line({ left: BORDER - ext, top: BORDER, width: PRINT_W + 2 * ext, height: 2, opacity: lines })}
      {line({ left: BORDER - ext, top: BORDER + PRINT_H, width: PRINT_W + 2 * ext, height: 2, opacity: lines })}
      {line({ left: BORDER, top: BORDER - ext, width: 2, height: PRINT_H + 2 * ext, opacity: lines })}
      {line({ left: BORDER + PRINT_W, top: BORDER - ext, width: 2, height: PRINT_H + 2 * ext, opacity: lines })}
    </div>
  );
};

export const S2Archive: React.FC = () => {
  const f = useCurrentFrame();
  const frozen = Math.min(f, 150);
  const push = k(frozen, [0, 150], [1.0, 1.13], Easing.bezier(0.3, 0, 0.6, 1));
  const weave = f < 150 ? { x: (random(`wx${f}`) - 0.5) * 2.4, y: (random(`wy${f}`) - 0.5) * 2.4 } : { x: 0, y: 0 };
  const flicker = f < 150 ? 0.93 + 0.07 * random(`fl${Math.floor(f / 2)}`) : 1;
  const dim = k(f, [66, 100], [1, 0.72]);
  const blue = k(f, [150, 186], [0, 1], Easing.bezier(0.5, 0, 0.3, 1));
  const leak = Math.max(0, Math.sin(f * 0.045 - 0.6));
  const ripple = 0.05 + 0.006 * Math.sin(frozen * 0.07);

  return (
    <AbsoluteFill style={{ background: "#120c08", overflow: "hidden" }}>
      <AbsoluteFill
        style={{
          transform: `translate(${weave.x}px, ${weave.y}px) scale(${push})`,
          transformOrigin: "720px 722px",
          filter: `sepia(0.55) contrast(1.06) brightness(${flicker * dim})`,
        }}
      >
        <Photo />
        {/* the water keeps moving inside the photograph */}
        <svg width={0} height={0} style={{ position: "absolute" }}>
          <filter id="archive-water" x="0" y="0" width="100%" height="100%">
            <feTurbulence type="fractalNoise" baseFrequency={`0.004 ${ripple}`} numOctaves="2" seed="11" />
            <feDisplacementMap in="SourceGraphic" scale="9" xChannelSelector="R" yChannelSelector="G" />
          </filter>
        </svg>
        <AbsoluteFill
          style={{
            filter: "url(#archive-water)",
            WebkitMaskImage: "linear-gradient(to bottom, transparent 44%, #000 50%, #000 76%, transparent 82%)",
            maskImage: "linear-gradient(to bottom, transparent 44%, #000 50%, #000 76%, transparent 82%)",
          }}
        >
          <Photo />
        </AbsoluteFill>
      </AbsoluteFill>
      {/* foreground foliage on its own plane for a 2.5D push */}
      <AbsoluteFill
        style={{
          transform: `translate(${weave.x}px, ${weave.y + k(frozen, [0, 150], [0, 26])}px) scale(${push * k(frozen, [0, 150], [1, 1.06])})`,
          transformOrigin: "720px 722px",
          filter: `sepia(0.55) contrast(1.06) brightness(${flicker * dim * 0.92})`,
          WebkitMaskImage: "linear-gradient(to bottom, transparent 83%, #000 87%)",
          maskImage: "linear-gradient(to bottom, transparent 83%, #000 87%)",
        }}
      >
        <Photo />
      </AbsoluteFill>
      {/* warm light leak drifting across the emulsion */}
      <AbsoluteFill
        style={{
          background: `radial-gradient(ellipse 50% 35% at ${120 + f * 4}px ${300 + f * 2}px, rgba(255,150,60,${0.45 * leak}), rgba(255,120,40,0) 70%)`,
          mixBlendMode: "screen",
          opacity: 1 - blue,
        }}
      />
      <Title f={f} />
      <AbsoluteFill style={{ background: "#0a2350", opacity: blue }} />
      <Print f={f} />
      <FilmDamage opacity={k(f, [140, 160], [0.9, 0])} />
      <Vignette strength={0.8 - 0.3 * blue} />
      <Grain opacity={0.6 - 0.35 * blue} seed="s2" />
    </AbsoluteFill>
  );
};
