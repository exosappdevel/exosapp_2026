import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Platform,
  KeyboardAvoidingView,
  Alert,
  Modal,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useApp } from '../context/AppContext';
import ApiService from '@/services/ApiServices';
import CustomModal from '../components/CustomModal';
import { _Header, _Background, _checkBox, _Footer, _FotosCarousel, _PickerModal, _PinModal, _TouchableWithoutFeedback, _footer_baseHeight, hexToRGBA, playSuccessSound, playErrorSound } from '../components/elidev_components';
import * as ImagePicker from 'expo-image-picker';

interface iFabricante {
  id_fabricante: string;
  fabricante: string;
}

interface iPiezaReportada {
  id_registro: string;
  codigo_registro: string;
  codigo_cirugia: string;
  codigo_activo: string;
  referencia: string;
  lote: string;
  comentarios: string;
  archivos: any[];
}

// Valor fijo enviado como en_inventario mientras se prueba el flujo (ver
// backend: registrar_pieza_danada solo valida el lote contra inventario
// cuando en_inventario == 1, así que "0" evita esa validación).
export default function Reporte_Piezas_DanadasScreen() {
  const router = useRouter();
  const { user, theme, t, appConfig } = useApp();

  const pageConfig = {
    name: t('screens.reporte_piezas_danadas'),
    icon: "alert-decagram-outline",
    previous: "calidad",
    show_user: true,
    show_menu: true,
    show_in_recent: true,
    path: '/reporte_piezas_danadas'
  };

  const { width, height } = useWindowDimensions();
  const margin_height = 70;
  const _ClientHeight = height - 175 - margin_height;
  const insets = useSafeAreaInsets();
  const carouselWidth = Math.round(width * 0.95);
  const carouselHeight = Math.round(height * 0.8);
  const footerClearance = _footer_baseHeight(false) + insets.bottom + 20;
  

  // --- Acceso con PIN + inicio del reporte (id_reporte/codigo_reporte) ---
  const [showPinModal, setShowPinModal] = useState(false);
  const [accessGranted, setAccessGranted] = useState(true);
  const [idReporte, setIdReporte] = useState('');
  const [codigoReporte, setCodigoReporte] = useState('');

  // --- Fabricantes ---
  const [fabricantes, setFabricantes] = useState<iFabricante[]>([]);
  const [showFabricantePicker, setShowFabricantePicker] = useState(false);

  // --- Formulario (una pieza a la vez) ---
  const [codigoCirugia, setCodigoCirugia] = useState('');
  const [codigoActivo, setCodigoActivo] = useState('');
  const [fabricante, setFabricante] = useState<iFabricante | null>(null);
  const [referencia, setReferencia] = useState('');
  const [lote, setLote] = useState('');
  const [comentarios, setComentarios] = useState('');
  const [en_inventario, setEn_inventario] = useState('0');
  const [saving, setSaving] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [archivos, setArchivos] = useState<any[]>([]);
  const [archivos_pieza, setArchivos_pieza] = useState<any[]>([]);


  const [showCarousel, setShowCarousel] = useState(false);
  // Distingue si el carousel debe mostrar las fotos del formulario en curso
  // (aún no guardadas, "archivos") o las de una pieza ya guardada
  // ("archivos_pieza"), para no renderizar los dos carouseles a la vez.
  const [carouselMode, setCarouselMode] = useState<'form' | 'pieza'>('form');
  // Las fotos de "archivos" aún no se han subido (son locales, seleccionadas
  // de galería/cámara), así que se usan sus URIs tal cual, no via
  // getServerFileUrl (esa es para convertir rutas relativas del servidor).
  const fotoUrls: string[] = (archivos || []).map((f: any) => f.uri);
  const fotoUrls_pieza: string[] = (archivos_pieza || []).map((f: any) => f.uri);

  // --- Piezas ya agregadas a este reporte ---
  const [piezas, setPiezas] = useState<iPiezaReportada[]>([]);

  const [modal, setModal] = useState({
    visible: false,
    titulo: '',
    mensaje: '',
    icon: 'alert-circle-outline',
    colorIcon: '#f56565'
  });

  useEffect(() => {
    ApiService.init(appConfig);
    loadFabricantes();
  }, []);

  const loadFabricantes = async () => {
    try {
      const response = await ApiService.get_fabricante_list("1");
      if (Array.isArray(response.data)) {
        setFabricantes(response.data);
        setFabricante(response.data[0] || null); // Selecciona el primer fabricante por defecto
      }
    } catch (e) {
      console.log('Error loading fabricantes:', e);
    }
  };

  const showError = (mensaje: string) => {
    setModal({
      visible: true,
      titulo: t('common.error'),
      mensaje,
      icon: 'alert-circle-outline',
      colorIcon: '#f56565'
    });
  };

  const resetForm = () => {
    setCodigoCirugia('');
    setCodigoActivo('');
    setFabricante(fabricantes[0] || null);
    setReferencia('');
    setLote('');
    setComentarios('');
    setEn_inventario('0');
    setArchivos([]);
  };

  const handleAgregarPieza = async () => {
    if (!codigoCirugia || !codigoActivo || !fabricante || !referencia || !lote || !comentarios) {
      showError(t('reporte_piezas_danadas.validation_error'));
      return;
    }

    let currentIdReporte = idReporte;
    let currentCodigoReporte = codigoReporte;

    if (!idReporte || !codigoReporte) {
      try {
        const response = await ApiService.iniciar_reporte_pieza_danada(user?.id_usuario || '', user?.id_almacen || '');
        if (response?.result === 'ok') {
          currentIdReporte = response.id_reporte;
          currentCodigoReporte = response.codigo_reporte;

          setIdReporte(response.id_reporte);
          setCodigoReporte(response.codigo_reporte);
        } else {
          showError(response?.result_text || t('common.connectionError'));
          return;
        }
      } catch {
        showError(t('common.connectionError'));
        return;
      }
    }

    setSaving(true);
    try {
      const response = await ApiService.registrar_pieza_danada(
        currentIdReporte,
        currentCodigoReporte,
        user?.id_almacen || '',
        codigoCirugia,
        codigoActivo,
        en_inventario,
        fabricante.id_fabricante,
        referencia,
        lote,
        comentarios
      );

      if (response?.result === 'ok') {

        let urlsSubidas: string[] = [];
        const archivosParaEnviar = archivos.map(a => ({ ...a }));

        for (const archivo of archivosParaEnviar) {
          // Solo subimos si es un objeto local (tiene uri local)
          //alert(JSON.stringify(archivo));
          const urlServidor = await ApiService.uploadFileDirect("piezas_danadas", 'pieza', archivo);

          if (urlServidor) {
            archivo.url = urlServidor;
            const response_foto = await ApiService.guardar_foto_reporte_piezas_danadas(response.id_registro, urlServidor, user?.id_usuario || '');
            if (response_foto?.result === 'ok') {
              archivo.id_foto = response_foto.id_foto;
            } else {
              showError(response_foto?.result_text || t('common.connectionError'));
            }
          } else {
            showError(t('common.connectionError'));
          }
        }


        setPiezas(prev => [...prev, {
          id_registro: response.id_registro,
          codigo_registro: response.codigo_registro,
          codigo_cirugia: codigoCirugia,
          codigo_activo: codigoActivo,
          referencia,
          lote,
          comentarios,
          archivos: archivosParaEnviar
        }]);

        resetForm();
      } else {
        showError(response?.result_text || t('common.connectionError'));
      }
    } catch {
      showError(t('common.connectionError'));
    } finally {
      setSaving(false);
    }
  };

  const pickImageFromGallery = async (pieza: any) => {
    try {
      // Antes usaba DocumentPicker con type:"*/*", que abre el explorador de
      // archivos general (Files/iCloud/cualquier documento) en vez de la
      // galería de fotos. mediaTypes:['images'] restringe launchImageLibraryAsync
      // a solo imágenes, igual que el botón "Cámara" de al lado.
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        showError(t('reporte_piezas_danadas.gallery_permission_denied'));
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        quality: 0.5,
      });

      if (!result.canceled) {
        const asset = result.assets[0];

        // Creamos el objeto con la estructura que necesita ApiService.uploadFileDirect
        const nuevoArchivo = {
          uri: asset.uri,
          name: asset.fileName || asset.uri.split('/').pop() || 'imagen.jpg',
          type: asset.mimeType || 'image/jpeg',
          url: '',
          id: 0,
          id_foto: ''
        };

        // Guardamos en tu estado de archivos (el array que se subirá al final)
        if (!pieza) {
          setArchivos((prev: any) => [...prev, nuevoArchivo]);
        } else {
          const urlServidor = await ApiService.uploadFileDirect("piezas_danadas", 'pieza', nuevoArchivo);

          if (urlServidor) {
            nuevoArchivo.url = urlServidor;
            const response_foto = await ApiService.guardar_foto_reporte_piezas_danadas(
              pieza.id_registro,
              urlServidor,
              user?.id_usuario || ''
            );

            if (response_foto?.result === 'ok') {
              nuevoArchivo.id_foto = response_foto.id_foto;

              // Actualización inmutable correcta
              setPiezas((prevPiezas: any[]) =>
                prevPiezas.map((p) => {
                  if (p.id_registro === pieza.id_registro) {
                    return {
                      ...p,
                      archivos: [...(p.archivos || []), nuevoArchivo]
                    };
                  }
                  return p;
                })
              );
            } else {
              showError(response_foto?.result_text || t('common.connectionError'));
            }
          } else {
            showError(t('common.connectionError'));
          }
        }
      }
    } catch (err) {
      console.error("Error al seleccionar imagen de la galería:", err);
      showError(t('common.connectionError'));
    }
  };
  const takePhoto = async (pieza: any) => {
    try {
      // launchCameraAsync pide el permiso solo la PRIMERA vez; si ya fue
      // denegado antes (p.ej. en una instalación previa), iOS no vuelve a
      // mostrar el diálogo y launchCameraAsync simplemente no abre nada, sin
      // lanzar ningún error — por eso "la cámara no abre" pasaba en
      // silencio. Pidiendo el permiso explícito podemos detectar ese caso y
      // avisarle al usuario que tiene que activarlo manualmente en Ajustes.
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        showError(t('reporte_piezas_danadas.camera_permission_denied'));
        return;
      }

      let result = await ImagePicker.launchCameraAsync({ quality: 0.5 });
      if (!result.canceled) {
        const asset = result.assets[0];
        const nuevoArchivo = {
          uri: asset.uri,
          name: asset.uri.split('/').pop() || 'photo.jpg',
          type: 'image/jpeg',
          url: '',
          id: 0,
          id_foto: ''
        };

        if (!pieza) {
          setArchivos(prev => [...prev, nuevoArchivo]);
        } else {
          const urlServidor = await ApiService.uploadFileDirect("piezas_danadas", 'pieza', nuevoArchivo);

          if (urlServidor) {
            nuevoArchivo.url = urlServidor;
            const response_foto = await ApiService.guardar_foto_reporte_piezas_danadas(
              pieza.id_registro,
              urlServidor,
              user?.id_usuario || ''
            );

            if (response_foto?.result === 'ok') {
              nuevoArchivo.id_foto = response_foto.id_foto;

              // Actualización inmutable correcta
              setPiezas((prevPiezas: any[]) =>
                prevPiezas.map((p) => {
                  if (p.id_registro === pieza.id_registro) {
                    return {
                      ...p,
                      archivos: [...(p.archivos || []), nuevoArchivo]
                    };
                  }
                  return p;
                })
              );
            } else {
              showError(response_foto?.result_text || t('common.connectionError'));
            }
          } else {
            showError(t('common.connectionError'));
          }
        }
      }
    } catch (err) {
      console.error("Error al tomar foto:", err);
      showError(t('common.connectionError'));
    }
  };

  const Finaliza_reporte = async () => {
    try {
      setIsSubmitting(true);
      const response = await ApiService.finalizar_reporte_pieza_danada(idReporte, user?.id_usuario || '');
      setIsSubmitting(false);

      const mensaje = response?.result_text || "Error desconocido";
      const esExito = response?.result === "ok";
      if (Platform.OS === "web") {
        playSuccessSound();
        alert(esExito ? `${t('common.success')}: ${mensaje}` : `${t('common.notice')}: ${mensaje}`);
        if (esExito) {
          setIdReporte('');
          setCodigoReporte('');
          setPiezas([]);
          resetForm();
        }
        else {
          playErrorSound();
        }
      } else {
        playSuccessSound();
        Alert.alert(esExito ? t('common.success') : t('common.notice'), mensaje, [
          {
            text: "OK", onPress: () => {
              if (esExito) {
                setIdReporte('');
                setCodigoReporte('');
                setPiezas([]);
                resetForm();
              }
            }
          },
        ]);
      }
    } catch {
      setIsSubmitting(false);
      const errorMsg = t('common.connectionError');
      Platform.OS === "web" ? alert(errorMsg) : Alert.alert(t('common.error'), errorMsg);
    }
  };

  const handleEliminarPieza = async (id_registro: string) => {
    const elimina_pieza = () => {
      setPiezas((prev: any[]) => {
        const nuevaLista = prev.filter((f) => f.id_registro !== id_registro);
        return nuevaLista;
      });
      // Si el carousel de fotos estaba abierto mostrando las fotos de una
      // pieza (no las del formulario en curso), se cierra también, ya que
      // esas fotos dejaron de existir al eliminarse la pieza.
      if (carouselMode === 'pieza') {
        setShowCarousel(false);
        setArchivos_pieza([]);
      }
    };

    if (Platform.OS === "web") {
      if (confirm(t('reporte_piezas_danadas.delete_foto_confirm'))) {
        const response = await ApiService.eliminar_pieza_danada(id_registro);
        if (response?.result == "ok") {
          elimina_pieza();
        } else {
          showError(response?.result_text || t('common.connectionError'));
        }
      }
    } else {
      Alert.alert("Check Out", t('reporte_piezas_danadas.delete_foto_confirm'), [
        { text: "No" },
        {
          text: "Sí", onPress: async () => {
            const response = await ApiService.eliminar_pieza_danada(id_registro);
            if (response?.result == "ok") {
              elimina_pieza();
            } else {
              showError(response?.result_text || t('common.connectionError'));
            }
          }
        },
      ]);
    }
  };

  const handleFinalizaReporte = async () => {
    if (!idReporte) {
      showError(t('reporte_piezas_danadas.no_reporte_error'));
      return;
    }

    confirma_finalizar();
  };

  const confirma_finalizar = async () => {
    if (Platform.OS === "web") {
      if (confirm(t('reporte_piezas_danadas.finalize_confirm'))) setShowPinModal(true);
    } else {
      Alert.alert("Check Out", t('reporte_piezas_danadas.finalize_confirm'), [
        { text: "No" },
        { text: "Sí", onPress: () => { setShowPinModal(true) } },
      ]);
    }
  };

  const handlePinSuccess = async () => {
    setShowPinModal(false);
    Finaliza_reporte();
  };

  const handlePinCancel = () => {
    setShowPinModal(false);
    showError(t('reporte_piezas_danadas.pin_message_cancel'));
  };

  const deleteFoto_byIndex = (index: number) => {
    if (Platform.OS === "web") {
      if (confirm(t('reporte_piezas_danadas.delete_foto_confirm'))) {
        setArchivos(archivos.filter((_, i) => i !== index));
      }
    } else {
      Alert.alert("Check Out", t('reporte_piezas_danadas.delete_foto_confirm'), [
        { text: "No" },
        { text: "Sí", onPress: () => { setArchivos(archivos.filter((_, i) => i !== index)); } },
      ]);
    }

  };

  const deleteFoto_byKey = (key: any) => {
    const ejecutarEliminacion = () => {
      setArchivos((prev: any[]) => {
        const nuevaLista = prev.filter((f) => f.uri !== key);

        // 'nuevaLista.length' tiene la cantidad real actualizada
        setShowCarousel(showCarousel && nuevaLista.length > 0);

        return nuevaLista;
      });
    };
    if (Platform.OS === "web") {
      if (confirm(t('reporte_piezas_danadas.delete_foto_confirm'))) {
        ejecutarEliminacion();
      }
    } else {
      Alert.alert("Check Out", t('reporte_piezas_danadas.delete_foto_confirm'), [
        { text: "No" },
        {
          text: "Sí", onPress: () => { ejecutarEliminacion(); }
        },
      ]);
    }
  };


  const deleteFoto_byIDFoto = async (id_foto: any) => {

    const ejecutarEliminacion = () => {

      setArchivos_pieza((prev: any[]) => {
        const nuevaLista = prev.filter((f) => f.id_foto !== id_foto);

        // 'nuevaLista.length' tiene la cantidad real actualizada
        setShowCarousel(showCarousel && nuevaLista.length > 0);

        return nuevaLista;
      });

      // También se quita de la pieza a la que pertenece, para que la lista
      // de archivos debajo de esa pieza (fuera del carousel) quede al día.
      setPiezas((prev) => prev.map((p) => ({
        ...p,
        archivos: p.archivos.filter((f: any) => f.id_foto !== id_foto),
      })));
    };
    if (Platform.OS === "web") {
      if (confirm(t('reporte_piezas_danadas.delete_foto_confirm'))) {
        const response = await ApiService.eliminar_foto_reporte_piezas_danadas(id_foto);
        if (response?.result == "ok") {
          ejecutarEliminacion();
        } else {
          showError(response?.result_text || t('common.connectionError'));
        }
      }
    } else {
      Alert.alert("Check Out", t('reporte_piezas_danadas.delete_foto_confirm'), [
        { text: "No" },
        {
          text: "Sí", onPress: async () => {
            const response = await ApiService.eliminar_foto_reporte_piezas_danadas(id_foto);
            if (response?.result == "ok") {
              ejecutarEliminacion();
            } else {
              showError(response?.result_text || t('common.connectionError'));
            }
          }
        },
      ]);
    }
  };

  return (
    <_Background id_almacen={user?.id_almacen}>
      <SafeAreaView style={styles.container}>
        <_Header page_info={pageConfig} />

        {accessGranted ? (
          <KeyboardAvoidingView
            // En Android, Expo ya deja "windowSoftInputMode: resize" por default
            // (no hay override en app.json), así que el propio SO encoge la
            // ventana cuando aparece el teclado. Si aquí además se usa
            // behavior="height", KeyboardAvoidingView vuelve a encoger el alto
            // por su cuenta ENCIMA de eso, y como el ScrollView hijo tiene un
            // maxHeight fijo (calculado antes de que el teclado apareciera),
            // el resultado es que su caja termina sin respetar ese maxHeight
            // (se ve más chica/más grande de lo esperado, o salta). En Android
            // se deja sin behavior para que solo el resize nativo del SO actúe.
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            style={{ flex: 1 }}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 10 : 10}
          >
            <ScrollView
              style={[styles.content, { maxHeight: _ClientHeight }]}
              contentContainerStyle={{ paddingBottom: footerClearance }}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >

              {/*<Text style={[styles.codigoReporte, { color: theme.accent }]}>{codigoReporte}</Text>*/}

              {/* SECCIÓN 1: Formulario */}
              <View style={[styles.sectionCard, { backgroundColor: hexToRGBA(theme.card, 0.8), borderColor: theme.border }]}>
                <Text style={[styles.sectionTitle, { color: theme.text }]}>{t('reporte_piezas_danadas.form_title')}</Text>
                <View style={{ /*flexDirection: 'row', justifyContent: 'space-between'*/ }}>

                  <_TouchableWithoutFeedback>
                    <View style={styles.fieldContainer}>
                      <Text style={[styles.label, { color: theme.text }]}>{t('reporte_piezas_danadas.codigo_cirugia')}*</Text>
                      <TextInput
                        style={[styles.input, { backgroundColor: theme.inputBg, borderColor: theme.border, color: theme.text }]}
                        placeholder="Ej. 25CX001GDL"
                        placeholderTextColor={theme.textSub}
                        value={codigoCirugia}
                        onChangeText={setCodigoCirugia}
                        autoCapitalize="characters"
                      />
                    </View>
                  </_TouchableWithoutFeedback>

                  <_TouchableWithoutFeedback>
                    <View style={styles.fieldContainer}>
                      <Text style={[styles.label, { color: theme.text }]}>{t('reporte_piezas_danadas.codigo_activo')}*</Text>
                      <TextInput
                        style={[styles.input, { backgroundColor: theme.inputBg, borderColor: theme.border, color: theme.text }]}
                        placeholder="Ej. PROPIEDAD EXORTA INSTRUMENTAL CADERA 01"
                        placeholderTextColor={theme.textSub}
                        value={codigoActivo}
                        onChangeText={setCodigoActivo}
                        autoCapitalize="characters"
                      />
                    </View>
                  </_TouchableWithoutFeedback>

                  <View style={styles.fieldContainer}>

                    <_checkBox
                      key_id='en_inventario_checkbox'
                      use_switch={true}
                      value={en_inventario === '1'}
                      setValue={() => setEn_inventario(en_inventario === '1' ? '0' : '1')}
                      text={t('reporte_piezas_danadas.en_inventario')}
                      labelStyle={{ textAlign: "left", fontSize: 13 }}
                    />
                  </View>

                  <View style={styles.fieldContainer}>
                    <Text style={[styles.label, { color: theme.text }]}>{t('reporte_piezas_danadas.id_fabricante')}*</Text>
                    <TouchableOpacity
                      style={[styles.input, styles.selector, { backgroundColor: theme.inputBg, borderColor: theme.border }]}
                      onPress={() => setShowFabricantePicker(true)}
                    >
                      <Text style={{ color: fabricante ? theme.text : theme.textSub }}>
                        {fabricante?.fabricante || t('reporte_piezas_danadas.select_fabricante')}
                      </Text>
                      <MaterialCommunityIcons name="chevron-down" size={20} color={theme.textSub} />
                    </TouchableOpacity>
                  </View>

                  <_TouchableWithoutFeedback>
                    <View style={styles.fieldContainer}>
                      <Text style={[styles.label, { color: theme.text }]}>{t('reporte_piezas_danadas.referencia')}*</Text>
                      <TextInput
                        style={[styles.input, { backgroundColor: theme.inputBg, borderColor: theme.border, color: theme.text }]}
                        placeholderTextColor={theme.textSub}
                        value={referencia}
                        onChangeText={setReferencia}
                        autoCapitalize="characters"
                      />
                    </View>
                  </_TouchableWithoutFeedback>

                  <_TouchableWithoutFeedback>
                    <View style={styles.fieldContainer}>
                      <Text style={[styles.label, { color: theme.text }]}>{t('reporte_piezas_danadas.lote')}*</Text>
                      <TextInput
                        style={[styles.input, { backgroundColor: theme.inputBg, borderColor: theme.border, color: theme.text }]}
                        placeholderTextColor={theme.textSub}
                        value={lote}
                        onChangeText={setLote}
                        autoCapitalize="characters"
                      />
                    </View>
                  </_TouchableWithoutFeedback>

                  <_TouchableWithoutFeedback>
                    <View style={styles.fieldContainer}>
                      <Text style={[styles.label, { color: theme.text }]}>{t('reporte_piezas_danadas.comentarios')}*</Text>
                      <TextInput
                        style={[styles.input, styles.textArea, { backgroundColor: theme.inputBg, borderColor: theme.border, color: theme.text }]}
                        placeholderTextColor={theme.textSub}
                        value={comentarios}
                        onChangeText={setComentarios}
                        multiline
                        numberOfLines={4}
                      />
                    </View>
                  </_TouchableWithoutFeedback>
                </View>
                <View style={{ marginTop: 50 }}
                >
                  <Text style={[styles.label, { color: theme.text }]}>{t('reporte_piezas_danadas.add_fotos')}</Text>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-around', marginBottom: 15 }}>
                    <TouchableOpacity onPress={() => { pickImageFromGallery(null) }} style={styles.actionButton}>
                      <MaterialCommunityIcons name="file-upload" size={24} color={theme.text} />
                      <Text style={{ color: theme.text }}>Galería</Text>
                    </TouchableOpacity>

                    <TouchableOpacity onPress={() => { takePhoto(null) }} style={styles.actionButton}>
                      <MaterialCommunityIcons name="camera" size={24} color={theme.text} />
                      <Text style={{ color: theme.text }}>Cámara</Text>
                    </TouchableOpacity>
                  </View>
                  {/* Lista de archivos seleccionados */}
                  {archivos.map((file, index) => (
                    <View key={"file_" + index} style={styles.fileRow}>
                      <TouchableOpacity onPress={() => { setCarouselMode('form'); setShowCarousel(true); }}>
                        <MaterialCommunityIcons name="image" size={20} color={theme.accent} />
                      </TouchableOpacity>
                      <Text style={{ color: theme.text, flex: 1 }} numberOfLines={1}>
                        {file.name || file.fileName || `Imagen_${index + 1}.jpg`}
                      </Text>

                      <TouchableOpacity onPress={() => deleteFoto_byIndex(index)}>
                        <MaterialCommunityIcons name="close-circle" size={20} color="red" />
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
                <View style={{ flexDirection: 'row', justifyContent: 'center', marginTop: 50 }}>

                  <TouchableOpacity
                    style={[styles.addButton, { backgroundColor: theme.accent, opacity: saving ? 0.6 : 1 }]}
                    onPress={handleAgregarPieza}
                    disabled={saving}
                  >
                    {saving ? (
                      <ActivityIndicator color="#fff" />
                    ) : (
                      <>
                        <MaterialCommunityIcons name="plus-circle-outline" size={20} color="#fff" />
                        <Text style={styles.addButtonText}>{t('reporte_piezas_danadas.add_button')}</Text>
                      </>
                    )}
                  </TouchableOpacity>
                </View>

              </View>

              {/* SECCIÓN 2: Listado de reportes agregados */}
              {/*<Text style={[styles.sectionTitle, { color: theme.text }]}>{t('reporte_piezas_danadas.list_title')}</Text> */}

              {piezas.length === 0 ? (
                <View style={[styles.sectionCard, { backgroundColor: hexToRGBA(theme.card, 0.8), borderColor: theme.border }]}>
                  <Text style={[styles.emptyText, { color: theme.textSub }]}>
                    {t('reporte_piezas_danadas.empty_list')}
                  </Text>
                </View>
              ) : (
                piezas.map((pieza, index) => (
                  <View key={pieza.id_registro || index} style={[styles.sectionCard, { backgroundColor: hexToRGBA(theme.card, 0.8), borderColor: theme.border }]}>
                    <View style={[styles.piezaRow, { borderWidth: 0, borderColor: theme.text }]}>
                      <View style={styles.piezaRowHeader}>
                        <Text style={styles.piezaLabel}>Codigo:</Text>
                        <Text style={[styles.piezaCodigo, { color: theme.accent }]}>{pieza.codigo_registro}</Text>
                      </View>
                      <View style={styles.piezaRowHeader}>
                        <Text style={styles.piezaLabel}>Cirugía:</Text>
                        <Text style={[styles.piezaCodigo, { color: theme.accent }]}>{pieza.codigo_cirugia}</Text>
                      </View>
                      <View style={styles.piezaRowHeader}>
                        <Text style={styles.piezaLabel}>Activo:</Text>
                        <Text style={[styles.piezaCodigo, { color: theme.accent }]}>{pieza.codigo_activo}</Text>
                      </View>
                      <View style={styles.piezaRowHeader}>
                        <Text style={styles.piezaLabel}>Referencia:</Text>
                        <Text style={[styles.piezaCodigo, { color: theme.accent }]}>{pieza.referencia}</Text>
                      </View>
                      <View style={styles.piezaRowHeader}>
                        <Text style={styles.piezaLabel}>Lote:</Text>
                        <Text style={[styles.piezaCodigo, { color: theme.accent }]}>{pieza.lote}</Text>
                      </View>
                      <View style={styles.piezaRowHeader}>
                        <Text style={{ color: theme.textSub, fontSize: 13, marginTop: 4 }}>{pieza.comentarios}</Text>
                      </View>
                      <View>
                        {pieza.archivos.map((file, index) => (
                          <View key={"file_" + index} style={styles.fileRow}>
                            <TouchableOpacity onPress={() => { setArchivos_pieza(pieza.archivos); setCarouselMode('pieza'); setShowCarousel(true); }}>
                              <MaterialCommunityIcons name="image" size={20} color={theme.accent} />
                            </TouchableOpacity>
                            <Text style={{ color: theme.text, flex: 1 }} numberOfLines={1}>
                              {file.name || file.fileName || `Imagen_${index + 1}.jpg`}
                            </Text>

                            <TouchableOpacity onPress={() => deleteFoto_byIDFoto(file.id_foto)}>
                              <MaterialCommunityIcons name="close-circle" size={20} color="red" />
                            </TouchableOpacity>
                          </View>
                        ))}
                      </View>
                      <View>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-around', marginBottom: 15 }}>
                          <TouchableOpacity onPress={() => { pickImageFromGallery(pieza) }} style={styles.actionButton}>
                            <MaterialCommunityIcons name="file-upload" size={24} color={theme.text} />
                            <Text style={{ color: theme.text }}>Galería</Text>
                          </TouchableOpacity>

                          <TouchableOpacity onPress={() => { takePhoto(pieza) }} style={styles.actionButton}>
                            <MaterialCommunityIcons name="camera" size={24} color={theme.text} />
                            <Text style={{ color: theme.text }}>Cámara</Text>
                          </TouchableOpacity>
                        </View>

                        <TouchableOpacity
                          style={[styles.addButton, { backgroundColor: theme.accent, opacity: saving ? 0.6 : 1 }]}
                          onPress={() => { handleEliminarPieza(pieza.id_registro); }}
                          disabled={isSubmitting || saving}
                        >
                          {isSubmitting ? (
                            <ActivityIndicator color="#fff" />
                          ) : (
                            <>
                              <MaterialCommunityIcons name="delete" size={20} color="#fff" />
                              <Text style={styles.addButtonText}>{t('reporte_piezas_danadas.delete_pieza')}</Text>
                            </>
                          )}
                        </TouchableOpacity>
                      </View>
                    </View>
                  </View>
                ))
              )}

            </ScrollView>
          </KeyboardAvoidingView>
        ) : (
          <View style={styles.centered} />
        )}

        <_Footer Show_Almacen={false} Show_Usermenu={true}>
          <View>
            <View style={{ paddingBottom: 10, marginTop: 10 }}>
              <Text style={{ color: theme.iconTextColor, fontSize: 14, textAlign: 'center' }}>
                {t('reporte_piezas_danadas.footer_codigo_reporte')} {codigoReporte ? codigoReporte : t('reporte_piezas_danadas.footer_no_reporte')}
              </Text>
            </View>
            <View>
              <TouchableOpacity
                style={[styles.addButton, { backgroundColor: theme.accent, opacity: saving ? 0.6 : 1 }]}
                onPress={handleFinalizaReporte}
                disabled={isSubmitting || saving}
              >
                {isSubmitting ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <>
                    <MaterialCommunityIcons name="plus-circle-outline" size={20} color="#fff" />
                    <Text style={styles.addButtonText}>{t('reporte_piezas_danadas.finalize_button')}</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>

        </_Footer>

        <_PinModal
          visible={showPinModal}
          title="Confirma tu PIN"
          message={t('reporte_piezas_danadas.pin_message')}
          onSuccess={handlePinSuccess}
          onCancel={handlePinCancel}
        />

        <_PickerModal
          visible={showFabricantePicker}
          onClose={() => setShowFabricantePicker(false)}
          data={fabricantes.map(f => ({ ...f, nombre: f.fabricante }))}
          key_name="id_fabricante"
          onSelect={(item: iFabricante) => { setFabricante(item); setShowFabricantePicker(false); }}
          title={t('reporte_piezas_danadas.id_fabricante')}
        />

        <Modal visible={showCarousel} transparent animationType="fade">
          <View style={styles.carouselOverlay}>
            <View style={[styles.carouselContainer, { backgroundColor: theme.card, width: carouselWidth, height: carouselHeight }]}>
              <View style={[styles.carouselHeader, { borderBottomColor: theme.border }]}>
                <Text style={[styles.carouselTitle, { color: theme.text }]}>
                  {carouselMode === 'pieza' ? 'Fotos de la pieza' : 'Fotos agregadas'}
                </Text>
                <TouchableOpacity onPress={() => setShowCarousel(false)}>
                  <MaterialCommunityIcons name="close" size={24} color={theme.text} />
                </TouchableOpacity>
              </View>
              {/* _FotosCarousel normalmente mide su contenedor con onLayout, pero
                dentro del portal de un Modal ese onLayout no se dispara en RN
                Web, así que aquí se le pasa el tamaño ya calculado con
                useWindowDimensions en vez de dejar que se auto-mida.
                Un solo carousel compartido: "carouselMode" decide si muestra
                las fotos del formulario en curso o las de una pieza ya
                guardada, para no montar los dos a la vez. */}
              <View style={{ width: carouselWidth, height: carouselHeight - 49 }}>
                <_FotosCarousel
                  photos={carouselMode === 'pieza' ? fotoUrls_pieza : fotoUrls}
                  keys={carouselMode === 'pieza' ? archivos_pieza.map((f: any) => f.id_foto) : archivos.map((f: any) => f.uri)}
                  allowSelect={false}
                  showDelete
                  onDelete={(key) => carouselMode === 'pieza' ? deleteFoto_byIDFoto(key) : deleteFoto_byKey(key)}
                  width={carouselWidth}
                  height={carouselHeight - 49}
                />
              </View>
            </View>
          </View>
        </Modal>

        <CustomModal
          visible={modal.visible}
          titulo={modal.titulo}
          mensaje={modal.mensaje}
          icon={modal.icon}
          colorIcon={modal.colorIcon}
          onClose={() => setModal({ ...modal, visible: false })}
        />

      </SafeAreaView>
    </_Background>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 15,
    fontSize: 14,
  },
  content: {
    flex: 1,
    padding: 10,
  },
  codigoReporte: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 8,
    marginLeft: 5,
  },
  sectionCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 15,
    marginBottom: 15,
    paddingBottom: 10,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  fieldContainer: {
    marginBottom: 14,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 11,
    fontSize: 14,
  },
  readOnlyField: {
    justifyContent: 'center',
  },
  textArea: {
    minHeight: 90,
    textAlignVertical: 'top',
  },
  selector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 10,
    borderRadius: 20,
    marginTop: 3,
    paddingHorizontal: 20
  },
  addButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 15,
  },
  emptyText: {
    fontSize: 13,
    textAlign: 'center',
    paddingVertical: 15,
  },
  piezaRow: {
    borderBottomWidth: 2,
    paddingVertical: 5,
    paddingHorizontal: 5,
    marginVertical: 5

  },
  piezaRowHeader: {
    flexDirection: 'row',

    marginBottom: 4,
  },
  piezaLabel: {
    fontSize: 12,
    width: 70
  },

  piezaCodigo: {
    fontSize: 13,
    fontWeight: 'bold',
  },
  fileRow: {
    flexDirection: 'row',
    alignItems: 'center', paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#ccc'
  },
  actionButton: {
    alignItems: 'center',
    padding: 10,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    width: '45%'
  },
  carouselOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  carouselContainer: {
    width: '95%',
    height: '80%',
    borderRadius: 30,
    overflow: 'hidden',
  },
  carouselHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  carouselTitle: {
    fontSize: 16,
    fontWeight: 'bold',
  },
});
