import { useEffect, useRef } from "react";
import { Stack } from "expo-router";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "../services/firebase";
import { useAuthStore } from "../store/useAuthStore";
import { registerForPushNotificationsAsync, saveTokenToFirestore } from "../services/notifications";
import * as Notifications from "expo-notifications";

const queryClient = new QueryClient();

export default function Layout() {
  const notificationListener = useRef<any>();
  const responseListener = useRef<any>();

  useEffect(() => {
    // Register active push token on start or whenever authentication state changes
    const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
      const currentRole = useAuthStore.getState().role;
      try {
        const token = await registerForPushNotificationsAsync();
        if (token) {
          await saveTokenToFirestore(token, user?.uid || null, currentRole);
        }
      } catch (err) {
        console.error("Failed to register and save push token:", err);
      }
    });

    // Handle received notification in foreground
    notificationListener.current = Notifications.addNotificationReceivedListener(notification => {
      console.log("Foreground push notification received:", notification);
    });

    // Handle interaction (taps) on notifications
    responseListener.current = Notifications.addNotificationResponseReceivedListener(response => {
      console.log("Push notification tapped or dismissed:", response);
    });

    return () => {
      unsubscribeAuth();
      if (notificationListener.current) {
        Notifications.removeNotificationSubscription(notificationListener.current);
      }
      if (responseListener.current) {
        Notifications.removeNotificationSubscription(responseListener.current);
      }
    };
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      </Stack>
    </QueryClientProvider>
  );
}
