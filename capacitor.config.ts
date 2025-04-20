import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.jadwalsholat.app',
  appName: 'Jadwal Sholat',
  webDir: 'dist',
  server: {
    androidScheme: 'https'
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 3000,
      launchAutoHide: true,
      backgroundColor: "#ffffff",
      androidSplashResourceName: "splash",
      androidScaleType: "CENTER_CROP",
      showSpinner: true,
      androidSpinnerStyle: "large",
      iosSpinnerStyle: "small",
      spinnerColor: "#999999",
      splashFullScreen: true,
      splashImmersive: true,
      layoutName: "launch_screen",
      useDialog: true,
    },
    Geolocation: {
      enableHighAccuracy: true,
    },
    Haptics: {
      enabled: true,
    },
    StatusBar: {
      overlaysWebView: true,
      style: "light",
      backgroundColor: "#00000000",
      show: true
    }
  },
  android: {
    allowMixedContent: true
  },
  ios: {
    contentInset: "always"
  }
};

export default config;
