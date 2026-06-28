import { Vazirmatn } from 'next/font/google';
import type { ReactNode } from 'react';

const vazirmatn = Vazirmatn({
  subsets: ['arabic'],
  variable: '--font-vazirmatn',
});

export default function CheckoutDemoLayout({ children }: { children: ReactNode }) {
  return (
    <div
      dir="rtl"
      lang="fa"
      className={vazirmatn.variable}
      style={{
        fontFamily: 'var(--font-vazirmatn), sans-serif',
        minHeight: '100vh',
        width: '100%',
        background: '#ffffff',
        color: '#0f172a',
      }}
    >
      {children}
    </div>
  );
}
