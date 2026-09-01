import Constants from 'expo-constants';

// Configuracion de Keycloak (autenticacion por Resource Owner Password Credentials).
// La UI de la app NO menciona Keycloak: el usuario ve un formulario normal de
// usuario/contrasena y por detras se pide el token al realm.
//
// Prioridad de cada valor: EXPO_PUBLIC_* -> app.json "extra" -> placeholder de abajo.
//
// El "issuer" del realm puede darse de dos formas:
//   a) KEYCLOAK_ISSUER completo, ej. https://sso.catastrocbba.com/realms/siscat
//   b) KEYCLOAK_BASE_URL (host de Keycloak) + KEYCLOAK_REALM
//
// >>> FALTA el host de Keycloak (KEYCLOAK_BASE_URL o KEYCLOAK_ISSUER). <<<
// El client debe tener "Direct Access Grants Enabled". Si es confidencial, ademas
// definir KEYCLOAK_CLIENT_SECRET; si es publico se deja vacio.

const extra = Constants.expoConfig?.extra ?? Constants.manifest?.extra ?? {};

const PLACEHOLDER_HOST = 'https://CAMBIAR.keycloak.host';

const pick = (...vals) => vals.find((v) => v != null && String(v).trim() !== '');

const BASE_URL = (
  pick(
    process.env.EXPO_PUBLIC_KEYCLOAK_BASE_URL,
    extra.KEYCLOAK_BASE_URL,
    PLACEHOLDER_HOST,
  ) || PLACEHOLDER_HOST
).replace(/\/+$/, '');

export const KEYCLOAK_REALM =
  pick(process.env.EXPO_PUBLIC_KEYCLOAK_REALM, extra.KEYCLOAK_REALM) || 'master';

// Si viene el issuer completo se usa tal cual; si no, se arma con host + realm.
export const KEYCLOAK_ISSUER = (
  pick(process.env.EXPO_PUBLIC_KEYCLOAK_ISSUER, extra.KEYCLOAK_ISSUER) ||
  `${BASE_URL}/realms/${KEYCLOAK_REALM}`
).replace(/\/+$/, '');

export const KEYCLOAK_CLIENT_ID =
  pick(
    process.env.EXPO_PUBLIC_KEYCLOAK_CLIENT_ID,
    extra.KEYCLOAK_CLIENT_ID,
  ) || 'admin-cli';

export const KEYCLOAK_CLIENT_SECRET =
  pick(
    process.env.EXPO_PUBLIC_KEYCLOAK_CLIENT_SECRET,
    extra.KEYCLOAK_CLIENT_SECRET,
  ) || '';

export const KEYCLOAK_SCOPE =
  pick(process.env.EXPO_PUBLIC_KEYCLOAK_SCOPE, extra.KEYCLOAK_SCOPE) ||
  'openid profile';

export const TOKEN_ENDPOINT = `${KEYCLOAK_ISSUER}/protocol/openid-connect/token`;
export const LOGOUT_ENDPOINT = `${KEYCLOAK_ISSUER}/protocol/openid-connect/logout`;

export const keycloakConfigurado = !KEYCLOAK_ISSUER.includes('CAMBIAR');

export default {
  KEYCLOAK_ISSUER,
  KEYCLOAK_REALM,
  KEYCLOAK_CLIENT_ID,
  KEYCLOAK_CLIENT_SECRET,
  KEYCLOAK_SCOPE,
  TOKEN_ENDPOINT,
  LOGOUT_ENDPOINT,
  keycloakConfigurado,
};
