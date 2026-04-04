const API_URL = 'http://localhost:5000/api';

const tableBody = document.getElementById('history-table-body');
const rowsSelect = document.getElementById('rows-history');
const filterDevice = document.getElementById('filter-device');
const filterAction = document.getElementById('filter-action');
const filterStatus = document.getElementById('filter-status');
const searchInput = document.getElementById('search-history');
const btnSearch = document.getElementById('btn-search'); // Giả sử có nút này hoặc search bằng phím enter
const btnPrev = document.getElementById('btn-prev');
const btnNext = document.getElementById('btn-next');
const pageInfo = document.getElementById('page-info');

let currentPage = 1;
let rowsPerPage = 10;
let totalPages = 1;
let currentSearch = '';

async function fetchActionHistory(isPolling = false) {
    try {
        const filterVal = filterDevice.value;
        let deviceId = 'all';
        if (filterVal === 'fan') deviceId = 'D1';
        if (filterVal === 'lamp') deviceId = 'D2';
        if (filterVal === 'ac') deviceId = 'D3';

        const params = new URLSearchParams({
            page: currentPage,
            limit: rowsPerPage,
            search: currentSearch,
            deviceId: deviceId,
            actionFilter: filterAction.value,
            statusFilter: filterStatus.value,
            sortBy: 'created_at',
            order: 'DESC'
        });

        if (!isPolling) {
            tableBody.innerHTML = '<tr><td colspan="5" style="text-align:center; padding: 20px;"><i class="fa-solid fa-spinner fa-spin"></i> Đang tải dữ liệu...</td></tr>';
        }
        
        const res = await fetch(`${API_URL}/actions/history?${params.toString()}`);
        const result = await res.json();
        
        renderTable(result.data);
        
        totalPages = result.totalPages || 1;
        currentPage = result.page || 1;
        
        pageInfo.innerText = `Trang ${currentPage} / ${totalPages}`;
        
        btnPrev.style.opacity = currentPage <= 1 ? "0.5" : "1";
        btnPrev.style.pointerEvents = currentPage <= 1 ? "none" : "auto";
        
        btnNext.style.opacity = currentPage >= totalPages ? "0.5" : "1";
        btnNext.style.pointerEvents = currentPage >= totalPages ? "none" : "auto";
        
    } catch(e) {
        console.error("Lỗi lấy lịch sử hành động", e);
        tableBody.innerHTML = '<tr><td colspan="5" style="text-align:center; padding: 20px; color: red;">Lỗi tải dữ liệu. Hãy kiểm tra kết nối API.</td></tr>';
    }
}

function getDeviceIcon(deviceId) {
    if (deviceId === 'D1') return '<img src="../../images/Fan.svg" style="width: 30px; vertical-align: middle; margin-right: 15px;">';
    if (deviceId === 'D2') return '<img src="../../images/Light1.svg" style="width: 30px; vertical-align: middle; margin-right: 15px;">';
    if (deviceId === 'D3') return '<img src="../../images/Light2.svg" style="width: 30px; vertical-align: middle; margin-right: 15px;">';
    return '<i class="fa-solid fa-microchip" style="color: #b3b3b3; font-size: 1.5em; vertical-align: middle; margin-right: 15px;"></i>';
}

function processActionText(actionStr) {
    if (!actionStr) return { text: 'UNKNOWN', class: 'act-gray' };
    let text = actionStr.replace('TURN_', '').replace('ALL_', '');
    let className = 'act-gray'; // Figma design uses gray for all actions
    if (text === 'BLINK_ALL') text = 'BLINK';
    return { text, class: className };
}

function processStatus(statusStr) {
    if (statusStr === 'SUCCESS') return { text: 'THÀNH CÔNG', class: 'bg-success' };
    if (statusStr === 'PROCESSING') return { text: 'ĐANG TẢI', class: 'bg-pending' };
    return { text: 'THẤT BẠI', class: 'bg-error' };
}

function renderTable(data) {
    tableBody.innerHTML = '';
    
    if (!data || data.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="5" style="text-align:center; padding:20px">Không tìm thấy dữ liệu phù hợp</td></tr>';
        return;
    }
    
    data.forEach(item => {
        const tr = document.createElement('tr');
        // Chỉ lấy giờ phút giây theo Figma: 05:32:40
        const dateObj = new Date(item.created_at);
        const datePart = [
            String(dateObj.getDate()).padStart(2, '0'),
            String(dateObj.getMonth() + 1).padStart(2, '0'),
            dateObj.getFullYear()
        ].join('/');
        const timePart = [
            String(dateObj.getHours()).padStart(2, '0'),
            String(dateObj.getMinutes()).padStart(2, '0'),
            String(dateObj.getSeconds()).padStart(2, '0')
        ].join(':');
        const timeStr = `${timePart} ${datePart}`;

        const devIcon = getDeviceIcon(item.device_id);
        const actionInfo = processActionText(item.action);
        const statusInfo = processStatus(item.status);
        const devName = item.device_name || 'Tất cả hệ thống';

        tr.innerHTML = `
            <td class="col-id">#${item.id}</td>
            <td class="col-dev">${devIcon} <span>${devName}</span></td>
            <td><span class="action-text ${actionInfo.class}">${actionInfo.text}</span></td>
            <td><span class="status-badge ${statusInfo.class}">${statusInfo.text}</span></td>
            <td class="col-time">${timeStr}</td>
        `;
        tableBody.appendChild(tr);
    });
}

// EVENTS
rowsSelect.addEventListener('change', (e) => {
    rowsPerPage = parseInt(e.target.value);
    currentPage = 1;
    fetchActionHistory();
});

filterDevice.addEventListener('change', () => {
    currentPage = 1;
    fetchActionHistory();
});

filterAction.addEventListener('change', () => {
    currentPage = 1;
    fetchActionHistory();
});

filterStatus.addEventListener('change', () => {
    currentPage = 1;
    fetchActionHistory();
});

searchInput.addEventListener('keyup', (e) => {
    if (e.key === 'Enter') {
        currentSearch = searchInput.value.trim();
        currentPage = 1;
        fetchActionHistory();
    }
});

btnSearch.addEventListener('click', () => {
    currentSearch = searchInput.value.trim();
    currentPage = 1;
    fetchActionHistory();
});

btnPrev.addEventListener('click', () => {
    if (currentPage > 1) {
        currentPage--;
        fetchActionHistory();
    }
});

btnNext.addEventListener('click', () => {
    if (currentPage < totalPages) {
        currentPage++;
        fetchActionHistory();
    }
});

// INIT
document.addEventListener('DOMContentLoaded', () => {
    fetchActionHistory();
    // Refresh history periodically if it contains pending items
    setInterval(() => {
        if (currentPage === 1 && currentSearch === '') {
            fetchActionHistory(true);
        }
    }, 5000);
});