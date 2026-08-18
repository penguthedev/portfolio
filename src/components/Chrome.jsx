import { memo, useEffect, useRef, useState } from 'react';
import { getScroll, subscribe } from '../hooks/scrollStore';
import { hasFinePointer, usePrefersReducedMotion, useScrolledPast, useSmoothAnchor } from '../hooks/useEffects';

const NAV_ITEMS = ['about', 'experience', 'projects', 'achievements', 'contact'];

/* ------------------------------------------------------------------ *
 * Preloader
 * ------------------------------------------------------------------ */

/**
 * Tracks real readiness (fonts + window load) instead of a random timer, with
 * a short floor so it does not flash on a fast connection. The page underneath
 * now mounts immediately, so the browser lays out and paints during the wait
 * rather than doing all of it the instant the overlay lifts.
 */
export const Preloader = memo(function Preloader({ onDone }) {
  const [progress, setProgress] = useState(8);
  const [done, setDone] = useState(false);

  useEffect(() => {
    let alive = true;
    const startedAt = performance.now();
    const MIN_MS = 900;

    // Creep forward so the bar always feels alive, easing off as it approaches 90.
    const creep = setInterval(() => {
      if (!alive) return;
      setProgress((p) => (p >= 90 ? p : p + Math.max(0.6, (90 - p) * 0.08)));
    }, 90);

    const ready = Promise.all([
      document.fonts?.ready ?? Promise.resolve(),
      document.readyState === 'complete'
        ? Promise.resolve()
        : new Promise((res) => window.addEventListener('load', res, { once: true })),
    ]);

    ready.then(() => {
      const wait = Math.max(0, MIN_MS - (performance.now() - startedAt));
      setTimeout(() => {
        if (!alive) return;
        clearInterval(creep);
        setProgress(100);
        setTimeout(() => {
          if (!alive) return;
          setDone(true);
          onDone?.();
        }, 320);
      }, wait);
    });

    // Hard ceiling — never trap someone behind the overlay if a font 404s.
    const bail = setTimeout(() => {
      if (!alive) return;
      clearInterval(creep);
      setProgress(100);
      setDone(true);
      onDone?.();
    }, 6000);

    return () => {
      alive = false;
      clearInterval(creep);
      clearTimeout(bail);
    };
  }, [onDone]);

  return (
    <div className={`preloader${done ? ' done' : ''}`} aria-hidden={done} role="status" aria-live="polite">
      <div className="preloader-mono">LK</div>
      <div className="preloader-bar">
        <span style={{ width: `${progress}%` }} />
      </div>
      <span className="sr-only">Loading portfolio</span>
    </div>
  );
});

/* ------------------------------------------------------------------ *
 * Custom cursor
 * ------------------------------------------------------------------ */

/**
 * The trailing ring is eased toward the pointer, so it needs a rAF loop — but
 * only while it still has ground to cover. Once it settles within half a pixel
 * the loop stops entirely and restarts on the next pointer move, which takes
 * idle CPU to zero instead of running sixty frames a second forever.
 */
export const Cursor = memo(function Cursor() {
  const dotRef = useRef(null);
  const ringRef = useRef(null);
  const reduced = usePrefersReducedMotion();

  useEffect(() => {
    if (reduced || !hasFinePointer()) return;
    const dot = dotRef.current;
    const ring = ringRef.current;
    if (!dot || !ring) return;

    let mx = -100, my = -100, rx = -100, ry = -100;
    let raf = 0;
    let half = ring.offsetWidth / 2;

    const loop = () => {
      const dx = mx - rx;
      const dy = my - ry;
      rx += dx * 0.16;
      ry += dy * 0.16;

      dot.style.transform = `translate3d(${mx - 5}px, ${my - 5}px, 0)`;
      ring.style.transform = `translate3d(${rx - half}px, ${ry - half}px, 0)`;

      if (Math.abs(dx) < 0.5 && Math.abs(dy) < 0.5) {
        raf = 0; // Settled — stop burning frames.
        return;
      }
      raf = requestAnimationFrame(loop);
    };

    const kick = () => {
      if (!raf) raf = requestAnimationFrame(loop);
    };

    const onMove = (e) => {
      mx = e.clientX;
      my = e.clientY;
      kick();
    };

    const onOver = (e) => {
      const hot = e.target.closest('a, button, input, .project-card, .skill-tag, .cert-card');
      const next = !!hot;
      if (ring.classList.contains('hovering') !== next) {
        ring.classList.toggle('hovering', next);
        half = next ? 32 : 19; // Matches the CSS sizes; avoids a layout read.
        kick();
      }
    };

    window.addEventListener('pointermove', onMove, { passive: true });
    window.addEventListener('pointerover', onOver, { passive: true });
    kick();

    return () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerover', onOver);
      cancelAnimationFrame(raf);
    };
  }, [reduced]);

  return (
    <>
      <div ref={dotRef} className="cursor-dot" aria-hidden="true" />
      <div ref={ringRef} className="cursor-ring" aria-hidden="true" />
    </>
  );
});

/* ------------------------------------------------------------------ *
 * Scroll progress bar
 * ------------------------------------------------------------------ */

export const ScrollProgress = memo(function ScrollProgress() {
  const barRef = useRef(null);

  useEffect(() => {
    const paint = () => {
      const bar = barRef.current;
      if (!bar) return;
      // scaleX is compositor-only; animating width forces layout every frame.
      bar.style.transform = `scaleX(${getScroll().progress})`;
    };
    paint();
    return subscribe(paint);
  }, []);

  return (
    <div className="scroll-progress" aria-hidden="true">
      <span ref={barRef} />
    </div>
  );
});

/* ------------------------------------------------------------------ *
 * Navigation
 * ------------------------------------------------------------------ */

export const Nav = memo(function Nav() {
  const scrolled = useScrolledPast(40);
  const [active, setActive] = useState('');
  const go = useSmoothAnchor();

  useEffect(() => {
    const obs = new IntersectionObserver(
      (entries) => {
        for (const e of entries) if (e.isIntersecting) setActive(e.target.id);
      },
      { rootMargin: '-45% 0px -50% 0px' }
    );
    for (const id of NAV_ITEMS) {
      const el = document.getElementById(id);
      if (el) obs.observe(el);
    }
    return () => obs.disconnect();
  }, []);

  return (
    <nav className={scrolled ? 'scrolled' : ''}>
      <a href="#hero" className="nav-logo" onClick={(e) => go(e, 'hero')}>
        Lin Khant
      </a>
      <ul className="nav-links">
        {NAV_ITEMS.map((id) => (
          <li key={id}>
            <a href={`#${id}`} className={active === id ? 'active' : ''} onClick={(e) => go(e, id)}>
              {id.charAt(0).toUpperCase() + id.slice(1)}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
});

/* ------------------------------------------------------------------ *
 * Divider
 * ------------------------------------------------------------------ */

export const Divider = memo(function Divider() {
  return (
    <div className="divider" aria-hidden="true">
      <div className="divider-line" />
      <div className="divider-gem" />
      <div className="divider-line" />
    </div>
  );
});
