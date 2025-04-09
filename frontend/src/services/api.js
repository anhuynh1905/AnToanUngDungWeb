import axios from 'axios';

// Đặt URL backend của bạn ở đây.
// Nếu bạn đặt nó trong .env, hãy đọc từ process.env.REACT_APP_API_URL
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000/api';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor để tự động thêm token vào các yêu cầu cần xác thực
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken');
    console.log('[Axios Interceptor] Checking for token. Found:', !!token); // Log xem có token không
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
      console.log('[Axios Interceptor] Token added to header for URL:', config.url); // Log URL được thêm token
    } else {
      console.log('[Axios Interceptor] No token found in localStorage for URL:', config.url);
    }
    return config;
  },
  (error) => {
    console.error('[Axios Interceptor] Request error:', error); // Log lỗi request interceptor
    return Promise.reject(error);
  }
);

// --- Hàm gọi API ---

// Auth
export const loginUser = (credentials) => apiClient.post('/auth/login', credentials);
export const registerUser = (userData) => apiClient.post('/auth/register', userData);
// Optional: Thêm hàm verify token nếu có endpoint /api/auth/verify hoặc /api/users/me

// Books
export const getBooks = () => apiClient.get('/books');
export const createBook = (bookData) => apiClient.post('/books', bookData);
export const updateBook = (bookId, bookData) => apiClient.put(`/books/${bookId}`, bookData);
export const deleteBook = (bookId) => apiClient.delete(`/books/${bookId}`);

// Categories (Cần cho dropdown)
export const getCategories = () => apiClient.get('/categories');

// Borrows
export const getMyBorrows = () => apiClient.get('/borrow/slips');
export const createBorrowSlip = (data = {}) => apiClient.post('/borrow/slips', data); // data có thể chứa { bookIds: [] }
export const submitBorrowSlip = (slipId) => apiClient.post(`/borrow/slips/${slipId}/submit`);
export const deleteBorrowSlip = (slipId) => apiClient.delete(`/borrow/slips/${slipId}`);
// Thêm các hàm khác nếu cần: getBorrowSlipDetails, updateSlipItems

// --- Users (MỚI) ---
/** Lấy danh sách tất cả người dùng (yêu cầu quyền Admin ở backend) */
export const getUsers = () => apiClient.get('/users');

/** Tạo người dùng mới (yêu cầu quyền Admin ở backend) */
export const createUser = (userData) => apiClient.post('/users', userData); // userData: { username, password, role_id }

/** Cập nhật vai trò người dùng (yêu cầu quyền Admin ở backend) */
export const updateUserRole = (userId, roleId) => apiClient.put(`/users/${userId}`, { role_id: roleId });

// --- Roles (MỚI) ---
/** Lấy danh sách vai trò */
export const getRoles = () => apiClient.get('/roles');


export default apiClient;