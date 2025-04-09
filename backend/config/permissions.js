// config/permissions.js
const PERMISSIONS = {
    // Quyền Admin
    MANAGE_USERS: 1, // 0000 0001

    // Quyền Thủ thư
    MANAGE_BOOKS: 2,    // 0000 0010
    MANAGE_CATEGORIES: 4, // 0000 0100

    // Quyền Người mượn
    VIEW_BOOKS: 8,      // 0000 1000
    MANAGE_OWN_BORROWING_SLIPS: 16, // 0001 0000
};

// Định nghĩa vai trò và quyền tương ứng (ví dụ)
const ROLES = {
    ADMIN: {
        id: 1,
        name: 'Admin',
        // Sử dụng bitwise OR để kết hợp quyền
        permissions: PERMISSIONS.MANAGE_USERS | PERMISSIONS.MANAGE_BOOKS | PERMISSIONS.MANAGE_CATEGORIES | PERMISSIONS.VIEW_BOOKS
    },
    LIBRARIAN: {
        id: 2,
        name: 'Thủ thư',
        permissions: PERMISSIONS.MANAGE_BOOKS | PERMISSIONS.MANAGE_CATEGORIES | PERMISSIONS.VIEW_BOOKS
    },
    STUDENT: {
        id: 3,
        name: 'Sinh viên',
        permissions: PERMISSIONS.VIEW_BOOKS | PERMISSIONS.MANAGE_OWN_BORROWING_SLIPS
    }
    // Thêm các vai trò khác nếu cần (Cán bộ, Giảng viên...)
};

module.exports = { PERMISSIONS, ROLES };