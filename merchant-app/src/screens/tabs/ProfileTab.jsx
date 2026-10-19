import { useState } from 'react';
import { Alert, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import Avatar from '../../components/Avatar';
import FormInput from '../../components/FormInput';
import PrimaryButton from '../../components/PrimaryButton';
import { styles } from '../../styles/common';

export default function ProfileTab({ merchant, setMerchant, onLogout }) {
  const [isEditing, setIsEditing] = useState(false);

  const toggleEdit = () => {
    if (isEditing) {
      const nextMerchant = {
        ...merchant,
        name: merchant.name || 'Merchant User',
        shopName: merchant.shopName || 'Your Shop',
      };
      setMerchant(nextMerchant);
      Alert.alert('Profile updated', 'Your local merchant profile has been saved.');
    }
    setIsEditing(!isEditing);
  };

  const renderField = (label, value) => (
    <View style={styles.inputGroup}>
      <Text style={styles.inputLabel}>{label}</Text>
      <Text style={[styles.input, { paddingTop: 14, minHeight: 48, borderColor: 'transparent', backgroundColor: 'transparent' }]}>
        {value || 'Not provided'}
      </Text>
    </View>
  );

  return (
    <ScrollView contentContainerStyle={styles.tabContent}>
      <View style={styles.profileCard}>
        <Avatar label={merchant.photo} size={68} />
        <Text style={styles.profileName}>{merchant.name}</Text>
        <Text style={styles.profileEmail}>{merchant.email}</Text>
      </View>

      <View style={styles.formPanel}>
        {isEditing ? (
          <>
            <FormInput label="Merchant Name" value={merchant.name} onChangeText={(value) => setMerchant({ ...merchant, name: value })} />
            <FormInput label="Email" value={merchant.email} onChangeText={(value) => setMerchant({ ...merchant, email: value })} />
            <FormInput label="Phone" value={merchant.phone} onChangeText={(value) => setMerchant({ ...merchant, phone: value })} />
            <FormInput label="Shop Name" value={merchant.shopName} onChangeText={(value) => setMerchant({ ...merchant, shopName: value })} />
            <FormInput label="Current Address" value={merchant.address} onChangeText={(value) => setMerchant({ ...merchant, address: value })} multiline />
          </>
        ) : (
          <>
            {renderField('Merchant Name', merchant.name)}
            {renderField('Email', merchant.email)}
            {renderField('Phone', merchant.phone)}
            {renderField('Shop Name', merchant.shopName)}
            {renderField('Current Address', merchant.address)}
          </>
        )}
      </View>

      <PrimaryButton label={isEditing ? "Save Profile" : "Edit Profile"} onPress={toggleEdit} />
      <View style={styles.settingsList}>
        {['Help & Support', 'Privacy Policy', 'Terms & Conditions'].map((item) => (
          <TouchableOpacity key={item} style={styles.settingsRow}>
            <Text style={styles.settingsText}>{item}</Text>
            <Text style={styles.settingsArrow}>Open</Text>
          </TouchableOpacity>
        ))}
      </View>
      <PrimaryButton label="Logout" variant="light" onPress={onLogout} />
    </ScrollView>
  );
}
