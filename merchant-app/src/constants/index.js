export const API_BASE = process.env.EXPO_PUBLIC_API_BASE || 'http://localhost:8000';
export const SESSION_KEY = 'smartbox_merchant_session';
export const ORDERS_KEY = 'smartbox_merchant_orders';
export const DEMO_OTP = '123456';

export const defaultMerchant = {
  name: 'Merchant User',
  email: 'merchant@smartbox.local',
  phone: '',
  photo: 'MU',
  shopName: 'Your Shop',
  address: 'Location not added',
};

export const providers = [
  {
    name: 'PhonePe',
    logo: 'P',
    tone: '#F57C00',
    description: 'Sound boxes and QR devices configured for PhonePe payments.',
  },
  {
    name: 'Google Pay',
    logo: 'G',
    tone: '#FFA726',
    description: 'Fast UPI acceptance for high-volume counters.',
  },
  {
    name: 'BharatPe',
    logo: 'B',
    tone: '#FB8C00',
    description: 'Merchant-first QR and POS hardware support.',
  },
  {
    name: 'Paytm',
    logo: 'P',
    tone: '#FFB74D',
    description: 'Reliable device setup for daily store transactions.',
  },
];

export const devices = [
  {
    name: 'Smart Sound Box',
    image: 'SB',
    description: 'Instant audio alerts for every successful payment.',
  },
  {
    name: 'QR Scanner',
    image: 'QS',
    description: 'Compact scanner for quick counter-side payment capture.',
  },
  {
    name: 'POS Machine',
    image: 'POS',
    description: 'Card and UPI acceptance in a single terminal.',
  },
  {
    name: 'NFC Device',
    image: 'NFC',
    description: 'Tap-to-pay support for modern checkout experiences.',
  },
  {
    name: 'QR Stand',
    image: 'QR',
    description: 'Durable static display for self-serve UPI payments.',
  },
];

export const categories = ['Grocery', 'Restaurant', 'Pharmacy', 'Electronics', 'Retail', 'Services'];

export const orderSteps = ['pending', 'assigned', 'accepted', 'out_for_delivery', 'delivered', 'installed'];

export const historyFilters = ['All', 'PhonePe', 'Google Pay', 'BharatPe', 'Paytm', 'Installed', 'Cancelled'];
