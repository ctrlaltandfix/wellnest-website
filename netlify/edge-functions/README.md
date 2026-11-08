# Run the WellNest dashboard on GitHub Pages

The GitHub copy (https://ctrlaltandfix.github.io/wellnest-website/) is ready to run sign-in and the
dashboard itself. It still needs the WellNest server for accounts and health data, and that server
has to allow requests from github.io. `github-pages-bridge.ts` in this folder is the one file that allows them.

Until the file is deployed, the GitHub copy opens wellnest.services for Sign in and the dashboard
(which is what it does today). Once it's live, the GitHub copy picks it up automatically.

## Steps

1. Copy `github-pages-bridge.ts` (in this folder) into the project that deploys
   **wellnest.services** to Netlify (the `wellnest-web` repo), at the same path:
   `netlify/edge-functions/github-pages-bridge.ts`.
2. In that project's `netlify.toml`, add this **above any other `[[edge_functions]]` entries**,
   so it runs first:

   ```toml
   [[edge_functions]]
   path = "/api/*"
   function = "github-pages-bridge"
   ```
3. Deploy, open https://ctrlaltandfix.github.io/wellnest-website/ in a new tab and click **Sign in**.
   You should stay on github.io, and after signing in you land on the github.io dashboard.

Don't deploy the `wellnest-website` GitHub repo itself to Netlify: the export it came from is
missing the edge functions that serve most of `/api`.

## What it allows

- Only `https://ctrlaltandfix.github.io` gets cross-site access. Every other request to `/api/*`
  passes through unchanged.
- The GitHub copy sends the login token as an `Authorization` header (no cookies cross sites).
  The bridge hands it to your existing functions as the usual `nf_jwt` cookie, so `getUser()`
  still verifies every request exactly as before.
- Netlify Identity is reached through `/api/_identity/*`, which the bridge forwards to
  `/.netlify/identity/*` on the same site.

## Known limits

- **Google sign-in** returns to wellnest.services first (Netlify Identity always does), then
  `github-pages-google-return.ts` hands the person and their sign-in straight back to github.io.
  It only runs on `/`, `/login` and `/dashboard`, and only acts when the bridge marked the sign-in
  as started from GitHub Pages; everyone else gets the normal site.
- **Connecting Google Calendar** completes on wellnest.services, where Google sends the user back.
