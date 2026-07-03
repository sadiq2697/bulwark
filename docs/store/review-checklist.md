# Chrome Web Store submission checklist

Run before every submission.

## Build
- [ ] `npm run build:rules` (fresh filter rules)
- [ ] `npm test` passes
- [ ] `npm run smoke` passes
- [ ] `npm run package` produces `dist/bulwark-<version>.zip`
- [ ] Load the zip contents unpacked and click through popup, options, dashboard, log, blocked page

## Manifest and policy
- [ ] Version bumped
- [ ] Only the permissions we use are requested (see listing.md justifications)
- [ ] No remotely hosted code; all JS is packaged (React is loaded by the host, not bundled remote code we control)
- [ ] `PRIVACY.md` is current and hosted at a public URL for the listing
- [ ] Single-purpose description matches the actual behavior

## Listing assets
- [ ] Icon 128 present and correct
- [ ] At least 1 screenshot (1280x800 or 640x400)
- [ ] Short description under 132 characters
- [ ] Detailed description from listing.md
- [ ] Category set
- [ ] Privacy policy URL set; data-use disclosures completed (Bulwark collects nothing)

## MV3 compliance notes
- [ ] Network blocking uses declarativeNetRequest only
- [ ] No use of eval or remote script execution
- [ ] Optional scriptlets are user-enabled and packaged locally
- [ ] Host permissions justified by on-page blocking and cosmetic filtering

## After approval
- [ ] Tag the released version and attach the zip to the GitHub release
