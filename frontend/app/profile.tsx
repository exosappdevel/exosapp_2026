import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  Linking,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useApp } from '../context/AppContext';
import ApiService from '../services/ApiServices';
import CustomModal from '../components/CustomModal';
import { _Footer_custom } from '@/components/elidev_components';

const CODE_ZIP_URL = 'https://exos-credential-qr.preview.emergentagent.com/assets/code.zip';

const themeOptions = [
  { id: 'light', color: '#f5f5f5', borderColor: '#e2e8f0' },
  { id: 'dark', color: '#121212', borderColor: '#3d3d3d' },
  { id: 'blue', color: '#e3f2fd', borderColor: '#90caf9' },
  { id: 'pink', color: '#fce4ec', borderColor: '#f8bbd9' },
];

interface Almacen {
  id_almacen: string;
  nombre: string;
  codigo: string;
}

export default function ProfileScreen() {
  const router = useRouter();
  const { user, setUser, theme, t, language, setLanguage, appConfig, menuFav_str } = useApp();

  const [selectedTheme, setSelectedTheme] = useState(user.tema);
  const [selectedAlmacen, setSelectedAlmacen] = useState<Almacen | null>(null);
  const [almacenes, setAlmacenes] = useState<Almacen[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showAlmacenPicker, setShowAlmacenPicker] = useState(false);
  const [sel_language, setSel_language] = useState(language);
  const [modal, setModal] = useState({
    visible: false,
    titulo: '',
    mensaje: '',
    icon: 'alert-circle-outline',
    colorIcon: '#f56565'
  });

  useEffect(() => {
    ApiService.init(appConfig);
    loadAlmacenes();
  }, []);

  const loadAlmacenes = async () => {
    try {
      const response = await ApiService.get_almacenes_list(user.id_usuario);
      if (Array.isArray(response)) {
        setAlmacenes(response);
        const currentAlmacen = response.find((a: Almacen) => a.id_almacen === user.id_almacen);
        if (currentAlmacen) {
          setSelectedAlmacen(currentAlmacen);
        }
      }
    } catch (e) {
      console.log('Error loading almacenes:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {      
      const updatedUser = {
        ...user,
        tema: selectedTheme as 'light' | 'dark' | 'blue' | 'pink',
        id_almacen: selectedAlmacen?.id_almacen || user.id_almacen,
        almacen_nombre: selectedAlmacen?.nombre || user.almacen_nombre,
        almacen_codigo: selectedAlmacen?.codigo || user.almacen_codigo,
      };

      const response = await ApiService.save_profile(updatedUser.id_usuario_app, updatedUser.tema, sel_language, menuFav_str() );

      if (response.result === 'ok') {
        setLanguage(sel_language);
        setUser(updatedUser);
        await AsyncStorage.setItem('@exosapp_user', JSON.stringify(updatedUser));

        router.replace('/home');
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
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.bg }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: theme.card, borderBottomColor: theme.border }]}>
        <TouchableOpacity onPress={() => router.back()}>
          <MaterialCommunityIcons name="arrow-left" size={28} color={theme.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.text }]}>{t('screens.perfil')}</Text>
        <View style={{ width: 28 }} />
      </View>

      <ScrollView style={styles.content}>
        {/* User Info */}
        <View style={[styles.section, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <Text style={[styles.sectionLabel, { color: theme.textSub }]}>{t('profile.user')}</Text>
          <View style={styles.userInfo}>
            <MaterialCommunityIcons name="account-circle" size={50} color={theme.accent} />
            <Text style={[styles.userName, { color: theme.text }]}>{user.alias_usuario}</Text>
          </View>
        </View>

        {/* Almacen Selection */}
        <View style={[styles.section, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <Text style={[styles.sectionLabel, { color: theme.textSub }]}>{t('profile.warehouse')}</Text>
          {loading ? (
            <ActivityIndicator color={theme.accent} />
          ) : (
            <TouchableOpacity
              style={[styles.almacenSelector, { backgroundColor: theme.inputBg, borderColor: theme.border }]}
              onPress={() => setShowAlmacenPicker(true)}
            >
              <MaterialCommunityIcons name="warehouse" size={24} color={theme.accent} />
              <Text style={[styles.almacenText, { color: theme.text }]} numberOfLines={1}>
                {selectedAlmacen?.nombre || user.almacen_nombre || 'Seleccionar almacén'}
              </Text>
              <MaterialCommunityIcons name="chevron-down" size={24} color={theme.textSub} />
            </TouchableOpacity>
          )}
        </View>

        {/* Theme Selection */}
        <View style={[styles.section, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <Text style={[styles.sectionLabel, { color: theme.textSub }]}>{t('profile.theme')}</Text>
          <View style={styles.themeGrid}>
            {themeOptions.map((themeOpt) => (
              <TouchableOpacity
                key={themeOpt.id}
                style={[
                  styles.themeOption,
                  { backgroundColor: themeOpt.color, borderColor: themeOpt.borderColor },
                  selectedTheme === themeOpt.id && styles.themeSelected
                ]}
                onPress={() => setSelectedTheme(themeOpt.id as any)}
              >
                {selectedTheme === themeOpt.id && (
                  <MaterialCommunityIcons name="check" size={24} color={themeOpt.id === 'dark' ? '#fff' : '#333'} />
                )}
                <Text style={[
                  styles.themeLabel,
                  { color: themeOpt.id === 'dark' ? '#fff' : '#333' }
                ]}>
                  {t(`profile.themes.${themeOpt.id}`)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Language Selection */}
        <View style={[styles.section, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <Text style={[styles.sectionLabel, { color: theme.textSub }]}>{t('profile.language')}</Text>
          <View style={styles.languageRow}>
            <TouchableOpacity
              style={[
                styles.languageOption,
                { borderColor: sel_language === 'es' ? theme.accent : theme.border },
                sel_language === 'es' && { backgroundColor: theme.accent + '20' }
              ]}
              onPress={() => setSel_language('es')}
            >
              <Text style={[styles.languageText, { color: sel_language === 'es' ? theme.accent : theme.text }]}>
                {t("languages.es")}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.languageOption,
                { borderColor: sel_language === 'en' ? theme.accent : theme.border },
                sel_language === 'en' && { backgroundColor: theme.accent + '20' }
              ]}
              onPress={() => setSel_language('en')}
            >
              <Text style={[styles.languageText, { color: language === 'en' ? theme.accent : theme.text }]}>
                {t("languages.en")}
              </Text>
            </TouchableOpacity>
          </View>
        </View>



        {/* Save Button */}


        

      </ScrollView>
      <_Footer_custom>
          <TouchableOpacity
            style={[styles.saveButton, { backgroundColor: theme.accent }]}
            onPress={handleSave}
            disabled={saving}
          >
            {saving ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.saveButtonText}>{t('common.save')}</Text>
            )}
          </TouchableOpacity>
        </_Footer_custom>

      {/* Almacen Picker Modal */}
      {showAlmacenPicker && (
        <View style={styles.pickerOverlay}>
          <View style={[styles.pickerContainer, { backgroundColor: theme.card }]}>
            <View style={styles.pickerHeader}>
              <Text style={[styles.pickerTitle, { color: theme.text }]}>{t('profile.warehouse')}</Text>
              <TouchableOpacity onPress={() => setShowAlmacenPicker(false)}>
                <MaterialCommunityIcons name="close" size={24} color={theme.text} />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.pickerList}>
              {almacenes.map((almacen) => (
                <TouchableOpacity
                  key={almacen.id_almacen}
                  style={[
                    styles.pickerItem,
                    { borderBottomColor: theme.border },
                    selectedAlmacen?.id_almacen === almacen.id_almacen && { backgroundColor: theme.accent + '20' }
                  ]}
                  onPress={() => {
                    setSelectedAlmacen(almacen);
                    setShowAlmacenPicker(false);
                  }}
                >
                  <Text style={[styles.pickerItemText, { color: theme.text }]}>{almacen.nombre}</Text>
                  <Text style={[styles.pickerItemCode, { color: theme.textSub }]}>{almacen.codigo}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
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
  section: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 15,
    borderWidth: 1,
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 12,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  userName: {
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 12,
  },
  themeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  themeOption: {
    width: '48%',
    height: 50,
    borderRadius: 12,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  themeSelected: {
    borderWidth: 3,
    borderColor: '#3182ce',
  },
  themeLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 1,
  },
  languageRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  languageOption: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 2,
    alignItems: 'center',
    marginHorizontal: 5,
  },
  languageText: {
    fontSize: 14,
    fontWeight: '600',
  },
  almacenSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderRadius: 12,
    borderWidth: 1,
  },
  almacenText: {
    flex: 1,
    marginLeft: 10,
    fontSize: 14,
  },
  saveButton: {
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 15,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    paddingVertical: 1,
    paddingHorizontal: 20
  },
  codeButton: {
    flexDirection: 'row',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 30,
    borderWidth: 1,
  },
  codeButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 10,
  },
  pickerOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  pickerContainer: {
    width: '90%',
    maxHeight: '70%',
    borderRadius: 16,
    overflow: 'hidden',
  },
  pickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  pickerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  pickerList: {
    maxHeight: 400,
  },
  pickerItem: {
    padding: 15,
    borderBottomWidth: 1,
  },
  pickerItemText: {
    fontSize: 14,
    fontWeight: '500',
  },
  pickerItemCode: {
    fontSize: 12,
    marginTop: 4,
  },
});