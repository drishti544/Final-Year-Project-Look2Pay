/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { loadModels } from './utils/faceApi';
import { ViewState } from './types';
import Landing from './pages/Landing';
import ShopDashboard from './pages/ShopDashboard';
import CustomerRegister from './pages/CustomerRegister';
import PaymentScan from './pages/PaymentScan';
import { Loader2 } from 'lucide-react';

export default function App() {
  const [view, setView] = useState<ViewState>('landing');
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [loadingError, setLoadingError] = useState<string | null>(null);

  useEffect(() => {
    loadModels()
      .then(() => setModelsLoaded(true))
      .catch((err) => {
        setLoadingError('Failed to load AI models. Please check your connection.');
        console.error(err);
      });
  }, []);

  if (!modelsLoaded && !loadingError) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-neutral-50 text-neutral-900 font-sans">
        <Loader2 className="w-12 h-12 animate-spin text-blue-600 mb-4" />
        <p className="text-sm font-medium tracking-wide uppercase opacity-60">Initializing Look2Pay AI...</p>
      </div>
    );
  }

  if (loadingError) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-red-50 text-red-900 p-6 text-center">
        <p className="text-xl font-bold mb-2">Setup Error</p>
        <p className="opacity-80">{loadingError}</p>
        <button 
          onClick={() => window.location.reload()}
          className="mt-6 px-6 py-2 bg-red-600 text-white rounded-full font-medium"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-blue-100">
      <AnimatePresence mode="wait">
        {view === 'landing' && (
          <Landing key="landing" onNavigate={setView} />
        )}
        {view === 'shop-dashboard' && (
          <ShopDashboard key="shop-dashboard" onNavigate={setView} />
        )}
        {view === 'customer-register' && (
          <CustomerRegister key="customer-register" onNavigate={setView} />
        )}
        {view === 'payment-scan' && (
          <PaymentScan key="payment-scan" onNavigate={setView} />
        )}
      </AnimatePresence>
    </div>
  );
}

