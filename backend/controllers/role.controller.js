// controllers/role.controller.js
const pool = require('../models/db');

exports.getAllRoles = async (req, res) => {
    try {
        const [roles] = await pool.query('SELECT id, name FROM Roles ORDER BY name ASC');
        res.json(roles);
    } catch (error) {
        console.error("Error fetching roles:", error);
        res.status(500).json({ message: 'Internal server error' });
    }
};