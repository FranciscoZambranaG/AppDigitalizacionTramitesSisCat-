import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Text, Image, TextInput } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { crearPdfDesdeImagenes } from '../../utils/crearPdfDesdeImagenes';
import { ActivityIndicator } from 'react-native-paper';
import scanService from '../../services/scanService';
import fileServices from '../../services/fileServices';
import requestStoragePermission from '../../utils/requestPermmissions';
import ModalDescripcion from '../../components/modalDescripcion';
import AsyncStorage from '@react-native-async-storage/async-storage';
import WarningModal from '../../components/WarningModal';
import FilterComponent from '../../components/FilterComponent';
import ListComponent from '../../components/ListComponent';
import NavButtons from '../../components/NavButtons';
import { redimensionarImagen } from '../../utils/redimensionarImagen';
import { useAuth } from '../../hooks/AuthProvider';
import ModalAlerta from '../../components/ModalAlertas';
import http from '../../api/http';
import { abrirSelectorArchivo } from '../../utils/abrirSelectorArchivo';

const HomeScreen = () => {
  const [imagePath, setImagePath] = useState(null);
  const [pdfs, setPdfs] = useState([]);
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigation = useNavigation();
  const [modalDescripcion, setModalDescripcion] = useState(false);
  const [deleteFilePath, setDeleteFilePath] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [scannedImages, setScannedImages] = useState([]);

  // Antes el N° de tramite venia de la pantalla de Tramites. Ahora se ingresa aqui.
  const [nroTramite, setNroTramite] = useState('');

  const { user, logout } = useAuth();
  const idUsuario = user?.preferred_username || user?.sub || '';

  const [modalVisible, setModalVisible] = useState(false);
  const [modalTitle, setModalTitle] = useState('');
  const [modalDescription, setModalDescription] = useState('');

  const getImageDimensions = (uri) => {
    return new Promise((resolve) => {
      Image.getSize(uri, (width, height) => {
        resolve({ width, height });
      }, () => {
        resolve({ width: 0, height: 1 });
      });
    });
  };

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

  useEffect(() => {
    setIsLoading(true);
    requestStoragePermission().then((granted) => {
      if (granted) {
        getFiles();
      } else {
        setIsLoading(false);
      }
    });
  }, []);

  const tramiteValido = () => {
    if (!nroTramite.trim()) {
      showModal('Alerta', 'Ingrese el número de trámite antes de continuar.');
      return false;
    }
    return true;
  };

  const handleScan = () => {
    if (!tramiteValido()) return;
    scanDocument();
  };

  const valSendFile = (file) => {
    if (!tramiteValido()) return;
    handleSendFile(file);
  };

  const getFiles = async () => {
    try {
      setIsLoading(true);
      const fileArr = await fileServices.getAll();
      const allFiles = fileArr.filter(file => file.isFile());

      const stored = await AsyncStorage.getItem('descripciones');
      const descripciones = stored ? JSON.parse(stored) : {};

      const storedTramites = await AsyncStorage.getItem('tramites');
      const tramites = storedTramites ? JSON.parse(storedTramites) : {};

      const filesWithMetadata = allFiles.map(file => {
        const fileName = file.name;
        return {
          ...file,
          descripcion: descripciones[fileName] || 'Sin descripción',
          tramiteAsociado: tramites[fileName] || null
        };
      });

      setPdfs(filesWithMetadata);
    } catch (error) {
      showModal('Alerta', 'Hubo un problema al obtener los archivos.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDescripcionConfirm = async (descripcionInput) => {
    setModalDescripcion(false);
    setIsLoading(true);
    try {
      if (scannedImages.length) {
        await createDocument(scannedImages, descripcionInput);
      } else if (selectedFile) {
        const isImage = selectedFile.name.match(/\.(jpg|jpeg|png|heic)$/i);

        if (isImage) {
          try {
            const { width, height } = await getImageDimensions(selectedFile.uri);
            const rotation = width > height ? 90 : 0;
            const resized = await redimensionarImagen(selectedFile.uri, { rotation });
            await createDocument([resized.uri], descripcionInput);
          } catch (resizeError) {
            await procesarArchivoOriginal(selectedFile, descripcionInput);
          }
        } else {
          await procesarArchivoOriginal(selectedFile, descripcionInput);
        }
      }
    } catch (e) {
      showModal('Alerta', 'Error al procesar el documento.');
    } finally {
      setIsLoading(false);
      setSelectedFile(null);
    }
  };

  const procesarArchivoOriginal = async (file, descripcionInput) => {
    const copied = await fileServices.copyOriginalFile(file.uri, file.name);
    const name = copied.split('/').pop();

    const rawD = await AsyncStorage.getItem('descripciones');
    const mapD = rawD ? JSON.parse(rawD) : {};
    mapD[name] = descripcionInput;
    await AsyncStorage.setItem('descripciones', JSON.stringify(mapD));

    if (nroTramite) {
      const rawT = await AsyncStorage.getItem('tramites');
      const mapT = rawT ? JSON.parse(rawT) : {};
      mapT[name] = nroTramite;
      await AsyncStorage.setItem('tramites', JSON.stringify(mapT));
    }

    await getFiles();
    await handleSendFile({ name, path: copied });
  };

  const scanDocument = async () => {
    try {
      setIsLoading(true);
      setScannedImages([]);
      const newImages = await scanService.getScan();
      if (newImages && newImages.length > 0) {
        const imagenesRedimensionadas = [];

        for (const uri of newImages) {
          try {
            const { width, height } = await getImageDimensions(uri);
            const rotation = width > height ? 90 : 0;
            const resized = await redimensionarImagen(uri, { rotation });
            if (resized?.uri) {
              imagenesRedimensionadas.push(resized.uri);
            }
          } catch (resizeError) {
            imagenesRedimensionadas.push(uri);
          }
        }

        if (imagenesRedimensionadas.length > 0) {
          setScannedImages(imagenesRedimensionadas);
          setImagePath(imagenesRedimensionadas[0]);
          setModalDescripcion(true);
        } else {
          showModal('Alerta', 'No se pudo procesar ninguna imagen escaneada.');
        }
      }
    } catch (error) {
      showModal('Alerta', 'Ocurrió un error durante el escaneo');
    } finally {
      setIsLoading(false);
    }
  };

  const createDocument = async (imagePaths, descripcionInput) => {
    if (!Array.isArray(imagePaths) || imagePaths.length === 0) {
      showModal('Alerta', 'No hay imágenes para crear el documento');
      return;
    }

    setIsLoading(true);
    try {
      const validPaths = imagePaths.filter(path => path && typeof path === 'string');

      if (validPaths.length === 0) {
        showModal('Alerta', 'No se encontraron imágenes válidas para crear el PDF.');
        return;
      }

      const result = await crearPdfDesdeImagenes(validPaths, { name: 'myPdf' });

      if (!result || !result.filePath) {
        throw new Error('El archivo PDF no se creó correctamente.');
      }

      const originalFilePath = result.filePath;
      const copiedFilePath = await fileServices.createPDF(originalFilePath);
      const copiedFileName = copiedFilePath.split('/').pop();

      const stored = await AsyncStorage.getItem('descripciones');
      const descripciones = stored ? JSON.parse(stored) : {};
      descripciones[copiedFileName] = descripcionInput;
      await AsyncStorage.setItem('descripciones', JSON.stringify(descripciones));

      if (nroTramite) {
        const storedTramites = await AsyncStorage.getItem('tramites');
        const tramites = storedTramites ? JSON.parse(storedTramites) : {};
        tramites[copiedFileName] = nroTramite;
        await AsyncStorage.setItem('tramites', JSON.stringify(tramites));
      }

      setScannedImages([]);
      await getFiles();

      const file = { name: copiedFileName, path: copiedFilePath };
      await handleSendFile(file);
    } catch (error) {
      showModal('Alerta', 'No se pudo crear el documento');
    } finally {
      setIsLoading(false);
    }
  };

  const openPDF = async (filePath) => {
    const fileExists = await fileServices.exists(filePath);

    if (!fileExists) {
      showModal('Alerta', 'El archivo no existe');
      return;
    }

    try {
      const fullPath = filePath.startsWith('file://') ? filePath : `file://${filePath}`;
      navigation.navigate('PDFViewer', { filePath: fullPath });
    } catch (error) {
      showModal('Alerta', 'No se pudo abrir el archivo PDF');
    }
  };

  const handleDelete = async (filePath) => {
    setDeleteFilePath(filePath);
  };

  const confirmDelete = async () => {
    if (!deleteFilePath) return;
    setIsLoading(true);
    try {
      const fileName = deleteFilePath.split('/').pop();
      await fileServices.eliminateFile(deleteFilePath);

      const storedDescripciones = await AsyncStorage.getItem('descripciones');
      if (storedDescripciones) {
        const descripciones = JSON.parse(storedDescripciones);
        if (descripciones[fileName]) {
          delete descripciones[fileName];
          await AsyncStorage.setItem('descripciones', JSON.stringify(descripciones));
        }
      }

      const storedTramites = await AsyncStorage.getItem('tramites');
      if (storedTramites) {
        const tramites = JSON.parse(storedTramites);
        if (tramites[fileName]) {
          delete tramites[fileName];
          await AsyncStorage.setItem('tramites', JSON.stringify(tramites));
        }
      }
      showModal('Éxito', 'Archivo eliminado correctamente');

      await getFiles();
    } catch (error) {
      showModal('Alerta', 'No se pudo eliminar el archivo');
    } finally {
      setIsLoading(false);
      setDeleteFilePath(null);
    }
  };

  const handleSendFile = async (file) => {
    try {
      if (!nroTramite) {
        showModal('Alerta', 'No hay un trámite seleccionado. Ingrese el número de trámite primero');
        return;
      }

      if (!file) {
        showModal('Alerta', 'No se ha seleccionado ningún archivo.');
        return;
      }

      setIsLoading(true);

      const stored = await AsyncStorage.getItem('descripciones');
      const descripciones = stored ? JSON.parse(stored) : {};
      const descripcion = descripciones[file.name] || '';

      await sendFile(file, descripcion, nroTramite);

      await fileServices.eliminateFile(file.path);

      if (descripciones[file.name]) {
        delete descripciones[file.name];
        await AsyncStorage.setItem('descripciones', JSON.stringify(descripciones));
      }

      const storedTramites = await AsyncStorage.getItem('tramites');
      if (storedTramites) {
        const tramites = JSON.parse(storedTramites);
        if (tramites[file.name]) {
          delete tramites[file.name];
          await AsyncStorage.setItem('tramites', JSON.stringify(tramites));
        }
      }

      await getFiles();
    } catch (err) {
      showModal(
        'Alerta',
        'El documento no puede ser enviado al sistema SisCat. Este documento ahora se encuentra en la bandeja de no enviados para que pueda intentar enviarlo de nuevo en otro momento.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const sendFile = async (file, descripcionInput, tramiteNumber) => {
    setIsLoading(true);
    if (!file || !file.path || !file.name) {
      showModal('Alerta', 'Archivo no válido.');
      return;
    }
    try {
      const fileUri = file.path.startsWith('file://') ? file.path : `file://${file.path}`;
      const extension = file.name.split('.').pop().toLowerCase();
      let mimeType = 'application/octet-stream';

      switch (extension) {
        case 'pdf': mimeType = 'application/pdf'; break;
        case 'jpg':
        case 'jpeg': mimeType = 'image/jpeg'; break;
        case 'png': mimeType = 'image/png'; break;
        case 'doc': mimeType = 'application/msword'; break;
        case 'docx': mimeType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'; break;
        case 'xls': mimeType = 'application/vnd.ms-excel'; break;
        case 'xlsx': mimeType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'; break;
        case 'zip': mimeType = 'application/zip'; break;
        case 'rar': mimeType = 'application/x-rar-compressed'; break;
      }

      const formData = new FormData();
      formData.append('idUsuario', String(idUsuario));
      formData.append('nroTramite', String(tramiteNumber));
      formData.append('descripcion', descripcionInput);
      formData.append('file', {
        uri: fileUri,
        type: mimeType,
        name: file.name,
      });

      await http.post('/upload_document/', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setIsLoading(false);
      showModal('Atención', 'El documento fue enviado correctamente.');
    } catch (error) {
      throw error;
    }
  };

  const handleAttach = async () => {
    if (!tramiteValido()) return;
    try {
      const file = await abrirSelectorArchivo();
      if (!file || !file.uri || !file.name) {
        showModal('Alerta', 'No se seleccionó ningún archivo válido.');
        return;
      }
      setSelectedFile(file);
      setModalDescripcion(true);
    } catch (err) {
      showModal('Error', 'No se pudo abrir el selector de archivos.');
    }
  };

  const handleLogout = async () => {
    await logout();
    // El navegador vuelve a Login solo al cerrarse la sesión.
  };

  const base = nroTramite.trim()
    ? pdfs.filter(doc => doc.tramiteAsociado === nroTramite.trim())
    : pdfs;

  const myFilter = search
    ? base.filter(doc =>
      doc.name.toLowerCase().includes(search.toLowerCase()) ||
      (typeof doc.descripcion === 'string' && doc.descripcion.toLowerCase().includes(search.toLowerCase()))
    )
    : base;

  return (
    <View style={styles.container}>
      <ModalAlerta
        visible={modalVisible}
        title={modalTitle}
        description={modalDescription}
        onOk={closeModal}
      />

      <Text style={styles.tramiteTitle}>Bandeja de documentos por enviar</Text>

      <Text style={styles.label}>Número de trámite</Text>
      <TextInput
        style={styles.tramiteInput}
        placeholder="Ej. 12345/2026"
        placeholderTextColor="#888"
        value={nroTramite}
        onChangeText={setNroTramite}
        autoCapitalize="characters"
      />

      <FilterComponent search={search} setSearch={setSearch} />
      {isLoading ? (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color="#00ACD8" />
        </View>
      ) : (
        <>
          {myFilter.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>
                {nroTramite.trim()
                  ? `No hay documentos pendientes por enviar para el trámite ${nroTramite.trim()}`
                  : 'No hay documentos disponibles por enviar.'}
              </Text>
            </View>
          ) : (
            <ListComponent
              data={myFilter}
              openPDF={openPDF}
              onDelete={handleDelete}
              onSelect={valSendFile}
              modalVisible={() => { }}
            />
          )}
        </>
      )}

      <View style={styles.bottomNav}>
        <NavButtons
          onLogout={handleLogout}
          onScan={handleScan}
          onAttach={handleAttach}
        />
        <WarningModal
          visible={!!deleteFilePath}
          onCancel={() => setDeleteFilePath(null)}
          onConfirm={confirmDelete}
          iconName="x-circle"
          text="¿Estás seguro de que deseas eliminar este archivo?"
        />
        <ModalDescripcion
          visible={modalDescripcion}
          onClose={() => setModalDescripcion(false)}
          onConfirm={handleDescripcionConfirm}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: '#E6F4F1' },
  tramiteTitle: {
    textAlign: 'center',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#2E2E2E',
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#37474F',
    marginBottom: 4,
  },
  tramiteInput: {
    borderWidth: 1,
    borderColor: '#3f008c',
    borderRadius: 8,
    backgroundColor: '#fff',
    paddingHorizontal: 10,
    paddingVertical: 8,
    marginBottom: 12,
  },
  bottomNav: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 60,
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 10,
    backgroundColor: '#3f008c',
    borderTopLeftRadius: 15,
    borderTopRightRadius: 15
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center'
  }
});

export default HomeScreen;
