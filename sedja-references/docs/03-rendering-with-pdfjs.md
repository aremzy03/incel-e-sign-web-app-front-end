# 3. Drawing pages and reading what's on them (pdf.js)

## 3.1 Loading pdf.js

pdf.js is loaded the first time a document opens ✅ (`/cache/159/js/pdfjs/pdf.min.js`, then a Web Worker `pdf.worker.min.js` that does the heavy parsing off the main thread). If loading fails the code throws a `FailedLoadingPDFJSException` and can force a page reload to fetch fresh files 📖.

Settings passed to pdf.js's `getDocument` 📖:

| Setting | Value | Meaning |
|---|---|---|
| `cMapUrl` / `cMapPacked` | `/js/pdfjs/web/cmaps/`, `true` | Character maps for Chinese, Japanese and Korean fonts |
| `standardFontDataUrl` | `/js/pdfjs/web/standard_fonts/` | Real font files for the 14 standard PDF fonts (Helvetica, Times…) |
| `wasmUrl`, `iccUrl` | `/js/pdfjs/web/wasm/`, `/js/pdfjs/web/iccs/` | Image decoders and colour profiles |
| `useSystemFonts` | `false` | Never use fonts installed on your computer, so every visitor sees the same result |
| `disableStream`, `disableAutoFetch` | `true` | Load the whole file at once instead of in pieces (the file is local or already uploaded anyway) |
| `enableXfa` | `false` | XFA forms (an old Adobe form type) aren't supported; the editor warns "Document contains XFA elements, which are not supported." |
| `enableWebGPU`, `enableHWA` | `false` | No GPU drawing, for consistent output |
| `useWorkerFetch` | `true` | The worker fetches font and map files itself |
| `maxImageSize` | `33554432` (32 megapixels) in some cases, otherwise unlimited | Protects weaker devices from huge images ⚠️ (the exact condition is hidden) |

## 3.2 The page stack ✅ (seen in the live page)

Each PDF page becomes this block:

```html
<div class="page-container" id="<unique page id>">
  <div class="page-above">            <!-- page number + per-page tools: delete, zoom in/out, rotate left/right -->
    <div class="page-between">Insert page here</div>
  </div>
  <div class="page-wrap rendered" data-page-num="1" data-original-page-num="1"
       data-scale="2.185" data-zoom="1" data-rotation="0">
    <canvas class="page" width="2600" height="3679" style="width:1300px;height:1839.61px">
    <div class="imageLayer">       <!-- boxes over images already in the PDF -->
    <div class="textLayer">        <!-- existing text as editable boxes + new text -->
    <div class="formLayer">        <!-- real <input>/<select>/<textarea> over form fields -->
    <div class="annotationLayer">  <!-- links, highlights, attachments -->
    <div class="drawLayer">        <!-- freehand drawing, lines, shapes -->
    <div class="guidesLayer">      <!-- alignment guides while dragging -->
  </div>
</div>
```

All six layers are exactly the size of the page (`width:1300px; height:1839.61px`), stacked on top of the canvas, so anything placed on a layer lines up with the PDF underneath.

## 3.3 Sizes and coordinates

What was measured with the blank A4 document at a 1440 px wide window ✅:

- An A4 page is 595 × 842 **points** (1 point = 1/72 inch).
- The page is shown 1300 CSS pixels wide, so `scale = 1300 / 595 = 2.185` (`data-scale`). Height = 842 × 2.185 = 1839.61 px.
- The canvas holds **twice** as many pixels (2600 × 3679) as it shows, so text stays sharp on high-resolution screens and when zoomed.

Turning a position on screen into a position in the PDF (⚠️ inferred formula; it's the standard pdf.js approach and matches the numbers above):

```
pdfX = cssX / scale
pdfY = pageHeightInPoints − (cssY / scale)     // PDF y counts up from the bottom
```

Zoom (`data-zoom`) and rotation (`data-rotation`) are stored per page. The editor refuses to rotate or zoom a page that already has edits ("Cannot rotate pages that have changes." / "Cannot zoom on pages that have changes." 📖), which keeps the maths simple: every edit on a page uses one fixed scale.

## 3.4 Drawing only what you can see

Pages are drawn **lazily** 📖: the code tracks which pages are in view (`isInViewport`, `scrollStopped`) and fires `requestRenderPages` / `doRenderPage`. A page goes through separate steps, each logged when done: draw the canvas → `renderTextTask` → `renderAnnotationsTask` → `renderFormTask`. If you click a page that isn't drawn yet: "Page is not yet rendered. Please wait…". After an edit only the canvas is re-drawn ("Re-rendering just the canvas").

## 3.5 Reading the existing text so it can be edited

pdf.js's `getTextContent()` returns every piece of text on a page with its position, size and font. The editor turns each piece into an HTML box on the text layer (`div[data-font-face]`), lined up exactly over the drawn text 📖. This is what makes "click any existing text to start editing" work.

Clean-up it does on the way 📖:
- **Joins and removes duplicates** ("stacked duplicate text items on page"; `flattenTextLayer`).
- **Measures fonts** with the browser's `measureText` (`actualBoundingBoxAscent/Descent`) so the editable box has the same height as the printed text.
- **Refuses tiny text**: "Text is too small to edit. Please zoom in and try again."

### Fonts when you edit existing text 📖

PDFs often contain only the letters they use (a "subset" font). So when you type new letters into existing text:
1. The editor finds the document's font (`findDocFont`, `getSubsetFontOriginalName`) and checks if it has the letters you typed.
2. If not, it switches to a similar font: "Original font replaced, was missing characters you typed." It picks a serif, sans-serif or monospace replacement to match (`isSerif`, `isMonospace`, `suggestedFont`).
3. Some styles can't be applied to embedded fonts: "This font (embedded in the document) does not support this style change. Try changing the font family."
4. Fonts you can choose come from `/css/pdf-editor/fonts.css`. Signature styles use handwriting fonts (Caveat, Dancing Script, Satisfy, Kristi, Norican, Zeyada, and others ✅ loaded in the recorded run).
5. Not supported: complex scripts (Arabic, Devanagari) and full right-to-left text ("Right to left scripts are not fully supported").

### Spotting scanned documents 📖

The shared script reads up to the first **10 pages** with `getTextContent()`. If none of them contain any real text, the document is treated as a scan (`markWholeDocAsScan`): you can still add text, images and so on, but you're told "Changing existing text inside scans not supported."

## 3.6 Existing images

Images already in the PDF get an invisible box on the image layer, labelled with the PDF's internal object number, for example `data-obj-id="11R"` (meaning object "11 0 R") ✅. The editor finds where each image is drawn by walking pdf.js's drawing instructions (`getOperatorList`, `imageCoordinates`, `imageObjIds` 📖). Deleting an existing image only sends that object id to the server (`deleteImageOperations`).
