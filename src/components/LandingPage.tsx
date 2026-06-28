import { motion } from 'framer-motion'
import Aurora from './Aurora'

interface Props {
  onEnterPortfolio: () => void
  onEnterGym: () => void
}

const ease = [0.16, 1, 0.3, 1] as const

const stagger = {
  container: { animate: { transition: { staggerChildren: 0.1, delayChildren: 0.2 } } },
  item: {
    initial: { opacity: 0, y: 24 },
    animate: { opacity: 1, y: 0, transition: { duration: 0.95, ease } },
  },
}

export function LandingPage({ onEnterPortfolio, onEnterGym }: Props) {
  return (
    <header className="hero">
      <div className="hero-aurora" aria-hidden>
        <Aurora
          colorStops={['#2f6f54', '#3c7d74', '#557a9e']}
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
        transition={{ duration: 0.9, delay: 0.15, ease }}
      >
        <span className="nav-mark">DM</span>
        <div className="nav-links">
          <button className="nav-link" onClick={onEnterPortfolio}>Work</button>
          <button className="nav-link" onClick={onEnterGym}>Gym ↗</button>
        </div>
      </motion.nav>

      <motion.div
        className="hero-inner"
        variants={stagger.container}
        initial="initial"
        animate="animate"
      >
        <motion.div className="hero-eyebrow" variants={stagger.item}>
          <span className="dot" />
          <span>Software Engineer</span>
        </motion.div>

        <motion.h1 className="hero-title" variants={stagger.item}>
          Dimural<br />
          <span className="line2">Murat</span>
        </motion.h1>

        <motion.p className="hero-tagline" variants={stagger.item}>
          I build considered, tactile digital experiences — where engineering
          craft and design quietly meet.
        </motion.p>

        <motion.div className="hero-actions" variants={stagger.item}>
          <button className="btn btn-primary" onClick={onEnterPortfolio}>
            View Work
            <ArrowRight />
          </button>
          <button className="btn btn-ghost" onClick={onEnterGym}>
            Enter the Gym
            <ArrowUpRight />
          </button>
        </motion.div>
      </motion.div>

      <motion.div
        className="hero-scroll"
        aria-hidden
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.5, duration: 1 }}
      >
        <div className="rail" />
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
