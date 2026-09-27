import Code from '@/components/code';

/*
 * The family sample pack: a real rendered film, and the kit it was made from.
 * The video is the pack's own sample movie, rendered by seekreel and encoded
 * small; it never autoplays, so the only motion on the page stays the viewer's.
 */

const PACK_SAMPLE = `
sh family/setup.sh                             # three.js, Motion, React, Strudel, the font
seekreel probe 6,14,31,46 -c family/movie.config.json
seekreel build -c family/movie.config.json     # mp4, 9:16, gif and a poster
`.trim();

const CONTENTS: [string, string][] = [
  ['cast', 'Squashy blobs with caps, glasses, buns and bows, a baby and a dog.'],
  ['sets', 'An island picnic, a plane to a beach, a pink museum wall.'],
  ['react', 'Captions that pop word by word, bubbles, chapter cards, photos.'],
  ['music', 'A bossa nova in Strudel, arranged on the same bar lines as the cuts.'],
];

export default function FamilyPack({ repo }: { repo: string }) {
  return (
    <div className="grid min-w-0 grid-cols-1 gap-12 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)] lg:gap-16">
      <figure className="min-w-0">
        <video
          className="block aspect-video w-full bg-stage"
          src="/family/the-blob-family.mp4"
          poster="/family/the-blob-family.jpg"
          controls
          playsInline
          preload="none"
          aria-label="The Blob Family: the family pack's 48-second sample movie"
        />
        <figcaption className="mt-3 text-sm text-muted">
          <span className="data text-ink">family.mp4</span> · 48 s · 1,152 frames · rendered with the
          pack, unedited
        </figcaption>
      </figure>

      <div className="min-w-0">
        <h2 className="text-[clamp(2rem,4.2vw,3.2rem)] leading-[0.98] font-bold">
          Start from a finished film.
        </h2>
        <p className="mt-6 max-w-[52ch] text-lg leading-relaxed text-muted">
          The family sample pack is everything that went into a real seekreel film, made
          generic: a cast, three sets, the React components on top, and the soundtrack. The
          movie on the left is its sample project. Copy it, change the words, hang your own
          photos, render.
        </p>
        <dl className="mt-8 grid grid-cols-1 gap-x-8 gap-y-3 sm:grid-cols-2">
          {CONTENTS.map(([name, what]) => (
            <div key={name} className="flex gap-3">
              <dt className="data w-12 shrink-0 text-primary">{name}</dt>
              <dd className="text-sm leading-relaxed text-muted">{what}</dd>
            </div>
          ))}
        </dl>
        <div className="mt-8">
          <Code code={PACK_SAMPLE} lang="sh" file="terminal" />
        </div>
        <p className="mt-6 text-sm leading-relaxed text-muted">
          It ships with the normal install and stays out of{' '}
          <span className="data text-ink">--minimal</span>.{' '}
          <a className="text-primary underline underline-offset-4 hover:text-ink" href={`${repo}/blob/main/family/GUIDE.md`}>
            Read the guide
          </a>
          .
        </p>
      </div>
    </div>
  );
}
