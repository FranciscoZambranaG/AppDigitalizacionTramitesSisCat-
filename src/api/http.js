// api/http.js
// Clientes HTTP autenticados. Todos comparten los mismos handlers de auth que
// registra el AuthProvider con setAuthHandlers():
// - Adjuntan "Authorization: Bearer <access_token>" en cada peticion.
// - Ante un 401 intentan UNA renovacion del token con el refresh_token y
//   reintentan la peticion. Si la renovacion falla, disparan onAuthFailure
//   (cierre de sesion -> vuelve a Login).
//
// `http` (default) apunta a URL_BASE (backend SisCat clasico). Para otros
// backends (ej. el modulo Resoluciones) usar createAuthedClient(baseURL).
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

// Una sola renovacion en curso, compartida entre TODOS los clientes: si dos
// peticiones (a backends distintos) reciben 401 a la vez, esperan la misma.
let refreshing = null;

export const createAuthedClient = (baseURL, { timeout = 30000 } = {}) => {
  const client = axios.create({ baseURL, timeout });

  client.interceptors.request.use((config) => {
    const token = handlers.getAccessToken();
    if (token) {
      config.headers = config.headers || {};
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  });

  client.interceptors.response.use(
    (response) => response,
    async (error) => {
      const { config, response } = error;
      if (!response || response.status !== 401 || !config || config._retry) {
        return Promise.reject(error);
      }
      config._retry = true;
      try {
        refreshing = refreshing || handlers.refreshAccessToken();
        const newToken = await refreshing;
        refreshing = null;
        config.headers = config.headers || {};
        config.headers.Authorization = `Bearer ${newToken}`;
        return client(config);
      } catch (refreshError) {
        refreshing = null;
        handlers.onAuthFailure();
        return Promise.reject(refreshError);
      }
    },
  );

  return client;
};

const http = createAuthedClient(URL_BASE);

export default http;
