const express = require('express');
const router = express.Router();
const pool = require('../config/db');

/**
 * @swagger
 * /api/devices:
 *   get:
 *     summary: Danh sách thiết bị
 *     description: Lấy danh sách các thiết bị hiện có cùng với trạng thái hiện tại.
 *     responses:
 *       200:
 *         description: Trả về một mảng chứa thông tin thiết bị
 */
router.get('/', async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM devices');
        res.json(rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

module.exports = router;
