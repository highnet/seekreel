/*
 * The stage: one frame of a twelve-second film, drawn from `t` and nothing
 * else. Same rules the README asks of a real seekreel stage — no clock of its
 * own, no callbacks, every moving value computed from the timestamp — so the
 * scrubber, the contact sheet and a server render all draw the same picture
 * for the same `t`. This is the product, demonstrated rather than described.
 */

export const DURATION = 12;
export const FPS = 24;
export const FRAME_COUNT = DURATION * FPS;

const clamp01 = (x: number) => Math.min(1, Math.max(0, x));
/** Linear progress between two timestamps. */
const span = (t: number, a: number, b: number) => clamp01((t - a) / (b - a));
const outExpo = (x: number) => (x >= 1 ? 1 : 1 - Math.pow(2, -10 * x));
const outQuart = (x: number) => 1 - Math.pow(1 - x, 4);
const inOutCubic = (x: number) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);
const lerp = (a: number, b: number, x: number) => a + (b - a) * x;

export function timecode(t: number) {
  const frame = Math.round(t * FPS) % FPS;
  const seconds = Math.floor(t);
  return `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}.${String(frame).padStart(2, '0')}`;
}

export function frameAt(t: number) {
  return Math.min(FRAME_COUNT - 1, Math.max(0, Math.round(t * FPS)));
}

const CHIPS = [0, 1, 2, 3, 4, 5];

export default function Stage({ t, title = true }: { t: number; title?: boolean }) {
  // Shot 1 — the gate: the frame's own border, drawn before anything is in it.
  // The gate is never fully absent: frame 0 is a frame, and a black rectangle
  // reads as a broken render rather than as the start of a film.
  const gate = 0.25 + 0.75 * outExpo(span(t, 0, 0.9));
  const gateScale = lerp(0.94, 1, outExpo(span(t, 0, 0.9)));

  // Shot 2 — the title, revealed by a mask rather than typed. A callback-driven
  // typewriter renders blank on a seek; a clip-path is a property, so it holds.
  const wipeA = outQuart(span(t, 0.7, 2.0));
  const wipeB = outQuart(span(t, 1.0, 2.4));

  // Shot 3 — the sheet: eight frames arriving one after another.
  const chipsOut = outQuart(span(t, 7.6, 8.6));

  // Shot 4 — the render pass, and the counter that follows it.
  const render = inOutCubic(span(t, 4.2, 9.0));
  const counted = Math.round(render * FRAME_COUNT);
  const scan = span(t, 2.2, 9.0);

  // Shot 5 — the encode: the strip becomes one file.
  const encode = outExpo(span(t, 8.4, 9.6));
  const stampScale = lerp(1.35, 1, encode);

  // Shot 6 — the endcard.
  const end = outQuart(span(t, 10.0, 11.2));

  // Clip-path ids are document-global: the contact sheet renders a dozen of
  // these on one page, so each instance keys its ids to its own timestamp.
  const uid = `s${Math.round(t * 1000)}`;

  return (
    <svg
      viewBox="0 0 1080 1080"
      className="block h-full w-full"
      role="img"
      aria-label={`Frame ${frameAt(t)} of a twelve-second film, drawn at ${t.toFixed(3)} seconds`}
    >
      <defs>
        <clipPath id={`${uid}-wipeA`}>
          <rect x="110" y="292" width={880 * wipeA} height="128" />
        </clipPath>
        <clipPath id={`${uid}-wipeB`}>
          <rect x="110" y="420" width={880 * wipeB} height="136" />
        </clipPath>
        <clipPath id={`${uid}-gate`}>
          <rect x="60" y="60" width="960" height="960" rx="8" />
        </clipPath>
      </defs>

      <rect width="1080" height="1080" fill="var(--color-stage)" />

      {/* Ruling: the dope sheet under everything, faint until the render pass
          lights it up. */}
      <g opacity={0.08 + 0.1 * gate} clipPath={`url(#${uid}-gate)`}>
        {Array.from({ length: 11 }, (_, i) => (
          <line key={`v${i}`} x1={60 + i * 96} y1="60" x2={60 + i * 96} y2="1020" stroke="white" strokeWidth="1" />
        ))}
        {Array.from({ length: 11 }, (_, i) => (
          <line key={`h${i}`} x1="60" y1={60 + i * 96} x2="1020" y2={60 + i * 96} stroke="white" strokeWidth="1" />
        ))}
      </g>

      {/* The scan line: where the renderer is in the frame. */}
      <g clipPath={`url(#${uid}-gate)`} opacity={0.55 * (1 - end)}>
        <rect x="60" y={lerp(60, 1020, scan)} width="960" height="2" fill="var(--color-primary-lit)" opacity="0.7" />
      </g>

      <g transform={`translate(540 540) scale(${gateScale}) translate(-540 -540)`}>
        {/* Shot 1: the gate. */}
        <rect
          x="60"
          y="60"
          width="960"
          height="960"
          rx="8"
          fill="none"
          stroke="white"
          strokeOpacity={0.35 * gate}
          strokeWidth="2"
        />
        {/* Corner registration marks — the frame's own alignment, not decoration. */}
        {[
          [60, 60, 1, 1],
          [1020, 60, -1, 1],
          [60, 1020, 1, -1],
          [1020, 1020, -1, -1],
        ].map(([x, y, sx, sy], i) => (
          <path
            key={i}
            d={`M ${x} ${y + sy * 54} L ${x} ${y} L ${x + sx * 54} ${y}`}
            fill="none"
            stroke="var(--color-primary-lit)"
            strokeOpacity={0.9 * gate}
            strokeWidth="3"
          />
        ))}

        {/* Shot 2: the title. */}
        {title && (
          <g opacity={1 - end}>
            <g clipPath={`url(#${uid}-wipeA)`}>
              <text x="120" y="392" fill="white" fontFamily="var(--font-display)" fontSize="108" fontWeight="700" style={{ fontVariationSettings: '"wdth" 118' }} letterSpacing="-4">
                ONE FRAME
              </text>
            </g>
            <g clipPath={`url(#${uid}-wipeB)`}>
              <text x="120" y="522" fill="var(--color-primary-lit)" fontFamily="var(--font-display)" fontSize="108" fontWeight="700" style={{ fontVariationSettings: '"wdth" 118' }} letterSpacing="-4">
                PER SEEK.
              </text>
            </g>
          </g>
        )}

        {/* Shot 6: the endcard replaces the title in the same optical slot. */}
        {title && end > 0 && (
          <g opacity={end}>
            <text x="120" y="470" fill="white" fontFamily="var(--font-display)" fontSize="132" fontWeight="800" style={{ fontVariationSettings: '"wdth" 90' }} letterSpacing="-6">
              seekreel
            </text>
            <text x="126" y="540" fill="var(--color-primary-lit)" fontFamily="var(--font-mono)" fontSize="34" letterSpacing="2">
              deliver/reel.mp4
            </text>
          </g>
        )}

        {/* Shot 3 + 5: the chips arrive one by one, then leave as a strip. */}
        <g transform={`translate(${-980 * chipsOut} 0)`}>
          {CHIPS.map((i) => {
            const inAt = 2.6 + i * 0.26;
            const arrive = outExpo(span(t, inAt, inAt + 0.7));
            if (arrive <= 0) return null;
            const x = 120 + i * 144;
            return (
              <g key={i} opacity={arrive} transform={`translate(0 ${lerp(26, 0, arrive)})`}>
                <rect x={x} y="620" width="124" height="124" rx="4" fill="white" fillOpacity={0.08} stroke="white" strokeOpacity={0.35} />
                <rect x={x + 14} y="636" width="96" height="58" rx="2" fill="var(--color-primary)" fillOpacity={0.3 + 0.6 * arrive} />
                <text x={x + 14} y="730" fill="white" fillOpacity="0.8" fontFamily="var(--font-mono)" fontSize="28">
                  {String(i * 48).padStart(3, '0')}
                </text>
              </g>
            );
          })}
        </g>

        {/* Shot 4: the render bar and its counter. */}
        <g opacity={span(t, 4.0, 4.6) * (1 - 0.35 * end)}>
          <rect x="120" y="852" width="840" height="10" fill="white" fillOpacity="0.14" />
          <rect x="120" y="852" width={840 * render} height="10" fill="var(--color-primary)" />
          <rect x={120 + 840 * render - 2} y="840" width="4" height="34" fill="var(--color-primary-lit)" />
          <text x="120" y="920" fill="white" fillOpacity="0.8" fontFamily="var(--font-mono)" fontSize="28">
            frame {String(counted).padStart(3, '0')} / {FRAME_COUNT}
          </text>
          <text x="960" y="920" textAnchor="end" fill="var(--color-primary-lit)" fontFamily="var(--font-mono)" fontSize="28">
            {Math.round(render * 100)}%
          </text>
        </g>

        {/* Shot 5: the file the frames become. */}
        {encode > 0 && (
          <g opacity={encode} transform={`translate(540 700) scale(${stampScale}) translate(-540 -700)`}>
            <rect x="330" y="640" width="420" height="120" rx="6" fill="var(--color-primary)" />
            <text x="540" y="716" textAnchor="middle" fill="white" fontFamily="var(--font-display)" fontSize="64" fontWeight="700" style={{ fontVariationSettings: '"wdth" 112' }}>
              H.264
            </text>
          </g>
        )}
      </g>
    </svg>
  );
}
