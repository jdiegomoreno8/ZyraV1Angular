# Etapa 1: Build
FROM node:18 AS builder
WORKDIR /app
COPY package*.json ./
RUN npm install --legacy-peer-deps
COPY . .
RUN npm run build -- --configuration=production --project=ZyraV1Angular

# Etapa 2: Servidor NGINX
FROM nginx:alpine
COPY --from=builder /app/dist/ZyraV1Angular /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
