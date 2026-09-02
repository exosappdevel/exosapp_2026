import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Platform,
  Modal,
  FlatList,
  LayoutAnimation,
  Image,
  Alert,
  KeyboardAvoidingView,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import { useApp } from '../context/AppContext';
import ApiService from '@/services/ApiServices';
import { _TouchableWithoutFeedback } from '../components/elidev_components';
import CustomModal from '../components/CustomModal';
import { _Header, _Show_Generic_Report, _Background, hexToRGBA, _Footer, _checkBox, _AccordionSection, _FotosCarousel, getWebserviceFileUrl, formatDate } from '../components/elidev_components';


interface PickerOption {
  id: string;
  nombre: string;
}
interface iEstatusList {
  id_estatus: string,
  estatus: string;
  color: string;
}
interface iOrderList {
  order: string;
  text: string;
}


export default function reporte_piezas_danadas_view_Screen() {
  const { user, theme, t, appConfig } = useApp();
  const pageConfig = {
    name: t('screens.reporte_piezas_danadas_view'),
    icon: "glass-fragile",
    previous: "home",
    show_user: true,
    show_menu: true,
    show_in_recent: true,
    path: '/reporte_piezas_danadas_view'
  };

  const [appReady, setAppReady] = useState(false);
  const [loading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const { width, height } = useWindowDimensions();
  const margin_height = 45;
  const _ClientHeight = height - 130 - margin_height;

  // Form fields
  const [fecha_ini, setFecha_ini] = useState('');
  const [fecha_fin, setFecha_fin] = useState('');
  const [codigo_registro, setCodigoRegistro] = useState('');
  const [codigo_cirugia, setCodigo_cirugia] = useState('');
  const [activo, setActivo] = useState('');
  const [referencia, setReferncia] = useState('');
  const [lote, setLote] = useState('');
  const [estatus, setEstatus] = useState<iEstatusList | null>(null);
  const [traspaso] = useState('');

  const [limite, setLimite] = useState("15");
  const [filtrar_fecha, setFiltrar_fecha] = useState(false); // Por defecto NO se filtra por fecha

  // listas
  const [Estatus_list, setEstatusList] = useState<iEstatusList[]>([]);
  const [Order_list] = useState<iOrderList[]>([
    { order: "codigo desc", text: t('reporte_piezas_danadas_view.codigo_desc') },
    { order: "codigo", text: t('reporte_piezas_danadas_view.codigo_asc') },
    { order: "codigo_cirugia desc", text: t('reporte_piezas_danadas_view.codigo_cirugia_desc') },
    { order: "codigo_cirugia ", text: t('reporte_piezas_danadas_view.codigo_cirugia_asc') },
  ]);
  const [orderBy, setOrderBy] = useState<iOrderList | null>(Order_list[0]);

  const [showEstatusPicker, setShowEstatusPicker] = useState(false);
  const [showOrderPicker, setShowOrderPicker] = useState(false);

  const [showDatePicker, setShowDatePicker] = useState<string | null>(null);

  const scrollRef = React.useRef<ScrollView>(null);

  const [resultados, setResultados] = useState<any[]>([]);

  // --- Carousel de fotos de un reporte ya guardado (mismo patrón que
  // reporte_piezas_danadas.tsx) ---
  const { width: winWidth, height: winHeight } = useWindowDimensions();
  const carouselWidth = Math.round(winWidth * 0.95);
  const carouselHeight = Math.round(winHeight * 0.8);
  const [archivos_pieza, setArchivos_pieza] = useState<any[]>([]);
  const [showCarousel, setShowCarousel] = useState(false);
  // Las fotos ya están en el servidor (vienen de buscar_pieza_danada_registro_general
  // como {id_foto, url} con url relativa), a diferencia de reporte_piezas_danadas.tsx
  // donde "archivos" son locales; por eso aquí sí se pasan por getWebserviceFileUrl.
  const fotoUrls_pieza: string[] = (archivos_pieza || []).map((f: any) => f.uri);

  // 1. Agregamos una bandera para evitar ejecuciones dobles en modo estricto
  useEffect(() => {
    let isMounted = true;

    const loadData = async () => {
      // Si no hay usuario, no intentamos cargar nada
      if (!user?.id_usuario) return;

      try {
        console.log("Iniciando carga de datos...");

        const [resEstatus] = await Promise.all([ApiService.piezas_danadas_reporte_estatus("1")]);

        if (!isMounted) return;

        const today = new Date();

        setFecha_ini(formatDate(today));
        setFecha_fin(formatDate(today));
        setEstatusList(Array.isArray(resEstatus.data) ? resEstatus.data : []);
        if (Array.isArray(resEstatus.data))
          setEstatus(resEstatus.data[0]);

      } catch (error) {
        console.error("Error crítico en loadData:", error);
      } finally {
        if (isMounted) {
          // Un pequeño delay opcional para que el gif no parpadee demasiado rápido
          setTimeout(() => {
            LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
            setAppReady(true);
          }, 500);
        }
      }
    };

    loadData();

    return () => { isMounted = false; };
  }, []); // <-- DEJAMOS EL ARRAY VACÍO PARA QUE SOLO CORRA AL INICIO


  const onDateChange_ini = (event: DateTimePickerEvent, selectedDate?: Date) => {
    onDateChange(event, selectedDate, setFecha_ini)
  }
  const onDateChange_fin = (event: DateTimePickerEvent, selectedDate?: Date) => {
    onDateChange(event, selectedDate, setFecha_fin)
  }
  const onDateChange = (event: DateTimePickerEvent, selectedDate?: Date, set_target?: any) => {
    // En iOS, el picker puede quedarse abierto, en Android se cierra solo
    setShowDatePicker(null);

    if (event.type === 'set' && selectedDate) {
      // 2. Formateamos la fecha para mostrarla en el campo de texto
      const day = selectedDate.getDate().toString().padStart(2, '0');
      const month = (selectedDate.getMonth() + 1).toString().padStart(2, '0');
      const year = selectedDate.getFullYear();
      const formattedDate = `${day}/${month}/${year}`;

      // 3. ¡CRUCIAL!: Actualizamos el estado que lee el <Text> del selector
      set_target(formattedDate);
    } else {
      // Si el usuario cancela, cerramos el picker
    }
    setShowDatePicker(null);
  };

  const [modal, setModal] = useState({
    visible: false,
    titulo: '',
    mensaje: '',
    icon: 'alert-circle-outline',
    colorIcon: '#f56565'
  });

  const showError = (mensaje: string) => {
    setModal({
      visible: true,
      titulo: t('common.error'),
      mensaje,
      icon: 'alert-circle-outline',
      colorIcon: '#f56565'
    });
  };

  // --- Agregar/quitar fotos y eliminar un reporte ya guardado, mismo patrón
  // que reporte_piezas_danadas.tsx (ahí "pieza" viene del formulario en
  // memoria; aquí "item" viene de un resultado de búsqueda ya finalizado). ---
  const pickDocument = async (item: any) => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: "*/*",
        copyToCacheDirectory: true
      });
      if (result.canceled) return;

      const asset = result.assets[0];
      const nuevoArchivo = {
        uri: asset.uri,
        name: asset.name,
        type: asset.mimeType || 'application/octet-stream',
        url: '',
        id_foto: ''
      };

      const urlServidor = await ApiService.uploadFileDirect("piezas_danadas", 'pieza', nuevoArchivo);
      if (!urlServidor) {
        showError(t('common.connectionError'));
        return;
      }

      nuevoArchivo.url = urlServidor;
      const response_foto = await ApiService.guardar_foto_reporte_piezas_danadas(item.id_registro, urlServidor, user?.id_usuario || '');
      if (response_foto?.result === 'ok') {
        const fotoGuardada = { id_foto: response_foto.id_foto, url: urlServidor };
        setResultados((prev: any[]) => prev.map((r) => {
          if (r.id_registro !== item.id_registro) return r;
          const fotosActuales = Array.isArray(r.fotos) ? r.fotos : [];
          return { ...r, fotos: [...fotosActuales, fotoGuardada], fotos_count: fotosActuales.length + 1 };
        }));
      } else {
        showError(response_foto?.result_text || t('common.connectionError'));
      }
    } catch (err) {
      console.error("Error al seleccionar documento:", err);
    }
  };

  const takePhoto = async (item: any) => {
    try {
      const result = await ImagePicker.launchCameraAsync({ quality: 0.5 });
      if (result.canceled) return;

      const asset = result.assets[0];
      const nuevoArchivo = {
        uri: asset.uri,
        name: asset.uri.split('/').pop() || 'photo.jpg',
        type: 'image/jpeg',
        url: '',
        id_foto: ''
      };

      const urlServidor = await ApiService.uploadFileDirect("piezas_danadas", 'pieza', nuevoArchivo);
      if (!urlServidor) {
        showError(t('common.connectionError'));
        return;
      }

      const response_foto = await ApiService.guardar_foto_reporte_piezas_danadas(item.id_registro, urlServidor, user?.id_usuario || '');
      if (response_foto?.result === 'ok') {
        const fotoGuardada = { id_foto: response_foto.id_foto, url: urlServidor };
        setResultados((prev: any[]) => prev.map((r) => {
          if (r.id_registro !== item.id_registro) return r;
          const fotosActuales = Array.isArray(r.fotos) ? r.fotos : [];
          return { ...r, fotos: [...fotosActuales, fotoGuardada], fotos_count: fotosActuales.length + 1 };
        }));
      } else {
        showError(response_foto?.result_text || t('common.connectionError'));
      }
    } catch (err) {
      console.error("Error al tomar foto:", err);
      showError(t('common.connectionError'));
    }
  };

  const verFotosDeReporte = (item: any) => {
    const fotos = Array.isArray(item.fotos) ? item.fotos : [];
    setArchivos_pieza(fotos.map((f: any) => ({
      id_foto: f.id_foto,
      uri: getWebserviceFileUrl(appConfig.url, f.url),
      name: (f.url || '').split('/').pop() || 'foto.jpg',
    })));
    setShowCarousel(true);
  };

  const deleteFoto_byIDFoto = async (id_foto: any) => {
    const ejecutarEliminacion = () => {
      setArchivos_pieza((prev: any[]) => {
        const nuevaLista = prev.filter((f) => f.id_foto !== id_foto);
        setShowCarousel(showCarousel && nuevaLista.length > 0);
        return nuevaLista;
      });
      setResultados((prev: any[]) => prev.map((r) => {
        const fotosActuales = Array.isArray(r.fotos) ? r.fotos : [];
        if (!fotosActuales.some((f: any) => f.id_foto === id_foto)) return r;
        const nuevasFotos = fotosActuales.filter((f: any) => f.id_foto !== id_foto);
        return { ...r, fotos: nuevasFotos, fotos_count: nuevasFotos.length };
      }));
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

  const handleEliminarReporte = async (id_registro: string) => {
    const elimina = () => {
      setResultados((prev: any[]) => prev.filter((r) => r.id_registro !== id_registro));
      setExpandedSection(null);
      // Si el carousel de fotos de este reporte estaba abierto, se cierra
      // también, ya que esas fotos dejaron de existir al eliminarse el reporte.
      setShowCarousel(false);
      setArchivos_pieza([]);
    };
    if (Platform.OS === "web") {
      if (confirm(t('reporte_piezas_danadas_view.delete_reporte_confirm'))) {
        const response = await ApiService.eliminar_pieza_danada(id_registro);
        if (response?.result == "ok") {
          elimina();
        } else {
          showError(response?.result_text || t('common.connectionError'));
        }
      }
    } else {
      Alert.alert("Check Out", t('reporte_piezas_danadas_view.delete_reporte_confirm'), [
        { text: "No" },
        {
          text: "Sí", onPress: async () => {
            const response = await ApiService.eliminar_pieza_danada(id_registro);
            if (response?.result == "ok") {
              elimina();
            } else {
              showError(response?.result_text || t('common.connectionError'));
            }
          }
        },
      ]);
    }
  };

  const renderResultados = () => {
    if (loading) return <ActivityIndicator size="large" color={theme.accent} style={{ marginTop: 20 }} />;
    if (resultados.length === 0) return (<View></View>);

    //alert(JSON.stringify(resultados));

    return resultados.map((item: any, index: number) => {

      return (
        <_AccordionSection
          key={item.id_cirugia || index}
          scrollRef={scrollRef}
          backgroundColor={hexToRGBA(theme.card, 1)}
          HideTitleOnOpen={true}
          title={
            <View style={{ flex: 1, paddingRight: 5 }}>
              {/* Primer Renglón */}
              <View>
                <View style={{ marginTop: 2, flexDirection: 'row', justifyContent: 'space-between' }}>
                  <Text style={{
                    color: theme.text,
                    fontWeight: 'bold',
                    fontSize: 16
                  }}>
                    {item.codigo}
                  </Text>
                  <View style={{ borderRadius: 10, padding: 5, backgroundColor: item.color }}>
                    <Text style={{
                      color: 'white',
                      fontWeight: 'bold',
                      fontSize: 11,

                    }}>
                      {item.estatus}
                    </Text>
                  </View>
                </View>
                <Text style={{
                  color: theme.text,
                  fontSize: 14
                }}>
                  {item.codigo_cirugia}
                </Text>
              </View>

              {/* Segundo Renglón */}
              <View style={{ marginTop: 2, flexDirection: 'row', justifyContent: 'space-between' }}>
                <Text style={{
                  color: theme.accent,
                  fontSize: 12,
                  fontStyle: 'italic'
                }}>
                  {item.referencia}
                </Text>
                <Text style={{
                  color: theme.textSub,
                  fontSize: 14
                }}>
                  {item.lote}
                </Text>
              </View>
            </View>
          }
          isOpen={expandedSection === `res_${index}`}
          onPress={() => setExpandedSection(expandedSection === `res_${index}` ? null : `res_${index}`)}
          yoff={85 + (index * 80)}
        >
          <_Show_Generic_Report
            titulo={'Detalle del Reporte'}
            visible={true}
            showShare={false}
            item={item}
            onClose={() => setExpandedSection(null)}
            style_content={{ marginTop: 150 }}
            items_fields={[
              { 'label': 'Codigo Registro', 'value': item.codigo, 'tipo_linea': 'linea' },
              { 'label': 'Estatus', 'value': item.estatus, 'tipo_linea': 'linea' },
              { 'label': 'Traspaso', 'value': item.codigo_traspaso, 'tipo_linea': 'linea' },
              { 'label': 'Cirugía', 'value': item.codigo_cirugia, 'tipo_linea': 'multi_linea' },
              { 'label': 'Activo Origen', 'value': item.codigo_set, 'tipo_linea': 'multi_linea' },
              { 'label': 'Referencia', 'value': item.referencia, 'tipo_linea': 'linea' },
              { 'label': 'Lote', 'value': item.lote, 'tipo_linea': 'linea' },
              { 'label': 'Notas', 'value': item.comentarios, 'tipo_linea': 'multi_linea' }

            ]}
          >
            <View style={{ marginTop: 15 }}>
              <Text style={[styles.label, { color: theme.text }]}>{t('reporte_piezas_danadas_view.fotos_title')}</Text>

              {(!Array.isArray(item.fotos) || item.fotos.length === 0) ? (
                <Text style={{ color: theme.textSub, fontSize: 13, marginBottom: 10 }}>
                  {t('reporte_piezas_danadas_view.empty_fotos')}
                </Text>
              ) : (
                item.fotos.map((foto: any, fIndex: number) => (
                  <View key={"foto_" + fIndex} style={styles.fileRow}>
                    <TouchableOpacity onPress={() => verFotosDeReporte(item)}>
                      <MaterialCommunityIcons name="image" size={20} color={theme.accent} />
                    </TouchableOpacity>
                    <Text style={{ color: theme.text, flex: 1 }} numberOfLines={1}>
                      {(foto.url || '').split('/').pop() || `Imagen_${fIndex + 1}.jpg`}
                    </Text>
                    <TouchableOpacity onPress={() => deleteFoto_byIDFoto(foto.id_foto)}>
                      <MaterialCommunityIcons name="close-circle" size={20} color="red" />
                    </TouchableOpacity>
                  </View>
                ))
              )}

              <View style={{ marginTop: 15 }}>
                <Text style={[styles.label, { color: theme.text }]}>{t('reporte_piezas_danadas_view.add_fotos')}</Text>

                <View style={{ flexDirection: 'row', justifyContent: 'space-around', marginVertical: 15 }}>
                  <TouchableOpacity onPress={() => pickDocument(item)} style={styles.actionButton}>
                    <MaterialCommunityIcons name="file-upload" size={24} color={theme.text} />
                    <Text style={{ color: theme.text }}>Galería</Text>
                  </TouchableOpacity>

                  <TouchableOpacity onPress={() => takePhoto(item)} style={styles.actionButton}>
                    <MaterialCommunityIcons name="camera" size={24} color={theme.text} />
                    <Text style={{ color: theme.text }}>Cámara</Text>
                  </TouchableOpacity>
                </View>
              </View>

              <TouchableOpacity
                style={[styles.addButton, { backgroundColor: '#e53e3e' }]}
                onPress={() => handleEliminarReporte(item.id_registro)}
              >
                <MaterialCommunityIcons name="delete" size={20} color="#fff" />
                <Text style={styles.addButtonText}>{t('reporte_piezas_danadas.delete_pieza')}</Text>
              </TouchableOpacity>
            </View>
          </_Show_Generic_Report>
        </_AccordionSection>

      );
    });
  };

  const validateForm = () => {
    // 1. Verificación de que al menos exista un parámetro de búsqueda
    if (!codigo_cirugia && !codigo_registro && !activo && !referencia && !lote && !traspaso && !estatus && !codigo_cirugia && !filtrar_fecha) {
      return t('cirugias_programar.search_valida_error_noparam');
    }

    // 2. Verificación de rango de fechas si el filtro está activo
    if (filtrar_fecha) {
      // Convertimos los strings "DD/MM/YYYY" a objetos Date reales usando tu función parseDate
      const dateIni = parseDate(fecha_ini);
      const dateFin = parseDate(fecha_fin);

      // Comparamos los milisegundos de ambas fechas
      if (dateFin.getTime() < dateIni.getTime()) {
        return t('reporte_piezas_danadas_view.search_valida_error_fechasinvalidas');
      }
    }

    return null;
  };


  const handleSubmit = async () => {
    const error = validateForm();
    if (error) {
      setModal({
        visible: true,
        titulo: 'Campos Requeridos',
        mensaje: error,
        icon: 'alert-circle-outline',
        colorIcon: '#f56565'
      });
      return;
    }

    setSubmitting(true);

    try {
      /*alert(JSON.stringify(
        {
          "estatus" : estatus?.estatus,
          "fecha_ini" : fecha_ini,
          "fecha_fin" : fecha_fin,
          "vendedor" : vendedor? vendedor.id_vendedor : 0,
          "tecnico" : tecnico? tecnico.id_tecnico : 0,
          "subdistribuidor" : subdistribuidor ? subdistribuidor.id_subdistribuidor : 0,
          "codigo_cirugia" : codigo_cirugia ? codigo_cirugia : "",
          "limite" : limite? limite : "-1"
        }
      ));*/
      const response =
        await ApiService.buscar_pieza_danada_registro_general(
          (filtrar_fecha) ? fecha_ini : '',
          (filtrar_fecha) ? fecha_fin : '',
          codigo_registro,
          codigo_cirugia,
          activo,
          referencia,
          lote,
          (estatus ? estatus.id_estatus : '0'),
          traspaso,
          orderBy ? orderBy.order : '',
          limite);

      if (response.result === 'ok') {
        setSubmitting(false);
        //alert(JSON.stringify(response));
        const resultados_count = response.data_count;
        setResultados(response.data);
        if (resultados_count == 0) {
          //playErrorSound();
          setModal({
            visible: true,
            titulo: t("cirugias_programar.search_success_title"),
            mensaje: '0 ' + t("cirugias_programar.search_success"),
            icon: 'alert-circle-outline',
            colorIcon: '#48bb78'
          });
        }
        else {
          setExpandedSection(null);
          scrollRef.current?.scrollTo({ y: 10, animated: false });
        }
      }
      else {
        setModal({
          visible: true,
          titulo: t('common.error'),
          mensaje: 'Error',//response.result_text,
          icon: 'alert-circle-outline',
          colorIcon: '#f56565'
        });
      }
    } catch (e) {
      alert((e instanceof Error) ? e.message : String(e));
      setModal({
        visible: true,
        titulo: t('common.error'),
        mensaje: (e instanceof Error) ? e.message : String(e),
        icon: 'alert-circle-outline',
        colorIcon: '#f56565'
      });
    } finally {
      setSubmitting(false);
    }

  };

  const renderPickerModal = (
    visible: boolean,
    onClose: () => void,
    data: string[] | iEstatusList[] | PickerOption[] | iOrderList[],
    key_name: string = "id",
    onSelect: (item: any) => void,
    title: string
  ) => (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.pickerOverlay}>
        <View style={[styles.pickerContainer, { backgroundColor: theme.card }]}>
          <View style={[styles.pickerHeader, { borderBottomColor: theme.border }]}>
            <Text style={[styles.pickerTitle, { color: theme.text }]}>
              {title}
            </Text>
            <TouchableOpacity onPress={onClose}>
              <MaterialCommunityIcons name="close" size={24} color={theme.text} />
            </TouchableOpacity>
          </View>

          <FlatList
            data={data as any[]}
            keyExtractor={(item, index) => {
              if (typeof item === 'string') {
                return `str-${index}`;
              }
              // Accedemos al VALOR de la propiedad dinámica y le sumamos el index por seguridad
              const idValue = item[key_name] || index;
              return `${key_name}-${idValue}`;
            }}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[styles.pickerItem, { borderBottomColor: theme.border }]}
                onPress={() => {
                  onSelect(item);
                  onClose();
                }}
              >
                <Text style={[styles.pickerItemText, { color: theme.text }]}>
                  {typeof item === 'string'
                    ? item
                    : (item.text || item.estatus || 'Sin nombre')}
                </Text>
              </TouchableOpacity>
            )}
          />
        </View>
      </View>
    </Modal>
  );


  const [expandedSection, setExpandedSection] = useState<string | null>('parametros');

  const toggleSection = (section: string) => {
    if (expandedSection === section) {
      setExpandedSection(null);
    }
    else {
      setExpandedSection(section);
    }

    setExpandedSection(expandedSection === section ? null : section);
  };

  // 1. MIENTRAS CARGA (Splash Screen)
  if (!appReady) {
    return (
      <View style={[styles.loadingDataContainer, { backgroundColor: theme.bg }]}>
        <Image
          source={require('../assets/images/loading_blue_circle.gif')} // <-- MODIFICADO: Ruta a tu GIF
          style={styles.loadingGif}
          resizeMode="contain"
        />
        <Text style={[styles.loadingText, { color: theme.textSub }]}>
          {t('common.loading')}
        </Text>
      </View>
    );
  }

  const parseDate = (dateStr: string): Date => {
    try {
      const [day, month, year] = dateStr.split('/').map(Number);
      const date = new Date(year, month - 1, day);
      return isNaN(date.getTime()) ? new Date() : date;
    } catch {
      return new Date();
    }
  };



  // 2. CUANDO TERMINA LA CARGA (Contenedor Principal)
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.bg }]}>
      {/* Header */}
      <_Background id_almacen={user?.id_almacen}>
        <_Header page_info={pageConfig} />

        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ flex: 1 }}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 10 : 10} // Ajusta este número según el alto de tu header
        >

          <ScrollView ref={scrollRef} style={[styles.content, { maxHeight: _ClientHeight }]} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled" canCancelContentTouches={true} >
            {/* Form Card */}
            <View style={[styles.formCard, { backgroundColor: hexToRGBA(theme.card, 0), borderColor: theme.border, paddingBottom: 50 }]}>


              {/* SECCIÓN 1: parametros */}
              <_AccordionSection
                title={t('reporte_piezas_danadas_view.parameters_search_title')}
                isOpen={(expandedSection === 'parametros')}
                yoff={0}
                scrollRef={scrollRef}
                onPress={() => toggleSection('parametros')}
              >



                {/* GRUPO DE FECHAS */}
                <View style={[
                  styles.grupoFechasContainer,
                  {
                    borderColor: theme.border, backgroundColor: hexToRGBA(theme.card, 0.2),
                    height: filtrar_fecha ? 250 : 50
                  }
                ]}>
                  {/* Checkbox para activar/desactivar el filtro */}
                  <_checkBox
                    key_id='use_dates'
                    use_switch={true}
                    value={filtrar_fecha}
                    setValue={() => setFiltrar_fecha(!filtrar_fecha)}
                    text={t('reporte_piezas_danadas_view.title_use_dates')}
                  />

                  {filtrar_fecha && (
                    /* Contenedor de Inputs (Se atenúa si está deshabilitado) */
                    <View style={{ opacity: filtrar_fecha ? 1 : 0.4, marginTop: 10 }} pointerEvents={filtrar_fecha ? 'auto' : 'none'}>

                      {/* Fecha ini */}
                      <View style={styles.fieldContainer}>
                        <Text style={[styles.label, { color: theme.text }]}>
                          {t('reporte_piezas_danadas_view.fecha_ini')}
                        </Text>

                        {Platform.OS === 'web' ? (
                          <View style={[
                            styles.selector,
                            { backgroundColor: theme.inputBg, borderColor: theme.border, flexDirection: 'row', alignItems: 'center' }
                          ]}>
                            <input
                              type="date"
                              disabled={!filtrar_fecha}
                              value={(() => {
                                const partes = fecha_ini.split('/');
                                if (partes.length === 3) return `${partes[2]}-${partes[1]}-${partes[0]}`;
                                return "";
                              })()}
                              onChange={(e) => {
                                const val = e.target.value;
                                if (val) {
                                  const [year, month, day] = val.split('-').map(Number);
                                  onDateChange_ini({ type: 'set' } as any, new Date(year, month - 1, day));
                                }
                              }}
                              style={{
                                flex: 1,
                                border: 'none',
                                outline: 'none',
                                background: 'transparent',
                                color: theme.text,
                                fontSize: 16,
                                fontFamily: 'inherit',
                                cursor: filtrar_fecha ? 'pointer' : 'default'
                              }}
                            />
                            <MaterialCommunityIcons name="calendar-outline" size={20} color={theme.textSub} />
                          </View>
                        ) : (
                          <>
                            <TouchableOpacity
                              style={[styles.selector, { backgroundColor: theme.inputBg, borderColor: theme.border }]}
                              onPress={() => setShowDatePicker('inicio')}
                              disabled={!filtrar_fecha}
                            >
                              <Text style={[styles.selectorText, { color: fecha_ini ? theme.text : theme.textSub }]}>
                                {fecha_ini || 'DD/MM/YYYY'}
                              </Text>
                              <MaterialCommunityIcons name="calendar-outline" size={20} color={theme.textSub} />
                            </TouchableOpacity>

                            {showDatePicker === 'inicio' && filtrar_fecha && (
                              <View style={{ backgroundColor: theme.card, borderRadius: 3 }}>
                                <DateTimePicker
                                  value={parseDate(fecha_ini)}
                                  key="dtFechaIni"
                                  mode="date"
                                  display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                                  onChange={onDateChange_ini}
                                />
                              </View>
                            )}
                          </>
                        )}
                      </View>

                      {/* Fecha fin */}
                      <View style={styles.fieldContainer}>
                        <Text style={[styles.label, { color: theme.text }]}>
                          {t('reporte_piezas_danadas_view.fecha_fin')}
                        </Text>

                        {Platform.OS === 'web' ? (
                          <View style={[
                            styles.selector,
                            { backgroundColor: theme.inputBg, borderColor: theme.border, flexDirection: 'row', alignItems: 'center' }
                          ]}>
                            <input
                              type="date"
                              disabled={!filtrar_fecha}
                              value={(() => {
                                const partes = fecha_fin.split('/');
                                if (partes.length === 3) return `${partes[2]}-${partes[1]}-${partes[0]}`;
                                return "";
                              })()}
                              onChange={(e) => {
                                const val = e.target.value;
                                if (val) {
                                  const [year, month, day] = val.split('-').map(Number);
                                  onDateChange_fin({ type: 'set' } as any, new Date(year, month - 1, day));
                                }
                              }}
                              style={{
                                flex: 1,
                                border: 'none',
                                outline: 'none',
                                background: 'transparent',
                                color: theme.text,
                                fontSize: 16,
                                fontFamily: 'inherit',
                                cursor: filtrar_fecha ? 'pointer' : 'default'
                              }}
                            />
                            <MaterialCommunityIcons name="calendar-outline" size={20} color={theme.textSub} />
                          </View>
                        ) : (
                          <>
                            <TouchableOpacity
                              style={[styles.selector, { backgroundColor: theme.inputBg, borderColor: theme.border }]}
                              onPress={() => setShowDatePicker('fin')}
                              disabled={!filtrar_fecha}
                            >
                              <Text style={[styles.selectorText, { color: fecha_fin ? theme.text : theme.textSub }]}>
                                {fecha_fin || 'DD/MM/YYYY'}
                              </Text>
                              <MaterialCommunityIcons name="calendar-outline" size={20} color={theme.textSub} />
                            </TouchableOpacity>

                            {showDatePicker === 'fin' && filtrar_fecha && (
                              <View style={{ backgroundColor: theme.card, borderRadius: 3 }}>
                                <DateTimePicker
                                  value={parseDate(fecha_fin)}
                                  key="dtFechaFin"
                                  mode="date"
                                  display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                                  onChange={onDateChange_fin}
                                />
                              </View>
                            )}
                          </>
                        )}
                      </View>

                    </View>
                  )}
                </View>

                <_TouchableWithoutFeedback>
                  <View style={styles.fieldContainer}>
                    <Text style={[styles.label, { color: theme.text }]}>
                      {t('reporte_piezas_danadas_view.codigo_registro')}
                    </Text>
                    <TextInput
                      style={[styles.input, { backgroundColor: theme.inputBg, borderColor: theme.border, color: theme.text, textTransform: 'uppercase' }]}
                      placeholder="Ej. 26RPD0000A-GDL"
                      placeholderTextColor={theme.textSub}
                      value={codigo_registro}
                      onChangeText={setCodigoRegistro}
                      autoCapitalize='characters'

                    />
                  </View>
                </_TouchableWithoutFeedback>
                <_TouchableWithoutFeedback>
                  <View style={styles.fieldContainer}>
                    <Text style={[styles.label, { color: theme.text }]}>
                      {t('cirugias_programar.codigo_cirugia')}
                    </Text>
                    <TextInput
                      style={[styles.input, { backgroundColor: theme.inputBg, borderColor: theme.border, color: theme.text, textTransform: 'uppercase' }]}
                      placeholder="Ej. 26CX0000A-GDL"
                      placeholderTextColor={theme.textSub}
                      value={codigo_cirugia}
                      onChangeText={setCodigo_cirugia}
                      autoCapitalize='characters'

                    />
                  </View>
                </_TouchableWithoutFeedback>
                <_TouchableWithoutFeedback>
                  <View style={styles.fieldContainer}>
                    <Text style={[styles.label, { color: theme.text }]}>
                      {t('reporte_piezas_danadas_view.activo')}
                    </Text>
                    <TextInput
                      style={[styles.input, { backgroundColor: theme.inputBg, borderColor: theme.border, color: theme.text, textTransform: 'uppercase' }]}
                      placeholder="Ej. INSTRUMENTAL"
                      placeholderTextColor={theme.textSub}
                      value={activo}
                      onChangeText={setActivo}
                      autoCapitalize='characters'

                    />
                  </View>
                </_TouchableWithoutFeedback>
                <_TouchableWithoutFeedback>
                  <View style={styles.fieldContainer}>
                    <Text style={[styles.label, { color: theme.text }]}>
                      {t('reporte_piezas_danadas_view.referencia')}
                    </Text>
                    <TextInput
                      style={[styles.input, { backgroundColor: theme.inputBg, borderColor: theme.border, color: theme.text, textTransform: 'uppercase' }]}
                      placeholder="Ej.111026558"
                      placeholderTextColor={theme.textSub}
                      value={referencia}
                      onChangeText={setReferncia}
                      autoCapitalize='characters'

                    />
                  </View>
                </_TouchableWithoutFeedback>
                <_TouchableWithoutFeedback>
                  <View style={styles.fieldContainer}>
                    <Text style={[styles.label, { color: theme.text }]}>
                      {t('reporte_piezas_danadas_view.lote')}
                    </Text>
                    <TextInput
                      style={[styles.input, { backgroundColor: theme.inputBg, borderColor: theme.border, color: theme.text, textTransform: 'uppercase' }]}
                      placeholder="Ej. 123ABC"
                      placeholderTextColor={theme.textSub}
                      value={lote}
                      onChangeText={setLote}
                      autoCapitalize='characters'

                    />
                  </View>
                </_TouchableWithoutFeedback>
                {/*Status: 0-cancelada 1-programada 2-surtida 3-finalizada 4-material entregado 5-solicitada*/}
                <View style={styles.fieldContainer}>
                  <Text style={[styles.label, { color: theme.text }]}>
                    {t('reporte_piezas_danadas_view.estatus_title')}
                  </Text>
                  <TouchableOpacity
                    style={[styles.selector, { backgroundColor: theme.inputBg, borderColor: theme.border }]}
                    onPress={() => setShowEstatusPicker(true)}
                  >
                    <Text style={[styles.selectorText, { color: theme.text }]}>
                      {estatus?.estatus || t("reporte_piezas_danadas_view.estatus_text_All")}
                    </Text>
                    <MaterialCommunityIcons name="chevron-down" size={20} color={theme.textSub} />
                  </TouchableOpacity>
                </View>

                {/* Selector de Ordenamiento */}
                <_TouchableWithoutFeedback>
                  <View style={{ marginVertical: 10, paddingHorizontal: 5 }}>
                    <Text style={{ color: theme.textSub, fontSize: 13, fontWeight: '600', marginBottom: 5 }}>
                      Ordenar por:
                    </Text>
                    <TouchableOpacity
                      style={[styles.selector, { backgroundColor: theme.inputBg, borderColor: theme.border }]}
                      onPress={() => setShowOrderPicker(true)}
                    >
                      <Text style={[styles.selectorText, { color: orderBy ? theme.text : theme.textSub }]}>
                        {orderBy?.text || 'Ordenar resultados por...'}
                      </Text>
                      <MaterialCommunityIcons name="chevron-down" size={20} color={theme.textSub} />
                    </TouchableOpacity>
                  </View>
                </_TouchableWithoutFeedback>

                <_TouchableWithoutFeedback>
                  <View style={styles.fieldContainer}>
                    <Text style={[styles.label, { color: theme.text }]}>
                      {t('cirugias_programar.limite')}
                    </Text>
                    <TextInput
                      style={[styles.input, { color: theme.text, borderColor: theme.border }]}
                      value={limite} // Ya es un string, se pasa directo
                      keyboardType="numeric"
                      maxLength={2} // Máximo 2 caracteres (ya que el tope es 15)
                      onChangeText={(text) => {
                        // Si el usuario borra por completo el campo, lo dejamos como string vacío temporalmente
                        if (text === '') {
                          setLimite('');
                          return;
                        }

                        // Eliminamos cualquier carácter que no sea un dígito numérico (puntos, comas, guiones)
                        const numeroLimpio = text.replace(/[^0-9]/g, '');

                        // Convertimos a entero para evaluar el rango
                        const valorNumerico = parseInt(numeroLimpio, 10);

                        if (!isNaN(valorNumerico)) {
                          // Forzamos el rango matemático de 0 a 15
                          const valorLimitado = Math.max(0, Math.min(valorNumerico, 15));
                          // Guardamos la respuesta convertida a string
                          setLimite(String(valorLimitado));
                        }
                      }}
                    />

                  </View>
                </_TouchableWithoutFeedback>



              </_AccordionSection>



              {renderResultados()}

            </View>
          </ScrollView>

        </KeyboardAvoidingView>





        {/* Picker Modals */}
        {
          renderPickerModal(
            showEstatusPicker,
            () => setShowEstatusPicker(false),
            Estatus_list,
            "id_estatus",
            (item: iEstatusList) => setEstatus(item),
            'estatus'
          )}
        {
          renderPickerModal(
            showOrderPicker,
            () => setShowOrderPicker(false),
            Order_list,
            "order",
            (item: iOrderList) => setOrderBy(item),
            'Ordenar por:'
          )}

        <CustomModal
          visible={modal.visible}
          titulo={modal.titulo}
          mensaje={modal.mensaje}
          icon={modal.icon}
          colorIcon={modal.colorIcon}
          onClose={() => setModal({ ...modal, visible: false })}
        />

        {/* Se monta solo cuando showCarousel es true (en vez de dejarlo
            siempre montado con visible={showCarousel}) para que su nodo se
            agregue al DOM DESPUÉS del modal de detalle (que también se monta
            bajo demanda, al expandir el acordeón). En RN Web dos <Modal>
            simultáneos apilan por orden de montaje: si el carousel ya
            existiera desde el primer render, quedaría detrás del modal de
            detalle y éste lo taparía siempre. */}
        {showCarousel && (
          <Modal visible transparent animationType="fade" onRequestClose={() => setShowCarousel(false)}>
            <View style={styles.carouselOverlay}>
              <View style={[styles.carouselContainer, { backgroundColor: theme.card, width: carouselWidth, height: carouselHeight }]}>
                <View style={[styles.carouselHeader, { borderBottomColor: theme.border }]}>
                  <Text style={[styles.carouselTitle, { color: theme.text }]}>
                    {t('reporte_piezas_danadas_view.fotos_title')}
                  </Text>
                  <TouchableOpacity onPress={() => setShowCarousel(false)}>
                    <MaterialCommunityIcons name="close" size={24} color={theme.text} />
                  </TouchableOpacity>
                </View>
                {/* _FotosCarousel mide su contenedor con onLayout, pero eso no se
                    dispara dentro del portal de un Modal en RN Web, así que se le
                    pasa el tamaño ya calculado con useWindowDimensions. */}
                <View style={{ width: carouselWidth, height: carouselHeight - 49 }}>
                  <_FotosCarousel
                    photos={fotoUrls_pieza}
                    keys={archivos_pieza.map((f: any) => f.id_foto)}
                    allowSelect={false}
                    showDelete
                    onDelete={(key) => deleteFoto_byIDFoto(key)}
                    width={carouselWidth}
                    height={carouselHeight - 49}
                  />
                </View>
              </View>
            </View>
          </Modal>
        )}

        <_Footer Show_Almacen={false} >
          {/* Submit Button */}
          <TouchableOpacity
            style={[styles.submitButton, { backgroundColor: theme.accent }]}
            onPress={handleSubmit}
            disabled={submitting}
          >
            {submitting ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <MaterialCommunityIcons name="magnify" size={24} color="#fff" />
                <Text style={styles.submitButtonText}>{t('reporte_piezas_danadas_view.search_button')}</Text>
              </>
            )}
          </TouchableOpacity>
        </_Footer>
      </_Background>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    padding: 3,
  },
  formCard: {
    borderRadius: 0,
    padding: 0,
    borderWidth: 0,
    marginBottom: 40,
  },
  fieldContainer: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 15,
    paddingVertical: 12,
    fontSize: 14,
    zIndex: 1,           // Asegura que esté al frente
    cursor: 'text',      // Solo para Web, ayuda a identificar que es editable
    userSelect: 'text',  // Permite que el navegador reconozca la selección de texto
  },
  selector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 15,
    paddingVertical: 14,
  },
  selectorText: {
    fontSize: 14,
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 12,
    marginTop: 10,
    paddingHorizontal: 10
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 10,
  },
  pickerOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  pickerContainer: {
    maxHeight: '60%',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  pickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
  },
  pickerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  pickerItem: {
    padding: 15,
    borderBottomWidth: 1,
  },
  pickerItemText: {
    fontSize: 14,
  },
  loadingDataContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingGif: {
    width: 150, // Ajusta el tamaño según tu GIF
    height: 150,
    marginBottom: 20,
  },
  loadingText: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: 10,
  },
  // Al final de tu StyleSheet en cirugias_buscar.tsx
  grupoFechasContainer: {
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    marginBottom: 16,
  },
  fileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
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
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 15,
    borderRadius: 20,
    marginTop: 3,
    paddingHorizontal: 20
  },
  addButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 15,
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
    borderRadius: 20,
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
