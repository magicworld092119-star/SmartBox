import { Text, View } from 'react-native';
import { styles } from '../styles/common';

export default function ScreenHeader({ eyebrow, title, subtitle, right }) {
  return (
    <View style={styles.screenHeader}>
      <Text style={styles.eyebrow}>{eyebrow}</Text>
      <View style={styles.headerRow}>
        <View style={{ flex: 1 }}>
          <Text style={styles.screenTitle}>{title}</Text>
          {subtitle ? <Text style={styles.screenSubtitle}>{subtitle}</Text> : null}
        </View>
        {right}
      </View>
    </View>
  );
}
