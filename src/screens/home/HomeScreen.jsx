import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Text, Image } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { crearPdfDesdeImagenes } from '../../utils/crearPdfDesdeImagenes';
import { ActivityIndicator } from 'react-native-paper';
import scanService from '../../services/scanService';
import fileServices from '../../services/fileServices';
import requestStoragePermission from '../../utils/requestPermmissions';
import ModalDescripcion from '../../components/modalDescripcion';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import tramiteService from '../../services/tramiteService';
import WarningModal from '../../components/WarningModal';
import FilterComponent from '../../components/FilterComponent';
import ListComponent from '../../components/ListComponent';
import NavButtons from '../../components/NavButtons';
import { redimensionarImagen } from '../../utils/redimensionarImagen';
import { useAuth } from '../../hooks/AuthProvider';
import ModalAlerta from '../../components/ModalAlertas';
import baseUrl from '../../api/baseUrl';
import { abrirSelectorArchivo } from '../../utils/abrirSelectorArchivo';

const HomeScreen = () => {
  const [imagePath, setImagePath] = useState(null);
  const [pdfs, setPdfs] = useState([]);
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigation = useNavigation();
  const route = useRoute();
  const [modalDescripcion, setModalDescripcion] = useState(false);
  const [deleteFilePath, setDeleteFilePath] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [scannedImages, setScannedImages] = useState([]);

  const nroTramite2 = String(route.params?.nroTramite2);
  const { authIds } = useAuth();

  const idUsuario = authIds.idUsuario;
  const funcionario = authIds.idFuncionario;
  const unidad = authIds.idUnidad;

  const [modalVisible, setModalVisible] = useState(false);
  const [modalTitle, setModalTitle] = useState('');
  const [modalDescription, setModalDescription] = useState('');

  const getImageDimensions = (uri) => {
    return new Promise((resolve, reject) => {
      Image.getSize(uri, (width, height) => {
        resolve({ width, height });
      }, (error) => {
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
  }, [nroTramite2]);

  const datosTramite = {
    id_funcionario: funcionario,
    id_unidad: unidad,
    nro_tramite: nroTramite2
  };

  const handleScan = () => {
    validarYAccionar(() => scanDocument());
  };

  const valSendFile = file => {
    validarYAccionar(() => handleSendFile(file));
  };

  const validarYAccionar = async (onSuccess) => {
    try {
      const respuesta = await tramiteService.validarTramite(datosTramite);
      if (respuesta.is_in_bandeja === true) {
        onSuccess();
      } else {
        showModal(
          'Alerta',
          'Ya no tiene acceso a este tramite.'
        );
      }
    } catch (error) {
      showModal(
        'Alerta',
        'Por favor, compruebe su conexión de internet'
      );
    }
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

      let filteredFiles = filesWithMetadata;
      if (nroTramite2) {
        filteredFiles = filesWithMetadata.filter(file =>
          file.tramiteAsociado === nroTramite2
        );
      }

      setPdfs(filteredFiles);
    } catch (error) {
      showModal(
        'Alerta',
        'Hubo un problema al obtener los archivos.'
      );
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
    const copied = await fileServices.copyOriginalFile(
      file.uri,
      file.name,
    );
    const name = copied.split('/').pop();

    const rawD = await AsyncStorage.getItem('descripciones');
    const mapD = rawD ? JSON.parse(rawD) : {};
    mapD[name] = descripcionInput;
    await AsyncStorage.setItem('descripciones', JSON.stringify(mapD));

    if (nroTramite2) {
      const rawT = await AsyncStorage.getItem('tramites');
      const mapT = rawT ? JSON.parse(rawT) : {};
      mapT[name] = nroTramite2;
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
            // si falla el redimensionado, se usa la imagen original
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
      showModal(
        'Alerta',
        'Ocurrió un error durante el escaneo'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const createDocument = async (imagePaths, descripcionInput) => {
    if (!Array.isArray(imagePaths) || imagePaths.length === 0) {
      showModal(
        'Alerta',
        'No hay imágenes para crear el documento'
      );
      return;
    }

    setIsLoading(true);
    try {
      const validPaths = imagePaths.filter(
        path => path && typeof path === 'string',
      );

      if (validPaths.length === 0) {
        showModal(
          'Alerta',
          'No se encontraron imágenes válidas para crear el PDF.',
        );
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

      if (nroTramite2) {
        const storedTramites = await AsyncStorage.getItem('tramites');
        const tramites = storedTramites ? JSON.parse(storedTramites) : {};
        tramites[copiedFileName] = nroTramite2;
        await AsyncStorage.setItem('tramites', JSON.stringify(tramites));
      }

      setScannedImages([]);
      await getFiles();

      const file = {
        name: copiedFileName,
        path: copiedFilePath,
      };
      await handleSendFile(file);

    } catch (error) {
      showModal(
        'Alerta',
        'No se pudo crear el documento'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const openPDF = async (filePath) => {
    const fileExists = await fileServices.exists(filePath);

    if (!fileExists) {
      showModal(
        'Alerta',
        'El archivo no existe'
      );
      return;
    }

    try {
      const fullPath = filePath.startsWith('file://') ? filePath : `file://${filePath}`;
      navigation.navigate('PDFViewer', { filePath: fullPath });
    } catch (error) {
      showModal(
        'Alerta',
        'No se pudo abrir el archivo PDF'
      );
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
      showModal(
        'Éxito',
        'Archivo eliminado correctamente'
      );

      await getFiles();
    } catch (error) {
      showModal(
        'Alerta',
        'No se pudo eliminar el archivo'
      );
    } finally {
      setIsLoading(false);
      setDeleteFilePath(null);
    }
  };

  const handleSendFile = async (file) => {
    try {
      if (!nroTramite2) {
        showModal(
          'Alerta',
          'No hay un trámite seleccionado. Por favor, seleccione un trámite primero'
        );
        return;
      }

      if (!file) {
        showModal(
          'Alerta',
          'No se ha seleccionado ningún archivo.'
        );
        return;
      }

      setIsLoading(true);

      const stored = await AsyncStorage.getItem('descripciones');
      const descripciones = stored ? JSON.parse(stored) : {};
      const descripcion = descripciones[file.name] || '';

      await sendFile(file, descripcion, nroTramite2);

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
      showModal(
        'Alerta',
        'Archivo no válido.'
      );
      return;
    }
    try {
      const fileUri = file.path.startsWith('file://') ? file.path : `file://${file.path}`;
      const extension = file.name.split('.').pop().toLowerCase();
      let mimeType = 'application/octet-stream';

      switch (extension) {
        case 'pdf':
          mimeType = 'application/pdf';
          break;
        case 'jpg':
        case 'jpeg':
          mimeType = 'image/jpeg';
          break;
        case 'png':
          mimeType = 'image/png';
          break;
        case 'doc':
          mimeType = 'application/msword';
          break;
        case 'docx':
          mimeType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
          break;
        case 'xls':
          mimeType = 'application/vnd.ms-excel';
          break;
        case 'xlsx':
          mimeType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
          break;
        case 'zip':
          mimeType = 'application/zip';
          break;
        case 'rar':
          mimeType = 'application/x-rar-compressed';
          break;
      }

      const formData = new FormData();
      formData.append('idUsuario', idUsuario);
      formData.append('nroTramite', nroTramite2);
      formData.append('descripcion', descripcionInput);
      formData.append('file', {
        uri: fileUri,
        type: mimeType,
        name: file.name,
      });

      await axios.postForm(`${baseUrl}/upload_document/`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setIsLoading(false);
      showModal(
        'Atención',
        'El documento fue enviado correctamente.'
      );
    } catch (error) {
      throw error;
    }
  };

  const handleAttach = async () => {
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

  const myFilter = search
    ? pdfs.filter(doc =>
      doc.name.toLowerCase().includes(search.toLowerCase()) ||
      (typeof doc.descripcion === 'string' && doc.descripcion.toLowerCase().includes(search.toLowerCase()))
    )
    : pdfs;

  return (
    <View style={styles.container}>
      <ModalAlerta
        visible={modalVisible}
        title={modalTitle}
        description={modalDescription}
        onOk={closeModal}
      />

      <Text style={styles.tramiteTitle}>Bandeja de documentos por enviar</Text>
      {nroTramite2 && (
        <Text style={styles.tramiteTitledesc}>
          Trámite seleccionado: {nroTramite2}
        </Text>
      )}
      <FilterComponent search={search} setSearch={setSearch} />
      {isLoading ? (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color="#00ACD8" />
        </View>
      ) : (
        <>
          {pdfs.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>
                {nroTramite2
                  ? `No hay documentos pendientes por enviar para el trámite ${nroTramite2}`
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
          onNavigate={() =>
            navigation.reset({
              index: 0,
              routes: [{ name: 'Inbox' }],
            })
          }
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
  tramiteTitledesc: {
    textAlign: 'center',
    fontSize: 15,
    fontWeight: 'normal',
    marginBottom: 8,
    color: '#2E2E2E',
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