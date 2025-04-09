// routes/borrow.routes.js
const express = require('express');
const router = express.Router();
const borrowController = require('../controllers/borrow.controller');
const { authenticateToken, authorize } = require('../middlewares/authMiddleware');
const { PERMISSIONS } = require('../config/permissions');

router.use(authenticateToken); // Cần đăng nhập để mượn sách
// Áp dụng quyền quản lý phiếu mượn cho các thao tác liên quan
router.use(authorize(PERMISSIONS.MANAGE_OWN_BORROWING_SLIPS));

router.post('/slips', borrowController.createBorrowingSlip); // Tạo phiếu mượn mới (draft)
router.get('/slips', borrowController.getMyBorrowingSlips); // Xem các phiếu mượn của mình
router.get('/slips/:slipId', borrowController.getBorrowingSlipDetails); // Xem chi tiết phiếu
// Sửa/xóa sách trong phiếu (chỉ khi phiếu chưa gửi - status='draft')
router.put('/slips/:slipId/items', borrowController.updateSlipItems);
router.delete('/slips/:slipId', borrowController.deleteBorrowingSlip); // Xóa phiếu (chỉ khi draft)
router.post('/slips/:slipId/submit', borrowController.submitBorrowingSlip); // Gửi phiếu mượn (chuyển status='submitted')

module.exports = router;