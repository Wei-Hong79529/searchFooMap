# Google Map 高分店家指南 API 與 UI 介面

這是一套依據架構師規劃所構建的完整服務，同時包含了「**現代化直覺 UI 介面**」與「**真實 Google Map API 串接**」。

## 🚀 專案功能
1. 提供完整的網頁 UI，使用者可以直接在輸入框填寫地區（如：台南市中西區 牛肉湯）。
2. 串接真實的 [Google Maps Places API](https://developers.google.com/maps/documentation/places/web-service/overview)。
3. 自動將回傳資料過濾出 3.5 顆星以上的店家，並使用 Markdown 與 HTML 混合渲染表格呈現給使用者。

## 📥 安裝與啟動
由於架構師規劃的 Next.js 前後端分離方案需要龐大的 Node.js 開發環境支援，為了確保您能「一鍵順暢啟動」，我們採用了 FastAPI 內建的 HTML Response 將 UI 直接整合成單一檔案，極大化了便利性。

請開啟終端機執行：
```powershell
# 1. 進入目錄並安裝輕量化依賴 (已移除笨重的爬蟲工具)
cd ImplentSpec
pip install -r requirements.txt

# 2. 【重要】設定您的正式 Google Maps API 金鑰
$env:GOOGLE_MAPS_API_KEY="Google Maps API"

# 3. 啟動伺服器
python main.py
```

## 🎮 如何使用 UI
伺服器啟動後，請不要去枯燥的 Swagger 網頁了！
請直接打開瀏覽器，前往：**[http://localhost:8000/](http://localhost:8000/)**
您將會看見為您量身打造的美麗地圖搜尋介面，輸入地區按下 Enter，帶有排版的質感 Markdown 表格就會出現在您眼前！
