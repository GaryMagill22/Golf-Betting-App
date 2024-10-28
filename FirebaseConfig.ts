import { initializeApp } from "firebase/app";
import { initializeAuth, getReactNativePersistence } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getFunctions } from "firebase/functions";
import ReactNativeAsyncStorage from '@react-native-async-storage/async-storage';

const firebaseConfig = {
  apiKey: "AIzaSyAHRiKr-Q1rd9mVj9c7wtwo7zlvQZNREao",
  authDomain: "reactnativegolfapp.firebaseapp.com",
  projectId: "reactnativegolfapp",
  storageBucket: "reactnativegolfapp.appspot.com",
  messagingSenderId: "466683770848",
  appId: "1:466683770848:web:91cc0133b6286202235d85"
};

// Initialize Firebase
export const FIREBASE_APP = initializeApp(firebaseConfig);
export const FIREBASE_AUTH = initializeAuth(FIREBASE_APP, {
  persistence: getReactNativePersistence(ReactNativeAsyncStorage)
});
export const FIREBASE_FUNCTIONS = getFunctions(FIREBASE_APP);

// Export a function to get the Firestore instance
export const getFirestoreInstance = () => {
  return getFirestore(FIREBASE_APP);
};
