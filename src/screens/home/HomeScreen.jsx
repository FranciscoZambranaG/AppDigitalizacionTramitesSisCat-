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
import { abrirSelectorArchivo } from '../../utils/abrirSelectorArchivo';
import { palette, typography, spacing, radius, shadow, fonts } from '../../utils/theme';

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

  // El N° de tramite es opcional: sirve solo como referencia guardada junto al
  // documento. NO bloquea el escaneo.
  const [nroTramite, setNroTramite] = useState('');

  const { logout } = useAuth();

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

  const handleScan = () => {
    scanDocument();
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

  const guardarMetadatos = async ({ fileName, descripcion, paginas }) => {
    const rawD = await AsyncStorage.getItem('descripciones');
    const mapD = rawD ? JSON.parse(rawD) : {};
    mapD[fileName] = descripcion;
    await AsyncStorage.setItem('descripciones', JSON.stringify(mapD));

    const tramite = nroTramite.trim();
    if (tramite) {
      const rawT = await AsyncStorage.getItem('tramites');
      const mapT = rawT ? JSON.parse(rawT) : {};
      mapT[fileName] = tramite;
      await AsyncStorage.setItem('tramites', JSON.stringify(mapT));
    }

    if (paginas && paginas.length) {
      const rawP = await AsyncStorage.getItem('paginas');
      const mapP = rawP ? JSON.parse(rawP) : {};
      mapP[fileName] = paginas;
      await AsyncStorage.setItem('paginas', JSON.stringify(mapP));
    }
  };

  const borrarMetadatos = async (fileName) => {
    for (const key of ['descripciones', 'tramites', 'paginas']) {
      const raw = await AsyncStorage.getItem(key);
      if (!raw) continue;
      const map = JSON.parse(raw);
      if (map[fileName] !== undefined) {
        delete map[fileName];
        await AsyncStorage.setItem(key, JSON.stringify(map));
      }
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

  // Copia un archivo adjuntado (no imagen) tal cual al almacenamiento local.
  const procesarArchivoOriginal = async (file, descripcionInput) => {
    const copied = await fileServices.copyOriginalFile(file.uri, file.name);
    const name = copied.split('/').pop();
    await guardarMetadatos({ fileName: name, descripcion: descripcionInput });
    await getFiles();
    showModal('Listo', 'El documento se guardó en la aplicación.');
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

  // Arma el PDF (para ver) y guarda ademas cada pagina como JPEG (para la IA futura).
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

      const copiedFilePath = await fileServices.createPDF(result.filePath);
      const copiedFileName = copiedFilePath.split('/').pop();

      const paginas = await fileServices.savePages(validPaths, copiedFileName);

      await guardarMetadatos({
        fileName: copiedFileName,
        descripcion: descripcionInput,
        paginas,
      });

      setScannedImages([]);
      await getFiles();
      showModal('Listo', 'El documento se guardó en la aplicación.');
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
      await fileServices.deletePages(fileName);
      await borrarMetadatos(fileName);
      showModal('Éxito', 'Archivo eliminado correctamente');
      await getFiles();
    } catch (error) {
      showModal('Alerta', 'No se pudo eliminar el archivo');
    } finally {
      setIsLoading(false);
      setDeleteFilePath(null);
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

      <Text style={styles.tramiteTitle}>Documentos escaneados</Text>

      <Text style={styles.label}>Número de trámite (opcional)</Text>
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
                  ? `No hay documentos guardados para el trámite ${nroTramite.trim()}`
                  : 'Todavía no hay documentos escaneados. Usá el botón "Escanear".'}
              </Text>
            </View>
          ) : (
            <ListComponent
              data={myFilter}
              openPDF={openPDF}
              onDelete={handleDelete}
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
  container: {
    flex: 1,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xl,
    backgroundColor: palette.background,
  },
  tramiteTitle: {
    ...typography.h1,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  label: {
    ...typography.caption,
    fontFamily: fonts.medium,
    marginBottom: spacing.sm,
  },
  tramiteInput: {
    borderWidth: 1,
    borderColor: palette.border,
    borderRadius: radius.sm,
    backgroundColor: palette.surface,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: spacing.lg,
    fontFamily: fonts.regular,
    fontSize: 15,
    color: palette.textPrimary,
    ...shadow.soft,
  },
  bottomNav: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    minHeight: 68,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.md,
    backgroundColor: palette.surface,
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    ...shadow.nav,
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  emptyText: {
    ...typography.caption,
    fontSize: 15,
    textAlign: 'center',
  },
});

export default HomeScreen;
