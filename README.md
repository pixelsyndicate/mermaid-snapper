# Mermaid Diagram Screenshot Helper

Static browser app for rendering Mermaid source into a clean preview that can be copied, downloaded, screenshotted, and pasted into documentation systems such as Confluence.

The app has no Express.js runtime. It is plain HTML, CSS, and JavaScript under `docs/`, with Node.js used only for dependency management, tests, and refreshing vendored assets.

## Prerequisites

- Node.js 18 or newer
- npm

## Setup

```powershell
npm install
```

## Run Locally

Open `docs/index.html` in a browser.

The app references static assets with relative paths so it can run from the file system, a static web host, or a future GitHub Pages project site.

## Refresh Vendored Mermaid

Mermaid is installed through npm and copied into `docs/vendor/mermaid/mermaid.min.js` for static hosting.

```powershell
npm run prepare:pages
```

Run this after changing the Mermaid package version.

## Test

This project follows a red-green-refactor TDD workflow for migrations and future enhancements:

1. Add or update a focused Jest test for the intended behavior.
2. Run the test and confirm it fails for the expected reason.
3. Implement the smallest useful change that makes it pass.
4. Refactor while keeping the suite green.

Run the suite:

```powershell
npm test
```

Watch mode:

```powershell
npm run test:watch
```

## Static Hosting Notes

- `docs/index.html` is the site entrypoint.
- `docs/.nojekyll` disables Jekyll processing for branch-based GitHub Pages publishing.
- Mermaid rendering, SVG copy/download, PNG export, settings, and samples all run in the browser.
- There is no server-side persistence, database, health endpoint, or server-side PNG export.

If this is later migrated to a public GitHub repository, GitHub Pages can publish from the `main` branch and `/docs` folder, or from a GitHub Actions artifact built from this same static tree.

## Manual Verification

After changes that affect the browser workflow, verify:

- `docs/index.html` loads the app.
- The default sample renders.
- Fenced and unfenced Mermaid source render.
- Theme changes re-render the diagram.
- SVG copy/download works.
- PNG download works where browser security allows.
- Settings survive refresh through localStorage.

## Current Limitation

PNG export is intentionally browser-based. Server-side image rendering would require a separate hosted runtime and is out of scope for this static version.
