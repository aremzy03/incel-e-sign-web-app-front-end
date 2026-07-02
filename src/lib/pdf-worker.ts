'use client'

/**
 * Configure pdf.js worker once for all react-pdf viewers.
 *
 * Uses the static copy in /public (synced from pdfjs-dist on postinstall).
 * Next.js Webpack cannot resolve pdfjs-dist via import.meta.url without extra
 * bundler config, so the public path is the reliable option here.
 */
import { pdfjs } from 'react-pdf'

const PUBLIC_WORKER_PATH = '/pdf.worker.min.mjs'

function resolvePdfWorkerSrc(): string {
  if (typeof window !== 'undefined') {
    return `${window.location.origin}${PUBLIC_WORKER_PATH}`
  }
  return PUBLIC_WORKER_PATH
}

if (!pdfjs.GlobalWorkerOptions.workerSrc) {
  pdfjs.GlobalWorkerOptions.workerSrc = resolvePdfWorkerSrc()
}

export { pdfjs }
