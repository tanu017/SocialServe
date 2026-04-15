import api from './api';

// Donation endpoints
export const getDonations = (params) => {
  return api.get('/donations', { params });
};

export const getDonationById = (id) => {
  return api.get(`/donations/${id}`);
};

export const createDonation = (formData) => {
  return api.post('/donations', formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  });
};

export const updateDonation = (id, formData) => {
  return api.put(`/donations/${id}`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  });
};

export const deleteDonation = (id) => {
  return api.delete(`/donations/${id}`);
};

export const needDonation = (id) => {
  return api.post(`/donations/${id}/need`);
};

export const chooseDonationReceiver = (id, receiverId) => {
  return api.put(`/donations/${id}/choose/${receiverId}`);
};

// Need endpoints
export const getNeeds = (params) => {
  return api.get('/needs', { params });
};

export const getNeedById = (id) => {
  return api.get(`/needs/${id}`);
};

export const createNeed = (formData) => {
  return api.post('/needs', formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  });
};

export const updateNeed = (id, formData) => {
  return api.put(`/needs/${id}`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  });
};

export const deleteNeed = (id) => {
  return api.delete(`/needs/${id}`);
};

export const helpNeed = (id) => {
  return api.post(`/needs/${id}/help`);
};
