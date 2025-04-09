// server.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');

const authRoutes = require('./routes/auth.routes');
const userRoutes = require('./routes/user.routes');
const bookRoutes = require('./routes/book.routes');
const categoryRoutes = require('./routes/category.routes'); // <<< Import category routes
const borrowRoutes = require('./routes/borrow.routes');
const roleRoutes = require('./routes/role.routes'); // <<< Import


const app = express();
const PORT = process.env.PORT || 3000;

// Middleware cơ bản
app.use(cors()); // Cho phép cross-origin requests
app.use(express.json()); // Parse JSON request bodies
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded bodies

// Routes
app.use('/api/roles', roleRoutes); // <<< Sử dụng route
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes); // Chỉ Admin
app.use('/api/books', bookRoutes); // Thủ thư quản lý, mọi người xem
app.use('/api/categories', categoryRoutes); // Chỉ Thủ thư
app.use('/api/borrow', borrowRoutes); // Người mượn
app.use('/api/categories', categoryRoutes);

// Route mặc định
app.get('/', (req, res) => {
    res.send('Library Management API is running!');
});

// Error Handling Middleware (đơn giản)
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send('Something broke!');
});


app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
    // Kết nối CSDL ở đây nếu cần
});