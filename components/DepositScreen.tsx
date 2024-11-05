import React, { useState } from 'react';
import { Alert, View, Button, TextInput, StyleSheet } from 'react-native';
import { useStripe } from '@stripe/stripe-react-native';
import { httpsCallable } from 'firebase/functions';
import { FIREBASE_FUNCTIONS } from '../FirebaseConfig';

interface DepositScreenProps {
    onClose: () => void;
    onSuccess: (amount: number) => void;
}

const DepositScreen: React.FC<DepositScreenProps> = ({ onClose, onSuccess }) => {
    const { initPaymentSheet, presentPaymentSheet } = useStripe();
    const [amount, setAmount] = useState(0);

    const initializePaymentSheet = async () => {
        const createPaymentIntent = httpsCallable(FIREBASE_FUNCTIONS, 'createPaymentIntent');
        const response = await createPaymentIntent({ amount: amount });

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
        if (isNaN(amount) || amount <= 0) {
            Alert.alert('Error', 'Please enter a valid amount');
            return;
        }

        try {
            await initializePaymentSheet();

            const { error } = await presentPaymentSheet();

            if (error) {
                throw new Error(error.message);
            }

            Alert.alert('Success', 'Your payment was successful!');
            onSuccess(amount);
            onClose();
        } catch (error) {
            console.error('Payment error:', error);
            Alert.alert('Error', (error as Error).message || 'An error occurred during payment');
        }
    };

    return (
        <View style={styles.container}>
            <TextInput
                style={styles.input}
                placeholder="Enter amount"
                value={amount.toString()}
                keyboardType="numeric"
                onChangeText={(text) => setAmount(parseFloat(text))}
            />
            <Button title="Make Payment" onPress={handlePayment} />
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