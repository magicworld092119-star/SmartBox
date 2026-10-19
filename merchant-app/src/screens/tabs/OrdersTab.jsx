import { ScrollView } from 'react-native';
import EmptyState from '../../components/EmptyState';
import OrderCard from '../../components/OrderCard';
import ScreenHeader from '../../components/ScreenHeader';
import { styles } from '../../styles/common';

export default function OrdersTab({ orders, navigation }) {
  const activeOrders = orders.filter((order) => !['installed', 'cancelled'].includes(order.status));

  return (
    <ScrollView contentContainerStyle={styles.tabContent}>
      <ScreenHeader
        eyebrow="Orders"
        title="Active orders"
        subtitle="Track requests that are pending, assigned, or in delivery."
      />
      {activeOrders.length === 0 ? (
        <EmptyState title="No active orders" subtitle="New device requests will appear here." />
      ) : (
        activeOrders.map((order) => (
          <OrderCard
            key={order.order_id}
            order={order}
            onPress={() => navigation.navigate('OrderTracking', { order })}
          />
        ))
      )}
    </ScrollView>
  );
}
