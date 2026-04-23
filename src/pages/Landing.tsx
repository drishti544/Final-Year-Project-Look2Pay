import { motion } from 'motion/react';
import { ViewState } from '../types';
import { Camera, Store, UserPlus, CreditCard, ShieldCheck, Zap, Sparkles } from 'lucide-react';

interface LandingProps {
  onNavigate: (view: ViewState) => void;
  onShopLogin?: (details: {name: string, id: string}) => void;
  onShopSelect?: (details: {name: string, id: string}) => void;
}

export default function Landing({ onNavigate, onShopLogin, onShopSelect }: LandingProps) {
  const handleShopLoginClick = () => {
    const pass = prompt("Manager Key Required:");
    if (!pass) return;

    // Check localStorage for dynamically registered shops
    const storedShops = JSON.parse(localStorage.getItem('look2pay_shops') || '[]');
    const shop = storedShops.find((s: any) => s.pin === pass);

    if (shop) {
      onShopLogin?.({ name: shop.name, id: shop.id });
      return;
    }

    // Default prototype logins
    if (pass === "1234") {
      onShopLogin?.({ name: 'XYZ STORE NAME', id: 's1' });
    } else if (pass === "9999") {
      onShopLogin?.({ name: 'CAMPUS STATIONERY', id: 's2' });
    } else {
      alert("Invalid Access Protocol. No shop found for this key.");
    }
  };

  const handleRegisterShop = () => {
    const shopName = prompt("Enter New Shop Name:");
    if (!shopName) return;

    // Generate a secure random 4-digit PIN
    const generatedPin = Math.floor(1000 + Math.random() * 9000).toString();
    const shopId = 's_' + Date.now();

    const storedShops = JSON.parse(localStorage.getItem('look2pay_shops') || '[]');
    storedShops.push({ id: shopId, name: shopName, pin: generatedPin });
    localStorage.setItem('look2pay_shops', JSON.stringify(storedShops));

    alert(`SUCCESS!\n\nShop: ${shopName}\nManager Key: ${generatedPin}\n\nPlease save this key. It is required to access your dashboard.`);
  };

  const handleStartPayment = () => {
    // Get all shops (Hardcoded + Dynamically registered)
    const storedShops = JSON.parse(localStorage.getItem('look2pay_shops') || '[]');
    const defaultShops = [
      { id: 's1', name: 'XYZ STORE NAME' },
      { id: 's2', name: 'CAMPUS STATIONERY' }
    ];
    const allShops = [...defaultShops, ...storedShops];

    // Simple selection for demo purposes
    const shopNames = allShops.map((s, i) => `${i + 1}. ${s.name}`).join('\n');
    const choice = prompt(`SELECT THE SHOP YOU ARE AT:\n\n${shopNames}\n\nEnter the number:`);
    
    if (choice) {
      const index = parseInt(choice) - 1;
      if (allShops[index]) {
        // Set the active shop in App.tsx state but don't go to dashboard
        onShopSelect?.({ name: allShops[index].name, id: allShops[index].id });
        onNavigate('payment-scan');
      } else {
        alert("Invalid selection.");
      }
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#fafbfc] selection:bg-blue-100 selection:text-blue-900">
      {/* Decorative Background Elements */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-50/50 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[30%] h-[30%] bg-emerald-50/50 rounded-full blur-[100px]" />
        <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(#000 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
      </div>

      {/* Navigation Header */}
      <header className="relative z-10 px-6 py-6 border-b border-slate-100 bg-white/70 backdrop-blur-md">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-2 group cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
            <img src="/logo.png" alt="Look2Pay Logo" className="w-10 h-10 object-contain rounded-lg" onError={(e) => {
              (e.target as HTMLImageElement).style.display = 'none';
              (e.target as HTMLImageElement).parentElement?.querySelector('.fallback-logo')?.classList.remove('hidden');
            }} />
            <div className="fallback-logo hidden w-8 h-8 bg-slate-900 rounded-lg flex items-center justify-center text-white font-black text-xs">L2P</div>
            <span className="font-black text-xl tracking-tighter text-slate-900">LOOK2PAY</span>
          </div>
          <div className="flex gap-2">
            <button 
              onClick={handleRegisterShop}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg text-[10px] font-bold uppercase tracking-widest hover:bg-blue-700 transition-all shadow-sm flex items-center gap-2"
            >
              <Store size={12} />
              Register Shop
            </button>
            <button 
              onClick={handleShopLoginClick}
              className="px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-[10px] font-bold uppercase tracking-widest text-slate-600 hover:bg-slate-900 hover:text-white transition-all shadow-sm"
            >
              Shop Login
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative z-10 px-6 py-24 md:py-40 flex flex-col items-center text-center">
        <motion.div
           initial={{ opacity: 0, y: 20 }}
           animate={{ opacity: 1, y: 0 }}
           transition={{ duration: 0.6 }}
           className="mb-12"
        >
          <img 
            src="/banner.png" 
            alt="Look2Pay Brand Logo" 
            className="w-full max-w-[600px] h-auto object-contain"
            onError={(e) => (e.target as HTMLImageElement).style.display = 'none'}
          />
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="text-6xl md:text-8xl font-black tracking-tight text-slate-900 mb-8 leading-[0.9]"
        >
          PAY WITH <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-emerald-500">YOUR FACE.</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 0.2 }}
          className="max-w-xl text-lg text-slate-500 mb-12 leading-relaxed font-medium"
        >
          No need for cash or cards anymore. Simply look at the camera to pay for your shopping in seconds. Safe, fast, and easy for everyone.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="flex flex-col sm:flex-row gap-4 w-full max-w-lg px-6"
        >
          <button
            onClick={handleStartPayment}
            className="flex-1 px-10 py-5 bg-slate-900 text-white rounded-2xl font-bold uppercase tracking-widest text-xs hover:bg-blue-600 hover:scale-105 transition-all flex items-center justify-center gap-3 group shadow-2xl shadow-blue-100"
          >
            <Zap size={16} className="fill-current" />
            Start Payment
          </button>
          <button
            onClick={() => onNavigate('customer-register')}
            className="flex-1 px-10 py-5 bg-white border border-slate-200 text-slate-700 rounded-2xl font-bold uppercase tracking-widest text-xs hover:border-slate-900 hover:scale-105 transition-all flex items-center justify-center gap-3 group shadow-sm bg-gradient-to-b from-white to-slate-50/50"
          >
            <UserPlus size={18} />
            Register Now
          </button>
        </motion.div>
      </section>

      {/* Feature Grid - Bento Style */}
      <section className="relative z-10 bg-white py-32 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20">
            <h2 className="text-[10px] font-black uppercase tracking-[0.4em] text-blue-500 mb-4">Main Features</h2>
            <p className="text-4xl font-bold text-slate-900 tracking-tight">Built for Local Shops.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <FeatureCard
              icon={<ShieldCheck className="w-6 h-6 text-blue-600" />}
              title="Secure Match"
              description="The system creates a unique code for your face. It is stored safely and used to verify your identity."
              className="md:col-span-1"
            />
            <FeatureCard
              icon={<Zap className="w-6 h-6 text-emerald-500" />}
              title="Very Fast"
              description="Our AI engine works instantly on your device, making payments even faster than using a credit card."
              className="md:col-span-1 border-t-4 border-t-emerald-500"
            />
            <FeatureCard
              icon={<Store className="w-6 h-6 text-blue-600" />}
              title="Transaction Logs"
              description="Shop owners can see a list of all payments and customers in a clean, easy-to-read history."
              className="md:col-span-1"
            />
          </div>
        </div>
      </section>

      {/* Administration Teaser */}
      <section className="relative z-10 py-32 px-6 overflow-hidden">
        <div className="max-w-5xl mx-auto bg-slate-900 rounded-[3rem] p-12 md:p-20 text-center relative shadow-3xl">
          <div className="absolute top-0 right-0 p-12 opacity-10 pointer-events-none">
             <Store className="w-64 h-64 text-white" strokeWidth={0.5} />
          </div>
          
          <h2 className="text-3xl md:text-5xl font-bold text-white tracking-tight mb-6">Shopkeeper Dashboard</h2>
          <p className="text-slate-400 mb-12 max-w-lg mx-auto text-base">Check your total sales, manage customer balances, and view payment history all in one place.</p>
          <button
            onClick={handleShopLoginClick}
            className="px-12 py-4 bg-white text-slate-950 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-blue-500 hover:text-white transition-all shadow-xl active:scale-95"
          >
            Go to Dashboard
          </button>
        </div>
      </section>

    </div>
  );
}

function FeatureCard({ icon, title, description, className = "" }: { icon: React.ReactNode, title: string, description: string, className?: string }) {
  return (
    <motion.div
      whileHover={{ y: -8, shadow: "0 25px 50px -12px rgba(0, 0, 0, 0.1)" }}
      className={`group flex flex-col p-10 bg-slate-50/50 rounded-3xl border border-slate-100 transition-all hover:bg-white hover:border-blue-100 ${className}`}
    >
      <div className="w-12 h-12 rounded-2xl bg-white border border-slate-100 flex items-center justify-center mb-8 shadow-sm group-hover:scale-110 group-hover:shadow-md transition-all">
        {icon}
      </div>
      <h3 className="text-lg font-bold text-slate-900 mb-4 tracking-tight">{title}</h3>
      <p className="text-slate-500 text-sm leading-relaxed font-medium">{description}</p>
    </motion.div>
  );
}

