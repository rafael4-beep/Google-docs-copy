# Minimal production image for DocFlow.
# Build:  docker build -t docflow .
# Run:    docker run -p 3000:3000 -v docflow-data:/data -e DB_PATH=/data/db.json docflow

FROM node:20-slim AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:20-slim AS runner
WORKDIR /app
ENV NODE_ENV=production
# Persist the database outside the app directory by default.
ENV DB_PATH=/data/db.json
COPY --from=build /app/package*.json ./
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/.next ./.next
COPY --from=build /app/public ./public
COPY --from=build /app/next.config.mjs ./
RUN mkdir -p /data
EXPOSE 3000
CMD ["npm", "start"]
