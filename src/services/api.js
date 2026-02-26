import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL;

const apiClient = axios.create({
  baseURL: `${API_URL}/api`,
  headers: { 'Content-Type': 'application/json' },
});

// Ambil semua dokumentasi berdasarkan bahasa
export const getAllDocumentations = async (language = 'id') => {
  const response = await apiClient.get('/documentations', {
    params: {
      'filters[isPublished][$eq]': true,
      'filters[language][$eq]': language,
      'sort[0]': 'order:asc',
      'pagination[pageSize]': 100,
    },
  });
  return response.data;
};

// Ambil dokumentasi berdasarkan slug dan bahasa
export const getDocumentationBySlug = async (slug, language = 'id') => {
  const response = await apiClient.get('/documentations', {
    params: {
      'filters[slug][$eq]': slug,
      'filters[isPublished][$eq]': true,
      'filters[language][$eq]': language,
    },
  });
  return response.data;
};