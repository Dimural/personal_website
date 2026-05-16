import { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
// @ts-ignore
import { ShaderGradient, ShaderGradientCanvas } from '@shadergradient/react'

interface Props {
  onEnterPortfolio: () => void
  onEnterGym: () => void
}

const stagger = {
  container: {
    animate: { transition: { staggerChildren: 0.12, delayChildren: 0.1 } },
  },
  item: {
    initial: { opacity: 0, y: 22 },
    animate: { opacity: 1, y: 0, transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] } },
  },
}

export function LandingPage({ onEnterPortfolio, onEnterGym }: Props) {
  const [time, setTime] = useState('')
  const logoRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const tick = () => {
      const d = new Date()
      const p = (n: number) => String(n).padStart(2, '0')
      setTime(`${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`)
    }
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [])

  return (
    <div className="landing">
      {/* Shader gradient — living background */}
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

      {/* Nav */}
      <motion.nav
        className="l-nav"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
      >
        <div className="l-nav-logo">
          <span className="l-nav-mark">DM</span>
        </div>
        <div className="l-nav-status">
          <span className="l-status-dot" />
          <span className="l-status-text">Available for work</span>
        </div>
        <div className="l-nav-meta">PORTFOLIO / 2026</div>
      </motion.nav>

      {/* Main content */}
      <main className="l-main">
        {/* Liquid logo mark */}
        <motion.div
          ref={logoRef}
          className="l-logo-wrap"
          initial={{ opacity: 0, scale: 0.85 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1.1, ease: [0.16, 1, 0.3, 1] }}
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
          transition={{ duration: 0.8, delay: 0.55, ease: [0.16, 1, 0.3, 1] }}
        >
          <button className="l-cta-primary" onClick={onEnterPortfolio}>
            View Portfolio
          </button>
          <button className="l-cta-secondary" onClick={onEnterGym}>
            <span>Enter the Gym</span>
            <ArrowRight />
          </button>
        </motion.div>
      </main>

      {/* Footer */}
      <motion.footer
        className="l-footer"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8, delay: 0.7 }}
      >
        <div className="l-socials">
          <a href="https://github.com" target="_blank" rel="noopener" className="l-social">GitHub</a>
          <span className="l-social-dot" />
          <a href="https://linkedin.com" target="_blank" rel="noopener" className="l-social">LinkedIn</a>
          <span className="l-social-dot" />
          <a href="mailto:dimural722@gmail.com" className="l-social">Email</a>
        </div>
        <div className="l-clock">{time}</div>
      </motion.footer>
    </div>
  )
}

// Liquid morphing logo — CSS-animated SVG blob with "DM" inside
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
          <filter id="blob-blur">
            <feGaussianBlur stdDeviation="0" />
          </filter>
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
