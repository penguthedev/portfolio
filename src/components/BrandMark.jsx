/**
 * The LK monogram.
 *
 * Drawn as strokes rather than <text> so it stays crisp at any size and does
 * not wait on the Cinzel webfont to load.
 */
export default function BrandMark({ className = '', ...rest }) {
  return (
    <svg className={className} viewBox="0 0 48 48" fill="none" aria-hidden="true" {...rest}>
      <g
        stroke="currentColor"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      >
        {/* L */}
        <path d="M15 15.5 V32 H21.5" />
        {/* K */}
        <path d="M27.5 15.5 V32" />
        <path d="M34.8 15.5 L27.5 23.6" />
        <path d="M28.4 23.2 L35 32" />
      </g>
    </svg>
  );
}
