# ---- Build stage ----
FROM node:18-alpine AS build

WORKDIR /app

# install all deps (incl. dev) to compile TypeScript
COPY package*.json ./
RUN npm ci

# copy source and build
COPY . .
RUN npm run build

# ---- Runtime stage ----
FROM node:18-alpine AS runtime

WORKDIR /app

# install only production dependencies
COPY package*.json ./
RUN npm ci --omit=dev && npm cache clean --force

# copy compiled output from the build stage
COPY --from=build /app/dist ./dist

# run as the unprivileged user provided by the official image
USER node

ENTRYPOINT [ "node", "--max-old-space-size=1536" ]
