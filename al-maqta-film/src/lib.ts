import { Easing, interpolate, staticFile } from "remotion";

export const W = 1080;
export const H = 1920;
export const FPS = 30;
export const DURATION = 900;

// Global timeline (frames). Each scene overlaps its neighbour by the length of
// the transformation between them.
export const T = {
  s1: { from: 0, dur: 178 }, // parchment, peels away 140-178
  s2: { from: 140, dur: 192 }, // archive photo, freezes into blueprint 292-332
  s3: { from: 296, dur: 212 }, // blueprint, folds into paper 466-508
  s4: { from: 466, dur: 246 }, // paper diorama, becomes real 630-712
  s5: { from: 628, dur: 272 }, // reality + final title (scene 06 at 810)
};

export const EASE = Easing.bezier(0.45, 0, 0.2, 1);
export const EASE_OUT = Easing.bezier(0.16, 1, 0.3, 1);
export const EASE_IN = Easing.bezier(0.6, 0, 0.9, 0.4);
export const EASE_INOUT = Easing.bezier(0.65, 0, 0.35, 1);

/** Clamped, eased interpolation. */
export const k = (
  f: number,
  input: number[],
  output: number[],
  easing: (t: number) => number = EASE,
) =>
  interpolate(f, input, output, {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing,
  });

export const img = (name: string) => staticFile(`img/${name}`);
export const tex = (name: string) => staticFile(`tex/${name}`);

export const FONTS = {
  ruqaa: "Aref Ruqaa",
  amiri: "Amiri",
  kufi: "Reem Kufi",
  alexandria: "Alexandria",
  cormorant: "Cormorant Garamond",
};

/** Quadratic arch through two feet and an apex. */
export const archPath = (
  x1: number,
  y1: number,
  tx: number,
  ty: number,
  x2: number,
  y2: number,
) => {
  const cx = 2 * tx - (x1 + x2) / 2;
  const cy = 2 * ty - (y1 + y2) / 2;
  return `M ${x1} ${y1} Q ${cx} ${cy} ${x2} ${y2}`;
};

/** Point on a quadratic arch at parameter t. */
export const archPoint = (
  x1: number,
  y1: number,
  tx: number,
  ty: number,
  x2: number,
  y2: number,
  t: number,
) => {
  const cx = 2 * tx - (x1 + x2) / 2;
  const cy = 2 * ty - (y1 + y2) / 2;
  const u = 1 - t;
  return {
    x: u * u * x1 + 2 * u * t * cx + t * t * x2,
    y: u * u * y1 + 2 * u * t * cy + t * t * y2,
  };
};

// Layout of the real bridge photograph (golden_main.png, 920×918, of which
// the top 500 rows are used) in the final scenes.
export const G = { scale: 1300 / 920, left: -110, top: 250 };
export const gx = (x: number) => G.left + G.scale * x;
export const gy = (y: number) => G.top + G.scale * y;

/** Slow push shared by the paper diorama's last moments and the real bridge. */
export const realityCam = (globalFrame: number) =>
  k(globalFrame, [628, 900], [1, 1.1], Easing.bezier(0.33, 0, 0.45, 1));
export const REALITY_ORIGIN = "540px 760px";
