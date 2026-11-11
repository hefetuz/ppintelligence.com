/** Fade the image backdrop beneath the continuous coin compositor. */
export function warmHeroStage(progress) {
  const p = Math.max(0, Number(progress) || 0);
  const fade = Math.max(0, Math.min(1, (p - 0.18) / 0.18));
  const opacity = 1 - fade * fade * (3 - 2 * fade);
  return {
    opacity,
    warm: p < 0.36,
    prepareChapters: p >= 0.12,
    chapters: p >= 0.36,
  };
}
