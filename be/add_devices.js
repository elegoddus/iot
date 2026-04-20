const pool = require('./config/db');

async function addDevices() {
    try {
        await pool.query("INSERT IGNORE INTO devices (id, name, gpio_pin, current_status) VALUES ('D4', 'Điều hòa', 'GPIO12', 'OFF'), ('D5', 'Tủ lạnh', 'GPIO13', 'OFF');");
        console.log("Added D4 and D5 to devices table successfully.");
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}
addDevices();
