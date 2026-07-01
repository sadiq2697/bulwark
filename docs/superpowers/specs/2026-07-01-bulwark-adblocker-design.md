# Bulwark — Design Spec

Date: 2026-07-01
Status: Approved (design), pending implementation plan

## 1. Purpose

Bulwark is a Manifest V3 Chrome extension for personal use (loaded unpacked) that
blocks ads, trackers, and distracting websites, and hides unwanted page elements.
It is client-side only: no backend, and the only network access is fetching public
filter lists.

## 2. Scope

In scope:

- Network blocking of ads and trackers via `declarativeNetRequest` (DNR), using
  public filter lists (EasyList for ads, EasyPrivacy for trackers) compiled to DNR
  rules at build time.
- Custom filter-list import (user-supplied list URLs) with periodic auto-update.
- Cosmetic element hiding via a content script (ad selectors, cookie-banner
  selectors, and user-picked selectors).
- Element picker: click a page element to hide it permanently.
- Cookie consent banner auto-dismiss (bundled cosmetic list).
- Per-site on/off toggle (allowlist) from the popup.
- Site blocklist (distraction blocking) with scheduled time-window enforcement.
- Block counter and per-page statistics, shown in the popup and toolbar badge.
- Settings sync across the user's Chrome via `chrome.storage.sync`.
- Keyboard shortcut to toggle blocking on the current tab.

Out of scope:

- Chrome Web Store publishing (no store listing, privacy policy, or review workflow).
- Non-Chromium browsers.
- A backend service or remote configuration.

## 3. Architecture

Two independent engines with well-defined boundaries:

- Network engine: `declarativeNetRequest`. Ad/tracker rules ship as static rulesets
  compiled from public lists at build time. Allowlist, site blocklist, and imported
  custom lists become dynamic rules at runtime. Chrome performs the actual blocking.
- Cosmetic engine: a content script that injects CSS to hide selectors (ads, cookie
  banners, and user-picked elements). The element picker is a separate content module
  launched on demand.

A background service worker orchestrates state, rule updates, alarms, block counters,
the hotkey command, and messaging. The popup and options pages are the UI.

### Directory layout

```
bulwark/
  manifest.json            MV3 manifest, permissions, DNR ruleset declarations, commands
  src/
    background/
      service-worker.js    orchestration: alarms, rule mgmt, counters, hotkey, messaging
      dnr.js               builds/updates dynamic DNR rules (allowlist, blocklist, custom)
      counters.js          per-tab and total block counts via onRuleMatchedDebug
      schedule.js          alarms that enable/disable blocklist rules by time window
    content/
      cosmetic.js          injects CSS to hide ad/cookie/user selectors
      picker.js            element-picker overlay -> generates a selector, saves it
    popup/                 popup.html/.js/.css: on-off toggle, page + total stats, quick add
    options/               options.html/.js/.css: filter lists, site blocklist, schedule, sync
    lib/
      filter-converter.js  ABP filter syntax -> DNR rules + cosmetic selectors (runtime, imports)
      storage.js           typed settings schema over chrome.storage (sync + local)
      messages.js          message types shared by service worker/content/popup
  rules/
    easylist.json          precompiled DNR (ads)         generated at build time
    easyprivacy.json       precompiled DNR (trackers)    generated at build time
    cosmetic-ads.json      cosmetic selectors (ads)      generated at build time
    cosmetic-cookies.json  cosmetic selectors (cookies)  generated at build time
  pages/blocked.html       shown when a scheduled/blocklisted site is opened
  build/generate-rules.mjs downloads public lists, converts network rules -> DNR JSON,
                           extracts cosmetic (##) rules -> selector JSON
  tests/                   unit tests for filter-converter; smoke test harness
  icons/                   16/32/48/128
```

### Permissions

`declarativeNetRequest`, `declarativeNetRequestFeedback` (block counts; works because
the extension is unpacked), `storage`, `scripting`, `tabs`, `alarms`, `commands`, and
`host_permissions: <all_urls>`.

## 4. Data flow

- Blocking: static rulesets load at install. The service worker toggles ruleset
  enable-state and injects dynamic rules from settings. Chrome blocks natively.
- Per-site off: popup toggle -> service worker adds a high-priority `allowAllRequests`
  dynamic rule for that domain and tells the content script to stop hiding.
- Site blocklist / schedule: the service worker maintains `main_frame` redirect rules to
  `blocked.html`; `chrome.alarms` enables them only inside the configured time window.
- Cosmetic: on page load, the content script requests the merged selector set for the
  host from the service worker and injects CSS. The picker sends a new selector back to
  the service worker, which saves and syncs it.
- Counters: `onRuleMatchedDebug` increments per-tab and total counts; the popup reads
  them; the toolbar badge shows the per-tab count.
- Settings: small data (toggles, allowlist, blocklist, schedule, custom-list URLs,
  picked selectors) live in `chrome.storage.sync`; large data (compiled custom rules,
  cached list text) live in `chrome.storage.local`.

## 5. Settings schema

Synced (`chrome.storage.sync`, kept small):

- `enabled: boolean` — global on/off
- `allowlist: string[]` — hostnames where blocking is disabled
- `blocklist: string[]` — hostnames blocked for distraction
- `schedule: { enabled: boolean, days: number[], start: "HH:MM", end: "HH:MM" }`
- `customListUrls: string[]` — imported filter-list URLs
- `pickedSelectors: { [host: string]: string[] }` — user-hidden elements
- `rulesets: { ads: boolean, privacy: boolean, cosmeticAds: boolean, cookies: boolean }`

Local (`chrome.storage.local`):

- `customRulesCache: { [url]: { text, fetchedAt, ruleCount } }`
- `counters: { total: number }`

## 6. Error handling

- Converter skips unsupported filter rules and logs a skipped-count rather than failing.
- DNR dynamic-rule cap (approximately 30k): batch updates and surface an over-limit
  warning in the options page.
- Custom-list fetch: retry with backoff, keep the last-good cached copy, and show a
  per-list status and last-updated timestamp.
- Content script wrapped in try/catch so a bad selector never breaks the page; the
  picker always removes its overlay on cancel/Esc.
- `storage.sync` quota (approximately 100KB): keep synced data minimal; if exceeded,
  fall back to `storage.local` and warn.

## 7. Testing

- Unit tests (`node --test`) for `filter-converter.js`: given filter strings, assert the
  produced DNR rule objects and cosmetic selectors, including unsupported-rule handling.
- Smoke test: Playwright launches Chromium with the unpacked extension in a persistent
  context, visits a test page with a known ad/tracker domain, and asserts the request is
  blocked and a known element is hidden.
- Manual checklist: load unpacked; verify global and per-site toggle/allowlist; blocklist
  plus schedule; element picker; custom-list import and update; stats/badge; and sync.

## 8. Constraints and notes

- Manifest V3 requires DNR for network blocking; the old blocking `webRequest` API is not
  available, so all network blocking goes through DNR.
- `onRuleMatchedDebug` (used for block counts) is only available for unpacked/dev
  extensions, which matches the personal-use distribution decision.
- Filter lists (EasyList, EasyPrivacy) are fetched from their public sources at build
  time and compiled locally; their contents are not committed to source beyond the
  generated rule JSON.
- UI is vanilla HTML/CSS/JS (no framework) to keep the unpacked bundle simple.

## 9. Build strategy

Full engine and all features (Approach A) built in one pass, then verified against the
testing plan above.
