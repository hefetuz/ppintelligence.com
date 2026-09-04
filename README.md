# Pretty Penny Intelligence — hero studies

Three editorial art directions built around human insight becoming tangible value.

- **Orbit** — currencies gather along a continuous orbital flow and settle into a minted PP coin.
- **Morph** — one sculptural currency form transforms into the next, then becomes the coin. Recommended opening.
- **Hands** — the engraving flows from two reaching hands to form the coin between them.

Use `/?compare=1&intro=morph` for the three-way selector. Clean presentations use `/?intro=orbit`, `/?intro=morph`, and `/?intro=hands`. Each direction also has its own `intro/*` branch.

## Development

Requires Node 22.13+ and pnpm. Install with `pnpm install --frozen-lockfile`, then run `pnpm dev`.

## Customer presentation

`pnpm build:preview` builds a standalone static presentation to `dist-presentation/`. The Vercel configuration selects this command and output automatically. This client-only presentation has no dependency on Sites authentication. The presentation is marked noindex because it is a design study, not the final website.

The separate `pnpm build` command retains the original Vinext/Cloudflare Sites deployment.

## Motion and accessibility

The same projected coin continues from introduction to its eight-second one-direction loop. Both faces, edge detail, embossed PP mark and moving reflection are rendered separately. Local hand interaction deforms the actual sculpture, with a precise fingertip cursor, no detached hover particles, and a soft return.

Skip, replay, pause, keyboard exploration, primary touch input and reduced-motion are supported. Canvas geometry/interaction tests cover finite rendering, settled state, monotonic spin and bounded deformation. They do not claim measured browser FPS or substitute for visual approval.

Fonts are self-hosted with their licenses. The PP logo and pointer were supplied by the project owner; sculptural hands derive from the supplied reference.
