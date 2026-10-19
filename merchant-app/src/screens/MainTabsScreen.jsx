import { useState } from 'react';
import { SafeAreaView, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import BottomTabs from '../components/BottomTabs';
import HomeTab from './tabs/HomeTab';
import OrdersTab from './tabs/OrdersTab';
import HistoryTab from './tabs/HistoryTab';
import ProfileTab from './tabs/ProfileTab';
import { styles } from '../styles/common';

export default function MainTabsScreen({ navigation, merchant, setMerchant, orders, onLogout }) {
  const [activeTab, setActiveTab] = useState('home');

  const content = {
    home: <HomeTab merchant={merchant} navigation={navigation} setActiveTab={setActiveTab} />,
    orders: <OrdersTab orders={orders} navigation={navigation} />,
    history: <HistoryTab orders={orders} navigation={navigation} />,
    profile: <ProfileTab merchant={merchant} setMerchant={setMerchant} onLogout={onLogout} />,
  }[activeTab];

  return (
    <SafeAreaView style={styles.appScreen}>
      <StatusBar style="dark" />
      <View style={styles.tabShell}>{content}</View>
      <BottomTabs activeTab={activeTab} setActiveTab={setActiveTab} />
    </SafeAreaView>
  );
}
