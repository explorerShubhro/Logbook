# Logbook — readable version

Same app, same look, same data. Just split into normal files instead of one giant line.

| File          | What it is                                                         | Edit it?  |
| ------------- | ------------------------------------------------------------------ | --------- |
| `app.js`      | The whole app: screens, logic, backup export/import (~3,800 lines) | **YES**   |
| `storage.js`  | How data is saved in the browser (localStorage)                    | rarely    |
| `icons.js`    | The app icon images                                                | no        |
| `styles.css`  | Compiled CSS                                                       | rarely    |
| `vendor.js`   | React + charts + icon library (minified)                           | **NEVER** |
| `index.html`  | Page shell that loads the files above, in this order               | rarely    |

## Deploy

Upload ALL the files to the same place on GitHub (replace the old `index.html`).
Keep the same URL: your data is stored per website address, so the same URL = same data.

## Finding things in app.js

Search for these names:

- `exportBackup` / `handleImportFile` — backup export / import
- `KEY_...` — the 7 things saved in the browser
- `renderSleepStudyGraph` — the sleep & study graph
- `computeStudyStreak` — streak logic
- `LogbookApp` — the main screen component

## Good to know

- The screens are written as `jsx("div", {...})` calls (compiled JSX). Browsers run this directly, so no build step is needed.
- `styles.css` only contains the Tailwind classes the app already uses. A brand-new class name will do nothing. Use an inline `style` object like the rest of the code, or ask Claude to add the CSS.
- Inside some functions a few short variable names remain (O, j, Q...). Top-level names, state variables and functions all have real names.
