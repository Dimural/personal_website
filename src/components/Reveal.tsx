import { useRef } from 'react'
import { motion, useInView, useReducedMotion } from 'framer-motion'

const ease = [0.16, 1, 0.3, 1] as const

/** A line of text that slides up out of a clipping mask. */
export function MaskLine({
  children,
  delay = 0,
  className = '',
  inView = false,
}: {
  children: React.ReactNode
  delay?: number
  className?: string
  inView?: boolean
}) {
  const reduce = useReducedMotion()
  const ref = useRef<HTMLSpanElement>(null)
  const seen = useInView(ref, { once: true, margin: '-8%' })
  const shown = inView ? seen : true

  return (
    <span ref={ref} className={`mask-line ${className}`}>
      <motion.span
        className="mask-line-inner"
        initial={reduce ? false : { y: '112%' }}
        animate={shown ? { y: '0%' } : {}}
        transition={{ duration: 1.05, delay, ease }}
      >
        {children}
      </motion.span>
    </span>
  )
}

/** Section wrapper with a soft rise-in on first view. */
export function Section({
  children,
  className = '',
  id,
}: {
  children: React.ReactNode
  className?: string
  id?: string
}) {
  const ref = useRef<HTMLElement>(null)
  const inView = useInView(ref, { once: true, margin: '-12%' })
  const reduce = useReducedMotion()

  return (
    <motion.section
      ref={ref}
      id={id}
      className={`section ${className}`}
      initial={reduce ? false : { opacity: 0, y: 32 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.8, ease }}
    >
      {children}
    </motion.section>
  )
}
