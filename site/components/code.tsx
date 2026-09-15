import type { ReactNode } from 'react';

/*
 * A code sample with a filename tab. Highlighting is a small token pass rather
 * than a syntax-highlighting dependency: these samples are short, fixed, and
 * copied verbatim from the repository's own README.
 */
const PATTERNS: Record<string, RegExp> = {
  html: /(<!--[\s\S]*?-->)|(&lt;\/?[a-zA-Z][\w-]*)|("[^"]*")|(\b(?:const|let|document|new|return)\b)/g,
  js: /(\/\/.*$)|("[^"]*"|'[^']*'|`[^`]*`)|(\b(?:const|let|function|return|new|await|import|from)\b)|(\b\d+(?:\.\d+)?\b)/gm,
  json: /("(?:[^"\\]|\\.)*"\s*:)|("(?:[^"\\]|\\.)*")|(\b-?\d+(?:\.\d+)?\b)|(\btrue|false|null\b)/g,
  sh: /(#.*$)|(^\s*(?:npm|npx|sh|cd|seekreel)\b)|(--?[a-zA-Z][\w-]*)/gm,
};

const CLASSES = ['text-white/55 italic', 'text-primary-lit', 'text-accent-lit', 'text-white/90'];

function escape(source: string) {
  return source.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function highlight(source: string, lang: keyof typeof PATTERNS) {
  const pattern = PATTERNS[lang];
  if (!pattern) return escape(source);
  return escape(source).replace(pattern, (match, ...groups) => {
    const index = groups.slice(0, 4).findIndex((g) => g !== undefined);
    const className = CLASSES[index] ?? CLASSES[3];
    return `<span class="${className}">${match}</span>`;
  });
}

export default function Code({
  code,
  lang = 'js',
  file,
  children,
}: {
  code: string;
  lang?: keyof typeof PATTERNS;
  file?: string;
  children?: ReactNode;
}) {
  return (
    <div className="min-w-0 overflow-hidden rounded-sm bg-stage">
      {file && (
        <div className="data flex items-center justify-between border-b border-white/10 px-4 py-2.5 text-white/60">
          <span>{file}</span>
          {children}
        </div>
      )}
      <pre tabIndex={0} className="overflow-x-auto px-4 py-4 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-white">
        <code
          className="data block text-[0.78rem] leading-[1.7] text-white/80"
          dangerouslySetInnerHTML={{ __html: highlight(code.trim(), lang) }}
        />
      </pre>
    </div>
  );
}
