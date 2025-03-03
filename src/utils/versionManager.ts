import { App } from '@capacitor/app';

export interface AppVersion {
  build: string;  // versionCode
  version: string;  // versionName
}

export const getAppVersion = async (): Promise<AppVersion> => {
  const info = await App.getInfo();
  return {
    build: info.build,
    version: info.version
  };
};

export const checkForUpdates = async () => {
  // You can implement your own version checking logic here
  // For example, checking against an API endpoint
  const currentVersion = await getAppVersion();
  // Compare with your backend version info
  return {
    hasUpdate: false,
    latestVersion: currentVersion.version
  };
}; 