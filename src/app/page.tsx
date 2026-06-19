"use client";
import { useState, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { fetchProducts, fetchRecentTransactions, fetchDashboardStats, processCheckout } from '@/lib/supabaseService';
import { Product, Transaction, CartItem } from '@/types';
import { 
  LayoutDashboard, 
  Package, 
  ShoppingCart, 
  Users, 
  BarChart3, 
  TrendingUp, 
  ArrowUpRight, 
  ArrowDownRight,
  RefreshCcw,
  ShoppingBag,
  PieChart as PieChartIcon,
  Menu,
  X,
  ChevronRight,
  LogOut,
  Bell,
  AlertTriangle,
  Lightbulb,
  ArrowRight,
  Database,
  HeartHandshake,
  FileText,
  Plus,
  Minus,
  Trash2,
  Search,
  CheckCircle,
  BookOpen,
  Wallet,
  Loader2,
  Printer,
  CreditCard,
  Banknote,
  QrCode,
  Tag,
  ClipboardCheck,
  ShieldAlert,
  HardDrive,
  Camera,
  MessageSquare,
  Sparkles,
  Send,
  X as XIcon,
  Upload
} from 'lucide-react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  AreaChart, 
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  Legend
} from 'recharts';
import { motion, AnimatePresence } from 'motion/react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { ProductFormModal } from '@/components/ProductFormModal';
import { CSVImporterModal } from '@/components/CSVImporterModal';
import { cn } from '@/lib/utils';
import { 
  DUMMY_PRODUCTS, 
  DUMMY_TRANSACTIONS, 
  SALES_TREND_DATA, 
  CHANNEL_PERFORMANCE,
  SIZE_PERFORMANCE
} from '@/constants';

const COLORS = ['#5B7C99', '#D1B6A8', '#A3B18A', '#D9C5B2', '#B8B5D0'];

export default function App() {
  const router = useRouter();
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [session, setSession] = useState<any>(null);

  const [activeTab, setActiveTab] = useState('overview');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [isCsvModalOpen, setIsCsvModalOpen] = useState(false);
  const [selectedCustomerLocal, setSelectedCustomerLocal] = useState<any>(null);
  const [supabaseStatus, setSupabaseStatus] = useState<'connected' | 'error' | 'idle'>('idle');
  
  const [products, setProducts] = useState<Product[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  
  const [approvals, setApprovals] = useState<any[]>([]);
  const [systemSubTab, setSystemSubTab] = useState('health');
  const [healthData, setHealthData] = useState<any>(null);
  const [backupData, setBackupData] = useState<any>(null);
  const [retentionData, setRetentionData] = useState<any>(null);
  const [dbStats, setDbStats] = useState<{ totalRevenue: number, totalProfit: number, dailyTurnover: number, orderVolume: number, avgOrderValue: number } | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // AI & WhatsApp States
  const [isOcrLoading, setIsOcrLoading] = useState(false);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiInsights, setAiInsights] = useState<string[] | null>(null);
  
  // WhatsApp Widget State
  const [isWaOpen, setIsWaOpen] = useState(false);
  const [waMessages, setWaMessages] = useState<{sender: 'bot' | 'user', text: string}[]>([]);
  const [waInput, setWaInput] = useState('');

  // --- Dynamic Dashboard Data ---
  const dynamicSalesTrend = useMemo(() => {
    if (!transactions || transactions.length === 0) return SALES_TREND_DATA;
    
    const monthlyData: Record<string, { revenue: number, profit: number }> = {};
    
    transactions.forEach(t => {
      if (t.status === 'cancelled') return;
      const date = new Date(t.date);
      const monthName = date.toLocaleString('default', { month: 'short' }); 
      
      if (!monthlyData[monthName]) {
        monthlyData[monthName] = { revenue: 0, profit: 0 };
      }
      monthlyData[monthName].revenue += t.total_revenue;
      monthlyData[monthName].profit += Math.floor(t.total_revenue * 0.25); // Estimasi profit 25%
    });

    const monthsOrder = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const result = Object.keys(monthlyData).map(month => ({
      name: month,
      revenue: monthlyData[month].revenue,
      profit: monthlyData[month].profit
    }));
    
    result.sort((a, b) => monthsOrder.indexOf(a.name) - monthsOrder.indexOf(b.name));
    return result.length > 0 ? result : SALES_TREND_DATA;
  }, [transactions]);

  const dynamicChannelData = useMemo(() => {
    if (!transactions || transactions.length === 0) return CHANNEL_PERFORMANCE;
    
    const channelMap: Record<string, number> = {};
    transactions.forEach(t => {
      if (t.status === 'cancelled') return;
      channelMap[t.channel] = (channelMap[t.channel] || 0) + t.total_revenue;
    });
    
    const colorMap: Record<string, string> = {
      'Offline': '#000000',
      'Shopee': '#F97316',
      'TikTok Shop': '#111111',
      'WA': '#25D366'
    };
    
    const result = Object.keys(channelMap).map((channel) => ({
      name: channel,
      value: channelMap[channel],
      color: colorMap[channel] || '#888888'
    }));
    
    return result.length > 0 ? result : CHANNEL_PERFORMANCE;
  }, [transactions]);
  // ---------------------------------

  // Handler for OCR Simulation
  const handleOcrUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'restock' | 'payment') => {
    if (!e.target.files || e.target.files.length === 0) return;
    setIsOcrLoading(true);
    
    // Simulate API Call to /api/ocr
    try {
      await new Promise(r => setTimeout(r, 1500));
      if (type === 'payment') {
        alert('OCR Struk Berhasil! Terdeteksi Nominal: Rp 450.000, Cocok dengan keranjang.');
      } else {
        alert('OCR Nota Berhasil! Mengekstrak: 12x Gamis Al-Zahra (GM-ALZ-XL-RBL)');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsOcrLoading(false);
    }
  };

  // Handler for AI Insights
  const handleGenerateInsights = async () => {
    setIsAiLoading(true);
    try {
      // Simulate API Call to /api/ai/insights
      await new Promise(r => setTimeout(r, 2000));
      setAiInsights([
        "Gamis Al-Zahra XL menyumbang 40% penjualan hari ini, pertimbangkan restock tambahan.",
        "Penjualan dari TikTok Shop meningkat 15% dibanding minggu lalu, optimalkan campaign TikTok.",
        "Rata-rata transaksi kasir Offline hari ini Rp 450k, tawarkan bundle produk untuk upsell."
      ]);
    } catch (err) {
      console.error(err);
    } finally {
      setIsAiLoading(false);
    }
  };

  // Handler for WhatsApp Bot Webhook Simulation
  const handleSendWaMessage = async () => {
    if (!waInput.trim()) return;
    const userText = waInput;
    setWaMessages(prev => [...prev, { sender: 'user', text: userText }]);
    setWaInput('');
    
    try {
      // For standalone demo without env vars, we mock or call the local API
      const res = await fetch('/api/whatsapp/webhook', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userText,
          dbData: { products, transactions } // sending state for local logic
        })
      });
      const data = await res.json();
      if (data.success) {
        setWaMessages(prev => [...prev, { sender: 'bot', text: data.response }]);
      } else {
        setWaMessages(prev => [...prev, { sender: 'bot', text: 'Maaf, sistem bot sedang error.' }]);
      }
    } catch (err) {
      setWaMessages(prev => [...prev, { sender: 'bot', text: 'Koneksi ke bot terputus.' }]);
    }
  };

  useEffect(() => {
    async function checkSupabase() {
      try {
        const { error } = await supabase.from('produk').select('count', { count: 'exact', head: true });
        if (error) throw error;
        setSupabaseStatus('connected');
      } catch (err) {
        console.error('Supabase connection error:', err);
        setSupabaseStatus('error');
        setIsLoading(false);
      }
    }
    checkSupabase();
  }, []);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (!session) {
        router.push('/login');
      } else {
        const isAdmin = session?.user?.email?.toLowerCase().includes('naisha');
        if (!isAdmin) {
          setActiveTab('sales');
        }
        setIsAuthLoading(false);
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (!session) {
        router.push('/login');
      } else {
        const isAdmin = session?.user?.email?.toLowerCase().includes('naisha');
        if (!isAdmin) {
          setActiveTab('sales');
        }
        setIsAuthLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, [router]);

  useEffect(() => {
    if (supabaseStatus === 'connected') {
      const loadData = async () => {
        setIsLoading(true);
        try {
          const [pData, tData, sData] = await Promise.all([
            fetchProducts(),
            fetchRecentTransactions(),
            fetchDashboardStats()
          ]);
          
          if (pData.length > 0) setProducts(pData);
          if (tData.length > 0) setTransactions(tData);
          if (sData) setDbStats(sData);
        } catch (err) {
          console.error('Error loading Supabase data:', err);
        } finally {
          setIsLoading(false);
        }
      };
      loadData();
    } else if (supabaseStatus === 'error') {
      const lsTxs = localStorage.getItem('transactions');
      if (lsTxs) {
        let parsed = JSON.parse(lsTxs);
        let migrated = false;
        parsed = parsed.map((t: any) => {
          if (!t.customer_id) {
            migrated = true;
            return { ...t, customer_id: `CUST-${Math.floor(Math.random() * 900) + 100}` };
          }
          return t;
        });
        if (migrated) {
          localStorage.setItem('transactions', JSON.stringify(parsed));
        }
        setTransactions(parsed);
      } else {
        setTransactions(DUMMY_TRANSACTIONS);
      }
      setIsLoading(false);
    }
  }, [supabaseStatus]);

  const stats = useMemo(() => {
    const baseStats = dbStats && dbStats.orderVolume > 0 ? [
      { title: 'Total Revenue', value: `Rp ${(dbStats.totalRevenue / 1000000).toFixed(1)}M`, trend: '+12.5%', isPositive: true, icon: TrendingUp },
      { title: 'Omset Harian', value: `Rp ${(dbStats.dailyTurnover / 1000).toFixed(0)}k`, trend: 'Today', isPositive: true, icon: Wallet },
      { title: 'Total Profit', value: `Rp ${(dbStats.totalProfit / 1000000).toFixed(1)}M`, trend: '+8.2%', isPositive: true, icon: BarChart3 },
      { title: 'Zakat (2.5%)', value: `Rp ${((dbStats.totalProfit * 0.025) / 1000).toFixed(0)}k`, trend: 'Wajib', isPositive: true, icon: HeartHandshake },
    ] : [
      { title: 'Total Revenue', value: 'Rp 61.2M', trend: '+12.5%', isPositive: true, icon: TrendingUp },
      { title: 'Omset Harian', value: 'Rp 1.2M', trend: 'Today', isPositive: true, icon: Wallet },
      { title: 'Order Volume', value: '1,284', trend: '+5.2%', isPositive: true, icon: ShoppingCart },
      { title: 'Avg. Order Value', value: 'Rp 476k', trend: '+8.3%', isPositive: true, icon: ShoppingBag },
    ];
    return baseStats;
  }, [dbStats]);

  const handleProductAdded = (newProduct: Product) => {
    setProducts((prev) => [newProduct, ...prev]);
    setIsProductModalOpen(false);
  };

  // Cart States
  const [cart, setCart] = useState<CartItem[]>([]);
  const [posChannel, setPosChannel] = useState('Offline');
  const [paymentMethod, setPaymentMethod] = useState('Cash');
  const [discountPercent, setDiscountPercent] = useState<number>(0);
  const [cashReceived, setCashReceived] = useState<number | ''>('');
  const [isCheckoutModalOpen, setIsCheckoutModalOpen] = useState(false);
  const [isGlModalOpen, setIsGlModalOpen] = useState(false);
  const [showReceipt, setShowReceipt] = useState(false);
  const [lastTransaction, setLastTransaction] = useState<Transaction | null>(null);

  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [checkoutSuccess, setCheckoutSuccess] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const addToCart = (product: Product) => {
    if (product.stock <= 0) return; // Prevent adding out of stock
    setCart(prev => {
      const existing = prev.find(item => item.product.sku === product.sku);
      if (existing) {
        if (existing.quantity >= product.stock) return prev; // Cannot exceed stock
        return prev.map(item => item.product.sku === product.sku ? { ...item, quantity: item.quantity + 1 } : item);
      }
      return [...prev, { product, quantity: 1, discount: 0 }];
    });
  };

  const updateCartQty = (sku: string, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.product.sku === sku) {
        const newQty = item.quantity + delta;
        if (newQty > item.product.stock) return item; // Cannot exceed stock
        return { ...item, quantity: Math.max(0, newQty) }; // Allow 0 to handle removal later or just use filter
      }
      return item;
    }).filter(item => item.quantity > 0));
  };

  const removeFromCart = (sku: string) => {
    setCart(prev => prev.filter(item => item.product.sku !== sku));
  };

  // Cart Calculations
  const cartSubtotal = cart.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);
  const discountAmount = Math.floor(cartSubtotal * ((discountPercent || 0) / 100));
  const cartAdminFee = 0; // Removed per user request
  const cartTotal = cartSubtotal - discountAmount + cartAdminFee;
  const changeAmount = paymentMethod === 'Cash' && typeof cashReceived === 'number' ? cashReceived - cartTotal : 0;

  const handleCheckout = async () => {
    if (cart.length === 0) return;
    setIsCheckingOut(true);
    try {
      const newTrx = await processCheckout(cart, posChannel, cartSubtotal - discountAmount, cartAdminFee, `CUST-${Math.floor(Math.random() * 900) + 100}`);
      // Immediately reflect updates in local state
      setProducts(prev => prev.map(p => {
        const cartItem = cart.find(c => c.product.sku === p.sku);
        if (cartItem) return { ...p, stock: p.stock - cartItem.quantity };
        return p;
      }));
      setTransactions(prev => [newTrx, ...prev]);
      
      setLastTransaction(newTrx);
      setIsCheckoutModalOpen(false);
      setShowReceipt(true);
    } catch (error) {
      console.error('Checkout failed:', error);
      alert('Checkout failed! ' + (error as any).message);
    } finally {
      setIsCheckingOut(false);
    }
  };

  const resetCart = () => {
    setCart([]);
    setDiscountPercent(0);
    setCashReceived('');
    setShowReceipt(false);
  };

  const displayProducts = products.length > 0 ? products : DUMMY_PRODUCTS;
  const displayTransactions = transactions.length > 0 ? transactions : DUMMY_TRANSACTIONS;

  const inventoryAnalysis = useMemo(() => {
    return displayProducts.map(p => {
      const sold = p.initial_stock - p.stock;
      const str = (sold / p.initial_stock) * 100;
      return { ...p, sold, str };
    }).sort((a, b) => a.str - b.str);
  }, [displayProducts]);

  const underperformingItems = useMemo(() => {
    return inventoryAnalysis.filter(item => item.str < 30);
  }, [inventoryAnalysis]);

  const isSuperAdmin = session?.user?.email?.toLowerCase().includes('naisha');

  const handleCancelRequest = (trx: any) => {
    const newStatus = isSuperAdmin ? 'cancelled' : 'pending_cancellation';
    const updated = transactions.map((t: any) => t.id === trx.id ? { ...t, status: newStatus } : t);
    setTransactions(updated);
    localStorage.setItem('transactions', JSON.stringify(updated));
  };

  const handleApproveCancel = (trxId: string, approve: boolean) => {
    const newStatus = approve ? 'cancelled' : 'success';
    const updated = transactions.map((t: any) => t.id === trxId ? { ...t, status: newStatus } : t);
    setTransactions(updated);
    localStorage.setItem('transactions', JSON.stringify(updated));
  };

  const handleExportReport = () => {
    const headers = ['Product/SKU', 'Size', 'Color', 'Stock', 'STR (%)', 'Status'];
    const rows = inventoryAnalysis.map(item => [
      `${item.name} (${item.sku})`,
      item.size,
      item.color,
      item.stock,
      item.str.toFixed(1) + '%',
      item.str < 30 ? 'Underperforming' : item.str > 70 ? 'High Performing' : 'Normal'
    ]);
    const csvContent = "data:text/csv;charset=utf-8," 
      + headers.join(",") + "\n" 
      + rows.map(e => e.join(",")).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `inventory_analysis_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportZakat = () => {
    const profit = dbStats?.totalProfit || 0;
    const zakat = profit * 0.025;
    const headers = ['Keterangan', 'Nominal (Rp)'];
    const rows = [
      ['Total Keuntungan (Net Profit)', profit.toString()],
      ['Kewajiban Zakat Perniagaan (2.5%)', zakat.toString()],
      ['Laba Bersih Setelah Zakat', (profit - zakat).toString()]
    ];
    const csvContent = "data:text/csv;charset=utf-8," 
      + headers.join(",") + "\n" 
      + rows.map(e => e.join(",")).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `laporan_zakat_perniagaan_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const JOURNAL_ENTRIES = [
    { id: 1, date: 'April 07, 2026', type: 'sales', desc: 'Penjualan Gamis Al-Zahra (Shopee)', account: 'Kas / Bank', debit: 450000, credit: 0 },
    { id: 2, date: 'April 07, 2026', type: 'sales', desc: 'Penjualan Gamis Al-Zahra (Shopee)', account: 'Pendapatan Penjualan', debit: 0, credit: 450000 },
    { id: 3, date: 'April 06, 2026', type: 'purchase', desc: 'Pembelian Kain Silk (Supplier A)', account: 'Persediaan Barang', debit: 5000000, credit: 0 },
    { id: 4, date: 'April 06, 2026', type: 'purchase', desc: 'Pembelian Kain Silk (Supplier A)', account: 'Hutang Usaha', debit: 0, credit: 5000000 },
  ];

  const handleExportJournals = () => {
    const headers = ['Date', 'Description', 'Type', 'Account', 'Debit', 'Credit'];
    const rows = JOURNAL_ENTRIES.map(j => [
      `"${j.date}"`, `"${j.desc}"`, j.type === 'sales' ? 'Penjualan' : 'Pembelian', `"${j.account}"`, j.debit, j.credit
    ]);
    const csvContent = "data:text/csv;charset=utf-8," 
      + headers.join(",") + "\n" 
      + rows.map(e => e.join(",")).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `financial_journals_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Fetch system data when 'system' tab is active
  useEffect(() => {
    if (activeTab === 'system') {
      const fetchSysData = async () => {
        try {
          const [healthRes, backupRes, retentionRes] = await Promise.all([
            fetch('/api/health').catch(() => null),
            fetch('/api/backup-status').catch(() => null),
            fetch('/api/data-retention').catch(() => null),
          ]);
          
          if (healthRes?.ok) {
            const hData = await healthRes.json();
            setHealthData(hData);
          } else {
            setHealthData({ status: 'error', latency: 0 });
          }
          
          if (backupRes?.ok) {
            const bData = await backupRes.json();
            setBackupData({
              lastDrill: bData.disaster_recovery?.last_drill_date ? new Date(bData.disaster_recovery.last_drill_date).toLocaleDateString() : 'Unknown',
              status: bData.status
            });
          } else {
            setBackupData({ lastDrill: 'Error fetching', status: 'error' });
          }

          if (retentionRes?.ok) {
            const rData = await retentionRes.json();
            setRetentionData({ eligibleCount: rData.affected_count || 0 });
          } else {
            setRetentionData({ eligibleCount: 0 });
          }
        } catch (err) {
          console.error("Failed to fetch system data:", err);
        }
      };
      fetchSysData();
    }
  }, [activeTab]);

  const handleExecuteAnonymization = async () => {
    try {
      const res = await fetch('/api/data-retention', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        alert(data.message);
        setRetentionData({ eligibleCount: 0 });
      } else {
        alert(data.message || 'Error executing anonymization');
      }
    } catch (err) {
      alert('Network error executing anonymization');
    }
  };

  if (isAuthLoading) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center">
        <div className="w-20 h-20 bg-gold rounded-full flex items-center justify-center shadow-xl shadow-gold/20 mb-8 animate-pulse">
          <span className="font-serif text-4xl font-bold text-royal italic">M</span>
        </div>
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="w-6 h-6 text-royal animate-spin" />
          <p className="text-gray-500 font-medium">Verifying access...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-background font-sans text-foreground overflow-hidden">
      {/* Sidebar */}
      <AnimatePresence mode="wait">
        {isSidebarOpen && (
          <motion.aside
            initial={{ x: -280 }}
            animate={{ x: 0 }}
            exit={{ x: -280 }}
            className="w-72 bg-royal text-white flex flex-col z-50 shadow-xl"
          >
            <div className="p-8 flex items-center gap-3">
              <div className="w-10 h-10 bg-gold rounded-full flex items-center justify-center shadow-md">
                <span className="font-serif text-xl font-bold text-royal italic">M</span>
              </div>
              <div>
                <h1 className="font-serif text-xl font-bold tracking-tight italic">Maheer</h1>
                <p className="text-[10px] uppercase tracking-[0.2em] text-gold-soft opacity-90">Fashion Analytics</p>
              </div>
            </div>

            <nav className="flex-1 px-4 py-4 space-y-2 overflow-y-auto scrollbar-none">
              {isSuperAdmin && (
                <SidebarItem 
                  icon={LayoutDashboard} 
                  label="Dashboard" 
                  active={activeTab === 'overview'} 
                  onClick={() => setActiveTab('overview')} 
                />
              )}
              {isSuperAdmin && (
                <SidebarItem 
                  icon={Package} 
                  label="Inventory" 
                  active={activeTab === 'inventory'} 
                  onClick={() => setActiveTab('inventory')} 
                />
              )}
              {isSuperAdmin && (
                <SidebarItem 
                  icon={ShoppingBag} 
                  label="Pembelian" 
                  active={activeTab === 'purchasing'} 
                  onClick={() => setActiveTab('purchasing')} 
                />
              )}
              {isSuperAdmin && (
                <SidebarItem 
                  icon={HeartHandshake} 
                  label="Zakat" 
                  active={activeTab === 'zakat'} 
                  onClick={() => setActiveTab('zakat')} 
                />
              )}
              <SidebarItem 
                icon={ShoppingCart} 
                label="POS Kasir" 
                active={activeTab === 'sales'} 
                onClick={() => setActiveTab('sales')} 
              />
              <SidebarItem 
                icon={Users} 
                label="Customers" 
                active={activeTab === 'customers'} 
                onClick={() => setActiveTab('customers')} 
              />
              <SidebarItem 
                icon={FileText} 
                label="Transactions" 
                active={activeTab === 'transactions'} 
                onClick={() => setActiveTab('transactions')} 
              />
              {isSuperAdmin && (
                <SidebarItem 
                  icon={BarChart3} 
                  label="Reports" 
                  active={activeTab === 'reports'} 
                  onClick={() => setActiveTab('reports')} 
                />
              )}
              {isSuperAdmin && (
                <SidebarItem 
                  icon={ClipboardCheck} 
                  label="Approvals" 
                  active={activeTab === 'approvals'} 
                  onClick={() => setActiveTab('approvals')} 
                />
              )}
              {isSuperAdmin && (
                <SidebarItem 
                  icon={ShieldAlert} 
                  label="System & Security" 
                  active={activeTab === 'system'} 
                  onClick={() => setActiveTab('system')} 
                />
              )}
            </nav>

            <div className="p-6 border-t border-white/10">
              <div className="flex items-center gap-3 p-3 rounded-xl bg-white/5 mb-4">
                <div className="w-10 h-10 rounded-full bg-gold-soft/20 flex items-center justify-center">
                  <Users className="w-5 h-5 text-gold" />
                </div>
                <div className="flex-1 overflow-hidden">
                  <p className="text-sm font-medium truncate">{session?.user?.user_metadata?.full_name || 'Admin Maheer'}</p>
                  <p className="text-xs text-white/60 truncate">{session?.user?.email || 'admin@maheer.com'}</p>
                </div>
              </div>
              <div className="px-3 mb-4 space-y-2">
                <Badge variant="outline" className={cn(
                  "w-full justify-center py-1 border-white/20 text-[10px] uppercase tracking-wider",
                  supabaseStatus === 'connected' ? "text-emerald-400 border-emerald-400/30" : 
                  supabaseStatus === 'error' ? "text-rose-400 border-rose-400/30" : "text-white/40"
                )}>
                  <Database className="w-3 h-3 mr-2" />
                  Supabase: {supabaseStatus}
                </Badge>
                
                {dbStats && (
                  <Badge variant="outline" className="w-full justify-center py-1 border-gold/20 text-[10px] uppercase tracking-wider text-gold">
                    <HeartHandshake className="w-3 h-3 mr-2" />
                    Zakat Due: Rp {((dbStats.totalProfit) * 0.025).toLocaleString('id-ID')}
                  </Badge>
                )}
              </div>
              <Button 
                variant="ghost" 
                className="w-full justify-start text-white/70 hover:text-white hover:bg-white/10 gap-3"
                onClick={async () => {
                  await supabase.auth.signOut();
                  router.push('/login');
                }}
              >
                <LogOut className="w-4 h-4" />
                Logout
              </Button>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <main className="flex-1 flex flex-col relative overflow-hidden">
        {/* Header */}
        <header className="h-20 bg-white border-b border-gray-100 flex items-center justify-between px-8 z-40">
          <div className="flex items-center gap-4">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="text-royal"
            >
              {isSidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </Button>
            <h2 className="text-xl font-serif font-bold italic">
              {activeTab === 'overview' ? 'Dashboard Center' : 
               activeTab === 'inventory' ? 'Inventory Analysis' : 
               activeTab === 'zakat' ? 'Zakat Calculator' :
               activeTab === 'purchasing' ? 'Purchasing Center' :
               activeTab.charAt(0).toUpperCase() + activeTab.slice(1) + ' Center'}
            </h2>
          </div>

          <div className="flex items-center gap-6">
            <div className="relative">
              <Button variant="ghost" size="icon" className="text-royal relative">
                <Bell className="w-5 h-5" />
                <span className="absolute top-2 right-2 w-2 h-2 bg-gold rounded-full border-2 border-white"></span>
              </Button>
            </div>
            <div className="h-8 w-px bg-gray-200"></div>
            <div className="flex items-center gap-3">
              <div className="text-right hidden sm:block">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Current Date</p>
                <p className="text-sm font-bold">April 07, 2026</p>
              </div>
            </div>
          </div>
        </header>

        {/* Dashboard Content */}
        <ScrollArea className="flex-1 p-8">
          <div className="max-w-7xl mx-auto space-y-8">
            {activeTab === 'overview' && (
              <div className="space-y-8 animate-in fade-in-50 duration-300">
                {/* AI Insights Section */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                  <div>
                    <h3 className="text-2xl font-serif font-bold italic">Dashboard Overview</h3>
                    <p className="text-gray-500">Ringkasan performa bisnis dan analitik penjualan.</p>
                  </div>
                  {isSuperAdmin && (
                    <Button onClick={handleGenerateInsights} disabled={isAiLoading} className="bg-royal text-white flex items-center gap-2">
                      {isAiLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                      Generate AI Insights
                    </Button>
                  )}
                </div>
                
                {aiInsights && (
                  <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="bg-gradient-to-r from-royal/10 to-gold-soft/20 border border-royal/20 rounded-2xl p-6 mb-8">
                    <div className="flex items-center gap-2 mb-4">
                      <Sparkles className="text-royal w-5 h-5" />
                      <h4 className="font-bold text-royal">Rekomendasi Cerdas (AI)</h4>
                    </div>
                    <ul className="space-y-3">
                      {aiInsights.map((insight, idx) => (
                        <li key={idx} className="flex gap-3 text-sm text-gray-700">
                          <span className="flex-shrink-0 w-6 h-6 rounded-full bg-white flex items-center justify-center text-royal font-bold shadow-sm">{idx + 1}</span>
                          <span className="pt-0.5">{insight}</span>
                        </li>
                      ))}
                    </ul>
                  </motion.div>
                )}

                {/* Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {stats.map((stat, i) => (
                    <motion.div
                      key={stat.title}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.1 }}
                    >
                      <Card className="border-none shadow-sm hover:shadow-md transition-shadow">
                        <CardContent className="p-6">
                          <div className="flex justify-between items-start mb-4">
                            <div className="p-2 rounded-lg bg-royal/5">
                              <stat.icon className="w-5 h-5 text-royal" />
                            </div>
                            <Badge variant={stat.isPositive ? "default" : "destructive"} className={cn(
                              "bg-opacity-10 border-none",
                              stat.isPositive ? "bg-emerald-500/10 text-emerald-600" : "bg-rose-500/10 text-rose-600"
                            )}>
                              {stat.isPositive ? <ArrowUpRight className="w-3 h-3 mr-1" /> : <ArrowDownRight className="w-3 h-3 mr-1" />}
                              {stat.trend}
                            </Badge>
                          </div>
                          <p className="text-sm font-medium text-gray-500 mb-1">{stat.title}</p>
                          <h3 className="text-2xl font-bold tracking-tight">{stat.value}</h3>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </div>

                {/* Charts Section */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  <Card className="lg:col-span-2 border-none shadow-sm">
                    <CardHeader className="flex flex-row items-center justify-between">
                      <div>
                        <CardTitle className="font-serif italic text-xl">Sales Performance Trend</CardTitle>
                        <CardDescription>Revenue vs Profit over the last 4 months</CardDescription>
                      </div>
                    </CardHeader>
                    <CardContent className="h-[350px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={dynamicSalesTrend}>
                          <defs>
                            <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#5B7C99" stopOpacity={0.1}/>
                              <stop offset="95%" stopColor="#5B7C99" stopOpacity={0}/>
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                          <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#94a3b8'}} dy={10} />
                          <YAxis axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#94a3b8'}} tickFormatter={(value) => `Rp ${value/1000000}M`} />
                          <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
                          <Area type="monotone" dataKey="revenue" stroke="#5B7C99" strokeWidth={3} fillOpacity={1} fill="url(#colorRevenue)" />
                          <Line type="monotone" dataKey="profit" stroke="#D1B6A8" strokeWidth={2} dot={{ r: 4, fill: '#D1B6A8', strokeWidth: 2, stroke: '#fff' }} />
                        </AreaChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>

                  <Card className="border-none shadow-sm">
                    <CardHeader>
                      <CardTitle className="font-serif italic text-xl">Channel Performance</CardTitle>
                      <CardDescription>Sales distribution by channel</CardDescription>
                    </CardHeader>
                    <CardContent className="h-[350px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={dynamicChannelData}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={80}
                            paddingAngle={5}
                            dataKey="value"
                          >
                            {dynamicChannelData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip 
                            formatter={(value: number) => `Rp ${(value / 1000000).toFixed(1)}M`}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                      <div className="flex justify-center gap-4 mt-4">
                        {dynamicChannelData.map(channel => (
                          <div key={channel.name} className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: channel.color }}></div>
                            <span className="text-xs text-gray-600">{channel.name}</span>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Recent Transactions Table */}
                <Card className="border-none shadow-sm overflow-hidden">
                  <CardHeader>
                    <CardTitle className="font-serif italic text-xl">Recent Transactions</CardTitle>
                    <CardDescription>Latest sales across all channels</CardDescription>
                  </CardHeader>
                  <CardContent className="p-0">
                    <Table>
                      <TableHeader className="bg-royal/5">
                        <TableRow>
                          <TableHead className="font-bold text-royal">Transaction ID</TableHead>
                          <TableHead className="font-bold text-royal">Date</TableHead>
                          <TableHead className="font-bold text-royal">Channel</TableHead>
                          <TableHead className="font-bold text-royal text-right">Revenue</TableHead>
                          <TableHead className="font-bold text-royal">Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {displayTransactions.map((trx) => (
                          <TableRow key={trx.id}>
                            <TableCell className="font-mono text-xs font-bold">{trx.id}</TableCell>
                            <TableCell className="text-sm">{trx.date}</TableCell>
                            <TableCell><Badge variant="outline">{trx.channel}</Badge></TableCell>
                            <TableCell className="text-right font-bold">Rp {trx.total_revenue.toLocaleString('id-ID')}</TableCell>
                            <TableCell><Badge className="bg-emerald-100 text-emerald-700 border-none">Success</Badge></TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </div>
            )}

            {activeTab === 'inventory' && (
              <div className="space-y-8">
                {/* Inventory Analysis Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <h3 className="text-2xl font-serif font-bold italic">Size & Color Performance Analysis</h3>
                    <p className="text-gray-500">Identifying underperforming combinations and strategic improvements.</p>
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={handleExportReport} className="bg-royal text-white">Export Report</Button>
                  </div>
                </div>

                {/* Detailed Analysis Table */}
                <Card className="border-none shadow-sm">
                  <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                      <CardTitle className="font-serif italic text-xl">Performance Matrix</CardTitle>
                      <CardDescription>Detailed STR analysis by Size and Color combination</CardDescription>
                    </div>
                    <Button variant="outline" size="sm" className="gap-2 border-royal text-royal hover:bg-royal/5" onClick={() => setIsProductModalOpen(true)}>
                      <Plus className="w-4 h-4" />
                      Add New Product
                    </Button>
                  </CardHeader>
                  <CardContent className="p-0">
                    <Table>
                      <TableHeader className="bg-royal/5">
                        <TableRow>
                          <TableHead className="font-bold text-royal">Product / SKU</TableHead>
                          <TableHead className="font-bold text-royal text-center">Size</TableHead>
                          <TableHead className="font-bold text-royal text-center">Color</TableHead>
                          <TableHead className="font-bold text-royal text-right">Stock</TableHead>
                          <TableHead className="font-bold text-royal text-right">STR (%)</TableHead>
                          <TableHead className="font-bold text-royal">Action</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {inventoryAnalysis.map((item) => (
                          <TableRow key={item.sku} className={cn(item.str < 30 ? "bg-rose-50/30" : "")}>
                            <TableCell>
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-md bg-royal/10 flex items-center justify-center shrink-0 overflow-hidden">
                                  {item.image_url ? (
                                    <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" />
                                  ) : (
                                    <Package className="w-5 h-5 text-royal/40" />
                                  )}
                                </div>
                                <div>
                                  <div className="font-medium">{item.name}</div>
                                  <div className="text-[10px] font-mono text-gray-400 mb-1">{item.sku}</div>
                                  {item.str < 30 && (
                                    <div className="mt-1 flex items-start gap-1 text-[10px] text-rose-700 bg-rose-100/50 p-1.5 rounded border border-rose-100">
                                      <AlertTriangle className="w-3 h-3 shrink-0" />
                                      <span>Insight: Pergerakan stok lambat. Pertimbangkan diskon.</span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </TableCell>
                            <TableCell className="text-center"><Badge variant="outline">{item.size}</Badge></TableCell>
                            <TableCell className="text-center">
                              <div className="flex items-center justify-center gap-2">
                                <div className={cn(
                                  "w-3 h-3 rounded-full border border-gray-200",
                                  item.color === 'Royal Blue' ? "bg-royal" : 
                                  item.color === 'White' ? "bg-white" : 
                                  item.color === 'Gold' ? "bg-gold" : "bg-black"
                                )}></div>
                                <span className="text-xs">{item.color}</span>
                              </div>
                            </TableCell>
                            <TableCell className="text-right font-mono text-rose-600">{item.stock}</TableCell>
                            <TableCell className="text-right">
                              <div className="flex flex-col items-end">
                                <span className={cn(
                                  "font-bold",
                                  item.str > 70 ? "text-emerald-600" : item.str < 30 ? "text-rose-600" : "text-royal"
                                )}>{item.str.toFixed(1)}%</span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                className="text-royal hover:bg-royal/5 gap-1"
                                onClick={() => setActiveTab('purchasing')}
                              >
                                <Plus className="w-3 h-3" />
                                Add Stock
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>

                {/* Strategic Recommendations */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  <Card className="border-none shadow-sm bg-royal text-white">
                    <CardHeader>
                      <CardTitle className="font-serif italic text-xl flex items-center gap-2">
                        <Lightbulb className="w-5 h-5 text-gold" />
                        Strategic Recommendations
                      </CardTitle>
                      <CardDescription className="text-white/60">Actionable steps to improve STR for underperforming items.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <RecommendationItem 
                        title="Bundle Underperforming Sizes" 
                        desc="Pasangkan Gamis ukuran XL/L dengan Hijab Silk Gold sebagai 'Complete Look Bundle' dengan diskon 15%."
                      />
                      <RecommendationItem 
                        title="Targeted Social Media Ads" 
                        desc="Jalankan iklan TikTok Shop khusus menonjolkan 'Plus Size Elegance' untuk menghabiskan stok ukuran XL."
                      />
                      <RecommendationItem 
                        title="Channel Redistribution" 
                        desc="Pindahkan stok Koko Modern XL dari Shopee ke Offline Store karena pelanggan offline cenderung mencoba ukuran lebih besar."
                      />
                    </CardContent>
                  </Card>

                  <Card className="border-none shadow-sm">
                    <CardHeader>
                      <CardTitle className="font-serif italic text-xl">Size Performance Comparison</CardTitle>
                      <CardDescription>Sales volume vs Stock availability</CardDescription>
                    </CardHeader>
                    <CardContent className="h-[300px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={SIZE_PERFORMANCE}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                          <XAxis dataKey="size" axisLine={false} tickLine={false} />
                          <YAxis axisLine={false} tickLine={false} />
                          <Tooltip contentStyle={{ borderRadius: '12px', border: 'none' }} />
                          <Legend />
                          <Bar name="Sales Volume" dataKey="sales" fill="#5B7C99" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                </div>
              </div>
            )}

            {activeTab === 'purchasing' && (
              <div className="space-y-8">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <h3 className="text-2xl font-serif font-bold italic">Purchasing & Procurement</h3>
                    <p className="text-gray-500">Manage supplier invoices and stock procurement.</p>
                  </div>
                  <div className="flex gap-2">
                    <input type="file" id="nota-upload-purchasing" className="hidden" accept="image/*" onChange={(e) => handleOcrUpload(e, 'restock')} />
                    <Button onClick={() => document.getElementById('nota-upload-purchasing')?.click()} disabled={isOcrLoading} className="bg-royal text-white gap-2">
                      {isOcrLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                      Create Purchase Invoice (Scan)
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <Card className="border-none shadow-sm">
                    <CardContent className="p-6">
                      <p className="text-sm font-medium text-gray-500 mb-1">Total Purchases (MTD)</p>
                      <h3 className="text-2xl font-bold tracking-tight">Rp 24.5M</h3>
                    </CardContent>
                  </Card>
                  <Card className="border-none shadow-sm">
                    <CardContent className="p-6">
                      <p className="text-sm font-medium text-gray-500 mb-1">Pending Invoices</p>
                      <h3 className="text-2xl font-bold tracking-tight">3</h3>
                    </CardContent>
                  </Card>
                  <Card className="border-none shadow-sm">
                    <CardContent className="p-6">
                      <p className="text-sm font-medium text-gray-500 mb-1">Suppliers</p>
                      <h3 className="text-2xl font-bold tracking-tight">12</h3>
                    </CardContent>
                  </Card>
                </div>

                <Card className="border-none shadow-sm overflow-hidden">
                  <CardHeader>
                    <CardTitle className="font-serif italic text-xl">Recent Purchase Invoices</CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    <Table>
                      <TableHeader className="bg-royal/5">
                        <TableRow>
                          <TableHead className="font-bold text-royal">Invoice ID</TableHead>
                          <TableHead className="font-bold text-royal">Date</TableHead>
                          <TableHead className="font-bold text-royal">Supplier</TableHead>
                          <TableHead className="font-bold text-royal text-right">Total Cost</TableHead>
                          <TableHead className="font-bold text-royal">Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        <TableRow>
                          <TableCell className="font-mono text-xs font-bold">PUR-2026-001</TableCell>
                          <TableCell className="text-sm">April 05, 2026</TableCell>
                          <TableCell className="text-sm">Batik Trusmi</TableCell>
                          <TableCell className="text-right font-bold">Rp 12,500,000</TableCell>
                          <TableCell><Badge className="bg-emerald-100 text-emerald-700 border-none">Paid</Badge></TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell className="font-mono text-xs font-bold">PUR-2026-002</TableCell>
                          <TableCell className="text-sm">April 06, 2026</TableCell>
                          <TableCell className="text-sm">Textile Indah</TableCell>
                          <TableCell className="text-right font-bold">Rp 8,200,000</TableCell>
                          <TableCell><Badge className="bg-amber-100 text-amber-700 border-none">Pending</Badge></TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </div>
            )}

            {activeTab === 'sales' && (
              <div className="h-full flex flex-col">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                  <div>
                    <h3 className="text-2xl font-serif font-bold italic">Point of Sale (Kasir)</h3>
                    <p className="text-gray-500">Pilih produk dan selesaikan transaksi.</p>
                  </div>
                  {checkoutSuccess && (
                    <motion.div 
                      initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}
                      className="flex items-center gap-2 text-emerald-600 bg-emerald-50 px-4 py-2 rounded-lg font-medium"
                    >
                      <CheckCircle className="w-5 h-5" />
                      Transaksi Berhasil Dicatat!
                    </motion.div>
                  )}
                </div>

                <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
                  {/* Left Pane: Product Selection */}
                  <div className="space-y-4">
                    <div className="relative w-full">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input 
                        type="text" 
                        placeholder="Cari SKU atau Nama Produk..." 
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-royal/20 focus:border-royal transition-all"
                      />
                    </div>
                    
                    <div className="flex flex-col gap-3 h-[calc(100vh-14rem)] overflow-y-auto pr-2 pb-10">
                      {displayProducts
                        .filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()) || p.sku.toLowerCase().includes(searchQuery.toLowerCase()))
                        .map(p => {
                          const isInCart = cart.find(c => c.product.sku === p.sku);
                          const currentCartQty = isInCart ? isInCart.quantity : 0;
                          const availableStock = p.stock - currentCartQty;
                          
                          return (
                            <Card 
                              key={p.sku} 
                              className={cn(
                                "border-none shadow-sm overflow-hidden transition-all flex items-center", 
                                availableStock > 0 ? "hover:shadow-md cursor-pointer group" : "opacity-60 grayscale cursor-not-allowed"
                              )}
                              onClick={() => availableStock > 0 && addToCart(p)}
                            >
                              <div className="w-20 min-h-[5rem] h-full bg-royal/5 flex items-center justify-center shrink-0 overflow-hidden relative">
                                {p.image_url ? (
                                  <img src={p.image_url} alt={p.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform" />
                                ) : (
                                  <Package className="w-8 h-8 text-royal/30 group-hover:scale-110 transition-transform" />
                                )}
                              </div>
                              <div className="p-3 flex-1 min-w-0">
                                <div className="flex justify-between items-start mb-1">
                                  <Badge variant="outline" className="text-[10px]">{p.category}</Badge>
                                  <span className="text-xs font-bold text-royal">Rp {(p.price / 1000)}k</span>
                                </div>
                                <h4 className="font-bold text-sm truncate">{p.name}</h4>
                                <div className="flex items-center justify-between mt-2">
                                  <div className="flex gap-1">
                                    <Badge className="bg-gray-100 text-gray-600 border-none text-[10px]">{p.size}</Badge>
                                    <Badge className="bg-gray-100 text-gray-600 border-none text-[10px]">{p.color}</Badge>
                                  </div>
                                  <span className={cn("text-xs font-bold", availableStock > 0 ? "text-emerald-600" : "text-rose-500")}>
                                    Sisa: {availableStock}
                                  </span>
                                </div>
                              </div>
                            </Card>
                          );
                      })}
                    </div>
                  </div>

                  {/* Right Pane: Cart */}
                  <Card className="border-none shadow-lg sticky top-4 flex flex-col max-h-[calc(100vh-2rem)] overflow-y-auto">
                    <CardHeader className="border-b bg-gray-50/50 py-4">
                      <CardTitle className="font-serif italic text-lg flex items-center gap-2">
                        <ShoppingCart className="w-5 h-5" />
                        Cart ({cart.length})
                      </CardTitle>
                    </CardHeader>
                    <div className="flex-1 p-4 min-h-[150px]">
                      {cart.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-gray-400 space-y-3 mt-10">
                          <ShoppingCart className="w-12 h-12 opacity-20" />
                          <p>Keranjang masih kosong</p>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {cart.map((item, idx) => (
                            <motion.div 
                              initial={{ opacity: 0, x: 20 }} 
                              animate={{ opacity: 1, x: 0 }}
                              key={item.product.sku} 
                              className="flex items-center justify-between gap-3 p-3 bg-white border rounded-xl"
                            >
                              <div className="flex-1 min-w-0">
                                <h5 className="font-bold text-sm truncate">{item.product.name}</h5>
                                <div className="flex items-center text-xs text-gray-500 gap-2 mt-1">
                                  <span className="font-mono">{item.product.sku}</span>
                                  <span>•</span>
                                  <span>Rp {(item.product.price).toLocaleString()}</span>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <div className="flex items-center gap-2 bg-gray-50 rounded-lg p-1 border">
                                  <button 
                                    onClick={() => updateCartQty(item.product.sku, -1)}
                                    className="w-6 h-6 flex items-center justify-center rounded bg-white shadow-sm hover:bg-gray-100 text-gray-600"
                                  >
                                    <Minus className="w-3 h-3" />
                                  </button>
                                  <span className="w-6 text-center text-sm font-bold">{item.quantity}</span>
                                  <button 
                                    onClick={() => updateCartQty(item.product.sku, 1)}
                                    disabled={item.quantity >= item.product.stock}
                                    className="w-6 h-6 flex items-center justify-center rounded bg-white shadow-sm hover:bg-gray-100 text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                                  >
                                    <Plus className="w-3 h-3" />
                                  </button>
                                </div>
                                <button onClick={() => removeFromCart(item.product.sku)} className="p-1.5 text-gray-400 hover:text-rose-500 hover:bg-rose-50 rounded-md transition-colors">
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </motion.div>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="border-t bg-gray-50/50 p-4 space-y-4">
                      {/* Channels & Payment */}
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2 block">Channel</label>
                          <div className="grid grid-cols-2 gap-2">
                            {['Offline', 'Shopee', 'TikTok Shop', 'WA'].map(channel => (
                              <button
                                key={channel}
                                onClick={() => setPosChannel(channel)}
                                className={cn(
                                  "text-xs py-1.5 px-2 rounded-md border text-center transition-all",
                                  posChannel === channel ? "bg-royal text-white border-royal shadow-sm" : "bg-white text-gray-600 border-gray-200 hover:border-royal/50"
                                )}
                              >
                                {channel === 'TikTok Shop' ? 'TikTok' : channel}
                              </button>
                            ))}
                          </div>
                        </div>
                        <div>
                          <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2 block">Payment</label>
                          <div className="grid grid-cols-2 gap-2">
                            {['Cash', 'QRIS', 'Transfer'].map(method => (
                              <button
                                key={method}
                                onClick={() => setPaymentMethod(method)}
                                className={cn(
                                  "text-xs py-1.5 px-2 rounded-md border text-center transition-all flex items-center justify-center gap-1",
                                  paymentMethod === method ? "bg-royal text-white border-royal shadow-sm" : "bg-white text-gray-600 border-gray-200 hover:border-royal/50"
                                )}
                              >
                                {method === 'Cash' && <Banknote className="w-3 h-3" />}
                                {method === 'QRIS' && <QrCode className="w-3 h-3" />}
                                {method === 'Transfer' && <CreditCard className="w-3 h-3" />}
                                {method}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>

                      {paymentMethod === 'Transfer' && (
                        <div className="mt-3 p-3 border border-royal/20 bg-royal/5 rounded-xl space-y-3">
                          <div className="flex items-center gap-3">
                            <div className="bg-white p-2 rounded-lg border shadow-sm">
                              <CreditCard className="w-5 h-5 text-royal" />
                            </div>
                            <div>
                              <p className="text-[10px] text-gray-500 uppercase font-bold tracking-wider">BCA - Maheer Fashion</p>
                              <p className="font-mono font-bold text-gray-800">5735291651</p>
                            </div>
                          </div>
                          <div className="flex items-center justify-between border-t border-royal/10 pt-3 mt-1">
                            <span className="text-xs font-medium text-gray-600">Verifikasi Struk (AI):</span>
                            <input type="file" id="struk-upload" className="hidden" accept="image/*" onChange={(e) => handleOcrUpload(e, 'payment')} />
                            <Button size="sm" onClick={() => document.getElementById('struk-upload')?.click()} disabled={isOcrLoading} variant="outline" className="border-royal text-royal h-7 px-2 text-xs">
                              {isOcrLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Camera className="w-3 h-3 mr-1" />} Scan Bukti
                            </Button>
                          </div>
                        </div>
                      )}

                      {paymentMethod === 'QRIS' && (
                        <div className="mt-3 p-4 border border-royal/20 bg-royal/5 rounded-xl flex flex-col items-center justify-center space-y-2">
                          <div className="bg-white p-2 rounded-lg shadow-sm border border-gray-100">
                             <QrCode className="w-24 h-24 text-gray-800" />
                          </div>
                          <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Scan QRIS untuk Membayar</p>
                        </div>
                      )}

                      {/* Discount Input */}
                      <div>
                        <div className="flex items-center gap-2">
                          <Tag className="w-4 h-4 text-gray-400" />
                          <label className="text-xs font-bold text-gray-600">Discount (%)</label>
                        </div>
                        <input 
                          type="number" 
                          min="0"
                          max="100"
                          value={discountPercent || ''}
                          onChange={(e) => setDiscountPercent(Number(e.target.value))}
                          placeholder="0"
                          className="w-full mt-1 rounded-lg border border-gray-300 p-2 text-sm focus:border-royal focus:outline-none focus:ring-1 focus:ring-royal bg-white"
                        />
                      </div>

                      <div className="space-y-2 pt-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-500">Subtotal</span>
                          <span className="font-bold">Rp {cartSubtotal.toLocaleString()}</span>
                        </div>
                        {discountAmount > 0 && (
                          <div className="flex justify-between text-sm text-emerald-600">
                            <span>Discount ({discountPercent}%)</span>
                            <span className="font-bold">- Rp {discountAmount.toLocaleString()}</span>
                          </div>
                        )}
                        {cartAdminFee > 0 && (
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-500">Admin Fee (3%)</span>
                            <span className="font-bold text-rose-500">Rp {cartAdminFee.toLocaleString()}</span>
                          </div>
                        )}
                        <Separator className="my-2" />
                        <div className="flex justify-between items-end">
                          <span className="font-bold text-gray-700">Total</span>
                          <span className="text-2xl font-bold text-royal">Rp {cartTotal.toLocaleString()}</span>
                        </div>
                      </div>

                      <Button 
                        className="w-full bg-royal text-white hover:bg-royal/90 py-6 text-lg rounded-xl shadow-lg shadow-royal/20"
                        disabled={cart.length === 0}
                        onClick={() => setIsCheckoutModalOpen(true)}
                      >
                        Checkout Order
                      </Button>
                    </div>
                  </Card>
                </div>
              </div>
            )}

            {/* Modals for Checkout and Receipt */}
            <AnimatePresence>
              {isGlModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="bg-white rounded-3xl p-6 w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden shadow-2xl"
                  >
                    <div className="flex justify-between items-center mb-6">
                      <div>
                        <h3 className="text-2xl font-serif font-bold italic text-gray-900">General Ledger</h3>
                        <p className="text-gray-500 text-sm">Buku Besar Akuntansi (Simplified)</p>
                      </div>
                      <button onClick={() => setIsGlModalOpen(false)} className="p-2 hover:bg-gray-100 rounded-full text-gray-400 hover:text-gray-600 transition-colors">
                        <X className="w-6 h-6" />
                      </button>
                    </div>
                    <div className="flex-1 overflow-y-auto space-y-6 pr-2">
                      {Array.from(new Set(JOURNAL_ENTRIES.map(j => j.account))).map(account => {
                        const entries = JOURNAL_ENTRIES.filter(j => j.account === account);
                        const tDebit = entries.reduce((sum, j) => sum + j.debit, 0);
                        const tCredit = entries.reduce((sum, j) => sum + j.credit, 0);
                        return (
                          <Card key={account} className="border-gray-200 overflow-hidden shadow-sm">
                            <CardHeader className="bg-royal/5 py-3 px-4 border-b border-gray-100">
                              <CardTitle className="text-lg font-bold text-royal flex items-center gap-2">
                                <BookOpen className="w-4 h-4" />
                                {account}
                              </CardTitle>
                            </CardHeader>
                            <CardContent className="p-0">
                              <Table>
                                <TableHeader className="bg-gray-50">
                                  <TableRow>
                                    <TableHead className="w-32 font-bold text-gray-600">Tanggal</TableHead>
                                    <TableHead className="font-bold text-gray-600">Keterangan</TableHead>
                                    <TableHead className="text-right font-bold text-gray-600">Debit</TableHead>
                                    <TableHead className="text-right font-bold text-gray-600">Kredit</TableHead>
                                  </TableRow>
                                </TableHeader>
                                <TableBody>
                                  {entries.map((j, i) => (
                                    <TableRow key={i}>
                                      <TableCell className="text-xs text-gray-600">{j.date}</TableCell>
                                      <TableCell className="text-xs font-medium">{j.desc}</TableCell>
                                      <TableCell className="text-xs text-right font-mono text-emerald-600">{j.debit > 0 ? `Rp ${j.debit.toLocaleString('id-ID')}` : '-'}</TableCell>
                                      <TableCell className="text-xs text-right font-mono text-rose-600">{j.credit > 0 ? `Rp ${j.credit.toLocaleString('id-ID')}` : '-'}</TableCell>
                                    </TableRow>
                                  ))}
                                  <TableRow className="bg-gray-50 font-bold border-t border-gray-200">
                                    <TableCell colSpan={2} className="text-right text-gray-600">Total Mutasi:</TableCell>
                                    <TableCell className="text-right text-emerald-600 font-mono">Rp {tDebit.toLocaleString('id-ID')}</TableCell>
                                    <TableCell className="text-right text-rose-600 font-mono">Rp {tCredit.toLocaleString('id-ID')}</TableCell>
                                  </TableRow>
                                </TableBody>
                              </Table>
                            </CardContent>
                          </Card>
                        )
                      })}
                    </div>
                  </motion.div>
                </div>
              )}
              {isCheckoutModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col max-h-[90vh]"
                  >
                    <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-royal text-white">
                      <h3 className="font-serif italic text-xl font-bold">Payment Details</h3>
                      <button onClick={() => setIsCheckoutModalOpen(false)} className="text-white/70 hover:text-white">
                        <X className="w-5 h-5" />
                      </button>
                    </div>
                    <div className="p-6 overflow-y-auto space-y-6">
                      <div className="flex justify-between items-center bg-royal/5 p-4 rounded-xl border border-royal/10">
                        <span className="text-gray-600 font-medium">Total Amount</span>
                        <span className="text-3xl font-bold text-royal">Rp {cartTotal.toLocaleString()}</span>
                      </div>

                      <div className="space-y-3">
                        <label className="text-sm font-bold text-gray-700">Payment Method: <span className="text-royal">{paymentMethod}</span></label>
                        
                        {paymentMethod === 'Cash' && (
                          <div className="space-y-4">
                            <div>
                              <label className="text-xs text-gray-500 mb-1 block">Amount Received (Rp)</label>
                              <input 
                                type="number" 
                                value={cashReceived}
                                onChange={(e) => setCashReceived(e.target.value ? Number(e.target.value) : '')}
                                className="w-full text-lg p-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-royal focus:border-royal transition-all"
                                placeholder="e.g. 500000"
                                autoFocus
                              />
                            </div>
                            
                            {typeof cashReceived === 'number' && cashReceived >= cartTotal && (
                              <div className="flex justify-between items-center p-4 bg-emerald-50 text-emerald-700 rounded-xl border border-emerald-100">
                                <span className="font-medium">Change Due:</span>
                                <span className="text-xl font-bold">Rp {changeAmount.toLocaleString()}</span>
                              </div>
                            )}
                            {typeof cashReceived === 'number' && cashReceived > 0 && cashReceived < cartTotal && (
                              <div className="flex justify-between items-center p-3 bg-rose-50 text-rose-700 rounded-xl border border-rose-100 text-sm">
                                <span className="font-medium">Insufficient funds</span>
                                <span>Need Rp {(cartTotal - cashReceived).toLocaleString()} more</span>
                              </div>
                            )}
                          </div>
                        )}

                        {paymentMethod !== 'Cash' && (
                          <div className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-gray-200 rounded-xl bg-gray-50 text-gray-500">
                            {paymentMethod === 'QRIS' ? <QrCode className="w-12 h-12 mb-3 opacity-20" /> : <CreditCard className="w-12 h-12 mb-3 opacity-20" />}
                            <p className="text-center text-sm">Awaiting {paymentMethod} payment confirmation...</p>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="p-6 border-t bg-gray-50">
                      <Button 
                        className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-6 text-lg rounded-xl shadow-lg shadow-emerald-600/20"
                        disabled={isCheckingOut || (paymentMethod === 'Cash' && (typeof cashReceived !== 'number' || cashReceived < cartTotal))}
                        onClick={handleCheckout}
                      >
                        {isCheckingOut ? <Loader2 className="w-6 h-6 animate-spin" /> : 'Confirm Payment'}
                      </Button>
                    </div>
                  </motion.div>
                </div>
              )}

              {showReceipt && lastTransaction && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
                  <motion.div 
                    initial={{ opacity: 0, y: 50 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 50 }}
                    className="bg-white rounded-t-xl rounded-b-sm shadow-2xl w-full max-w-sm overflow-hidden flex flex-col relative"
                  >
                    {/* Decorative Receipt Jagged Bottom (purely CSS visual trick if needed, or simple padding) */}
                    <div className="p-8 text-center border-b-2 border-dashed border-gray-200">
                      <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
                        <CheckCircle className="w-8 h-8" />
                      </div>
                      <h2 className="font-serif italic text-2xl font-bold text-gray-900 mb-1">Maheer Fashion</h2>
                      <p className="text-gray-500 text-xs">Jalan Jendral Sudirman No. 123</p>
                      <p className="text-gray-500 text-xs mb-4">Telp: 0812-3456-7890</p>
                      
                      <div className="text-left text-xs font-mono text-gray-500 mb-4 grid grid-cols-2 gap-1">
                        <span>Receipt No:</span> <span className="text-right text-gray-800">{lastTransaction.id}</span>
                        <span>Date:</span> <span className="text-right text-gray-800">{lastTransaction.date}</span>
                        <span>Cashier:</span> <span className="text-right text-gray-800">Admin</span>
                      </div>
                    </div>

                    <div className="p-6 bg-gray-50/50">
                      <div className="space-y-3 mb-4">
                        {cart.map((item, idx) => (
                          <div key={idx} className="flex justify-between text-xs">
                            <div className="flex-1">
                              <p className="font-bold text-gray-800">{item.product.name}</p>
                              <p className="text-gray-500">{item.quantity} x Rp {item.product.price.toLocaleString()}</p>
                            </div>
                            <span className="font-bold text-gray-800">Rp {(item.quantity * item.product.price).toLocaleString()}</span>
                          </div>
                        ))}
                      </div>

                      <Separator className="my-3 border-dashed" />
                      
                      <div className="space-y-1 text-xs">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Subtotal</span>
                          <span className="font-bold text-gray-800">Rp {cartSubtotal.toLocaleString()}</span>
                        </div>
                        {discountAmount > 0 && (
                          <div className="flex justify-between">
                            <span className="text-gray-600">Discount</span>
                            <span className="font-bold text-gray-800">-Rp {discountAmount.toLocaleString()}</span>
                          </div>
                        )}
                        {cartAdminFee > 0 && (
                          <div className="flex justify-between">
                            <span className="text-gray-600">Fee ({posChannel})</span>
                            <span className="font-bold text-gray-800">Rp {cartAdminFee.toLocaleString()}</span>
                          </div>
                        )}
                      </div>

                      <Separator className="my-3 border-dashed" />

                      <div className="flex justify-between items-center mb-1">
                        <span className="font-bold text-gray-800">Total</span>
                        <span className="text-lg font-bold text-gray-900">Rp {cartTotal.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-gray-600">Payment ({paymentMethod})</span>
                        <span className="font-bold text-gray-800">Rp {paymentMethod === 'Cash' ? (cashReceived || cartTotal).toLocaleString() : cartTotal.toLocaleString()}</span>
                      </div>
                      {paymentMethod === 'Cash' && changeAmount > 0 && (
                        <div className="flex justify-between items-center text-xs mt-1">
                          <span className="text-gray-600">Change</span>
                          <span className="font-bold text-gray-800">Rp {changeAmount.toLocaleString()}</span>
                        </div>
                      )}
                    </div>
                    
                    <div className="p-6 bg-white grid grid-cols-2 gap-3">
                      <Button variant="outline" className="w-full gap-2 text-royal border-royal/30 hover:bg-royal/5" onClick={() => window.print()}>
                        <Printer className="w-4 h-4" />
                        Print
                      </Button>
                      <Button className="w-full bg-royal hover:bg-royal/90 text-white" onClick={resetCart}>
                        New Order
                      </Button>
                    </div>
                  </motion.div>
                </div>
              )}
            </AnimatePresence>

            {activeTab === 'reports' && (
              <div className="space-y-8">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <h3 className="text-2xl font-serif font-bold italic">Financial Journals</h3>
                    <p className="text-gray-500">Accounting records for fashion business operations.</p>
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={() => setIsGlModalOpen(true)} variant="outline" className="border-royal text-royal gap-2">
                      <BookOpen className="w-4 h-4" />
                      General Ledger
                    </Button>
                    <Button onClick={() => setIsCsvModalOpen(true)} variant="outline" className="border-emerald-600 text-emerald-600 gap-2">
                      <Database className="w-4 h-4" />
                      Import CSV
                    </Button>
                    <Button onClick={handleExportJournals} className="bg-royal text-white">Export Journals</Button>
                  </div>
                </div>

                <Tabs defaultValue="all" className="w-full">
                  <TabsList className="bg-royal/5 p-1 rounded-xl mb-6">
                    <TabsTrigger value="all" className="rounded-lg data-[state=active]:bg-white data-[state=active]:text-royal">All Journals</TabsTrigger>
                    <TabsTrigger value="sales" className="rounded-lg data-[state=active]:bg-white data-[state=active]:text-royal">Sales Journal</TabsTrigger>
                    <TabsTrigger value="purchase" className="rounded-lg data-[state=active]:bg-white data-[state=active]:text-royal">Purchase Journal</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="all">
                    <Card className="border-none shadow-sm overflow-hidden">
                      <CardContent className="p-0">
                        <Table>
                          <TableHeader className="bg-royal/5">
                            <TableRow>
                              <TableHead className="font-bold text-royal">Date</TableHead>
                              <TableHead className="font-bold text-royal">Description</TableHead>
                              <TableHead className="font-bold text-royal">Account</TableHead>
                              <TableHead className="font-bold text-royal text-right">Debit</TableHead>
                              <TableHead className="font-bold text-royal text-right">Credit</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {JOURNAL_ENTRIES.map(j => (
                              <TableRow key={j.id}>
                                <TableCell className="text-sm">{j.date}</TableCell>
                                <TableCell className="text-sm">{j.desc}</TableCell>
                                <TableCell className="text-sm">{j.account}</TableCell>
                                <TableCell className="text-right font-bold text-emerald-600">{j.debit > 0 ? `Rp ${j.debit.toLocaleString('id-ID')}` : '-'}</TableCell>
                                <TableCell className="text-right font-bold text-rose-600">{j.credit > 0 ? `Rp ${j.credit.toLocaleString('id-ID')}` : '-'}</TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </CardContent>
                    </Card>
                  </TabsContent>

                  <TabsContent value="sales">
                    <Card className="border-none shadow-sm overflow-hidden">
                      <CardContent className="p-0">
                        <Table>
                          <TableHeader className="bg-royal/5">
                            <TableRow>
                              <TableHead className="font-bold text-royal">Date</TableHead>
                              <TableHead className="font-bold text-royal">Description</TableHead>
                              <TableHead className="font-bold text-royal">Account</TableHead>
                              <TableHead className="font-bold text-royal text-right">Debit</TableHead>
                              <TableHead className="font-bold text-royal text-right">Credit</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {JOURNAL_ENTRIES.filter(j => j.type === 'sales').map(j => (
                              <TableRow key={j.id}>
                                <TableCell className="text-sm">{j.date}</TableCell>
                                <TableCell className="text-sm">{j.desc}</TableCell>
                                <TableCell className="text-sm">{j.account}</TableCell>
                                <TableCell className="text-right font-bold text-emerald-600">{j.debit > 0 ? `Rp ${j.debit.toLocaleString('id-ID')}` : '-'}</TableCell>
                                <TableCell className="text-right font-bold text-rose-600">{j.credit > 0 ? `Rp ${j.credit.toLocaleString('id-ID')}` : '-'}</TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </CardContent>
                    </Card>
                  </TabsContent>

                  <TabsContent value="purchase">
                    <Card className="border-none shadow-sm overflow-hidden">
                      <CardContent className="p-0">
                        <Table>
                          <TableHeader className="bg-royal/5">
                            <TableRow>
                              <TableHead className="font-bold text-royal">Date</TableHead>
                              <TableHead className="font-bold text-royal">Description</TableHead>
                              <TableHead className="font-bold text-royal">Account</TableHead>
                              <TableHead className="font-bold text-royal text-right">Debit</TableHead>
                              <TableHead className="font-bold text-royal text-right">Credit</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {JOURNAL_ENTRIES.filter(j => j.type === 'purchase').map(j => (
                              <TableRow key={j.id}>
                                <TableCell className="text-sm">{j.date}</TableCell>
                                <TableCell className="text-sm">{j.desc}</TableCell>
                                <TableCell className="text-sm">{j.account}</TableCell>
                                <TableCell className="text-right font-bold text-emerald-600">{j.debit > 0 ? `Rp ${j.debit.toLocaleString('id-ID')}` : '-'}</TableCell>
                                <TableCell className="text-right font-bold text-rose-600">{j.credit > 0 ? `Rp ${j.credit.toLocaleString('id-ID')}` : '-'}</TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </CardContent>
                    </Card>
                  </TabsContent>
                </Tabs>
              </div>
            )}

            {activeTab === 'zakat' && (
              <div className="space-y-8">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <h3 className="text-2xl font-serif font-bold italic">Zakat Perniagaan</h3>
                    <p className="text-gray-500">Hitung kewajiban zakat dari profit bisnis Anda secara transparan.</p>
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={handleExportZakat} className="bg-royal text-white">Unduh Laporan Zakat</Button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <Card className="border-none shadow-sm bg-white">
                    <CardContent className="p-6">
                      <p className="text-sm font-medium text-gray-500 mb-1">Total Profit Bersih</p>
                      <h3 className="text-2xl font-bold tracking-tight text-royal">
                        Rp {(dbStats?.totalProfit || 15250000).toLocaleString('id-ID')}
                      </h3>
                      <p className="text-xs text-gray-400 mt-2 italic">*Berdasarkan akumulasi penjualan - HPP</p>
                    </CardContent>
                  </Card>

                  <Card className="border-none shadow-sm bg-royal text-white">
                    <CardContent className="p-6">
                      <div className="flex justify-between items-start mb-2">
                        <p className="text-sm font-medium text-white/70">Estimasi Zakat (2.5%)</p>
                        <Badge className="bg-gold text-royal border-none font-bold">WAJIB</Badge>
                      </div>
                      <h3 className="text-3xl font-bold tracking-tight text-gold">
                        Rp {((dbStats?.totalProfit || 15250000) * 0.025).toLocaleString('id-ID')}
                      </h3>
                      <p className="text-xs text-white/60 mt-2">Bersihkan harta dengan berbagi kepada yang membutuhkan.</p>
                    </CardContent>
                  </Card>

                  <Card className="border-none shadow-sm bg-white">
                    <CardContent className="p-6">
                      <p className="text-sm font-medium text-gray-500 mb-1">Nisab Tahunan (85g Emas)</p>
                      <h3 className="text-2xl font-bold tracking-tight">Rp 85,000,000</h3>
                      <div className="mt-3">
                        <div className="flex justify-between text-[10px] mb-1">
                          <span>Progress Nisab</span>
                          <span>{Math.min(100, ((dbStats?.totalProfit || 15250000) / 85000000 * 100)).toFixed(1)}%</span>
                        </div>
                        <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-gold transition-all duration-500" 
                            style={{ width: `${Math.min(100, ((dbStats?.totalProfit || 15250000) / 85000000 * 100))}%` }}
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  <Card className="border-none shadow-sm">
                    <CardHeader>
                      <CardTitle className="font-serif italic text-xl">Rincian Perhitungan</CardTitle>
                      <CardDescription>Bagaimana zakat Anda dihitung</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex justify-between py-2 border-b border-gray-50">
                        <span className="text-sm text-gray-600">Total Pendapatan (Revenue)</span>
                        <span className="text-sm font-bold">Rp {(dbStats?.totalRevenue || 61200000).toLocaleString('id-ID')}</span>
                      </div>
                      <div className="flex justify-between py-2 border-b border-gray-50">
                        <span className="text-sm text-gray-600">Total Beban Pokok (HPP)</span>
                        <span className="text-sm font-bold text-rose-500">- Rp {((dbStats?.totalRevenue || 61200000) - (dbStats?.totalProfit || 15250000)).toLocaleString('id-ID')}</span>
                      </div>
                      <div className="flex justify-between py-2 border-b border-gray-100">
                        <span className="text-sm font-bold">Profit Bersih</span>
                        <span className="text-sm font-bold text-emerald-600">Rp {(dbStats?.totalProfit || 15250000).toLocaleString('id-ID')}</span>
                      </div>
                      <div className="flex justify-between py-2 bg-royal/5 px-3 rounded-lg">
                        <span className="text-sm font-bold text-royal">Zakat yang Harus Dikeluarkan (2.5%)</span>
                        <span className="text-sm font-bold text-royal">Rp {((dbStats?.totalProfit || 15250000) * 0.025).toLocaleString('id-ID')}</span>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border-none shadow-sm bg-gold-soft/30">
                    <CardHeader>
                      <CardTitle className="font-serif italic text-xl flex items-center gap-2">
                        <HeartHandshake className="w-5 h-5 text-royal" />
                        Keutamaan Zakat
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <p className="text-sm text-royal/80 leading-relaxed italic">
                        "Ambillah zakat dari sebagian harta mereka, dengan zakat itu kamu membersihkan dan mensucikan mereka..." (QS. At-Taubah: 103)
                      </p>
                      <ul className="space-y-2">
                        <li className="flex items-start gap-2 text-xs text-royal/70">
                          <div className="w-1.5 h-1.5 rounded-full bg-royal mt-1" />
                          <span>Membersihkan harta dari hak orang lain.</span>
                        </li>
                        <li className="flex items-start gap-2 text-xs text-royal/70">
                          <div className="w-1.5 h-1.5 rounded-full bg-royal mt-1" />
                          <span>Membawa keberkahan dan pertumbuhan pada bisnis.</span>
                        </li>
                        <li className="flex items-start gap-2 text-xs text-royal/70">
                          <div className="w-1.5 h-1.5 rounded-full bg-royal mt-1" />
                          <span>Membantu sesama dan memperkuat ekonomi umat.</span>
                        </li>
                      </ul>
                      <Button className="w-full bg-royal text-white mt-4 hover:bg-royal/90">
                        Salurkan Zakat Sekarang
                      </Button>
                    </CardContent>
                  </Card>
                </div>
              </div>
            )}
            
            {activeTab === 'transactions' && (
              <div className="space-y-8 animate-in fade-in-50 duration-300 p-8">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <h3 className="text-2xl font-serif font-bold italic">Riwayat Transaksi</h3>
                    <p className="text-gray-500">Daftar semua transaksi yang telah dilakukan.</p>
                  </div>
                </div>
                <Card className="border-none shadow-sm overflow-hidden">
                  <CardContent className="p-0">
                    <Table>
                      <TableHeader className="bg-royal/5">
                        <TableRow>
                          <TableHead className="font-bold text-royal">ID Transaksi</TableHead>
                          <TableHead className="font-bold text-royal">Date & Time</TableHead>
                          <TableHead className="font-bold text-royal">Channel</TableHead>
                          <TableHead className="font-bold text-royal text-right">Revenue</TableHead>
                          <TableHead className="font-bold text-royal">Status</TableHead>
                          <TableHead className="font-bold text-royal text-right">Aksi</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {(isSuperAdmin ? transactions : transactions.filter((t) => t.status !== 'cancelled')).map((trx) => {
                          const txTime = new Date(trx.created_at || `${trx.date}T${trx.time}`).getTime();
                          const ageDays = (Date.now() - txTime) / (1000 * 60 * 60 * 24);
                          const isWithin7Days = ageDays <= 7;
                          
                          return (
                            <TableRow key={trx.id}>
                              <TableCell className="font-mono text-xs font-bold">{trx.id}</TableCell>
                              <TableCell className="text-sm">{trx.date} {trx.time}</TableCell>
                              <TableCell><Badge variant="outline">{trx.channel}</Badge></TableCell>
                              <TableCell className="text-right font-bold">Rp {trx.total_revenue.toLocaleString('id-ID')}</TableCell>
                              <TableCell>
                                <Badge className={cn(trx.status === 'cancelled' ? 'bg-rose-100 text-rose-700 border-none' : trx.status === 'pending_cancellation' ? 'bg-amber-100 text-amber-700 border-none animate-pulse' : 'bg-emerald-100 text-emerald-700 border-none')}>
                                  {trx.status === 'cancelled' ? 'Batal' : trx.status === 'pending_cancellation' ? 'Pending Approval' : 'Success'}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-right">
                                {trx.status !== 'cancelled' && trx.status !== 'pending_cancellation' && isWithin7Days && (
                                <Button size="sm" variant="outline" onClick={() => handleCancelRequest(trx)} className="border-rose-200 text-rose-600 hover:bg-rose-50 hover:text-rose-700 text-xs">
                                  {isSuperAdmin ? 'Batalkan' : 'Ajukan Batal'}
                                </Button>
                                )}
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </div>
            )}
            
            {activeTab === 'approvals' && (
              <div className="space-y-8 animate-in fade-in-50 duration-300 p-8">
                <div>
                  <h3 className="text-2xl font-serif font-bold italic">Approvals</h3>
                  <p className="text-gray-500">Persetujuan untuk tindakan sensitif.</p>
                </div>
                <Card className="border-none shadow-sm overflow-hidden">
                  <CardHeader className="pb-3"><CardTitle>Daftar Pengajuan Pembatalan</CardTitle></CardHeader>
                  <CardContent className="p-0">
                    <Table>
                      <TableHeader className="bg-royal/5">
                        <TableRow>
                          <TableHead className="font-bold text-royal">ID Transaksi</TableHead>
                          <TableHead className="font-bold text-royal">Date & Time</TableHead>
                          <TableHead className="font-bold text-royal text-right">Revenue</TableHead>
                          <TableHead className="font-bold text-royal text-right">Aksi</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {transactions.filter(t => t.status === 'pending_cancellation').length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={4} className="text-center py-8 text-gray-400">
                              Tidak ada pengajuan pembatalan.
                            </TableCell>
                          </TableRow>
                        ) : (
                          transactions.filter(t => t.status === 'pending_cancellation').map(trx => (
                            <TableRow key={trx.id}>
                              <TableCell className="font-mono text-xs font-bold">{trx.id}</TableCell>
                              <TableCell className="text-sm">{trx.date} {trx.time}</TableCell>
                              <TableCell className="text-right font-bold">Rp {trx.total_revenue.toLocaleString('id-ID')}</TableCell>
                              <TableCell className="text-right space-x-2">
                                <Button size="sm" onClick={() => handleApproveCancel(trx.id, true)} className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs">Setujui</Button>
                                <Button size="sm" onClick={() => handleApproveCancel(trx.id, false)} variant="outline" className="border-rose-200 text-rose-600 text-xs">Tolak</Button>
                              </TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </div>
            )}

            {activeTab === 'system' && (
              <div className="space-y-8 animate-in fade-in-50 duration-300 p-8">
                <div>
                  <h3 className="text-2xl font-serif font-bold italic">Sistem & Keamanan</h3>
                  <p className="text-gray-500">Status kesehatan, backup, dan manajemen data retention.</p>
                </div>
                
                <Tabs value={systemSubTab} onValueChange={setSystemSubTab} className="w-full">
                  <TabsList className="bg-royal/5 border-b-2 border-royal/10 rounded-none w-full justify-start h-auto p-0 flex gap-6">
                    <TabsTrigger value="health" className="rounded-none border-b-2 border-transparent data-[state=active]:border-royal data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:text-royal font-bold pb-2 pt-3 text-gray-500"><HardDrive className="w-4 h-4 mr-2" />Health Check</TabsTrigger>
                    <TabsTrigger value="backup" className="rounded-none border-b-2 border-transparent data-[state=active]:border-royal data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:text-royal font-bold pb-2 pt-3 text-gray-500"><Database className="w-4 h-4 mr-2" />Backup & DR</TabsTrigger>
                    <TabsTrigger value="retention" className="rounded-none border-b-2 border-transparent data-[state=active]:border-royal data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:text-royal font-bold pb-2 pt-3 text-gray-500"><ShieldAlert className="w-4 h-4 mr-2" />Data Retention</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="health" className="pt-6">
                    <Card className="border-none shadow-sm"><CardContent className="p-6">
                      <h4 className="font-bold text-lg mb-4">Database Health Check</h4>
                      {healthData ? (
                        <div className="space-y-4">
                          <div className="flex items-center gap-3">
                            <span className="font-medium w-24">Status:</span>
                            <Badge className={healthData.status === 'ok' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}>{healthData.status}</Badge>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="font-medium w-24">Latency:</span>
                            <span>{healthData.latency} ms</span>
                          </div>
                        </div>
                      ) : <p className="text-gray-500">Loading health data...</p>}
                    </CardContent></Card>
                  </TabsContent>
                  
                  <TabsContent value="backup" className="pt-6">
                    <Card className="border-none shadow-sm"><CardContent className="p-6">
                      <h4 className="font-bold text-lg mb-4">Disaster Recovery Drill</h4>
                      {backupData ? (
                        <div className="space-y-4">
                          <p>Last Drill: {backupData.lastDrill}</p>
                          <p>Status: <Badge>{backupData.status}</Badge></p>
                        </div>
                      ) : <p className="text-gray-500">Loading backup status...</p>}
                    </CardContent></Card>
                  </TabsContent>

                  <TabsContent value="retention" className="pt-6">
                    <Card className="border-none shadow-sm"><CardContent className="p-6">
                      <h4 className="font-bold text-lg mb-4">Data Retention & Anonymization</h4>
                      {retentionData ? (
                        <div className="space-y-4">
                          <p>Transaksi lama ({'>'}3 tahun): {retentionData.eligibleCount} records</p>
                          <Button variant="outline" onClick={handleExecuteAnonymization} className="border-rose-200 text-rose-600">Eksekusi Anonimisasi</Button>
                        </div>
                      ) : <p className="text-gray-500">Loading retention data...</p>}
                    </CardContent></Card>
                  </TabsContent>
                </Tabs>
              </div>
            )}
          </div>
            {activeTab === 'customers' && (() => {
              const txSource = transactions.length > 0 ? transactions : DUMMY_TRANSACTIONS;
              const successTx = txSource.filter(t => t.status !== 'cancelled' && t.customer_id && t.customer_id !== 'ANONYMIZED' && t.customer_id.trim() !== '');
              const customerMap: Record<string, { id: string; name: string; totalSpend: number; txCount: number; channels: Record<string, number>; lastDate: string; firstDate: string; transactions: typeof txSource; }> = {};
              successTx.forEach(t => {
                const cid = t.customer_id;
                if (!customerMap[cid]) customerMap[cid] = { id: cid, name: cid, totalSpend: 0, txCount: 0, channels: {}, lastDate: t.date, firstDate: t.date, transactions: [] };
                customerMap[cid].totalSpend += t.total_revenue;
                customerMap[cid].txCount += 1;
                customerMap[cid].channels[t.channel] = (customerMap[cid].channels[t.channel] || 0) + 1;
                if (t.date > customerMap[cid].lastDate) customerMap[cid].lastDate = t.date;
                if (t.date < customerMap[cid].firstDate) customerMap[cid].firstDate = t.date;
                customerMap[cid].transactions.push(t);
              });
              const customers = Object.values(customerMap).sort((a, b) => b.totalSpend - a.totalSpend);
              const totalCustomers = customers.length;
              const totalRevFromCustomers = customers.reduce((s, c) => s + c.totalSpend, 0);
              const avgSpend = totalCustomers > 0 ? Math.floor(totalRevFromCustomers / totalCustomers) : 0;
              const CH_CLR: Record<string, string> = { 'Offline': 'bg-slate-100 text-slate-700', 'Shopee': 'bg-orange-100 text-orange-700', 'TikTok Shop': 'bg-pink-100 text-pink-700' };
              
              return (
                <div className="space-y-8 animate-in fade-in-50 duration-300 p-8">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                      <h3 className="text-2xl font-serif font-bold italic">Pelanggan</h3>
                      <p className="text-gray-500">Daftar pelanggan dari riwayat transaksi toko — klik baris untuk melihat detail.</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {[
                      { label: 'Total Pelanggan Unik', value: totalCustomers.toLocaleString('id-ID'), icon: Users, color: 'text-royal' },
                      { label: 'Total Belanja (Data Terdaftar)', value: `Rp ${(totalRevFromCustomers / 1000000).toFixed(1)}M`, icon: TrendingUp, color: 'text-emerald-600' },
                      { label: 'Rata-rata Belanja per Pelanggan', value: `Rp ${(avgSpend / 1000).toFixed(0)}k`, icon: ShoppingBag, color: 'text-amber-600' },
                    ].map(({ label, value, icon: Icon, color }) => (
                      <Card key={label} className="border-none shadow-sm">
                        <CardContent className="p-5 flex items-center gap-4">
                          <div className="w-12 h-12 rounded-xl bg-gray-50 flex items-center justify-center shrink-0">
                            <Icon className={`w-6 h-6 ${color}`} />
                          </div>
                          <div>
                            <p className="text-xs text-gray-500">{label}</p>
                            <p className="text-xl font-bold mt-0.5">{value}</p>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                  <Card className="border-none shadow-sm overflow-hidden">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base">Daftar Pelanggan</CardTitle>
                      <CardDescription>Diurutkan berdasarkan total belanja tertinggi</CardDescription>
                    </CardHeader>
                    <CardContent className="p-0">
                      {customers.length === 0 ? (
                        <div className="p-12 text-center text-gray-400">
                          <Users className="w-12 h-12 mx-auto mb-3 opacity-30" />
                          <p className="font-medium">Belum ada data pelanggan.</p>
                        </div>
                      ) : (
                        <Table>
                          <TableHeader className="bg-royal/5">
                            <TableRow>
                              <TableHead className="font-bold text-royal w-8">#</TableHead>
                              <TableHead className="font-bold text-royal">ID Pelanggan</TableHead>
                              <TableHead className="font-bold text-royal">Channel Favorit</TableHead>
                              <TableHead className="font-bold text-royal text-center">Jml. Transaksi</TableHead>
                              <TableHead className="font-bold text-royal text-right">Total Belanja Lifetime</TableHead>
                              <TableHead className="font-bold text-royal">Transaksi Terakhir</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {customers.map((cust, idx) => {
                              const favChannel = Object.entries(cust.channels).sort((a, b) => b[1] - a[1])[0]?.[0] || '-';
                              return (
                                <TableRow key={cust.id} className="cursor-pointer hover:bg-royal/5 transition-colors" onClick={() => setSelectedCustomerLocal(cust)}>
                                  <TableCell className="text-xs text-gray-400 font-mono">{idx + 1}</TableCell>
                                  <TableCell>
                                    <div className="flex items-center gap-3">
                                      <div className="w-9 h-9 rounded-full bg-royal/10 flex items-center justify-center shrink-0">
                                        <span className="text-sm font-bold text-royal">{cust.name.charAt(0).toUpperCase()}</span>
                                      </div>
                                      <div>
                                        <p className="font-semibold text-sm">{cust.name}</p>
                                        <p className="text-xs text-gray-400">Sejak {cust.firstDate}</p>
                                      </div>
                                    </div>
                                  </TableCell>
                                  <TableCell>
                                    <Badge className={`border-none text-xs ${CH_CLR[favChannel] || 'bg-gray-100 text-gray-600'}`}>{favChannel}</Badge>
                                  </TableCell>
                                  <TableCell className="text-center">
                                    <Badge variant="outline" className="border-royal/30 text-royal font-bold">{cust.txCount}x</Badge>
                                  </TableCell>
                                  <TableCell className="text-right font-bold text-emerald-600">Rp {cust.totalSpend.toLocaleString('id-ID')}</TableCell>
                                  <TableCell className="text-sm text-gray-500">{cust.lastDate}</TableCell>
                                </TableRow>
                              );
                            })}
                          </TableBody>
                        </Table>
                      )}
                    </CardContent>
                  </Card>

                  {/* Customer Detail Modal */}
                  <AnimatePresence>
                    {selectedCustomerLocal && (
                      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setSelectedCustomerLocal(null)}>
                        <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden" onClick={e => e.stopPropagation()}>
                          <div className="flex items-center justify-between px-6 py-5 border-b">
                            <div className="flex items-center gap-4">
                              <div className="w-12 h-12 rounded-full bg-royal/10 flex items-center justify-center">
                                <span className="text-xl font-bold text-royal">{selectedCustomerLocal.name.charAt(0).toUpperCase()}</span>
                              </div>
                              <div>
                                <h4 className="font-bold text-lg">{selectedCustomerLocal.name}</h4>
                                <p className="text-sm text-gray-500">{selectedCustomerLocal.txCount} transaksi · Sejak {selectedCustomerLocal.firstDate}</p>
                              </div>
                            </div>
                            <button onClick={() => setSelectedCustomerLocal(null)} className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center">
                              <X className="w-4 h-4 text-gray-500" />
                            </button>
                          </div>
                          <div className="grid grid-cols-3 border-b">
                            <div className="p-4 text-center border-r">
                              <p className="text-xs text-gray-400 mb-1">Total Belanja</p>
                              <p className="font-bold text-emerald-600">Rp {selectedCustomerLocal.totalSpend.toLocaleString('id-ID')}</p>
                            </div>
                            <div className="p-4 text-center border-r">
                              <p className="text-xs text-gray-400 mb-1">Channel Favorit</p>
                              <Badge className={`border-none text-xs ${CH_CLR[Object.entries(selectedCustomerLocal.channels).sort((a:any,b:any)=>b[1]-a[1])[0]?.[0]] || 'bg-gray-100 text-gray-600'}`}>
                                {Object.entries(selectedCustomerLocal.channels).sort((a:any,b:any)=>b[1]-a[1])[0]?.[0] || '-'}
                              </Badge>
                            </div>
                            <div className="p-4 text-center">
                              <p className="text-xs text-gray-400 mb-1">Rata-rata Transaksi</p>
                              <p className="font-bold text-royal">Rp {Math.floor(selectedCustomerLocal.totalSpend / selectedCustomerLocal.txCount).toLocaleString('id-ID')}</p>
                            </div>
                          </div>
                          <ScrollArea className="flex-1 px-6 pb-6 mt-4">
                            <div className="space-y-1">
                              {selectedCustomerLocal.transactions.sort((a:any,b:any) => b.date.localeCompare(a.date)).map((t:any) => (
                                <div key={t.id} className="flex items-center justify-between py-3 border-b last:border-0">
                                  <div className="flex items-center gap-3">
                                    <div className={`w-2 h-2 rounded-full shrink-0 ${t.status === 'cancelled' ? 'bg-rose-400' : 'bg-emerald-400'}`} />
                                    <div>
                                      <p className="font-mono text-sm font-semibold">{t.id}</p>
                                      <p className="text-xs text-gray-400">{t.date} · {t.time}</p>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-3">
                                    <Badge className={`border-none text-xs ${CH_CLR[t.channel] || 'bg-gray-100 text-gray-600'}`}>{t.channel}</Badge>
                                    <p className={`font-bold text-sm ${t.status === 'cancelled' ? 'line-through text-gray-400' : 'text-gray-800'}`}>Rp {t.total_revenue.toLocaleString('id-ID')}</p>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </ScrollArea>
                        </motion.div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })()}
        </ScrollArea>
      </main>

      <ProductFormModal 
        isOpen={isProductModalOpen} 
        onClose={() => setIsProductModalOpen(false)} 
        onSuccess={handleProductAdded} 
      />

      <CSVImporterModal
        isOpen={isCsvModalOpen}
        onClose={() => setIsCsvModalOpen(false)}
        onSuccess={() => {
          setIsCsvModalOpen(false);
          window.location.reload();
        }}
      />

        {/* WhatsApp Bot Simulator Widget */}
        <div className="fixed bottom-6 right-6 z-50">
          <AnimatePresence>
            {isWaOpen && (
              <motion.div initial={{ opacity: 0, y: 20, scale: 0.9 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 20, scale: 0.9 }} className="absolute bottom-16 right-0 w-80 bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden flex flex-col h-96">
                <div className="bg-[#075e54] p-4 flex items-center justify-between text-white">
                  <div className="flex items-center gap-2">
                    <MessageSquare className="w-5 h-5" />
                    <span className="font-bold text-sm">Bot Kasir Maheer</span>
                  </div>
                  <button onClick={() => setIsWaOpen(false)} className="hover:bg-white/20 p-1 rounded-full"><XIcon className="w-5 h-5" /></button>
                </div>
                <div className="flex-1 p-4 bg-[#ece5dd] overflow-y-auto space-y-3 text-black">
                  {waMessages.length === 0 && (
                    <div className="text-center text-xs text-gray-500 bg-white/50 p-2 rounded-lg mx-4 mt-2">
                      Ketik "help" atau "stok" untuk memulai simulasi.
                    </div>
                  )}
                  {waMessages.map((msg, idx) => (
                    <div key={idx} className={`max-w-[85%] p-2 rounded-lg text-sm shadow-sm ${msg.role === 'user' ? 'bg-[#dcf8c6] ml-auto rounded-tr-none' : 'bg-white mr-auto rounded-tl-none whitespace-pre-wrap'}`}>
                      {msg.text}
                    </div>
                  ))}
                </div>
                <div className="p-2 bg-[#f0f0f0] flex items-center gap-2">
                  <input type="text" value={waInput} onChange={(e) => setWaInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSendWaMessage()} placeholder="Ketik pesan..." className="flex-1 px-4 py-2 rounded-full border-none focus:ring-1 focus:ring-[#128c7e] text-sm text-black" />
                  <button onClick={handleSendWaMessage} className="p-2 bg-[#128c7e] hover:bg-[#075e54] transition-colors text-white rounded-full shadow-sm">
                    <Send className="w-4 h-4 ml-0.5" />
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          <button onClick={() => setIsWaOpen(!isWaOpen)} className="w-14 h-14 bg-[#25d366] hover:bg-[#128c7e] text-white rounded-full shadow-xl flex items-center justify-center transition-transform hover:scale-110">
            {isWaOpen ? <XIcon className="w-6 h-6" /> : <MessageSquare className="w-7 h-7" />}
          </button>
        </div>

    </div>
  );
}

function SidebarItem({ icon: Icon, label, active, onClick }: { icon: any, label: string, active?: boolean, onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group",
        active 
          ? "bg-gold text-royal shadow-lg shadow-gold/20 font-bold" 
          : "text-white/60 hover:text-white hover:bg-white/5"
      )}
    >
      <Icon className={cn("w-5 h-5", active ? "text-royal" : "text-white/40 group-hover:text-white")} />
      <span className="text-sm tracking-wide">{label}</span>
      {active && <ChevronRight className="w-4 h-4 ml-auto" />}
    </button>
  );
}

function RecommendationItem({ title, desc }: { title: string, desc: string }) {
  return (
    <div className="p-4 rounded-xl bg-white/10 border border-white/10 hover:bg-white/15 transition-colors group cursor-default">
      <div className="flex items-center justify-between mb-1">
        <h5 className="font-bold text-gold text-sm">{title}</h5>
        <ArrowRight className="w-4 h-4 text-gold opacity-0 group-hover:opacity-100 transition-opacity" />
      </div>
      <p className="text-xs text-white/80 leading-relaxed">{desc}</p>
    </div>
  );
}
