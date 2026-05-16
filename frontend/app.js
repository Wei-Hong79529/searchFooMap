let currentPage = 1;
const itemsPerPage = 20; // 每頁顯示20筆
let currentData = [];

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
    if (!region) return alert('請輸入想查詢的地區名稱!');

    document.getElementById('loading').classList.remove('hidden');
    document.getElementById('empty-state').classList.add('hidden');
    document.getElementById('result-container').classList.add('hidden');

    try {
        const res = await fetch('/api/generate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ region: region })
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
    } catch (e) {
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
