import React from "react";
import { AbsoluteFill, Easing, Img, useCurrentFrame } from "remotion";
import { Grain, Vignette } from "../components/Film";
import { EASE_OUT, FONTS, REALITY_ORIGIN, T, gx, gy, img, k, realityCam } from "../lib";

// paper_main.png (920×918): the left arch's crown sits at (300, 290). The
// camera ends with that crown on the crown of the real bridge's middle arch
// (golden_main.png at (400, 240)) at the angle and size of the real deck, so
// the diorama can turn into the photograph in place.
const PX = 300;
const PY = 290;
const AX = gx(400);
const AY = gy(240);
const EXT = 760; // padding baked into paper_ext.png
const LIQUID_MASK =
  "linear-gradient(163deg, transparent 60%, #000 70%), radial-gradient(closest-side, #000 70%, transparent 98%)";

/** A paper-cut palm silhouette for the foreground planes. */
const PaperPalm: React.FC<{ style: React.CSSProperties; flip?: boolean }> = ({ style, flip }) => (
  <svg
    width={520}
    height={760}
    viewBox="0 0 520 760"
    style={{ position: "absolute", transform: flip ? "scaleX(-1)" : undefined, ...style }}
  >
    <defs>
      <filter id="cut-shadow" x="-20%" y="-20%" width="140%" height="140%">
        <feDropShadow dx="10" dy="14" stdDeviation="10" floodColor="#4a2e12" floodOpacity="0.45" />
      </filter>
    </defs>
    <g filter="url(#cut-shadow)" fill="#e8d3a8" stroke="#cdb184" strokeWidth={2}>
      <path d="M 250 760 C 262 600 270 420 262 250 L 282 250 C 292 420 286 600 276 760 Z" />
      {[-160, -130, -100, -70, -40, -10, 20].map((a, i) => {
        const r = (a * Math.PI) / 180;
        const ex = 272 + Math.cos(r) * 250;
        const ey = 250 + Math.sin(r) * 120 + 110;
        const mx = 272 + Math.cos(r) * 130;
        const my = 250 + Math.sin(r) * 150 - 30;
        return (
          <path
            key={i}
            d={`M 272 250 Q ${mx} ${my} ${ex} ${ey} Q ${mx + 10} ${my + 40} 272 262 Z`}
          />
        );
      })}
    </g>
  </svg>
);

const PaperWords: React.FC<{ f: number }> = ({ f }) => {
  const lines = [["ومن", "الحكاية…"], ["وُلد", "المستقبل"]];
  let idx = 0;
  const out = k(f, [150, 170], [0, 1], Easing.bezier(0.5, 0, 0.75, 0));
  return (
    <div
      style={{
        position: "absolute",
        top: 250,
        width: 1080,
        textAlign: "center",
        perspective: 900,
      }}
    >
      {lines.map((words, li) => (
        <div key={li} dir="rtl" lang="ar" style={{ lineHeight: 1.35 }}>
          {words.map((w) => {
            const at = 52 + idx++ * 9;
            const up = k(f, [at, at + 22], [0, 1], Easing.bezier(0.25, 1.35, 0.4, 1));
            return (
              <span
                key={w}
                style={{
                  display: "inline-block",
                  margin: "0 14px",
                  fontFamily: FONTS.alexandria,
                  fontWeight: 800,
                  fontSize: li === 0 ? 78 : 96,
                  color: "#fffaf0",
                  transformOrigin: "50% 100%",
                  transform: `rotateX(${(1 - up) * -88 + out * 88}deg)`,
                  opacity: Math.min(1, up * 3) * (1 - out),
                  textShadow:
                    "0 1px 0 #e4cfa6, 0 2px 0 #d8c194, 0 3px 0 #ccb385, 0 4px 0 #bfa577, 0 5px 0 #b0956a, 0 6px 0 #a1875d, 0 14px 22px rgba(60,35,10,0.55)",
                }}
              >
                {w}
              </span>
            );
          })}
        </div>
      ))}
    </div>
  );
};

export const S4Paper: React.FC = () => {
  const f = useCurrentFrame();
  const g = f + T.s4.from;
  const orbit = k(f, [0, 128], [0, 1], Easing.bezier(0.33, 0, 0.55, 1));
  const settle = k(f, [118, 172], [0, 1], Easing.bezier(0.55, 0, 0.3, 1));
  const lerp = (a: number, b: number, c: number) => a + (b - a) * orbit + (c - (a + (b - a) * orbit)) * settle;
  const s = lerp(2.05, 1.62, 1.11);
  const r = lerp(-1, -5.5, -8.6);
  const tx = lerp(150, -60, 0);
  const ty = lerp(260, 90, 0);
  const sun = k(f, [120, 200], [0, 1]);
  const liquid = k(f, [140, 200], [0, 1], Easing.bezier(0.5, 0, 0.5, 1));
  const cam = realityCam(g);

  const transform = `translate(${tx}px, ${ty}px) rotate(${r}deg) scale(${s})`;

  return (
    <AbsoluteFill style={{ background: "#d9c29a", overflow: "hidden" }}>
      <AbsoluteFill style={{ transform: `scale(${cam})`, transformOrigin: REALITY_ORIGIN }}>
        <AbsoluteFill style={{ filter: `saturate(${1 + 0.25 * sun}) contrast(${1 + 0.12 * sun})` }}>
          {/* the diorama, extended past its edges into defocused surroundings */}
          <Img
            src={img("paper_ext.png")}
            style={{
              position: "absolute",
              left: AX - PX - EXT,
              top: AY - PY - EXT,
              width: 920 + 2 * EXT,
              height: 918 + 2 * EXT,
              transformOrigin: `${PX + EXT}px ${PY + EXT}px`,
              transform,
            }}
          />
          {/* the paper water starts to move like liquid */}
          <svg width={0} height={0} style={{ position: "absolute" }}>
            <filter id="paper-liquid" x="0" y="0" width="100%" height="100%">
              <feTurbulence type="fractalNoise" baseFrequency={`0.006 ${0.035 + 0.004 * Math.sin(f * 0.09)}`} numOctaves="2" seed="5" />
              <feDisplacementMap in="SourceGraphic" scale={liquid * 16} xChannelSelector="R" yChannelSelector="G" />
            </filter>
          </svg>
          {liquid > 0 ? (
            <Img
              src={img("paper_main.png")}
              style={{
                position: "absolute",
                left: AX - PX,
                top: AY - PY,
                width: 920,
                height: 918,
                transformOrigin: `${PX}px ${PY}px`,
                transform,
                filter: `url(#paper-liquid) saturate(${1 + 0.25 * liquid})`,
                opacity: liquid,
                WebkitMaskImage: LIQUID_MASK,
                maskImage: LIQUID_MASK,
                WebkitMaskComposite: "source-in",
                maskComposite: "intersect",
              }}
            />
          ) : null}
        </AbsoluteFill>
        {/* warm sunlight entering the miniature */}
        <AbsoluteFill
          style={{
            background: "radial-gradient(ellipse 70% 40% at 42% 15%, rgba(255,190,90,0.9), rgba(255,150,60,0) 70%)",
            mixBlendMode: "soft-light",
            opacity: 0.35 + 0.65 * sun,
          }}
        />
      </AbsoluteFill>
      {/* foreground paper planes, moving faster than the diorama */}
      <PaperPalm
        style={{
          left: -260 + 340 * (orbit - 0.5) * -1 - 120 * settle,
          top: 1180 - 80 * orbit,
          filter: "blur(9px)",
          opacity: 0.95 * (1 - settle),
          scale: "1.5",
        }}
      />
      <PaperPalm
        flip
        style={{
          left: 820 + 300 * (orbit - 0.5) * -1 + 160 * settle,
          top: -260 + 60 * orbit,
          filter: "blur(12px)",
          opacity: 0.9 * (1 - settle),
          scale: "1.3",
        }}
      />
      <AbsoluteFill
        style={{
          background: "linear-gradient(to bottom, rgba(70,42,16,0.5), rgba(70,42,16,0) 32%)",
          opacity: k(f, [30, 60], [0, 1]) * k(f, [150, 175], [1, 0]),
        }}
      />
      <PaperWords f={f} />
      <Vignette strength={0.45} color="40,24,8" />
      <Grain opacity={0.2} seed="s4" />
      <AbsoluteFill style={{ background: "#fff6e0", opacity: k(f, [0, 30], [0.35, 0], EASE_OUT) }} />
    </AbsoluteFill>
  );
};
