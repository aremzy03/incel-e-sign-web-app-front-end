# 6. Limits, warnings, unsupported documents and recovery

## 6.1 Free-use limits ✅ (page text) / 📖 (code)

| Limit | Value | Where it's enforced |
|---|---|---|
| Document size | 200 pages or 50 MB | Checked in the browser when the file is opened (`fileOverFreeQuotaWarnings`) and again on the server |
| Tasks | 3 per hour | Server answers HTTP 402 `{"reason":"tasks-per-hour"}` plus `X-RateLimit-Wait` |
| Files | 30 per hour | `upload-check` before each upload |
| Storage time | 2 hours | Server deletes files. `touch` keeps a file alive while you edit (doc 2) |
| Some features (for example automatic field detection) | separate limit | "You've reached the limit for this feature for now." |

## 6.2 Checks done when a document opens 📖

| Situation | What you see |
|---|---|
| PDF has read errors | "Errors were detected when reading document" / "This document contains errors that may prevent your changes from being saved." (link to Repair PDF) |
| XFA form | "Document contains XFA elements, which are not supported." |
| Unusual form fields | "Document contains unsupported form fields" |
| Owner password blocks changes (`enforcePerms`) | The PDF's permissions are read with pdf.js `getPermissions`. If changes aren't allowed the editor stops and points to Unlock PDF ⚠️ |
| Scanned pages | Existing text can't be changed; everything else works (doc 3) |
| Browser zoom not 100% | Warning (`browserZoomWarnings`), because a zoomed browser makes positions inaccurate |
| Arabic, Devanagari, Hebrew | "Complex script alphabets are not supported", "Right to left scripts are not fully supported" |

## 6.3 Warnings while editing 📖

- Fonts: "Embedded font, characters might be missing." / "Original font is missing the characters you typed." / "Original font replaced, was missing characters you typed."
- Images: "Image might be partially hidden by an overlapping element." / "Some images could not be processed and were removed from your edits"
- Clicking outside the page: "Looks like you clicked outside the page? Please try clicking a location inside the page."
- Whiteout isn't redaction (doc 4, section 4.7).

## 6.4 Not losing your work

- **Leave-page guard.** While there are unsaved edits, the page sets `onbeforeunload`, so the browser asks "Changes that you made may not be saved" ✅ (this prompt also stopped my automated browser while recording).
- **Edit recovery** (`recoveryEnabled: true`). The editor saves a snapshot of your edits locally (images included, unless one is too big: "Image file too large to store for later use"). When you open the same document again it offers "Restore edits from session around <time>". If you accept, the task is sent with `"recovered": true`. Continuous auto-saving is turned off (`recoveryAutoSavingEnabled: false`), so snapshots are taken at certain moments (for example when the page goes idle: "Idle, saving recovery data") ⚠️ exact moments unknown.
- **Expired upload.** If the server deleted the file (2 hours, or a 404 on `touch`), the page asks you to upload it again, and the edits can be put back on the new upload (`reuploaded`, `uploadAgainNotPossible` 📖).

## 6.5 Error reporting

Browser errors go to Sentry through the site's own `/sentry-tunnel` address (`Raven.captureException`, `captureMessage` 📖). Each task also carries `consoleLogs` and a `traceId` (doc 5), so a failed save can be traced back to what happened in the browser.
