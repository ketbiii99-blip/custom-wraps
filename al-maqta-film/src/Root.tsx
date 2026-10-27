import { Composition } from "remotion";
import { Film } from "./Film";
import { DURATION, FPS, H, W } from "./lib";
import "./fonts";

export const RemotionRoot: React.FC = () => {
  return (
    <Composition
      id="AlMaqta"
      component={Film}
      durationInFrames={DURATION}
      fps={FPS}
      width={W}
      height={H}
    />
  );
};
