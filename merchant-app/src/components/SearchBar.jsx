import { Text, TextInput, View } from 'react-native';
import { colors, styles } from '../styles/common';

export default function SearchBar({ placeholder = 'Search', value, onChangeText }) {
  return (
    <View style={styles.searchBar}>
      <Text style={styles.searchIcon}>Search</Text>
      <TextInput
        style={styles.searchInput}
        placeholder={placeholder}
        placeholderTextColor={colors.placeholder}
        value={value}
        onChangeText={onChangeText}
      />
    </View>
  );
}
