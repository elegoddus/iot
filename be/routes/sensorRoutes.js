const express = require('express');
const router = express.Router();
const pool = require('../config/db');

/**
 * @swagger
 * /api/sensors/current:
 *   get:
 *     summary: Lấy dữ liệu cảm biến mới nhất
 *     description: Trả về giá trị đo được gần nhất của tất cả các cảm biến.
 *     responses:
 *       200:
 *         description: Thông tin cảm biến mới nhất
 */
router.get('/current', async (req, res) => {
    try {
        const [rows] = await pool.query(`
            SELECT s.id, s.name, s.unit, sd.value, sd.recorded_at 
            FROM sensors s
            LEFT JOIN (
                SELECT sensor_id, MAX(recorded_at) as max_time
                FROM sensor_data
                GROUP BY sensor_id
            ) latest ON s.id = latest.sensor_id
            LEFT JOIN sensor_data sd ON latest.sensor_id = sd.sensor_id AND latest.max_time = sd.recorded_at
        `);
        res.json(rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

/**
 * @swagger
 * /api/sensors/history:
 *   get:
 *     summary: Lấy lịch sử dữ liệu cảm biến (có phân trang)
 *     description: Phục vụ bảng dữ liệu Sensor History.
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
 *         description: Trị số hoặc Tên thiết bị cần tìm kiếm
 *       - in: query
 *         name: sensorId
 *         schema:
 *           type: string
 *         description: Lọc theo cảm biến (all | TEMP_01 | HUMID_01 | LIGHT_01)
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *         description: Cột dùng để sắp xếp (mặc định recorded_at)
 *       - in: query
 *         name: order
 *         schema:
 *           type: string
 *         description: Hướng sắp xếp ASC / DESC
 *     responses:
 *       200:
 *         description: Lịch sử dữ liệu cảm biến
 */
router.get('/history', async (req, res) => {
    try {
        let { page = 1, limit = 10, search = '', sensorId = 'all', sortBy = 'recorded_at', order = 'DESC' } = req.query;
        page = parseInt(page);
        limit = parseInt(limit);
        const offset = (page - 1) * limit;

        let query = `
            SELECT sd.id, s.id as sensor_id, s.name as sensor_name, sd.value, s.unit, sd.recorded_at
            FROM sensor_data sd
            JOIN sensors s ON sd.sensor_id = s.id
            WHERE 1=1
        `;
        const params = [];

        if (sensorId !== 'all') {
            query += ` AND s.id = ?`;
            params.push(sensorId);
        }

        if (search) {
            const isNumeric = !isNaN(search) && search.trim() !== '';
            if (isNumeric) {
                query += ` AND (CAST(sd.value AS CHAR) LIKE ?)`;
                params.push(`%${search}%`);
            } else {
                query += ` AND (s.name LIKE ? 
                    OR DATE_FORMAT(sd.recorded_at, '%d/%m/%Y %H:%i:%s') LIKE ? 
                    OR DATE_FORMAT(sd.recorded_at, '%H:%i:%s %d/%m/%Y') LIKE ? 
                    OR DATE_FORMAT(sd.recorded_at, '%e/%c/%Y %H:%i:%s') LIKE ? 
                    OR DATE_FORMAT(sd.recorded_at, '%H:%i:%s %e/%c/%Y') LIKE ?
                    OR DATE_FORMAT(sd.recorded_at, '%Y-%m-%d %H:%i:%s') LIKE ?)`;
                const fuzzySearch = '%' + search.trim().replace(/\s+/g, '%') + '%';
                params.push(fuzzySearch, fuzzySearch, fuzzySearch, fuzzySearch, fuzzySearch, fuzzySearch);
            }
        }

        // Validate sortBy and order to prevent SQL injection
        const validSortColumns = ['id', 'sensor_name', 'value', 'recorded_at'];
        if (!validSortColumns.includes(sortBy)) sortBy = 'recorded_at';
        order = order.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

        query += ` ORDER BY ${sortBy} ${order} LIMIT ? OFFSET ?`;
        params.push(limit, offset);

        const [rows] = await pool.query(query, params);

        // Get total count
        let countQuery = `
            SELECT COUNT(*) as total 
            FROM sensor_data sd
            JOIN sensors s ON sd.sensor_id = s.id
            WHERE 1=1
        `;
        const countParams = [];
        if (sensorId !== 'all') {
            countQuery += ` AND s.id = ?`;
            countParams.push(sensorId);
        }
        if (search) {
            const isNumeric = !isNaN(search) && search.trim() !== '';
            if (isNumeric) {
                countQuery += ` AND (CAST(sd.value AS CHAR) LIKE ?)`;
                countParams.push(`%${search}%`);
            } else {
                countQuery += ` AND (s.name LIKE ? OR DATE_FORMAT(sd.recorded_at, '%d/%m/%Y %H:%i:%s') LIKE ? OR DATE_FORMAT(sd.recorded_at, '%Y-%m-%d %H:%i:%s') LIKE ?)`;
                countParams.push(`%${search}%`, `%${search}%`, `%${search}%`);
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
