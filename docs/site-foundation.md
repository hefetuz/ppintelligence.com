# Pretty Penny Intelligence — Orbit website foundation

## Selected direction

Orbit is the default opening. The comparison view and both other studies remain accessible through their existing query parameters. The supplied hand cursor, sculpture and continuous coin rotation are retained. An introductory sequence runs once per browser tab session; Replay remains available. Reduced-motion preferences skip it.

## Pages

| Route | Purpose |
| --- | --- |
| `/` | Orbit hero, business perspective, three connected expertise areas, founder introduction and booking |
| `/expertise/` | Strategy and growth, risk and economic analysis, technology and efficiency; consulting, speaking/workshops, training and expert-witness formats |
| `/about/` | Founder, connected expertise and the meaning behind Pretty Penny |
| `/contact/` | Existing introductory-call booking and preparation prompts |

Copy is proposed editorial content derived from `pretty-penny-research.md`, not approved quotations. No client results, testimonials or case studies have been invented. Founder biography and final service wording should be reviewed by Deniz before adding more detailed claims. An Insights section can follow once real articles are available.

## Architecture

`app/site/content.ts` owns navigation, metadata, contact destinations and expertise data. `shared.tsx` owns the common header, accessible mobile menu, footer and calls to action. `home-sections.tsx` and `pages.tsx` compose the page content. The original animation renderer stays isolated and loads separately from the page shell.

Both the Vinext routes and the static presentation reuse these components. `build:preview` builds the client bundle and then renders every route to complete HTML using `scripts/prerender.mjs`. Each route has its own document title and description, works on a direct visit or refresh, and exposes its content before JavaScript loads. Vercel serves the generated files without a runtime server or catch-all rewrite. Unknown routes use the generated 404 page.

The mobile menu uses the installed Base UI dialog primitive for keyboard navigation, focus management and Escape dismissal. The wider site introduces no animation library, CMS, tracking or new dependencies. All visitor-facing booking links lead to the existing Calendly event. There is no unconnected form.

## Visual system

Instrument Serif for editorial headings; Manrope for navigation and body copy. Near-black, alabaster, silver and warm penny tones extend the approved hero. Hairline dividers and restrained numbered labels organise long pages. The orbital diagram connects the three expertise areas around business value; it is static and has a text alternative. Hover movement is short, supports fine pointers only and respects reduced-motion preferences.
