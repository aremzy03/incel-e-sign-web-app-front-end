# 5. "Apply changes": what's sent, and how the result comes back

All of this was **recorded from the live site** ✅ (blank document → Apply changes, 4 Nov 2026). The ids below come from that run.

## 5.1 The whole sequence

| # | Request | Sent | Answer |
|---|---|---|---|
| 1 | `POST /api/files` | `{"url":"https://www.sejda.com/assets/new_document.pdf"}` | `{"id":"df6fb345-a268-41fd-b7a3-63f6b7a5e35f-HJT2KG0K50MJACW0_2"}` |
| 2 | `GET /assets/new_document.pdf` | – | The PDF bytes, which pdf.js draws in the browser |
| 3 | `POST /api/tasks` | the edit task (5.2) | `"12M5JUVK-202611040958"` (task id, as a JSON string) |
| 4 | `GET /result?id=12M5JUVK-202611040958` | – | The results screen, loaded in an `<iframe>` |
| 5 | `GET /api/tasks/{id}/change?_=<time>` | – | Task status (5.3). Asked again until it's finished |
| 6 | `GET /api/tasks/{id}/download/{filename}?s=…&v=true&_s=7&_xpt=…` | – | The edited PDF (`application/pdf`) |

The task id looks like `<8 random characters>-<yyyymmddhhmm>`: `202611040958` is the time the task was created.

## 5.2 The edit task (request body of `POST /api/tasks`) ✅

```json
{
  "type": "edit",
  "elapsedTime": 13,
  "recovered": false,
  "outputFilenamePattern": "",
  "files": ["df6fb345-a268-41fd-b7a3-63f6b7a5e35f-HJT2KG0K50MJACW0_2"],
  "uri": "/pdf-editor",

  "appendTextOperations": [],
  "editTextOperations": [],
  "imageOperations": [],
  "shapeOperations": [],
  "insertPageOperations": [],
  "deletePageOperations": [],
  "highlightTextOperations": [],
  "editHighlightOperations": [],
  "deleteHighlightOperations": [],
  "appendLinkOperations": [],
  "editLinkOperations": [],
  "deleteLinkOperations": [],
  "appendAttachmentOperations": [],
  "deleteAttachmentOperations": [],
  "appendEmbeddedFileOperations": [],
  "deleteEmbeddedFileOperations": [],
  "appendFormFieldOperations": [],
  "deleteFormFieldOperations": [],
  "appendDraw": [],
  "appendLine": [],
  "deleteImageOperations": [],
  "rotatePageOperations": [],

  "userAgent": "Mozilla/5.0 (…) Chrome/156 …",
  "cvts": "0.22",
  "pdfjs": "e5185d033",
  "libsCache": "667",
  "consoleLogs": ["Using pdfjs v159"],
  "traceId": "tr-ad500a62-49b3-4069-9119-57c268e13833",
  "www": "www7.sejda.com"
}
```

What the fields mean:

| Field | Meaning |
|---|---|
| `type` | Which server job to run. Every Sejda tool uses the same endpoint. `"edit"` is the PDF editor. |
| `files` | The file id(s) from the upload. The editor allows only one ("Cannot edit multiple files at the same time"). |
| `uri` | Which tool page sent the task. |
| `elapsedTime` | Seconds spent in the editor (13 s in the recorded run). |
| `recovered` | `true` if the edits were restored from a saved session (doc 6). |
| `outputFilenamePattern` | Optional name for the result. Empty means keep the original name (the result was `new_document.pdf`). |
| `…Operations`, `appendDraw`, `appendLine` | **The edits.** 22 lists, always all present, empty when unused. Doc 4 says which tool fills which list. |
| `userAgent`, `pdfjs`, `libsCache`, `cvts`, `consoleLogs`, `traceId`, `www` | Debugging details: browser, client build numbers, the browser's log lines, a trace id that ties browser and server logs together, and which web server served the page. |

### What one operation probably looks like ⚠️

The recorded run had no edits, so the exact fields inside an entry weren't seen (an open question, see doc 8). The editor's decoded word list contains these field names, which are the most likely building blocks: `pageNum`, `pageId`, `opId`, `objId`, `fontId`, `left`, `top`, `width`, `height`, `boundingBox`, `points`, `text`, `fontName`, `fontFamily`, `fontSize`, `fontColor`, `bold`, `italic`, `color`, `bgColor`, `borderColor`, `align`, `rotation`, `degrees`, `fieldName`, `kind`, `multiline`, `maxLength`, `required`, `readOnly`, `options`, `targetURL`, `targetPage`, `targetEmailAddress`, `targetTel`, `fileId`, `imageObjIds`, `anchorTop/Left/Right/Bottom`. For example, an added text entry is probably close to:

```json
{ "opId": "…", "pageNum": 1, "left": 72.0, "top": 100.0, "width": 140.0, "height": 18.0,
  "text": "Hi!", "fontName": "Helvetica", "fontSize": 12, "fontColor": "#000000",
  "bold": false, "italic": false }
```

Treat this as an illustration, not the real format. The editor also checks for duplicates (`duplicateOpIds`) before sending.

### Limits and errors on submit (shared script 📖)

- A successful answer may include `X-RateLimit-Remaining` (tasks left) and `X-RateLimit-Wait` (seconds until the hourly limit resets). The page shows these as "x free saves left" ("2 free saves left for the next…", "No free saves left for the next…").
- **HTTP 402** with `{"reason":"tasks-per-hour"}` (or another reason) shows the upgrade popup with a countdown. When the countdown ends, the Apply button works again.
- "Too many requests, please try again later." covers HTTP 429.

## 5.3 Checking the task's status ✅

The results screen calls `GET /api/tasks/{id}/change` (with a cache-busting `_=` time value) and gets:

```json
{
  "status": "Completed",
  "type": "edit",
  "resultFilename": "new_document.pdf",
  "resultFileSize": 1472,
  "resultItems": ["new_document.pdf"],
  "warnings": [],
  "resultFullUrlPattern": "www.sejda.com/api/tasks/{id}/download/{{filename}}?s=web-…&d=true&_s=7",
  "id": "12M5JUVK-202611040958"
}
```

- `status` moves from queued/running to `Completed` (or a failure). For slow tasks: "Taking longer than usual. During busy times this can take up to 2 minutes." 📖
- `resultFullUrlPattern` is a template. The page puts the file name in place of `{{filename}}` to make the download link. `s=` is a signed access token, so only this browser session can download the result. `d=true` downloads the file; the in-page preview uses `v=true` (view) instead.
- `warnings` lists problems the server hit but worked around (for example a font it couldn't keep).
- When it's done, the results frame tells the editor (console: `Task … completed`; the page calls `completedTask(id)`) so that leaving the page doesn't cancel it. Leaving before it's done sends `POST /api/tasks/{id}/cancel`.

## 5.4 After the result

The results screen offers Download, plus **continue in another tool** (compress, merge, sign…), which reuses the result's id as the next tool's input without re-uploading. It also offers saving to Dropbox or Google Drive, and deleting now. Printing works only from here: "To print this document please first save your changes, then click the 'Print' button on the next screen." 📖
