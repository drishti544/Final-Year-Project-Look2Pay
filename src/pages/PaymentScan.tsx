import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { jsPDF } from 'jspdf';
import { ViewState } from '../types';
import CameraView from '../components/CameraView';
import { getFaceEmbedding, compareEmbeddings, detectFace, isBlinking, isSmiling, getFaceOrientation } from '../utils/faceApi';
import { ArrowLeft, Loader2, ShieldCheck, CreditCard, Sparkles, AlertCircle, CheckCircle2, QrCode, Camera } from 'lucide-react';
import confetti from 'canvas-confetti';

interface PaymentScanProps {
  onNavigate: (view: ViewState) => void;
  shop: { name: string, id: string };
}

type PaymentStep = 'prepare' | 'scan' | 'verify' | 'otp' | 'forgot_pin' | 'processing' | 'success';

const speak = (text: string) => {
  if (!('speechSynthesis' in window)) return;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.rate = 1.1;
  window.speechSynthesis.speak(utterance);
};

export default function PaymentScan({ onNavigate, shop }: PaymentScanProps) {
  const [step, setStep] = useState<PaymentStep>('prepare');
  const [amount, setAmount] = useState('0');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [matchedCustomer, setMatchedCustomer] = useState<any>(null);
  const [transactionId, setTransactionId] = useState<string | null>(null);
  
  // Liveliness & Anti-Spoofing States
  const [liveliness, setLiveliness] = useState({
    pass: false,
    instruction: 'none' as 'blink' | 'shake' | 'nod' | 'smile' | 'none',
    queue: [] as ('blink' | 'shake' | 'nod' | 'smile')[],
    failures: 0
  });

  const [otp, setOtp] = useState(['', '', '', '']);
  const [smsOtp, setSmsOtp] = useState(['', '', '', '', '', '']);
  const [isSendingSms, setIsSendingSms] = useState(false);
  
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);
  const livelinessRef = useRef(liveliness);

  // Sync ref for the animation loop
  useEffect(() => {
    livelinessRef.current = liveliness;
    if (liveliness.instruction === 'blink') speak("Please blink your eyes");
    if (liveliness.instruction === 'nod') speak("Please nod your head");
    if (liveliness.instruction === 'shake') speak("Please shake your head");
    if (liveliness.instruction === 'smile') speak("Now, give us a smile");
    if (liveliness.instruction === 'none' && step === 'verify' && liveliness.pass) speak("Biometric verification successful");
  }, [liveliness, step]);

  const generateReceipt = () => {
    if (!matchedCustomer) return;
    const doc = new jsPDF();
    const dateStr = new Date().toLocaleString();
    
    // Receipt Design
    doc.setFont("helvetica", "bold");
    doc.setFontSize(22);
    doc.text(shop.name.toUpperCase(), 105, 30, { align: 'center' });
    
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.text(`TERMINAL ID: ${shop.id.toUpperCase()}`, 105, 38, { align: 'center' });
    
    doc.setDrawColor(200, 200, 200);
    doc.line(20, 45, 190, 45); // Divider
    
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("TRANSACTION SUCCESSFUL", 105, 60, { align: 'center' });
    
    doc.setFontSize(11);
    doc.setFont("helvetica", "normal");
    doc.text(`DATE: ${dateStr}`, 20, 80);
    doc.text(`CUSTOMER: ${matchedCustomer.name}`, 20, 90);
    doc.text(`TRANS ID: ${transactionId || 'N/A'}`, 20, 100);
    doc.text(`METHOD: BIOMETRIC (LOOK2PAY)`, 20, 110);
    
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.text(`AMOUNT PAID: RS. ${parseFloat(amount).toLocaleString()}`, 20, 130);
    
    doc.setDrawColor(200, 200, 200);
    doc.line(20, 140, 190, 140);
    
    doc.setFontSize(9);
    doc.setFont("helvetica", "italic");
    doc.text("Thank you for using our biometric secure payment system.", 105, 160, { align: 'center' });
    doc.text("Project Feature: Look2Pay Biometric Terminal", 105, 165, { align: 'center' });
    
    doc.save(`Receipt_${matchedCustomer.name.replace(/\s/g, '_')}.pdf`);
    speak("Receipt downloaded successfully");
  };

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

    // Auto submit if all digits filled
    if (newOtp.every(d => d !== '')) {
      const enteredOtp = newOtp.join('');
      if (enteredOtp === matchedCustomer.pin) {
        processPayment();
      } else {
        setError(`Invalid security code. Access Denied.`);
        setOtp(['', '', '', '']);
        otpRefs.current[0]?.focus();
      }
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  const validateOtpAndPay = () => {
    const enteredOtp = otp.join('');
    if (enteredOtp === matchedCustomer.pin) {
      processPayment();
    } else {
      setError(`Invalid security code. Access Denied.`);
      setOtp(['', '', '', '']);
      otpRefs.current[0]?.focus();
    }
  };

  const handleForgotPin = () => {
    setIsSendingSms(true);
    setError(null);
    // Simulate SMS dispatch
    setTimeout(() => {
      setIsSendingSms(false);
      setStep('forgot_pin');
    }, 1200);
  };

  const handleSmsOtpChange = (index: number, value: string) => {
    if (value.length > 1) value = value[0];
    const newSmsOtp = [...smsOtp];
    newSmsOtp[index] = value;
    setSmsOtp(newSmsOtp);

    if (value && index < 5) {
      const nextInput = document.getElementById(`sms-otp-${index + 1}`) as HTMLInputElement;
      nextInput?.focus();
    }

    if (newSmsOtp.every(d => d !== '')) {
      // Mock SMS code is 123456
      if (newSmsOtp.join('') === '123456') {
        processPayment();
      } else {
        setError("Invalid SMS verification code. Please try again.");
        setSmsOtp(['', '', '', '', '', '']);
        document.getElementById('sms-otp-0')?.focus();
      }
    }
  };

  const handleStartScan = () => {
    if (parseFloat(amount) <= 0) return;
    setStep('scan');
  };

  // Actual tracking loop for liveliness
  useEffect(() => {
    if (step !== 'verify' || liveliness.pass) return;

    let mounted = true;
    const startTime = Date.now();
    const TIMEOUT = 15000; 

    // Internal tracking state
    const tracker = {
      nodStep: 0,
      shakeStep: 0,
      initialPose: null as any | null,
    };

    const runCheck = async () => {
      if (!mounted || !videoRef.current || liveliness.pass) return;

      if (Date.now() - startTime > TIMEOUT) {
        handleLivelinessFailure("Verification timeout. Please stay focused.");
        return;
      }

      try {
        const detection = await detectFace(videoRef.current);
        if (detection) {
          const pose = getFaceOrientation(detection.landmarks);
          if (!tracker.initialPose) tracker.initialPose = pose;

          let done = false;
          const instr = livelinessRef.current.instruction;

          if (instr === 'blink') {
            if (isBlinking(detection.landmarks)) done = true;
          } 
          else if (instr === 'nod') {
            const relPitch = pose.pitch - tracker.initialPose.pitch;
            if (tracker.nodStep === 0 && relPitch < -0.08) tracker.nodStep = 1; 
            else if (tracker.nodStep === 1 && relPitch > 0.08) tracker.nodStep = 2; 
            else if (tracker.nodStep === 2 && Math.abs(relPitch) < 0.04) { tracker.nodStep = 3; done = true; }
          }
          else if (instr === 'shake') {
            const relYaw = pose.yaw - tracker.initialPose.yaw;
            if (tracker.shakeStep === 0 && relYaw < -0.08) tracker.shakeStep = 1; 
            else if (tracker.shakeStep === 1 && relYaw > 0.08) tracker.shakeStep = 2; 
            else if (tracker.shakeStep === 2 && Math.abs(relYaw) < 0.04) { tracker.shakeStep = 3; done = true; }
          }
          else if (instr === 'smile') {
            if (isSmiling(detection.landmarks)) done = true;
          }

          if (done) {
             const nextQueue = [...livelinessRef.current.queue];
             const nextInstr = nextQueue.shift();
             
             setLiveliness(prev => ({
               ...prev,
               instruction: nextInstr || 'none',
               queue: nextQueue,
               pass: !nextInstr
             }));

             if (!nextInstr) {
               setTimeout(() => handleFinalize(), 800);
             } else {
               tracker.initialPose = null;
               tracker.nodStep = 0;
               tracker.shakeStep = 0;
             }
          }
        }
      } catch (err) { console.error(err); }

      if (mounted) requestAnimationFrame(runCheck);
    };

    runCheck();
    return () => { mounted = false; };
  }, [step, liveliness.pass]);

  const handleFaceScan = async () => {
    if (!videoRef.current) return;
    setIsAnalyzing(true);
    setError(null);

    try {
      const embedding = await getFaceEmbedding(videoRef.current);
      if (!embedding) throw new Error("No face detected. Please center your face.");

      const customers = JSON.parse(localStorage.getItem('look2pay_customers') || '[]');
      let match = null;
      let threshold = 0.55;
      
      for (const c of customers) {
        const dist = compareEmbeddings(embedding, new Float32Array(c.embedding));
        if (dist < threshold) {
          match = c;
          threshold = dist; // Keep best match
        }
      }

      if (!match) throw new Error("No account matched. Are you registered?");

      setMatchedCustomer(match);
      setIsAnalyzing(false);
      setStep('verify');

      // Random Challenge Logic
      const pool: ('blink' | 'shake' | 'nod' | 'smile')[] = ['blink', 'shake', 'nod', 'smile'];
      const challenges = pool.sort(() => 0.5 - Math.random()).slice(0, 2);
      
      setLiveliness(prev => ({
        ...prev,
        instruction: challenges[0],
        queue: [challenges[1]],
        pass: false
      }));

    } catch (err: any) {
      setError(err.message);
      setIsAnalyzing(false);
    }
  };

  const handleLivelinessFailure = (msg: string) => {
     setLiveliness(prev => ({ ...prev, failures: prev.failures + 1 }));
     if (liveliness.failures >= 2 && matchedCustomer) {
        // Redacted for brevity but same logic
        setError("Security Block: Too many failed liveliness attempts.");
        setStep('prepare');
     } else {
        setError(msg);
        setStep('scan');
     }
  };

  const flagFraud = (alert: any) => {
     const alerts = JSON.parse(localStorage.getItem('look2pay_fraud_alerts') || '[]');
     const newAlert = {
        ...alert,
        id: `FRD-${Math.random().toString(36).substr(2, 6).toUpperCase()}`,
        timestamp: new Date().toISOString(),
        shopId: shop.id
     };
     localStorage.setItem('look2pay_fraud_alerts', JSON.stringify([newAlert, ...alerts]));
  };

  const handleFinalize = () => {
    // Impossible Travel Check (Mock Logic)
    if (matchedCustomer) {
      const allTxns = JSON.parse(localStorage.getItem('look2pay_transactions') || '[]');
      const userLastTxn = allTxns.find((t: any) => t.customerId === matchedCustomer.phone && t.status === 'success');
      
      if (userLastTxn) {
        const lastTxnTime = userLastTxn.timestamp.seconds * 1000;
        const timeDiffMinutes = (Date.now() - lastTxnTime) / 60000;
        
        // If last txn was at a different shop less than 2 mins ago
        if (userLastTxn.shopId !== shop.id && timeDiffMinutes < 2) {
          flagFraud({
             type: 'IMPOSSIBLE_TRAVEL',
             severity: 'critical',
             customerId: matchedCustomer.phone,
             customerName: matchedCustomer.name,
             details: `Transaction detected at different terminals within ${Math.round(timeDiffMinutes)} mins. Distance gap anomaly.`
          });
          // For project demo, we still allow but flag it.
        }
      }
    }
    // Force PIN ONLY for transactions strictly over ₹5,000
    // Any payment less than or equal to 5000 is processed directly as requested
    if (parseFloat(amount) > 5000) {
      setStep('otp');
    } else {
      processPayment();
    }
  };

  const processPayment = async () => {
    setStep('processing');
    await new Promise(r => setTimeout(r, 2000));
    
    // Check balance
    if (matchedCustomer.wallet < parseFloat(amount)) {
      setError(`Payment Refused: Insufficient funds in wallet. Remaining balance: ₹${matchedCustomer.wallet.toLocaleString()}`);
      setStep('prepare');
      return;
    }

    // Update balance in "DB"
    const customers = JSON.parse(localStorage.getItem('look2pay_customers') || '[]');
    const tid = `TXN-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
    setTransactionId(tid);
    
    // Create transaction record
    const newTransaction = {
      id: tid,
      shopId: shop.id,
      customerId: matchedCustomer.phone, 
      customerName: matchedCustomer.name,
      amount: parseFloat(amount),
      timestamp: { seconds: Math.floor(Date.now() / 1000), nanoseconds: 0 },
      status: 'success'
    };

    const existingTransactions = JSON.parse(localStorage.getItem('look2pay_transactions') || '[]');
    localStorage.setItem('look2pay_transactions', JSON.stringify([newTransaction, ...existingTransactions]));

    const updated = customers.map((c: any) => {
      if (c.phone === matchedCustomer.phone) {
        const newBalance = c.wallet - parseFloat(amount);
        // Store current match with updated wallet for display
        setMatchedCustomer({ ...c, wallet: newBalance });
        return { ...c, wallet: newBalance, transactionCount: (c.transactionCount || 0) + 1 };
      }
      return c;
    });
    localStorage.setItem('look2pay_customers', JSON.stringify(updated));

    setStep('success');
    speak("Payment successful. Thank you.");
    confetti({
      particleCount: 150,
      spread: 100,
      origin: { y: 0.6 },
      colors: ['#2563eb', '#10b981', '#141414']
    });
  };

  return (
    <div className="min-h-screen py-8 px-6 flex flex-col items-center bg-slate-50/50">
      <header className="w-full max-w-2xl flex items-center justify-between mb-8">
        <button 
          onClick={() => onNavigate('landing')}
          className="p-2 hover:bg-white rounded-full transition-colors border border-transparent hover:border-slate-100"
        >
          <ArrowLeft className="w-6 h-6" />
        </button>
        <div className="flex flex-col items-center">
          <h2 className="text-sm font-black uppercase tracking-[0.15em] text-slate-800 leading-none mb-1">{shop.name}</h2>
          <div className="flex items-center gap-1.5">
             <div className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse" />
             <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Active Merchant Terminal</p>
          </div>
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
              className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-2xl shadow-slate-100"
            >
              <div className="text-center mb-10">
                <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mx-auto mb-6 text-blue-600 shadow-sm border border-blue-100">
                  <CreditCard className="w-8 h-8" />
                </div>
                <h3 className="text-3xl font-black uppercase mb-2 tracking-tight">Checkout</h3>
                <p className="text-slate-500 text-sm font-medium">Verify bill amount to proceed.</p>
              </div>

              <div className="bg-slate-50 p-6 rounded-3xl mb-8 border border-slate-100">
                <div className="flex justify-between items-center mb-6">
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Merchant Account</span>
                  <span className="font-bold flex items-center gap-2 text-slate-700">
                    <div className="w-5 h-5 bg-blue-600 rounded flex items-center justify-center text-[10px] text-white uppercase">{shop.name.charAt(0)}</div>
                    {shop.name}
                  </span>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Total Bill</label>
                  <div className="flex items-center gap-2">
                    <span className="text-4xl font-black text-slate-300">₹</span>
                    <input 
                      type="number"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      className="text-5xl font-black w-full bg-transparent outline-none focus:text-slate-900 transition-colors"
                      placeholder="0.00"
                    />
                  </div>
                </div>
              </div>

              <button
                onClick={handleStartScan}
                className="w-full py-5 bg-slate-900 text-white rounded-2xl font-black uppercase tracking-widest hover:bg-blue-600 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3 overflow-hidden group shadow-xl shadow-blue-100"
              >
                Start Face Scan
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
              <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xl overflow-hidden flex flex-col flex-1">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold text-slate-700 uppercase text-xs tracking-widest">
                    {step === 'scan' ? 'Identifying Face' : 'Liveliness Check'}
                  </h3>
                  <div className="flex items-center gap-2">
                     <span className="flex h-2 w-2 rounded-full bg-blue-500 animate-pulse" />
                     <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Video Active</span>
                  </div>
                </div>

                {step === 'verify' && matchedCustomer && (
                  <motion.div 
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex justify-between items-center bg-blue-50/50 p-4 rounded-2xl border border-blue-100 mb-2"
                  >
                    <div className="flex items-center gap-3">
                       <div className="w-10 h-10 bg-white text-blue-600 rounded-xl flex items-center justify-center shrink-0 shadow-sm">
                          <ShieldCheck size={24} />
                       </div>
                       <div className="text-left">
                          <p className="text-[10px] font-bold text-blue-400 uppercase tracking-widest leading-none mb-1">Authenticated As</p>
                          <p className="text-lg font-black text-slate-900 leading-tight">{matchedCustomer.name}</p>
                       </div>
                    </div>
                  </motion.div>
                )}

                <div className="relative aspect-video bg-black rounded-2xl overflow-hidden group border border-slate-100">
                  <CameraView 
                    className={`w-full h-full opacity-90 ${step === 'verify' ? 'ring-4 ring-emerald-500 ring-inset' : ''}`}
                    onVideoLoad={(v) => videoRef.current = v}
                    overlay={
                      <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center">
                        <div className="relative w-60 h-72 flex items-center justify-center">
                           <motion.div 
                             animate={{ 
                               borderColor: liveliness.pass ? '#10b981' : (isAnalyzing ? '#60a5fa' : '#3b82f6'),
                             }}
                             className="absolute inset-0 rounded-[3.5rem] border-[2px] transition-colors"
                           />
                           <div className="w-48 h-60 rounded-[3.5rem] border border-white/20 relative" />
                        </div>

                        {isAnalyzing && (
                          <motion.div 
                            initial={{ translateY: -128 }}
                            animate={{ translateY: 128 }}
                            transition={{ duration: 1.5, repeat: Infinity }}
                            className="absolute left-0 right-0 h-[2px] bg-blue-400 z-20 shadow-[0_0_15px_blue]"
                          />
                        )}
                        
                        {step === 'verify' && (
                           <div className="absolute inset-0 flex items-center justify-center bg-emerald-900/5">
                              <div className="bg-emerald-500 text-white px-4 py-2 rounded-full flex items-center gap-2">
                                  <CheckCircle2 size={16} />
                                  <span className="text-[10px] font-black uppercase">Match Verified</span>
                              </div>
                           </div>
                        )}
                      </div>
                    }
                  />
                  
                  {/* Liveliness Instructions Overlay */}
                  <AnimatePresence>
                    {liveliness.instruction !== 'none' && step === 'verify' && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        className="absolute inset-x-0 bottom-6 flex flex-col items-center p-6 z-30"
                      >
                         <div className="bg-blue-600 shadow-2xl text-white px-8 py-5 rounded-[2.5rem] flex flex-col items-center text-center w-60">
                            <motion.div
                              animate={{ y: [0, -5, 0] }}
                              transition={{ duration: 1.5, repeat: Infinity }}
                              className="text-4xl mb-3"
                            >
                              {liveliness.instruction === 'blink' && "👀"}
                              {(liveliness.instruction === 'nod' || liveliness.instruction === 'shake') && "👤"}
                              {liveliness.instruction === 'smile' && "😊"}
                            </motion.div>
                            <span className="text-[10px] font-black uppercase tracking-widest opacity-60 mb-1">Verify Action</span>
                            <h4 className="text-sm font-black uppercase">
                              {liveliness.instruction === 'blink' && "Blink your eyes"}
                              {liveliness.instruction === 'nod' && "Nod your head"}
                              {liveliness.instruction === 'shake' && "Shake your head"}
                              {liveliness.instruction === 'smile' && "Give a smile"}
                            </h4>
                         </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Real-time history for customer */}
                {step === 'verify' && matchedCustomerTransactions.length > 0 && (
                   <motion.div 
                     initial={{ opacity: 0, y: 10 }}
                     animate={{ opacity: 1, y: 0 }}
                     className="mt-6 border-t border-slate-100 pt-4"
                   >
                     <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-3">Your Recent Activity</p>
                     <div className="space-y-2">
                        {matchedCustomerTransactions.map((tx: any) => (
                           <div key={tx.id} className="flex justify-between items-center bg-slate-50 p-2 rounded-lg border border-slate-100">
                              <div className="flex items-center gap-2">
                                 <div className="w-6 h-6 bg-white rounded flex items-center justify-center">
                                    <ShieldCheck size={12} className="text-slate-400" />
                                 </div>
                                 <span className="text-[10px] font-bold text-slate-600 uppercase">{tx.id}</span>
                              </div>
                              <span className="text-xs font-black text-slate-900">₹{tx.amount}</span>
                           </div>
                        ))}
                     </div>
                   </motion.div>
                )}

                <div className="mt-auto pt-6 flex flex-col gap-3">
                   <div className="flex gap-3">
                     <div className="flex-1 bg-slate-50 p-4 rounded-2xl border border-slate-100 text-left">
                       <p className="text-[9px] uppercase font-bold text-slate-400 mb-1 leading-none">Amount to Pay</p>
                       <p className="text-2xl font-black text-slate-800">₹{parseFloat(amount).toLocaleString()}</p>
                     </div>
                     
                     {step === 'scan' ? (
                       <button
                         disabled={isAnalyzing}
                         onClick={handleFaceScan}
                         className="flex-[0.6] bg-blue-600 text-white rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-blue-700 active:scale-95 transition-all shadow-xl shadow-blue-100 flex items-center justify-center gap-2"
                       >
                          {isAnalyzing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Camera size={16} />}
                          {isAnalyzing ? "Processing" : "PAY NOW"}
                       </button>
                     ) : (
                       <div className="flex-[0.6] bg-slate-100 rounded-2xl flex items-center justify-center opacity-60">
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Authenticating</p>
                       </div>
                     )}
                   </div>

                   {step === 'verify' && !liveliness.pass && (
                      <button
                        onClick={() => setStep('otp')}
                        className="w-full py-3 bg-white border border-slate-200 text-slate-500 rounded-xl text-[10px] font-black uppercase tracking-widest"
                      >
                         Use Security PIN Instead
                      </button>
                   )}
                </div>
              </div>

              {error && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex flex-col gap-3 p-4 bg-red-50 text-red-700 rounded-2xl border border-red-100"
                >
                  <div className="flex items-center gap-3 text-[11px] font-bold">
                    <AlertCircle size={16} className="shrink-0" />
                    {error}
                  </div>
                  <button 
                    onClick={() => {
                      setError(null);
                      handleFaceScan();
                    }}
                    className="w-full py-2 bg-red-100 hover:bg-red-200 text-red-700 rounded-xl text-[10px] font-black uppercase tracking-widest transition-colors flex items-center justify-center gap-2"
                  >
                    <Camera size={12} />
                    Try Again
                  </button>
                </motion.div>
              )}
            </motion.div>
          )}

          {step === 'otp' && (
            <motion.div
              key="otp"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-2xl text-center"
            >
              <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
                 <ShieldCheck size={32} />
              </div>
              <h3 className="text-2xl font-black uppercase mb-2 tracking-tight">Security PIN</h3>
              <p className="text-slate-500 text-sm mb-6 max-w-xs mx-auto font-medium">Please enter your 4-digit security PIN to finalize your <b>₹{amount}</b> purchase.</p>

              {parseFloat(amount) > 5000 && (
                <div className="mb-8 p-4 bg-blue-50 border border-blue-100 rounded-2xl flex items-start gap-3 text-left max-w-xs mx-auto">
                  <div className="shrink-0 mt-0.5 text-blue-500">
                    <ShieldCheck size={16} />
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-blue-800 uppercase tracking-widest mb-1">High Value Payment</p>
                    <p className="text-[10px] text-blue-600 font-bold leading-[1.3] uppercase opacity-80">
                      Security PIN required for all transactions above ₹5,000 for your safety.
                    </p>
                  </div>
                </div>
              )}
              
              <div className="flex gap-4 justify-center mb-10">
                {[0, 1, 2, 3].map((i) => (
                  <input
                    key={i}
                    ref={(el) => { otpRefs.current[i] = el; }}
                    type="text"
                    maxLength={1}
                    value={otp[i]}
                    onChange={(e) => handleOtpChange(i, e.target.value)}
                    onKeyDown={(e) => handleOtpKeyDown(i, e)}
                    className="w-14 h-16 bg-slate-50 border-2 border-slate-200 focus:border-blue-500 focus:bg-white rounded-2xl text-center text-2xl font-black outline-none transition-all shadow-inner"
                  />
                ))}
              </div>

              {error && (
                <div className="mb-6 p-3 bg-red-50 text-red-600 rounded-xl text-xs font-bold border border-red-100">
                  {error}
                </div>
              )}

              <button
                onClick={validateOtpAndPay}
                className="w-full py-5 bg-slate-900 text-white rounded-2xl font-black uppercase tracking-widest hover:bg-blue-600 transition-all shadow-xl active:scale-95 mb-4"
              >
                Verify Payment
              </button>

              <button
                onClick={handleForgotPin}
                disabled={isSendingSms}
                className="text-xs font-black text-slate-400 uppercase tracking-widest hover:text-blue-600 transition-colors flex items-center justify-center gap-2 mx-auto"
              >
                {isSendingSms ? <Loader2 className="w-3 h-3 animate-spin" /> : <AlertCircle size={12} />}
                {isSendingSms ? "Sending SMS..." : "Forgot Security PIN?"}
              </button>
            </motion.div>
          )}

          {step === 'forgot_pin' && (
            <motion.div
              key="forgot_pin"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-2xl text-center"
            >
              <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
                 <QrCode size={32} />
              </div>
              <h3 className="text-2xl font-black uppercase mb-2 tracking-tight">SMS Verification</h3>
              <p className="text-slate-500 text-sm mb-6 max-w-xs mx-auto font-medium">
                We've sent a 6-digit code to <span className="text-slate-900">+{matchedCustomer.phone.substring(0, 2)}******{matchedCustomer.phone.slice(-4)}</span>.
              </p>

              <div className="flex gap-2 justify-center mb-10">
                {[0, 1, 2, 3, 4, 5].map((i) => (
                  <input
                    key={i}
                    id={`sms-otp-${i}`}
                    type="text"
                    maxLength={1}
                    value={smsOtp[i]}
                    onChange={(e) => handleSmsOtpChange(i, e.target.value)}
                    className="w-10 h-14 bg-slate-50 border-2 border-slate-200 focus:border-blue-500 focus:bg-white rounded-xl text-center text-xl font-black outline-none transition-all"
                  />
                ))}
              </div>

              {error && (
                <div className="mb-6 p-3 bg-red-50 text-red-600 rounded-xl text-xs font-bold border border-red-100">
                  {error}
                </div>
              )}

              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                Didn't receive it? <button className="text-blue-600 underline" onClick={handleForgotPin}>Resend OTP</button>
              </p>
            </motion.div>
          )}

          {step === 'processing' && (
            <motion.div
              key="processing"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="py-12 flex flex-col items-center text-center bg-white rounded-[3rem] p-12 shadow-2xl border border-slate-50"
            >
              <div className="relative w-32 h-32 mb-8">
                <div className="absolute inset-0 rounded-full border-4 border-slate-100" />
                <motion.div 
                   animate={{ rotate: 360 }}
                   transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                   className="absolute inset-0 rounded-full border-4 border-t-blue-600 border-r-transparent border-b-transparent border-l-transparent"
                />
                <div className="absolute inset-0 flex items-center justify-center text-blue-600">
                  <motion.div
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 1, repeat: Infinity }}
                  >
                    <CreditCard className="w-10 h-10" />
                  </motion.div>
                </div>
              </div>
              <h3 className="text-2xl font-black uppercase mb-2 tracking-tight">Financing Auth</h3>
              <p className="text-slate-400 font-bold uppercase text-[10px] tracking-widest">Securing Ledger Transfer...</p>
            </motion.div>
          )}

          {step === 'success' && (
            <motion.div
              key="success"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="py-8 flex flex-col items-center text-center w-full"
            >
              <div className="w-24 h-24 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mb-8 shadow-2xl shadow-emerald-100 border-4 border-white animate-bounce">
                <CheckCircle2 className="w-12 h-12" />
              </div>
              <h3 className="text-4xl font-black uppercase mb-2 tracking-tight text-slate-900">Success!</h3>
              <div className="bg-emerald-50 text-emerald-700 px-6 py-2 rounded-full text-xs font-black uppercase tracking-widest mb-8 border border-emerald-100">
                 ₹{parseFloat(amount).toLocaleString()} deducted from wallet
              </div>
              
              <div className="w-full bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-2xl mb-10 text-left overflow-hidden relative">
                <div className="absolute top-0 right-0 p-8 opacity-[0.03]">
                   <CheckCircle2 size={120} />
                </div>
                
                <div className="flex justify-between items-center mb-8 pb-4 border-b border-slate-100">
                  <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Merchant Copy</span>
                  <span className="text-xs font-mono font-bold text-slate-400">#{transactionId || 'L2P-829-XJ9'}</span>
                </div>
                
                <div className="space-y-6">
                  <div className="flex justify-between items-baseline">
                    <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Merchant</span>
                    <span className="text-sm font-bold text-slate-800">{shop.name}</span>
                  </div>
                  <div className="flex justify-between items-baseline">
                    <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Customer</span>
                    <span className="text-sm font-bold text-slate-800">{matchedCustomer?.name}</span>
                  </div>
                  <div className="flex justify-between items-baseline">
                    <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Available Balance</span>
                    <span className="text-sm font-bold text-emerald-600">₹{matchedCustomer?.wallet?.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-baseline">
                    <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Wallet Used</span>
                    <span className="text-sm font-bold text-slate-800">Biometric Secure Node</span>
                  </div>
                  <div className="flex justify-between pt-6 border-t border-slate-100 items-baseline">
                    <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Paid Amount</span>
                    <span className="text-3xl font-black text-blue-600">₹{parseFloat(amount).toLocaleString()}</span>
                  </div>
                </div>
              </div>

              <div className="w-full max-w-sm mb-10 text-left px-4">
                 <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-4 px-2">Account Activity</p>
                 <div className="space-y-3">
                    {/* Current Payment - Always Show */}
                    <div className="flex justify-between items-center bg-blue-50/50 p-4 rounded-2xl border border-blue-100 shadow-sm">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-blue-600 rounded-xl flex items-center justify-center text-white">
                             <CheckCircle2 size={16} />
                          </div>
                          <div>
                             <p className="text-xs font-black text-slate-800 uppercase">Current Payment</p>
                             <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">SUCCESSFUL • JUST NOW</p>
                          </div>
                        </div>
                        <span className="text-sm font-black text-blue-600">₹{parseFloat(amount).toLocaleString()}</span>
                    </div>

                    {matchedCustomerTransactions.map((tx: any) => (
                       <div key={tx.id} className="flex justify-between items-center bg-slate-50/50 p-4 rounded-2xl border border-slate-100">
                          <div className="flex items-center gap-3">
                             <div className="w-8 h-8 bg-white rounded-xl flex items-center justify-center text-slate-400 border border-slate-100">
                                <ShieldCheck size={14} />
                             </div>
                             <div>
                                <p className="text-[10px] font-black text-slate-600 uppercase">{tx.id}</p>
                                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">SECURE NODE TRANSFER</p>
                             </div>
                          </div>
                          <span className="text-sm font-black text-slate-900 opacity-60">₹{tx.amount}</span>
                       </div>
                    ))}
                 </div>
              </div>

              <div className="flex gap-4">
                <button
                  onClick={() => onNavigate('landing')}
                  className="flex-1 py-4 bg-slate-900 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-slate-800 transition-all active:scale-95 shadow-xl shadow-slate-100"
                >
                  Confirm & Logout
                </button>
                <button
                  onClick={generateReceipt}
                  className="flex-1 py-4 bg-blue-600 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-blue-700 transition-all active:scale-95 shadow-xl shadow-blue-100 flex items-center justify-center gap-2"
                >
                   <CreditCard size={14} />
                   Download Receipt
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <div className="mt-auto pb-8 w-full flex justify-center">
        <div className="bg-white/80 backdrop-blur-md px-5 py-2 rounded-full flex items-center gap-3 border border-slate-200 shadow-sm">
           <ShieldCheck size={14} className="text-blue-600" />
           <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Encrypted Biometric Gateway</span>
        </div>
      </div>
    </div>
  );
}

