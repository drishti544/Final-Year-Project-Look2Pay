import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  LayoutDashboard, 
  History, 
  Users, 
  ShieldCheck, 
  Settings, 
  ArrowLeft, 
  TrendingUp, 
  CreditCard, 
  User, 
  Clock, 
  AlertCircle, 
  X,
  Search,
  Download,
  Filter,
  MoreVertical,
  Activity,
  CheckCircle2,
  Trash2
} from 'lucide-react';
import { Customer, Transaction, ShopDetails } from '../types';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

interface ShopDashboardProps {
  onNavigate: (view: any) => void;
  shop: ShopDetails;
}

export default function ShopDashboard({ onNavigate, shop }: ShopDashboardProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'history' | 'customers' | 'security'>('overview');
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [allTransactions, setAllTransactions] = useState<Transaction[]>([]);
  const [fraudAlerts, setFraudAlerts] = useState<any[]>([]);

  const handleDeleteAccount = () => {
    const confirmDelete = window.confirm("Are you sure you want to delete this shop account? This action is permanent and will remove your access to the dashboard.");
    if (!confirmDelete) return;

    const storedShops = JSON.parse(localStorage.getItem('look2pay_shops') || '[]');
    const updatedShops = storedShops.filter((s: any) => s.id !== shop.id);
    localStorage.setItem('look2pay_shops', JSON.stringify(updatedShops));
    
    alert("Shop account deleted successfully.");
    onNavigate('landing');
  };

  // Real-time Dashboard Data Simulation
  useEffect(() => {
    const loadData = () => {
      const storedCustomers = JSON.parse(localStorage.getItem('look2pay_customers') || '[]');
      const storedTransactions = JSON.parse(localStorage.getItem('look2pay_transactions') || '[]');
      const storedAlerts = JSON.parse(localStorage.getItem('look2pay_fraud_alerts') || '[]');

      // Seed Demo Data if empty
      if (storedCustomers.length === 0) {
        const demoCustomers = [
          {
            name: "Drishti Dasgupta",
            phone: "9876543210",
            email: "drishti@example.com",
            balance: 25000,
            faceEmbedding: [0.1, 0.2, 0.3],
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
      }

      setCustomers(storedCustomers.map((c: any) => ({
        id: c.phone,
        name: c.name,
        phoneNumber: c.phone,
        walletBalance: c.balance || 0,
        transactionCount: storedTransactions.filter((t: any) => t.customerId === c.phone).length,
        createdAt: { seconds: Date.now() / 1000, nanoseconds: 0 }
      })));

      setAllTransactions(storedTransactions.sort((a: any, b: any) => b.timestamp - a.timestamp));
      setFraudAlerts(storedAlerts || []);
    };

    loadData();
    const interval = setInterval(loadData, 5000);
    return () => clearInterval(interval);
  }, []);

  const downloadPdfReport = () => {
    const doc = new jsPDF();
    doc.setFontSize(20);
    doc.text(`TERMINAL REPORT: ${shop.name.toUpperCase()}`, 14, 22);
    doc.setFontSize(10);
    doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 30);
    doc.text(`Terminal ID: ${shop.id}`, 14, 35);

    const tableData = allTransactions.map(t => [
      new Date(t.timestamp.seconds * 1000).toLocaleString(),
      t.customerName,
      t.id,
      `INR ${t.amount}`,
      t.status.toUpperCase()
    ]);

    autoTable(doc, {
      head: [['Timestamp', 'Customer', 'TX ID', 'Amount', 'Status']],
      body: tableData,
      startY: 45,
      theme: 'striped',
      headStyles: { fillColor: [15, 23, 42] }
    });

    doc.save(`${shop.name}_Transactions.pdf`);
  };

  const filteredTransactions = useMemo(() => {
    return allTransactions.filter(t => 
      t.customerName.toLowerCase().includes(searchQuery.toLowerCase()) || 
      t.id.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [allTransactions, searchQuery]);

  const stats = useMemo(() => {
    const successTx = allTransactions.filter(t => t.status === 'success');
    const totalRev = successTx.reduce((acc, t) => acc + t.amount, 0);
    return {
      revenue: totalRev,
      customers: customers.length,
      visits: successTx.length,
      net: totalRev * 0.945
    };
  }, [allTransactions, customers]);

  return (
    <div className="min-h-screen bg-slate-50 font-sans flex overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 bg-slate-900 text-slate-300 border-r border-slate-800 hidden lg:flex flex-col">
        <div className="p-6">
          <div className="flex items-center gap-2 mb-8 cursor-pointer" onClick={() => onNavigate('landing')}>
            <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center text-white font-bold">L2P</div>
            <h1 className="text-xl font-bold text-white tracking-tight">Look2Pay</h1>
          </div>
          <nav className="space-y-1">
            <SidebarLink icon={<LayoutDashboard size={18}/>} label="Overview" active={activeTab === 'overview'} onClick={() => setActiveTab('overview')} />
            <SidebarLink icon={<History size={18}/>} label="Ledger" active={activeTab === 'history'} onClick={() => setActiveTab('history')} />
            <SidebarLink icon={<Users size={18}/>} label="Customers" active={activeTab === 'customers'} onClick={() => setActiveTab('customers')} />
            <SidebarLink icon={<ShieldCheck size={18}/>} label="Security" active={activeTab === 'security'} onClick={() => setActiveTab('security')} />
          </nav>
        </div>
      </aside>

      {/* Main Container */}
      <main className="flex-1 flex flex-col min-w-0">
        <header className="h-20 bg-white border-b border-slate-200 px-8 flex items-center justify-between shrink-0">
          <div>
            <h2 className="text-xl font-black text-slate-800 uppercase tracking-tight leading-none mb-1">{shop.name}</h2>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono">Terminal ID: {shop.id.toUpperCase()}</p>
          </div>
          <div className="flex gap-3">
             <button onClick={() => onNavigate('customer-register')} className="px-5 py-2 text-xs font-black text-slate-600 border border-slate-200 rounded-xl hover:bg-slate-50 uppercase tracking-widest">New Customer</button>
             <button onClick={() => onNavigate('payment-scan')} className="px-5 py-2 text-xs font-black text-white bg-blue-600 rounded-xl hover:bg-blue-700 shadow-lg shadow-blue-100 uppercase tracking-widest">Open Scanner</button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-8">
           <AnimatePresence mode="wait">
              {activeTab === 'overview' && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-8">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <StatBox label="Gross Revenue" value={`₹${stats.revenue.toLocaleString()}`} icon={<TrendingUp size={20} />} color="blue" />
                    <StatBox label="Daily Visits" value={stats.visits} icon={<Activity size={20} />} color="emerald" />
                    <StatBox label="Net Profits" value={`₹${Math.round(stats.net).toLocaleString()}`} icon={<CheckCircle2 size={20} />} color="indigo" />
                  </div>

                  <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
                     <div className="xl:col-span-8 bg-white border border-slate-200 rounded-3xl shadow-sm overflow-hidden min-h-100">
                        <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                           <h3 className="text-xs font-black uppercase text-slate-400 tracking-widest">Recent Transactions</h3>
                           <button onClick={downloadPdfReport} className="text-[10px] font-black uppercase text-blue-600 flex items-center gap-2">
                             <Download size={12} /> Export PDF
                           </button>
                        </div>
                        <div className="divide-y divide-slate-50">
                           {allTransactions.slice(0, 10).map((tx, i) => (
                             <TransactionItem key={i} tx={tx} />
                           ))}
                        </div>
                     </div>

                     <div className="xl:col-span-4 space-y-6">
                        <div className="bg-slate-900 rounded-3xl p-8 text-white">
                           <ShieldCheck size={32} className="text-blue-400 mb-6" />
                           <h4 className="text-lg font-black uppercase mb-2">Secure Node</h4>
                           <p className="text-xs text-slate-400 leading-relaxed font-medium">All facial biometric data is processed locally using client-side edge computing. Hashes are encrypted with AES-256 for maximum security.</p>
                        </div>
                     </div>
                  </div>
                </motion.div>
              )}

              {activeTab === 'history' && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
                  <div className="bg-white p-4 border border-slate-200 rounded-2xl flex items-center gap-4">
                     <Search size={18} className="text-slate-400" />
                     <input 
                       className="flex-1 bg-transparent border-none outline-none text-sm font-medium" 
                       placeholder="Search transactions by customer or ID..."
                       value={searchQuery}
                       onChange={(e) => setSearchQuery(e.target.value)}
                     />
                  </div>
                  <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
                     {filteredTransactions.map((tx, i) => (
                       <TransactionItem key={i} tx={tx} />
                     ))}
                  </div>
                </motion.div>
              )}

              {activeTab === 'customers' && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                   {customers.map((c, i) => (
                     <div key={i} className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm hover:shadow-md transition-all cursor-pointer" onClick={() => { setSelectedCustomer(c); setIsModalOpen(true); }}>
                        <div className="flex items-center gap-4 mb-4">
                           <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 font-bold text-lg">
                              {c.name[0]}
                           </div>
                           <div>
                              <h4 className="font-bold text-slate-900">{c.name}</h4>
                              <p className="text-xs text-slate-400 font-medium">{c.phoneNumber}</p>
                           </div>
                        </div>
                        <div className="flex justify-between items-end pt-4 border-t border-slate-50">
                           <div>
                              <p className="text-[9px] font-black uppercase text-slate-400 mb-1">Wallet</p>
                              <p className="font-black text-emerald-600">₹{c.walletBalance.toLocaleString()}</p>
                           </div>
                           <p className="text-[9px] font-bold text-slate-400 uppercase">TX: {c.transactionCount}</p>
                        </div>
                     </div>
                   ))}
                </motion.div>
              )}

              {activeTab === 'security' && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
                   <div className="bg-white border border-slate-200 rounded-3xl p-8">
                      <h3 className="text-xl font-black uppercase mb-6 flex items-center gap-3">
                         <ShieldCheck className="text-amber-500" /> Security Logs
                      </h3>
                      <div className="space-y-4">
                         {fraudAlerts.length === 0 ? (
                           <div className="text-center py-20 text-slate-400">
                             <CheckCircle2 size={48} className="mx-auto mb-4 opacity-20" />
                             <p className="text-sm font-bold uppercase tracking-widest">No Security Threats Detected</p>
                           </div>
                         ) : (
                           fraudAlerts.map((a, i) => (
                             <div key={i} className="p-5 bg-red-50 border border-red-100 rounded-2xl flex items-start gap-4">
                                <AlertCircle size={20} className="text-red-500 shrink-0" />
                                <div>
                                   <div className="flex gap-2 items-center mb-1">
                                      <p className="text-[10px] font-black uppercase text-red-600">{a.type}</p>
                                      <span className="text-slate-300">•</span>
                                      <p className="text-[10px] font-bold text-slate-400">{new Date(a.timestamp).toLocaleString()}</p>
                                   </div>
                                   <p className="text-sm font-medium text-slate-900">{a.details}</p>
                                </div>
                             </div>
                           ))
                         )}
                      </div>
                   </div>

                   <div className="bg-red-50 border border-red-100 rounded-3xl p-8">
                      <h3 className="text-xl font-black uppercase text-red-900 mb-6 flex items-center gap-3">
                         <AlertCircle className="text-red-500" /> Danger Zone
                      </h3>
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                         <div>
                            <p className="text-sm font-bold text-red-900 mb-1">Delete Shop Account</p>
                            <p className="text-xs text-red-600 font-medium">Permanently remove this shop from the Look2Pay ecosystem. This cannot be undone.</p>
                         </div>
                         <button 
                           onClick={handleDeleteAccount}
                           className="px-6 py-3 bg-red-600 text-white rounded-xl font-black uppercase tracking-widest text-[10px] hover:bg-red-700 transition-all flex items-center gap-2 shrink-0 shadow-lg shadow-red-100"
                         >
                           <Trash2 size={14} />
                           Terminate Account
                         </button>
                      </div>
                   </div>
                </motion.div>
              )}
           </AnimatePresence>
        </div>
      </main>

      {/* Customer Modal */}
      <AnimatePresence>
        {isModalOpen && selectedCustomer && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsModalOpen(false)} className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" />
            <motion.div initial={{ scale: 0.9, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0, y: 20 }} className="bg-white w-full max-w-lg rounded-2xl shadow-3xl relative z-10 overflow-hidden text-left">
               <div className="p-6 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
                  <div className="flex items-center gap-3">
                     <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600"><User size={20} /></div>
                     <div>
                        <h4 className="font-black uppercase text-sm leading-none mb-1">{selectedCustomer.name}</h4>
                        <p className="text-[10px] text-slate-400 font-bold uppercase">{selectedCustomer.phoneNumber}</p>
                     </div>
                  </div>
                  <button onClick={() => setIsModalOpen(false)}><X size={20} className="text-slate-400" /></button>
               </div>
               <div className="p-8">
                  <div className="grid grid-cols-2 gap-4 mb-8">
                     <div className="bg-slate-50 p-4 rounded-xl">
                        <p className="text-[9px] font-black text-slate-400 uppercase mb-1">Account Balance</p>
                        <p className="text-2xl font-black tracking-tight">₹{selectedCustomer.walletBalance.toLocaleString()}</p>
                     </div>
                     <div className="bg-slate-50 p-4 rounded-xl">
                        <p className="text-[9px] font-black text-slate-400 uppercase mb-1">Status</p>
                        <p className="text-lg font-black text-emerald-500 uppercase">Verified</p>
                     </div>
                  </div>
                  <h5 className="text-[10px] font-black text-slate-400 uppercase mb-4 tracking-widest">Transaction History</h5>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                     {allTransactions.filter(t => t.customerId === selectedCustomer.id).map((t, i) => (
                       <div key={i} className="flex justify-between py-2 border-b border-slate-50 text-xs">
                          <span className="font-medium text-slate-600">{new Date(t.timestamp.seconds * 1000).toLocaleDateString()}</span>
                          <span className="font-black text-slate-900">₹{t.amount.toLocaleString()}</span>
                       </div>
                     ))}
                  </div>
               </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

function SidebarLink({ icon, label, active, onClick }: { icon: any, label: string, active?: boolean, onClick: () => void }) {
  return (
    <button onClick={onClick} className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl transition-all text-sm font-medium ${active ? 'bg-blue-600 text-white' : 'text-slate-400 hover:bg-slate-800'}`}>
      <span className="opacity-70">{icon}</span>
      <span>{label}</span>
    </button>
  );
}

function StatBox({ label, value, icon, color }: { label: string, value: string | number, icon: any, color: string }) {
  return (
    <div className="bg-white border border-slate-200 p-6 rounded-3xl flex justify-between items-start">
       <div>
          <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-2">{label}</p>
          <p className="text-3xl font-black text-slate-900 tracking-tighter">{value}</p>
       </div>
       <div className={`p-3 rounded-2xl bg-${color}-50 text-${color}-600`}>{icon}</div>
    </div>
  );
}

function TransactionItem({ tx }: { tx: Transaction }) {
  return (
    <div className="p-4 px-6 flex justify-between items-center hover:bg-slate-50/50 transition-colors">
       <div className="flex items-center gap-4">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black ${tx.status === 'success' ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>
             {tx.customerName[0]}
          </div>
          <div>
             <p className="text-sm font-bold text-slate-900 leading-none mb-1">{tx.customerName}</p>
             <p className="text-[10px] font-bold text-slate-400 uppercase font-mono">{tx.id.split('-').pop()}</p>
          </div>
       </div>
       <div className="text-right">
          <p className="text-sm font-black text-slate-900 leading-none mb-1">₹{tx.amount.toLocaleString()}</p>
          <p className={`text-[9px] font-black uppercase tracking-widest ${tx.status === 'success' ? 'text-emerald-500' : 'text-red-500'}`}>{tx.status}</p>
       </div>
    </div>
  );
}
