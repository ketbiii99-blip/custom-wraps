import React from "react";
import { AbsoluteFill, Easing, Img, random, useCurrentFrame } from "remotion";
import { Grain, Vignette } from "../components/Film";
import {
  EASE_OUT,
  FONTS,
  G,
  REALITY_ORIGIN,
  T,
  archPath,
  archPoint,
  gx,
  gy,
  img,
  k,
  realityCam,
} from "../lib";

// Real bridge geometry traced on golden_main.png, mapped into the frame.
const ARCHES = [
  [-30, 300, 95, 215, 215, 320],
  [230, 322, 400, 240, 580, 358],
  [600, 362, 790, 285, 985, 410],
].map(([x1, y1, tx, ty, x2, y2]) => [gx(x1), gy(y1), gx(tx), gy(ty), gx(x2), gy(y2)] as const);
const DECK = { x1: gx(0), y1: gy(302), x2: gx(920), y2: gy(412) };
const deckY = (x: number) => DECK.y1 + ((x - DECK.x1) / (DECK.x2 - DECK.x1)) * (DECK.y2 - DECK.y1);

const IMG_H = 500 * G.scale; // only the clean upper part of the photograph
const WATER_TOP = G.top + IMG_H;

// Golden signature: along the deck, down in an arc, then right-to-left under
// the title, writing it as it goes.
const L_START = { x: 30, y: deckY(30) };
const L_DECK_END = { x: 990, y: deckY(990) };
const SWEEP = { c1: { x: 1080, y: deckY(990) + 40 }, c2: { x: 1070, y: 1290 }, end: { x: 930, y: 1300 } };
const BASE_END = { x: 150, y: 1300 };

const cubic = (p0: { x: number; y: number }, c1: typeof p0, c2: typeof p0, p1: typeof p0, t: number) => {
  const u = 1 - t;
  return {
    x: u * u * u * p0.x + 3 * u * u * t * c1.x + 3 * u * t * t * c2.x + t * t * t * p1.x,
    y: u * u * u * p0.y + 3 * u * u * t * c1.y + 3 * u * t * t * c2.y + t * t * t * p1.y,
  };
};

const seg = (a: number, b: number) => `0 ${a} ${Math.max(0, b - a)} 3`;

const Sky: React.FC<{ f: number }> = ({ f }) => (
  <>
    <AbsoluteFill
      style={{
        background: "linear-gradient(to bottom, #c9653a 0px, #e98f4c 160px, #f7b465 300px, #fcc57a 420px)",
      }}
    />
    <AbsoluteFill
      style={{
        background: `radial-gradient(circle at ${gx(392)}px ${gy(30)}px, rgba(255,250,215,${0.95 + 0.05 * Math.sin(f * 0.06)}) 0px, rgba(255,214,140,0.55) 120px, rgba(255,180,90,0) 520px)`,
      }}
    />
  </>
);

const Water: React.FC<{ f: number }> = ({ f }) => (
  <>
    <svg width={0} height={0} style={{ position: "absolute" }}>
      <filter id="sea" x="0" y="0" width="100%" height="100%">
        <feTurbulence type="fractalNoise" baseFrequency={`0.005 ${0.07 + 0.008 * Math.sin(f * 0.05)}`} numOctaves="2" seed="21" />
        <feDisplacementMap in="SourceGraphic" scale="14" xChannelSelector="R" yChannelSelector="G" />
      </filter>
    </svg>
    <div
      style={{
        position: "absolute",
        left: 0,
        top: WATER_TOP - 140,
        width: 1080,
        height: 1920 - WATER_TOP + 140,
        overflow: "hidden",
        filter: "url(#sea)",
        WebkitMaskImage: "linear-gradient(to bottom, transparent 0px, #000 150px)",
        maskImage: "linear-gradient(to bottom, transparent 0px, #000 150px)",
      }}
    >
      <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to bottom, #3a4a4a, #0b3443 60%, #05222f)" }} />
      <Img
        src={img("golden_water.png")}
        style={{
          position: "absolute",
          left: -210,
          top: -300 + Math.sin(f * 0.02) * 6,
          width: 1500,
          height: 1153,
          filter: "saturate(1.1) brightness(0.95)",
          WebkitMaskImage: "linear-gradient(to bottom, #000 82%, transparent 100%)",
          maskImage: "linear-gradient(to bottom, #000 82%, transparent 100%)",
        }}
      />
      {/* deeper sea below the glitter */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: "linear-gradient(to bottom, rgba(10,45,60,0) 380px, rgba(8,38,52,0.85) 760px, #05222f 1000px)",
        }}
      />
    </div>
  </>
);

/** Sun glints sparkling on the water. */
const Glints: React.FC<{ f: number }> = ({ f }) => (
  <AbsoluteFill style={{ mixBlendMode: "screen" }}>
    {new Array(26).fill(0).map((_, i) => {
      const x = 260 + random(`gx${i}`) * 520 + Math.sin(f * 0.05 + i) * 8;
      const y = WATER_TOP + 20 + random(`gy${i}`) * 520;
      const tw = Math.max(0, Math.sin(f * (0.12 + random(`gs${i}`) * 0.1) + i * 2.1));
      const s = 3 + random(`gz${i}`) * 5;
      return (
        <div
          key={i}
          style={{
            position: "absolute",
            left: x,
            top: y,
            width: s * 3,
            height: s,
            borderRadius: "50%",
            background: `rgba(255,236,190,${tw * 0.9})`,
            filter: "blur(1.5px)",
          }}
        />
      );
    })}
  </AbsoluteFill>
);

const Signature: React.FC<{ f: number }> = ({ f }) => {
  // local frames: deck 182-212, sweep 212-228, baseline 228-256
  const a = k(f, [182, 212], [0, 1], Easing.bezier(0.45, 0, 0.55, 1));
  const b = k(f, [212, 228], [0, 1], Easing.linear);
  const c = k(f, [228, 256], [0, 1], Easing.bezier(0.3, 0, 0.35, 1));
  if (a <= 0) return null;
  let head;
  if (b <= 0) head = { x: L_START.x + (L_DECK_END.x - L_START.x) * a, y: L_START.y + (L_DECK_END.y - L_START.y) * a };
  else if (c <= 0) head = cubic(L_DECK_END, SWEEP.c1, SWEEP.c2, SWEEP.end, b);
  else head = { x: SWEEP.end.x + (BASE_END.x - SWEEP.end.x) * c, y: SWEEP.end.y };
  const done = k(f, [256, 268], [1, 0]);
  const deckTrail = k(f, [196, 226], [1, 0]);
  return (
    <svg width={1080} height={1920} style={{ position: "absolute", inset: 0 }}>
      <defs>
        <filter id="sig-glow" x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation="5" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <linearGradient id="base-fade" x1="0" x2="1" y1="0" y2="0">
          <stop offset="0" stopColor="#f6d28b" stopOpacity="0" />
          <stop offset="0.25" stopColor="#f6d28b" />
          <stop offset="0.75" stopColor="#f6d28b" />
          <stop offset="1" stopColor="#f6d28b" stopOpacity="0" />
        </linearGradient>
      </defs>
      <g filter="url(#sig-glow)" fill="none" strokeLinecap="round">
        <path
          d={`M ${L_START.x} ${L_START.y} L ${L_DECK_END.x} ${L_DECK_END.y}`}
          pathLength={1}
          stroke="#ffe2a6"
          strokeWidth={6}
          strokeDasharray={seg(Math.max(0, a - 0.35), a)}
          opacity={deckTrail}
        />
        <path
          d={`M ${L_DECK_END.x} ${L_DECK_END.y} C ${SWEEP.c1.x} ${SWEEP.c1.y} ${SWEEP.c2.x} ${SWEEP.c2.y} ${SWEEP.end.x} ${SWEEP.end.y}`}
          pathLength={1}
          stroke="#ffe2a6"
          strokeWidth={5}
          strokeDasharray={seg(Math.max(0, b - 0.6) * (c > 0 ? 1 : 1) + (c > 0 ? c : 0), b)}
          opacity={k(f, [226, 246], [1, 0])}
        />
        {/* the hairline that stays beneath the title */}
        <path
          d={`M ${SWEEP.end.x} ${SWEEP.end.y} L ${BASE_END.x} ${BASE_END.y}`}
          pathLength={1}
          stroke="url(#base-fade)"
          strokeWidth={2.4}
          strokeDasharray={seg(0, c)}
        />
        <circle cx={head.x} cy={head.y} r={10} fill="#fff6dc" opacity={done} />
      </g>
    </svg>
  );
};

const Title: React.FC<{ f: number }> = ({ f }) => {
  const c = k(f, [228, 256], [0, 1], Easing.bezier(0.3, 0, 0.35, 1));
  const edge = c * 118 - 10;
  const sub = k(f, [248, 266], [0, 1], EASE_OUT);
  return (
    <>
      <div
        dir="rtl"
        lang="ar"
        style={{
          position: "absolute",
          top: 1060,
          width: 1080,
          textAlign: "center",
          fontFamily: FONTS.ruqaa,
          fontWeight: 700,
          fontSize: 200,
          lineHeight: "220px",
          WebkitMaskImage: `linear-gradient(to left, #000 ${edge}%, transparent ${edge + 10}%)`,
          maskImage: `linear-gradient(to left, #000 ${edge}%, transparent ${edge + 10}%)`,
          filter: "drop-shadow(0 8px 24px rgba(0,10,20,0.6))",
        }}
      >
        <span
          style={{
            background: "linear-gradient(to bottom, #fff3cf 10%, #f4cc7c 50%, #c88a36 95%)",
            WebkitBackgroundClip: "text",
            backgroundClip: "text",
            color: "transparent",
          }}
        >
          جسر المقطع
        </span>
      </div>
      <div
        dir="rtl"
        lang="ar"
        style={{
          position: "absolute",
          top: 1336,
          width: 1080,
          textAlign: "center",
          fontFamily: FONTS.alexandria,
          fontWeight: 300,
          fontSize: 52,
          color: "#f6ead2",
          opacity: sub,
          transform: `translateY(${(1 - sub) * 16}px)`,
          filter: `blur(${(1 - sub) * 6}px) drop-shadow(0 4px 14px rgba(0,10,20,0.7))`,
        }}
      >
        حكاية تعبر الزمن
      </div>
    </>
  );
};

/** A soft travelling light running along the arches. */
const ArchLight: React.FC<{ f: number }> = ({ f }) => {
  const p = k(f, [86, 168], [0, 1], Easing.bezier(0.4, 0, 0.6, 1));
  if (p <= 0 || p >= 1) return null;
  const i = Math.min(2, Math.floor(p * 3));
  const t = p * 3 - i;
  const [x1, y1, tx, ty, x2, y2] = ARCHES[i];
  const pt = archPoint(x1, y1, tx, ty, x2, y2, t);
  return (
    <svg width={1080} height={1920} style={{ position: "absolute", inset: 0, mixBlendMode: "screen" }}>
      <defs>
        <filter id="arch-glow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="7" />
        </filter>
      </defs>
      <path
        d={archPath(x1, y1, tx, ty, x2, y2)}
        pathLength={1}
        fill="none"
        stroke="#fff0c8"
        strokeWidth={9}
        strokeLinecap="round"
        strokeDasharray={seg(Math.max(0, t - 0.25), t)}
        filter="url(#arch-glow)"
        opacity={0.9}
      />
      <circle cx={pt.x} cy={pt.y} r={20} fill="#fff4d6" filter="url(#arch-glow)" />
    </svg>
  );
};

export const S5Reality: React.FC = () => {
  const f = useCurrentFrame();
  const g = f + T.s5.from;
  const cam = realityCam(g);
  // Reality spreads from the water up through the bridge into the sky.
  const reveal = k(f, [4, 80], [0, 1], Easing.bezier(0.45, 0, 0.3, 1));
  const edge = 100 - reveal * 135;
  const mask = `linear-gradient(to bottom, transparent ${edge}%, #000 ${edge + 22}%)`;
  const edgeY = (edge + 11) * 19.2;

  return (
    <AbsoluteFill>
      <AbsoluteFill style={{ WebkitMaskImage: mask, maskImage: mask }}>
        <AbsoluteFill style={{ transform: `scale(${cam})`, transformOrigin: REALITY_ORIGIN }}>
          <Sky f={f} />
          <Water f={f} />
          <div
            style={{
              position: "absolute",
              left: G.left,
              top: G.top,
              width: 920 * G.scale,
              height: IMG_H,
              overflow: "hidden",
              WebkitMaskImage: "linear-gradient(to bottom, transparent 0%, #000 9%, #000 84%, transparent 100%)",
              maskImage: "linear-gradient(to bottom, transparent 0%, #000 9%, #000 84%, transparent 100%)",
            }}
          >
            <Img src={img("golden_main.png")} style={{ width: 920 * G.scale, height: 918 * G.scale, filter: "contrast(1.05) saturate(1.05)" }} />
          </div>
          <Glints f={f} />
          <ArchLight f={f} />
        </AbsoluteFill>
        {/* legibility for the title over the sea */}
        <AbsoluteFill
          style={{
            background: "linear-gradient(to bottom, rgba(3,20,30,0) 1000px, rgba(3,20,30,0.5) 1250px, rgba(3,20,30,0.25) 1500px, rgba(3,20,30,0.55) 1920px)",
            opacity: k(f, [170, 220], [0, 1]),
          }}
        />
        <Signature f={f} />
        <Title f={f} />
        <Vignette strength={0.45} color="20,8,0" />
        <Grain opacity={0.12} seed="s5" />
      </AbsoluteFill>
      {/* the travelling line where paper becomes real */}
      {reveal > 0 && reveal < 1 ? (
        <AbsoluteFill
          style={{
            background: `linear-gradient(to bottom, rgba(255,214,140,0) ${edgeY - 160}px, rgba(255,232,180,0.75) ${edgeY}px, rgba(255,214,140,0) ${edgeY + 160}px)`,
            mixBlendMode: "screen",
            opacity: Math.sin(reveal * Math.PI),
          }}
        />
      ) : null}
      <AbsoluteFill style={{ background: "#fff2d6", opacity: k(f, [70, 84, 104], [0, 0.18, 0], EASE_OUT) }} />
    </AbsoluteFill>
  );
};
