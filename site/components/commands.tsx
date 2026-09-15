'use client';

import { Tabs } from '@base-ui/react/tabs';
import Code from './code';

/*
 * The four commands that matter in order of use. Tabs rather than a table: the
 * interesting part of each command is what it writes, and that needs room.
 */
const COMMANDS = [
  {
    id: 'init',
    command: 'seekreel init my-film',
    blurb: 'Copies the starter project — a stage, a config, and a cue sheet — into a new directory.',
    writes: ['stage.html', 'seekreel.config.json', 'cues.json'],
  },
  {
    id: 'probe',
    command: 'seekreel probe 3.25,8',
    blurb: 'Renders only the timestamps you name. One frame takes about a second, so this is how you iterate.',
    writes: ['probe/0078.png', 'probe/0192.png'],
  },
  {
    id: 'render',
    command: 'seekreel render 480 620',
    blurb: 'Redraws frames 480 to 620 in place and leaves the rest of the render alone. Omit the range to render everything.',
    writes: ['out/0480.png … out/0620.png'],
  },
  {
    id: 'build',
    command: 'seekreel build',
    blurb: 'Audio, then every frame, then ffmpeg — one command from a page to the files you upload.',
    writes: ['soundtrack.wav', 'out/*.png', 'deliver/reel.mp4', 'deliver/reel-4x5.mp4'],
  },
];

export default function Commands() {
  return (
    <Tabs.Root defaultValue="build" className="w-full">
      <Tabs.List className="relative flex flex-wrap gap-x-6 gap-y-2 border-b border-rule">
        {COMMANDS.map((c) => (
          <Tabs.Tab
            key={c.id}
            value={c.id}
            className="data cursor-pointer border-0 bg-transparent px-0 pb-3 pt-1 text-muted transition-colors duration-150 select-none hover:text-ink data-selected:text-ink"
          >
            seekreel {c.id}
          </Tabs.Tab>
        ))}
        <Tabs.Indicator className="absolute bottom-0 left-0 h-0.5 w-(--active-tab-width) translate-x-(--active-tab-left) bg-primary transition-[translate,width] duration-200 ease-[cubic-bezier(0.25,1,0.5,1)]" />
      </Tabs.List>

      {COMMANDS.map((c) => (
        <Tabs.Panel key={c.id} value={c.id} className="pt-6 outline-none">
          <div className="grid min-w-0 gap-6 grid-cols-1 md:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] md:items-start">
            <p className="max-w-[46ch] text-lg leading-relaxed text-muted md:text-xl">{c.blurb}</p>
            <div className="min-w-0">
              <Code code={`$ ${c.command}`} lang="sh" file="terminal" />
              <ul className="mt-3 flex list-none flex-wrap gap-x-4 gap-y-1 p-0">
                {c.writes.map((w) => (
                  <li key={w} className="data text-muted">
                    <span aria-hidden="true" className="text-primary">→ </span>
                    {w}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </Tabs.Panel>
      ))}
    </Tabs.Root>
  );
}
