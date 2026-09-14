import type { Metadata } from 'next';

/**
 * Coders Club event page — "How Does Instagram Actually Do That?"
 *
 * Public (not gated by proxy.ts) so a prospective member can read the
 * challenges before signing in.
 *
 * Laid out as an engineering teardown: five feature reverse-engineerings,
 * numbered in the margin with the CS concept each one exercises, rather than a
 * stack of identical cards.
 */

export const metadata: Metadata = {
  title: 'Coders Club — How Does Instagram Actually Do That?',
  description:
    'A Coders Club workshop: build tiny working versions of real Instagram features — feed ranking, friend suggestions, trending hashtags, approximate counts and bot detection.',
};

const ACCENT = '#2E95FF'; // Coders Club

type Challenge = {
  title: string;
  /** The CS idea it exercises — shown in the margin, so it reads as an index. */
  concept: string;
  /** The driving question. Set as the lead. */
  curiosity: string;
  task: React.ReactNode;
  thinking: string[];
};

/** Inline code, tuned quiet so prose stays readable. */
function Code({ children }: { children: React.ReactNode }) {
  return (
    <code className="rounded bg-white/[0.06] px-1.5 py-0.5 font-jetbrains text-[0.85em]" style={{ color: ACCENT }}>
      {children}
    </code>
  );
}

const CHALLENGES: Challenge[] = [
  {
    title: 'A mini feed-ranking algorithm',
    concept: 'Sorting · scoring',
    curiosity:
      "Instagram doesn't show posts in the order they were posted. It ranks them by how likely you are to engage — which is why two people scrolling at the same moment see completely different feeds.",
    task: (
      <>
        <p>You have a list of 15 posts. Each post has:</p>
        <ul className="my-3 list-disc space-y-1.5 pl-5 marker:text-white/25">
          <li>likes, comments (numbers)</li>
          <li>recency (hours since posted)</li>
          <li>is_from_close_friend (yes/no)</li>
          <li>is_video (yes/no — video tends to be watched longer, so it&rsquo;s often boosted)</li>
        </ul>
        <p>
          Write a program that scores each post with a formula you design — say{' '}
          <Code>score = likes*0.3 + comments*0.5 + closeness_bonus - recency_penalty</Code> — then sorts and prints
          the feed in ranked order.
        </p>
      </>
    ),
    thinking: [
      'Change the weights. Show your group how the feed order flips just by valuing "comments" over "likes."',
      'Why might Instagram not want a feed ranked 100% by engagement? (Think about what wins when engagement is the only signal — outrage bait, extreme content.)',
      'Add a rule that penalises posts you’ve already seen too many times from the same account. Platforms really do this, to stop one person flooding your feed.',
    ],
  },
  {
    title: '"People You May Know"',
    concept: 'Graphs · BFS',
    curiosity:
      "Ever wonder how Instagram suggests people you've never searched for but genuinely know in real life? It's graph theory — reading the mutual connections around you.",
    task: (
      <>
        <p>
          Represent a small social network as a graph (adjacency list) — say 10 users, each following a few others.
          For a given user, find:
        </p>
        <ul className="my-3 list-disc space-y-1.5 pl-5 marker:text-white/25">
          <li>everyone they&rsquo;re not already following,</li>
          <li>ranked by number of mutual friends (people they both follow).</li>
        </ul>
        <p>Print the top 3 suggestions with their mutual-friend counts.</p>
      </>
    ),
    thinking: [
      'Two suggestions tie on mutual-friend count — how do you break it? (Instagram leans on shared location, synced contacts, and more. Add one more signal of your own.)',
      'This is "friend-of-a-friend." Which traversal are you using? Could you do it with BFS from the user’s node?',
      "What breaks at Instagram's real scale — 2 billion users? Why can't you just brute-force every user's mutual friends?",
    ],
  },
  {
    title: 'Trending hashtags, in real time',
    concept: 'Streaming · sliding window',
    curiosity:
      'How does Instagram know a hashtag is trending right now, out of millions being posted every minute?',
    task: (
      <p>
        Simulate a stream of 200 posts, each tagged with a random hashtag from a small pool (<Code>#travel</Code>,{' '}
        <Code>#foodie</Code>, <Code>#reels</Code>, <Code>#ipl2026</Code>…) and a timestamp. Build a sliding-window
        counter — only hashtags used in the last 5 (simulated) minutes count — and print the top 3 trending at a few
        different points in time.
      </p>
    ),
    thinking: [
      'Why a sliding window instead of an all-time count? What goes wrong with counting forever?',
      'What structure lets you drop old posts efficiently as time moves forward? Would a queue help?',
      'Real platforms weight velocity too — 5 → 500 uses in ten minutes is more "trending" than a steady 10,000. Add a spike-detection bonus.',
    ],
  },
  {
    title: 'Approximate like counts',
    concept: 'Number formatting',
    curiosity:
      "Once a post gets big, Instagram never shows the exact like count — it rounds to “24.3K” or “1.2M.” That isn't laziness; it's a deliberate call, for both the reader and the servers, at scale.",
    task: (
      <p>
        Write a function that turns a raw integer — e.g. <Code>1284392</Code> — into Instagram&rsquo;s display format,{' '}
        <Code>1.3M</Code>. Handle thousands (K), millions (M) and billions (B), rounded to one decimal.
      </p>
    ),
    thinking: [
      'Why is showing the exact number, live, actually expensive at Instagram’s scale? (How many likes per second land on a viral post — and what would updating an exact counter for millions of viewers cost?)',
      'Read up on "eventual consistency." How does it explain the like count lagging reality by a few seconds?',
    ],
  },
  {
    title: 'Catching bots',
    concept: 'Heuristics · signals',
    curiosity:
      'Instagram is constantly guessing which accounts are real people and which are bots — from patterns, never certainty.',
    task: (
      <p>
        You&rsquo;re given 10 accounts, each with <Code>account_age_days</Code>, <Code>posts_count</Code>,{' '}
        <Code>following_count</Code>, <Code>followers_count</Code> and <Code>comments_are_generic</Code> (yes/no — the
        &ldquo;Nice pic! ♥&rdquo;-on-every-post tell). Write a scorer that flags each account likely bot, suspicious,
        or likely real, on rules you design — e.g. following &gt; 1000 but followers &lt; 10 and age &lt; 7 days is a
        loud red flag.
      </p>
    ),
    thinking: [
      'No single rule holds — a brand-new real account can look suspicious too. How do you combine several weak signals into one confident call? (That’s the core idea behind real spam-detection models.)',
      "Which is worse here: a false positive (flagging a real user) or a false negative (missing a bot)? Which way should the system lean, and why?",
    ],
  },
];

const MASTHEAD: [string, React.ReactNode][] = [
  ['Format', 'Build a tiny working version of a real Instagram feature. Not theory — actual code, actual output, actual "ohh, that’s how it works" moments.'],
  ['Language', 'Open — C, Python, Java, whatever. The logic is the point.'],
  ['Audience', 'Junior coders.'],
];

const FACILITATOR_NOTES = [
  'These are open-ended on purpose — there is no single correct formula or output. Reward the reasoning, not just working code.',
  'After each one, spend three to five minutes tying it to something real: after #2, mention this is close to how early Facebook and LinkedIn built "People You May Know."',
  'Good closer: ask which challenge felt most like "this explains something I always wondered about." Usually #1 (feed ranking) or #4 (like counts).',
  'Short on time? #1, #2 and #3 give the best mix of graphs, sorting and real-time thinking — run just those three.',
];

export default function CodersClubPage() {
  return (
    <main className="min-h-screen font-geist" style={{ background: '#0A0B0D', color: '#EDEEF0' }}>
      <div className="mx-auto max-w-[46rem] px-5 py-14 sm:px-8 sm:py-20">
        <a
          href="/"
          className="font-jetbrains text-[11px] font-bold uppercase tracking-[0.18em] text-white/40 transition hover:text-white"
        >
          &larr; Club Crumbs
        </a>

        {/* Masthead */}
        <header className="mt-12">
          <p className="font-jetbrains text-[11px] font-bold uppercase tracking-[0.24em]" style={{ color: ACCENT }}>
            Coders Club — Workshop
          </p>
          <h1 className="mt-5 font-hanken text-[2.5rem] font-extrabold leading-[0.98] tracking-[-0.035em] text-white sm:text-[3.75rem]">
            How Does Instagram
            <br /> Actually Do That?
          </h1>
          <p className="mt-6 max-w-xl text-[16px] leading-relaxed text-white/60 sm:text-[17px]">
            Five reverse-engineerings of systems Instagram really runs. Each one is a small, honest toy version — the
            aim isn&rsquo;t to rebuild Instagram, it&rsquo;s to walk away with the intuition, then let curiosity take
            it further.
          </p>

          <dl className="mt-10 border-t border-white/[0.09]">
            {MASTHEAD.map(([k, v]) => (
              <div key={k} className="flex flex-col gap-1 border-b border-white/[0.07] py-3.5 sm:flex-row sm:gap-8">
                <dt className="w-24 shrink-0 pt-0.5 font-jetbrains text-[10px] font-bold uppercase tracking-[0.16em] text-white/35">
                  {k}
                </dt>
                <dd className="text-[14px] leading-relaxed text-white/65">{v}</dd>
              </div>
            ))}
          </dl>
        </header>

        {/* Challenges — numbered in the margin, CS concept beneath */}
        <section className="mt-6">
          {CHALLENGES.map((c, i) => (
            <article
              key={c.title}
              className="grid gap-y-5 border-t border-white/[0.09] py-12 md:grid-cols-[5.5rem_1fr] md:gap-x-10"
            >
              <div className="flex items-center gap-4 md:flex-col md:items-start md:gap-2.5">
                <span className="font-jetbrains text-[15px] font-bold tabular-nums" style={{ color: ACCENT }}>
                  {String(i + 1).padStart(2, '0')}
                  <span className="text-white/25"> / {String(CHALLENGES.length).padStart(2, '0')}</span>
                </span>
                <span className="font-jetbrains text-[10px] font-semibold uppercase tracking-[0.14em] text-white/40">
                  {c.concept}
                </span>
              </div>

              <div>
                <h2 className="font-hanken text-[1.6rem] font-bold leading-tight tracking-[-0.02em] text-white">
                  {c.title}
                </h2>
                {/* The hook: the driving question, in display type. */}
                <p className="mt-4 font-hanken text-[19px] font-medium leading-snug text-white/85">{c.curiosity}</p>

                <div className="mt-7">
                  <p className="font-jetbrains text-[10px] font-bold uppercase tracking-[0.18em] text-white/35">
                    Your task
                  </p>
                  <div className="mt-3 space-y-3 text-[15px] leading-relaxed text-white/70">{c.task}</div>
                </div>

                <div className="mt-7">
                  <p className="font-jetbrains text-[10px] font-bold uppercase tracking-[0.18em] text-white/35">
                    Now the real thinking starts
                  </p>
                  <ul className="mt-3.5 space-y-3.5">
                    {c.thinking.map((t, j) => (
                      <li key={j} className="flex gap-3 text-[14px] leading-relaxed text-white/55">
                        <span className="shrink-0 select-none font-jetbrains font-bold" style={{ color: ACCENT }} aria-hidden>
                          &rarr;
                        </span>
                        <span>{t}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </article>
          ))}
        </section>

        {/* Facilitator notes — an appendix, set apart */}
        <section className="mt-4 border-t border-white/[0.09] pt-12">
          <div className="grid gap-y-5 md:grid-cols-[5.5rem_1fr] md:gap-x-10">
            <span className="font-jetbrains text-[10px] font-bold uppercase tracking-[0.14em] text-white/40">
              For facilitators
            </span>
            <ul className="space-y-4">
              {FACILITATOR_NOTES.map((t, i) => (
                <li key={i} className="text-[14px] leading-relaxed text-white/55">
                  {t}
                </li>
              ))}
            </ul>
          </div>
        </section>

        <footer className="mt-16 border-t border-white/[0.07] pt-8">
          <a
            href="/"
            className="font-jetbrains text-[11px] font-bold uppercase tracking-[0.18em] text-white/40 transition hover:text-white"
          >
            &larr; Back to Club Crumbs
          </a>
        </footer>
      </div>
    </main>
  );
}
