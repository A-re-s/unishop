# --- deps: install node_modules only ---
FROM node:22.23.2-slim AS deps

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci


# --- dev: used by docker-compose.yml, source is bind-mounted at runtime ---
FROM deps AS dev

EXPOSE 5173

CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]


# --- build: compiles the production static bundle ---
FROM deps AS build

# Vite bakes env vars into the bundle at build time, not runtime — so this
# has to be a build arg, unlike the backend's plain env vars.
ARG VITE_API_URL=/api
ENV VITE_API_URL=$VITE_API_URL

COPY index.html vite.config.ts tsconfig.json tsconfig.app.json tsconfig.node.json ./
COPY public/ public/
COPY src/ src/

RUN npm run build


# --- runtime: static bundle served by nginx, nothing else ---
FROM nginx:1.27-alpine AS runtime

COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
