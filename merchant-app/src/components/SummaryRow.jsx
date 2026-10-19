import { Text, View } from 'react-native';
import { styles } from '../styles/common';

export default function SummaryRow({ label, value }) {
  return (
    <View style={styles.summaryRowWide}>
      <Text style={styles.summaryLabel}>{label}</Text>
      <Text style={styles.summaryValueWide}>{value}</Text>
    </View>
  );
}
