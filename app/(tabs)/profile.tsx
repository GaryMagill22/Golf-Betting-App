// import { StyleSheet, TextInput, ScrollView } from 'react-native';
import { Text, View } from '@/components/Themed';
import { useState } from 'react';
import ProfileCard  from '@/components/ProfileCard';
// import { Avatar, Card, Button } from 'react-native-paper';
import { getAuth } from 'firebase/auth';



const ProfileScreen = () => {

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [changePassword, setChangePassword] = useState('');
  const [handicap, setHandicap] = useState('');



  const user = getAuth().currentUser;



  return (
    <View>
      <ProfileCard user={user} />
    </View>
  );
};


export default ProfileScreen;
