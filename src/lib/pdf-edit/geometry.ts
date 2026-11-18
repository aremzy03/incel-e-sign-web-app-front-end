export interface PdfBox {
  x: number
  y: number
  width: number
  height: number
}

export interface PageCssMetrics {
  pageWidthPt: number
  pageHeightPt: number
  pageCssWidth: number
  pageCssHeight: number
}

export function pageCssBoxToPdfPoints(box: PdfBox, metrics: PageCssMetrics): PdfBox {
  const scaleX = metrics.pageWidthPt / metrics.pageCssWidth
  const scaleY = metrics.pageHeightPt / metrics.pageCssHeight
  return {
    x: box.x * scaleX,
    y: box.y * scaleY,
    width: box.width * scaleX,
    height: box.height * scaleY,
  }
}

export function pdfPointsToPageCssBox(box: PdfBox, metrics: PageCssMetrics): PdfBox {
  const scaleX = metrics.pageWidthPt / metrics.pageCssWidth
  const scaleY = metrics.pageHeightPt / metrics.pageCssHeight
  return {
    x: box.x / scaleX,
    y: box.y / scaleY,
    width: box.width / scaleX,
    height: box.height / scaleY,
  }
}

export function pdfPointsToCssStyle(box: PdfBox, metrics: PageCssMetrics) {
  const next = pdfPointsToPageCssBox(box, metrics)
  return { left: next.x, top: next.y, width: next.width, height: next.height }
}

export function clampPdfFrame(
  box: PdfBox,
  pageWidthPt: number,
  pageHeightPt: number,
  minWidth = 24,
  minHeight = 12,
): PdfBox {
  let width = Math.min(Math.max(box.width, minWidth), pageWidthPt)
  let height = Math.min(Math.max(box.height, minHeight), pageHeightPt)
  let x = box.x
  let y = box.y
  if (x < 0) x = 0
  if (y < 0) y = 0
  if (x + width > pageWidthPt) x = Math.max(0, pageWidthPt - width)
  if (y + height > pageHeightPt) y = Math.max(0, pageHeightPt - height)
  if (x + width > pageWidthPt) width = pageWidthPt - x
  if (y + height > pageHeightPt) height = pageHeightPt - y
  return { x, y, width, height }
}
