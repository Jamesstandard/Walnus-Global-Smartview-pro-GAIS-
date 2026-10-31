import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.walnus.smartview',
  appName: 'Walnus SmartView Pro',
  webDir: 'dist',
  server: {
    androidScheme: 'https'
  }
};

export default config;
