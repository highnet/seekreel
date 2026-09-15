'use client';

import { useEffect, useRef, useState } from 'react';
import { Tooltip } from '@base-ui/react/tooltip';

/*
 * The install line. Copying is the one thing a visitor does here, so it gets a
 * real control with real feedback rather than a decorative prompt glyph.
 */
export default function CopyCommand({
  command,
  tone = 'light',
}: {
  command: string;
  tone?: 'light' | 'dark';
}) {
  const [copied, setCopied] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);

  async function copy() {
    try {
      await navigator.clipboard.writeText(command);
      setCopied(true);
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard permission denied: the command is selectable text either way.
      setCopied(false);
    }
  }

  const dark = tone === 'dark';

  return (
    <div
      className={[
        'flex max-w-full items-center gap-3 rounded-sm border px-4 py-3',
        dark ? 'border-ink/15 bg-surface' : 'border-white/60 bg-white/10',
      ].join(' ')}
    >
      <span aria-hidden="true" className={dark ? 'data text-primary' : 'data text-white/90'}>
        $
      </span>
      <code className={['data min-w-0 flex-1 overflow-x-auto whitespace-nowrap text-[0.8rem]', dark ? 'text-ink' : 'text-white'].join(' ')}>
        {command}
      </code>
      <Tooltip.Provider>
        <Tooltip.Root>
          <Tooltip.Trigger
            onClick={copy}
            className={[
              'grid size-9 shrink-0 place-items-center rounded-sm border transition-colors duration-150',
              dark
                ? 'border-ink/15 bg-bg text-ink hover:border-primary hover:text-primary'
                : 'border-white/60 bg-transparent text-white hover:bg-white hover:text-primary',
            ].join(' ')}
          >
            <span className="sr-only">{copied ? 'Copied' : `Copy "${command}"`}</span>
            {copied ? (
              <svg viewBox="0 0 16 16" className="size-4" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <path d="M3 8.5l3.5 3.5L13 5" strokeLinecap="square" />
              </svg>
            ) : (
              <svg viewBox="0 0 16 16" className="size-4" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
                <rect x="5.25" y="5.25" width="8" height="8" />
                <path d="M10.75 2.75H2.75v8" />
              </svg>
            )}
          </Tooltip.Trigger>
          <Tooltip.Portal>
            <Tooltip.Positioner sideOffset={8}>
              <Tooltip.Popup className="data rounded-sm bg-ink px-2 py-1 text-white">
                {copied ? 'Copied' : 'Copy'}
              </Tooltip.Popup>
            </Tooltip.Positioner>
          </Tooltip.Portal>
        </Tooltip.Root>
      </Tooltip.Provider>
    </div>
  );
}
