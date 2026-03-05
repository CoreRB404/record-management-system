import api from './api';

export const authService = {
    login: (data) => api.post('/auth/login', data),
    getMe: () => api.get('/auth/me'),
    updatePassword: (data) => api.put('/auth/password', data),
};

export const userService = {
    getUsers: (params) => api.get('/users', { params }),
    getUser: (id) => api.get(`/users/${id}`),
    createUser: (data) => api.post('/users', data),
    updateUser: (id, data) => api.put(`/users/${id}`, data),
    deleteUser: (id) => api.delete(`/users/${id}`),
    resetPassword: (id, data) => api.put(`/users/${id}/reset-password`, data),
    toggleStatus: (id) => api.put(`/users/${id}/toggle-status`),
};

export const recordService = {
    getRecords: (params) => api.get('/records', { params }),
    getRecord: (id) => api.get(`/records/${id}`),
    createRecord: (data) => api.post('/records', data),
    updateRecord: (id, data) => api.put(`/records/${id}`, data),
    deleteRecord: (id) => api.delete(`/records/${id}`),
    // bulk delete records by category with password confirmation
    deleteAllByCategory: (categoryId, password) =>
        api.delete(`/records/category/${categoryId}`, { data: { password } }),
};

export const categoryService = {
    getCategories: (params) => api.get('/categories', { params }),
    getCategory: (id) => api.get(`/categories/${id}`),
    createCategory: (data) => api.post('/categories', data),
    updateCategory: (id, data) => api.put(`/categories/${id}`, data),
    deleteCategory: (id) => api.delete(`/categories/${id}`),
};

export const dashboardService = {
    getAdminDashboard: () => api.get('/dashboard/admin'),
    getUserDashboard: () => api.get('/dashboard/user'),
};

export const trashService = {
    getTrash: (params) => api.get('/trash', { params }),
    restoreRecord: (id) => api.put(`/trash/${id}/restore`),
    restoreAll: (params) => api.put('/trash/restore-all', null, { params }),
    permanentlyDelete: (id) => api.delete(`/trash/${id}`),
    emptyTrash: (params) => api.delete('/trash/empty', { params }),
};

export const reportService = {
    getReport: (params) => api.get('/reports', { params }),
    exportPDF: (params) => api.get('/reports/pdf', { params, responseType: 'blob' }),
    exportCSV: (params) => api.get('/reports/csv', { params, responseType: 'blob' }),
    getYears: (params) => api.get('/reports/years', { params }),
};
