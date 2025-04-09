// Ví dụ trong file thiết lập kết nối DB (ví dụ: config/db.config.js hoặc models/db.js)
const mysql = require('mysql2/promise'); // Sử dụng promise-based
require('dotenv').config(); // Đọc file .env

const pool = mysql.createPool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT || 3306, // Sử dụng port từ .env hoặc mặc định 3306
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE,
    waitForConnections: true,
    connectionLimit: 10, // Giới hạn số kết nối trong pool
    queueLimit: 0
});

// Có thể thêm hàm kiểm tra kết nối
async function checkConnection() {
    try {
        const connection = await pool.getConnection();
        console.log('Successfully connected to the MySQL database.');
        connection.release(); // Trả kết nối về pool
    } catch (error) {
        console.error('Error connecting to the MySQL database:', error);
        process.exit(1); // Thoát nếu không kết nối được DB
    }
}

checkConnection(); // Gọi hàm kiểm tra khi khởi chạy

module.exports = pool; // Xuất pool để sử dụng trong các controllers