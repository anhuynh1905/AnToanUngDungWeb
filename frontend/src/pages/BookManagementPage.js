import React, { useState, useEffect, useCallback } from 'react';
// Import API functions (KHÔNG cần getCategories ở đây nữa)
import { getBooks, createBook, updateBook, deleteBook } from '../services/api';
// Import Auth context hook
import { useAuth } from '../contexts/AuthContext';
// Import the updated BookForm component (đảm bảo đường dẫn đúng)
import BookForm from '../components/BookForm'; // Giả sử bạn đặt BookForm trong thư mục components

function BookManagementPage() {
    // State for data lists
    const [books, setBooks] = useState([]); // Chỉ cần state cho books

    // State for UI control
    const [loading, setLoading] = useState(true); // Loading dữ liệu ban đầu
    const [error, setError] = useState(''); // Lỗi chung của trang (fetch, delete)
    const { logout } = useAuth(); // Lấy hàm logout từ context

    // State related to the BookForm
    const [editingBook, setEditingBook] = useState(null); // Sách đang được sửa (null = thêm mới)
    const [showForm, setShowForm] = useState(false);    // Ẩn/hiện form
    const [formLoading, setFormLoading] = useState(false); // Loading khi submit form
    const [formError, setFormError] = useState('');   // Lỗi trả về từ API khi submit form

    // State for delete button loading indicator
    const [deleteLoading, setDeleteLoading] = useState(null); // ID sách đang được xóa


    // --- Fetch initial data (CHỈ fetch books) ---
    const fetchData = useCallback(async () => {
        setLoading(true);
        setError('');
        console.log("BookManagementPage: Fetching books...");
        try {
            // Chỉ cần gọi getBooks
            const booksResponse = await getBooks();
            setBooks(booksResponse.data || []); // Đảm bảo books là mảng
            console.log("BookManagementPage: Books fetched successfully.", booksResponse.data);
        } catch (err) {
            console.error("BookManagementPage: Failed to fetch books:", err);
             if (err.response && (err.response.status === 401 || err.response.status === 403)) {
                setError('Access denied or session expired. Please log in with appropriate permissions.');
                // Cân nhắc gọi logout hoặc chuyển hướng người dùng ở đây
                // setTimeout(logout, 3000);
             } else {
                 setError('Failed to load book data. Please try refreshing the page.');
             }
        } finally {
            setLoading(false);
        }
    }, [logout]); // logout là dependency nếu bạn dùng nó trong catch

    // Fetch data khi component mount lần đầu
    useEffect(() => {
        fetchData();
    }, [fetchData]);

    // --- Form Visibility Handlers ---
    const handleShowAddForm = () => {
        setEditingBook(null); // Đảm bảo form ở chế độ thêm mới
        setShowForm(true);
        setFormError(''); // Xóa lỗi form cũ
        window.scrollTo(0, 0); // Cuộn lên đầu để thấy form
    };

    const handleEditClick = (book) => {
        console.log("BookManagementPage: Editing book:", book);
        setEditingBook(book); // Đặt sách cần sửa
        setShowForm(true);
        setFormError('');
        window.scrollTo(0, 0);
    };

    const handleCancelEdit = () => {
        setEditingBook(null);
        setShowForm(false);
        setFormError('');
        console.log("BookManagementPage: Cancelled edit.");
    };

    // --- Form Submission Handler ---
    // Nhận 'payload' đã được chuẩn bị bởi BookForm (chứa category_id)
    const handleFormSubmit = async (payload) => {
        setFormLoading(true);
        setFormError('');
        console.log(`BookManagementPage: Submitting form data (Edit mode: ${!!editingBook})`, payload);
        try {
            let message = '';
            if (editingBook) {
                // --- Update ---
                console.log(`BookManagementPage: Calling updateBook API for ID: ${editingBook.id}`);
                await updateBook(editingBook.id, payload);
                message = 'Book updated successfully!';
            } else {
                // --- Create ---
                console.log(`BookManagementPage: Calling createBook API`);
                await createBook(payload);
                message = 'Book created successfully!';
            }
            alert(message); // Thông báo thành công
            // Reset UI và tải lại dữ liệu
            setShowForm(false);
            setEditingBook(null);
            fetchData(); // Gọi lại fetchData để cập nhật danh sách
        } catch (err) {
            console.error(`BookManagementPage: Failed to ${editingBook ? 'update' : 'create'} book:`, err);
            // Hiển thị lỗi từ API
            setFormError(err.response?.data?.message || `An error occurred while ${editingBook ? 'updating' : 'creating'} the book.`);
        } finally {
            setFormLoading(false); // Kết thúc loading form
        }
    };

     // --- Delete Handler ---
    const handleDeleteBook = async (bookId, bookTitle) => {
        setDeleteLoading(bookId); // Bắt đầu loading cho nút delete này
        setError(''); // Xóa lỗi chung cũ
        console.log(`BookManagementPage: Attempting to delete book ID: ${bookId}, Title: ${bookTitle}`);

        // Xác nhận người dùng
        if (!window.confirm(`Are you sure you want to delete this category ? This action cannot be undone.`)) {
            setDeleteLoading(null); // Hủy loading nếu người dùng cancel
            console.log("BookManagementPage: Delete cancelled by user.");
            return;
        }

        try {
            await deleteBook(bookId); // Gọi API delete
            alert(`Book "${bookTitle}" deleted successfully!`);
            fetchData(); // Tải lại danh sách sách sau khi xóa
        } catch (err) {
             console.error(`BookManagementPage: Failed to delete book ID ${bookId}:`, err);
             // Xử lý lỗi cụ thể (ví dụ: conflict do sách đang được mượn)
             if (err.response && err.response.status === 409) {
                  setError(err.response.data.message || `Cannot delete "${bookTitle}" as it might be referenced elsewhere (e.g., in active borrows).`);
             } else {
                  // Lỗi chung khác
                  setError(err.response?.data?.message || `Failed to delete book "${bookTitle}". Please try again.`);
             }
        } finally {
            setDeleteLoading(null); // Kết thúc loading cho nút delete này
        }
    };


    // --- UI Rendering ---
    // Hiển thị loading nếu dữ liệu ban đầu chưa sẵn sàng
    if (loading) return <div className="loading">Loading Book Data...</div>;

    return (
        <div className="container">
            <h2>Book Management</h2>
            {/* Hiển thị lỗi fetch hoặc delete (nếu có) */}
            {error && <p className="error-message">{error}</p>}

            {/* Nút để mở form thêm mới, chỉ hiển thị khi form đang ẩn */}
            {!showForm && (
                 <button onClick={handleShowAddForm} style={{ marginBottom: '20px' }}>+ Add New Book</button>
            )}

            {/* Component BookForm: hiển thị khi showForm là true */}
            {/* Truyền các props cần thiết:
                - book: dữ liệu sách đang sửa (null nếu thêm mới)
                - onSubmit: hàm xử lý khi form submit (đã bao gồm payload chuẩn)
                - onCancel: hàm xử lý khi hủy edit
                - loading: trạng thái loading của việc submit form
                - error: lỗi trả về từ API khi submit form trước đó
                - KHÔNG truyền prop 'categories' nữa
            */}
            {showForm && (
                <BookForm
                    book={editingBook}
                    onSubmit={handleFormSubmit}
                    onCancel={handleCancelEdit}
                    loading={formLoading}
                    error={formError}
                 />
            )}

            {/* --- Danh sách Sách hiện có --- */}
            <h3>Existing Books</h3>
            {books.length === 0 && !loading ? (
                <p>No books found. Use the button above to add one!</p>
            ) : (
                <table>
                    {/* Phần đầu bảng */}
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Title</th>
                            <th>Author</th>
                            <th>Category</th>
                            <th>Qty</th>
                            <th>Price</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    {/* Phần thân bảng */}
                    <tbody>
                        {/* Lặp qua danh sách sách */}
                        {books.map(book => (
                            <tr key={book.id}>
                                <td>{book.id}</td>
                                <td>{book.title}</td>
                                <td>{book.author || 'N/A'}</td>
                                {/* Giả định backend trả về category_name khi GET /books */}
                                <td>{book.category_name || 'N/A'}</td>
                                <td>{book.quantity}</td>
                                {/* Định dạng giá tiền */}
                                <td>{book.price != null ? `$${Number(book.price).toFixed(2)}` : 'N/A'}</td>
                                <td>
                                    {/* Nút Edit */}
                                    <button
                                        className="secondary"
                                        onClick={() => handleEditClick(book)}
                                        // Disable nút khi đang xóa sách này HOẶC đang submit form
                                        disabled={deleteLoading === book.id || formLoading}
                                        style={{ marginRight: '5px' }}
                                    >
                                        Edit
                                    </button>
                                    {/* Nút Delete */}
                                    <button
                                        className="danger"
                                        onClick={() => handleDeleteBook(book.id, book.title)}
                                        // Disable nút khi đang xóa sách này HOẶC đang submit form
                                        disabled={deleteLoading === book.id || formLoading}
                                    >
                                        {/* Hiển thị chữ khác khi đang loading delete */}
                                        {deleteLoading === book.id ? 'Deleting...' : 'Delete'}
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}
            {/* CSS cho bảng (giống như trước) */}
            <style jsx>{`
              table { width: 100%; border-collapse: collapse; margin-top: 15px; }
              th, td { border: 1px solid #ddd; padding: 8px; text-align: left; vertical-align: middle;}
              th { background-color: #f2f2f2; font-weight: bold; }
              tr:nth-child(even) { background-color: #f9f9f9; }
              td button { padding: 5px 10px; font-size: 0.9em;}
            `}</style>
        </div>
    );
}

export default BookManagementPage;