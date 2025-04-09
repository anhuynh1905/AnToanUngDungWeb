// controllers/auth.controller.js
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../models/db'); // Import MySQL pool
require('dotenv').config();



// --- Hàm login giữ nguyên ---
exports.login = async (req, res) => {
    // ... (code login như cũ) ...
    const { username, password } = req.body;
    if (!username || !password) {
        return res.status(400).json({ message: 'Username and password are required' });
    }

    try {
        // 1. Tìm user trong DB
        const userSql = `SELECT m.id, m.username, m.password_hash, m.role_id, r.name as role_name FROM Members m JOIN Roles r ON m.role_id = r.id WHERE m.username = ?`;
        const [users] = await pool.execute(userSql, [username]);

        if (users.length === 0) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }
        const user = users[0];

        // 2. So sánh password hash
        const isMatch = await bcrypt.compare(password, user.password_hash);
        if (!isMatch) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        // 3. Tạo JWT (Lấy permissions từ user đã join ở trên)
        const payload = {
            userId: user.id,
            // permissions: user.permissions // Permissions sẽ được lấy lại trong middleware authenticate
        };
        const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN });

        res.json({
            token: token,
            userId: user.id,
            username: user.username,
            role_name: user.role_name // <<< ĐẢM BẢO CÓ DÒNG NÀY
        });

    } catch (error) {
        console.error("Login error:", error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

// --- Hàm register MỚI ---
exports.register = async (req, res) => {
    const { username, password } = req.body;
    const defaultRoleName = 'Sinh viên'; // Vai trò mặc định cho người dùng mới

    // 1. Validate đầu vào
    if (!username || !password) {
        return res.status(400).json({ message: 'Username and password are required' });
    }
    // Thêm các validation khác nếu cần (độ dài password, ký tự hợp lệ username,...)

    try {
        // 2. Kiểm tra username đã tồn tại chưa
        const [existingUsers] = await pool.execute('SELECT id FROM Members WHERE username = ?', [username]);
        if (existingUsers.length > 0) {
            return res.status(409).json({ message: 'Username already exists' }); // 409 Conflict
        }

        // 3. Tìm role_id của vai trò mặc định
        const [defaultRoles] = await pool.execute('SELECT id FROM Roles WHERE name = ?', [defaultRoleName]);
        if (defaultRoles.length === 0) {
            // Lỗi nghiêm trọng: Vai trò mặc định không tồn tại trong CSDL
            console.error(`Default role "${defaultRoleName}" not found in database.`);
            return res.status(500).json({ message: 'Internal server error: Default role configuration issue.' });
        }
        const defaultRoleId = defaultRoles[0].id;

        // 4. Hash password
        const salt = await bcrypt.genSalt(10);
        const password_hash = await bcrypt.hash(password, salt);

        // 5. Lưu người dùng mới vào CSDL
        const insertSql = 'INSERT INTO Members (username, password_hash, role_id) VALUES (?, ?, ?)';
        const [result] = await pool.execute(insertSql, [username, password_hash, defaultRoleId]);

        // 6. Trả về thông báo thành công
        // Không trả về token ở đây, người dùng cần đăng nhập sau khi đăng ký
        res.status(201).json({ message: 'User registered successfully. Please login.', userId: result.insertId });

    } catch (error) {
        console.error("Registration error:", error);
        res.status(500).json({ message: 'Internal server error during registration' });
    }
};