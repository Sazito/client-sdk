#!/usr/bin/env node

import fs from 'fs';
import path from 'path';

const root = process.cwd();
const docsDir = path.join(root, 'docs/content/docs/api-reference');

const map = {
  'products.mdx': { module: 'products', call: "list({ page: 1, pageSize: 12 })" },
  'categories.mdx': { module: 'categories', call: "list({ page: 1, pageSize: 100 })" },
  'cart.mdx': { module: 'cart', call: 'get()' },
  'orders.mdx': { module: 'orders', call: "list({ page: 1, pageSize: 20 })" },
  'shipping.mdx': { module: 'shipping', call: 'getMethods()' },
  'payments.mdx': { module: 'payments', call: 'getMethods()' },
  'invoices.mdx': { module: 'invoices', call: 'get()' },
  'users.mdx': { module: 'users', call: 'getCurrentUser()' },
  'search.mdx': { module: 'search', call: "query('shoe', { page: 1, pageSize: 10 })" },
  'menu.mdx': { module: 'menu', call: 'getHeaderMenu()' },
  'entity-routes.mdx': { module: 'entityRoutes', call: "resolve('/product/sample-product')" },
  'cms.mdx': { module: 'cms', call: "listAll({ page: 1, pageSize: 10 })" },
  'booking.mdx': { module: 'booking', call: "listEvents({ page: 1, page_size: 10 })" },
  'feedbacks.mdx': { module: 'feedbacks', call: "list({ page: 1, pageSize: 10 })" },
  'general.mdx': { module: 'general', call: 'getInfo()' },
  'wallet.mdx': { module: 'wallet', call: 'getBalance()' },
  'visits.mdx': { module: 'visits', call: 'track()' },
  'images.mdx': { module: 'images', call: 'delete(123)' },
};

function block(module, call) {
  return `## Examples

<Tabs items={["Next.js (Client)", "Next.js (Server)", "React", "Vue", "Nuxt", "Nuxt.js (Server)"]}>

<Tab value="Next.js (Client)">

\`\`\`tsx
// app/lib/sazito-client.ts
import { createSazitoClient } from '@sazito/client-sdk';

export const sazito = createSazitoClient({
  domain: process.env.NEXT_PUBLIC_SAZITO_DOMAIN!,
});
\`\`\`

\`\`\`tsx
// app/[lang]/(home)/page.tsx
'use client';
import { useEffect, useState } from 'react';
import { sazito } from '@/app/lib/sazito-client';

export default function Example() {
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    sazito.${module}.${call}.then((res) => setData(res.data ?? null));
  }, []);

  return <pre>{JSON.stringify(data, null, 2)}</pre>;
}
\`\`\`

</Tab>

<Tab value="Next.js (Server)">

\`\`\`tsx
// app/lib/sazito-server.ts
import { createSazitoClient } from '@sazito/client-sdk';

export function getSazitoServerClient() {
  return createSazitoClient({ domain: process.env.SAZITO_STORE_DOMAIN! });
}
\`\`\`

\`\`\`tsx
// app/actions/example.ts
'use server';
import { getSazitoServerClient } from '@/app/lib/sazito-server';

export async function runExample() {
  const client = getSazitoServerClient();
  const res = await client.${module}.${call};

  return res.data;
}
\`\`\`

</Tab>

<Tab value="React">

\`\`\`tsx
// src/lib/sazito.ts
import { createSazitoClient } from '@sazito/client-sdk';

export const sazito = createSazitoClient({
  domain: import.meta.env.VITE_SAZITO_DOMAIN,
});
\`\`\`

\`\`\`tsx
// src/components/Example.tsx
import { useEffect, useState } from 'react';
import { sazito } from '../lib/sazito';

export function Example() {
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    sazito.${module}.${call}.then((res) => setData(res.data ?? null));
  }, []);

  return <pre>{JSON.stringify(data, null, 2)}</pre>;
}
\`\`\`

</Tab>

<Tab value="Vue">

\`\`\`vue
<!-- src/lib/sazito.ts -->
<script lang="ts">
import { createSazitoClient } from '@sazito/client-sdk';

export const sazito = createSazitoClient({
  domain: import.meta.env.VITE_SAZITO_DOMAIN,
});
</script>
\`\`\`

\`\`\`vue
<!-- src/components/Example.vue -->
<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { sazito } from '../lib/sazito';

const data = ref<any>(null);

onMounted(async () => {
  const res = await sazito.${module}.${call};
  data.value = res.data ?? null;
});
</script>

<template>
  <pre>{{ JSON.stringify(data, null, 2) }}</pre>
</template>
\`\`\`

</Tab>

<Tab value="Nuxt">

\`\`\`vue
<!-- plugins/sazito.client.ts -->
<script lang="ts">
import { createSazitoClient } from '@sazito/client-sdk';

export default defineNuxtPlugin(() => {
  const config = useRuntimeConfig();
  const sazito = createSazitoClient({ domain: config.public.sazitoDomain });
  return { provide: { sazito } };
});
</script>
\`\`\`

\`\`\`vue
<!-- pages/example.vue -->
<script setup lang="ts">
import { ref, onMounted } from 'vue';
const { $sazito } = useNuxtApp();

const data = ref<any>(null);

onMounted(async () => {
  const res = await $sazito.${module}.${call};
  data.value = res.data ?? null;
});
</script>

<template>
  <pre>{{ JSON.stringify(data, null, 2) }}</pre>
</template>
\`\`\`

</Tab>

<Tab value="Nuxt.js (Server)">

\`\`\`ts
// server/utils/sazito.ts
import { createSazitoClient } from '@sazito/client-sdk';

export function getSazitoClient() {
  const config = useRuntimeConfig();
  return createSazitoClient({ domain: config.public.sazitoDomain });
}
\`\`\`

\`\`\`ts
// server/api/example.get.ts
import { getSazitoClient } from '../utils/sazito';

export default defineEventHandler(async () => {
  const client = getSazitoClient();
  const res = await client.${module}.${call};

  return res.data;
});
\`\`\`

</Tab>

</Tabs>`;
}

let updated = 0;
for (const [file, cfg] of Object.entries(map)) {
  const full = path.join(docsDir, file);
  if (!fs.existsSync(full)) continue;
  const content = fs.readFileSync(full, 'utf8');
  const withoutSingleExample = content.replace(
    /## Example\b[\s\S]*?(?=\n## Examples\b)/g,
    ''
  );
  const start = withoutSingleExample.indexOf('## Examples');
  if (start === -1) continue;

  const autoStart = withoutSingleExample.indexOf('{/* AUTO_FIELDS_START */}');
  const end = autoStart !== -1 ? autoStart : withoutSingleExample.length;
  const next = `${withoutSingleExample.slice(0, start).trimEnd()}\n\n${block(cfg.module, cfg.call)}\n\n${withoutSingleExample.slice(end).trimStart()}`;
  fs.writeFileSync(full, next);
  updated += 1;
}

console.log(`Updated examples in ${updated} API pages.`);
