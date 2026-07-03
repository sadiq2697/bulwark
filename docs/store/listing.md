# Chrome Web Store listing

## Name
Bulwark, ad and tracker blocker

## Short description (max 132 chars)
Block ads, trackers, and distracting sites. Fast, private, Manifest V3. No account, no telemetry.

## Category
Productivity (or Privacy & Security)

## Detailed description

Bulwark is a fast, private ad and content blocker built on Chrome's modern Manifest V3 platform. It blocks ads and trackers at the network level, hides leftover page clutter, and gives you real control, without an account, without telemetry, and without sending your data anywhere.

What it does:

- Blocks ads and trackers using the community EasyList and EasyPrivacy filter lists.
- Stops clicked ad links and popunders, not just in-page ad slots.
- Hides leftover ad elements and dismisses cookie banners (or auto-rejects them).
- Element picker: click anything on a page to hide it for good.
- Tracking protection: WebRTC leak prevention, Global Privacy Control, and tracking-parameter cleaning.
- Block distracting sites on a schedule, so you stay focused during work hours.
- Per-site on and off, custom filter lists, your own rules, a filtering log, and a stats dashboard.
- Light and dark themes.

Private by design:

- No account, no login.
- No analytics and no telemetry.
- Your settings stay in your browser. Bulwark has no server.

Bulwark is open source (MIT). Source: https://github.com/sadiq2697/bulwark

## Screenshots (1280x800 recommended)
1. Popup with protection on and block counts
2. Statistics tab with the chart and category breakdown
3. Options: Filters
4. Options: Tracking protection
5. Dashboard with top blocked domains

## Single purpose (required by review)
Bulwark blocks ads, trackers, and unwanted content on the pages the user visits.

## Permission justifications
- declarativeNetRequest / Feedback: block ad and tracker network requests and count blocks.
- host access (all sites): apply blocking and cosmetic hiding on the pages the user visits.
- storage: save the user's settings and filter lists.
- scripting: inject the element picker and optional scriptlets when the user enables them.
- tabs: know the active tab to show per-site status and stats.
- alarms: refresh custom filter lists and run the block schedule.
- webNavigation: show a friendly page when an ad-domain navigation is blocked.
- contextMenus: optional right-click actions.
- privacy: optional WebRTC IP-leak protection.
