# Build from the monorepo root: docker build -f apps/website/Dockerfile -t lani-website .
# (root context needed because this is an npm workspace -- the lockfile
# covers every app, not just this one)

FROM node:20-alpine AS builder
WORKDIR /repo

COPY package.json package-lock.json ./
COPY apps/website/package.json apps/website/package.json
COPY apps/extension/package.json apps/extension/package.json
RUN npm ci

COPY . .

# Inlined into the client bundle at build time -- must be set here, not just at runtime.
ARG NEXT_PUBLIC_SUPABASE_URL
ARG NEXT_PUBLIC_SUPABASE_ANON_KEY
ENV NEXT_PUBLIC_SUPABASE_URL=$NEXT_PUBLIC_SUPABASE_URL
ENV NEXT_PUBLIC_SUPABASE_ANON_KEY=$NEXT_PUBLIC_SUPABASE_ANON_KEY

RUN npm run build:website

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
RUN addgroup -S nodejs && adduser -S nextjs -G nodejs

COPY --from=builder /repo/apps/website/public ./apps/website/public
COPY --from=builder --chown=nextjs:nodejs /repo/apps/website/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /repo/apps/website/.next/static ./apps/website/.next/static

USER nextjs
ENV PORT=3001
EXPOSE 3001
CMD ["node", "apps/website/server.js"]
