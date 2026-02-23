import type { BaseLayoutProps } from 'fumadocs-ui/layouts/shared';
import Image from 'next/image';

export const gitConfig = {
  user: 'sazito',
  repo: 'client-sdk',
  branch: 'main',
};

export function baseOptions(): BaseLayoutProps {
  return {
    nav: {
      title: (
        <span className="inline-flex items-center gap-2 font-semibold">
          <Image
            src="/sazito.png"
            alt="Sazito"
            width={24}
            height={24}
            className="rounded-md"
          />
          <span>Sazito SDK</span>
        </span>
      ),
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
