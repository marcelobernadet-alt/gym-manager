import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.gymmanager.app',
  appName: 'Gym Manager',
  webDir: 'dist',
  server: {
    androidScheme: 'https'
  }
};

export default config;
