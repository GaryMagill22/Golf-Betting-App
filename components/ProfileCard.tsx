import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { Avatar, Button, Card, TextInput } from 'react-native-paper';
import { getAuth, updateProfile, User, signOut } from 'firebase/auth';
import { getFirestore, doc, getDoc, updateDoc } from 'firebase/firestore';
import { getFunctions } from 'firebase/functions';
import { useStripe } from '@stripe/stripe-react-native';
import DepositScreen from './DepositScreen';
import { FIREBASE_APP, FIREBASE_DB } from '@/FirebaseConfig';
import { httpsCallable } from 'firebase/functions';
import { FIREBASE_FUNCTIONS } from '../FirebaseConfig';

interface ProfileCardProps {
    user?: User | null;
}

const ProfileCard: React.FC<ProfileCardProps> = ({ user }) => {
    const currentUser = getAuth().currentUser; // Get the logged-in user
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [username, setUsername] = useState(currentUser?.displayName || ''); // Initialize username
    const [handicap, setHandicap] = useState(40); // Initialize handicap
    const [homeCourse, setHomeCourse] = useState(''); // Initialize home course
    const [isEditing, setIsEditing] = useState(false); // State to track edit mode
    const [isLoading, setIsLoading] = useState(false); // State for loading indicator
    const [showDepositScreen, setShowDepositScreen] = useState(false);
    const [walletBalance, setWalletBalance] = useState(0);

    const auth = getAuth();
    const db = getFirestore(FIREBASE_APP); // Initialize Firestore
    const functions = getFunctions(FIREBASE_APP, 'us-central1');




    // useEffect(() => {
    //     const fetchUserData = async () => {
    //         if (auth.currentUser) {
    //             try {
    //                 const getUserData = httpsCallable(FIREBASE_FUNCTIONS, 'getUserData');
    //                 const { data } = await getUserData({}); // Call the function with an empty object
    //                 console.log("User data:", data);
    //                 // Assuming your function returns { userData: { /* user data */ } }
    //                 const userData = (data as { userData: any }).userData;
    //                     setFirstName(userData.firstName || '');
    //                     setLastName(userData.lastName || '');
    //                     setUsername(userData.username || (user ? user.displayName : '') || '');
    //                     setHandicap(userData.handicap || 40);
    //                     setHomeCourse(userData.homeCourse || '');
    //             } catch (error) {
    //                 console.error('Error fetching user data:', error);
    //             }
    //         }
    //     };

    //     fetchUserData();
    // }, [auth.currentUser]);



    // OLD WAY OF USING USEEFFECT WITH OWN FUNCTION
    useEffect(() => {
        const fetchUserData = async () => {
            const currentUser = getAuth().currentUser;
            if (currentUser) {
                try {
                    const userDocRef = doc(FIREBASE_DB, 'users', currentUser.uid);
                    const userDocSnap = await getDoc(userDocRef);
                    console.log("User Data:", currentUser.uid );
                    if (userDocSnap.exists()) {
                        const userData = userDocSnap.data();
                        setFirstName(userData.firstName || '');
                        setLastName(userData.lastName || '');
                        setUsername(userData.username || currentUser.uid || '');
                        setHandicap(userData.handicap || 40);
                        setHomeCourse(userData.homeCourse || '');
                    } else {
                        console.log('No such document!');
                    }
                } catch (error) {
                    console.error('Error fetching user data:', error);
                }
            }
        };

        fetchUserData();
    }, [currentUser]);

    useEffect(() => {
        const fetchWalletBalance = async () => {
            const currentUser = getAuth().currentUser;
            if (currentUser) {
                try {
                    // Fetch the wallet balance from Firestore
                    const walletDocRef = doc(db, 'users', currentUser.uid);
                    const walletDocSnap = await getDoc(walletDocRef);

                    if (walletDocSnap.exists()) {
                        const walletData = walletDocSnap.data();
                        setWalletBalance(walletData.walletBalance || 0); // Accessing walletBalance
                        console.log('Wallet balance fetched successfully!');
                    } else {
                        console.log('No such document!');
                    }
                } catch (error) {
                    console.error('Error fetching wallet balance:', error);
                }
            }
        };
        fetchWalletBalance();
    }, [currentUser]);

    const saveProfile = async () => {
        setIsLoading(true);
        try {
            const currentUser = getAuth().currentUser;
            if (currentUser) {
                // Update the displayName in Firebase Authentication
                await updateProfile(currentUser, { displayName: username });

                // Update profile data in Firestore
                await updateDoc(doc(db, 'users', currentUser.uid), {
                    firstName: firstName,
                    lastName: lastName,
                    username: username,
                    handicap: handicap,
                    homeCourse: homeCourse,
                });

                console.log('Profile updated successfully!');
                setIsEditing(false);
            } else {
                console.error('No current user to update');
            }
        } catch (error) {
            console.error('Error updating profile:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleDepositSuccess = (amount: number) => {
        setWalletBalance(prevBalance => prevBalance + amount);
        setShowDepositScreen(false);
    };

    const handleSignOut = async () => {
        try {
            await signOut(auth);
            console.log('User signed out successfully!');
        } catch (error: any) {
            console.error('Error signing out:', error);
        }
    };

    return (
        <ScrollView>
            <View style={styles.container}>
                <Card style={styles.card}>
                    <Avatar.Image style={styles.AvatarImage} size={80} source={require('../assets/images/avatar-circle.png')} />
                    <Card.Title title={currentUser?.displayName || 'Unknown Username'} titleStyle={styles.cardTitle} />
                    <Text style={styles.profileText}>{currentUser?.email || 'Unknown Email'}</Text>
                    <Text style={styles.profileText}>Handicap: {handicap}</Text>
                    <Card.Content style={styles.cardContent}>
                        {isEditing ? (
                            <ScrollView style={styles.scrollView}>
                                <TextInput label="First Name" value={firstName} onChangeText={setFirstName} />
                                <TextInput label="Last Name" value={lastName} onChangeText={setLastName} />
                                <TextInput label="Username" value={username} onChangeText={setUsername} />
                                <TextInput
                                    label="Handicap"
                                    value={handicap.toString()}
                                    onChangeText={(text) => setHandicap(Number(text))}
                                    keyboardType="numeric"
                                />
                                <TextInput label="Home Course" value={homeCourse} onChangeText={setHomeCourse} />
                            </ScrollView>
                        ) : (
                            <View>
                                <View style={styles.walletContainer}>
                                    <Text style={styles.title}>Wallet Balance: </Text>
                                    <Text style={styles.balance}>${walletBalance}</Text>
                                </View>
                                <View style={styles.fundContainer}>
                                    <Button onPress={() => setShowDepositScreen(true)} style={styles.button} mode="elevated">
                                        Deposit Funds
                                    </Button>
                                    {showDepositScreen && (
                                        <DepositScreen
                                            onClose={() => setShowDepositScreen(false)}
                                            onSuccess={handleDepositSuccess}
                                        />
                                    )}
                                </View>
                            </View>
                        )}
                    </Card.Content>
                    <Card.Actions style={styles.actionContainer}>
                        {isEditing ? (
                            <Button style={styles.editButton} mode="outlined" onPress={saveProfile} disabled={isLoading}>
                                {isLoading ? 'Saving...' : 'Save Profile'}
                            </Button>
                        ) : (
                            <Button style={styles.editButton} mode="outlined" onPress={() => setIsEditing(true)}>
                                Edit Profile
                            </Button>
                        )}
                    </Card.Actions>
                    <Button style={styles.signoutButton} mode="outlined" onPress={handleSignOut}>
                        <Text>Sign Out</Text>
                    </Button>
                </Card>
            </View>
        </ScrollView>
    );
};

export default ProfileCard;


const styles = StyleSheet.create({
    container: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    card: {
        marginVertical: 10,
        height: 600,
        width: 350,
        borderWidth: 1,
        borderColor: '#ccc',
        borderRadius: 15,
        padding: 10,
    },
    AvatarImage: {
        backgroundColor: 'white',
        alignSelf: 'center',
        marginBottom: 20,
        marginTop: 20,
    },
    cardTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 5,
        textAlign: 'center',
    },
    cardContent: {
        alignItems: 'center',
        height: 'auto',
    },
    profileText: {
        textAlign: 'center',
        fontSize: 16,
        paddingBottom: 10,
    },
    scrollView: {
        maxHeight: 1000,
        width: 300,
    },
    walletContainer: {
        flexDirection: 'column',
        gap: 10,
        marginBottom: 10,
        backgroundColor: '#B8B3BA',
        borderRadius: 15,
        padding: 10,
        height: 'auto',
    },
    title: {
        textAlign: 'center',
        fontSize: 16,
        fontWeight: '600',
        fontStyle: 'normal',
    },
    actionContainer: {
        justifyContent: 'center',
        alignItems: 'center',
        flexDirection: 'column',
    },
    fundContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 10,
    },
    button: {
        backgroundColor: '#EEE9F0',
        borderRadius: 10,
    },
    buttonText: {
        color: 'white',
        fontSize: 16,
    },
    balance: {
        textAlign: 'center',
        fontSize: 20,
        fontWeight: 'bold',
    },
    editButton: {
        backgroundColor: '#EEE9F0',
        borderRadius: 15,
    },
    editButtonText: {
        color: 'white',
        fontSize: 16,
    },
    signoutButton: {
        alignSelf: 'center',
        width: 200,
        borderRadius: 15,
        borderWidth: 1,
        marginTop: 50,
    },
    signoutButtonText: {
        color: 'white',
        fontSize: 16,
    },
});