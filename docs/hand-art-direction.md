# Hand art direction — fingertip material study

The three intro branches now have different steady-state hand materials and interactions, not a shared hover with changed intensity. The plain original concept retains the supplied first hand artwork and original hover path.

| Concept | Material | Pointer response |
| --- | --- | --- |
| Orbit | Cool satin silver, restrained currency engraving | A small torsional tide bends the actual material under the fingertip. No fragments leave the surface. |
| Morph | High-contrast platinum, very fine engraving | A continuous two-dimensional liquid mesh refracts the anatomy and subtly follows the gesture. A studio reflection remains clipped to the material. |
| Hands | Warm alabaster, more legible currency engraving | Gentle inward pressure leaves a breathing impression beneath the fingertip, returning smoothly on release. |

## Common craft

- New sculptural source: `public/hands-sculpture-v2.png`, generated with the built-in image tool from the original pose reference. The original `public/hands.png` remains unchanged. Exact prompt: `docs/hand-asset-prompt.md`.
- All three keep the same coin, real front/edge/back rotation, company content and CTA. Their entrance choreography has refined projected landings and eased absorption.
- The supplied transparent cursor is displayed at 34px wide. Its 13.3px/1px fingertip hotspot matches the texture deformation centre exactly; no lag is added to the cursor.
- The input field activates only within 20 CSS pixels of sampled hand material. Empty space does not react. Hit-testing is skipped when inactive.
- Field radii adapt to width. A bounded 12×12 mesh warps both texture axes; displacement reaches zero at the boundary. Each patch replaces the original area without crossfading a duplicate hand.
- Art surfaces and glyph atlas are cached. Local patch canvases are bounded to the interaction area. Drag response uses elapsed time, not pixels per frame.
- Reduced motion starts on the finished stationary sculpture. Pause freezes response; release restores the original material. Only the primary touch pointer drives the interaction.
- Keyboard arrows move the light from the hand area; Escape releases it. Visual copy explains that the hands can be explored.
- Old `scene=1` links now play the introduction. Skip, replay and reduced-motion remain explicit controls.
- Rendering follows every animation frame. The fallback timer is cleared after completion so it cannot rewind the spin at 8.5 seconds; the visible clock resets on background-tab changes.

Automated verification covers finite coordinates, bounded displacement, luminance ordering, smooth retargeting, 30/60/120Hz spring recovery, silhouette activation, independently responding hands, pause, reduced motion, and the existing three intro/coin contracts. These checks do not assert measured browser FPS or visual approval.
