import { Text, TextInput, View } from 'react-native';
import { colors, styles } from '../styles/common';

export default function FormInput({ label, value, onChangeText, placeholder, keyboardType, multiline }) {
  return (
    <View style={styles.inputGroup}>
      <Text style={styles.inputLabel}>{label}</Text>
      <TextInput
        style={[styles.input, multiline && styles.multilineInput]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder || label}
        placeholderTextColor={colors.placeholder}
        keyboardType={keyboardType}
        multiline={multiline}
      />
    </View>
  );
}
