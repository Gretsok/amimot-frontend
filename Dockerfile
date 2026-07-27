FROM node:22-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Caddy plutôt que Nginx : gère seul le HTTPS (obtention + renouvellement
# automatique des certificats Let's Encrypt en prod, certificat auto-signé en
# dev via `tls internal`), sans configuration manuelle ni conteneur séparé.
FROM caddy:2-alpine
COPY Caddyfile /etc/caddy/Caddyfile
COPY --from=build /app/dist /srv

EXPOSE 80 443
