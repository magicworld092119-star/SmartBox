import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  SafeAreaView,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { categories } from '../constants';
import FormInput from '../components/FormInput';
import MapPreview from '../components/MapPreview';
import PrimaryButton from '../components/PrimaryButton';
import ScreenHeader from '../components/ScreenHeader';
import StepDots from '../components/StepDots';
import { colors, styles } from '../styles/common';

export default function MerchantFormScreen({ route, navigation, merchant }) {
  const { provider, device } = route.params;
  const [step, setStep] = useState(0);
  const [locating, setLocating] = useState(false);
  const [form, setForm] = useState({
    merchantName: merchant.name,
    shopName: merchant.shopName === 'Your Shop' ? '' : merchant.shopName,
    mobile: merchant.phone,
    alternate: '',
    category: '',
    address: merchant.address === 'Location not added' ? '' : merchant.address,
    landmark: '',
    city: '',
    state: '',
    pincode: '',
    latitude: null,
    longitude: null,
  });

  const update = (key, value) => setForm((current) => ({ ...current, [key]: value }));

  const useCurrentLocation = () => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      Alert.alert('Location unavailable', 'Location services are not available in this environment.');
      return;
    }

    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        let addressPatch = {
          latitude,
          longitude,
          address: `${latitude.toFixed(5)}, ${longitude.toFixed(5)}`,
        };

        try {
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`, {
            headers: {
              'User-Agent': 'SmartBoxMerchantApp/1.0',
              'Accept': 'application/json',
            },
          });
          if (res.ok) {
            const data = await res.json();
            addressPatch = {
              ...addressPatch,
              address: data.display_name || addressPatch.address,
              city: data.address?.city || data.address?.town || data.address?.village || '',
              state: data.address?.state || '',
              pincode: data.address?.postcode || '',
            };
          }
        } catch {
          // Keep coordinates even when reverse geocoding is unavailable.
        }

        setForm((current) => ({ ...current, ...addressPatch }));
        setLocating(false);
      },
      () => {
        setLocating(false);
        Alert.alert('Location permission needed', 'Please allow location access or enter the address manually.');
      },
      { enableHighAccuracy: true, timeout: 12000 },
    );
  };

  const goNext = () => {
    if (step === 0) {
      if (!form.merchantName.trim()) {
        return Alert.alert('Missing details', 'Please enter the Merchant Name.');
      }
      if (!form.shopName.trim()) {
        return Alert.alert('Missing details', 'Please enter the Shop Name.');
      }
      if (form.mobile.replace(/\D/g, '').length < 10) {
        return Alert.alert('Invalid format', 'Please enter a valid 10-digit mobile number.');
      }
      if (form.alternate.trim() && form.alternate.replace(/\D/g, '').length < 10) {
        return Alert.alert('Invalid format', 'Please enter a valid 10-digit alternate number or leave it blank.');
      }
    } else if (step === 1) {
      if (!form.category.trim()) {
        return Alert.alert('Missing details', 'Please select a business category.');
      }
    } else if (step === 2) {
      if (!form.address.trim() || !form.city.trim() || !form.state.trim() || !form.pincode.trim()) {
        return Alert.alert('Missing details', 'Please complete Address, City, State, and Pincode.');
      }
      if (form.pincode.replace(/\D/g, '').length < 5) {
        return Alert.alert('Invalid format', 'Please enter a valid pincode.');
      }
    }

    if (step < 2) {
      setStep(step + 1);
      return;
    }
    navigation.navigate('ReviewOrder', { provider, device, form });
  };

  return (
    <SafeAreaView style={styles.appScreen}>
      <StatusBar style="dark" />
      <ScrollView contentContainerStyle={styles.pageContent}>
        <ScreenHeader
          eyebrow="Merchant information"
          title={step === 0 ? 'Owner details' : step === 1 ? 'Business profile' : 'Location details'}
          subtitle="Complete this short guided form to avoid assignment errors."
          right={<StepDots step={step} />}
        />

        {step === 0 ? (
          <View style={styles.formPanel}>
            <FormInput label="Merchant Name" value={form.merchantName} onChangeText={(value) => update('merchantName', value)} />
            <FormInput label="Shop Name" value={form.shopName} onChangeText={(value) => update('shopName', value)} />
            <FormInput label="Mobile Number" value={form.mobile} onChangeText={(value) => update('mobile', value)} keyboardType="phone-pad" />
            <FormInput label="Alternate Number" value={form.alternate} onChangeText={(value) => update('alternate', value)} keyboardType="phone-pad" />
          </View>
        ) : null}

        {step === 1 ? (
          <View style={styles.formPanel}>
            <Text style={styles.inputLabel}>Business Category</Text>
            <View style={styles.categoryGrid}>
              {categories.map((category) => (
                <TouchableOpacity
                  key={category}
                  style={[styles.categoryChip, form.category === category && styles.categoryChipActive]}
                  onPress={() => update('category', category)}
                >
                  <Text style={[styles.categoryText, form.category === category && styles.categoryTextActive]}>{category}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ) : null}

        {step === 2 ? (
          <View>
            <TouchableOpacity style={styles.locationButton} onPress={useCurrentLocation} disabled={locating}>
              {locating ? <ActivityIndicator color={colors.primaryOrange} /> : <Text style={styles.locationButtonText}>Use Current Location</Text>}
            </TouchableOpacity>
            <MapPreview latitude={form.latitude} longitude={form.longitude} address={form.address} />
            <View style={styles.formPanel}>
              <FormInput label="Address" value={form.address} onChangeText={(value) => update('address', value)} multiline />
              <FormInput label="Landmark" value={form.landmark} onChangeText={(value) => update('landmark', value)} />
              <FormInput label="City" value={form.city} onChangeText={(value) => update('city', value)} />
              <FormInput label="State" value={form.state} onChangeText={(value) => update('state', value)} />
              <FormInput label="Pincode" value={form.pincode} onChangeText={(value) => update('pincode', value)} keyboardType="number-pad" />
            </View>
          </View>
        ) : null}

        <View style={styles.formActions}>
          {step > 0 ? <PrimaryButton label="Back" variant="light" onPress={() => setStep(step - 1)} /> : null}
          <PrimaryButton label={step === 2 ? 'Review Order' : 'Continue'} onPress={goNext} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
