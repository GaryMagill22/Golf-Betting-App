import { httpsCallable } from 'firebase/functions';
import { FIREBASE_FUNCTIONS } from '../FirebaseConfig'; // Adjust the path as needed
import { useStripe } from '@stripe/stripe-react-native';
import React, { useState } from 'react';
import { Alert, View, TextInput, Button, Modal, StyleSheet } from 'react-native';
import { useAuth } from '../context/AuthContext'; // Adjust the path as needed

interface PaymentIntentResponse {
    paymentIntent: {
        clientSecret: string;
    };
}

interface DepositScreenProps {
    onClose: () => void;
    onSuccess: (amount: number) => void;
}

const DepositScreen: React.FC<DepositScreenProps> = ({ onClose, onSuccess }) => {
    const { initPaymentSheet, presentPaymentSheet } = useStripe();
    const [amount, setAmount] = useState(0);
    const { user, loading } = useAuth(); // Use the Auth context

    const handleDeposit = async () => {
        console.log("handleDeposit called");

        if (loading) {
            console.log("Auth state is still loading");
            return; // Wait until the auth state is resolved
        }

        if (!user) {
            Alert.alert('Error', 'You must be logged in to make a deposit.');
            onClose();
            return;
        }

        try {
            console.log("Calling createPaymentIntent function with amount:", amount);

            // Call your Firebase function to create a PaymentIntent
            interface CreatePaymentIntentData {
                userId: string;
                amount: number;
            }

            const createPaymentIntent = httpsCallable<CreatePaymentIntentData, PaymentIntentResponse>(FIREBASE_FUNCTIONS, 'createPaymentIntent');
            const { data } = await createPaymentIntent({ userId: user.uid, amount: amount * 100 }); // Convert to cents

            console.log('PaymentIntent data:', data); // Log the data to see its structure

            // Initialize PaymentSheet
            const { error } = await initPaymentSheet({
                paymentIntentClientSecret: data.paymentIntent.clientSecret,
                merchantDisplayName: 'All Square',
            });

            if (error) {
                console.error('Error initializing PaymentSheet:', error);
                return;
            }

            // Present PaymentSheet
            const { error: presentError } = await presentPaymentSheet();

            if (presentError) {
                console.error('Error presenting PaymentSheet:', presentError);
            } else {
                Alert.alert('Success', 'Your payment was successful!');
                onSuccess(amount);
                setAmount(0); // Reset the amount after successful payment
            }
        } catch (e) {
            console.error('Error in handleDeposit:', e);
            Alert.alert('Error', 'An error occurred while processing your payment.');
            onClose();
        }
    };

    return (
        <Modal visible={true} animationType="slide">
            <View style={styles.container}>
                <Button title="Close" onPress={onClose} />
                <TextInput
                    placeholder="Enter deposit amount"
                    value={amount.toString()}
                    onChangeText={(text) => setAmount(parseInt(text, 10))}
                    keyboardType="numeric"
                    style={styles.input}
                />
                <Button title="Deposit" onPress={handleDeposit} />
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 16,
    },
    input: {
        height: 40,
        borderColor: 'gray',
        borderWidth: 1,
        marginBottom: 12,
        paddingHorizontal: 8,
        width: '100%',
    },
});

export default DepositScreen;