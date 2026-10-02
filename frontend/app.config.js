// Reemplaza a app.json: necesitamos lógica (variar bundleIdentifier/package/name
// según el build) y eso no se puede expresar en JSON puro.
//
// "production" se deja exactamente igual que antes (com.esdimed.exosapp) para
// que la base instalada actual no cambie de identidad ni pierda sus datos.
// Solo "development" y "preview" (ver eas.json -> build.<profile>.env.APP_VARIANT)
// usan un bundleIdentifier/package distinto, para poder tener las 3 variantes
// instaladas al mismo tiempo en un mismo dispositivo.
const APP_VARIANT = process.env.APP_VARIANT; // "development" | "preview" | undefined (production)
const IS_DEV = APP_VARIANT === 'development';
const IS_PREVIEW = APP_VARIANT === 'preview';

const getUniqueIdentifier = () => {
  if (IS_DEV) return 'com.esdimed.exosapp.dev';
  if (IS_PREVIEW) return 'com.esdimed.exosapp.preview';
  return 'com.esdimed.exosapp';
};

const getAppName = () => {
  if (IS_DEV) return 'ExosApp Dev';
  if (IS_PREVIEW) return 'ExosApp Preview';
  return 'ExosApp';
};

module.exports = {
  expo: {
    name: getAppName(),
    slug: "exosapp",
    version: "26.08.04",
    orientation: "default",
    icon: "./assets/images/favicon.png",
    scheme: "exosapp",
    userInterfaceStyle: "automatic",
    ios: {
      supportsTablet: true,
      newArchEnabled: true,
      bundleIdentifier: getUniqueIdentifier(),
      infoPlist: {
        NSCameraUsageDescription: "Scanea QR y codigo de barras",
        NSLocationWhenInUseUsageDescription: "Trackea localidad del warehouse",
        NSFaceIDUsageDescription: "Usa el faceid para iniciar sesión",
        ITSAppUsesNonExemptEncryption: false
      },
      runtimeVersion: {
        policy: "appVersion"
      }
    },
    android: {
      newArchEnabled: true,
      edgeToEdgeEnabled: true,
      adaptiveIcon: {
        foregroundImage: "./assets/images/adaptive-icon.png",
        backgroundColor: "#051c4a"
      },
      splash: {
        image: "./assets/images/splash.png",
        resizeMode: "cover",
        backgroundColor: "#000000",
        mdpi: "./assets/images/splash.png",
        hdpi: "./assets/images/splash.png",
        xhdpi: "./assets/images/splash.png",
        xxhdpi: "./assets/images/splash.png",
        xxxhdpi: "./assets/images/splash.png",
        dark: {
          image: "./assets/images/splash.png",
          backgroundColor: "#000000"
        }
      },
      package: getUniqueIdentifier(),
      permissions: [
        "android.permission.CAMERA",
        "android.permission.ACCESS_FINE_LOCATION",
        "android.permission.ACCESS_COARSE_LOCATION",
        "android.permission.USE_BIOMETRIC",
        "android.permission.USE_FINGERPRINT",
        "android.permission.RECORD_AUDIO",
        "android.permission.MODIFY_AUDIO_SETTINGS"
      ],
      runtimeVersion: "1.7.30"
    },
    web: {
      bundler: "metro",
      output: "static",
      favicon: "./assets/images/favicon.png"
    },
    plugins: [
      "expo-router",
      [
        "expo-splash-screen",
        {
          image: "./assets/images/splash.png",
          resizeMode: "cover",
          backgroundColor: "#000000"
        }
      ],
      [
        "expo-camera",
        {
          cameraPermission: "Allow ExosApp to scan QR and barcodes"
        }
      ],
      [
        "expo-location",
        {
          locationWhenInUsePermission: "Track warehouse location"
        }
      ],
      [
        "expo-local-authentication",
        {
          faceIDPermission: "Quick and secure login"
        }
      ],
      "expo-secure-store",
      "expo-web-browser",
      "expo-audio",
      "expo-video",
      "expo-font",
      "@react-native-community/datetimepicker",
      "expo-asset",
      "expo-screen-orientation",
      [
        "react-native-share",
        {
          android: []
        }
      ]
    ],
    experiments: {
      typedRoutes: true
    },
    extra: {
      router: {},
      eas: {
        projectId: "ce9627cb-a45b-462f-9c3f-28a12d20d7be"
      }
    },
    owner: "exosapp",
    updates: {
      url: "https://u.expo.dev/ce9627cb-a45b-462f-9c3f-28a12d20d7be"
    }
  }
};
