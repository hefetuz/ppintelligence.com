# Responsive rendering and delivery

## Wide/short screens

The original shared artwork width was capped by stage height, exposing both outer image cuts on wide screens. The revised layout fits the hand anatomy vertically, preserves the inner 68% of each hand at uniform scale, and extends only the outer forearm segment past the viewport by 72px. The idle wrist rotation cannot reveal the outer source edge. Short desktop viewports use more compact type and spacing; narrow screens retain a scrollable stacked layout.

## Rendering cost

- Coin face: one continuous affine texture plane, replacing 64 separately clipped fan triangles. This removes radial clip/sampling seams; the edge and face selection retain signed 3D rotation. Face perspective is locally approximated rather than subdivided.
- Canvas backing-store budget: at most 2.2 million pixels normally, 1.15 million for low-memory, low-core or save-data devices. Text remains native DOM text at screen resolution.
- Local hover mesh: 9×9 normally, 6×6 on constrained devices, instead of 12×12 everywhere.
- Engraving and warm light are baked into per-hand textures. No full-screen reflection canvas is recomposited every frame.
- Pointer hit-testing uses one inverse transform per hand, an initial bounds check and early exit. No per-grain world transform is needed.
- Source luminance is read once. Resize work is debounced. Hidden/offscreen and reduced-motion behavior are retained.
- Tailwind scans only the actual hero and button components; unused component-library utilities no longer enter this page's CSS.

## Verification

Automated checks cover pixel caps at phone, tablet, 1366×768, 1920×1080, 2560×1440 and 4K dimensions, positive full-bleed source partitions, all three intro contracts, bounded interactions and continuous spin. Build sizes are measured from production output. These are not claims of measured FPS or visual approval on every physical device.

The Vercel project uses the static presentation build from `main`, with root-relative assets. The separate Sites build and existing Pages preview are retained.
