const mysql = require('mysql2/promise');
require('dotenv').config();

async function initDB() {
    try {
        console.log("Connecting to MySQL to create database...");
        
        const connection = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || ''
        });

        await connection.query(`CREATE DATABASE IF NOT EXISTS \`${process.env.DB_NAME || 'iot_home'}\``);
        console.log(`Database '${process.env.DB_NAME || 'iot_home'}' created or already exists.`);
        
        await connection.query(`USE \`${process.env.DB_NAME || 'iot_home'}\``);

        console.log("Creating tables...");

        await connection.query(`
            CREATE TABLE IF NOT EXISTS sensors (
                id VARCHAR(20) PRIMARY KEY,
                name VARCHAR(100) NOT NULL,
                unit VARCHAR(10),
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `);

        await connection.query(`
            CREATE TABLE IF NOT EXISTS sensor_data (
                id BIGINT AUTO_INCREMENT PRIMARY KEY,
                sensor_id VARCHAR(20),
                value FLOAT NOT NULL,
                recorded_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (sensor_id) REFERENCES sensors(id)
            )
        `);

        await connection.query(`
            CREATE TABLE IF NOT EXISTS devices (
                id VARCHAR(20) PRIMARY KEY,
                name VARCHAR(100) NOT NULL,
                gpio_pin INT,
                current_status ENUM('ON', 'OFF') DEFAULT 'OFF',
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `);

        await connection.query(`
            CREATE TABLE IF NOT EXISTS action_history (
                id BIGINT AUTO_INCREMENT PRIMARY KEY,
                request_id VARCHAR(50) NOT NULL UNIQUE,
                device_id VARCHAR(20),
                action ENUM('TURN_ON', 'TURN_OFF', 'BLINK') NOT NULL,
                status ENUM('PROCESSING', 'SUCCESS', 'TIMEOUT', 'FAILED') DEFAULT 'PROCESSING',
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (device_id) REFERENCES devices(id)
            )
        `);

        await connection.query(`
            INSERT IGNORE INTO sensors (id, name, unit) VALUES
            ('TEMP_01', 'Nhiệt độ', '°C'),
            ('HUMID_01', 'Độ ẩm', '%'),
            ('LIGHT_01', 'Ánh sáng', 'Lux')
        `);

        await connection.query(`
            INSERT IGNORE INTO devices (id, name, gpio_pin, current_status) VALUES
            ('D1', 'Đèn 1', 1, 'OFF'),
            ('D2', 'Đèn 2', 2, 'OFF'),
            ('D3', 'Quạt/Đèn 3', 3, 'OFF')
        `);

        console.log("Database initialized successfully.");
        await connection.end();
        process.exit(0);
    } catch (err) {
        console.error("Error initializing database:", err);
        process.exit(1);
    }
}

initDB();
