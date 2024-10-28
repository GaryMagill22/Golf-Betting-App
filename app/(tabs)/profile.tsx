// import { StyleSheet, TextInput, ScrollView } from 'react-native';
import { Text, View } from '@/components/Themed';
import { useState } from 'react';
import ProfileCard  from '@/components/ProfileCard';
// import { Avatar, Card, Button } from 'react-native-paper';
import { getAuth } from 'firebase/auth';
import { StripeProvider } from '@stripe/stripe-react-native';



const ProfileScreen = () => {




  const user = getAuth().currentUser;



  return (
      <ProfileCard user={user} />
  );
};


export default ProfileScreen;
