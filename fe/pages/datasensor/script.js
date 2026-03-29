const API_URL = 'http://localhost:5000/api';

const tableBody = document.getElementById('sensor-table-body');
const rowsSelect = document.getElementById('rows-per-page');
const filterSelect = document.getElementById('filter-type');
const searchInput = document.getElementById('search-input');
const btnSearch = document.getElementById('btn-search');
const btnPrev = document.getElementById('btn-prev');
const btnNext = document.getElementById('btn-next');
const pageInfo = document.getElementById('page-info');

let currentPage = 1;
let rowsPerPage = 10;
let totalPages = 1;
let currentSearch = '';

async function fetchSensorHistory() {
    try {
        const filterVal = filterSelect.value;
        let sensorId = 'all';
        if (filterVal === 'temp') sensorId = 'TEMP_01';
        if (filterVal === 'humid') sensorId = 'HUMID_01';
        if (filterVal === 'light') sensorId = 'LIGHT_01';

        const params = new URLSearchParams({
            page: currentPage,
            limit: rowsPerPage,
            search: currentSearch,
            sensorId: sensorId,
            sortBy: 'recorded_at',
            order: 'DESC'
        });

        tableBody.innerHTML = '<tr><td colspan="4" style="text-align:center; padding: 20px;"><i class="fa-solid fa-spinner fa-spin"></i> Đang tải dữ liệu...</td></tr>';
        
        const res = await fetch(`${API_URL}/sensors/history?${params.toString()}`);
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
        console.error("Lỗi lấy lịch sử", e);
        tableBody.innerHTML = '<tr><td colspan="4" style="text-align:center; padding: 20px; color: red;">Lỗi tải dữ liệu. Hãy kiểm tra kết nối API.</td></tr>';
    }
}

function getSensorIcon(sensorId) {
    if (sensorId === 'TEMP_01') return '<i class="fa-solid fa-temperature-half" style="color: #e74c3c; font-size: 1.5em; vertical-align: middle; margin-right: 15px;"></i>';
    if (sensorId === 'HUMID_01') return '<i class="fa-solid fa-droplet" style="color: #3498db; font-size: 1.5em; vertical-align: middle; margin-right: 15px;"></i>';
    if (sensorId === 'LIGHT_01') return '<i class="fa-regular fa-sun" style="color: #f1c40f; font-size: 1.5em; vertical-align: middle; margin-right: 15px;"></i>';
    return '';
}

function renderTable(data) {
    tableBody.innerHTML = '';
    
    if (!data || data.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="4" style="text-align:center; padding: 20px;">Không tìm thấy dữ liệu phù hợp</td></tr>';
        return;
    }
    
    data.forEach(item => {
        const tr = document.createElement('tr');
        const dateObj = new Date(item.recorded_at);
        const timeStr = [
            String(dateObj.getHours()).padStart(2, '0'),
            String(dateObj.getMinutes()).padStart(2, '0'),
            String(dateObj.getSeconds()).padStart(2, '0')
        ].join(':');

        const icon = getSensorIcon(item.sensor_id);
        
        tr.innerHTML = `
            <td class="col-id">#${item.id}</td>
            <td class="col-sensor">${icon} <span>${item.sensor_name}</span></td>
            <td class="val-text">${item.value} ${item.unit}</td>
            <td class="col-time">${timeStr}</td>
        `;
        tableBody.appendChild(tr);
    });
}

// EVENTS
rowsSelect.addEventListener('change', (e) => {
    rowsPerPage = parseInt(e.target.value);
    currentPage = 1;
    fetchSensorHistory();
});

filterSelect.addEventListener('change', () => {
    currentPage = 1;
    fetchSensorHistory();
});

btnSearch.addEventListener('click', () => {
    currentSearch = searchInput.value.trim();
    currentPage = 1;
    fetchSensorHistory();
});

searchInput.addEventListener('keyup', (e) => {
    if (e.key === 'Enter') {
        currentSearch = searchInput.value.trim();
        currentPage = 1;
        fetchSensorHistory();
    }
});

btnPrev.addEventListener('click', () => {
    if (currentPage > 1) {
        currentPage--;
        fetchSensorHistory();
    }
});

btnNext.addEventListener('click', () => {
    if (currentPage < totalPages) {
        currentPage++;
        fetchSensorHistory();
    }
});

// INIT
document.addEventListener('DOMContentLoaded', () => {
    fetchSensorHistory();
});