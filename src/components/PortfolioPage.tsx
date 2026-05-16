import { useRef } from 'react'
import { motion, useInView } from 'framer-motion'
import { Canvas, useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { LiquidGlassCard, LiquidGlassPill, resetGlassSnapshot } from './LiquidGlass'

interface Props {
  onBack: () => void
  onEnterGym: () => void
}

const fadeUp = {
  initial: { opacity: 0, y: 36 },
  animate: { opacity: 1, y: 0 },
}
const ease = [0.16, 1, 0.3, 1] as const

function Section({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  const ref = useRef<HTMLElement>(null)
  const inView = useInView(ref, { once: true, margin: '-8%' })
  return (
    <motion.section
      ref={ref}
      className={`p-section ${className}`}
      initial={{ opacity: 0, y: 44 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.85, ease }}
    >
      {children}
    </motion.section>
  )
}

// Floating 3D wireframe icosahedron for the hero background
function FloatingMesh() {
  const mesh = useRef<THREE.Mesh>(null!)
  useFrame(({ clock }) => {
    const t = clock.elapsedTime
    mesh.current.rotation.x = t * 0.06
    mesh.current.rotation.y = t * 0.09
    mesh.current.position.y = Math.sin(t * 0.4) * 0.08
  })
  return (
    <mesh ref={mesh}>
      <icosahedronGeometry args={[1.2, 1]} />
      <meshStandardMaterial color="#c8d4dc" wireframe transparent opacity={0.18} />
    </mesh>
  )
}

const projects = [
  {
    num: '01',
    title: '3D Gym Portfolio',
    desc: 'An interactive, gamified personal site built in Three.js. Walk around a virtual gym and click equipment to explore sections.',
    tags: ['Three.js', 'WebGL', 'GLSL'],
  },
  {
    num: '02',
    title: 'Project Two',
    desc: 'A brief description of another project — what it does, what tech, what impact.',
    tags: ['React', 'Node.js', 'PostgreSQL'],
  },
  {
    num: '03',
    title: 'Project Three',
    desc: 'Another project description. Keep it concise and impact-oriented.',
    tags: ['Python', 'ML', 'FastAPI'],
  },
]

const skills = {
  Languages: ['JavaScript', 'TypeScript', 'Python', 'C++', 'SQL'],
  Frameworks: ['React', 'Node.js', 'Three.js', 'Next.js', 'FastAPI'],
  Platforms: ['AWS', 'Docker', 'Git', 'Linux', 'Vercel'],
}

export function PortfolioPage({ onBack, onEnterGym }: Props) {
  return (
    <div className="portfolio">
      {/* Sticky nav */}
      <nav className="p-nav">
        <button className="p-nav-back" onClick={onBack}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
          <span>Back</span>
        </button>
        <div className="p-nav-brand">DIMURAL MURAT</div>
        <button className="p-nav-gym" onClick={onEnterGym}>
          <span>3D Gym</span>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M5 12h14M13 5l7 7-7 7" />
          </svg>
        </button>
      </nav>

      {/* Scrollable body */}
      <div className="p-scroll">

        {/* Hero */}
        <section className="p-hero">
          {/* 3D background */}
          <div className="p-hero-3d" aria-hidden>
            <Canvas camera={{ position: [0, 0, 3.5], fov: 45 }} style={{ background: 'transparent' }}>
              <ambientLight intensity={0.6} />
              <directionalLight position={[3, 3, 3]} intensity={0.4} />
              <FloatingMesh />
            </Canvas>
          </div>

          <div className="p-hero-inner">
            <motion.span
              className="p-chip"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, ease }}
            >
              01 — HELLO
            </motion.span>
            <motion.h1
              className="p-hero-title"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.9, delay: 0.1, ease }}
            >
              I build things<br /><em>people feel.</em>
            </motion.h1>
            <motion.p
              className="p-hero-sub"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.3 }}
            >
              Software engineer, problem solver, and perpetual learner.<br />
              I love turning ambitious ideas into polished, performant products.
            </motion.p>
            <motion.div
              className="p-stats"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.45, ease }}
            >
              <div className="p-stat">
                <span className="p-stat-n">5+</span>
                <span className="p-stat-l">Years Coding</span>
              </div>
              <div className="p-stat-divider" />
              <div className="p-stat">
                <span className="p-stat-n">20+</span>
                <span className="p-stat-l">Projects Shipped</span>
              </div>
              <div className="p-stat-divider" />
              <div className="p-stat">
                <span className="p-stat-n">∞</span>
                <span className="p-stat-l">Cups of Coffee</span>
              </div>
            </motion.div>
          </div>
        </section>

        {/* About */}
        <Section>
          <span className="p-chip">02 — ABOUT</span>
          <h2 className="p-section-title">A bit about me.</h2>
          <div className="p-about-grid">
            <div className="p-about-text">
              <p>I'm Dimural — a software engineer passionate about building products that blend technical depth with thoughtful design. I'm drawn to problems where engineering craft and user experience intersect.</p>
              <p>Outside of code, you'll find me in the gym, watching Real Madrid, playing guitar, or hosting a board-game night.</p>
            </div>
            <LiquidGlassCard
              className="p-about-card"
              borderRadius={14}
              type="rounded"
              tintOpacity={0.18}
              innerStyle={{ display: 'flex', flexDirection: 'column', gap: '16px', padding: '28px' }}
            >
              <div className="about-row">
                <span>Based in</span><strong>—</strong>
              </div>
              <div className="about-row">
                <span>Focus</span><strong>Full-stack / 3D</strong>
              </div>
              <div className="about-row">
                <span>Stack</span><strong>TS · React · Node</strong>
              </div>
              <div className="about-row">
                <span>Status</span><strong className="p-accent-green">Open to work</strong>
              </div>
            </LiquidGlassCard>
          </div>
        </Section>

        {/* Experience */}
        <Section>
          <span className="p-chip">03 — EXPERIENCE</span>
          <h2 className="p-section-title">Where I've worked.</h2>
          <div className="p-timeline">
            <div className="p-time-item">
              <div className="p-time-year">Now</div>
              <div className="p-time-body">
                <h3>Software Engineer <span>— Company</span></h3>
                <p>Shipping features across the stack. Focused on performance and polish.</p>
              </div>
            </div>
            <div className="p-time-item">
              <div className="p-time-year">Prev</div>
              <div className="p-time-body">
                <h3>Previous Role <span>— Previous Co.</span></h3>
                <p>Built and maintained core features used by thousands of users.</p>
              </div>
            </div>
          </div>
        </Section>

        {/* Skills */}
        <Section>
          <span className="p-chip">04 — SKILLS</span>
          <h2 className="p-section-title">Tools of the trade.</h2>
          <div className="p-skills-grid">
            {Object.entries(skills).map(([cat, tags]) => (
              <div key={cat} className="p-skill-col">
                <h4 className="p-skill-cat">{cat}</h4>
                <div className="p-tags">
                  {tags.map(t => (
                    <LiquidGlassPill key={t} text={t} fontSize={12} tintOpacity={0.15} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </Section>

        {/* Projects */}
        <Section>
          <span className="p-chip">05 — WORK</span>
          <h2 className="p-section-title">Selected projects.</h2>
          <div className="p-projects">
            {projects.map((proj, i) => (
              <ProjectCard key={proj.num} {...proj} index={i} />
            ))}
          </div>
        </Section>

        {/* Memories */}
        <Section>
          <span className="p-chip">06 — MEMORIES</span>
          <h2 className="p-section-title">Polaroids<br />from the road.</h2>
          <div className="p-polaroids">
            {Array.from({ length: 8 }, (_, i) => (
              <div key={i} className="polaroid">
                <div className="polaroid-photo">
                  <img
                    src={`/images/polaroid-${i + 1}.png`}
                    alt=""
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none'
                    }}
                  />
                </div>
                <div className="polaroid-caption">polaroid-{i + 1}.png</div>
              </div>
            ))}
          </div>
        </Section>

        {/* Contact */}
        <Section className="p-contact-section">
          <span className="p-chip">07 — CONTACT</span>
          <h2 className="p-section-title">Let's build<br />something great.</h2>
          <div className="p-contact-body">
            <a href="mailto:dimural722@gmail.com" className="p-email-btn">
              <span>dimural722@gmail.com</span>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M7 17L17 7M7 7h10v10" />
              </svg>
            </a>
            <div className="p-contact-links">
              <a href="https://github.com" target="_blank" rel="noopener">GitHub ↗</a>
              <a href="https://linkedin.com" target="_blank" rel="noopener">LinkedIn ↗</a>
            </div>
          </div>
          <footer className="p-footer">© 2026 Dimural Murat — Built with care.</footer>
        </Section>

      </div>
    </div>
  )
}

function ProjectCard({ num, title, desc, tags, index }: { num: string; title: string; desc: string; tags: string[]; index: number }) {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, margin: '-5%' })

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 28 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.7, delay: index * 0.08, ease: [0.16, 1, 0.3, 1] }}
      whileHover={{ y: -3, transition: { duration: 0.2 } }}
    >
      <LiquidGlassCard
        className="p-project"
        borderRadius={14}
        type="rounded"
        tintOpacity={0.15}
        innerStyle={{ display: 'grid', gridTemplateColumns: '56px 1fr 40px', gap: '24px', padding: '28px', alignItems: 'center' }}
      >
        <div className="p-proj-num">{num}</div>
        <div className="p-proj-body">
          <h3>{title}</h3>
          <p>{desc}</p>
          <div className="p-tags">
            {tags.map(t => <span key={t} className="p-tag">{t}</span>)}
          </div>
        </div>
        <div className="p-proj-arrow">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M7 17L17 7M7 7h10v10" />
          </svg>
        </div>
      </LiquidGlassCard>
    </motion.div>
  )
}
