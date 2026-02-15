import { source } from '@/lib/source';
import { DocsLayout } from 'fumadocs-ui/layouts/docs';
import { baseOptions } from '@/lib/layout.shared';
import Link from 'next/link';

export default function Layout({ children }: LayoutProps<'/docs'>) {
  return (
    <DocsLayout
      tree={source.getPageTree()}
      sidebar={{
        banner: (
          <Link
            href="/docs/getting-started/installation"
            className="mb-3 block rounded-xl border border-fd-border bg-fd-muted p-3 text-xs font-medium text-fd-muted-foreground hover:border-fd-primary/40 hover:text-fd-foreground"
          >
            New to Sazito SDK? Start with Installation.
          </Link>
        ),
      }}
      {...baseOptions()}
    >
      {children}
    </DocsLayout>
  );
}
