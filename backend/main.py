import os
import re
import requests
import asyncio
from fastapi import FastAPI, Request
from fastapi.responses import HTMLResponse, Response, FileResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
import uvicorn
from pathlib import Path
# pyrefly: ignore [missing-import]
from slowapi import Limiter, _rate_limit_exceeded_handler
# pyrefly: ignore [missing-import]
from slowapi.util import get_remote_address
# pyrefly: ignore [missing-import]
from slowapi.errors import RateLimitExceeded

# ====== Rate Limiting 設定 ======
# 使用客戶端 IP 作為限流 key，防止單一來源濫用 API
limiter = Limiter(key_func=get_remote_address)

app = FastAPI(title="Google Maps UI Searcher")

# 掛載 Rate Limiter 到 FastAPI
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# ====== CORS 設定 ======
# 限制允許的來源，防止其他網站跨域呼叫你的 API
ALLOWED_ORIGINS = os.environ.get("ALLOWED_ORIGINS", "*").split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_methods=["GET", "POST"],
    allow_headers=["Content-Type"],
)

BASE_DIR = Path(__file__).resolve().parent.parent
# 這裡負責抓取環境變數中的 GOOGLE_MAPS_API_KEY
# 請在終端機設定 `$env:GOOGLE_MAPS_API_KEY="AIza..."`
GOOGLE_MAPS_API_KEY = os.environ.get("GOOGLE_MAPS_API_KEY", "")

class ReportRequest(BaseModel):
    region: str = Field(..., description="請輸入想查詢的地區名稱", examples=["台中市西屯區"])
    lang: str = Field("zh-TW", description="語言", examples=["en"])
    search_type: str = Field("food", description="搜尋類型: food 或 hotel", examples=["food", "hotel"])

# ====== 地區精準定位工具函式 ======

async def geocode_region(query: str) -> dict | None:
    """使用 Geocoding API 取得地區的經緯度中心與視窗範圍，用於限縮搜尋範圍"""
    if not GOOGLE_MAPS_API_KEY:
        return None

    geocode_url = "https://maps.googleapis.com/maps/api/geocode/json"
    params = {
        "address": query,
        "key": GOOGLE_MAPS_API_KEY,
        "language": "zh-TW"
    }

    try:
        response = await asyncio.to_thread(requests.get, geocode_url, params=params)
        if response.status_code == 200:
            data = response.json()
            if data.get("results"):
                geometry = data["results"][0]["geometry"]
                location = geometry["location"]
                viewport = geometry.get("viewport", {})
                return {
                    "center": {"latitude": location["lat"], "longitude": location["lng"]},
                    "viewport": viewport
                }
    except Exception as e:
        print(f"[Geocoding] 地理編碼失敗: {e}")

    return None


def extract_region_keywords(query: str) -> list:
    """從使用者輸入中提取行政區關鍵字，用於地址後過濾
    
    優先順序：區/鄉/鎮 (最精確) > 市/縣 (較廣)
    例如 '新北市板橋區' -> ['板橋區']
    例如 '台北市' -> ['台北市']
    """
    # 只匹配最精確的行政區名稱 (例如從 '台北市信義區' 提取出 '信義區')
    # 使用 [^市縣]* 確保不會連縣市名稱一起抓進來，並限制在 2-4 個字
    districts = re.findall(r'([^市縣\s]{1,3}(?:區|鄉|鎮))', query)
    if districts:
        return districts

    # 其次匹配市/縣
    cities = re.findall(r'([\u4e00-\u9fff]{2,3}(?:市|縣))', query)
    if cities:
        return cities

    return []


def filter_by_region(places: list, region_keywords: list) -> list:
    """根據地區關鍵字過濾結果，確保結果的地址包含指定的行政區"""
    if not region_keywords:
        return places

    filtered = []
    for p in places:
        addr = p.get("formattedAddress", "")
        # 地址中包含任一行政區關鍵字即保留
        if any(kw in addr for kw in region_keywords):
            filtered.append(p)

    # 嚴格過濾：不再退回原始結果，確保結果一定符合指定的行政區
    print(f"[地區過濾] 關鍵字 {region_keywords} 過濾: {len(places)} -> {len(filtered)} 筆")
    return filtered


async def fetch_single_query_pages(url: str, headers: dict, q: str, lang: str, location_bias: dict = None) -> list:
    """異步抓取單個關鍵字的最多3頁資料"""
    payload = {"textQuery": q, "languageCode": lang}
    
    # 如果有地理偏好，加入 locationBias 讓 API 優先回傳該區域的結果
    if location_bias:
        payload["locationBias"] = location_bias
    
    results = []
    
    for _ in range(3):
        # 實作重試邏輯以處理網路不穩定 (例如 DNS 解析失敗)
        max_retries = 3
        response = None
        for attempt in range(max_retries):
            try:
                # 使用 asyncio.to_thread 讓原本阻塞的 requests.post 在獨立執行緒運行，避免卡住主程式
                response = await asyncio.to_thread(requests.post, url, json=payload, headers=headers)
                break # 成功則跳出重試迴圈
            except (requests.exceptions.RequestException) as e:
                if attempt == max_retries - 1:
                    print(f"API 請求最終失敗 (經過 {max_retries} 次嘗試): {e}")
                    return results # 回傳目前已抓取的結果
                print(f"網路異常，正在進行第 {attempt + 1} 次重試... (錯誤: {e})")
                await asyncio.sleep(1) # 等待 1 秒後重試
        
        if response and response.status_code == 200:
            data = response.json()
            places_batch = data.get("places", [])
            results.extend(places_batch)
            
            next_token = data.get("nextPageToken")
            if not next_token:
                break
                
            payload["pageToken"] = next_token
        else:
            status = response.status_code if response else "Unknown"
            text = response.text if response else "No response"
            print(f"API 請求錯誤 (Status: {status}): {text}")
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
    
    # Step 1: 地理編碼取得搜尋中心點
    geo = await geocode_region(query)
    location_bias = None
    if geo:
        location_bias = {
            "circle": {
                "center": geo["center"],
                "radius": 3000.0  # 3km 半徑，聚焦在該行政區
            }
        }
        print(f"[地理定位] 美食搜尋 '{query}' -> 中心座標: {geo['center']}")
    
    search_queries = []
    has_specific_keyword = any(keyword in query for keyword in ["餐廳", "湯", "麵", "飯", "小吃", "店", "咖啡", "館", "美食"])
    
    # 永遠包含原始輸入關鍵字進行搜尋，確保精確匹配
    search_queries.append(query)
    
    if has_specific_keyword:
        search_queries.append(query + " 推薦")
    else:
        search_queries.extend([
            query + " 餐廳",
            query + " 小吃",
            query + " 咖啡廳",
            query + " 甜點"
        ])
    
    # Step 2: 帶入 locationBias 的非同步搜尋
    tasks = [fetch_single_query_pages(url, headers, q, lang, location_bias) for q in search_queries]
    all_results_lists = await asyncio.gather(*tasks)
    
    all_places_dict = {} # 用 dict 去重複
    for results in all_results_lists:
        for p in results:
            place_id = p.get("id") or p.get("formattedAddress")
            if place_id and place_id not in all_places_dict:
                all_places_dict[place_id] = p
                
    merged_places = list(all_places_dict.values())
    
    # Step 3: 地址後過濾，剔除不在目標行政區的結果
    region_keywords = extract_region_keywords(query)
    if region_keywords:
        merged_places = filter_by_region(merged_places, region_keywords)
    
    merged_places.sort(key=lambda x: x.get("rating", 0.0), reverse=True)
            
    return merged_places


async def fetch_google_hotels(query: str, lang: str = "zh-TW"):
    """接入 Google Maps Places API 獲取旅館/飯店資料，並過濾 3.5 星以上"""
    if not GOOGLE_MAPS_API_KEY:
        # 如果使用者尚未設定 API Key，回傳假資料以免系統崩潰
        mock_data = [
            {"displayName": {"text": "(假資料) 台北五星大飯店"}, "formattedAddress": "台北市信義區1號", "nationalPhoneNumber": "02-1111-2222", "rating": 4.7, "userRatingCount": 3200, "websiteUri": "https://example.com", "priceLevel": "PRICE_LEVEL_MODERATE"},
            {"displayName": {"text": "(假資料) 溫馨民宿"}, "formattedAddress": "台北市大安區2號", "nationalPhoneNumber": "02-3333-4444", "rating": 4.2, "userRatingCount": 500, "websiteUri": "", "priceLevel": "PRICE_LEVEL_INEXPENSIVE"},
            {"displayName": {"text": "(過濾示範) 低評價旅館"}, "formattedAddress": "台北市中山區3號", "nationalPhoneNumber": "02-5555-6666", "rating": 2.8, "userRatingCount": 100, "websiteUri": "", "priceLevel": ""}
        ]
        # 假資料也要套用 3.5 星過濾，以示範過濾效果
        return [p for p in mock_data if p.get("rating", 0.0) >= 3.5]

    url = "https://places.googleapis.com/v1/places:searchText"
    headers = {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": GOOGLE_MAPS_API_KEY,
        "X-Goog-FieldMask": "places.id,places.displayName,places.formattedAddress,places.nationalPhoneNumber,places.rating,places.userRatingCount,places.websiteUri,places.priceLevel,nextPageToken"
    }

    # Step 1: 地理編碼取得搜尋中心點
    geo = await geocode_region(query)
    location_bias = None
    if geo:
        location_bias = {
            "circle": {
                "center": geo["center"],
                "radius": 3000.0  # 3km 半徑，聚焦在該行政區
            }
        }
        print(f"[地理定位] 旅館搜尋 '{query}' -> 中心座標: {geo['center']}")

    search_queries = []
    has_specific_keyword = any(keyword in query for keyword in ["飯店", "旅館", "民宿", "酒店", "旅社", "hotel", "Hotel", "inn", "hostel"])

    # 永遠包含原始輸入關鍵字進行搜尋
    search_queries.append(query)

    if has_specific_keyword:
        search_queries.append(query + " 推薦")
    else:
        search_queries.extend([
            query + " 飯店",
            query + " 旅館",
            query + " 民宿",
            query + " 酒店"
        ])

    # Step 2: 帶入 locationBias 的非同步搜尋
    tasks = [fetch_single_query_pages(url, headers, q, lang, location_bias) for q in search_queries]
    all_results_lists = await asyncio.gather(*tasks)

    all_places_dict = {}  # 用 dict 去重複
    for results in all_results_lists:
        for p in results:
            place_id = p.get("id") or p.get("formattedAddress")
            if place_id and place_id not in all_places_dict:
                all_places_dict[place_id] = p

    merged_places = list(all_places_dict.values())
    
    # Step 3: 地址後過濾，剔除不在目標行政區的結果
    region_keywords = extract_region_keywords(query)
    if region_keywords:
        merged_places = filter_by_region(merged_places, region_keywords)
    
    # Step 4: 過濾 3.5 星以上
    filtered_places = [p for p in merged_places if p.get("rating", 0.0) >= 3.5]
    filtered_places.sort(key=lambda x: x.get("rating", 0.0), reverse=True)

    return filtered_places

# 價格等級對照表
PRICE_LEVEL_MAP = {
    "PRICE_LEVEL_FREE": "免費",
    "PRICE_LEVEL_INEXPENSIVE": "$",
    "PRICE_LEVEL_MODERATE": "$$",
    "PRICE_LEVEL_EXPENSIVE": "$$$",
    "PRICE_LEVEL_VERY_EXPENSIVE": "$$$$",
}

class MarkdownGenerator:
    """負責將資料轉換為 Markdown 表格"""
    @staticmethod
    def to_table(region: str, places: list, search_type: str = "food") -> str:
        if search_type == "hotel":
            return MarkdownGenerator._hotel_table(region, places)
        return MarkdownGenerator._food_table(region, places)

    @staticmethod
    def _food_table(region: str, places: list) -> str:
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

    @staticmethod
    def _hotel_table(region: str, places: list) -> str:
        header = "| 旅館名稱 | 地址 | 電話 | 評分 | 評論數 | 價位 | 網站 |\n| --- | --- | --- | --- | --- | --- | --- |"
        rows = []
        for p in places:
            display_name = p.get("displayName", {})
            name = display_name.get("text", "N/A") if isinstance(display_name, dict) else str(display_name)
            addr = p.get("formattedAddress", "N/A")
            phone = p.get("nationalPhoneNumber", "無電話資料")
            rating = p.get("rating", 0.0)
            reviews = p.get("userRatingCount", 0)
            price_level = PRICE_LEVEL_MAP.get(p.get("priceLevel", ""), "-")
            website = p.get("websiteUri", "")
            
            name = str(name).replace("|", "")
            addr = str(addr).replace("|", "")
            phone = str(phone).replace("|", "")
            website_display = f"[官網]({website})" if website else "-"
            
            rows.append(f"| {name} | {addr} | {phone} | {rating} | {reviews} | {price_level} | {website_display} |")
            
        apiKey_status = "✅ 已串接真實 Google Map API" if GOOGLE_MAPS_API_KEY else "⚠️ 目前為假資料模式 (缺少 GOOGLE_MAPS_API_KEY)"
        
        return f"# {region} 旅館/飯店清單 (3.5 星以上)\n\n> 系統狀態：{apiKey_status}\n\n{header}\n" + "\n".join(rows)


# ====== 1. 後端 API 查詢接口 ======
@app.post("/api/generate")
@limiter.limit("10/minute")  # 每個 IP 每分鐘最多 10 次搜尋
async def generate_report(request: Request, req: ReportRequest):
    search_type = req.search_type
    
    if search_type == "hotel":
        places = await fetch_google_hotels(req.region, req.lang)
        print(f"\n[資料追蹤] 搜尋旅館 '{req.region}' -> 3.5 星以上筆數: {len(places)}\n")
    else:
        places = await fetch_google_places(req.region, req.lang)
        print(f"\n[資料追蹤] 搜尋美食 '{req.region}' -> 取得全部資料總筆數: {len(places)}\n")
    
    filtered = places
    
    generator = MarkdownGenerator()
    md_content = generator.to_table(req.region, filtered, search_type)
    
    # 將回傳資料結構化，方便前端進行分頁渲染
    parsed_places = []
    for p in filtered:
        display_name = p.get("displayName", {})
        name = display_name.get("text", "N/A") if isinstance(display_name, dict) else str(display_name)
        addr = p.get("formattedAddress", "N/A")
        phone = p.get("nationalPhoneNumber", "無電話資料")
        rating = p.get("rating", 0.0)
        reviews = p.get("userRatingCount", 0)
        
        place_data = {
            "name": name,
            "address": addr,
            "phone": phone,
            "rating": rating,
            "reviews": reviews
        }
        
        # 旅館模式額外回傳價位與網站
        if search_type == "hotel":
            place_data["priceLevel"] = PRICE_LEVEL_MAP.get(p.get("priceLevel", ""), "-")
            place_data["website"] = p.get("websiteUri", "")
        
        parsed_places.append(place_data)
    
    return {"markdown": md_content, "data": parsed_places, "searchType": search_type}


@app.get("/favicon.ico", include_in_schema=False)
async def favicon():
    return Response(content=b"", media_type="image/x-icon")

FRONTEND_DIR = BASE_DIR / "frontend" / "dist"

# ====== 2. 前端 UI 介面 (掛載 Vite 編譯後的靜態檔案) ======
from fastapi.staticfiles import StaticFiles

# 檢查 dist 目錄是否存在，如果不存在則使用原始 frontend 目錄 (開發模式)
if not FRONTEND_DIR.exists():
    FRONTEND_DIR = BASE_DIR / "frontend"

# 掛載靜態資源 (如 assets/ 夾)
app.mount("/assets", StaticFiles(directory=FRONTEND_DIR / "assets" if (FRONTEND_DIR / "assets").exists() else FRONTEND_DIR), name="assets")

@app.get("/", response_class=FileResponse)
async def serve_ui():
    index_path = FRONTEND_DIR / "index.html"
    if not index_path.exists():
        return Response(content="Frontend not built. Please run 'npm run build' in frontend directory.", status_code=404)
    return FileResponse(index_path)

if __name__ == "__main__":
    print("啟動服務中...")
    uvicorn.run(app, host="0.0.0.0", port=8080)
