# Development image for The Block.
# Production deploys go through Vercel from `main` — this image is for local dev only.
FROM node:22-alpine

WORKDIR /app

# Copy manifests first so `npm install` can be cached across source-only edits.
COPY package.json package-lock.json ./
RUN npm install

# Source is bind-mounted at runtime via docker-compose; the COPY here gives the
# image a working baseline for `docker run` use without compose.
COPY . .

EXPOSE 5173

# Bind to 0.0.0.0 so the dev server is reachable from the host across the
# port mapping. Without this, Vite listens on 127.0.0.1 inside the container
# and the host can't reach it.
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]
