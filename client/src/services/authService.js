import api from './api';

export const registerUser = (data) => {
  return api.post('/auth/register', data);
};

export const loginUser = (data) => {
  return api.post('/auth/login', data);
};

export const getMe = () => {
  return api.get('/auth/me');
};

export const logoutUser = () => {
  return api.post('/auth/logout');
};

export const changePassword = (data) => {
  return api.put('/auth/change-password', data);
};

export const updateProfile = (data) => {
  return api.put('/auth/profile', data);
};
