# The whole store in one image: the API, and the built storefront it serves.
#
# Two stages so the result carries no build tooling. The first installs every
# dependency and builds the client; the second keeps only what is needed to
# run. The image is the same whether it is deployed to a managed platform or
# to a server in a cupboard, which is the point.

# ---------------------------------------------------------------- build ----
FROM node:20-alpine AS build
WORKDIR /app

# Manifests first. These change far less often than source, so Docker reuses
# the installed layer on most rebuilds and skips the slow part.
COPY package*.json ./
COPY server/package*.json ./server/
COPY client/package*.json ./client/

RUN npm --prefix server ci && npm --prefix client ci

COPY . .
RUN npm --prefix client run build

# ----------------------------------------------------------------- run ----
FROM node:20-alpine AS run
WORKDIR /app

ENV NODE_ENV=production

# Production dependencies only — the client's build tools have done their job.
COPY server/package*.json ./server/
RUN npm --prefix server ci --omit=dev && npm cache clean --force

COPY server ./server
COPY package*.json ./
COPY --from=build /app/client/dist ./client/dist

# Somewhere for uploads when MEDIA_STORE=disk. Mount a volume here, or the
# images go when the container does.
RUN mkdir -p /app/uploads && chown -R node:node /app/uploads
ENV MEDIA_DIR=/app/uploads

# Never as root: a flaw in an image upload should not be a flaw in the host.
USER node

EXPOSE 10000
ENV PORT=10000

# The same health check the platform uses, so `docker ps` tells the truth
# about whether the store is actually answering.
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:'+(process.env.PORT||10000)+'/api/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

CMD ["node", "server/src/index.js"]
