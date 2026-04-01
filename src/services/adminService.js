import api from './api';

// Dashboard
export const getDashboardStats = async () => {
    const response = await api.get('/admin/stats');
    return response.data;
};

// Products
export const getProducts = async () => {
    const response = await api.get('/admin/products');
    return response.data;
};

export const createProduct = async (productData) => {
    const response = await api.post('/admin/products', productData);
    return response.data;
};

export const updateProduct = async (id, productData) => {
    const response = await api.put(`/admin/products/${id}`, productData);
    return response.data;
};

export const deleteProduct = async (id) => {
    const response = await api.delete(`/admin/products/${id}`);
    return response.data;
};

// Orders
export const getOrders = async () => {
    const response = await api.get('/admin/orders');
    return response.data;
};

export const updateOrderStatus = async (id, status) => {
    const response = await api.put(`/admin/orders/${id}`, { status });
    return response.data;
};

// Users
export const getUsers = async () => {
    const response = await api.get('/admin/users');
    return response.data;
};

export const updateUserRole = async (id, role) => {
    const response = await api.put(`/admin/users/${id}`, { role });
    return response.data;
};

export const deleteUser = async (id) => {
    const response = await api.delete(`/admin/users/${id}`);
    return response.data;
};

// Categories
export const getCategories = async () => {
    const response = await api.get('/admin/categories');
    return response.data;
};

export const createCategory = async (categoryData) => {
    const response = await api.post('/admin/categories', categoryData);
    return response.data;
};

export const deleteCategory = async (id) => {
    const response = await api.delete(`/admin/categories/${id}`);
    return response.data;
};
