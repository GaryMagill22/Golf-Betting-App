import React from 'react';
import { View, Button, TextInput, StyleSheet } from 'react-native';

interface DepositScreenProps {
    amount: number;
    onClose: () => void;
    onPayment: () => void;
    setAmount: (amount: number) => void;
}

const DepositScreen: React.FC<DepositScreenProps> = ({ amount, onClose, setAmount, onPayment }) => {
    return (
        <View style={styles.container}>
            <TextInput
                style={styles.input}
                placeholder="Enter amount"
                value={amount.toString()}
                keyboardType="numeric"
                onChangeText={(text) => setAmount(parseFloat(text))} 
            />
            <Button title="Deposit" onPress={onPayment} />
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