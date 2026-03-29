const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const { v4: uuidv4 } = require('uuid');
const mqttClient = require('../config/mqtt');

// Send control command
router.post('/control', async (req, res) => {
    try {
        const { deviceId, action } = req.body; 
        
        const validDevices = ['D1', 'D2', 'D3', 'ALL'];
        const validActions = ['ON', 'OFF', 'BLINK'];
        
        if (!validDevices.includes(deviceId) || !validActions.includes(action)) {
            return res.status(400).json({ error: 'Invalid deviceId or action' });
        }

        const reqId = uuidv4();
        
        let mqttCommand = '';
        if (deviceId === 'ALL') {
             mqttCommand = action === 'BLINK' ? 'BLINK_ALL' : `ALL_${action}`;
        } else {
             mqttCommand = `${deviceId}_${action}`;
        }

        let targetDevice = deviceId === 'ALL' ? null : deviceId;
        
        let actionEnum = `TURN_${action}`;
        if (action === 'BLINK') actionEnum = 'TURN_ON'; // Fallback for enum compatibility

        if (targetDevice) {
            await pool.query(
                `INSERT INTO action_history (request_id, device_id, action, status) VALUES (?, ?, ?, ?)`,
                [reqId, targetDevice, actionEnum, 'PROCESSING']
            );
        } else {
             // For ALL, maybe we can insert 3 rows or skip depending on design. Let's insert for each for better history tracking
             if (action !== 'BLINK') {
                 await pool.query(
                     `INSERT INTO action_history (request_id, device_id, action, status) VALUES (?, ?, ?, ?), (?, ?, ?, ?), (?, ?, ?, ?)`,
                     [
                        reqId+'-D1', 'D1', actionEnum, 'PROCESSING',
                        reqId+'-D2', 'D2', actionEnum, 'PROCESSING',
                        reqId+'-D3', 'D3', actionEnum, 'PROCESSING'
                     ]
                 );
             }
        }

        // Send MQTT command
        mqttClient.publish('truongguitin/control', mqttCommand, (err) => {
            if (err) {
                console.error("MQTT Publish error:", err);
                return res.status(500).json({ error: 'Failed to send MQTT command' });
            }
            res.json({ message: 'Command sent', reqId, status: 'PROCESSING' });
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

// Get action history
router.get('/history', async (req, res) => {
    try {
        let { page = 1, limit = 10, search = '', deviceId = 'all', sortBy = 'created_at', order = 'DESC' } = req.query;
        page = parseInt(page);
        limit = parseInt(limit);
        const offset = (page - 1) * limit;

        let query = `
            SELECT a.id, a.request_id, a.device_id, d.name as device_name, a.action, a.status, a.created_at
            FROM action_history a
            LEFT JOIN devices d ON a.device_id = d.id
            WHERE 1=1
        `;
        const params = [];

        if (deviceId !== 'all') {
            query += ` AND a.device_id = ?`;
            params.push(deviceId);
        }

        if (search) {
            query += ` AND (d.name LIKE ? OR a.action LIKE ? OR a.created_at LIKE ?)`;
            params.push(`%${search}%`, `%${search}%`, `%${search}%`);
        }

        const validSortColumns = ['id', 'device_name', 'action', 'status', 'created_at'];
        if (!validSortColumns.includes(sortBy)) sortBy = 'created_at';
        order = order.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

        query += ` ORDER BY ${sortBy} ${order} LIMIT ? OFFSET ?`;
        params.push(limit, offset);

        const [rows] = await pool.query(query, params);

        let countQuery = `
            SELECT COUNT(*) as total 
            FROM action_history a
            LEFT JOIN devices d ON a.device_id = d.id
            WHERE 1=1
        `;
        const countParams = [];
        if (deviceId !== 'all') {
            countQuery += ` AND a.device_id = ?`;
            countParams.push(deviceId);
        }
        if (search) {
            countQuery += ` AND (d.name LIKE ? OR a.action LIKE ? OR a.created_at LIKE ?)`;
            countParams.push(`%${search}%`, `%${search}%`, `%${search}%`);
        }
        const [countResult] = await pool.query(countQuery, countParams);
        
        res.json({
            data: rows,
            total: countResult[0].total,
            page,
            totalPages: Math.ceil(countResult[0].total / limit)
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

module.exports = router;
