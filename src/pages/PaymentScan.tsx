import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ViewState } from '../types';
import CameraView from '../components/CameraView';
import { getFaceEmbedding, compareEmbeddings, detectFace, isBlinking, isSmiling } from '../utils/faceApi';
import { ArrowLeft, Loader2, ShieldCheck, CreditCard, Sparkles, AlertCircle, CheckCircle2, QrCode, Camera } from 'lucide-react';
import confetti from 'canvas-confetti';

interface PaymentScanProps {
  onNavigate: (view: ViewState) => void;
}

type PaymentStep = 'prepare' | 'scan' | 'verify' | 'otp' | 'processing' | 'success';

export default function PaymentScan({ onNavigate }: PaymentScanProps) {
  const [step, setStep] = useState<PaymentStep>('prepare');
  const [amount, setAmount] = useState('0');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [matchedCustomer, setMatchedCustomer] = useState<any>(null);
  const [livelinessPass, setLivelinessPass] = useState(false);
  const [livelinessInstruction, setLivelinessInstruction] = useState<'blink' | 'smile' | 'none'>('none');
  const [otp, setOtp] = useState(['', '', '', '']);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);
  const livelinessRef = useRef<{ instruction: 'blink' | 'smile' | 'none', passed: boolean }>({ instruction: 'none', passed: false });

  // Update ref when state changes so the loop can see it
  useEffect(() => {
    livelinessRef.current.instruction = livelinessInstruction;
  }, [livelinessInstruction]);

  // Handle OTP focus management
  const handleOtpChange = (index: number, value: string) => {
    if (value.length > 1) value = value[0];
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto focus next
    if (value && index < 3) {
      otpRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  const validateOtpAndPay = () => {
    const enteredOtp = otp.join('');
    if (enteredOtp === '1234') {
      processPayment();
    } else {
      setError("Invalid security code. Please try again (Hint: 1234)");
      setOtp(['', '', '', '']);
      otpRefs.current[0]?.focus();
    }
  };

  const handleStartScan = () => {
    if (parseFloat(amount) <= 0) return;
    setStep('scan');
  };

  const startLivelinessCheck = async () => {
    setLivelinessInstruction('blink');
    let blinkDetected = false;
    let smileDetected = false;

    const checkLoop = async () => {
      if (!videoRef.current || livelinessRef.current.passed) return;

      try {
        const detection = await detectFace(videoRef.current);
        if (detection) {
          if (livelinessRef.current.instruction === 'blink' && isBlinking(detection.landmarks)) {
            blinkDetected = true;
            setLivelinessInstruction('smile');
          } else if (livelinessRef.current.instruction === 'smile' && isSmiling(detection.landmarks)) {
            smileDetected = true;
          }
        }
      } catch (e) {
        console.error("Liveliness tracking error", e);
      }

      if (blinkDetected && smileDetected) {
        setLivelinessInstruction('none');
        setLivelinessPass(true);
        livelinessRef.current.passed = true;
      } else {
        requestAnimationFrame(checkLoop);
      }
    };

    requestAnimationFrame(checkLoop);
  };

  const handleFaceScan = async () => {
    if (!videoRef.current) return;
    setIsAnalyzing(true);
    setError(null);

    try {
      const embedding = await getFaceEmbedding(videoRef.current);
      if (!embedding) {
        setError("No face detected. Please center your face.");
        setIsAnalyzing(false);
        return;
      }

      const customers = JSON.parse(localStorage.getItem('look2pay_customers') || '[]');
      let match = null;
      
      for (const c of customers) {
        if (compareEmbeddings(embedding, new Float32Array(c.embedding))) {
          match = c;
          break;
        }
      }

      if (!match) {
        setError("Customer not found. Please register first.");
        setIsAnalyzing(false);
        return;
      }

      setMatchedCustomer(match);
      setIsAnalyzing(false);
      setStep('verify');
      
      // Start actual detection
      livelinessRef.current.passed = false;
      startLivelinessCheck();

    } catch (err) {
      console.error(err);
      setError("AI processing failed. Please try again.");
      setIsAnalyzing(false);
    }
  };

  const handleFinalize = () => {
    if (parseFloat(amount) > 6000) {
      setStep('otp');
    } else {
      processPayment();
    }
  };

  const processPayment = async () => {
    setStep('processing');
    await new Promise(r => setTimeout(r, 2000));
    
    // Update balance in "DB"
    const customers = JSON.parse(localStorage.getItem('look2pay_customers') || '[]');
    const transactionId = `TXN-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
    
    // Create transaction record
    const newTransaction = {
      id: transactionId,
      shopId: 's1', // Default shop for demo
      customerId: matchedCustomer.phone, // Using phone as unique ID in this demo
      customerName: matchedCustomer.name,
      amount: parseFloat(amount),
      timestamp: { seconds: Math.floor(Date.now() / 1000), nanoseconds: 0 },
      status: 'success'
    };

    const existingTransactions = JSON.parse(localStorage.getItem('look2pay_transactions') || '[]');
    localStorage.setItem('look2pay_transactions', JSON.stringify([newTransaction, ...existingTransactions]));

    const updated = customers.map((c: any) => {
      if (c.phone === matchedCustomer.phone) {
        return { ...c, wallet: c.wallet - parseFloat(amount), transactionCount: (c.transactionCount || 0) + 1 };
      }
      return c;
    });
    localStorage.setItem('look2pay_customers', JSON.stringify(updated));

    setStep('success');
    confetti({
      particleCount: 150,
      spread: 100,
      colors: ['#2563eb', '#141414']
    });
  };

  return (
    <div className="min-h-screen py-8 px-6 flex flex-col items-center">
      <header className="w-full max-w-2xl flex items-center justify-between mb-8">
        <button 
          onClick={() => onNavigate('landing')}
          className="p-2 hover:bg-neutral-100 rounded-full transition-colors"
        >
          <ArrowLeft className="w-6 h-6" />
        </button>
        <div className="flex flex-col items-center">
          <h2 className="text-sm font-black uppercase tracking-[0.3em] text-neutral-400">Terminal 082</h2>
          <p className="text-[10px] font-bold text-blue-600 uppercase tracking-widest">Look2Pay Secure Node</p>
        </div>
        <div className="w-10" />
      </header>

      <main className="w-full max-w-md">
        <AnimatePresence mode="wait">
          {step === 'prepare' && (
            <motion.div
              key="prepare"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white p-8 rounded-[2.5rem] border border-neutral-100 shadow-2xl shadow-neutral-100 mt-8"
            >
              <div className="text-center mb-10">
                <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mx-auto mb-6 text-blue-600 shadow-sm">
                  <CreditCard className="w-8 h-8" />
                </div>
                <h3 className="text-3xl font-black uppercase mb-2 tracking-tight">Payment Request</h3>
                <p className="text-neutral-500 text-sm">Review transaction details before scanning.</p>
              </div>

              <div className="bg-neutral-50 p-6 rounded-3xl mb-8 border border-neutral-100">
                <div className="flex justify-between items-center mb-6">
                  <span className="text-[10px] font-black uppercase tracking-widest text-neutral-400">Merchant</span>
                  <span className="font-bold flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-yellow-500" />
                    XYZ STORE NAME
                  </span>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase tracking-widest text-neutral-400">Enter Amount</label>
                  <div className="flex items-center gap-2">
                    <span className="text-4xl font-black text-neutral-400">₹</span>
                    <input 
                      type="number"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      className="text-5xl font-black w-full bg-transparent outline-none focus:text-neutral-900 transition-colors"
                      placeholder="0.00"
                    />
                  </div>
                </div>
              </div>

              <button
                onClick={handleStartScan}
                className="w-full py-5 bg-neutral-900 text-white rounded-2xl font-black uppercase tracking-widest hover:bg-neutral-800 transition-all flex items-center justify-center gap-3 overflow-hidden group border-2 border-neutral-900"
              >
                Launch Face Terminal
              </button>
            </motion.div>
          )}

          {(step === 'scan' || step === 'verify') && (
            <motion.div
              key="scan"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-6 flex flex-col h-full"
            >
              <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm overflow-hidden flex flex-col flex-1">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-slate-800">
                    {step === 'scan' ? 'Live Identity Verification' : 'Customer Authenticated'}
                  </h3>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Feed #1 • 1080p</span>
                </div>

                <div className="relative flex-1 bg-slate-100 rounded-xl overflow-hidden group">
                  <CameraView 
                    className={`w-full h-full ${step === 'verify' ? 'ring-4 ring-blue-500 ring-inset' : ''}`}
                    onVideoLoad={(v) => videoRef.current = v}
                    overlay={
                      <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center">
                        {/* Detection Circle - from design */}
                        <div className="w-56 h-56 border-2 border-dashed border-blue-400/40 rounded-full flex items-center justify-center">
                          <div className="w-48 h-48 border border-blue-300/20 rounded-full" />
                        </div>
                        
                        {step === 'scan' && (
                          <motion.div 
                            animate={{ opacity: [0.4, 1, 0.4] }}
                            transition={{ duration: 2, repeat: Infinity }}
                            className="mt-4 text-[10px] font-bold text-blue-400 uppercase tracking-widest italic"
                          >
                            Align face with center zone
                          </motion.div>
                        )}
                        
                        {step === 'verify' && (
                           <div className="absolute inset-0 flex items-center justify-center bg-slate-900/10 backdrop-blur-[1px]">
                              <motion.div
                                initial={{ scale: 0, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                className="bg-white p-5 rounded-2xl flex items-center gap-4 shadow-2xl border border-slate-100"
                              >
                                  <div className="w-10 h-10 bg-emerald-500 rounded-full flex items-center justify-center text-white">
                                    <CheckCircle2 size={24} />
                                  </div>
                                  <div className="text-left">
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tight mb-0.5">Matched Profile</p>
                                    <p className="text-lg font-bold text-slate-900 leading-none">{matchedCustomer?.name}</p>
                                  </div>
                              </motion.div>
                           </div>
                        )}
                      </div>
                    }
                  />
                  
                  {/* Liveliness Instructions Overlay */}
                  <AnimatePresence>
                    {livelinessInstruction !== 'none' && (
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="absolute bottom-16 left-1/2 -translate-x-1/2 bg-blue-600 text-white px-6 py-3 rounded-full font-bold uppercase tracking-widest text-xs shadow-xl min-w-[200px] text-center"
                      >
                         {livelinessInstruction === 'blink' ? "Blink your eyes" : "Give us a big smile"}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                <div className="mt-6 grid grid-cols-5 gap-4 items-stretch">
                   <div className="col-span-3 bg-slate-50 p-4 rounded-xl border border-slate-100 flex flex-col justify-center">
                     <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Invoice Total</label>
                     <p className="text-2xl font-bold text-slate-800">₹{parseFloat(amount).toLocaleString()}</p>
                   </div>
                   
                   {step === 'scan' ? (
                     <button
                       disabled={isAnalyzing}
                       onClick={handleFaceScan}
                       className="col-span-2 bg-blue-600 text-white rounded-xl font-bold uppercase tracking-widest text-sm hover:bg-blue-700 active:scale-95 transition-all shadow-lg shadow-blue-100 flex items-center justify-center gap-2"
                     >
                        {isAnalyzing ? <Loader2 className="w-5 h-5 animate-spin" /> : <Camera size={18} />}
                        {isAnalyzing ? "..." : "SCAN"}
                     </button>
                   ) : (
                     <button
                       disabled={!livelinessPass}
                       onClick={handleFinalize}
                       className="col-span-2 bg-slate-900 text-white rounded-xl font-bold uppercase tracking-widest text-sm hover:bg-slate-800 active:scale-95 transition-all disabled:opacity-30 disabled:grayscale"
                     >
                        AUTH & PAY
                     </button>
                   )}
                </div>
              </div>

              {error && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center gap-3 p-4 bg-amber-50 text-amber-700 rounded-xl text-xs font-bold border border-amber-100"
                >
                  <AlertCircle size={18} className="shrink-0" />
                  {error}
                </motion.div>
              )}
            </motion.div>
          )}

          {step === 'otp' && (
            <motion.div
              key="otp"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white p-8 rounded-[2.5rem] border border-neutral-100 shadow-2xl text-center"
            >
              <h3 className="text-3xl font-black uppercase mb-2 tracking-tight">High Value Check</h3>
              <p className="text-neutral-500 text-sm mb-10 max-w-xs mx-auto">Amount exceeds ₹6,000. For security, please enter the OTP sent to your registered phone.</p>
              
              <div className="flex gap-4 justify-center mb-10">
                {[0, 1, 2, 3].map((i) => (
                  <input
                    key={i}
                    ref={el => otpRefs.current[i] = el}
                    type="text"
                    maxLength={1}
                    value={otp[i]}
                    onChange={(e) => handleOtpChange(i, e.target.value)}
                    onKeyDown={(e) => handleOtpKeyDown(i, e)}
                    className="w-14 h-14 bg-neutral-50 border-2 border-neutral-200 focus:border-neutral-900 rounded-2xl text-center text-2xl font-black outline-none transition-all"
                  />
                ))}
              </div>

              {error && (
                <div className="mb-6 p-3 bg-amber-50 text-amber-600 rounded-xl text-xs font-bold border border-amber-100">
                  {error}
                </div>
              )}

              <button
                onClick={validateOtpAndPay}
                className="w-full py-5 bg-neutral-900 text-white rounded-2xl font-black uppercase tracking-widest hover:bg-neutral-800 transition-all border-2 border-neutral-900"
              >
                Validate & Pay
              </button>
            </motion.div>
          )}

          {step === 'processing' && (
            <motion.div
              key="processing"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="py-12 flex flex-col items-center text-center"
            >
              <div className="relative w-32 h-32 mb-8">
                <div className="absolute inset-0 rounded-full border-4 border-neutral-100" />
                <motion.div 
                   animate={{ rotate: 360 }}
                   transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                   className="absolute inset-0 rounded-full border-4 border-t-blue-600 border-r-transparent border-b-transparent border-l-transparent"
                />
                <div className="absolute inset-0 flex items-center justify-center text-blue-600">
                  <CreditCard className="w-10 h-10" />
                </div>
              </div>
              <h3 className="text-3xl font-black uppercase mb-2 tracking-tight">Authorizing</h3>
              <p className="text-neutral-500 font-medium opacity-60">Updating digital ledger...</p>
            </motion.div>
          )}

          {step === 'success' && (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="py-8 flex flex-col items-center text-center w-full"
            >
              <div className="w-24 h-24 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-8 shadow-xl shadow-green-50">
                <CheckCircle2 className="w-12 h-12" />
              </div>
              <h3 className="text-4xl font-black uppercase mb-2 tracking-tight">Payment Complete</h3>
              <p className="text-neutral-500 mb-10">Transaction was successful and finalized.</p>
              
              <div className="w-full bg-white p-8 rounded-[2rem] border border-neutral-100 shadow-xl mb-10 text-left">
                <div className="flex justify-between items-center mb-6 border-b border-dashed border-neutral-200 pb-4">
                  <span className="text-[10px] font-black uppercase tracking-[0.2em] text-neutral-400">Reference ID</span>
                  <span className="text-xs font-mono font-bold uppercase tracking-wider">L2P-829-XJ9</span>
                </div>
                
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-[10px] font-black uppercase text-neutral-400">Customer</span>
                    <span className="text-sm font-bold uppercase">{matchedCustomer?.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[10px] font-black uppercase text-neutral-400">Merchant</span>
                    <span className="text-sm font-bold uppercase">XYZ STORE NAME</span>
                  </div>
                  <div className="flex justify-between pt-4 border-t border-neutral-100">
                    <span className="text-[10px] font-black uppercase text-neutral-400">Total Amount</span>
                    <span className="text-xl font-black">₹{parseFloat(amount).toLocaleString()}</span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => onNavigate('landing')}
                className="w-full py-5 bg-neutral-900 text-white rounded-2xl font-black uppercase tracking-widest hover:bg-neutral-800 transition-all border-2 border-neutral-900"
              >
                Finish
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <div className="mt-auto py-8">
        <div className="bg-neutral-100 px-4 py-2 rounded-full flex items-center gap-2">
           <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
           <span className="text-[10px] font-black uppercase tracking-[0.2em] text-neutral-400">Biometric Gateway Secure</span>
        </div>
      </div>
    </div>
  );
}
