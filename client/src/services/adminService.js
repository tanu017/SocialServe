import api from './api';

export const getAdminStats = () => api.get('/admin/stats');

export const getAdminUsers = (params) => api.get('/admin/users', { params });

export const getAdminUserById = (id) => api.get(`/admin/users/${id}`);

export const verifyUser = (id, data) => api.put(`/admin/users/${id}/verify`, data);

export const deactivateUser = (id) => api.delete(`/admin/users/${id}`);

export const getAdminDonations = (params) => api.get('/admin/donations', { params });

export const deleteAdminDonation = (id) => api.delete(`/admin/donations/${id}`);

export const getAdminNeeds = (params) => api.get('/admin/needs', { params });

export const deleteAdminNeed = (id) => api.delete(`/admin/needs/${id}`);

export const getAdminPlatformSettings = () => api.get('/admin/platform-settings');

export const updateAdminPlatformSettings = (data) => api.put('/admin/platform-settings', data);
