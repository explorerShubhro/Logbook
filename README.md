# Logbook — readable version (works offline)

Same app, same look, same data. Normal readable files instead of one giant line, and it now works with no internet.

| File                   | What it is                                                              | Edit it?  |
| ---------------------- | ----------------------------------------------------------------------- | --------- |
| `app.js`               | The whole app: screens, logic, backup export/import, safety copies      | **YES**   |
| `storage.js`           | How data is saved in the browser (localStorage)                         | rarely    |
| `styles.css`           | Compiled CSS                                                            | rarely    |
| `vendor.js`            | React + charts + icon library (minified)                                | **NEVER** |
| `index.html`           | Page shell that loads the files above, in this order                    | rarely    |
| `sw.js`                | Service worker: saves the app files so it opens offline                 | rarely    |
| `manifest.webmanifest` | Lets you "Install" / "Add to Home screen" the app                       | rarely    |
| `icon-192.png`, `icon-512.png` | App icons                                                       | no        |

## Deploy

Upload ALL the files together to the same place on GitHub (replace the old `index.html`).
Keep the same URL: your data is stored per website address, so the same URL = same data.
Open the site once while online. After that it opens and saves entries with no internet.

If you add or rename a file, add it to `APP_FILES` in `sw.js`.
If you ever change `sw.js`, bump `CACHE_NAME` (e.g. `logbook-shell-v2`).

## How your data is protected

- Entries, sleep/study hours, targets, rest days are saved in the browser on every change. This works offline.
- The app asks the browser to keep the data permanently (`navigator.storage.persist()`).
- Automatic safety copies (last 5) are kept, and nothing is overwritten with an empty state. Restore them from the Progress tab.
- A banner reminds you to export a backup if you haven't recently.
- **Safety copies live in the same browser storage. "Clear site data" / clearing cookies and site data erases them too.** Only an exported backup file protects against that. Export regularly and keep the file somewhere else (email it to yourself, cloud drive).

## Finding things in app.js

- `exportBackup` / `handleImportFile` — backup export / import
- `KEY_...` — the things saved in the browser (including `KEY_SNAPSHOTS`)
- `writeSnapshot` — automatic safety copies
- `safeUrl` — makes sure links are only http/https
- `renderSleepStudyGraph` — the sleep & study graph
- `computeStudyStreak` — streak logic
- `LogbookApp` — the main screen component

## Good to know

- The screens are written as `jsx("div", {...})` calls (compiled JSX). Browsers run this directly, so no build step is needed.
- `styles.css` only contains the Tailwind classes the app already uses. A brand-new class name will do nothing. Use an inline `style` object like the rest of the code, or ask Claude to add the CSS.
- Inside some functions a few short variable names remain (O, j, Q...). Top-level names, state variables and functions all have real names.
