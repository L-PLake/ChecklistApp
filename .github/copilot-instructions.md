# Project Guidelines

## Architecture

- Keep this a dependency-light static PWA. `index.html` owns the UI, `checklist-data.mjs` owns shared data validation and snapshot encoding, and `firebase-share.js` owns Firebase access.
- Keep changes focused; extract another module when it creates a clear boundary or makes behavior easier to test.
- Preserve local-first behavior and offline use. When adding an asset required offline, add it to the service worker precache list and update its cache version.

## Data and security

- Treat local storage, imported backups, snapshot URLs, and Firebase records as untrusted input. Normalize and validate before use; render user content with `textContent`, not HTML injection.
- Keep Firebase client validation aligned with `database.rules.json`. Client checks improve feedback but never replace server-side rules.
- Treat live-share URLs as public bearer links that allow editing. Do not add secrets or imply owner-only access without changing the authentication and rules model.
- Do not commit credentials, tokens, or private user data.

## Accessibility and UI

- Prefer semantic HTML and native controls. Give controls accessible names, retain visible keyboard focus, preserve focus after rerendering, and announce concise status changes.
- Check color contrast and keyboard-only interaction when changing styles or interactions. Respect reduced-motion preferences if adding animation.

## Tests and documentation

- Run `node --test tests/*.test.mjs` for data, import, or sharing changes; add focused regression tests for behavior changes.
- Update the README when user-visible limits, offline behavior, sharing permissions, or backup behavior changes.
- Keep deployment workflow permissions minimal and pin GitHub Actions to commit SHAs.
