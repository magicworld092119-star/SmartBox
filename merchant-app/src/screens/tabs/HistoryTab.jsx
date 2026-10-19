import { useState } from 'react';
import { ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { colors } from '../../styles/common';
import { historyFilters } from '../../constants';
import EmptyState from '../../components/EmptyState';
import OrderCard from '../../components/OrderCard';
import ScreenHeader from '../../components/ScreenHeader';
import { formatStatus } from '../../utils/format';
import { styles } from '../../styles/common';

export default function HistoryTab({ orders, navigation }) {
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState('All');
  const historyOrders = orders.filter((order) => ['installed', 'cancelled'].includes(order.status));
  const filteredOrders = historyOrders.filter((order) => {
    const matchesFilter = filter === 'All' || order.provider === filter || order.device_type === filter || formatStatus(order.status) === filter;
    const matchesSearch = `${order.provider} ${order.device_type} ${order.order_id}`.toLowerCase().includes(query.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  return (
    <ScrollView contentContainerStyle={styles.tabContent}>
      <ScreenHeader eyebrow="History" title="Past requests" subtitle="Find completed and cancelled orders quickly." />
      <View style={styles.searchBar}>
        <Text style={styles.searchIcon}>Search</Text>
        <TextInput
          style={styles.searchInput}
          placeholder="Search history"
          placeholderTextColor={colors.placeholder}
          value={query}
          onChangeText={setQuery}
        />
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroller}>
        {historyFilters.map((item) => (
          <TouchableOpacity
            key={item}
            style={[styles.filterChip, filter === item && styles.filterChipActive]}
            onPress={() => setFilter(item)}
          >
            <Text style={[styles.filterText, filter === item && styles.filterTextActive]}>{item}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
      {filteredOrders.length === 0 ? (
        <EmptyState title="No history yet" subtitle="Completed and cancelled orders will be listed here." />
      ) : (
        filteredOrders.map((order) => (
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
