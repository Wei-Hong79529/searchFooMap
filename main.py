import os
import requests
from fastapi import FastAPI
from fastapi.responses import HTMLResponse, Response
from pydantic import BaseModel, Field
import uvicorn

app = FastAPI(title="Google Maps UI Searcher")

# 這裡負責抓取環境變數中的 GOOGLE_MAPS_API_KEY
# 請在終端機設定 `$env:GOOGLE_MAPS_API_KEY="AIza..."`
GOOGLE_MAPS_API_KEY = os.environ.get("GOOGLE_MAPS_API_KEY", "")

class ReportRequest(BaseModel):
    region: str = Field(..., description="請輸入想查詢的地區名稱", examples=["台中市西屯區"])

def fetch_google_places(query: str):
    """接入真正的 Google Maps Places API 獲取店家資料"""
    # 智慧過濾：若無明確食物或店家詞彙，自動補上「 餐廳」
    optimized_query = query
    if not any(keyword in query for keyword in ["餐廳", "湯", "麵", "飯", "小吃", "店", "咖啡", "館"]):
        optimized_query += " 餐廳"

    if not GOOGLE_MAPS_API_KEY:
        # 如果使用者尚未設定 API Key，回傳假資料以免系統崩潰
        return [
            {"displayName": {"text": "(假資料) 台北冠軍牛肉麵"}, "formattedAddress": "台北市測試路1號", "nationalPhoneNumber": "02-1234-5678", "rating": 4.5, "userRatingCount": 1200},
            {"displayName": {"text": "(假資料) 必比登小吃"}, "formattedAddress": "台北市測試路2號", "nationalPhoneNumber": "02-2345-6789", "rating": 4.1, "userRatingCount": 850},
            {"displayName": {"text": "(過濾示範) 地雷餐廳"}, "formattedAddress": "台北市測試路3號", "nationalPhoneNumber": "無電話", "rating": 2.1, "userRatingCount": 50}
        ]
        
    # 改用 New Places API 支援一次抓取電話與評分
    url = "https://places.googleapis.com/v1/places:searchText"
    headers = {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": GOOGLE_MAPS_API_KEY,
        # 在 FieldMask 中補上 nextPageToken
        "X-Goog-FieldMask": "places.displayName,places.formattedAddress,places.nationalPhoneNumber,places.rating,places.userRatingCount,nextPageToken"
    }
    payload = {"textQuery": optimized_query, "languageCode": "zh-TW"}
    
    all_places = []
    # 限制最多抓取 3 頁 (Google Maps Text Search 最多只會回傳 60 筆)
    for _ in range(3):
        response = requests.post(url, json=payload, headers=headers)
        
        if response.status_code == 200:
            data = response.json()
            places_batch = data.get("places", [])
            all_places.extend(places_batch)
            
            next_token = data.get("nextPageToken")
            if not next_token:
                break # 沒有下一頁就結束迴圈
                
            payload["pageToken"] = next_token
        else:
            print(f"API 請求錯誤 (Status: {response.status_code}): {response.text}")
            break
            
    return all_places

class MarkdownGenerator:
    """負責將資料轉換為 Markdown 表格"""
    @staticmethod
    def to_table(region: str, places: list) -> str:
        header = "| 店家名稱 | 地址 | 電話 | 評分 | 評論數 |\n| --- | --- | --- | --- | --- |"
        rows = []
        for p in places:
            display_name = p.get("displayName", {})
            name = display_name.get("text", "N/A") if isinstance(display_name, dict) else str(display_name)
            addr = p.get("formattedAddress", "N/A")
            phone = p.get("nationalPhoneNumber", "無電話資料")
            rating = p.get("rating", 0.0)
            reviews = p.get("userRatingCount", 0)
            
            # 取代掉管線符號避免破壞 Markdown 表格
            name = str(name).replace("|", "")
            addr = str(addr).replace("|", "")
            phone = str(phone).replace("|", "")
            
            rows.append(f"| {name} | {addr} | {phone} | {rating} | {reviews} |")
            
        apiKey_status = "✅ 已串接真實 Google Map API" if GOOGLE_MAPS_API_KEY else "⚠️ 目前為假資料模式 (缺少 GOOGLE_MAPS_API_KEY)"
        
        return f"# {region} 店家清單 (3.5 星以上)\n\n> 系統狀態：{apiKey_status}\n\n{header}\n" + "\n".join(rows)


# ====== 1. 後端 API 查詢接口 ======
@app.post("/api/generate")
async def generate_report(req: ReportRequest):
    places = fetch_google_places(req.region)
    
    # 依據最新需求，不再剔除 3.5 星以下的結果，保留「全部資料」
    filtered = places
    print(f"\n[資料追蹤] 搜尋 '{req.region}' -> 取得全部資料總筆數: {len(filtered)}\n")
    
    generator = MarkdownGenerator()
    md_content = generator.to_table(req.region, filtered)
    
    # 將回傳資料結構化，方便前端進行分頁渲染
    parsed_places = []
    for p in filtered:
        display_name = p.get("displayName", {})
        name = display_name.get("text", "N/A") if isinstance(display_name, dict) else str(display_name)
        addr = p.get("formattedAddress", "N/A")
        phone = p.get("nationalPhoneNumber", "無電話資料")
        rating = p.get("rating", 0.0)
        reviews = p.get("userRatingCount", 0)
        parsed_places.append({
            "name": name,
            "address": addr,
            "phone": phone,
            "rating": rating,
            "reviews": reviews
        })
    
    return {"markdown": md_content, "data": parsed_places}


@app.get("/favicon.ico", include_in_schema=False)
async def favicon():
    return Response(content=b"", media_type="image/x-icon")

# ====== 2. 前端 UI 介面 (直接由 FastAPI 提供服務) ======
@app.get("/", response_class=HTMLResponse)
async def serve_ui():
    html_content = """
    <!DOCTYPE html>
    <html lang="zh-TW">
    <head>
        <meta charset="UTF-8">
        <title>Google Map 推薦爬蟲系統</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <!-- 引入 marked.js 用於渲染 Markdown 為 HTML -->
        <script src="https://cdn.jsdelivr.net/npm/marked/marked.min.js"></script>
        <style>
            /* 針對 Markdown 產生的表格進行樣式美化 */
            .prose table { width: 100%; border-collapse: collapse; margin-top: 1rem; }
            .prose th, .prose td { border: 1px solid #e5e7eb; padding: 0.75rem; text-align: left; }
            .prose th { background-color: #f9fafb; font-weight: 600; }
        </style>
    </head>
    <body class="bg-slate-50 min-h-screen text-slate-800 p-8 font-sans">
        <div class="max-w-4xl mx-auto bg-white p-8 rounded-xl shadow-sm border border-slate-200">
            <h1 class="text-3xl font-bold mb-6 text-slate-900 border-b pb-4">📍 Google Maps 高分店家指南</h1>
            
            <div class="flex gap-4 mb-6">
                <input type="text" id="region" class="border border-slate-300 p-3 w-full rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="請輸入想查詢的地區 (例如：台南市中西區 牛肉湯)">
                <button onclick="search()" class="bg-blue-600 text-white px-8 py-3 rounded-lg hover:bg-blue-700 font-semibold transition-colors">開始搜尋</button>
            </div>
            
            <div id="loading" class="text-slate-500 hidden flex items-center gap-2 mb-6 font-medium">
                <svg class="animate-spin h-5 w-5 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                正在向 Google Maps API 抓取資料，請稍候...
            </div>
            
            <!-- 結果區塊：包含分頁表格與 Markdown 原始碼 -->
            <div id="result-container" class="hidden">
                <div class="overflow-x-auto bg-white rounded-lg border border-slate-200">
                    <table class="w-full text-left border-collapse">
                        <thead>
                            <tr class="bg-slate-100 border-b border-slate-200 text-slate-800">
                                <th class="p-3 font-semibold">店家名稱</th>
                                <th class="p-3 font-semibold">地址</th>
                                <th class="p-3 font-semibold">電話</th>
                                <th class="p-3 font-semibold">評分</th>
                                <th class="p-3 font-semibold">評論數</th>
                            </tr>
                        </thead>
                        <tbody id="table-body" class="text-slate-700">
                            <!-- 分頁資料動態產生處 -->
                        </tbody>
                    </table>
                </div>

                <!-- 分頁按鈕區 -->
                <div class="flex justify-between items-center mt-4 border-t pt-4">
                    <span id="page-info" class="text-sm font-medium text-slate-600"></span>
                    <div class="space-x-2">
                        <button onclick="changePage(-1)" id="btn-prev" class="px-4 py-2 bg-white border border-slate-300 rounded-md text-slate-600 hover:bg-slate-50 disabled:opacity-40 transition-colors">上一頁</button>
                        <button onclick="changePage(1)" id="btn-next" class="px-4 py-2 bg-white border border-slate-300 rounded-md text-slate-600 hover:bg-slate-50 disabled:opacity-40 transition-colors">下一頁</button>
                    </div>
                </div>
            </div>
            
            <div id="empty-state" class="text-slate-400 text-center mt-10">搜尋結果將顯示於此...</div>
        </div>
        
        <script>
            let currentPage = 1;
            const itemsPerPage = 5; // 每頁顯示5筆
            let currentData = [];

            function renderTable() {
                const start = (currentPage - 1) * itemsPerPage;
                const end = start + itemsPerPage;
                const pageData = currentData.slice(start, end);
                
                const tbody = document.getElementById('table-body');
                tbody.innerHTML = '';
                
                pageData.forEach(item => {
                    tbody.innerHTML += `
                        <tr class="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                            <td class="p-3 font-bold text-blue-700">${item.name}</td>
                            <td class="p-3 text-sm">${item.address}</td>
                            <td class="p-3 whitespace-nowrap text-sm">${item.phone}</td>
                            <td class="p-3 text-amber-500 font-bold">${item.rating} ⭐</td>
                            <td class="p-3 text-slate-500 text-sm">${item.reviews} 則</td>
                        </tr>
                    `;
                });
                
                const totalPages = Math.ceil(currentData.length / itemsPerPage);
                const infoText = totalPages === 0 ? '無資料' : `第 ${currentPage} 頁，共 ${totalPages} 頁 (總計 ${currentData.length} 筆)`;
                document.getElementById('page-info').innerText = infoText;
                
                document.getElementById('btn-prev').disabled = currentPage === 1 || totalPages === 0;
                document.getElementById('btn-next').disabled = currentPage === totalPages || totalPages === 0;
            }

            function changePage(delta) {
                const totalPages = Math.ceil(currentData.length / itemsPerPage);
                const newPage = currentPage + delta;
                if (newPage >= 1 && newPage <= totalPages) {
                    currentPage = newPage;
                    renderTable();
                }
            }

            async function search() {
                const region = document.getElementById('region').value;
                if(!region) return alert('請輸入想查詢的地區名稱!');
                
                document.getElementById('loading').classList.remove('hidden');
                document.getElementById('empty-state').classList.add('hidden');
                document.getElementById('result-container').classList.add('hidden');
                
                try {
                    const res = await fetch('/api/generate', {
                        method: 'POST',
                        headers: {'Content-Type': 'application/json'},
                        body: JSON.stringify({region: region})
                    });
                    const data = await res.json();
                    
                    if (data.data && data.data.length > 0) {
                        currentData = data.data;
                        currentPage = 1;
                        renderTable();
                        document.getElementById('result-container').classList.remove('hidden');
                    } else if (data.data && data.data.length === 0) {
                        document.getElementById('empty-state').innerText = "查詢不到相關店家。";
                        document.getElementById('empty-state').classList.remove('hidden');
                    } else {
                        alert("發生錯誤: " + data.detail || "未知錯誤");
                        document.getElementById('empty-state').classList.remove('hidden');
                    }
                } catch(e) {
                    alert("伺服器連線錯誤！請檢查後端是否正常運行。");
                    document.getElementById('empty-state').classList.remove('hidden');
                } finally {
                    document.getElementById('loading').classList.add('hidden');
                }
            }
            
            // 允許按 Enter 鍵搜尋
            document.getElementById('region').addEventListener('keypress', function (e) {
                if (e.key === 'Enter') { search(); }
            });
        </script>
    </body>
    </html>
    """
    return HTMLResponse(content=html_content)

if __name__ == "__main__":
    print("啟動服務中...")
    print("UI 介面網址: http://localhost:8000")
    print("API 文件網址: http://localhost:8000/docs")
    uvicorn.run(app, host="0.0.0.0", port=8000)
