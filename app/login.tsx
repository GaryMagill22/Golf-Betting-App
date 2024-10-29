import { View, Text, StyleSheet, KeyboardAvoidingView, Platform, ActivityIndicator, Image, TextInput, TouchableOpacity, Alert } from 'react-native'
import React, { useState } from 'react'
import { useLocalSearchParams } from 'expo-router'
import { defaultStyles } from '../constants/Styles'
import { FIREBASE_AUTH, FIREBASE_APP, FIREBASE_FUNCTIONS, FIREBASE_DB } from '../FirebaseConfig';
import { httpsCallable } from 'firebase/functions'; // Import httpsCallable
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, deleteUser } from 'firebase/auth';
import { useRouter } from 'expo-router';
import { getFirestore, doc, setDoc, updateDoc } from 'firebase/firestore';




const Page = () => {

  const { type } = useLocalSearchParams<{ type: string }>();
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');


  const auth = FIREBASE_AUTH;

  const db = getFirestore();


  const router = useRouter();



  const signIn = async () => {
    setLoading(true);
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      if (user) {
        router.replace('/home');
      }
    } catch (error: any) {
      console.log(error);
      alert('Sign in failed: ' + error.message);
    }
    setLoading(false);
  };

  const signUp = async () => {
    setLoading(true);
    try {
      // First, create the Firebase user
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      console.log("Firebase user created: ", user.uid, user.email);

      if (user) {
        try {
          // Immediately set the user document in Firestore with the Firebase UID
          await setDoc(doc(db, "users", user.uid), {
            email: email,
            firebaseUID: user.uid,
          });

          // Now, create the Stripe customer using the Firebase user's UID
          const createStripeCustomer = httpsCallable(FIREBASE_FUNCTIONS, 'createStripeCustomer');
          const result = await createStripeCustomer({
            email: email,
            firebaseUID: user.uid,
          });

          const data = result.data as { customerId: string };
          console.log("Stripe customer created:", data.customerId);

          // Update the Firestore document with the Stripe customer ID
          await updateDoc(doc(db, "users", user.uid), {
            stripeCustomerId: data.customerId,
          });

          router.replace('/profile');

        } catch (error: any) {
          console.error("Error creating Stripe customer:", error);

          // If Stripe customer creation fails, delete the Firebase user
          try {
            await deleteUser(user);
            console.log("Firebase user deleted successfully.");
          } catch (deleteError: any) {
            console.error("Error deleting Firebase user:", deleteError);
            Alert.alert('Error', 'Failed to cleanup account creation. Please contact support.');
          }

          if (error.code === 'functions/invalid-argument') {
            Alert.alert('Error', 'Invalid data provided for customer creation.');
          } else if (error.code === 'stripe/card-error') {
            Alert.alert('Card Error', error.details.message || 'An error occurred with your card.');
          } else if (error.code === 'firestore/permission-denied') {
            Alert.alert('Permission Error', 'You do not have permission to perform this action.');
          } else {
            Alert.alert('Error', 'Failed to create your account. Please try again later.');
          }
        }
      }

    } catch (error: any) {
      console.error("Error during signup:", error);
      Alert.alert('Signup Error', error.message);
    } finally {
      setLoading(false);
    }
  };


  // const signUp = async () => {
  //   setLoading(true);
  //   try {
  //     // First, create the Firebase user
  //     const userCredential = await createUserWithEmailAndPassword(auth, email, password);
  //     const user = userCredential.user;
  //     console.log("Firebase User created: ", user.uid, user.email);

  //     if (user) {
  //       try {
  //         // Now, create the Stripe customer using the Firebase user's UID
  //         const createStripeCustomer = httpsCallable(FIREBASE_FUNCTIONS, 'createStripeCustomer');
  //         const result = await createStripeCustomer({
  //           email: user.email,
  //           firebaseUID: user.uid,
  //         });

  //         const data = result.data as { customerId: string };
  //         console.log("Stripe customer created:", data.customerId);

  //         // Update the Firestore document with the Stripe customer ID
  //         await setDoc(doc(FIREBASE_DB, "users", user.uid), {
  //           email: email,
  //           firebaseUID: user.uid,
  //           stripeCustomerId: data.customerId,
  //         });

  //         router.replace('/profile');

  //       } catch (error: any) {
  //         console.error("Error creating Stripe customer:", error);

  //         // If Stripe customer creation fails, delete the Firebase user
  //         try {
  //           await deleteUser(user);
  //           console.log("Firebase user deleted successfully.");
  //         } catch (deleteError: any) {
  //           console.error("Error deleting Firebase user:", deleteError);
  //           Alert.alert('Error', 'Failed to cleanup account creation. Please contact support.');
  //         }

  //         if (error.code === 'functions/invalid-argument') {
  //           Alert.alert('Error', 'Invalid data provided for customer creation.');
  //         } else if (error.code === 'stripe/card-error') {
  //           Alert.alert('Card Error', error.details.message || 'An error occurred with your card.');
  //         } else if (error.code === 'firestore/permission-denied') {
  //           Alert.alert('Permission Error', 'You do not have permission to perform this action.');
  //         } else {
  //           Alert.alert('Error', 'Failed to create your account. Please try again later.');
  //         }
  //       }
  //     }

  //   } catch (error: any) {
  //     console.error("Error during signup:", error);
  //     Alert.alert('Signup Error', error.message);
  //   } finally {
  //     setLoading(false);
  //   }
  // };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS == 'ios' ? 'padding' : 'height'}
      style={styles.container}
      keyboardVerticalOffset={1}
    >
      {loading && (
        <View style={defaultStyles.loadingOverlay}>
          <ActivityIndicator size='large' color='#fff' />
        </View>
      )}
      {/* <Image style={styles.logo} source={require('../assets/images/logo-white.png')} /> */}

      <Text style={styles.title}>
        {type === 'login' ? 'Welcome back' : 'Create your account'}
      </Text>

      <View style={{ marginBottom: 20 }}>
        <TextInput
          autoCapitalize='none'
          placeholder='Email'
          style={styles.inputField}
          value={email}
          onChangeText={setEmail}
        />
        <TextInput
          autoCapitalize='none'
          placeholder='Password'
          style={styles.inputField}
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />
      </View>

      {type === 'login' ? (
        <TouchableOpacity onPress={signIn} style={[defaultStyles.btn, styles.btnPrimary]}>
          <Text style={styles.btnPrimaryText}>Login</Text>
        </TouchableOpacity>
      ) : (
        <TouchableOpacity onPress={signUp} style={[defaultStyles.btn, styles.btnPrimary]}>
          <Text style={styles.btnPrimaryText}>Create Account</Text>
        </TouchableOpacity>
      )}

    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  logo: {
    width: 60,
    height: 60,
    alignSelf: 'center',
    marginVertical: 80,
  },
  title: {
    fontSize: 30,
    alignSelf: 'center',
    fontWeight: 'bold',
  },
  inputField: {
    marginVertical: 4,
    height: 50,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 12,
    padding: 10,
    backgroundColor: '#fff',
  },
  btnPrimary: {
    backgroundColor: "#007bff",
    marginVertical: 4,
  },
  btnPrimaryText: {
    color: '#fff',
    fontSize: 16,
  }
})

export default Page;