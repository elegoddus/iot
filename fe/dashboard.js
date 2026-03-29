// --- 1. BỘ MÀU CHÍNH THỨC (MECHA STYLE) ---
const PALETTE = {
    temp: [
        { t: 40, c: "#d63031", txt: "#fff" },
        { t: 36, c: "#e17055", txt: "#fff" },
        { t: 32, c: "#fdcb6e", txt: "#2d3436" },
        { t: 28, c: "#ffeaa7", txt: "#2d3436" },
        { t: 24, c: "#badc58", txt: "#2d3436" },
        { t: 20, c: "#00b894", txt: "#fff" },
        { t: 15, c: "#00cec9", txt: "#fff" },
        { t: 0,  c: "#81ecec", txt: "#2d3436" }
    ],
    humid: [
        { t: 95, c: "#2c3e50", txt: "#fff" },
        { t: 85, c: "#2980b9", txt: "#fff" },
        { t: 70, c: "#0984e3", txt: "#fff" },
        { t: 55, c: "#00cec9", txt: "#2d3436" },
        { t: 40, c: "#b4d1d9", txt: "#2d3436" },
        { t: 0,  c: "#dfe6e9", txt: "#2d3436" }
    ],
    light: [
        { t: 900, c: "#ffffcc", txt: "#2d3436" },
        { t: 700, c: "#eddb91", txt: "#2d3436" },
        { t: 500, c: "#dfe6e9", txt: "#2d3436" },
        { t: 300, c: "#b2bec3", txt: "#2d3436" },
        { t: 100, c: "#636e72", txt: "#fff" },
        { t: 0,   c: "#2d3436", txt: "#fff" }
    ]
};

// --- 2. BIẾN TOÀN CỤC ---
let mainChart; // Biến lưu biểu đồ
const MAX_DATA_POINTS = 20; // Chỉ hiện 20 điểm dữ liệu mới nhất (để biểu đồ chạy)

// Hàm lấy màu cho Card
function getColor(type, value) {
    const palette = PALETTE[type];
    for (let item of palette) {
        if (value >= item.t) return item;
    }
    return palette[palette.length - 1];
}

// --- 3. KHỞI TẠO BIỂU ĐỒ (CHART.JS) ---
function initChart() {
    const ctx = document.getElementById('mainChart').getContext('2d');
    
    // Không cần tạo Gradient nữa vì bạn muốn bỏ mảng màu

    mainChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: [], 
            datasets: [
                {
                    label: 'Nhiệt độ (°C)',
                    data: [],
                    borderColor: '#df7620', // Đỏ (Mecha)
                    backgroundColor: 'transparent', // Trong suốt
                    borderWidth: 2.5,       // Độ dày đường
                    
                    // --- TÙY BIẾN ĐỂ KHÁC BIỆT ---
                    fill: false,            // QUAN TRỌNG: Tắt màu nền
                    tension: 0.3,           // Độ cong (0 là thẳng tắp, 0.4 là cong mềm)
                    pointStyle: 'circle',   // Hình dạng điểm (circle, rect, triangle...)
                    pointRadius: 4,         // Độ to của điểm
                    pointBackgroundColor: '#fff', // Điểm rỗng ruột (nền trắng)
                    pointBorderColor: '#d63031',  // Viền điểm màu đỏ
                    pointBorderWidth: 2,    // Độ dày viền điểm
                    yAxisID: 'y'
                },
                {
                    label: 'Độ ẩm (%)',
                    data: [],
                    borderColor: '#1cd8e6', // Xanh (Mecha)
                    backgroundColor: 'transparent',
                    borderWidth: 2.5,
                    
                    // --- TÙY BIẾN ---
                    fill: false,
                    tension: 0.3,
                    pointStyle: 'rectRounded', // Điểm hình vuông bo góc (Khác bọt chưa!)
                    pointRadius: 5,
                    pointBackgroundColor: '#fff',
                    pointBorderColor: '#0984e3',
                    pointBorderWidth: 2,
                    yAxisID: 'y'
                },
                {
                    label: 'Ánh sáng (Lux)',
                    data: [],
                    borderColor: '#f1c40f', // Vàng (Mecha)
                    backgroundColor: 'transparent',
                    borderWidth: 2,
                    borderDash: [5, 5],     // Nét đứt
                    
                    // --- TÙY BIẾN ---
                    fill: false,
                    tension: 0.3,
                    pointStyle: 'triangle',
                    pointRadius: 5,
                    pointBackgroundColor: '#fff',
                    pointBorderColor: '#f1c40f',
                    pointBorderWidth: 2,
                    yAxisID: 'y1'
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: {
                mode: 'index',
                intersect: false,
            },
            plugins: {
                legend: {
                    position: 'top',
                    labels: {
                        usePointStyle: true, // Icon chú thích sẽ giống hình dạng điểm (Tròn/Vuông/Tam giác)
                        font: { family: "'Segoe UI', sans-serif", size: 12 }
                    }
                },
                tooltip: {
                    backgroundColor: 'rgba(45, 52, 54, 0.9)', // Tooltip màu đen xám
                    titleColor: '#fff',
                    bodyColor: '#fff',
                    borderColor: 'rgba(255,255,255,0.2)',
                    borderWidth: 1,
                    padding: 10,
                    displayColors: true,
                    usePointStyle: true
                }
            },
            scales: {
                x: {
                    // --- TRỤC THỜI GIAN (X) ---
                    grid: { 
                        display: true,          // Hiện lưới
                        color: '#f1f2f6',       // Màu lưới
                        borderDash: [3, 3],     // Nét đứt
                        drawBorder: false
                    },
                    ticks: { 
                        color: '#636e72',
                        font: { size: 10 },     // Chữ nhỏ lại xíu cho đỡ chật
                        
                        autoSkip: false,        
                        maxRotation: 45,        // Xoay dọc chữ 45 độ
                        minRotation: 45         // Cố định xoay dọc
                    }
                },
                y: { // TRỤC TRÁI (Nhiệt/Ẩm)
                    type: 'linear',
                    display: true,
                    position: 'left',
                    min: 0, max: 100,
                    title: { display: true, text: 'Nhiệt / Ẩm', font: { size: 11, weight: 'bold' } },
                    grid: { color: '#f1f2f6', borderDash: [2, 2] }
                },
                y1: { // TRỤC PHẢI (Ánh sáng)
                    type: 'linear',
                    display: true,
                    position: 'right',
                    min: 0, max: 1000,
                    title: { display: true, text: 'Lux', font: { size: 11, weight: 'bold' } },
                    grid: { drawOnChartArea: false } // Tắt lưới ngang của trục này
                }
            }
        }
    });
}

// --- 4. HÀM UPDATE DỮ LIỆU (REAL-TIME) ---
function updateDashboard(temp, humid, light) {
    // 1. Update các thẻ Card (Như cũ)
    updateCard('temp', temp, 'temp');
    updateCard('humid', humid, 'humid');
    updateCard('light', light, 'light');

    // 2. Update Biểu đồ
    const now = new Date();
    const timeLabel = now.getHours() + ':' + String(now.getMinutes()).padStart(2, '0') + ':' + String(now.getSeconds()).padStart(2, '0');

    // Thêm dữ liệu mới vào mảng
    mainChart.data.labels.push(timeLabel);
    mainChart.data.datasets[0].data.push(temp);
    mainChart.data.datasets[1].data.push(humid);
    mainChart.data.datasets[2].data.push(light);

    // Xóa dữ liệu cũ nếu quá dài (Hiệu ứng trôi)
    if (mainChart.data.labels.length > MAX_DATA_POINTS) {
        mainChart.data.labels.shift(); // Xóa phần tử đầu
        mainChart.data.datasets.forEach((dataset) => {
            dataset.data.shift();
        });
    }

    // Vẽ lại biểu đồ
    mainChart.update();
}

// Hàm update Card đơn lẻ
function updateCard(type, value, idSuffix) {
    const colorObj = getColor(type, value);
    const card = document.getElementById(`card-${idSuffix}`);
    const valText = document.getElementById(`val-${idSuffix}`);

    if (card && valText) {
        valText.innerText = value;
        card.style.backgroundColor = colorObj.c;
        card.style.color = colorObj.txt;
    }
}

// --- 5. GIẢ LẬP DỮ LIỆU (SIMULATION) ---
function startSimulation() {
    // Giả lập 2 giây một lần gửi cả 3 dữ liệu (giống thực tế sensor gửi 1 gói tin)
    setInterval(() => {
        // Random dữ liệu biến thiên nhẹ (để biểu đồ đẹp)
        const temp = Math.floor(Math.random() * (35 - 25) + 25); // 25-35 độ
        const humid = Math.floor(Math.random() * (80 - 60) + 60); // 60-80%
        const light = Math.floor(Math.random() * (800 - 200) + 200); // 200-800 Lux

        updateDashboard(temp, humid, light);
    }, 2000); 
}

// Kích hoạt khi trang tải xong
document.addEventListener('DOMContentLoaded', () => {
    initChart(); // Vẽ khung biểu đồ trước
    startSimulation(); // Bắt đầu đẩy dữ liệu
});

// --- 6. LOGIC ĐIỀU KHIỂN THIẾT BỊ (ON/OFF/LOADING) ---

// Lưu trạng thái hiện tại (Mặc định là false = Tắt)
const deviceState = {
    fan: false,
    lamp: false,
    ac: false
};

function toggleDevice(id) {
    const btn = document.getElementById(`btn-${id}`);
    const statusText = btn.querySelector('.device-status');
    
    // 1. CHUYỂN SANG TRẠNG THÁI LOADING
    // Thêm class 'loading' để kích hoạt CSS xoay vòng và khóa nút
    btn.classList.add('loading');
    statusText.innerText = "Đang xử lý...";
    
    // 2. GIẢ LẬP ĐỘ TRỄ MẠNG (1.5 giây)
    setTimeout(() => {
        // Hết thời gian chờ, bỏ class loading
        btn.classList.remove('loading');
        
        // Đảo ngược trạng thái (Tắt -> Mở hoặc Mở -> Tắt)
        deviceState[id] = !deviceState[id];
        
        // 3. CẬP NHẬT GIAO DIỆN THEO TRẠNG THÁI MỚI
        if (deviceState[id]) {
            // TRẠNG THÁI MỞ (ON)
            btn.classList.add('active'); // Thêm class active để đổi màu
            statusText.innerText = "Đang hoạt động";
            
            // Nếu là Đèn huỳnh quang thì đổi text cho ngầu
            if(id === 'ac') statusText.innerText = "Sáng 100%";
        } else {
            // TRẠNG THÁI TẮT (OFF)
            btn.classList.remove('active'); // Gỡ class active
            statusText.innerText = "Đang tắt";
        }
        
    }, 1500); // 1500ms = 1.5 giây
}