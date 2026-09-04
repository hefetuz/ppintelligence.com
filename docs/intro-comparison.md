# Pretty Penny — three independent intro experiments

The local `main` branch remains at the approved sculptural hero. Three branches start from the same shared stage and each chooses its own opening by default:

| Concept | Branch | Preview |
| --- | --- | --- |
| Yörüngeden Darphaneye | `intro/orbit-mint` | `/?compare=1&intro=orbit` |
| Kesintisiz Dönüşüm | `intro/continuous-morph` | `/?compare=1&intro=morph` |
| Ellerden Doğan Coin | `intro/hands-origin` | `/?compare=1&intro=hands` |

`intro/comparison` integrates the experiments only for side-by-side review through one small selector. Its plain `/` route retains the original opening, without review controls. Removing `compare=1` gives a clean preview of the selected concept. Selection updates the URL and restarts the intro; replay, skip and motion controls remain available.

All concepts share the supplied PP logo, hand silhouettes, sculptural material, local hand-hover spring, verified company copy, CTA and eight-second front/edge/back coin loop. Only the opening choreography differs.

The new openings reuse the existing Canvas renderer and cached artwork. Interface transitions retain the project's motion tokens; reduced-motion users reach a stationary hero immediately, with explicit replay available. Intro rotation integrates a ramped angular velocity, never interpolates angles. Asset failure has a bounded escape path. The Skip control stays inside short viewports.

## Validation

Each experiment passes the independent production build and type check. Automated tests cover the existing coin geometry, motion primitives, finite drawing coordinates and complete final-state handoff at widths 320, 390, 768, 1440 and 2560. These are mathematical/drawing-contract checks, not browser screenshots or visual approval. The comparison is deliberately presented for Efe to judge the feel of all three directions.

The comparison publication uses the same existing owner-private Site and keeps the original concept as the normal landing experience. Experiment branches are retained independently; none has been selected as the new default.
