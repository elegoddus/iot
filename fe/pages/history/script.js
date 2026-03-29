const tableBody = document.getElementById('history-table-body');
const rowsSelect = document.getElementById('rows-history');
const filterDevice = document.getElementById('filter-device');
const searchInput = document.getElementById('search-history');
const btnPrev = document.getElementById('btn-prev');
const btnNext = document.getElementById('btn-next');
const pageInfo = document.getElementById('page-info');

let historyData = [];
let currentPage = 1;
let rowsPerPage = 10;
let currentId = 500;

function addLog() {
    if (searchInput.value.trim() !== "") return;

    // 1. Danh sách thiết bị
    const devices = [
        { key: 'lamp', name: 'Đèn Chùm', icon: '<i class="fa-solid fa-lightbulb"></i>' },
        { key: 'fan',  name: 'Quạt Thông Hơi', icon: '<i class="fa-solid fa-fan"></i>' },
        { key: 'ac',   name: 'Đèn Huỳnh Quang', icon: '<i class="fa-solid fa-bolt"></i>' }
    ];
    
    // 2. Hành động: ON / OFF
    const actions = ['ON', 'OFF'];
    
    // 3. Trạng thái: 3 Kiểu (Thành công, Chờ, Lỗi)
    const statuses = [
        { text: 'Thành công', class: 'bg-success' }, // Tỉ lệ xuất hiện cao nhất
        { text: 'Thành công', class: 'bg-success' },
        { text: 'Thành công', class: 'bg-success' },
        { text: 'Đang chờ',   class: 'bg-pending' },
        { text: 'Lỗi',        class: 'bg-error' }
    ];

    const dev = devices[Math.floor(Math.random() * devices.length)];
    const act = actions[Math.floor(Math.random() * actions.length)];
    const stt = statuses[Math.floor(Math.random() * statuses.length)];
    const time = new Date().toLocaleString('vi-VN');

    // Tạo class màu cho chữ ON/OFF
    const actionClass = act === 'ON' ? 'act-on' : 'act-off';

    const logItem = {
        id: currentId++,
        devKey: dev.key,
        devName: dev.name,
        devIcon: dev.icon,
        action: act,         // ON hoặc OFF
        actionClass: actionClass,
        status: stt.text,    // Thành công / Đang chờ / Lỗi
        statusClass: stt.class,
        time: time
    };

    historyData.unshift(logItem);
    if(historyData.length > 500) historyData.pop();
    renderTable();
}

function renderTable() {
    tableBody.innerHTML = '';

    const filterVal = filterDevice.value;
    const searchText = searchInput.value.toLowerCase().trim();

    let filtered = historyData.filter(item => {
        const matchDev = (filterVal === 'all') || (item.devKey === filterVal);
        const matchSearch = item.id.toString().includes(searchText) || item.time.includes(searchText);
        return matchDev && matchSearch;
    });

    const totalPages = Math.ceil(filtered.length / rowsPerPage) || 1;
    if (currentPage > totalPages) currentPage = totalPages;
    if (currentPage < 1) currentPage = 1;

    const start = (currentPage - 1) * rowsPerPage;
    const end = start + rowsPerPage;
    const paginated = filtered.slice(start, end);

    if (paginated.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="5" style="text-align:center; padding:20px">Không có dữ liệu</td></tr>';
    } else {
        paginated.forEach(item => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>#${item.id}</td>
                <td>${item.devIcon} ${item.devName}</td>
                <td><span class="action-text ${item.actionClass}">${item.action}</span></td>
                <td><span class="status-badge ${item.statusClass}">${item.status}</span></td>
                <td>${item.time}</td>
            `;
            tableBody.appendChild(tr);
        });
    }

    pageInfo.innerText = `Trang ${currentPage} / ${totalPages}`;
    btnPrev.style.opacity = currentPage === 1 ? "0.5" : "1";
    btnPrev.style.pointerEvents = currentPage === 1 ? "none" : "auto";
    btnNext.style.opacity = currentPage === totalPages ? "0.5" : "1";
    btnNext.style.pointerEvents = currentPage === totalPages ? "none" : "auto";
}

// EVENTS
rowsSelect.addEventListener('change', (e) => {
    rowsPerPage = parseInt(e.target.value);
    currentPage = 1;
    renderTable();
});
filterDevice.addEventListener('change', () => { currentPage = 1; renderTable(); });
searchInput.addEventListener('keyup', () => { currentPage = 1; renderTable(); });
btnPrev.addEventListener('click', () => { if(currentPage > 1) { currentPage--; renderTable(); } });
btnNext.addEventListener('click', () => { currentPage++; renderTable(); });

// INIT
for(let i=0; i<5; i++) addLog();
setInterval(() => { if(Math.random() > 0.6) addLog(); }, 3000);