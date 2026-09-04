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
  const bleed = desktop ? Math.min(330, Math.max(180, width * .16)) : 72;

  return {
    // On desktop the artwork follows viewport width instead of the shallow stage
    // height. This keeps the hands large and lets the hero crop the forearms
    // naturally instead of stretching a narrow source strip to the screen edge.
    artWidth: desktop ? width * 1.2 : width * 1.58,
    clearance: radius * (desktop ? 1.18 : 1.3),
    bleed,
  };
}
