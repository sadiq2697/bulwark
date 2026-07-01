<p align="center">
  <img src="branding/logo.png" alt="Bulwark" width="440">
</p>

# Bulwark

A Manifest V3 Chrome extension for blocking ads, trackers, and distracting sites, with cosmetic element hiding, an element picker, cookie-banner auto-dismiss, per-site controls, scheduling, block stats, and settings sync.

Personal-use extension, loaded unpacked via `chrome://extensions` (Developer Mode).

## Status

Working. Load it unpacked and it blocks. See `docs/superpowers/specs/` for the
design spec and `docs/superpowers/plans/` for the implementation plan.

## Features

- Network blocking of ads and trackers via `declarativeNetRequest` (bundled EasyList / EasyPrivacy)
- Custom filter-list import with auto-update
- Cosmetic element hiding + click-to-hide element picker
- Cookie consent banner auto-dismiss
- Per-site on/off toggle (allowlist)
- Site blocklist with scheduled (time-window) blocking
- Block counter and per-page stats
- Settings sync across Chrome via `chrome.storage.sync`
- Keyboard shortcut to toggle blocking on the current tab

## Install (unpacked)

1. Clone this repo.
2. Build the filter rules (needs network access): `npm install` then `npm run build:rules`.
3. Open `chrome://extensions`, enable Developer Mode, click "Load unpacked", and select the repo root.

## Development

- Unit tests: `npm test`
- Smoke test (loads the extension in Chromium): `npm run smoke` (first run `npx playwright install chromium`)
- Rebuild rules from the public lists: `npm run build:rules`

See CONTRIBUTING.md for details.

## License

Source code is MIT licensed (see LICENSE). The generated filter-rule files under
`rules/` are derived from third-party filter lists (EasyList, EasyPrivacy, Fanboy's
Cookiemonster) and remain under those lists' licenses. See THIRD-PARTY-NOTICES.md.

## Acknowledgements

Ad and tracker blocking is powered by the community-maintained
[EasyList](https://easylist.to/) and EasyPrivacy filter lists, and cookie-banner
hiding by Fanboy's Cookiemonster list.
