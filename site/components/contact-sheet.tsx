'use client';

import { Tooltip } from '@base-ui/react/tooltip';
import Stage, { frameAt } from './stage';

/*
 * Twelve timestamps from the same film. Nothing here is a video still pulled
 * from a render — each cell is the stage drawn again at its own `t`, which is
 * exactly what `seekreel probe` does on the command line.
 */
const MOMENTS = [0.4, 1.2, 2, 2.9, 3.6, 4.6, 5.6, 6.8, 7.8, 8.7, 9.6, 11.2];

export default function ContactSheet() {
  return (
    <Tooltip.Provider delay={120}>
      <ul className="grid list-none grid-cols-2 gap-px border border-rule bg-rule p-0 sm:grid-cols-3 lg:grid-cols-6">
        {MOMENTS.map((t) => (
          <li key={t} className="bg-bg">
            <Tooltip.Root>
              <Tooltip.Trigger
                render={<figure className="m-0 block cursor-help p-2 transition-colors duration-150 hover:bg-surface" />}
              >
                <div className="overflow-hidden bg-stage">
                  <Stage t={t} />
                </div>
                <figcaption className="data mt-2 flex items-baseline justify-between text-muted">
                  <span className="text-ink">{t.toFixed(2)}s</span>
                  <span>{String(frameAt(t)).padStart(4, '0')}</span>
                </figcaption>
              </Tooltip.Trigger>
              <Tooltip.Portal>
                <Tooltip.Positioner sideOffset={8}>
                  <Tooltip.Popup className="data max-w-64 rounded-sm bg-ink px-2.5 py-1.5 text-white">
                    seekreel probe {t} → probe/{String(frameAt(t)).padStart(4, '0')}.png
                  </Tooltip.Popup>
                </Tooltip.Positioner>
              </Tooltip.Portal>
            </Tooltip.Root>
          </li>
        ))}
      </ul>
    </Tooltip.Provider>
  );
}
