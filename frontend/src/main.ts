import { Place, SearchResponse, SearchType, LangCode, I18nContent } from './types';

let currentPage: number = 1;
const itemsPerPage: number = 20;
let currentData: Place[] = [];
let currentLang: LangCode = 'zh-TW';
let currentSearchType: SearchType = 'food';

const i18n: Record<LangCode, I18nContent> = {
    'zh-TW': {
        title: "📍 Google Maps 高分店家指南",
        placeholder: "請輸入想查詢的地區 (例如：台南市中西區 牛肉湯)",
        placeholderHotel: "請輸入想查詢的地區 (例如：台北市信義區)",
        searchBtn: "搜尋",
        loading: "正在向 Google Maps API 抓取資料，請稍候...",
        recommendTitle: "為您推薦的店家",
        recommendTitleHotel: "為您推薦的旅館/飯店 (3.5★ 以上)",
        randomBtn: "🎲 隨機抽籤",
        randomBtnHotel: "🎲 隨機推薦住宿",
        thName: "店家名稱",
        thNameHotel: "旅館名稱",
        thAddress: "地址",
        thPhone: "電話",
        thRating: "評分",
        thReviews: "評論數",
        thPrice: "價位",
        thWebsite: "網站",
        btnPrev: "上一頁",
        btnNext: "下一頁",
        emptyState: "搜尋結果將顯示於此...",
        alertEmpty: "請輸入想查詢的地區名稱!",
        alertNotFound: "查詢不到相關店家。",
        alertNotFoundHotel: "查詢不到 3.5 星以上的旅館/飯店。",
        alertError: "發生錯誤: ",
        alertServerErr: "伺服器連線錯誤！請檢查後端是否正常運行。",
        reviewsCount: "則",
        noData: "無資料",
        pageInfo: (cur, total, count) => `第 ${cur} 頁，共 ${total} 頁 (總計 ${count} 筆)`,
        modalTitleToday: "今天吃這家！",
        modalTitleTodayHotel: "推薦入住這家！",
        modalTitleRecommend: (meal) => `為您推薦【${meal}】！`,
        modalName: "店家名稱",
        modalAddress: "地址...",
        modalReroll: "🎲 再試一次",
        modalClose: "關閉",
        modalMap: "看地圖",
        tabFood: "美食餐廳",
        tabHotel: "旅館飯店",
        hotelHint: "旅館/飯店模式：自動過濾 3.5 顆星以上的住宿，為您篩選優質旅宿。",
        visitWebsite: "🌐 前往官方網站",
        priceLabel: "價位等級：",
    },
    'en': {
        title: "📍 Google Maps Top Rated Guide",
        placeholder: "Enter location (e.g. Taipei Beef Noodle)",
        placeholderHotel: "Enter location (e.g. Taipei Xinyi District)",
        searchBtn: "Search",
        loading: "Fetching from Google Maps API, please wait...",
        recommendTitle: "Recommended for You",
        recommendTitleHotel: "Recommended Hotels (3.5★+)",
        randomBtn: "🎲 Random Pick",
        randomBtnHotel: "🎲 Random Hotel",
        thName: "Name",
        thNameHotel: "Hotel Name",
        thAddress: "Address",
        thPhone: "Phone",
        thRating: "Rating",
        thReviews: "Reviews",
        thPrice: "Price",
        thWebsite: "Website",
        btnPrev: "Prev",
        btnNext: "Next",
        emptyState: "Search results will appear here...",
        alertEmpty: "Please enter a location!",
        alertNotFound: "No results found.",
        alertNotFoundHotel: "No hotels with 3.5+ stars found.",
        alertError: "Error: ",
        alertServerErr: "Server error! Please check if backend is running.",
        reviewsCount: "reviews",
        noData: "No data",
        pageInfo: (cur, total, count) => `Page ${cur} of ${total} (Total ${count} items)`,
        modalTitleToday: "Eat here today!",
        modalTitleTodayHotel: "Stay here tonight!",
        modalTitleRecommend: (meal) => `Recommended for ${meal}!`,
        modalName: "Place Name",
        modalAddress: "Address...",
        modalReroll: "🎲 Try Again",
        modalClose: "Close",
        modalMap: "View Map",
        tabFood: "Food",
        tabHotel: "Hotels",
        hotelHint: "Hotel mode: Automatically filters accommodations rated 3.5 stars and above.",
        visitWebsite: "🌐 Visit Website",
        priceLabel: "Price Level: ",
    },
    'zh-CN': {
        title: "📍 Google Maps 高分好店指南",
        placeholder: "请输入想查询的地区 (例如：台南市中西区 牛肉汤)",
        placeholderHotel: "请输入想查询的地区 (例如：台北市信义区)",
        searchBtn: "搜索",
        loading: "正在向 Google Maps API 获取数据，请稍候...",
        recommendTitle: "为您推荐的好店",
        recommendTitleHotel: "为您推荐的旅馆/酒店 (3.5★ 以上)",
        randomBtn: "🎲 随机抽签",
        randomBtnHotel: "🎲 随机推荐住宿",
        thName: "店铺名称",
        thNameHotel: "旅馆名称",
        thAddress: "地址",
        thPhone: "电话",
        thRating: "评分",
        thReviews: "评论数",
        thPrice: "价位",
        thWebsite: "网站",
        btnPrev: "上一页",
        btnNext: "下一页",
        emptyState: "搜索结果将显示于此...",
        alertEmpty: "请输入想查询的地区名称!",
        alertNotFound: "查询不到相关店铺。",
        alertNotFoundHotel: "查询不到 3.5 星以上的旅馆/酒店。",
        alertError: "发生错误: ",
        alertServerErr: "服务器连接错误！请检查后端是否正常运行。",
        reviewsCount: "条",
        noData: "无数据",
        pageInfo: (cur, total, count) => `第 ${cur} 页，共 ${total} 页 (总计 ${count} 条)`,
        modalTitleToday: "今天吃这家！",
        modalTitleTodayHotel: "推荐入住这家！",
        modalTitleRecommend: (meal) => `为您推荐【${meal}】！`,
        modalName: "店铺名称",
        modalAddress: "地址...",
        modalReroll: "🎲 再试一次",
        modalClose: "关闭",
        modalMap: "看地图",
        tabFood: "美食餐厅",
        tabHotel: "旅馆酒店",
        hotelHint: "旅馆/酒店模式：自动过滤 3.5 颗星以上的住宿，为您筛选优质旅宿。",
        visitWebsite: "🌐 前往官方网站",
        priceLabel: "价位等级：",
    }
};

// ====== DOM Helpers ======
const getEl = <T extends HTMLElement>(id: string) => document.getElementById(id) as T;

// ====== 搜尋類型切換 ======
function switchSearchType(type: SearchType) {
    currentSearchType = type;
    const t = i18n[currentLang];
    const body = getEl('app-body');
    
    const tabFood = getEl('tab-food');
    const tabHotel = getEl('tab-hotel');
    const regionInput = getEl<HTMLInputElement>('region');
    const hotelHint = getEl('hotel-hint');
    
    if (type === 'hotel') {
        tabFood.classList.remove('active');
        tabFood.classList.add('text-slate-500');
        tabHotel.classList.add('active');
        tabHotel.classList.remove('text-slate-500');
        body.classList.add('hotel-mode');
        hotelHint.classList.remove('hidden');
        regionInput.placeholder = t.placeholderHotel;
        regionInput.classList.remove('focus:ring-blue-500');
        regionInput.classList.add('focus:ring-violet-500');
    } else {
        tabHotel.classList.remove('active');
        tabHotel.classList.add('text-slate-500');
        tabFood.classList.add('active');
        tabFood.classList.remove('text-slate-500');
        body.classList.remove('hotel-mode');
        hotelHint.classList.add('hidden');
        regionInput.placeholder = t.placeholder;
        regionInput.classList.remove('focus:ring-violet-500');
        regionInput.classList.add('focus:ring-blue-500');
    }
    
    updateTableColumns();
    updateDynamicLabels();
    
    // 清空清單
    currentData = [];
    currentPage = 1;
    getEl('result-container').classList.add('hidden');
    const emptyStateEl = getEl('empty-state');
    emptyStateEl.innerText = t.emptyState;
    emptyStateEl.classList.remove('hidden');
}

function updateTableColumns() {
    const isHotel = currentSearchType === 'hotel';
    const t = i18n[currentLang];
    
    getEl('th-name').innerText = isHotel ? t.thNameHotel : t.thName;
    getEl('th-price').classList.toggle('hidden', !isHotel);
    getEl('th-website').classList.toggle('hidden', !isHotel);
    
    if (isHotel) {
        getEl('th-price').innerText = t.thPrice;
        getEl('th-website').innerText = t.thWebsite;
    }
}

function updateDynamicLabels() {
    const t = i18n[currentLang];
    const isHotel = currentSearchType === 'hotel';
    
    getEl('text-recommend').innerText = isHotel ? t.recommendTitleHotel : t.recommendTitle;
    getEl('btn-random').innerHTML = isHotel ? t.randomBtnHotel : t.randomBtn;
}

function changeLanguage(lang: LangCode) {
    currentLang = lang;
    const t = i18n[lang];
    
    getEl('app-title').innerText = t.title;
    getEl<HTMLInputElement>('region').placeholder = currentSearchType === 'hotel' ? t.placeholderHotel : t.placeholder;
    getEl<HTMLButtonElement>('btn-search').title = t.searchBtn;
    getEl('text-loading').innerText = t.loading;
    getEl('th-address').innerText = t.thAddress;
    getEl('th-phone').innerText = t.thPhone;
    getEl('th-rating').innerText = t.thRating;
    getEl('th-reviews').innerText = t.thReviews;
    getEl('btn-prev').innerText = t.btnPrev;
    getEl('btn-next').innerText = t.btnNext;
    getEl('tab-food-text').innerText = t.tabFood;
    getEl('tab-hotel-text').innerText = t.tabHotel;
    getEl('hotel-hint-text').innerText = t.hotelHint;
    
    const emptyStateEl = getEl('empty-state');
    const allNotFounds = Object.values(i18n).flatMap(langDict => [langDict.alertNotFound, langDict.alertNotFoundHotel]);
    const isNotFound = allNotFounds.includes(emptyStateEl.innerText);
    
    if (!isNotFound) {
        emptyStateEl.innerText = t.emptyState;
    } else {
        emptyStateEl.innerText = currentSearchType === 'hotel' ? t.alertNotFoundHotel : t.alertNotFound;
    }
    
    getEl('btn-reroll').innerHTML = t.modalReroll;
    getEl('btn-close').innerText = t.modalClose;
    getEl('random-link').innerHTML = t.modalMap;
    getEl('modal-title').innerText = currentSearchType === 'hotel' ? t.modalTitleTodayHotel : t.modalTitleToday;
    
    updateTableColumns();
    updateDynamicLabels();
    
    if (currentData.length > 0) renderTable();
}

function renderTable() {
    const start = (currentPage - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    const pageData = currentData.slice(start, end);
    const isHotel = currentSearchType === 'hotel';

    const tbody = getEl('table-body');
    tbody.innerHTML = '';

    pageData.forEach(item => {
        const mapSearchQuery = encodeURIComponent(`${item.name} ${item.address}`);
        const mapUrl = `https://www.google.com/maps/search/?api=1&query=${mapSearchQuery}`;

        let hotelColumns = '';
        if (isHotel) {
            const priceDisplay = item.priceLevel || '-';
            const websiteDisplay = item.website 
                ? `<a href="${item.website}" target="_blank" class="text-blue-600 hover:underline text-sm">🌐</a>` 
                : '-';
            hotelColumns = `
                <td class="p-3 text-sm font-semibold text-violet-600">${priceDisplay}</td>
                <td class="p-3 text-sm text-center">${websiteDisplay}</td>
            `;
        }

        tbody.innerHTML += `
            <tr class="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                <td class="p-3 font-bold ${isHotel ? 'text-violet-700' : 'text-blue-700'}">${item.name}</td>
                <td class="p-3 text-sm">
                    <a href="${mapUrl}" target="_blank" class="text-blue-600 hover:text-blue-800 hover:underline inline-flex items-center gap-1 transition-colors" title="在 Google 地圖上查看">
                        ${item.address}
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-3.5 w-3.5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                    </a>
                </td>
                <td class="p-3 whitespace-nowrap text-sm">${item.phone}</td>
                <td class="p-3 text-amber-500 font-bold">${item.rating} ⭐</td>
                <td class="p-3 text-slate-500 text-sm">${item.reviews} ${i18n[currentLang].reviewsCount}</td>
                ${hotelColumns}
            </tr>
        `;
    });

    const totalPages = Math.ceil(currentData.length / itemsPerPage);
    const infoText = totalPages === 0 ? i18n[currentLang].noData : i18n[currentLang].pageInfo(currentPage, totalPages, currentData.length);
    getEl('page-info').innerText = infoText;

    getEl<HTMLButtonElement>('btn-prev').disabled = currentPage === 1 || totalPages === 0;
    getEl<HTMLButtonElement>('btn-next').disabled = currentPage === totalPages || totalPages === 0;
}

function changePage(delta: number) {
    const totalPages = Math.ceil(currentData.length / itemsPerPage);
    const newPage = currentPage + delta;
    if (newPage >= 1 && newPage <= totalPages) {
        currentPage = newPage;
        renderTable();
    }
}

async function search() {
    const t = i18n[currentLang];
    const region = getEl<HTMLInputElement>('region').value;
    if (!region) return alert(t.alertEmpty);

    getEl('loading').classList.remove('hidden');
    getEl('empty-state').classList.add('hidden');
    getEl('result-container').classList.add('hidden');

    try {
        const res = await fetch('/api/generate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ region: region, lang: currentLang, search_type: currentSearchType })
        });
        const data: SearchResponse = await res.json();

        if (data.data && data.data.length > 0) {
            currentData = data.data;
            currentPage = 1;
            updateTableColumns();
            renderTable();
            getEl('result-container').classList.remove('hidden');
        } else if (data.data && data.data.length === 0) {
            const notFoundMsg = currentSearchType === 'hotel' ? t.alertNotFoundHotel : t.alertNotFound;
            getEl('empty-state').innerText = notFoundMsg;
            getEl('empty-state').classList.remove('hidden');
        } else {
            alert(t.alertError + (data.detail || ""));
            getEl('empty-state').classList.remove('hidden');
        }
    } catch (e) {
        alert(t.alertServerErr);
        getEl('empty-state').classList.remove('hidden');
    } finally {
        getEl('loading').classList.add('hidden');
    }
}

function getMealKeywordsByTime() {
    const hour = new Date().getHours();
    let mealName = "";
    let keywords: string[] = [];

    if (hour >= 20 || hour < 6) {
        mealName = "宵夜";
        keywords = ["宵夜", "居酒屋", "串燒", "燒烤", "火鍋", "酒", "滷味", "炸", "雞排", "豆漿"];
    } else if (hour >= 6 && hour < 10) {
        mealName = "早餐";
        keywords = ["早", "蛋餅", "吐司", "漢堡", "豆漿", "三明治", "咖啡", "包子"];
    } else if (hour >= 10 && hour < 14) {
        mealName = "午餐";
        keywords = ["飯", "麵", "便當", "水餃", "咖哩", "定食", "餐廳", "小吃", "肉", "湯"];
    } else if (hour >= 14 && hour < 17) {
        mealName = "下午茶";
        keywords = ["咖啡", "甜點", "下午茶", "蛋糕", "冰", "飲", "茶", "鬆餅", "豆花"];
    } else if (hour >= 17 && hour < 20) {
        mealName = "晚餐";
        keywords = ["飯", "麵", "火鍋", "燒肉", "牛排", "餐廳", "壽司", "餐酒", "炒", "湯"];
    }

    return { mealName, keywords };
}

function pickRandomRestaurant() {
    if (currentData.length === 0) return;
    
    const isHotel = currentSearchType === 'hotel';
    const t = i18n[currentLang];
    
    let filteredData: Place[];
    let isFallback = false;
    
    if (isHotel) {
        filteredData = currentData;
    } else {
        const { keywords } = getMealKeywordsByTime();
        filteredData = currentData.filter(item => {
            return keywords.some(kw => item.name.includes(kw));
        });

        if (filteredData.length === 0) {
            filteredData = currentData;
            isFallback = true;
        }
    }

    const randomIndex = Math.floor(Math.random() * filteredData.length);
    const item = filteredData[randomIndex];
    
    const titleElement = document.querySelector('#random-modal-content h3') as HTMLElement;
    const iconElement = getEl('modal-icon');
    
    if (isHotel) {
        if (titleElement) titleElement.innerText = t.modalTitleTodayHotel;
        if (iconElement) iconElement.innerText = '🏨';
    } else {
        const { mealName } = getMealKeywordsByTime();
        if (titleElement) {
            titleElement.innerText = isFallback ? t.modalTitleToday : t.modalTitleRecommend(mealName);
        }
        if (iconElement) iconElement.innerText = '🎉';
    }

    getEl('random-name').innerText = item.name;
    getEl('random-rating').innerText = `${item.rating} ⭐ (${item.reviews} ${t.reviewsCount})`;
    getEl('random-address').innerText = item.address;
    
    const hotelExtraEl = getEl('random-hotel-extra');
    if (isHotel) {
        hotelExtraEl.classList.remove('hidden');
        const priceEl = getEl('random-price');
        if (item.priceLevel && item.priceLevel !== '-') {
            priceEl.innerText = `${t.priceLabel}${item.priceLevel}`;
            priceEl.classList.remove('hidden');
        } else {
            priceEl.classList.add('hidden');
        }
        
        const websiteEl = getEl<HTMLAnchorElement>('random-website');
        if (item.website) {
            websiteEl.href = item.website;
            websiteEl.innerText = t.visitWebsite;
            websiteEl.classList.remove('hidden');
        } else {
            websiteEl.classList.add('hidden');
        }
    } else {
        hotelExtraEl.classList.add('hidden');
    }
    
    const mapSearchQuery = encodeURIComponent(`${item.name} ${item.address}`);
    getEl<HTMLAnchorElement>('random-link').href = `https://www.google.com/maps/search/?api=1&query=${mapSearchQuery}`;
    
    const modal = getEl('random-modal');
    const modalContent = getEl('random-modal-content');
    modal.classList.remove('hidden');
    setTimeout(() => {
        modal.classList.remove('opacity-0');
        modalContent.classList.remove('scale-95');
        modalContent.classList.add('scale-100');
    }, 10);
}

function closeRandomModal() {
    const modal = getEl('random-modal');
    const modalContent = getEl('random-modal-content');
    
    modal.classList.add('opacity-0');
    modalContent.classList.remove('scale-100');
    modalContent.classList.add('scale-95');
    
    setTimeout(() => {
        modal.classList.add('hidden');
    }, 300);
}

// ====== Event Listeners Initialization ======
window.addEventListener('DOMContentLoaded', () => {
    // 綁定 Tab 切換
    getEl('tab-food').addEventListener('click', () => switchSearchType('food'));
    getEl('tab-hotel').addEventListener('click', () => switchSearchType('hotel'));

    // 綁定搜尋按鈕
    getEl('btn-search').addEventListener('click', search);

    // 綁定語言切換
    getEl<HTMLSelectElement>('lang-select').addEventListener('change', (e) => {
        changeLanguage((e.target as HTMLSelectElement).value as LangCode);
    });

    // 綁定分頁按鈕
    getEl('btn-prev').addEventListener('click', () => changePage(-1));
    getEl('btn-next').addEventListener('click', () => changePage(1));

    // 綁定隨機按鈕
    getEl('btn-random').addEventListener('click', pickRandomRestaurant);
    getEl('btn-reroll').addEventListener('click', pickRandomRestaurant);

    // 綁定關閉 Modal
    getEl('btn-close').addEventListener('click', closeRandomModal);
    getEl('random-modal').addEventListener('click', (e) => {
        if (e.target === getEl('random-modal')) closeRandomModal();
    });

    // 綁定 Enter 鍵搜尋
    getEl('region').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') search();
    });
});
