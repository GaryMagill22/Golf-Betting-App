import React, { useState, useEffect } from 'react';
import { View, Text, Image, StyleProp, ViewProps, ViewStyle, ScrollView, Alert } from 'react-native';
import { StyleSheet } from 'react-native';
import { Avatar, Button, Card, TextInput } from 'react-native-paper';
import { getAuth, updateProfile, User, signOut } from 'firebase/auth';
import { IconSource } from 'react-native-paper/lib/typescript/components/Icon';
import { ThemeProp } from 'react-native-paper/lib/typescript/types';
import CardTitle from 'react-native-paper/lib/typescript/components/Card/CardTitle';
import { TouchableOpacity } from 'react-native-gesture-handler';
import { getFirestore, doc, getDoc, updateDoc } from 'firebase/firestore'; // Import Firestore functions
import { FIREBASE_APP, FIREBASE_FUNCTIONS, FIREBASE_DB } from '@/FirebaseConfig';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { useStripe } from '@stripe/stripe-react-native';
import { loadStripe } from '@stripe/stripe-js';




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
    const [walletBalance, setWalletBalance] = useState(0);
    const stripePromise = loadStripe("pk_test_51NpbUBHJaZP62m3KKuApJPp7c67kL8vOpxwCr4ZDVxgDE1c01CpnNqSNbURSEzKnyGTOEtVLOV38NOq3pRDY29Px00WnKFvNsV");
    const stripe = useStripe();
    
    // const {initPaymentSheet, presentPaymentSheet} = useStripe();

    const auth = getAuth();
    const db = getFirestore(FIREBASE_APP); // Initialize Firestore

    const FIREBASE_FUNCTIONS = getFunctions(FIREBASE_APP, 'us-central1');

    useEffect(() => {
        const fetchUserData = async () => {
            if (currentUser) {
                try {
                    const userDocRef = doc(db, "users", currentUser.uid);
                    const userDocSnap = await getDoc(userDocRef);

                    if (userDocSnap.exists()) {
                        const
                            userData = userDocSnap.data();
                        setFirstName(userData.firstName
                            || '');
                        setLastName(userData.lastName || '');
                        setUsername(userData.username || currentUser.displayName || '');
                        setHandicap(userData.handicap || 40);
                        setHomeCourse(userData.homeCourse || '');
                    } else {
                        console.log("No such document!");
                    }
                } catch (error) {
                    console.error("Error fetching user data:", error);
                }
            }
        };

        fetchUserData();
    }, [currentUser]);




    useEffect(() => {
        const fetchWalletBalance = async () => {
            if (currentUser) {
                try {
                    // Fetch the wallet balance from Firestore
                    const walletDocRef = doc(db, "users", currentUser.uid);
                    const walletDocSnap = await getDoc(walletDocRef);

                    if (walletDocSnap.exists()) {
                        const walletData = walletDocSnap.data();
                        setWalletBalance(walletData.walletBalance || 0); // Accessing walletBalance
                        console.log('Wallet balance fetched successfully!');
                    } else {
                        console.log("No such document!");
                    }
                } catch (error) {
                    console.error("Error fetching wallet balance:", error);
                }
            }
        };
        fetchWalletBalance();
    }, [currentUser]);

    const handleFundWallet = async () => {
        try {
            console.log("Calling fundWallet function...");
            const fundWallet = httpsCallable(FIREBASE_FUNCTIONS, 'fundWallet');
            const amountToFund = 1000; // Example: $10 (in cents) or get this from user input
            const result = await fundWallet({ amount: amountToFund }) as { data: { sessionId: string } };

            console.log("Result from fundWallet:", result);

            const sessionId = result.data?.sessionId;

            if (sessionId) {
                console.log("Initiating Stripe Checkout...");
                const stripe = await stripePromise;
                if (!stripe) {
                    console.error("Stripe.js has not loaded yet.");
                    Alert.alert('Error', 'Stripe.js has not loaded yet.');
                    return;
                }

                const { error } = await stripe.redirectToCheckout({ sessionId });

                if (error) {
                    console.error("Stripe redirect failed:", error);
                    Alert.alert('Error', 'Failed to redirect to Stripe.');
                }
            } else {
                console.error("No sessionId received");
                Alert.alert('Error', 'Failed to initiate payment.');
            }
        } catch (error) {
            console.error("Error funding wallet:", error);
            Alert.alert('Error', 'Failed to fund wallet.');
        }
    };
    
    




const saveProfile = async () => {
    setIsLoading(true);
    try {
        const currentUser = getAuth().currentUser;
        if (currentUser) {
            // Update the displayName in Firebase Authentication
            await updateProfile(currentUser, { displayName: username });

            //  Update profile data in Firestore
            await updateDoc(doc(db, "users", currentUser.uid), {
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
                <Card.Title title={currentUser?.displayName || 'Unknown Username'} titleStyle={styles.cardTitle}
                />
                <Text style={styles.profileText}>{currentUser?.email || 'Unknown Email'}</Text>
                <Text style={styles.profileText}>Handicap: {handicap}</Text>
                <Card.Content style={styles.cardContent}>
                    {isEditing ? (
                        <ScrollView style={styles.scrollView}>
                            <TextInput
                                label="First Name"
                                value={firstName}
                                onChangeText={setFirstName}
                            // placeholder="First Name"
                            />
                            <TextInput
                                label="Last Name"
                                value={lastName}
                                onChangeText={setLastName}
                            // placeholder="Last Name"
                            />
                            <TextInput
                                label="Username"
                                value={username}
                                onChangeText={setUsername}
                            // placeholder="Username"
                            />
                            <TextInput
                                label="Handicap"
                                value={handicap.toString()}
                                onChangeText={(text) => setHandicap(Number(text))}
                                // placeholder="Enter Handicap"
                                keyboardType="numeric"
                            />
                            <TextInput
                                label="Home Course"
                                value={homeCourse}
                                onChangeText={setHomeCourse}
                            // placeholder="Enter Handicap"
                            />
                        </ScrollView>
                    ) : (
                        <View >
                            <View style={styles.walletContainer}>
                                <Text style={styles.title}>Wallet Balance: </Text>
                                <Text style={styles.balance}>${walletBalance / 100}</Text>
                            </View>
                            <View style={styles.fundContainer} >
                                <Button style={styles.button} mode="elevated" onPress={handleFundWallet} >Deposit Funds</Button>
                                <Button style={styles.button} mode="elevated" >Withdraw Funds</Button>
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

