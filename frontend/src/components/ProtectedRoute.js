import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

function ProtectedRoute({ children }) {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation(); // Lấy vị trí hiện tại

  if (isLoading) {
    // Quan trọng: Hiển thị loading trong khi context đang kiểm tra auth
    return <div className="loading">Checking authentication...</div>;
  }

  if (!isAuthenticated) {
    // Nếu chưa đăng nhập, chuyển hướng về trang login
    // state={{ from: location }} lưu lại trang người dùng muốn truy cập
    // để có thể quay lại sau khi login thành công (nếu cần)
    console.log("ProtectedRoute: Not authenticated, redirecting to login.");
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Nếu đã đăng nhập, render component con được truyền vào
  return children;
}

export default ProtectedRoute;