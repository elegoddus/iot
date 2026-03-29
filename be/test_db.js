const mysql = require('mysql2/promise');

async function check() {
    const pool = mysql.createPool({ host: 'localhost', user: 'root', password: '', database: 'iot_home' });
    const [sensors] = await pool.query('SELECT * FROM sensors');
    console.log('Sensors:', sensors);
    const [devices] = await pool.query('SELECT * FROM devices');
    console.log('Devices:', devices);
    process.exit(0);
}
check();
