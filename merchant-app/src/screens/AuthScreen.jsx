import { useState } from 'react';
import { SafeAreaView, Text, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { defaultMerchant } from '../constants';
import AppLogo from '../components/AppLogo';
import PrimaryButton from '../components/PrimaryButton';
import { styles } from '../styles/common';

export default function AuthScreen({ onLogin }) {
  const [loading, setLoading] = useState(false);

  const handleGoogleLogin = () => {
    setLoading(true);
    setTimeout(() => {
      onLogin(defaultMerchant);
      setLoading(false);
    }, 900);
  };

  return (
    <SafeAreaView style={styles.authScreen}>
      <StatusBar style="dark" />
      <View style={styles.authHero}>
        <AppLogo size={64} />
        <Text style={styles.authTitle}>SmartBox Merchant</Text>
        <Text style={styles.authTagline}>Book payment devices, verify orders, and track installation in one clean workspace.</Text>
      </View>
      <View style={styles.authPanel}>
        <PrimaryButton label="Continue with Google" loading={loading} onPress={handleGoogleLogin} />
        <Text style={styles.authFinePrint}>Your merchant profile is created automatically on first sign-in.</Text>
      </View>
    </SafeAreaView>
  );
}
