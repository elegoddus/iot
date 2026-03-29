const mysql = require('mysql2/promise');
require('dotenv').config();

async function updateDB() {
    const pool = mysql.createPool({ 
        host: process.env.DB_HOST || 'localhost', 
        user: process.env.DB_USER || 'root', 
        password: process.env.DB_PASSWORD || '123456', 
        database: process.env.DB_NAME || 'iot_home' 
    });
    
    await pool.query("UPDATE devices SET name='Quạt' WHERE id='D1'");
    await pool.query("UPDATE devices SET name='Đèn chùm' WHERE id='D2'");
    await pool.query("UPDATE devices SET name='Đèn huỳnh quang' WHERE id='D3'");
    
    console.log("Device names updated.");
    process.exit(0);
}
updateDB();
