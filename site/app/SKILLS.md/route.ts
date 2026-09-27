import { readFileSync } from 'node:fs';
import path from 'node:path';

/*
 * SKILLS.md, served from the site so an agent can fetch the manual with one
 * short command:  curl -fsSL https://seekreel.vercel.app/SKILLS.md
 *
 * Read from the repository root at build time and served as static text, so
 * every deploy of main carries the matching copy of the file.
 */
export const dynamic = 'force-static';

export function GET() {
  const skills = readFileSync(path.join(process.cwd(), '..', 'SKILLS.md'), 'utf8');
  return new Response(skills, {
    headers: {
      'content-type': 'text/markdown; charset=utf-8',
      'cache-control': 'public, max-age=0, must-revalidate',
    },
  });
}
