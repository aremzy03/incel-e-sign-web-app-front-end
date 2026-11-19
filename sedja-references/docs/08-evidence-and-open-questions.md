# 8. Evidence and open questions

## 8.1 What this is based on

| Evidence | What it showed |
|---|---|
| Recorded capture of `/pdf-editor` (page text, layout, scripts) | Feature list, free limits, script addresses |
| Live page inspection `ev_2c28a53e…` | The 4 scripts and the `PdfEditorSettings` block |
| Saved scripts `ev_80f59fe7…` | The shared script (uploader, task submitter, pdf.js loader) and the hidden editor script |
| Decoded word list of the editor script (2,109 strings) | Tool names, layer names, field names, every message the editor can show |
| Walkthrough: open a blank document `ev_d12c1abb…` | `POST /api/files` with a URL → file id; pdf.js loaded in a worker; the page and layer structure |
| Walkthrough: blank document → **Apply changes** `ev_de704900…` | The full `POST /api/tasks` body, the task id, `/result`, `/api/tasks/{id}/change` status, the download address |

✅ means observed directly. 📖 means read in the code. ⚠️ means inferred. These marks are used throughout the documents.

## 8.2 Still unknown

| Question | Why it's open | What would settle it |
|---|---|---|
| **The exact fields inside each operation** (for example one `appendTextOperations` item) — *important* | The recorded save had no edits. The scripted browser could click but couldn't do the press-and-drag the editor needs to place text or shapes, so the lists were empty | Record a save after a real mouse edit, or decode the code around those names. Doc 5 shows a likely shape, marked as estimated |
| **Which program on Sejda's server rewrites the PDF** | Not visible from the browser. The downloaded result opened in the browser's own viewer, so its bytes weren't recorded | Read the "Producer" field of a downloaded result |
| **What a real upload from your computer sends** (which upload server, field names) | Only the blank-document path (upload by address) was recorded. The upload code was read but not watched | Record an upload of a small test PDF |
| Where values typed into existing form fields travel in the request | There's no list named after them in the request, so they probably go inside another list or field | Same as the first question |
| When recovery snapshots are taken, and where they're stored | Auto-saving is off. Only the messages were seen | Edit, reload, and look at the browser's storage |

None of these change the overall picture. The browser draws the PDF and collects a list of edits, and the server applies the list and returns a new file. That much is directly observed.
