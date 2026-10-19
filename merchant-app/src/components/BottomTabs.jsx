import { View } from 'react-native';
import TabButton from './TabButton';
import { styles } from '../styles/common';

export default function BottomTabs({ activeTab, setActiveTab }) {
  return (
    <View style={styles.bottomTabs}>
      <TabButton active={activeTab === 'home'} label="Home" icon="🏠" onPress={() => setActiveTab('home')} />
      <TabButton active={activeTab === 'orders'} label="Orders" icon="📦" onPress={() => setActiveTab('orders')} />
      <TabButton active={activeTab === 'history'} label="History" icon="🕒" onPress={() => setActiveTab('history')} />
      <TabButton active={activeTab === 'profile'} label="Profile" icon="👤" onPress={() => setActiveTab('profile')} />
    </View>
  );
}
