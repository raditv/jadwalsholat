import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.jadwalsholat.app',
  appName: 'JadwalSholat',
  webDir: 'dist',
  server: {
    androidScheme: 'https'
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: "#10B981", // emerald-600
      showSpinner: true,
      androidSpinnerStyle: "large",
      spinnerColor: "#ffffff",
    }
  },
  android: {
    allowMixedContent: true
  },
  ios: {
    contentInset: "always"
  }
}

export default config;
