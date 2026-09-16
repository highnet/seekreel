# examples/react-stage

Six seconds of React. The point is that nothing about the contract changes: the
component tree is a pure function of `t`, React commits it synchronously, and
the frame is marked ready.

```sh
sh examples/react-stage/setup.sh          # react, react-dom and htm, fetched
seekreel build -c examples/react-stage/seekreel.config.json
```

## The one thing that will bite you

React 19 schedules rendering rather than doing it. `root.render(element)`
returns before anything is on the page, so a stage that marks itself ready on
the next line screenshots an empty document — reliably, on every frame, with no
error to explain it.

`flushSync` commits before it returns. seekreel's helper takes it as a required
argument rather than importing it for you, because the version of React doing
the committing has to be the one you are rendering with:

```js
import { createRoot } from "./vendor/react-dom-client.js";
import { flushSync } from "./vendor/react-dom.js";
import { time, renderReact } from "/_seekreel/stage.js";

renderReact(
  { root: createRoot(document.getElementById("stage")), flushSync },
  html`<${Film} t=${time()} />`,
);
```

`/_seekreel/stage.js` is served with every render — `time`, `span`, `frame`,
`markReady`, `markReadyWhenLoaded` and `renderReact`. There is nothing to
install and nothing to vendor to reach it.

## Rules React brings with it

A stage is one frame, rendered into a document that has never existed before and
will not exist a moment later. So:

- **No state that survives a page load.** `useState` is fine as a value derived
  from props; it is a bug if you expect it to carry from frame 61 to frame 62.
  There is no frame 61 in this process.
- **No effects.** `useEffect` runs after the commit, and the screenshot may
  already have been taken. Anything an effect would do belongs in the render, or
  before it.
- **Await your data.** Fetch first, then render, then mark ready. A suspense
  fallback is a perfectly valid frame to screenshot, which is the problem.

## JSX, and skipping all of this

The markup here is [htm](https://github.com/developit/htm) — tagged templates
that need no compiler — because JSX is the single part of React that genuinely
requires a build step, and this example exists to show there does not have to be
one.

If your project already has a bundler, use it. Build as you normally would and
point `stage` at the HTML your build writes:

```json
{ "stage": "dist/index.html", "duration": 6, "fps": 24 }
```

Everything above still applies: pure props, `flushSync`, mark ready. TypeScript
and TSX work exactly as they do in the rest of your app — `stage.d.ts` ships
next to the helper so the imports are typed.
