import React, { useState, useEffect, useRef } from 'react';
import { Alert, View, Text, FlatList, StyleSheet, ActivityIndicator, TextInput, TouchableOpacity } from 'react-native';
import axios from 'axios';
import { AntDesign } from '@expo/vector-icons';
import { useAuth } from '../../hooks/AuthProvider';
import { useWifiLost } from '../../hooks/WifiLostProvider';
import serviceValidacion from '../../services/serviceValidacion';
import ModalAlerta from '../../components/ModalAlertas';
import baseUrl from '../../api/baseUrl';

const InboxScreen = ({ navigation }) => {
  const [page, setPage] = useState(1);
  const pageSize = 15;
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [hasMore, setHasMore] = useState(false);
  const [sortBy, setSortBy] = useState('dt.idTramite');
  const [sortOrder, setSortOrder] = useState('desc');

  const { authIds, logout } = useAuth();
  const { checkConnection } = useWifiLost();

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



  // Ref para guardar el cancelador actual
  const cancelTokenSource = useRef(null);

  const fetchInbox = async ({ isLoadMore = false, customPage = null } = {}) => {
    if (loading) return;
    if (!authIds?.idFuncionario || !authIds?.idUnidad) return;
    if (!isLoadMore) {
      setItems([]);
      setHasMore(true);
      setPage(1);
    } else if (!hasMore || !page) {
      return;
    }
  
    // Cancelar petición anterior
    if (cancelTokenSource.current) {
      cancelTokenSource.current.cancel(
        isLoadMore ? "Cancelada por paginación" : "Cancelada por nuevo filtro"
      );
    }
  
    cancelTokenSource.current = axios.CancelToken.source();
  
    const bodyRequest = {
      id_funcionario: authIds.idFuncionario,
      id_unidad: authIds.idUnidad,
      search,
      sort_by: sortBy,
      sort_order: sortOrder,
      page: customPage ?? (isLoadMore ? page : 1),
      page_size: pageSize,
    };
  
    setLoading(true);
  
    try {
 
      const response = await axios.post(
        `${baseUrl}/get_inbox`,
        bodyRequest,
        {
          headers: { 'Content-Type': 'application/json' },
          cancelToken: cancelTokenSource.current.token,
        }
      );
  
      const newItems = response.data.items || [];
      const hasNext = response.data.has_next;
      const nextPage = response.data.next_page;
  
      if (isLoadMore) {
        setItems(prev => [...prev, ...newItems]);
      } else {
        setItems(newItems);
      }
  
      setHasMore(hasNext);
      setPage(nextPage || null);
    } catch (error) {
      if (axios.isCancel(error)) {
        console.log("Petición cancelada:", error.message);
      } else {
        showModal(
          'Alerta',
          'Error al obtener los datos verifique su conexión.'
        );
      }
    } finally {
      setLoading(false);
    }
  };
// useEffect para reiniciar
useEffect(() => {
  if (authIds?.idFuncionario && authIds?.idUnidad) {
    fetchInbox({ isLoadMore: false });
  }
}, [search, sortBy, sortOrder, authIds]);

// Al hacer scroll
const fetchInboxLoadMore = () => {
  fetchInbox({ isLoadMore: true });
};
  
  // useEffect(() => {
  //   if (page !== null) {
  //     fetchInboxLoadMore();
  //   }
  // }, [page]);



  const handleItemPress = async (nroTramite2) => {
    try {
      //AQUI se debe poner el servicion de validacion
      const isConnected = await checkConnection();
      if (!isConnected) {
        return;
      }
  

      const requestBody = {
        id_funcionario: parseInt(authIds.idFuncionario),
        id_unidad: parseInt(authIds.idUnidad),
        nro_tramite: nroTramite2.toString(),
      };
      console.log("Objetos",requestBody);
      const response = await serviceValidacion.create(requestBody);

      if (response.is_in_bandeja== true) {
        navigation.navigate('Home', { nroTramite2 });
      }
      else {
        showModal(
          'Alerta',
          'Este usuario no puede tiene acceso al tramite.'
        );
      }
    } catch (error) {
      showModal(
        'Alerta',
        'Veridique su conexión.'
      );
    }

  };

  const toggleSort = (field) => {
    if (sortBy === field) {
      setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
  };

  const handleLogout = async () => {
    await logout();
    navigation.reset({
      index: 0,
      routes: [{ name: 'Login' }],
    });

  };
  const renderItem = ({ item }) => (
    <TouchableOpacity style={styles.clickableRow} onPress={() => handleItemPress(item.nroTramite)}>
      <View style={styles.tableRow}>
      <Text style={styles.column1} adjustsFontSizeToFit minimumFontScale={0.7} numberOfLines={1}>
        {item.nroTramite}
      </Text>
        <Text style={styles.column2}>{item.descripcion}</Text>
        <View style={styles.column3}>
          <AntDesign name="addfile" size={25} color="#3f008c" />
          <Text style={{fontSize:10}} adjustsFontSizeToFit minimumFontScale={0.7} numberOfLines={1}>Adjuntar</Text>
        </View>
      </View>
   
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
     <ModalAlerta
      visible={modalVisible}
      title={modalTitle}
      description={modalDescription}
      onOk={closeModal}
    />
            <View style={{ flexDirection: 'row', justifyContent: 'flex-end', padding: 1 }}>
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutText}>Cerrar sesión</Text>
        </TouchableOpacity>
        
      </View>
      <Text style={styles.title}>Trámites</Text>
      
      <Text style={styles.searchLabel}>Buscar trámite</Text>

      <View style={styles.inputContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Buscar trámite..."
          placeholderTextColor="#888"
          value={search}
          onChangeText={(text) => setSearch(text)}
        />
       
      </View>

      <View style={[styles.tableRow, styles.headerRow]}>
        <Text
          style={[styles.column1, styles.headerText]}
          onPress={() => toggleSort('st.nroTramite')}
        >
          N° Trámite {sortBy === 'st.nroTramite' ? (sortOrder === 'asc' ? '⬆️' : '⬇️') : ''}
        </Text>

        <Text
          style={[styles.column2, styles.headerText]}
          onPress={() => toggleSort('tt.descripcion')}
        >
          Descripción {sortBy === 'tt.descripcion' ? (sortOrder === 'asc' ? '⬆️' : '⬇️') : ''}
        </Text>
      </View>

      <FlatList
        data={items}
        keyExtractor={(item, index) => item.idTramite?.toString() + index}
        renderItem={renderItem}
        onEndReached={fetchInboxLoadMore}
        onEndReachedThreshold={0.5} 
        ListFooterComponent={loading && <ActivityIndicator size="small" color="#007bff" />}
        ListEmptyComponent={
          !loading && (
            <Text style={styles.emptyText}>El usuario no tiene trámites asignados</Text>
          )
        }
      />



    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 12,
    backgroundColor: '#E6F4F1',
  },
  logoutButton: {
    backgroundColor: '#3f008c',
    paddingVertical: 5,
    paddingHorizontal: 5,
    borderRadius: 5,
  },
  logoutText: {
    color: 'white',
    fontWeight: 'bold',
  },

  title: {
    fontSize: 20,
    fontWeight: '600',
    color: '#37474F', // Gris azulado profesional
    marginBottom: 8,
    textAlign: 'center',
    letterSpacing: 0.5,
    borderBottomWidth: 2,
    borderBottomColor: '#3f008c', // Puedes personalizar desde tu archivo colors.js
    paddingBottom: 6,
    lineHeight: 26,
  },
  searchLabel: {
    fontSize: 16,
    color: '#37474F',
    marginBottom: 4,
    fontWeight: '600',
    color: '#333',
  },
  clickableRow: {
    marginBottom: 1, // Pequeño espacio entre filas
  },
  tableRow: {
    flexDirection: 'row',
    borderColor: '#3f008c',
    textAlign: 'center',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
  },
  headerRow: {
    backgroundColor: '#3f008c',
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
    justifyContent: 'center',
  },
  column1: {
    width: '30%',
    padding: 8,
    fontSize: 11,
    textAlign: 'center',
  },
  column2: {
    width: '55%',
    padding: 8,
    fontSize: 12,
    textAlign: 'center',
  },
  column3: {
    width: '20%',
    padding: 8,
    textAlign: 'center',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerText: {
    color: 'white',
    fontWeight: 'bold',
    textAlign: 'center',
  },
  inputContainer: {
    flexDirection: 'row', // Los elementos estarán en una fila
    alignItems: 'center', // Alineación vertical al centro
    marginBottom: 12, // Espaciado entre el contenedor y el resto de la UI
  },
  searchInput: {
    flex: 1,
    padding: 10,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    backgroundColor: '#fff',
  },
  ordenText: {
    fontSize: 16,
    color: '#333', // Puedes ajustarlo al color que desees
  },
  iconSpacing: {
    marginLeft: 10, // Añade un espacio de 10 unidades entre el campo de texto y el icono
  },
  emptyText: {
    textAlign: 'center',
    color: '#555',
    fontSize: 16,
    marginTop: 20,
  }
});

export default InboxScreen;