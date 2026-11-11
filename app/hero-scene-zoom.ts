/** One camera scale for the hero hands, coin and drafting grid. */
export function heroServiceRadius(width: number, height: number) {
  const phone = width <= 760, tablet = width <= 1100;
  return tablet ? Math.min(width * (phone ? .28 : .2), height * (phone ? .15 : .18), 185) : Math.min(width * .14, height * .22, 220);
}
export function heroSceneZoom(progress: number, radius: number, width: number, height: number) {
  const u = Math.max(0, Math.min(1, progress / .3));
  return 1 + (heroServiceRadius(width, height) / Math.max(1, radius) - 1) * u * u * (3 - 2 * u);
}
