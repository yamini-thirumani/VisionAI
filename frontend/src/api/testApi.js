import api from './axios.config';

export const testApi = {
  createTest: (data) => api.post('/tests', data),
  getTest: (id) => api.get(`/tests/${id}`),
  getUserTests: (userId, params) => api.get(`/tests/user/${userId}`, { params }),
  getLatestTest: (userId) => api.get(`/tests/user/${userId}/latest`),
  getStatistics: (userId) => api.get(`/tests/user/${userId}/statistics`),
  deleteTest: (id) => api.delete(`/tests/${id}`)
};