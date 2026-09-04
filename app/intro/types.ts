export type IntroId = 'original' | 'orbit' | 'morph' | 'hands';
export type Point = { x: number; y: number };
export type HandSource = Point & { symbol: number; seed: number; tone: number };
export type IntroEnvironment = {
  width: number;
  height: number;
  sceneY: number;
  radius: number;
  sprite: HTMLCanvasElement;
  handSources: [HandSource[], HandSource[]];
  fingertips: [Point, Point];
};
export type IntroFrame = {
  coinY: number;
  coinRadius: number;
  coinAlpha: number;
  mint: number;
  angle: number;
  hands: number;
  handLight: number;
  transfer: number;
};
export type IntroRenderer = {
  frame: (time: number, env: IntroEnvironment) => IntroFrame;
  draw: (ctx: CanvasRenderingContext2D, time: number, env: IntroEnvironment, frame: IntroFrame) => void;
};
export type IntroDefinition = {
  id: Exclude<IntroId, 'original'>;
  title: string;
  shortTitle: string;
  caption: string;
  description: string;
  branch: string;
  duration: number;
  releaseAt: number;
  create: () => IntroRenderer;
};
