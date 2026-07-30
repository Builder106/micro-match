import "./index.css";
import { Composition } from "remotion";
import { loadFont as loadPlusJakartaSans } from "@remotion/google-fonts/PlusJakartaSans";
import { loadFont as loadInter } from "@remotion/google-fonts/Inter";
import { Trailer, TRAILER_DURATION } from "./Composition";

loadPlusJakartaSans();
loadInter();

export const RemotionRoot: React.FC = () => {
  return (
    <Composition
      id="MicroMatchTrailer"
      component={Trailer}
      durationInFrames={TRAILER_DURATION}
      fps={30}
      width={1920}
      height={1080}
    />
  );
};
