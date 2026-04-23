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
  AlertCircle
} from 'lucide-react';

interface ShopDashboardProps {
  onNavigate: (view: ViewState) => void;
}

export default function ShopDashboard({ onNavigate }: ShopDashboardProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'history' | 'customers'>('overview');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Primary data from localStorage with fallbacks
  const { customers, allTransactions } = useMemo(() => {
    const storedCustomers = JSON.parse(localStorage.getItem('look2pay_customers') || '[]');
    const storedTransactions = JSON.parse(localStorage.getItem('look2pay_transactions') || '[]');

    // Convert local stored customers to the Customer interface
    const formattedCustomers: Customer[] = storedCustomers.map((c: any) => ({
      id: c.phone, // Using phone as ID consistently
      name: c.name,
      phoneNumber: c.phone,
      walletBalance: c.wallet,
      transactionCount: c.transactionCount || 0,
      createdAt: { seconds: new Date(c.createdAt).getTime() / 1000, nanoseconds: 0 } as any,
      faceDescriptor: c.embedding
    }));

    // Example/Seed data if empty
    if (formattedCustomers.length === 0) {
      formattedCustomers.push(
        { id: '9876543210', name: 'John Doe', phoneNumber: '+91 9876543210', walletBalance: 4250, transactionCount: 2, createdAt: { seconds: 1672531200, nanoseconds: 0 } as any, faceDescriptor: [] },
        { id: '8765432109', name: 'Sarah Miller', phoneNumber: '+91 8765432109', walletBalance: 12400, transactionCount: 5, createdAt: { seconds: 1675209600, nanoseconds: 0 } as any, faceDescriptor: [] }
      );
    }

    if (storedTransactions.length === 0) {
       storedTransactions.push(
         { id: 'TXN-ABC123', shopId: 's1', customerId: '9876543210', customerName: 'John Doe', amount: 1250, timestamp: { seconds: Date.now()/1000 - 3600, nanoseconds: 0 } as any, status: 'success' },
         { id: 'TXN-XYZ789', shopId: 's1', customerId: '8765432109', customerName: 'Sarah Miller', amount: 6400, timestamp: { seconds: Date.now()/1000 - 7200, nanoseconds: 0 } as any, status: 'success' }
       );
    }

    return { 
      customers: formattedCustomers, 
      allTransactions: storedTransactions as Transaction[] 
    };
  }, []);

  const stats = useMemo(() => {
    const totalRev = allTransactions.reduce((acc, t) => acc + (t.status === 'success' ? t.amount : 0), 0);
    return [
      { label: 'Daily Revenue', value: `₹${totalRev.toLocaleString()}`, change: '+12.5%', isUp: true, icon: <TrendingUp className="w-5 h-5 text-blue-500" /> },
      { label: 'Monthly Total', value: `₹${(totalRev * 1.2).toLocaleString()}`, change: '+5.2%', isUp: true, icon: <LayoutDashboard className="w-5 h-5 text-blue-500" /> },
      { label: 'Customers', value: customers.length.toString(), change: '+4.1%', isUp: true, icon: <Users className="w-5 h-5 text-blue-500" /> },
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
    <div className="min-h-screen bg-slate-50 flex overflow-hidden font-sans">
      {/* Sidebar Navigation - Professional Polish Styling */}
      <aside className="w-64 bg-slate-900 text-slate-300 border-r border-slate-800 hidden lg:flex lg:flex-col">
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
                <p className="text-sm font-medium text-white">Rajesh Kumar</p>
                <p className="text-xs opacity-50">General Store #402</p>
             </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-y-auto">
        {/* Header - Professional Polish styling */}
        <header className="h-16 bg-white border-b border-slate-200 px-8 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-4 text-slate-500 text-sm">
            <span className="flex items-center gap-1 font-medium text-emerald-600 bg-emerald-50 px-2 py-1 rounded">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span> System Active
            </span>
            <span className="hidden md:inline">Monday, Oct 23, 2023</span>
          </div>
          
          <div className="flex gap-4">
            <button 
              onClick={() => onNavigate('landing')}
              className="flex items-center gap-2 px-3 py-1.5 text-xs font-semibold text-slate-500 hover:text-slate-700 transition-colors"
            >
              <ArrowLeft size={14} />
              Logout
            </button>
            <button 
              onClick={() => onNavigate('customer-register')}
              className="px-4 py-1.5 text-sm font-medium text-blue-600 border border-blue-600 rounded-md hover:bg-blue-50 transition-colors"
            >
              Register New Customer
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
                      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden text-left">
                        <div className="p-4 border-b border-slate-100 bg-slate-50/50">
                          <h3 className="font-semibold text-slate-800">Recent Activity</h3>
                        </div>
                        
                        <div className="divide-y divide-slate-50">
                          {allTransactions.slice(0, 5).map((tx, i) => (
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

                  {/* System Alert / Inventory Mock */}
                  <div className="xl:col-span-2 space-y-6">
                      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm relative overflow-hidden flex flex-col h-full ring-1 ring-slate-100 text-left">
                        <div className="flex items-center justify-between mb-4">
                          <h4 className="font-semibold text-slate-800 uppercase text-xs tracking-widest">Inventory Status</h4>
                          <div className="p-1 px-2 bg-emerald-50 text-emerald-600 rounded text-[9px] font-black uppercase">Active Node</div>
                        </div>
                        
                        <div className="space-y-6">
                          <div>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Total Deposits</p>
                            <p className="text-4xl font-black text-slate-900 tracking-tighter">₹84,200.00</p>
                          </div>
                          
                          <div className="grid grid-cols-2 gap-3">
                            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Refunds</p>
                              <p className="text-base font-bold text-slate-700">₹0</p>
                            </div>
                            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Fees</p>
                              <p className="text-base font-bold text-slate-700">₹1,240</p>
                            </div>
                          </div>

                          {/* System Technical Logs - Highlighting B.Tech Project Logic */}
                          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm h-64 overflow-hidden flex flex-col font-mono text-[9px] text-blue-400/80">
                            <div className="flex items-center justify-between mb-3 border-b border-slate-800 pb-2">
                              <div className="flex items-center gap-1.5 uppercase font-bold tracking-tighter">
                                <div className="w-1 h-1 rounded-full bg-blue-500 animate-ping" />
                                Protocol Logs
                              </div>
                              <span className="text-slate-500">v2.0.4-STABLE</span>
                            </div>
                            
                            <div className="flex-1 overflow-y-auto space-y-1 custom-scrollbar scroll-smooth">
                                <p><span className="text-slate-500">[14:32:01]</span> <span className="text-emerald-500/60">INIT:</span> Loading Face Landmark 68 Model...</p>
                                <p><span className="text-slate-500">[14:32:02]</span> <span className="text-emerald-500/60">OK:</span> Weights extraction complete (20.4MB)</p>
                                <p><span className="text-slate-500">[14:32:05]</span> <span className="text-blue-500/60">AUTH:</span> Terminal 082 Online (Bengaluru Node)</p>
                                <p><span className="text-slate-500">[15:01:10]</span> <span className="text-blue-400">MATH:</span> Euclidean Match Found (Dist: 0.321)</p>
                                <p><span className="text-slate-500">[15:01:10]</span> <span className="text-emerald-500/60">VERIFY:</span> Liveliness pass - EAR: 0.28 (Satisfied)</p>
                                <p><span className="text-slate-500">[15:01:11]</span> <span className="text-blue-400">LEGER:</span> Transaction TXN-8F2 Approved</p>
                                <p><span className="text-slate-500">[15:04:45]</span> <span className="text-slate-400">IDLE:</span> Waiting for biometric trigger...</p>
                                <p><span className="text-slate-500">[15:04:45]</span> <span className="text-amber-500/60">WARN:</span> Low lighting detected at Node_082</p>
                                <p className="animate-pulse shadow-blue-500/20">_</p>
                            </div>
                          </div>

                          {/* Recent Alert Pattern */}
                          <div className="p-4 flex items-center gap-3 bg-amber-50 rounded-xl border border-amber-100 mt-4">
                            <div className="w-8 h-8 rounded-full bg-amber-100 border border-amber-200 flex items-center justify-center shrink-0">
                              <AlertCircle size={14} className="text-amber-600" />
                            </div>
                            <div className="flex-1 text-left">
                              <p className="text-xs font-semibold text-amber-800">System Alert</p>
                              <p className="text-[10px] text-amber-600">High Frequency: User 882</p>
                            </div>
                            <div className="text-right">
                              <p className="text-[10px] text-amber-600 font-bold uppercase">Blocked</p>
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
                      <button className="px-3 py-1.5 bg-white border border-slate-200 text-slate-600 rounded-md text-xs font-medium hover:bg-slate-50 flex items-center gap-2">
                        <Filter size={14} />
                        Filter
                      </button>
                      <button className="px-3 py-1.5 bg-blue-600 text-white rounded-md text-xs font-medium hover:bg-blue-700">Export CSV</button>
                    </div>
                </div>
                
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
                        {allTransactions.map((tx, i) => (
                          <tr key={i} className="hover:bg-slate-50/30 transition-colors">
                            <td className="px-6 py-4 text-xs font-medium text-slate-600">
                              {new Date(tx.timestamp.seconds * 1000).toLocaleDateString()} • {new Date(tx.timestamp.seconds * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </td>
                            <td className="px-6 py-4 text-sm font-semibold text-slate-800">{tx.customerName}</td>
                            <td className="px-6 py-4 text-xs font-mono text-slate-400 uppercase">{tx.id}</td>
                            <td className="px-6 py-4 text-sm font-bold text-slate-800">₹{tx.amount.toLocaleString()}</td>
                            <td className="px-6 py-4 text-right">
                              <span className={`px-2 py-1 ${tx.status === 'success' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'} text-[10px] font-black uppercase rounded shadow-sm`}>
                                {tx.status}
                              </span>
                            </td>
                          </tr>
                        ))}
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

          {/* Project Abstract - B.Tech Feel */}
          <div className="mt-12 pt-8 border-t border-slate-200">
             <div className="bg-slate-100 p-8 rounded-2xl flex flex-col md:flex-row gap-12 items-center">
                <div className="flex-1 text-left">
                   <h4 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-4">Project Technical Abstract</h4>
                   <p className="text-[11px] text-slate-500 leading-relaxed italic mb-4">
                      "Look2Pay is a biometric financial authentication system developed as a Final Year Project to address the limitations of OTP and QR-based payments in low-connectivity retail environments. The system utilizes a quantized SSD model for face localization and an inception-inspired CNN to extract a localized 128-dimensional embedding. Security is bolstered via a real-time Eye Aspect Ratio (EAR) algorithm for anti-spoofing liveliness verification."
                   </p>
                   <div className="flex gap-4">
                      <div className="px-2 py-1 bg-white border border-slate-200 rounded text-[9px] font-bold text-slate-400">STACK: REACT / FACE-API.JS / TAILWIND / MOTION</div>
                      <div className="px-2 py-1 bg-white border border-slate-200 rounded text-[9px] font-bold text-slate-400">DOMAIN: COMPUTER VISION / FINTECH</div>
                   </div>
                </div>
                <div className="w-full md:w-fit text-right">
                   <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Developer Credentials</p>
                   <p className="text-sm font-bold text-slate-800">Final Year B.Tech Project</p>
                   <p className="text-xs text-slate-500">Department of Computer Science</p>
                </div>
             </div>
          </div>
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


