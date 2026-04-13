export interface Product {
  id: string;
  name: string;
  sku: string;
  category: string;
  size: string;
  color: string;
  stock: number;
  initialStock: number;
  price: number;
}

export interface Transaction {
  id: string;
  date: string;
  channel: string;
  totalRevenue: number;
  customerId: string;
}
