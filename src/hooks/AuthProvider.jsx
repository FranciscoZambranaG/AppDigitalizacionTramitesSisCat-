import React, {
  createContext,
  useContext,
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';
import * as SecureStore from 'expo-secure-store';
import ModalAlerta from '../components/ModalAlertas';
import { setAuthHandlers } from '../api/http';
import {
  passwordLogin,
  refreshTokens,
  revokeSession,
  decodeJwt,
} from '../services/authService';

const ACCESS_KEY = 'kc_access_token';
const REFRESH_KEY = 'kc_refresh_token';

const AuthContext = createContext();

const persist = async (key, value) => {
  try {
    if (value) await SecureStore.setItemAsync(key, value);
    else await SecureStore.deleteItemAsync(key);
  } catch (e) {
    console.log('[auth] SecureStore persist error', key, e?.message);
  }
};

const AuthProvider = ({ children }) => {
  const [modalVisible, setModalVisible] = useState(false);
  const [modalTitle, setModalTitle] = useState('');
  const [modalDescription, setModalDescription] = useState('');

  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [bootstrapping, setBootstrapping] = useState(true);

  // Refs con el valor vigente para los interceptores de http.js (evita closures viejos).
  const accessRef = useRef(null);
  const refreshRef = useRef(null);

  const showModal = (title, description) => {
    setModalTitle(title);
    setModalDescription(description);
    setModalVisible(true);
  };
  const closeModal = () => {
    setModalVisible(false);
    setModalTitle('');
    setModalDescription('');
  };

  const applyTokens = useCallback((data) => {
    const access = data?.access_token || null;
    const refresh = data?.refresh_token || refreshRef.current || null;
    accessRef.current = access;
    refreshRef.current = refresh;
    setUser(access ? decodeJwt(access) : null);
    setIsAuthenticated(Boolean(access));
    persist(ACCESS_KEY, access);
    persist(REFRESH_KEY, refresh);
    return access;
  }, []);

  const clearSession = useCallback(() => {
    accessRef.current = null;
    refreshRef.current = null;
    setUser(null);
    setIsAuthenticated(false);
    persist(ACCESS_KEY, null);
    persist(REFRESH_KEY, null);
  }, []);

  const login = useCallback(
    async (username, password) => {
      const data = await passwordLogin(username, password);
      return applyTokens(data);
    },
    [applyTokens],
  );

  const logout = useCallback(async () => {
    const rt = refreshRef.current;
    clearSession();
    await revokeSession(rt);
  }, [clearSession]);

  // Renovacion usada por el interceptor 401 y por el arranque.
  const refreshAccessToken = useCallback(async () => {
    const rt = refreshRef.current;
    if (!rt) throw new Error('sin refresh_token');
    try {
      const data = await refreshTokens(rt);
      return applyTokens(data);
    } catch (e) {
      clearSession();
      throw e;
    }
  }, [applyTokens, clearSession]);

  // Registra los handlers para http.js una sola vez.
  useEffect(() => {
    setAuthHandlers({
      getAccessToken: () => accessRef.current,
      refreshAccessToken,
      onAuthFailure: () => {
        clearSession();
        showModal('Sesion expirada', 'Vuelva a iniciar sesion.');
      },
    });
  }, [refreshAccessToken, clearSession]);

  // Arranque: intenta rehidratar la sesion desde SecureStore.
  useEffect(() => {
    (async () => {
      try {
        const [access, refresh] = await Promise.all([
          SecureStore.getItemAsync(ACCESS_KEY),
          SecureStore.getItemAsync(REFRESH_KEY),
        ]);
        accessRef.current = access || null;
        refreshRef.current = refresh || null;
        if (refresh) {
          await refreshAccessToken();
        }
      } catch (e) {
        console.log('[auth] bootstrap error', e?.message);
        clearSession();
      } finally {
        setBootstrapping(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <AuthContext.Provider
      value={{ user, isAuthenticated, bootstrapping, login, logout }}
    >
      {children}
      <ModalAlerta
        visible={modalVisible}
        title={modalTitle}
        description={modalDescription}
        onOk={closeModal}
      />
    </AuthContext.Provider>
  );
};

export default AuthProvider;
export const useAuth = () => useContext(AuthContext);
