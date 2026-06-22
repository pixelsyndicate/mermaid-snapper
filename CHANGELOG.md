# Changelog

## 0.3.1 - 2026-06-22

- Linked the header logo and title to the hosted app root for a quick Home action that clears shared-link URLs.
- Display shared Mermaid URL imports inside Mermaid code fences for consistency with copied examples.
- Clear stale `mmd` query values when changing samples, clearing, or editing source.

## 0.3.0 - 2026-06-22

- Added shareable Mermaid Snapper links with `?mmd=` URL import.
- Added a Copy Link action that encodes the current Mermaid source into a shareable URL.

## 0.2.4 - 2026-06-18

- Right-aligned the preview Tips control, changed it from `?` to `i`, and widened the tip popover.

## 0.2.3 - 2026-06-18

- Moved the preview Tips button into the existing export toolbar so it no longer consumes a separate preview row.

## 0.2.2 - 2026-06-18

- Added preview tips for desktop mouse and keyboard controls.
- Added About modal mouse-control notes.
- Prevented Width and Scale step buttons from focusing numeric inputs and opening the iPad virtual keyboard.

## 0.2.1 - 2026-06-18

- Improved iPad/touch editing for Width and Scale controls so partial typed values are not clamped while editing.
- Added explicit minus and plus steppers for Width and Scale controls.
- Added desktop preview drag-to-pan and Ctrl+wheel scale adjustment while preventing accidental rendered SVG text selection.
- Allowed the stacked editor/preview splitter to collapse the source editor further for preview-focused tablet layouts.

## 0.2.0 - 2026-06-17

- Added Mermaid Look controls for Classic, Neo, and Hand drawn rendering.
- Added an About modal with app metadata, useful links, export notes, and Codex credit.
- Improved responsive layout behavior with draggable splitters in two-column and stacked views.
- Grouped diagram and display options for clearer preview/export controls.
- Disabled PNG export with a browser security explanation when canvas export is blocked.

## 0.1.0 - 2026-06-17

- Initial static Mermaid Snapper app for GitHub Pages.
