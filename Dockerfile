# Builds and serves the docs site (docs/) from the monorepo root.
# Build:  docker build -t sazito-docs .
# Run:    docker run -p 3000:3000 sazito-docs

FROM node:22-alpine AS builder
WORKDIR /app

RUN npm install -g pnpm@10.28.2

# Install dependencies first so this layer is cached across source changes.
# --ignore-scripts skips the docs postinstall (fumadocs-mdx), which needs
# source files that are not copied yet; it runs implicitly during next build.
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY packages/checkout/package.json packages/checkout/
COPY docs/package.json docs/
RUN pnpm install --frozen-lockfile --ignore-scripts

COPY . .

# Root SDK dist/ is gitignored, and @sazito/checkout (used by docs) imports it.
RUN pnpm run build
RUN pnpm run docs:build

FROM node:22-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV HOSTNAME=0.0.0.0
ENV PORT=3002

RUN addgroup -S nodejs && adduser -S nextjs -G nodejs

# Next standalone output preserves the monorepo layout: server.js lives
# under docs/ inside the standalone directory.
COPY --from=builder --chown=nextjs:nodejs /app/docs/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/docs/.next/static ./docs/.next/static
COPY --from=builder --chown=nextjs:nodejs /app/docs/public ./docs/public

USER nextjs
EXPOSE 3002

CMD ["node", "docs/server.js"]
