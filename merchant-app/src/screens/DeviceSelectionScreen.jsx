import { useState } from 'react';
import { SafeAreaView, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { devices } from '../constants';
import PrimaryButton from '../components/PrimaryButton';
import ScreenHeader from '../components/ScreenHeader';
import { styles } from '../styles/common';

export default function DeviceSelectionScreen({ route, navigation }) {
  const { provider } = route.params;
  const [selectedDevice, setSelectedDevice] = useState(null);

  return (
    <SafeAreaView style={styles.appScreen}>
      <StatusBar style="dark" />
      <ScrollView contentContainerStyle={styles.pageContent}>
        <ScreenHeader
          eyebrow={provider.name}
          title="Choose a device"
          subtitle="Select the hardware that best fits this merchant counter."
        />
        {devices.map((device) => {
          const active = selectedDevice?.name === device.name;
          return (
            <TouchableOpacity
              activeOpacity={0.86}
              key={device.name}
              style={[styles.deviceCard, active && styles.selectedCard]}
              onPress={() => setSelectedDevice(device)}
            >
              <View style={styles.deviceImage}>
                <Text style={styles.deviceImageText}>{device.image}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.cardTitle}>{device.name}</Text>
                <Text style={styles.cardDescription}>{device.description}</Text>
              </View>
            </TouchableOpacity>
          );
        })}
        <PrimaryButton
          label="Continue"
          disabled={!selectedDevice}
          onPress={() => navigation.navigate('MerchantForm', { provider, device: selectedDevice })}
        />
      </ScrollView>
    </SafeAreaView>
  );
}
