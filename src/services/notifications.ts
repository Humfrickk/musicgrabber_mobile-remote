import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

const CHANNEL_ID = 'downloads';

export async function ensureNotificationPermissions(): Promise<boolean> {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync(CHANNEL_ID, {
      name: 'Downloads',
      importance: Notifications.AndroidImportance.DEFAULT,
      vibrationPattern: [0, 120, 60, 120],
      lightColor: '#7C6BF0',
    });
  }

  const settings = await Notifications.getPermissionsAsync();
  if (settings.granted || settings.ios?.status === Notifications.IosAuthorizationStatus.PROVISIONAL) {
    return true;
  }

  const requested = await Notifications.requestPermissionsAsync();
  return (
    requested.granted ||
    requested.ios?.status === Notifications.IosAuthorizationStatus.PROVISIONAL
  );
}

export function configureNotificationHandler(): void {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });
}

export async function notifyDownloadComplete(title: string, artist?: string): Promise<void> {
  const body = artist ? `${artist} — ${title}` : title;
  await Notifications.scheduleNotificationAsync({
    content: {
      title: 'Download complete',
      body,
      sound: true,
      data: { type: 'completed' },
    },
    trigger: null,
  });
}

export async function notifyDownloadFailed(title: string, message: string): Promise<void> {
  await Notifications.scheduleNotificationAsync({
    content: {
      title: 'Download failed',
      body: `${title}: ${message}`,
      sound: true,
      data: { type: 'failed' },
    },
    trigger: null,
  });
}
