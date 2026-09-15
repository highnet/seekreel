import Instrument from '@/components/instrument';
import ContactSheet from '@/components/contact-sheet';
import Commands from '@/components/commands';
import Code from '@/components/code';
import CopyCommand from '@/components/copy-command';
import Timing from '@/components/timing';

const REPO = 'https://github.com/highnet/seekreel';

const STAGE_SAMPLE = `
<div id="box"></div>
<script>
  const t = parseFloat(new URLSearchParams(location.search).get("t") || "0");
  const span = (a, b) => Math.min(1, Math.max(0, (t - a) / (b - a)));

  box.style.opacity = span(0, 1);
  box.style.transform = \`translateY(\${40 * (1 - span(0, 1))}px)\`;

  document.documentElement.setAttribute("data-seekreel-ready", "1");
</script>
`;

const GSAP_SAMPLE = `
const tl = gsap.timeline({ paused: true });
tl.from("#card", { y: 24, opacity: 0, duration: 0.9, ease: "expo.out" }, 0.1)
  .to("#bar i", { scaleX: 1, duration: 3.4, ease: "power1.inOut" }, 1.2)
  .to(".tray", { opacity: 1, duration: 0.5, stagger: 0.13 }, 6.0);

tl.time(t); // the only line that touches the clock
`;

const CUES_SAMPLE = `
{
  "duration": 6,
  "bed": {
    "tempo": 100,
    "progression": [{ "tones": ["D3", "F3", "A3", "C4"], "root": "D2" }],
    "dense": [1.2, 5.2]
  },
  "cues": [
    { "at": 0.1, "sound": "swell", "note": "F2", "dur": 1.4 },
    { "at": 3.0, "sound": "pop" },
    { "at": 4.2, "sound": "chime", "pan": -0.2 }
  ]
}
`;

const SOUNDS = ['marimba', 'bass', 'pad', 'swell', 'chime', 'pip', 'tick', 'shutter', 'pop', 'whoosh', 'stamp', 'tray', 'shaker'];

export default function Home() {
  return (
    <>
      <a
        href="#main"
        className="data sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-sm focus:bg-ink focus:px-3 focus:py-2 focus:text-white"
      >
        Skip to content
      </a>

      <header className="bg-primary text-white">
        <div className="mx-auto flex max-w-[76rem] items-center justify-between gap-6 px-5 py-5 sm:px-8">
          <span className="wide text-2xl font-extrabold tracking-[-0.045em]">seekreel</span>
          <nav aria-label="Primary" className="data flex items-center gap-5">
            <a className="hidden transition-opacity hover:opacity-70 sm:inline" href="#contract">
              How it works
            </a>
            <a className="hidden transition-opacity hover:opacity-70 sm:inline" href="#commands">
              Commands
            </a>
            <a className="underline decoration-white/40 underline-offset-4 transition-colors hover:decoration-white" href={REPO}>
              GitHub ↗
            </a>
          </nav>
        </div>
      </header>

      <main id="main">
        {/* Fold one: the claim, and the thing itself running next to it. */}
        <section className="bg-primary pb-16 text-white sm:pb-20">
          <div className="mx-auto grid max-w-[76rem] gap-12 px-5 sm:px-8 grid-cols-1 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)] lg:items-center lg:gap-16 lg:pb-8">
            <div>
              <h1 className="max-w-[16ch] text-[clamp(2.5rem,6vw,4.6rem)] leading-[0.94] font-extrabold">
                Ship the film, not the screen recording.
              </h1>
              <p className="mt-7 max-w-[46ch] text-lg leading-relaxed text-white/90 sm:text-xl">
                seekreel turns the animation you already built in the browser into a finished MP4 —
                square, 4:5 and silent cuts in the same pass — with every frame drawn exactly as you
                designed it. One command, same result on your laptop and in CI.
              </p>
              <ul className="mt-6 flex list-none flex-wrap gap-x-2 gap-y-2 p-0">
                {['Launch films', 'Feature reels', 'Store listings'].map((use) => (
                  <li key={use} className="data rounded-sm bg-primary-deep px-2.5 py-1 text-white">
                    {use}
                  </li>
                ))}
              </ul>
              <div className="mt-8 max-w-[34rem]">
                <CopyCommand command="npx github:highnet/seekreel init my-film" />
              </div>
              <p className="data mt-4 text-white/90">
                MIT · Node 20+ · not on npm yet, so it installs straight from the repository
              </p>
            </div>

            <div className="lg:pt-6">
              <Instrument />
              <p className="mt-5 max-w-[40ch] text-white/90">
                Drag the scrubber: every moment you land on is exactly the frame the render would
                write to disk.
              </p>
            </div>
          </div>
        </section>

        {/* Fold two: the same film as discrete, examinable frames. */}
        <section className="border-b border-rule py-20 sm:py-28">
          <div className="mx-auto max-w-[76rem] px-5 sm:px-8">
            <div className="grid gap-8 grid-cols-1 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)] lg:items-end">
              <h2 className="text-[clamp(2rem,4.2vw,3.2rem)] leading-[0.98] font-bold">
                Re-cut one shot. Leave the other 287 alone.
              </h2>
              <p className="max-w-[58ch] text-lg leading-relaxed text-muted">
                Changed your mind about second eight? Render second eight. Check any single moment as
                a PNG in about a second — <span className="data text-ink">seekreel probe 3.25</span> —
                before committing to a full pass. Your film stops being a take you have to get right
                and starts being a file you edit.
              </p>
            </div>
            <div className="mt-12">
              <ContactSheet />
            </div>
          </div>
        </section>

        {/* Fold three: the contract a page has to keep. */}
        <section id="contract" className="scroll-mt-8 py-20 sm:py-28">
          <div className="mx-auto max-w-[76rem] px-5 sm:px-8">
            <div className="grid gap-12 grid-cols-1 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:gap-16">
              <div>
                <h2 className="text-[clamp(2rem,4.2vw,3.2rem)] leading-[0.98] font-bold">
                  If it runs in a browser, it ships as video.
                </h2>
                <p className="mt-6 max-w-[46ch] text-lg leading-relaxed text-muted">
                  No timeline app to learn, no export plugin, no runtime to install. Your page takes a
                  timestamp and draws that moment. Three rules, and seekreel does the rest.
                </p>
                <ol className="mt-8 grid list-none grid-cols-1 gap-6 p-0">
                  {[
                    ['Read the timestamp.', 'It arrives as ?t= on the query string, in seconds.'],
                    ['Draw that moment, synchronously.', 'Set properties from t rather than leaving CSS transitions to their own clock.'],
                    ['Say when the frame is final.', 'Stamp data-seekreel-ready on the document and the shutter goes.'],
                  ].map(([rule, detail], i) => (
                    <li key={rule} className="grid grid-cols-[2.5rem_1fr] items-baseline gap-x-4 border-t border-rule pt-4">
                      <span className="data text-primary">{String(i + 1).padStart(2, '0')}</span>
                      <span>
                        <strong className="text-lg font-bold">{rule}</strong>
                        <span className="mt-1 block max-w-[46ch] leading-relaxed text-muted">{detail}</span>
                      </span>
                    </li>
                  ))}
                </ol>
              </div>

              <div className="grid min-w-0 grid-cols-1 content-start gap-8">
                <Code code={STAGE_SAMPLE} lang="html" file="stage.html" />
                <div>
                  <h3 className="text-xl font-bold">Bring your own GSAP timeline</h3>
                  <p className="mt-2 max-w-[52ch] leading-relaxed text-muted">
                    Keep the easing, the staggers and the choreography you already wrote. Build the
                    timeline paused, seek it once, and it renders — just skip callbacks, which a seek
                    passes over.
                  </p>
                  <div className="mt-4 min-w-0">
                    <Code code={GSAP_SAMPLE} lang="js" file="stage.js" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Fold four: the honest comparison, cost included. */}
        <section className="bg-surface py-20 sm:py-28">
          <div className="mx-auto max-w-[76rem] px-5 sm:px-8">
            <div className="grid gap-12 grid-cols-1 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)] lg:items-center lg:gap-20">
              <div>
                <h2 className="text-[clamp(2rem,4.2vw,3.2rem)] leading-[0.98] font-bold">
                  Never re-record because a font loaded late.
                </h2>
                <p className="mt-6 max-w-[54ch] text-lg leading-relaxed text-muted">
                  A recording keeps whatever your machine managed to draw that afternoon: dropped
                  frames, a late font, a scroll two pixels off. Render instead and the file is the
                  same every time — which also means it can rebuild itself in CI whenever the page
                  changes.
                </p>
                <p className="mt-5 max-w-[54ch] text-lg leading-relaxed text-muted">
                  The trade is speed, and we would rather say it up front:{' '}
                  <span className="text-ink">a page load and a screenshot per frame</span>, so budget
                  about a second each. A 43-second film takes roughly twenty minutes. Worth it for
                  something you cut once and re-cut in pieces; wrong for anything interactive.
                </p>
              </div>
              <Timing />
            </div>
          </div>
        </section>

        {/* Fold five: the CLI. */}
        <section id="commands" className="scroll-mt-8 py-20 sm:py-28">
          <div className="mx-auto max-w-[76rem] px-5 sm:px-8">
            <h2 className="max-w-[18ch] text-[clamp(2rem,4.2vw,3.2rem)] leading-[0.98] font-bold">
              From empty folder to finished cut.
            </h2>
            <div className="mt-10">
              <Commands />
            </div>
          </div>
        </section>

        {/* Fold six: sound, kept short because it is one file. */}
        <section className="border-t border-rule py-20 sm:py-28">
          <div className="mx-auto max-w-[76rem] px-5 sm:px-8">
            <div className="grid min-w-0 gap-12 grid-cols-1 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:gap-16">
              <div>
                <h2 className="text-[clamp(2rem,4.2vw,3.2rem)] leading-[0.98] font-bold">
                  Sound you can move by half a second.
                </h2>
                <p className="mt-6 max-w-[52ch] text-lg leading-relaxed text-muted">
                  Cues are synthesized, not sampled — no library to licence, no clearance to chase,
                  and no re-editing audio when a shot shifts. Change the number, rebuild, done. A
                  looping bed sits under one-off hits placed by time, and all it needs is{' '}
                  <span className="data text-ink">python3</span> and its standard library.
                </p>
                <ul className="mt-7 flex list-none flex-wrap gap-2 p-0">
                  {SOUNDS.map((s) => (
                    <li key={s} className="data rounded-sm border border-rule px-2.5 py-1 text-muted">
                      {s}
                    </li>
                  ))}
                </ul>
              </div>
              <Code code={CUES_SAMPLE} lang="json" file="cues.json" />
            </div>
          </div>
        </section>
      </main>

      <footer className="bg-stage py-20 text-white sm:py-24">
        <div className="mx-auto max-w-[76rem] px-5 sm:px-8">
          <div className="grid gap-10 grid-cols-1 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)] lg:items-end">
            <div>
              <h2 className="max-w-[16ch] text-[clamp(2.2rem,5vw,3.8rem)] leading-[0.95] font-extrabold">
                Your next launch film is a page away.
              </h2>
              <p className="mt-5 max-w-[46ch] leading-relaxed text-white/80">
                It was built to cut a 43-second film for{' '}
                <a className="text-primary-lit underline underline-offset-4" href="https://collectiondex.com">
                  Collection Dex
                </a>
                — twelve shots, a synthesized score — and that whole film ships in the repository,
                ready to take apart.
              </p>
            </div>
            <div className="lg:justify-self-end lg:w-[26rem]">
              <CopyCommand command="npm i -g github:highnet/seekreel" tone="dark" />
              <div className="data mt-4 flex flex-wrap gap-x-6 gap-y-2 text-white/60">
                <a className="underline underline-offset-4 transition-colors hover:text-white" href={REPO}>
                  GitHub ↗
                </a>
                <a className="underline underline-offset-4 transition-colors hover:text-white" href={`${REPO}/tree/main/examples/collection-dex`}>
                  The worked example ↗
                </a>
                <a className="underline underline-offset-4 transition-colors hover:text-white" href="https://highnet.at">
                  Built by highnet ↗
                </a>
              </div>
            </div>
          </div>
          <p className="data mt-16 border-t border-white/15 pt-6 text-white/60">
            MIT licensed. GSAP, if you use it, has its own licence and is not distributed here.
          </p>
        </div>
      </footer>
    </>
  );
}
