import { httpsCallable } from 'firebase/functions';

import { FIREBASE_FUNCTIONS } from '../FirebaseConfig';
import { useStripe } from '@stripe/stripe-react-native';
import React, { useState } from 'react';
import { Alert, View, TextInput, Button, Modal, StyleSheet, ActivityIndicator } from 'react-native';
import { useAuth } from '../context/AuthContext';

interface CreatePaymentIntentData {
    data: number;
}
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
    const [amount, setAmount] = useState("");
    const { user, loading } = useAuth();
    const [isLoading, setIsLoading] = useState(false);

    const handleDeposit = async () => {
        console.log("handleDeposit called");

        if (loading) {
            console.log("Auth state is still loading");
            return;
        }

        if (!user) {
            Alert.alert("Error", "You must be logged in to make a deposit.");
            onClose();
            return;
        }

        // Validate amount
        const amountNumber = parseFloat(amount);
        if (isNaN(amountNumber) || amountNumber <= 0) {
            Alert.alert("Error", "Please enter a valid deposit amount.");
            return;
        }

        setIsLoading(true);

        try {
            console.log(
                "Calling createPaymentIntent function with amount:",
                amountNumber
            );

            // Ensure the amount is passed within the 'data' property
            const createPaymentIntent = httpsCallable<CreatePaymentIntentData,PaymentIntentResponse>(FIREBASE_FUNCTIONS, "createPaymentIntent");
            const { data } = await createPaymentIntent({ data: amountNumber });

            console.log("PaymentIntent data:", data);

            const { error } = await initPaymentSheet({
                paymentIntentClientSecret: data.paymentIntent.clientSecret,
                merchantDisplayName: "All Square",
            });

            if (error) {
                console.error("Error initializing PaymentSheet:", error);
                return;
            }

            const { error: presentError } = await presentPaymentSheet();

            if (presentError) {
                console.error("Error presenting PaymentSheet:", presentError);
            } else {
                Alert.alert("Success", "Your payment was successful!");
                onSuccess(amountNumber);
                setAmount("");
            }
        } catch (e) {
            console.error("Error in handleDeposit:", e);
            Alert.alert(
                "Error",
                "An error occurred while processing your payment."
            );
            onClose();
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Modal visible={true} animationType="slide">
            <View style={styles.container}>
                <Button title="Close" onPress={onClose} />
                <TextInput
                    placeholder="Enter deposit amount"
                    value={amount}
                    onChangeText={(text) => {
                        const newText = text.replace(/[^0-9.]/g, '');
                        const decimalCount = (newText.match(/\./g) || []).length;
                        if (decimalCount <= 1) {
                            setAmount(newText);
                        }
                    }}
                    keyboardType="numeric"
                    style={styles.input}
                />
                <Button title="Deposit" onPress={handleDeposit} disabled={isLoading} />
                {isLoading && <ActivityIndicator size="large" />}
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