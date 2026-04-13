"use client";
import { useState, useMemo, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { fetchProducts, fetchRecentTransactions, fetchDashboardStats } from '@/lib/supabaseService';
import { Product, Transaction } from '@/types';
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
  BookOpen,
  Wallet
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
  const [activeTab, setActiveTab] = useState('overview');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [supabaseStatus, setSupabaseStatus] = useState<'connected' | 'error' | 'idle'>('idle');
  
  const [products, setProducts] = useState<Product[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [dbStats, setDbStats] = useState<{ totalRevenue: number, totalProfit: number, dailyTurnover: number, orderVolume: number, avgOrderValue: number } | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function checkSupabase() {
      try {
        const { error } = await supabase.from('products').select('count', { count: 'exact', head: true });
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
      // Fallback to dummy data if error
      setProducts(DUMMY_PRODUCTS);
      setTransactions(DUMMY_TRANSACTIONS);
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

  const displayProducts = products.length > 0 ? products : DUMMY_PRODUCTS;
  const displayTransactions = transactions.length > 0 ? transactions : DUMMY_TRANSACTIONS;

  const inventoryAnalysis = useMemo(() => {
    return displayProducts.map(p => {
      const sold = p.initialStock - p.stock;
      const str = (sold / p.initialStock) * 100;
      return { ...p, sold, str };
    }).sort((a, b) => a.str - b.str);
  }, [displayProducts]);

  const underperformingItems = useMemo(() => {
    return inventoryAnalysis.filter(item => item.str < 30);
  }, [inventoryAnalysis]);

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

            <nav className="flex-1 px-4 py-4 space-y-2">
              <SidebarItem 
                icon={LayoutDashboard} 
                label="Dashboard" 
                active={activeTab === 'overview'} 
                onClick={() => setActiveTab('overview')} 
              />
              <SidebarItem 
                icon={Package} 
                label="Inventory" 
                active={activeTab === 'inventory'} 
                onClick={() => setActiveTab('inventory')} 
              />
              <SidebarItem 
                icon={ShoppingBag} 
                label="Purchasing" 
                active={activeTab === 'purchasing'} 
                onClick={() => setActiveTab('purchasing')} 
              />
              <SidebarItem 
                icon={HeartHandshake} 
                label="Zakat" 
                active={activeTab === 'zakat'} 
                onClick={() => setActiveTab('zakat')} 
              />
              <SidebarItem 
                icon={ShoppingCart} 
                label="Sales" 
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
                icon={BarChart3} 
                label="Reports" 
                active={activeTab === 'reports'} 
                onClick={() => setActiveTab('reports')} 
              />
            </nav>

            <div className="p-6 border-t border-white/10">
              <div className="flex items-center gap-3 p-3 rounded-xl bg-white/5 mb-4">
                <div className="w-10 h-10 rounded-full bg-gold-soft/20 flex items-center justify-center">
                  <Users className="w-5 h-5 text-gold" />
                </div>
                <div className="flex-1 overflow-hidden">
                  <p className="text-sm font-medium truncate">Admin Maheer</p>
                  <p className="text-xs text-white/60 truncate">admin@maheer.com</p>
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
              <Button variant="ghost" className="w-full justify-start text-white/70 hover:text-white hover:bg-white/10 gap-3">
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
              <>
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
                        <AreaChart data={SALES_TREND_DATA}>
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
                          <Pie data={CHANNEL_PERFORMANCE} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                            {CHANNEL_PERFORMANCE.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip />
                          <Legend verticalAlign="bottom" height={36}/>
                        </PieChart>
                      </ResponsiveContainer>
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
                            <TableCell className="text-right font-bold">Rp {trx.totalRevenue.toLocaleString('id-ID')}</TableCell>
                            <TableCell><Badge className="bg-emerald-100 text-emerald-700 border-none">Success</Badge></TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </>
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
                    <Button className="bg-royal text-white">Export Report</Button>
                    <Button variant="outline" className="border-royal text-royal">Filter by Category</Button>
                  </div>
                </div>

                {/* Underperforming Alert */}
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="bg-rose-50 border border-rose-100 rounded-2xl p-6 flex items-start gap-4"
                >
                  <div className="p-3 bg-rose-100 rounded-xl">
                    <AlertTriangle className="w-6 h-6 text-rose-600" />
                  </div>
                  <div>
                    <h4 className="text-rose-900 font-bold mb-1">Critical Insight: Low Sell-Through Detected</h4>
                    <p className="text-rose-700 text-sm leading-relaxed">
                      Terdapat <strong>{underperformingItems.length} kombinasi SKU</strong> dengan Sell-Through Rate di bawah 30%. 
                      Kombinasi ukuran <strong>XL</strong> dan <strong>L</strong> pada kategori Gamis menunjukkan pergerakan stok paling lambat.
                    </p>
                  </div>
                </motion.div>

                {/* Detailed Analysis Table */}
                <Card className="border-none shadow-sm">
                  <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                      <CardTitle className="font-serif italic text-xl">Performance Matrix</CardTitle>
                      <CardDescription>Detailed STR analysis by Size and Color combination</CardDescription>
                    </div>
                    <Button variant="outline" size="sm" className="gap-2">
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
                              <div className="font-medium">{item.name}</div>
                              <div className="text-[10px] font-mono text-gray-400">{item.sku}</div>
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
                              <Button variant="ghost" size="sm" className="text-royal hover:bg-royal/5 gap-1">
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
                  <Button className="bg-royal text-white gap-2">
                    <Plus className="w-4 h-4" />
                    Create Purchase Invoice
                  </Button>
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
              <div className="space-y-8">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <h3 className="text-2xl font-serif font-bold italic">Sales Management</h3>
                    <p className="text-gray-500">Track orders and generate customer invoices.</p>
                  </div>
                  <Button className="bg-royal text-white gap-2">
                    <FileText className="w-4 h-4" />
                    Generate Sales Invoice
                  </Button>
                </div>

                <Card className="border-none shadow-sm overflow-hidden">
                  <CardHeader>
                    <CardTitle className="font-serif italic text-xl">Order History</CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    <Table>
                      <TableHeader className="bg-royal/5">
                        <TableRow>
                          <TableHead className="font-bold text-royal">Order ID</TableHead>
                          <TableHead className="font-bold text-royal">Date</TableHead>
                          <TableHead className="font-bold text-royal">Customer</TableHead>
                          <TableHead className="font-bold text-royal text-right">Amount</TableHead>
                          <TableHead className="font-bold text-royal">Action</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {displayTransactions.map((trx) => (
                          <TableRow key={trx.id}>
                            <TableCell className="font-mono text-xs font-bold">{trx.id}</TableCell>
                            <TableCell className="text-sm">{trx.date}</TableCell>
                            <TableCell className="text-sm">{trx.customerId}</TableCell>
                            <TableCell className="text-right font-bold">Rp {trx.totalRevenue.toLocaleString('id-ID')}</TableCell>
                            <TableCell>
                              <Button variant="ghost" size="sm" className="text-royal gap-1">
                                <FileText className="w-3 h-3" />
                                Invoice
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </div>
            )}

            {activeTab === 'reports' && (
              <div className="space-y-8">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <h3 className="text-2xl font-serif font-bold italic">Financial Journals</h3>
                    <p className="text-gray-500">Accounting records for fashion business operations.</p>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" className="border-royal text-royal gap-2">
                      <BookOpen className="w-4 h-4" />
                      General Ledger
                    </Button>
                    <Button className="bg-royal text-white">Export Journals</Button>
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
                            <TableRow>
                              <TableCell className="text-sm">April 07, 2026</TableCell>
                              <TableCell className="text-sm">Penjualan Gamis Al-Zahra (Shopee)</TableCell>
                              <TableCell className="text-sm">Kas / Bank</TableCell>
                              <TableCell className="text-right font-bold text-emerald-600">Rp 450,000</TableCell>
                              <TableCell className="text-right font-bold">-</TableCell>
                            </TableRow>
                            <TableRow>
                              <TableCell className="text-sm">April 07, 2026</TableCell>
                              <TableCell className="text-sm">Penjualan Gamis Al-Zahra (Shopee)</TableCell>
                              <TableCell className="text-sm">Pendapatan Penjualan</TableCell>
                              <TableCell className="text-right font-bold">-</TableCell>
                              <TableCell className="text-right font-bold text-rose-600">Rp 450,000</TableCell>
                            </TableRow>
                            <TableRow>
                              <TableCell className="text-sm">April 06, 2026</TableCell>
                              <TableCell className="text-sm">Pembelian Kain Silk (Supplier A)</TableCell>
                              <TableCell className="text-sm">Persediaan Barang</TableCell>
                              <TableCell className="text-right font-bold text-emerald-600">Rp 5,000,000</TableCell>
                              <TableCell className="text-right font-bold">-</TableCell>
                            </TableRow>
                            <TableRow>
                              <TableCell className="text-sm">April 06, 2026</TableCell>
                              <TableCell className="text-sm">Pembelian Kain Silk (Supplier A)</TableCell>
                              <TableCell className="text-sm">Hutang Usaha</TableCell>
                              <TableCell className="text-right font-bold">-</TableCell>
                              <TableCell className="text-right font-bold text-rose-600">Rp 5,000,000</TableCell>
                            </TableRow>
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
                    <Button className="bg-royal text-white">Unduh Laporan Zakat</Button>
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
          </div>
        </ScrollArea>
      </main>
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
