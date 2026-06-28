import type { BaseLayoutProps } from 'fumadocs-ui/layouts/shared';
import Image from 'next/image';

export const sdkVersion = process.env.NEXT_PUBLIC_SDK_VERSION ?? 'latest';

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
          <span className="rounded-md border border-fd-border bg-fd-muted px-1.5 py-0.5 text-[11px] font-normal leading-none text-fd-muted-foreground">
            v{sdkVersion}
          </span>
        </span>
      ),
      transparentMode: 'top',
    },
    links: [
      {
        text: 'Checkout Demo',
        url: '/checkout-demo',
        active: 'url',
      },
      {
        text: 'npm',
        url: 'https://www.npmjs.com/package/@sazito/client-sdk',
        external: true,
      },
    ],
    githubUrl: `https://github.com/${gitConfig.user}/${gitConfig.repo}`,
  };
}
