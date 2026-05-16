let currentPage = 1;
const itemsPerPage = 20;
let currentData = [];
let currentLang = 'zh-TW';

const i18n = {
    'zh-TW': {
        title: "📍 Google Maps 高分店家指南",
        placeholder: "請輸入想查詢的地區 (例如：台南市中西區 牛肉湯)",
        searchBtn: "搜尋",
        loading: "正在向 Google Maps API 抓取資料，請稍候...",
        recommendTitle: "為您推薦的店家",
        randomBtn: "🎲 隨機抽籤",
        thName: "店家名稱",
        thAddress: "地址",
        thPhone: "電話",
        thRating: "評分",
        thReviews: "評論數",
        btnPrev: "上一頁",
        btnNext: "下一頁",
        emptyState: "搜尋結果將顯示於此...",
        alertEmpty: "請輸入想查詢的地區名稱!",
        alertNotFound: "查詢不到相關店家。",
        alertError: "發生錯誤: ",
        alertServerErr: "伺服器連線錯誤！請檢查後端是否正常運行。",
        reviewsCount: "則",
        noData: "無資料",
        pageInfo: (cur, total, count) => `第 ${cur} 頁，共 ${total} 頁 (總計 ${count} 筆)`,
        modalTitleToday: "今天吃這家！",
        modalTitleRecommend: (meal) => `為您推薦【${meal}】！`,
        modalName: "店家名稱",
        modalAddress: "地址...",
        modalReroll: "🎲 再試一次",
        modalClose: "關閉",
        modalMap: "看地圖"
    },
    'en': {
        title: "📍 Google Maps Top Rated Guide",
        placeholder: "Enter location (e.g. Taipei Beef Noodle)",
        searchBtn: "Search",
        loading: "Fetching from Google Maps API, please wait...",
        recommendTitle: "Recommended for You",
        randomBtn: "🎲 Random Pick",
        thName: "Name",
        thAddress: "Address",
        thPhone: "Phone",
        thRating: "Rating",
        thReviews: "Reviews",
        btnPrev: "Prev",
        btnNext: "Next",
        emptyState: "Search results will appear here...",
        alertEmpty: "Please enter a location!",
        alertNotFound: "No results found.",
        alertError: "Error: ",
        alertServerErr: "Server error! Please check if backend is running.",
        reviewsCount: "reviews",
        noData: "No data",
        pageInfo: (cur, total, count) => `Page ${cur} of ${total} (Total ${count} items)`,
        modalTitleToday: "Eat here today!",
        modalTitleRecommend: (meal) => `Recommended for ${meal}!`,
        modalName: "Place Name",
        modalAddress: "Address...",
        modalReroll: "🎲 Try Again",
        modalClose: "Close",
        modalMap: "View Map"
    },
    'zh-CN': {
        title: "📍 Google Maps 高分好店指南",
        placeholder: "请输入想查询的地区 (例如：台南市中西区 牛肉汤)",
        searchBtn: "搜索",
        loading: "正在向 Google Maps API 获取数据，请稍候...",
        recommendTitle: "为您推荐的好店",
        randomBtn: "🎲 随机抽签",
        thName: "店铺名称",
        thAddress: "地址",
        thPhone: "电话",
        thRating: "评分",
        thReviews: "评论数",
        btnPrev: "上一页",
        btnNext: "下一页",
        emptyState: "搜索结果将显示于此...",
        alertEmpty: "请输入想查询的地区名称!",
        alertNotFound: "查询不到相关店铺。",
        alertError: "发生错误: ",
        alertServerErr: "服务器连接错误！请检查后端是否正常运行。",
        reviewsCount: "条",
        noData: "无数据",
        pageInfo: (cur, total, count) => `第 ${cur} 页，共 ${total} 页 (总计 ${count} 条)`,
        modalTitleToday: "今天吃这家！",
        modalTitleRecommend: (meal) => `为您推荐【${meal}】！`,
        modalName: "店铺名称",
        modalAddress: "地址...",
        modalReroll: "🎲 再试一次",
        modalClose: "关闭",
        modalMap: "看地图"
    }
};

function changeLanguage(lang) {
    currentLang = lang;
    const t = i18n[lang];
    
    document.getElementById('app-title').innerText = t.title;
    document.getElementById('region').placeholder = t.placeholder;
    document.getElementById('btn-search').title = t.searchBtn;
    document.getElementById('text-loading').innerText = t.loading;
    document.getElementById('text-recommend').innerText = t.recommendTitle;
    document.getElementById('btn-random').innerHTML = t.randomBtn;
    document.getElementById('th-name').innerText = t.thName;
    document.getElementById('th-address').innerText = t.thAddress;
    document.getElementById('th-phone').innerText = t.thPhone;
    document.getElementById('th-rating').innerText = t.thRating;
    document.getElementById('th-reviews').innerText = t.thReviews;
    document.getElementById('btn-prev').innerText = t.btnPrev;
    document.getElementById('btn-next').innerText = t.btnNext;
    
    const emptyStateEl = document.getElementById('empty-state');
    const isNotFound = Object.values(i18n).some(langDict => emptyStateEl.innerText === langDict.alertNotFound);
    if (!isNotFound) {
        emptyStateEl.innerText = t.emptyState;
    } else {
        emptyStateEl.innerText = t.alertNotFound;
    }
    
    document.getElementById('btn-reroll').innerHTML = t.modalReroll;
    document.getElementById('btn-close').innerText = t.modalClose;
    document.getElementById('random-link').innerHTML = t.modalMap;
    document.getElementById('modal-title').innerText = t.modalTitleToday;
    
    if (currentData.length > 0) renderTable();
}

function renderTable() {
    const start = (currentPage - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    const pageData = currentData.slice(start, end);

    const tbody = document.getElementById('table-body');
    tbody.innerHTML = '';

    pageData.forEach(item => {
        // 使用店家名稱加上地址作為精準的搜尋字串
        const mapSearchQuery = encodeURIComponent(`${item.name} ${item.address}`);
        const mapUrl = `https://www.google.com/maps/search/?api=1&query=${mapSearchQuery}`;

        tbody.innerHTML += `
            <tr class="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                <td class="p-3 font-bold text-blue-700">${item.name}</td>
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
            body: JSON.stringify({ region: region, lang: currentLang })
        });
        const data = await res.json();

        if (data.data && data.data.length > 0) {
            currentData = data.data;
            currentPage = 1;
            renderTable();
            document.getElementById('result-container').classList.remove('hidden');
        } else if (data.data && data.data.length === 0) {
            document.getElementById('empty-state').innerText = t.alertNotFound;
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
    
    const { mealName, keywords } = getMealKeywordsByTime();
    
    // 依據時間關鍵字過濾餐廳 (只要店名包含任一關鍵字就算)
    let filteredData = currentData.filter(item => {
        return keywords.some(kw => item.name.includes(kw));
    });

    let isFallback = false;
    // 如果該時段的關鍵字沒有匹配到任何餐廳 (可能使用者搜的很特定)，則退回使用所有查詢結果
    if (filteredData.length === 0) {
        filteredData = currentData;
        isFallback = true;
    }

    // 隨機選一家
    const randomIndex = Math.floor(Math.random() * filteredData.length);
    const item = filteredData[randomIndex];
    
    // 更新彈出視窗標題以顯示時段
    const titleElement = document.querySelector('#random-modal-content h3');
    if (titleElement) {
        titleElement.innerText = isFallback ? i18n[currentLang].modalTitleToday : i18n[currentLang].modalTitleRecommend(mealName);
    }

    // 填充資料
    document.getElementById('random-name').innerText = item.name;
    document.getElementById('random-rating').innerText = `${item.rating} ⭐ (${item.reviews} ${i18n[currentLang].reviewsCount})`;
    document.getElementById('random-address').innerText = item.address;
    
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
