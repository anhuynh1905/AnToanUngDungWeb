import React, { useState, useEffect, useMemo, useCallback } from 'react'; // Thêm useCallback
import { getBooks } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

// Nhận props từ App.js (nếu có, ví dụ: cho chức năng chọn sách mượn)
function BookListPage({ borrowSelection = [], onSelectBook = () => {} }) { // Cung cấp giá trị mặc định
  const [allBooks, setAllBooks] = useState([]); // Lưu trữ tất cả sách từ API
  const [loading, setLoading] = useState(true); // Trạng thái loading ban đầu
  const [error, setError] = useState('');     // Thông báo lỗi
  const { logout } = useAuth();               // Lấy hàm logout

  // State cho chức năng tìm kiếm
  const [searchQuery, setSearchQuery] = useState(''); // Nội dung ô tìm kiếm

  // --- Hàm Fetch Sách ---
  // Sử dụng useCallback để tránh tạo lại hàm không cần thiết
  const fetchBooks = useCallback(async () => {
    console.log("BookListPage: Fetching books...");
    setLoading(true); // Bắt đầu loading
    setError('');     // Xóa lỗi cũ
    try {
      const response = await getBooks();
      console.log("BookListPage: API Response Data:", response.data); // LOG: Xem dữ liệu thô

      // Kiểm tra dữ liệu trả về có phải là mảng không
      if (Array.isArray(response.data)) {
        setAllBooks(response.data); // Cập nhật state với danh sách sách
        console.log("BookListPage: State 'allBooks' updated with", response.data.length, "items.");
      } else {
        // Nếu API không trả về mảng
        console.error("BookListPage: API did not return an array:", response.data);
        setAllBooks([]); // Đặt thành mảng rỗng
        setError("Received invalid data format from the server.");
      }
    } catch (err) {
      console.error("BookListPage: Failed to fetch books:", err);
      setAllBooks([]); // Đặt thành mảng rỗng khi có lỗi

      // Xử lý lỗi xác thực hoặc lỗi mạng/server
      if (err.response && (err.response.status === 401 || err.response.status === 403)) {
        setError('Your session may have expired or access denied. Please log in again.');
        // Cân nhắc tự động logout hoặc chuyển hướng
        // setTimeout(logout, 3000);
      } else {
        setError('Failed to load books. Please try refreshing the page.');
      }
    } finally {
      setLoading(false); // <<< Luôn kết thúc loading
      console.log("BookListPage: Fetching books finished. Loading:", false);
    }
  }, [logout]); // logout là dependency của useCallback này

  // Gọi fetchBooks khi component được mount lần đầu
  useEffect(() => {
    fetchBooks();
  }, [fetchBooks]); // Dependency là hàm fetchBooks đã được bọc bởi useCallback

  // --- Hàm Xử lý Input Tìm kiếm ---
  const handleSearchChange = (event) => {
    setSearchQuery(event.target.value);
  };

  // --- Logic Lọc Sách (Client-side) ---
  // Sử dụng useMemo để tối ưu, chỉ tính toán lại khi cần
  const filteredBooks = useMemo(() => {
    // Log khi bắt đầu lọc
    // console.log("Filtering books. Query:", searchQuery, "Total books:", allBooks.length);

    if (!searchQuery) {
      return allBooks; // Trả về tất cả nếu không tìm kiếm
    }
    const lowerCaseQuery = searchQuery.toLowerCase().trim(); // Chuẩn hóa query
    if (!lowerCaseQuery) return allBooks; // Trả về tất cả nếu query chỉ là khoảng trắng

    const results = allBooks.filter(book =>
      (book.title && book.title.toLowerCase().includes(lowerCaseQuery)) ||
      (book.author && book.author.toLowerCase().includes(lowerCaseQuery)) ||
      (book.isbn && book.isbn.includes(lowerCaseQuery)) // Tìm cả theo ISBN nếu muốn
    );
    // console.log("Filtering results:", results.length);
    return results;
  }, [allBooks, searchQuery]); // Dependencies là danh sách sách gốc và query

  // --- Hàm kiểm tra sách đã được chọn để mượn chưa ---
  const isBookSelected = useCallback((bookId) => {
      // Kiểm tra xem borrowSelection có tồn tại và là mảng không trước khi dùng .some
      return Array.isArray(borrowSelection) && borrowSelection.some(item => item.id === bookId);
  }, [borrowSelection]); // Phụ thuộc vào borrowSelection


  // --- Log trạng thái trước khi render ---
  console.log(`BookListPage Rendering - Loading: ${loading}, Error: ${error ? `"${error}"` : 'None'}, Filtered Books: ${filteredBooks?.length}, All Books: ${allBooks?.length}`);


  // --- UI Rendering ---

  // Trường hợp 1: Đang loading
  if (loading) {
      return <div className="loading">Loading books... Please wait.</div>;
  }

  // Trường hợp 2: Có lỗi xảy ra khi fetch
  if (error) {
      return (
          <div className="container">
              <h2>Available Books</h2>
              <p className="error-message">{error}</p>
              <button onClick={fetchBooks}>Try Again</button> {/* Nút thử lại */}
          </div>
       );
   }

  // Trường hợp 3: Render bình thường
  return (
    <div className="container">
      <h2>Available Books</h2>

      {/* --- Thanh Tìm kiếm --- */}
      <div style={{ marginBottom: '20px' }}>
        <input
          type="text"
          placeholder="Search by title, author, or ISBN..."
          value={searchQuery}
          onChange={handleSearchChange}
          style={{ padding: '10px', width: 'calc(100% - 22px)', border: '1px solid #ccc', borderRadius: '4px', fontSize: '1em' }}
        />
      </div>

      {/* --- Danh sách Sách (đã lọc) --- */}
      {/* Kiểm tra filteredBooks có phải là mảng và có phần tử không */}
      {Array.isArray(filteredBooks) && filteredBooks.length > 0 ? (
        <ul>
          {/* Lặp qua danh sách đã lọc */}
          {filteredBooks.map((book) => {
            // console.log("Mapping book:", book.id); // Log để xem có đang map không
            const isSelected = isBookSelected(book.id);
            const isOutOfStock = book.quantity <= 0;
            return (
              <li key={book.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px' }}>
                {/* Thông tin sách */}
                <div className="book-info" style={{ flexGrow: 1 }}>
                  <strong>{book.title || 'No Title'}</strong> by {book.author || 'N/A'}
                  <br/>
                  <small>
                    ISBN: {book.isbn || 'N/A'} |
                    Qty: {book.quantity} |
                    Category: {book.category_name || 'N/A'} |
                    Price: {book.price != null ? `$${Number(book.price).toFixed(2)}` : 'N/A'}
                  </small>
                </div>

                {/* Nút Chọn Sách để Mượn */}
                <div className="book-actions">
                  <button
                      onClick={() => {
                          console.log("Select Book button clicked for:", book.id);
                          onSelectBook(book); // Gọi hàm được truyền từ App.js
                      }}
                      // Disable nếu đã chọn HOẶC hết hàng
                      disabled={isSelected || isOutOfStock}
                      title={isOutOfStock ? "This book is out of stock" : (isSelected ? "Book already in your selection" : "Select this book for borrowing")}
                      // Thay đổi class hoặc style nếu cần dựa trên trạng thái
                      className={isSelected ? 'secondary' : (isOutOfStock ? 'disabled-stock' : '')}
                  >
                      {isSelected ? 'Selected' : (isOutOfStock ? 'Out of Stock' : 'Select Book')}
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      ) : (
        // Thông báo nếu không có sách nào (hoặc không khớp tìm kiếm)
        <p>
          {searchQuery
            ? `No books found matching "${searchQuery}". Try a different search term.`
            : "No books are currently available in the library."}
        </p>
      )}

      {/* CSS cục bộ nếu cần */}
      <style jsx>{`
            .book-actions button {
                padding: 5px 10px;
                font-size: 0.9em;
                white-space: nowrap; /* Ngăn nút bị xuống dòng */
            }
            button.disabled-stock { /* Style cho nút khi hết hàng */
                 background-color: #eee;
                 color: #999;
                 cursor: not-allowed;
                 border: 1px solid #ddd;
            }
            /* Thêm style khác nếu cần */
       `}</style>
    </div>
  );
}

export default BookListPage;