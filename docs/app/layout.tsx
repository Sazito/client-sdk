import { RootProvider } from 'fumadocs-ui/provider/next';
import './global.css';
import { Sora, Source_Sans_3 } from 'next/font/google';

const sora = Sora({
  subsets: ['latin'],
  variable: '--font-sora',
});

const sourceSans3 = Source_Sans_3({
  subsets: ['latin'],
  variable: '--font-source-sans-3',
});

export default function Layout({ children }: LayoutProps<'/'>) {
  return (
    <html
      lang="en"
      className={`${sora.variable} ${sourceSans3.variable}`}
      suppressHydrationWarning
    >
      <body className="flex flex-col min-h-screen">
        <RootProvider>{children}</RootProvider>
      </body>
    </html>
  );
}
