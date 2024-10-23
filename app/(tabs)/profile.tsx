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
    <StripeProvider publishableKey="pk_test_51NpbUBHJaZP62m3KKuApJPp7c67kL8vOpxwCr4ZDVxgDE1c01CpnNqSNbURSEzKnyGTOEtVLOV38NOq3pRDY29Px00WnKFvNsV">
      <ProfileCard user={user} />
    </StripeProvider>
  );
};


export default ProfileScreen;
