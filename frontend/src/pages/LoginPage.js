import React, { useState } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { loginUser } from '../services/api';
import { useAuth } from '../contexts/AuthContext'; // Import useAuth

function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false); // Thêm trạng thái loading
  const navigate = useNavigate();
  const location = useLocation(); // Lấy thông tin vị trí (nếu bị redirect tới đây)
  const { login } = useAuth(); // Lấy hàm login từ context

  // Xác định trang sẽ chuyển hướng đến sau khi login thành công
  // Ưu tiên trang người dùng định đến trước khi bị redirect, mặc định là /books
  const from = location.state?.from?.pathname || "/books";

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true); // Bắt đầu loading
    try {
      try {
        console.log('Calling API...'); // Log 1
        const response = await loginUser({ username, password });
        console.log('API Response Data:', response.data); // Log 2 <<< QUAN TRỌNG
        console.log('Attempting to call context login...'); // Log 3
        login(response.data); // Gọi context login
        console.log('Context login called.'); // Log 4
        navigate(from, { replace: true });
      } catch (err) {
         console.error("Login Page Error:", err); // Log 5 <<< Log lỗi chi tiết
         // ... xử lý lỗi khác ...
      }
    } catch (err) {
      console.error("Login failed:", err.response?.data?.message || err.message);
      setError(err.response?.data?.message || 'Login failed. Please check credentials.');
      setLoading(false); // Dừng loading nếu có lỗi
    }
    // Không cần setLoading(false) nếu thành công vì đã navigate đi chỗ khác
  };

  return (
    <div className="container">
      <h2>Login</h2>
      <form onSubmit={handleSubmit}>
        <div>
          <label>Username:</label>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            disabled={loading} // Disable input khi đang loading
          />
        </div>
        <div>
          <label>Password:</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            disabled={loading} // Disable input khi đang loading
          />
        </div>
        {error && <p className="error-message">{error}</p>}
        <button type="submit" disabled={loading}>
            {loading ? 'Logging in...' : 'Login'}
        </button>
      </form>
      <p>Don't have an account? <Link to="/register">Register here</Link></p>
    </div>
  );
}

export default LoginPage;