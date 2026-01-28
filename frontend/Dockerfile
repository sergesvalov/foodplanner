# Этап сборки (Node.js)
FROM node:18-alpine as build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm install
COPY . .
RUN npm run build

# Этап запуска (Nginx)
FROM nginx:alpine
# Копируем билд React
COPY --from=build /app/dist /usr/share/nginx/html
# Копируем конфиг Nginx
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]