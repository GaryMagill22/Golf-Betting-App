import FontAwesome from '@expo/vector-icons/FontAwesome';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack, useRouter, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useState } from 'react';
import 'react-native-reanimated';

import { useColorScheme } from '@/components/useColorScheme';
import { TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AuthProvider from '@/context/AuthContext';
import { StripeProvider } from '@stripe/stripe-react-native';
import { FIREBASE_AUTH, FIREBASE_APP, FIREBASE_DB } from '@/FirebaseConfig'; // Import your Firebase config
import { onAuthStateChanged, getAuth, User } from 'firebase/auth';



export {
  // Catch any errors thrown by the Layout component.
  ErrorBoundary,
} from 'expo-router';

export const unstable_settings = {
  // Ensure that reloading on `/modal` keeps a back button present.
  initialRouteName: '/(tabs)',
};

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded, error] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
    ...FontAwesome.font,
  });


  // Expo Router uses Error Boundaries to catch errors in the navigation tree.
  useEffect(() => {
    if (error) throw error;
  }, [error]);

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) {
    return null;
  }

  return (
    <AuthProvider>
      <RootLayoutNav />
    </AuthProvider>
  )
}

function RootLayoutNav() {
  const colorScheme = useColorScheme();
  const segments = useSegments(); // Get current route segments
  const [user, setUser] = useState<User | null>(null);
  const [initializing, setInitializing] = useState(true);


  const auth = FIREBASE_AUTH;
  
  const router = useRouter();

  console.log(segments); // Log the route segments


  // console.log(router.currentRoute); // Removed due to non-existent property


  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      if (initializing) {
        setInitializing(false);
      }
    });

    return
    () => unsubscribe(); // Unsubscribe on unmount
  }, []);

  useEffect(() => {
    if (initializing) return; // Don't redirect while initializing

    const inAuthGroup = segments[0] === '(auth)';

    if (user && !inAuthGroup) {
      router.replace(''); // Redirect to authenticated home
    } else if (!user && inAuthGroup) {
      router.replace('/'); // Redirect to root/login
    }
  }, [user, initializing, segments]);

  return (
    <StripeProvider publishableKey="pk_test_51QAvfOLZgHn4BjmwLz4sfVoidoK8lNugRUXxIvKkEc9fa8VuhV3Z7IJqwqtHpAHNvVKC6Erbzq7ZH1PGecSjzkUi00CqulYlUD" merchantIdentifier="" >
      <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
        <Stack>
          <Stack.Screen name="login" options={{ headerShown: false }} />
          <Stack.Screen
            name="modal"
            options={{
              presentation: 'modal',
              title: '',
              headerTitleStyle: {
                fontFamily: 'mon-sb',
              },
              headerLeft: () => (
                <TouchableOpacity onPress={() => router.back()}>
                  <Ionicons name="close-outline" size={28} />
                </TouchableOpacity>
              ),
            }}
          />
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        </Stack>
      </ThemeProvider>
    </StripeProvider>
  );
}
