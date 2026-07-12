import { useRef } from 'react'
import { motion, useReducedMotion, useScroll, useTransform } from 'framer-motion'
import Aurora from './Aurora'
import { MaskLine } from './Reveal'

interface Props {
  onEnterPortfolio: () => void
  onEnterGym: () => void
}

const ease = [0.16, 1, 0.3, 1] as const

export function LandingPage({ onEnterPortfolio, onEnterGym }: Props) {
  const heroRef = useRef<HTMLElement>(null)
  const reduce = useReducedMotion()

  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ['start start', 'end start'],
  })
  const y = useTransform(scrollYProgress, [0, 1], [0, 140])
  const opacity = useTransform(scrollYProgress, [0, 0.85], [1, 0])

  return (
    <header className="hero" ref={heroRef}>
      <div className="hero-aurora" aria-hidden>
        <Aurora
          colorStops={['#6f5230', '#8a6a3e', '#7a5158']}
          amplitude={0.85}
          blend={0.42}
          speed={0.28}
        />
      </div>
      <div className="hero-veil" aria-hidden />

      <motion.nav
        className="nav"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.9, delay: 0.2, ease }}
      >
        <span className="nav-mark">DM</span>
        <div className="nav-links">
          <button className="nav-link" onClick={onEnterPortfolio}>Work</button>
          <a className="nav-link" href="#contact">Contact</a>
          <button className="nav-link" onClick={onEnterGym}>Gym ↗</button>
        </div>
      </motion.nav>

      <motion.div
        className="hero-inner"
        style={reduce ? undefined : { y, opacity }}
      >
        <motion.div
          className="hero-topline"
          initial={reduce ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 0.9, ease }}
        >
          <span>Software Engineer</span>
          <span className="hero-topline-right">Open to work</span>
        </motion.div>

        <h1 className="hero-title">
          <MaskLine delay={0.15}>Dimural</MaskLine>
          <MaskLine delay={0.28} className="hero-title-line2">Murat</MaskLine>
        </h1>

        <motion.div
          className="hero-foot"
          initial={reduce ? false : { opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, delay: 0.75, ease }}
        >
          <p className="hero-tagline">
            I build interactive things for the web, from full-stack products
            to real-time 3D you can walk around in.
          </p>
          <div className="hero-actions">
            <button className="btn btn-primary" onClick={onEnterPortfolio}>
              View Work
              <ArrowRight />
            </button>
            <button className="btn btn-ghost" onClick={onEnterGym}>
              Enter the Gym
              <ArrowUpRight />
            </button>
          </div>
        </motion.div>
      </motion.div>
    </header>
  )
}

function ArrowRight() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 12h14M13 5l7 7-7 7" />
    </svg>
  )
}

function ArrowUpRight() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M7 17L17 7M7 7h10v10" />
    </svg>
  )
}
