import type { BaseLayoutProps } from 'fumadocs-ui/layouts/shared';

export const gitConfig = {
  user: 'sazito',
  repo: 'client-sdk',
  branch: 'main',
};

export function baseOptions(): BaseLayoutProps {
  return {
    nav: {
      title: 'Sazito SDK',
      transparentMode: 'top',
    },
    links: [
      {
        text: 'npm',
        url: 'https://www.npmjs.com/package/@sazito/client-sdk',
        external: true,
      },
    ],
    githubUrl: `https://github.com/${gitConfig.user}/${gitConfig.repo}`,
  };
}
