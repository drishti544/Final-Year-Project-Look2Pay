import { useState, useRef } from 'react';
import { motion } from 'motion/react';
import { ViewState } from '../types';
import CameraView from '../components/CameraView';
import { getFaceEmbedding } from '../utils/faceApi';
import { User, Phone, ArrowLeft, CheckCircle2, UserPlus, Loader2 } from 'lucide-react';
import confetti from 'canvas-confetti';

interface CustomerRegisterProps {
  onNavigate: (view: ViewState) => void;
}

export default function CustomerRegister({ onNavigate }: CustomerRegisterProps) {
  const [step, setStep] = useState<'info' | 'scan' | 'success'>('info');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  const handleNext = () => {
    if (name && phone) setStep('scan');
  };

  const handleScan = async () => {
    if (!videoRef.current) return;
    setIsScanning(true);
    setError(null);

    try {
      // Simulate real processing time for "AI feel"
      await new Promise(r => setTimeout(r, 1500));
      
      const embedding = await getFaceEmbedding(videoRef.current);
      
      if (!embedding) {
        setError("Could not detect face. Ensure you're in a well-lit area.");
        setIsScanning(false);
        return;
      }

      // In a real app, we'd save this to Firestore here
      // For now, we'll store it in localStorage to simulate "memory" for the payment demo
      const mockCustomer = {
        name,
        phone,
        embedding: Array.from(embedding),
        wallet: 5000,
        createdAt: new Date().toISOString()
      };
      
      const existing = JSON.parse(localStorage.getItem('look2pay_customers') || '[]');
      localStorage.setItem('look2pay_customers', JSON.stringify([...existing, mockCustomer]));

      setIsScanning(false);
      setStep('success');
      confetti({
        particleCount: 150,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#2563eb', '#141414', '#ffffff']
      });
    } catch (err) {
      console.error(err);
      setError("An error occurred during scanning. Please try again.");
      setIsScanning(false);
    }
  };

  return (
    <div className="min-h-screen py-12 px-6 flex flex-col items-center bg-slate-50">
      <header className="w-full max-w-2xl flex items-center justify-between mb-12">
        <button 
          onClick={() => onNavigate('landing')}
          className="p-2 hover:bg-white rounded-full transition-colors border border-transparent hover:border-slate-200"
        >
          <ArrowLeft className="w-6 h-6 text-slate-500" />
        </button>
        <div className="text-center">
          <h2 className="text-sm font-black uppercase tracking-[0.3em] text-slate-400">Node Registration</h2>
          <p className="text-[10px] font-bold text-blue-600 uppercase tracking-widest">Biometric Enrollment</p>
        </div>
        <div className="w-10" />
      </header>

      <main className="w-full max-w-xl">
        {step === 'info' && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white p-10 rounded-[2rem] border border-slate-200 shadow-xl shadow-slate-200/50"
          >
            <div className="mb-8">
              <h3 className="text-2xl font-bold text-slate-900 uppercase tracking-tight mb-2">Create Identity</h3>
              <p className="text-slate-500 text-sm">Securely link your face to your digital wallet.</p>
            </div>

            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 ml-1">Full Name</label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input 
                    type="text" 
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Enter your name"
                    className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-100 focus:border-blue-500 focus:bg-white rounded-xl outline-none transition-all font-medium text-slate-800"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 ml-1">Mobile Access</label>
                <div className="relative">
                  <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input 
                    type="tel" 
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+91"
                    className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-100 focus:border-blue-500 focus:bg-white rounded-xl outline-none transition-all font-medium text-slate-800"
                  />
                </div>
              </div>

              <button
                disabled={!name || !phone}
                onClick={handleNext}
                className="w-full py-4 bg-blue-600 text-white rounded-xl font-bold uppercase tracking-widest text-sm hover:bg-blue-700 disabled:opacity-30 transition-all shadow-lg shadow-blue-100"
              >
                Proceed to Biometric Scan
              </button>
            </div>
          </motion.div>
        )}

        {step === 'scan' && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-8"
          >
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
              <div className="text-center mb-6">
                <h3 className="text-xl font-bold text-slate-900 uppercase tracking-tight mb-2">Enrollment Feed</h3>
                <p className="text-slate-500 text-xs text-center px-4">Maintain a neutral expression and ensure your face is well-lit.</p>
              </div>

              <div className="aspect-square max-w-[320px] mx-auto rounded-full overflow-hidden border-4 border-slate-100 shadow-inner group relative">
                <CameraView 
                   className="w-full h-full"
                   onVideoLoad={(v) => videoRef.current = v}
                   overlay={
                    <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                      <div className="w-full h-full border-[20px] border-slate-900/40" />
                      <div className="absolute inset-0 border-2 border-blue-400/30 rounded-full scale-95 border-dashed" />
                    </div>
                  }
                />
              </div>

              {error && (
                <div className="mt-6 p-4 bg-amber-50 text-amber-700 rounded-xl text-xs font-bold border border-amber-100 text-center">
                  {error}
                </div>
              )}

              <button
                disabled={isScanning}
                onClick={handleScan}
                className="w-full py-4 bg-slate-900 text-white rounded-xl font-bold uppercase tracking-widest text-sm hover:bg-slate-800 transition-all mt-8 flex items-center justify-center gap-3"
              >
                {isScanning ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Generating Vectors...
                  </>
                ) : (
                  <>
                    <UserPlus size={18} />
                    Capture & Verify
                  </>
                )}
              </button>
            </div>
          </motion.div>
        )}

        {step === 'success' && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center text-center bg-white p-12 rounded-[2.5rem] border border-slate-200 shadow-xl"
          >
            <div className="w-20 h-20 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mb-8 border border-emerald-100">
              <CheckCircle2 size={32} />
            </div>
            <h3 className="text-3xl font-bold text-slate-900 uppercase tracking-tight mb-4">Enrollment Complete</h3>
            <p className="text-slate-500 mb-12 text-sm leading-relaxed max-w-xs">Your biometric ID has been successfully added to the Look2Pay network.</p>
            
            <div className="w-full bg-slate-50 p-6 rounded-2xl border border-slate-100 mb-12 text-left">
              <div className="flex justify-between items-center">
                 <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Pre-Authorized Balance</p>
                    <p className="text-2xl font-black text-slate-900 leading-none">₹5,000.00</p>
                 </div>
                 <Sparkles size={24} className="text-blue-500" />
              </div>
            </div>

            <button
              onClick={() => onNavigate('landing')}
              className="w-full py-4 bg-slate-900 text-white rounded-xl font-bold uppercase tracking-widest text-sm hover:bg-slate-800 transition-all"
            >
              Enter Main Protocol
            </button>
          </motion.div>
        )}
      </main>
    </div>
  );
}
