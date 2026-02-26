import api from './axios.config';

export const userApi = {
  updateProfile: (userId, data) => api.put(`/users/${userId}`, data)
};

