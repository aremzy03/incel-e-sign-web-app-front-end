# 7. How to build your own editor that works the same way

This is a plan for building an editor with the same design, using open-source parts. It doesn't use any of Sejda's code. The operation format below is **my own design**, based on the list names Sejda uses (doc 5).

## 7.1 Pick the parts

| Part | Recommended | Why |
|---|---|---|
| Showing pages, reading text, fonts, forms, links | **pdf.js** (`pdfjs-dist`) | The same library Sejda uses. Free (Apache-2.0) |
| Editing UI | Any framework (React, Svelte or plain JS) with a drag/resize helper (`interact.js`, or your own pointer handlers) | The layers are plain absolutely-positioned HTML |
| Writing the PDF, simple route | **pdf-lib** (JavaScript, runs in the browser or on a server) | Can add text, images, shapes, links, form fields, annotations; delete, insert and rotate pages; fill forms |
| Writing the PDF, full route | **Apache PDFBox** (Java) or **pikepdf / PyMuPDF** (Python) on a server | Also needed for **changing text that's already in the PDF** and **real redaction**, which pdf-lib can't do |
| Signature pad | `signature_pad` | Smooth drawing on canvas with mouse, pen or touch |
| Handwriting fonts | Free Google Fonts (Caveat, Dancing Script, Satisfy, …) | For typed signatures |

Two ways to build it:
- **A. Browser only (simplest).** Do everything in the browser with pdf.js + pdf-lib. Nothing is uploaded and there are no limits to manage. You lose "edit existing text".
- **B. Same as Sejda.** Browser UI plus a server that keeps the file and applies an operation list. Needed if you want existing-text editing, a high-quality PDF engine, or the same engine behind many tools.

## 7.2 Data model (my design)

```ts
type Pt = number;                       // PDF points, origin = bottom-left of the page

interface Task {
  type: "edit";
  files: [string];                      // the uploaded file's id
  appendTextOperations: AppendText[];
  editTextOperations: EditText[];
  imageOperations: AddImage[];
  shapeOperations: Shape[];             // rectangles, ellipses, whiteout
  appendLine: Line[];                   // lines and arrows
  appendDraw: Ink[];                    // freehand
  highlightTextOperations: Highlight[];
  appendLinkOperations: Link[];  editLinkOperations: Link[];  deleteLinkOperations: Ref[];
  appendFormFieldOperations: Field[];  deleteFormFieldOperations: Ref[];
  formValues: Record<string, string | boolean>;   // values typed into existing fields
  deleteImageOperations: Ref[];         // existing images, by PDF object number
  insertPageOperations: { afterOriginalPage: number; width: Pt; height: Pt }[];
  deletePageOperations: { originalPage: number }[];
  rotatePageOperations: { originalPage: number; degrees: 90 | 180 | 270 }[];
  // …attachments, embedded files, edit/delete highlights the same way
}

interface Box { opId: string; page: number; x: Pt; y: Pt; width: Pt; height: Pt }
interface AppendText extends Box { text: string; font: string; size: number; color: string; bold: boolean; italic: boolean; align: "left"|"center"|"right" }
interface EditText  extends AppendText { originalItems: { x: Pt; y: Pt; width: Pt; height: Pt }[] }  // what to remove
interface AddImage  extends Box { fileId: string; rotation: number; repeatOnAllPages?: boolean }
interface Shape     extends Box { kind: "rectangle"|"ellipse"|"whiteout"; border?: string; borderWidth?: number; fill?: string }
interface Line      { opId: string; page: number; points: [Pt, Pt][]; color: string; width: number; arrow?: boolean }
interface Ink       extends Line {}
interface Highlight { opId: string; page: number; style: "highlight"|"underline"|"strikeout"; color: string; quads: Box[] }
interface Link      extends Box { url?: string; toPage?: number; email?: string; tel?: string }
interface Field     extends Box { kind: "text"|"textarea"|"dropdown"|"checkbox"|"radio"|"signature"; name: string; value?: string; options?: string[]; required?: boolean; readOnly?: boolean }
interface Ref       { page: number; objId: string }
```

Rules that keep it simple (the same ones Sejda follows, doc 3 and doc 4):
1. Always store positions in **PDF points**, converting from screen pixels with the page's scale. Never store screen pixels.
2. Always refer to pages by their **original** page number, and apply page deletions, insertions and reordering **last**.
3. Don't allow rotating or zooming a page that already has edits.

## 7.3 Build order

1. **Viewer.** Open a PDF with pdf.js and draw each page on a canvas at `scale = containerWidth / pageWidth`, using 2× pixels for sharpness. Draw pages only when scrolled into view (`IntersectionObserver`).
2. **Layers.** Put one absolutely-positioned `div` per layer (image, text, form, annotation, draw, guides) over each canvas, the same size as the page.
3. **Tool switcher.** Store the active tool. Send pointer events on a page to that tool. Each tool creates items `{ id, page, kind, box, props, state: added|modified|deleted }` in one store.
4. **Simple tools first:** new text, image, shapes and whiteout, lines, freehand, links, page delete/rotate/insert. Each needs a create gesture, a move/resize gesture and a small property menu.
5. **Undo.** Save a copy of the item store before each change; Undo puts the last copy back.
6. **Forms.** Use pdf.js `getFieldObjects()` and per-page `getAnnotations()` to place HTML inputs over the fields. Collect values into `formValues`. Add new fields as items.
7. **Annotate.** Turn the browser's text selection (`getClientRects`) into page boxes for highlights.
8. **Sign.** Signature modal (type / draw / upload) → PNG → place it as an image item.
9. **Save.** Turn the store into the `Task`. Option A: apply it in the browser with pdf-lib (`drawText`, `drawImage`, `drawRectangle`, `drawEllipse`, `drawLine`, `drawSvgPath`; annotations and links through pdf-lib's low-level objects; `getForm()` for fields; `removePage`, `insertPage`, `setRotation`). Then download a Blob. Option B: `POST /api/tasks`, the server applies it, then check `GET /api/tasks/{id}` until it's done and download.
10. **Editing existing text (option B only).** Make boxes from pdf.js `getTextContent()`. When one is edited, the server (PDFBox) reads the page's content stream, **removes the text-drawing commands whose glyphs fall inside the original boxes**, and draws the new text in the same font if it has the letters, otherwise in a similar standard font. This is the hardest part of the whole project, so plan the most time for it.
11. **Protection.** Warn before leaving with unsaved edits (`beforeunload`). Save a recovery snapshot (IndexedDB) and offer to restore it.
12. **Server housekeeping (option B).** Upload with a pre-check, chunked uploads over ~5 MB, file ids, a 2-hour expiry with a "touch" keep-alive, per-hour rate limits answered with 402/429 and a `Retry`-style wait header, signed download links.

## 7.4 Things to get right

- **Whiteout isn't redaction.** If you offer redaction, the server has to really delete the text and image data under the box.
- **Fonts.** Embed every font you write with, and subset it. Check for missing letters before saving.
- **Coordinates on rotated pages.** Turn screen positions back through the page's `/Rotate` value before saving.
- **One page per selection.** Sejda doesn't allow selecting across pages, and you shouldn't either.
