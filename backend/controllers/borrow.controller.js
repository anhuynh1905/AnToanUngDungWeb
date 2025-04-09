// controllers/borrow.controller.js -> hàm createBorrowingSlip

exports.createBorrowingSlip = async (req, res) => {
    const userId = req.user.id;
    // Lấy bookIds từ body request (nếu có)
    const { bookIds } = req.body; // <<<< Lấy bookIds

    // Kiểm tra bookIds có phải là mảng không (nếu được gửi)
    if (bookIds !== undefined && !Array.isArray(bookIds)) {
         return res.status(400).json({ message: 'bookIds must be an array if provided' });
    }

    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();

        // 1. Tạo phiếu mượn chính (status='draft')
        const slipSql = 'INSERT INTO BorrowingSlips (user_id, status, created_at) VALUES (?, ?, NOW())';
        const [slipResult] = await connection.execute(slipSql, [userId, 'draft']);
        const slipId = slipResult.insertId;

        // 2. Thêm các sách từ bookIds vào phiếu (NẾU bookIds được gửi và không rỗng)
        let itemsAddedCount = 0;
        if (bookIds && bookIds.length > 0) {
            const itemSql = 'INSERT INTO BorrowingSlipItems (slip_id, book_id) VALUES (?, ?)';
            // Dùng Set để loại bỏ ID trùng lặp từ frontend gửi lên
            const uniqueBookIds = [...new Set(bookIds)];

            for (const bookId of uniqueBookIds) {
                // Quan trọng: Kiểm tra sách tồn tại trước khi thêm
                 const [books] = await connection.execute('SELECT id FROM Books WHERE id = ?', [bookId]);
                 if (books.length === 0) {
                     // Nếu sách không tồn tại, rollback và báo lỗi
                     await connection.rollback();
                     // Cung cấp thông báo lỗi rõ ràng hơn
                     return res.status(400).json({ message: `Book with ID ${bookId} does not exist and cannot be added.` });
                 }
                 // Nếu sách tồn tại, thêm vào items
                 await connection.execute(itemSql, [slipId, bookId]);
                 itemsAddedCount++;
            }
        }

        await connection.commit();
        res.status(201).json({
             message: `Borrowing slip created successfully ${itemsAddedCount > 0 ? `with ${itemsAddedCount} item(s)` : '(empty)'}.`,
             slipId: slipId
        });

    } catch (error) {
        await connection.rollback();
        console.error("Error creating borrowing slip:", error);
        // Bắt lỗi trùng item trong phiếu (nếu có ràng buộc UNIQUE(slip_id, book_id))
        if (error.code === 'ER_DUP_ENTRY') {
             return res.status(409).json({ message: 'Attempted to add duplicate book to the slip.' });
         }
        res.status(500).json({ message: 'Internal server error while creating slip' });
    } finally {
         connection.release();
    }
};