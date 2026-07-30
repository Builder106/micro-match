import "./index.css";
import { Composition } from "remotion";
import { loadFont as loadPlusJakartaSans } from "@remotion/google-fonts/PlusJakartaSans";
import { loadFont as loadInter } from "@remotion/google-fonts/Inter";
import { MyComposition } from "./Composition";

loadPlusJakartaSans();
loadInter();

export const RemotionRoot: React.FC = () => {
  return (
    <Composition
      id="MicroMatchUiDemo"
      component={MyComposition}
      durationInFrames={1545}
      fps={30}
      width={1920}
      height={1080}
    />
  );
};
