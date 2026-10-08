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
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useApp } from '../context/AppContext';
import ApiService from '@/services/ApiServices';
import { _TouchableWithoutFeedback } from '../components/elidev_components';
import CustomModal from '../components/CustomModal';
import { _Header, _Show_Report_Pager, _Background, hexToRGBA, _Footer, _checkBox, _AccordionSection, _FotosCarousel, _DatePicker, _footer_baseHeight, getWebserviceFileUrl, formatDate } from '../components/elidev_components';


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
    previous: "calidad",
    show_user: true,
    show_menu: true,
    show_in_recent: true,
    path: '/reporte_piezas_danadas_view'
  };

  const [appReady, setAppReady] = useState(false);
  const [loading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const { width, height } = useWindowDimensions();
  const margin_height = 50;
  const _ClientHeight = height - 130 - margin_height;
  const insets = useSafeAreaInsets();
  // _Footer flota (position:absolute) sobre el ScrollView; este espacio extra
  // al final permite desplazar los últimos resultados por encima del footer.
  const FOOTER_EXTRA = 56; // alto extra del footer: botón + filtro en dos filas
  const footerClearance = _footer_baseHeight(false, FOOTER_EXTRA) + insets.bottom + 20;

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

  const scrollRef = React.useRef<ScrollView>(null);

  const [resultados, setResultados] = useState<any[]>([]);
  // Filtro de texto "en vivo" (footer) sobre la lista de resultados actual.
  const [filtroTexto, setFiltroTexto] = useState('');
  // Reporte abierto en el detalle de pantalla completa (índice dentro de la lista
  // ya filtrada). null = detalle cerrado.
  const [detalleIndex, setDetalleIndex] = useState<number | null>(null);

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

  // Las fotos de un reporte ya guardado solo se consultan (carrusel): no se
  // pueden agregar ni eliminar desde esta pantalla.
  const verFotosDeReporte = (item: any) => {
    const fotos = Array.isArray(item.fotos) ? item.fotos : [];
    setArchivos_pieza(fotos.map((f: any) => ({
      id_foto: f.id_foto,
      uri: getWebserviceFileUrl(appConfig.url, f.url),
      name: (f.url || '').split('/').pop() || 'foto.jpg',
    })));
    setShowCarousel(true);
  };

  const handleEliminarReporte = async (id_registro: string) => {
    const elimina = () => {
      setResultados((prev: any[]) => prev.filter((r) => r.id_registro !== id_registro));
      setExpandedSection(null);
      // Se cierra el detalle y el carousel de fotos de este reporte: esas fotos
      // dejaron de existir al eliminarse el reporte.
      cerrarDetalle();
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

  // Normaliza (minúsculas y sin acentos) para que el filtro no distinga
  // "Cirugía" de "cirugia".
  const normalizarTexto = (v: any) =>
    String(v ?? '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');

  const textoFiltro = normalizarTexto(filtroTexto.trim());
  const resultadosFiltrados: any[] = textoFiltro === ''
    ? resultados
    : resultados.filter((r: any) =>
      [r.codigo, r.codigo_cirugia, r.codigo_set, r.codigo_traspaso, r.referencia, r.lote, r.estatus, r.comentarios]
        .some((campo) => normalizarTexto(campo).includes(textoFiltro))
    );

  const cerrarDetalle = () => {
    setShowCarousel(false);
    setDetalleIndex(null);
  };

  // Carrusel de fotos del reporte. Se pasa como "overlay" del detalle (queda
  // anidado dentro de su Modal): en iOS un <Modal> hermano no se presenta
  // mientras el modal de detalle sigue abierto, por eso el carrusel no se
  // veía. Solo consulta: no se pueden agregar ni eliminar fotos aquí.
  const renderCarrusel = () => !showCarousel ? null : (
    <Modal visible transparent animationType="fade" onRequestClose={() => setShowCarousel(false)}>
      <GestureHandlerRootView style={{ flex: 1 }}>
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
                width={carouselWidth}
                height={carouselHeight - 49}
              />
            </View>
          </View>
        </View>
      </GestureHandlerRootView>
    </Modal>
  );

  // Campos que muestra el detalle de un reporte.
  const camposDetalle = (item: any) => [
    { 'label': 'Codigo Registro', 'value': item.codigo, 'tipo_linea': 'linea' },
    { 'label': 'Estatus', 'value': item.estatus, 'tipo_linea': 'linea' },
    { 'label': 'Traspaso', 'value': item.codigo_traspaso, 'tipo_linea': 'linea' },
    { 'label': 'Cirugía', 'value': item.codigo_cirugia, 'tipo_linea': 'multi_linea' },
    { 'label': 'Activo Origen', 'value': item.codigo_set, 'tipo_linea': 'multi_linea' },
    { 'label': 'Referencia', 'value': item.referencia, 'tipo_linea': 'linea' },
    { 'label': 'Lote', 'value': item.lote, 'tipo_linea': 'linea' },
    { 'label': 'Notas', 'value': item.comentarios, 'tipo_linea': 'multi_linea' }
  ];

  // Fotos (solo consulta) + eliminar reporte, debajo de los campos del detalle.
  const renderExtrasDetalle = (item: any) => (
    <View style={{ marginTop: 15 }}>
      <Text style={[styles.label, { color: theme.text }]}>{t('reporte_piezas_danadas_view.fotos_title')}</Text>

      {(!Array.isArray(item.fotos) || item.fotos.length === 0) ? (
        <Text style={{ color: theme.textSub, fontSize: 13, marginBottom: 10 }}>
          {t('reporte_piezas_danadas_view.empty_fotos')}
        </Text>
      ) : (
        item.fotos.map((foto: any, fIndex: number) => (
          // Toda la fila (icono y nombre) abre el carrusel de fotos.
          <TouchableOpacity key={"foto_" + fIndex} style={styles.fileRow} onPress={() => verFotosDeReporte(item)}>
            <MaterialCommunityIcons name="image" size={20} color={theme.accent} />
            <Text style={{ color: theme.text, flex: 1 }} numberOfLines={1}>
              {(foto.url || '').split('/').pop() || `Imagen_${fIndex + 1}.jpg`}
            </Text>
          </TouchableOpacity>
        ))
      )}

      <TouchableOpacity
        style={[styles.addButton, { backgroundColor: '#e53e3e', marginTop: 15 }]}
        onPress={() => handleEliminarReporte(item.id_registro)}
      >
        <MaterialCommunityIcons name="delete" size={20} color="#fff" />
        <Text style={styles.addButtonText}>{t('reporte_piezas_danadas.delete_pieza')}</Text>
      </TouchableOpacity>
    </View>
  );

  const renderResultados = () => {
    if (loading) return <ActivityIndicator size="large" color={theme.accent} style={{ marginTop: 20 }} />;
    if (resultados.length === 0) return (<View></View>);

    if (resultadosFiltrados.length === 0) {
      return (
        <Text style={{ color: theme.textSub, textAlign: 'center', marginTop: 20, fontSize: 14 }}>
          {t('reporte_piezas_danadas_view.filter_no_matches')}
        </Text>
      );
    }

    //alert(JSON.stringify(resultados));

    // Cada fila solo abre el detalle de pantalla completa (ver _Show_Report_Pager
    // al final del render); ya no se expande en la lista.
    return resultadosFiltrados.map((item: any, index: number) => (
      <_AccordionSection
        key={item.id_registro ?? item.id_cirugia ?? index}
        backgroundColor={hexToRGBA(theme.card, 1)}
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
        isOpen={false}
        onPress={() => setDetalleIndex(index)}
      >
        {null}
      </_AccordionSection>
    ));
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
        setFiltroTexto('');
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
    <_Background id_almacen={user?.id_almacen} >
      <SafeAreaView style={[styles.container]}>
        <_Header page_info={pageConfig} />

        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ flex: 1 }}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 10 : 10} // Ajusta este número según el alto de tu header
        >

          <ScrollView ref={scrollRef} style={[styles.content, { maxHeight: _ClientHeight }]} contentContainerStyle={{ paddingBottom: footerClearance }} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled" canCancelContentTouches={true} >
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

                      {/* _DatePicker: en iOS abre el selector en un Modal (siempre al frente);
                          el picker inline quedaba dentro del contenedor de alto fijo y los
                          campos siguientes del formulario lo tapaban. */}
                      <_DatePicker
                        label={t('reporte_piezas_danadas_view.fecha_ini')}
                        value={fecha_ini}
                        onChange={setFecha_ini}
                        disabled={!filtrar_fecha}
                      />

                      <_DatePicker
                        label={t('reporte_piezas_danadas_view.fecha_fin')}
                        value={fecha_fin}
                        onChange={setFecha_fin}
                        disabled={!filtrar_fecha}
                      />

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

        {/* Detalle de reportes en pantalla completa (swipe + flechas). El carrusel
            de fotos va como "overlay": anidado en su Modal para que iOS lo presente. */}
        <_Show_Report_Pager
          visible={detalleIndex !== null && resultadosFiltrados.length > 0}
          titulo="Detalle del Reporte"
          pages={resultadosFiltrados.map((item: any, i: number) => ({
            key: item.id_registro ?? i,
            items_fields: camposDetalle(item),
            children: renderExtrasDetalle(item),
          }))}
          index={Math.max(0, Math.min(detalleIndex ?? 0, resultadosFiltrados.length - 1))}
          onIndexChange={(i) => { setShowCarousel(false); setDetalleIndex(i); }}
          onClose={cerrarDetalle}
          overlay={renderCarrusel()}
        />

        <_Footer Show_Almacen={false} keyboardAware extraHeight={FOOTER_EXTRA}>
          {/* Botón de búsqueda arriba y, debajo, el filtro de texto en vivo sobre
              los resultados ya cargados. */}
          <View style={{ width: width - 20, alignItems: 'center' }}>
            <TouchableOpacity
              style={[styles.submitButton, { backgroundColor: theme.accent, marginTop: 0 }]}
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

            <View style={[styles.filterBox, { backgroundColor: theme.inputBg, borderColor: theme.border }]}>
              <MaterialCommunityIcons name="filter-variant" size={18} color={theme.textSub} />
              <TextInput
                style={[styles.filterInput, { color: theme.text }]}
                placeholder={t('reporte_piezas_danadas_view.filter_placeholder')}
                placeholderTextColor={theme.textSub}
                value={filtroTexto}
                onChangeText={setFiltroTexto}
                autoCapitalize="none"
                autoCorrect={false}
                returnKeyType="done"
              />
              {filtroTexto !== '' && (
                <TouchableOpacity onPress={() => setFiltroTexto('')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                  <MaterialCommunityIcons name="close-circle" size={18} color={theme.textSub} />
                </TouchableOpacity>
              )}
            </View>
          </View>
        </_Footer>
      </SafeAreaView>
    </_Background >
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
  filterBox: {
    alignSelf: 'stretch',
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 10,
    height: 44,
    marginTop: 10,
  },
  filterInput: {
    flex: 1,
    marginLeft: 6,
    fontSize: 14,
    paddingVertical: 0,
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
