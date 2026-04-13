import { supabase } from './supabase';
import { Product, Transaction } from '@/types';

export const fetchProducts = async (): Promise<Product[]> => {
  const { data, error } = await supabase.from('products').select('*');
  if (error) {
    console.error('Error fetching products:', error);
    return [];
  }
  return data as Product[];
};

export const fetchRecentTransactions = async (): Promise<Transaction[]> => {
  const { data, error } = await supabase.from('transactions').select('*').order('date', { ascending: false }).limit(5);
  if (error) {
    console.error('Error fetching transactions:', error);
    return [];
  }
  return data as Transaction[];
};

export const fetchDashboardStats = async () => {
  // Mock implementations for database stats unless standard tables exist
  return {
    totalRevenue: 61200000,
    totalProfit: 15250000,
    dailyTurnover: 1200000,
    orderVolume: 1284,
    avgOrderValue: 476000
  };
};
