import React, { useState } from 'react';
import { signInWithGoogle } from '../lib/firebase';
import { Camera, CheckCircle, Shield, CreditCard, Sparkles } from 'lucide-react';

interface AuthScreenProps {
  onSuccess: () => void;
}

export default function AuthScreen({ onSuccess }: AuthScreenProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSignIn = async () => {
    setLoading(true);
    setError(null);
    try {
      await signInWithGoogle();
      onSuccess();
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Verification cancelled. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center p-6 text-slate-100">
      {/* Background radial soft light blobs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-emerald-600/10 rounded-full blur-3xl pointer-events-none"></div>

      <div className="max-w-md w-full relative z-10 bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-2xl">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-indigo-600 text-white mb-4 shadow-lg shadow-indigo-600/20">
            <Camera className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-black tracking-tight text-white">
            Selection Gallery SaaS
          </h1>
          <p className="text-slate-400 mt-2 text-sm">
            Generate secure, self-contained, offline-first image galleries for premium photo selection.
          </p>
        </div>

        {/* Feature List */}
        <div className="space-y-4 mb-8">
          <div className="flex gap-3 items-start">
            <div className="text-indigo-400 p-0.5">
              <CheckCircle className="w-5 h-5 flex-shrink-0" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-200">Free Sign Up + Warm Invite Gift</h3>
              <p className="text-xs text-slate-400">Get 3 complimentary gallery credits to test compiling and sharing instantly.</p>
            </div>
          </div>

          <div className="flex gap-3 items-start">
            <div className="text-indigo-400 p-0.5">
              <CreditCard className="w-5 h-5 flex-shrink-0" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-200">Pay-Per-Gallery Pricing</h3>
              <p className="text-xs text-slate-400">Only pay ₹25 per gallery generated. Absolutely no hidden fees or contracts.</p>
            </div>
          </div>

          <div className="flex gap-3 items-start">
            <div className="text-indigo-400 p-0.5">
              <Shield className="w-5 h-5 flex-shrink-0" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-200">Private & Secure Protection</h3>
              <p className="text-xs text-slate-400">Optional passcode protection. Your clients select photos and send them via WhatsApp in 1 tap.</p>
            </div>
          </div>
        </div>

        {error && (
          <div className="mb-6 bg-red-950/40 border border-red-900/50 rounded-lg p-3 text-xs text-red-400">
            {error}
          </div>
        )}

        <button
          onClick={handleSignIn}
          disabled={loading}
          className="w-full py-3.5 px-4 bg-white hover:bg-slate-100 disabled:opacity-50 text-slate-900 font-bold rounded-xl transition duration-150 flex items-center justify-center gap-3 shadow-lg shadow-white/5 cursor-pointer text-sm"
        >
          {loading ? (
            <span className="inline-block animate-spin rounded-full h-4 w-4 border-2 border-slate-900 border-t-transparent"></span>
          ) : (
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v3.92h6.61a5.66 5.66 0 0 1-2.45 3.71v3.08h3.95a12 12 0 0 0 3.63-8.64Z"
              />
              <path
                fill="#34A853"
                d="M12 24c3.24 0 5.97-1.08 7.96-2.91l-3.95-3.08c-1.12.77-2.52 1.25-4.01 1.25-3.09 0-5.72-2.08-6.65-4.87H1.34v3.18A12 12 0 0 0 12 24Z"
              />
              <path
                fill="#FBBC05"
                d="M5.35 14.39A7.16 7.16 0 0 1 5 12c0-.84.14-1.66.41-2.45V6.37H1.34A12 12 0 0 0 0 12c0 2.12.55 4.12 1.49 5.87l3.86-3.48Z"
              />
              <path
                fill="#EA4335"
                d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0A12 12 0 0 0 1.34 6.37l3.86 3.48C6.13 6.92 8.76 4.75 12 4.75Z"
              />
            </svg>
          )}
          Sign up / Sign in with Google
        </button>

        <p className="text-center text-[10px] text-slate-500 mt-6 leading-relaxed">
          Secure logins processed directly via Google Accounts.
          Your private photos remain your intellectual property.
        </p>
      </div>
    </div>
  );
}
