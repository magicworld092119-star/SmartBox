import { Text, View } from 'react-native';
import { styles } from '../styles/common';

export default function AppLogo({ size = 52 }) {
  return (
    <View style={[styles.logo, { width: size, height: size }]}>
      <Text style={styles.logoText}>SB</Text>
    </View>
  );
}
