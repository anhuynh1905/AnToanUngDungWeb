-- schema.sql

CREATE TABLE IF NOT EXISTS Roles (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    -- Quyền lưu dưới dạng số nguyên lớn (BIGINT) để chứa bitmask 64 bit
    permissions BIGINT UNSIGNED NOT NULL DEFAULT 0,
    description TEXT NULL
);

CREATE TABLE IF NOT EXISTS Members (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL, -- Đủ dài cho bcrypt hash
    role_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (role_id) REFERENCES Roles(id)
    -- Có thể thêm ON DELETE RESTRICT hoặc ON DELETE SET NULL tùy theo logic nghiệp vụ
);

CREATE TABLE IF NOT EXISTS Categories (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    description TEXT NULL
);

CREATE TABLE IF NOT EXISTS Books (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    author VARCHAR(255) NULL,
    isbn VARCHAR(20) NULL UNIQUE, -- ISBN có thể là 10 hoặc 13 ký tự
    publish_year INT NULL,
    publisher VARCHAR(255) NULL,
    category_id INT NULL, -- Cho phép NULL nếu sách chưa phân loại, hoặc dùng Foreign Key
    description TEXT NULL,
    quantity INT UNSIGNED NOT NULL DEFAULT 0, -- Số lượng sách trong kho
    price DECIMAL(10, 2) NULL, -- Giá sách (ví dụ)
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (category_id) REFERENCES Categories(id) ON DELETE SET NULL -- Nếu xóa category thì sách không bị xóa theo
    -- Thêm index cho các cột thường dùng để tìm kiếm: title, author, isbn
    -- INDEX idx_book_title (title),
    -- INDEX idx_book_author (author)
);

CREATE TABLE IF NOT EXISTS BorrowingSlips (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    status ENUM('draft', 'submitted', 'approved', 'rejected', 'borrowed', 'returned', 'overdue') NOT NULL DEFAULT 'draft',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    submitted_at TIMESTAMP NULL, -- Thời điểm gửi phiếu
    approved_at TIMESTAMP NULL, -- Thời điểm duyệt phiếu
    borrowed_at TIMESTAMP NULL, -- Thời điểm nhận sách
    due_date DATE NULL,         -- Hạn trả sách
    returned_at TIMESTAMP NULL, -- Thời điểm trả sách
    notes TEXT NULL,            -- Ghi chú (nếu có)
    FOREIGN KEY (user_id) REFERENCES Members(id) ON DELETE RESTRICT -- Không cho xóa user nếu còn phiếu mượn
);

CREATE TABLE IF NOT EXISTS BorrowingSlipItems (
    id INT AUTO_INCREMENT PRIMARY KEY,
    slip_id INT NOT NULL,
    book_id INT NOT NULL,
    -- Có thể thêm số lượng nếu cho mượn nhiều hơn 1 cuốn cùng loại
    -- quantity INT UNSIGNED NOT NULL DEFAULT 1,
    FOREIGN KEY (slip_id) REFERENCES BorrowingSlips(id) ON DELETE CASCADE, -- Nếu xóa phiếu thì xóa các item theo
    FOREIGN KEY (book_id) REFERENCES Books(id) ON DELETE RESTRICT, -- Không cho xóa sách nếu đang có trong phiếu mượn nào đó
    UNIQUE KEY unique_slip_book (slip_id, book_id) -- Đảm bảo mỗi sách chỉ có 1 dòng trong 1 phiếu
);

-- (Tùy chọn) Chèn dữ liệu ban đầu cho Roles
-- INSERT INTO Roles (name, permissions, description) VALUES
-- ('Admin', 2147483647, 'Quản trị viên hệ thống'), -- Ví dụ: tất cả quyền (tùy bitmask của bạn)
-- ('Thủ thư', 14, 'Quản lý sách và thể loại'), -- Ví dụ: MANAGE_BOOKS (2) | MANAGE_CATEGORIES (4) | VIEW_BOOKS (8) = 14
-- ('Sinh viên', 24, 'Xem sách và quản lý phiếu mượn cá nhân'); -- Ví dụ: VIEW_BOOKS (8) | MANAGE_OWN_BORROWING_SLIPS (16) = 24
