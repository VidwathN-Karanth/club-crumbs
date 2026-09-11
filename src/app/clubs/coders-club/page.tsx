import type { Metadata } from 'next';

/**
 * Coders Club event page — "How Does Instagram Actually Do That?"
 *
 * Public (not gated by proxy.ts) so a prospective member can read the
 * challenges before signing in. Content is the club's Instagram-challenges
 * brief, laid out as a single scrolling page.
 */

export const metadata: Metadata = {
  title: 'Coders Club — How Does Instagram Actually Do That?',
  description:
    'Coders Club event: build tiny working versions of real Instagram features — feed ranking, friend suggestions, trending hashtags, and more.',
};

const ACCENT = '#2E95FF'; // Coders Club
const INK = '#0A0B0D';
const SLAB = '#14161A';

type Challenge = {
  n: number;
  title: string;
  curiosity: string;
  task: React.ReactNode;
  thinking: string[];
};

const CHALLENGES: Challenge[] = [
  {
    n: 1,
    title: 'Build a Mini Feed Ranking Algorithm',
    curiosity:
      "Instagram doesn't show posts in the order they were posted. It ranks them based on how likely you are to engage with them. That's the whole reason two people scrolling at the same time see completely different feeds.",
    task: (
      <>
        <p>You have a list of 15 posts. Each post has:</p>
        <ul className="list-disc space-y-1.5 pl-5 marker:text-white/30">
          <li>likes, comments (numbers)</li>
          <li>recency (hours since posted)</li>
          <li>is_from_close_friend (yes/no)</li>
          <li>is_video (yes/no &mdash; video tends to be watched longer, so it&rsquo;s often boosted)</li>
        </ul>
        <p>
          Write a program that calculates a score for each post using a formula you design (e.g.{' '}
          <code className="rounded bg-white/[0.06] px-1.5 py-0.5 font-jetbrains text-[13px]" style={{ color: ACCENT }}>
            score = likes*0.3 + comments*0.5 + closeness_bonus - recency_penalty
          </code>
          ), then sorts and prints the feed in ranked order.
        </p>
      </>
    ),
    thinking: [
      'Try changing the weights in your formula. Show your group how the feed order completely changes just by valuing "comments" more than "likes."',
      'Why might Instagram not want a feed that’s 100% ranked by engagement? (Hint: think about what kind of content wins if engagement is the only signal — outrage bait, extreme content...)',
      'Add a "penalize posts you’ve already seen too many times from the same account" rule. This is a real thing platforms do to avoid one person flooding your feed.',
    ],
  },
  {
    n: 2,
    title: '"People You May Know" — Friend Suggestions via Graphs',
    curiosity:
      "Ever wonder how Instagram suggests people you've literally never searched for, but somehow know in real life? It's graph theory — specifically, looking at mutual connections.",
    task: (
      <>
        <p>
          Represent a small social network as a graph (adjacency list) &mdash; say 10 users, each following a few
          others. Write a program that, for a given user, finds:
        </p>
        <ul className="list-disc space-y-1.5 pl-5 marker:text-white/30">
          <li>All users they&rsquo;re not already following</li>
          <li>Ranked by number of mutual friends (i.e., how many people they both follow)</li>
        </ul>
        <p>Print the top 3 suggestions with their mutual-friend counts.</p>
      </>
    ),
    thinking: [
      'What if two suggested users have the same mutual friend count — how do you break the tie? (Instagram uses signals like shared location, contacts synced from your phone, etc. — can you add one more signal?)',
      'This is basically "friend-of-a-friend" — which graph traversal technique are you using? Could you do this with BFS starting from the user’s node?',
      "What breaks about this approach at Instagram's actual scale (2 billion users)? Why can't you just brute-force check every user's mutual friends?",
    ],
  },
  {
    n: 3,
    title: 'Trending Hashtags in Real Time',
    curiosity:
      'How does Instagram know a hashtag is "trending" right now, out of millions of hashtags being posted every minute?',
    task: (
      <p>
        Simulate a stream of 200 incoming posts, each tagged with a random hashtag from a small pool (e.g. #travel,
        #foodie, #reels, #ipl2026, etc.), each with a timestamp. Implement a sliding window counter &mdash; only
        hashtags used in the &ldquo;last 5 minutes&rdquo; (simulated) count toward trending. Print the top 3 trending
        hashtags at a few different simulated points in time.
      </p>
    ),
    thinking: [
      'Why a sliding window instead of just counting all-time usage? What would go wrong with an all-time counter?',
      'What data structure did you use to efficiently drop old posts as time moves forward? Could a queue help here?',
      'Real platforms also weight velocity — a hashtag jumping from 5 to 500 uses in 10 minutes is more "trending" than one sitting steady at 10,000. Can you add a spike-detection bonus?',
    ],
  },
  {
    n: 4,
    title: 'Approximate Like Counts (Why It Says "24.3K" Not "24,317")',
    curiosity:
      "Instagram almost never shows you the exact like count once it gets large — it rounds to “24.3K” or “1.2M”. This isn't laziness — it's a deliberate choice for both UX and performance reasons at massive scale.",
    task: (
      <p>
        Write a function that takes a raw integer (e.g.{' '}
        <code className="rounded bg-white/[0.06] px-1.5 py-0.5 font-jetbrains text-[13px]" style={{ color: ACCENT }}>
          1284392
        </code>
        ) and converts it to Instagram-style display format (
        <code className="rounded bg-white/[0.06] px-1.5 py-0.5 font-jetbrains text-[13px]" style={{ color: ACCENT }}>
          1.3M
        </code>
        ). Handle thousands (K), millions (M), and billions (B), with one decimal of rounding.
      </p>
    ),
    thinking: [
      "Why might showing the exact number in real time actually be technically expensive at Instagram's scale? (Hint: think about how many \"likes\" happen per second on a viral post, and what it'd mean to update an exact counter for millions of viewers simultaneously.)",
      'Look up "eventual consistency" — how does this idea connect to why the like count you see might lag behind reality by a few seconds or minutes?',
    ],
  },
  {
    n: 5,
    title: 'Catching Bots — A Tiny Spam Detector',
    curiosity:
      'Instagram has to constantly guess which accounts are real people vs. bots/spam — using patterns, not certainty.',
    task: (
      <p>
        You&rsquo;re given a list of 10 accounts with attributes:{' '}
        <code className="rounded bg-white/[0.06] px-1.5 py-0.5 font-jetbrains text-[13px]" style={{ color: ACCENT }}>
          account_age_days, posts_count, following_count, followers_count, comments_are_generic
        </code>{' '}
        (yes/no &mdash; e.g. &ldquo;Nice pic! &hearts;&rdquo; on every post). Write a scoring function that flags an
        account as likely bot, suspicious, or likely real, based on rules you design (e.g., following &gt;1000 but
        followers &lt;10 and account age &lt;7 days is a big red flag).
      </p>
    ),
    thinking: [
      'No single rule is reliable alone — a brand-new real account could look "suspicious" too. How do you combine multiple weak signals into a more confident decision? (This is the basic idea behind real spam-detection ML models — combining many weak signals.)',
      "What's the cost of a false positive here (flagging a real user as a bot) vs a false negative (missing an actual bot)? Which mistake should the system lean toward avoiding, and why?",
    ],
  },
];

const FACILITATOR_NOTES = [
  "These are intentionally open-ended — there's no single “correct” formula or output. Reward reasoning, not just working code.",
  'After each challenge, spend 3–5 minutes connecting it to something real: e.g., after Challenge 2, mention that this is genuinely close to how early Facebook/LinkedIn built "People You May Know."',
  'Good closing discussion: ask the group which challenge felt most "this explains something I always wondered about" — it’s usually Challenge 1 (feed ranking) or Challenge 4 (like counts).',
  'If time is short, Challenges 1, 2, and 3 give the best mix of graphs + sorting + real-time thinking — you could run the event with just those three.',
];

function Label({ children }: { children: React.ReactNode }) {
  return (
    <p className="font-jetbrains text-[10px] font-bold uppercase tracking-[0.2em]" style={{ color: ACCENT }}>
      {children}
    </p>
  );
}

export default function CodersClubPage() {
  return (
    <main className="min-h-screen font-geist" style={{ background: INK, color: '#EDEEF0' }}>
      <div className="mx-auto max-w-3xl px-5 py-16 sm:px-8 sm:py-24">
        {/* Back link */}
        <a
          href="/"
          className="inline-flex items-center gap-1.5 font-jetbrains text-[11px] font-bold uppercase tracking-[0.16em] text-white/40 transition hover:text-white"
        >
          &larr; Club Crumbs
        </a>

        {/* Hero */}
        <header className="mt-10">
          <span
            className="font-jetbrains text-[11px] font-bold uppercase tracking-[0.22em]"
            style={{ color: ACCENT }}
          >
            Coders Club · Event
          </span>
          <h1 className="mt-5 font-hanken text-[2.4rem] font-extrabold leading-[1.03] tracking-[-0.03em] text-white sm:text-6xl">
            How Does Instagram
            <br className="hidden sm:block" /> Actually Do That?
          </h1>

          {/* Meta */}
          <dl className="mt-9 grid gap-px overflow-hidden rounded-xl border border-white/[0.08]" style={{ background: SLAB }}>
            {[
              ['Format', 'Build a tiny working version of a real Instagram feature. Not theory — actual code, actual output, actual "ohh that’s how it works" moments.'],
              ['Language', 'Open — C, Python, Java, whatever. Focus on the logic.'],
              ['Audience', 'Junior coders'],
            ].map(([k, v]) => (
              <div key={k} className="flex flex-col gap-1 border-b border-white/[0.06] p-4 last:border-b-0 sm:flex-row sm:gap-6">
                <dt className="w-24 shrink-0 font-jetbrains text-[10px] font-bold uppercase tracking-[0.16em] text-white/35">
                  {k}
                </dt>
                <dd className="text-[14px] leading-relaxed text-white/70">{v}</dd>
              </div>
            ))}
          </dl>

          <p className="mt-8 text-[15px] leading-relaxed text-white/60">
            Each challenge below is a simplified, toy version of a real system Instagram uses. The goal isn&rsquo;t to
            replicate Instagram exactly &mdash; it&rsquo;s to get a working, honest intuition for the idea, then let
            curiosity take it further.
          </p>
        </header>

        {/* Challenges */}
        <div className="mt-14 space-y-6">
          {CHALLENGES.map((c) => (
            <article
              key={c.n}
              className="relative overflow-hidden rounded-2xl border border-white/[0.08] p-7 sm:p-9"
              style={{ background: SLAB }}
            >
              <span className="absolute inset-x-0 top-0 h-[3px]" style={{ background: ACCENT }} aria-hidden />

              <div className="flex items-baseline gap-3">
                <span className="font-hanken text-3xl font-extrabold tabular-nums" style={{ color: ACCENT }}>
                  {c.n}
                </span>
                <h2 className="font-hanken text-xl font-bold leading-tight tracking-[-0.02em] text-white sm:text-2xl">
                  {c.title}
                </h2>
              </div>

              <div className="mt-6">
                <Label>The curiosity</Label>
                <p
                  className="mt-2.5 border-l-2 pl-4 text-[15px] italic leading-relaxed text-white/65"
                  style={{ borderColor: `${ACCENT}66` }}
                >
                  {c.curiosity}
                </p>
              </div>

              <div className="mt-6">
                <Label>Your task</Label>
                <div className="mt-2.5 space-y-3 text-[15px] leading-relaxed text-white/70">{c.task}</div>
              </div>

              <div className="mt-6 border-t border-white/[0.06] pt-6">
                <Label>Now the real thinking starts</Label>
                <ul className="mt-3.5 space-y-3">
                  {c.thinking.map((t, i) => (
                    <li key={i} className="flex gap-3 text-[14px] leading-relaxed text-white/55">
                      <span
                        className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full"
                        style={{ background: ACCENT }}
                        aria-hidden
                      />
                      <span>{t}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </article>
          ))}
        </div>

        {/* Facilitator notes */}
        <section className="mt-6 rounded-2xl border border-dashed border-white/[0.12] p-7 sm:p-9">
          <Label>Facilitator notes</Label>
          <ul className="mt-4 space-y-3.5">
            {FACILITATOR_NOTES.map((t, i) => (
              <li key={i} className="flex gap-3 text-[14px] leading-relaxed text-white/55">
                <span className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full bg-white/25" aria-hidden />
                <span>{t}</span>
              </li>
            ))}
          </ul>
        </section>

        {/* Footer */}
        <footer className="mt-14 border-t border-white/[0.07] pt-8">
          <a
            href="/"
            className="inline-flex items-center gap-2 rounded-xl border border-white/12 px-5 py-3 text-sm font-semibold text-white/70 transition hover:border-white/25 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
          >
            &larr; Back to Club Crumbs
          </a>
        </footer>
      </div>
    </main>
  );
}
