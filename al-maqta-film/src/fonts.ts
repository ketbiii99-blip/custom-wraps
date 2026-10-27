import { loadFont } from "@remotion/fonts";
import { staticFile } from "remotion";
import { FONTS } from "./lib";

const font = (family: string, file: string, weight: string) =>
  loadFont({ family, url: staticFile(`fonts/${file}`), weight });

export const fontsLoaded = Promise.all([
  font(FONTS.ruqaa, "ArefRuqaa-Regular.ttf", "400"),
  font(FONTS.ruqaa, "ArefRuqaa-Bold.ttf", "700"),
  font(FONTS.amiri, "Amiri-Regular.ttf", "400"),
  font(FONTS.amiri, "Amiri-Bold.ttf", "700"),
  font(FONTS.kufi, "ReemKufi.ttf", "400 700"),
  font(FONTS.alexandria, "Alexandria.ttf", "100 900"),
  font(FONTS.cormorant, "Cormorant.ttf", "300 700"),
]);
