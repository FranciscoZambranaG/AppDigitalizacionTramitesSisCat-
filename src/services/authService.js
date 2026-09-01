// services/authService.js
// Autenticacion contra Keycloak usando el flujo "password" (Resource Owner
// Password Credentials). La app manda usuario/contrasena al token endpoint del
// realm y recibe access_token + refresh_token. No hay redireccion ni navegador.
import axios from 'axios';
import qs from 'qs';
import {
  TOKEN_ENDPOINT,
  LOGOUT_ENDPOINT,
  KEYCLOAK_CLIENT_ID,
  KEYCLOAK_CLIENT_SECRET,
  KEYCLOAK_SCOPE,
} from '../config/keycloak';

// Cliente aparte, SIN interceptores, para no mezclar el refresh con las llamadas
// normales al backend.
const kc = axios.create({
  timeout: 20000,
  headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
});

const withClientAuth = (params) => {
  const body = { ...params, client_id: KEYCLOAK_CLIENT_ID };
  if (KEYCLOAK_CLIENT_SECRET) body.client_secret = KEYCLOAK_CLIENT_SECRET;
  return qs.stringify(body);
};

// Normaliza errores de Keycloak a un mensaje mostrable.
const parseKcError = (error) => {
  const data = error?.response?.data;
  const code = data?.error;
  const desc = data?.error_description;
  if (code === 'invalid_grant') {
    return new Error('Usuario o contrasena incorrectos.');
  }
  if (code === 'unauthorized_client') {
    return new Error(
      'El cliente de autenticacion no permite este tipo de acceso. Avise al area de sistemas.',
    );
  }
  if (code === 'invalid_client') {
    return new Error(
      'Configuracion de autenticacion incompleta (client secret). Avise al area de sistemas.',
    );
  }
  if (error?.code === 'ECONNABORTED' || error?.message === 'Network Error') {
    return new Error('No se pudo contactar al servidor de autenticacion.');
  }
  return new Error(desc || code || 'No se pudo iniciar sesion.');
};

export const passwordLogin = async (username, password) => {
  try {
    const { data } = await kc.post(
      TOKEN_ENDPOINT,
      withClientAuth({
        grant_type: 'password',
        username,
        password,
        scope: KEYCLOAK_SCOPE,
      }),
    );
    return data; // { access_token, refresh_token, expires_in, refresh_expires_in, ... }
  } catch (error) {
    console.log('[auth] passwordLogin error', error?.response?.data || error?.message);
    throw parseKcError(error);
  }
};

export const refreshTokens = async (refresh_token) => {
  const { data } = await kc.post(
    TOKEN_ENDPOINT,
    withClientAuth({ grant_type: 'refresh_token', refresh_token }),
  );
  return data;
};

export const revokeSession = async (refresh_token) => {
  if (!refresh_token) return;
  try {
    await kc.post(LOGOUT_ENDPOINT, withClientAuth({ refresh_token }));
  } catch (error) {
    // El cierre de sesion local no debe fallar por esto.
    console.log('[auth] revokeSession error', error?.response?.data || error?.message);
  }
};

// Decodifica el payload de un JWT sin validar la firma (solo para leer claims
// como preferred_username / sub en el cliente).
export const decodeJwt = (token) => {
  try {
    const part = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
    const padded = part + '='.repeat((4 - (part.length % 4)) % 4);
    const bin = base64Decode(padded);
    const json = decodeURIComponent(
      bin
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join(''),
    );
    return JSON.parse(json);
  } catch (e) {
    console.log('[auth] decodeJwt error', e?.message);
    return null;
  }
};

const B64 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
function base64Decode(input) {
  if (typeof globalThis.atob === 'function') return globalThis.atob(input);
  const str = String(input).replace(/=+$/, '');
  let output = '';
  let bc = 0;
  let bs = 0;
  for (let i = 0; i < str.length; i++) {
    const idx = B64.indexOf(str.charAt(i));
    if (idx === -1) continue;
    bs = bc % 4 ? bs * 64 + idx : idx;
    if (bc++ % 4) output += String.fromCharCode(255 & (bs >> ((-2 * bc) & 6)));
  }
  return output;
}

export default { passwordLogin, refreshTokens, revokeSession, decodeJwt };
