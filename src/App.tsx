import React, { useState, useEffect } from 'react';
import { User, onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, getDoc, setDoc, collection, query, orderBy, onSnapshot, serverTimestamp } from 'firebase/firestore';
import { auth, db, handleFirestoreError, OperationType } from './lib/firebase';
import { UserProfile, GalleryItem } from './types';
import Navbar from './components/Navbar';
import AuthScreen from './components/AuthScreen';
import GalleryForm from './components/GalleryForm';
import GalleriesList from './components/GalleriesList';
import BuyCreditsModal from './components/BuyCreditsModal';
import { Camera, Coins, FileText, Landmark, LogOut, CheckCircle, Sparkles, TrendingUp } from 'lucide-react';

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [galleries, setGalleries] = useState<GalleryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [buyModalOpen, setBuyModalOpen] = useState(false);
  const [diagnosticError, setDiagnosticError] = useState<string | null>(null);

  // 1. Listen to Firebase Auth state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setLoading(true);
      setDiagnosticError(null);
      if (user) {
        setCurrentUser(user);
        await ensureUserProfile(user);
      } else {
        setCurrentUser(null);
        setUserProfile(null);
        setGalleries([]);
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  // 2. Mapped user profile and galleries synchronizer
  useEffect(() => {
    if (!currentUser) return;

    const userProfileRef = doc(db, 'users', currentUser.uid);

    // Profile listener for live credit balance updates
    const unsubProfile = onSnapshot(userProfileRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setUserProfile({
          uid: data.uid,
          email: data.email,
          displayName: data.displayName || 'Photographer',
          photoURL: data.photoURL || '',
          credits: data.credits ?? 0,
          createdAt: data.createdAt,
          updatedAt: data.updatedAt
        });
      }
    }, (err) => {
      console.error('Error synchronizing photographer profile:', err);
      setDiagnosticError(err.message);
      handleFirestoreError(err, OperationType.GET, `users/${currentUser.uid}`);
    });

    // Galleries list listener sorted by creation details
    const galleriesRef = collection(db, 'users', currentUser.uid, 'galleries');
    const qGalleries = query(galleriesRef, orderBy('createdAt', 'desc'));
    
    const unsubGalleries = onSnapshot(qGalleries, (querySnap) => {
      const items: GalleryItem[] = [];
      querySnap.forEach((docSnap) => {
        const d = docSnap.data();
        items.push({
          id: d.id,
          title: d.title,
          imagesCount: d.imagesCount,
          whatsappNumber: d.whatsappNumber,
          hasPassword: d.hasPassword,
          createdAt: d.createdAt
        });
      });
      setGalleries(items);
      setLoading(false);
    }, (err) => {
      console.error('Error listing galleries history:', err);
      // Fallback if sorting triggers indexing delay initially
      handleFirestoreError(err, OperationType.LIST, `users/${currentUser.uid}/galleries`);
    });

    return () => {
      unsubProfile();
      unsubGalleries();
    };
  }, [currentUser]);

  // Ensure Photographer Profile is registered or initialize with 3 Welcome Credits
  const ensureUserProfile = async (user: User) => {
    try {
      const userRef = doc(db, 'users', user.uid);
      const userSnap = await getDoc(userRef);

      if (!userSnap.exists()) {
        // User first time logging in! Give them 3 free warm-invite complimentary credits to test-drive!
        const initialProfile: UserProfile = {
          uid: user.uid,
          email: user.email || '',
          displayName: user.displayName || 'Photographer',
          photoURL: user.photoURL || '',
          credits: 3, // Initial gift!
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        };

        await setDoc(userRef, initialProfile);
        setUserProfile(initialProfile);
      } else {
        const d = userSnap.data();
        setUserProfile({
          uid: d.uid,
          email: d.email,
          displayName: d.displayName,
          photoURL: d.photoURL,
          credits: d.credits ?? 0,
          createdAt: d.createdAt,
          updatedAt: d.updatedAt
        });
      }
    } catch (err: any) {
      console.error('Failed to register or retrieve profile registry:', err);
      setDiagnosticError('Invariants Check Interrupted: ' + err.message);
      handleFirestoreError(err, OperationType.WRITE, `users/${user.uid}`);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut(auth);
    } catch (err) {
      console.error('Signout failed:', err);
    }
  };

  const updateCreditsState = (newCredits: number) => {
    if (userProfile) {
      setUserProfile({
        ...userProfile,
        credits: newCredits
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center">
        <span className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-slate-200 border-t-indigo-600 mb-4"></span>
        <p className="text-xs text-slate-500 font-bold uppercase tracking-wide">Syncing Photographer Studio…</p>
      </div>
    );
  }

  if (!currentUser) {
    return <AuthScreen onSuccess={() => {}} />;
  }

  // Computing stats values
  const totalGenerationsCount = galleries.length;
  const creditsLeftValue = userProfile?.credits || 0;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col text-slate-800">
      
      {/* Navigation section */}
      <Navbar
        userProfile={userProfile}
        onBuyCreditsClick={() => setBuyModalOpen(true)}
        onSignOut={handleSignOut}
      />

      <main className="max-w-7xl mx-auto px-4 md:px-8 py-8 w-full flex-1 grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left / Center: Configurator and History blocks */}
        <div className="lg:col-span-2 space-y-8">
          
          {diagnosticError && (
            <div className="bg-amber-50 border border-amber-200 text-amber-900 rounded-2xl p-4 text-xs font-semibold leading-relaxed shadow-sm">
              <span className="block font-bold mb-1">AISTUDIO_DIAGNOSTICS: Secure Sandbox Warning</span>
              {diagnosticError}. Please confirm your internet is stable.
            </div>
          )}

          {/* Quick Stats Summary Strip */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            
            <div className="bg-white rounded-xl border border-slate-200/80 p-4.5 flex items-center justify-between shadow-sm">
              <div>
                <span className="text-[11px] font-black tracking-wider uppercase text-slate-400 block">Total Shoots</span>
                <span className="text-xl font-black text-slate-900 mt-1 block leading-none">{totalGenerationsCount}</span>
              </div>
              <div className="w-10 h-10 rounded-lg bg-slate-100 text-slate-500 flex items-center justify-center">
                <FileText className="w-5 h-5" />
              </div>
            </div>

            <div className="bg-white rounded-xl border border-slate-200/80 p-4.5 flex items-center justify-between shadow-sm">
              <div>
                <span className="text-[11px] font-black tracking-wider uppercase text-slate-400 block">Credits Left</span>
                <span className="text-xl font-black text-indigo-700 mt-1 block leading-none">{creditsLeftValue}</span>
              </div>
              <div className="w-10 h-10 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                <Coins className="w-5 h-5" />
              </div>
            </div>

            <div className="bg-white rounded-xl border border-slate-200/80 p-4.5 flex items-center justify-between shadow-sm">
              <div>
                <span className="text-[11px] font-black tracking-wider uppercase text-indigo-500 block">Rate / Gallery</span>
                <span className="text-xl font-black text-slate-900 mt-1 block leading-none">₹25</span>
              </div>
              <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <TrendingUp className="w-5 h-5" />
              </div>
            </div>

          </div>

          {/* Core creator workspace form */}
          <GalleryForm
            userProfile={userProfile}
            onCreditsUpdated={updateCreditsState}
            onGalleryCompiled={() => {}}
          />

          {/* Historical galleries log */}
          <GalleriesList galleries={galleries} />

        </div>

        {/* Right Panel: Side Dashboard Details & Top-up package lists */}
        <div className="space-y-6">
          
          <div className="bg-slate-900 text-slate-100 rounded-2xl p-6 shadow-xl border border-slate-800 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-600/10 rounded-full blur-2xl pointer-events-none"></div>
            
            <h3 className="font-extrabold text-base tracking-tight mb-2 text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-indigo-400" />
              <span>Studio Quick Overview</span>
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed mb-4">
              Welcome to your private photograph selection studio portal. Build clean selection portfolios for clients, wedding events, or birthday shoots in clicks.
            </p>

            <div className="space-y-3.5 border-t border-slate-800 pt-4 text-xs font-medium">
              <div className="flex justify-between">
                <span className="text-slate-500">Google Account:</span>
                <span className="text-slate-300 font-bold truncate max-w-[150px]">{currentUser.email}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Service Plan:</span>
                <span className="text-indigo-400 font-bold">Standard Pay-per-Gallery</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Current Balance:</span>
                <span className="text-emerald-400 font-bold">{creditsLeftValue} Credits left</span>
              </div>
            </div>

            <button
              onClick={() => setBuyModalOpen(true)}
              className="mt-6 w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black uppercase rounded-xl transition duration-150 flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-indigo-600/20"
            >
              <Coins className="w-4 h-4" />
              <span>Purchase Top-Up Pack</span>
            </button>
          </div>

          {/* Informational Help Box */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
            <h4 className="font-extrabold text-slate-900 text-sm mb-3">How Selection portfolios work:</h4>
            <ul className="space-y-3.5 text-xs text-slate-500 leading-normal font-medium list-disc pl-4">
              <li>Upload JPG/PNG client shoots directly inside the workspace generator.</li>
              <li>Toggle passcode secure option and define active mobile link codes.</li>
              <li>Compile to convert all images locally into secure <strong>self-contained standalone HTML</strong> files. No server databases needed!</li>
              <li>Deliver file to clients via WhatsApp, mail, or drive. Selections update automatically and transfer with 1-tap WhatsApp response.</li>
            </ul>
          </div>

        </div>

      </main>

      {/* Buy credits modal */}
      {buyModalOpen && (
        <BuyCreditsModal
          userProfile={userProfile}
          onClose={() => setBuyModalOpen(false)}
          onCreditsUpdated={updateCreditsState}
        />
      )}

      {/* Sticky footer credits */}
      <footer className="border-t border-slate-200 bg-white py-6 text-center text-xs text-slate-400 font-bold uppercase tracking-wider">
        Selection Gallery SaaS © 2026 • Powered by Google Cloud Run & Firebase
      </footer>

    </div>
  );
}
