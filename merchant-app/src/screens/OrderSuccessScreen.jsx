import { SafeAreaView, Text, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import PrimaryButton from '../components/PrimaryButton';
import SummaryRow from '../components/SummaryRow';
import { formatStatus } from '../utils/format';
import { styles } from '../styles/common';

export default function OrderSuccessScreen({ route, navigation }) {
  const { order } = route.params;

  return (
    <SafeAreaView style={styles.successScreen}>
      <StatusBar style="dark" />
      <View style={styles.successMark}>
        <Text style={styles.successMarkText}>Done</Text>
      </View>
      <Text style={styles.successTitle}>Order placed</Text>
      <Text style={styles.successSubtitle}>Your request is pending assignment and will be processed soon.</Text>
      <View style={styles.successCard}>
        <SummaryRow label="Order ID" value={`#${order.order_id}`} />
        <SummaryRow label="Provider" value={order.provider} />
        <SummaryRow label="Device" value={order.device_type} />
        <SummaryRow label="Status" value={formatStatus(order.status || 'pending')} />
        <SummaryRow label="Processing" value="Usually within 24 hours" />
      </View>
      <PrimaryButton label="View Order" onPress={() => navigation.replace('OrderTracking', { order })} />
      <PrimaryButton label="Back to Home" variant="light" onPress={() => navigation.replace('Main')} />
    </SafeAreaView>
  );
}
