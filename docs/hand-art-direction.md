# Hand art direction — second exploration

The three intro branches now have different steady-state hand materials and interactions, not a shared hover with changed intensity. The plain original concept retains the supplied first hand artwork and original hover path.

| Concept | Material | Pointer response |
| --- | --- | --- |
| Orbit | Cool satin silver, restrained currency engraving | Silver fragments and warm currency grains lift into a bounded, depth-layered orbit. The touched hand rises; a spring carries each grain home. |
| Morph | High-contrast platinum, very fine engraving | The actual hand texture bends in a broad soft-edged lens. A moving studio reflection travels across its planes. No particulate dissolution. |
| Hands | Warm alabaster, more legible currency engraving | Currency lifts in directional bands toward the fingertips, leaving fine curved threads. The touched hand reaches inward and releases softly. |

## Common craft

- New sculptural source: `public/hands-sculpture-v2.png`, generated with the built-in image tool from the original pose reference. The original `public/hands.png` remains unchanged. Exact prompt: `docs/hand-asset-prompt.md`.
- All three keep the same coin, intro choreography, real front/edge/back rotation, company content and CTA.
- The input field activates only within 22 CSS pixels of actual sampled hand material, not throughout a rectangular canvas.
- Field radii adapt to width and are bounded. Surface warping reaches zero at its edge. Particle displacement is bounded and physical spring integration uses substeps.
- Art surfaces and glyph atlas are cached. Local patch canvases are bounded to the interaction area. Inactive particles do not run spring steps.
- Reduced motion starts on the finished stationary sculpture. Pause freezes response; release restores the original material. Only the primary touch pointer drives the interaction.
- Keyboard arrows move the light from the hand area; Escape releases it. Visual copy explains that the hands can be explored.
- `?compare=1&intro=hands&scene=1` opens directly on the interactive sculpture and keeps variant selection in scene-only mode. The existing Replay action still plays the complete intro. Reduced-motion first paint presents the PP face rather than an edge-on coin.

Automated verification covers finite coordinates, bounded displacement, luminance ordering, smooth retargeting, 30/60/120Hz spring recovery, silhouette activation, independently responding hands, pause, reduced motion, and the existing three intro/coin contracts. These checks do not assert measured browser FPS or visual approval.
