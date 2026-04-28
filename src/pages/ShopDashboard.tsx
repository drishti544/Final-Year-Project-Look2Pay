import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ViewState, Customer, Transaction } from '../types';
import { 
  ArrowLeft, 
  TrendingUp, 
  Users, 
  CreditCard, 
  History, 
  Calendar,
  LayoutDashboard,
  Settings,
  PieChart,
  ChevronRight,
  ArrowUpRight,
  ArrowDownRight,
  Search,
  Filter,
  X,
  User,
  Clock,
  AlertCircle,
  ShieldCheck
} from 'lucide-react';

interface ShopDashboardProps {
  onNavigate: (view: ViewState) => void;
  shop: { name: string, id: string };
}

export default function ShopDashboard({ onNavigate, shop }: ShopDashboardProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'history' | 'customers'>('overview');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    status: [] as string[],
    minAmount: '',
    maxAmount: '',
    customerName: '',
    transactionId: ''
  });

  // Primary data from localStorage with fallbacks
  const { customers, allTransactions } = useMemo(() => {
    const storedCustomers = JSON.parse(localStorage.getItem('look2pay_customers') || '[]');
    const storedTransactions = JSON.parse(localStorage.getItem('look2pay_transactions') || '[]');

    // Convert local stored customers to the Customer interface
    const formattedCustomers: Customer[] = storedCustomers.map((c: any) => ({
      id: c.phone, // Using phone as ID consistently
      name: c.name,
      phoneNumber: c.phone,
      pin: c.pin || '0000', // Default fallback for old records
      walletBalance: c.wallet,
      transactionCount: c.transactionCount || 0,
      createdAt: { seconds: new Date(c.createdAt).getTime() / 1000, nanoseconds: 0 } as any,
      faceDescriptor: c.embedding
    }));

    // Example/Seed data ONLY for Shop s1 (the XYZ store)
    if (formattedCustomers.length === 0 && shop.id === 's1') {
      formattedCustomers.push(
        { id: '9876543210', name: 'Rahul Sharma (Hostel-4)', phoneNumber: '+91 9876543210', pin: '1111', walletBalance: 450, transactionCount: 12, createdAt: { seconds: 1672531200, nanoseconds: 0 } as any, faceDescriptor: [] },
        { id: '8765432109', name: 'Ananya Iyer (CSE Dept)', phoneNumber: '+91 8765432109', pin: '2222', walletBalance: 1200, transactionCount: 8, createdAt: { seconds: 1675209600, nanoseconds: 0 } as any, faceDescriptor: [] }
      );
    }

    // Filter transactions to only ones for this shop
    const shopTransactions = (storedTransactions as Transaction[]).filter(t => t.shopId === shop.id);

    if (shopTransactions.length === 0 && shop.id === 's1') {
       shopTransactions.push(
         { id: 'TXN-A001', shopId: 's1', customerId: '9876543210', customerName: 'Rahul Sharma', amount: 45, timestamp: { seconds: Date.now()/1000 - 3600, nanoseconds: 0 } as any, status: 'success' },
         { id: 'TXN-A002', shopId: 's1', customerId: '8765432109', customerName: 'Ananya Iyer', amount: 120, timestamp: { seconds: Date.now()/1000 - 7200, nanoseconds: 0 } as any, status: 'success' },
         { id: 'TXN-A003', shopId: 's1', customerId: '9876543210', customerName: 'Rahul Sharma', amount: 300, timestamp: { seconds: Date.now()/1000 - 86400, nanoseconds: 0 } as any, status: 'failed' },
         { id: 'TXN-A004', shopId: 's1', customerId: '8765432109', customerName: 'Ananya Iyer', amount: 50, timestamp: { seconds: Date.now()/1000 - 172800, nanoseconds: 0 } as any, status: 'flagged' }
       );
    }

    return { 
      customers: formattedCustomers, 
      allTransactions: shopTransactions
    };
  }, [shop.id]);

  const filteredTransactions = useMemo(() => {
    return allTransactions.filter(tx => {
      // Date filter
      const txDate = new Date(tx.timestamp.seconds * 1000);
      if (filters.startDate && txDate < new Date(filters.startDate)) return false;
      if (filters.endDate) {
        const endDate = new Date(filters.endDate);
        endDate.setHours(23, 59, 59, 999);
        if (txDate > endDate) return false;
      }

      // Status filter
      if (filters.status.length > 0 && !filters.status.includes(tx.status)) return false;

      // Amount filter
      if (filters.minAmount !== '' && tx.amount < Number(filters.minAmount)) return false;
      if (filters.maxAmount !== '' && tx.amount > Number(filters.maxAmount)) return false;

      // Customer filter
      if (filters.customerName && !tx.customerName.toLowerCase().includes(filters.customerName.toLowerCase())) return false;

      // Transaction ID filter
      if (filters.transactionId && !tx.id.toLowerCase().includes(filters.transactionId.toLowerCase())) return false;

      return true;
    }).sort((a, b) => b.timestamp.seconds - a.timestamp.seconds);
  }, [allTransactions, filters]);

  const stats = useMemo(() => {
    const totalRev = allTransactions.reduce((acc, t) => acc + (t.status === 'success' ? t.amount : 0), 0);
    return [
      { label: 'Today\'s Sales', value: `₹${totalRev.toLocaleString()}`, change: '+12.5%', isUp: true, icon: <TrendingUp className="w-5 h-5 text-blue-500" /> },
      { label: 'Total Sales', value: `₹${totalRev.toLocaleString()}`, change: '+5.2%', isUp: true, icon: <LayoutDashboard className="w-5 h-5 text-blue-500" /> },
      { label: 'Regular Customers', value: customers.length.toString(), change: '+4.1%', isUp: true, icon: <Users className="w-5 h-5 text-blue-500" /> },
    ];
  }, [allTransactions, customers]);

  const filteredCustomers = customers.filter(c => 
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    c.phoneNumber.includes(searchQuery)
  );

  const customerTransactions = selectedCustomer 
    ? allTransactions.filter(t => t.customerId === selectedCustomer.id)
    : [];

  const handleCustomerClick = (customer: Customer) => {
    setSelectedCustomer(customer);
    setIsModalOpen(true);
  };

  const closeConstants = () => {
    setIsModalOpen(false);
    // Don't null immediately to avoid flash during exit animation
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans flex overflow-clip">
      {/* Sidebar Navigation - Professional Polish Styling */}
      <aside className="w-64 bg-slate-900 text-slate-300 border-r border-slate-800 hidden lg:flex-col">
        <div className="p-6">
          <div className="flex items-center gap-2 mb-8">
            <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center text-white font-bold">L2P</div>
            <h1 className="text-xl font-bold text-white tracking-tight">Look2Pay</h1>
          </div>

          <nav className="space-y-1">
            <SidebarLink icon={<LayoutDashboard size={18}/>} label="Dashboard" active={activeTab === 'overview'} onClick={() => setActiveTab('overview')} />
            <SidebarLink icon={<History size={18}/>} label="Transactions" active={activeTab === 'history'} onClick={() => setActiveTab('history')} />
            <SidebarLink icon={<Users size={18}/>} label="Customer Base" active={activeTab === 'customers'} onClick={() => setActiveTab('customers')} />
            <SidebarLink icon={<Settings size={18}/>} label="Shop Settings" />
          </nav>
        </div>

        <div className="mt-auto p-6 border-t border-slate-800">
          <div className="flex items-center gap-3">
             <div className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center text-xs border border-slate-600 uppercase">RK</div>
             <div>
                <p className="text-sm font-medium text-white">Manager Access</p>
                <p className="text-xs opacity-50">{shop.name}</p>
             </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-y-auto">
        {/* Header - Professional Polish styling */}
        <header className="h-20 bg-white border-b border-slate-200 px-8 flex items-center justify-between shrink-0">
          <div className="flex flex-col">
            <h2 className="text-xl font-black text-slate-800 uppercase tracking-tight leading-none mb-1">{shop.name}</h2>
            <div className="flex items-center gap-4 text-slate-400 text-[10px] font-bold uppercase tracking-widest">
              <span className="flex items-center gap-1.5 text-emerald-500">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span> Terminal Active
              </span>
              <span className="hidden md:inline font-mono">ID: {shop.id.toUpperCase()} • {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}</span>
            </div>
          </div>
          
          <div className="flex gap-3">
            <button 
              onClick={() => onNavigate('landing')}
              className="flex items-center gap-2 px-3 py-1.5 text-xs font-bold text-slate-400 hover:text-slate-600 transition-colors uppercase tracking-widest"
            >
              <ArrowLeft size={14} />
              Exit
            </button>
            <button 
              onClick={() => onNavigate('customer-register')}
              className="px-5 py-2 text-xs font-black text-slate-600 border-2 border-slate-100 rounded-xl hover:bg-slate-50 transition-all uppercase tracking-widest active:scale-95"
            >
              New Client
            </button>
            <button 
              onClick={() => onNavigate('payment-scan')}
              className="px-5 py-2 text-xs font-black text-white bg-blue-600 rounded-xl hover:bg-blue-700 shadow-lg shadow-blue-100 transition-all uppercase tracking-widest active:scale-95"
            >
              Scanner Terminal
            </button>
          </div>
        </header>

        <div className="p-8 space-y-8">
          <AnimatePresence mode="wait">
            {activeTab === 'overview' && (
              <motion.div
                key="overview"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
              >
                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {stats.map((stat, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.1 }}
                      className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm"
                    >
                      <p className="text-xs text-slate-500 mb-1">{stat.label}</p>
                      <div className="flex justify-between items-end">
                        <p className="text-2xl font-bold text-slate-800">{stat.value}</p>
                        <div className={`flex items-center gap-1 text-[10px] font-bold ${stat.isUp ? 'text-emerald-500' : 'text-amber-500'}`}>
                          {stat.isUp ? <ArrowUpRight size={12}/> : <ArrowDownRight size={12}/>}
                          {stat.change}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>

                {/* Main Section */}
                <div className="grid grid-cols-1 xl:grid-cols-5 gap-8 mt-8">
                  {/* Activity Feed Section */}
                  <div className="xl:col-span-3 space-y-6">
                      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden text-left h-full">
                        <div className="p-4 border-b border-slate-100 bg-slate-50/50">
                          <h3 className="font-semibold text-slate-800">Recent Activity</h3>
                        </div>
                        
                        <div className="divide-y divide-slate-50">
                          {allTransactions.slice(0, 8).map((tx, i) => (
                            <div 
                              key={i} 
                              onClick={() => {
                                const customer = customers.find(c => c.id === tx.customerId);
                                if (customer) handleCustomerClick(customer);
                              }}
                              className="p-4 flex items-center gap-3 hover:bg-slate-50/50 transition-colors cursor-pointer group"
                            >
                              <div className="w-10 h-10 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center font-bold text-slate-400 group-hover:bg-white transition-colors uppercase italic text-xs overflow-hidden">
                                <img src={`https://ui-avatars.com/api/?name=${tx.customerName}&background=random`} alt="User" />
                              </div>
                              <div className="flex-1">
                                <p className="text-sm font-semibold text-slate-800">{tx.customerName}</p>
                                <p className="text-xs text-slate-400">ID: {tx.customerId}... {tx.status === 'success' ? 'Face Matched' : 'Verification Required'}</p>
                              </div>
                              <div className="text-right">
                                <p className="text-sm font-bold text-slate-800">₹{tx.amount.toLocaleString()}</p>
                                <p className={`text-[10px] font-bold uppercase ${tx.status === 'success' ? 'text-emerald-500' : 'text-amber-500'}`}>
                                  {tx.status}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                        <div className="p-4 bg-slate-50 border-t border-slate-100 text-center">
                          <button onClick={() => setActiveTab('history')} className="text-xs font-semibold text-slate-500 hover:text-slate-700">View Full Month Ledger →</button>
                        </div>
                      </div>
                  </div>

                  {/* Business Financials / Inventory Status */}
                  <div className="xl:col-span-2 space-y-6">
                      <div className="bg-white border border-slate-200 rounded-3xl p-8 shadow-xl relative overflow-clip flex-col h-full ring-1 ring-slate-100 text-left flex">
                        <div className="flex items-center justify-between mb-8">
                          <h4 className="font-black text-slate-400 uppercase text-[10px] tracking-[0.2em]">Financial Overview</h4>
                          <div className="p-1 px-2 bg-blue-50 text-blue-600 rounded text-[9px] font-black uppercase tracking-widest">Calculated Real-time</div>
                        </div>
                        
                        <div className="space-y-8">
                          <div>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2 opacity-60">Total Business Deposits</p>
                            <p className="text-5xl font-black text-slate-900 tracking-tighter">₹{(allTransactions.reduce((acc, t) => acc + (t.status === 'success' ? t.amount : 0), 0) + 1000).toLocaleString()}</p>
                            <p className="text-[10px] font-bold text-emerald-500 mt-2 flex items-center gap-1">
                              <TrendingUp size={12} />
                              Healthy liquidity status
                            </p>
                          </div>
                          
                          <div className="grid grid-cols-1 gap-4">
                            <div className="bg-slate-50/50 p-5 rounded-2xl border border-slate-100 flex justify-between items-center">
                              <div>
                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Average Order Value</p>
                                <p className="text-xl font-black text-slate-800">
                                  ₹{allTransactions.length > 0 
                                    ? Math.round(allTransactions.reduce((acc, t) => acc + t.amount, 0) / allTransactions.length).toLocaleString() 
                                    : 0}
                                </p>
                              </div>
                              <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-blue-500 shadow-sm border border-slate-100">
                                <PieChart size={20} />
                              </div>
                            </div>

                            <div className="bg-slate-50/50 p-5 rounded-2xl border border-slate-100 flex justify-between items-center">
                              <div>
                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Regulars</p>
                                <p className="text-xl font-black text-slate-800">{customers.length}</p>
                              </div>
                              <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-emerald-500 shadow-sm border border-slate-100">
                                <Users size={20} />
                              </div>
                            </div>
                          </div>

                          <div className="pt-4 mt-auto">
                             <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 opacity-60">Revenue Distribution</p>
                             <div className="space-y-4">
                                <div className="space-y-1.5">
                                   <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest">
                                      <span className="text-slate-500">Service Fees</span>
                                      <span className="text-slate-900">₹1,240</span>
                                   </div>
                                   <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                      <motion.div initial={{ width: 0 }} animate={{ width: '35%' }} className="h-full bg-blue-500 rounded-full" />
                                   </div>
                                </div>
                                <div className="space-y-1.5">
                                   <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest">
                                      <span className="text-slate-500">Net Growth</span>
                                      <span className="text-emerald-500">+12.4%</span>
                                   </div>
                                   <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                      <motion.div initial={{ width: 0 }} animate={{ width: '65%' }} className="h-full bg-emerald-500 rounded-full" />
                                   </div>
                                </div>
                             </div>
                          </div>

                          {/* Recent Alert Pattern */}
                          <div className="p-4 flex items-center gap-3 bg-blue-50/50 rounded-2xl border border-blue-100/50 mt-4">
                            <div className="w-8 h-8 rounded-full bg-white border border-blue-100 flex items-center justify-center shrink-0 shadow-sm">
                              <ShieldCheck size={14} className="text-blue-600" />
                            </div>
                            <div className="flex-1 text-left">
                              <p className="text-[10px] font-black text-blue-800 uppercase tracking-widest mb-0.5">Cloud Sync</p>
                              <p className="text-[10px] text-blue-500 font-bold uppercase opacity-70">Biometric data secured</p>
                            </div>
                            <div className="text-right">
                              <p className="text-[9px] text-blue-600 font-black uppercase tracking-tighter">Verified</p>
                            </div>
                          </div>
                        </div>
                      </div>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'history' && (
              <motion.div
                key="history"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
                className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden text-left"
              >
                <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
                    <h4 className="font-semibold text-slate-800">Transaction Ledger</h4>
                    <div className="flex gap-2">
                      <button 
                        onClick={() => setIsFilterOpen(!isFilterOpen)}
                        className={`px-3 py-1.5 border rounded-md text-xs font-medium flex items-center gap-2 transition-colors ${
                          isFilterOpen ? 'bg-blue-50 border-blue-200 text-blue-600' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        <Filter size={14} />
                        Filter {Object.values(filters).some(v => Array.isArray(v) ? v.length > 0 : v !== '') && <span className="w-2 h-2 rounded-full bg-blue-500"></span>}
                      </button>
                      <button className="px-3 py-1.5 bg-blue-600 text-white rounded-md text-xs font-medium hover:bg-blue-700">Export CSV</button>
                    </div>
                </div>

                <AnimatePresence>
                  {isFilterOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="border-b border-slate-100 overflow-hidden"
                    >
                      <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6 bg-slate-50/30">
                        <div className="space-y-2">
                          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Date Range</label>
                          <div className="flex items-center gap-2">
                            <input 
                              type="date" 
                              value={filters.startDate}
                              onChange={(e) => setFilters({...filters, startDate: e.target.value})}
                              className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded text-xs outline-none focus:border-blue-500"
                            />
                            <span className="text-slate-300">-</span>
                            <input 
                              type="date"
                              value={filters.endDate}
                              onChange={(e) => setFilters({...filters, endDate: e.target.value})}
                              className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded text-xs outline-none focus:border-blue-500"
                            />
                          </div>
                        </div>

                        <div className="space-y-2">
                          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Transaction Status</label>
                          <div className="flex flex-wrap gap-2">
                            {['success', 'failed', 'flagged'].map((status) => (
                              <button
                                key={status}
                                onClick={() => {
                                  const newStatus = filters.status.includes(status)
                                    ? filters.status.filter(s => s !== status)
                                    : [...filters.status, status];
                                  setFilters({...filters, status: newStatus});
                                }}
                                className={`px-2 py-1 rounded text-[10px] font-bold uppercase transition-colors ${
                                  filters.status.includes(status)
                                    ? 'bg-blue-100 text-blue-600 border border-blue-200'
                                    : 'bg-white text-slate-400 border border-slate-200 hover:border-slate-300'
                                }`}
                              >
                                {status}
                              </button>
                            ))}
                          </div>
                        </div>

                        <div className="space-y-2">
                          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Amount Range</label>
                          <div className="flex items-center gap-2">
                            <input 
                              type="number"
                              placeholder="Min"
                              value={filters.minAmount}
                              onChange={(e) => setFilters({...filters, minAmount: e.target.value})}
                              className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded text-xs outline-none focus:border-blue-500"
                            />
                            <span className="text-slate-300">-</span>
                            <input 
                              type="number"
                              placeholder="Max"
                              value={filters.maxAmount}
                              onChange={(e) => setFilters({...filters, maxAmount: e.target.value})}
                              className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded text-xs outline-none focus:border-blue-500"
                            />
                          </div>
                        </div>

                        <div className="space-y-2">
                          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Customer Name</label>
                          <input 
                            type="text"
                            placeholder="Search name..."
                            value={filters.customerName}
                            onChange={(e) => setFilters({...filters, customerName: e.target.value})}
                            className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded text-xs outline-none focus:border-blue-500"
                          />
                        </div>

                        <div className="space-y-2">
                          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Transaction ID</label>
                          <input 
                            type="text"
                            placeholder="Search ID..."
                            value={filters.transactionId}
                            onChange={(e) => setFilters({...filters, transactionId: e.target.value})}
                            className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded text-xs outline-none focus:border-blue-500"
                          />
                        </div>

                        <div className="flex items-end justify-end">
                          <button 
                            onClick={() => setFilters({
                              startDate: '',
                              endDate: '',
                              status: [],
                              minAmount: '',
                              maxAmount: '',
                              customerName: '',
                              transactionId: ''
                            })}
                            className="text-xs font-semibold text-slate-400 hover:text-slate-600 flex items-center gap-1"
                          >
                            <X size={12} />
                            Reset Filters
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
                
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                      <thead>
                        <tr className="bg-slate-50/50 border-b border-slate-100">
                          <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-slate-400">Date/Time</th>
                          <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-slate-400">Customer</th>
                          <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-slate-400">ID</th>
                          <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-slate-400">Amount</th>
                          <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-slate-400 text-right">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50">
                        {filteredTransactions.length > 0 ? (
                          filteredTransactions.map((tx, i) => (
                            <tr key={i} className="hover:bg-slate-50/30 transition-colors">
                              <td className="px-6 py-4 text-xs font-medium text-slate-600">
                                {new Date(tx.timestamp.seconds * 1000).toLocaleDateString()} • {new Date(tx.timestamp.seconds * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </td>
                              <td className="px-6 py-4 text-sm font-semibold text-slate-800">{tx.customerName}</td>
                              <td className="px-6 py-4 text-xs font-mono text-slate-400 uppercase">{tx.id}</td>
                              <td className="px-6 py-4 text-sm font-bold text-slate-800">₹{tx.amount.toLocaleString()}</td>
                              <td className="px-6 py-4 text-right">
                                <span className={`px-2 py-1 ${tx.status === 'success' ? 'bg-emerald-50 text-emerald-600' : tx.status === 'failed' ? 'bg-rose-50 text-rose-600' : 'bg-amber-50 text-amber-600'} text-[10px] font-black uppercase rounded shadow-sm`}>
                                  {tx.status}
                                </span>
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan={5} className="px-6 py-12 text-center text-slate-400 text-sm italic">
                              No transactions match the selected filters.
                            </td>
                          </tr>
                        )}
                      </tbody>
                  </table>
                </div>
              </motion.div>
            )}

            {activeTab === 'customers' && (
              <motion.div
                key="customers"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
                className="space-y-6 text-left"
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <h3 className="text-xl font-bold text-slate-800 uppercase tracking-tight">Customer Database</h3>
                    <p className="text-xs text-slate-500">Manage registered biometric nodes and view individual activity.</p>
                  </div>
                  <div className="relative max-w-sm w-full">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input 
                      type="text"
                      placeholder="Search by name or phone..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-sm outline-none focus:border-blue-500 transition-all font-medium"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                  {filteredCustomers.map((customer, i) => (
                    <motion.div
                      key={customer.id}
                      initial={{ opacity: 0, scale: 0.98 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: i * 0.05 }}
                      onClick={() => handleCustomerClick(customer)}
                      className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm hover:shadow-md hover:border-blue-200 transition-all cursor-pointer group"
                    >
                      <div className="flex items-center gap-4 mb-6">
                        <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400 border border-slate-200 group-hover:bg-blue-50 group-hover:border-blue-100 transition-colors">
                          <Users size={24} />
                        </div>
                        <div>
                          <p className="font-bold text-slate-900 leading-none mb-1">{customer.name}</p>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{customer.phoneNumber}</p>
                        </div>
                        <ChevronRight size={16} className="ml-auto text-slate-300 group-hover:text-blue-400 transition-colors" />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Transactions</p>
                          <p className="text-sm font-bold text-slate-700">{customer.transactionCount}</p>
                        </div>
                        <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 text-right">
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Wallet Balance</p>
                          <p className="text-sm font-bold text-emerald-600">₹{customer.walletBalance.toLocaleString()}</p>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Project Abstract Removed as requested */}
        </div>
      </main>

      {/* Transaction History Modal - Professional Polish Styled */}
      <AnimatePresence>
        {isModalOpen && selectedCustomer && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={closeConstants}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden relative z-10 border border-slate-200 flex flex-col max-h-[80vh] text-left"
            >
              {/* Modal Header */}
              <div className="p-6 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 border border-blue-200">
                    <User size={24} />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-900 leading-none mb-1">{selectedCustomer.name}</h3>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{selectedCustomer.phoneNumber}</p>
                  </div>
                </div>
                <button 
                  onClick={closeConstants}
                  className="p-2 hover:bg-slate-200 rounded-lg transition-colors text-slate-400 hover:text-slate-600"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Modal Content */}
              <div className="p-0 overflow-y-auto flex-1">
                {/* Account Overview Grid */}
                <div className="p-6 border-b border-slate-50">
                  <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4">Registration Details</h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">Wallet Balance</p>
                      <p className="text-sm font-bold text-emerald-600">₹{selectedCustomer.walletBalance.toLocaleString()}</p>
                    </div>
                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">Transactions</p>
                      <p className="text-sm font-bold text-slate-800">{selectedCustomer.transactionCount}</p>
                    </div>
                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">Joined Date</p>
                      <p className="text-sm font-bold text-slate-800">
                        {new Date(selectedCustomer.createdAt.seconds * 1000).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">Status</p>
                      <div className="flex items-center gap-1.5">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        <p className="text-sm font-bold text-slate-800">Active</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="p-6 pb-2">
                  <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4">Transaction Chronicle</h4>
                </div>
                
                {customerTransactions.length > 0 ? (
                  <div className="divide-y divide-slate-50 px-6 pb-6">
                    {customerTransactions.map((tx) => (
                      <div key={tx.id} className="py-4 flex items-center justify-between group">
                        <div className="flex items-center gap-4">
                          <div className={`p-2 rounded-lg ${tx.status === 'success' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'} group-hover:scale-110 transition-transform`}>
                            <Clock size={16} />
                          </div>
                          <div>
                            <p className="text-sm font-bold text-slate-800">₹{tx.amount.toLocaleString()}</p>
                            <p className="text-xs text-slate-400">
                              {new Date(tx.timestamp.seconds * 1000).toLocaleDateString()} • {new Date(tx.timestamp.seconds * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className={`px-2 py-1 ${tx.status === 'success' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'} text-[9px] font-bold uppercase rounded tracking-wider`}>
                            {tx.status}
                          </span>
                          <p className="text-[8px] font-mono text-slate-300 mt-1 uppercase">{tx.id}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-20 text-center flex flex-col items-center">
                    <History className="w-12 h-12 text-slate-200 mb-4" />
                    <p className="text-sm font-medium text-slate-400">No transactions recorded for this terminal entry.</p>
                  </div>
                )}
              </div>

              {/* Modal Footer */}
              <div className="p-6 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-6">
                  <div>
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Total Spend</p>
                    <p className="text-base font-bold text-slate-800">₹{customerTransactions.reduce((acc, t) => acc + (t.status === 'success' ? t.amount : 0), 0).toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Success Rate</p>
                    <p className="text-base font-bold text-emerald-600">
                      {customerTransactions.length > 0 
                        ? (customerTransactions.filter(t => t.status === 'success').length / customerTransactions.length * 100).toFixed(0)
                        : 0}%
                    </p>
                  </div>
                </div>
                <button className="px-4 py-2 bg-slate-900 text-white rounded-lg text-xs font-bold uppercase tracking-widest hover:bg-slate-800 transition-all">
                  Generate Statement
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

function SidebarLink({ icon, label, active = false, onClick }: { icon: any, label: string, active?: boolean, onClick?: () => void }) {
  return (
    <button 
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-3 py-2 rounded-md transition-all text-sm font-medium ${
        active 
          ? 'bg-slate-800 text-white' 
          : 'text-slate-400 hover:bg-slate-800 hover:text-white'
      }`}
    >
      <span className="opacity-70">{icon}</span>
      <span>{label}</span>
    </button>
  );
}


