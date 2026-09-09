import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useApp } from '../context/AppContext';
import ApiService from '../services/ApiServices';
import { _Footer, _Header, _Background, _PickerModal, _PinModal, _footer_baseHeight, hexToRGBA } from '@/components/elidev_components';
import Constants from 'expo-constants';
import * as Updates from 'expo-updates';
import { perfil_modulos_poralmacen } from '@/context/AppmenuItems';


const themeOptions = [
  { id: 'light', color: '#f5f5f5', borderColor: '#e2e8f0' },
  { id: 'dark', color: '#121212', borderColor: '#3d3d3d' },
  /*{ id: 'blue', color: '#e3f2fd', borderColor: '#90caf9' },
  { id: 'pink', color: '#fce4ec', borderColor: '#f8bbd9' },*/
];

interface Almacen {
  id_almacen: string;
  nombre: string;
  codigo: string;
}

export default function ProfileScreen() {
  const router = useRouter();
  const {
    user, setUser, theme, t, language, setLanguage, appConfig, menuFav_str,
    isUpdatePending, applyUpdateAndRestart, otaStatus, otaLastCheckedAt, otaLastError, checkForAppUpdate
  } = useApp();

  const pageConfig = {
    name: t('screens.perfil'),
    icon: "account-circle",
    previous: "",
    show_user: false,
    show_menu: false,
    show_in_recent: false,
    path: '/profile'
  };
  const { width, height } = useWindowDimensions();
  const margin_height = 45;
  const _ClientHeight = height - 130 - margin_height;
  const insets = useSafeAreaInsets();
  // _Footer flota con position:absolute sobre el ScrollView (no le resta
  // espacio al layout en flex), así que sin este padding el último elemento
  // (el botón de "Buscar actualizaciones") queda tapado por el footer y,
  // como el contenido no llega a medir más que el propio ScrollView, ni
  // siquiera se activa el scroll para poder despegarlo de ahí.
  const footerClearance = _footer_baseHeight(false) + insets.bottom + 20;

  const [selectedTheme, setSelectedTheme] = useState(user.tema);
  const [selectedAlmacen, setSelectedAlmacen] = useState<Almacen | null>(null);
  const [almacenes, setAlmacenes] = useState<Almacen[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showAlmacenPicker, setShowAlmacenPicker] = useState(false);
  const [showPinModal, setShowPinModal] = useState(false);
  const [sel_language, setSel_language] = useState(language);
  const [, setModal] = useState({
    visible: false,
    titulo: '',
    mensaje: '',
    icon: 'alert-circle-outline',
    colorIcon: '#f56565'
  });

  const [modulos, setModulos] = useState<any[]>([]);

  const updateInfo = (!Updates.isEnabled || Updates.isEmbeddedLaunch || !Updates.createdAt)
    ? t('profile.updateEmbedded')
    : `${t('profile.updateOta')}: ${Updates.createdAt.toLocaleString()}`;

  const otaStatusIcon: Record<typeof otaStatus, string> = {
    idle: 'help-circle-outline',
    disabled: 'cloud-off-outline',
    checking: 'cloud-sync-outline',
    up_to_date: 'cloud-check-outline',
    update_downloaded: 'cloud-download-outline',
    error: 'cloud-alert',
  };
  const otaStatusColor: Record<typeof otaStatus, string> = {
    idle: theme.textSub,
    disabled: theme.textSub,
    checking: theme.accent,
    up_to_date: '#38a169',
    update_downloaded: '#dd6b20',
    error: '#e53e3e',
  };

  useEffect(() => {
    ApiService.init(appConfig);
    loadAlmacenes();
  }, []);

  const loadAlmacenes = async () => {
    try {
      const response = await ApiService.get_almacenes_list(user.id_usuario);
      if (Array.isArray(response.data)) {
        setAlmacenes(response.data);
        const currentAlmacen = response.data.find((a: Almacen) => a.id_almacen === user.id_almacen);
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

  const handleClose = async () => {
    router.back();
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

      const response = await ApiService.save_profile(updatedUser.id_usuario_app, updatedUser.tema, sel_language, menuFav_str());

      if (response.result === 'ok') {
        setLanguage(sel_language);
        setUser(updatedUser);
        await AsyncStorage.setItem('@exosapp_user', JSON.stringify(updatedUser));

        router.replace('/home');
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
      setSaving(false);
    }
  };

  return (
    <_Background id_almacen={user?.id_almacen}>
      <SafeAreaView style={[styles.container, {}]}>
        <_Header page_info={pageConfig}>

        </_Header>


        {/* Header
        <View style={[styles.header, { backgroundColor: hexToRGBA(theme.card, 0.3), borderBottomColor: theme.border }]}>
          <TouchableOpacity onPress={() => router.back()}>
            <MaterialCommunityIcons name="arrow-left" size={24} color={theme.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: theme.text }]}>{t('screens.perfil')}</Text>
          <View style={{ width: 28 }} />
        </View> */}

        <ScrollView
          style={[styles.content, { maxHeight: _ClientHeight }]}
          contentContainerStyle={{ paddingBottom: footerClearance }}
        >
        {/* User Info */}
        <View style={[styles.section, { backgroundColor: hexToRGBA(theme.card, 0.8), borderColor: theme.border }]}>
          <Text style={[styles.sectionLabel, { color: theme.textSub }]}>{t('profile.user')}</Text>
          <View style={styles.userInfo}>
            <MaterialCommunityIcons name="account-circle" size={30} color={theme.accent} />
            <Text style={[styles.userName, { color: theme.text }]}>{user.alias_usuario}</Text>

          </View>
          <View style={styles.userInfo}>
            <Text style={[styles.userName, { color: theme.text, fontSize: 12, fontWeight: 'normal', paddingLeft: 30 }]}>{user.tipo_usuario}</Text>
          </View>
          <View style={styles.userInfo}>
            <Text style={[styles.userName, { color: theme.accent, fontSize: 12, fontWeight: 'normal', paddingLeft: 30, paddingTop: 10 }]}>Sistema :  {appConfig.backend_server.toUpperCase()}  - {Constants.expoConfig?.version || "1.0.0"}</Text>
          </View>
          <View style={styles.userInfo}>
            <Text style={[styles.userName, { color: theme.text + "70", fontSize: 12, fontWeight: 'normal', paddingLeft: 30 }]}>{updateInfo}</Text>
          </View>
          {/*<View style={styles.userInfo}>
              <Text style={[styles.userName, { color: theme.text + "70", fontSize: 12, fontWeight: 'normal', paddingLeft: 30 }]}>{ modulos}</Text>
            </View>*/}

        </View>

        

        {/* Almacen Selection */}
        <View style={[styles.section, { backgroundColor: hexToRGBA(theme.card, 0.8), borderColor: theme.border }]}>
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
        <View style={[styles.section, { backgroundColor: hexToRGBA(theme.card, 0.8), borderColor: theme.border }]}>
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
        {/* OTA Update Monitor */}
        <View style={[styles.section, { backgroundColor: hexToRGBA(theme.card, 0.8), borderColor: theme.border }]}>
          <Text style={[styles.sectionLabel, { color: theme.textSub }]}>{t('profile.otaSection')}</Text>

          <View style={styles.userInfo}>
            <MaterialCommunityIcons name={otaStatusIcon[otaStatus] as any} size={24} color={otaStatusColor[otaStatus]} />
            <Text style={[styles.userName, { color: otaStatusColor[otaStatus], fontSize: 14 }]}>
              {t(`profile.otaStatus_${otaStatus}`)}
            </Text>
          </View>
          {otaStatus === 'error' && !!otaLastError && (
            <Text style={{ color: '#e53e3e', fontSize: 11, paddingLeft: 30, marginTop: 2 }}>{otaLastError}</Text>
          )}

          <View style={{ paddingLeft: 30, marginTop: 8, gap: 2 }}>
            <Text style={{ color: theme.textSub, fontSize: 12 }}>
              {t('profile.otaChannel')}: {Updates.channel || '-'}
            </Text>
            <Text style={{ color: theme.textSub, fontSize: 12 }}>
              {t('profile.otaRuntimeVersion')}: {Updates.runtimeVersion || '-'}
            </Text>
            <Text style={{ color: theme.textSub, fontSize: 12 }} numberOfLines={1}>
              {t('profile.otaUpdateId')}: {Updates.updateId || '-'}
            </Text>
            <Text style={{ color: theme.textSub, fontSize: 12 }}>
              {t('profile.otaLastCheck')}: {otaLastCheckedAt ? otaLastCheckedAt.toLocaleString() : t('profile.otaNeverChecked')}
            </Text>
          </View>

          {isUpdatePending && (
            <View style={{ marginTop: 12, padding: 10, borderRadius: 12, backgroundColor: '#dd6b2020', borderWidth: 1, borderColor: '#dd6b20' }}>
              <Text style={{ color: '#dd6b20', fontWeight: 'bold', fontSize: 13 }}>{t('profile.otaPendingTitle')}</Text>
              <Text style={{ color: theme.text, fontSize: 12, marginTop: 4 }}>{t('profile.otaPendingMessage')}</Text>
              <TouchableOpacity
                style={[styles.otaButton, { backgroundColor: '#dd6b20', marginTop: 10 }]}
                onPress={applyUpdateAndRestart}
              >
                <Text style={styles.otaButtonText}>{t('common.restartNow')}</Text>
              </TouchableOpacity>
            </View>
          )}

          <TouchableOpacity
            style={[styles.otaButton, { backgroundColor: theme.accent, marginTop: 12 }]}
            onPress={checkForAppUpdate}
            disabled={otaStatus === 'checking'}
          >
            {otaStatus === 'checking' ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Text style={styles.otaButtonText}>{t('profile.otaCheckNow')}</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Language Selection */}
        <View style={[styles.section, { backgroundColor: hexToRGBA(theme.card, 0.8), borderColor: theme.border, display: 'none' }]}>
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
      <_Footer Show_Almacen={false} Show_Usermenu={false}>
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

        <TouchableOpacity
          style={[styles.saveButton, { backgroundColor: theme.accent, marginLeft: 40 }]}
          onPress={handleClose}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.saveButtonText}>{t('common.close')}</Text>
          )}
        </TouchableOpacity>
      </_Footer>

      {/* Almacen Picker Modal */}
      {/*showAlmacenPicker && (
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
        )*/}

      {/*<CustomModal
          visible={modal.visible}
          titulo={modal.titulo}
          mensaje={modal.mensaje}
          icon={modal.icon}
          colorIcon={modal.colorIcon}
          onClose={() => setModal({ ...modal, visible: false })}
        />*/}
      <_PickerModal
        key="picker-almacen"
        visible={showAlmacenPicker}
        onClose={() => setShowAlmacenPicker(false)}
        data={almacenes}
        key_name="id_almacen"
        onSelect={(item: Almacen) => { setSelectedAlmacen(item); setShowAlmacenPicker(false); setModulos(perfil_modulos_poralmacen(item.id_almacen, user.all_modulos)); }}
        title="Seleccionar Almacen"
      />
      <_PinModal
        visible={showPinModal}
        title="Confirma tu PIN"
        message="Introduce tu PIN para guardar los cambios del perfil."
        onCancel={() => setShowPinModal(false)}
        onSuccess={() => {
          setShowPinModal(false);
          handleSave();
        }}
      />
    </SafeAreaView>
    </_Background >

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
    paddingVertical: 5,

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
    borderRadius: 20,
    padding: 10,
    marginBottom: 15,
    borderWidth: 1,
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 12,
    paddingLeft: 8
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
    borderRadius: 20,
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
    borderRadius: 17,
    paddingVertical: 0,
    paddingHorizontal: 10,
    alignItems: 'center',
    marginTop: 5,
    marginBottom: 1,
  },
  saveButtonText: {
    color: "white", fontWeight: "bold", fontSize: 15,
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
    paddingHorizontal: 15,
    paddingVertical: 10
  },
  otaButton: {
    borderRadius: 12,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  otaButtonText: {
    color: "white",
    fontWeight: "bold",
    fontSize: 13,
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