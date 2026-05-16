let currentPage = 1;
const itemsPerPage = 20;
let currentData = [];
let currentLang = 'zh-TW';
let currentSearchType = 'food'; // 'food' or 'hotel'

const i18n = {
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

// ====== 搜尋類型切換 ======
function switchSearchType(type) {
    currentSearchType = type;
    const t = i18n[currentLang];
    const body = document.getElementById('app-body');
    
    // 切換 Tab 視覺狀態
    const tabFood = document.getElementById('tab-food');
    const tabHotel = document.getElementById('tab-hotel');
    
    if (type === 'hotel') {
        tabFood.classList.remove('active');
        tabFood.classList.add('text-slate-500');
        tabHotel.classList.add('active');
        tabHotel.classList.remove('text-slate-500');
        body.classList.add('hotel-mode');
        
        // 顯示旅館提示
        document.getElementById('hotel-hint').classList.remove('hidden');
        
        // 更新 placeholder
        document.getElementById('region').placeholder = t.placeholderHotel;
        
        // 更新搜尋區域的 focus ring 顏色
        document.getElementById('region').classList.remove('focus:ring-blue-500');
        document.getElementById('region').classList.add('focus:ring-violet-500');
    } else {
        tabHotel.classList.remove('active');
        tabHotel.classList.add('text-slate-500');
        tabFood.classList.add('active');
        tabFood.classList.remove('text-slate-500');
        body.classList.remove('hotel-mode');
        
        // 隱藏旅館提示
        document.getElementById('hotel-hint').classList.add('hidden');
        
        // 更新 placeholder
        document.getElementById('region').placeholder = t.placeholder;
        
        // 恢復原本的 focus ring 顏色
        document.getElementById('region').classList.remove('focus:ring-violet-500');
        document.getElementById('region').classList.add('focus:ring-blue-500');
    }
    
    // 更新表格欄位顯示/隱藏
    updateTableColumns();
    
    // 更新推薦標題與隨機按鈕文字
    updateDynamicLabels();
    
    // 切換 Tab 時清空之前的搜尋結果
    currentData = [];
    currentPage = 1;
    document.getElementById('result-container').classList.add('hidden');
    
    const emptyStateEl = document.getElementById('empty-state');
    emptyStateEl.innerText = t.emptyState;
    emptyStateEl.classList.remove('hidden');
}

function updateTableColumns() {
    const isHotel = currentSearchType === 'hotel';
    const t = i18n[currentLang];
    
    // 更新表頭文字
    document.getElementById('th-name').innerText = isHotel ? t.thNameHotel : t.thName;
    
    // 顯示/隱藏旅館專屬欄位
    document.getElementById('th-price').classList.toggle('hidden', !isHotel);
    document.getElementById('th-website').classList.toggle('hidden', !isHotel);
    
    // 更新旅館欄位的標題文字
    if (isHotel) {
        document.getElementById('th-price').innerText = t.thPrice;
        document.getElementById('th-website').innerText = t.thWebsite;
    }
}

function updateDynamicLabels() {
    const t = i18n[currentLang];
    const isHotel = currentSearchType === 'hotel';
    
    document.getElementById('text-recommend').innerText = isHotel ? t.recommendTitleHotel : t.recommendTitle;
    document.getElementById('btn-random').innerHTML = isHotel ? t.randomBtnHotel : t.randomBtn;
}

function changeLanguage(lang) {
    currentLang = lang;
    const t = i18n[lang];
    
    document.getElementById('app-title').innerText = t.title;
    document.getElementById('region').placeholder = currentSearchType === 'hotel' ? t.placeholderHotel : t.placeholder;
    document.getElementById('btn-search').title = t.searchBtn;
    document.getElementById('text-loading').innerText = t.loading;
    document.getElementById('th-address').innerText = t.thAddress;
    document.getElementById('th-phone').innerText = t.thPhone;
    document.getElementById('th-rating').innerText = t.thRating;
    document.getElementById('th-reviews').innerText = t.thReviews;
    document.getElementById('btn-prev').innerText = t.btnPrev;
    document.getElementById('btn-next').innerText = t.btnNext;
    
    // 更新 Tab 文字
    document.getElementById('tab-food-text').innerText = t.tabFood;
    document.getElementById('tab-hotel-text').innerText = t.tabHotel;
    
    // 更新旅館提示文字
    document.getElementById('hotel-hint-text').innerText = t.hotelHint;
    
    const emptyStateEl = document.getElementById('empty-state');
    const allNotFounds = Object.values(i18n).flatMap(langDict => [langDict.alertNotFound, langDict.alertNotFoundHotel]);
    const isNotFound = allNotFounds.includes(emptyStateEl.innerText);
    if (!isNotFound) {
        emptyStateEl.innerText = t.emptyState;
    } else {
        emptyStateEl.innerText = currentSearchType === 'hotel' ? t.alertNotFoundHotel : t.alertNotFound;
    }
    
    document.getElementById('btn-reroll').innerHTML = t.modalReroll;
    document.getElementById('btn-close').innerText = t.modalClose;
    document.getElementById('random-link').innerHTML = t.modalMap;
    document.getElementById('modal-title').innerText = currentSearchType === 'hotel' ? t.modalTitleTodayHotel : t.modalTitleToday;
    
    // 更新動態欄位
    updateTableColumns();
    updateDynamicLabels();
    
    if (currentData.length > 0) renderTable();
}

function renderTable() {
    const start = (currentPage - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    const pageData = currentData.slice(start, end);
    const isHotel = currentSearchType === 'hotel';

    const tbody = document.getElementById('table-body');
    tbody.innerHTML = '';

    pageData.forEach(item => {
        // 使用店家名稱加上地址作為精準的搜尋字串
        const mapSearchQuery = encodeURIComponent(`${item.name} ${item.address}`);
        const mapUrl = `https://www.google.com/maps/search/?api=1&query=${mapSearchQuery}`;

        // 旅館模式額外欄位
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
    const t = i18n[currentLang];
    const region = document.getElementById('region').value;
    if (!region) return alert(t.alertEmpty);

    document.getElementById('loading').classList.remove('hidden');
    document.getElementById('empty-state').classList.add('hidden');
    document.getElementById('result-container').classList.add('hidden');

    try {
        const res = await fetch('/api/generate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ region: region, lang: currentLang, search_type: currentSearchType })
        });
        const data = await res.json();

        if (data.data && data.data.length > 0) {
            currentData = data.data;
            currentPage = 1;
            
            // 確保表格欄位顯示狀態正確
            updateTableColumns();
            renderTable();
            document.getElementById('result-container').classList.remove('hidden');
        } else if (data.data && data.data.length === 0) {
            const notFoundMsg = currentSearchType === 'hotel' ? t.alertNotFoundHotel : t.alertNotFound;
            document.getElementById('empty-state').innerText = notFoundMsg;
            document.getElementById('empty-state').classList.remove('hidden');
        } else {
            alert(t.alertError + (data.detail || ""));
            document.getElementById('empty-state').classList.remove('hidden');
        }
    } catch (e) {
        alert(t.alertServerErr);
        document.getElementById('empty-state').classList.remove('hidden');
    } finally {
        document.getElementById('loading').classList.add('hidden');
    }
}

// 允許按 Enter 鍵搜尋
document.getElementById('region').addEventListener('keypress', function (e) {
    if (e.key === 'Enter') { search(); }
});

function getMealKeywordsByTime() {
    const hour = new Date().getHours();
    let mealName = "";
    let keywords = [];

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
    
    let filteredData;
    let isFallback = false;
    
    if (isHotel) {
        // 旅館模式：直接從全部資料中隨機 (不做時段過濾)
        filteredData = currentData;
    } else {
        // 美食模式：依據時間關鍵字過濾
        const { mealName, keywords } = getMealKeywordsByTime();
        
        filteredData = currentData.filter(item => {
            return keywords.some(kw => item.name.includes(kw));
        });

        if (filteredData.length === 0) {
            filteredData = currentData;
            isFallback = true;
        }
    }

    // 隨機選一家
    const randomIndex = Math.floor(Math.random() * filteredData.length);
    const item = filteredData[randomIndex];
    
    // 更新彈出視窗標題
    const titleElement = document.querySelector('#random-modal-content h3');
    const iconElement = document.getElementById('modal-icon');
    
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

    // 填充資料
    document.getElementById('random-name').innerText = item.name;
    document.getElementById('random-rating').innerText = `${item.rating} ⭐ (${item.reviews} ${t.reviewsCount})`;
    document.getElementById('random-address').innerText = item.address;
    
    // 旅館模式額外資訊
    const hotelExtraEl = document.getElementById('random-hotel-extra');
    if (isHotel) {
        hotelExtraEl.classList.remove('hidden');
        
        if (item.priceLevel && item.priceLevel !== '-') {
            document.getElementById('random-price').innerText = `${t.priceLabel}${item.priceLevel}`;
            document.getElementById('random-price').classList.remove('hidden');
        } else {
            document.getElementById('random-price').classList.add('hidden');
        }
        
        const websiteEl = document.getElementById('random-website');
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
    document.getElementById('random-link').href = `https://www.google.com/maps/search/?api=1&query=${mapSearchQuery}`;
    
    // 顯示 Modal
    const modal = document.getElementById('random-modal');
    const modalContent = document.getElementById('random-modal-content');
    modal.classList.remove('hidden');
    // 使用 setTimeout 確保 display: block 生效後再加 opacity 達成動畫效果
    setTimeout(() => {
        modal.classList.remove('opacity-0');
        modalContent.classList.remove('scale-95');
        modalContent.classList.add('scale-100');
    }, 10);
}

function closeRandomModal() {
    const modal = document.getElementById('random-modal');
    const modalContent = document.getElementById('random-modal-content');
    
    modal.classList.add('opacity-0');
    modalContent.classList.remove('scale-100');
    modalContent.classList.add('scale-95');
    
    setTimeout(() => {
        modal.classList.add('hidden');
    }, 300); // 配合 transition duration
}
