import { registerRootComponent } from 'expo';
import React from 'react';
import { StripeProvider } from '@stripe/stripe-react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider } from './context/AuthContext';

import App from './App';

// registerRootComponent calls AppRegistry.registerComponent('main', () => App);
// It also ensures that whether you load the app in Expo Go or in a native build,
// the environment is set up appropriately

const publishableKey = "pk_test_51QAvfOLZgHn4BjmwLz4sfVoidoK8lNugRUXxIvKkEc9fa8VuhV3Z7IJqwqtHpAHNvVKC6Erbzq7ZH1PGecSjzkUi00CqulYlUD";

registerRootComponent(() => (
    <SafeAreaProvider>
        <StripeProvider publishableKey={publishableKey} 
        urlScheme="myapp" 
        merchantIdentifier="your_merchant_identifier" 
        >
            <AuthProvider>
                <App />
            </AuthProvider>
        </StripeProvider>
    </SafeAreaProvider>
));
