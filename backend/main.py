import os
import requests
import asyncio
from fastapi import FastAPI
from fastapi.responses import HTMLResponse, Response, FileResponse
from pydantic import BaseModel, Field
import uvicorn
from pathlib import Path

app = FastAPI(title="Google Maps UI Searcher")

BASE_DIR = Path(__file__).resolve().parent.parent
FRONTEND_DIR = BASE_DIR / "frontend"

# 這裡負責抓取環境變數中的 GOOGLE_MAPS_API_KEY
# 請在終端機設定 `$env:GOOGLE_MAPS_API_KEY="AIza..."`
GOOGLE_MAPS_API_KEY = os.environ.get("GOOGLE_MAPS_API_KEY", "")

class ReportRequest(BaseModel):
    region: str = Field(..., description="請輸入想查詢的地區名稱", examples=["台中市西屯區"])
    lang: str = Field("zh-TW", description="語言", examples=["en"])

async def fetch_single_query_pages(url: str, headers: dict, q: str, lang: str) -> list:
    """異步抓取單個關鍵字的最多3頁資料"""
    payload = {"textQuery": q, "languageCode": lang}
    results = []
    
    for _ in range(3):
        # 使用 asyncio.to_thread 讓原本阻塞的 requests.post 在獨立執行緒運行，避免卡住主程式
        response = await asyncio.to_thread(requests.post, url, json=payload, headers=headers)
        
        if response.status_code == 200:
            data = response.json()
            places_batch = data.get("places", [])
            results.extend(places_batch)
            
            next_token = data.get("nextPageToken")
            if not next_token:
                break
                
            payload["pageToken"] = next_token
        else:
            print(f"API 請求錯誤 (Status: {response.status_code}): {response.text}")
            break
            
    return results

async def fetch_google_places(query: str, lang: str = "zh-TW"):
    """接入真正的 Google Maps Places API 獲取店家資料"""
    if not GOOGLE_MAPS_API_KEY:
        # 如果使用者尚未設定 API Key，回傳假資料以免系統崩潰
        return [
            {"displayName": {"text": "(假資料) 台北冠軍牛肉麵"}, "formattedAddress": "台北市測試路1號", "nationalPhoneNumber": "02-1234-5678", "rating": 4.5, "userRatingCount": 1200},
            {"displayName": {"text": "(假資料) 必比登小吃"}, "formattedAddress": "台北市測試路2號", "nationalPhoneNumber": "02-2345-6789", "rating": 4.1, "userRatingCount": 850},
            {"displayName": {"text": "(過濾示範) 地雷餐廳"}, "formattedAddress": "台北市測試路3號", "nationalPhoneNumber": "無電話", "rating": 2.1, "userRatingCount": 50}
        ]
        
    url = "https://places.googleapis.com/v1/places:searchText"
    headers = {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": GOOGLE_MAPS_API_KEY,
        "X-Goog-FieldMask": "places.id,places.displayName,places.formattedAddress,places.nationalPhoneNumber,places.rating,places.userRatingCount,nextPageToken"
    }
    
    search_queries = []
    has_specific_keyword = any(keyword in query for keyword in ["餐廳", "湯", "麵", "飯", "小吃", "店", "咖啡", "館", "美食"])
    
    if has_specific_keyword:
        search_queries.append(query)
        search_queries.append(query + " 推薦")
    else:
        search_queries.extend([
            query + " 餐廳",
            query + " 小吃",
            query + " 咖啡廳",
            query + " 甜點"
        ])
    
    # 建立多個非同步任務，同時對多個關鍵字發送請求 (大幅提升效率)
    tasks = [fetch_single_query_pages(url, headers, q, lang) for q in search_queries]
    all_results_lists = await asyncio.gather(*tasks)
    
    all_places_dict = {} # 用 dict 去重複
    for results in all_results_lists:
        for p in results:
            place_id = p.get("id") or p.get("formattedAddress")
            if place_id and place_id not in all_places_dict:
                all_places_dict[place_id] = p
                
    merged_places = list(all_places_dict.values())
    merged_places.sort(key=lambda x: x.get("rating", 0.0), reverse=True)
            
    return merged_places

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
    places = await fetch_google_places(req.region, req.lang)
    
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
@app.get("/", response_class=FileResponse)
async def serve_ui():
    return FileResponse(FRONTEND_DIR / "index.html")

@app.get("/app.js", response_class=FileResponse)
async def serve_js():
    return FileResponse(FRONTEND_DIR / "app.js")

if __name__ == "__main__":
    print("啟動服務中...")
    uvicorn.run(app, host="0.0.0.0", port=8080)
