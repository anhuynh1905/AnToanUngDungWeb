import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

function Navbar() {
  const { isAuthenticated, logout, userRole, isLoading } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  // Logic kiểm tra vai trò (Đảm bảo so sánh chính xác chuỗi trả về từ backend)
  const isAdmin = userRole === 'Admin';
  const isLibrarian = userRole === 'Thủ thư'; // Kiểm tra cả vai trò Thủ thư
  const canManageBooks = isAdmin || isLibrarian;

  // Hiển thị loading nếu context chưa sẵn sàng
  if (isLoading) {
    return (
      <nav>
        <ul>
          <li>Loading Navigation...</li>
        </ul>
      </nav>
    );
  }

  // Log để kiểm tra giá trị khi render
  // console.log(`Navbar Render: Auth=${isAuthenticated}, Role=${userRole}, IsAdmin=${isAdmin}, CanManageBooks=${canManageBooks}`);

  return (
    <nav>
      <ul>
        <li><Link to="/books">Books</Link></li>

        {/* Phần hiển thị khi ĐÃ đăng nhập */}
        {isAuthenticated && (
          <>
            {/* Hiển thị link quản lý sách nếu là Admin hoặc Thủ thư */}
            {canManageBooks && (
              <li><Link to="/admin/books">Manage Books</Link></li>
            )}

            {/* Hiển thị link quản lý người dùng nếu là Admin */}
            {isAdmin && (
              <li><Link to="/admin/users">Manage Users</Link></li>
            )}

            {/* Link phiếu mượn luôn hiển thị khi đã đăng nhập */}
            <li><Link to="/my-borrows">My Borrows</Link></li>

            {/* Nút Logout */}
            <li>
              <button onClick={handleLogout}>Logout</button>
            </li>
          </>
        )}

        {/* Phần hiển thị khi CHƯA đăng nhập */}
        {!isAuthenticated && (
          <>
            <li><Link to="/login">Login</Link></li>
            <li><Link to="/register">Register</Link></li>
          </>
        )}
      </ul>
    </nav>
  );
}

export default Navbar;