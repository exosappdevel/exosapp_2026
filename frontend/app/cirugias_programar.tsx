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
  Switch,
  KeyboardAvoidingView,
  TouchableWithoutFeedback,
  Keyboard
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { useRouter } from 'expo-router';
import { useApp } from '../context/AppContext';
import ApiService from '@/services/ApiServices';
import * as ImagePicker from 'expo-image-picker';
import { _TouchableWithoutFeedback } from '../components/elidev_components';
import CustomModal, { Soon_Modal } from '../components/CustomModal';
import { _Header, _Footer, _MenuGrid, _checkBox, _Background, hexToRGBA, playSuccessSound, playErrorSound, _AccordionSection } from '../components/elidev_components';
import * as DocumentPicker from 'expo-document-picker';

// Habilitar animaciones en Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}


// Sample data based on the HTML form
const horasData = [
  '06:00', '06:30', '07:00', '07:30', '08:00', '08:30', '09:00', '09:30',
  '10:00', '10:30', '11:00', '11:30', '12:00', '12:30', '13:00', '13:30',
  '14:00', '14:30', '15:00', '15:30', '16:00', '16:30', '17:00', '17:30',
  '18:00', '18:30', '19:00', '19:30', '20:00', '20:30', '21:00', '21:30',
];

interface PickerOption {
  id: string;
  nombre: string;
}

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
  const router = useRouter();
  const { user, theme, t } = useApp();
  const pageConfig = {
    name: t('cirugias.new_title'),
    icon: "calendar-plus",
    previous: "/home",
    show_user: true,
    show_menu: true
  };

  const [appReady, setAppReady] = useState(false);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Form fields
  const [fecha, setFecha] = useState('');
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
  // Estado para los materiales seleccionados
  const [selectedSubcats, setSelectedSubcats] = useState<Record<string, boolean>>({});
  const [medicos, setMedicos] = useState<iMedico[]>([]);

  // Función para alternar la selección
  const toggleSubcategoria = (id: string) => {
    setSelectedSubcats(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
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

  const [date, setDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);

  const [expandedCats, setExpandedCats] = useState({}); // Para manejar acordeones anidados
  const scrollRef = React.useRef<ScrollView>(null);


  const validaData = async (response: any) => {
    try {
      if (Array.isArray(response)) {
        return response;
      }
      else return []
    } catch (e) {
      console.log('Error loading service:', e);
    } finally {
      setLoading(false);
    }
  };

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
          ApiService.get_vendedores(user.id_usuario, "Vendedor"),
          ApiService.get_tecnicos(user.id_usuario),
          ApiService.get_set_categorias_subcategorias(),
          ApiService.get_equipos_poder_categoria(),
          ApiService.get_instrumental_categoria(),
          ApiService.get_consumible_categoria(),
          ApiService.get_subdistribuidor(),
          ApiService.get_medicos_list(user.id_usuario)
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


  const onDateChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
    // En iOS, el picker puede quedarse abierto, en Android se cierra solo
    setShowDatePicker(false);

    if (event.type === 'set' && selectedDate) {
      // 1. Actualizamos el objeto Date para el componente interno
      setDate(selectedDate);

      // 2. Formateamos la fecha para mostrarla en el campo de texto
      const day = selectedDate.getDate().toString().padStart(2, '0');
      const month = (selectedDate.getMonth() + 1).toString().padStart(2, '0');
      const year = selectedDate.getFullYear();
      const formattedDate = `${day}/${month}/${year}`;

      // 3. ¡CRUCIAL!: Actualizamos el estado que lee el <Text> del selector
      setFecha(formattedDate);
    } else {
      // Si el usuario cancela, cerramos el picker
      setShowDatePicker(false);
    }
  };

  const showPicker = () => {
    setShowDatePicker(true);
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
  const finalizarSeleccion = () => {
    const materialesSeleccionados = Object.keys(selectedSubcats).filter(id => selectedSubcats[id]);
    console.log("IDs a enviar al servidor:", materialesSeleccionados);
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

    const materiales_sel = get_subcat_selected("cat");
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

      /*for (const archivo of archivos) {
        // Solo subimos si es un objeto local (tiene uri local)
        //alert(JSON.stringify(archivo));
        const urlServidor = await ApiService.uploadFileDirect(archivo);
        if (urlServidor) {
          urlsSubidas.push(urlServidor);
        }
      }*/

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
        setModal({
          visible: true,
          titulo: t("cirugias.success_title"),
          mensaje: t("cirugias.success"),
          icon: 'check-circle-outline',
          colorIcon: '#48bb78'
        });
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
    } catch (e) {
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

  const renderPickerModal = (
    visible: boolean,
    onClose: () => void,
    data: string[] | PickerOption[] | iEstado[] | iVendedor[] | iTecnico[] | iCategoria[] | iHospital[] | iMedico[] | iSubdistribuidor[],
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
                    : (item.nombre || item.subdistribuidor || 'Sin nombre')}
                </Text>
              </TouchableOpacity>
            )}
          />
        </View>
      </View>
    </Modal>
  );
  const [expandedSection, setExpandedSection] = useState<string | null>('lugar');

  const toggleSection = (section: string) => {
    if (expandedSection === section){
      
      setExpandedSection(null);
      if(section.indexOf("materiales_")>-1)
        setTimeout(() => {
          setExpandedSection("materiales");          
        }, 50);
        
    }
    else{
      setExpandedSection(section);
    }

    setExpandedSection(expandedSection === section ? null : section);
  };
  const [expandedSubsections, setExpandedSubsections] = useState<Record<string, boolean>>({});


  const toggleSubsection = (SubsectionId: string, yOffset: number = 0) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    const isOpening = !expandedSubsections[SubsectionId];

    setExpandedSubsections((prev) => {
      // Si la sección que clickeamos ya está abierta, la cerramos (devolvemos objeto vacío)
      if (prev[SubsectionId]) {
        return {};
      }
      // Si está cerrada, abrimos SOLO esa (creamos un objeto nuevo solo con esa llave)
      return { [SubsectionId]: true };
    });

    if (isOpening) {
      // El delay es vital para que la animación de LayoutAnimation 
      // termine de expandir el contenido antes de calcular el scroll.
      setTimeout(() => {
        // Ejecutar el scroll        
        scrollRef.current?.scrollTo({
          y: yOffset,
          animated: true,
        });
      }, 100); // 400ms es el tiempo ideal para esperar la animación de Expo/RN
    }

  };

  // Estados para Checkboxes (basados en programa_cirugia.html)
  const [checks, setChecks] = useState({
    ayuno: false,
    consentimiento: false,
    laboratorios: false,
    electro: false,
    valoracion: false
  });


  // 1. MIENTRAS CARGA (Splash Screen)
  if (!appReady) {
    return (
      <_Background id_almacen={user?.id_almacen}>
        <View style={[styles.loadingDataContainer, { backgroundColor: hexToRGBA(theme.bg, 0.5) }]}>
          <Image
            source={require('../assets/images/loading_blue_circle.gif')} // <-- MODIFICADO: Ruta a tu GIF
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
    <SafeAreaView style={[styles.container, { backgroundColor: theme.bg }]}>
      <_Background id_almacen={user?.id_almacen}>
        {/* Header */}
        <_Header page_info={pageConfig} />
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ flex: 1 }}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 10 : 40} // Ajusta este número según el alto de tu header
        >

          <ScrollView ref={scrollRef} style={styles.content} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled" canCancelContentTouches={true} >
            {/* Form Card */}
            <View style={[styles.formCard]}>

              {/* SECCIÓN 1: PROGRAMACIÓN */}
              <_AccordionSection
                title={t('cirugias.lugar_fecha')}
                isOpen={expandedSection === 'lugar'}
                yoff={0}
                scrollRef={scrollRef}
                onPress={() => toggleSection('lugar')}
              >

                {/* Fecha */}
                <View style={styles.fieldContainer}>
                  <Text style={[styles.label, { color: theme.text }]}>
                    {t('cirugias.fecha')} <Text style={styles.required}>*</Text>
                  </Text>

                  {Platform.OS === 'web' ? (
                    /* --- VISTA PARA WEB --- */
                    <View style={[
                      styles.selector,
                      { backgroundColor: theme.inputBg, borderColor: theme.border, flexDirection: 'row', alignItems: 'center' }
                    ]}>
                      <input
                        type="date"
                        // HTML5 requiere YYYY-MM-DD para el valor interno del input
                        value={date instanceof Date && !isNaN(date.getTime())
                          ? date.toISOString().split('T')[0]
                          : ""}
                        onChange={(e) => {
                          const val = e.target.value;
                          if (val) {
                            const [year, month, day] = val.split('-').map(Number);
                            const selectedDate = new Date(year, month - 1, day);

                            // Llamamos a tu función para actualizar el estado 'fecha' (texto) y 'date' (objeto)
                            onDateChange({ type: 'set' } as any, selectedDate);
                          }
                        }}
                        style={{
                          flex: 1,
                          border: 'none',
                          outline: 'none',
                          background: 'transparent',
                          color: date ? theme.text : theme.textSub,
                          fontSize: 16,
                          fontFamily: 'inherit',
                          cursor: 'pointer'
                        }}
                      />
                      <MaterialCommunityIcons name="calendar-outline" size={20} color={theme.textSub} />
                    </View>
                  ) : (
                    /* --- VISTA PARA MÓVIL (iOS/Android) --- */
                    <>
                      <TouchableOpacity
                        style={[styles.selector, { backgroundColor: theme.inputBg, borderColor: theme.border }]}
                        onPress={showPicker}
                      >
                        <Text style={[styles.selectorText, { color: fecha ? theme.text : theme.textSub }]}>
                          {fecha || 'DD/MM/YYYY'}
                        </Text>
                        <MaterialCommunityIcons name="calendar-outline" size={20} color={theme.textSub} />
                      </TouchableOpacity>

                      {showDatePicker && (
                        <DateTimePicker
                          value={date}
                          mode="date"
                          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                          onChange={onDateChange}
                          minimumDate={new Date()}
                        />
                      )}
                    </>
                  )}

                </View>

                {/* Hora */}
                <View style={styles.fieldContainer}>
                  <Text style={[styles.label, { color: theme.text }]}>
                    {t('cirugias.hora')} <Text style={styles.required}>*</Text>
                  </Text>
                  <TouchableOpacity
                    style={[styles.selector, { backgroundColor: theme.inputBg, borderColor: theme.border }]}
                    onPress={() => setShowHoraPicker(true)}
                  >
                    <Text style={[styles.selectorText, { color: hora ? theme.text : theme.textSub }]}>
                      {hora || 'Seleccione hora...'}
                    </Text>
                    <MaterialCommunityIcons name="clock-outline" size={20} color={theme.textSub} />
                  </TouchableOpacity>
                </View>

                {/* Estado */}
                <View style={styles.fieldContainer}>
                  <Text style={[styles.label, { color: theme.text }]}>
                    {t('cirugias.estado')} <Text style={styles.required}>*</Text>
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
                      {t('cirugias.ciudad')} <Text style={styles.required}>*</Text>
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
                title={t('cirugias.participantes')}
                isOpen={expandedSection === 'participantes'}
                yoff={70}
                scrollRef={scrollRef}
                onPress={() => toggleSection('participantes')}
              >

                {/* Agente */}
                <View style={styles.fieldContainer}>
                  <Text style={[styles.label, { color: theme.text }]}>
                    {t('cirugias.agente')} <Text style={styles.required}>*</Text>
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
                    {t('cirugias.tecnico')} <Text style={styles.required}>*</Text>
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
                    {t('cirugias.tecnico')} 2 <Text style={styles.required}>*</Text>
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
                    {t('cirugias.subdistribuidor')} <Text style={styles.required}>*</Text>
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
                      {t('cirugias.subdistribuidor')} no registrado
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
                    {t('cirugias.hospital')} <Text style={styles.required}>*</Text>
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
                    {t('cirugias.medico')} <Text style={styles.required}>*</Text>
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
                title={t('cirugias.info_paciente')}
                isOpen={expandedSection === 'paciente'}
                yoff={130}
                scrollRef={scrollRef}
                onPress={() => toggleSection('paciente')}
              >

                {/* Paciente */}
                <View style={styles.fieldContainer}>
                  <Text style={[styles.label, { color: theme.text }]}>
                    {t('cirugias.paciente_nombre_title')}
                  </Text>
                  <TextInput
                    style={[styles.input, { backgroundColor: theme.inputBg, borderColor: theme.border, color: theme.text, textTransform: 'uppercase' }]}
                    placeholder={t('cirugias.paciente_nombre')}
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
                    {t('cirugias.paciente_materno_title')}
                  </Text>
                  <TextInput
                    style={[styles.input, { backgroundColor: theme.inputBg, borderColor: theme.border, color: theme.text, textTransform: 'uppercase' }]}
                    placeholder={t('cirugias.paciente_materno')}
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
                    {t('cirugias.paciente_paterno_title')}
                  </Text>
                  <TextInput
                    style={[styles.input, { backgroundColor: theme.inputBg, borderColor: theme.border, color: theme.text, textTransform: 'uppercase' }]}
                    placeholder={t('cirugias.paciente_paterno')}
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
                title={t('cirugias.regitro_pago_title')}
                isOpen={expandedSection === 'registro_pago'}
                yoff={200}
                scrollRef={scrollRef}
                onPress={() => toggleSection('registro_pago')}
              >

                {/* Numero de orden */}
                <View style={styles.fieldContainer}>
                  <Text style={[styles.label, { color: theme.text }]}>
                    {t('cirugias.numero_de_orden_title')}
                  </Text>
                  <TextInput
                    style={[styles.input, { backgroundColor: theme.inputBg, borderColor: theme.border, color: theme.text, textTransform: 'uppercase' }]}
                    placeholder={t('cirugias.numero_de_orden')}
                    placeholderTextColor={theme.textSub}
                    value={numero_ordenpago}
                    onChangeText={setNumero_ordenpago}
                  />
                </View>
                <View style={styles.fieldContainer}>
                  <Text style={[styles.label, { color: theme.text }]}>
                    {t('cirugias.subir_comprobantes')}
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
                title={t('cirugias.materiales')}
                isOpen={(expandedSection === 'materiales') ||(expandedSection?.indexOf('materiales_')==0)}
                yoff={270}
                scrollRef={scrollRef}
                onPress={() => toggleSection('materiales')}
              >
                {Array.isArray(categorias) &&
                  categorias.map((item: iCategoria, index: number) => {
                    if (Array.isArray(item.subcategorias)) {
                      if (item.subcategorias.length == 0) {

                      } else {
                        // Calculamos cuántos seleccionados hay para ESTA categoría
                        const seleccionadosEnEstaCat = Array.isArray(item.subcategorias)
                          ? item.subcategorias.filter(sub => !!selectedSubcats["cat_" + item.id_set_categoria + "/" + sub.id_set_subcategoria]).length
                          : 0;

                        return (

                          <_AccordionSection
                            key={"cat_" + item.id_set_categoria}
                            // Si hay seleccionados, mostramos el número junto al nombre
                            title={seleccionadosEnEstaCat > 0
                              ? `${item.nombre} (${seleccionadosEnEstaCat})`
                              : item.nombre
                            }            
                            isOpen={expandedSection === `materiales_${item.id_set_categoria}`}
                            yoff={270+(index*68)}
                            scrollRef={scrollRef}
                            onPress={() => { toggleSection(`materiales_${item.id_set_categoria}`);}}   
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
                    title={seleccionadosEquipos > 0 ? (t('cirugias.equipospoder') + ' (' + seleccionadosEquipos + ')') : t('cirugias.equipospoder')}
                    isOpen={expandedSection === 'equipospoder'}
                    yoff={340}
                    scrollRef={scrollRef}
                    onPress={() => toggleSection('equipospoder')}
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
                    title={seleccionadosInst > 0 ? (t('cirugias.instrumentales') + ' (' + seleccionadosInst + ')') : t('cirugias.instrumentales')}
                    isOpen={expandedSection === 'instrumentales'}
                    yoff={410}
                    scrollRef={scrollRef}
                    onPress={() => toggleSection('instrumentales')}
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
                    title={seleccionadosCons > 0 ? (t('cirugias.consumibles') + ' (' + seleccionadosCons + ')') : t('cirugias.consumibles')}
                    isOpen={expandedSection === 'consumibles'}
                    yoff={480}
                    scrollRef={scrollRef}
                    onPress={() => toggleSection('consumibles')}
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


              <View style={{ backgroundColor: hexToRGBA(theme.card, 0.8), padding: 10, borderRadius: 8, marginBottom: 40 }}>


                {/* Campo: Solicitar Material Estéril */}
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 10 }}>
                  <Text style={{ color: theme.text, fontSize: 15 }}>{t('cirugias.solicita_material_esteril')}</Text>
                  <Switch
                    value={solicitarEsteril}
                    onValueChange={setSolicitarEsteril}
                    trackColor={{ false: '#767577', true: theme.text }}
                  />
                </View>

                {/* Notas */}
                <_TouchableWithoutFeedback>
                  <View pointerEvents="box-none" style={styles.fieldContainer}>
                    <Text style={[styles.label, { color: theme.text }]}>{t('cirugias.notas_title')}<Text style={styles.required}>*</Text></Text>
                    <TextInput
                      style={[styles.textArea, { backgroundColor: theme.inputBg, borderColor: theme.border, color: theme.text, textTransform: 'uppercase' }]}
                      placeholder={t('cirugias.notas')}
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
                <View style={{
                  height: 1,
                  backgroundColor: theme.border,
                  marginVertical: 10,
                  opacity: 0.5
                }} />
                <View style={styles.fieldContainer}>
                  <Text style={styles.required}>* {t("common.requerido")}</Text>
                </View>
              </View>
            </View>
          </ScrollView>

        </KeyboardAvoidingView>
        <_Footer Show_Almacen={false}>
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
                <MaterialCommunityIcons name="calendar-check" size={24} color="#fff" />
                <Text style={styles.submitButtonText}>PROGRAMAR CIRUGÍA</Text>
              </>
            )}
          </TouchableOpacity>
        </_Footer>




        {/* Picker Modals */}
        {renderPickerModal(
          showHoraPicker,
          () => setShowHoraPicker(false),
          horasData,
          "",
          (item: string) => setHora(item),
          'Seleccionar Hora'
        )}

        {
          renderPickerModal(
            showEstadoPicker,
            () => setShowEstadoPicker(false),
            estados,
            "id_estado",
            (item: iEstado) => setEstado(item),
            'Seleccionar Estado'
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
            showTecnico1Picker,
            () => setShowTecnico1Picker(false),
            tecnicos,
            "id_tecnico",
            (item: iTecnico) => setTecnico1(item),
            'Seleccionar Técnico'
          )}
        {
          renderPickerModal(
            showTecnico2Picker,
            () => setShowTecnico2Picker(false),
            tecnicos,
            "id_tecnico",
            (item: iTecnico) => setTecnico2(item),
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
    marginBottom: Platform.OS === 'ios' ? -15 : -10
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
    borderRadius: 16,
    padding: 0,
    borderWidth: 1,
    marginBottom: 60,
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
    paddingVertical: 5,
    borderRadius: 12,
    marginTop: -5,
    paddingHorizontal: 10
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: 'bold',
    marginLeft: 10,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 1,
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
  }
});
