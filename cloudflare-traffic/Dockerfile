# 使用輕量級的 Node 20 Alpine 版本
FROM node:20-alpine

# 1. 設定工作目錄
WORKDIR /app

# ▼▼▼ 新增：安裝時區套件並設定為台北時間 ▼▼▼
RUN apk add --no-cache tzdata
ENV TZ=Asia/Taipei
# ▲▲▲ 新增結束 ▲▲▲

# 2. 複製套件設定檔並安裝相依套件
COPY package*.json ./
RUN npm install

# 3. 複製其餘程式碼
COPY . .

# 4. 建置專案
RUN npm run build

# 5. 設定啟動指令
ENV PORT=3000
EXPOSE 3000
CMD ["node", ".output/server/index.mjs"]