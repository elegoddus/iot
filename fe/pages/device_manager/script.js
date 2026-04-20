const API_URL = 'http://localhost:5000/api';

let statsChart;

function initChart() {
    const ctx = document.getElementById('deviceStatsChart').getContext('2d');
    
    // Create beautiful distinct vertical gradients for each bar
    const createGrad = (color1, color2) => {
        const g = ctx.createLinearGradient(0, 0, 0, 400);
        g.addColorStop(0, color1);
        g.addColorStop(1, color2);
        return g;
    };

    const gFan = createGrad('rgba(11, 220, 181, 0.9)', 'rgba(11, 220, 181, 0.2)');
    const gLamp1 = createGrad('rgba(243, 194, 0, 0.9)', 'rgba(243, 194, 0, 0.2)');
    const gLamp2 = createGrad('rgba(165, 97, 184, 0.9)', 'rgba(165, 97, 184, 0.2)');
    const gAc = createGrad('rgba(52, 152, 219, 0.9)', 'rgba(52, 152, 219, 0.2)');
    const gFridge = createGrad('rgba(189, 195, 199, 0.9)', 'rgba(189, 195, 199, 0.2)');

    statsChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ['Quạt gió (D1)', 'Đèn chùm (D2)', 'Đèn quang (D3)', 'Điều hòa (D4)', 'Tủ lạnh (D5)'],
            datasets: [
                {
                    label: 'Số lần BẬT',
                    data: [0, 0, 0, 0, 0],
                    backgroundColor: [gFan, gLamp1, gLamp2, gAc, gFridge],
                    borderColor: ['#0bdcb5', '#f3c200', '#a561b8', '#3498db', '#bdc3c7'],
                    borderWidth: 2,
                    borderRadius: 8,
                    barPercentage: 0.6
                },
                {
                    label: 'Số lần TẮT',
                    data: [0, 0, 0, 0, 0],
                    backgroundColor: 'rgba(231, 76, 60, 0.7)', /* Đỏ Mờ cho các cột Tắt */
                    borderColor: '#e74c3c',
                    borderWidth: 2,
                    borderRadius: 8,
                    barPercentage: 0.6
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        color: '#2d3436', /* Đổi sang màu xám đậm cho dễ đọc */
                        font: { size: 14, weight: 'bold' },
                        stepSize: 1
                    },
                    grid: {
                        color: 'rgba(0, 0, 0, 0.1)', /* Đổi lưới sang đen mờ */
                        borderDash: [5, 5]
                    }
                },
                x: {
                    ticks: {
                        color: '#2d3436', /* Đổi sang xám đậm */
                        font: { size: 13, weight: 'bold' }
                    },
                    grid: {
                        display: false
                    }
                }
            },
            plugins: {
                legend: {
                    labels: { color: '#2d3436', font: { size: 14 } } /* Chữ đậm màu than chì */
                }
            }
        }
    });
}

// Lấy thông tin số liệu thống kê bật/tắt (Biểu đồ)
async function fetchDeviceStats() {
    try {
        const dateVal = document.getElementById('statsDate').value;
        const statusVal = document.getElementById('statsStatus').value;
        
        let url = `${API_URL}/actions/stats?`;
        if (dateVal) url += `date=${dateVal}&`;
        if (statusVal) url += `status=${statusVal}`;
        
        const res = await fetch(url);
        const stats = await res.json();
        
        if (statsChart) {
            // Cột BẬT
            statsChart.data.datasets[0].data = [
                stats.D1?.ON || 0,
                stats.D2?.ON || 0,
                stats.D3?.ON || 0,
                stats.D4?.ON || 0,
                stats.D5?.ON || 0
            ];
            // Cột TẮT
            statsChart.data.datasets[1].data = [
                stats.D1?.OFF || 0,
                stats.D2?.OFF || 0,
                stats.D3?.OFF || 0,
                stats.D4?.OFF || 0,
                stats.D5?.OFF || 0
            ];
            statsChart.update();
        }
    } catch(e) {
        console.error("Lỗi lấy dữ liệu thống kê", e);
    }
}

// Lấy trạng thái ON/OFF hiện tại của các thiết bị
async function fetchDeviceStatus() {
    try {
        const res = await fetch(`${API_URL}/devices`);
        const data = await res.json();
        
        data.forEach(device => {
            let uiId = '';
            if (device.id === 'D1') uiId = 'fan';
            if (device.id === 'D2') uiId = 'lamp1';
            if (device.id === 'D3') uiId = 'lamp2';
            if (device.id === 'D4') uiId = 'ac';
            if (device.id === 'D5') uiId = 'fridge';
            
            if (uiId) {
                const wrap = document.getElementById(`wrap-${uiId}`);
                if (!wrap) return;
                
                // Tránh ghi đè nếu đang trong hiệu ứng loading (Timeout SCADA 10s)
                if (wrap.classList.contains('loading')) {
                    if (device.current_status === wrap.dataset.expected) {
                        wrap.classList.remove('loading');
                        delete wrap.dataset.expected;
                    } else {
                        return; // Đang đợi MQTT callback, bỏ qua DOM update
                    }
                }

                const statusText = wrap.querySelector('.device-status');
                const actionIcon = wrap.querySelector('.btn-action i');
                
                wrap.classList.remove('active', 'loading');
                actionIcon.className = "status-icon"; // Reset class
                
                if (device.current_status === 'ON') {
                    wrap.classList.add('active');
                    statusText.textContent = "ĐANG BẬT";
                    actionIcon.classList.add('fa-solid', 'fa-power-off');
                } else {
                    statusText.textContent = "ĐANG TẮT";
                    actionIcon.classList.add('fa-solid', 'fa-power-off');
                }
            }
        });
    } catch(e) {
        console.error("Lỗi lấy dữ liệu thiết bị", e);
    }
}

// Hành động Bật/Tắt thiết bị (Gửi lệnh POST)
async function toggleDevice(deviceId, uiId) {
    const wrap = document.getElementById(`wrap-${uiId}`);
    if (wrap.classList.contains('loading')) return; // Chặn double click
    
    // Lưu lại trạng thái cũ
    const isCurrentlyOn = wrap.classList.contains('active');
    const action = isCurrentlyOn ? 'OFF' : 'ON';
    
    // Gán dữ liệu cờ kì vọng
    wrap.dataset.expected = action;

    // Chuyển sang UI Loading (Phản hồi thị giác lập tức)
    wrap.classList.remove('active');
    wrap.classList.add('loading');
    
    const actionIcon = wrap.querySelector('.btn-action i');
    actionIcon.className = "fa-solid fa-spinner status-icon"; // Đổi Icon thành Spinner xoay

    const statusText = wrap.querySelector('.device-status');
    statusText.textContent = "Đang truyền lệnh...";

    try {
        await fetch(`${API_URL}/actions/control`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ deviceId, action })
        });
        
        // Buộc lấy dữ liệu trạng thái và thống kê ngay lập tức (Sync ngay khi bấm)
        setTimeout(() => {
            fetchDeviceStatus();
            fetchDeviceStats();
        }, 500);
        
        // Timeout 10s tự gỡ Loading nếu rớt kết nối
        setTimeout(() => {
            if (wrap.classList.contains('loading') && wrap.dataset.expected === action) {
                wrap.classList.remove('loading');
                delete wrap.dataset.expected;
                
                // Roll-back UI
                if (isCurrentlyOn) wrap.classList.add('active');
                actionIcon.className = "fa-solid fa-power-off status-icon";
                statusText.textContent = isCurrentlyOn ? "ĐANG BẬT" : "ĐANG TẮT";
                console.warn(`Timeout thao tác thiết bị ${deviceId}`);
            }
        }, 10000);
    } catch(e) {
        console.error("Lỗi lệnh điều khiển", e);
        wrap.classList.remove('loading');
        delete wrap.dataset.expected;
        
        // Roll-back UI
        if (isCurrentlyOn) wrap.classList.add('active');
        actionIcon.className = "fa-solid fa-power-off status-icon";
        statusText.textContent = isCurrentlyOn ? "ĐANG BẬT" : "ĐANG TẮT";
    }
}

document.addEventListener('DOMContentLoaded', () => {
    initChart();
    
    const dateInput = document.getElementById('statsDate');
    const statusInput = document.getElementById('statsStatus');
    
    const today = new Date().toISOString().split('T')[0];
    dateInput.value = today;
    
    dateInput.addEventListener('change', fetchDeviceStats);
    statusInput.addEventListener('change', fetchDeviceStats);

    // Initial fetches
    fetchDeviceStatus();
    fetchDeviceStats();

    // Vòng lặp HTTP Short-Polling 2s/lần
    setInterval(() => {
        fetchDeviceStatus();
        fetchDeviceStats();
    }, 2000);
});
