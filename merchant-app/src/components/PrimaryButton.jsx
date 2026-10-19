import { ActivityIndicator, Text, TouchableOpacity } from 'react-native';
import { colors, styles } from '../styles/common';

export default function PrimaryButton({ label, onPress, disabled, loading, variant = 'dark' }) {
  return (
    <TouchableOpacity
      activeOpacity={0.84}
      style={[
        styles.primaryButton,
        variant === 'light' && styles.lightButton,
        disabled && styles.buttonDisabled,
      ]}
      disabled={disabled || loading}
      onPress={onPress}
    >
      {loading ? (
        <ActivityIndicator color={variant === 'light' ? colors.primaryOrange : colors.white} />
      ) : (
        <Text style={[styles.primaryButtonText, variant === 'light' && styles.lightButtonText]}>{label}</Text>
      )}
    </TouchableOpacity>
  );
}
