import { LiquidGlassCard } from './LiquidGlass'
import { MaskLine, Section } from './Reveal'

interface Props {
  onEnterGym: () => void
}

const projects = [
  {
    num: '01',
    title: '3D Gym Portfolio',
    desc: 'A gamified personal site built in Three.js. Walk around a virtual gym and click the equipment to explore each section.',
    tags: ['Three.js', 'WebGL', 'GLSL'],
    action: 'gym' as const,
  },
  {
    num: '02',
    title: 'Project Two',
    desc: 'A brief description of another project: what it does, the stack behind it, and the impact it had.',
    tags: ['React', 'Node.js', 'PostgreSQL'],
  },
  {
    num: '03',
    title: 'Project Three',
    desc: 'Another concise, impact-oriented description of something built end to end.',
    tags: ['Python', 'ML', 'FastAPI'],
  },
]

const tools = [
  'TypeScript', 'React', 'Three.js', 'WebGL', 'Node.js', 'Python',
  'C++', 'Next.js', 'FastAPI', 'AWS', 'Docker', 'SQL',
]

export function PortfolioPage({ onEnterGym }: Props) {
  return (
    <main className="page" id="work">

      {/* About ---------------------------------------------------- */}
      <Section>
        <h2 className="section-title about-title">
          <MaskLine inView>I like software</MaskLine>
          <MaskLine inView delay={0.12}>you can <em>feel</em>.</MaskLine>
        </h2>
        <div className="about-grid">
          <div className="about-prose">
            <p>I'm Dimural, a software engineer drawn to problems where engineering craft and user experience intersect.</p>
            <p>I like turning ambitious ideas into polished, performant products. Off the keyboard you'll find me in the gym, watching Real Madrid, or playing guitar.</p>
          </div>
          <LiquidGlassCard className="about-card" borderRadius={16}>
            <div className="about-row"><span>Focus</span><strong>Full-stack / 3D</strong></div>
            <div className="about-row"><span>Stack</span><strong>TS / React / Node</strong></div>
            <div className="about-row"><span>Status</span><strong className="is-open">Open to work</strong></div>
          </LiquidGlassCard>
        </div>
      </Section>

      {/* Work ----------------------------------------------------- */}
      <Section className="section-full">
        <div className="work-head">
          <h2 className="section-title">
            <MaskLine inView>Selected work</MaskLine>
          </h2>
        </div>
        <div className="work-index">
          {projects.map(proj => {
            const Row = proj.action === 'gym' ? 'button' : 'div'
            return (
              <Row
                key={proj.num}
                className="work-row"
                onClick={proj.action === 'gym' ? onEnterGym : undefined}
              >
                <span className="work-row-num">{proj.num}</span>
                <div className="work-row-main">
                  <h3 className="work-row-title">{proj.title}</h3>
                  <div className="work-row-tags">
                    {proj.tags.map(t => <span key={t}>{t}</span>)}
                  </div>
                </div>
                <p className="work-row-desc">{proj.desc}</p>
                <span className="work-row-arrow" aria-hidden>
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M7 17L17 7M7 7h10v10" />
                  </svg>
                </span>
              </Row>
            )
          })}
        </div>
      </Section>

      {/* Toolbelt marquee ----------------------------------------- */}
      <section className="marquee" aria-label="Tools and technologies">
        <div className="marquee-track">
          {[0, 1].map(copy => (
            <div className="marquee-group" key={copy} aria-hidden={copy === 1}>
              {tools.map(t => (
                <span className="marquee-item" key={t}>
                  {t}
                  <span className="marquee-sep">/</span>
                </span>
              ))}
            </div>
          ))}
        </div>
      </section>

      {/* Contact -------------------------------------------------- */}
      <section className="contact" id="contact">
        <div className="contact-wrap">
          <p className="contact-kicker">Open to roles and collaborations</p>
          <a href="mailto:dimural722@gmail.com" className="contact-email">
            <MaskLine inView className="contact-email-line">
              dimural722@gmail.com
              <svg width="0.55em" height="0.55em" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M7 17L17 7M7 7h10v10" />
              </svg>
            </MaskLine>
          </a>
          <div className="contact-links">
            <a href="https://github.com" target="_blank" rel="noopener">GitHub ↗</a>
            <a href="https://linkedin.com" target="_blank" rel="noopener">LinkedIn ↗</a>
          </div>

          <footer className="footer">
            <span>© 2026 Dimural Murat</span>
            <button
              className="footer-top"
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            >
              Back to top ↑
            </button>
          </footer>
        </div>
      </section>

    </main>
  )
}
