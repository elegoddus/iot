const tableBody = document.getElementById('sensor-table-body');
const rowsSelect = document.getElementById('rows-per-page');
const filterSelect = document.getElementById('filter-type');
const searchInput = document.getElementById('search-input');
const btnSearch = document.getElementById('btn-search');
const btnPrev = document.getElementById('btn-prev');
const btnNext = document.getElementById('btn-next');
const pageInfo = document.getElementById('page-info');

// Dữ liệu gốc
let sensorData = [];
let currentPage = 1;
let rowsPerPage = 10;
let currentId = 1000;

// 1. TẠO DỮ LIỆU MẪU (Batch 3 dòng)
function generateDataBatch() {
    const now = new Date().toLocaleTimeString('vi-VN');
    
    // Nếu đang có từ khóa tìm kiếm thì tạm dừng sinh dữ liệu để không bị nhảy bảng (UX)
    if (searchInput.value.trim() !== "") return;

    const batch = [
        { id: currentId++, type: 'temp', name: 'Nhiệt độ', val: Math.floor(Math.random()*(35-25)+25), unit: '°C', icon: '<i class="fa-solid fa-temperature-three-quarters"></i>', time: now },
        { id: currentId++, type: 'humid', name: 'Độ ẩm', val: Math.floor(Math.random()*(80-60)+60), unit: '%', icon: '<i class="fa-solid fa-droplet"></i>', time: now },
        { id: currentId++, type: 'light', name: 'Ánh sáng', val: Math.floor(Math.random()*(900-200)+200), unit: 'Lux', icon: '<i class="fa-solid fa-sun"></i>', time: now }
    ];

    sensorData.unshift(...batch);
    if(sensorData.length > 1000) sensorData = sensorData.slice(0, 1000); // Giới hạn bộ nhớ
    renderTable();
}

// 2. RENDER BẢNG (CORE LOGIC)
function renderTable() {
    tableBody.innerHTML = '';

    // BƯỚC 1: LỌC DỮ LIỆU (Filter + Search)
    const filterType = filterSelect.value;
    const searchText = searchInput.value.toLowerCase().trim();

    let filteredData = sensorData.filter(item => {
        // Điều kiện 1: Loại cảm biến
        const matchType = (filterType === 'all') || (item.type === filterType);
        
        // Điều kiện 2: Từ khóa tìm kiếm (ID hoặc Thời gian)
        const matchSearch = item.id.toString().includes(searchText) || 
                            item.time.toLowerCase().includes(searchText);

        return matchType && matchSearch;
    });

    // BƯỚC 2: PHÂN TRANG
    const totalPages = Math.ceil(filteredData.length / rowsPerPage) || 1;
    
    // Đảm bảo trang hiện tại không vượt quá tổng số trang
    if (currentPage > totalPages) currentPage = totalPages;
    if (currentPage < 1) currentPage = 1;

    const start = (currentPage - 1) * rowsPerPage;
    const end = start + rowsPerPage;
    const paginatedData = filteredData.slice(start, end);

    // BƯỚC 3: VẼ HTML
    if (paginatedData.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="4" style="text-align:center; padding: 20px;">Không tìm thấy dữ liệu phù hợp</td></tr>';
    } else {
        paginatedData.forEach(item => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>#${item.id}</td>
                <td>${item.icon} ${item.name}</td>
                <td class="val-highlight">${item.val} ${item.unit}</td>
                <td>${item.time}</td>
            `;
            tableBody.appendChild(tr);
        });
    }

    // Cập nhật thông tin phân trang
    pageInfo.innerText = `Trang ${currentPage} / ${totalPages}`;
    
    // Disable nút nếu cần
    btnPrev.style.opacity = currentPage === 1 ? "0.5" : "1";
    btnPrev.style.pointerEvents = currentPage === 1 ? "none" : "auto";
    
    btnNext.style.opacity = currentPage === totalPages ? "0.5" : "1";
    btnNext.style.pointerEvents = currentPage === totalPages ? "none" : "auto";
}

// 3. SỰ KIỆN (EVENTS)
rowsSelect.addEventListener('change', (e) => {
    rowsPerPage = parseInt(e.target.value);
    currentPage = 1;
    renderTable();
});

filterSelect.addEventListener('change', () => {
    currentPage = 1;
    renderTable();
});

// Tìm kiếm khi gõ phím
searchInput.addEventListener('keyup', () => {
    currentPage = 1;
    renderTable();
});

// Nút phân trang
btnPrev.addEventListener('click', () => {
    if (currentPage > 1) {
        currentPage--;
        renderTable();
    }
});

btnNext.addEventListener('click', () => {
    // Tính lại totalPages để check
    // (Trong thực tế nên lưu totalPages ra biến toàn cục để tối ưu)
    currentPage++;
    renderTable();
});


// 4. INIT
// Tạo trước dữ liệu
for(let i=0; i<5; i++) generateDataBatch();

// Realtime loop
setInterval(() => {
    generateDataBatch();
}, 2000);