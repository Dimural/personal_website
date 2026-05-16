import { CSSProperties, useEffect, useRef } from 'react'

interface LiquidGlassCardProps {
  children: React.ReactNode
  borderRadius?: number
  type?: 'rounded' | 'circle' | 'pill'
  tintOpacity?: number
  /** Applied to the outer host div (sets position context, border-radius, overflow) */
  className?: string
  /** Applied to the inner content div — use for display/flex/grid/padding layout */
  innerStyle?: CSSProperties
}

export function resetGlassSnapshot() {
  if (typeof Container !== 'undefined') {
    Container.pageSnapshot = null
    Container.isCapturing = false
    Container.waitingForSnapshot = []
    Container.instances = []
  }
}

/**
 * Wraps children with a liquid glass background layer.
 * Children always render immediately in normal flow.
 * The WebGL glass canvas loads asynchronously as an absolute underlay (z-index: -1).
 */
export function LiquidGlassCard({
  children,
  borderRadius = 14,
  type = 'rounded',
  tintOpacity = 0.15,
  className,
  innerStyle,
}: LiquidGlassCardProps) {
  const hostRef = useRef<HTMLDivElement>(null)
  const instanceRef = useRef<Container | null>(null)

  useEffect(() => {
    if (!hostRef.current || typeof Container === 'undefined') return

    let c: Container
    try {
      c = new Container({ borderRadius, type, tintOpacity })
    } catch {
      return
    }

    instanceRef.current = c

    // Position glass canvas as an absolutely-filled underlay behind the content
    c.element.style.position = 'absolute'
    c.element.style.inset = '0'
    c.element.style.width = '100%'
    c.element.style.height = '100%'
    c.element.style.padding = '0'
    c.element.style.gap = '0'
    c.element.style.zIndex = '-1'
    c.element.style.pointerEvents = 'none'

    // Insert before the content div so it's behind it in DOM order too
    hostRef.current.insertBefore(c.element, hostRef.current.firstChild)

    const raf = requestAnimationFrame(() => {
      try { c.updateSizeFromDOM() } catch { /* ignore sizing errors */ }
    })

    return () => {
      cancelAnimationFrame(raf)
      c.element.remove()
      if (typeof Container !== 'undefined') {
        const idx = Container.instances.indexOf(c)
        if (idx > -1) Container.instances.splice(idx, 1)
      }
      instanceRef.current = null
    }
  }, [])

  return (
    <div ref={hostRef} className={className} style={{ position: 'relative' }}>
      <div style={{ position: 'relative', zIndex: 0, ...innerStyle }}>
        {children}
      </div>
    </div>
  )
}

interface LiquidGlassPillProps {
  text: string
  fontSize?: number
  tintOpacity?: number
}

export function LiquidGlassPill({ text, fontSize = 12, tintOpacity = 0.15 }: LiquidGlassPillProps) {
  const hostRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!hostRef.current || typeof Button === 'undefined') return

    let btn: Button
    try {
      btn = new Button({ text, size: fontSize, type: 'pill', tintOpacity })
    } catch {
      return
    }

    // Replace the fallback text span with the glass button
    const fallback = hostRef.current.querySelector('.lg-fallback')
    if (fallback) fallback.remove()
    hostRef.current.appendChild(btn.element)

    return () => {
      btn.element.remove()
      if (typeof Container !== 'undefined') {
        const idx = Container.instances.indexOf(btn)
        if (idx > -1) Container.instances.splice(idx, 1)
      }
    }
  }, [text, fontSize])

  return (
    <div ref={hostRef} style={{ display: 'inline-block' }}>
      <span className="p-tag lg-fallback">{text}</span>
    </div>
  )
}
