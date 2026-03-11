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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useApp } from '../context/AppContext';
import CustomModal from '../components/CustomModal';

// Sample data based on the HTML form
const estadosData = [
  { id: '0', nombre: 'Seleccione...' },
  { id: '6', nombre: 'AGUASCALIENTES' },
  { id: '20', nombre: 'BAJA CALIFORNIA' },
  { id: '16', nombre: 'CDMX' },
  { id: '17', nombre: 'CHIHUAHUA' },
  { id: '5', nombre: 'COLIMA' },
  { id: '7', nombre: 'DURANGO' },
  { id: '8', nombre: 'GUANAJUATO' },
  { id: '1', nombre: 'JALISCO' },
  { id: '4', nombre: 'MEXICO' },
  { id: '2', nombre: 'MICHOACAN' },
  { id: '11', nombre: 'NAYARIT' },
  { id: '10', nombre: 'NUEVO LEON' },
  { id: '19', nombre: 'OAXACA' },
  { id: '12', nombre: 'PUEBLA' },
  { id: '3', nombre: 'QUERETARO' },
  { id: '21', nombre: 'QUINTANA ROO' },
  { id: '22', nombre: 'SAN LUIS POTOSI' },
  { id: '13', nombre: 'SINALOA' },
  { id: '18', nombre: 'SONORA' },
  { id: '14', nombre: 'VERACRUZ' },
  { id: '9', nombre: 'YUCATAN' },
  { id: '15', nombre: 'ZACATECAS' },
];

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

export default function ProgramaCirugiaScreen() {
  const router = useRouter();
  const { user, theme, t } = useApp();
  
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  
  // Form fields
  const [fecha, setFecha] = useState('');
  const [hora, setHora] = useState('');
  const [estado, setEstado] = useState<PickerOption | null>(null);
  const [ciudad, setCiudad] = useState('');
  const [hospital, setHospital] = useState('');
  const [medico, setMedico] = useState('');
  const [paciente, setPaciente] = useState('');
  const [procedimiento, setProcedimiento] = useState('');
  const [notas, setNotas] = useState('');
  
  // Picker modals
  const [showEstadoPicker, setShowEstadoPicker] = useState(false);
  const [showHoraPicker, setShowHoraPicker] = useState(false);
  
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
    if (!estado || estado.id === '0') return 'Seleccione el estado';
    if (!ciudad.trim()) return 'Ingrese la ciudad';
    if (!hospital.trim()) return 'Ingrese el hospital';
    if (!medico.trim()) return 'Ingrese el médico';
    if (!paciente.trim()) return 'Ingrese el paciente';
    if (!procedimiento.trim()) return 'Ingrese el procedimiento';
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
      setHospital('');
      setMedico('');
      setPaciente('');
      setProcedimiento('');
      setNotas('');
    }, 1500);
  };

  const renderPickerModal = (
    visible: boolean,
    onClose: () => void,
    data: PickerOption[] | string[],
    onSelect: (item: any) => void,
    title: string
  ) => (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.pickerOverlay}>
        <View style={[styles.pickerContainer, { backgroundColor: theme.card }]}>
          <View style={[styles.pickerHeader, { borderBottomColor: theme.border }]}>
            <Text style={[styles.pickerTitle, { color: theme.text }]}>{title}</Text>
            <TouchableOpacity onPress={onClose}>
              <MaterialCommunityIcons name="close" size={24} color={theme.text} />
            </TouchableOpacity>
          </View>
          <FlatList
            data={data}
            keyExtractor={(item, index) => typeof item === 'string' ? index.toString() : item.id}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[styles.pickerItem, { borderBottomColor: theme.border }]}
                onPress={() => {
                  onSelect(item);
                  onClose();
                }}
              >
                <Text style={[styles.pickerItemText, { color: theme.text }]}>
                  {typeof item === 'string' ? item : item.nombre}
                </Text>
              </TouchableOpacity>
            )}
          />
        </View>
      </View>
    </Modal>
  );

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
            <Text style={[styles.formTitle, { color: theme.text }]}>Nueva Programación</Text>
          </View>

          {/* Fecha */}
          <View style={styles.fieldContainer}>
            <Text style={[styles.label, { color: theme.text }]}>
              Fecha <Text style={styles.required}>*</Text>
            </Text>
            <TextInput
              style={[styles.input, { backgroundColor: theme.inputBg, borderColor: theme.border, color: theme.text }]}
              placeholder="DD/MM/YYYY"
              placeholderTextColor={theme.textSub}
              value={fecha}
              onChangeText={setFecha}
            />
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

          {/* Hospital */}
          <View style={styles.fieldContainer}>
            <Text style={[styles.label, { color: theme.text }]}>
              Hospital <Text style={styles.required}>*</Text>
            </Text>
            <TextInput
              style={[styles.input, { backgroundColor: theme.inputBg, borderColor: theme.border, color: theme.text }]}
              placeholder="Nombre del hospital"
              placeholderTextColor={theme.textSub}
              value={hospital}
              onChangeText={setHospital}
            />
          </View>

          {/* Médico */}
          <View style={styles.fieldContainer}>
            <Text style={[styles.label, { color: theme.text }]}>
              Médico <Text style={styles.required}>*</Text>
            </Text>
            <TextInput
              style={[styles.input, { backgroundColor: theme.inputBg, borderColor: theme.border, color: theme.text }]}
              placeholder="Nombre del médico"
              placeholderTextColor={theme.textSub}
              value={medico}
              onChangeText={setMedico}
            />
          </View>

          {/* Paciente */}
          <View style={styles.fieldContainer}>
            <Text style={[styles.label, { color: theme.text }]}>
              Paciente <Text style={styles.required}>*</Text>
            </Text>
            <TextInput
              style={[styles.input, { backgroundColor: theme.inputBg, borderColor: theme.border, color: theme.text }]}
              placeholder="Nombre del paciente"
              placeholderTextColor={theme.textSub}
              value={paciente}
              onChangeText={setPaciente}
            />
          </View>

          {/* Procedimiento */}
          <View style={styles.fieldContainer}>
            <Text style={[styles.label, { color: theme.text }]}>
              Procedimiento <Text style={styles.required}>*</Text>
            </Text>
            <TextInput
              style={[styles.input, { backgroundColor: theme.inputBg, borderColor: theme.border, color: theme.text }]}
              placeholder="Tipo de procedimiento"
              placeholderTextColor={theme.textSub}
              value={procedimiento}
              onChangeText={setProcedimiento}
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

      {/* Footer */}
      <View style={[styles.footer, { backgroundColor: theme.card, borderTopColor: theme.border }]}>
        <MaterialCommunityIcons name="warehouse" size={24} color={theme.accent} />
        <Text style={[styles.footerText, { color: theme.text }]}>
          {user.almacen_nombre || user.almacen_codigo || 'Sin almacén'}
        </Text>
      </View>

      {/* Picker Modals */}
      {renderPickerModal(
        showEstadoPicker,
        () => setShowEstadoPicker(false),
        estadosData,
        (item: PickerOption) => setEstado(item),
        'Seleccionar Estado'
      )}

      {renderPickerModal(
        showHoraPicker,
        () => setShowHoraPicker(false),
        horasData,
        (item: string) => setHora(item),
        'Seleccionar Hora'
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
});
