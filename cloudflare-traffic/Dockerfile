FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

RUN npm run build

# 修改處：將 Port 改為 3001
ENV NUXT_HOST=0.0.0.0
ENV NUXT_PORT=3001

# 修改處：開放 3001
EXPOSE 3001

CMD ["node", ".output/server/index.mjs"]