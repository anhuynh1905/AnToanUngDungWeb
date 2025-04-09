import React, { useState, useEffect } from 'react';
// Import API function để lấy categories (component này tự fetch)
import { getCategories } from '../services/api';

/**
 * Component BookForm dùng để tạo hoặc chỉnh sửa thông tin sách.
 * Nó tự fetch danh sách categories để cung cấp gợi ý và xác thực tên category.
 *
 * Props:
 * - book: Object chứa dữ liệu sách cần chỉnh sửa (nếu là null hoặc undefined, form ở chế độ thêm mới).
 * - onSubmit: Hàm callback được gọi khi form được submit thành công với payload dữ liệu hợp lệ.
 * - onCancel: Hàm callback được gọi khi nhấn nút "Cancel Edit" (chỉ hiển thị ở chế độ edit).
 * - loading: Boolean cho biết trạng thái loading của việc submit form (từ component cha).
 * - error: String chứa thông báo lỗi từ lần submit API trước đó (từ component cha).
 */
function BookForm({ book, onSubmit, onCancel, loading, error: submissionError }) {
    // --- State cho dữ liệu các trường trong form ---
    const [formData, setFormData] = useState({
        title: '',
        author: '',
        isbn: '',
        publish_year: '',
        publisher: '',
        category_name: '', // Sử dụng tên category để người dùng nhập liệu
        description: '',
        quantity: 0,
        price: 0.00,
    });

    // State cho lỗi validation riêng của form này (ví dụ: category không tồn tại)
    const [formValidationError, setFormValidationError] = useState('');

    // --- State và Logic Fetch Categories bên trong BookForm ---
    const [internalCategories, setInternalCategories] = useState([]); // Danh sách categories lấy từ API
    const [categoryLoading, setCategoryLoading] = useState(true); // Trạng thái loading categories
    const [categoryError, setCategoryError] = useState(''); // Lỗi khi fetch categories

    // Sử dụng useEffect để fetch categories khi component mount lần đầu
    useEffect(() => {
        const fetchCategories = async () => {
            console.log("BookForm: Fetching categories...");
            setCategoryLoading(true);
            setCategoryError('');
            try {
                const response = await getCategories();
                setInternalCategories(response.data || []); // Lưu vào state nội bộ
                console.log("BookForm: Categories fetched successfully", response.data?.length || 0);
            } catch (err) {
                console.error("BookForm: Failed to fetch categories", err);
                setCategoryError("Error: Could not load category list.");
                // Có thể thêm xử lý lỗi xác thực nếu API /categories yêu cầu login
            } finally {
                setCategoryLoading(false); // Kết thúc loading
            }
        };
        fetchCategories();
    }, []); // Mảng dependency rỗng -> chạy 1 lần

    // --- Effect để cập nhật form data khi 'book' hoặc 'internalCategories' thay đổi ---
    // Dùng để điền dữ liệu khi vào chế độ Edit
    useEffect(() => {
        setFormValidationError(''); // Xóa lỗi validation cũ khi dữ liệu đầu vào thay đổi

        // Chỉ thực hiện nếu không đang load categories VÀ danh sách categories đã có
        // Hoặc khi đang ở chế độ thêm mới (!book)
        if (!categoryLoading || !book) {
            if (book) { // Chế độ Edit
                 // Tìm category tương ứng trong danh sách đã fetch
                const category = internalCategories.find(cat => cat.id === book.category_id);
                console.log(`BookForm: Updating form for editing book ID ${book.id}. Found category:`, category);
                setFormData({
                    title: book.title || '',
                    author: book.author || '',
                    isbn: book.isbn || '',
                    publish_year: book.publish_year || '',
                    publisher: book.publisher || '',
                    category_name: category ? category.name : '', // <<< Đặt tên category nếu tìm thấy
                    description: book.description || '',
                    quantity: book.quantity ?? 0, // Xử lý null/undefined về 0
                    price: book.price ?? 0.00,   // Xử lý null/undefined về 0.00
                });
            } else { // Chế độ Thêm mới
                console.log("BookForm: Resetting form for adding new book.");
                // Reset form về trạng thái trống
                setFormData({
                    title: '', author: '', isbn: '', publish_year: '', publisher: '',
                    category_name: '', description: '', quantity: 0, price: 0.00,
                });
            }
        }
    }, [book, internalCategories, categoryLoading]); // Dependencies: book, danh sách categories, trạng thái loading categories

    // --- Hàm xử lý khi giá trị input thay đổi ---
    const handleChange = (e) => {
        const { name, value, type } = e.target;
        setFormData(prev => ({
            ...prev,
            // Chuyển đổi sang số nếu là type number, giữ lại chuỗi rỗng nếu người dùng xóa
            [name]: type === 'number' ? (value === '' ? '' : Number(value)) : value
        }));
        // Xóa lỗi validation khi người dùng bắt đầu nhập lại
        if (formValidationError) {
            setFormValidationError('');
        }
    };

    // --- Hàm xử lý khi form được submit ---
    const handleSubmit = (e) => {
        e.preventDefault(); // Ngăn chặn hành vi submit mặc định của form
        setFormValidationError(''); // Xóa lỗi validation cũ
        console.log("BookForm: Submit button clicked. Current formData:", formData);

        // --- Bước 1: Validation cơ bản phía Client ---
        if (!formData.title || !formData.category_name || formData.quantity === '' || formData.price === '') {
            setFormValidationError('Validation Error: Please fill in Title, Category Name, Quantity, and Price.');
            console.error("BookForm Validation Failed: Missing required fields.");
            return; // Dừng lại
        }
         if (isNaN(formData.quantity) || formData.quantity < 0) {
             setFormValidationError('Validation Error: Quantity must be a non-negative number.');
              console.error("BookForm Validation Failed: Invalid quantity.");
             return;
         }
          if (isNaN(formData.price) || formData.price < 0) {
             setFormValidationError('Validation Error: Price must be a non-negative number.');
             console.error("BookForm Validation Failed: Invalid price.");
             return;
         }
        // Có thể thêm validation cho publish_year nếu muốn (vd: phải là số có 4 chữ số)

        // --- Bước 2: Tìm ID của Category dựa trên Tên đã nhập ---
        const categoryNameInput = formData.category_name.trim(); // Lấy tên category và loại bỏ khoảng trắng thừa
        console.log(`BookForm: Searching for category ID for name "${categoryNameInput}"`);
        // Tìm trong danh sách categories đã fetch (không phân biệt hoa thường)
        const foundCategory = internalCategories.find(
            cat => cat.name.trim().toLowerCase() === categoryNameInput.toLowerCase()
        );

        // Nếu không tìm thấy category hợp lệ
        if (!foundCategory) {
            setFormValidationError(`Validation Error: Category "${categoryNameInput}" not found. Please select from suggestions or ensure the category exists.`);
             console.error("BookForm Validation Failed: Category not found.");
            return; // Dừng submit
        }

        // Lấy ID nếu tìm thấy
        const categoryId = foundCategory.id;
        console.log(`BookForm: Found Category ID: ${categoryId}`);

        // --- Bước 3: Chuẩn bị dữ liệu (Payload) để gửi lên API ---
        // Tạo object mới chỉ chứa các trường mà API backend mong đợi
        const payload = {
            title: formData.title.trim(), // Gửi dữ liệu đã trim
            author: formData.author.trim() || null, // Gửi null nếu trống
            isbn: formData.isbn.trim() || null,
            publish_year: formData.publish_year ? Number(formData.publish_year) : null, // Đảm bảo là số hoặc null
            publisher: formData.publisher.trim() || null,
            category_id: categoryId, // <<< Gửi category ID đã tìm được
            description: formData.description.trim() || null,
            quantity: Number(formData.quantity), // Đảm bảo là số
            price: Number(formData.price),       // Đảm bảo là số
        };

        console.log('BookForm: Prepared payload for submission:', payload);

        // --- Bước 4: Gọi hàm onSubmit được truyền từ component cha ---
        // Truyền payload đã chuẩn bị cho component cha (BookManagementPage) xử lý việc gọi API
        onSubmit(payload);
    };

    // --- Render JSX ---
    return (
        <form onSubmit={handleSubmit} style={{ marginBottom: '20px', padding: '15px', border: '1px solid #eee', borderRadius: '5px' }}>
            {/* Tiêu đề form thay đổi tùy theo chế độ Add/Edit */}
            <h3>{book ? 'Edit Book Information' : 'Add New Book'}</h3>

            {/* Hiển thị lỗi validation của form này (nếu có) */}
            {formValidationError && <p className="error-message">{formValidationError}</p>}
            {/* Hiển thị lỗi từ API submission (được truyền từ cha qua prop 'error') */}
            {submissionError && <p className="error-message">{submissionError}</p>}

            {/* Grid layout cho các input */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px' }}>
                {/* Title */}
                <div>
                    <label htmlFor="book-title">Title:</label>
                    <input id="book-title" type="text" name="title" value={formData.title} onChange={handleChange} required disabled={loading} />
                </div>
                {/* Author */}
                <div>
                    <label htmlFor="book-author">Author:</label>
                    <input id="book-author" type="text" name="author" value={formData.author} onChange={handleChange} disabled={loading} />
                </div>
                {/* Category Name */}
                <div>
                    <label htmlFor="book-category">Category Name:</label>
                    <input
                        id="book-category"
                        type="text"
                        name="category_name"
                        value={formData.category_name}
                        onChange={handleChange}
                        required
                        // Disable khi đang submit form HOẶC đang load categories
                        disabled={loading || categoryLoading}
                        placeholder="Enter existing category name"
                        list="category-suggestions" // Liên kết với datalist gợi ý
                        aria-describedby="category-help" // Mô tả trợ giúp
                    />
                    {/* Datalist để gợi ý dựa trên internalCategories */}
                    <datalist id="category-suggestions">
                        {internalCategories.map(cat => (
                            <option key={cat.id} value={cat.name} />
                        ))}
                    </datalist>
                    {/* Hiển thị trạng thái loading/error của categories */}
                    {categoryLoading && <small style={{ display: 'block', marginTop: '3px', color: 'orange' }}> Loading categories...</small>}
                    {!categoryLoading && categoryError && <small style={{ display: 'block', marginTop: '3px', color: 'red' }}> {categoryError}</small>}
                    {!categoryLoading && !categoryError && internalCategories.length === 0 && <small style={{ display: 'block', marginTop: '3px', color: 'red' }}> No categories loaded.</small>}
                    <small id="category-help" style={{display: 'block', marginTop: '3px', color: '#555'}}>
                        (Type to search, must match an existing category name)
                     </small>
                </div>
                {/* Quantity */}
                 <div>
                    <label htmlFor="book-quantity">Quantity:</label>
                    <input id="book-quantity" type="number" name="quantity" value={formData.quantity} onChange={handleChange} required min="0" step="1" disabled={loading} />
                </div>
                {/* Price */}
                 <div>
                    <label htmlFor="book-price">Price:</label>
                    <input id="book-price" type="number" name="price" value={formData.price} onChange={handleChange} required min="0" step="0.01" disabled={loading} />
                </div>
                {/* ISBN */}
                 <div>
                    <label htmlFor="book-isbn">ISBN:</label>
                    <input id="book-isbn" type="text" name="isbn" value={formData.isbn} onChange={handleChange} disabled={loading} />
                </div>
                {/* Publish Year */}
                <div>
                    <label htmlFor="book-publish-year">Publish Year:</label>
                    <input id="book-publish-year" type="number" name="publish_year" value={formData.publish_year} onChange={handleChange} placeholder="YYYY" disabled={loading} />
                </div>
                {/* Publisher */}
                 <div>
                    <label htmlFor="book-publisher">Publisher:</label>
                    <input id="book-publisher" type="text" name="publisher" value={formData.publisher} onChange={handleChange} disabled={loading} />
                </div>
                {/* Description (chiếm toàn bộ chiều rộng) */}
                <div style={{ gridColumn: '1 / -1' }}>
                    <label htmlFor="book-description">Description:</label>
                    <textarea id="book-description" name="description" value={formData.description} onChange={handleChange} rows="3" disabled={loading}></textarea>
                </div>
            </div>

            {/* Nút Submit và Cancel */}
            <div style={{ marginTop: '20px' }}>
                <button type="submit" disabled={loading || categoryLoading || !!categoryError}> {/* Disable nếu form submit loading HOẶC category loading/error */}
                    {loading ? 'Saving...' : (book ? 'Update Book' : 'Add Book')}
                </button>
                {/* Nút Cancel chỉ hiển thị khi ở chế độ Edit */}
                {book &&
                    <button
                        type="button"
                        className="secondary"
                        onClick={onCancel} // Gọi hàm onCancel từ props
                        disabled={loading} // Disable khi đang submit
                        style={{ marginLeft: '10px' }}
                    >
                        Cancel Edit
                    </button>
                }
            </div>
        </form>
    );
}

export default BookForm;