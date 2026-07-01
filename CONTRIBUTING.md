# Contributing to Bulwark

Thanks for your interest in improving Bulwark.

## Getting started

1. Clone the repo and install dev dependencies:
   ```
   npm install
   npx playwright install chromium
   ```
2. Build the filter rules (requires network access):
   ```
   npm run build:rules
   ```
3. Load unpacked: open `chrome://extensions`, enable Developer Mode, choose
   "Load unpacked", and select the repo root.

## Running checks

- Unit tests: `npm test`
- Smoke test (loads the extension in Chromium): `npm run smoke`

Please make sure `npm test` passes before opening a pull request.

## Guidelines

- Vanilla HTML/CSS/JS for the UI, no framework or bundler.
- User-facing copy uses plain punctuation (no em dash) and sentence case.
- Use the custom modal and dropdown components in `src/ui/`, not native
  `confirm`, `alert`, `prompt`, or `<select>`.
- Keep pure logic in small, testable modules under `src/lib/` with tests in
  `tests/`.
- One logical change per commit, with a clear message.

## Architecture

See `docs/superpowers/specs/` for the design spec and `docs/superpowers/plans/`
for the implementation plan.
