// src/App.js

import React, { useState } from 'react'; // <<< Thêm useState
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate
} from 'react-router-dom';

import { AuthProvider, useAuth } from './contexts/AuthContext';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import BookListPage from './pages/BookListPage';
import MyBorrowsPage from './pages/MyBorrowsPage';
import AdminUserPage from './pages/AdminUserPage';
import BookManagementPage from './pages/BookManagementPage';
import './index.css';

function AppRoutes() {
  const { isAuthenticated, isLoading, userRole } = useAuth();

  // --- State quản lý sách được chọn để mượn ---
  const [borrowSelection, setBorrowSelection] = useState([]); // Mảng chứa các object sách {id, title}

  // Hàm thêm sách vào danh sách chọn
  const addToBorrowSelection = (book) => {
      // Kiểm tra trùng lặp
      if (!borrowSelection.find(item => item.id === book.id)) {
          setBorrowSelection(prevSelection => [...prevSelection, { id: book.id, title: book.title }]);
          alert(`"${book.title}" added to borrow selection.`);
          console.log("Borrow Selection - Added:", book.id, "Current:", [...borrowSelection, { id: book.id, title: book.title }]);
      } else {
          alert(`"${book.title}" is already in your selection.`);
      }
  };

  // Hàm xóa sách khỏi danh sách chọn
  const removeFromBorrowSelection = (bookId) => {
       setBorrowSelection(prevSelection => prevSelection.filter(item => item.id !== bookId));
       console.log("Borrow Selection - Removed:", bookId, "Remaining:", borrowSelection.filter(item => item.id !== bookId));
  };

  // Hàm xóa toàn bộ lựa chọn
  const clearBorrowSelection = () => {
      setBorrowSelection([]);
      console.log("Borrow Selection - Cleared");
  };
  // ----------------------------------------------

  if (isLoading) {
    return <div className="loading">Initializing Application...</div>;
  }

  return (
    <>
      {/* Navbar không cần truyền props liên quan đến borrowSelection */}
      <Navbar />
      <div className="app-content">
        <Routes>
          {/* --- Public Routes --- */}
          <Route
            path="/login"
            element={!isAuthenticated ? <LoginPage /> : <Navigate to="/books" replace />}
          />
          <Route
            path="/register"
            element={!isAuthenticated ? <RegisterPage /> : <Navigate to="/books" replace />}
          />

          {/* --- Protected Routes --- */}
          <Route
            path="/books"
            element={
              <ProtectedRoute>
                {/* Truyền hàm thêm sách vào BookListPage */}
                <BookListPage
                    borrowSelection={borrowSelection}
                    onSelectBook={addToBorrowSelection}
                />
              </ProtectedRoute>
            }
          />
          <Route
            path="/my-borrows"
            element={
              <ProtectedRoute>
                {/* Truyền danh sách chọn và các hàm quản lý xuống MyBorrowsPage */}
                <MyBorrowsPage
                  borrowSelection={borrowSelection}
                  onRemoveBook={removeFromBorrowSelection}
                  onClearSelection={clearBorrowSelection}
                  // Thêm một prop để reload danh sách phiếu mượn khi cần
                  // (Sẽ được gọi bên trong MyBorrowsPage sau khi tạo phiếu thành công)
                />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/users"
            element={
              <ProtectedRoute requiredRole="Admin">
                <AdminUserPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/books"
            element={
              <ProtectedRoute requiredRole={['Admin', 'Thủ thư']}>
                <BookManagementPage />
              </ProtectedRoute>
            }
          />

          {/* --- Default & Fallback Routes --- */}
          <Route
            path="/"
            element={<Navigate to={isAuthenticated ? "/books" : "/login"} replace />}
          />
          <Route path="*" element={ / ... 404 Not Found ... / } />
        </Routes>
      </div>
    </>
  );
}

// Component App chính không đổi
function App() {
  return (
    <AuthProvider>
      <Router>
        <AppRoutes />
      </Router>
    </AuthProvider>
  );
}

export default App;