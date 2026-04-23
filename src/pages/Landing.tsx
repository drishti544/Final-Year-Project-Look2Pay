import { motion } from 'motion/react';
import { ViewState } from '../types';
import { Camera, Store, UserPlus, CreditCard, ShieldCheck, Zap } from 'lucide-react';

interface LandingProps {
  onNavigate: (view: ViewState) => void;
}

export default function Landing({ onNavigate }: LandingProps) {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      {/* Hero Section */}
      <section className="px-6 py-20 md:py-32 flex flex-col items-center text-center overflow-hidden">
        <motion.div
           initial={{ opacity: 0, y: 20 }}
           animate={{ opacity: 1, y: 0 }}
           transition={{ duration: 0.6 }}
           className="mb-8 flex items-center gap-2 px-3 py-1 rounded border border-slate-200 bg-white shadow-sm"
        >
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Secure Biometric Engine v2.0</span>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8 }}
          className="flex items-center gap-3 mb-6"
        >
          <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center text-white font-black text-2xl shadow-lg ring-4 ring-blue-50/50">L2P</div>
          <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-slate-900 uppercase">Look2Pay</h1>
        </motion.div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.3 }}
          className="max-w-2xl text-base md:text-lg text-slate-500 mb-12 leading-relaxed"
        >
          Institutional-grade facial recognition for local retail. Accelerate your checkout with secure, liveliness-verified payment protocols. No cards. No apps. Just you.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="flex flex-col sm:flex-row gap-4 w-full max-w-md px-6"
        >
          <button
            onClick={() => onNavigate('payment-scan')}
            className="flex-1 px-8 py-4 bg-slate-900 text-white rounded-lg font-bold uppercase tracking-widest text-sm hover:bg-slate-800 transition-all flex items-center justify-center gap-3 group shadow-xl shadow-slate-200"
          >
            <Camera size={18} className="group-hover:scale-110 transition-transform" />
            Scanner Terminal
          </button>
          <button
            onClick={() => onNavigate('customer-register')}
            className="flex-1 px-8 py-4 bg-white border border-slate-200 text-slate-700 rounded-lg font-bold uppercase tracking-widest text-sm hover:border-slate-800 transition-all flex items-center justify-center gap-3 group shadow-sm"
          >
            <UserPlus size={18} className="group-hover:scale-110 transition-transform" />
            Join Network
          </button>
        </motion.div>
      </section>

      {/* Feature Grid - Slate Style */}
      <section className="bg-white py-24 px-6 border-y border-slate-200">
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-12">
          <FeatureCard
            icon={<ShieldCheck className="w-8 h-8 text-blue-600" />}
            title="Biometric Security"
            description="Liveliness detection and encrypted embeddings ensure only the real you can pay."
          />
          <FeatureCard
            icon={<Zap className="w-8 h-8 text-blue-600" />}
            title="Rapid Auth"
            description="Recognition completed in under 2 seconds. Optimized for high-throughput retail."
          />
          <FeatureCard
            icon={<Store className="w-8 h-8 text-blue-600" />}
            title="Merchant Control"
            description="Administrative tools and deep ledger analytics for your small business."
          />
        </div>
      </section>

      {/* Technical Architecture - B.Tech Project Style */}
      <section className="bg-slate-900 py-24 px-6 text-white overflow-hidden relative">
        <div className="absolute inset-0 opacity-10 pointer-events-none">
          <div className="h-full w-full" style={{ backgroundImage: 'radial-gradient(#ffffff 1px, transparent 1px)', backgroundSize: '30px 30px' }} />
        </div>
        
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row gap-12 items-center">
            <div className="flex-1 text-left">
              <div className="inline-block px-3 py-1 bg-blue-500/20 rounded border border-blue-500/30 text-blue-400 text-[10px] font-bold uppercase tracking-widest mb-6">System Architecture</div>
              <h2 className="text-4xl font-bold mb-6 tracking-tight">Machine Learning <br /><span className="text-blue-500">Processing Pipeline</span></h2>
              <div className="space-y-6 text-slate-400 text-sm">
                <p>Look2Pay utilizes a multi-stage convolutional neural network (CNN) architecture for real-time biometric authentication and fraudulent access prevention.</p>
                <ul className="space-y-4">
                  <li className="flex gap-4">
                    <div className="w-6 h-6 rounded-full bg-slate-800 flex items-center justify-center text-xs font-bold text-white shrink-0">01</div>
                    <div>
                      <p className="text-white font-bold">Face Detection (SSD / MobileNet)</p>
                      <p className="text-[11px]">Real-time spatial localization of facial features with 98% precision using vectorized bounding boxes.</p>
                    </div>
                  </li>
                  <li className="flex gap-4">
                    <div className="w-6 h-6 rounded-full bg-slate-800 flex items-center justify-center text-xs font-bold text-white shrink-0">02</div>
                    <div>
                      <p className="text-white font-bold">128D Embedding Extraction</p>
                      <p className="text-[11px]">Transformation of facial geometry into an immutable 128-dimensional mathematical vector (Biometric Hash).</p>
                    </div>
                  </li>
                  <li className="flex gap-4">
                    <div className="w-6 h-6 rounded-full bg-slate-800 flex items-center justify-center text-xs font-bold text-white shrink-0">03</div>
                    <div>
                      <p className="text-white font-bold">Euclidean Distance Analysis</p>
                      <p className="text-[11px]">High-speed comparison of live vectors against indexed database records using optimized distance metrics.</p>
                    </div>
                  </li>
                  <li className="flex gap-4">
                    <div className="w-6 h-6 rounded-full bg-slate-800 flex items-center justify-center text-xs font-bold text-white shrink-0">04</div>
                    <div>
                      <p className="text-white font-bold">Liveliness Consistency Check</p>
                      <p className="text-[11px]">Dynamic EAR (Eye Aspect Ratio) monitoring to confirm physiological presence and prevent spoofing.</p>
                    </div>
                  </li>
                </ul>
              </div>
            </div>
            
            <div className="flex-1 w-full max-w-sm">
               <div className="aspect-square bg-slate-800 rounded-3xl border border-slate-700 p-8 flex flex-col justify-center relative group">
                  <div className="absolute top-4 right-4 text-[10px] font-mono text-blue-500/50">PROTOCOL_V2_ANALYSIS</div>
                  <div className="space-y-6">
                    <div className="h-2 w-3/4 bg-slate-700 rounded animate-pulse" />
                    <div className="grid grid-cols-6 gap-2">
                      {[...Array(24)].map((_, i) => (
                        <div key={i} className={`h-8 rounded ${i % 3 === 0 ? 'bg-blue-500/40' : 'bg-slate-700'}`} />
                      ))}
                    </div>
                    <div className="h-32 border border-slate-700 rounded-xl flex items-center justify-center overflow-hidden">
                       <div className="flex gap-2 items-end h-16">
                          {[...Array(12)].map((_, i) => (
                            <motion.div 
                              key={i} 
                              animate={{ height: [10, 40, 20, 60, 15] }}
                              transition={{ duration: 2, repeat: Infinity, delay: i * 0.1 }}
                              className="w-2 bg-blue-500 rounded-t" 
                            />
                          ))}
                       </div>
                    </div>
                  </div>
                  <div className="mt-8 pt-8 border-t border-slate-700 flex justify-between">
                     <div>
                        <p className="text-[8px] uppercase font-bold text-slate-500">Avg Latency</p>
                        <p className="text-xl font-bold text-white">420ms</p>
                     </div>
                     <div>
                        <p className="text-[8px] uppercase font-bold text-slate-500">Model Precision</p>
                        <p className="text-xl font-bold text-emerald-400">99.4%</p>
                     </div>
                  </div>
               </div>
            </div>
          </div>
        </div>
      </section>

      {/* Merchant CTA */}
      <section className="py-24 px-6 text-center bg-slate-50">
        <h2 className="text-3xl font-bold text-slate-800 uppercase tracking-tight mb-4">Merchant Onboarding</h2>
        <p className="text-slate-500 mb-10 max-w-lg mx-auto text-sm">Integrate Look2Pay into your existing POS system today.</p>
        <button
          onClick={() => onNavigate('shop-dashboard')}
          className="px-8 py-3 bg-white border border-slate-200 text-slate-900 rounded-lg font-bold uppercase tracking-widest text-xs flex items-center gap-2 mx-auto hover:bg-slate-900 hover:text-white transition-all shadow-sm"
        >
          <Store size={16} />
          Access Admin Dashboard
        </button>
      </section>

      <footer className="mt-auto py-12 px-6 border-t border-slate-200 text-center text-[10px] font-bold uppercase tracking-[0.25em] text-slate-400">
        L2P Protocol • Registered in Bengaluru • © 2026
      </footer>
    </div>
  );
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode, title: string, description: string }) {
  return (
    <motion.div
      whileHover={{ y: -5 }}
      className="flex flex-col items-center text-center p-8 bg-slate-50 rounded-2xl border border-slate-100 shadow-sm"
    >
      <div className="mb-6">{icon}</div>
      <h3 className="text-sm font-bold uppercase mb-3 tracking-widest text-slate-800">{title}</h3>
      <p className="text-slate-500 text-xs leading-relaxed">{description}</p>
    </motion.div>
  );
}

