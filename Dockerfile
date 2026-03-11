# Build stage
FROM node:22-alpine AS build

WORKDIR /app

# Install all dependencies (need devDeps for Vite build)
COPY package.json package-lock.json ./
RUN --mount=type=secret,id=npm_token \
  printf "@coveritlabs:registry=https://npm.pkg.github.com\n//npm.pkg.github.com/:_authToken=$(cat /run/secrets/npm_token)\n" > .npmrc \
  && npm ci --ignore-scripts \
  && rm -f .npmrc

ARG VITE_API_URL
ARG VITE_APP_ENV
ENV VITE_API_URL=$VITE_API_URL
ENV VITE_APP_ENV=$VITE_APP_ENV

# Copy source and build
COPY . .
RUN npm run build

# Production stage - using nginx to serve static files
FROM nginx:alpine

# Copy built assets from builder
COPY --from=build /app/dist /usr/share/nginx/html

# Copy custom nginx config if we had one (for SPA routing), using default for now
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
