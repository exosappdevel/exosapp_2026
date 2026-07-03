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
  UIManager,
  Image,
  KeyboardAvoidingView, useWindowDimensions
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { useRouter } from 'expo-router';
import { useApp } from '../../context/AppContext';
import ApiService from '@/services/ApiServices';
import { _TouchableWithoutFeedback } from '../../components/elidev_components';
import CustomModal from '../../components/CustomModal';
import { _Header,_DatePicker, _Report, _PickerModal, _DetalleLinea, _DetalleMultiLinea, _Background, hexToRGBA, _Footer, _checkBox, _AccordionSection, _Show_Cirugia_Report, formatDate, _ZoomableView } from '../../components/elidev_components';
import { addMonths } from 'date-fns';


interface PickerOption {
  id: string;
  nombre: string;
}
interface iOrderList {
  order: string;
  text: string;
}

interface iEstatusList {
  estatus: number;
  text: string;
}

interface iHospital {
  id_hospital: string;
  nombre: string;
}
interface iMedico {
  id_medico: string;
  nombre: string;
}

interface iTecnico {
  id_tecnico: string;
  nombre: string;
}
interface iVendedor {
  id_vendedor: string;
  nombre: string;
}
interface iSubdistribuidor {
  id_subdistribuidor: string;
  subdistribuidor: string;
  no_registrado: string;
}




export default function Cirugia_BuscarScreen() {
  const router = useRouter();
  const { user, theme, t } = useApp();
  const pageConfig = {
    name: t('screens.cirugias_buscar'),
    icon: "magnify",
    previous: "/home",
    show_user: true,
    show_menu: true,
    show_in_recent: true
  };

  const [appReady, setAppReady] = useState(false);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [report_visible, setReportVisible] = useState(false);

  // Form fields
  const [fecha_ini, setFecha_ini] = useState('');
  const [fecha_fin, setFecha_fin] = useState('');
  const [estatus, setEstatus] = useState<iEstatusList | null>(null);
  const [hospital, setHospital] = useState<iHospital | null>(null);
  const [medico, setMedico] = useState<iMedico | null>(null);
  const [vendedor, setVendedor] = useState<iVendedor | null>(null);
  const [tecnico, setTecnico] = useState<iTecnico | null>(null);
  const [subdistribuidor, setSubdistribuidor] = useState<iSubdistribuidor | null>(null);
  const [codigo_cirugia, setCodigo_cirugia] = useState('');
  const [limite, setLimite] = useState("15");
  const [filtrar_fecha, setFiltrar_fecha] = useState(false); // Por defecto NO se filtra por fecha
  // Agregar junto a tus otros useState
  const [showOrderModal, setShowOrderModal] = useState(false); // Para mostrar las opciones de ordenamiento


  // listas  
  const [Estatus_list, setEstatusList] = useState<iEstatusList[]>([
    { estatus: -1, text: t('cirugias_programar.estatus_text_All') },
    { estatus: 0, text: t('cirugias_programar.estatus_text_0') },
    { estatus: 1, text: t('cirugias_programar.estatus_text_1') },
    { estatus: 2, text: t('cirugias_programar.estatus_text_2') },
    { estatus: 3, text: t('cirugias_programar.estatus_text_3') },
    { estatus: 4, text: t('cirugias_programar.estatus_text_4') },
    { estatus: 5, text: t('cirugias_programar.estatus_text_5') }
  ]);
  const [Order_list, setOrderList] = useState<iOrderList[]>([
    { order: "codigo_newest", text: t('cirugias_programar.order_codigo_newest') },
    { order: "codigo_oldest", text: t('cirugias_programar.order_codigo_oldest') },
    { order: "fecha_newest", text: t('cirugias_programar.order_fecha_newest') },
    { order: "fecha_oldest", text: t('cirugias_programar.order_fecha_oldest') },
  ]);
  const [orderBy, setOrderBy] = useState<iOrderList | null>(Order_list[0]);


  const [hospitales, setHospitales] = useState<iHospital[]>([]);
  const [vendedores, setVendedores] = useState<iVendedor[]>([]);
  const [tecnicos, setTecnicos] = useState<iTecnico[]>([]);
  const [subdistribuidores, setSubdistribuidores] = useState<iSubdistribuidor[]>([]);
  const [medicos, setMedicos] = useState<iMedico[]>([]);

  const [showEstatusPicker, setShowEstatusPicker] = useState(false);
  const [showOrderPicker, setShowOrderPicker] = useState(false);
  const [showHospitalPicker, setShowHospitalPicker] = useState(false);
  const [showMedicoPicker, setShowMedicoPicker] = useState(false);
  const [showVendedorPicker, setShowVendedorPicker] = useState(false);
  const [showTecnicoPicker, setShowTecnicoPicker] = useState(false);
  const [showSubdistribuidorPicker, setShowSubdistribuidorPicker] = useState(false);

  const [date, setDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState<string | null>(null);
  const scrollRef = React.useRef<ScrollView>(null);

  const [section_resultados_visible, setSection_resultados_visible] = useState(false);
  const [resultados, setResultados] = useState([]);
  const [resultados_count, setResultados_count] = useState(0);
  const [resultado_item, setResultadoItem] = useState(null);
  const [resultado_item_visible, setResultadoItemVisible] = useState(false);

  const { height } = useWindowDimensions();
  const margin_height = 45;
  const _ClientHeight = height - 130 - margin_height;


  // 1. Agregamos una bandera para evitar ejecuciones dobles en modo estricto
  useEffect(() => {
    let isMounted = true;

    const loadData = async () => {
      // Si no hay usuario, no intentamos cargar nada
      if (!user?.id_usuario) return;

      try {
        console.log("Iniciando carga de datos...");

        // Promise.all es más rápido porque dispara todas a la vez
        const [resHospitales, resVendedores, resTecnicos, resSubdistribuidores, resMedicos] = await Promise.all([
          ApiService.get_hospitales(user.id_almacen),
          ApiService.get_vendedores(user.id_usuario, ""),
          ApiService.get_tecnicos(user.id_usuario),
          ApiService.get_subdistribuidor(""),
          ApiService.get_medicos_list(user.id_usuario, user.id_almacen)
        ]);

        if (!isMounted) return;

        // Seteamos los datos validando que sean arrays
        setHospitales(Array.isArray(resHospitales.data) ? resHospitales.data : []);
        setVendedores(Array.isArray(resVendedores.data) ? resVendedores.data : []);
        setTecnicos(Array.isArray(resTecnicos.data) ? resTecnicos.data : []);
        setSubdistribuidores(Array.isArray(resSubdistribuidores.data) ? resSubdistribuidores.data : []);
        setMedicos(Array.isArray(resMedicos.data) ? resMedicos.data : []);

        const today = new Date();
        const nextMonth = addMonths(new Date(), 1);

        setFecha_ini(formatDate(today));
        setFecha_fin(formatDate(nextMonth));

        if (Array.isArray(resVendedores.data) && (resVendedores.data.length == 1)) {
          setVendedor(resVendedores.data[0]);
        }

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
      // 1. Actualizamos el objeto Date para el componente interno
      //setDate(selectedDate);

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

  const renderResultados = () => {
    if (loading) return <ActivityIndicator size="large" color={theme.accent} style={{ marginTop: 20 }} />;
    if (resultados.length === 0) return (<View></View>);

    //alert(JSON.stringify(resultados));

    return resultados.map((item: any, index: number) => {
      //alert(JSON.stringify(item));
      const tituloGrupo = `<View><Text>${item.codigo}</Text><Text>${item.estatus_text}</Text><Text>${item.vendedor}</Text></View>`;

      return (
        /*<View>
          <Text>{item.codigo}</Text>
          <Text>{item.estatus_text}</Text>
          <Text>{item.vendedor}</Text>
        </View>*/

        <_AccordionSection
          key={item.id_cirugia || index}
          scrollRef={scrollRef}
          backgroundColor={hexToRGBA(theme.card, 1)}
          HideTitleOnOpen={true}
          title={
            <View style={{ flex: 1, paddingRight: 5 }}>
              {/* Primer Renglón */}
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text style={{
                  color: theme.text,
                  fontWeight: 'bold',
                  fontSize: 16
                }}>
                  {item.codigo}
                </Text>
                <Text style={{
                  color: theme.accent,
                  fontSize: 12,
                  fontStyle: 'italic'
                }}>
                  {item.estatus_text}
                </Text>
              </View>

              {/* Segundo Renglón */}
              <View style={{ marginTop: 2 }}>
                <Text style={{
                  color: theme.textSub,
                  fontSize: 14
                }}>
                  {item.vendedor}
                </Text>
              </View>
            </View>
          }
          isOpen={expandedSection === `res_${index}`}
          onPress={() => { setResultadoItem(item); setResultadoItemVisible(true); } /*setExpandedSection(expandedSection === `res_${index}` ? null : `res_${index}`)*/}
          yoff={85 + (index * 80)}
        >
          <View></View>
        </_AccordionSection>

      );
    });
  };

  const validateForm = () => {
    // 1. Verificación de que al menos exista un parámetro de búsqueda
    if (!vendedor && !tecnico && !subdistribuidor && !codigo_cirugia && !filtrar_fecha) {
      return t('cirugias_programar.search_valida_error_noparam');
    }

    // 2. Verificación de rango de fechas si el filtro está activo
    if (filtrar_fecha) {
      // Convertimos los strings "DD/MM/YYYY" a objetos Date reales usando tu función parseDate
      const dateIni = parseDate(fecha_ini);
      const dateFin = parseDate(fecha_fin);

      // Comparamos los milisegundos de ambas fechas
      if (dateFin.getTime() < dateIni.getTime()) {
        return t('cirugias_programar.search_valida_error_fechasinvalidas');
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
        await ApiService.buscar_cirugia(
          user.id_usuario,
          (estatus ? estatus.estatus.toString() : '-1'),
          (filtrar_fecha ? "1 " : "0"),
          fecha_ini,
          fecha_fin,
          (vendedor ? vendedor.id_vendedor : '0'),
          (tecnico ? tecnico.id_tecnico : '0'),
          (subdistribuidor ? subdistribuidor.id_subdistribuidor : '0'),
          (codigo_cirugia ? codigo_cirugia : ""),
          (limite ? limite : "-1"),
          orderBy ? orderBy.order : ''
        );

      if (response.result === 'ok') {
        setSubmitting(false);
        //alert(JSON.stringify(response));
        const resultados_count = response.data_count;
        setResultados_count(resultados_count);
        setResultados(response.data);
        if (resultados_count == 0) {
          setSection_resultados_visible(false);
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
          setSection_resultados_visible(true);
          scrollRef.current?.scrollTo({ y: 10, animated: false });
          //setExpandedSection('resultados');
          //playSuccessSound();
          // render respose.data

          //alert(JSON.stringify(response));
        }
      }
      else {
        setSection_resultados_visible(false);
        //playErrorSound();
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
          source={require('../../assets/images/loading_blue_circle.gif')} // <-- MODIFICADO: Ruta a tu GIF
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
    <_Background id_almacen={user?.id_almacen}>
      <SafeAreaView style={[styles.container]}>
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
                title={t('cirugias_programar.parameters_search_title')}
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
                    text={t('cirugias_programar.title_use_dates')}
                  />

                  {filtrar_fecha && (
                    /* Contenedor de Inputs (Se atenúa si está deshabilitado) */
                    <View style={{ opacity: filtrar_fecha ? 1 : 0.4, marginTop: 10 }} pointerEvents={filtrar_fecha ? 'auto' : 'none'}>
                      
                      <_DatePicker
                        label="Fecha de inicio"
                        required
                        value={fecha_ini}
                        onChange={setFecha_ini}
                        disabled={!filtrar_fecha}
                      />

                      <_DatePicker
                        label="Fecha fin"
                        value={fecha_fin}
                        onChange={setFecha_fin}
                        disabled={!filtrar_fecha}
                      />

                    </View>
                  )}
                </View>

                {/*Status: 0-cancelada 1-programada 2-surtida 3-finalizada 4-material entregado 5-solicitada*/}
                <View style={styles.fieldContainer}>
                  <Text style={[styles.label, { color: theme.text }]}>
                    {t('cirugias_programar.estatus_title')}
                  </Text>
                  <TouchableOpacity
                    style={[styles.selector, { backgroundColor: theme.inputBg, borderColor: theme.border }]}
                    onPress={() => setShowEstatusPicker(true)}
                  >
                    <Text style={[styles.selectorText, { color: theme.text }]}>
                      {estatus?.text || t("cirugias_programar.estatus_text_All")}
                    </Text>
                    <MaterialCommunityIcons name="chevron-down" size={20} color={theme.textSub} />
                  </TouchableOpacity>
                </View>

                {/* Agente */}
                <View style={styles.fieldContainer}>
                  <Text style={[styles.label, { color: theme.text }]}>
                    {t('cirugias_programar.agente')}
                  </Text>
                  <TouchableOpacity
                    style={[styles.selector, { backgroundColor: theme.inputBg, borderColor: theme.border }]}
                    onPress={() => setShowVendedorPicker(true)}
                  >
                    <Text style={[styles.selectorText, { color: vendedor ? theme.text : theme.textSub }]}>
                      {vendedor?.nombre || 'Seleccione vendedor...'}
                    </Text>
                    <MaterialCommunityIcons name="chevron-down" size={20} color={theme.textSub} />
                  </TouchableOpacity>
                </View>
                {/* Tecnico1 */}
                <View style={styles.fieldContainer}>
                  <Text style={[styles.label, { color: theme.text }]}>
                    {t('cirugias_programar.tecnico')}
                  </Text>
                  <TouchableOpacity
                    style={[styles.selector, { backgroundColor: theme.inputBg, borderColor: theme.border }]}
                    onPress={() => setShowTecnicoPicker(true)}
                  >
                    <Text style={[styles.selectorText, { color: tecnico ? theme.text : theme.textSub }]}>
                      {tecnico?.nombre || 'Seleccione técnico...'}
                    </Text>
                    <MaterialCommunityIcons name="chevron-down" size={20} color={theme.textSub} />
                  </TouchableOpacity>
                </View>
                {/* Subdistribuidor */}
                <View style={styles.fieldContainer}>
                  <Text style={[styles.label, { color: theme.text }]}>
                    {t('cirugias_programar.subdistribuidor')}
                  </Text>

                  <TouchableOpacity
                    style={[styles.selector, { backgroundColor: theme.inputBg, borderColor: theme.border }]}
                    onPress={() => setShowSubdistribuidorPicker(true)}
                  >
                    <Text style={[styles.selectorText, { color: subdistribuidor ? theme.text : theme.textSub }]}>
                      {subdistribuidor?.subdistribuidor || 'Seleccione subdistribuidor...'}
                    </Text>
                    <MaterialCommunityIcons name="chevron-down" size={20} color={theme.textSub} />
                  </TouchableOpacity>
                </View>
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
        <_PickerModal
          key="picker-estatus"
          visible={showEstatusPicker}
          onClose={() => setShowEstatusPicker(false)}
          data={Estatus_list}
          key_name="estatus"
          onSelect={(item: iEstatusList) => setEstatus(item)}
          title="Estatus"
        />
        <_PickerModal
          key="picker-order"
          visible={showOrderPicker}
          onClose={() => setShowOrderPicker(false)}
          data={Order_list}
          key_name="order"
          onSelect={(item: iOrderList) => setOrderBy(item)}
          title='Ordenar por:'
        />
        <_PickerModal
          key="picker-vendedor"
          visible={showVendedorPicker}
          onClose={() => setShowVendedorPicker(false)}
          data={vendedores}
          key_name="id_vendedor"
          onSelect={(item: iVendedor) => setVendedor(item)}
          title='Seleccionar Vendedor'
        />
        <_PickerModal
          key="picker-tecnicos"
          visible={showTecnicoPicker}
          onClose={() => setShowTecnicoPicker(false)}
          data={tecnicos}
          key_name="id_vendedor"
          onSelect={(item: iTecnico) => setTecnico(item)}
          title='Seleccionar Técnico'
        />
        <_PickerModal
          key="picker-subs"
          visible={showSubdistribuidorPicker}
          onClose={() => setShowSubdistribuidorPicker(false)}
          data={subdistribuidores}
          key_name="id_subdistribuidor"
          onSelect={(item: iSubdistribuidor) => setSubdistribuidor(item)}
          title='Seleccionar Subdistribuidor'
        />
        <_PickerModal
          key="picker-hospital"
          visible={showHospitalPicker}
          onClose={() => setShowHospitalPicker(false)}
          data={hospitales}
          key_name="id_hospital"
          onSelect={(item: iHospital) => setHospital(item)}
          title='Seleccionar hospital'
        />
        <_PickerModal
          key="picker-medico"
          visible={showMedicoPicker}
          onClose={() => setShowMedicoPicker(false)}
          data={medicos}
          key_name="id_medico"
          onSelect={(item: iMedico) => setMedico(item)}
          title='Seleccionar Medico'
        />

        <CustomModal        
          visible={modal.visible}
          titulo={modal.titulo}
          mensaje={modal.mensaje}
          icon={modal.icon}
          colorIcon={modal.colorIcon}
          onClose={() => setModal({ ...modal, visible: false })}
        />
        <_Show_Cirugia_Report
          titulo={'Detalle de la cirugia'}
          visible={resultado_item_visible}
          item={resultado_item}
          onClose={() => setResultadoItemVisible(false)}
        />
        <_Footer Show_Almacen={false} Show_Usermenu={true} >
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
                <Text style={styles.submitButtonText}>{t('cirugias_programar.search_button')}</Text>
              </>
            )}
          </TouchableOpacity>
        </_Footer>
      </SafeAreaView>
    </_Background>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    height: '85%'
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
    padding: 3
  },
  formCard: {
    borderRadius: 0,
    padding: 0,
    borderWidth: 0,
    marginBottom: 40,
  },
  formHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  formTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 10,
  },
  fieldContainer: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  required: {
    color: '#f56565',
    fontSize: 16,
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
  textArea: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 15,
    paddingVertical: 12,
    fontSize: 14,
    minHeight: 100,
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
    paddingVertical: 15,
    borderRadius: 20,
    marginTop: 3,
    paddingHorizontal: 20
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 10,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 15,
    borderTopWidth: 1,
  },
  footerText: {
    marginLeft: 10,
    fontSize: 14,
    fontWeight: '500',
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
  accordionContainer: { borderWidth: 1, borderRadius: 8, marginBottom: 12, overflow: 'hidden' },
  accordionHeader: {
    flexDirection: 'row', justifyContent: 'space-between',
    padding: 15, backgroundColor: '#0f0f0f0', alignItems: 'center'
  },
  accordionTitle: { fontSize: 16, fontWeight: 'bold' },
  accordionContent: { padding: 15 },
  inputGroup: { marginBottom: 15 },
  checkboxRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  checkLabel: { marginLeft: 10, fontSize: 15 },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12, // Espacio suficiente para el touch
    paddingHorizontal: 15,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  checkboxLabel: {
    marginLeft: 12,
    fontSize: 15,
    flex: 1,
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
  actionButton: {
    alignItems: 'center',
    padding: 10,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    width: '45%'
  },
  fileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#ccc'
  },
  detalleContainer: {
    paddingVertical: 5,
    paddingHorizontal: 10
  },
  rowDetalle: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
    borderBottomWidth: 0.5,
    borderBottomColor: 'rgba(100,100,100,0.05)',
  },

  labelDetalle: {
    fontSize: 12,
    fontWeight: '600',
    flex: 2,
  },
  valueDetalle: {
    fontSize: 12,
    flex: 2,
    textAlign: 'right',
  },
  rowDetalleMulti: {
    justifyContent: 'space-between',
    paddingVertical: 4,
    borderBottomWidth: 0.5,
    borderBottomColor: 'rgba(100,100,100,0.05)',
  },
  labelDetalleMulti: {
    fontSize: 12,
    fontWeight: '600',
  },
  valueDetalleMulti: {
    fontSize: 11,
    textAlign: 'left',
    paddingVertical: 4,
    paddingLeft: 5
  },
  divisor: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.1)',
    marginVertical: 8,
  },
  // Al final de tu StyleSheet en cirugias_buscar.tsx
  grupoFechasContainer: {
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    marginBottom: 16,
  },
  shareButton: {
    top: -50,                   // Reducido un poco para que no choque con los bordes del acordeón
    left: 20,
  },
  value_bold: {
    fontWeight: 'bold'
  }
});
