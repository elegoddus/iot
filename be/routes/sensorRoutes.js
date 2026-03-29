const express = require('express');
const router = express.Router();
const pool = require('../config/db');

// Get current sensor data
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

// Get sensor history with pagination, sort, and search
router.get('/history', async (req, res) => {
    try {
        let { page = 1, limit = 10, search = '', sortBy = 'recorded_at', order = 'DESC' } = req.query;
        page = parseInt(page);
        limit = parseInt(limit);
        const offset = (page - 1) * limit;

        let query = `
            SELECT sd.id, s.name as sensor_name, sd.value, s.unit, sd.recorded_at
            FROM sensor_data sd
            JOIN sensors s ON sd.sensor_id = s.id
            WHERE 1=1
        `;
        const params = [];

        if (search) {
            query += ` AND (s.name LIKE ? OR sd.recorded_at LIKE ?)`;
            params.push(`%${search}%`, `%${search}%`);
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
        if (search) {
            countQuery += ` AND (s.name LIKE ? OR sd.recorded_at LIKE ?)`;
            countParams.push(`%${search}%`, `%${search}%`);
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
