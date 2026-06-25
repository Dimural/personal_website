import { useRef } from 'react'
import { motion, useInView } from 'framer-motion'
import { LiquidGlassCard, LiquidGlassPill } from './LiquidGlass'
import Antigravity from './Antigravity'
import CardSwap, { Card } from './CardSwap'
import Ferrofluid from './Ferrofluid'
import BorderGlow from './BorderGlow'

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
          {/* Interactive particle ring — follows the cursor */}
          <div className="p-hero-3d" aria-hidden>
            <Antigravity
              count={260}
              color="#1a3c28"
              particleSize={1.15}
              ringRadius={8}
              magnetRadius={9}
              waveAmplitude={1.1}
              waveSpeed={0.5}
              lerpSpeed={0.06}
              autoAnimate={true}
              particleShape="capsule"
            />
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
        <Section className="p-projects-section">
          <div className="p-projects-showcase">
            <div className="p-projects-intro">
              <span className="p-chip">05 — WORK</span>
              <h2 className="p-section-title">Selected projects.</h2>
              <p className="p-projects-lead">
                A rotating look at things I've built — each card is a project,
                from interactive 3D to full-stack systems.
              </p>
              <span className="p-projects-hint">Hover to hold a card · they swap on their own</span>
            </div>

            <div className="p-projects-stage" aria-hidden>
              <CardSwap
                width={420}
                height={290}
                cardDistance={52}
                verticalDistance={60}
                delay={4200}
                pauseOnHover
                skewAmount={5}
                easing="elastic"
              >
                {projects.map(proj => (
                  <Card key={proj.num} customClass="proj-card">
                    <div className="proj-card-top">
                      <span className="proj-card-num">{proj.num}</span>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M7 17L17 7M7 7h10v10" />
                      </svg>
                    </div>
                    <h3>{proj.title}</h3>
                    <p>{proj.desc}</p>
                    <div className="proj-card-tags">
                      {proj.tags.map(t => <span key={t}>{t}</span>)}
                    </div>
                  </Card>
                ))}
              </CardSwap>
            </div>
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

        {/* Contact — dark finale */}
        <Section className="p-contact-section">
          <div className="p-contact-fluid" aria-hidden>
            <Ferrofluid
              colors={['#2a5c3c', '#6aa0b0', '#e8eee6']}
              speed={0.42}
              scale={1.5}
              turbulence={1}
              fluidity={0.12}
              rimWidth={0.22}
              sharpness={2.6}
              shimmer={1.4}
              glow={2}
              flowDirection="up"
              opacity={0.9}
            />
          </div>

          <div className="p-contact-inner">
            <BorderGlow
              className="p-contact-card"
              backgroundColor="#0e1410"
              glowColor="150 45 60"
              colors={['#6aa0b0', '#c4d8e8', '#e8eee6']}
              borderRadius={24}
              glowRadius={50}
              glowIntensity={1.1}
              edgeSensitivity={28}
            >
              <span className="p-chip">07 — CONTACT</span>
              <h2 className="p-section-title">Let's build<br />something great.</h2>
              <p className="p-contact-note">
                I'm open to new roles and collaborations. The fastest way to
                reach me is email — I read everything.
              </p>
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
            </BorderGlow>

            <footer className="p-footer">© 2026 Dimural Murat — Built with care.</footer>
          </div>
        </Section>

      </div>
    </div>
  )
}
