# How Sejda's online PDF editor works

These documents explain how the PDF editor at sejda.com/pdf-editor works, based on watching the live site and reading its code. You asked for documentation, not a working copy of the app, so this folder has no app in it.

## The short version

Sejda's editor is not a PDF editor that runs in your browser. It has two parts:

1. **The browser is a viewer that records your edits.** It uses Mozilla's open-source **pdf.js** to draw each page onto a `<canvas>`. On top of each page it stacks see-through HTML layers (text, images, form fields, annotations, drawings, guides). When you type, drag, sign or white something out, you are changing those HTML layers. The PDF itself is never changed in the browser.
2. **The server does the actual editing.** When you press **Apply changes**, the browser turns everything you did into one JSON "edit task" (lists like `appendTextOperations`, `shapeOperations`, `deletePageOperations`…) and posts it to `POST /api/tasks`. Sejda's server opens the original PDF, applies every operation, writes a new PDF and returns a task id. The browser checks the task until it is finished and then offers the download.

```
 you ──► browser (pdf.js draws pages + HTML edit layers) ──► list of operations
                                                              │
                                        POST /api/tasks {type:"edit", files:[id], …Operations}
                                                              ▼
                                         Sejda server rewrites the PDF (task)
                                                              │
                     GET /api/tasks/{id}/change  ◄─ browser checks until "Completed"
                                                              ▼
                               GET /api/tasks/{id}/download/{filename}  → new PDF
```

## The documents

| # | File | What it covers |
|---|------|----------------|
| 1 | [docs/01-architecture.md](docs/01-architecture.md) | The overall design, the scripts and libraries it uses, and why the work is split between browser and server |
| 2 | [docs/02-upload-and-file-lifecycle.md](docs/02-upload-and-file-lifecycle.md) | How a PDF gets to the server: normal and chunked upload, "blank document", cloud pickers, keep-alive and the 2-hour deletion |
| 3 | [docs/03-rendering-with-pdfjs.md](docs/03-rendering-with-pdfjs.md) | How pages are drawn: pdf.js settings, the layer stack, scaling and coordinates, reading existing text and fonts, spotting scanned pages |
| 4 | [docs/04-editing-tools.md](docs/04-editing-tools.md) | Every tool (Text, Links, Forms, Images, Sign, Whiteout, Annotate, Shapes, Find & Replace, page tools, Undo) and how each one works |
| 5 | [docs/05-apply-changes-protocol.md](docs/05-apply-changes-protocol.md) | The exact request and responses recorded when "Apply changes" was pressed, plus result checking and download |
| 6 | [docs/06-limits-errors-recovery.md](docs/06-limits-errors-recovery.md) | Free-use limits, rate-limit headers, warnings, unsupported documents, edit recovery, the "leave page?" guard |
| 7 | [docs/07-rebuild-blueprint.md](docs/07-rebuild-blueprint.md) | A step-by-step plan to build your own editor that works the same way using open-source parts |
| 8 | [docs/08-evidence-and-open-questions.md](docs/08-evidence-and-open-questions.md) | What was observed directly, what was inferred, and what is still unknown |

## How sure each part is

- **Observed**: seen in recorded network traffic or the live page (for example the full `/api/tasks` request body). Marked ✅.
- **Read from code**: found in the site's scripts, including the editor's hidden word list, which I decoded. Marked 📖.
- **Inferred**: a reasonable conclusion that wasn't directly seen. Marked ⚠️.
