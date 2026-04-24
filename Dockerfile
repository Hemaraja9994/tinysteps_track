# ---- Builder ----
FROM node:20-alpine AS builder
WORKDIR /app

# Install all deps (including dev) for building
COPY package*.json ./
RUN npm ci

# Copy source and build the SPA
COPY . .
# GEMINI_API_KEY is inlined at build time via Vite's `define` block.
# Pass it with --build-arg GEMINI_API_KEY=... or Cloud Build substitutions.
ARG GEMINI_API_KEY
ENV GEMINI_API_KEY=${GEMINI_API_KEY}
RUN npm run build

# ---- Runtime ----
FROM node:20-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production

# Bring only what the Express server needs
COPY package*.json ./
RUN npm ci --omit=dev

COPY --from=builder /app/dist ./dist
COPY server.js ./server.js

EXPOSE 8080
ENV PORT=8080

CMD ["node", "server.js"]
