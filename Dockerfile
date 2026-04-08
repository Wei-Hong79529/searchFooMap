# 1. 使用官方的輕量級 Python 映像檔 (Slim 版本體積小、安全性高)
FROM python:3.11-slim

# 2. 設定容器內的工作目錄
WORKDIR app

# 3. 先複製 requirements.txt 並安裝相依套件 (利用 Docker 快取機制加速後續 Build)
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# 4. 複製專案原始碼到容器內
COPY . .

# 5. 設定 Cloud Run 需要的 Port 環境變數 (Cloud Run 預設會塞 PORT=8080 進來)
ENV PORT=8080

# 6. 啟動指令 (請根據你的框架修改)
# 如果是 Flask 搭配 gunicorn
# CMD exec gunicorn --bind $PORT --workers 1 --threads 8 --timeout 0 appapp
# 如果是 FastAPI 搭配 uvicorn
CMD [sh, -c, uvicorn mainapp --host 0.0.0.0 --port ${PORT}]