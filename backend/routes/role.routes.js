// routes/role.routes.js
const express = require('express');
const router = express.Router();
const roleController = require('../controllers/role.controller');
const { authenticateToken } = require('../middlewares/authMiddleware');
// Có thể thêm authorize nếu chỉ muốn role cụ thể mới lấy được danh sách roles

router.use(authenticateToken); // Yêu cầu đăng nhập để xem roles

router.get('/', roleController.getAllRoles);

module.exports = router;