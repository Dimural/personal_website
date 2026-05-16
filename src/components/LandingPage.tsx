import { useEffect, useState } from 'react'
import { motion, useScroll, useTransform } from 'framer-motion'
// @ts-ignore
import { ShaderGradient, ShaderGradientCanvas } from '@shadergradient/react'

interface Props {
  onEnterPortfolio: () => void
  onEnterGym: () => void
}

const ease = [0.16, 1, 0.3, 1] as const

const stagger = {
  container: {
    animate: { transition: { staggerChildren: 0.12, delayChildren: 0.15 } },
  },
  item: {
    initial: { opacity: 0, y: 22 },
    animate: { opacity: 1, y: 0, transition: { duration: 0.85, ease } },
  },
}

export function LandingPage({ onEnterPortfolio, onEnterGym }: Props) {
  const { scrollY } = useScroll()

  // Parallax: content drifts up and fades as you scroll into portfolio
  const contentY = useTransform(scrollY, [0, 500], [0, -72])
  const contentOpacity = useTransform(scrollY, [0, 380], [1, 0])
  const scrollCueOpacity = useTransform(scrollY, [0, 160], [1, 0])

  return (
    <div className="landing">
      {/* Living gradient background */}
      <div className="landing-gradient-wrap" aria-hidden>
        <ShaderGradientCanvas
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}
          pointerEvents="none"
        >
          <ShaderGradient
            type="waterPlane"
            animate="on"
            uSpeed={0.08}
            uStrength={1.6}
            uDensity={1.4}
            uFrequency={5.5}
            color1="#ede8df"
            color2="#c2d8e8"
            color3="#f5f5f0"
            rotationX={50}
            rotationY={0}
            rotationZ={-60}
            positionX={0}
            positionY={0}
            positionZ={0}
            cAzimuthAngle={180}
            cPolarAngle={90}
            cDistance={2.8}
            grain="on"
            lightType="3d"
            envPreset="city"
            reflection={0.08}
          />
        </ShaderGradientCanvas>
      </div>

      {/* Minimal floating nav */}
      <motion.div
        className="l-nav"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1, delay: 0.2 }}
      >
        <span className="l-nav-mark">D · M</span>
        <div className="l-nav-links">
          <button className="l-nav-link" onClick={onEnterPortfolio}>Portfolio</button>
          <button className="l-nav-link" onClick={onEnterGym}>Gym ↗</button>
        </div>
      </motion.div>

      {/* Main — parallax wrapper */}
      <motion.main
        className="l-main"
        style={{ y: contentY, opacity: contentOpacity }}
      >
        <motion.div
          className="l-logo-wrap"
          initial={{ opacity: 0, scale: 0.88 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1.1, ease }}
        >
          <LiquidLogoMark />
        </motion.div>

        <motion.div
          className="l-text"
          variants={stagger.container}
          initial="initial"
          animate="animate"
        >
          <motion.p className="l-eyebrow" variants={stagger.item}>
            Software Engineer
          </motion.p>
          <motion.h1 className="l-name" variants={stagger.item}>
            <span>Dimural</span>
            <em>Murat</em>
          </motion.h1>
          <motion.p className="l-tagline" variants={stagger.item}>
            Building immersive digital experiences at the<br />intersection of design, code, and craft.
          </motion.p>
        </motion.div>

        <motion.div
          className="l-actions"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.55, ease }}
        >
          <button className="l-cta-primary" onClick={onEnterPortfolio}>
            View Portfolio
          </button>
          <button className="l-cta-secondary" onClick={onEnterGym}>
            <span>Enter the Gym</span>
            <ArrowRight />
          </button>
        </motion.div>
      </motion.main>

      {/* Scroll cue */}
      <motion.div className="l-scroll-cue" style={{ opacity: scrollCueOpacity }}>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.4, duration: 0.8 }}
        >
          <div className="l-scroll-line">
            <div className="l-scroll-dot" />
          </div>
        </motion.div>
      </motion.div>
    </div>
  )
}

function LiquidLogoMark() {
  return (
    <div className="liquid-mark">
      <svg className="liquid-blob" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <radialGradient id="blob-grad" cx="35%" cy="35%" r="65%">
            <stop offset="0%" stopColor="#f0ece4" />
            <stop offset="60%" stopColor="#d4e4f0" />
            <stop offset="100%" stopColor="#c8d8e8" />
          </radialGradient>
        </defs>
        <path
          className="blob-path"
          fill="url(#blob-grad)"
          d="M 44.3,-58.3 C 56.9,-47.9 65.8,-33.2 68.6,-17.4 C 71.4,-1.6 68.1,15.4 59.8,28.5 C 51.6,41.6 38.4,50.9 23.7,56.8 C 9,62.7 -7.1,65.2 -21.8,60.5 C -36.5,55.8 -49.8,43.9 -57.8,29.2 C -65.8,14.5 -68.5,-3 -64.1,-18.3 C -59.7,-33.6 -48.2,-46.7 -34.4,-56.5 C -20.6,-66.3 -4.5,-72.8 10.3,-71.7 C 25.1,-70.6 31.7,-68.7 44.3,-58.3 Z"
          transform="translate(100 100)"
        />
      </svg>
      <span className="liquid-mark-text">DM</span>
    </div>
  )
}

function ArrowRight() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 12h14M13 5l7 7-7 7" />
    </svg>
  )
}
