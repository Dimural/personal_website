import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'

interface LiquidGlassCardProps {
  children: React.ReactNode
  borderRadius?: number
  type?: 'rounded' | 'circle' | 'pill'
  tintOpacity?: number
  className?: string
}

// Reset static snapshot cache so a fresh capture is taken when the portfolio mounts.
export function resetGlassSnapshot() {
  if (typeof Container !== 'undefined') {
    Container.pageSnapshot = null
    Container.isCapturing = false
    Container.waitingForSnapshot = []
    Container.instances = []
  }
}

export function LiquidGlassCard({
  children,
  borderRadius = 14,
  type = 'rounded',
  tintOpacity = 0.15,
  className,
}: LiquidGlassCardProps) {
  const hostRef = useRef<HTMLDivElement>(null)
  const [glassEl, setGlassEl] = useState<HTMLElement | null>(null)
  const instanceRef = useRef<Container | null>(null)

  useEffect(() => {
    if (!hostRef.current || typeof Container === 'undefined') return

    const c = new Container({ borderRadius, type, tintOpacity })
    instanceRef.current = c

    // Apply our CSS class to the library element so our layout styles take over.
    // glass.css and our index.css both use single-class selectors; Vite injects
    // our CSS after glass.css so our rules win in the cascade.
    if (className) {
      className.trim().split(/\s+/).forEach(cls => c.element.classList.add(cls))
    }

    // Ensure the element fills its parent's width like a normal block
    c.element.style.width = '100%'

    hostRef.current.appendChild(c.element)

    // Recalculate size after layout settles
    const raf = requestAnimationFrame(() => c.updateSizeFromDOM())
    setGlassEl(c.element)

    return () => {
      cancelAnimationFrame(raf)
      setGlassEl(null)
      c.element.remove()
      const idx = Container.instances.indexOf(c)
      if (idx > -1) Container.instances.splice(idx, 1)
      instanceRef.current = null
    }
  }, [])

  // display: contents removes the host div from the layout flow.
  // The glass-container child participates directly in the parent's layout context.
  return (
    <div ref={hostRef} style={{ display: 'contents' }}>
      {glassEl && createPortal(children, glassEl)}
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

    const btn = new Button({ text, size: fontSize, type: 'pill', tintOpacity })
    hostRef.current.appendChild(btn.element)

    return () => {
      btn.element.remove()
      const idx = Container.instances.indexOf(btn)
      if (idx > -1) Container.instances.splice(idx, 1)
    }
  }, [text, fontSize])

  return <div ref={hostRef} style={{ display: 'contents' }} />
}
