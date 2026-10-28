import React from "react";
import { Freeze } from "remotion";
import { S2Archive } from "./scenes/S2Archive";
import { S4Paper } from "./scenes/S4Paper";
import { S5Reality } from "./scenes/S5Reality";

// Clean, text-free key frames of each world, used as start/end frames for
// generated footage.
export const Plate: React.FC<{ scene: "archive" | "paper" | "real"; frame: number }> = ({ scene, frame }) => (
  <Freeze frame={frame}>
    {scene === "archive" ? <S2Archive /> : scene === "paper" ? <S4Paper /> : <S5Reality />}
  </Freeze>
);
