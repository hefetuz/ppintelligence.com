export function renderBudget(width: number, height: number, deviceRatio: number, constrained: boolean) {
  const pixels = constrained ? 1_150_000 : 2_200_000;
  return {
    dpr: Math.min(deviceRatio || 1, constrained ? 1.25 : 1.6, Math.sqrt(pixels / Math.max(1, width * height))),
    meshCells: constrained ? 6 : 9,
    introSamples: constrained ? 65 : 100,
  };
}

export function handLayout(width: number, stageHeight: number, radius: number) {
  const desktop = width >= 761;
  return {
    // Keep the hands visually dominant on wide screens. The artwork is deliberately
    // larger than the viewport so excess forearm length is cropped by the hero.
    artWidth: desktop
      ? Math.min(width * 1.34, Math.max(stageHeight, 260) * 4.15)
      : width * 1.58,
    clearance: radius * 1.34,
    bleed: desktop ? 120 : 72,
  };
}
