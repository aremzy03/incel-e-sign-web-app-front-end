'use client'

import { useCallback, useRef, useState } from 'react'
import type { PageDimEntry, PageDimsByDoc } from './types'

export function useSigningCoordinates() {
  const pageContainersRef = useRef<Record<string, Record<number, HTMLDivElement | null>>>({})
  const [pageDims, setPageDims] = useState<PageDimsByDoc>({})

  const setPageContainerRef = useCallback((docId: string, pageNo: number) => (el: HTMLDivElement | null) => {
    if (!pageContainersRef.current[docId]) pageContainersRef.current[docId] = {}
    pageContainersRef.current[docId][pageNo] = el
  }, [])

  const measurePageCanvas = useCallback((docId: string, pageNo: number) => {
    const container = pageContainersRef.current[docId]?.[pageNo]
    if (!container) return
    requestAnimationFrame(() => {
      const canvas = container.querySelector('canvas') as HTMLCanvasElement | null
      if (!canvas) return
      const widthPx = canvas.clientWidth || 0
      const heightPx = canvas.clientHeight || 0
      setPageDims((prev) => {
        const prevDoc = prev[docId] || {}
        const prevPage = prevDoc[pageNo] || { widthPt: 0, heightPt: 0, widthPx: 0, heightPx: 0 }
        return {
          ...prev,
          [docId]: {
            ...prevDoc,
            [pageNo]: { ...prevPage, widthPx, heightPx },
          },
        }
      })
    })
  }, [])

  const setPageDimensions = useCallback(
    (docId: string, pageNo: number, widthPt: number, heightPt: number, widthPx?: number, heightPx?: number) => {
      setPageDims((prev) => ({
        ...prev,
        [docId]: {
          ...(prev[docId] || {}),
          [pageNo]: {
            widthPt,
            heightPt,
            widthPx: widthPx ?? prev[docId]?.[pageNo]?.widthPx ?? 0,
            heightPx: heightPx ?? prev[docId]?.[pageNo]?.heightPx ?? 0,
          },
        },
      }))
    },
    [],
  )

  const setDocumentNumPages = useCallback((docId: string, numPages: number) => {
    setPageDims((prev) => ({
      ...prev,
      [docId]: {
        numPages,
        ...(prev[docId] || {}),
      },
    }))
  }, [])

  const getPageDims = useCallback(
    (docId: string, pageNo: number): PageDimEntry | undefined => pageDims[docId]?.[pageNo],
    [pageDims],
  )

  return {
    pageDims,
    pageContainersRef,
    setPageContainerRef,
    measurePageCanvas,
    setPageDimensions,
    setDocumentNumPages,
    getPageDims,
  }
}
