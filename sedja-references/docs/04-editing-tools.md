# 4. The editing tools, one by one

## 4.1 How every tool works

The top toolbar sets one active tool on the pages area, `<div id="edit-pages" data-tool="text" data-sub-tool="">` ✅. **Text** is active when the editor opens. A click or drag on a page goes to the active tool, and the tool:

1. creates or selects an **item** on one of the page layers (doc 3, section 3.2),
2. lets you move it (jQuery UI *draggable*) and resize it from its corners (*resizable*, `ui-resizable-handle`),
3. shows that item's floating menu (`#text-editable-menu`, `#shape-editable-menu`, …) for colour, size, delete, **clone** and so on,
4. marks the item as `added`, `modified` or `deleted`. These marks are what the server receives later (doc 5).

Shared rules 📖:
- You can only select items on **one page at a time** ("Selecting objects on different pages is not supported").
- Many items (images, text, signatures) can be **repeated on all pages** (`data-repeat-id`). After that the copy is locked: "Can no longer be modified after being repeated on all pages".
- **Esc** ends the drawing and placing modes. **Ctrl/⌘** shortcuts are supported, and the browser's zoom shortcuts are replaced by the editor's own zoom ("Overriding zoom key shortcuts").
- On touch screens, placing something takes two taps: "Tap again to place element on page".

## 4.2 Text (`data-tool="text"`)

| Action | How it works |
|---|---|
| **Add text** | Click an empty spot on the page. A new text box appears there with the default text "Type your text" (`PdfEditorSettings.defaultText`). Typing replaces it. Hint: "Click existing text to edit or click the page to add new text." |
| **Edit existing text** | Click text that's already in the PDF. Its box on the text layer (made from pdf.js `getTextContent`, see doc 3) becomes editable (`contenteditable`). The editor keeps the original font, size and colour, or switches to a similar font if the original lacks letters you typed. |
| **Format** | The text menu has bold, italic, font size (preset list plus a typed number `fontSize2`), font family, text colour, **make into a link**, move, clone and delete. |
| **Move** | "Drag text with your mouse to move it". |
| Output | New text goes into `appendTextOperations`. Changed existing text goes into `editTextOperations`. The server removes the old text and writes the new text in the same spot (⚠️ inferred). |

The text tool also has a sub-menu, "More text related tools", with **Find & Replace** (`data-tool="text-replace"`), see 4.10.

## 4.3 Links (`data-tool="link"`)

- "Select a page area to create link." You drag a box. Then you choose where the link goes: a **web address** (`targetURL`), a **page in this document** (`targetPage`), an **email address** (`targetEmailAddress`) or a **phone number** (`targetTel`) 📖.
- Existing links are read from the PDF's annotations by pdf.js and shown as `.annotation.link` boxes you can change or delete.
- Output: `appendLinkOperations`, `editLinkOperations`, `deleteLinkOperations`.

## 4.4 Forms (`data-tool="form"`)

**Filling in forms.** pdf.js lists the PDF's form fields. Each one is covered by a real HTML control on the form layer (`<input type=text|checkbox|radio>`, `<select>`, `<textarea>`), so filling in a PDF form works like filling in a web form. Read-only fields need a double-click ("Read-only form field. Double click to edit").

**Adding new fields.** Choose a type, then click on the page ✅: Text box (single line), Textarea (several lines), Dropdown, Checkbox, Radio option, Signature box. A field menu sets its name, default value, required/read-only, font size, colours and text alignment. Checks 📖: "Did you mean to use a multiline text field…?", "Your text field seems very tall.", fields with the same name must be the same type. You can also set the **tab order** of fields (`#tabOrderPrompt`), and switch all fields between fill-out mode and edit mode.

**Finding fields automatically ✅/📖.** "Got a static PDF form? We detect the fields and make them fillable automatically." This calls `/process/detect-form-fields` for the current page. It reports progress ("Analyzing your document…", "Looking for text fields…", "Detecting checkboxes and radio buttons…", "Calculating field positions…") and skips pages that already have fields.

**Placing symbols.** Ticks, crosses and dots can be stamped on static forms ("Click once to select. Click on the page to place symbol.").

Output: values typed into existing fields are part of the form values (`getFormValues`, ⚠️ where exactly they travel in the request is unknown). New fields go into `appendFormFieldOperations` and removed ones into `deleteFormFieldOperations`.

## 4.5 Images (`data-tool="image"`)

- **New image** → choose a file → "Click a location on the page to add image." You can also **paste** an image from the clipboard.
- Image types: JPG, PNG, GIF, BMP, TIFF, WEBP, SVG (📖 type names in the code; other types get "Sorry, unsupported image format").
- Big images are shrunk in the browser first (`#image-resize-canvas`, `maxImageDims`). Rotation is done on another canvas ("Rotating image, please wait…").
- Because `uploadImages: true`, each image is **uploaded to the server as its own file** ("Skipping upload, image already uploaded"), and the edit request only contains its file id. Images are also kept in the browser for reuse in later sessions ("Image file too large to store for later use" 📖).
- **Existing images** can be deleted (`deleteImageOperations`, using the PDF object id, doc 3 section 3.6).
- Output: `imageOperations` (new image: file id, page, position, size, rotation ⚠️).

## 4.6 Sign (`data-tool="sign"`)

Create a signature (`#createSignatureModal`) in one of four ways ✅/📖:

| Way | How |
|---|---|
| **Type** | Type your name, then pick one of over 10 handwriting fonts. The name is drawn onto a canvas in that font and turned into an image. |
| **Draw** | Draw with a mouse, trackpad or finger on a signature pad (`#signaturePadCanvas`, 820×300, with `touch-action:none` so the page doesn't scroll while you draw). |
| **Upload image** | Pick a photo of your signature. The background is removed automatically (`#signatureImageOriginal` → `#signatureImageOptimized`; "Could not remove signature background"). |
| **Camera** | Take a picture with your webcam (`#signatureCameraCaptureVideo`, three processing canvases). |

You can pick the ink colour. Signatures can be saved for next time (`#saveSignatureCheck`). Placing one: "Click a location on the page to add signature", then drag its corners to resize it. A placed signature is an **image** on the page, so it travels as an image operation (⚠️ inferred).

Extra signing features 📖: **Stamps** with author, subject and date style (`#createStampModal`), and asking others to sign by email or link (`/api/sign/email`, `/api/sign/link`).

## 4.7 Whiteout (`data-tool="whiteout"`)

"Select page area to whiteout": you drag a box and get a white rectangle with no border (`.shape-editable.whiteout`). The first time, the editor warns: **"Whiteout hides but will not completely remove underlying text or images. Not suitable for redacting sensitive data."** So it is just a white shape drawn on top. The text underneath is still in the file. Output: a `shapeOperations` entry ⚠️ (there is no separate whiteout list in the request ✅).

## 4.8 Annotate (`#annotateMenuBtn`)

"Highlight, underline, strike out text. Draw freehand." ✅

- **Highlight / underline / strikethrough**: choose a style and colour, then select text on the page. The browser's text selection (`getSelection`, `getClientRects`) gives the line boxes, and each becomes part of a highlight annotation. Output: `highlightTextOperations`. Changing or removing existing ones: `editHighlightOperations`, `deleteHighlightOperations`.
- **Freehand highlight**: drag a thick see-through marker. Use this if text selection fails ("Text highlight not working? Try the Annotate > Freehand > Highlight tool.").
- **Draw** (ink): freehand pen lines with colour and width, saved as lists of points. Output: `appendDraw`.
- **Attachments**: "Click a location on the page to add attachment." Output: `appendAttachmentOperations` / `deleteAttachmentOperations`. Files embedded in the document as a whole: `appendEmbeddedFileOperations` / `deleteEmbeddedFileOperations`.
- "Hide all annotations" button.

## 4.9 Shapes (`data-tool="shape"`)

"Add rectangles, ellipse, circles, lines or arrows." ✅ Choose `rectangle`, `ellipse`, `line` or `arrow`, then "Click and drag to draw the shape". Menus: border colour, border width, background (fill) colour (including transparent), clone, delete. Boxes that are too small are ignored. Output: rectangles and ellipses → `shapeOperations`; lines and arrows → `appendLine` (points, colour, width ⚠️).

## 4.10 Find & Replace (`data-tool="text-replace"`)

A search box (`#searchReplaceTextPrompt`) with **Match case** and **also replace in links** options ✅/📖. It searches the text it read from the pages (`findOccurrences`), highlights each match (`find-replace-highlight`) and steps through them with *Find next* / *Replace & find next*, or replaces them all. Each replacement is a normal edit of existing text, so it ends up in `editTextOperations` (⚠️ inferred), and can be undone (`undoReplacement`).

## 4.11 Page tools ✅

Shown when you hover over a page: **delete page**, **zoom in/out**, **rotate left/right**, and between pages **"Insert page here"** (a blank page, using `#new-page-template`). Pages can also be reordered in the page list (*sortable*, `reorderPage` 📖). Output: `deletePageOperations`, `rotatePageOperations`, `insertPageOperations`. Pages keep their original number (`data-original-page-num`), so the server can match every edit to the right page of the original file.

## 4.12 Undo

The **Undo** button (`data-tool="undo"`) steps back through a list of changes. There is also a table of recent changes to pick from (`#undoPrompt`, `#undoTable`) 📖. Since nothing is written to the PDF until Apply, undo just puts the edit layers back to an earlier saved state (`saveSnapshot` / `revertLastOrPrompt`).

## 4.13 Navigation and attachments panel

- **Navigate** (`#navOpenBtn`): a side panel with page thumbnails (`#pdf-canvas-list-nav-side-panel`) and the document's bookmarks.
- **Attachments** (`#attachmentsOpenBtn`): lists files attached to the PDF, with download.
