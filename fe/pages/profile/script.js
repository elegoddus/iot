document.addEventListener("DOMContentLoaded", () => {

    //HIỆU ỨNG CIRCUIT BOARD (DÒNG ĐIỆN TỪ CHUỘT) 
    const canvas = document.getElementById('circuit-canvas');
    const ctx = canvas.getContext('2d');

    let width, height;
    let particles = [];

    // Vị trí chuột hiện tại và vị trí cũ (để tính tốc độ di chuyển)
    let mouse = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
    let lastMouse = { x: mouse.x, y: mouse.y };

    function resize() {
        width = canvas.width = window.innerWidth;
        height = canvas.height = window.innerHeight;
    }

    window.addEventListener('resize', resize);
    resize();

    // Cập nhật vị trí chuột
    window.addEventListener('mousemove', (e) => {
        mouse.x = e.clientX;
        mouse.y = e.clientY;
    });

    // Class Hạt điện
    class Particle {
        constructor(x, y) {
            this.x = x;
            this.y = y;
            this.size = Math.random() * 2 + 1;

            // TĂNG TỐC ĐỘ: Để tia điện lan rộng hơn (Speed từ 4 đến 8)
            this.speed = Math.random() * 4 + 4;

            this.direction = Math.floor(Math.random() * 4);

            // TĂNG TUỔI THỌ: Để tia chạy xa hơn (Life từ 100 đến 200)
            this.life = Math.random() * 100 + 100;

            this.color = `hsl(${Math.random() * 40 + 20}, 100%, 50%)`;
            this.history = [];
            this.maxHistory = 20;
        }

        update() {
            this.life -= 1.5; // Giảm từ từ để vệt dài hơn

            this.history.push({ x: this.x, y: this.y });
            if (this.history.length > this.maxHistory) {
                this.history.shift();
            }

            if (Math.random() < 0.05) {
                if (this.direction % 2 === 0) {
                    this.direction = Math.random() < 0.5 ? 1 : 3;
                } else {
                    this.direction = Math.random() < 0.5 ? 0 : 2;
                }
            }

            switch (this.direction) {
                case 0: this.y -= this.speed; break;
                case 1: this.x += this.speed; break;
                case 2: this.y += this.speed; break;
                case 3: this.x -= this.speed; break;
            }
        }

        draw() {
            ctx.beginPath();
            ctx.strokeStyle = `rgba(230, 126, 34, ${this.life / 150})`;
            ctx.lineWidth = 2;
            ctx.shadowBlur = 10;
            ctx.shadowColor = '#e67e22';

            if (this.history.length > 0) {
                ctx.moveTo(this.history[0].x, this.history[0].y);
                for (let i = 1; i < this.history.length; i++) {
                    ctx.lineTo(this.history[i].x, this.history[i].y);
                }
                ctx.lineTo(this.x, this.y);
            }
            ctx.stroke();

            ctx.beginPath();
            ctx.fillStyle = '#fff';
            ctx.arc(this.x, this.y, 2, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    function initParticles() {
        // Tính khoảng cách chuột di chuyển
        const dist = Math.hypot(mouse.x - lastMouse.x, mouse.y - lastMouse.y);

        // Cập nhật vị trí cũ
        lastMouse.x = mouse.x;
        lastMouse.y = mouse.y;

        let spawnRate;

        // LOGIC ĐIỀU CHỈNH SỐ LƯỢNG HẠT
        if (dist > 2) {
            // Nếu chuột di chuyển: Tỷ lệ sinh hạt vừa phải (30% cơ hội mỗi frame)
            // Giúp tia điện ra thưa hơn, không bị dày đặc
            spawnRate = 0.4;
        } else {
            // Nếu chuột đứng yên: Tỷ lệ sinh cực thấp (3% cơ hội)
            // Chỉ thỉnh thoảng lóe lên 1 tia
            spawnRate = 0.03;
        }

        if (Math.random() < spawnRate) {
            particles.push(new Particle(mouse.x, mouse.y));
        }
    }

    function animate() {
        ctx.fillStyle = 'rgba(11, 11, 11, 0.15)'; // Làm mờ đuôi chậm hơn chút
        ctx.fillRect(0, 0, width, height);

        initParticles();

        for (let i = 0; i < particles.length; i++) {
            particles[i].update();
            particles[i].draw();

            if (particles[i].life <= 0) {
                particles.splice(i, 1);
                i--;
            }
        }
        requestAnimationFrame(animate);
    }

    animate();
});