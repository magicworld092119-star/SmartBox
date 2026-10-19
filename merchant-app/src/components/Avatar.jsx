import { Text, View } from 'react-native';
import { styles } from '../styles/common';

export default function Avatar({ label, size = 48 }) {
  return (
    <View style={[styles.avatar, { width: size, height: size, borderRadius: size / 2 }]}>
      <Text style={styles.avatarText}>{label}</Text>
    </View>
  );
}
