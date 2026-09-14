import { CLUB_META } from '@/lib/cohorts';

/**
 * Placeholder destination for the DevStudio card on the landing page.
 *
 * Public (not gated by proxy.ts) so a prospective member can open it before
 * signing in. The entry questions will be added here later.
 */
export default function DevStudioPage() {
  const meta = CLUB_META['DevStudio'];
  const accent = meta.accent;

  return (
    <main
      className="flex min-h-screen flex-col items-center justify-center px-6 py-20 text-center font-geist"
      style={{ background: '#0A0B0D', color: '#EDEEF0' }}
    >
      <span
        className="font-jetbrains text-[11px] font-bold uppercase tracking-[0.22em]"
        style={{ color: accent }}
      >
        DevStudio
      </span>
      <h1 className="mt-5 max-w-xl font-hanken text-4xl font-extrabold leading-[1.05] tracking-[-0.03em] text-white sm:text-5xl">
        Questions are on their way.
      </h1>
      <p className="mt-5 max-w-md text-[15px] leading-relaxed text-white/55">
        {meta.tagline}. This is where the DevStudio entry questions will live — they&rsquo;ll be
        added here soon.
      </p>

      {/* Questions go here later. */}

      <a
        href="/"
        className="mt-10 inline-flex items-center gap-2 rounded-xl border border-white/12 px-5 py-3 text-sm font-semibold text-white/70 transition hover:border-white/25 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
      >
        ← Back to Club Crumbs
      </a>
    </main>
  );
}
