// routes/user.routes.js
const express = require('express');
const router = express.Router();
const userController = require('../controllers/user.controller');
const { authenticateToken, authorize } = require('../middlewares/authMiddleware');
const { PERMISSIONS } = require('../config/permissions');

// Áp dụng authenticate cho tất cả route user
router.use(authenticateToken);
// Áp dụng authorize(MANAGE_USERS) cho tất cả route user
router.use(authorize(PERMISSIONS.MANAGE_USERS));

router.post('/', userController.createUser); // Thêm người dùng
router.get('/', userController.getAllUsers); // Lấy danh sách người dùng
router.get('/:id', userController.getUserById); // Lấy chi tiết 1 người dùng
router.put('/:id', userController.updateUser); // Sửa người dùng (gồm cả quyền/vai trò)
router.delete('/:id', userController.deleteUser); // Xóa người dùng

module.exports = router;

