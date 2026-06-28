import { useRef } from 'react'
import { motion, useInView } from 'framer-motion'
import { LiquidGlassCard } from './LiquidGlass'
import CardSwap, { Card } from './CardSwap'
import BorderGlow from './BorderGlow'

interface Props {
  onEnterGym: () => void
}

const ease = [0.16, 1, 0.3, 1] as const

function Section({ children, className = '', id }: { children: React.ReactNode; className?: string; id?: string }) {
  const ref = useRef<HTMLElement>(null)
  const inView = useInView(ref, { once: true, margin: '-12%' })
  return (
    <motion.section
      ref={ref}
      id={id}
      className={`section ${className}`}
      initial={{ opacity: 0, y: 36 }}
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
    desc: 'An interactive, gamified personal site built in Three.js — walk a virtual gym and click equipment to explore each section.',
    tags: ['Three.js', 'WebGL', 'GLSL'],
  },
  {
    num: '02',
    title: 'Project Two',
    desc: 'A brief description of another project — what it does, the stack behind it, and the impact it had.',
    tags: ['React', 'Node.js', 'PostgreSQL'],
  },
  {
    num: '03',
    title: 'Project Three',
    desc: 'Another concise, impact-oriented description of something built end to end.',
    tags: ['Python', 'ML', 'FastAPI'],
  },
]

const skills = {
  Languages: ['TypeScript', 'JavaScript', 'Python', 'C++', 'SQL'],
  Frameworks: ['React', 'Node.js', 'Three.js', 'Next.js', 'FastAPI'],
  Platforms: ['AWS', 'Docker', 'Git', 'Linux', 'Vercel'],
}

export function PortfolioPage({ onEnterGym }: Props) {
  return (
    <main className="page" id="work">

      {/* About ---------------------------------------------------- */}
      <Section>
        <div className="section-head">
          <span className="label"><span className="label-accent">01</span> &nbsp;— &nbsp;About</span>
          <h2 className="section-title">A quiet obsession<br />with the details.</h2>
        </div>
        <div className="about-grid">
          <div className="about-prose">
            <p>I'm Dimural — a software engineer drawn to problems where engineering craft and user experience intersect.</p>
            <p>I like turning ambitious ideas into polished, performant products. Off the keyboard you'll find me in the gym, watching Real Madrid, or playing guitar.</p>
          </div>
          <LiquidGlassCard className="about-card" borderRadius={18}>
            <div className="about-row"><span>Focus</span><strong>Full-stack · 3D</strong></div>
            <div className="about-row"><span>Stack</span><strong>TS · React · Node</strong></div>
            <div className="about-row"><span>Based in</span><strong>—</strong></div>
            <div className="about-row"><span>Status</span><strong className="is-open">Open to work</strong></div>
          </LiquidGlassCard>
        </div>
      </Section>

      <div className="rule" />

      {/* Work ----------------------------------------------------- */}
      <Section>
        <div className="work-grid">
          <div className="work-intro">
            <span className="label"><span className="label-accent">02</span> &nbsp;— &nbsp;Work</span>
            <h2 className="section-title">Selected<br />projects.</h2>
            <p className="lead">A rotating look at things I've built — from interactive 3D to full-stack systems.</p>
            <span className="work-hint">Hover to hold a card · they swap on their own</span>
          </div>
          <div className="work-stage" aria-hidden>
            <CardSwap
              width={400}
              height={280}
              cardDistance={50}
              verticalDistance={58}
              delay={4200}
              pauseOnHover
              skewAmount={4}
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

      <div className="rule" />

      {/* Skills --------------------------------------------------- */}
      <Section>
        <div className="section-head">
          <span className="label"><span className="label-accent">03</span> &nbsp;— &nbsp;Skills</span>
          <h2 className="section-title">Tools of the trade.</h2>
        </div>
        <div className="skills-grid">
          {Object.entries(skills).map(([cat, items]) => (
            <div key={cat} className="skill-col">
              <h4 className="skill-cat">{cat}</h4>
              <div className="skill-list">
                {items.map(s => <span key={s}>{s}</span>)}
              </div>
            </div>
          ))}
        </div>
      </Section>

      {/* Contact -------------------------------------------------- */}
      <section className="contact" id="contact">
        <div className="contact-wrap">
          <BorderGlow
            className="contact-card"
            backgroundColor="#101a14"
            glowColor="155 50 55"
            colors={['#2f6f54', '#3c7d74', '#557a9e']}
            borderRadius={24}
            glowRadius={48}
            glowIntensity={1.0}
            edgeSensitivity={26}
            animated
          >
            <span className="label"><span className="label-accent">04</span> &nbsp;— &nbsp;Contact</span>
            <h2 className="contact-title">Let's build<br />something good.</h2>
            <p className="contact-note">
              I'm open to new roles and collaborations. Email is the fastest way
              to reach me — I read everything.
            </p>
            <a href="mailto:dimural722@gmail.com" className="email-btn">
              <span>dimural722@gmail.com</span>
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M7 17L17 7M7 7h10v10" />
              </svg>
            </a>
            <div className="contact-links">
              <a href="https://github.com" target="_blank" rel="noopener">GitHub ↗</a>
              <a href="https://linkedin.com" target="_blank" rel="noopener">LinkedIn ↗</a>
              <button className="contact-links-btn" onClick={onEnterGym} style={{ color: 'inherit' }}>3D Gym ↗</button>
            </div>
          </BorderGlow>

          <footer className="footer">
            <span>© 2026 Dimural Murat</span>
            <span>Built with care.</span>
          </footer>
        </div>
      </section>

    </main>
  )
}
