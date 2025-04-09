// routes/book.routes.js
const express = require('express');
const router = express.Router();
const bookController = require('../controllers/book.controller');
const { authenticateToken, authorize } = require('../middlewares/authMiddleware');
const { PERMISSIONS } = require('../config/permissions');

router.use(authenticateToken); // Mọi người dùng đã đăng nhập đều cần xem sách

// Chỉ Thủ thư (hoặc Admin) mới được quản lý sách
router.post('/', authorize(PERMISSIONS.MANAGE_BOOKS), bookController.createBook);
router.put('/:id', authorize(PERMISSIONS.MANAGE_BOOKS), bookController.updateBook);
router.delete('/:id', authorize(PERMISSIONS.MANAGE_BOOKS), bookController.deleteBook);

// Ai cũng có thể xem sách (nếu đã đăng nhập)
router.get('/', bookController.getAllBooks); // Quyền VIEW_BOOKS có thể check ở đây hoặc để mở nếu không cần login để xem
router.get('/:id', bookController.getBookById);

module.exports = router;

// Tương tự tạo routes/category.routes.js và controller, dùng authorize(PERMISSIONS.MANAGE_CATEGORIES)

