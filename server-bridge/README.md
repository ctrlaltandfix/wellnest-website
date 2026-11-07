# Run the WellNest dashboard on GitHub Pages

The GitHub copy (https://ctrlaltandfix.github.io/wellnest-website/) is ready to run sign-in and the
dashboard itself. It still needs the WellNest server for accounts and health data, and that server
has to allow requests from github.io. This folder holds the one file that allows them.

Until the file is deployed, the GitHub copy opens wellnest.services for Sign in and the dashboard
(which is what it does today). Once it's live, the GitHub copy picks it up automatically.

## Steps

1. Copy `netlify/edge-functions/github-pages-bridge.ts` into the project that deploys
   **wellnest.services** to Netlify (the `wellnest-web` repo), at the same path.
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

- **Google sign-in** may finish on wellnest.services instead of github.io, because Netlify Identity
  returns users to the site's own address. Email and password sign-in stays on github.io.
- **Connecting Google Calendar** completes on wellnest.services, where Google sends the user back.
