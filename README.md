# Mermaid Snapper

test, preview and capture mermaid.js diagrams

Static browser app for rendering Mermaid source into a clean preview that can be copied, downloaded, screenshotted, and pasted into documentation systems.

Current app version: `0.2.2`

Open the hosted app: <https://pixelsyndicate.github.io/mermaid-snapper/>

See [CHANGELOG.md](CHANGELOG.md) for user-facing release notes.

The app is plain HTML, CSS, and JavaScript under `docs/`, with Node.js used only for dependency management, tests, and refreshing vendored assets.

## Current Features

- Render fenced or unfenced Mermaid source in the browser.
- Choose from bundled Mermaid sample diagrams.
- Switch Mermaid themes and looks.
- Adjust display width, scale, and background.
- Copy or download rendered SVG output.
- Download PNG output for diagrams that browser canvas security allows.
- Persist recent source and settings in localStorage.

## Mouse And Preview Controls

- Drag inside the rendered preview to pan around large or zoomed diagrams.
- Hold `Ctrl` and use the mouse wheel over the preview to adjust Scale in 5% steps.
- Use the Width and Scale `-` / `+` buttons for precise step changes without typing.
- Drag the splitter between the editor and preview to resize the workspace. In stacked tablet layouts, drag the splitter upward to give the preview more room.

## Prerequisites

- Node.js 18 or newer
- npm

## Setup

```powershell
npm install
```

## Run Locally

Open `docs/index.html` in a browser.

The app references static assets with relative paths so it can run from the file system or a static web host.

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

The Jest suite currently checks:

- Static hosting requirements, including relative asset paths, `docs/.nojekyll`, the vendored Mermaid bundle, and absence of old internal/server markers.
- Dependency drift between the installed Mermaid package, the vendored `docs/vendor/mermaid/mermaid.min.js` asset, and the version displayed in the app header.
- Client utilities used by the browser app, including fenced-code cleanup, PNG export source preparation, SVG download blob metadata, and shared download constants.
- PNG export preparation for every bundled sample, ensuring HTML labels are converted before rasterization.
- Mermaid parser validation for every bundled sample in `docs/javascripts/samples.js`.

The Mermaid parser tests run in Jest with `jsdom` and Node's experimental VM modules enabled by the npm scripts. Browser-only behaviors such as the actual clipboard write, native file download prompt, and canvas security result for PNG export should still be verified manually after UI changes.

## Static Hosting Notes

- GitHub Pages is configured to publish from the `main` branch and `/docs` folder.
- The public project site is <https://pixelsyndicate.github.io/mermaid-snapper/>.
- `docs/index.html` is the site entrypoint.
- `docs/.nojekyll` disables Jekyll processing for branch-based GitHub Pages publishing.
- Mermaid rendering, SVG copy/download, PNG export, settings, and samples all run in the browser.
- There is no server-side persistence, database, health endpoint, or server-side PNG export.

## Manual Verification

After changes that affect the browser workflow, verify:

- `docs/index.html` loads the app.
- The default sample renders.
- Fenced and unfenced Mermaid source render.
- Theme changes re-render the diagram.
- SVG copy/download works.
- PNG download works where browser security allows.
- Settings survive refresh through localStorage.

## Known Defects And Limitations

- PNG export can fail with `Failed to execute 'toDataURL' on 'HTMLCanvasElement': Tainted canvases may not be exported.` This has been observed with Mermaid diagrams that include HTML in labels, such as `<b>` and `<br/>`.
- SVG copy and SVG download remain the preferred export paths while the PNG issue is unresolved.
- A future fix may sanitize HTML before PNG rasterization, or disable PNG export with a clear warning when the rendered diagram cannot be safely exported by the browser.
- PNG export is intentionally browser-based. Server-side image rendering would require a separate hosted runtime and is out of scope for this static version.
