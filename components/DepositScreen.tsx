import React, { useState, useEffect } from 'react';
import { Alert, View, Button, TextInput, StyleSheet } from 'react-native';
import { useStripe } from '@stripe/stripe-react-native';
import { httpsCallable } from 'firebase/functions';
import { FIREBASE_FUNCTIONS } from '../FirebaseConfig';
import { getAuth, onAuthStateChanged, User } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { FIREBASE_DB } from '../FirebaseConfig';

interface DepositScreenProps {
    onClose: () => void;
    onSuccess: (amount: number) => void;
}

const DepositScreen: React.FC<DepositScreenProps> = ({ onClose, onSuccess }) => {
    const { initPaymentSheet, presentPaymentSheet } = useStripe();
    const [amount, setAmount] = useState('');
    const [loading, setLoading] = useState(false);
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [userData, setUserData] = useState<any>(null);
    const auth = getAuth();

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            setCurrentUser(user);
        });
        return () => unsubscribe();
    }, [auth]);


    useEffect(() => {
        const fetchUserData = async () => {
            if (currentUser) {
                try {
                    const userDocRef = doc(FIREBASE_DB, 'users', currentUser.uid);
                    const userDocSnap = await getDoc(userDocRef);

                    if (userDocSnap.exists()) {
                        setUserData(userDocSnap.data());
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

    const initializePaymentSheet = async () => {
        if (!currentUser) {
            throw new Error('User not authenticated');
        }

        const createPaymentIntent = httpsCallable(FIREBASE_FUNCTIONS, 'createPaymentIntent');
        const response = await createPaymentIntent({
            firebaseUID: currentUser.uid,
            amount: Math.round(parseFloat(amount) * 100), // Convert to cents
        });

        const { clientSecret } = response.data as { clientSecret: string };

        if (!clientSecret) {
            throw new Error('Failed to create PaymentIntent');
        }

        const { error } = await initPaymentSheet({
            paymentIntentClientSecret: clientSecret,
            merchantDisplayName: 'Your App Name',
        });

        if (error) {
            throw new Error(error.message);
        }
    };

    const handlePayment = async () => {
        if (amount === '' || isNaN(parseFloat(amount))) {
            Alert.alert('Error', 'Please enter a valid amount');
            return;
        }

        if (!currentUser) {
            Alert.alert('Error', 'You must be logged in to make a deposit.');
            return;
        }

        setLoading(true);
        try {
            await initializePaymentSheet();

            const { error } = await presentPaymentSheet();

            if (error) {
                throw new Error(error.message);
            }

            Alert.alert('Success', 'Your payment was successful!');
            onSuccess(parseFloat(amount));
            onClose();
        } catch (error) {
            console.error('Payment error:', error);
            Alert.alert('Error', (error as Error).message || 'An error occurred during payment');
        } finally {
            setLoading(false);
        }
    };

    return (
        <View style={styles.container}>
            <TextInput
                style={styles.input}
                placeholder="Enter amount"
                value={amount}
                onChangeText={setAmount}
                keyboardType="numeric"
            />
            <Button
                title="Make Payment"
                onPress={handlePayment}
                disabled={loading || !currentUser}
            />
            <Button title="Cancel" onPress={onClose} />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        padding: 20,
    },
    input: {
        borderWidth: 1,
        borderColor: 'gray',
        padding: 10,
        marginBottom: 20,
    },
});

export default DepositScreen;