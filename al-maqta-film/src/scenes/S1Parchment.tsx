import React from "react";
import { AbsoluteFill, Easing, Img, useCurrentFrame } from "remotion";
import { Grain, Motes, Vignette } from "../components/Film";
import { PagePeel } from "../components/PagePeel";
import { EASE_OUT, FONTS, H, W, img, k, tex } from "../lib";

// Ink sketch of the crossing, traced over the positions of the painted world
// it later becomes (parchment_world.png).
const crenellations = () => {
  let d = "M 196 874";
  for (let x = 196; x < 350; x += 22) {
    d += ` L ${x} 858 L ${x + 11} 858 L ${x + 11} 866 L ${x + 22} 866`;
  }
  return d;
};

const palm = (x: number, y: number, h: number, lean: number) => {
  const tx = x + lean;
  const ty = y - h;
  const fronds = [-150, -115, -70, -30, 15, 45]
    .map((a) => {
      const r = (a * Math.PI) / 180;
      const ex = tx + Math.cos(r) * 70;
      const ey = ty + Math.sin(r) * 34 + 30;
      const mx = tx + Math.cos(r) * 40;
      const my = ty + Math.sin(r) * 34 - 14;
      return `M ${tx} ${ty} Q ${mx} ${my} ${ex} ${ey}`;
    })
    .join(" ");
  return [`M ${x} ${y} Q ${x + lean * 0.2} ${y - h * 0.5} ${tx} ${ty}`, fronds];
};

const INK_PATHS: { d: string; w: number; at: number; len: number }[] = [
  // far shore and causeway
  { d: "M 30 800 C 200 788 340 806 480 798 S 820 790 1080 802", w: 2.2, at: 8, len: 34 },
  { d: "M 470 806 L 1080 814", w: 1.6, at: 18, len: 26 },
  { d: "M 580 834 C 760 842 900 858 1080 878", w: 2, at: 22, len: 26 },
  // tower
  { d: "M 190 1040 L 198 874 L 350 874 L 360 1040", w: 3.4, at: 14, len: 28 },
  { d: crenellations(), w: 2.6, at: 30, len: 18 },
  { d: "M 236 920 l 0 26 M 300 914 l 0 28 M 266 978 l 0 24 M 214 1000 L 336 1000", w: 2.4, at: 40, len: 14 },
  // rocky spit
  { d: "M 60 1096 C 160 1060 260 1046 380 1062 S 560 1110 690 1150 C 600 1176 450 1186 300 1180 S 100 1172 40 1150", w: 2.6, at: 24, len: 36 },
  // palms
  ...palm(60, 1070, 120, 10).map((d, i) => ({ d, w: 2, at: 36 + i * 6, len: 20 })),
  ...palm(140, 1060, 100, -14).map((d, i) => ({ d, w: 2, at: 42 + i * 6, len: 20 })),
  // water strokes
  { d: "M 620 1260 q 40 -8 80 0 t 80 0 M 760 1340 q 40 -8 80 0 t 80 0 M 560 1420 q 40 -8 80 0 t 80 0 M 820 1500 q 30 -6 60 0 t 60 0", w: 1.8, at: 48, len: 24 },
  // compass rose
  { d: "M 1040 150 L 1040 290 M 970 220 L 1110 220 M 1040 160 L 1052 220 L 1040 280 L 1028 220 Z", w: 1.8, at: 20, len: 30 },
];

export const InkSketch: React.FC<{ f: number }> = ({ f }) => (
  <svg width={W} height={H} style={{ position: "absolute", inset: 0 }}>
    <defs>
      <filter id="ink-rough">
        <feTurbulence type="fractalNoise" baseFrequency="0.035" numOctaves="2" seed="4" />
        <feDisplacementMap in="SourceGraphic" scale="3.5" />
        <feGaussianBlur stdDeviation="0.5" />
      </filter>
    </defs>
    <g filter="url(#ink-rough)" fill="none" strokeLinecap="round" strokeLinejoin="round">
      {INK_PATHS.map((p, i) => (
        <path
          key={i}
          d={p.d}
          pathLength={1}
          stroke="#3a2412"
          strokeWidth={p.w}
          strokeDasharray="1 1"
          strokeDashoffset={1 - k(f, [p.at, p.at + p.len], [0, 1], Easing.bezier(0.4, 0, 0.25, 1))}
        />
      ))}
      <circle
        cx={1040}
        cy={220}
        r={48}
        pathLength={1}
        stroke="#3a2412"
        strokeWidth={1.6}
        strokeDasharray="1 1"
        strokeDashoffset={1 - k(f, [16, 46], [0, 1])}
      />
    </g>
  </svg>
);

/** Arabic line written in ink, revealed right-to-left with a wet edge. */
const InkLine: React.FC<{ f: number }> = ({ f }) => {
  const p = k(f, [24, 82], [0, 1], Easing.bezier(0.3, 0.1, 0.4, 1));
  const edge = p * 112 - 12;
  const settle = k(f, [24, 110], [5, 0]);
  return (
    <div
      dir="rtl"
      lang="ar"
      style={{
        position: "absolute",
        top: 300,
        left: 300,
        width: 720,
        textAlign: "center",
        fontFamily: FONTS.ruqaa,
        fontWeight: 700,
        fontSize: 104,
        lineHeight: 1.5,
        color: "#2a180a",
        WebkitMaskImage: `linear-gradient(to left, #000 ${edge}%, transparent ${edge + 12}%)`,
        maskImage: `linear-gradient(to left, #000 ${edge}%, transparent ${edge + 12}%)`,
        filter: `url(#ink-bleed) blur(${settle * 0.12}px)`,
        textShadow: "0 0 1px rgba(42,24,10,0.6), 0 2px 10px rgba(255,236,190,0.55)",
      }}
    >
      <svg width={0} height={0} style={{ position: "absolute" }}>
        <filter id="ink-bleed">
          <feTurbulence type="fractalNoise" baseFrequency="0.06" numOctaves="2" seed="9" />
          <feDisplacementMap in="SourceGraphic" scale={settle} />
        </filter>
      </svg>
      قبل أن يمتد الجسر…
    </div>
  );
};

const Flap: React.FC<{ half: "top" | "bottom"; open: number }> = ({ half, open }) => {
  const top = half === "top";
  const angle = open * 112 * (top ? 1 : -1);
  const shade = Math.sin(Math.min(open, 1) * Math.PI * 0.62);
  return (
    <div
      style={{
        position: "absolute",
        left: 0,
        top: top ? 0 : H / 2,
        width: W,
        height: H / 2,
        overflow: "hidden",
        transformOrigin: top ? "50% 0%" : "50% 100%",
        transform: `rotateX(${angle}deg)`,
        opacity: k(open, [0.72, 0.95], [1, 0]),
        boxShadow: "0 0 60px rgba(0,0,0,0.45)",
      }}
    >
      <Img
        src={tex("parchment.png")}
        style={{ position: "absolute", left: 0, top: top ? 0 : -H / 2, width: W, height: H }}
      />
      {/* centre crease */}
      <div
        style={{
          position: "absolute",
          left: 0,
          width: W,
          height: 90,
          top: top ? H / 2 - 90 : 0,
          background: top
            ? "linear-gradient(to bottom, rgba(90,60,25,0), rgba(90,60,25,0.32))"
            : "linear-gradient(to top, rgba(90,60,25,0), rgba(90,60,25,0.22))",
        }}
      />
      <div style={{ position: "absolute", inset: 0, background: `rgba(30,18,6,${shade * 0.55})` }} />
    </div>
  );
};

export const S1Parchment: React.FC = () => {
  const f = useCurrentFrame();
  const open = k(f, [64, 122], [0, 1], Easing.bezier(0.55, 0, 0.25, 1));
  const push = k(f, [40, 178], [1.08, 1.3], Easing.bezier(0.33, 0, 0.3, 1));
  const light = k(f, [0, 46], [0, 1], EASE_OUT);
  const peel = k(f, [140, 177], [0, 1], Easing.bezier(0.5, 0, 0.6, 1));
  const worldTransform = {
    transform: `scale(${push}) translateY(${k(f, [40, 178], [0, -18])}px)`,
    transformOrigin: "290px 960px",
  } as const;

  return (
    <PagePeel progress={peel} wobble={0.09 * Math.sin(f * 0.35)} backColor="#e2cc9c">
      <AbsoluteFill style={{ background: "#000" }}>
        {/* The painted world waiting beneath the folded parchment */}
        <AbsoluteFill
          style={{
            ...worldTransform,
            filter: `brightness(${k(f, [64, 130], [0.55, 1.02])}) saturate(${k(f, [80, 160], [0.6, 1])})`,
          }}
        >
          <Img src={img("parchment_world.png")} style={{ width: W, height: H }} />
          {/* gentle warm grade sweeping in */}
          <AbsoluteFill
            style={{
              background:
                "radial-gradient(ellipse 70% 45% at 55% 42%, rgba(255,196,110,0.32), rgba(255,196,110,0) 70%)",
              mixBlendMode: "soft-light",
            }}
          />
        </AbsoluteFill>
        {/* Shadow from the opening folds */}
        <AbsoluteFill
          style={{
            background: `linear-gradient(to bottom, rgba(0,0,0,${0.7 * (1 - open)}) 0%, rgba(0,0,0,${0.2 * (1 - open)}) 50%, rgba(0,0,0,${0.7 * (1 - open)}) 100%)`,
          }}
        />
        {/* The parchment, folded at its centre, swinging open */}
        <AbsoluteFill style={{ perspective: 2400, perspectiveOrigin: "50% 50%" }}>
          <Flap half="top" open={open} />
          <Flap half="bottom" open={open} />
        </AbsoluteFill>
        {/* Ink lines stay where they were drawn and settle into the world */}
        <AbsoluteFill style={{ ...worldTransform, opacity: k(f, [96, 150], [0.95, 0]) }}>
          <InkSketch f={f} />
        </AbsoluteFill>
        <Motes opacity={k(f, [70, 110], [0, 0.9])} seed="s1" />
        {/* Light: one warm pool on the page, widening into the world */}
        <AbsoluteFill
          style={{
            background: `radial-gradient(circle at 600px 720px, rgba(0,0,0,0) ${light * 560 + open * 900}px, rgba(0,0,0,${0.97 - open * 0.55}) ${light * 1350 + open * 1200}px)`,
          }}
        />
        <AbsoluteFill
          style={{
            background:
              "radial-gradient(circle at 620px 480px, rgba(255,186,96,0.35), rgba(255,186,96,0) 55%)",
            mixBlendMode: "overlay",
            opacity: light,
          }}
        />
        <InkLine f={f} />
        <Vignette strength={0.55} />
        <Grain opacity={0.35} seed="s1" />
      </AbsoluteFill>
    </PagePeel>
  );
};
