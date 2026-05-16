# Stage 1: 編譯前端 (TypeScript to JavaScript)
FROM node:20-slim AS build-stage
WORKDIR /app/frontend

# 複製 package.json 並安裝依賴
COPY frontend/package*.json ./
RUN npm install

# 複製前端原始碼並執行編譯
COPY frontend/ ./
RUN npm run build

# Stage 2: 執行後端服務
FROM python:3.11-slim
WORKDIR /app

# 安裝 Python 依賴
COPY backend/requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

# 複製後端程式碼
COPY backend/ ./backend/

# 從第一階段複製編譯後的靜態檔案到容器內
COPY --from=build-stage /app/frontend/dist ./frontend/dist

# 設定環境變數
ENV PORT=8080

# 啟動指令
CMD ["sh", "-c", "uvicorn backend.main:app --host 0.0.0.0 --port ${PORT}"]