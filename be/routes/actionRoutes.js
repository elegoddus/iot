const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const { v4: uuidv4 } = require('uuid');
const mqttClient = require('../config/mqtt');

/**
 * @swagger
 * /api/actions/control:
 *   post:
 *     summary: Gửi lệnh điều khiển thiết bị
 *     description: Push lệnh ON/OFF tới MQTT Broker để điều khiển thiết bị ESP8266.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               deviceId:
 *                 type: string
 *                 description: ID thiết bị (D1, D2, D3, ALL)
 *               action:
 *                 type: string
 *                 description: Lệnh cấp (ON, OFF, BLINK)
 *     responses:
 *       200:
 *         description: Đã gởi lệnh qua MQTT
 */
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

        // Check MQTT connection immediately before buffering
        if (!mqttClient.connected) {
            await pool.query(`UPDATE action_history SET status = 'FAILED' WHERE request_id LIKE ?`, [`${reqId}%`]);
            return res.status(500).json({ error: 'MQTT Broker disconnected' });
        }

        // Send MQTT command
        mqttClient.publish('truongguitin/control', mqttCommand, async (err) => {
            if (err) {
                console.error("MQTT Publish error:", err);
                await pool.query(`UPDATE action_history SET status = 'FAILED' WHERE request_id LIKE ?`, [`${reqId}%`]);
                return res.status(500).json({ error: 'Failed to send MQTT command' });
            }
            res.json({ message: 'Command sent', reqId, status: 'PROCESSING' });

            // Industrial IoT Standard: Timeout check
            setTimeout(async () => {
                try {
                    await pool.query(
                        `UPDATE action_history SET status = 'FAILED' WHERE request_id LIKE ? AND status = 'PROCESSING'`,
                        [`${reqId}%`]
                    );
                } catch (e) {
                    console.error("Lỗi Timeout logic", e);
                }
            }, 10000);
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

/**
 * @swagger
 * /api/actions/history:
 *   get:
 *     summary: Lấy lịch sử điều khiển thiết bị
 *     description: Lịch sử thao tác (có phân trang, tìm kiếm, lọc theo thiết bị).
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         description: Số trang hiện tại
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Số dòng trên 1 trang
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Tìm ID hoặc Ngày/Giờ
 *       - in: query
 *         name: deviceId
 *         schema:
 *           type: string
 *         description: ID Thiết bị (all, D1, D2, D3)
 *       - in: query
 *         name: actionFilter
 *         schema:
 *           type: string
 *         description: Lọc hành động (all, TURN_ON, TURN_OFF)
 *       - in: query
 *         name: statusFilter
 *         schema:
 *           type: string
 *         description: Lọc trạng thái (all, SUCCESS, FAILED, PROCESSING)
 *     responses:
 *       200:
 *         description: Danh sách lịch sử điều khiển
 */
router.get('/history', async (req, res) => {
    try {
        let { page = 1, limit = 10, search = '', deviceId = 'all', actionFilter = 'all', statusFilter = 'all', sortBy = 'created_at', order = 'DESC' } = req.query;
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
        
        if (actionFilter !== 'all') {
            query += ` AND a.action = ?`;
            params.push(actionFilter);
        }

        if (statusFilter !== 'all') {
            query += ` AND a.status = ?`;
            params.push(statusFilter);
        }

        if (search) {
            const isNumeric = !isNaN(search) && search.trim() !== '';
            if (isNumeric) {
                query += ` AND (a.id = ? OR a.request_id LIKE ?)`;
                params.push(parseInt(search), `%${search}%`);
            } else {
                query += ` AND (d.name LIKE ? OR a.action LIKE ? OR DATE_FORMAT(a.created_at, '%d/%m/%Y %H:%i:%s') LIKE ? OR DATE_FORMAT(a.created_at, '%H:%i:%s %d/%m/%Y') LIKE ? OR DATE_FORMAT(a.created_at, '%Y-%m-%d %H:%i:%s') LIKE ?)`;
                params.push(`%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`);
            }
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
        if (actionFilter !== 'all') {
            countQuery += ` AND a.action = ?`;
            countParams.push(actionFilter);
        }
        if (statusFilter !== 'all') {
            countQuery += ` AND a.status = ?`;
            countParams.push(statusFilter);
        }
        if (search) {
            const isNumeric = !isNaN(search) && search.trim() !== '';
            if (isNumeric) {
                countQuery += ` AND (a.id = ? OR a.request_id LIKE ?)`;
                countParams.push(parseInt(search), `%${search}%`);
            } else {
                countQuery += ` AND (d.name LIKE ? OR a.action LIKE ? OR DATE_FORMAT(a.created_at, '%d/%m/%Y %H:%i:%s') LIKE ? OR DATE_FORMAT(a.created_at, '%Y-%m-%d %H:%i:%s') LIKE ?)`;
                countParams.push(`%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`);
            }
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
