import { Audio } from "@remotion/media";
import React from "react";
import { AbsoluteFill, Easing, Freeze, Img, Sequence, interpolate, staticFile, useCurrentFrame } from "remotion";
import { FilmDamage, Grain, Vignette } from "../components/Film";
import { FONTS, img, k } from "../lib";
import { InkSketch } from "../scenes/S1Parchment";
import { S2Archive } from "../scenes/S2Archive";
import { S3Blueprint } from "../scenes/S3Blueprint";
import { S4Paper } from "../scenes/S4Paper";
import { S5Reality } from "../scenes/S5Reality";
import { Cam, EXPO_OUT, Flash, Shockwave, Slam, Sweep, Tracking, hit, hits, shake } from "./fx";

// 120 bpm, a beat every 15 frames. Every cut, slam and punch lands on the grid.
export const REEL = {
  hook: { from: 0, dur: 150 },
  parchment: { from: 150, dur: 90 },
  archive: { from: 240, dur: 90 },
  blueprint: { from: 330, dur: 120 },
  paper: { from: 450, dur: 120 },
  drop: { from: 570, dur: 90 },
  thenNow: { from: 660, dur: 90 },
  title: { from: 750, dur: 150 },
};

/** Remaps a shot's local frame onto a scene's own timeline (speed ramps). */
const ramp = (f: number, input: number[], output: number[]) =>
  interpolate(f, input, output, { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

const Real: React.FC<{ t: number }> = ({ t }) => (
  <Freeze frame={Math.round(t)}>
    <S5Reality />
  </Freeze>
);

const TopShade: React.FC<{ o?: number }> = ({ o = 0.55 }) => (
  <AbsoluteFill style={{ background: `linear-gradient(to bottom, rgba(0,0,0,${o}), rgba(0,0,0,0) 45%)` }} />
);

/* -------------------------------------------------------------- 00:00 HOOK */

const ERAS = ["paper", "blueprint", "archive", "parchment", "real"] as const;

const EraStill: React.FC<{ era: (typeof ERAS)[number] }> = ({ era }) => {
  if (era === "real") return <Real t={130} />;
  if (era === "paper")
    return (
      <Freeze frame={30}>
        <S4Paper />
      </Freeze>
    );
  if (era === "blueprint")
    return (
      <Freeze frame={150}>
        <S3Blueprint />
      </Freeze>
    );
  if (era === "archive")
    return (
      <Freeze frame={30}>
        <S2Archive />
      </Freeze>
    );
  return <Img src={img("parchment_world.png")} style={{ width: 1080, height: 1920 }} />;
};

const Hook: React.FC = () => {
  const f = useCurrentFrame();
  const beats = [0, 10, 20, 45, 55, 100];
  const sh = shake(f, beats, 24, "hook");
  const rgb = 16 * hits(f, beats, 5);

  let body: React.ReactNode;
  if (f < 64) {
    const s = k(f, [0, 10], [2.4, 1.12], EXPO_OUT) + 0.07 * hits(f, [10, 20, 45, 55], 6) + k(f, [10, 64], [0, 0.08]);
    body = (
      <Cam id="hk1" s={s} x={sh.x} y={sh.y} r={sh.r} rgb={rgb} origin="455px 640px">
        <Real t={100 + f * 0.8} />
      </Cam>
    );
  } else if (f < 100) {
    // rewind: the eras flicker past while the year counts back
    const r = f - 64;
    const era = ERAS[Math.floor(r / 3) % ERAS.length];
    body = (
      <Cam id="hk2" s={1.08 + 0.04 * Math.sin(r * 1.7)} x={Math.sin(r * 2.3) * 30} rgb={18} origin="50% 50%">
        <EraStill era={era} />
      </Cam>
    );
  } else {
    // 1968: the old crossing slams in
    const s = k(f, [100, 108], [1.5, 1], EXPO_OUT) + k(f, [108, 150], [0, 0.06]);
    body = (
      <AbsoluteFill style={{ background: "#160e08" }}>
        <Cam id="hk3" s={s} x={sh.x} y={sh.y} r={sh.r - 2} rgb={rgb}>
          <div
            style={{
              position: "absolute",
              left: 60,
              top: 520,
              width: 960,
              height: 738,
              background: "#ece2cc",
              padding: 22,
              boxSizing: "border-box",
              boxShadow: "0 40px 90px rgba(0,0,0,0.7)",
            }}
          >
            <Img src={img("archive_bridge.png")} style={{ width: "100%", height: "100%", filter: "sepia(0.5) contrast(1.1)" }} />
          </div>
        </Cam>
        <FilmDamage opacity={0.8} />
      </AbsoluteFill>
    );
  }

  const year = Math.round(
    interpolate(f, [64, 100], [2026, 1968], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.bezier(0.5, 0, 0.9, 0.6) }),
  );

  return (
    <AbsoluteFill style={{ background: "#000" }}>
      {body}
      {f < 64 ? <TopShade o={0.65} /> : null}
      <Tracking strength={f >= 62 && f < 102 ? 1 : 0} />
      {/* opening line, word by word */}
      <Slam at={2} out={40} size={124} style={{ top: 220 }}>
        جسر واحد
      </Slam>
      <Slam at={12} out={40} size={124} style={{ top: 400 }}>
        غيّر
      </Slam>
      <Slam at={22} out={40} size={190} style={{ top: 590 }} color="#ffd88a">
        أبوظبي
      </Slam>
      {/* the promise */}
      <Slam at={45} out={62} size={200} style={{ top: 280 }}>
        58 سنة
      </Slam>
      <Slam at={55} out={62} size={112} style={{ top: 520 }} color="#ffd88a">
        في 30 ثانية
      </Slam>
      {/* year counter */}
      {f >= 64 && f < 100 ? (
        <div
          style={{
            position: "absolute",
            top: 700,
            width: 1080,
            textAlign: "center",
            fontFamily: FONTS.alexandria,
            fontWeight: 900,
            fontSize: 280,
            color: "#fff",
            textShadow: "6px 0 0 rgba(255,0,60,0.7), -6px 0 0 rgba(0,200,255,0.7), 0 12px 60px rgba(0,0,0,0.8)",
            transform: `translateX(${Math.sin(f * 3) * 6}px)`,
          }}
        >
          {year}
        </div>
      ) : null}
      {f >= 64 && f < 100 ? (
        <div style={{ position: "absolute", top: 560, width: 1080, textAlign: "center", fontSize: 110, color: "#fff", opacity: f % 6 < 4 ? 1 : 0.3 }}>
          ⏪
        </div>
      ) : null}
      <Slam at={100} size={230} style={{ top: 230 }} color="#ffd88a" font={FONTS.alexandria}>
        1968
      </Slam>
      <Slam at={110} size={104} style={{ top: 1310 }}>
        أول جسر
      </Slam>
      <Slam at={118} size={64} weight={600} style={{ top: 1450 }}>
        يربط جزيرة أبوظبي باليابسة
      </Slam>
      <Flash ats={[0, 100]} strength={1} decay={3} />
      <Flash ats={[10, 20, 45, 55]} strength={0.25} />
      <Flash ats={[64]} color="#9ad7ff" strength={0.5} />
      <Grain opacity={0.18} seed="hook" />
    </AbsoluteFill>
  );
};

/* -------------------------------------------------- 00:05 THE CROSSING POINT */

const Parchment: React.FC = () => {
  const f = useCurrentFrame();
  const s = k(f, [0, 14], [1.65, 1.2], EXPO_OUT) + 0.04 * hits(f, [15, 30, 45, 60], 6) + k(f, [14, 76], [0, 0.07]);
  const x = k(f, [76, 90], [0, -1600], Easing.bezier(0.7, 0, 1, 0.6));
  return (
    <AbsoluteFill style={{ background: "#000" }}>
      <Cam id="pa" s={s} x={x} blurX={k(f, [74, 90], [0, 70])} rgb={10 * hit(f, 0, 5)} origin="290px 960px">
        <Img src={img("parchment_world.png")} style={{ width: 1080, height: 1920 }} />
        <AbsoluteFill style={{ opacity: k(f, [18, 40], [1, 0]) }}>
          <InkSketch f={8 + f * 3.2} />
        </AbsoluteFill>
      </Cam>
      <AbsoluteFill style={{ transform: `translateX(${x}px)` }}>
        <Slam at={3} out={72} from={1.7} size={250} font={FONTS.ruqaa} weight={700} color="#2a170a" style={{ top: 200, textShadow: "0 0 30px rgba(255,236,190,0.8)" }}>
          المقطع
        </Slam>
        <Slam at={18} out={72} size={66} weight={800} color="#2a170a" style={{ top: 540, textShadow: "0 0 24px rgba(255,236,190,0.9)" }}>
          حيث بدأ العبور
        </Slam>
      </AbsoluteFill>
      <Flash ats={[0]} color="#fff3d6" strength={0.7} />
      <Vignette strength={0.5} />
      <Grain opacity={0.25} seed="pa" />
    </AbsoluteFill>
  );
};

/* -------------------------------------------------------- 00:08 THE ARCHIVE */

const Archive: React.FC = () => {
  const f = useCurrentFrame();
  const x = k(f, [0, 12], [1600, 0], EXPO_OUT);
  // three framings, cut on the beat
  const framing = f < 30 ? { s: 1.05 + f * 0.003, o: "720px 722px" } : f < 50 ? { s: 1.55, o: "820px 600px" } : { s: 1.2, o: "540px 1100px" };
  const sh = shake(f, [30, 50], 18, "ar");
  const printIn = k(f, [50, 58], [0, 1], EXPO_OUT);
  const glitch = k(f, [76, 90], [0, 1]);
  return (
    <AbsoluteFill style={{ background: "#000" }}>
      <Cam
        id="ar"
        s={framing.s + 0.04 * hits(f, [30, 50, 60, 75], 6)}
        x={x + sh.x}
        y={sh.y}
        blurX={k(f, [0, 12], [70, 0])}
        rgb={6 * hits(f, [30, 50], 5) + glitch * 22}
        origin={framing.o}
      >
        <Freeze frame={Math.round(8 + f * 0.4)}>
          <S2Archive />
        </Freeze>
      </Cam>
      <AbsoluteFill style={{ background: "#000", opacity: printIn * 0.55 }} />
      {printIn > 0 ? (
        <AbsoluteFill style={{ transform: `scale(${1.5 - 0.5 * printIn}) rotate(${-4 + 2 * printIn}deg)` }}>
          <div
            style={{
              position: "absolute",
              left: 70,
              top: 560,
              width: 940,
              height: 724,
              background: "#ece2cc",
              padding: 20,
              boxSizing: "border-box",
              boxShadow: "0 40px 90px rgba(0,0,0,0.7)",
              filter: `invert(${glitch}) hue-rotate(${glitch * 180}deg)`,
            }}
          >
            <Img src={img("archive_bridge.png")} style={{ width: "100%", height: "100%", filter: "sepia(0.5) contrast(1.1)" }} />
          </div>
        </AbsoluteFill>
      ) : null}
      <AbsoluteFill style={{ transform: `translateX(${x}px)` }}>
        <Slam at={6} out={46} size={140} color="#1b120a" style={{ top: 250, textShadow: "0 0 26px rgba(240,226,200,0.9)" }}>
          قبل 1968
        </Slam>
        <Slam at={18} out={46} size={66} weight={700} color="#1b120a" style={{ top: 440, textShadow: "0 0 22px rgba(240,226,200,0.9)" }}>
          كان البحر يفصل الجزيرة
        </Slam>
      </AbsoluteFill>
      <Slam at={58} out={84} size={120} style={{ top: 1340 }} color="#ffd88a">
        ثم جاء الجسر
      </Slam>
      <AbsoluteFill style={{ background: "#0a2350", opacity: glitch * 0.6, mixBlendMode: "color" }} />
      <Tracking strength={glitch} />
      <Flash ats={[50]} strength={0.85} />
      <Flash ats={[89]} color="#cfe0ff" strength={0.8} />
    </AbsoluteFill>
  );
};

/* ------------------------------------------------------- 00:11 THE BLUEPRINT */

const Blueprint: React.FC = () => {
  const f = useCurrentFrame();
  const t = ramp(f, [0, 100, 120], [30, 166, 208]);
  const s = k(f, [0, 16], [1.9, 1], EXPO_OUT) + 0.035 * hits(f, [30, 45, 60, 75, 90], 6);
  return (
    <AbsoluteFill style={{ background: "#071a3d" }}>
      {f >= 98 ? (
        <Freeze frame={0}>
          <S4Paper />
        </Freeze>
      ) : null}
      <Cam id="bp" s={s} rgb={18 * hit(f, 0, 6) + 5 * hits(f, [45, 75], 4)} origin="540px 1050px">
        <Freeze frame={Math.round(t)}>
          <S3Blueprint />
        </Freeze>
      </Cam>
      <Flash ats={[45, 75]} color="#cfe0ff" strength={0.2} />
    </AbsoluteFill>
  );
};

/* ---------------------------------------------------------- 00:15 PAPER WORLD */

const Paper: React.FC = () => {
  const f = useCurrentFrame();
  const t = ramp(f, [0, 20, 80, 100, 120], [0, 50, 112, 172, 205]);
  const strobe = f >= 100 && Math.floor((f - 100) / Math.max(1, 3 - (f - 100) / 8)) % 2 === 1;
  const s = 1 + 0.05 * hits(f, [0, 30, 45, 60, 75], 6) + k(f, [96, 120], [0, 0.35], Easing.bezier(0.6, 0, 1, 0.6));
  const sh = shake(f, [100, 105, 110, 114, 117], 14, "pp");
  return (
    <AbsoluteFill style={{ background: "#000" }}>
      <Cam id="pp" s={s} x={sh.x} y={sh.y} r={sh.r} rgb={k(f, [96, 120], [0, 26])} origin="455px 640px">
        {strobe ? (
          <Real t={110} />
        ) : (
          <Freeze frame={Math.round(t)}>
            <S4Paper />
          </Freeze>
        )}
      </Cam>
      <Flash ats={[0]} color="#fff6e0" strength={0.6} />
      <Flash ats={[105, 110, 114, 117]} strength={0.35} decay={1.5} />
    </AbsoluteFill>
  );
};

/* ----------------------------------------------------------------- 00:19 DROP */

const Drop: React.FC = () => {
  const f = useCurrentFrame();
  const s = k(f, [0, 10], [1.75, 1.0], EXPO_OUT) + 0.045 * hits(f, [30, 45, 60, 75], 6) + k(f, [10, 90], [0, 0.05]);
  const sh = shake(f, [0, 30, 60], 30, "dr");
  return (
    <AbsoluteFill style={{ background: "#000" }}>
      <Cam id="dr" s={s} x={sh.x} y={sh.y} r={sh.r} rgb={26 * hit(f, 0, 7) + 8 * hits(f, [30, 60], 4)} origin="455px 640px">
        <Real t={96 + f * 0.9} />
      </Cam>
      <Shockwave at={0} x={455} y={640} />
      <Sweep at={28} />
      <Sweep at={58} />
      <Slam at={8} out={82} size={112} style={{ top: 1130 }}>
        من 1968
      </Slam>
      <Slam at={20} out={82} size={140} style={{ top: 1280 }} color="#ffd88a">
        إلى اليوم
      </Slam>
      <Flash ats={[0]} strength={1} decay={4} />
      <Flash ats={[30, 60]} strength={0.25} />
    </AbsoluteFill>
  );
};

/* ------------------------------------------------------------ 00:22 THEN / NOW */

const SLIDER = { input: [0, 10, 30, 38, 52, 60, 74, 84], output: [1080, 540, 540, 300, 300, 820, 820, 0] };

const ThenNow: React.FC = () => {
  const f = useCurrentFrame();
  const sx = interpolate(f, SLIDER.input, SLIDER.output, { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: EXPO_OUT });
  const moves = [0, 30, 52, 74];
  const s = 1.04 + 0.03 * hits(f, moves, 6);
  return (
    <AbsoluteFill style={{ background: "#000" }}>
      <Cam id="tn" s={s} origin="540px 700px">
        <Real t={140 + f * 0.35} />
      </Cam>
      {/* 1968, on the left of the slider */}
      <AbsoluteFill style={{ clipPath: `inset(0 ${1080 - sx}px 0 0)` }}>
        <AbsoluteFill style={{ background: "#1a120b" }} />
        <Cam id="tn2" s={s} origin="540px 700px">
          <Img
            src={img("archive_bridge.png")}
            style={{ position: "absolute", left: -110, top: 380, width: 1300, height: 999, filter: "sepia(0.7) contrast(1.15) brightness(0.95)" }}
          />
        </Cam>
        <AbsoluteFill style={{ background: "linear-gradient(to bottom, #1a120b 15%, rgba(26,18,11,0) 24%, rgba(26,18,11,0) 70%, #1a120b 76%)" }} />
        <Grain opacity={0.5} seed="tn" />
      </AbsoluteFill>
      {/* the slider */}
      <div style={{ position: "absolute", left: sx - 3, top: 0, width: 6, height: 1920, background: "#fff", boxShadow: "0 0 30px rgba(255,220,150,0.9)" }} />
      <div
        style={{
          position: "absolute",
          left: sx - 44,
          top: 916,
          width: 88,
          height: 88,
          borderRadius: "50%",
          background: "#fff",
          boxShadow: "0 0 30px rgba(255,220,150,0.9)",
          color: "#1a120b",
          fontSize: 40,
          lineHeight: "88px",
          textAlign: "center",
          fontFamily: FONTS.alexandria,
          fontWeight: 900,
        }}
      >
        ⟷
      </div>
      <div
        style={{
          position: "absolute",
          top: 230,
          left: 0,
          width: Math.max(sx, 1),
          textAlign: "center",
          fontFamily: FONTS.alexandria,
          fontWeight: 900,
          fontSize: 110,
          color: "#f1e2c4",
          opacity: k(sx, [120, 240], [0, 1]),
          textShadow: "0 8px 30px rgba(0,0,0,0.7)",
          overflow: "hidden",
          whiteSpace: "nowrap",
        }}
      >
        1968
      </div>
      <div
        dir="rtl"
        lang="ar"
        style={{
          position: "absolute",
          top: 230,
          left: sx,
          width: Math.max(1080 - sx, 1),
          textAlign: "center",
          fontFamily: FONTS.alexandria,
          fontWeight: 900,
          fontSize: 110,
          color: "#ffd88a",
          opacity: k(1080 - sx, [160, 300], [0, 1]),
          textShadow: "0 8px 30px rgba(0,0,0,0.7)",
          overflow: "hidden",
          whiteSpace: "nowrap",
        }}
      >
        اليوم
      </div>
      <Flash ats={moves} strength={0.18} />
    </AbsoluteFill>
  );
};

/* ---------------------------------------------------------- 00:25 SIGNATURE */

const Title: React.FC = () => {
  const f = useCurrentFrame();
  const t = ramp(f, [0, 45, 150], [182, 262, 272]);
  const s = 1 + k(f, [0, 150], [0, 0.07]) + 0.035 * hit(f, 42, 8);
  return (
    <AbsoluteFill style={{ background: "#000" }}>
      <Cam id="ti" s={s} rgb={6 * hit(f, 42, 6)} origin="540px 1200px">
        <Real t={t} />
      </Cam>
      <Sweep at={44} dur={18} />
      <Slam at={62} from={1.4} size={46} weight={500} color="#f3dfb2" style={{ top: 1440 }}>
        1968 — 2026
      </Slam>
      <Flash ats={[42]} color="#fff2d0" strength={0.45} decay={4} />
    </AbsoluteFill>
  );
};

export const Reel: React.FC = () => (
  <AbsoluteFill style={{ background: "#000" }}>
    <Sequence name="Hook" from={REEL.hook.from} durationInFrames={REEL.hook.dur}>
      <Hook />
    </Sequence>
    <Sequence name="The crossing point" from={REEL.parchment.from} durationInFrames={REEL.parchment.dur}>
      <Parchment />
    </Sequence>
    <Sequence name="Archive" from={REEL.archive.from} durationInFrames={REEL.archive.dur}>
      <Archive />
    </Sequence>
    <Sequence name="Blueprint" from={REEL.blueprint.from} durationInFrames={REEL.blueprint.dur}>
      <Blueprint />
    </Sequence>
    <Sequence name="Paper world" from={REEL.paper.from} durationInFrames={REEL.paper.dur}>
      <Paper />
    </Sequence>
    <Sequence name="Drop" from={REEL.drop.from} durationInFrames={REEL.drop.dur}>
      <Drop />
    </Sequence>
    <Sequence name="Then / now" from={REEL.thenNow.from} durationInFrames={REEL.thenNow.dur}>
      <ThenNow />
    </Sequence>
    <Sequence name="Signature" from={REEL.title.from} durationInFrames={REEL.title.dur}>
      <Title />
    </Sequence>
    {/* soundtrack: scripts/reel_score.py */}
    <Audio src={staticFile("reel.wav")} />
  </AbsoluteFill>
);
