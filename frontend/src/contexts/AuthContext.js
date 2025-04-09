import React, { createContext, useState, useEffect, useContext, useCallback } from 'react';

// 1. Tạo Context Object
const AuthContext = createContext(null);

// 2. Tạo Provider Component
export const AuthProvider = ({ children }) => {
  // --- State Management ---
  // Khởi tạo state ban đầu là null/false, sẽ được cập nhật từ localStorage hoặc login
  const [authToken, setAuthToken] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true); // Bắt đầu ở trạng thái loading

  // --- Hàm kiểm tra trạng thái xác thực ban đầu ---
  // Sử dụng useCallback để tối ưu, chỉ tạo lại khi cần (ở đây không có dependency nên chỉ tạo 1 lần)
  const checkAuthStatus = useCallback(() => {
    console.log('[AuthContext Check] Starting initial auth check...');
    setIsLoading(true); // Bắt đầu loading
    try {
      // Lấy dữ liệu từ localStorage
      const token = localStorage.getItem('authToken');
      const role = localStorage.getItem('userRole');
      console.log(`[AuthContext Check] Token from storage: ${token ? 'Found' : 'Missing'}`);
      console.log(`[AuthContext Check] Role from storage: ${role || 'Missing'}`);

      // Chỉ coi là đã đăng nhập nếu cả token và role đều tồn tại
      if (token && role) {
        // TODO (Nâng cao): Gọi API backend để xác thực token có thực sự hợp lệ không.
        // Nếu không hợp lệ, gọi logout() ở đây.
        // Ví dụ:
        // verifyTokenOnServer(token).then(() => { ... }).catch(() => logout());

        // Giả định token hợp lệ cho demo
        setAuthToken(token);
        setUserRole(role);
        setIsAuthenticated(true);
        console.log(`[AuthContext Check] Status: Authenticated as ${role}`);
      } else {
        // Nếu thiếu 1 trong 2, đảm bảo trạng thái là chưa đăng nhập và storage sạch
        localStorage.removeItem('authToken');
        localStorage.removeItem('userRole');
        setAuthToken(null);
        setUserRole(null);
        setIsAuthenticated(false);
        console.log('[AuthContext Check] Status: Not Authenticated');
      }
    } catch (error) {
        // Xử lý lỗi nếu có vấn đề khi đọc localStorage (rất hiếm)
        console.error("[AuthContext Check] Error reading from localStorage:", error);
        setAuthToken(null);
        setUserRole(null);
        setIsAuthenticated(false);
    } finally {
        setIsLoading(false); // Kết thúc loading dù thành công hay thất bại
        console.log('[AuthContext Check] Initial check finished.');
    }
  }, []); // Không có dependencies bên ngoài, chỉ chạy 1 lần

  // Chạy kiểm tra trạng thái ban đầu khi Provider được mount
  useEffect(() => {
    checkAuthStatus();
  }, [checkAuthStatus]); // Dependency là chính hàm checkAuthStatus


  // --- Hàm Xử lý Logout ---
  // Đặt logout ở đây để login có thể gọi nó nếu dữ liệu không hợp lệ
  const logout = useCallback(() => {
    console.log('[AuthContext Logout] Logging out...');
    try {
        localStorage.removeItem('authToken');
        localStorage.removeItem('userRole');
        console.log('[AuthContext Logout] Removed items from localStorage.');
    } catch (error) {
        console.error("[AuthContext Logout] Error removing items from localStorage:", error);
    } finally {
        // Luôn reset state dù có lỗi storage hay không
        setAuthToken(null);
        setUserRole(null);
        setIsAuthenticated(false);
        console.log('[AuthContext Logout] State reset.');
    }
  }, []); // Không có dependencies


  // --- Hàm Xử lý Login ---
  // Sử dụng useCallback và đưa logout vào dependency array
  const login = useCallback((loginData) => {
    console.log('[AuthContext Login] Attempting login with data:', loginData);

    // Kiểm tra dữ liệu đầu vào nghiêm ngặt hơn
    if (loginData && typeof loginData === 'object' &&
        typeof loginData.token === 'string' && loginData.token.length > 0 && // Token phải là chuỗi không rỗng
        typeof loginData.role_name === 'string' && loginData.role_name.length > 0) // role_name phải là chuỗi không rỗng
    {
      const token = loginData.token;
      const roleName = loginData.role_name;
      console.log(`[AuthContext Login] Data validated. Role: ${roleName}`);

      try {
        // Cập nhật localStorage
        localStorage.setItem('authToken', token);
        localStorage.setItem('userRole', roleName);
        console.log('[AuthContext Login] Saved token and role to localStorage.');

        // Cập nhật State
        setAuthToken(token);
        setUserRole(roleName);
        setIsAuthenticated(true); // <<< Cập nhật trạng thái đăng nhập thành công
        console.log(`[AuthContext Login] State updated. Logged in as ${roleName}. IsAuthenticated: true`);

      } catch (error) {
        // Lỗi nghiêm trọng khi lưu trữ hoặc cập nhật state
        console.error("[AuthContext Login] CRITICAL ERROR during storage/state update:", error);
        // Gọi logout để đảm bảo trạng thái sạch sẽ
        logout();
      }

    } else {
      // Dữ liệu login không hợp lệ hoặc thiếu
      console.error("[AuthContext Login] Invalid or incomplete login data received. Logging out.", loginData);
      // Gọi logout để reset trạng thái
      logout();
    }
  }, [logout]); // logout là dependency vì nó được gọi bên trong


  // --- Cung cấp Giá trị Context ---
  // Tạo object chứa các giá trị và hàm sẽ được cung cấp
  const contextValue = {
    authToken,
    isAuthenticated,
    isLoading,
    userRole,
    login,
    logout
  };

  // Provider trả về Context.Provider với giá trị đã tạo
  // Chỉ render children khi không còn loading ban đầu
  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

// 3. Tạo Custom Hook để dễ dàng sử dụng Context
export const useAuth = () => {
  const context = useContext(AuthContext);
  // Kiểm tra xem hook có được dùng bên trong Provider không
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};