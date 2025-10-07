declare module 'react-signature-canvas' {
  import * as React from 'react'

  export interface SignatureCanvasProps {
    canvasProps?: React.CanvasHTMLAttributes<HTMLCanvasElement>
    backgroundColor?: string
    penColor?: string
    velocityFilterWeight?: number
    minWidth?: number
    maxWidth?: number
    dotSize?: number
    throttle?: number
    onBegin?: () => void
    onEnd?: () => void
    clearOnResize?: boolean
  }

  export default class SignatureCanvas extends React.Component<SignatureCanvasProps> {
    clear(): void
    isEmpty(): boolean
    getTrimmedCanvas(): HTMLCanvasElement
  }
}









