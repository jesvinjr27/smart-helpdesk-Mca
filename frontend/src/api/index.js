import apiClient from './client';

// Auth
export const loginApi = (credentials) => apiClient.post('/auth/login', credentials);
export const refreshApi = (refreshToken) => apiClient.post('/auth/refresh', { refresh_token: refreshToken });
export const logoutApi = () => apiClient.post('/auth/logout');
export const getMeApi = () => apiClient.get('/auth/me');
export const forgotPasswordApi = (data) => apiClient.post('/auth/forgot-password', data);
export const resetPasswordApi = (data) => apiClient.post('/auth/reset-password', data);
export const getMicrosoftConfigApi = () => apiClient.get('/auth/microsoft/config');
export const exchangeMicrosoftTokenApi = (data) => apiClient.post('/auth/microsoft/exchange', data);

// Users
export const getUsersApi = (params) => apiClient.get('/users', { params });
export const createUserApi = (data) => apiClient.post('/users', data);
export const updateUserApi = (id, data) => apiClient.patch(`/users/${id}`, data);
export const deleteUserApi = (id) => apiClient.delete(`/users/${id}`);

// Structure
export const getOrganizationsApi = () => apiClient.get('/organizations');
export const getDepartmentsApi = () => apiClient.get('/departments');
export const createDepartmentApi = (data) => apiClient.post('/departments', data);
export const getTeamsApi = (params) => apiClient.get('/teams', { params });
export const createTeamApi = (data) => apiClient.post('/teams', data);
export const getCategoriesApi = () => apiClient.get('/categories');
export const createCategoryApi = (data) => apiClient.post('/categories', data);

// Tickets
export const getTicketsApi = (params) => apiClient.get('/tickets', { params });
export const getTicketDetailApi = (id) => apiClient.get(`/tickets/${id}`);
export const createTicketApi = (data) => apiClient.post('/tickets', data);
export const updateTicketApi = (id, data) => apiClient.patch(`/tickets/${id}`, data);
export const assignTicketApi = (id, data) => apiClient.post(`/tickets/${id}/assign`, data);
export const transitionTicketApi = (id, data) => apiClient.post(`/tickets/${id}/transition`, data);

// Comments & Events
export const getTicketCommentsApi = (id) => apiClient.get(`/tickets/${id}/comments`);
export const addTicketCommentApi = (id, data) => apiClient.post(`/tickets/${id}/comments`, data);
export const getTicketHistoryApi = (id) => apiClient.get(`/tickets/${id}/history`);

// AI & Predictions
export const triggerTicketAIAnalysisApi = (id) => apiClient.post(`/tickets/${id}/ai/analyze`);
export const getTicketAIPredictionsApi = (id) => apiClient.get(`/tickets/${id}/ai/predictions`);
export const submitAIFeedbackApi = (id, data) => apiClient.post(`/tickets/${id}/ai/feedback`, data);
export const searchKnowledgeApi = (data) => apiClient.post('/ai/knowledge/search', data);
export const generateAIAssistApi = (data) => apiClient.post('/ai/assist', data);

// Knowledge Articles
export const getArticlesApi = (params) => apiClient.get('/knowledge/articles', { params });
export const getArticleDetailApi = (id) => apiClient.get(`/knowledge/articles/${id}`);
export const createArticleApi = (data) => apiClient.post('/knowledge/articles', data);
export const updateArticleApi = (id, data) => apiClient.patch(`/knowledge/articles/${id}`, data);
export const deleteArticleApi = (id) => apiClient.delete(`/knowledge/articles/${id}`);
export const triggerKnowledgeIngestApi = (data) => apiClient.post('/knowledge/ingest', data);
export const getKnowledgeIngestStatusApi = (jobId) => apiClient.get(`/knowledge/ingest/${jobId}`);

// SLA
export const getSLAPoliciesApi = () => apiClient.get('/sla/policies');
export const createSLAPolicyApi = (data) => apiClient.post('/sla/policies', data);
export const getSLARisksApi = () => apiClient.get('/sla/risks');

// Dashboard & Analytics
export const getDashboardSummaryApi = () => apiClient.get('/dashboard/summary');
export const getDashboardTrendsApi = (params) => apiClient.get('/dashboard/trends', { params });

// Admin & Health
export const getAIModelsAdminApi = () => apiClient.get('/admin/ai/models');
export const getAuditLogsApi = (params) => apiClient.get('/admin/audit-logs', { params });
export const getHealthApi = () => apiClient.get('/health');
export const getReadinessApi = () => apiClient.get('/ready');
