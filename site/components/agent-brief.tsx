'use client';

import { useState } from 'react';

/*
 * The agent page.
 *
 * Everything an agent needs to drive seekreel without reading the homepage's
 * argument: the contract, the config, the commands, and — the part that
 * actually saves a wasted twenty-minute render — the mistakes that produce a
 * file which is technically valid and visibly wrong.
 *
 * It is one column of prose and pre blocks on purpose. No scrubber, no contact
 * sheet, no film: none of it survives being read as text, and all of it costs
 * tokens.
 */

const REPO = 'https://github.com/highnet/seekreel';
const SKILLS = `${REPO}/blob/main/SKILLS.md`;
const SKILLS_RAW = 'https://raw.githubusercontent.com/highnet/seekreel/main/SKILLS.md';

const STAGE = `<!-- stage.html — the entire interface -->
<div id="box"></div>
<script>
  const t = parseFloat(new URLSearchParams(location.search).get("t") || "0");
  const span = (a, b) => Math.min(1, Math.max(0, (t - a) / (b - a)));

  box.style.opacity = span(0, 1);
  box.style.transform = \`translateY(\${40 * (1 - span(0, 1))}px)\`;

  document.documentElement.setAttribute("data-seekreel-ready", "1");
</script>`;

const CONFIG = `{
  "name": "reel",
  "stage": "stage.html",
  "duration": 16,
  "fps": 24,
  "width": 1080,
  "height": 1080,
  "background": "#ffffff",
  "poster": 14.8,
  "webgl": false,
  "audio": {
    "engine": "strudel",
    "pattern": "music.strudel.js",
    "bundle": "strudel.mjs",
    "cps": 0.625
  },
  "variants": [
    { "name": "" },
    { "name": "4x5",      "ratio": "4:5" },
    { "name": "vertical", "ratio": "9:16" },
    { "name": "loop",     "format": "gif", "fps": 12 },
    { "name": "silent",   "audio": false }
  ]
}`;

const PATTERN = `setcps(0.625)

stack(
  note("c1").s("sine").struct("x ~ ~ ~ x ~ ~ ~").decay(.26).sustain(0),
  s("white").struct("x*8").decay(.03).sustain(0).hpf(7200).gain("[.3 .14]*4"),
  note("<c2 ab1 eb2 bb1>").s("sawtooth").lpf(sine.range(420, 1500).slow(4)),
  note("<[c3,eb3,g3] [ab2,c3,eb3]>").s("triangle").attack(.8).room(.7).gain(.34)
)`;

const THREE_STAGE = `import * as THREE from "./three.module.js";   // stages are served, so this works

const t = parseFloat(new URLSearchParams(location.search).get("t") || "0");
const angle = (t / DURATION) * Math.PI * 2;      // never \`+= 0.01\`
camera.position.set(Math.sin(angle) * 11.5, 4.4, Math.cos(angle) * 11.5);
camera.lookAt(0, 1.1, 0);

renderer.render(scene, camera);
document.documentElement.setAttribute("data-seekreel-ready", "1");`;

const REACT_STAGE = `import { createRoot } from "react-dom/client";
import { flushSync } from "react-dom";
import { time, renderReact } from "/_seekreel/stage.js";

// flushSync or the frame is blank: React 19 returns before it commits.
renderReact({ root: createRoot(document.getElementById("stage")), flushSync },
            <Film t={time()} />);`;

const COMMANDS: [string, string][] = [
  ['seekreel init <dir>', 'scaffold a project from the starter template'],
  ['seekreel doctor', 'check Chromium, ffmpeg and the formats before rendering'],
  ['seekreel probe 3.2,9.6', 'render only those timestamps to probe/ — about a second each'],
  ['seekreel render [a] [b]', 'render every frame, or only frames a..b, in place'],
  ['seekreel audio', 'render the soundtrack to a WAV'],
  ['seekreel strudel', 'fetch the Strudel bundle the audio engine needs, once'],
  ['seekreel encode', 'cut every variant from the frames already on disk'],
  ['seekreel build', 'audio, then render, then encode'],
  ['-c, --config <path>', 'any command, against a config somewhere else'],
];

const TRAPS: [string, string][] = [
  [
    'A CSS animation or transition',
    'It has a clock of its own and will be caught mid-way at a different phase on every machine. Set the property from t instead. The same goes for requestAnimationFrame, Date.now, and Math.random without a seed.',
  ],
  [
    'Marking the frame ready too early',
    'data-seekreel-ready is a promise that the picture is final. Set it after the last synchronous write. Fonts are waited for separately — seekreel awaits document.fonts.ready — but an image or a fetch is yours to await first.',
  ],
  [
    'Odd width or height',
    'H.264 cannot encode an odd dimension. The config is rejected before the render rather than after it.',
  ],
  [
    'A variant fps above the render fps',
    'Frames that were never drawn cannot be invented. Raise the top-level fps instead.',
  ],
  [
    'Assuming a ratio crops',
    'A ratio keeps the picture and changes the canvas, padding with background. Pass "fit": "cover" when you do want it cropped.',
  ],
  [
    'Reaching for npm i -g seekreel',
    'There is no registry package. Install with the curl line above, or clone the repo — the tool is TypeScript that Node runs without a build step, so a checkout is already runnable.',
  ],
  [
    'Rendering React without flushSync',
    'React 19 schedules rendering, so root.render() returns before the commit and a frame marked ready on the next line screenshots an empty document — every frame, with nothing in the logs. Use renderReact({ root, flushSync }, element) from /_seekreel/stage.js, and keep the tree a pure function of props: no surviving state, no effects, no suspense fallback standing in for content.',
  ],
  [
    'Driving a 3D scene with a delta',
    'mixer.update(delta) and rotation.y += 0.01 both accumulate, and a renderer that loads one page per frame has nothing to accumulate from. Use mixer.setTime(t) and compute every transform from t. Set "webgl": true so Chromium renders with software GL and the scene shades the same everywhere.',
  ],
  [
    'Strudel sounds that need samples',
    's("bd") and friends load sample packs over the network. Synth voices — sine, sawtooth, triangle, square, white, pink, brown — render offline and are the safe default. Noise and reverb come out a little different on each render, which is expected: seekreel audio writes the WAV once and every later step reads that file.',
  ],
  [
    'Rendering everything to check one moment',
    'probe renders one timestamp in about a second; render a b redraws a range in place. A full pass costs roughly a second per frame.',
  ],
];

export default function AgentBrief({ onLeave }: { onLeave: () => void }) {
  const [copied, setCopied] = useState(false);

  async function copyBrief() {
    const markdown = [
      '# seekreel — brief for agents',
      '',
      'Turns a website into video: build a page from the site\'s own components, and seekreel',
      'renders it a frame at a time. The page draws the frame for a timestamp, seekreel',
      'screenshots every frame, ffmpeg stitches them. Deterministic — frame N is the same on any',
      'machine, which is what makes it safe for an agent to render, check a frame and rebuild.',
      'Cost: about one second per frame, two for WebGL.',
      '',
      'Install (git, not npm):',
      '  curl -fsSL https://raw.githubusercontent.com/highnet/seekreel/main/install.sh | sh',
      'Needs Node 22.18+ (the tool is TypeScript run without a build step), a Chromium, ffmpeg.',
      '',
      `Full skill file: ${SKILLS_RAW}`,
      '',
      '## The contract',
      '1. Read t (seconds) from the query string.',
      '2. Draw that frame synchronously.',
      '3. Set data-seekreel-ready on <html>.',
      '',
      '## Stage',
      '```html',
      STAGE,
      '```',
      '',
      '## Config',
      '```json',
      CONFIG,
      '```',
      '',
      '## React',
      'A tree that is a pure function of t. flushSync or the frame is blank.',
      '```jsx',
      REACT_STAGE,
      '```',
      '',
      '## 3D',
      'Set "webgl": true for three.js or raw WebGL — software GL, identical output per machine.',
      '```js',
      THREE_STAGE,
      '```',
      '',
      '## Commands',
      ...COMMANDS.map(([command, what]) => `- \`${command}\` — ${what}`),
      '',
      '## Failure modes',
      ...TRAPS.map(([trap, why]) => `- **${trap}** — ${why}`),
      '',
    ].join('\n');

    try {
      await navigator.clipboard.writeText(markdown);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* Clipboard denied: every block on the page is still selectable. */
      setCopied(false);
    }
  }

  return (
    <main id="main" className="mx-auto max-w-[62rem] px-5 py-12 sm:px-8 sm:py-16">
      <h1 className="wide text-[clamp(2rem,5vw,3.4rem)] leading-[0.95] font-extrabold">
        seekreel, for agents
      </h1>
      <p className="mt-5 max-w-[68ch] text-lg leading-relaxed text-muted">
        A CLI for turning a website into video: you build a page that draws the product off — the
        site&apos;s own components, brand and fonts — and seekreel renders it a frame at a time.
        The page draws the frame for a timestamp, seekreel screenshots every frame, ffmpeg stitches
        them. Frame N is identical on any machine and on any run, which is what makes this
        agent-drivable: render, look at one frame, fix it, rebuild, with nobody watching. The cost
        is a page load and a screenshot per frame — budget about a second each.
      </p>

      <div className="mt-8 flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={copyBrief}
          className="data rounded-sm bg-primary px-4 py-2.5 text-white transition-opacity hover:opacity-90"
        >
          {copied ? 'Copied ✓' : 'Copy this page as markdown'}
        </button>
        <a
          href={SKILLS}
          className="data rounded-sm border border-rule px-4 py-2.5 transition-colors hover:border-ink"
        >
          SKILLS.md ↗
        </a>
        <a
          href={REPO}
          className="data rounded-sm border border-rule px-4 py-2.5 transition-colors hover:border-ink"
        >
          Repository ↗
        </a>
        <button
          type="button"
          onClick={onLeave}
          className="data text-muted underline underline-offset-4 transition-colors hover:text-ink"
        >
          Show me the human page instead
        </button>
      </div>

      <Section title="Install">
        <p className="max-w-[68ch] leading-relaxed text-muted">
          Distributed by git, not by a package registry. The installer clones to{' '}
          <code className="data text-ink">~/.seekreel</code> and links the CLI into{' '}
          <code className="data text-ink">~/.local/bin</code>.
        </p>
        <Pre className="mt-5">{`curl -fsSL https://raw.githubusercontent.com/highnet/seekreel/main/install.sh | sh
seekreel doctor                    # verifies chromium, ffmpeg, formats

# or work from a checkout — TypeScript, no build step:
git clone https://github.com/highnet/seekreel && cd seekreel
npm install --omit=dev             # playwright-core, the one runtime dependency
node bin/seekreel.ts doctor

# needs: node >= 22.18, a chromium, ffmpeg with libx264`}</Pre>
      </Section>

      <Section title="The contract a page has to keep">
        <ol className="grid list-none grid-cols-1 gap-3 p-0">
          {[
            ['Read t from the query string, in seconds.', '?t=21.3333'],
            ['Draw that frame synchronously.', 'every value derived from t, nothing accumulated'],
            ['Say the frame is final.', 'document.documentElement.setAttribute("data-seekreel-ready", "1")'],
          ].map(([rule, detail], i) => (
            <li key={rule} className="grid grid-cols-[2.2rem_1fr] items-baseline gap-x-3 border-t border-rule pt-3">
              <span className="data text-primary">{String(i + 1).padStart(2, '0')}</span>
              <span>
                <strong className="font-bold">{rule}</strong>
                <span className="data mt-1 block text-muted">{detail}</span>
              </span>
            </li>
          ))}
        </ol>
        <Pre className="mt-6">{STAGE}</Pre>
      </Section>

      <Section title="3D and WebGL">
        <p className="max-w-[68ch] leading-relaxed text-muted">
          Set <code className="data text-ink">&quot;webgl&quot;: true</code> and Chromium launches with
          ANGLE on SwiftShader — software rendering, so a scene shades the same on every machine
          instead of picking up whatever driver is present. Two renders of one timestamp, in two
          processes, give the same PNG byte for byte. Stages are served over loopback rather than
          opened from <code className="data text-ink">file://</code>, which is what makes an ES module
          import (three.js ships as one) work at all. Budget about two seconds a frame.
        </p>
        <Pre className="mt-5">{THREE_STAGE}</Pre>
      </Section>

      <Section title="React">
        <p className="max-w-[68ch] leading-relaxed text-muted">
          A component tree that is a pure function of <code className="data text-ink">t</code> is a
          film. The helpers at <code className="data text-ink">/_seekreel/stage.js</code> are served
          with every render — <code className="data text-ink">time</code>,{' '}
          <code className="data text-ink">span</code>, <code className="data text-ink">frame</code>,{' '}
          <code className="data text-ink">markReady</code>,{' '}
          <code className="data text-ink">markReadyWhenLoaded</code> and{' '}
          <code className="data text-ink">renderReact</code> — so there is nothing to install.
        </p>
        <Pre className="mt-5">{REACT_STAGE}</Pre>
      </Section>

      <Section title="Config">
        <p className="max-w-[68ch] leading-relaxed text-muted">
          Every path resolves against the config file, not the working directory. One render feeds
          every variant: a <code className="data text-ink">ratio</code> keeps the picture and changes
          the canvas shape, padding with <code className="data text-ink">background</code>.
        </p>
        <Pre className="mt-5">{CONFIG}</Pre>
      </Section>

      <Section title="Sound: two engines">
        <p className="max-w-[68ch] leading-relaxed text-muted">
          <code className="data text-ink">cues</code> is a JSON sheet of synthesized one-off sounds
          placed by timestamp, rendered by python3 and its standard library — right when the
          soundtrack exists to land on cuts.{' '}
          <code className="data text-ink">strudel</code> is a pattern in the{' '}
          <a className="underline underline-offset-4" href="https://strudel.cc">
            Strudel
          </a>{' '}
          language, rendered offline in the same Chromium that shoots the frames — right when you
          want music with a grid of its own. Set{' '}
          <code className="data text-ink">cps</code> so a cycle divides the film: at 0.625 a cycle is
          1.6s, so a sixteen-second film is ten of them and the cuts can land on downbeats.
        </p>
        <Pre className="mt-5">{PATTERN}</Pre>
      </Section>

      <Section title="Commands">
        <dl className="grid grid-cols-1 gap-x-8 gap-y-3">
          {COMMANDS.map(([command, what]) => (
            <div key={command} className="grid grid-cols-1 gap-1 border-t border-rule pt-3 sm:grid-cols-[22rem_1fr] sm:gap-4">
              <dt className="data text-primary">{command}</dt>
              <dd className="leading-relaxed text-muted">{what}</dd>
            </div>
          ))}
        </dl>
      </Section>

      <Section title="Failure modes worth knowing before a twenty-minute render">
        <dl className="grid grid-cols-1 gap-y-4">
          {TRAPS.map(([trap, why]) => (
            <div key={trap} className="border-t border-rule pt-3">
              <dt className="font-bold">{trap}</dt>
              <dd className="mt-1 max-w-[72ch] leading-relaxed text-muted">{why}</dd>
            </div>
          ))}
        </dl>
      </Section>

      <Section title="Source">
        <p className="max-w-[68ch] leading-relaxed text-muted">
          TypeScript, run by Node&apos;s own type stripping — there is no{' '}
          <code className="data text-ink">dist/</code> and nothing to compile. That constrains the
          source to erasable syntax (no enums, no parameter properties, no decorators), which{' '}
          <code className="data text-ink">tsconfig.json</code> enforces with{' '}
          <code className="data text-ink">erasableSyntaxOnly</code>.{' '}
          <code className="data text-ink">npm run typecheck</code> is{' '}
          <code className="data text-ink">tsc --noEmit</code> and emits nothing by design. Stages stay
          HTML and JavaScript: a browser cannot strip types.
        </p>
      </Section>

      <Section title="Worked examples in the repository">
        <ul className="grid list-none grid-cols-1 gap-3 p-0">
          {[
            ['examples/linkedin-promo', 'sixteen seconds, plain JavaScript, a Strudel soundtrack, five deliverables from one render'],
            ['examples/three-orbit', 'eight seconds of three.js: webgl on, camera angle computed from t, frames identical across processes'],
            ['examples/react-stage', 'six seconds of React with no build step: browser modules, htm templates, flushSync'],
            ['examples/collection-dex', 'forty-three seconds, a paused GSAP timeline, a JSON cue sheet'],
            ['templates/starter', 'what seekreel init writes: the contract in ninety lines, no dependencies'],
          ].map(([where, what]) => (
            <li key={where} className="grid grid-cols-1 gap-1 border-t border-rule pt-3 sm:grid-cols-[20rem_1fr] sm:gap-4">
              <a className="data text-primary underline underline-offset-4" href={`${REPO}/tree/main/${where}`}>
                {where} ↗
              </a>
              <span className="leading-relaxed text-muted">{what}</span>
            </li>
          ))}
        </ul>
      </Section>

      <p className="data mt-14 border-t border-rule pt-6 text-muted">
        MIT licensed. This page is a summary; <a className="underline underline-offset-4" href={SKILLS}>SKILLS.md</a>{' '}
        in the repository is the version that gets updated with the tool.
      </p>
    </main>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-14">
      <h2 className="text-2xl font-bold tracking-[-0.03em]">{title}</h2>
      <div className="mt-5">{children}</div>
    </section>
  );
}

function Pre({ children, className = '' }: { children: string; className?: string }) {
  return (
    <pre
      className={`data overflow-x-auto rounded-sm border border-rule bg-surface p-4 leading-relaxed text-accent ${className}`}
    >
      {children}
    </pre>
  );
}
