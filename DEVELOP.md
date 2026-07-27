# Development Notes

Last updated: 2026-07-27

## Responsibility

This repository contains the legacy/static splash presentation and its media
assets. It is independent from the Vite landing site in `website` and does not
contain Aleo transaction logic.

## Implementation

- Plain `index.html` and `styles.css`.
- Static image and video assets.
- `.nojekyll` keeps GitHub Pages from applying Jekyll processing.
- Repository-path-safe static hosting at `/splash/`.

## Validation

Open `index.html` through a local static HTTP server and check that the image,
video, styles, and navigation resolve beneath the repository path.

All real `.env*` files are ignored. Sanitized `*.example` templates may be
tracked if configuration is ever introduced.
