// api/http.js
// Cliente HTTP unico para todas las llamadas al backend SisCat.
// - Adjunta "Authorization: Bearer <access_token>" en cada peticion.
// - Si el backend responde 401, intenta UNA renovacion del token con el
//   refresh_token y reintenta la peticion. Si la renovacion falla, dispara el
//   cierre de sesion (vuelve a Login).
//
// El AuthProvider registra los handlers con setAuthHandlers() al arrancar.
import axios from 'axios';
import { URL_BASE } from '../config/env';

let handlers = {
  getAccessToken: () => null,
  // debe devolver el nuevo access_token (string) o lanzar error
  refreshAccessToken: async () => {
    throw new Error('auth no inicializado');
  },
  onAuthFailure: () => {},
};

export const setAuthHandlers = (next) => {
  handlers = { ...handlers, ...next };
};

const http = axios.create({
  baseURL: URL_BASE,
  timeout: 30000,
});

http.interceptors.request.use((config) => {
  const token = handlers.getAccessToken();
  if (token) {
    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

let refreshing = null;

http.interceptors.response.use(
  (response) => response,
  async (error) => {
    const { config, response } = error;
    if (!response || response.status !== 401 || !config || config._retry) {
      return Promise.reject(error);
    }
    config._retry = true;
    try {
      // Una sola renovacion aunque varias peticiones fallen a la vez.
      refreshing = refreshing || handlers.refreshAccessToken();
      const newToken = await refreshing;
      refreshing = null;
      config.headers = config.headers || {};
      config.headers.Authorization = `Bearer ${newToken}`;
      return http(config);
    } catch (refreshError) {
      refreshing = null;
      handlers.onAuthFailure();
      return Promise.reject(refreshError);
    }
  },
);

export default http;
