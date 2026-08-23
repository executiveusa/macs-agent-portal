FROM node:20-alpine AS runtime

WORKDIR /app/services/phone-chat

COPY package*.json ./
RUN npm ci --no-audit --no-fund --omit=dev

COPY . .

EXPOSE 3000

ENV PORT=3000
ENV NODE_ENV=production

CMD ["node", "server.js"]
