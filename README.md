# Pretty Penny website source

Production website: https://prettypennyintelligence.com/
Content editor: https://prettypenny-content.sanity.studio/

## Publishing content

The editor has Writing, Speaking and Podcasts. Drafts stay in Sanity. Use Publish when a record is ready, or Unpublish to remove it from the website. A GitHub Actions schedule checks the published CMS revisions every five minutes. When content changes, it builds and deploys the website. GitHub can delay scheduled jobs, so publishing is not instantaneous.

The revision check skips installation and deployment when nothing has changed. Failed CMS reads or invalid published data stop the workflow and keep the last successful website online. No GitHub access token is shared with Sanity. The public production dataset is queried with the published perspective, excluding draft and release-version records.

## Source and configuration

This source artifact contains approved public defaults and selected runtime assets. It excludes private notes, drafts, import seeds, local settings and credentials. Editorial content comes from Sanity and has no local fallback after unpublishing.

Use Node 22.13+ and pnpm 10. Run `pnpm install --frozen-lockfile`, then `pnpm run build:preview` with `CONTENT_MODE=sanity`, `SANITY_PROJECT_ID=p95297ni`, `SANITY_DATASET=production`, `SITE_ORIGIN=https://prettypennyintelligence.com`, `SITE_ENV=production`, and `ENABLE_INDEXING=true`.

The default branch is site-source. GitHub Pages uses the Publish website content workflow. Repository variables configure SANITY_PROJECT_ID, SANITY_DATASET and CMS_DEPLOY_ENABLED. The latter gates deployment until a source validation build has passed. Domain and HTTPS configuration are retained.
