import { supabase } from './supabase';
import { Product, Transaction, CartItem } from '@/types';

export const fetchProducts = async (): Promise<Product[]> => {
  const { data, error } = await supabase.from('produk').select('*');
  if (error) {
    console.error('Error fetching products:', error);
    return [];
  }
  return data as Product[];
};

export const addProduct = async (productData: Omit<Product, 'created_at'>): Promise<Product> => {
  const { data, error } = await supabase.from('produk').insert([productData]).select().single();
  if (error) {
    console.error('Error adding product:', error);
    throw error;
  }
  return data as Product;
};

export const processCheckout = async (
  cartItems: CartItem[],
  channel: string,
  totalRevenue: number,
  adminFee: number,
  customerId?: string | null
) => {
  // 1. Create Transaction (returns the UUID)
  const now = new Date();
  const dateStr = now.toISOString().split('T')[0];
  const timeStr = now.toTimeString().split(' ')[0];
  const transactionId = `TRX-${now.getTime()}`; // Generate custom TEXT id since table expects TEXT

  const { data: newTrx, error: trxError } = await supabase
    .from('transaksi')
    .insert([{
      id: transactionId,
      date: dateStr,
      time: timeStr,
      channel: channel,
      total_revenue: totalRevenue,
      admin_fee: adminFee,
      customer_id: customerId || null
    }])
    .select()
    .single();

  if (trxError) throw trxError;

  // 2. Insert Transaction Items
  const itemsToInsert = cartItems.map((item, index) => ({
    transaction_id: newTrx.id,
    sku: item.product.sku,
    quantity: item.quantity,
    price: item.product.price,
    discount: item.discount || 0
  }));

  const { error: itemsError } = await supabase
    .from('transaksi_items')
    .insert(itemsToInsert);

  if (itemsError) throw itemsError;

  // 3. Update Product Stocks
  // Since we don't have RPC or bulk update, we do this sequentially
  for (const item of cartItems) {
    const newStock = item.product.stock - item.quantity;
    const { error: stockError } = await supabase
      .from('produk')
      .update({ stock: newStock })
      .eq('sku', item.product.sku);

    if (stockError) {
      console.error(`Failed to update stock for ${item.product.sku}`, stockError);
      // We log but don't strictly rollback everything since frontend MVP
    }
  }

  return newTrx as Transaction;
};

export const fetchRecentTransactions = async (): Promise<Transaction[]> => {
  const { data, error } = await supabase.from('transaksi').select('*').order('date', { ascending: false }).limit(5);
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
