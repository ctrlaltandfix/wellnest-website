# Production source

`wrangler.jsonc` deploys `cloudflare/worker.js`. That file now includes the
self-contained production Worker recovered from Cloudflare on 12 November 2026,
including calendar OAuth, subscriptions, quick-add/download pages, account
analytics and discoverability response transforms. It contains no secret values;
credentials remain in Cloudflare bindings.

The other modules retain the earlier modular implementation and are used by
existing unit tests. They are not imported by this self-contained entry point.
Changes to those modules alone will not update production. Edit and test
`worker.js` until a separate refactor restores modular imports with parity tests.

Run `node --test tests/*.test.mjs` and `node tools/build-cloudflare.mjs` before
publishing. GitHub Actions runs both on pull requests and main pushes. Deployment
continues through the existing Cloudflare configuration; this workflow does not
introduce an additional production deployment trigger. Configure the Verify
WellNest check as required in GitHub branch rules if merge enforcement is wanted.

Avoid direct dashboard code edits. If an emergency edit is necessary, reconcile
it into the repository before the next repository deployment. Preserve Cloudflare
secrets, bindings and assets; never commit access tokens or production data.
