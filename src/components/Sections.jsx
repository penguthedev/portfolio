import { memo } from 'react';
import { useReveal, useTilt } from '../hooks/useEffects';
import { usePortfolio } from '../context/portfolioStore';

/* ------------------------------------------------------------------ *
 * Shared pieces
 * ------------------------------------------------------------------ */

const SectionHead = memo(function SectionHead({ label, title }) {
  const ref = useReveal();
  return (
    <div ref={ref} className="section-head reveal">
      <span className="section-label">{label}</span>
      <h2 className="section-title">{title}</h2>
      <div className="section-line" />
    </div>
  );
});

function Reveal({ as: Tag = 'div', className = '', delay = 0, children, ...rest }) {
  const ref = useReveal();
  const d = delay ? ` reveal-d${delay}` : '';
  return (
    <Tag ref={ref} className={`${className} reveal${d}`} {...rest}>
      {children}
    </Tag>
  );
}

/* ------------------------------------------------------------------ *
 * About
 * ------------------------------------------------------------------ */

export const About = memo(function About() {
  const { stats, skills, languages } = usePortfolio();

  return (
    <section id="about">
      <div className="about-grid">
        <div>
          <Reveal as="span" className="section-label">
            01 — Who I Am
          </Reveal>
          <Reveal as="h2" className="about-heading" delay={1}>
            Crafting the Future, <em>One Line at a Time.</em>
          </Reveal>
          <Reveal as="p" className="about-copy" delay={2}>
            A second-year Computer Science student at Asia Pacific University with a deep passion for building things
            that are both beautiful and functional. I move fluently between backend logic and luxury front-end design.
          </Reveal>
          <Reveal as="p" className="about-copy" delay={2}>
            From hand-motion web experiences to AI chatbots and high-end brand websites — I bring a designer&rsquo;s eye
            and an engineer&rsquo;s mind to every project.
          </Reveal>
          <Reveal className="stat-grid" delay={3}>
            {stats.map((s) => (
              <div key={s.label} className="stat-cell">
                <div className="stat-value">{s.value}</div>
                <div className="stat-label">{s.label}</div>
              </div>
            ))}
          </Reveal>
        </div>
        <div>
          {skills.map((cat, i) => (
            <Reveal key={cat.title} className="skill-block" delay={Math.min(i + 1, 3)}>
              <div className="skill-cat-title">{cat.title}</div>
              <div className="skill-tags">
                {cat.items.map((s) => (
                  <span key={s} className="skill-tag">
                    {s}
                  </span>
                ))}
              </div>
            </Reveal>
          ))}
          <Reveal className="lang-row" delay={3}>
            {languages.map((l, i) => (
              <span key={l.name} style={{ display: 'contents' }}>
                <span className="lang-item">
                  <span className="lang-name">{l.name}</span>
                  <span className="lang-level">{l.level}</span>
                </span>
                {i < languages.length - 1 && <span className="lang-sep" />}
              </span>
            ))}
          </Reveal>
        </div>
      </div>
    </section>
  );
});

/* ------------------------------------------------------------------ *
 * Experience
 * ------------------------------------------------------------------ */

export const Experience = memo(function Experience() {
  const { experience } = usePortfolio();

  return (
    <section id="experience">
      <SectionHead label="02 — Experience" title="Where I've Been" />
      <div className="exp-grid">
        {experience.map((e, i) => (
          <Reveal key={e.role} className="exp-item" delay={Math.min(i, 3)}>
            <div className="exp-date">{e.date}</div>
            <div>
              <h3 className="exp-role">{e.role}</h3>
              <div className="exp-company">{e.company}</div>
              <ul className="exp-desc">
                {e.points.map((p) => (
                  <li key={p}>{p}</li>
                ))}
              </ul>
            </div>
          </Reveal>
        ))}
      </div>
    </section>
  );
});

/* ------------------------------------------------------------------ *
 * Projects
 * ------------------------------------------------------------------ */

function ProjectCard({ p, delay }) {
  const revealRef = useReveal();
  const tiltRef = useTilt(5);
  const { isSaved, toggleSaved } = usePortfolio();
  const saved = isSaved(p.num);

  return (
    <div ref={revealRef} className={`reveal${delay ? ` reveal-d${delay}` : ''}`}>
      <article ref={tiltRef} className="project-card">
        <span className="project-num">{p.num}</span>

        <button
          type="button"
          className={`project-save${saved ? ' is-saved' : ''}`}
          onClick={() => toggleSaved(p.num)}
          aria-pressed={saved}
          aria-label={saved ? `Remove ${p.name} from saved` : `Save ${p.name}`}
          title={saved ? 'Saved' : 'Save this project'}
        >
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path
              d="M6 4h12v16l-6-4.5L6 20z"
              fill={saved ? 'currentColor' : 'none'}
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinejoin="round"
            />
          </svg>
        </button>

        <div className="project-type">{p.type}</div>
        <h3 className="project-name">{p.name}</h3>
        <p className="project-desc">{p.desc}</p>
        <div className="project-tags">
          {p.tags.map((t) => (
            <span key={t} className="project-tag">
              {t}
            </span>
          ))}
        </div>
      </article>
    </div>
  );
}

export const Projects = memo(function Projects() {
  const { visibleProjects, projects, tags, query, setQuery, activeTag, setActiveTag, saved } = usePortfolio();

  return (
    <section id="projects">
      <SectionHead label="03 — Projects" title="Selected Works" />

      <Reveal className="project-controls">
        <div className="project-search">
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <circle cx="11" cy="11" r="7" fill="none" stroke="currentColor" strokeWidth="1.6" />
            <path d="M16.5 16.5L21 21" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
          </svg>
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search projects"
            aria-label="Search projects"
          />
          {query && (
            <button type="button" className="project-search-clear" onClick={() => setQuery('')} aria-label="Clear search">
              &times;
            </button>
          )}
        </div>

        <div className="project-filters" role="group" aria-label="Filter projects by tag">
          {tags.map((t) => (
            <button
              key={t}
              type="button"
              className={`project-filter${activeTag === t ? ' is-active' : ''}`}
              onClick={() => setActiveTag(t)}
              aria-pressed={activeTag === t}
            >
              {t}
            </button>
          ))}
        </div>

        <p className="project-count" aria-live="polite">
          {visibleProjects.length} of {projects.length} shown
          {saved.length > 0 && <span className="project-saved-count"> · {saved.length} saved</span>}
        </p>
      </Reveal>

      {visibleProjects.length > 0 ? (
        <div className="projects-grid">
          {visibleProjects.map((p, i) => (
            <ProjectCard key={p.num} p={p} delay={i % 3} />
          ))}
        </div>
      ) : (
        <div className="projects-empty">
          <p>No projects match that search.</p>
          <button
            type="button"
            onClick={() => {
              setQuery('');
              setActiveTag('All');
            }}
          >
            Show all projects
          </button>
        </div>
      )}
    </section>
  );
});

/* ------------------------------------------------------------------ *
 * Achievements
 * ------------------------------------------------------------------ */

export const Achievements = memo(function Achievements() {
  const { achievements } = usePortfolio();

  return (
    <section id="achievements">
      <SectionHead label="04 — Achievements" title="Milestones" />
      <div className="ach-list">
        {achievements.map((a, i) => (
          <Reveal key={a.num} className="ach-item" delay={Math.min(i, 3)}>
            <span className="ach-number">{a.num}</span>
            <p className="ach-text">
              {a.text}
              <em>{a.em}</em>
              {a.rest}
            </p>
          </Reveal>
        ))}
      </div>
    </section>
  );
});

/* ------------------------------------------------------------------ *
 * Certifications
 * ------------------------------------------------------------------ */

export const Certifications = memo(function Certifications() {
  const { certifications } = usePortfolio();

  return (
    <section id="certifications">
      <SectionHead label="05 — Credentials" title="Certifications" />
      <div className="cert-grid">
        {certifications.map((c, i) => (
          <Reveal key={c.name} className="cert-card" delay={i % 3}>
            <span className="cert-icon" aria-hidden="true">
              {c.icon}
            </span>
            <div>
              <div className="cert-name">{c.name}</div>
              <div className="cert-body">{c.body}</div>
            </div>
          </Reveal>
        ))}
      </div>
    </section>
  );
});

/* ------------------------------------------------------------------ *
 * Contact
 * ------------------------------------------------------------------ */

export const Contact = memo(function Contact() {
  const { contacts } = usePortfolio();

  return (
    <section id="contact" className="contact">
      <Reveal as="span" className="section-label">
        06 — Get In Touch
      </Reveal>
      <Reveal as="h2" className="contact-heading" delay={1}>
        Let&rsquo;s Build <em>Something Extraordinary.</em>
      </Reveal>
      <Reveal as="p" className="contact-copy" delay={2}>
        Open to internship opportunities, collaborations, and conversations about creative tech. Reach out — I&rsquo;d
        love to connect.
      </Reveal>
      <Reveal className="contact-row" delay={3}>
        {contacts.map((c, i) => {
          const inner = (
            <>
              <span className="contact-link-label">{c.label}</span>
              <span className="contact-link-value">{c.value}</span>
            </>
          );
          return (
            <span key={c.label} style={{ display: 'contents' }}>
              {c.href ? (
                <a
                  className="contact-link"
                  href={c.href}
                  target={c.href.startsWith('http') ? '_blank' : undefined}
                  rel="noreferrer"
                >
                  {inner}
                </a>
              ) : (
                <span className="contact-link">{inner}</span>
              )}
              {i < contacts.length - 1 && <span className="contact-divider" />}
            </span>
          );
        })}
      </Reveal>
    </section>
  );
});

/* ------------------------------------------------------------------ *
 * Footer
 * ------------------------------------------------------------------ */

export const Footer = memo(function Footer() {
  return (
    <footer>
      <div className="footer-name">Lin Khant @ IlluminaWang</div>
      <div className="footer-copy">Developer of Luminara</div>
    </footer>
  );
});
