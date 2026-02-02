# 使用 Node.js 官方輕量映像檔
FROM node:18-alpine

# 設定工作目錄
WORKDIR /app

# 複製 package 設定並安裝依賴
COPY package*.json ./
RUN npm install

# 複製所有程式碼
COPY . .

# 建置 Nuxt 專案
RUN npm run build

# 設定環境變數
ENV NUXT_HOST=0.0.0.0
ENV NUXT_PORT=3000

# 開放 Port
EXPOSE 3000

# 啟動服務 (執行 output 內的 server)
CMD ["node", ".output/server/index.mjs"]