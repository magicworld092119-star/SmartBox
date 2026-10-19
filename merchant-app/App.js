import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, SafeAreaView } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SESSION_KEY, ORDERS_KEY, API_BASE } from './src/constants';
import { readStorage, writeStorage, clearStorage } from './src/utils/storage';
import AuthScreen from './src/screens/AuthScreen';
import MainTabsScreen from './src/screens/MainTabsScreen';
import DeviceSelectionScreen from './src/screens/DeviceSelectionScreen';
import MerchantFormScreen from './src/screens/MerchantFormScreen';
import ReviewOrderScreen from './src/screens/ReviewOrderScreen';
import OtpVerificationScreen from './src/screens/OtpVerificationScreen';
import OrderSuccessScreen from './src/screens/OrderSuccessScreen';
import OrderTrackingScreen from './src/screens/OrderTrackingScreen';
import { colors, styles } from './src/styles/common';

const Stack = createNativeStackNavigator();

export default function App() {
  const [booting, setBooting] = useState(true);
  const [merchant, setMerchantState] = useState(null);
  const [orders, setOrdersState] = useState([]);

  useEffect(() => {
    setMerchantState(readStorage(SESSION_KEY, null));
    setOrdersState(readStorage(ORDERS_KEY, []));
    setBooting(false);
  }, []);

  useEffect(() => {
    if (!merchant?.phone) return;
    let ignore = false;

    const syncOrders = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/orders/by-phone/${encodeURIComponent(merchant.phone)}`);
        if (res.ok) {
          const serverOrders = await res.json();
          if (!ignore && Array.isArray(serverOrders) && serverOrders.length > 0) {
            setOrdersState((current) => {
              const map = new Map();
              serverOrders.forEach((o) => map.set(o.order_id, o));
              current.forEach((o) => {
                if (map.has(o.order_id)) {
                  map.set(o.order_id, { ...o, ...map.get(o.order_id) });
                } else {
                  map.set(o.order_id, o);
                }
              });
              const merged = Array.from(map.values());
              writeStorage(ORDERS_KEY, merged);
              return merged;
            });
          }
        }
      } catch {
        // ignore background sync errors
      }
    };

    syncOrders();
    const interval = setInterval(syncOrders, 10000);
    return () => {
      ignore = true;
      clearInterval(interval);
    };
  }, [merchant?.phone]);

  const setMerchant = (valueOrUpdater) => {
    setMerchantState((current) => {
      const next = typeof valueOrUpdater === 'function' ? valueOrUpdater(current) : valueOrUpdater;
      writeStorage(SESSION_KEY, next);
      return next;
    });
  };

  const setOrders = (valueOrUpdater) => {
    setOrdersState((current) => {
      const next = typeof valueOrUpdater === 'function' ? valueOrUpdater(current) : valueOrUpdater;
      writeStorage(ORDERS_KEY, next);
      return next;
    });
  };

  const handleLogin = (profile) => setMerchant(profile);
  const handleLogout = () => {
    clearStorage(SESSION_KEY);
    setMerchantState(null);
  };
  const addOrder = (order) => setOrders((current) => [order, ...current]);

  const screenOptions = useMemo(() => ({
    headerShadowVisible: false,
    headerStyle: { backgroundColor: colors.lightOrange },
    headerTintColor: colors.primaryOrange,
    headerTitleStyle: { fontWeight: '800' },
    contentStyle: { backgroundColor: colors.lightBackground },
  }), []);

  if (booting) {
    return (
      <SafeAreaView style={styles.authScreen}>
        <ActivityIndicator color={colors.primaryOrange} />
      </SafeAreaView>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={screenOptions}>
        {!merchant ? (
          <Stack.Screen name="Auth" options={{ headerShown: false }}>
            {(props) => <AuthScreen {...props} onLogin={handleLogin} />}
          </Stack.Screen>
        ) : (
          <>
            <Stack.Screen name="Main" options={{ headerShown: false }}>
              {(props) => (
                <MainTabsScreen
                  {...props}
                  merchant={merchant}
                  setMerchant={setMerchant}
                  orders={orders}
                  onLogout={handleLogout}
                />
              )}
            </Stack.Screen>
            <Stack.Screen name="DeviceSelection" component={DeviceSelectionScreen} options={{ title: 'Devices' }} />
            <Stack.Screen name="MerchantForm" options={{ title: 'Merchant Details' }}>
              {(props) => <MerchantFormScreen {...props} merchant={merchant} />}
            </Stack.Screen>
            <Stack.Screen name="ReviewOrder" component={ReviewOrderScreen} options={{ title: 'Review' }} />
            <Stack.Screen name="OtpVerification" options={{ title: 'OTP Verification' }}>
              {(props) => <OtpVerificationScreen {...props} onOrderCreated={addOrder} setMerchant={setMerchant} />}
            </Stack.Screen>
            <Stack.Screen name="OrderSuccess" component={OrderSuccessScreen} options={{ headerShown: false }} />
            <Stack.Screen name="OrderTracking" component={OrderTrackingScreen} options={{ title: 'Tracking' }} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
