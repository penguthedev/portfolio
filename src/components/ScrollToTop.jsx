import { useCallback, useEffect, useRef, useState } from 'react';
import BrandMark from './BrandMark';
import { getScroll, subscribe } from '../hooks/scrollStore';
import { usePrefersReducedMotion, useScrolledPast } from '../hooks/useEffects';

/* Ring geometry — r is in the 58×58 viewBox, leaving room for the stroke. */
const R = 27;
const CIRCUMFERENCE = 2 * Math.PI * R;

/**
 * Back-to-top control.
 *
 * The ring around the button is the live scroll position, so the control
 * reports how far down the page you are as well as taking you back up. The
 * ring is written straight to the DOM on each frame — updating it through
 * React state would re-render on every scroll event.
 */
export default function ScrollToTop() {
  const visible = useScrolledPast(500);
  const reduced = usePrefersReducedMotion();
  const [launching, setLaunching] = useState(false);
  const ringRef = useRef(null);

  useEffect(() => {
    const paint = () => {
      const ring = ringRef.current;
      if (!ring) return;
      const { progress } = getScroll();
      ring.style.strokeDashoffset = `${CIRCUMFERENCE * (1 - progress)}`;
    };
    paint();
    return subscribe(paint);
  }, []);

  const goTop = useCallback(() => {
    window.scrollTo({ top: 0, behavior: reduced ? 'auto' : 'smooth' });
    if (reduced) return;
    setLaunching(true);
    // Matches the .launching animation duration in the stylesheet.
    const t = setTimeout(() => setLaunching(false), 620);
    return () => clearTimeout(t);
  }, [reduced]);

  return (
    <button
      type="button"
      className={`fab scroll-top-fab${visible ? ' is-visible' : ''}${launching ? ' is-launching' : ''}`}
      onClick={goTop}
      aria-label="Back to top"
      tabIndex={visible ? 0 : -1}
      aria-hidden={!visible}
    >
      {/* Live scroll dial */}
      <svg className="fab-ring" viewBox="0 0 58 58" aria-hidden="true">
        <circle className="fab-ring-track" cx="29" cy="29" r={R} />
        <circle
          ref={ringRef}
          className="fab-ring-fill"
          cx="29"
          cy="29"
          r={R}
          strokeDasharray={CIRCUMFERENCE}
          strokeDashoffset={CIRCUMFERENCE}
        />
      </svg>

      <span className="fab-glyph">
        <BrandMark className="fab-monogram" />
        <svg className="fab-arrow" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path
            d="M12 19V5M6 11l6-6 6 6"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </span>

      <span className="fab-ripple" aria-hidden="true" />
    </button>
  );
}
