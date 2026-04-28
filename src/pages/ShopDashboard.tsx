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
        {/* Header - Simplified & Store Focused */}
        <header className="h-20 bg-white border-b border-slate-200 px-8 flex items-center justify-between shrink-0">
          <div className="flex flex-col">
            <h2 className="text-xl font-black text-slate-800 uppercase tracking-tight leading-none mb-1">{shop.name}</h2>
            <div className="flex items-center gap-4 text-slate-400 text-[10px] font-bold uppercase tracking-widest">
              <span className="flex items-center gap-1.5 text-emerald-500">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> Store Terminal Online
              </span>
              <span className="hidden md:inline font-mono">Terminal ID: {shop.id.toUpperCase()}</span>
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
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-8 text-left"
            >
              {/* Financial Dashboard - Direct & Clear */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white border border-slate-200 rounded-3xl p-8 shadow-sm">
                  <div className="flex items-center justify-between mb-4">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Income</p>
                    <CreditCard size={18} className="text-blue-500" />
                  </div>
                  <p className="text-4xl font-black text-slate-900 tracking-tighter">₹{(allTransactions.reduce((acc, t) => acc + (t.status === 'success' ? t.amount : 0), 0)).toLocaleString()}</p>
                  <p className="text-[10px] font-bold text-slate-400 mt-2 uppercase tracking-wide">Gross Deposits Processed</p>
                </div>

                <div className="bg-white border border-slate-200 rounded-3xl p-8 shadow-sm">
                  <div className="flex items-center justify-between mb-4">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Customer Visits</p>
                    <Users size={18} className="text-emerald-500" />
                  </div>
                  <p className="text-4xl font-black text-slate-900 tracking-tighter">{allTransactions.filter(t => t.status === 'success').length}</p>
                  <p className="text-[10px] font-bold text-slate-400 mt-2 uppercase tracking-wide">Paying users detected</p>
                </div>

                <div className="bg-white border border-slate-200 rounded-3xl p-8 shadow-sm border-emerald-100 bg-emerald-50/20">
                  <div className="flex items-center justify-between mb-4">
                    <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Net Profit Summary</p>
                    <TrendingUp size={18} className="text-emerald-500" />
                  </div>
                  <div className="flex items-baseline gap-2">
                    <p className="text-4xl font-black text-emerald-600 tracking-tighter">
                      ₹{Math.round(allTransactions.reduce((acc, t) => acc + (t.status === 'success' ? t.amount : 0), 0) * 0.945).toLocaleString()}
                    </p>
                  </div>
                  <p className="text-[10px] font-bold text-emerald-500/60 mt-2 uppercase tracking-wide">Approx. Net (Less 5.5% Charges)</p>
                </div>
              </div>

              <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
                {/* Master Ledger - Unified History Window */}
                <div className="xl:col-span-8">
                  <div className="bg-white border border-slate-200 rounded-3xl shadow-xl overflow-hidden h-[500px] flex flex-col">
                    <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
                      <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest flex items-center gap-2">
                         <History size={14} className="text-slate-400" />
                         Transaction Ledger
                      </h3>
                      <button className="text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-slate-900">Download Report</button>
                    </div>
                    
                    <div className="flex-1 overflow-y-auto divide-y divide-slate-50">
                      {allTransactions.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full text-slate-400 space-y-4">
                          <div className="w-16 h-16 rounded-full bg-slate-50 flex items-center justify-center opacity-40">
                             <Clock size={32} />
                          </div>
                          <p className="text-xs font-black uppercase tracking-widest">No activities recorded today</p>
                        </div>
                      ) : (
                        allTransactions.map((tx, i) => (
                          <div key={i} className="p-6 flex items-center justify-between hover:bg-slate-50/50 transition-colors">
                            <div className="flex items-center gap-4">
                              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${tx.status === 'success' ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>
                                {tx.status === 'success' ? <User size={20} /> : <AlertCircle size={20} />}
                              </div>
                              <div>
                                <p className="font-bold text-slate-900 leading-none mb-1">{tx.customerName}</p>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{new Date(tx.timestamp.seconds * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • TX: {tx.id.substring(4)}</p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="font-black text-slate-900 leading-none mb-1">₹{tx.amount.toLocaleString()}</p>
                              <p className={`text-[9px] font-black uppercase tracking-widest ${tx.status === 'success' ? 'text-emerald-500' : 'text-red-500'}`}>
                                {tx.status}
                              </p>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>

                {/* Simplified Sidebar Business Stats */}
                <div className="xl:col-span-4 space-y-6">
                  <div className="bg-slate-900 border border-slate-800 rounded-[2.5rem] p-8 text-white shadow-2xl h-full flex flex-col items-start">
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-4 font-mono">Terminal Stats</p>
                    
                    <div className="space-y-10 w-full">
                       <div className="space-y-3">
                          <div className="flex justify-between items-end">
                             <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Daily Target</p>
                             <p className="text-lg font-black text-blue-400">74%</p>
                          </div>
                          <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                             <motion.div initial={{ width: 0 }} animate={{ width: '74%' }} className="h-full bg-blue-500" />
                          </div>
                       </div>

                       <div className="space-y-6 pt-4 border-t border-slate-800 w-full">
                          <div className="flex justify-between">
                             <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Service Fee</span>
                             <span className="text-xs font-black text-slate-300">₹{(allTransactions.reduce((acc, t) => acc + (t.status === 'success' ? t.amount : 0), 0) * 0.055).toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between">
                             <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Merchant Tax</span>
                             <span className="text-xs font-black text-slate-300">Included</span>
                          </div>
                          
                          <div className="pt-6">
                             <div className="p-5 bg-slate-800/40 rounded-2xl border border-slate-700/50">
                                <ShieldCheck size={20} className="text-blue-400 mb-2" />
                                <p className="text-[10px] font-black text-white uppercase tracking-widest mb-1">Secure Settlement</p>
                                <p className="text-[10px] text-slate-400 font-medium leading-relaxed">Verified payments are settled to your linked account every evening at 11 PM.</p>
                             </div>
                          </div>
                       </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
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


