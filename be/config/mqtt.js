const mqtt = require('mqtt');
const pool = require('./db');
require('dotenv').config();

const client = mqtt.connect(process.env.MQTT_BROKER, {
    username: process.env.MQTT_USER,
    password: process.env.MQTT_PASSWORD
});

client.on('connect', () => {
    console.log('Connected to MQTT Broker:', process.env.MQTT_BROKER);
    client.subscribe('truongguitin/sensors', (err) => {
        if (!err) console.log('Subscribed to truongguitin/sensors');
    });
    client.subscribe('truongguitin/callback', (err) => {
        if (!err) console.log('Subscribed to truongguitin/callback');
    });
});

client.on('message', async (topic, message) => {
    try {
        const payload = message.toString();
        // console.log(`Received message on ${topic}: ${payload}`);

        if (topic === 'truongguitin/sensors') {
            const data = JSON.parse(payload);
            // {"T": 32.5, "H": 60.0, "L": 500}
            if (data.T !== undefined) {
                await pool.query('INSERT INTO sensor_data (sensor_id, value) VALUES (?, ?)', ['TEMP_01', data.T]);
            }
            if (data.H !== undefined) {
                await pool.query('INSERT INTO sensor_data (sensor_id, value) VALUES (?, ?)', ['HUMID_01', data.H]);
            }
            if (data.L !== undefined) {
                await pool.query('INSERT INTO sensor_data (sensor_id, value) VALUES (?, ?)', ['LIGHT_01', data.L]);
            }
        } 
        else if (topic === 'truongguitin/callback') {
            // {"D1": "ON", "D2": "OFF", "D3": "OFF", "result": "SUCCESS"}
            let data;
            try {
                data = JSON.parse(payload);
            } catch(e) {
                console.warn('MQTT callback payload is not valid JSON:', payload);
                return;
            }
            
            if (data) {
                // Update device statuses
                if (data.D1) await pool.query('UPDATE devices SET current_status = ? WHERE id = ?', [data.D1, 'D1']);
                if (data.D2) await pool.query('UPDATE devices SET current_status = ? WHERE id = ?', [data.D2, 'D2']);
                if (data.D3) await pool.query('UPDATE devices SET current_status = ? WHERE id = ?', [data.D3, 'D3']);

                // Any PROCESSING actions can be marked SUCCESS when ESP reports a status change
                // (Since ESP code doesn't send reqId back, this is a simple approximation)
                if (data.result === 'SUCCESS' || data.result === 'BLINK_MODE_ON' || data.result === 'UNKNOWN_COMMAND' || data.result === 'ALL_OFF' || data.result === 'ALL_ON') {
                     await pool.query('UPDATE action_history SET status = ? WHERE status = ?', ['SUCCESS', 'PROCESSING']);
                }
            }
        }
    } catch (err) {
        console.error('Error processing MQTT message:', err);
    }
});

module.exports = client;
