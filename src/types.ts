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
  image_url?: string;
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
  status?: 'success' | 'cancelled' | 'pending_cancellation';
  cancel_reason?: string;
  cancelled_at?: string;
  cancelled_by?: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
  discount: number;
}

export interface ApprovalRequest {
  id: string;
  type: 'cancel_transaction' | 'restock_massal' | 'price_change' | 'export_csv';
  reference_id: string;
  requester_id: string;
  requester_email: string;
  details: any;
  status: 'pending' | 'approved' | 'rejected' | 'expired';
  created_at: string;
  resolved_at?: string;
  resolved_by?: string;
  notes?: string;
}

export interface ZakatInstitution {
  id: string;
  name: string;
  type: 'masjid' | 'yayasan' | 'lembaga';
  address: string;
  contact: string;
  bank_name: string;
  bank_account: string;
  bank_account_holder: string;
  sk_document_name: string;
  status: 'pending' | 'verified' | 'rejected' | 'suspended';
  created_at: string;
  created_by: string;
  resolved_at?: string;
  resolved_by?: string;
  notes?: string;
}

export interface ZakatDistribution {
  id: string;
  institution_id: string;
  institution_name: string;
  amount: number;
  date: string;
  notes: string;
  status: 'transferred';
  created_by: string;
}

export interface PromptRegistry {
  id: string;
  prompt_key: string;
  version: string;
  model: string;
  system_prompt: string;
  user_template: string;
  output_schema?: any;
  is_active: boolean;
  created_by?: string;
  created_at: string;
  updated_at: string;
  notes?: string;
}

export interface IntegrationLog {
  id: string;
  timestamp: string;
  provider: string;
  endpoint: string;
  status_code: number;
  latency_ms: number;
  success: boolean;
  error_code?: string;
  actor_id?: string;
}



