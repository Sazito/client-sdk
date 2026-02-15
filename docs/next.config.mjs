import { createMDX } from 'fumadocs-mdx/next';

const withMDX = createMDX();
const isPagesBuild = process.env.GITHUB_ACTIONS === 'true';
const repoName = process.env.GITHUB_REPOSITORY?.split('/')[1] ?? '';
const basePath = isPagesBuild && repoName ? `/${repoName}` : '';

/** @type {import('next').NextConfig} */
const config = {
  reactStrictMode: true,
  ...(isPagesBuild
    ? {
        output: 'export',
        trailingSlash: true,
        images: { unoptimized: true },
        basePath,
        assetPrefix: basePath ? `${basePath}/` : undefined,
      }
    : {}),
  async rewrites() {
    if (isPagesBuild) return [];

    return [
      {
        source: '/docs/:path*.mdx',
        destination: '/llms.mdx/docs/:path*',
      },
    ];
  },
};

export default withMDX(config);
