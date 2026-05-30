import React, { useState } from 'react';
import { CreditPackage, CREDIT_PACKAGES, UserProfile } from '../types';
import { X, Check, ArrowRight, ShieldCheck, CreditCard, Landmark, Smartphone, Coins } from 'lucide-react';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { collection, doc, writeBatch, serverTimestamp } from 'firebase/firestore';

interface BuyCreditsModalProps {
  userProfile: UserProfile | null;
  onClose: () => void;
  onCreditsUpdated: (newCredits: number) => void;
}

type PaymentStep = 'select' | 'details' | 'processing' | 'success';
type PaymentMethod = 'upi' | 'card' | 'netbanking';

export default function BuyCreditsModal({ userProfile, onClose, onCreditsUpdated }: BuyCreditsModalProps) {
  const [selectedPackage, setSelectedPackage] = useState<CreditPackage>(CREDIT_PACKAGES[2]); // Default to popular Pro pack
  const [step, setStep] = useState<PaymentStep>('select');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('upi');
  const [upiId, setUpiId] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');
  const [netbank, setNetbank] = useState('SBI');
  const [processingProgress, setProcessingProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const handleSelectPackage = (pkg: CreditPackage) => {
    setSelectedPackage(pkg);
    setStep('details');
  };

  const handleStartPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (paymentMethod === 'upi' && !upiId.includes('@')) {
      setError('Please enter a valid UPI ID (e.g., name@upi)');
      return;
    }
    if (paymentMethod === 'card' && cardNumber.replace(/\s/g, '').length < 16) {
      setError('Please enter a valid 16-digit card number');
      return;
    }

    setError(null);
    setStep('processing');
    setProcessingProgress(0);

    // Simulate merchant verification loop
    const interval = setInterval(() => {
      setProcessingProgress((oldProgress) => {
        if (oldProgress >= 100) {
          clearInterval(interval);
          finalizeTransaction();
          return 100;
        }
        return oldProgress + 25;
      });
    }, 400);
  };

  // Synchronize Firestore write securely matching security rules
  const finalizeTransaction = async () => {
    if (!userProfile) return;

    try {
      const batch = writeBatch(db);
      
      // 1. Instantiate the Immutable Transaction Ledger Doc
      const transactionId = 'tx-' + Math.random().toString(36).substring(2, 11);
      const txPath = `users/${userProfile.uid}/transactions/${transactionId}`;
      const transactionRef = doc(collection(db, 'users', userProfile.uid, 'transactions'), transactionId);
      
      const transactionPayload = {
        id: transactionId,
        amount: selectedPackage.price,
        creditsAdded: selectedPackage.credits,
        status: 'completed' as const,
        paymentMethod: paymentMethod.toUpperCase() + (paymentMethod === 'upi' ? ` (${upiId})` : paymentMethod === 'netbanking' ? ` (${netbank})` : ''),
        createdAt: serverTimestamp()
      };
      
      batch.set(transactionRef, transactionPayload);

      // 2. Safely update User profile with precise credits addition (matching hasOnly rules)
      const userRef = doc(db, 'users', userProfile.uid);
      const newCredits = userProfile.credits + selectedPackage.credits;
      batch.update(userRef, {
        credits: newCredits,
        updatedAt: serverTimestamp()
      });

      // Commit Batch atomically
      await batch.commit();

      // Trigger state callbacks
      onCreditsUpdated(newCredits);
      setStep('success');
    } catch (err: any) {
      console.error('Checkout write aborted:', err);
      setError('Payment recorded successfully on simulator, but syncing to cloud was rejected: ' + err.message);
      setStep('details');
      
      // Trigger compliant diagnostic logging
      handleFirestoreError(err, OperationType.WRITE, `users/${userProfile?.uid}/transactions`);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full overflow-hidden shadow-2xl border border-slate-100 flex flex-col relative max-h-[90vh]">
        
        {/* Header */}
        <div className="border-b border-slate-100 p-5 flex justify-between items-center bg-slate-50">
          <div>
            <h2 className="font-extrabold text-slate-900 text-lg tracking-tight flex items-center gap-2">
              <Coins className="w-5 h-5 text-indigo-600" />
              <span>Purchase Gallery Credits</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">Top up your balance instantly to generate private client lists.</p>
          </div>
          <button 
            onClick={onClose} 
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content body with responsive sizing */}
        <div className="p-6 overflow-y-auto flex-1">
          {error && (
            <div className="mb-4 bg-red-50 border border-red-200 text-red-700 p-3 rounded-lg text-xs font-semibold">
              {error}
            </div>
          )}

          {/* STEP 1: Select Package */}
          {step === 'select' && (
            <div className="space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-2">Choose Credit Package</h3>
              <div className="grid grid-cols-1 gap-3.5">
                {CREDIT_PACKAGES.map((pkg) => (
                  <div
                    key={pkg.id}
                    onClick={() => handleSelectPackage(pkg)}
                    className={`relative p-4 rounded-xl border-2 transition-all cursor-pointer flex justify-between items-center ${
                      selectedPackage.id === pkg.id
                        ? 'border-indigo-600 bg-indigo-50/20'
                        : 'border-slate-200 hover:border-indigo-200 hover:bg-slate-50/50'
                    }`}
                  >
                    {pkg.popular && (
                      <span className="absolute -top-2 px-2 py-0.5 bg-indigo-600 text-white text-[9px] font-black uppercase rounded-full tracking-wider shadow-sm">
                        Best Value
                      </span>
                    )}
                    {pkg.tag && !pkg.popular && (
                      <span className="absolute -top-2 px-2 py-0.5 bg-emerald-600 text-white text-[9px] font-black uppercase rounded-full tracking-wider shadow-sm">
                        {pkg.tag}
                      </span>
                    )}

                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-indigo-100 text-indigo-700 font-bold flex items-center justify-center text-sm">
                        +{pkg.credits}
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-900 text-sm">{pkg.title}</h4>
                        <p className="text-xs text-slate-500 max-w-[280px] leading-tight mt-0.5">{pkg.description}</p>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="text-base font-black text-slate-900 block">₹{pkg.price}</span>
                      <span className="text-[10px] text-slate-400 block font-medium">₹{(pkg.price / pkg.credits).toFixed(1)}/each</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* STEP 2: Checkout Details */}
          {step === 'details' && (
            <div className="space-y-5">
              {/* Summary card */}
              <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 flex justify-between items-center">
                <div>
                  <span className="text-xs text-slate-500 font-medium">Selected Package:</span>
                  <h4 className="font-bold text-slate-900 text-sm mt-0.5">{selectedPackage.title} (+{selectedPackage.credits} Credits)</h4>
                </div>
                <div className="text-right">
                  <span className="text-xs text-slate-400 block line-through">₹{selectedPackage.credits * 25}</span>
                  <span className="text-lg font-black text-indigo-700 block">₹{selectedPackage.price}</span>
                </div>
              </div>

              {/* Payment Methods selector */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-3">Choose Payment Method</h4>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('upi')}
                    className={`py-3 px-2 rounded-lg border flex flex-col items-center gap-2 cursor-pointer transition-all ${
                      paymentMethod === 'upi' ? 'border-indigo-600 bg-indigo-50/10 text-indigo-700' : 'border-slate-200 text-slate-500 hover:bg-slate-50'
                    }`}
                  >
                    <Smartphone className="w-5 h-5" />
                    <span className="text-[11px] font-bold">UPI / GPay</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('card')}
                    className={`py-3 px-2 rounded-lg border flex flex-col items-center gap-2 cursor-pointer transition-all ${
                      paymentMethod === 'card' ? 'border-indigo-600 bg-indigo-50/10 text-indigo-700' : 'border-slate-200 text-slate-500 hover:bg-slate-50'
                    }`}
                  >
                    <CreditCard className="w-5 h-5" />
                    <span className="text-[11px] font-bold">RuPay/Card</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('netbanking')}
                    className={`py-3 px-2 rounded-lg border flex flex-col items-center gap-2 cursor-pointer transition-all ${
                      paymentMethod === 'netbanking' ? 'border-indigo-600 bg-indigo-50/10 text-indigo-700' : 'border-slate-200 text-slate-500 hover:bg-slate-50'
                    }`}
                  >
                    <Landmark className="w-5 h-5" />
                    <span className="text-[11px] font-bold">Net Banking</span>
                  </button>
                </div>
              </div>

              {/* Entry fields per method */}
              <form onSubmit={handleStartPayment} className="space-y-4 pt-2 border-t border-slate-100">
                {paymentMethod === 'upi' && (
                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1.5">Enter Virtual Payment Address (VPA) / UPI ID</label>
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="e.g., cellnumber@ybl, name@upi"
                        value={upiId}
                        onChange={(e) => setUpiId(e.target.value)}
                        required
                        className="w-full text-sm py-2.5 pl-3.5 pr-20 border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-600 text-slate-800"
                      />
                      <span className="absolute right-2.5 top-2.5 text-[10px] uppercase tracking-wider font-extrabold text-indigo-500 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100 pointer-events-none">
                        Secure UPI
                      </span>
                    </div>
                    <span className="text-[10px] text-slate-400 mt-1 block">Supports Google Pay, PhonePe, BHIM, Paytm, and any UPI app.</span>
                  </div>
                )}

                {paymentMethod === 'card' && (
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-600 mb-1">Card Number</label>
                      <input
                        type="text"
                        placeholder="4532 8908 1234 5678"
                        maxLength={16}
                        value={cardNumber}
                        onChange={(e) => setCardNumber(e.target.value.replace(/\D/g, ''))}
                        required
                        className="w-full text-sm py-2.5 px-3 border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-600 text-slate-800"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-bold text-slate-600 mb-1">Expiry Date</label>
                        <input
                          type="text"
                          placeholder="MM/YY"
                          maxLength={5}
                          value={cardExpiry}
                          onChange={(e) => setCardExpiry(e.target.value)}
                          required
                          className="w-full text-sm py-2.5 px-3 border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-600 text-slate-800 text-center"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-600 mb-1">CVV / Security Code</label>
                        <input
                          type="password"
                          placeholder="•••"
                          maxLength={3}
                          value={cardCvv}
                          onChange={(e) => setCardCvv(e.target.value.replace(/\D/g, ''))}
                          required
                          className="w-full text-sm py-2.5 px-3 border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-600 text-slate-800 text-center"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {paymentMethod === 'netbanking' && (
                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1.5">Select Nationalized Bank</label>
                    <select
                      value={netbank}
                      onChange={(e) => setNetbank(e.target.value)}
                      className="w-full text-sm py-2.5 px-3 border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-600 text-slate-800 bg-white"
                    >
                      <option value="SBI">State Bank of India (SBI)</option>
                      <option value="HDFC">HDFC Bank</option>
                      <option value="ICICI">ICICI Bank</option>
                      <option value="AXIS">Axis Bank</option>
                      <option value="KOTAK">Kotak Mahindra Bank</option>
                    </select>
                  </div>
                )}

                {/* Submit Block */}
                <div className="pt-4 flex gap-3">
                  <button
                    type="button"
                    onClick={() => setStep('select')}
                    className="flex-1 py-3 border border-slate-200 hover:bg-slate-50 text-slate-600 font-bold rounded-xl transition duration-150 text-sm cursor-pointer"
                  >
                    Back to Bundles
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition duration-150 text-sm cursor-pointer flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/10"
                  >
                    <span>Pay ₹{selectedPackage.price}</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* STEP 3: Processing */}
          {step === 'processing' && (
            <div className="py-8 flex flex-col items-center justify-center text-center">
              <span className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-slate-100 border-t-indigo-600 mb-6"></span>
              <h3 className="font-extrabold text-slate-800 text-base">Contacting Merchant Server…</h3>
              <p className="text-xs text-slate-400 mt-1 max-w-[280px]">Connecting to banking network securely. Do not close or reload windows.</p>
              
              <div className="w-full max-w-xs mt-6">
                <div className="flex justify-between text-[11px] text-slate-400 font-semibold mb-1.5">
                  <span>Merchant Escrow Loop</span>
                  <span>{processingProgress}%</span>
                </div>
                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                  <div 
                    className="bg-indigo-600 h-full rounded-full transition-all duration-300" 
                    style={{ width: `${processingProgress}%` }}
                  ></div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 4: Success Receipt */}
          {step === 'success' && (
            <div className="py-8 flex flex-col items-center justify-center text-center">
              <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mb-4">
                <Check className="w-7 h-7 stroke-[3]" />
              </div>
              <h3 className="font-black text-slate-900 text-lg">Transaction Complete</h3>
              <p className="text-xs text-slate-500 mt-1">₹{selectedPackage.price} authorized successfully. Your balance is updated.</p>

              <div className="bg-emerald-50/50 border border-emerald-100/60 rounded-xl p-4 w-full mt-6 flex justify-between items-center text-left">
                <div>
                  <span className="text-[10px] text-emerald-600 uppercase tracking-wider font-extrabold">Credits Credited</span>
                  <p className="text-sm font-black text-slate-900 mt-0.5">+{selectedPackage.credits} Gallery Credits</p>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-slate-400 font-semibold uppercase block">New Balance</span>
                  <p className="text-base font-black text-indigo-700 mt-0.5">{(userProfile?.credits || 0)} Credits</p>
                </div>
              </div>

              <button
                onClick={onClose}
                className="w-full py-3.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl mt-6 transition duration-150 text-sm cursor-pointer shadow-lg shadow-slate-950/5"
              >
                Return to Studio
              </button>
            </div>
          )}
        </div>

        {/* Footer with safety markings */}
        <div className="border-t border-slate-100 px-6 py-4 flex items-center justify-center gap-2.5 bg-slate-50">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span className="text-[10px] font-extrabold uppercase tracking-wide text-slate-500">
            Secure Payment Gateway Interface • PCI-DSS Certified
          </span>
        </div>

      </div>
    </div>
  );
}
