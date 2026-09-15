/*
 * What "a pure function of time" buys, drawn rather than claimed: a recorder
 * takes whatever the machine hands it, so its frames land unevenly and some
 * never land at all. A renderer asks for a timestamp and waits, so the frames
 * are exactly where the timeline says. The spacing below is the argument.
 */
const RECORDED = [0, 1.1, 2, 3.4, 4, 5.2, 6, 7.9, 9, 10.1, 11, 12.6, 14, 15];
const DROPPED = new Set([3.4, 7.9, 12.6]);
const SEEKED = Array.from({ length: 16 }, (_, i) => i);

export default function Timing() {
  return (
    <figure className="m-0">
      <svg viewBox="0 0 320 132" className="w-full" role="img" aria-label="Recorded frames land unevenly and three are dropped; seeked frames land on every timestamp.">
        <line x1="8" y1="36" x2="312" y2="36" stroke="var(--color-rule)" strokeWidth="1" />
        {RECORDED.map((x) => (
          <rect
            key={`r${x}`}
            x={8 + x * 20.2}
            y={DROPPED.has(x) ? 26 : 8}
            width="4"
            height={DROPPED.has(x) ? 14 : 42}
            fill={DROPPED.has(x) ? 'var(--color-rule)' : 'var(--color-ink)'}
          />
        ))}
        <line x1="8" y1="116" x2="312" y2="116" stroke="var(--color-rule)" strokeWidth="1" />
        {SEEKED.map((x) => (
          <rect key={`s${x}`} x={8 + x * 20.2} y="74" width="4" height="42" fill="var(--color-primary)" />
        ))}
      </svg>
      <figcaption className="mt-3 grid grid-cols-1 gap-1">
        <span className="data text-muted">above · screen recording, 3 frames dropped</span>
        <span className="data text-primary">below · seekreel, one frame per timestamp</span>
      </figcaption>
    </figure>
  );
}
