import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.drivio.app",
  appName: "Drivio",
  webDir: "out",
  server: {
    androidScheme: "https",
    url: "https://drivio.mhemery.fr",
    cleartext: false,
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
