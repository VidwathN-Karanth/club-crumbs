/**
 * The Club Crumbs brand mark.
 *
 * Uses the official logo image from /club-crumbs-logo.png everywhere across the app —
 * the navbar, workspace sidebar, sign-in screen, loading splash, and legal pages.
 */

export const MARK_PURPLE = '#C56BF5';
const MARK_RADIUS = '22%';

interface LayoraMarkProps {
  /** Sizing only, e.g. "h-6 w-6". Radius is handled here, not by the caller. */
  className?: string;
  /** Retained for backwards compatibility with call sites that pass glyph sizing. */
  glyphClassName?: string;
  alt?: string;
}

export default function LayoraMark({
  className = 'h-6 w-6',
  alt = 'Club Crumbs',
}: LayoraMarkProps) {
  return (
    <span
      aria-hidden="true"
      className={`inline-flex shrink-0 items-center justify-center overflow-hidden ${className}`}
      style={{ borderRadius: MARK_RADIUS }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/club-crumbs-logo.png"
        alt={alt}
        className="w-full h-full object-cover select-none"
        loading="eager"
        decoding="async"
        onError={(e) => {
          const target = e.currentTarget;
          if (!target.src.endsWith('.jpeg')) {
            target.src = '/club-crumbs-logo.jpeg';
          }
        }}
      />
    </span>
  );
}
