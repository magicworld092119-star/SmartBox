import { Text, TouchableOpacity, View } from 'react-native';
import { formatStatus } from '../utils/format';
import { styles } from '../styles/common';

export default function OrderCard({ order, onPress }) {
  return (
    <TouchableOpacity activeOpacity={0.86} style={styles.orderCard} onPress={onPress}>
      <View style={styles.orderTopRow}>
        <Text style={styles.orderId}>#{order.order_id}</Text>
        <Text style={[styles.statusPill, order.status === 'installed' && styles.statusDone]}>
          {formatStatus(order.status)}
        </Text>
      </View>
      <Text style={styles.cardTitle}>{order.provider}</Text>
      <Text style={styles.cardDescription}>{order.device_type}</Text>
      <Text style={styles.orderDate}>{order.date}</Text>
    </TouchableOpacity>
  );
}
