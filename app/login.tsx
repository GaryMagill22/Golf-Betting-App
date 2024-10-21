import { View, Text, StyleSheet, KeyboardAvoidingView, Platform, ActivityIndicator, Image, TextInput, TouchableOpacity, Alert } from 'react-native'
import React, { useState } from 'react'
import { useLocalSearchParams } from 'expo-router'
import { defaultStyles } from '../constants/Styles'
import { FIREBASE_AUTH, FIREBASE_APP, FIREBASE_FUNCTIONS } from '../FirebaseConfig';
import { httpsCallable } from 'firebase/functions'; // Import httpsCallable
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, UserCredential } from 'firebase/auth';
import { router } from 'expo-router';
import { getFirestore, doc, setDoc } from 'firebase/firestore';






const Page = () => {

  const { type } = useLocalSearchParams<{ type: string }>();
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');


  const auth = FIREBASE_AUTH;

  const db = getFirestore(FIREBASE_APP); // Initialize Firestore





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


  // OLD SIGNUP WITHOUT WALLET CREATION
  // const signUp = async () => {
  //   setLoading(true);
  //   try {
  //     const userCredential = await createUserWithEmailAndPassword(auth, email, password);
  //     const
  //       user = userCredential.user;
  //     if (user) {
  //       // Store user data in Firestore
  //       await setDoc(doc(db, "users", user.uid), {
  //         email: email,
  //         // ... other user data will be stored when they edit profile later after signing up.
  //       });
  //       router.replace('/profile');
  //     }
  //   } catch (error: any) {
  //     // ... error handling
  //   }
  //   setLoading(false);
  // };


  const signUp = async () => {
    setLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      if (user) {
        // Store user data in Firestore
        await setDoc(doc(db, "users", user.uid), {
          email: email,
          // ... other user data will be stored when they edit profile later after signing up.
        });

        try {
          const createCustomer = httpsCallable(FIREBASE_FUNCTIONS, 'createCustomer');
          console.log("User UID:", user.uid);
          const result = await createCustomer({
            email: email,
            firebaseUID: user.uid
          }) as { data: { customerId: string } };
          console.log("Stripe customer created:", result.data.customerId);
        } catch (error) {
          console.error("Error creating Stripe customer:", error);
          // Consider adding error handling here, e.g., show an error message to the user
        }

        router.replace('/profile');
      }
    } catch (error: any) {
      // ... error handling for signup ...
    }
    setLoading(false);
  };


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
          <Text style={styles.btnPrimaryText}>Create acount</Text>
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