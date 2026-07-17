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
  LayoutAnimation,
  Image,
  Switch,
  KeyboardAvoidingView,
  useWindowDimensions,
  Alert

} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useApp } from '../../context/AppContext';
import ApiService from '@/services/ApiServices';
import * as ImagePicker from 'expo-image-picker';
import { _TouchableWithoutFeedback } from '../../components/elidev_components';
import CustomModal from '../../components/CustomModal';
import { _Header, _Footer,_DatePicker, _PickerModal, _checkBox, _Background, hexToRGBA, playSuccessSound, playErrorSound, _AccordionSection, formatDate, _Show_Cirugia_Report, _SuccessCheck } from '../../components/elidev_components';
import * as DocumentPicker from 'expo-document-picker';

interface iEstado {
  id_estado: string;
  nombre: string;
}

interface iSubCategoria {
  id_set_subcategoria: string;
  nombre: string;
}

interface iCategoria {
  id_set_categoria: string;
  nombre: string;
  subcategorias: iSubCategoria[];
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
interface iPaciente {
  nombre: string;
  materno: string;
  paterno: string;
}
interface iEquipoPoder {
  id_ep_categoria: string;
  nombre: string;
}
interface iInstrumental {
  id_instru_categoria: string;
  nombre: string;
}
interface iConsumible {
  id_consu_categoria: string;
  nombre: string;
}
interface iSubdistribuidor {
  id_subdistribuidor: string;
  subdistribuidor: string;
  no_registrado: string;
}


export default function ProgramaCirugiaScreen() {
  const { user, theme, t, appConfig } = useApp();
  const pageConfig = {
    name: t('cirugias_programar.new_title'),
    icon: "calendar-plus",
    previous: "/home",
    show_user: true,
    show_menu: true,
    show_in_recent: true
  };

  const [appReady, setAppReady] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [report_visible, setReportVisible] = useState(false);
  const [report_data, setReportData] = useState(null);
  const [showSuccessAnim, setShowSuccessAnim] = useState(false);

  // Form fields
  const [fecha, setFecha] = useState(formatDate(new Date()));
  const [hora, setHora] = useState('');
  const [estado, setEstado] = useState<iEstado | null>(null);
  const [ciudad, setCiudad] = useState('');
  const [hospital, setHospital] = useState<iHospital | null>(null);
  const [medico, setMedico] = useState<iMedico | null>(null);
  const [vendedor, setVendedor] = useState<iVendedor | null>(null);
  const [tecnico1, setTecnico1] = useState<iTecnico | null>(null);
  const [tecnico2, setTecnico2] = useState<iTecnico | null>(null);
  const [subdistribuidor, setSubdistribuidor] = useState<iSubdistribuidor | null>(null);
  const [numero_ordenpago, setNumero_ordenpago] = useState('');
  const [subdistribuidor_otro, setSubdistribuidor_otro] = useState("");

  const [paciente, setPaciente] = useState<iPaciente | null>({ nombre: '', paterno: '', materno: '' });
  const [solicitarEsteril, setSolicitarEsteril] = useState(false);
  const [notas, setNotas] = useState('');
  const [archivos, setArchivos] = useState<any[]>([]);

  // listas  
  const [estados, setEstados] = useState<iEstado[]>([]);
  const [hospitales, setHospitales] = useState<iHospital[]>([]);
  const [vendedores, setVendedores] = useState<iVendedor[]>([]);
  const [tecnicos, setTecnicos] = useState<iTecnico[]>([]);
  const [categorias, setCategorias] = useState<iCategoria[]>([]);
  const [equipospoder, setEquiposPoder] = useState<iEquipoPoder[]>([]);
  const [instrumenales, setInstrumentales] = useState<iInstrumental[]>([]);
  const [consumibles, setConsumibles] = useState<iConsumible[]>([]);
  const [subdistribuidores, setSubdistribuidores] = useState<iSubdistribuidor[]>([]);
  const [medicos, setMedicos] = useState<iMedico[]>([]);


  // Estado para los materiales seleccionados
  const [selectedSubcats, setSelectedSubcats] = useState<Record<string, boolean>>({});
  // Función para alternar la selección
  const toggleSubcategoria = (id: string) => {
    setSelectedSubcats(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const SubCatColor = (isopen: boolean, categoriaId: string, subcategorias: iSubCategoria[] | undefined) => {
    const count = (subcategorias ?? []).filter(
      sub => !!selectedSubcats[`materiales_${categoriaId}/${sub.id_set_subcategoria}`]
    ).length;
    return count > 0
      ? hexToRGBA(theme.markup_complete, 0.3)
      : (isopen ? hexToRGBA(theme.card, 0.3) : 'transparent')
  };

  const CatColor = (isOpen: boolean, categoria: 'ep_' | 'ins_' | 'cons_') => {
    const countMap: Record<string, number> = {
      ep_: equipospoder.filter(item => !!selectedSubcats[`ep_${item.id_ep_categoria}`]).length,
      ins_: instrumenales.filter(item => !!selectedSubcats[`ins_${item.id_instru_categoria}`]).length,
      cons_: consumibles.filter(item => !!selectedSubcats[`cons_${item.id_consu_categoria}`]).length,
    };

    const hasSelected = (countMap[categoria] ?? 0) > 0;

    if (hasSelected) return hexToRGBA(theme.markup_complete, 0.3);
    return isOpen ? hexToRGBA(theme.card, 0.3) : 'transparent';
  };

  const SectionColor = (isOpen: boolean, section: 'lugar' | 'participantes' | 'paciente' | 'notas') => {
    const complete: Record<string, boolean> = {
      lugar: !!fecha && !!hora && !!estado && estado.id_estado !== '0' && !!ciudad,
      participantes: !!vendedor && !!tecnico1 && !!tecnico2 && !!subdistribuidor
        && !!hospital && hospital.id_hospital !== '0'
        && !!medico && medico.id_medico !== '0',
      paciente: !!paciente?.nombre && !!paciente?.paterno,
      notas: !!notas,
    };

    const done = complete[section] ?? false;
    if (done) return hexToRGBA(theme.markup_complete, 0.3);
    return isOpen ? hexToRGBA(theme.card, 0.3) : hexToRGBA(theme.markup_incomplete, 0.3);
  };


  // Picker modals
  const [showEstadoPicker, setShowEstadoPicker] = useState(false);
  const [showHoraPicker, setShowHoraPicker] = useState(false);
  const [showHospitalPicker, setShowHospitalPicker] = useState(false);
  const [showMedicoPicker, setShowMedicoPicker] = useState(false);
  const [showVendedorPicker, setShowVendedorPicker] = useState(false);
  const [showTecnico1Picker, setShowTecnico1Picker] = useState(false);
  const [showTecnico2Picker, setShowTecnico2Picker] = useState(false);
  const [showSubdistribuidorPicker, setShowSubdistribuidorPicker] = useState(false);

  const [tempHora, setTempHora] = useState(new Date()); // hora temporal
  
  const scrollRef = React.useRef<ScrollView>(null);

  const { height } = useWindowDimensions();
  const margin_height = 70;
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
        const [resEstados, resHospitales, resVendedores, resTecnicos, resCategorias, resEquipopoder, resInstrumentales, resConsumibles, resSubdistribuidores, resMedicos] = await Promise.all([
          ApiService.get_estados(),
          ApiService.get_hospitales(user.id_almacen),
          ApiService.get_vendedores(user.id_usuario, ""),
          ApiService.get_tecnicos(user.id_usuario),
          ApiService.get_set_categorias_subcategorias(),
          ApiService.get_equipos_poder_categoria(),
          ApiService.get_instrumental_categoria(),
          ApiService.get_consumible_categoria(),
          ApiService.get_subdistribuidor(""),
          ApiService.get_medicos_list(user.id_usuario, user.id_almacen)
        ]);

        if (!isMounted) return;

        // Seteamos los datos validando que sean arrays
        setEstados(Array.isArray(resEstados.data) ? resEstados.data : []);
        setHospitales(Array.isArray(resHospitales.data) ? resHospitales.data : []);
        setVendedores(Array.isArray(resVendedores.data) ? resVendedores.data : []);
        setTecnicos(Array.isArray(resTecnicos.data) ? resTecnicos.data : []);
        setCategorias(Array.isArray(resCategorias.data) ? resCategorias.data : []);
        setEquiposPoder(Array.isArray(resEquipopoder.data) ? resEquipopoder.data : []);
        setInstrumentales(Array.isArray(resInstrumentales.data) ? resInstrumentales.data : []);
        setConsumibles(Array.isArray(resConsumibles.data) ? resConsumibles.data : []);
        setSubdistribuidores(Array.isArray(resSubdistribuidores.data) ? resSubdistribuidores.data : []);
        setMedicos(Array.isArray(resMedicos.data) ? resMedicos.data : []);

        if (Array.isArray(resVendedores.data) && (resVendedores.data.length == 1)) {
          setVendedor(resVendedores.data[0]);
          if (Array.isArray(resTecnicos.data)) {
            setTecnico1(resTecnicos.data[0]);
            setTecnico2(resTecnicos.data[0]);
          }
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



  const confirmHora = () => {
    const h = tempHora.getHours().toString().padStart(2, '0');
    const m = tempHora.getMinutes().toString().padStart(2, '0');
    setHora(`${h}:${m}`);
    setShowHoraPicker(false);
  };


  const [modal, setModal] = useState({
    visible: false,
    titulo: '',
    mensaje: '',
    icon: 'alert-circle-outline',
    colorIcon: '#f56565'
  });
  

  const get_subcat_selected = (tipo: string): string => {
    // 1. Obtenemos todas las llaves del objeto (ej: ["ins_24", "ep_10", "ins_45"])
    return Object.keys(selectedSubcats)
      .filter((key) => {
        // 2. Verificamos que el valor sea true
        // 3. Verificamos que la llave empiece con el tipo buscado + "_"
        return selectedSubcats[key] === true && key.startsWith(`${tipo}_`);
      })
      .map((key) => {
        // 4. Extraemos lo que está después del primer "_"
        // Usamos split('_').slice(1).join('_') por si el ID contiene más guiones
        return key.split('_')[1];
      })
      // 5. Unimos todos los IDs encontrados con una coma
      .join(',');
  };


  const validateForm = () => {
    if (!fecha) return 'Ingrese la fecha de la cirugía';
    if (!hora) return 'Seleccione la hora';
    if (!estado || estado.id_estado === '0') return 'Seleccione el estado';
    if (!vendedor) return 'Ingrese el vendedor';
    if (!tecnico1) return 'Ingrese el Técnico';
    if (!tecnico2) return 'Ingrese el Técnico 2';
    if (!subdistribuidor) return 'Ingrese el Subdistribuidor';
    if (!hospital || hospital.id_hospital === '0') return 'Ingrese el hospital';
    if (!medico || medico.id_medico === '0') return 'Ingrese el médico';
    if (!notas) return 'Ingrese notas o adicionales';
    return null;
  };
  const confirm_Clean_form = () => {
    if (Platform.OS === "web") {
          if (confirm(t('common.confirm_clean_form'))) Clean_form();
        } else {
          Alert.alert(t('common.clean_form'), t('common.confirm_clean_form'), [
            { text: t('common.no') },
            { text: t('common.yes'), onPress: Clean_form },
          ]);
        }
  };
  const Clean_form = () => {
    
    setFecha(formatDate(new Date()));
    setHora('');
    setEstado(null);
    setCiudad('');

    setSubdistribuidor(null);
    setSubdistribuidor_otro('');
    setHospital(null);
    setMedico(null);
    setNotas('');
    setPaciente({ nombre: '', paterno: '', materno: '' });
    setSelectedSubcats({});
    setArchivos([]);

    setVendedor(null);
    setTecnico1(null);
    setTecnico2(null);

    if (Array.isArray(vendedores) && (vendedores.length == 1)) {
      setVendedor(vendedores[0]);
      if (Array.isArray(tecnicos)) {
        setTecnico1(tecnicos[0]);
        setTecnico2(tecnicos[0]);
      }
    }

    return null;
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

    const materiales_sel = get_subcat_selected("materiales");
    const ep_sel = get_subcat_selected("ep");
    const adi_sel = get_subcat_selected("ins");
    const cons_sel = get_subcat_selected("cons");

    /*alert(materiales_sel);
    alert(ep_sel);
    alert(adi_sel);
    alert(cons_sel);*/

    try {


      // 1. Subir archivos primero
      let urlsSubidas: string[] = [];
      //alert(JSON.stringify(archivos));

      for (const archivo of archivos) {
        // Solo subimos si es un objeto local (tiene uri local)
        //alert(JSON.stringify(archivo));
        const urlServidor = await ApiService.uploadFileDirect(archivo);

        if (urlServidor) {
          urlsSubidas.push(appConfig.url + urlServidor);
        }
      }

      const stringArchivos = urlsSubidas.join(',');

      const response =
        await ApiService.guarda_cirugia(
          user.id_usuario,
          user.id_almacen,
          "nuevo",
          "0",
          fecha,
          hora,
          estado?.id_estado ?? "0",
          ciudad.toUpperCase(),
          vendedor?.id_vendedor ?? "0",
          tecnico1?.id_tecnico ?? "0",
          tecnico2?.id_tecnico ?? "0",
          subdistribuidor?.id_subdistribuidor ?? "0",
          subdistribuidor_otro.toUpperCase(),
          hospital?.id_hospital ?? "0",
          medico?.id_medico ?? "0",
          materiales_sel,
          ep_sel,
          adi_sel,
          cons_sel,
          notas.toUpperCase(),
          paciente?.nombre.toUpperCase() ?? "",
          paciente?.paterno.toUpperCase() ?? "",
          paciente?.materno.toUpperCase() ?? "",
          solicitarEsteril ? '1' : '0',
          numero_ordenpago,
          stringArchivos);

      if (response.result === 'ok') {
        setSubmitting(false);
        playSuccessSound();
        setReportData(response.get_cirugia_report);
        Clean_form();
        setShowSuccessAnim(true);
      }
      else {
        playErrorSound();
        setModal({
          visible: true,
          titulo: t('common.error'),
          mensaje: response.result_text,
          icon: 'alert-circle-outline',
          colorIcon: '#f56565'
        });
      }
    } catch {
      setModal({
        visible: true,
        titulo: t('common.error'),
        mensaje: 'Error al guardar los cambios',
        icon: 'alert-circle-outline',
        colorIcon: '#f56565'
      });
    } finally {
      setSubmitting(false);
    }

  };

  const [expandedSection, setExpandedSection] = useState<string | null>('lugar');

  const toggleSection = (section: string) => {
    if (expandedSection === section) {

      setExpandedSection(null);
      if (section.indexOf("materiales_") > -1)
        setTimeout(() => {
          setExpandedSection("materiales");
        }, 50);

    }
    else {
      setExpandedSection(section);
    }

    setExpandedSection(expandedSection === section ? null : section);
  };


  // 1. MIENTRAS CARGA (Splash Screen)
  if (!appReady) {
    return (
      <_Background id_almacen={user?.id_almacen}>
        <View style={[styles.loadingDataContainer, { backgroundColor: hexToRGBA(theme.bg, 0.5) }]}>
          <Image
            source={require('../../assets/images/loading_blue_circle.gif')} // <-- MODIFICADO: Ruta a tu GIF
            style={styles.loadingGif}
            resizeMode="contain"
          />
          <Text style={[styles.loadingText, { color: theme.textSub }]}>
            {t('common.loading')}
          </Text>
        </View>
      </_Background>
    );
  }


  const pickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: "*/*", // Permite todos los tipos de archivos
        copyToCacheDirectory: true
      });

      // En las versiones nuevas de Expo, se verifica con !result.canceled
      if (!result.canceled) {
        const asset = result.assets[0];

        // Creamos el objeto con la estructura que necesita ApiService.uploadFileDirect
        const nuevoArchivo = {
          uri: asset.uri,
          name: asset.name,
          type: asset.mimeType || 'application/octet-stream'
        };

        //alert(JSON.stringify(nuevoArchivo));
        // Guardamos en tu estado de archivos (el array que se subirá al final)
        setArchivos((prev: any) => [...prev, nuevoArchivo]);
      }
    } catch (err) {
      console.error("Error al seleccionar documento:", err);
    }
  };

  // Ejemplo para takePhoto
  const takePhoto = async () => {
    let result = await ImagePicker.launchCameraAsync({ quality: 0.5 });
    if (!result.canceled) {
      const asset = result.assets[0];
      const nuevoArchivo = {
        uri: asset.uri,
        name: asset.uri.split('/').pop() || 'photo.jpg',
        type: 'image/jpeg'
      };
      //alert(JSON.stringify(nuevoArchivo));
      // Lo agregamos a tu lista de archivos actual
      setArchivos(prev => [...prev, nuevoArchivo]);
    }
  };

  // 2. CUANDO TERMINA LA CARGA (Contenedor Principal)
  return (
    <_Background id_almacen={user?.id_almacen}>
      <SafeAreaView style={[styles.container]}>
        {/* Header */}
        <_Header page_info={pageConfig} />
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ flex: 1 }}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 10 : 40} // Ajusta este número según el alto de tu header
        >

          <ScrollView ref={scrollRef} style={[styles.content, { maxHeight: _ClientHeight }]} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled" canCancelContentTouches={true} >
            {/* Form Card */}
            <View style={[styles.formCard, { borderWidth: 0 }]}>

              {/* SECCIÓN 1: PROGRAMACIÓN */}
              <_AccordionSection
                title={t('cirugias_programar.lugar_fecha')}
                isOpen={expandedSection === 'lugar'}
                yoff={0}
                scrollRef={scrollRef}
                onPress={() => toggleSection('lugar')}
                backgroundColor={SectionColor(expandedSection === 'lugar', 'lugar')}
              >

                {/* Fecha */}
                <_DatePicker
                  label={t('cirugias_programar.fecha')}
                  required
                  value={fecha}
                  onChange={setFecha}
                  minimumDate={new Date()}
                />

                {/* Hora */}
                <View style={styles.fieldContainer}>
                  <Text style={[styles.label, { color: theme.text }]}>
                    {t('cirugias_programar.hora')} <Text style={styles.required}>*</Text>
                  </Text>

                  {Platform.OS === 'web' ? (
                    <View style={[styles.selector, { backgroundColor: theme.inputBg, borderColor: theme.border, flexDirection: 'row', alignItems: 'center' }]}>
                      <input
                        type="time"
                        value={hora}
                        onChange={(e) => setHora(e.target.value)}
                        style={{
                          flex: 1,
                          border: 'none',
                          outline: 'none',
                          background: 'transparent',
                          color: hora ? theme.text : theme.textSub,
                          fontSize: 16,
                          fontFamily: 'inherit',
                          cursor: 'pointer',
                        }}
                      />
                      <MaterialCommunityIcons name="clock-outline" size={20} color={theme.textSub} />
                    </View>
                  ) : (
                    // iOS y Android: botón que muestra la hora y abre el picker con confirmación
                    <>
                      <TouchableOpacity
                        style={[styles.selector, { backgroundColor: theme.inputBg, borderColor: theme.border }]}
                        onPress={() => {
                          if (hora) {
                            const [h, m] = hora.split(':').map(Number);
                            const d = new Date();
                            d.setHours(h, m, 0, 0);
                            setTempHora(d);
                          } else {
                            setTempHora(new Date());
                          }
                          setShowHoraPicker(true);
                        }}
                      >
                        <Text style={[styles.selectorText, { color: hora ? theme.text : theme.textSub }]}>
                          {hora || 'Seleccione hora...'}
                        </Text>
                        <MaterialCommunityIcons name="clock-outline" size={20} color={theme.textSub} />
                      </TouchableOpacity>

                      {showHoraPicker && (
                        <>
                          <DateTimePicker
                            value={tempHora}
                            mode="time"
                            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                            minuteInterval={30}
                            onChange={(event, selectedDate) => {
                              if (Platform.OS === 'android') {
                                setShowHoraPicker(false);
                                if (event.type === 'set' && selectedDate) {
                                  const h = selectedDate.getHours().toString().padStart(2, '0');
                                  const m = selectedDate.getMinutes().toString().padStart(2, '0');
                                  setHora(`${h}:${m}`);
                                }
                              } else {
                                if (selectedDate) setTempHora(selectedDate);
                              }
                            }}
                            textColor={theme.text}
                          />
                          {Platform.OS === 'ios' && (
                            <View style={{ flexDirection: 'row', justifyContent: 'flex-end', gap: 10, paddingTop: 4 }}>
                              <TouchableOpacity
                                onPress={() => setShowHoraPicker(false)}
                                style={[styles.pickerBtn, { borderColor: theme.border }]}
                              >
                                <Text style={{ color: theme.textSub }}>Cancelar</Text>
                              </TouchableOpacity>
                              <TouchableOpacity
                                onPress={confirmHora}
                                style={[styles.pickerBtn, { backgroundColor: theme.accent }]}
                              >
                                <Text style={{ color: '#fff', fontWeight: 'bold' }}>Confirmar</Text>
                              </TouchableOpacity>
                            </View>
                          )}
                        </>
                      )}
                    </>
                  )}
                </View>

                {/* Estado */}
                <View style={styles.fieldContainer}>
                  <Text style={[styles.label, { color: theme.text }]}>
                    {t('cirugias_programar.estado')} <Text style={styles.required}>*</Text>
                  </Text>
                  <TouchableOpacity
                    style={[styles.selector, { backgroundColor: theme.inputBg, borderColor: theme.border }]}
                    onPress={() => setShowEstadoPicker(true)}
                  >
                    <Text style={[styles.selectorText, { color: estado ? theme.text : theme.textSub }]}>
                      {estado?.nombre || 'Seleccione estado...'}
                    </Text>
                    <MaterialCommunityIcons name="chevron-down" size={20} color={theme.textSub} />
                  </TouchableOpacity>
                </View>

                {/* Ciudad */}
                <_TouchableWithoutFeedback>
                  <View style={styles.fieldContainer}>
                    <Text style={[styles.label, { color: theme.text }]}>
                      {t('cirugias_programar.ciudad')} <Text style={styles.required}>*</Text>
                    </Text>
                    <TextInput
                      style={[styles.input, { backgroundColor: theme.inputBg, borderColor: theme.border, color: theme.text, textTransform: 'uppercase' }]}
                      placeholder="Ej. Guadalajara"
                      placeholderTextColor={theme.textSub}
                      value={ciudad}
                      onChangeText={setCiudad}
                      autoCapitalize='characters'

                    />
                  </View>
                </_TouchableWithoutFeedback>
              </_AccordionSection>
              <_AccordionSection
                title={t('cirugias_programar.participantes')}
                isOpen={expandedSection === 'participantes'}
                yoff={70}
                scrollRef={scrollRef}
                onPress={() => toggleSection('participantes')}
                backgroundColor={SectionColor(expandedSection === 'participantes', 'participantes')}
              >

                {/* Agente */}
                <View style={styles.fieldContainer}>
                  <Text style={[styles.label, { color: theme.text }]}>
                    {t('cirugias_programar.agente')} <Text style={styles.required}>*</Text>
                  </Text>
                  <TouchableOpacity
                    style={[styles.selector, { backgroundColor: theme.inputBg, borderColor: theme.border }]}
                    onPress={() => setShowVendedorPicker(true)}
                  >
                    <Text style={[styles.selectorText, { color: estado ? theme.text : theme.textSub }]}>
                      {vendedor?.nombre || 'Seleccione vendedor...'}
                    </Text>
                    <MaterialCommunityIcons name="chevron-down" size={20} color={theme.textSub} />
                  </TouchableOpacity>
                </View>
                {/* Tecnico1 */}
                <View style={styles.fieldContainer}>
                  <Text style={[styles.label, { color: theme.text }]}>
                    {t('cirugias_programar.tecnico')} <Text style={styles.required}>*</Text>
                  </Text>
                  <TouchableOpacity
                    style={[styles.selector, { backgroundColor: theme.inputBg, borderColor: theme.border }]}
                    onPress={() => setShowTecnico1Picker(true)}
                  >
                    <Text style={[styles.selectorText, { color: estado ? theme.text : theme.textSub }]}>
                      {tecnico1?.nombre || 'Seleccione técnico...'}
                    </Text>
                    <MaterialCommunityIcons name="chevron-down" size={20} color={theme.textSub} />
                  </TouchableOpacity>
                </View>
                {/* Tecnico2 */}
                <View style={styles.fieldContainer}>
                  <Text style={[styles.label, { color: theme.text }]}>
                    {t('cirugias_programar.tecnico')} 2 <Text style={styles.required}>*</Text>
                  </Text>
                  <TouchableOpacity
                    style={[styles.selector, { backgroundColor: theme.inputBg, borderColor: theme.border }]}
                    onPress={() => setShowTecnico2Picker(true)}
                  >
                    <Text style={[styles.selectorText, { color: estado ? theme.text : theme.textSub }]}>
                      {tecnico2?.nombre || 'Seleccione técnico...'}
                    </Text>
                    <MaterialCommunityIcons name="chevron-down" size={20} color={theme.textSub} />
                  </TouchableOpacity>
                </View>

                {/* Subdistribuidor */}
                <View style={styles.fieldContainer}>
                  <Text style={[styles.label, { color: theme.text }]}>
                    {t('cirugias_programar.subdistribuidor')} <Text style={styles.required}>*</Text>
                  </Text>

                  <TouchableOpacity
                    style={[styles.selector, { backgroundColor: theme.inputBg, borderColor: theme.border }]}
                    onPress={() => setShowSubdistribuidorPicker(true)}
                  >
                    <Text style={[styles.selectorText, { color: estado ? theme.text : theme.textSub }]}>
                      {subdistribuidor?.subdistribuidor || 'Seleccione subdistribuidor...'}
                    </Text>
                    <MaterialCommunityIcons name="chevron-down" size={20} color={theme.textSub} />
                  </TouchableOpacity>
                </View>
                {/* Subdistribuidor_txt */}
                {((subdistribuidor?.no_registrado ?? "0") == "1") && (
                  <View style={styles.fieldContainer}>
                    <Text style={[styles.label, { color: theme.text }]}>
                      {t('cirugias_programar.subdistribuidor')} no registrado
                      <Text style={styles.required}>*</Text>
                    </Text>
                    <TextInput
                      style={[styles.input, { backgroundColor: theme.inputBg, borderColor: theme.border, color: theme.text, textTransform: 'uppercase' }]}
                      placeholder="Ej. Johnson"
                      placeholderTextColor={theme.textSub}
                      value={subdistribuidor_otro}
                      onChangeText={(text) => setSubdistribuidor_otro(text)}
                      autoCapitalize='characters'
                    />
                  </View>
                )}

                {/* Hospital */}
                <View style={styles.fieldContainer}>
                  <Text style={[styles.label, { color: theme.text }]}>
                    {t('cirugias_programar.hospital')} <Text style={styles.required}>*</Text>
                  </Text>
                  <TouchableOpacity
                    style={[styles.selector, { backgroundColor: theme.inputBg, borderColor: theme.border }]}
                    onPress={() => setShowHospitalPicker(true)}
                  >
                    <Text style={[styles.selectorText, { color: estado ? theme.text : theme.textSub }]}>
                      {hospital?.nombre || 'Seleccione hospital...'}
                    </Text>
                    <MaterialCommunityIcons name="chevron-down" size={20} color={theme.textSub} />
                  </TouchableOpacity>
                </View>

                {/* Médico */}
                <View style={styles.fieldContainer}>
                  <Text style={[styles.label, { color: theme.text }]}>
                    {t('cirugias_programar.medico')} <Text style={styles.required}>*</Text>
                  </Text>
                  <TouchableOpacity
                    style={[styles.selector, { backgroundColor: theme.inputBg, borderColor: theme.border }]}
                    onPress={() => setShowMedicoPicker(true)}
                  >
                    <Text style={[styles.selectorText, { color: estado ? theme.text : theme.textSub }]}>
                      {medico?.nombre || 'Seleccione medico...'}
                    </Text>
                    <MaterialCommunityIcons name="chevron-down" size={20} color={theme.textSub} />
                  </TouchableOpacity>
                </View>
              </_AccordionSection>

              {/* SECCIÓN 2: PACIENTE */}
              <_AccordionSection
                title={t('cirugias_programar.info_paciente')}
                isOpen={expandedSection === 'paciente'}
                yoff={130}
                scrollRef={scrollRef}
                onPress={() => toggleSection('paciente')}
                backgroundColor={SectionColor(expandedSection === 'paciente', 'paciente')}
              >

                {/* Paciente */}
                <View style={styles.fieldContainer}>
                  <Text style={[styles.label, { color: theme.text }]}>
                    {t('cirugias_programar.paciente_nombre_title')}
                  </Text>
                  <TextInput
                    style={[styles.input, { backgroundColor: theme.inputBg, borderColor: theme.border, color: theme.text, textTransform: 'uppercase' }]}
                    placeholder={t('cirugias_programar.paciente_nombre')}
                    placeholderTextColor={theme.textSub}
                    value={paciente?.nombre}
                    autoCapitalize='characters'
                    onChangeText={(text) => {
                      setPaciente(prev => {
                        const dataBase = prev ?? { nombre: '', paterno: '', materno: '' };
                        return { ...dataBase, nombre: text };
                      });
                    }}
                  />
                </View>
                <View style={styles.fieldContainer}>
                  <Text style={[styles.label, { color: theme.text }]}>
                    {t('cirugias_programar.paciente_materno_title')}
                  </Text>
                  <TextInput
                    style={[styles.input, { backgroundColor: theme.inputBg, borderColor: theme.border, color: theme.text, textTransform: 'uppercase' }]}
                    placeholder={t('cirugias_programar.paciente_materno')}
                    placeholderTextColor={theme.textSub}
                    autoCapitalize='characters'
                    value={paciente?.materno}
                    onChangeText={(text) => {
                      setPaciente(prev => {
                        const dataBase = prev ?? { nombre: '', paterno: '', materno: '' };
                        return { ...dataBase, materno: text };
                      });
                    }}
                  />
                </View>
                <View style={styles.fieldContainer}>
                  <Text style={[styles.label, { color: theme.text }]}>
                    {t('cirugias_programar.paciente_paterno_title')}
                  </Text>
                  <TextInput
                    style={[styles.input, { backgroundColor: theme.inputBg, borderColor: theme.border, color: theme.text, textTransform: 'uppercase' }]}
                    placeholder={t('cirugias_programar.paciente_paterno')}
                    placeholderTextColor={theme.textSub}
                    autoCapitalize='characters'
                    value={paciente?.paterno}
                    onChangeText={(text) => {
                      setPaciente(prev => {
                        const dataBase = prev ?? { nombre: '', paterno: '', materno: '' };
                        return { ...dataBase, paterno: text };
                      });
                    }}
                  />
                </View>

              </_AccordionSection>

              {/* SECCIÓN: Registro de Pago */}
              <_AccordionSection
                title={t('cirugias_programar.regitro_pago_title')}
                isOpen={expandedSection === 'registro_pago'}
                yoff={200}
                scrollRef={scrollRef}
                onPress={() => toggleSection('registro_pago')}
              >

                {/* Numero de orden */}
                <View style={styles.fieldContainer}>
                  <Text style={[styles.label, { color: theme.text }]}>
                    {t('cirugias_programar.numero_de_orden_title')}
                  </Text>
                  <TextInput
                    style={[styles.input, { backgroundColor: theme.inputBg, borderColor: theme.border, color: theme.text, textTransform: 'uppercase' }]}
                    placeholder={t('cirugias_programar.numero_de_orden')}
                    placeholderTextColor={theme.textSub}
                    value={numero_ordenpago}
                    onChangeText={setNumero_ordenpago}
                  />
                </View>
                <View style={styles.fieldContainer}>
                  <Text style={[styles.label, { color: theme.text }]}>
                    {t('cirugias_programar.subir_comprobantes')}
                  </Text>
                </View>

                <View style={{ flexDirection: 'row', justifyContent: 'space-around', marginBottom: 15 }}>
                  <TouchableOpacity onPress={pickDocument} style={styles.actionButton}>
                    <MaterialCommunityIcons name="file-upload" size={24} color={theme.text} />
                    <Text style={{ color: theme.text }}>Galería</Text>
                  </TouchableOpacity>

                  <TouchableOpacity onPress={takePhoto} style={styles.actionButton}>
                    <MaterialCommunityIcons name="camera" size={24} color={theme.text} />
                    <Text style={{ color: theme.text }}>Cámara</Text>
                  </TouchableOpacity>
                </View>

                {/* Lista de archivos seleccionados */}
                {archivos.map((file, index) => (
                  <View key={"file_" + index} style={styles.fileRow}>
                    <Text style={{ color: theme.text, flex: 1 }} numberOfLines={1}>
                      {file.name || file.fileName || `Imagen_${index + 1}.jpg`}
                    </Text>
                    <TouchableOpacity onPress={() => setArchivos(archivos.filter((_, i) => i !== index))}>
                      <MaterialCommunityIcons name="delete" size={20} color="red" />
                    </TouchableOpacity>
                  </View>
                ))}
              </_AccordionSection>


              {/* SECCIÓN 3: materiales */}

              <_AccordionSection
                title={t('cirugias_programar.materiales')}
                isOpen={(expandedSection === 'materiales') || (expandedSection?.indexOf('materiales_') == 0)}
                yoff={270}
                scrollRef={scrollRef}
                onPress={() => toggleSection('materiales')}
                backgroundColor={(() => {
                  const isOpen = (expandedSection === 'materiales') || (expandedSection?.indexOf('materiales_') == 0);
                  const hasAny = categorias.some(cat =>
                    Array.isArray(cat.subcategorias) && cat.subcategorias.some(sub =>
                      !!selectedSubcats[`materiales_${cat.id_set_categoria}/${sub.id_set_subcategoria}`]
                    )
                  );
                  if (hasAny) return hexToRGBA(theme.markup_complete, 0.3);
                  return isOpen ? hexToRGBA(theme.card, 0.3) : 'transparent';
                })()}
              >
                {Array.isArray(categorias) &&
                  categorias.map((item: iCategoria, index: number) => {
                    if (Array.isArray(item.subcategorias)) {
                      if (item.subcategorias.length == 0) {

                      } else {
                        // Calculamos cuántos seleccionados hay para ESTA categoría
                        const seleccionadosEnEstaCat = Array.isArray(item.subcategorias)
                          ? item.subcategorias.filter(sub => !!selectedSubcats["materiales_" + item.id_set_categoria + "/" + sub.id_set_subcategoria]).length
                          : 0;

                        return (

                          <_AccordionSection
                            key={"cat_" + item.id_set_categoria}
                            // Si hay seleccionados, mostramos el número junto al nombre
                            title={(seleccionadosEnEstaCat > 0
                              ? `${item.nombre} (${seleccionadosEnEstaCat})`
                              : item.nombre)
                            }
                            isOpen={expandedSection === `materiales_${item.id_set_categoria}`}
                            yoff={270 + (index * 68)}
                            scrollRef={scrollRef}
                            onPress={() => { toggleSection(`materiales_${item.id_set_categoria}`); }}
                            backgroundColor={SubCatColor(expandedSection === `materiales_${item.id_set_categoria}`, item.id_set_categoria, item.subcategorias)}
                          >
                            {Array.isArray(item.subcategorias) &&
                              item.subcategorias.map((sub: iSubCategoria) => {
                                const key_id = "materiales_" + item.id_set_categoria + "/" + sub.id_set_subcategoria;
                                const isSelected = !!selectedSubcats[key_id];

                                return (
                                  <_checkBox
                                    key={key_id}
                                    key_id={key_id}
                                    use_switch={true}
                                    text={sub.nombre}
                                    value={isSelected}
                                    setValue={() => toggleSubcategoria(key_id)}
                                  />
                                );
                              })}
                          </_AccordionSection>
                        );
                      }
                    }
                  })}

              </_AccordionSection>

              {/* EQUIPOS DE PODER */}
              {(() => {
                // Declaramos la constante exactamente igual que haces con las categorías
                const seleccionadosEquipos = equipospoder.filter(
                  (item) => !!selectedSubcats["ep_" + item.id_ep_categoria]
                ).length;

                return (
                  <_AccordionSection
                    title={seleccionadosEquipos > 0 ? (t('cirugias_programar.equipospoder') + ' (' + seleccionadosEquipos + ')') : t('cirugias_programar.equipospoder')}
                    isOpen={expandedSection === 'equipospoder'}
                    yoff={340}
                    scrollRef={scrollRef}
                    onPress={() => toggleSection('equipospoder')}
                    backgroundColor={CatColor(expandedSection === 'equipospoder', "ep_")}
                  >

                    {Array.isArray(equipospoder) &&
                      equipospoder.map((item: iEquipoPoder) => {
                        const key_id = "ep_" + item.id_ep_categoria;
                        const isSelected = !!selectedSubcats[key_id];

                        return (
                          <_checkBox
                            key={key_id}
                            key_id={key_id}
                            use_switch={true}
                            text={item.nombre}
                            value={isSelected}
                            setValue={() => toggleSubcategoria(key_id)}
                          />
                        );

                      })
                    }
                  </_AccordionSection>
                );
              })()}

              {/* instrumenal */}
              {(() => {
                // Declaramos la constante exactamente igual que haces con las categorías
                const seleccionadosInst = instrumenales.filter(
                  (item) => !!selectedSubcats["ins_" + item.id_instru_categoria]
                ).length;

                return (
                  <_AccordionSection
                    title={seleccionadosInst > 0 ? (t('cirugias_programar.instrumentales') + ' (' + seleccionadosInst + ')') : t('cirugias_programar.instrumentales')}
                    isOpen={expandedSection === 'instrumentales'}
                    yoff={410}
                    scrollRef={scrollRef}
                    onPress={() => toggleSection('instrumentales')}
                    backgroundColor={CatColor(expandedSection === 'instrumentales', "ins_")}
                  >
                    {Array.isArray(equipospoder) &&
                      instrumenales.map((item: iInstrumental) => {

                        const key_id = "ins_" + item.id_instru_categoria;
                        const isSelected = !!selectedSubcats[key_id];

                        return (
                          <_checkBox
                            key={key_id}
                            key_id={key_id}
                            use_switch={true}
                            text={item.nombre}
                            value={isSelected}
                            setValue={() => toggleSubcategoria(key_id)}
                          />
                        );
                      })
                    }
                  </_AccordionSection>
                );
              })()}
              {/* CONSUMIBLES */}
              {(() => {
                // Declaramos la constante exactamente igual que haces con las categorías
                const seleccionadosCons = consumibles.filter(
                  (item) => !!selectedSubcats["cons_" + item.id_consu_categoria]
                ).length;

                return (
                  <_AccordionSection
                    title={seleccionadosCons > 0 ? (t('cirugias_programar.consumibles') + ' (' + seleccionadosCons + ')') : t('cirugias_programar.consumibles')}
                    isOpen={expandedSection === 'consumibles'}
                    yoff={480}
                    scrollRef={scrollRef}
                    onPress={() => toggleSection('consumibles')}
                    backgroundColor={CatColor(expandedSection === 'consumibles', "cons_")}
                  >
                    {Array.isArray(consumibles) &&
                      consumibles.map((item: iConsumible) => {
                        const key_id = "cons_" + item.id_consu_categoria;
                        const isSelected = !!selectedSubcats[key_id];
                        return (
                          <_checkBox
                            key={key_id}
                            key_id={key_id}
                            use_switch={true}
                            text={item.nombre}
                            value={isSelected}
                            setValue={() => toggleSubcategoria(key_id)}
                          />
                        );
                      })
                    }

                  </_AccordionSection>

                );
              })()}

              <_AccordionSection
                title={t('cirugias_programar.extra')}
                isOpen={expandedSection === 'notas'}
                yoff={0}
                scrollRef={scrollRef}
                onPress={() => toggleSection('notas')}
                backgroundColor={SectionColor(expandedSection === 'notas', 'notas')}
              >
                {/* Campo: Solicitar Material Estéril */}
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 10 }}>
                  <Text style={{ color: theme.text, fontSize: 15 }}>{t('cirugias_programar.solicita_material_esteril')}</Text>
                  <Switch
                    value={solicitarEsteril}
                    onValueChange={setSolicitarEsteril}
                    trackColor={{ false: '#767577', true: theme.text }}
                  />
                </View>

                {/* Notas */}
                <_TouchableWithoutFeedback>
                  <View pointerEvents="box-none" style={styles.fieldContainer}>
                    <Text style={[styles.label, { color: theme.text }]}>{t('cirugias_programar.notas_title')}<Text style={styles.required}>*</Text></Text>
                    <TextInput
                      style={[styles.textArea, { backgroundColor: theme.inputBg, borderColor: theme.border, color: theme.text, textTransform: 'uppercase' }]}
                      placeholder={t('cirugias_programar.notas')}
                      placeholderTextColor={theme.textSub}
                      value={notas}
                      onChangeText={setNotas}
                      multiline
                      autoCapitalize='characters'
                      numberOfLines={4}
                      textAlignVertical="top"
                      onFocus={() => {
                        // Pequeño delay para esperar a que el teclado empiece a subir
                        setTimeout(() => {
                          scrollRef.current?.scrollToEnd({ animated: true });
                        }, 300);
                      }}
                      scrollEnabled={false}
                    />
                  </View>
                </_TouchableWithoutFeedback>
              </_AccordionSection>
              {/*
              <View style={{ backgroundColor: hexToRGBA(theme.card, 0.9), borderRadius: 30, marginTop: 20 }}>

                <View style={[styles.fieldContainer, { alignContent: 'center' }]}>
                  <Text style={[styles.required, { marginLeft: 20, marginTop: 15, fontWeight: 'bold' }]}>* {t("common.requerido")}</Text>
                </View>
              </View>
              */}
            </View>
          </ScrollView>

        </KeyboardAvoidingView>
        <_Footer Show_Almacen={false}>
          {/* Submit Button */}

          <TouchableOpacity
            style={[styles.submitButton, { backgroundColor: theme.markup_complete }]}
            onPress={handleSubmit}
            disabled={submitting}
          >
            {submitting ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <MaterialCommunityIcons name="calendar-check" size={24} color="#fff" />
                <Text style={styles.submitButtonText}>{t('cirugias_programar.submit_button')}</Text>
              </>
            )}
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.submitButton, { backgroundColor: theme.markup_incomplete, marginLeft: 20 }]}
            onPress={confirm_Clean_form}
            disabled={submitting}
          >
            {submitting ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <MaterialCommunityIcons name="trash-can-outline" size={24} color="#fff" />
                <Text style={styles.submitButtonText}>{t('common.clean_form')}</Text>
              </>
            )}
          </TouchableOpacity>

        </_Footer>




        {/* Picker Modals */}

        <_PickerModal
          key="picker-Estado"
          visible={showEstadoPicker}
          onClose={() => setShowEstadoPicker(false)}
          data={estados}
          key_name="id_estado"
          onSelect={(item: iEstado) => setEstado(item)}
          title="Seleccionar Estado"
        />
        <_PickerModal
          key="picker-vendedor"
          visible={showVendedorPicker}
          onClose={() => setShowVendedorPicker(false)}
          data={vendedores}
          key_name="id_vendedor"
          onSelect={(item: iVendedor) => setVendedor(item)}
          title="Seleccionar Vendedor"
        />
        <_PickerModal
          key="picker-tecnico1"
          visible={showTecnico1Picker}
          onClose={() => setShowTecnico1Picker(false)}
          data={tecnicos}
          key_name="id_tecnico"
          onSelect={(item: iTecnico) => setTecnico1(item)}
          title="Seleccionar Técnico"
        />
        <_PickerModal
          key="picker-tecnico2"
          visible={showTecnico2Picker}
          onClose={() => setShowTecnico2Picker(false)}
          data={tecnicos}
          key_name="id_tecnico"
          onSelect={(item: iTecnico) => setTecnico2(item)}
          title="Seleccionar Técnico"
        />
        <_PickerModal
          visible={showSubdistribuidorPicker}
          key="picker-subs"
          onClose={() => setShowSubdistribuidorPicker(false)}
          data={subdistribuidores}
          key_name="id_subdistribuidor"
          onSelect={(item: iSubdistribuidor) => setSubdistribuidor(item)}
          title="Seleccionar Subdistribuidor"
        />
        <_PickerModal
          key="picker-hospital"
          visible={showHospitalPicker}
          onClose={() => setShowHospitalPicker(false)}
          data={hospitales}
          key_name="id_hospital"
          onSelect={(item: iHospital) => setHospital(item)}
          title="Seleccionar Hospital"
        />
        <_PickerModal 
          key="picker-medico"
          visible={showMedicoPicker}
          onClose={() => setShowMedicoPicker(false)}
          data={medicos}
          key_name="id_medico"
          onSelect={(item: iMedico) => setMedico(item)}
          title="Seleccionar Medico"
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
          visible={report_visible}
          item={report_data}
          onClose={() => setReportVisible(false)}
        />
        <_SuccessCheck
          visible={showSuccessAnim}
          onFinish={() => {
            setShowSuccessAnim(false);
            setReportVisible(true);
          }}
        />


      </SafeAreaView>

    </_Background>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    marginBottom: Platform.OS === 'ios' ? -15 : -10
  },
  content: {
    flex: 1,
    padding: 3,
  },
  formCard: {
    borderRadius: 16,
    padding: 0,
    borderWidth: 1,
    marginBottom: 60,
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
    paddingHorizontal: 5,
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
    borderRadius: 20,
    marginTop: 2,
    paddingHorizontal: 10
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: 'bold',
    marginLeft: 10,
    paddingTop:0
  },
  loadingDataContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    ...({
      backdropFilter: 'blur(5px)',
      WebkitBackdropFilter: 'blur(5px)',
    } as any),
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
  pickerBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'transparent',
  },
});