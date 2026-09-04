export function renderBudget(width: number, height: number, deviceRatio: number, constrained: boolean) {
  const pixels = constrained ? 1_150_000 : 2_200_000;
  return {
    dpr: Math.min(deviceRatio || 1, constrained ? 1.25 : 1.6, Math.sqrt(pixels / Math.max(1, width * height))),
    meshCells: constrained ? 6 : 9,
    introSamples: constrained ? 65 : 100,
  };
}

export function handLayout(width: number, stageHeight: number, radius: number) {
  // Fit anatomy vertically. Only the far forearms extend to the viewport edge.
  return {
    artWidth: Math.min(width < 760 ? width * 1.55 : width * 1.06, Math.max(180, stageHeight - 30) * 2.65),
    clearance: radius * 1.24,
    bleed: 72,
  };
}
