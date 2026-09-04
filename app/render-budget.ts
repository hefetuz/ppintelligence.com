export function renderBudget(width: number, height: number, deviceRatio: number, constrained: boolean) {
  const pixels = constrained ? 1_700_000 : 6_400_000;
  return {
    dpr: Math.min(deviceRatio || 1, constrained ? 1.4 : 2.05, Math.sqrt(pixels / Math.max(1, width * height))),
    meshCells: constrained ? 7 : 12,
    introSamples: constrained ? 80 : 128,
  };
}

export function handLayout(width: number, stageHeight: number, radius: number) {
  const desktop = width >= 761;
  const bleed = desktop ? Math.min(210, Math.max(120, width * .1)) : 72;

  return {
    // Oversize the source artwork on desktop so the hands stay dominant and
    // the long forearms are naturally cropped instead of visually stretched.
    artWidth: desktop ? width * 1.46 : width * 1.58,
    clearance: radius * (desktop ? 1.16 : 1.3),
    bleed,
  };
}
