import { useEffect, useState } from 'react';
import {
  Alert,
  SafeAreaView,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { API_BASE, DEMO_OTP } from '../constants';
import PrimaryButton from '../components/PrimaryButton';
import ScreenHeader from '../components/ScreenHeader';
import { colors, styles } from '../styles/common';

export default function OtpVerificationScreen({ route, navigation, onOrderCreated, setMerchant }) {
  const { provider, device, form } = route.params;
  const [otp, setOtp] = useState('');
  const [timer, setTimer] = useState(300);
  const [loading, setLoading] = useState(false);
  const [sentAt, setSentAt] = useState(Date.now());

  useEffect(() => {
    const interval = setInterval(() => setTimer((current) => Math.max(0, current - 1)), 1000);
    return () => clearInterval(interval);
  }, [sentAt]);

  const resendOtp = () => {
    if (timer > 240) {
      Alert.alert('Please wait', 'You can request another OTP shortly.');
      return;
    }
    setTimer(300);
    setSentAt(Date.now());
    Alert.alert('OTP sent', `For this demo, use ${DEMO_OTP}.`);
  };

  const placeOrder = async () => {
    if (timer === 0) {
      Alert.alert('OTP expired', 'Please request a new OTP.');
      return;
    }
    if (otp !== DEMO_OTP) {
      Alert.alert('Invalid OTP', `Use ${DEMO_OTP} for this demo flow.`);
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/api/orders/merchant`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          shop_name: form.shopName.trim(),
          merchant_name: form.merchantName.trim(),
          phone: form.mobile.trim(),
          address: `${form.address}, ${form.landmark}, ${form.city}, ${form.state} ${form.pincode}`,
          latitude: form.latitude,
          longitude: form.longitude,
          provider: provider.name,
          device_type: device.name,
        }),
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.detail || 'Failed to place order');
      }

      const savedOrder = await response.json();
      const order = {
        ...savedOrder,
        provider: provider.name,
        device_type: device.name,
        date: new Date().toLocaleDateString(),
        merchant: {
          shop_name: form.shopName,
          address: form.address,
        },
      };

      setMerchant((current) => ({
        ...current,
        name: form.merchantName,
        phone: form.mobile,
        shopName: form.shopName,
        address: form.address,
      }));
      onOrderCreated(order);
      navigation.replace('OrderSuccess', { order });
    } catch (error) {
      Alert.alert('Order failed', error.message || 'Could not connect to the server. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.appScreen}>
      <StatusBar style="dark" />
      <ScrollView contentContainerStyle={styles.pageContent}>
        <ScreenHeader eyebrow="OTP Verification" title="Verify mobile number" subtitle={`Enter the OTP sent to ${form.mobile}.`} />
        <View style={styles.otpPanel}>
          <TextInput
            style={styles.otpInput}
            value={otp}
            onChangeText={setOtp}
            keyboardType="number-pad"
            maxLength={6}
            placeholder="000000"
            placeholderTextColor={colors.placeholder}
          />
          <Text style={styles.otpTimer}>Expires in {Math.floor(timer / 60)}:{String(timer % 60).padStart(2, '0')}</Text>
          <TouchableOpacity onPress={resendOtp} style={styles.resendButton}>
            <Text style={styles.resendText}>Send OTP again</Text>
          </TouchableOpacity>
        </View>
        <PrimaryButton label="Verify and Place Order" loading={loading} onPress={placeOrder} />
      </ScrollView>
    </SafeAreaView>
  );
}
