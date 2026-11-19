# 1. Architecture

## 1.1 What gets loaded

When `https://www.sejda.com/pdf-editor` opens, the page loads four scripts ✅:

| Script | Size | Role |
|---|---|---|
| inline `<script>` | 327 B | Sets `window.PdfEditorSettings` (see below) |
| `/cache/667/js/libs-and-partials.min.js` | ~808 KB | Shared code for every Sejda tool: jQuery 3 + jQuery Migrate 3.0.1, Bootstrap 3 (modals, dropdowns, tooltips), jQuery UI (draggable, resizable, sortable, droppable), jQuery File Upload, MiniColors (colour picker), the uploader, the task submitter, the result screen and the pdf.js loader |
| `/cache/533/js/pages/pdf-editor.min.obfuscated.js` | ~399 KB | The editor itself. It is deliberately hidden (obfuscated): every word is moved into an encoded list of 2,109 strings. I decoded the list to read tool names, field names and messages 📖 |
| `/js/pa-….js` | 6 KB | Privacy-friendly page analytics |

pdf.js is loaded **only when a document is opened** ✅: `/cache/159/js/pdfjs/pdf.min.js` plus a Web Worker `/cache/159/js/pdfjs/pdf.worker.min.js`. The console then shows `Using pdfjs v159` (159 is Sejda's own build number of pdf.js; the task request reports pdf.js commit `e5185d033`).

The `/cache/<number>/` part of each address is a version stamp that forces browsers to fetch new files after an update. The task request reports this number back (`libsCache: "667"`), so the server knows which client build made the edits.

### Editor settings (inline script) ✅

```js
window.PdfEditorSettings = {
  defaultText: 'Type your text',      // text placed in a new text box
  uploadImages: true,                 // images go to the server as files
  fileOverFreeQuotaWarnings: true,    // warn when the file is over the free limits
  browserZoomWarnings: true,          // warn if the browser itself is zoomed
  recoveryEnabled: true,              // offer to restore unsaved edits
  recoveryAutoSavingEnabled: false,   // ...but don't save them continuously
  enforcePerms: true,                 // respect the PDF's own permission flags
  wideOnMobileScreens: true           // page can be wider than a phone screen
};
```

## 1.2 Split of work: viewer in the browser, editor on the server

```
┌────────────────────────── Browser ───────────────────────────┐
│ Uploader ──► file id                                         │
│ pdf.js ──► draws each page on a <canvas>                     │
│            reads text positions, fonts, images, form fields, │
│            annotations                                       │
│ Edit layers (HTML on top of each canvas)                     │
│   imageLayer · textLayer · formLayer · annotationLayer ·     │
│   drawLayer · guidesLayer                                    │
│ Tools change the layers and add items to an edit list        │
│ "Apply changes" ──► one JSON task                            │
└───────────────────────────────┬──────────────────────────────┘
                                │ POST /api/tasks
┌───────────────────────────────▼──────────────────────────────┐
│ Server: takes the stored original, applies each list of      │
│ operations, saves the result, deletes everything after 2 h   │
└──────────────────────────────────────────────────────────────┘
```

Why it is built this way (⚠️ inferred, but consistent with everything observed):

- **Writing PDFs correctly is hard; showing them is easy.** pdf.js is excellent at drawing PDFs but cannot save changes into them. A server-side PDF library can rewrite text, fonts, form fields and annotations reliably.
- **The same server engine powers all ~45 Sejda tools.** Every tool page (compress, merge, split, …) posts to the same `POST /api/tasks`, only with a different `type`. The editor is just the `"edit"` type with a big list of operations.
- **The browser stays light.** Nothing is written until you press Apply, so undo is simple: remove an item from the list.
- **The same engine runs offline.** Sejda Desktop offers "the same features" with files that "never leave your computer", which suggests the browser UI and the PDF engine are packaged together there.

## 1.3 Main parts of the editor code (📖 from the decoded word list)

| Part | Evidence in the code | What it does |
|---|---|---|
| Document loader | `getDocument`, `numPages`, `getPage`, `getViewport`, `renderPage`, `renderPdfPage` | Opens the PDF with pdf.js and draws pages as they scroll into view |
| Page model | `page-wrap`, `data-page-num`, `data-original-page-num`, `data-scale`, `data-zoom`, `data-rotation`, `pageUniqueId` | One block per page that remembers its original number, scale, zoom and rotation |
| Text engine | `getTextContent`, `flattenTextLayer`, `existingTextEdit`, `findDocFont`, `isType3Font`, `missingGlyphCanvas`, `measureText` | Finds existing text and its font so it can be edited in place |
| Tool switcher | `data-tool` on `#edit-pages` (`text`, `link`, `form`, `image`, `sign`, `whiteout`, `annotate`, `shape`) and `data-sub-tool` | One tool is active at a time; the active tool decides what a click does |
| Object editors | `text-editable`, `image-editable`, `shape-editable`, `link-editable`, `ff-editable` (form field), `highlight-editable`, `draw-editable`, `attachment-editable`, each with its own floating menu `#…-editable-menu` | A selected item gets a small toolbar (colour, size, font, delete, clone, …) |
| Operation collector | `appendTextOperations`, `shapeOperations`, … (full list in doc 5), `getAddedOrUpdated`, `getRemoved`, `opId`, `duplicateOpIds` | Turns the layers into the lists sent to the server |
| Undo | `data-tool="undo"`, `revertLastOrPrompt`, `saveSnapshot`, `undoReplacement` | Steps back through changes |
| Recovery | `recoveryEnabled`, `saveSnapshot`, `Restore edits from session around …` | Keeps a copy of your edits so they can be restored after a crash |
| Task runner | `runTask`, `processNextTask`, `taskProcessingCompleted` | Sends the task and opens the result screen |

The page reacts to its own **jQuery custom events** ✅ (from the shared script's handler map): `filesSelected`, `fileUploadStarted`, `fileUploadDone`, `fileUploadFailed`, `touchFile`, `requestRenderPages`, `doRenderPage`, `pagesRendered`, `renderVisiblePageThumbs`, `pdfPagesDeleted`, `selectedPagesChanged`, `taskProcessingCompleted`, `workflowTaskCompleted`, `openFilesFromRecentFiles`, `openFilesFromWorkflowStep`. The parts don't call each other directly; they announce events and listen for them.
