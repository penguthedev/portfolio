/**
 * A single scroll listener for the entire app.
 *
 * Before: Nav, ScrollProgress and ScrollToTop each attached their own scroll
 * handler and each called setState on every scroll event. That is three
 * listeners and up to three React renders per frame while scrolling.
 *
 * Now: one rAF-throttled listener writes to this store. Components subscribe
 * through `useScrollValue(selector)` and only re-render when their own derived
 * value actually changes — a boolean like "past 500px" changes twice per page,
 * not sixty times per second.
 */

let raf = 0;
let started = false;

const state = { y: 0, progress: 0, max: 0 };
const listeners = new Set();

function measure() {
  raf = 0;
  const doc = document.documentElement;
  const max = doc.scrollHeight - doc.clientHeight;
  state.y = doc.scrollTop;
  state.max = max;
  state.progress = max > 0 ? doc.scrollTop / max : 0;
  for (const fn of listeners) fn();
}

function schedule() {
  if (raf) return;
  raf = requestAnimationFrame(measure);
}

function start() {
  if (started) return;
  started = true;
  window.addEventListener('scroll', schedule, { passive: true });
  window.addEventListener('resize', schedule, { passive: true });
  measure();
}

function stop() {
  if (!started || listeners.size) return;
  started = false;
  window.removeEventListener('scroll', schedule);
  window.removeEventListener('resize', schedule);
  cancelAnimationFrame(raf);
  raf = 0;
}

export function subscribe(fn) {
  listeners.add(fn);
  start();
  return () => {
    listeners.delete(fn);
    stop();
  };
}

export function getScroll() {
  return state;
}

/** Force a re-measure — call after layout changes (e.g. content finished loading). */
export function refreshScroll() {
  schedule();
}
