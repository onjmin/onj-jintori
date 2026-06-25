FROM node:22-slim AS builder
WORKDIR /app
COPY package.json ./
RUN npm install --omit=dev && npm cache clean --force

FROM node:22-slim
WORKDIR /app
RUN apt-get update -qq && apt-get install -y -qq --no-install-recommends ca-certificates \
    && rm -rf /var/lib/apt/lists/*
COPY --from=builder /app/node_modules ./node_modules
COPY . .
EXPOSE 8080
ENV NODE_ENV=production
CMD ["node", "jintori.js"]
