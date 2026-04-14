FROM node:18-alpine

WORKDIR /usr/src/app

COPY package*.json ./

# Install ALL deps (including dev)
RUN npm install

COPY . .

# Build TypeScript
RUN npm run build

# Remove dev deps after build (optional but good)
RUN npm prune --production

EXPOSE 8080

CMD ["node", "dist/bot.js"]