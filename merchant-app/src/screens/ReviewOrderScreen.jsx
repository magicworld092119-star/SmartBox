import { SafeAreaView, ScrollView, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import MapPreview from '../components/MapPreview';
import PrimaryButton from '../components/PrimaryButton';
import ScreenHeader from '../components/ScreenHeader';
import SummaryRow from '../components/SummaryRow';
import { styles } from '../styles/common';

export default function ReviewOrderScreen({ route, navigation }) {
  const { provider, device, form } = route.params;

  return (
    <SafeAreaView style={styles.appScreen}>
      <StatusBar style="dark" />
      <ScrollView contentContainerStyle={styles.pageContent}>
        <ScreenHeader eyebrow="Review" title="Confirm order details" subtitle="Check the summary before sending OTP verification." />
        <View style={styles.reviewCard}>
          <SummaryRow label="Provider" value={provider.name} />
          <SummaryRow label="Device" value={device.name} />
          <SummaryRow label="Merchant" value={form.merchantName} />
          <SummaryRow label="Shop" value={form.shopName} />
          <SummaryRow label="Phone" value={form.mobile} />
          <SummaryRow label="Address" value={`${form.address}, ${form.city}, ${form.state} ${form.pincode}`} />
        </View>
        <MapPreview latitude={form.latitude} longitude={form.longitude} address={form.address} />
        <View style={styles.formActions}>
          <PrimaryButton label="Edit Details" variant="light" onPress={() => navigation.goBack()} />
          <PrimaryButton label="Confirm Order" onPress={() => navigation.navigate('OtpVerification', { provider, device, form })} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
