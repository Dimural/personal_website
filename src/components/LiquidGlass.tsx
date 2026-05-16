import { CSSProperties } from 'react'

interface LiquidGlassCardProps {
  children: React.ReactNode
  borderRadius?: number
  type?: 'rounded' | 'circle' | 'pill'
  tintOpacity?: number
  className?: string
  innerStyle?: CSSProperties
}

// Kept as no-op so App.tsx call site doesn't need to change
export function resetGlassSnapshot() {}

export function LiquidGlassCard({
  children,
  borderRadius = 14,
  className,
  innerStyle,
}: LiquidGlassCardProps) {
  return (
    <div
      className={className}
      style={{
        borderRadius: `${borderRadius}px`,
        background: 'linear-gradient(145deg, rgba(255,255,255,0.88) 0%, rgba(250,250,247,0.74) 100%)',
        backdropFilter: 'blur(22px) saturate(1.5) brightness(1.02)',
        WebkitBackdropFilter: 'blur(22px) saturate(1.5) brightness(1.02)',
        border: '1px solid rgba(255,255,255,0.58)',
        boxShadow: [
          'inset 0 1px 0 rgba(255,255,255,0.92)',
          'inset 0 -1px 0 rgba(0,0,0,0.025)',
          '0 1px 2px rgba(0,0,0,0.04)',
          '0 8px 32px rgba(0,0,0,0.065)',
        ].join(', '),
      }}
    >
      <div style={innerStyle}>{children}</div>
    </div>
  )
}

interface LiquidGlassPillProps {
  text: string
  fontSize?: number
  tintOpacity?: number
}

export function LiquidGlassPill({ text, fontSize = 12 }: LiquidGlassPillProps) {
  return (
    <span
      style={{
        display: 'inline-block',
        padding: '6px 13px',
        borderRadius: '100px',
        background: 'rgba(255,255,255,0.72)',
        backdropFilter: 'blur(10px) saturate(1.3)',
        WebkitBackdropFilter: 'blur(10px) saturate(1.3)',
        border: '1px solid rgba(255,255,255,0.55)',
        boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.9), 0 1px 3px rgba(0,0,0,0.05)',
        fontSize: `${fontSize}px`,
        fontWeight: 500,
        color: 'var(--ink-dim)',
        fontFamily: 'inherit',
        letterSpacing: '0.2px',
      }}
    >
      {text}
    </span>
  )
}
