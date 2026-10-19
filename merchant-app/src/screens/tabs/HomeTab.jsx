import { ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { providers } from '../../constants';
import Avatar from '../../components/Avatar';
import SearchBar from '../../components/SearchBar';
import { styles } from '../../styles/common';

export default function HomeTab({ merchant, navigation, setActiveTab }) {
  return (
    <ScrollView contentContainerStyle={styles.tabContent}>
      <View style={styles.homeTop}>
        <View>
          <Text style={styles.greeting}>Hello, {merchant.name.split(' ')[0]}</Text>
          <Text style={styles.locationText}>{merchant.address}</Text>
        </View>
        <TouchableOpacity activeOpacity={0.8} onPress={() => setActiveTab('profile')}>
          <Avatar label={merchant.photo} />
        </TouchableOpacity>
      </View>

      <SearchBar placeholder="Search providers or devices" />

      <View style={styles.sectionHeadingRow}>
        <Text style={styles.sectionTitle}>Payment Providers</Text>
        <Text style={styles.sectionAction}>New booking</Text>
      </View>

      <View style={styles.providerGrid}>
        {providers.map((provider) => (
          <TouchableOpacity
            activeOpacity={0.88}
            key={provider.name}
            style={styles.providerCard}
            onPress={() => navigation.navigate('DeviceSelection', { provider })}
          >
            <View style={[styles.providerLogo, { backgroundColor: provider.tone }]}>
              <Text style={styles.providerLogoText}>{provider.logo}</Text>
            </View>
            <Text style={styles.cardTitle}>{provider.name}</Text>
            <Text style={styles.cardDescription}>{provider.description}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );
}
