import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { jsPDF } from 'jspdf';
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
  const [activeTab, setActiveTab] = useState<'overview' | 'history' | 'customers' | 'security'>('overview');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  const downloadPdfReport = () => {
    const doc = new jsPDF();
    const dateStr = new Date().toLocaleDateString();
    
    doc.setFont("helvetica", "bold");
    doc.setFontSize(20);
    doc.text(`${shop.name.toUpperCase()} - BUSINESS REPORT`, 20, 20);
    
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(`Generated on: ${dateStr}`, 20, 28);
    doc.text(`Terminal ID: ${shop.id.toUpperCase()}`, 20, 33);
    
    doc.setDrawColor(220, 220, 220);
    doc.line(20, 38, 190, 38);
    
    // Financial Summary
    const totalIncome = allTransactions.reduce((acc, t) => acc + (t.status === 'success' ? t.amount : 0), 0);
    const serviceFees = totalIncome * 0.055;
    const netProfit = totalIncome - serviceFees;
    
    doc.setFont("helvetica", "bold");
    doc.text("FINANCIAL SUMMARY", 20, 50);
    doc.setFont("helvetica", "normal");
    doc.text(`Total Gross Income: Rs. ${totalIncome.toLocaleString()}`, 20, 58);
    doc.text(`Estimated Service Fees (5.5%): Rs. ${serviceFees.toLocaleString()}`, 20, 63);
    doc.text(`Net Settled Profit: Rs. ${netProfit.toLocaleString()}`, 20, 68);
    
    doc.line(20, 75, 190, 75);
    
    doc.setFont("helvetica", "bold");
    doc.text("TRANSACTION LEDGER (MERCHANT COPY)", 20, 85);
    
    // Table Header
    doc.setFontSize(9);
    doc.text("TXN ID", 20, 95);
    doc.text("CUSTOMER NAME", 50, 95);
    doc.text("AMOUNT", 130, 95);
    doc.text("STATUS", 165, 95);
    doc.line(20, 97, 190, 97);
    
    let y = 105;
    allTransactions.forEach((tx) => {
      if (y > 270) {
        doc.addPage();
        y = 20;
      }
      doc.text(tx.id.substring(4), 20, y);
      doc.text(tx.customerName, 50, y);
      doc.text(`${tx.amount.toLocaleString()}`, 130, y);
      doc.text(tx.status.toUpperCase(), 165, y);
      y += 8;
    });
    
    doc.save(`${shop.name}_Business_Report.pdf`);
  };

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
  const { customers, allTransactions, fraudAlerts } = useMemo(() => {
    const storedCustomers = JSON.parse(localStorage.getItem('look2pay_customers') || '[]');
    const storedTransactions = JSON.parse(localStorage.getItem('look2pay_transactions') || '[]');

    // Seed Data for Demo if empty
    if (storedCustomers.length === 0) {
      const demoCustomers = [
        {
          name: "Drishti Dasgupta",
          phone: "9876543210",
          email: "drishti@example.com",
          balance: 25000,
          faceEmbedding: [0.1, 0.2, 0.3], // Mock embedding
          pin: "1234",
          lastSeen: new Date().toISOString()
        },
        {
          name: "Rahul Sharma",
          phone: "9123456780",
          email: "rahul@example.com",
          balance: 12000,
          faceEmbedding: [0.4, 0.5, 0.6],
          pin: "0000",
          lastSeen: new Date().toISOString()
        }
      ];
      localStorage.setItem('look2pay_customers', JSON.stringify(demoCustomers));
      return { customers: demoCustomers, allTransactions: [], fraudAlerts: [] };
    }

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
    const fraudAlerts = JSON.parse(localStorage.getItem('look2pay_fraud_alerts') || '[]');

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
      allTransactions: shopTransactions,
      fraudAlerts: fraudAlerts.filter((a: any) => a.shopId === shop.id)
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

  const analytics = useMemo(() => {
    const successTx = allTransactions.filter(t => t.status === 'success');
    const totalRev = successTx.reduce((acc, t) => acc + t.amount, 0);
    const serviceFee = totalRev * 0.055;
    return {
      revenue: totalRev,
      customers: customers.length,
      visits: successTx.length,
      net: totalRev - serviceFee,
      fees: serviceFee
    };
  }, [allTransactions, customers]);

  return (
    <div className="min-h-screen bg-slate-50 font-sans flex overflow-clip">
      {/* Sidebar Navigation */}
      <aside className="w-64 bg-slate-900 text-slate-300 border-r border-slate-800 hidden lg:flex flex-col">
        <div className="p-6">
          <div className="flex items-center gap-2 mb-8 cursor-pointer" onClick={() => onNavigate('landing')}>
            <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center text-white font-bold">L2P</div>
            <h1 className="text-xl font-bold text-white tracking-tight">Look2Pay</h1>
          </div>

          <nav className="space-y-1">
            <SidebarLink icon={<LayoutDashboard size={18}/>} label="Dashboard" active={activeTab === 'overview'} onClick={() => setActiveTab('overview')} />
            <SidebarLink icon={<ShieldCheck size={18}/>} label="Security Logs" active={activeTab === 'security'} onClick={() => setActiveTab('security')} />
            <SidebarLink icon={<ArrowLeft size={18}/>} label="Exit Terminal" onClick={() => onNavigate('landing')} />
          </nav>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-y-auto">
        <header className="h-20 bg-white border-b border-slate-200 px-8 flex items-center justify-between shrink-0">
          <div>
            <h2 className="text-xl font-black text-slate-800 uppercase tracking-tight leading-none mb-1">{shop.name}</h2>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono">Terminal: {shop.id.toUpperCase()}</p>
          </div>
          
          <div className="flex gap-3">
             <button onClick={() => onNavigate('customer-register')} className="px-5 py-2 text-xs font-black text-slate-600 border border-slate-200 rounded-xl hover:bg-slate-50 uppercase tracking-widest">New User</button>
             <button onClick={() => onNavigate('payment-scan')} className="px-5 py-2 text-xs font-black text-white bg-blue-600 rounded-xl hover:bg-blue-700 shadow-lg shadow-blue-100 uppercase tracking-widest">Open Scanner</button>
          </div>
        </header>

        <div className="p-8 space-y-8">
           {activeTab === 'overview' ? (
             <Overview analytics={analytics} transactions={allTransactions} onDownload={downloadPdfReport} />
           ) : (
             <Security alerts={fraudAlerts} />
           )}
        </div>
      </main>

      <CustomerModal 
        isOpen={isModalOpen} 
        customer={selectedCustomer} 
        transactions={customerTransactions} 
        onClose={closeConstants} 
      />
    </div>
  );
}

// Sub-components for cleaner structure
function SidebarLink({ icon, label, active = false, onClick }: any) {
  return (
    <button onClick={onClick} className={`w-full flex items-center gap-3 px-3 py-2 rounded-md transition-all text-sm font-medium ${active ? 'bg-slate-800 text-white' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}>
      <span className="opacity-70">{icon}</span>
      <span>{label}</span>
    </button>
  );
}

function Overview({ analytics, transactions, onDownload }: any) {
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-8 text-left">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
         <StatCard label="Total Revenue" value={`₹${analytics.revenue.toLocaleString()}`} icon={<CreditCard size={18} />} color="blue" />
         <StatCard label="Visits Today" value={analytics.visits} icon={<Users size={18} />} color="emerald" />
         <StatCard label="Net Settlement" value={`₹${analytics.net.toLocaleString()}`} icon={<TrendingUp size={18} />} color="indigo" />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
        <div className="xl:col-span-8 bg-white border border-slate-200 rounded-[2rem] overflow-hidden min-h-[400px]">
           <div className="p-6 bg-slate-50 border-b border-slate-100 flex justify-between">
              <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-500">Master Ledger</h4>
              <button onClick={onDownload} className="text-[9px] font-black uppercase text-blue-600">Download PDF</button>
           </div>
           <div className="divide-y divide-slate-50">
              {transactions.length === 0 ? (
                <p className="p-20 text-center text-slate-400 text-xs font-bold uppercase tracking-widest">No activity found</p>
              ) : (
                transactions.map((tx: any, i: number) => (
                  <div key={i} className="p-4 px-6 flex justify-between items-center hover:bg-slate-50/50">
                    <div className="flex items-center gap-4">
                       <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 font-bold capitalize">
                          {tx.customerName[0]}
                       </div>
                       <div>
                          <p className="text-sm font-bold text-slate-900">{tx.customerName}</p>
                          <p className="text-[10px] font-black text-slate-400 uppercase">{tx.id}</p>
                       </div>
                    </div>
                    <div className="text-right">
                       <p className="text-sm font-black text-slate-900">₹{tx.amount.toLocaleString()}</p>
                       <p className={`text-[9px] font-black uppercase ${tx.status === 'success' ? 'text-emerald-500' : 'text-red-500'}`}>{tx.status}</p>
                    </div>
                  </div>
                ))
              )}
           </div>
        </div>

        <div className="xl:col-span-4 space-y-6">
           <div className="bg-slate-900 rounded-[2rem] p-6 text-white h-full">
              <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-6">Service Health</h4>
              <div className="space-y-4">
                 <div className="flex justify-between text-xs">
                    <span className="opacity-50 uppercase font-black">Fee Multiplier</span>
                    <span className="text-blue-400 font-black">5.5%</span>
                 </div>
                 <div className="flex justify-between text-xs">
                    <span className="opacity-50 uppercase font-black">Settlement</span>
                    <span className="text-emerald-400 font-black">Success</span>
                 </div>
                 <div className="p-4 bg-white/5 rounded-xl border border-white/5 mt-6">
                    <ShieldCheck size={20} className="text-blue-400 mb-2" />
                    <p className="text-[10px] font-black uppercase mb-1">Encrypted Chain</p>
                    <p className="text-[9px] opacity-40 leading-relaxed font-bold uppercase">All biometric hashes are processed via edge-computing. No face data leaves the local node.</p>
                 </div>
              </div>
           </div>
        </div>
      </div>
    </motion.div>
  );
}

function StatCard({ label, value, icon, color }: any) {
  const colors: any = { blue: 'text-blue-500', emerald: 'text-emerald-500', indigo: 'text-indigo-500' };
  return (
    <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
       <div className="flex justify-between mb-4">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{label}</p>
          <div className={colors[color]}>{icon}</div>
       </div>
       <p className="text-3xl font-black text-slate-900 tracking-tighter">{value}</p>
    </div>
  );
}

function Security({ alerts }: any) {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6 text-left">
       <div className="bg-white border border-slate-200 rounded-[2rem] p-8">
          <h3 className="text-xl font-black uppercase mb-6 tracking-tight">Security Logs</h3>
          <div className="space-y-4">
            {alerts.length === 0 ? (
              <p className="py-20 text-center text-slate-400 text-xs font-bold uppercase tracking-widest">No anomalies detected</p>
            ) : (
              alerts.map((a: any, i: number) => (
                <div key={i} className="p-6 bg-slate-50 border border-slate-100 rounded-2xl flex items-start gap-4">
                  <AlertCircle size={20} className="text-amber-500" />
                  <div className="flex-1">
                    <div className="flex justify-between items-center mb-1">
                       <p className="text-[10px] font-black text-amber-600 uppercase">{a.type}</p>
                       <p className="text-[9px] text-slate-400 font-bold uppercase">{new Date(a.timestamp).toLocaleTimeString()}</p>
                    </div>
                    <h5 className="font-black text-sm uppercase text-slate-800">{a.customerName}</h5>
                    <p className="text-[10px] text-slate-500 uppercase font-black leading-relaxed mt-1">{a.details}</p>
                  </div>
                </div>
              ))
            )}
          </div>
       </div>
    </motion.div>
  );
}

function CustomerModal({ isOpen, customer, transactions, onClose }: any) {
  if (!isOpen || !customer) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
       <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose} />
       <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white w-full max-w-xl rounded-2xl shadow-2xl relative z-10 overflow-hidden text-left">
          <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
             <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600"><User size={20} /></div>
                <div>
                   <h4 className="font-black uppercase text-sm">{customer.name}</h4>
                   <p className="text-[10px] text-slate-400 font-bold">{customer.phoneNumber}</p>
                </div>
             </div>
             <button onClick={onClose}><X size={20} className="text-slate-400" /></button>
          </div>
          <div className="p-8 max-h-[60vh] overflow-y-auto">
             <div className="grid grid-cols-2 gap-4 mb-8">
                <div className="bg-slate-50 p-4 rounded-xl">
                   <p className="text-[9px] font-black text-slate-400 uppercase mb-1">Pass Balance</p>
                   <p className="text-lg font-black tracking-tight uppercase">₹{customer.walletBalance.toLocaleString()}</p>
                </div>
                <div className="bg-slate-50 p-4 rounded-xl">
                   <p className="text-[9px] font-black text-slate-400 uppercase mb-1">Status</p>
                   <p className="text-lg font-black text-emerald-500 uppercase tracking-tight">Active</p>
                </div>
             </div>
             <p className="text-[10px] font-black text-slate-400 uppercase mb-4 tracking-widest">Recent Activity</p>
             <div className="space-y-3">
                {transactions.length === 0 ? (
                  <p className="text-center text-slate-400 text-xs py-8">No terminal logs</p>
                ) : (
                  transactions.map((tx: any) => (
                    <div key={tx.id} className="flex justify-between items-center p-3 border-b border-slate-50">
                       <p className="text-xs font-bold text-slate-800 tracking-tight uppercase">₹{tx.amount.toLocaleString()}</p>
                       <p className="text-[9px] font-black text-slate-400 uppercase">{new Date(tx.timestamp.seconds * 1000).toLocaleDateString()}</p>
                    </div>
                  ))
                )}
             </div>
          </div>
       </motion.div>
    </div>
  );
}


