import { BIO, EXPERIENCE, PROJECTS } from "../content/resume";

/** The landing: name, bio, experience and projects over the sleeping scene. Fades out while the visitor walks. */
export function TitleCard({ asleep, onWake }: { asleep: boolean; onWake: () => void }) {
  return (
    <main className="card" data-state={asleep ? "asleep" : "awake"} aria-hidden={!asleep}>
      <div className="veil" />
      <div className="content">
        <h1>Dimural Murat</h1>
        <p className="bio">{BIO}</p>
        <hr />
        <div className="lists">
          <section className="experience">
            <h2>Experience</h2>
            <ul>
              {EXPERIENCE.map((job) => (
                <li key={job.company}>
                  {/* Slot for the company's icon; keeps its width while empty. */}
                  <span className="icon">{job.icon && <img src={job.icon} alt="" />}</span>
                  <div>
                    <div className="line">
                      <span>{job.role}</span>
                      <span className="dates">{job.dates}</span>
                    </div>
                    <div className="sub">
                      {job.company} · {job.city}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </section>
          <section className="projects">
            <h2>Projects</h2>
            <ul>
              {PROJECTS.map((project) => (
                <li key={project.name}>
                  <div>
                    <div className="line">
                      <span>{project.name}</span>
                      {project.award && <span className="award">{project.award}</span>}
                    </div>
                    <div className="sub">{project.blurb}</div>
                  </div>
                </li>
              ))}
            </ul>
          </section>
        </div>
      </div>
      <button className="wake" onClick={onWake} tabIndex={asleep ? 0 : -1}>
        press <kbd>space</kbd> to wake up
      </button>
    </main>
  );
}
