import React, { useState, useEffect, useCallback } from 'react';
import { getUsers, getRoles, createUser, updateUserRole } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

function AdminUserPage() {
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { logout } = useAuth();

  // State cho form thêm user mới
  const [newUser, setNewUser] = useState({ username: '', password: '', role_id: '' });
  const [formError, setFormError] = useState('');
  const [formLoading, setFormLoading] = useState(false);

  // State để quản lý việc thay đổi role cho từng user
  const [editingRoles, setEditingRoles] = useState({}); // { userId: selectedRoleId }
  const [roleChangeLoading, setRoleChangeLoading] = useState(null); // userId đang được thay đổi role

  // --- Hàm Fetch dữ liệu ---
  const fetchData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      // Chạy song song 2 request
      const [usersResponse, rolesResponse] = await Promise.all([
        getUsers(),
        getRoles()
      ]);
      setUsers(usersResponse.data);
      setRoles(rolesResponse.data);
       // Khởi tạo editingRoles với role hiện tại của mỗi user
       const initialEditingRoles = {};
       usersResponse.data.forEach(user => {
           initialEditingRoles[user.id] = user.role_id;
       });
       setEditingRoles(initialEditingRoles);

    } catch (err) {
      console.error("Failed to fetch admin data:", err);
      if (err.response && (err.response.status === 401 || err.response.status === 403)) {
        setError('Access denied or session expired. Please log in as Admin.');
        setTimeout(logout, 3000);
      } else {
        setError('Failed to load user and role data.');
      }
    } finally {
      setLoading(false);
    }
  }, [logout]); // Thêm logout vào dependency

  useEffect(() => {
    fetchData();
  }, [fetchData]); // Gọi fetchData khi component mount

  // --- Xử lý Form Thêm User ---
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewUser(prevState => ({ ...prevState, [name]: value }));
    // Xóa lỗi form khi người dùng bắt đầu nhập lại
    if (formError) {
        setFormError('');
    }
  };

  // --- Cập nhật hàm Submit với Validation ---
  const handleAddUserSubmit = async (e) => {
    e.preventDefault();
    setFormError(''); // Xóa lỗi cũ trước khi validate

    // --- Chính sách Validation ---

    // 1. Kiểm tra các trường bắt buộc
    if (!newUser.username || !newUser.password || !newUser.role_id) {
      setFormError('Please fill in all required fields (Username, Password, Role).');
      return; // Dừng lại nếu thiếu trường
    }

    // 2. Chính sách Username: Không chứa dấu cách
    if (/\s/.test(newUser.username)) { // Kiểm tra sự tồn tại của khoảng trắng
      setFormError('Username policy violation: Cannot contain spaces.');
      return;
    }

    // 3. Chính sách Username: Độ dài tối thiểu (ví dụ: 3)
    if (newUser.username.trim().length < 3) { // trim() để loại bỏ khoảng trắng đầu/cuối nếu có
      setFormError('Username policy violation: Must be at least 3 characters long.');
      return;
    }

    // 4. Chính sách Password: Độ dài tối thiểu (ví dụ: 6)
    if (newUser.password.length < 6) {
      setFormError('Password policy violation: Must be at least 6 characters long.');
      return;
    }
    setFormLoading(true);
    try {
      await createUser(newUser);
      alert('User created successfully!');
      setNewUser({ username: '', password: '', role_id: '' }); // Reset form
      fetchData(); // Tải lại danh sách user
    } catch (err) {
      console.error("Failed to create user:", err);
      setFormError(err.response?.data?.message || 'Failed to create user.');
    } finally {
      setFormLoading(false);
    }
  };

   // --- Xử lý Thay đổi Role ---
   const handleRoleSelectionChange = (userId, selectedRoleId) => {
       setEditingRoles(prev => ({
           ...prev,
           [userId]: selectedRoleId // Cập nhật role được chọn cho user cụ thể
       }));
   };

   const handleUpdateRole = async (userId) => {
       const newRoleId = editingRoles[userId];
       if (!newRoleId) {
           alert("No new role selected."); // Trường hợp này không nên xảy ra nếu UI đúng
           return;
       }

       // Tìm role_id hiện tại để tránh gọi API nếu không đổi
        const currentUser = users.find(u => u.id === userId);
        if (currentUser && currentUser.role_id === parseInt(newRoleId, 10)) {
             alert("Role is already set to this value.");
             return;
        }


       setRoleChangeLoading(userId); // Bắt đầu loading cho user này
       setError(''); // Xóa lỗi chung cũ
       try {
           await updateUserRole(userId, newRoleId);
           alert(`Role for user ID ${userId} updated successfully!`);
           // Cập nhật lại role_name trong state `users` để UI hiển thị đúng ngay lập tức
            setUsers(prevUsers => prevUsers.map(user => {
                if (user.id === userId) {
                    const newRole = roles.find(r => r.id === parseInt(newRoleId, 10));
                    return { ...user, role_id: parseInt(newRoleId, 10), role_name: newRole ? newRole.name : 'Unknown' };
                }
                return user;
            }));
            // Không cần gọi lại fetchData() nếu chỉ cập nhật state

       } catch (err) {
           console.error("Failed to update role:", err);
           setError(err.response?.data?.message || `Failed to update role for user ${userId}.`);
       } finally {
            setRoleChangeLoading(null); // Kết thúc loading
       }
   };


  // --- UI Rendering ---
  if (loading) return <div className="loading">Loading Admin Data...</div>;

  return (
    <div className="container">
      <h2>Admin - User Management</h2>
      {error && <p className="error-message">{error}</p>}

      {/* --- Form Thêm User --- */}
      <div style={{ marginBottom: '30px', paddingBottom: '20px', borderBottom: '1px solid #eee' }}>
        <h3>Add New User</h3>
        <form onSubmit={handleAddUserSubmit}>
          <div>
            <label>Username:</label>
            <input
              type="text"
              name="username"
              value={newUser.username}
              onChange={handleInputChange}
              required
              disabled={formLoading}
            />
          </div>
          <div>
            <label>Password:</label>
            <input
              type="password"
              name="password"
              value={newUser.password}
              onChange={handleInputChange}
              required
              disabled={formLoading}
            />
          </div>
          <div>
            <label>Role:</label>
            <select
              name="role_id"
              value={newUser.role_id}
              onChange={handleInputChange}
              required
              disabled={formLoading || roles.length === 0}
            >
              <option value="">-- Select Role --</option>
              {roles.map(role => (
                <option key={role.id} value={role.id}>{role.name}</option>
              ))}
            </select>
          </div>
          {formError && <p className="error-message" style={{marginTop: '10px'}}>{formError}</p>}
          <button type="submit" disabled={formLoading}>
            {formLoading ? 'Adding...' : 'Add User'}
          </button>
        </form>
      </div>

      {/* --- Danh sách User --- */}
      <h3>Existing Users</h3>
      {users.length === 0 ? (
        <p>No users found.</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Username</th>
              <th>Current Role</th>
              <th>Change Role To</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {users.map(user => (
              <tr key={user.id}>
                <td>{user.id}</td>
                <td>{user.username}</td>
                <td>{user.role_name || 'Unknown'}</td>
                <td>
                  <select
                     value={editingRoles[user.id] || ''} // Lấy role đang được chọn cho user này
                     onChange={(e) => handleRoleSelectionChange(user.id, e.target.value)}
                     disabled={roleChangeLoading === user.id || roles.length === 0}
                   >
                     {roles.map(role => (
                        <option key={role.id} value={role.id}>{role.name}</option>
                     ))}
                   </select>
                </td>
                 <td>
                    <button
                        onClick={() => handleUpdateRole(user.id)}
                        disabled={roleChangeLoading === user.id || !editingRoles[user.id] || parseInt(editingRoles[user.id], 10) === user.role_id} // Disable nếu đang load hoặc role ko đổi
                    >
                       {roleChangeLoading === user.id ? 'Saving...' : 'Save Role'}
                    </button>
                    {/* TODO: Thêm nút Delete User nếu cần */}
                 </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
       <style jsx>{`
         table { width: 100%; border-collapse: collapse; margin-top: 15px; }
         th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
         th { background-color: #f2f2f2; }
         tr:nth-child(even) { background-color: #f9f9f9; }
         td select { padding: 5px; min-width: 120px; }
         td button { padding: 5px 10px; font-size: 0.9em;}
       `}</style>
    </div>
  );
}

export default AdminUserPage;