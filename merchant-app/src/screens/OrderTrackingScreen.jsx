import { useEffect, useState } from 'react';
import { SafeAreaView, ScrollView, Text, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { orderSteps, API_BASE } from '../constants';
import Avatar from '../components/Avatar';
import ScreenHeader from '../components/ScreenHeader';
import { formatStatus } from '../utils/format';
import PrimaryButton from '../components/PrimaryButton';
import { styles } from '../styles/common';

export default function OrderTrackingScreen({ route, navigation }) {
  const initialOrder = route.params.order;
  const [order, setOrder] = useState(initialOrder);

  useEffect(() => {
    let ignore = false;
    const fetchLatest = async () => {
      if (!initialOrder?.order_id) return;
      try {
        const res = await fetch(`${API_BASE}/api/orders/${initialOrder.order_id}/track`);
        if (res.ok) {
          const data = await res.json();
          if (!ignore) {
            setOrder((prev) => ({ ...prev, ...data }));
          }
        }
      } catch (err) {
        // network or background fetch fallback
      }
    };

    fetchLatest();
    const interval = setInterval(fetchLatest, 6000);
    return () => {
      ignore = true;
      clearInterval(interval);
    };
  }, [initialOrder?.order_id]);

  const currentIndex = Math.max(0, orderSteps.indexOf(order.status));
  const agentDisplayName = order.agent_name || (order.assigned_agent_id ? `Agent #${order.assigned_agent_id}` : null);

  return (
    <SafeAreaView style={styles.appScreen}>
      <StatusBar style="dark" />
      <ScrollView contentContainerStyle={styles.pageContent}>
        <ScreenHeader title="Track installation" subtitle={`${order.provider} · ${order.device_type} · #${order.order_id}`} />
        <View style={styles.agentCard}>
          <Avatar label={agentDisplayName ? agentDisplayName.substring(0, 2).toUpperCase() : 'SB'} />
          <View style={{ flex: 1 }}>
            <Text style={styles.cardTitle}>{agentDisplayName ? agentDisplayName : 'Agent assignment pending'}</Text>
            <Text style={styles.cardDescription}>
              {agentDisplayName
                ? 'Your assigned agent is managing this dispatch.'
                : 'A nearby field agent will be assigned shortly.'}
            </Text>
          </View>
        </View>
        <View style={styles.timeline}>
          {orderSteps.map((step, index) => {
            const done = index <= currentIndex;
            return (
              <View key={step} style={styles.timelineRow}>
                <View style={[styles.timelineDot, done && styles.timelineDotDone]} />
                <View style={{ flex: 1 }}>
                  <Text style={[styles.timelineTitle, done && styles.timelineTitleDone]}>{formatStatus(step)}</Text>
                  <Text style={styles.timelineMeta}>{done ? 'Completed' : 'Waiting'}</Text>
                </View>
              </View>
            );
          })}
        </View>
        <View style={{ marginTop: 32 }}>
          <PrimaryButton label="Back to Home" onPress={() => navigation.navigate('Main')} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
