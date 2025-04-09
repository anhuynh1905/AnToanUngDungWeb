// middlewares/authMiddleware.js
const jwt = require('jsonwebtoken');
const pool = require('../models/db'); // HOẶC tên biến bạn đặt khi require
const dotenv = require('dotenv'); // Sửa lại nếu bạn dùng dotenv.config() ở file khác
dotenv.config(); // Gọi config nếu cần

const authenticateToken = async (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (token == null) return res.sendStatus(401); // Không có token

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Sửa dòng query ở đây: Thay $1 thành ?
        // Nên dùng pool.execute thay vì pool.query với tham số để có prepared statements
        const sql = 'SELECT r.permissions FROM Members m JOIN Roles r ON m.role_id = r.id WHERE m.id = ?';
        const [rows] = await pool.execute(sql, [decoded.userId]); // Sử dụng pool.execute và ?

        // Kiểm tra kết quả từ pool.execute (rows là một mảng)
        if (rows.length === 0) {
             console.error(`User ${decoded.userId} role not found or permissions missing.`);
             // Có thể trả về 403 vì token hợp lệ nhưng không tìm thấy user/quyền trong DB
             return res.sendStatus(403);
        }

        // Gắn thông tin user (bao gồm quyền) vào request
        req.user = {
            id: decoded.userId,
            permissions: rows[0].permissions // Truy cập permissions từ dòng đầu tiên
        };
        next(); // Đi tiếp nếu mọi thứ OK

    } catch (err) {
        // Phân loại lỗi JWT và lỗi khác
        if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
             console.error("JWT Error:", err.message);
             return res.sendStatus(401); // Lỗi token -> Unauthorized
        }
        // Lỗi khác (ví dụ: lỗi DB trong quá trình query)
        console.error("Authentication Middleware Error:", err);
        return res.status(500).json({ message: "Internal server error during authentication" }); // Lỗi server
    }
};

// Middleware kiểm tra quyền
// requiredPermission là một bitmask (số nguyên) đại diện cho quyền cần thiết
const authorize = (requiredPermission) => {
    return (req, res, next) => {
        if (!req.user || !req.user.permissions) {
             console.error("Authorization check failed: User or permissions not found in request.");
            return res.sendStatus(403); // Phải authenticate trước
        }

        // Kiểm tra bằng phép toán bitwise AND
        // Nếu user có quyền, kết quả AND sẽ bằng chính requiredPermission
        if ((req.user.permissions & requiredPermission) === requiredPermission) {
            next(); // Có quyền, cho đi tiếp
        } else {
            console.log(`Authorization failed: User ${req.user.id} lacks permission ${requiredPermission}. Has: ${req.user.permissions}`);
            res.status(403).json({ message: 'Forbidden: Insufficient permissions' }); // Không có quyền
        }
    };
};


module.exports = { authenticateToken, authorize };