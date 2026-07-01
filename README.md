# Bulwark

A Manifest V3 Chrome extension for blocking ads, trackers, and distracting sites, with cosmetic element hiding, an element picker, cookie-banner auto-dismiss, per-site controls, scheduling, block stats, and settings sync.

Personal-use extension, loaded unpacked via `chrome://extensions` (Developer Mode).

## Status

In design. See `docs/superpowers/specs/` for the design spec.

## Features (planned)

- Network blocking of ads and trackers via `declarativeNetRequest` (bundled EasyList / EasyPrivacy)
- Custom filter-list import with auto-update
- Cosmetic element hiding + click-to-hide element picker
- Cookie consent banner auto-dismiss
- Per-site on/off toggle (allowlist)
- Site blocklist with scheduled (time-window) blocking
- Block counter and per-page stats
- Settings sync across Chrome via `chrome.storage.sync`
- Keyboard shortcut to toggle blocking on the current tab

## Development

Load unpacked: open `chrome://extensions`, enable Developer Mode, "Load unpacked", select this folder.
