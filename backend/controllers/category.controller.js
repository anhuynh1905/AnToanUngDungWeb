// controllers/category.controller.js
const pool = require('../models/db');

// Nhiệm vụ 2: Thêm thể loại mới (Thủ thư)
exports.createCategory = async (req, res) => {
    const { name, description } = req.body;
    if (!name) {
        return res.status(400).json({ message: 'Category name is required' });
    }
    try {
        const sql = 'INSERT INTO Categories (name, description) VALUES (?, ?)';
        const [result] = await pool.execute(sql, [name, description || null]); // Allow null description
        res.status(201).json({ message: 'Category created successfully', categoryId: result.insertId });
    } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({ message: 'Category name already exists' });
        }
        console.error("Error creating category:", error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

// Nhiệm vụ 2: Lấy danh sách thể loại (Thủ thư - hoặc có thể cho mọi người xem)
exports.getAllCategories = async (req, res) => {
    try {
        const sql = 'SELECT id, name, description FROM Categories';
        const [categories] = await pool.query(sql);
        res.json(categories);
    } catch (error) {
        console.error("Error fetching categories:", error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

// Nhiệm vụ 2: Cập nhật thể loại (Thủ thư)
exports.updateCategory = async (req, res) => {
    const { id } = req.params;
    const { name, description } = req.body;

    if (!name && description === undefined) {
         return res.status(400).json({ message: 'No fields provided for update' });
    }

    try {
        let sql = 'UPDATE Categories SET ';
        const params = [];
        if (name) {
            sql += 'name = ?, ';
            params.push(name);
        }
        if (description !== undefined) {
            sql += 'description = ?, ';
            params.push(description);
        }
        sql = sql.slice(0, -2) + ' WHERE id = ?';
        params.push(id);

        const [result] = await pool.execute(sql, params);
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Category not found or no changes made' });
        }
        res.json({ message: 'Category updated successfully' });
    } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') {
             return res.status(409).json({ message: 'Category name already exists' });
         }
        console.error("Error updating category:", error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

// Nhiệm vụ 2: Xóa thể loại (Thủ thư)
exports.deleteCategory = async (req, res) => {
    const { id } = req.params;
    try {
        // Quan trọng: Kiểm tra xem có sách nào thuộc thể loại này không
        const [books] = await pool.execute('SELECT id FROM Books WHERE category_id = ? LIMIT 1', [id]);
        if (books.length > 0) {
            return res.status(409).json({ message: 'Cannot delete category because it contains books. Please reassign books first.' });
        }

        const sql = 'DELETE FROM Categories WHERE id = ?';
        const [result] = await pool.execute(sql, [id]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Category not found' });
        }
        res.status(200).json({ message: 'Category deleted successfully' });
    } catch (error) {
        console.error("Error deleting category:", error);
        res.status(500).json({ message: 'Internal server error' });
    }
};