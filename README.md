# Pretty Penny website source

This source artifact builds the current public website from Sanity. It contains approved public snapshots for offline verification and selected runtime assets. It excludes Studio, private source notes, drafts and import seeds.

Use Node 22.13+ and pnpm 10. Install with `pnpm install --frozen-lockfile`. Set `CONTENT_MODE=sanity`, `SANITY_PROJECT_ID=p95297ni`, `SANITY_DATASET=production` and run `pnpm run build:preview`. The build queries published CMS documents and fails if the connection or content is invalid. An unpublished record has no local editorial fallback. Never commit a Sanity read token; use a GitHub Actions secret for private datasets.

The included GitHub Pages workflow uses repository variables SANITY_PROJECT_ID and SANITY_DATASET, with an optional SANITY_READ_TOKEN secret. Configure the repository Pages source as GitHub Actions. Publish events need an authenticated server-side dispatch bridge or a scheduled build; no secret belongs in Studio/browser code.

Studio: https://prettypenny-content.sanity.studio/
