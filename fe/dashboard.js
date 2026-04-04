const PALETTE = {
    temp: [
        { t: 36, c: "linear-gradient(90deg, #E15B5B, #F8CDCD)", txt: "#fff" },
        { t: 32, c: "linear-gradient(90deg, #F9B250, #FCE8CA)", txt: "#2d3436" },
        { t: 28, c: "linear-gradient(90deg, #FBE09C, #FEF4DC)", txt: "#2d3436" },
        { t: 24, c: "linear-gradient(90deg, #C1DE6A, #EAF3D1)", txt: "#2d3436" },
        { t: 20, c: "linear-gradient(90deg, #0BB884, #CFEFE5)", txt: "#2d3436" },
        { t: 15, c: "linear-gradient(90deg, #11CBD2, #D2F2F4)", txt: "#fff" },
        { t: 0,  c: "linear-gradient(90deg, #81EBEB, #E1F8F8)", txt: "#2d3436" }
    ],
    humid: [
        { t: 90, c: "linear-gradient(90deg, #3A4A5A, #A6B0B9)", txt: "#fff" },
        { t: 85, c: "linear-gradient(90deg, #2E76B1, #B2CADD)", txt: "#fff" },
        { t: 70, c: "linear-gradient(90deg, #1483DF, #B4DAF3)", txt: "#fff" },
        { t: 55, c: "linear-gradient(90deg, #0BCBCF, #CEF0F1)", txt: "#2d3436" },
        { t: 40, c: "linear-gradient(90deg, #95C9D9, #D2E7ED)", txt: "#2d3436" },
        { t: 0,  c: "linear-gradient(90deg, #DFEDE9, #F3F8F6)", txt: "#2d3436" }
    ],
    light: [
        { t: 900, c: "linear-gradient(90deg, #FBF8CC, #FEFDF2)", txt: "#2d3436" },
        { t: 700, c: "linear-gradient(90deg, #EADD94, #F7F3CD)", txt: "#2d3436" },
        { t: 500, c: "linear-gradient(90deg, #E1E6E8, #F3F6F7)", txt: "#2d3436" },
        { t: 300, c: "linear-gradient(90deg, #B5BEC4, #E2E6E8)", txt: "#2d3436" },
        { t: 100, c: "linear-gradient(90deg, #6B7579, #C8CDCF)", txt: "#fff" },
        { t: 0,   c: "linear-gradient(90deg, #323A3B, #B4B9BA)", txt: "#fff" }
    ]
};

let mainChart;
const API_URL = 'http://localhost:5000/api';
let MAX_DATA_POINTS = 20;

function getColor(type, value) {
    const palette = PALETTE[type];
    for (let item of palette) {
        if (value >= item.t) return item;
    }
    return palette[palette.length - 1];
}

function initChart() {
    const ctx = document.getElementById('mainChart').getContext('2d');
    mainChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: [], 
            datasets: [
                {
                    label: 'Nhiệt độ (°C)', data: [],
                    borderColor: '#EE8122', backgroundColor: 'transparent',
                    borderWidth: 2, fill: false, tension: 0.3,
                    pointStyle: 'rectRounded', pointRadius: 4,
                    pointBackgroundColor: '#fff', pointBorderColor: '#EE8122',
                    yAxisID: 'y'
                },
                {
                    label: 'Độ ẩm (%)', data: [],
                    borderColor: '#1cd8e6', backgroundColor: 'transparent',
                    borderWidth: 2, fill: false, tension: 0.3,
                    pointStyle: 'rect', pointRadius: 4,
                    pointBackgroundColor: '#fff', pointBorderColor: '#0984e3',
                    yAxisID: 'y'
                },
                {
                    label: 'Ánh sáng (Lux)', data: [],
                    borderColor: '#EADD94', backgroundColor: 'transparent',
                    borderWidth: 2, borderDash: [5, 5], fill: false, tension: 0.3,
                    pointStyle: 'rect', pointRadius: 4,
                    pointBackgroundColor: '#fff', pointBorderColor: '#EADD94',
                    yAxisID: 'y1'
                }
            ]
        },
        options: {
            responsive: true, maintainAspectRatio: false,
            interaction: { mode: 'index', intersect: false },
            plugins: {
                legend: { position: 'top', labels: { usePointStyle: true, font: { family: "'Segoe UI', sans-serif" } } },
                tooltip: { usePointStyle: true }
            },
            scales: {
                x: { grid: { display: true, borderDash: [3, 3] }, ticks: { maxRotation: 45, minRotation: 45 } },
                y: { type: 'linear', position: 'left', min: 0, max: 100 },
                y1: { type: 'linear', position: 'right', min: 0, max: 1000, grid: { drawOnChartArea: false } }
            }
        }
    });
}

function saveChartData() {
    const chartContext = {
        labels: mainChart.data.labels,
        temp: mainChart.data.datasets[0].data,
        humid: mainChart.data.datasets[1].data,
        light: mainChart.data.datasets[2].data
    };
    localStorage.setItem('iot_chart_data', JSON.stringify(chartContext));
}

function loadChartData() {
    const saved = localStorage.getItem('iot_chart_data');
    if (saved) {
        try {
            const chartContext = JSON.parse(saved);
            mainChart.data.labels = chartContext.labels || [];
            mainChart.data.datasets[0].data = chartContext.temp || [];
            mainChart.data.datasets[1].data = chartContext.humid || [];
            mainChart.data.datasets[2].data = chartContext.light || [];
            mainChart.update();
        } catch(e) {
            console.error("Lỗi parse dữ liệu biểu đồ từ localStorage", e);
        }
    }
}

function updateDashboard(temp, humid, light) {
    updateCard('temp', temp, 'temp');
    updateCard('humid', humid, 'humid');
    updateCard('light', light, 'light');

    const now = new Date();
    const timeLabel = now.getHours() + ':' + String(now.getMinutes()).padStart(2, '0') + ':' + String(now.getSeconds()).padStart(2, '0');

    mainChart.data.labels.push(timeLabel);
    mainChart.data.datasets[0].data.push(temp);
    mainChart.data.datasets[1].data.push(humid);
    mainChart.data.datasets[2].data.push(light);

    if (mainChart.data.labels.length > MAX_DATA_POINTS) {
        mainChart.data.labels.shift();
        mainChart.data.datasets.forEach(dst => dst.data.shift());
    }
    mainChart.update();
    saveChartData(); // Lưu lại mỗi khi có điểm mới
}

function updateCard(type, value, idSuffix) {
    const colorObj = getColor(type, value);
    const card = document.getElementById(`card-${idSuffix}`);
    const valText = document.getElementById(`val-${idSuffix}`);

    if (card && valText) {
        valText.innerText = value;
        card.style.background = colorObj.c;
        card.style.color = colorObj.txt;
    }
}

let lastUpdateTime = "";

// LẤY DỮ LIỆU TỪ BACKEND
async function fetchSensorData() {
    try {
        const res = await fetch(`${API_URL}/sensors/current`);
        const data = await res.json();
        
        let temp = 0, humid = 0, light = 0;
        let latestTime = "";
        data.forEach(item => {
            if (item.id === 'TEMP_01') temp = item.value;
            if (item.id === 'HUMID_01') humid = item.value;
            if (item.id === 'LIGHT_01') light = item.value;
            if (item.recorded_at > latestTime) latestTime = item.recorded_at;
        });

        // Chỉ thêm dữ liệu vào biểu đồ nếu thời gian bản ghi là mới khác với lúc nãy
        if (latestTime !== lastUpdateTime) {
            updateDashboard(temp, humid, light);
            lastUpdateTime = latestTime;
        } else {
            // Chỉ cập nhật các ô giá trị HTML (nếu lỡ refresh) nhưng không chạy cuộn biểu đồ
            updateCard('temp', temp, 'temp');
            updateCard('humid', humid, 'humid');
            updateCard('light', light, 'light');
        }
    } catch(e) {
        console.error("Lỗi lấy dữ liệu sensor", e);
    }
}

async function fetchDeviceStatus() {
    try {
        const res = await fetch(`${API_URL}/devices`);
        const data = await res.json();
        // data: [{id: 'D1', current_status: 'ON'}, ...]
        data.forEach(device => {
            let uiId = '';
            if (device.id === 'D1') uiId = 'fan';
            if (device.id === 'D2') uiId = 'lamp1';
            if (device.id === 'D3') uiId = 'lamp2';
            
            if (uiId) {
                const wrap = document.getElementById(`wrap-${uiId}`);
                if (!wrap) return;
                
                if (wrap.classList.contains('loading')) {
                    // Nếu đang xử lý, chỉ cập nhật nếu trạng thái server khớp kỳ vọng
                    if (device.current_status === wrap.dataset.expected) {
                        wrap.classList.remove('loading');
                        delete wrap.dataset.expected;
                    } else {
                        return; // Chưa khớp, tiếp tục hiển thị xoay xoay
                    }
                }

                const statusText = wrap.querySelector('.device-status');
                
                wrap.classList.remove('active', 'loading');
                if (device.current_status === 'ON') {
                    wrap.classList.add('active'); // Thêm active chung
                    wrap.classList.add(uiId);     // Thêm định danh để tô màu
                    statusText.innerText = 'Đang hoạt động';
                } else {
                    wrap.classList.remove(uiId); // Bỏ màu nếu tắt
                    statusText.innerText = 'Đang tắt';
                }
            }
        });
    } catch(e) {
        console.error("Lỗi lấy dữ liệu thiết bị", e);
    }
}

async function toggleDevice(deviceId, uiId) {
    const wrap = document.getElementById(`wrap-${uiId}`);
    if (wrap.classList.contains('loading')) return; // Bỏ qua nếu đang xử lý
    
    // Lưu lại trạng thái gốc phòng khi lỗi
    const isCurrentlyOn = wrap.classList.contains('active');
    const action = isCurrentlyOn ? 'OFF' : 'ON';
    
    // Đánh dấu trạng thái kỳ vọng
    wrap.dataset.expected = action;

    const statusText = wrap.querySelector('.device-status');
    
    // Ẩn màu lập tức -> chuyển sang xám
    wrap.classList.remove('active');
    wrap.classList.add('loading');
    statusText.innerText = 'Đang xử lý';

    try {
        await fetch(`${API_URL}/actions/control`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ deviceId, action })
        });
        
        // Timeout 10 giây SCADA (Rollback trạng thái an toàn)
        setTimeout(() => {
            if (wrap.classList.contains('loading') && wrap.dataset.expected === action) {
                wrap.classList.remove('loading');
                delete wrap.dataset.expected;
                
                if (isCurrentlyOn) {
                    wrap.classList.add('active'); // Hoàn tác trạng thái Bật
                }
                statusText.innerText = 'Lỗi mất kết nối';
            }
        }, 10000);
    } catch(e) {
        console.error("Lỗi điều khiển thiết bị", e);
        wrap.classList.remove('loading');
        delete wrap.dataset.expected;
        if (isCurrentlyOn) wrap.classList.add('active'); // Hoàn tác
        statusText.innerText = 'Lỗi kết nối';
    }
}

document.addEventListener('DOMContentLoaded', () => {
    initChart();
    loadChartData(); // Khôi phục biểu đồ từ localStorage
    
    // Fetch dữ liệu mỗi 2 giây
    setInterval(() => {
        fetchSensorData();
        fetchDeviceStatus();
    }, 2000);

    // Initial fetch
    fetchSensorData();
    fetchDeviceStatus();
});