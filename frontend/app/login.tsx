import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Switch,
} from 'react-native';
import { Image } from 'react-native'; 
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as LocalAuthentication from 'expo-local-authentication';
import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useApp } from '../context/AppContext';
import ApiService from '../services/ApiServices';
import CustomModal from '../components/CustomModal';

export default function LoginScreen() {
  const ImageCustom = Image as any;
  const router = useRouter();
  const { appConfig, setUser, theme, t, setIsLoggedIn, menuFav_str, menuFav_set} = useApp();
  
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [enableFaceId, setEnableFaceId] = useState(false);
  const [hasBiometrics, setHasBiometrics] = useState(false);
  const [hasStoredCredentials, setHasStoredCredentials] = useState(false);
  
  const [modal, setModal] = useState({
    visible: false,
    titulo: '',
    mensaje: '',
    icon: 'alert-circle-outline',
    colorIcon: '#f56565'
  });

  useEffect(() => {
    ApiService.init(appConfig);
    checkBiometrics();
    loadStoredCredentials();
  }, []);

  const checkBiometrics = async () => {
    try {
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      const isEnrolled = await LocalAuthentication.isEnrolledAsync();
      setHasBiometrics(hasHardware && isEnrolled);
    } catch (e) {
      console.log('Error checking biometrics:', e);
    }
  };

  const loadStoredCredentials = async () => {
    try {
      if (Platform.OS === 'web') {
        const storedUser = await AsyncStorage.getItem('@exosapp_credentials_user');
        const storedPass = await AsyncStorage.getItem('@exosapp_credentials_pass');
        if (storedUser && storedPass) {
          setHasStoredCredentials(true);
          setEnableFaceId(true);
        }
      } else {
        const storedUser = await SecureStore.getItemAsync('exosapp_username');
        const storedPass = await SecureStore.getItemAsync('exosapp_password');
        if (storedUser && storedPass) {
          setHasStoredCredentials(true);
          setEnableFaceId(true);
        }
      }
    } catch (e) {
      console.log('Error loading stored credentials:', e);
    }
  };

  const authenticateWithBiometrics = async () => {
    try {
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: t('login.faceid_title'),
        fallbackLabel: t('login.usePassword'),
      });

      if (result.success) {
        let storedUser, storedPass;
        if (Platform.OS === 'web') {
          storedUser = await AsyncStorage.getItem('@exosapp_credentials_user');
          storedPass = await AsyncStorage.getItem('@exosapp_credentials_pass');
        } else {
          storedUser = await SecureStore.getItemAsync('exosapp_username');
          storedPass = await SecureStore.getItemAsync('exosapp_password');
        }
        
        if (storedUser && storedPass) {
          setUsername(storedUser);
          setPassword(storedPass);
          handleLogin(storedUser, storedPass);
        }
      }
    } catch (e) {
      console.log('Biometric auth error:', e);
      setModal({
        visible: true,
        titulo: t('common.error'),
        mensaje: t('login.faceidError'),
        icon: 'face-recognition',
        colorIcon: '#f56565'
      });
    }
  };

  const saveCredentials = async (user: string, pass: string) => {
    try {
      if (Platform.OS === 'web') {
        await AsyncStorage.setItem('@exosapp_credentials_user', user);
        await AsyncStorage.setItem('@exosapp_credentials_pass', pass);
      } else {
        await SecureStore.setItemAsync('exosapp_username', user);
        await SecureStore.setItemAsync('exosapp_password', pass);
      }
    } catch (e) {
      console.log('Error saving credentials:', e);
    }
  };

  const handleLogin = async (user?: string, pass?: string) => {
    const loginUser = user || username;
    const loginPass = pass || password;
    
    if (!loginUser || !loginPass) {
      setModal({
        visible: true,
        titulo: t('common.error'),
        mensaje: t("login.credentials_missing"),
        icon: 'alert-circle-outline',
        colorIcon: '#f56565'
      });
      return;
    }

    setLoading(true);
    try {
      const response = await ApiService.inicia_sesion(loginUser, loginPass);
      
      if (response.result === 'ok') {
        const userData = {
          id_usuario_app: response.id_usuario_app || '',
          id_usuario: response.id_usuario || '',
          id_almacen: response.id_almacen || '',
          almacen_nombre: response.almacen_nombre || '',
          almacen_codigo: response.almacen_codigo || '',
          alias_usuario: response.alias_usuario.toUpperCase() || '',
          tema: (response.tema as 'light' | 'dark' | 'blue' | 'pink') || 'light'   ,
          menu_favorites : []       
        };        
        setUser(userData);        
        menuFav_set(response.menu_favorites);
        setIsLoggedIn(true);
        
        // Save user to AsyncStorage
        await AsyncStorage.setItem('@exosapp_user', JSON.stringify(userData));
        
        // Save credentials if FaceID is enabled
        if (enableFaceId) {
          await saveCredentials(loginUser, loginPass);
        }
        
        router.replace('/home');
      } else {
        setModal({
          visible: true,
          titulo: t('common.error'),
          mensaje: response.result_text || t("login.authenticationError"),
          icon: 'alert-circle-outline',
          colorIcon: '#f56565'
        });
      }
    } catch (e) {
      setModal({
        visible: true,
        titulo: t('common.error'),
        mensaje: t('login.connectionError') + e,
        icon: 'wifi-off',
        colorIcon: '#f56565'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.bg }]}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.logoContainer}>
            {/*<MaterialCommunityIcons 
              name="cube-scan" 
              size={80} 
              color={theme.accent} 
            />*/}
            <ImageCustom
                source={require("../assets/images/logo_login.png")}
                style={styles.logo}
                resizeMode="contain"
              />
            <Text style={[styles.appName]}>{t("app.name")}</Text>
          </View>

          <View style={[styles.formContainer, { backgroundColor: theme.card, borderColor: theme.border }]}>                      
            <View style={[styles.inputContainer, { backgroundColor: theme.inputBg, borderColor: theme.border }]}>
              <MaterialCommunityIcons name="account" size={24} color={theme.textSub} />
              <TextInput
                style={[styles.input, { color: theme.text }]}
                placeholder={t('login.username')}
                placeholderTextColor={theme.textSub}
                value={username}
                onChangeText={setUsername}
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>

            <View style={[styles.inputContainer, { backgroundColor: theme.inputBg, borderColor: theme.border }]}>
              <MaterialCommunityIcons name="lock" size={24} color={theme.textSub} />
              <TextInput
                style={[styles.input, { color: theme.text }]}
                placeholder={t('login.password')}
                placeholderTextColor={theme.textSub}
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
              />
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                <MaterialCommunityIcons 
                  name={showPassword ? "eye-off" : "eye"} 
                  size={24} 
                  color={theme.textSub} 
                />
              </TouchableOpacity>
            </View>

            {hasBiometrics && (
              <View style={styles.faceIdContainer}>
                <View style={styles.faceIdRow}>
                  <MaterialCommunityIcons name="face-recognition" size={24} color={theme.textSub} />
                  <Text style={[styles.faceIdText, { color: theme.text }]}>
                    {t('login.enableFaceId')}
                  </Text>
                </View>
                <Switch
                  value={enableFaceId}
                  onValueChange={setEnableFaceId}
                  trackColor={{ false: theme.border, true: theme.accent }}
                  thumbColor={enableFaceId ? '#fff' : '#f4f3f4'}
                />
                
              </View>
            )}

            <TouchableOpacity 
              style={[styles.loginButton, { backgroundColor: theme.accent }]}
              onPress={() => handleLogin()}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.loginButtonText}>{t('login.submit')}</Text>
              )}
            </TouchableOpacity>

            {hasBiometrics && hasStoredCredentials && (
              <TouchableOpacity 
                style={[styles.faceIdButton, { borderColor: theme.accent }]}
                onPress={authenticateWithBiometrics}
              >
                <MaterialCommunityIcons name="face-recognition" size={28} color={theme.accent} />
                <Text style={[styles.faceIdButtonText, { color: theme.accent }]}>
                  {t('login.useFaceId')}
                </Text>
              </TouchableOpacity>
            )}
            
          </View>
          <Text style={styles.versionText} >
              Versión de la App: 2026.0310.21
            </Text>

          <ImageCustom
            source={require("../assets/images/logo_Elidev.png")}
            style={styles.logo_elidev}
            resizeMode="contain"
          />

        </ScrollView>
      </KeyboardAvoidingView>

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
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20,
    backgroundColor:"#003857" 
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 30,
  },
  appName: {
    fontSize: 28,
    fontWeight: 'bold',
    marginTop: 10,
    color:"white"
  },
  formContainer: {
    borderRadius: 20,
    padding: 25,
    borderWidth: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 25,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    paddingHorizontal: 15,
    marginBottom: 15,
    borderWidth: 1,
    height: 55,
  },
  input: {
    flex: 1,
    marginLeft: 10,
    fontSize: 16,
    borderWidth: 0,
    outlineStyle: 'solid',
    outlineWidth: 0,
  },
  faceIdContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingHorizontal: 5,
  },
  faceIdRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  faceIdText: {
    marginLeft: 10,
    fontSize: 14,
  },
  loginButton: {
    borderRadius: 12,
    paddingVertical: 15,
    alignItems: 'center',
    marginTop: 10,
  },
  loginButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  faceIdButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
    paddingVertical: 15,
    borderRadius: 12,
    borderWidth: 2,
  },
  faceIdButtonText: {
    marginLeft: 10,
    fontSize: 16,
    fontWeight: 'bold',
  },
  logo: {
    width: "100%",       // Ocupa todo el ancho disponible del padre
    maxWidth: 400,      // Pero no se pasa del máximo que tiene el form
    height: 120,        // Ajusta la altura a tu gusto
    marginBottom: 30,
    borderRadius: 8,
    //backgroundColor: "#ececec", // Fondo blanco para el logo
    alignSelf: "center", // Se asegura de estar centrado si el padre es más ancho
  },
  logo_elidev: {
    width: "50%",       // Ocupa todo el ancho disponible del padre
    maxWidth: 200,      // Pero no se pasa del máximo que tiene el form
    height: 60,        // Ajusta la altura a tu gusto
    marginBottom: 0,
    marginTop: 20,
    //marginLeft:200,
    borderRadius: 8,
    //backgroundColor: "#ececec", // Fondo blanco para el logo
    alignSelf: "center", // Se asegura de estar centrado si el padre es más ancho
  },
  versionText: {
    color: "gray",
    textAlign: "center",
    marginTop: 30,
    fontSize: 12,
  },
});