// routes/category.routes.js

const express = require('express');
const router = express.Router();
const categoryController = require('../controllers/category.controller'); // Đảm bảo đường dẫn đúng
const { authenticateToken, authorize } = require('../middlewares/authMiddleware'); // Import middleware
const { PERMISSIONS } = require('../config/permissions'); // Import quyền

// == Middleware cho tất cả các route trong file này ==

// B1: Yêu cầu người dùng phải đăng nhập (xác thực token)
router.use(authenticateToken);

// B2: Yêu cầu người dùng phải có quyền Quản lý Thể loại (MANAGE_CATEGORIES)
// Áp dụng cho tất cả các hành động: tạo, xem danh sách, sửa, xóa thể loại.
// Nếu bạn muốn cho phép vai trò khác (ví dụ: người mượn) xem danh sách thể loại,
// bạn có thể áp dụng authorize riêng cho từng route hoặc tạo một quyền riêng (ví dụ: VIEW_CATEGORIES).
// Hiện tại, chúng ta yêu cầu quyền quản lý cho tất cả.
router.use(authorize(PERMISSIONS.MANAGE_CATEGORIES));

// == Định nghĩa các Routes ==

// POST /api/categories/ -> Tạo thể loại mới
router.post('/', categoryController.createCategory);

// GET /api/categories/ -> Lấy danh sách tất cả thể loại
router.get('/', categoryController.getAllCategories);

// PUT /api/categories/:id -> Cập nhật thể loại theo ID
router.put('/:id', categoryController.updateCategory);

// DELETE /api/categories/:id -> Xóa thể loại theo ID
router.delete('/:id', categoryController.deleteCategory);

module.exports = router; // Export router để sử dụng trong server.js