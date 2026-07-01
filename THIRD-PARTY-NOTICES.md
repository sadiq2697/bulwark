# Third-party notices

Bulwark's own source code is licensed under the MIT License (see LICENSE).

The generated filter-rule files in `rules/` are produced at build time by
`build/generate-rules.mjs`, which downloads and converts public filter lists.
Those generated files are derivative works of the source lists below and remain
subject to the source lists' licenses. Bulwark does not commit the raw list text,
only the compiled rule data derived from it.

## Filter lists

- **EasyList** (`rules/easylist.json`, `rules/cosmetic-ads.json`)
  Source: https://easylist.to/easylist/easylist.txt
  License: dual-licensed GNU GPL v3.0 and Creative Commons Attribution-ShareAlike 3.0.

- **EasyPrivacy** (`rules/easyprivacy.json`)
  Source: https://easylist.to/easylist/easyprivacy.txt
  License: dual-licensed GNU GPL v3.0 and Creative Commons Attribution-ShareAlike 3.0.

- **Fanboy's Cookiemonster list** (`rules/cosmetic-cookies.json`)
  Source: https://secure.fanboy.co.nz/fanboy-cookiemonster.txt
  License: dual-licensed GNU GPL v3.0 and Creative Commons Attribution-ShareAlike 3.0.

Attribution and the ShareAlike terms of the above licenses apply to the derived
rule data. If you redistribute the generated `rules/` files, keep this notice.

## Runtime dependency

- **React / ReactDOM** are loaded at runtime by the extension host environment
  and are not bundled in this repository. React is MIT licensed.

## Development dependency

- **@playwright/test** (dev only, for the smoke test). Apache-2.0 licensed.
