import React from "react";
import { AbsoluteFill, Easing, Img, interpolateColors, useCurrentFrame } from "remotion";
import { Grain, Vignette } from "../components/Film";
import { EASE_OUT, FONTS, H, W, archPath, k, tex } from "../lib";

// Elevation of the bridge: three steel through-arches on concrete piers,
// following the arch rhythm of the reference photographs.
const DECK = 1090;
const PIERS = [70, 380, 700, 1010];
const APEX = 994; // rise ≈ 0.3 of the span, as on the real bridge
const SPANS = PIERS.slice(0, -1).map((x, i) => ({ x1: x, x2: PIERS[i + 1] }));

const draw = (f: number, at: number, len: number, ease = Easing.bezier(0.45, 0, 0.2, 1)) =>
  1 - k(f, [at, at + len], [0, 1], ease);

const BlueprintArt: React.FC<{ f: number; paper: number }> = ({ f, paper }) => {
  const ink = interpolateColors(paper, [0, 1], ["#e6eefc", "#6b4a26"]);
  const faint = interpolateColors(paper, [0, 1], ["rgba(200,220,255,0.10)", "rgba(110,80,40,0.10)"]);
  const major = interpolateColors(paper, [0, 1], ["rgba(200,220,255,0.2)", "rgba(110,80,40,0.18)"]);
  const gold = interpolateColors(paper, [0, 1], ["#f0c06a", "#a86f2a"]);
  const grid = k(f, [0, 34], [0, 1], EASE_OUT);
  const cam = k(f, [0, 212], [1, 1.06], Easing.bezier(0.3, 0, 0.7, 1));

  // 1968 travels from the centre of the sheet to the crown of the middle arch.
  const yearMove = k(f, [108, 150], [0, 1], Easing.bezier(0.65, 0, 0.25, 1));
  const yearSize = 290 - 230 * yearMove;
  const yearY = 700 + (APEX - 34 - 780) * yearMove;
  const yearStroke = draw(f, 26, 44);
  const yearFill = k(f, [58, 80], [0, 1]);

  // Underline that bends into the middle arch.
  const u = yearMove;
  const lx1 = 300 + (380 - 300) * u;
  const ly1 = 760 + (DECK - 760) * u;
  const lcx = 540;
  const lcy = 760 + (2 * APEX - DECK - 760) * u;
  const lx2 = 780 + (700 - 780) * u;
  const underline = `M ${lx1} ${ly1} Q ${lcx} ${lcy} ${lx2} ${ly1}`;

  const scan = k(f, [70, 150], [40, 1040], Easing.bezier(0.4, 0, 0.6, 1));

  return (
    <AbsoluteFill style={{ background: interpolateColors(paper, [0, 1], ["#0a2350", "#efe2c4"]) }}>
      <Img src={tex("blueprint_paper.png")} style={{ position: "absolute", width: W, height: H, opacity: 1 - paper }} />
      <Img
        src={tex("parchment.png")}
        style={{ position: "absolute", width: W, height: H, opacity: paper * 0.6, mixBlendMode: "multiply" }}
      />
      <AbsoluteFill style={{ transform: `scale(${cam})`, transformOrigin: "540px 1000px" }}>
        <svg width={W} height={H} style={{ position: "absolute" }}>
          <defs>
            <filter id="gold-glow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="6" result="b" />
              <feMerge>
                <feMergeNode in="b" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>
          {/* drafting grid */}
          {new Array(37).fill(0).map((_, i) => (
            <line key={`v${i}`} x1={i * 30} x2={i * 30} y1={0} y2={H * grid} stroke={i % 5 === 0 ? major : faint} strokeWidth={1} />
          ))}
          {new Array(65).fill(0).map((_, i) => (
            <line key={`h${i}`} y1={i * 30} y2={i * 30} x1={0} x2={W * grid} stroke={i % 5 === 0 ? major : faint} strokeWidth={1} />
          ))}
          {/* sheet frame */}
          <rect x={40} y={140} width={1000} height={1560} fill="none" stroke={ink} strokeWidth={2} pathLength={1} strokeDasharray="1 1" strokeDashoffset={draw(f, 6, 40)} opacity={0.6} />

          <g fill="none" stroke={ink} strokeLinecap="round">
            {/* deck */}
            <path d={`M 20 ${DECK} L 1060 ${DECK}`} strokeWidth={3} pathLength={1} strokeDasharray="1 1" strokeDashoffset={draw(f, 18, 34)} />
            <path d={`M 20 ${DECK + 20} L 1060 ${DECK + 20}`} strokeWidth={2} pathLength={1} strokeDasharray="1 1" strokeDashoffset={draw(f, 24, 34)} />
            {/* piers */}
            {PIERS.map((x, i) => (
              <path
                key={`p${i}`}
                d={`M ${x - 22} ${DECK + 20} L ${x - 22} ${DECK + 128} L ${x - 36} ${DECK + 140} L ${x + 36} ${DECK + 140} L ${x + 22} ${DECK + 128} L ${x + 22} ${DECK + 20}`}
                strokeWidth={2.2}
                pathLength={1}
                strokeDasharray="1 1"
                strokeDashoffset={draw(f, 30 + i * 6, 26)}
              />
            ))}
            {/* arches: outer and inner rib */}
            {SPANS.map((s, i) => (
              <g key={`a${i}`}>
                <path d={archPath(s.x1, DECK, (s.x1 + s.x2) / 2, APEX, s.x2, DECK)} strokeWidth={3} pathLength={1} strokeDasharray="1 1" strokeDashoffset={draw(f, 40 + i * 12, 40)} />
                <path d={archPath(s.x1 + 16, DECK, (s.x1 + s.x2) / 2, APEX + 16, s.x2 - 16, DECK)} strokeWidth={1.6} pathLength={1} strokeDasharray="1 1" strokeDashoffset={draw(f, 48 + i * 12, 40)} />
                {/* hangers */}
                {new Array(11).fill(0).map((_, j) => {
                  const t = (j + 1) / 12;
                  const x = s.x1 + 16 + (s.x2 - s.x1 - 32) * t;
                  const yArch = DECK - (DECK - APEX - 16) * 4 * t * (1 - t);
                  const g = k(f, [62 + i * 12 + j * 2.4, 74 + i * 12 + j * 2.4], [0, 1]);
                  return <line key={j} x1={x} x2={x} y1={yArch} y2={yArch + (DECK - yArch) * g} strokeWidth={1.4} opacity={0.9} />;
                })}
              </g>
            ))}
            {/* water line */}
            <path
              d={new Array(18).fill(0).map((_, i) => `M ${40 + i * 58} ${DECK + 102} q 14 -6 28 0`).join(" ")}
              strokeWidth={1.4}
              opacity={0.7 * k(f, [60, 90], [0, 1])}
            />
          </g>

          {/* dimensioning */}
          <g stroke={ink} strokeWidth={1.2} fill="none" opacity={0.85 * k(f, [70, 96], [0, 1])}>
            {SPANS.map((s, i) => {
              const y = APEX - 70;
              const p = k(f, [76 + i * 8, 104 + i * 8], [0, 1], EASE_OUT);
              const mid = (s.x1 + s.x2) / 2;
              const half = ((s.x2 - s.x1) / 2) * p;
              return (
                <g key={`d${i}`}>
                  <line x1={mid - half} x2={mid + half} y1={y} y2={y} />
                  <line x1={mid - half} x2={mid - half} y1={y - 10} y2={y + 10} />
                  <line x1={mid + half} x2={mid + half} y1={y - 10} y2={y + 10} />
                  <line x1={s.x1} x2={s.x1} y1={y + 14} y2={DECK - 10} strokeDasharray="6 8" opacity={p} />
                </g>
              );
            })}
            <line x1={1036} x2={1036} y1={APEX} y2={DECK} />
            <line x1={1026} x2={1046} y1={APEX} y2={APEX} />
            <line x1={1026} x2={1046} y1={DECK} y2={DECK} />
          </g>
          {/* axis bubbles */}
          {PIERS.map((x, i) => (
            <g key={`b${i}`} opacity={k(f, [84 + i * 5, 100 + i * 5], [0, 1])}>
              <line x1={x} x2={x} y1={DECK + 150} y2={DECK + 196} stroke={ink} strokeWidth={1} strokeDasharray="4 5" />
              <circle cx={x} cy={DECK + 222} r={24} fill="none" stroke={ink} strokeWidth={1.6} />
              <text x={x} y={DECK + 232} fill={ink} fontFamily={FONTS.cormorant} fontWeight={600} fontSize={28} textAnchor="middle">
                {String.fromCharCode(65 + i)}
              </text>
            </g>
          ))}
          {/* measuring sweep */}
          <g opacity={k(f, [70, 80], [0, 1]) * k(f, [146, 160], [1, 0])}>
            <line x1={scan} x2={scan} y1={APEX - 90} y2={DECK + 140} stroke={gold} strokeWidth={1.5} strokeDasharray="3 6" />
            <circle cx={scan} cy={DECK} r={7} fill="none" stroke={gold} strokeWidth={2} />
            <circle cx={scan} cy={DECK - (DECK - APEX) * Math.abs(Math.sin(((scan - 70) / 320) * Math.PI))} r={5} fill={gold} />
          </g>
          {/* golden construction path over all three arches */}
          <g filter="url(#gold-glow)" fill="none" stroke={gold} strokeWidth={3.2} strokeLinecap="round">
            {SPANS.map((s, i) => (
              <path
                key={`g${i}`}
                d={archPath(s.x1, DECK, (s.x1 + s.x2) / 2, APEX, s.x2, DECK)}
                pathLength={1}
                strokeDasharray="1 1"
                strokeDashoffset={draw(f, 112 + i * 10, 34)}
                opacity={i === 1 ? 0 : 1}
              />
            ))}
            <path d={`M 20 ${DECK} L 1060 ${DECK}`} pathLength={1} strokeDasharray="1 1" strokeDashoffset={draw(f, 120, 40)} strokeWidth={2.4} />
            {/* the underline beneath the year, bending into the centre arch */}
            <path d={underline} pathLength={1} strokeDasharray="1 1" strokeDashoffset={draw(f, 70, 22)} />
          </g>
          {/* the year */}
          <text
            x={540}
            y={yearY}
            textAnchor="middle"
            fontFamily={FONTS.cormorant}
            fontWeight={500}
            fontSize={yearSize}
            fill={ink}
            fillOpacity={yearFill}
            stroke={ink}
            strokeWidth={2 - yearMove}
            strokeDasharray={1400}
            strokeDashoffset={1400 * yearStroke}
            style={{ fontVariantNumeric: "lining-nums" }}
          >
            1968
          </text>
          {/* title block */}
          <g opacity={k(f, [96, 120], [0, 1])} stroke={ink} fill="none" strokeWidth={1.4}>
            <rect x={150} y={1440} width={780} height={130} pathLength={1} strokeDasharray="1 1" strokeDashoffset={draw(f, 96, 30)} />
            <line x1={540} x2={540} y1={1440} y2={1570} />
            <line x1={540} x2={930} y1={1505} y2={1505} />
          </g>
        </svg>
        {/* Arabic technical lettering */}
        <div
          dir="rtl"
          lang="ar"
          style={{
            position: "absolute",
            top: 1440,
            left: 540,
            width: 390,
            height: 65,
            lineHeight: "65px",
            textAlign: "center",
            fontFamily: FONTS.kufi,
            fontWeight: 600,
            fontSize: 34,
            color: ink,
            opacity: k(f, [110, 126], [0, 1]),
          }}
        >
          جسر المقطع
        </div>
        <div
          dir="rtl"
          lang="ar"
          style={{
            position: "absolute",
            top: 1505,
            left: 540,
            width: 390,
            height: 65,
            lineHeight: "65px",
            textAlign: "center",
            fontFamily: FONTS.kufi,
            fontSize: 28,
            color: ink,
            opacity: k(f, [116, 132], [0, 0.85]),
          }}
        >
          الواجهة الإنشائية · أبوظبي
        </div>
        <div
          style={{
            position: "absolute",
            top: 1440,
            left: 150,
            width: 390,
            height: 130,
            lineHeight: "130px",
            textAlign: "center",
            fontFamily: FONTS.cormorant,
            fontWeight: 600,
            fontSize: 52,
            color: gold,
            opacity: k(f, [140, 156], [0, 1]),
          }}
        >
          1968
        </div>
      </AbsoluteFill>
      <Headline f={f} ink={ink} />
    </AbsoluteFill>
  );
};

const Headline: React.FC<{ f: number; ink: string }> = ({ f, ink }) => {
  const box = k(f, [80, 100], [0, 1], EASE_OUT);
  const wipe = k(f, [92, 122], [0, 1], Easing.bezier(0.4, 0, 0.2, 1));
  const edge = wipe * 110 - 5;
  return (
    <div style={{ position: "absolute", top: 268, left: 90, width: 900, height: 150 }}>
      {/* construction box the lettering is set into */}
      <div style={{ position: "absolute", left: 450 - 450 * box, width: 900 * box, top: 0, height: 1, background: ink, opacity: 0.6 }} />
      <div style={{ position: "absolute", left: 450 - 450 * box, width: 900 * box, bottom: 0, height: 1, background: ink, opacity: 0.6 }} />
      <div
        dir="rtl"
        lang="ar"
        style={{
          position: "absolute",
          inset: 0,
          lineHeight: "150px",
          textAlign: "center",
          fontFamily: FONTS.kufi,
          fontWeight: 600,
          fontSize: 74,
          color: ink,
          WebkitMaskImage: `linear-gradient(to left, #000 ${edge}%, transparent ${edge + 5}%)`,
          maskImage: `linear-gradient(to left, #000 ${edge}%, transparent ${edge + 5}%)`,
        }}
      >
        لحظة غيّرت طريق أبوظبي
      </div>
      {/* drafting cursor */}
      <div
        style={{
          position: "absolute",
          top: 20,
          height: 110,
          width: 2,
          right: `${Math.min(edge, 100)}%`,
          background: "#f0c06a",
          opacity: wipe > 0 && wipe < 1 ? 1 : 0,
          boxShadow: "0 0 12px #f0c06a",
        }}
      />
    </div>
  );
};

const STRIPS = 6;

export const S3Blueprint: React.FC = () => {
  const f = useCurrentFrame();
  const intro = k(f, [0, 34], [0, 1]);
  const fold = k(f, [170, 208], [0, 1], Easing.bezier(0.55, 0, 0.35, 1));
  const paper = k(f, [172, 194], [0, 1]);

  if (fold <= 0) {
    return (
      <AbsoluteFill style={{ opacity: intro }}>
        <BlueprintArt f={f} paper={paper} />
        <Vignette strength={0.55} />
        <Grain opacity={0.25} seed="s3" />
      </AbsoluteFill>
    );
  }

  // Accordion fold: the sheet creases into vertical panels that collapse
  // toward the centre while it turns to cream card stock.
  const theta = fold * 84 * (Math.PI / 180);
  const c = Math.cos(theta);
  const w = W / STRIPS;
  const total = W * c;
  const sc = 1 - 0.3 * fold;
  return (
    <AbsoluteFill
      style={{
        transform: `scale(${sc}) translateY(${fold * 160}px)`,
        transformOrigin: "50% 60%",
        opacity: k(fold, [0.78, 1], [1, 0]),
      }}
    >
      {new Array(STRIPS).fill(0).map((_, i) => {
        const left = W / 2 - total / 2 + i * w * c;
        const even = i % 2 === 0;
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              top: 0,
              left,
              width: w,
              height: H,
              overflow: "hidden",
              transformOrigin: "0 50%",
              transform: `scaleX(${c}) skewY(${(even ? 1 : -1) * fold * 7}deg)`,
              boxShadow: "0 0 40px rgba(0,0,0,0.35)",
            }}
          >
            <div style={{ position: "absolute", left: -i * w, top: 0, width: W, height: H }}>
              <BlueprintArt f={f} paper={paper} />
            </div>
            <div
              style={{
                position: "absolute",
                inset: 0,
                background: even
                  ? `linear-gradient(to right, rgba(60,35,10,${0.1 * fold}), rgba(60,35,10,${0.5 * fold}))`
                  : `linear-gradient(to right, rgba(255,250,235,${0.25 * fold}), rgba(60,35,10,${0.1 * fold}))`,
              }}
            />
          </div>
        );
      })}
    </AbsoluteFill>
  );
};
