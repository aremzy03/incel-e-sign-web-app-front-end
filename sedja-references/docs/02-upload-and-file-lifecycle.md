# 2. Getting a PDF to the server, and what happens to it

Every edit happens on the server, so the first step is always to give the server a copy of the file and get back a **file id**. The rest of the session refers to the file only by that id.

## 2.1 Four ways a file arrives

| Way in | What the browser does | Evidence |
|---|---|---|
| **Upload from computer** (button, or drag-and-drop onto the page) | Sends the file bytes with jQuery File Upload (see 2.2) | 📖 shared script |
| **Start with a blank document** | Sends only an address: `POST /api/files` with `{"url":"https://www.sejda.com/assets/new_document.pdf"}`; the server fetches the file itself and answers `{"id":"df6fb345-…_2"}` | ✅ recorded |
| **Dropbox / Google Drive / OneDrive** | Loads the provider's own file picker (`dropbox.com/static/api/2/dropins.js`, Google Picker via `apis.google.com`, `js.live.net/v7.2/OneDrive.js`). The picker returns a download link, and the browser passes that link to the server the same way as the blank document | 📖 addresses in the shared script; ⚠️ the "pass the link" step is inferred from the blank-document flow |
| **Handed over from another Sejda tool** | Tools pass files to each other through session storage (`files` key) or a `?files=[{"downloadUrl":…}]` address parameter, so "edit the result of compress" doesn't re-upload | 📖 |

The id format `<uuid>-<16 characters>_<n>` ✅ suggests a random id plus a marker for which storage server holds the file (⚠️ inferred).

## 2.2 Uploading from the computer, step by step 📖

1. **Pre-check.** Before each file the uploader sends `POST <upload host>/api/files/upload-check` with the form field `uplid` (an upload session id kept in a hidden `#uplid` input) and cookies (`withCredentials`). This lets the server refuse early (too many files per hour, and so on).
2. **Rate guard in the browser.** If the previous upload started less than 10 seconds ago, the new one is cancelled and marked `reasonCancelledByUs`.
3. **Small files (≤ 5 MB)** go in one multipart request to `…/files/upload`.
4. **Large files (> 5 MB)** switch to `…/files/upload-chunked`: the file is sent in **5,000,000-byte chunks** as raw bytes (not a multipart form), and when parallel mode is on, **up to 4 chunks at once**.
5. Every request carries the header `X-FileLocalId` (the browser's own id for that file, so progress and errors can be matched to the right row) and the form field `uplid`.
6. Progress events update a `<progress>` bar. When finished the page fires `fileUploadDone` with the server's file id; on failure `fileUploadFailed`.
7. There is an optional **zip-before-upload** mode (`zipEnabled` switch, `zip-no-worker-deflate.min.js`) that compresses the file in the browser to save upload time ⚠️ (switched on by a query parameter; when it's used by default is unknown).

The editor shows the PDF **straight from your computer's copy while it uploads**. If you press Apply before the upload is done you get "File is still uploading. Please wait until it completes uploading and then try again." 📖

## 2.3 Keeping the file alive

Uploaded files are deleted automatically ("Files stay private. Automatically deleted after 2 hours." ✅ page text). While you are editing, the page keeps the file alive:

- Each time a file is used, the page fires `touchFile`, which sends `POST /api/files/{id}/touch` 📖. Touches are queued one after another.
- A **404** answer means the file is already gone: the page shows an "upload again" dialog.
- A **429** (too many requests) answer stops all touching for **one hour**.

## 2.4 Results and history

- After processing, results are also short-lived and can be deleted early: the "recent files" list removes a task with `DELETE /api/tasks/{id}` 📖.
- Leaving the result screen while a task is still running sends `POST /api/tasks/{id}/cancel` 📖.

## 2.5 Free-use limits shown on the page ✅

- Documents up to **200 pages** or **50 MB**.
- **3 tasks per hour** and **30 files per hour** for free users ("You reached your free limit of 30 files per hour…").
- Paid users get a `data-pro-user` flag on the page that lifts these limits.

How these limits are enforced on the server is described in [doc 6](06-limits-errors-recovery.md).
