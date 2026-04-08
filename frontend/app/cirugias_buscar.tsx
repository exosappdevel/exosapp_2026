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
import { _Header, _Footer, _Footer_custom, _MenuGrid, _checkBox } from '../components/elidev_components';
import * as DocumentPicker from 'expo-document-picker';
import { Audio } from 'expo-av';
import * as Haptics from 'expo-haptics';

// Habilitar animaciones en Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}


const AccordionSection = ({ title, children, isOpen, onPress, theme }: any) => (
  <View style={[styles.accordionContainer, { borderColor: theme.border }]}>
    {/* Este es el único lugar donde vive el onPress de apertura */}
    <TouchableOpacity
      style={styles.accordionHeader}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <Text style={[styles.accordionTitle, { color: theme.text }]}>{title}</Text>
      <MaterialCommunityIcons
        name={isOpen ? 'chevron-up' : 'chevron-down'}
        size={24}
        color={theme.textSub}
      />
    </TouchableOpacity>

    {/* Aquí el contenido se renderiza de forma independiente */}
    {isOpen && (
      <View style={styles.accordionContent}>
        {children}
      </View>
    )}
  </View>
);



interface PickerOption {
  id: string;
  nombre: string;
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
    name: t("screens.cirugias"),
    icon: "calendar-check",
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
  const [hospital, setHospital] = useState<iHospital | null>(null);
  const [medico, setMedico] = useState<iMedico | null>(null);
  const [vendedor, setVendedor] = useState<iVendedor | null>(null);
  const [tecnico, setTecnico] = useState<iTecnico | null>(null);
  const [subdistribuidor, setSubdistribuidor] = useState<iSubdistribuidor | null>(null);
  const [codigo_cirugia, setCodigo_cirugia] = useState('');
  const [limite, setLimite] = useState("1");


  // listas  
  const [hospitales, setHospitales] = useState<iHospital[]>([]);
  const [vendedores, setVendedores] = useState<iVendedor[]>([]);
  const [tecnicos, setTecnicos] = useState<iTecnico[]>([]);
  const [subdistribuidores, setSubdistribuidores] = useState<iSubdistribuidor[]>([]);
  const [medicos, setMedicos] = useState<iMedico[]>([]);

  const [showHospitalPicker, setShowHospitalPicker] = useState(false);
  const [showMedicoPicker, setShowMedicoPicker] = useState(false);
  const [showVendedorPicker, setShowVendedorPicker] = useState(false);
  const [showTecnicoPicker, setShowTecnicoPicker] = useState(false);
  const [showSubdistribuidorPicker, setShowSubdistribuidorPicker] = useState(false);

  const [date, setDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);


  const scrollRef = React.useRef<ScrollView>(null);

  const [sound, setSound] = useState<Audio.Sound | null>(null);

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
        const [resHospitales, resVendedores, resTecnicos, resSubdistribuidores, resMedicos] = await Promise.all([
          ApiService.get_hospitales(user.id_almacen),
          ApiService.get_vendedores(user.id_usuario, "Vendedor"),
          ApiService.get_tecnicos(user.id_usuario),
          ApiService.get_subdistribuidor(),
          ApiService.get_medicos_list(user.id_usuario)
        ]);

        if (!isMounted) return;

        // Seteamos los datos validando que sean arrays
        setHospitales(Array.isArray(resHospitales) ? resHospitales : []);
        setVendedores(Array.isArray(resVendedores) ? resVendedores : []);
        setTecnicos(Array.isArray(resTecnicos) ? resTecnicos : []);
        setSubdistribuidores(Array.isArray(resSubdistribuidores) ? resSubdistribuidores : []);
        setMedicos(Array.isArray(resMedicos) ? resMedicos : []);
        
        const today=new Date();
        const day = today.getDate().toString().padStart(2, '0');
        const month = (today.getMonth() + 1).toString().padStart(2, '0');
        const year = today.getFullYear();

        const formattedDate = `${day}/${month}/${year}`;
        setFecha_ini(formattedDate);
        setFecha_fin(formattedDate);

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
    onDateChange(event, selectedDate, setFecha_ini)
  }
  const onDateChange = (event: DateTimePickerEvent, selectedDate?: Date, set_target?: any) => {
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
      set_target(formattedDate);
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


  const validateForm = () => {    
    return null;
  };
  async function playSuccessSound() {
    const { sound } = await Audio.Sound.createAsync(
      require('../assets/sounds/success.mp3') // Asegúrate de que la ruta sea correcta
    );
    setSound(sound);
    await sound.playAsync();
  }
  async function playErrorSound() {
    const { sound } = await Audio.Sound.createAsync(
      require('../assets/sounds/success.mp3') // Asegúrate de que la ruta sea correcta
    );
    setSound(sound);
    await sound.playAsync();
  }
  useEffect(() => {
    return sound
      ? () => { sound.unloadAsync(); }
      : undefined;
  }, [sound]);
  const handleSubmit = async () => {
    const error = validateForm();
    if (error) {
      playErrorSound();
      Haptics.notificationAsync(
        Haptics.NotificationFeedbackType.Error
      );

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
      /*const response =
    await ApiService.guarda_cirugia(
      user.id_usuario,
      user.id_almacen,
      "nuevo",
      "0",
      fecha_ini,
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
      stringArchivos);*/

      if (true /* response.result === 'ok'*/) {
        setSubmitting(false);
        playSuccessSound();
        Haptics.notificationAsync(
          Haptics.NotificationFeedbackType.Success
        );
        setModal({
          visible: true,
          titulo: t("cirugias.search_success_title"),
          mensaje: '0 '+t("cirugias.search_success"),
          icon: 'check-circle-outline',
          colorIcon: '#48bb78'
        });
      }
      else {
        playErrorSound();
        Haptics.notificationAsync(
          Haptics.NotificationFeedbackType.Error
        );
        setModal({
          visible: true,
          titulo: t('common.error'),
          mensaje: 'Error',//response.result_text,
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
    data: string[] | PickerOption[] | iVendedor[] | iTecnico[] | iHospital[] | iMedico[] | iSubdistribuidor[],
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

  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({ parametros: true });

  const toggleSection = (sectionId: string, yOffset: number = 0) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    const isOpening = !expandedSections[sectionId];

    setExpandedSections((prev) => {
      // Si la sección que clickeamos ya está abierta, la cerramos (devolvemos objeto vacío)
      if (prev[sectionId]) {
        return {};
      }
      // Si está cerrada, abrimos SOLO esa (creamos un objeto nuevo solo con esa llave)
      return { [sectionId]: true };
    })
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




  // 2. CUANDO TERMINA LA CARGA (Contenedor Principal)
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.bg }]}>
      {/* Header */}
      <_Header page_info={pageConfig} />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 10 : 10} // Ajusta este número según el alto de tu header
      >

        <ScrollView ref={scrollRef} style={styles.content} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled" canCancelContentTouches={true} >
          {/* Form Card */}
          <View style={[styles.formCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <View style={styles.formHeader}>
              <MaterialCommunityIcons name="magnify" size={24} color={theme.accent} />
              <Text style={[styles.formTitle, { color: theme.text }]}>{t('screens.cirugias_buscar')}</Text>
            </View>

            {/* SECCIÓN 1: parametros */}
            <AccordionSection
              title={t('cirugias.parameters_search_title')}
              isOpen={!!expandedSections['parametros']}
              onPress={() => toggleSection('parametros', 10)}
              theme={theme}
            >

              {/* Fecha ini */}
              <View style={styles.fieldContainer}>
                <Text style={[styles.label, { color: theme.text }]}>
                  {t('cirugias.fecha_ini')}
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
                          onDateChange_ini({ type: 'set' } as any, selectedDate);
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
                      <Text style={[styles.selectorText, { color: fecha_ini ? theme.text : theme.textSub }]}>
                        {fecha_ini || 'DD/MM/YYYY'}
                      </Text>
                      <MaterialCommunityIcons name="calendar-outline" size={20} color={theme.textSub} />
                    </TouchableOpacity>

                    {showDatePicker && (
                      <DateTimePicker
                        value={date}
                        mode="date"
                        display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                        onChange={onDateChange_ini}
                        minimumDate={new Date()}
                      />
                    )}
                  </>
                )}

              </View>
              {/* Fecha fin */}
              <View style={styles.fieldContainer}>
                <Text style={[styles.label, { color: theme.text }]}>
                  {t('cirugias.fecha_fin')}
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
                          onDateChange_fin({ type: 'set' } as any, selectedDate);
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
                      <Text style={[styles.selectorText, { color: fecha_fin ? theme.text : theme.textSub }]}>
                        {fecha_fin || 'DD/MM/YYYY'}
                      </Text>
                      <MaterialCommunityIcons name="calendar-outline" size={20} color={theme.textSub} />
                    </TouchableOpacity>

                    {showDatePicker && (
                      <DateTimePicker
                        value={date}
                        mode="date"
                        display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                        onChange={onDateChange_fin}
                        minimumDate={new Date()}
                      />
                    )}
                  </>
                )}

              </View>
              {/* Agente */}
              <View style={styles.fieldContainer}>
                <Text style={[styles.label, { color: theme.text }]}>
                  Agente
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
                  Técnico
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
                  Subdistribuidor
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
                    {t('cirugias.codigo_cirugia')}
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
                    {t('cirugias.limite')}
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
                    <Text style={styles.submitButtonText}>{t('cirugias.search_button')}</Text>
                  </>
                )}
              </TouchableOpacity>

            </AccordionSection>
            <AccordionSection
              title={t('cirugias.resultados_programadas')}
              isOpen={!!expandedSections['programadas']}
              onPress={() => toggleSection('programadas', 150)}              
              theme={theme}              
            >

              {/* resultados */}
              <View style={styles.fieldContainer}>
              </View>
            </AccordionSection>
            <AccordionSection
              title={t('cirugias.resultados_apoyo')}
              isOpen={!!expandedSections['programadas']}
              onPress={() => toggleSection('programadas', 150)}
              theme={theme}
            >

              {/* resultados */}
              <View style={styles.fieldContainer}>
              </View>
            </AccordionSection>
          </View>
        </ScrollView>

      </KeyboardAvoidingView>





      {/* Picker Modals */}

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
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    marginBottom: 20,
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
  }
});
