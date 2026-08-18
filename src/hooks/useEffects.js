import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { getScroll, subscribe } from './scrollStore';

/* ------------------------------------------------------------------ *
 * Media queries
 * ------------------------------------------------------------------ */

const mq = (q) => (typeof window === 'undefined' ? null : window.matchMedia(q));

export function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(() => mq('(prefers-reduced-motion: reduce)')?.matches ?? false);
  useEffect(() => {
    const m = mq('(prefers-reduced-motion: reduce)');
    const fn = (e) => setReduced(e.matches);
    m.addEventListener('change', fn);
    return () => m.removeEventListener('change', fn);
  }, []);
  return reduced;
}

/** True only on devices with a real hovering pointer — skips all cursor work on touch. */
export const hasFinePointer = () => mq('(hover: hover) and (pointer: fine)')?.matches ?? false;

/* ------------------------------------------------------------------ *
 * Scroll
 * ------------------------------------------------------------------ */

/**
 * Subscribe to one derived slice of scroll state.
 * The selector should return a primitive so React can bail out of renders.
 */
export function useScrollValue(selector) {
  return useSyncExternalStore(
    subscribe,
    () => selector(getScroll()),
    () => selector({ y: 0, progress: 0, max: 0 })
  );
}

export const useScrolledPast = (px) => useScrollValue((s) => s.y > px);

/* ------------------------------------------------------------------ *
 * Reveal on scroll — one observer shared by every element on the page
 * ------------------------------------------------------------------ */

let revealObserver = null;
function getRevealObserver() {
  if (!revealObserver) {
    revealObserver = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            e.target.classList.add('in-view');
            revealObserver.unobserve(e.target);
          }
        }
      },
      { threshold: 0.1, rootMargin: '0px 0px -40px 0px' }
    );
  }
  return revealObserver;
}

export function useReveal() {
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = getRevealObserver();
    obs.observe(el);
    return () => obs.unobserve(el);
  }, []);
  return ref;
}

/* ------------------------------------------------------------------ *
 * In-view gate — lets expensive animations switch themselves off
 * ------------------------------------------------------------------ */

/**
 * Reports whether the element is on screen AND the tab is visible.
 * Used to stop the hero canvas from burning a rAF loop while scrolled away.
 */
export function useActiveWhenVisible(ref, { rootMargin = '150px' } = {}) {
  const [active, setActive] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    let onScreen = false;
    const sync = () => setActive(onScreen && !document.hidden);

    const obs = new IntersectionObserver(
      ([entry]) => {
        onScreen = entry.isIntersecting;
        sync();
      },
      { rootMargin }
    );
    obs.observe(el);
    document.addEventListener('visibilitychange', sync);

    return () => {
      obs.disconnect();
      document.removeEventListener('visibilitychange', sync);
    };
  }, [ref, rootMargin]);

  return active;
}

/* ------------------------------------------------------------------ *
 * Pointer effects
 * ------------------------------------------------------------------ */

/**
 * 3D tilt. Writes CSS custom properties rather than rebuilding a transform
 * string, and only promotes the element to its own layer while the pointer is
 * actually over it — six permanently-composited cards cost real memory.
 */
export function useTilt(maxDeg = 5) {
  const ref = useRef(null);
  const reduced = usePrefersReducedMotion();

  useEffect(() => {
    const el = ref.current;
    if (!el || reduced || !hasFinePointer()) return;

    let raf = 0;
    let rect = null;

    const onEnter = () => {
      rect = el.getBoundingClientRect();
      el.style.willChange = 'transform';
    };

    const onMove = (e) => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        if (!rect) rect = el.getBoundingClientRect();
        const x = (e.clientX - rect.left) / rect.width - 0.5;
        const y = (e.clientY - rect.top) / rect.height - 0.5;
        el.style.setProperty('--rx', `${(-y * maxDeg).toFixed(2)}deg`);
        el.style.setProperty('--ry', `${(x * maxDeg).toFixed(2)}deg`);
        el.style.setProperty('--mx', `${((x + 0.5) * 100).toFixed(1)}%`);
        el.style.setProperty('--my', `${((y + 0.5) * 100).toFixed(1)}%`);
      });
    };

    const onLeave = () => {
      cancelAnimationFrame(raf);
      raf = 0;
      rect = null;
      el.style.setProperty('--rx', '0deg');
      el.style.setProperty('--ry', '0deg');
      el.style.willChange = 'auto';
    };

    el.addEventListener('pointerenter', onEnter, { passive: true });
    el.addEventListener('pointermove', onMove, { passive: true });
    el.addEventListener('pointerleave', onLeave, { passive: true });

    return () => {
      el.removeEventListener('pointerenter', onEnter);
      el.removeEventListener('pointermove', onMove);
      el.removeEventListener('pointerleave', onLeave);
      cancelAnimationFrame(raf);
    };
  }, [maxDeg, reduced]);

  return ref;
}

/* ------------------------------------------------------------------ *
 * Navigation
 * ------------------------------------------------------------------ */

export function useSmoothAnchor() {
  return useCallback((e, id) => {
    e.preventDefault();
    const el = document.getElementById(id);
    if (!el) return;
    const reduced = mq('(prefers-reduced-motion: reduce)')?.matches;
    el.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'start' });
    // Move focus so keyboard users land where the page just scrolled.
    el.setAttribute('tabindex', '-1');
    el.focus({ preventScroll: true });
  }, []);
}
