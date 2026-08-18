import { memo, useEffect, useRef } from 'react';
import {
  hasFinePointer,
  useActiveWhenVisible,
  usePrefersReducedMotion,
  useSmoothAnchor,
} from '../hooks/useEffects';

/* ------------------------------------------------------------------ *
 * Ambient particles
 * ------------------------------------------------------------------ */

/**
 * The canvas used to animate forever, including while the hero was scrolled
 * far off screen and while the tab sat in the background. It now runs only
 * when it is actually visible, and the twinkle phase is recomputed on a slower
 * cadence than the position — sine per dot per frame was the hot path.
 */
const Particles = memo(function Particles({ active }) {
  const canvasRef = useRef(null);
  const reduced = usePrefersReducedMotion();

  useEffect(() => {
    if (reduced || !active) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;

    let w = 0;
    let h = 0;
    let raf = 0;
    let frame = 0;

    // Capping DPR at 1.5 roughly halves the fill cost on 3x phone screens with
    // no visible difference on soft glowing dots.
    const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    const count = window.innerWidth < 700 ? 20 : 38;
    let dots = [];

    const resize = () => {
      w = canvas.offsetWidth;
      h = canvas.offsetHeight;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const seed = () => {
      dots = Array.from({ length: count }, () => ({
        x: Math.random() * w,
        y: Math.random() * h,
        r: 0.6 + Math.random() * 1.6,
        vx: (Math.random() - 0.5) * 0.15,
        vy: -0.06 - Math.random() * 0.22,
        a: 0.15 + Math.random() * 0.5,
        tw: Math.random() * Math.PI * 2,
        glow: 0.5,
      }));
    };

    resize();
    seed();

    const draw = (t) => {
      raf = requestAnimationFrame(draw);
      frame += 1;
      // Twinkle drifts slowly; refreshing it every 4th frame is imperceptible
      // and removes ~75% of the trigonometry.
      const retwinkle = frame % 4 === 0;

      ctx.clearRect(0, 0, w, h);
      for (let i = 0; i < dots.length; i += 1) {
        const d = dots[i];
        d.x += d.vx;
        d.y += d.vy;
        if (d.y < -6) {
          d.y = h + 6;
          d.x = Math.random() * w;
        }
        if (d.x < -6) d.x = w + 6;
        else if (d.x > w + 6) d.x = -6;

        if (retwinkle) d.glow = d.a * (0.6 + 0.4 * Math.sin(t / 900 + d.tw));

        ctx.beginPath();
        ctx.arc(d.x, d.y, d.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(232, 201, 126, ${d.glow})`;
        ctx.fill();
      }
    };

    raf = requestAnimationFrame(draw);

    let resizeRaf = 0;
    const ro = new ResizeObserver(() => {
      if (resizeRaf) return;
      resizeRaf = requestAnimationFrame(() => {
        resizeRaf = 0;
        resize();
      });
    });
    ro.observe(canvas);

    return () => {
      cancelAnimationFrame(raf);
      cancelAnimationFrame(resizeRaf);
      ro.disconnect();
    };
  }, [reduced, active]);

  return <canvas ref={canvasRef} className="hero-particles" aria-hidden="true" />;
});

/* ------------------------------------------------------------------ *
 * Title
 * ------------------------------------------------------------------ */

const StaggerWord = memo(function StaggerWord({ word, gilded, offset }) {
  return (
    <span className={`word${gilded ? ' gilded' : ''}`}>
      {word.split('').map((ch, i) => (
        <span key={i} className="ch" style={{ animationDelay: `${0.25 + (offset + i) * 0.06}s` }}>
          {ch}
        </span>
      ))}
    </span>
  );
});

/* ------------------------------------------------------------------ *
 * Hero
 * ------------------------------------------------------------------ */

export default function Hero() {
  const sectionRef = useRef(null);
  const bgRef = useRef(null);
  const go = useSmoothAnchor();
  const reduced = usePrefersReducedMotion();
  const active = useActiveWhenVisible(sectionRef, { rootMargin: '0px' });

  /* Parallax only listens while the hero is on screen. */
  useEffect(() => {
    if (reduced || !active || !hasFinePointer()) return;
    let raf = 0;
    const onMove = (e) => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        const x = (e.clientX / window.innerWidth - 0.5) * 26;
        const y = (e.clientY / window.innerHeight - 0.5) * 26;
        const bg = bgRef.current;
        if (bg) bg.style.transform = `translate3d(${x}px, ${y}px, 0) scale(1.06)`;
      });
    };
    window.addEventListener('pointermove', onMove, { passive: true });
    return () => {
      window.removeEventListener('pointermove', onMove);
      cancelAnimationFrame(raf);
    };
  }, [reduced, active]);

  return (
    <section id="hero" className="hero" ref={sectionRef}>
      <div ref={bgRef} className="hero-bg" />
      <Particles active={active} />
      <div className="hero-corner tl" />
      <div className="hero-corner br" />
      <div className="hero-eyebrow">Portfolio — 2026</div>
      <h1 className="hero-title">
        <StaggerWord word="Lin" offset={0} />
        <StaggerWord word="Khant" gilded offset={3} />
      </h1>
      <p className="hero-subtitle">
        Computer Science Student &amp; Creative Developer crafting digital experiences with precision and artistry.
      </p>
      <a href="#projects" className="hero-cta" onClick={(e) => go(e, 'projects')}>
        View My Work
      </a>
      <div className="hero-scroll">
        <div className="scroll-line" />
        Scroll to Explore
      </div>
      <div className="hero-loc">KL · Malaysia</div>
    </section>
  );
}
