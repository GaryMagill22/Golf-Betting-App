import { initializeApp } from "firebase/app";
import { initializeAuth, getReactNativePersistence } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getFunctions } from "firebase/functions";
import ReactNativeAsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';


const { manifest } = Constants;

const firebaseConfig = {
  apiKey: manifest?.extra?.firebaseApiKey,
  authDomain: manifest?.extra?.firebaseAuthDomain,
  projectId: manifest?.extra?.firebaseProjectId,
  storageBucket: manifest?.extra?.firebaseStorageBucket,
  messagingSenderId: manifest?.extra?.firebaseMessagingSenderId,
  appId: manifest?.extra?.firebaseAppId,
  functions: {
    host: 'localhost',
    port: 5001,
    region: 'us-central1'
  }
};

// Initialize Firebase
export const FIREBASE_APP = initializeApp(firebaseConfig);
export const FIREBASE_AUTH = initializeAuth(FIREBASE_APP, {
  persistence: getReactNativePersistence(ReactNativeAsyncStorage)
});
export const FIREBASE_DB = getFirestore(FIREBASE_APP);
export const FIREBASE_FUNCTIONS = getFunctions(FIREBASE_APP);
