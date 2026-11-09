import { Composition } from "remotion";
import { Showcase } from "./Showcase";
import { Swarm } from "./swarm/Swarm";
import { Receipt, RECEIPT_LEN } from "./receipt/Receipt";
import { Cups } from "./cups/Cups";
import { Street, STREET_LEN } from "./street/Street";
import { Cafe, CAFE_LEN } from "./cafe/Cafe";
import { Market } from "./market/Market";
import { Salon, SALON_LEN } from "./salon/Salon";
import { Town, TOWN_LEN } from "./town/Town";
import { Tutorial, TUTORIAL_LEN } from "./tutorial/Tutorial";
import { EndCards } from "./endcards/EndCards";
import { EndPreview } from "./endcards/EndPreview";

export const RemotionRoot = () => (
  <>
  <Composition
    id="Showcase"
    component={Showcase}
    durationInFrames={600}
    fps={30}
    width={1080}
    height={1920}
  />
  <Composition id="Swarm" component={Swarm} durationInFrames={600} fps={30} width={1080} height={1920} />
  <Composition id="Receipt" component={Receipt} durationInFrames={RECEIPT_LEN} fps={30} width={1080} height={1920} />
  <Composition id="Cups" component={Cups} durationInFrames={840} fps={30} width={1080} height={1920} />
  <Composition id="Street" component={Street} durationInFrames={STREET_LEN} fps={30} width={1080} height={1920} />
  <Composition id="Cafe" component={Cafe} durationInFrames={CAFE_LEN} fps={30} width={1080} height={1920} />
  <Composition id="Market" component={Market} durationInFrames={840} fps={30} width={1080} height={1920} />
  <Composition id="Salon" component={Salon} durationInFrames={SALON_LEN} fps={30} width={1080} height={1920} />
  <Composition id="Town" component={Town} durationInFrames={TOWN_LEN} fps={30} width={1080} height={1920} />
  <Composition id="Tutorial" component={Tutorial} durationInFrames={TUTORIAL_LEN} fps={30} width={1080} height={1920} />
  <Composition id="EndCards" component={EndCards} durationInFrames={1} fps={30} width={1080} height={1920} defaultProps={{ variant: 1 }} />
  <Composition id="EndPreview" component={EndPreview} durationInFrames={120} fps={30} width={1080} height={1920} />
  </>
);
