import { initializeApp } from "firebase/app";
import { initializeAuth, getReactNativePersistence, getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getFunctions } from "firebase/functions";
import { httpsCallable } from "firebase/functions";
import ReactNativeAsyncStorage from '@react-native-async-storage/async-storage';


const firebaseConfig = {
  apiKey: "AIzaSyBlxvlcTeZ4GVywmVbFdn6r1AWySEkgBco",
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
export const FIREBASE_DB = getFirestore(FIREBASE_APP);
export const FIREBASE_FUNCTIONS = getFunctions(FIREBASE_APP, 'us-central1');

export default FIREBASE_APP;




const auth = getAuth();


interface UserData {
  firstName: string;
  lastName: string;
  username: string;
  handicap: number;
  homeCourse: string;
  walletBalance: number;
}

export const fetchUserData = async (): Promise<UserData | undefined> => {
  const getUserData = httpsCallable(FIREBASE_FUNCTIONS, 'getUserData');

  try {
    const result = await getUserData();
    console.log("User data:", result.data);
    return result.data as UserData;
  } catch (error) {
    console.error("Error fetching user data:", error);
    return undefined;
  }
};
