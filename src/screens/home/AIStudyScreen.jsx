import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Image,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Feather as Icon } from '@expo/vector-icons';
import { palette, typography, spacing, radius, shadow } from '../../utils/theme';
import fileServices from '../../services/fileServices';
import aiDocService from '../../services/aiDocService';

// Pantalla "Estudiar con la IA": clasifica el documento escaneado (guardado
// por fileServices.savePages) contra el catalogo del backend
// (server/src/catalog.js) y muestra las preguntas preescritas de ese tipo. No
// es un chat libre. Las resoluciones que traen la tabla "RELACION DE
// SUPERFICIE" tienen su propio apartado ("Resoluciones" -> ResolucionesScreen),
// que NO pasa por el clasificador: aca solo se reconoce que el documento es
// una resolucion.
const AIStudyScreen = ({ route }) => {
  const navigation = useNavigation();
  const { fileName } = route?.params || {};

  const [pageImages, setPageImages] = useState([]);
  const [cargandoPaginas, setCargandoPaginas] = useState(true);

  const [catalogo, setCatalogo] = useState([]);
  const [clasificando, setClasificando] = useState(false);
  const [clasificacion, setClasificacion] = useState(null); // { tipo, confianza, razon }
  const [errorClasificacion, setErrorClasificacion] = useState(null);

  const [respuestas, setRespuestas] = useState([]); // [{ pregunta, respuesta, cargando, error }]

  useEffect(() => {
    let cancelado = false;
    (async () => {
      if (!fileName) {
        setCargandoPaginas(false);
        return;
      }
      try {
        const paginas = await fileServices.getPages(fileName);
        if (!cancelado) setPageImages(paginas);
      } catch (e) {
        console.log('[AIStudyScreen] error obteniendo paginas escaneadas', e);
      } finally {
        if (!cancelado) setCargandoPaginas(false);
      }
    })();
    return () => {
      cancelado = true;
    };
  }, [fileName]);

  useEffect(() => {
    aiDocService
      .getCatalog()
      .then((tipos) => setCatalogo(tipos))
      .catch((e) => console.log('[AIStudyScreen] error obteniendo catalogo', e));
  }, []);

  useEffect(() => {
    if (pageImages.length === 0) return;
    let cancelado = false;
    (async () => {
      setClasificando(true);
      setErrorClasificacion(null);
      try {
        // Solo la primera pagina: el tipo de documento se distingue con eso
        // (titulo, sellos, formato) y mandar todas las paginas de una
        // resolucion larga sobrecarga el modelo local (probado: 3 imagenes
        // juntas tumban el proceso de Ollama por memoria).
        const resultado = await aiDocService.classifyDocument(pageImages.slice(0, 1));
        if (!cancelado) setClasificacion(resultado);
      } catch (e) {
        console.log('[AIStudyScreen] error clasificando documento', e);
        if (!cancelado) {
          // aiDocService ya distingue timeout vs. red vs. error del modelo.
          setErrorClasificacion(e.message || 'No se pudo clasificar el documento.');
        }
      } finally {
        if (!cancelado) setClasificando(false);
      }
    })();
    return () => {
      cancelado = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pageImages]);

  const tipoInfo = clasificacion ? catalogo.find((t) => t.code === clasificacion.tipo) : null;

  const preguntar = async (pregunta) => {
    setRespuestas((prev) => [...prev, { pregunta, respuesta: '', cargando: true, error: null }]);
    try {
      // Mismo motivo que en la clasificacion: las preguntas preescritas son
      // sobre datos de la primera pagina (numero de resolucion, propietario,
      // etc.) y mandar todas las paginas sobrecarga el modelo local.
      const respuesta = await aiDocService.askQuestion(pageImages.slice(0, 1), clasificacion.tipo, pregunta);
      setRespuestas((prev) =>
        prev.map((r) => (r.pregunta === pregunta && r.cargando ? { ...r, respuesta, cargando: false } : r)),
      );
    } catch (e) {
      console.log('[AIStudyScreen] error respondiendo pregunta', e);
      setRespuestas((prev) =>
        prev.map((r) =>
          r.pregunta === pregunta && r.cargando
            ? { ...r, cargando: false, error: e.message || 'No se pudo obtener una respuesta.' }
            : r,
        ),
      );
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right', 'bottom']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Icon name="arrow-left" size={20} color={palette.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>
          Estudiar con la IA
        </Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView style={styles.flex} contentContainerStyle={styles.scrollContent}>
        {fileName ? (
          <Text style={styles.contextLabel} numberOfLines={1}>
            Documento: {fileName}
          </Text>
        ) : null}

        {cargandoPaginas ? (
          <View style={styles.pagesRow}>
            <ActivityIndicator size="small" color={palette.primaryDeep} />
            <Text style={styles.pagesHint}>Cargando paginas escaneadas...</Text>
          </View>
        ) : pageImages.length > 0 ? (
          <View style={styles.pagesSection}>
            <Text style={styles.pagesHint}>
              La IA va a analizar estas {pageImages.length}{' '}
              {pageImages.length === 1 ? 'pagina' : 'paginas'}:
            </Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.pagesRowContent}>
              {pageImages.map((uri) => (
                <Image key={uri} source={{ uri }} style={styles.pageThumb} />
              ))}
            </ScrollView>
          </View>
        ) : (
          <Text style={styles.pagesHint}>
            No se encontraron imagenes escaneadas para este documento.
          </Text>
        )}

        {pageImages.length > 0 && (
          <View style={styles.card}>
            {clasificando ? (
              <View style={styles.centeredRow}>
                <ActivityIndicator size="small" color={palette.primaryDeep} />
                <Text style={styles.loadingText}>
                  Analizando documento... (puede tardar hasta un minuto)
                </Text>
              </View>
            ) : errorClasificacion ? (
              <Text style={styles.errorText}>{errorClasificacion}</Text>
            ) : clasificacion ? (
              <>
                <View style={styles.typeBadge}>
                  <Text style={styles.typeBadgeText}>
                    {tipoInfo ? tipoInfo.label : clasificacion.tipo}
                  </Text>
                </View>
                {clasificacion.razon ? <Text style={styles.reasonText}>{clasificacion.razon}</Text> : null}

                {tipoInfo ? (
                  <View style={styles.questionsSection}>
                    <Text style={styles.sectionTitle}>Preguntas sobre este documento</Text>
                    <View style={styles.questionsWrap}>
                      {tipoInfo.preguntas.map((pregunta) => (
                        <TouchableOpacity
                          key={pregunta}
                          style={styles.questionChip}
                          onPress={() => preguntar(pregunta)}>
                          <Text style={styles.questionChipText}>{pregunta}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>
                ) : (
                  <Text style={styles.pagesHint}>
                    No se reconocio el tipo de documento, asi que no hay preguntas preescritas
                    para mostrar.
                  </Text>
                )}
              </>
            ) : null}
          </View>
        )}

        {respuestas.map((r, i) => (
          <View key={`${r.pregunta}-${i}`} style={styles.card}>
            <Text style={styles.questionLabel}>{r.pregunta}</Text>
            {r.cargando ? (
              <View style={styles.centeredRow}>
                <ActivityIndicator size="small" color={palette.primaryDeep} />
                <Text style={styles.loadingText}>Consultando...</Text>
              </View>
            ) : r.error ? (
              <Text style={styles.errorText}>{r.error}</Text>
            ) : (
              <Text style={styles.responseText}>{r.respuesta}</Text>
            )}
          </View>
        ))}

        {tipoInfo?.puedeTraerTablaSuperficie && (
          <View style={styles.card}>
            <Text style={styles.pagesHint}>
              Este documento es una resolución. Para leer su tabla "RELACIÓN DE SUPERFICIE" y armar
              la Hoja2 del Excel, usá el apartado "Resoluciones" en la pantalla principal.
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: palette.background },
  flex: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: palette.surface,
    ...shadow.soft,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: palette.background,
  },
  headerTitle: {
    ...typography.bodyMedium,
    flex: 1,
    marginHorizontal: spacing.md,
    textAlign: 'center',
  },
  headerSpacer: { width: 36 },
  scrollContent: { padding: spacing.xl, paddingBottom: spacing.xxl },
  contextLabel: { ...typography.caption, marginBottom: spacing.md },
  pagesSection: { marginBottom: spacing.lg },
  pagesHint: { ...typography.caption, marginBottom: spacing.sm },
  pagesRow: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.lg },
  pagesRowContent: { flexDirection: 'row', alignItems: 'center' },
  pageThumb: {
    width: 64,
    height: 64,
    borderRadius: radius.sm,
    marginRight: spacing.sm,
    backgroundColor: palette.surface,
  },
  card: {
    backgroundColor: palette.surface,
    borderRadius: radius.card,
    padding: spacing.xl,
    marginBottom: spacing.lg,
    ...shadow.soft,
  },
  centeredRow: { flexDirection: 'row', alignItems: 'center' },
  loadingText: { ...typography.caption, marginLeft: spacing.sm },
  errorText: { ...typography.body, color: palette.danger },
  typeBadge: {
    alignSelf: 'flex-start',
    backgroundColor: palette.primaryLight,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xs,
    marginBottom: spacing.sm,
  },
  typeBadgeText: { ...typography.bodyMedium, color: palette.primaryDeep },
  reasonText: { ...typography.caption, marginBottom: spacing.md },
  sectionTitle: { ...typography.h2, marginBottom: spacing.sm },
  questionsSection: { marginTop: spacing.sm },
  questionsWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  questionChip: {
    backgroundColor: palette.background,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: palette.border,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  questionChipText: { ...typography.caption, color: palette.textPrimary },
  questionLabel: { ...typography.bodyMedium, marginBottom: spacing.sm },
  responseText: { ...typography.body },
});

export default AIStudyScreen;
