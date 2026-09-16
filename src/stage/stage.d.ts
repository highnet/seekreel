/**
 * Types for the browser-side stage helpers served at /_seekreel/stage.js.
 *
 * The implementation is JavaScript because it runs in a page; this is how a
 * TypeScript stage — one going through a bundler — still gets to see it.
 */

export declare function time(): number;
export declare function span(a: number, b: number, t?: number): number;
export declare function frame(fps: number, t?: number): number;
export declare function markReady(): void;
export declare function markReadyWhenLoaded(): Promise<void>;

export interface ReactHandles {
  /** A root from react-dom/client's createRoot. */
  root: { render: (element: unknown) => void };
  /** react-dom's flushSync. Required: React 19 will not commit without it. */
  flushSync: (callback: () => void) => void;
}

export declare function renderReact(
  handles: ReactHandles,
  element: unknown,
  options?: { ready?: boolean },
): void;
