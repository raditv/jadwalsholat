import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.jadwalsholat.app',
  appName: 'Jadwal Sholat',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
    iosScheme: 'https'
  },
  android: {
    backgroundColor: '#00000000',
    allowMixedContent: true,
    captureInput: true,
    webContentsDebuggingEnabled: true
  },
  plugins: {
    StatusBar: {
      overlaysWebView: true,
      style: "light",
      backgroundColor: "#00000000",
      show: true
    }
  }
};

export default config;
