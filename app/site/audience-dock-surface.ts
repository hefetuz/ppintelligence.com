export type DockSurfaceBox = {
  x: number;
  y: number;
  width: number;
  height: number;
};

/** A fixed-size viewport surface is composited into the measured blue inset. */
export function audienceDockSurface(
  width: number,
  height: number,
  target: DockSurfaceBox,
  progress: number,
) {
  const p = Number.isFinite(progress) ? Math.min(1, Math.max(0, progress)) : 0;
  const stageWidth = Math.max(1, Number.isFinite(width) ? width : 1);
  const stageHeight = Math.max(1, Number.isFinite(height) ? height : 1);
  const targetWidth = Math.max(
    0,
    Number.isFinite(target.width) ? target.width : 0,
  );
  const targetHeight = Math.max(
    0,
    Number.isFinite(target.height) ? target.height : 0,
  );
  const scaleX = 1 + (targetWidth / stageWidth - 1) * p;
  const scaleY = 1 + (targetHeight / stageHeight - 1) * p;
  const x = (Number.isFinite(target.x) ? target.x : 0) * p;
  const y = (Number.isFinite(target.y) ? target.y : 0) * p;
  return {
    x,
    y,
    width: stageWidth * scaleX,
    height: stageHeight * scaleY,
    transform: `matrix(${scaleX.toFixed(6)}, 0, 0, ${scaleY.toFixed(6)}, ${x.toFixed(3)}, ${y.toFixed(3)})`,
  };
}
