import api from './api';

/** Public endpoint; no auth header required. */
export const getPublicPlatform = () => api.get('/platform/public');
