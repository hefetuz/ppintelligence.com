/* oxlint-disable next/no-img-element -- Authored transparent layers share their native dimensions. */
import { assetUrl } from '../asset-url';

export function FounderArt() {
  return (
    <figure data-ascii="skip" className="founder-art" data-state="static" data-motion="running">
      <div className="founder-art-scene">
        <div className="founder-art-planes">
          <img
            className="founder-scholar"
            src={assetUrl('assets/deniz/layers/scholar-painted-v4.webp')}
            width={1024}
            height={1536}
            alt="An imagined Renaissance painting of Deniz Tudor in profile, writing in a ledger at a lectern."
            loading="lazy"
            decoding="async"
          />
          <img
            className="founder-cloud-foreground"
            src={assetUrl('assets/deniz/layers/clouds.webp')}
            width={1024}
            height={1536}
            alt=""
            aria-hidden="true"
            loading="lazy"
            decoding="async"
          />
        </div>
      </div>
    </figure>
  );
}
