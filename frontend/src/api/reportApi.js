import api from './axios.config';

export const reportApi = {
  getTestReport: (testId) => api.get(`/reports/${testId}`),
  getTrendAnalysis: (userId, period) => api.get(`/reports/user/${userId}/trend`, { params: { period } })
};