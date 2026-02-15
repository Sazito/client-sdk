import { source } from '@/lib/source';
import { createFromSource } from 'fumadocs-core/search/server';

const isPagesBuild = process.env.GITHUB_ACTIONS === 'true';

export const dynamic = 'force-static';
export const revalidate = false;

const searchRoute = createFromSource(source, {
  // https://docs.orama.com/docs/orama-js/supported-languages
  language: 'english',
});

export const GET = isPagesBuild
  ? async function GET() {
      return new Response('Search API is disabled for the static GitHub Pages build.', {
        status: 404,
      });
    }
  : searchRoute.GET;
