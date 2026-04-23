import { Product, Transaction } from './types';

export const DUMMY_PRODUCTS: Product[] = [
  { sku: 'GM-ALZ-XL-RBL', name: 'Gamis Al-Zahra', category: 'Gamis', size: 'XL', color: 'Royal Blue', hpp: 300000, price: 450000, stock: 12, initial_stock: 50 },
  { sku: 'GM-ALZ-L-RBL', name: 'Gamis Al-Zahra', category: 'Gamis', size: 'L', color: 'Royal Blue', hpp: 300000, price: 450000, stock: 5, initial_stock: 50 },
  { sku: 'KM-MDN-L-GLD', name: 'Koko Modern', category: 'Koko', size: 'L', color: 'Gold', hpp: 200000, price: 350000, stock: 25, initial_stock: 100 },
  { sku: 'HJ-SLK-ALL-WHT', name: 'Hijab Silk', category: 'Hijab', size: 'All Size', color: 'White', hpp: 50000, price: 150000, stock: 80, initial_stock: 200 },
];

export const DUMMY_TRANSACTIONS: Transaction[] = [
  { id: 'TRX-101', date: '2026-04-07', time: '10:30:00', channel: 'Shopee', total_revenue: 450000, admin_fee: 10000, customer_id: 'CUST-001' },
  { id: 'TRX-102', date: '2026-04-07', time: '12:15:00', channel: 'Offline', total_revenue: 950000, admin_fee: 0, customer_id: 'CUST-002' },
  { id: 'TRX-103', date: '2026-04-06', time: '14:45:00', channel: 'TikTok Shop', total_revenue: 350000, admin_fee: 7000, customer_id: 'CUST-003' },
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
