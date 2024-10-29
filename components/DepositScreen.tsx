import React, { useState } from 'react';
import { Alert, View, TextInput, Button } from 'react-native';
import { useStripe } from '@stripe/stripe-react-native';
import { httpsCallable } from 'firebase/functions';
import { FIREBASE_FUNCTIONS } from '../FirebaseConfig';

interface PaymentIntentResponse {
    paymentIntent: {
        clientSecret: string;
    };
}

const DepositScreen = () => {
    const { initPaymentSheet, presentPaymentSheet } = useStripe();
    const [amount, setAmount] = useState(0);

    const handleDeposit = async () => {
        try {
            // Call your Firebase function to create a PaymentIntent
            interface CreatePaymentIntentData {
                amount: number;
            }

            const createPaymentIntent = httpsCallable<CreatePaymentIntentData, PaymentIntentResponse>(FIREBASE_FUNCTIONS, 'createPaymentIntent');
            const { data } = await createPaymentIntent({ amount: amount * 100 }); // Convert to cents

            console.log('PaymentIntent data:', data); // Log the data to see its structure

            // Initialize PaymentSheet
            const { error } = await initPaymentSheet({
                paymentIntentClientSecret: data.paymentIntent.clientSecret,
                merchantDisplayName: 'Golf App',
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
                setAmount(0); // Reset the amount after successful payment
            }
        } catch (e) {
            console.error('Error in handleDeposit:', e);
        }
    };

    return (
        <View>
            <TextInput
                placeholder="Enter deposit amount"
                value={amount.toString()}
                onChangeText={(text) => setAmount(parseInt(text, 10))}
                keyboardType="numeric"
            />
            <Button title="Deposit" onPress={handleDeposit} />
        </View>
    );
};

export default DepositScreen;