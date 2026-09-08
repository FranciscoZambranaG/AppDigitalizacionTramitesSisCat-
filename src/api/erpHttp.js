// api/erpHttp.js
// Cliente HTTP autenticado para el backend del modulo Resoluciones
// (resoluciones/backend/, FastAPI). Reusa los mismos handlers de auth que
// `http` (token Keycloak + refresh en 401). Timeout mas alto porque una subida
// de varias paginas escaneadas puede tardar.
import { createAuthedClient } from './http';
import { ERP_BACKEND_URL } from '../config/env';

const erpHttp = createAuthedClient(ERP_BACKEND_URL, { timeout: 90000 });

export default erpHttp;
