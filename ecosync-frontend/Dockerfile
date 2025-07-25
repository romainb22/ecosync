# Étape 1 : Build Angular
FROM node:20 AS builder
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# Debug build output
RUN ls -lh /app/dist/ecosync-app/
RUN cat /app/dist/ecosync-app/index.html | head -20

# Étape 2 : Nginx
FROM nginx:alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /app/dist/ecosync-app/browser/ /usr/share/nginx/html/

# Debug nginx served files
RUN ls -lh /usr/share/nginx/html/
RUN cat /usr/share/nginx/html/index.html | head -20

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
