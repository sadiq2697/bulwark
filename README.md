<p align="center">
  <img src="branding/logo.png" alt="Bulwark" width="460">
</p>

<p align="center">
  <b>Block ads, trackers, and distractions.</b><br>
  A fast, private, Manifest V3 blocker for Chrome. No account, no telemetry, no nonsense.
</p>

<p align="center">
  <a href="https://github.com/sadiq2697/bulwark/releases"><img alt="Release" src="https://img.shields.io/github/v/release/sadiq2697/bulwark"></a>
  <a href="LICENSE"><img alt="License" src="https://img.shields.io/github/license/sadiq2697/bulwark"></a>
</p>

---

## What it does

- Blocks ads and trackers at the network level using `declarativeNetRequest` (EasyList + EasyPrivacy).
- Stops clicked ad links and popunders, not just in-page ad slots.
- Hides leftover ad elements and dismisses cookie banners.
- Element picker: click anything on a page to hide it for good.
- Per-site on/off, a distraction blocklist with a schedule, custom filter lists, block stats, and settings sync.

<br>

## For everyone: use it on your Chrome

You do not need to be a developer to run Bulwark.

1. Download the code: on the [repo page](https://github.com/sadiq2697/bulwark), click **Code → Download ZIP**, then unzip it. (Or `git clone https://github.com/sadiq2697/bulwark.git`.)
2. Build the filter rules once (needs Node and an internet connection):
   ```
   npm install
   npm run build:rules
   ```
3. Open `chrome://extensions`, turn on **Developer mode** (top right).
4. Click **Load unpacked** and select the Bulwark folder.
5. Pin the bull icon to your toolbar. Click it to toggle protection, allow a site, or see what got blocked.

That is it. Bulwark starts blocking right away.

<br>

## For developers: fork and build features

Contributions are welcome. The flow is a standard fork and pull request. Anyone can propose changes; the maintainer (**@sadiq2697**) reviews and is the only one who merges.

1. **Fork** this repo to your own account, then clone your fork.
2. Set up the project:
   ```
   npm install
   npm run setup:hooks      # enables the version-bump-on-push hook
   npx playwright install chromium
   npm run build:rules
   ```
3. Branch from `develop` using the naming convention (`feature/…`, `fix/…`, `docs/…`, `filters/…`).
4. Make your change. Keep `npm test` green and run the smoke test with `npm run smoke`.
5. Push to your fork and open a **pull request against `develop`**. Fill in the PR template.
6. The maintainer reviews, requests changes if needed, and merges. `develop` is promoted to `main` for releases, which are tagged and published automatically.

See [CONTRIBUTING.md](CONTRIBUTING.md) for the branching model, coding conventions, and versioning. Design notes live in `docs/superpowers/`.

### Project layout

```
manifest.json        MV3 manifest
src/background/       service worker, DNR rules, counters, schedule
src/content/          cosmetic hiding + element picker
src/popup/            toolbar popup UI
src/options/          settings page
src/lib/              shared, tested logic (converter, storage, stats)
rules/                generated filter rules (built from public lists)
build/                the list compiler
tests/                unit tests + Playwright smoke test
```

<br>

## License and credits

Bulwark's source is [MIT licensed](LICENSE). The generated files in `rules/` are derived from the
community [EasyList](https://easylist.to/), EasyPrivacy, and Fanboy's Cookiemonster lists and remain
under their own licenses. See [THIRD-PARTY-NOTICES.md](THIRD-PARTY-NOTICES.md). Thanks to those
projects, blocking would not be possible without them.
