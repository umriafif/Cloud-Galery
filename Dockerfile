FROM node:22-alpine

WORKDIR /app

RUN apk add --no-cache ffmpeg

COPY package*.json ./
RUN npm install

COPY . .

RUN mkdir -p storage/tmp storage/uploads storage/thumbnails
RUN npm run build:css

ENV NODE_ENV=production
EXPOSE 3000

CMD ["node", "src/server.js"]
