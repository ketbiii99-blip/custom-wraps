import React from "react";
import { Audio } from "@remotion/media";
import { AbsoluteFill, Sequence, staticFile } from "remotion";
import { T } from "./lib";
import { S1Parchment } from "./scenes/S1Parchment";
import { S2Archive } from "./scenes/S2Archive";
import { S3Blueprint } from "./scenes/S3Blueprint";
import { S4Paper } from "./scenes/S4Paper";
import { S5Reality } from "./scenes/S5Reality";

// Layer order follows how each world hands over to the next: the parchment
// peels off the photograph, the blueprint draws over the photograph and folds
// away from the paper diorama, and reality spreads over the diorama.
export const Film: React.FC = () => {
  return (
    <AbsoluteFill style={{ background: "#000" }}>
      <Sequence name="02 Archival Memories" from={T.s2.from} durationInFrames={T.s2.dur}>
        <S2Archive />
      </Sequence>
      <Sequence name="01 The First Page" from={T.s1.from} durationInFrames={T.s1.dur}>
        <S1Parchment />
      </Sequence>
      <Sequence name="04 Paper Bridge" from={T.s4.from} durationInFrames={T.s4.dur}>
        <S4Paper />
      </Sequence>
      <Sequence name="03 The Bridge Is Born" from={T.s3.from} durationInFrames={T.s3.dur}>
        <S3Blueprint />
      </Sequence>
      <Sequence name="05-06 The Bridge Today + Signature" from={T.s5.from} durationInFrames={T.s5.dur}>
        <S5Reality />
      </Sequence>
      {/* score and sound design: scripts/score.py */}
      <Audio src={staticFile("score.wav")} />
    </AbsoluteFill>
  );
};
