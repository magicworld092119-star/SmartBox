import React from 'react';
import { Platform, Text, View } from 'react-native';
import { styles } from '../styles/common';

export default function MapPreview({ latitude, longitude, address }) {
  const hasCoords = latitude && longitude;
  const src = hasCoords
    ? `https://maps.google.com/maps?q=${latitude},${longitude}&z=15&output=embed`
    : null;

  return (
    <View style={styles.mapShell}>
      {Platform.OS === 'web' && src ? (
        React.createElement('iframe', {
          title: 'Location map',
          src,
          style: { border: 0, width: '100%', height: 172, borderRadius: 16 },
          loading: 'lazy',
        })
      ) : (
        <View style={styles.mapFallback}>
          <Text style={styles.mapPin}>PIN</Text>
          <Text style={styles.mapText}>{hasCoords ? `${latitude.toFixed(5)}, ${longitude.toFixed(5)}` : 'Location preview'}</Text>
        </View>
      )}
      <Text style={styles.mapAddress}>{address || 'Use current location or enter address manually.'}</Text>
    </View>
  );
}
