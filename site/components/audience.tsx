'use client';

import { useSyncExternalStore } from 'react';
import AgentBrief from '@/components/agent-brief';

/*
 * The fork.
 *
 * Two kinds of visitor arrive here and they want opposite pages. A person wants
 * to see the film move and be convinced; an agent reading on someone's behalf
 * wants the contract, the flags and the failure modes in as few tokens as
 * possible, and is poorly served by a scrubber it cannot drag.
 *
 * So the page asks rather than sniffs. There is no reliable way to detect an
 * agent — a user-agent string is a claim, not a fact — and guessing wrong costs
 * the visitor the page they came for. The choice sticks per browser, and the
 * control stays visible so it can be taken back.
 */
export type Audience = 'human' | 'agent';

const KEY = 'seekreel:audience';

/*
 * The choice lives in localStorage, and localStorage is external state: it can
 * change in another tab, and it does not exist at all while the page is being
 * rendered on the server. useSyncExternalStore is the hook for exactly that —
 * it hands React a server snapshot ("human") and a client one, so the first
 * paint is the same HTML everywhere and the stored answer arrives without a
 * render caused by an effect.
 */
const listeners = new Set<() => void>();

function subscribe(onChange: () => void) {
  listeners.add(onChange);
  /* Another tab choosing differently should move this one too. */
  window.addEventListener('storage', onChange);
  return () => {
    listeners.delete(onChange);
    window.removeEventListener('storage', onChange);
  };
}

/* Where the choice lives when storage refuses to hold it — a private window,
   or a browser with site data blocked. It lasts as long as the page does,
   which is enough for the fork to work at all. */
let chosen: Audience | null = null;

function readAudience(): Audience {
  try {
    const stored = window.localStorage.getItem(KEY);
    if (stored === 'agent' || stored === 'human') return stored;
  } catch {
    /* Fall through to whatever was chosen in this page view. */
  }
  return chosen ?? 'human';
}

/*
 * Everyone is served the human page first: it is what renders without
 * JavaScript, it is what a crawler and a link preview see, and it is the honest
 * default when nothing is known about who is reading.
 */
const serverAudience = (): Audience => 'human';

function choose(next: Audience) {
  chosen = next;
  try {
    window.localStorage.setItem(KEY, next);
  } catch {
    /* Not remembered, but still chosen. */
  }
  for (const listener of listeners) listener();
}

export default function AudienceFork({ children }: { children: React.ReactNode }) {
  const audience = useSyncExternalStore(subscribe, readAudience, serverAudience);

  return (
    <>
      <div className="border-b border-white/20 bg-primary text-white">
        <div className="mx-auto flex max-w-[76rem] flex-wrap items-center gap-x-4 gap-y-2 px-5 py-2.5 sm:px-8">
          <span className="data text-white/75">Reading this as</span>
          <div role="group" aria-label="Who is reading" className="flex gap-1.5">
            {(
              [
                ['human', "I'm a human", 'The film, the scrubber, the argument.'],
                ['agent', "I'm an agent", 'The contract, the flags, the failure modes.'],
              ] as const
            ).map(([value, label, hint]) => (
              <button
                key={value}
                type="button"
                onClick={() => choose(value)}
                aria-pressed={audience === value}
                title={hint}
                className={[
                  'data rounded-sm border px-3 py-1 transition-colors',
                  audience === value
                    ? 'border-white bg-white text-primary'
                    : 'border-white/40 text-white/85 hover:border-white hover:text-white',
                ].join(' ')}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {audience === 'agent' ? <AgentBrief onLeave={() => choose('human')} /> : children}
    </>
  );
}
