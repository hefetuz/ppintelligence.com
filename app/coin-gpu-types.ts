import type { CoinTextures } from './coin-renderer';

export type CoinPose = {
  yaw: number;
  tilt: number;
  /** Radius in CSS pixels, relative to the renderer's square CSS size. */
  radius: number;
  light: number;
  /** 1 uses the canonical camera; 0 projects orthographically. */
  perspective?: number;
  /** Geometric blueprint opacity for the minted GLB renderer. */
  wireframe?: number;
};

export type CoinMaps = {
  front: CoinTextures['face'];
  back: CoinTextures['reverse'];
  frontAlbedo: HTMLCanvasElement;
  backAlbedo: HTMLCanvasElement;
  frontNormal: HTMLCanvasElement;
  backNormal: HTMLCanvasElement;
  frontRoughness: HTMLCanvasElement;
  backRoughness: HTMLCanvasElement;
};

export type CoinRenderer = {
  canvas: HTMLCanvasElement;
  label: string;
  resize(size: number, dpr: number): void;
  /** Copy canvas immediately after draw when preserveDrawingBuffer is false. */
  draw(pose: CoinPose): void;
  destroy(): void;
  setProfiling(enabled: boolean): void;
  diagnostics(): Record<string, string | number | boolean> & {
    contextLost: boolean;
  };
};

export type CoinGpuOptions = {
  preserveDrawingBuffer?: boolean;
  /** The owner should replace this renderer with its fallback on context loss. */
  onContextLost?: () => void;
};
