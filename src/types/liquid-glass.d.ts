interface ContainerOptions {
  borderRadius?: number
  type?: 'rounded' | 'circle' | 'pill'
  tintOpacity?: number
}

interface ButtonOptions extends ContainerOptions {
  text?: string
  size?: number
  onClick?: (text: string) => void
  warp?: boolean
}

declare class Container {
  element: HTMLElement
  canvas: HTMLCanvasElement
  width: number
  height: number
  static pageSnapshot: HTMLCanvasElement | null
  static instances: Container[]
  static isCapturing: boolean
  static waitingForSnapshot: Container[]
  constructor(options?: ContainerOptions)
  addChild(child: Button): Button
  removeChild(child: Button): void
  updateSizeFromDOM(): void
  render?: () => void
}

declare class Button extends Container {
  constructor(options?: ButtonOptions)
}

interface Window {
  glassControls?: {
    edgeIntensity?: number
    rimIntensity?: number
    blurRadius?: number
    tintOpacity?: number
    cornerBoost?: number
    rippleEffect?: number
    baseIntensity?: number
    edgeDistance?: number
    rimDistance?: number
    baseDistance?: number
  }
}
