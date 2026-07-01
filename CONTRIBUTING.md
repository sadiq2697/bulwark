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

## Branching model

- `main` is the stable branch. Every release is tagged from `main`.
- `develop` is the integration branch. Open pull requests against `develop`.
- Create a short-lived branch per change, named by type:
  - `feature/<short-name>` for new capabilities
  - `fix/<short-name>` for bug fixes
  - `docs/<short-name>` for documentation
  - `filters/<short-name>` for rule or filter-list improvements
- When work is ready, PR your branch into `develop`. `develop` merges into `main` for releases.

## Versioning

The version in `package.json` and `manifest.json` is kept in sync and bumped on
every push. Enable the shared git hook once after cloning:

```
npm run setup:hooks
```

With the hook enabled, a push that has not advanced the version will bump the
patch version, commit it, and ask you to push again. To bump manually:

```
npm run bump          # patch
npm run bump:minor
npm run bump:major
```

## Architecture

See `docs/superpowers/specs/` for the design spec and `docs/superpowers/plans/`
for the implementation plan.
