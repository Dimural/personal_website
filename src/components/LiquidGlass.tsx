import { CSSProperties } from 'react'

interface LiquidGlassCardProps {
  children: React.ReactNode
  borderRadius?: number
  type?: 'rounded' | 'circle' | 'pill'
  tintOpacity?: number
  className?: string
  innerStyle?: CSSProperties
}

// Kept as no-op so call sites don't need to change
export function resetGlassSnapshot() {}

export function LiquidGlassCard({
  children,
  borderRadius = 16,
  className,
  innerStyle,
}: LiquidGlassCardProps) {
  return (
    <div
      className={className}
      style={{
        borderRadius: `${borderRadius}px`,
        background: 'linear-gradient(155deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.018) 100%)',
        backdropFilter: 'blur(18px) saturate(1.15)',
        WebkitBackdropFilter: 'blur(18px) saturate(1.15)',
        border: '1px solid rgba(255,255,255,0.08)',
        boxShadow: [
          'inset 0 1px 0 rgba(255,255,255,0.06)',
          '0 24px 60px -32px rgba(0,0,0,0.7)',
        ].join(', '),
        padding: '6px 26px',
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
        background: 'rgba(255,255,255,0.04)',
        backdropFilter: 'blur(10px) saturate(1.2)',
        WebkitBackdropFilter: 'blur(10px) saturate(1.2)',
        border: '1px solid rgba(255,255,255,0.08)',
        fontSize: `${fontSize}px`,
        fontWeight: 500,
        color: 'var(--text-dim)',
        fontFamily: 'inherit',
        letterSpacing: '0.2px',
      }}
    >
      {text}
    </span>
  )
}
