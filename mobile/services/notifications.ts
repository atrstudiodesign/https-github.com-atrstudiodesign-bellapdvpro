import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { db } from './firebase';
import { doc, setDoc } from 'firebase/firestore';

// Configure notification behavior for when the app is in the foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

/**
 * Registers the device for Expo Push Notifications
 * @returns {Promise<string | null>} The push token if successful, null otherwise
 */
export async function registerForPushNotificationsAsync(): Promise<string | null> {
  let token: string | null = null;

  if (Platform.OS === 'web') {
    console.log('Push notifications are not supported on web platform in this standard setup.');
    return null;
  }

  try {
    if (!Constants.isDevice) {
      console.log('Must use a physical device for Push Notifications. Simulators/emulators will not receive push tokens.');
      // Keep going in development to allow flow testing, but return a mock or null
      return null;
    }

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      console.warn('Failed to get push token: permission not granted!');
      return null;
    }

    // Get Project ID from expo-constants config
    const projectId =
      Constants.expoConfig?.extra?.eas?.projectId ??
      Constants.easConfig?.projectId;

    if (!projectId) {
      console.warn('EAS Project ID not found in Expo configuration. Please verify app.json/app.config.js');
    }

    const tokenResponse = await Notifications.getExpoPushTokenAsync({
      projectId,
    });
    
    token = tokenResponse.data;

    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF231F7C',
      });
    }

    return token;
  } catch (error) {
    console.error('Error during push notification registration:', error);
    return null;
  }
}

/**
 * Registers/saves a push token inside Firestore
 * @param {string} token The retrieved Expo push token
 * @param {string | null} userId Optional authenticate user UID linked to this device
 * @param {string} role User role ('dono' | 'profissional' | 'cliente')
 */
export async function saveTokenToFirestore(
  token: string,
  userId: string | null = null,
  role: 'dono' | 'profissional' | 'cliente' = 'cliente'
): Promise<boolean> {
  if (!token) return false;

  try {
    // Sanitize the token to use as a valid Firestore document ID
    // Expo tokens usually look like ExponentPushToken[xxxxxxxxxxxxxxxxxxxxxx]
    // Clean up characters that form invalid path segments, though matches('^[a-zA-Z0-9_\-]+$') is ideal
    // We can use a hash or base64 or encode, or just format simply.
    const cleanTokenId = token.replace(/[^a-zA-Z0-9_-]/g, '_');

    const tokenRef = doc(db, 'push_tokens', cleanTokenId);
    
    await setDoc(tokenRef, {
      token,
      userId: userId || 'anonymous',
      role,
      platform: Platform.OS,
      deviceModel: Device.modelName || 'Unknown Device',
      osVersion: Device.osVersion || 'Unknown OS',
      updatedAt: new Date().toISOString(), // Use string Iso for timestamp to prevent firestore dependency issues on React Native
    }, { merge: true });

    console.log('Successfully registered push token in Firestore:', cleanTokenId);
    return true;
  } catch (error) {
    console.error('Error saving push token to Firestore:', error);
    return false;
  }
}
