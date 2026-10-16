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

export declare function ease(k: number): number;
export declare function shown(a: number, b: number, fade?: number, t?: number): number;

export interface FootageClip {
  index: number;
  label: string;
  kind: "video" | "still" | "color";
  start: number;
  end: number;
  from: number;
  to: number | null;
  speed: number;
  hold: number;
  transition: { type: string; duration: number };
}

export interface LoadedFootage {
  fps: number;
  width: number;
  height: number;
  frames: number;
  duration: number;
  clips: FootageClip[];
  frameAt(t?: number): number;
  url(t?: number): string;
  image(t?: number): Promise<HTMLImageElement>;
  clip(t?: number): FootageClip;
  byLabel(label: string): FootageClip | undefined;
  toFilm(label: string, sourceSeconds: number): number | null;
}

export declare function loadFootage(dir?: string): Promise<LoadedFootage>;

export declare function punchIn(
  points: { t: number; x: number; y: number }[],
  options?: { scale?: number; lead?: number; hold?: number; ease?: number; t?: number },
): string;

export declare function captionAt<C extends { start: number; end: number }>(cues: C[], t?: number): C | null;
