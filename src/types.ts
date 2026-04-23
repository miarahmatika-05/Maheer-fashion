export interface Product {
  sku: string;
  name: string;
  category: string;
  size: string;
  color: string;
  hpp: number;
  price: number;
  stock: number;
  initial_stock: number;
  created_at?: string;
}

export interface Transaction {
  id: string;
  date: string;
  time: string;
  channel: string;
  total_revenue: number;
  admin_fee: number;
  customer_id: string;
  created_at?: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
  discount: number;
}
