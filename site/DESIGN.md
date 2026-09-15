# seekreel — design system

## Scene and strategy

Scene: an animation studio at 3am — a dope sheet under a desk lamp, magenta
printer ink still tacky on the frame numbers, the room otherwise unlit.

Color strategy: **Committed**. One saturated magenta carries the first fold,
every live control, and every active state. The page is otherwise pure white,
because the frames are the only thing that should be colorful in the middle of
it. The second voice is a deep indigo, used in code and small accents.

## Tokens

Defined in `app/globals.css` under `@theme`, in OKLCH.

| Token | Value | Role |
|---|---|---|
| `--color-bg` | `oklch(1 0 0)` | Page. Pure white, no hidden warmth. |
| `--color-surface` | `oklch(0.971 0.006 340)` | Section panels, tinted a trace toward the brand. |
| `--color-ink` | `oklch(0.2 0.03 340)` | Body text (18.2:1 on white). |
| `--color-muted` | `oklch(0.52 0.02 340)` | Secondary text (5.6:1 on white). |
| `--color-primary` | `oklch(0.55 0.21 340)` | The brand. White text on it clears 4.5:1. |
| `--color-primary-lit` | `oklch(0.74 0.17 340)` | The same voice on the dark stage. |
| `--color-accent` | `oklch(0.34 0.13 264)` | Machine ink: code tokens, small accents. |
| `--color-stage` | `oklch(0.16 0.02 340)` | Inside the frame gate, and the footer. |

Contrast rules that bind: on magenta, white below 90% opacity stops clearing
4.5:1 — so small type on the first fold is white or `white/90`, never lighter.

## Type

- **Anybody** (variable, `wdth` axis) carries everything. The wordmark and
  headings run wide (`wdth` 112–125); body sits at 100. One family with real
  width and weight contrast, rather than a display/body pair that would read as
  two similar grotesques.
- **Martian Mono** is not costume: every number on this page is a frame index,
  a timestamp or a command, and they have to line up in a column. It is used
  for those and nothing else, via the `.data` utility.
- Headings use `text-wrap: balance`, prose uses `text-wrap: pretty`, and the
  display clamp tops out at 5.4rem.

## Layout

- One idea per fold, long scroll, varied section padding for rhythm.
- Every grid declares explicit columns (`grid-cols-1`, `minmax(0, …)`), because
  an `fr` or implicit `auto` track keeps a min-content floor and a wide code
  block will push the whole page past the viewport.
- No section eyebrows. Headings do the work; numbers appear only where the
  content is genuinely a sequence (the three-rule contract).

## Motion

The film is the motion. It runs on `requestAnimationFrame` but advances on the
frame grid, so the viewer never shows a moment that is not a real frame; it
starts paused and on a poster frame when `prefers-reduced-motion` is set.
Everything else is a 150–200ms colour or position transition on an
`ease-out-quart` curve.

## Components

Interactive parts are [Base UI](https://base-ui.com): `Slider` (the scrubber),
`Toggle` (play/pause), `Tabs` (the commands), `Tooltip` (copy feedback and the
contact-sheet probes). Unstyled primitives, styled entirely by the tokens above.
