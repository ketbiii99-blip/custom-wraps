import { Composition } from "remotion";
import { Film } from "./Film";
import { Plate } from "./Plates";
import { DURATION, FPS, H, W } from "./lib";
import "./fonts";

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="AlMaqta"
        component={Film}
        durationInFrames={DURATION}
        fps={FPS}
        width={W}
        height={H}
      />
      <Composition
        id="Plate"
        component={Plate}
        durationInFrames={DURATION}
        fps={FPS}
        width={W}
        height={H}
        defaultProps={{ scene: "real" as const, frame: 120 }}
      />
    </>
  );
};
