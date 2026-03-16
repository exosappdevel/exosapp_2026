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
  Image, Switch
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { useRouter } from 'expo-router';
import { useApp } from '../context/AppContext';
import CustomModal from '../components/CustomModal';
import ApiService from '@/services/ApiServices';

// Habilitar animaciones en Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}


const AccordionSection_org = ({ title, children, isOpen, onPress, theme }: any) => (
  <View style={[styles.accordionContainer, { borderColor: theme.border }]}>
    <TouchableOpacity style={styles.accordionHeader} onPress={onPress} activeOpacity={0.7}>
      <Text style={[styles.accordionTitle, { color: theme.text }]}>{title}</Text>
      <MaterialCommunityIcons
        name={isOpen ? 'chevron-up' : 'chevron-down'}
        size={24}
        color={theme.textSub}
      />
    </TouchableOpacity>
    {isOpen && <View style={styles.accordionContent}>{children}</View>}
  </View>
);
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
  id_distribuidor: string;
  distribuidor: string;
}




export default function ProgramaCirugiaScreen() {
  const router = useRouter();
  const { user, theme, t } = useApp();

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

  const [paciente, setPaciente] = useState<iPaciente | null>({ nombre: '', paterno: '', materno: '' });
  const [solicitarEsteril, setSolicitarEsteril] = useState(false);
  const [notas, setNotas] = useState('');

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
        const [resEstados, resHospitales, resVendedores, resTecnicos, resCategorias, resEquipopoder, resInstrumentales, resConsumibles, restSubdistribuidores] = await Promise.all([
          ApiService.get_estados(),
          ApiService.get_hospitales(user.id_almacen),
          ApiService.get_vendedores(user.id_usuario, "Vendedor"),
          ApiService.get_tecnicos(user.id_usuario),
          ApiService.get_set_categorias_subcategorias(),
          ApiService.get_equipos_poder_categoria(),
          ApiService.get_instrumental_categoria(),
          ApiService.get_consumible_categoria(),
          ApiService.get_subdistribuidor()
        ]);

        if (!isMounted) return;

        // Seteamos los datos validando que sean arrays
        setEstados(Array.isArray(resEstados) ? resEstados : []);
        setHospitales(Array.isArray(resHospitales) ? resHospitales : []);
        setVendedores(Array.isArray(resVendedores) ? resVendedores : []);
        setTecnicos(Array.isArray(resTecnicos) ? resTecnicos : []);
        setCategorias(Array.isArray(resCategorias) ? resCategorias : []);
        setEquiposPoder(Array.isArray(resEquipopoder) ? resEquipopoder : []);
        setInstrumentales(Array.isArray(resInstrumentales) ? resInstrumentales : []);
        setConsumibles(Array.isArray(resConsumibles) ? resConsumibles : []);
        setSubdistribuidores(Array.isArray(restSubdistribuidores) ? restSubdistribuidores : []);

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
    setShowDatePicker(false);

    if (event.type === 'set' && selectedDate) {
      setDate(selectedDate);
      // Formateamos la fecha para mostrarla al usuario en formato local
      const formattedDate = selectedDate.toLocaleDateString('es-MX', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
      setFecha(formattedDate);
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
    if (!fecha) return 'Ingrese la fecha de la cirugía';
    if (!hora) return 'Seleccione la hora';
    if (!estado || estado.id_estado === '0') return 'Seleccione el estado';
    if (!ciudad.trim()) return 'Ingrese la ciudad';
    if (!hospital || hospital.id_hospital === '0') return 'Ingrese el hospital';
    if (!medico || medico.id_medico === '0') return 'Ingrese el médico';
    return null;
  };
  const finalizarSeleccion = () => {
    const materialesSeleccionados = Object.keys(selectedSubcats).filter(id => selectedSubcats[id]);
    console.log("IDs a enviar al servidor:", materialesSeleccionados);
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

    // Simulate API call
    setTimeout(() => {
      setSubmitting(false);
      setModal({
        visible: true,
        titulo: 'Cirugía Programada',
        mensaje: 'La cirugía ha sido programada exitosamente.',
        icon: 'check-circle-outline',
        colorIcon: '#48bb78'
      });

      // Reset form
      setFecha('');
      setHora('');
      setEstado(null);
      setCiudad('');
      setHospital(null);
      setMedico(null);
      setSubdistribuidor(null);
      setPaciente({ nombre: '', paterno: '', materno: '' });
      setNotas('');
    }, 1500);
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

  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});

  const toggleSection_uniq = (sectionId: string) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);

    setExpandedSections((prev) => {
      // Si la sección que clickeamos ya está abierta, la cerramos (devolvemos objeto vacío)
      if (prev[sectionId]) {
        return {};
      }
      // Si está cerrada, abrimos SOLO esa (creamos un objeto nuevo solo con esa llave)
      return { [sectionId]: true };
    });
  };
  const toggleSection = (sectionId: string) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);

    setExpandedSections((prev) => ({
      ...prev,
      [sectionId]: !prev[sectionId] // Solo cambia el estado de ESTA sección
    }));
  };
  // Estados para Checkboxes (basados en programa_cirugia.html)
  const [checks, setChecks] = useState({
    ayuno: false,
    consentimiento: false,
    laboratorios: false,
    electro: false,
    valoracion: false
  });


  const toggleCheck = (key: keyof typeof checks) => {
    setChecks(prev => ({ ...prev, [key]: !prev[key] }));
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
      <View style={[styles.header, { backgroundColor: theme.card, borderBottomColor: theme.border }]}>
        <TouchableOpacity onPress={() => router.back()}>
          <MaterialCommunityIcons name="arrow-left" size={28} color={theme.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.text }]}>Programar Cirugía</Text>
        <View style={{ width: 28 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Form Card */}
        <View style={[styles.formCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <View style={styles.formHeader}>
            <MaterialCommunityIcons name="calendar-plus" size={24} color={theme.accent} />
            <Text style={[styles.formTitle, { color: theme.text }]}>{t('cirugias.new_title')}</Text>
          </View>

          {/* SECCIÓN 1: PROGRAMACIÓN */}
          <AccordionSection
            title="Lugar y Fecha"
            isOpen={!!expandedSections['lugar']}
            onPress={() => toggleSection('lugar')}
            theme={theme}
          >

            {/* Fecha */}
            <View style={styles.fieldContainer}>
              <Text style={[styles.label, { color: theme.text }]}>
                Fecha <Text style={styles.required}>*</Text>
              </Text>

              <TouchableOpacity
                style={[styles.selector, { backgroundColor: theme.inputBg, borderColor: theme.border }]}
                onPress={showPicker}
              >
                <Text style={[styles.selectorText, { color: fecha ? theme.text : theme.textSub }]}>
                  {fecha || 'DD/MM/YYYY'}
                </Text>
                <MaterialCommunityIcons name="calendar-outline" size={20} color={theme.textSub} />
              </TouchableOpacity>
              {/* Lógica del Picker según Plataforma */}
              {showDatePicker && (
                <DateTimePicker
                  value={date}
                  mode="date"
                  display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                  onChange={onDateChange}
                  minimumDate={new Date()} // Evita programar cirugías en el pasado
                />
              )}

            </View>

            {/* Hora */}
            <View style={styles.fieldContainer}>
              <Text style={[styles.label, { color: theme.text }]}>
                Hora <Text style={styles.required}>*</Text>
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
                Estado <Text style={styles.required}>*</Text>
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
            <View style={styles.fieldContainer}>
              <Text style={[styles.label, { color: theme.text }]}>
                Ciudad <Text style={styles.required}>*</Text>
              </Text>
              <TextInput
                style={[styles.input, { backgroundColor: theme.inputBg, borderColor: theme.border, color: theme.text }]}
                placeholder="Ej. Guadalajara"
                placeholderTextColor={theme.textSub}
                value={ciudad}
                onChangeText={setCiudad}
              />
            </View>
          </AccordionSection>
          <AccordionSection
            title="Participantes"
            isOpen={!!expandedSections['programacion']}
            onPress={() => toggleSection('programacion')}
            theme={theme}
          >

            {/* Agente */}
            <View style={styles.fieldContainer}>
              <Text style={[styles.label, { color: theme.text }]}>
                Agente <Text style={styles.required}>*</Text>
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
                Técnico <Text style={styles.required}>*</Text>
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
                Técnico 2 <Text style={styles.required}>*</Text>
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
                Subdistribuidor <Text style={styles.required}>*</Text>
              </Text>
              <TouchableOpacity
                style={[styles.selector, { backgroundColor: theme.inputBg, borderColor: theme.border }]}
                onPress={() => setShowSubdistribuidorPicker(true)}
              >
                <Text style={[styles.selectorText, { color: estado ? theme.text : theme.textSub }]}>
                  {subdistribuidor?.id_distribuidor || 'Seleccione subdistribuidor...'}
                </Text>
                <MaterialCommunityIcons name="chevron-down" size={20} color={theme.textSub} />
              </TouchableOpacity>
            </View>

            {/* Hospital */}
            <View style={styles.fieldContainer}>
              <Text style={[styles.label, { color: theme.text }]}>
                Hospital <Text style={styles.required}>*</Text>
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
                Médico <Text style={styles.required}>*</Text>
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
          </AccordionSection>

          {/* SECCIÓN 2: PACIENTE */}
          <AccordionSection
            title={t('cirugias.info_paciente')}
            isOpen={!!expandedSections['paciente']}
            onPress={() => toggleSection('paciente')}
            theme={theme}
          >

            {/* Paciente */}
            <View style={styles.fieldContainer}>
              <Text style={[styles.label, { color: theme.text }]}>
                {t('cirugias.paciente_nombre_title')}
              </Text>
              <TextInput
                style={[styles.input, { backgroundColor: theme.inputBg, borderColor: theme.border, color: theme.text }]}
                placeholder={t('cirugias.paciente_nombre')}
                placeholderTextColor={theme.textSub}
                value={paciente?.nombre}
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
                style={[styles.input, { backgroundColor: theme.inputBg, borderColor: theme.border, color: theme.text }]}
                placeholder={t('cirugias.materno_nombre')}
                placeholderTextColor={theme.textSub}
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
                style={[styles.input, { backgroundColor: theme.inputBg, borderColor: theme.border, color: theme.text }]}
                placeholder={t('cirugias.paciente_paterno')}
                placeholderTextColor={theme.textSub}
                value={paciente?.paterno}
                onChangeText={(text) => {
                  setPaciente(prev => {
                    const dataBase = prev ?? { nombre: '', paterno: '', materno: '' };
                    return { ...dataBase, paterno: text };
                  });
                }}
              />
            </View>
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
            <View style={styles.fieldContainer}>
              <Text style={[styles.label, { color: theme.text }]}>Notas</Text>
              <TextInput
                style={[styles.textArea, { backgroundColor: theme.inputBg, borderColor: theme.border, color: theme.text }]}
                placeholder="Observaciones adicionales..."
                placeholderTextColor={theme.textSub}
                value={notas}
                onChangeText={setNotas}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />
            </View>
          </AccordionSection>

          {/* SECCIÓN 3: materiales */}

          <AccordionSection
            title={t('cirugias.materiales')}
            isOpen={!!expandedSections['materiales']}
            onPress={() => toggleSection('materiales')}
            theme={theme}
          >
            {Array.isArray(categorias) &&
              categorias.map((item: iCategoria) => {
                if (Array.isArray(item.subcategorias)) {
                  if (item.subcategorias.length == 0) {

                  } else {
                    // Calculamos cuántos seleccionados hay para ESTA categoría
                    const seleccionadosEnEstaCat = Array.isArray(item.subcategorias)
                      ? item.subcategorias.filter(sub => !!selectedSubcats["sub_"+sub.id_set_subcategoria]).length
                      : 0;

                    return (

                      <AccordionSection
                        key={item.id_set_categoria}
                        // Si hay seleccionados, mostramos el número junto al nombre
                        title={seleccionadosEnEstaCat > 0
                          ? `${item.nombre} (${seleccionadosEnEstaCat})`
                          : item.nombre
                        }
                        isOpen={!!expandedSections["cat_" + item.id_set_categoria]}
                        onPress={() => toggleSection("cat_" + item.id_set_categoria)}
                        theme={theme}
                      >
                        {Array.isArray(item.subcategorias) &&
                          item.subcategorias.map((sub: iSubCategoria) => {
                            const isSelected = !!selectedSubcats["sub_" + sub.id_set_subcategoria];

                            return (
                              <TouchableOpacity
                                key={sub.id_set_subcategoria}
                                style={styles.checkboxContainer}
                                onPress={(e) => {
                                  e.stopPropagation();
                                  toggleSubcategoria("sub_" + sub.id_set_subcategoria)
                                }
                                }
                                activeOpacity={0.6}
                              >
                                <MaterialCommunityIcons
                                  name={isSelected ? 'checkbox-marked' : 'checkbox-blank-outline'}
                                  size={24}
                                  color={isSelected ? theme.text : theme.textSub}
                                />
                                <Text style={[styles.checkboxLabel, { color: theme.text }]}>
                                  {sub.nombre}
                                </Text>
                              </TouchableOpacity>
                            );
                          })}
                      </AccordionSection>
                    );
                  }
                }
              })}

          </AccordionSection>

          {/* EQUIPOS DE PODER */}
          <AccordionSection
            title={t('cirugias.equipospoder')}
            isOpen={!!expandedSections['equipospoder']}
            onPress={() => toggleSection('equipospoder')}
            theme={theme}
          >
            {Array.isArray(equipospoder) &&
              equipospoder.map((item: iEquipoPoder) => {

                const isSelected = !!selectedSubcats["ep_" + item.id_ep_categoria];

                return (
                  <TouchableOpacity
                    key={item.id_ep_categoria}
                    style={styles.checkboxContainer}
                    onPress={() => toggleSubcategoria("ep_" + item.id_ep_categoria)}
                    activeOpacity={0.6}
                  >
                    <MaterialCommunityIcons
                      name={isSelected ? 'checkbox-marked' : 'checkbox-blank-outline'}
                      size={24}
                      color={isSelected ? theme.text : theme.textSub}
                    />
                    <Text style={[styles.checkboxLabel, { color: theme.text }]}>
                      {item.nombre}
                    </Text>
                  </TouchableOpacity>
                );
              })
            }
          </AccordionSection>

          {/* instrumenal */}
          <AccordionSection
            title={t('cirugias.instrumentales')}
            isOpen={!!expandedSections['instrumentales']}
            onPress={() => toggleSection('instrumentales')}
            theme={theme}
          >
            {Array.isArray(equipospoder) &&
              instrumenales.map((item: iInstrumental) => {

                const isSelected = !!selectedSubcats["ins_" + item.id_instru_categoria];

                return (
                  <TouchableOpacity
                    key={item.id_instru_categoria}
                    style={styles.checkboxContainer}
                    onPress={() => toggleSubcategoria("ins_" + item.id_instru_categoria)}
                    activeOpacity={0.6}
                  >
                    <MaterialCommunityIcons
                      name={isSelected ? 'checkbox-marked' : 'checkbox-blank-outline'}
                      size={24}
                      color={isSelected ? theme.text : theme.textSub}
                    />
                    <Text style={[styles.checkboxLabel, { color: theme.text }]}>
                      {item.nombre}
                    </Text>
                  </TouchableOpacity>
                );
              })
            }
          </AccordionSection>

          {/* CONSUMIBLES */}
          <AccordionSection
            title={t('cirugias.consumibles')}
            isOpen={!!expandedSections['consumibles']}
            onPress={() => toggleSection('consumibles')}
            theme={theme}
          >
            {Array.isArray(equipospoder) &&
              consumibles.map((item: iConsumible) => {

                const isSelected = !!selectedSubcats["ins_" + item.id_consu_categoria];

                return (
                  <TouchableOpacity
                    key={item.id_consu_categoria}
                    style={styles.checkboxContainer}
                    onPress={() => toggleSubcategoria("ins_" + item.id_consu_categoria)}
                    activeOpacity={0.6}
                  >
                    <MaterialCommunityIcons
                      name={isSelected ? 'checkbox-marked' : 'checkbox-blank-outline'}
                      size={24}
                      color={isSelected ? theme.text : theme.textSub}
                    />
                    <Text style={[styles.checkboxLabel, { color: theme.text }]}>
                      {item.nombre}
                    </Text>
                  </TouchableOpacity>
                );
              })
            }
          </AccordionSection>


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
        </View>
      </ScrollView>



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
    padding: 15,
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
    padding: 15, backgroundColor: '#f5f5f5', alignItems: 'center'
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
});
