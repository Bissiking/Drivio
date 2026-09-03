import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.drivio.app",
  appName: "Drivio",
  webDir: "out",
  server: {
    androidScheme: "https",
    // En dev, pointer vers le serveur local Next.js
    // En prod, commenter ces lignes pour charger depuis out/ (fichiers statiques)
    // ou déployer l'app Next.js et pointer vers l'URL de production
    url: "http://192.168.1.63:3000",
    cleartext: true,
    allowNavigation: ["*"],
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      launchAutoHide: true,
      backgroundColor: "#1a1a2e",
      androidScaleType: "CENTER_CROP",
      showSpinner: false,
      android: {
        splashFullScreen: true,
        splashImmersive: true,
        splash: "splash",
      },
    },
    PushNotifications: {
      presentationOptions: ["badge", "sound", "alert", "banner", "list"],
    },
    CapacitorSQLite: {
      iosDatabaseLocation: "Library/CapacitorDatabase",
      iosIsEncryption: false,
      androidIsEncryption: false,
    },
  },
};

export default config;
