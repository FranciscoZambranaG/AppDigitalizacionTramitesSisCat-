import React, { createContext, useContext, useEffect, useState } from 'react'
import AsyncStorage from '@react-native-async-storage/async-storage'
import ModalAlerta from '../components/ModalAlertas';

const AuthContext = createContext();

const AuthProvider = ({ children }) => {
  const [modalVisible, setModalVisible] = useState(false);
  const [modalTitle, setModalTitle] = useState('');
  const [modalDescription, setModalDescription] = useState('');

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

  const [authIds, setAuthIds] = useState({
    idUsuario: null,
    idFuncionario: null,
    idUnidad: null,
    idPersona: null,
  });
  useEffect(() => {
    loadStoredData();
  }, []);
  const loadStoredData = async () => {
    try {
      const keys = ['idUsuario', 'idUnidad', 'idFuncionario', 'idPersona'];
      const values = await AsyncStorage.multiGet(keys);
      const ids = {};
      values.forEach(([key, value]) => {
        if (value !== null) ids[key] = parseInt(value);
      });
      setAuthIds((prev) => ({ ...prev, ...ids }));
    } catch (error) {
      showModal(
        'Alerta',
      'Vuelva a iniciar sesion.'
      );
    }
  };
  const saveAuthIds = async (newIds) => {
    try {
      const entries = Object.entries(newIds).map(([key, value]) => [key, String(value)]);
      await AsyncStorage.multiSet(entries);
      setAuthIds((prev) => ({ ...prev, ...newIds })); // <-- Añade esto
    } catch (error) {
      showModal(
        'Alerta',
      'Vuelva a iniciar sesion.'
      );
    }
  };
  const logout = async () => {
    try {
      await AsyncStorage.multiRemove(['idUsuario', 'idUnidad', 'idFuncionario', 'idPersona']);
      setAuthIds({
        idUsuario: null,
        idFuncionario: null,
        idUnidad: null,
        idPersona: null,
      });
    } catch (error) {
      showModal(
        'Alerta',
      'Error al cerrar sesion.'
      );
    }
  };
  return (
    <AuthContext.Provider value={{ authIds, loadStoredData, saveAuthIds,logout}}>
      {children}
      <ModalAlerta
      visible={modalVisible}
      title={modalTitle}
      description={modalDescription}
      onOk={closeModal}
    />
    </AuthContext.Provider>

  )
}
export default AuthProvider
export const useAuth = () => {
  return useContext(AuthContext);
};
