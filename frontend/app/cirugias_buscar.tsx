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
  KeyboardAvoidingView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { useRouter } from 'expo-router';
import { useApp } from '../context/AppContext';
import ApiService from '@/services/ApiServices';
import { _TouchableWithoutFeedback } from '../components/elidev_components';
import CustomModal from '../components/CustomModal';
import { _Header, _Background, hexToRGBA, _Footer, _checkBox, _AccordionSection, playSuccessSound, playErrorSound, formatDate } from '../components/elidev_components';
import { addMonths } from 'date-fns';

// Habilitar animaciones en Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}


interface PickerOption {
  id: string;
  nombre: string;
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
    show_menu: true
  };

  const [appReady, setAppReady] = useState(false);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

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
  const [limite, setLimite] = useState("10");
  const [filtrar_fecha, setFiltrar_fecha] = useState(false); // Por defecto NO se filtra por fecha


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
  const [hospitales, setHospitales] = useState<iHospital[]>([]);
  const [vendedores, setVendedores] = useState<iVendedor[]>([]);
  const [tecnicos, setTecnicos] = useState<iTecnico[]>([]);
  const [subdistribuidores, setSubdistribuidores] = useState<iSubdistribuidor[]>([]);
  const [medicos, setMedicos] = useState<iMedico[]>([]);

  const [showEstatusPicker, setShowEstatusPicker] = useState(false);
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
          ApiService.get_vendedores(user.id_usuario, "Vendedor"),
          ApiService.get_tecnicos(user.id_usuario),
          ApiService.get_subdistribuidor(),
          ApiService.get_medicos_list(user.id_usuario)
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
      setDate(selectedDate);

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


  const validateForm = () => {
    return null;
  };


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
          onPress={() => setExpandedSection(expandedSection === `res_${index}` ? null : `res_${index}`)}
          yoff={85 + (index * 80)}
        >
          <View style={styles.detalleContainer}>
            <DetalleLinea label="Técnico 1" value={item.tecnico} />
            <DetalleLinea label="Técnico 2" value={item.tecnico2} />
            <DetalleLinea label="Tiempo de Surtido" value={item.tiempo_surtido} />
            <DetalleLinea label="Tiempo de Entrega a Técnico" value={item.tiempo_entrega_tecnico} />
            <DetalleLinea label="Fecha de Programación" value={item.fecha_programacion} />
            <DetalleLinea label="Fecha de Reprogramación" value={item.fecha_reprogramacion} />
            <DetalleLinea label="Fecha de Cirugía" value={item.fecha_cirugia} />
            <DetalleLinea label="Subdistribuidor" value={item.subdistribuidor} />
            <DetalleLinea label="Médico" value={item.medico} />
            <DetalleLinea label="Hospital" value={item.hospital} />
            <DetalleLinea label="Municipio" value={`${item.municipio || ''}, ${item.estado || ''}`} />

            <View style={styles.divisor} />

            <DetalleMultiLinea label="Material" value={item.minialmacen} />
            <DetalleMultiLinea label="Equipo Poder" value={item.ep} />
            <DetalleMultiLinea label="Adicionales" value={item.adicionales} />
            <DetalleMultiLinea label="Consumibles" value={item.consumibles} />
            <DetalleLinea label="Solicita Estéril" value={item.esteril} />

            <View style={styles.divisor} />

            <DetalleMultiLinea label="Notas" value={item.notas} />
            <DetalleLinea label="Remisión" value={item.remision} />
            <DetalleLinea
              label="Última Modificación"
              value={`${item.last_update || ''} / ${item.last_updater || ''}`}
            />
          </View>
        </_AccordionSection>

      );
    });
  };

  // Componente pequeño para las líneas de detalle
  const DetalleLinea = ({ label, value }: { label: string, value: any }) => (
    <View style={styles.rowDetalle}>
      <Text style={[styles.labelDetalle, { color: theme.textSub }]}>{label}:</Text>
      <Text style={[styles.valueDetalle, { color: theme.text }]}>{value || '---'}</Text>
    </View>
  );

  const DetalleMultiLinea = ({ label, value }: { label: string, value: any }) => {
    // Convertimos a string y separamos por saltos de línea
    const lineas = value && typeof value === 'string'
      ? value.split('\n').filter(linea => linea.trim() !== '')
      : [];

    return (
      <View style={[styles.rowDetalleMulti, { paddingBottom: 4 }]}>
        <Text style={[styles.labelDetalleMulti, { color: theme.textSub }]}>{label}:</Text>

        <View style={{ flex: 2 }}>
          {lineas.length > 0 ? (
            lineas.map((linea, index) => (
              <Text
                key={index}
                style={[styles.valueDetalleMulti, { color: theme.text, textAlign: 'left', paddingVertical: 4, paddingLeft: 5 }]}
              >
                {linea}
              </Text>
            ))
          ) : (
            <Text style={[styles.valueDetalleMulti, { color: theme.text, textAlign: 'left' }]}>
              ---
            </Text>
          )}
        </View>
      </View>
    );
  };
  const handleSubmit = async () => {
    const error = validateForm();
    if (error) {
      playErrorSound();

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
          (filtrar_fecha ? "1 " :"0" ), 
          fecha_ini,
          fecha_fin,
          (vendedor ? vendedor.id_vendedor : '0'),
          (tecnico ? tecnico.id_tecnico : '0'),
          (subdistribuidor ? subdistribuidor.id_subdistribuidor : '0'),
          (codigo_cirugia ? codigo_cirugia : ""),
          (limite ? limite : "-1"));

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

  const renderPickerModal = (
    visible: boolean,
    onClose: () => void,
    data: string[] | iEstatusList[] | PickerOption[] | iVendedor[] | iTecnico[] | iHospital[] | iMedico[] | iSubdistribuidor[],
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
                    : (item.text || item.nombre || item.subdistribuidor || 'Sin nombre')}
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

          <ScrollView ref={scrollRef} style={styles.content} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled" canCancelContentTouches={true} >
            {/* Form Card */}
            <View style={[styles.formCard, { backgroundColor: hexToRGBA(theme.card, 0), borderColor: theme.border }]}>


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
                  { borderColor: theme.border, backgroundColor: hexToRGBA(theme.card, 0.2) ,
                    height:filtrar_fecha?250:50
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

                    {/* Fecha ini */}
                    <View style={styles.fieldContainer}>
                      <Text style={[styles.label, { color: theme.text }]}>
                        {t('cirugias_programar.fecha_ini')}
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
                        {t('cirugias_programar.fecha_fin')}
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
                <_TouchableWithoutFeedback>
                  <View style={styles.fieldContainer}>
                    <Text style={[styles.label, { color: theme.text }]}>
                      {t('cirugias_programar.limite')}
                    </Text>
                    <TextInput
                      style={[styles.input, { backgroundColor: theme.inputBg, borderColor: theme.border, color: theme.text, textTransform: 'uppercase' }]}
                      placeholder="Ej.1"
                      placeholderTextColor={theme.textSub}
                      value={limite}
                      onChangeText={setLimite}
                      autoCapitalize='characters'

                    />
                  </View>
                </_TouchableWithoutFeedback>

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
            "estatus",
            (item: iEstatusList) => setEstatus(item),
            'Estatus'
          )}
        {
          renderPickerModal(
            showVendedorPicker,
            () => setShowVendedorPicker(false),
            vendedores,
            "id_vendedor",
            (item: iVendedor) => setVendedor(item),
            'Seleccionar Vendedor'
          )}
        {
          renderPickerModal(
            showTecnicoPicker,
            () => setShowTecnicoPicker(false),
            tecnicos,
            "id_tecnico",
            (item: iTecnico) => setTecnico(item),
            'Seleccionar Técnico'
          )}

        {
          renderPickerModal(
            showSubdistribuidorPicker,
            () => setShowSubdistribuidorPicker(false),
            subdistribuidores,
            "id_subdistribuidor",
            (item: iSubdistribuidor) => setSubdistribuidor(item),
            'Seleccionar Subdistribuidor'
          )}

        {
          renderPickerModal(
            showHospitalPicker,
            () => setShowHospitalPicker(false),
            hospitales,
            "id_hospital",
            (item: iHospital) => setHospital(item),
            'Seleccionar hospital'
          )}
        {
          renderPickerModal(
            showMedicoPicker,
            () => setShowMedicoPicker(false),
            medicos,
            "id_medico",
            (item: iMedico) => setMedico(item),
            'Seleccionar Medico'
          )}




        <CustomModal
          visible={modal.visible}
          titulo={modal.titulo}
          mensaje={modal.mensaje}
          icon={modal.icon}
          colorIcon={modal.colorIcon}
          onClose={() => setModal({ ...modal, visible: false })}
        />
      </_Background>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
    padding: 3,
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
    paddingVertical: 16,
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
});
