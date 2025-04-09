// controllers/user.controller.js
const pool = require('../models/db'); // Import MySQL connection pool
const bcrypt = require('bcryptjs');

// Nhiệm vụ 1: Tạo người dùng mới (Admin)
exports.createUser = async (req, res) => {
    const { username, password, role_id } = req.body;

    if (!username || !password || !role_id) {
        return res.status(400).json({ message: 'Username, password, and role_id are required' });
    }

    try {
        // Kiểm tra xem role_id có hợp lệ không (tùy chọn)
        const [roles] = await pool.execute('SELECT id FROM Roles WHERE id = ?', [role_id]);
        if (roles.length === 0) {
            return res.status(400).json({ message: 'Invalid role_id' });
        }

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const password_hash = await bcrypt.hash(password, salt);

        // Thêm vào CSDL
        const sql = 'INSERT INTO Members (username, password_hash, role_id) VALUES (?, ?, ?)';
        const [result] = await pool.execute(sql, [username, password_hash, role_id]);

        res.status(201).json({ message: 'User created successfully', userId: result.insertId });

    } catch (error) {
        // Bắt lỗi trùng username (MySQL error code 1062 for ER_DUP_ENTRY)
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({ message: 'Username already exists' });
        }
        console.error("Error creating user:", error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

// Nhiệm vụ 1: Lấy danh sách người dùng (Admin)
exports.getAllUsers = async (req, res) => {
    try {
        // Chọn các cột cần thiết, không lấy password hash
        const sql = 'SELECT m.id, m.username, m.role_id, r.name as role_name FROM Members m JOIN Roles r ON m.role_id = r.id';
        const [users] = await pool.query(sql);
        res.json(users);
    } catch (error) {
        console.error("Error fetching users:", error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

// Nhiệm vụ 1: Lấy thông tin chi tiết một người dùng (Admin)
exports.getUserById = async (req, res) => {
    const { id } = req.params;
    try {
        const sql = 'SELECT m.id, m.username, m.role_id, r.name as role_name FROM Members m JOIN Roles r ON m.role_id = r.id WHERE m.id = ?';
        const [users] = await pool.execute(sql, [id]);

        if (users.length === 0) {
            return res.status(404).json({ message: 'User not found' });
        }
        res.json(users[0]);
    } catch (error) {
        console.error("Error fetching user:", error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

// Nhiệm vụ 1: Cập nhật thông tin người dùng (Admin)
exports.updateUser = async (req, res) => {
    const { id } = req.params;
    const { username, password, role_id } = req.body;

    // Ít nhất một trường phải được cung cấp để cập nhật
    if (!username && !password && role_id === undefined) {
        return res.status(400).json({ message: 'No fields provided for update' });
    }

    try {
        let sql = 'UPDATE Members SET ';
        const params = [];

        if (username) {
            sql += 'username = ?, ';
            params.push(username);
        }
        if (password) {
            const salt = await bcrypt.genSalt(10);
            const password_hash = await bcrypt.hash(password, salt);
            sql += 'password_hash = ?, ';
            params.push(password_hash);
        }
        if (role_id !== undefined) {
            // Kiểm tra role_id hợp lệ (tùy chọn)
            const [roles] = await pool.execute('SELECT id FROM Roles WHERE id = ?', [role_id]);
            if (roles.length === 0) {
                 return res.status(400).json({ message: 'Invalid role_id' });
            }
            sql += 'role_id = ?, ';
            params.push(role_id);
        }

        // Xóa dấu phẩy và khoảng trắng thừa ở cuối
        sql = sql.slice(0, -2);
        sql += ' WHERE id = ?';
        params.push(id);

        const [result] = await pool.execute(sql, params);

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'User not found or no changes made' });
        }

        res.json({ message: 'User updated successfully' });

    } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') {
             return res.status(409).json({ message: 'Username already exists' });
        }
        console.error("Error updating user:", error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

// Nhiệm vụ 1: Xóa người dùng (Admin)
exports.deleteUser = async (req, res) => {
    const { id } = req.params;

    // Cẩn thận: Không nên cho phép admin tự xóa mình? (Cần logic kiểm tra req.user.id)
    // if (parseInt(id, 10) === req.user.id) {
    //     return res.status(403).json({ message: "Cannot delete your own account" });
    // }

    try {
        const sql = 'DELETE FROM Members WHERE id = ?';
        const [result] = await pool.execute(sql, [id]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.status(200).json({ message: 'User deleted successfully' }); // Hoặc 204 No Content
    } catch (error) {
        // Xử lý lỗi ràng buộc khóa ngoại nếu user này có liên kết (ví dụ: phiếu mượn)
         console.error("Error deleting user:", error);
         // Check for foreign key constraint error (e.g., ER_ROW_IS_REFERENCED_2)
         if (error.code === 'ER_ROW_IS_REFERENCED_2') {
             return res.status(409).json({ message: 'Cannot delete user because they have associated records (e.g., borrowing slips).' });
         }
        res.status(500).json({ message: 'Internal server error' });
    }
};