// routes/auth.routes.js
const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller'); // Đảm bảo import controller

// Route đăng nhập (giữ nguyên)
router.post('/login', authController.login);

// Route đăng ký MỚI
router.post('/register', authController.register); // Ánh xạ tới hàm register mới

module.exports = router;