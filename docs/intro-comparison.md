# Pretty Penny — three independent intro experiments

The local `main` branch remains at the approved sculptural hero. Three branches start from the same shared stage and each chooses its own opening by default:

| Concept | Branch | Preview |
| --- | --- | --- |
| Yörüngeden Darphaneye | `intro/orbit-mint` | `/?compare=1&intro=orbit` |
| Kesintisiz Dönüşüm | `intro/continuous-morph` | `/?compare=1&intro=morph` |
| Ellerden Doğan Coin | `intro/hands-origin` | `/?compare=1&intro=hands` |

`intro/comparison` integrates the experiments only for side-by-side review through one small selector. Its plain `/` route retains the original opening, without review controls. Removing `compare=1` gives a clean preview of the selected concept. Selection updates the URL and restarts the intro; replay, skip and motion controls remain available.

All concepts share the supplied PP logo, reaching-hand pose, verified company copy, CTA and eight-second front/edge/back coin loop. The second exploration adds a newly rendered sculpture and three distinct materials/hover responses: orbital silver, liquid platinum and living engraving. Details and checks are in `hand-art-direction.md`. The original concept retains the original supplied image and local hover.

The new openings reuse the existing Canvas renderer and cached artwork. Interface transitions retain the project's motion tokens; reduced-motion users reach a stationary hero immediately, with explicit replay available. Intro rotation integrates a ramped angular velocity, never interpolates angles. Asset failure has a bounded escape path. The Skip control stays inside short viewports.

## Validation

Each experiment passes the independent production build and type check. Automated tests cover the existing coin geometry, motion primitives, finite drawing coordinates and complete final-state handoff at widths 320, 390, 768, 1440 and 2560. These are mathematical/drawing-contract checks, not browser screenshots or visual approval. The comparison is deliberately presented for Efe to judge the feel of all three directions.

The comparison remains a local preview because advancing the publication repository's main branch has not been approved. Experiment branches are retained independently and saved remotely; none has been selected as the new default. Use `/?compare=1&intro=hands&scene=1` to compare hand responses directly, or omit `scene=1` to compare intros.
