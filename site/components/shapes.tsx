/*
 * Same picture, four canvases. The filled square is what you rendered; the
 * outlines are the shapes a config can ask for. Nothing scales down — the
 * canvas grows around the frame — which is the part that is hard to say in a
 * sentence and obvious in a drawing.
 */
const SHAPES = [
  { label: '16:9', w: 178, h: 100 },
  { label: '9:16', w: 100, h: 178 },
  { label: '4:5', w: 100, h: 125 },
];

const CX = 130;
const CY = 120;

export default function Shapes() {
  return (
    <figure className="m-0">
      <svg
        viewBox="0 0 260 244"
        className="w-full max-w-[26rem]"
        role="img"
        aria-label="One square render, with 16:9, 9:16 and 4:5 canvases drawn around it."
      >
        {SHAPES.map((s) => (
          <g key={s.label}>
            <rect
              x={CX - s.w / 2}
              y={CY - s.h / 2}
              width={s.w}
              height={s.h}
              fill="none"
              stroke="var(--color-ink)"
              strokeOpacity="0.28"
              strokeDasharray="3 3"
            />
            <text
              x={CX + s.w / 2 - 4}
              y={CY - s.h / 2 - 6}
              textAnchor="end"
              fill="var(--color-muted)"
              fontFamily="var(--font-mono)"
              fontSize="10"
            >
              {s.label}
            </text>
          </g>
        ))}
        <rect x={CX - 50} y={CY - 50} width="100" height="100" fill="var(--color-primary)" />
        <text
          x={CX}
          y={CY + 4}
          textAnchor="middle"
          fill="white"
          fontFamily="var(--font-mono)"
          fontSize="10"
        >
          1:1
        </text>
        <text
          x={CX}
          y={CY + 178 / 2 + 16}
          textAnchor="middle"
          fill="var(--color-muted)"
          fontFamily="var(--font-mono)"
          fontSize="10"
        >
          one render
        </text>
      </svg>
    </figure>
  );
}
