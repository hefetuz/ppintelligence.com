# Pretty Penny — editorial hero

## Direction

An independent strategic adviser, not a trading platform. The visitor should understand the offer, feel the care behind it, and reach a real introductory call. The supplied reaching hands and PP mark remain the signature.

Ink black, paper white, silver currency engraving and a warm penny-colored focal object. Instrument Serif gives the headline an editorial voice; Manrope carries the practical information. One hero, no invented testimonials, metrics or service pages.

## Composition

- A restrained identity and contact row.
- “Make every / penny count.” as the primary message.
- One continuously rotating minted coin between anatomically preserved, currency-textured hands.
- A lower editorial band separates the concrete strategy/risk/technology offer from the booking action.
- The real Calendly destination and founder/company links remain unchanged.

## Motion

The introduction is a short brand sequence, not a fabricated loading percentage.

1. 0–1.0s: six large currency symbols drift in a broad elliptical arrangement.
2. 0.8–2.6s: their silhouettes turn into currency particles and converge into a single coin.
3. 2.5–3.8s: that same coin travels to its resting place; the two hands arrive from the sides.
4. 3.45s: editorial copy and actions reveal with a 40ms stagger, 12px rise and 3px blur over 500ms.

Idle hands use wrist-pivot transforms. The coin rotates every eight seconds; hover adds an 8px lift, 8% scale and a restrained speed increase. Intro skip, replay, pause, touch, keyboard and reduced-motion behavior are preserved. Offscreen/hidden rendering pauses. Font/image failure cannot block access to the page.

## References

- https://github.com/Dammyjay93/interface-design — applied typography hierarchy, intentional proportions, domain-specific tokens, shared spacing and complete interaction states. Its product-UI-specific workflow was not imposed on this marketing hero.
- https://transitions.dev — Texts reveal primitive and its documented stagger/distance/blur/easing values; custom canvas choreography is original implementation.
- https://github.com/Jakubantalik/transitions.dev/blob/main/skills/transitions-dev/18-texts-reveal.md
- Emil design engineering guidance — continuity between states, modest hover response, independent pause/skip and reduced motion.
- UI Skills ASCII animation guidance — source luminance sampling, corrected character cell proportions, seeded particles and cached hand layers.

Fonts are self-hosted with their OFL licenses in public/fonts. No new motion dependency or third-party runtime was introduced.
