import React from 'react';
import { UserProfile } from '../types';
import { Camera, LogOut, Coins, Plus } from 'lucide-react';

interface NavbarProps {
  userProfile: UserProfile | null;
  onBuyCreditsClick: () => void;
  onSignOut: () => Promise<void>;
}

export default function Navbar({ userProfile, onBuyCreditsClick, onSignOut }: NavbarProps) {
  return (
    <nav className="border-b border-slate-200 bg-white sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-3.5 flex justify-between items-center">
        
        {/* Brand Logo */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-md shadow-indigo-600/15">
            <Camera className="w-5 h-5" />
          </div>
          <div>
            <span className="font-extrabold text-slate-900 tracking-tight block text-base md:text-lg">
              Selection Gallery
            </span>
            <span className="text-[10px] uppercase tracking-widest font-black text-indigo-600 block leading-none">
              SaaS SaaS SaaS
            </span>
          </div>
        </div>

        {/* User Balance & Actions */}
        {userProfile && (
          <div className="flex items-center gap-3 md:gap-6">
            {/* Credits badge */}
            <div className="flex items-center gap-2 bg-indigo-50 border border-indigo-100 px-3 py-1.5 rounded-full shadow-sm">
              <Coins className="w-4 h-4 text-indigo-600" />
              <div className="text-xs font-bold text-indigo-950 flex items-center gap-1.5">
                <span>{userProfile.credits}</span>
                <span className="text-[10px] text-indigo-500 font-medium hidden sm:inline">Credits</span>
              </div>
              <button
                onClick={onBuyCreditsClick}
                className="w-5 h-5 rounded-full bg-indigo-600 hover:bg-indigo-700 text-white flex items-center justify-center transition-colors cursor-pointer"
                title="Add credits"
              >
                <Plus className="w-3 h-3" />
              </button>
            </div>

            {/* Profile Avatar and Sign Out */}
            <div className="flex items-center gap-3 border-l border-slate-200 pl-3 md:pl-6">
              <div className="flex items-center gap-2">
                {userProfile.photoURL ? (
                  <img
                    src={userProfile.photoURL}
                    alt={userProfile.displayName || 'Photographer'}
                    referrerPolicy="no-referrer"
                    className="w-8 h-8 rounded-full border border-slate-200 object-cover"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-700 font-bold flex items-center justify-center text-xs border border-slate-200">
                    {userProfile.displayName ? userProfile.displayName.charAt(0).toUpperCase() : 'P'}
                  </div>
                )}
                <span className="text-xs font-semibold text-slate-700 hidden md:inline-block max-w-[120px] truncate">
                  {userProfile.displayName || 'Photographer'}
                </span>
              </div>

              <button
                onClick={onSignOut}
                className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:text-red-600 hover:border-red-200 hover:bg-red-50 transition-all cursor-pointer"
                title="Log Out"
                type="button"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

      </div>
    </nav>
  );
}
