import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  timeout: 10000,
});

// Interceptor: adicionar token em todas as requisições
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('hotel_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Interceptor: tratar erros globalmente
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('hotel_token');
      localStorage.removeItem('hotel_user');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

// Auth
export const login = (email, senha) => api.post('/auth/login', { email, senha });
export const getMe = () => api.get('/auth/me');

// Quartos
export const getQuartos = (busca) => api.get('/quartos', { params: busca ? { busca } : {} });
export const getQuarto = (id) => api.get(`/quartos/${id}`);
export const criarQuarto = (data) => api.post('/quartos', data);
export const editarQuarto = (id, data) => api.put(`/quartos/${id}`, data);
export const excluirQuarto = (id) => api.delete(`/quartos/${id}`);

// Reservas
export const getReservas = () => api.get('/reservas');
export const getHistorico = () => api.get('/reservas/historico');
export const getDisponibilidade = () => api.get('/reservas/disponibilidade');
export const movimentarReserva = (data) => api.post('/reservas/movimentar', data);

// Dashboard
export const getDashboard = () => api.get('/dashboard');

export default api;
