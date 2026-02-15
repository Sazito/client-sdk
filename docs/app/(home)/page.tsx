import Link from 'next/link';

export default function HomePage() {
  const quickLinks = [
    {
      title: 'Getting Started',
      description: 'Install, initialize, and ship your first storefront requests.',
      href: '/docs/getting-started/installation',
    },
    {
      title: 'Checkout Guide',
      description: 'Run a full guest checkout flow from cart to payment action.',
      href: '/docs/guides/guest-checkout',
    },
    {
      title: 'API Reference',
      description: 'Module-by-module reference for all SDK surfaces.',
      href: '/docs/api-reference/client',
    },
  ];

  return (
    <main className="mx-auto w-full max-w-6xl px-6 py-16 md:px-10 md:py-24">
      <section className="relative overflow-hidden rounded-3xl border border-fd-border bg-fd-card p-8 shadow-[0_18px_80px_-35px_rgba(94,106,210,0.28)] md:p-12">
        <div className="pointer-events-none absolute -right-14 -top-14 h-44 w-44 rounded-full bg-[radial-gradient(circle_at_30%_30%,rgba(94,106,210,0.5),rgba(94,106,210,0))]" />
        <div className="pointer-events-none absolute -bottom-16 -left-8 h-52 w-52 rounded-full bg-[radial-gradient(circle_at_30%_30%,rgba(94,106,210,0.2),rgba(94,106,210,0))]" />

        <p className="mb-4 inline-flex rounded-full border border-fd-border bg-fd-muted px-4 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-fd-muted-foreground">
          Sazito Client SDK
        </p>
        <h1 className="home-title max-w-3xl text-4xl font-semibold leading-tight text-fd-foreground md:text-6xl">
          Production-ready commerce docs for global storefront teams.
        </h1>
        <p className="mt-5 max-w-2xl text-base text-fd-muted-foreground md:text-lg">
          Everything you need to integrate products, checkout, users, wallet, CMS, and analytics with a consistent typed SDK.
        </p>

        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            href="/docs"
            className="rounded-xl bg-fd-primary px-5 py-2.5 text-sm font-semibold text-fd-primary-foreground transition hover:opacity-90"
          >
            Open Documentation
          </Link>
          <Link
            href="/docs/api-reference/client"
            className="rounded-xl border border-fd-border bg-fd-secondary px-5 py-2.5 text-sm font-semibold text-fd-secondary-foreground transition hover:bg-fd-accent"
          >
            Browse API
          </Link>
        </div>
      </section>

      <section className="mt-8 grid gap-4 md:grid-cols-3">
        {quickLinks.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="group rounded-2xl border border-fd-border bg-fd-card p-5 transition hover:-translate-y-0.5 hover:border-fd-primary/45 hover:shadow-[0_14px_40px_-30px_rgba(94,106,210,0.35)]"
          >
            <h2 className="home-title text-lg font-semibold text-fd-foreground group-hover:text-fd-primary">
              {item.title}
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-fd-muted-foreground">
              {item.description}
            </p>
          </Link>
        ))}
      </section>
    </main>
  );
}
