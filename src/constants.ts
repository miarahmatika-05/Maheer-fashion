import { Product, Transaction } from './types';

export const DUMMY_PRODUCTS: Product[] = [
  { id: '1', name: 'Gamis Al-Zahra', sku: 'GM-ALZ-XL-RBL', category: 'Gamis', size: 'XL', color: 'Royal Blue', stock: 12, initialStock: 50, price: 450000 },
  { id: '2', name: 'Gamis Al-Zahra', sku: 'GM-ALZ-L-RBL', category: 'Gamis', size: 'L', color: 'Royal Blue', stock: 5, initialStock: 50, price: 450000 },
  { id: '3', name: 'Koko Modern', sku: 'KM-MDN-L-GLD', category: 'Koko', size: 'L', color: 'Gold', stock: 25, initialStock: 100, price: 350000 },
  { id: '4', name: 'Hijab Silk', sku: 'HJ-SLK-ALL-WHT', category: 'Hijab', size: 'All Size', color: 'White', stock: 80, initialStock: 200, price: 150000 },
];

export const DUMMY_TRANSACTIONS: Transaction[] = [
  { id: 'TRX-101', date: '2026-04-07', channel: 'Shopee', totalRevenue: 450000, customerId: 'CUST-001' },
  { id: 'TRX-102', date: '2026-04-07', channel: 'Offline Store', totalRevenue: 950000, customerId: 'CUST-002' },
  { id: 'TRX-103', date: '2026-04-06', channel: 'TikTok Shop', totalRevenue: 350000, customerId: 'CUST-003' },
];

export const SALES_TREND_DATA = [
  { name: 'Jan', revenue: 45000000, profit: 12000000 },
  { name: 'Feb', revenue: 52000000, profit: 15000000 },
  { name: 'Mar', revenue: 48000000, profit: 14000000 },
  { name: 'Apr', revenue: 61200000, profit: 18000000 },
];

export const CHANNEL_PERFORMANCE = [
  { name: 'Shopee', value: 45 },
  { name: 'Offline Store', value: 30 },
  { name: 'TikTok Shop', value: 15 },
  { name: 'Website', value: 10 },
];

export const SIZE_PERFORMANCE = [
  { size: 'S', sales: 120, stock: 40 },
  { size: 'M', sales: 250, stock: 60 },
  { size: 'L', sales: 300, stock: 45 },
  { size: 'XL', sales: 150, stock: 80 },
];
