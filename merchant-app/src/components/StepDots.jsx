import { View } from 'react-native';
import { styles } from '../styles/common';

export default function StepDots({ step }) {
  return (
    <View style={styles.stepDots}>
      {[0, 1, 2].map((item) => (
        <View key={item} style={[styles.stepDot, step >= item && styles.stepDotActive]} />
      ))}
    </View>
  );
}
