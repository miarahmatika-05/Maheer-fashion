import { supabase } from './supabase';
import { Product, Transaction, CartItem, ApprovalRequest, ZakatInstitution, ZakatDistribution, PromptRegistry, IntegrationLog } from '@/types';
import { DUMMY_PRODUCTS, DUMMY_TRANSACTIONS } from '@/constants';

let isOfflineMode = false;

const isOffline = () => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('offline_mode') === 'true' || isOfflineMode;
  }
  return isOfflineMode;
};

const setOffline = (val: boolean) => {
  isOfflineMode = val;
  if (typeof window !== 'undefined') {
    localStorage.setItem('offline_mode', val ? 'true' : 'false');
  }
};

// Initialize localStorage data if empty
const initLocalStorage = () => {
  if (typeof window === 'undefined') return;
  if (!localStorage.getItem('products')) {
    localStorage.setItem('products', JSON.stringify(DUMMY_PRODUCTS));
  }
  if (!localStorage.getItem('transactions')) {
    // Add success status to dummy transactions
    const txs = DUMMY_TRANSACTIONS.map(t => ({ ...t, status: 'success' as const }));
    localStorage.setItem('transactions', JSON.stringify(txs));
  }
  if (!localStorage.getItem('approvals')) {
    localStorage.setItem('approvals', JSON.stringify([]));
  }
  if (!localStorage.getItem('audit_logs')) {
    localStorage.setItem('audit_logs', JSON.stringify([]));
  }
  if (!localStorage.getItem('zakat_institutions')) {
    localStorage.setItem('zakat_institutions', JSON.stringify([]));
  }
  if (!localStorage.getItem('zakat_distributions')) {
    localStorage.setItem('zakat_distributions', JSON.stringify([]));
  }
  if (!localStorage.getItem('ai_prompt_registry')) {
    const defaultPrompts: PromptRegistry[] = [
      {
        id: 'PRMPT-1',
        prompt_key: 'INV_RESTOCK_SUGGEST_v1',
        version: '1.0.0',
        model: 'claude-3-haiku',
        system_prompt: 'Anda adalah asisten manajemen inventaris untuk toko fashion "Maheer Fashion". Tugas Anda adalah menganalisis data penjualan historis dan memberikan saran restock yang tepat.\n\nAturan:\n- Berikan saran dalam Bahasa Indonesia yang singkat dan jelas.\n- Format output selalu dalam JSON yang valid.\n- Pertimbangkan tren musiman jika ada.\n- Jangan merekomendasikan stok lebih dari 3x rata-rata penjualan mingguan.',
        user_template: 'Berikut data penjualan 30 hari terakhir untuk SKU {sku}:\n- Total terjual: {units_sold} unit\n- Rata-rata per hari: {avg_daily} unit\n- Stok saat ini: {current_stock} unit\n- Lead time supplier: {lead_time_days} hari\n\nBerikan saran jumlah restock yang optimal dalam format JSON:\n{"recommended_qty": <number>, "reasoning": "<string>", "urgency": "low|medium|high"}',
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: 'PRMPT-2',
        prompt_key: 'DASH_INSIGHT_GENERATE_v1',
        version: '1.0.0',
        model: 'claude-3-haiku',
        system_prompt: 'Anda adalah analis bisnis senior untuk toko fashion retail Indonesia. Tugas Anda adalah membaca data penjualan dan memberikan insight bisnis yang actionable.\n\nAturan:\n- Gunakan Bahasa Indonesia yang profesional namun mudah dipahami.\n- Maksimal 3 poin insight utama.\n- Setiap insight harus disertai saran tindakan konkret.\n- Jangan menyebutkan angka tanpa konteks perbandingan.',
        user_template: 'Data ringkasan toko bulan {month} {year}:\n- Total revenue: Rp {total_revenue}\n- Total profit: Rp {total_profit}\n- Margin rata-rata: {margin_pct}%\n- Channel terbaik: {top_channel} ({top_channel_pct}%)\n- Produk terlaris: {top_product}\n- Produk stok hampir habis: {low_stock_count} SKU\n\nBandingkan dengan bulan lalu:\n- Revenue bulan lalu: Rp {prev_revenue} ({revenue_change}%)\n- Profit bulan lalu: Rp {prev_profit} ({profit_change}%)\n\nBerikan 3 insight bisnis utama beserta rekomendasi tindakan.',
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: 'PRMPT-3',
        prompt_key: 'OCR_PARSE_SUPPLIER_v1',
        version: '1.0.0',
        model: 'claude-3-haiku',
        system_prompt: 'Anda adalah sistem ekstraksi data dari nota pembelian supplier fashion Indonesia. Tugas Anda adalah mengekstrak informasi produk dari teks hasil OCR nota supplier.\n\nAturan:\n- Output SELALU dalam format JSON array valid, tanpa teks tambahan.\n- Jika field tidak ditemukan, gunakan null.\n- Normalisasi ukuran ke format: S, M, L, XL, XXL.\n- Normalisasi warna ke Bahasa Indonesia standar.\n- Jumlah unit selalu berupa integer positif.',
        user_template: 'Teks dari nota supplier berikut:\n---\n{ocr_raw_text}\n---\n\nEkstrak semua item produk dalam format JSON array:\n[\n  {\n    "product_name": string,\n    "sku_hint": string | null,\n    "size": string | null,\n    "color": string | null,\n    "quantity": integer,\n    "unit_cost": number | null\n  }\n]',
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: 'PRMPT-4',
        prompt_key: 'WA_BOT_INTENT_PARSE_v1',
        version: '1.0.0',
        model: 'claude-3-haiku',
        system_prompt: 'Anda adalah parser intent untuk WhatsApp Bot toko fashion. Klasifikasikan pesan pengguna ke salah satu intent berikut: STOCK_CHECK, REPORT_TODAY, REPORT_YESTERDAY, LAST_TRANSACTIONS, HELP, UNKNOWN\n\nOutput HANYA nama intent tanpa penjelasan tambahan.',
        user_template: 'Pesan pengguna: {message_text}',
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    ];
    localStorage.setItem('ai_prompt_registry', JSON.stringify(defaultPrompts));
  }
  if (!localStorage.getItem('integration_logs')) {
    localStorage.setItem('integration_logs', JSON.stringify([]));
  }
};

// Write an audit log entry
export const writeAuditLog = async (action: string, actor: string, details: string) => {
  const logEntry = {
    id: `LOG-${Date.now()}`,
    timestamp: new Date().toISOString(),
    action,
    actor,
    details
  };
  
  console.log('Audit Log:', logEntry);

  if (isOffline()) {
    initLocalStorage();
    const logs = JSON.parse(localStorage.getItem('audit_logs') || '[]');
    logs.unshift(logEntry);
    localStorage.setItem('audit_logs', JSON.stringify(logs));
    return logEntry;
  }

  try {
    const { data, error } = await supabase.from('audit_logs').insert([logEntry]).select().single();
    if (error) throw error;
    return data;
  } catch (err) {
    console.warn('Supabase audit log failed, falling back to local storage', err);
    setOffline(true);
    initLocalStorage();
    const logs = JSON.parse(localStorage.getItem('audit_logs') || '[]');
    logs.unshift(logEntry);
    localStorage.setItem('audit_logs', JSON.stringify(logs));
    return logEntry;
  }
};

export const fetchProducts = async (): Promise<Product[]> => {
  if (isOffline()) {
    initLocalStorage();
    return JSON.parse(localStorage.getItem('products') || '[]');
  }

  try {
    const { data, error } = await supabase.from('produk').select('*');
    if (error) throw error;
    return data as Product[];
  } catch (err) {
    console.warn('Supabase fetch products failed, falling back to local storage', err);
    setOffline(true);
    initLocalStorage();
    return JSON.parse(localStorage.getItem('products') || '[]');
  }
};

export const addProduct = async (productData: Omit<Product, 'created_at'>): Promise<Product> => {
  if (isOffline()) {
    initLocalStorage();
    const products = JSON.parse(localStorage.getItem('products') || '[]');
    const newProduct = { ...productData, created_at: new Date().toISOString() };
    products.unshift(newProduct);
    localStorage.setItem('products', JSON.stringify(products));
    await writeAuditLog('ADD_PRODUCT', 'Admin', `SKU: ${productData.sku}, Name: ${productData.name}`);
    return newProduct as Product;
  }

  try {
    const { data, error } = await supabase.from('produk').insert([productData]).select().single();
    if (error) throw error;
    await writeAuditLog('ADD_PRODUCT', 'Admin', `SKU: ${productData.sku}, Name: ${productData.name}`);
    return data as Product;
  } catch (err) {
    console.warn('Supabase add product failed, falling back to local storage', err);
    setOffline(true);
    initLocalStorage();
    const products = JSON.parse(localStorage.getItem('products') || '[]');
    const newProduct = { ...productData, created_at: new Date().toISOString() };
    products.unshift(newProduct);
    localStorage.setItem('products', JSON.stringify(products));
    await writeAuditLog('ADD_PRODUCT', 'Admin', `SKU: ${productData.sku}, Name: ${productData.name}`);
    return newProduct as Product;
  }
};

// Update product stock directly (for restock or cancellation restoration)
export const updateProductStockDirectly = async (sku: string, newStock: number, actor: string = 'System') => {
  if (isOffline()) {
    initLocalStorage();
    const products = JSON.parse(localStorage.getItem('products') || '[]');
    const updatedProducts = products.map((p: Product) => {
      if (p.sku === sku) {
        return { ...p, stock: newStock };
      }
      return p;
    });
    localStorage.setItem('products', JSON.stringify(updatedProducts));
    return;
  }

  try {
    const { error } = await supabase.from('produk').update({ stock: newStock }).eq('sku', sku);
    if (error) throw error;
  } catch (err) {
    console.warn('Supabase update stock failed, falling back to local storage', err);
    setOffline(true);
    initLocalStorage();
    const products = JSON.parse(localStorage.getItem('products') || '[]');
    const updatedProducts = products.map((p: Product) => {
      if (p.sku === sku) {
        return { ...p, stock: newStock };
      }
      return p;
    });
    localStorage.setItem('products', JSON.stringify(updatedProducts));
  }
};

// Update product price directly (for price updates)
export const updateProductPriceDirectly = async (sku: string, newPrice: number, actor: string = 'System') => {
  if (isOffline()) {
    initLocalStorage();
    const products = JSON.parse(localStorage.getItem('products') || '[]');
    const updatedProducts = products.map((p: Product) => {
      if (p.sku === sku) {
        return { ...p, price: newPrice };
      }
      return p;
    });
    localStorage.setItem('products', JSON.stringify(updatedProducts));
    return;
  }

  try {
    const { error } = await supabase.from('produk').update({ price: newPrice }).eq('sku', sku);
    if (error) throw error;
  } catch (err) {
    console.warn('Supabase update price failed, falling back to local storage', err);
    setOffline(true);
    initLocalStorage();
    const products = JSON.parse(localStorage.getItem('products') || '[]');
    const updatedProducts = products.map((p: Product) => {
      if (p.sku === sku) {
        return { ...p, price: newPrice };
      }
      return p;
    });
    localStorage.setItem('products', JSON.stringify(updatedProducts));
  }
};

export const processCheckout = async (
  cartItems: CartItem[],
  channel: string,
  totalRevenue: number,
  adminFee: number,
  customerId?: string | null,
  cashierEmail: string = 'kasir@maheer.dev'
) => {
  const now = new Date();
  const dateStr = now.toISOString().split('T')[0];
  const timeStr = now.toTimeString().split(' ')[0];
  const transactionId = `TRX-${now.getTime()}`;

  const newTrxObj: Transaction = {
    id: transactionId,
    date: dateStr,
    time: timeStr,
    channel: channel,
    total_revenue: totalRevenue,
    admin_fee: adminFee,
    customer_id: customerId || '',
    status: 'success',
    created_at: now.toISOString()
  };

  const itemsToInsert = cartItems.map((item) => ({
    transaction_id: transactionId,
    sku: item.product.sku,
    quantity: item.quantity,
    price: item.product.price,
    discount: item.discount || 0
  }));

  if (isOffline()) {
    initLocalStorage();
    
    // Save transaction
    const transactions = JSON.parse(localStorage.getItem('transactions') || '[]');
    transactions.unshift(newTrxObj);
    localStorage.setItem('transactions', JSON.stringify(transactions));

    // Save transaction items
    const allItems = JSON.parse(localStorage.getItem('transaction_items') || '[]');
    allItems.push(...itemsToInsert);
    localStorage.setItem('transaction_items', JSON.stringify(allItems));

    // Update stocks
    const products = JSON.parse(localStorage.getItem('products') || '[]');
    const updatedProducts = products.map((p: Product) => {
      const cartItem = cartItems.find(c => c.product.sku === p.sku);
      if (cartItem) {
        return { ...p, stock: p.stock - cartItem.quantity };
      }
      return p;
    });
    localStorage.setItem('products', JSON.stringify(updatedProducts));

    await writeAuditLog('CHECKOUT', cashierEmail, `TxID: ${transactionId}, Total: Rp ${totalRevenue.toLocaleString()}`);
    return newTrxObj;
  }

  try {
    const { data: newTrx, error: trxError } = await supabase
      .from('transaksi')
      .insert([{
        id: transactionId,
        date: dateStr,
        time: timeStr,
        channel: channel,
        total_revenue: totalRevenue,
        admin_fee: adminFee,
        customer_id: customerId || null,
        status: 'success'
      }])
      .select()
      .single();

    if (trxError) throw trxError;

    const { error: itemsError } = await supabase
      .from('transaksi_items')
      .insert(itemsToInsert);

    if (itemsError) throw itemsError;

    for (const item of cartItems) {
      const newStock = item.product.stock - item.quantity;
      await supabase.from('produk').update({ stock: newStock }).eq('sku', item.product.sku);
    }

    await writeAuditLog('CHECKOUT', cashierEmail, `TxID: ${transactionId}, Total: Rp ${totalRevenue.toLocaleString()}`);
    return newTrx as Transaction;
  } catch (err) {
    console.warn('Supabase checkout failed, falling back to local storage', err);
    setOffline(true);
    initLocalStorage();

    const transactions = JSON.parse(localStorage.getItem('transactions') || '[]');
    transactions.unshift(newTrxObj);
    localStorage.setItem('transactions', JSON.stringify(transactions));

    const allItems = JSON.parse(localStorage.getItem('transaction_items') || '[]');
    allItems.push(...itemsToInsert);
    localStorage.setItem('transaction_items', JSON.stringify(allItems));

    const products = JSON.parse(localStorage.getItem('products') || '[]');
    const updatedProducts = products.map((p: Product) => {
      const cartItem = cartItems.find(c => c.product.sku === p.sku);
      if (cartItem) {
        return { ...p, stock: p.stock - cartItem.quantity };
      }
      return p;
    });
    localStorage.setItem('products', JSON.stringify(updatedProducts));

    await writeAuditLog('CHECKOUT', cashierEmail, `TxID: ${transactionId}, Total: Rp ${totalRevenue.toLocaleString()}`);
    return newTrxObj;
  }
};

export const fetchRecentTransactions = async (): Promise<Transaction[]> => {
  if (isOffline()) {
    initLocalStorage();
    return JSON.parse(localStorage.getItem('transactions') || '[]');
  }

  try {
    const { data, error } = await supabase.from('transaksi').select('*').order('date', { ascending: false });
    if (error) throw error;
    // Map status fallback
    return (data || []).map(t => ({ ...t, status: t.status || 'success' })) as Transaction[];
  } catch (err) {
    console.warn('Supabase fetch transactions failed, falling back to local storage', err);
    setOffline(true);
    initLocalStorage();
    return JSON.parse(localStorage.getItem('transactions') || '[]');
  }
};

// Cancel transaction directly and restore stocks
export const cancelTransaction = async (
  transactionId: string,
  reason: string,
  actorEmail: string
): Promise<Transaction | null> => {
  console.log(`Cancelling transaction ${transactionId} by ${actorEmail} for: ${reason}`);

  if (isOffline()) {
    initLocalStorage();
    const transactions = JSON.parse(localStorage.getItem('transactions') || '[]');
    let targetTrx: Transaction | null = null;
    
    const updatedTransactions = transactions.map((t: Transaction) => {
      if (t.id === transactionId) {
        targetTrx = {
          ...t,
          status: 'cancelled',
          cancel_reason: reason,
          cancelled_at: new Date().toISOString(),
          cancelled_by: actorEmail
        };
        return targetTrx;
      }
      return t;
    });

    if (!targetTrx) return null;
    localStorage.setItem('transactions', JSON.stringify(updatedTransactions));

    // Restore stock. Let's find details.
    // If it's a dummy transaction, we can estimate details from CONSTANTS, or read local items if it was checked out locally.
    const localItems = JSON.parse(localStorage.getItem('transaction_items') || '[]');
    const trxItems = localItems.filter((item: any) => item.transaction_id === transactionId);

    const products = JSON.parse(localStorage.getItem('products') || '[]');
    
    if (trxItems.length > 0) {
      const updatedProducts = products.map((p: Product) => {
        const item = trxItems.find((ti: any) => ti.sku === p.sku);
        if (item) {
          return { ...p, stock: p.stock + item.quantity };
        }
        return p;
      });
      localStorage.setItem('products', JSON.stringify(updatedProducts));
    } else {
      // Fallback: if details not found, try to mock stock return (for dummy txs, return +1 to the first product matching name or similar, or just leave it)
      console.log('No local items found for cancellation, skipping stock restoration or returning default stock');
    }

    await writeAuditLog('CANCEL_TRANSACTION', actorEmail, `TxID: ${transactionId}, Reason: ${reason}`);
    return targetTrx;
  }

  try {
    // 1. Fetch transaction items to restore stock
    const { data: items, error: itemsErr } = await supabase
      .from('transaksi_items')
      .select('*')
      .eq('transaction_id', transactionId);

    if (itemsErr) throw itemsErr;

    // 2. Update transaction status
    const { data: updatedTrx, error: updateErr } = await supabase
      .from('transaksi')
      .update({
        status: 'cancelled',
        cancel_reason: reason,
        cancelled_at: new Date().toISOString(),
        cancelled_by: actorEmail
      })
      .eq('id', transactionId)
      .select()
      .single();

    if (updateErr) throw updateErr;

    // 3. Restore stocks
    if (items && items.length > 0) {
      for (const item of items) {
        // Fetch current stock
        const { data: prod } = await supabase.from('produk').select('stock').eq('sku', item.sku).single();
        if (prod) {
          await supabase.from('produk').update({ stock: prod.stock + item.quantity }).eq('sku', item.sku);
        }
      }
    }

    await writeAuditLog('CANCEL_TRANSACTION', actorEmail, `TxID: ${transactionId}, Reason: ${reason}`);
    return updatedTrx as Transaction;
  } catch (err) {
    console.warn('Supabase cancel transaction failed, falling back to local storage', err);
    setOffline(true);
    return cancelTransaction(transactionId, reason, actorEmail);
  }
};

// Create an approval request
export const createApprovalRequest = async (
  type: 'cancel_transaction' | 'restock_massal' | 'price_change' | 'export_csv',
  referenceId: string,
  requesterEmail: string,
  details: any
): Promise<ApprovalRequest> => {
  const now = new Date();
  const newRequest: ApprovalRequest = {
    id: `APR-${now.getTime()}`,
    type,
    reference_id: referenceId,
    requester_id: requesterEmail,
    requester_email: requesterEmail,
    details,
    status: 'pending',
    created_at: now.toISOString()
  };

  if (isOffline()) {
    initLocalStorage();
    const approvals = JSON.parse(localStorage.getItem('approvals') || '[]');
    approvals.unshift(newRequest);
    localStorage.setItem('approvals', JSON.stringify(approvals));

    // For transaction cancellations, we should also set the transaction status to 'pending_cancellation'
    if (type === 'cancel_transaction') {
      const transactions = JSON.parse(localStorage.getItem('transactions') || '[]');
      const updated = transactions.map((t: Transaction) => {
        if (t.id === referenceId) return { ...t, status: 'pending_cancellation' as const };
        return t;
      });
      localStorage.setItem('transactions', JSON.stringify(updated));
    }

    await writeAuditLog('CREATE_APPROVAL', requesterEmail, `Type: ${type}, Ref: ${referenceId}`);
    return newRequest;
  }

  try {
    const { data, error } = await supabase.from('approval_requests').insert([newRequest]).select().single();
    if (error) throw error;

    if (type === 'cancel_transaction') {
      await supabase.from('transaksi').update({ status: 'pending_cancellation' }).eq('id', referenceId);
    }

    await writeAuditLog('CREATE_APPROVAL', requesterEmail, `Type: ${type}, Ref: ${referenceId}`);
    return data as ApprovalRequest;
  } catch (err) {
    console.warn('Supabase create approval failed, falling back to local storage', err);
    setOffline(true);
    initLocalStorage();

    const approvals = JSON.parse(localStorage.getItem('approvals') || '[]');
    approvals.unshift(newRequest);
    localStorage.setItem('approvals', JSON.stringify(approvals));

    if (type === 'cancel_transaction') {
      const transactions = JSON.parse(localStorage.getItem('transactions') || '[]');
      const updated = transactions.map((t: Transaction) => {
        if (t.id === referenceId) return { ...t, status: 'pending_cancellation' as const };
        return t;
      });
      localStorage.setItem('transactions', JSON.stringify(updated));
    }

    await writeAuditLog('CREATE_APPROVAL', requesterEmail, `Type: ${type}, Ref: ${referenceId}`);
    return newRequest;
  }
};

// Fetch approval requests
export const fetchApprovalRequests = async (): Promise<ApprovalRequest[]> => {
  if (isOffline()) {
    initLocalStorage();
    return JSON.parse(localStorage.getItem('approvals') || '[]');
  }

  try {
    const { data, error } = await supabase.from('approval_requests').select('*').order('created_at', { ascending: false });
    if (error) throw error;
    return data as ApprovalRequest[];
  } catch (err) {
    console.warn('Supabase fetch approvals failed, falling back to local storage', err);
    setOffline(true);
    initLocalStorage();
    return JSON.parse(localStorage.getItem('approvals') || '[]');
  }
};

// Resolve approval request
export const resolveApprovalRequest = async (
  requestId: string,
  status: 'approved' | 'rejected',
  resolverEmail: string,
  notes: string = ''
): Promise<ApprovalRequest | null> => {
  console.log(`Resolving approval ${requestId} to ${status} by ${resolverEmail}`);

  if (isOffline()) {
    initLocalStorage();
    const approvals = JSON.parse(localStorage.getItem('approvals') || '[]');
    const target = approvals.find((req: ApprovalRequest) => req.id === requestId);
    if (!target) return null;

    const targetRequest: ApprovalRequest = {
      ...target,
      status,
      resolved_at: new Date().toISOString(),
      resolved_by: resolverEmail,
      notes
    };

    const updatedApprovals = approvals.map((req: ApprovalRequest) => 
      req.id === requestId ? targetRequest : req
    );

    localStorage.setItem('approvals', JSON.stringify(updatedApprovals));

    // Trigger action if approved
    if (status === 'approved') {
      if (targetRequest.type === 'cancel_transaction') {
        await cancelTransaction(targetRequest.reference_id, targetRequest.details.reason, targetRequest.requester_email);
      } else if (targetRequest.type === 'restock_massal') {
        // Restock massal
        const newStock = targetRequest.details.currentStock + targetRequest.details.quantity;
        await updateProductStockDirectly(targetRequest.reference_id, newStock, resolverEmail);
        await writeAuditLog('RESTOCK_APPROVED', resolverEmail, `SKU: ${targetRequest.reference_id}, Qty: ${targetRequest.details.quantity}`);
      } else if (targetRequest.type === 'price_change') {
        // Change price
        await updateProductPriceDirectly(targetRequest.reference_id, targetRequest.details.newPrice, resolverEmail);
        await writeAuditLog('PRICE_CHANGE_APPROVED', resolverEmail, `SKU: ${targetRequest.reference_id}, Price: Rp ${targetRequest.details.newPrice.toLocaleString()}`);
      } else if (targetRequest.type === 'export_csv') {
        await writeAuditLog('EXPORT_CSV_APPROVED', resolverEmail, `Approved CSV export request reference: ${targetRequest.reference_id}`);
      }
    } else {
      // If rejected and transaction cancellation, revert transaction status back to 'success'
      if (targetRequest.type === 'cancel_transaction') {
        const transactions = JSON.parse(localStorage.getItem('transactions') || '[]');
        const reverted = transactions.map((t: Transaction) => {
          if (t.id === targetRequest!.reference_id) return { ...t, status: 'success' as const };
          return t;
        });
        localStorage.setItem('transactions', JSON.stringify(reverted));
      }
    }

    await writeAuditLog('RESOLVE_APPROVAL', resolverEmail, `ReqID: ${requestId}, Status: ${status}, Notes: ${notes}`);
    return targetRequest;
  }

  try {
    const { data: req, error: selectErr } = await supabase.from('approval_requests').select('*').eq('id', requestId).single();
    if (selectErr) throw selectErr;

    const { data: updatedReq, error: updateErr } = await supabase
      .from('approval_requests')
      .update({
        status,
        resolved_at: new Date().toISOString(),
        resolved_by: resolverEmail,
        notes
      })
      .eq('id', requestId)
      .select()
      .single();

    if (updateErr) throw updateErr;

    if (status === 'approved') {
      if (req.type === 'cancel_transaction') {
        await cancelTransaction(req.reference_id, req.details.reason, req.requester_email);
      } else if (req.type === 'restock_massal') {
        const newStock = req.details.currentStock + req.details.quantity;
        await supabase.from('produk').update({ stock: newStock }).eq('sku', req.reference_id);
        await writeAuditLog('RESTOCK_APPROVED', resolverEmail, `SKU: ${req.reference_id}, Qty: ${req.details.quantity}`);
      } else if (req.type === 'price_change') {
        await supabase.from('produk').update({ price: req.details.newPrice }).eq('sku', req.reference_id);
        await writeAuditLog('PRICE_CHANGE_APPROVED', resolverEmail, `SKU: ${req.reference_id}, Price: Rp ${req.details.newPrice.toLocaleString()}`);
      } else if (req.type === 'export_csv') {
        await writeAuditLog('EXPORT_CSV_APPROVED', resolverEmail, `Approved CSV export request reference: ${req.reference_id}`);
      }
    } else {
      if (req.type === 'cancel_transaction') {
        await supabase.from('transaksi').update({ status: 'success' }).eq('id', req.reference_id);
      }
    }

    await writeAuditLog('RESOLVE_APPROVAL', resolverEmail, `ReqID: ${requestId}, Status: ${status}, Notes: ${notes}`);
    return updatedReq as ApprovalRequest;
  } catch (err) {
    console.warn('Supabase resolve approval failed, falling back to local storage', err);
    setOffline(true);
    return resolveApprovalRequest(requestId, status, resolverEmail, notes);
  }
};

export const fetchDashboardStats = async () => {
  // Read stats dynamically
  let txs: Transaction[] = [];
  let prods: Product[] = [];
  
  if (isOffline()) {
    initLocalStorage();
    txs = JSON.parse(localStorage.getItem('transactions') || '[]');
    prods = JSON.parse(localStorage.getItem('products') || '[]');
  } else {
    try {
      const { data: tData } = await supabase.from('transaksi').select('*');
      txs = tData || [];
      const { data: pData } = await supabase.from('produk').select('*');
      prods = pData || [];
    } catch {
      initLocalStorage();
      txs = JSON.parse(localStorage.getItem('transactions') || '[]');
      prods = JSON.parse(localStorage.getItem('products') || '[]');
    }
  }

  // Filter out cancelled transactions for stats
  const activeTxs = txs.filter(t => t.status !== 'cancelled');
  const totalRevenue = activeTxs.reduce((sum, t) => sum + t.total_revenue, 0);
  // Assume a fixed 25% profit margin for fallback database calculations
  const totalProfit = Math.floor(totalRevenue * 0.25);
  const dailyTurnover = activeTxs.length > 0 ? Math.floor(totalRevenue / 30) : 0;
  const orderVolume = activeTxs.length;
  const avgOrderValue = orderVolume > 0 ? Math.floor(totalRevenue / orderVolume) : 0;

  return {
    totalRevenue,
    totalProfit,
    dailyTurnover,
    orderVolume,
    avgOrderValue
  };
};

// Fetch Zakat Institutions
export const fetchZakatInstitutions = async (): Promise<ZakatInstitution[]> => {
  if (isOffline()) {
    initLocalStorage();
    return JSON.parse(localStorage.getItem('zakat_institutions') || '[]');
  }
  try {
    const { data, error } = await supabase.from('zakat_institutions').select('*').order('created_at', { ascending: false });
    if (error) throw error;
    return data as ZakatInstitution[];
  } catch (err) {
    console.warn('Supabase fetch institutions failed, falling back to local storage', err);
    setOffline(true);
    initLocalStorage();
    return JSON.parse(localStorage.getItem('zakat_institutions') || '[]');
  }
};

// Register Zakat Institution
export const registerZakatInstitution = async (
  instData: Omit<ZakatInstitution, 'id' | 'status' | 'created_at' | 'created_by'>,
  creatorEmail: string
): Promise<ZakatInstitution> => {
  const now = new Date();
  const newInst: ZakatInstitution = {
    ...instData,
    id: `INS-${now.getTime()}`,
    status: 'pending',
    created_at: now.toISOString(),
    created_by: creatorEmail
  };

  if (isOffline()) {
    initLocalStorage();
    const insts = JSON.parse(localStorage.getItem('zakat_institutions') || '[]');
    insts.unshift(newInst);
    localStorage.setItem('zakat_institutions', JSON.stringify(insts));
    await writeAuditLog('REGISTER_INSTITUTION', creatorEmail, `Name: ${instData.name}, Type: ${instData.type}`);
    return newInst;
  }

  try {
    const { data, error } = await supabase.from('zakat_institutions').insert([newInst]).select().single();
    if (error) throw error;
    await writeAuditLog('REGISTER_INSTITUTION', creatorEmail, `Name: ${instData.name}, Type: ${instData.type}`);
    return data as ZakatInstitution;
  } catch (err) {
    console.warn('Supabase register institution failed, falling back to local storage', err);
    setOffline(true);
    initLocalStorage();
    const insts = JSON.parse(localStorage.getItem('zakat_institutions') || '[]');
    insts.unshift(newInst);
    localStorage.setItem('zakat_institutions', JSON.stringify(insts));
    await writeAuditLog('REGISTER_INSTITUTION', creatorEmail, `Name: ${instData.name}, Type: ${instData.type}`);
    return newInst;
  }
};

// Resolve Zakat Institution (Verify or Reject)
export const resolveZakatInstitution = async (
  id: string,
  status: 'verified' | 'rejected',
  resolverEmail: string,
  notes: string = ''
): Promise<ZakatInstitution | null> => {
  if (isOffline()) {
    initLocalStorage();
    const insts = JSON.parse(localStorage.getItem('zakat_institutions') || '[]');
    const target = insts.find((ins: ZakatInstitution) => ins.id === id);
    if (!target) return null;

    const updatedInst: ZakatInstitution = {
      ...target,
      status,
      resolved_at: new Date().toISOString(),
      resolved_by: resolverEmail,
      notes
    };

    const updatedList = insts.map((ins: ZakatInstitution) => ins.id === id ? updatedInst : ins);
    localStorage.setItem('zakat_institutions', JSON.stringify(updatedList));
    await writeAuditLog('VERIFY_INSTITUTION', resolverEmail, `ID: ${id}, Status: ${status}, Notes: ${notes}`);
    return updatedInst;
  }

  try {
    const { data, error } = await supabase
      .from('zakat_institutions')
      .update({
        status,
        resolved_at: new Date().toISOString(),
        resolved_by: resolverEmail,
        notes
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    await writeAuditLog('VERIFY_INSTITUTION', resolverEmail, `ID: ${id}, Status: ${status}, Notes: ${notes}`);
    return data as ZakatInstitution;
  } catch (err) {
    console.warn('Supabase resolve institution failed, falling back to local storage', err);
    setOffline(true);
    return resolveZakatInstitution(id, status, resolverEmail, notes);
  }
};

// Suspend Zakat Institution
export const suspendZakatInstitution = async (id: string, actorEmail: string): Promise<ZakatInstitution | null> => {
  if (isOffline()) {
    initLocalStorage();
    const insts = JSON.parse(localStorage.getItem('zakat_institutions') || '[]');
    const target = insts.find((ins: ZakatInstitution) => ins.id === id);
    if (!target) return null;

    const updatedInst: ZakatInstitution = {
      ...target,
      status: 'suspended',
      notes: 'Suspended by Admin'
    };

    const updatedList = insts.map((ins: ZakatInstitution) => ins.id === id ? updatedInst : ins);
    localStorage.setItem('zakat_institutions', JSON.stringify(updatedList));
    await writeAuditLog('SUSPEND_INSTITUTION', actorEmail, `ID: ${id}`);
    return updatedInst;
  }

  try {
    const { data, error } = await supabase
      .from('zakat_institutions')
      .update({
        status: 'suspended',
        notes: 'Suspended by Admin'
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    await writeAuditLog('SUSPEND_INSTITUTION', actorEmail, `ID: ${id}`);
    return data as ZakatInstitution;
  } catch (err) {
    console.warn('Supabase suspend institution failed, falling back to local storage', err);
    setOffline(true);
    return suspendZakatInstitution(id, actorEmail);
  }
};

// Distribute Zakat
export const distributeZakat = async (
  instId: string,
  instName: string,
  amount: number,
  notes: string,
  actorEmail: string
): Promise<ZakatDistribution> => {
  const now = new Date();
  const newDist: ZakatDistribution = {
    id: `DST-${now.getTime()}`,
    institution_id: instId,
    institution_name: instName,
    amount,
    date: now.toISOString().split('T')[0],
    notes,
    status: 'transferred',
    created_by: actorEmail
  };

  if (isOffline()) {
    initLocalStorage();
    const dists = JSON.parse(localStorage.getItem('zakat_distributions') || '[]');
    dists.unshift(newDist);
    localStorage.setItem('zakat_distributions', JSON.stringify(dists));
    await writeAuditLog('DISTRIBUTE_ZAKAT', actorEmail, `To: ${instName}, Amount: Rp ${amount.toLocaleString()}`);
    return newDist;
  }

  try {
    const { data, error } = await supabase.from('zakat_distributions').insert([newDist]).select().single();
    if (error) throw error;
    await writeAuditLog('DISTRIBUTE_ZAKAT', actorEmail, `To: ${instName}, Amount: Rp ${amount.toLocaleString()}`);
    return data as ZakatDistribution;
  } catch (err) {
    console.warn('Supabase distribute zakat failed, falling back to local storage', err);
    setOffline(true);
    initLocalStorage();
    const dists = JSON.parse(localStorage.getItem('zakat_distributions') || '[]');
    dists.unshift(newDist);
    localStorage.setItem('zakat_distributions', JSON.stringify(dists));
    await writeAuditLog('DISTRIBUTE_ZAKAT', actorEmail, `To: ${instName}, Amount: Rp ${amount.toLocaleString()}`);
    return newDist;
  }
};

// Fetch Zakat Distributions
export const fetchZakatDistributions = async (): Promise<ZakatDistribution[]> => {
  if (isOffline()) {
    initLocalStorage();
    return JSON.parse(localStorage.getItem('zakat_distributions') || '[]');
  }
  try {
    const { data, error } = await supabase.from('zakat_distributions').select('*').order('date', { ascending: false });
    if (error) throw error;
    return data as ZakatDistribution[];
  } catch (err) {
    console.warn('Supabase fetch distributions failed, falling back to local storage', err);
    setOffline(true);
    initLocalStorage();
    return JSON.parse(localStorage.getItem('zakat_distributions') || '[]');
  }
};

// Fetch Audit Logs
export const fetchAuditLogs = async (): Promise<any[]> => {
  if (isOffline()) {
    initLocalStorage();
    return JSON.parse(localStorage.getItem('audit_logs') || '[]');
  }
  try {
    const { data, error } = await supabase.from('audit_logs').select('*').order('timestamp', { ascending: false });
    if (error) throw error;
    return data;
  } catch (err) {
    console.warn('Supabase fetch audit logs failed, falling back to local storage', err);
    setOffline(true);
    initLocalStorage();
    return JSON.parse(localStorage.getItem('audit_logs') || '[]');
  }
};

// Fetch an active prompt registry key
export const fetchActivePrompt = async (key: string): Promise<PromptRegistry | null> => {
  if (isOffline()) {
    initLocalStorage();
    const prompts = JSON.parse(localStorage.getItem('ai_prompt_registry') || '[]');
    return prompts.find((p: PromptRegistry) => p.prompt_key === key && p.is_active) || null;
  }

  try {
    const { data, error } = await supabase
      .from('ai_prompt_registry')
      .select('*')
      .eq('prompt_key', key)
      .eq('is_active', true)
      .maybeSingle();
    if (error) throw error;
    return data as PromptRegistry;
  } catch (err) {
    console.warn('Supabase fetch active prompt failed, falling back to local storage', err);
    initLocalStorage();
    const prompts = JSON.parse(localStorage.getItem('ai_prompt_registry') || '[]');
    return prompts.find((p: PromptRegistry) => p.prompt_key === key && p.is_active) || null;
  }
};

// Write integration log entry
export const writeIntegrationLog = async (
  provider: string,
  endpoint: string,
  statusCode: number,
  latencyMs: number,
  success: boolean,
  errorCode: string = ''
): Promise<IntegrationLog> => {
  const logEntry: IntegrationLog = {
    id: `INTLOG-${Date.now()}`,
    timestamp: new Date().toISOString(),
    provider,
    endpoint,
    status_code: statusCode,
    latency_ms: latencyMs,
    success,
    error_code: errorCode
  };

  if (isOffline()) {
    initLocalStorage();
    const logs = JSON.parse(localStorage.getItem('integration_logs') || '[]');
    logs.unshift(logEntry);
    localStorage.setItem('integration_logs', JSON.stringify(logs));
    return logEntry;
  }

  try {
    const { data, error } = await supabase.from('integration_logs').insert([logEntry]).select().single();
    if (error) throw error;
    return data as IntegrationLog;
  } catch (err) {
    console.warn('Supabase integration log write failed, falling back to local storage', err);
    initLocalStorage();
    const logs = JSON.parse(localStorage.getItem('integration_logs') || '[]');
    logs.unshift(logEntry);
    localStorage.setItem('integration_logs', JSON.stringify(logs));
    return logEntry;
  }
};

// Fetch integration logs
export const fetchIntegrationLogs = async (): Promise<IntegrationLog[]> => {
  if (isOffline()) {
    initLocalStorage();
    return JSON.parse(localStorage.getItem('integration_logs') || '[]');
  }

  try {
    const { data, error } = await supabase.from('integration_logs').select('*').order('timestamp', { ascending: false });
    if (error) throw error;
    return data as IntegrationLog[];
  } catch (err) {
    console.warn('Supabase fetch integration logs failed, falling back to local storage', err);
    initLocalStorage();
    return JSON.parse(localStorage.getItem('integration_logs') || '[]');
  }
};


