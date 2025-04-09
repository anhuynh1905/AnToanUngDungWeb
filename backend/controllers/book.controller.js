// controllers/book.controller.js
const pool = require('../models/db');

// Nhiệm vụ 2: Thêm sách mới (Thủ thư)
exports.createBook = async (req, res) => {
    // Giả sử các trường này tồn tại trong bảng Books
    const { title, author, isbn, publish_year, publisher, category_id, description, quantity, price } = req.body;

    // Thêm validation kiểm tra các trường bắt buộc ở đây
    if (!title || !author || !category_id || quantity === undefined || price === undefined) {
        return res.status(400).json({ message: 'Title, author, category_id, quantity, and price are required' });
    }

    try {
        // Kiểm tra category_id có hợp lệ không
        const [categories] = await pool.execute('SELECT id FROM Categories WHERE id = ?', [category_id]);
        if (categories.length === 0) {
             return res.status(400).json({ message: 'Invalid category_id' });
        }

        const sql = `INSERT INTO Books
                     (title, author, isbn, publish_year, publisher, category_id, description, quantity, price)
                     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`;
        const params = [title, author, isbn, publish_year, publisher, category_id, description, quantity, price];
        const [result] = await pool.execute(sql, params);

        res.status(201).json({ message: 'Book created successfully', bookId: result.insertId });

    } catch (error) {
        console.error("Error creating book:", error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

// Nhiệm vụ 2 & 3: Lấy danh sách sách (Mọi người dùng đã đăng nhập)
exports.getAllBooks = async (req, res) => {
    try {
        // Có thể thêm phân trang, tìm kiếm, lọc theo thể loại ở đây (dùng req.query)
        const sql = `SELECT b.id, b.title, b.author, b.isbn, b.publish_year, b.publisher,
                     b.category_id, c.name as category_name, b.description, b.quantity, b.price
                     FROM Books b
                     LEFT JOIN Categories c ON b.category_id = c.id`; // LEFT JOIN để vẫn lấy sách nếu category bị null
        const [books] = await pool.query(sql);
        res.json(books);
    } catch (error) {
        console.error("Error fetching books:", error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

// Nhiệm vụ 2 & 3: Lấy chi tiết một sách
exports.getBookById = async (req, res) => {
    const { id } = req.params;
    try {
        const sql = `SELECT b.id, b.title, b.author, b.isbn, b.publish_year, b.publisher,
                     b.category_id, c.name as category_name, b.description, b.quantity, b.price
                     FROM Books b
                     LEFT JOIN Categories c ON b.category_id = c.id
                     WHERE b.id = ?`;
        const [books] = await pool.execute(sql, [id]);

        if (books.length === 0) {
            return res.status(404).json({ message: 'Book not found' });
        }
        res.json(books[0]);
    } catch (error) {
        console.error("Error fetching book:", error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

// Nhiệm vụ 2: Cập nhật thông tin sách (Thủ thư)
exports.updateBook = async (req, res) => {
    const { id } = req.params;
    const { title, author, isbn, publish_year, publisher, category_id, description, quantity, price } = req.body;

    if (!title && !author && !isbn && !publish_year && !publisher && category_id === undefined && !description && quantity === undefined && price === undefined) {
        return res.status(400).json({ message: 'No fields provided for update' });
    }

    try {
        // Build dynamic UPDATE query
        let sql = 'UPDATE Books SET ';
        const params = [];
        const fields = { title, author, isbn, publish_year, publisher, category_id, description, quantity, price };

        for (const key in fields) {
            if (fields[key] !== undefined) {
                if (key === 'category_id') {
                    // Check if category_id is valid
                     const [categories] = await pool.execute('SELECT id FROM Categories WHERE id = ?', [fields[key]]);
                     if (categories.length === 0) {
                         return res.status(400).json({ message: `Invalid category_id: ${fields[key]}` });
                     }
                }
                sql += `${key} = ?, `;
                params.push(fields[key]);
            }
        }

        sql = sql.slice(0, -2); // Remove trailing comma and space
        sql += ' WHERE id = ?';
        params.push(id);

        const [result] = await pool.execute(sql, params);

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Book not found or no changes made' });
        }

        res.json({ message: 'Book updated successfully' });

    } catch (error) {
        console.error("Error updating book:", error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

// Nhiệm vụ 2: Xóa sách (Thủ thư)
exports.deleteBook = async (req, res) => {
    const { id } = req.params;
    try {
        // Cần kiểm tra xem sách có đang được mượn không trước khi xóa? (Phụ thuộc yêu cầu)
        const sql = 'DELETE FROM Books WHERE id = ?';
        const [result] = await pool.execute(sql, [id]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Book not found' });
        }

        res.status(200).json({ message: 'Book deleted successfully' }); // Hoặc 204 No Content
    } catch (error) {
         // Check for foreign key constraint error (e.g., ER_ROW_IS_REFERENCED_2 in BorrowSlipItems)
         if (error.code === 'ER_ROW_IS_REFERENCED_2') {
             return res.status(409).json({ message: 'Cannot delete book because it is referenced in borrowing slips.' });
         }
        console.error("Error deleting book:", error);
        res.status(500).json({ message: 'Internal server error' });
    }
};