FROM node:20-alpine AS build
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci
COPY . .
# Build the web version of the Expo app
RUN npx expo export --platform web

# Serve with Nginx
FROM nginx:alpine
# Copy the built web assets to nginx public folder
COPY --from=build /app/dist /usr/share/nginx/html
# Add custom nginx config for SPA routing
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
