import React, { useState } from 'react';
import { AlertCircle, X, ShieldAlert, Timer, Users, Search } from 'lucide-react';

export const ProblemBanner: React.FC = () => {
  const [isDismissed, setIsDismissed] = useState(false);

  if (isDismissed) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-3 flex justify-end">
        <button
          onClick={() => setIsDismissed(false)}
          className="text-xs text-slate-500 hover:text-amber-800 flex items-center gap-1.5 transition-colors font-medium"
        >
          <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
          <span>Why Vibecraft? Read Problem Scenario</span>
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-4">
      <div className="relative overflow-hidden rounded-2xl border border-amber-200/80 bg-gradient-to-r from-amber-50/80 via-white to-slate-50/90 p-4 sm:p-5 shadow-xs">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="p-2.5 rounded-xl bg-amber-100/80 border border-amber-200 text-amber-800 shrink-0 mt-0.5 shadow-2xs">
              <ShieldAlert className="w-5 h-5 text-amber-700" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-sm font-bold text-slate-900">
                  The Empty Classroom Dilemma at SRM Tiruchirappalli
                </h2>
                <span className="text-[11px] font-mono font-medium text-amber-800 bg-amber-100 border border-amber-300 px-2 py-0.5 rounded-full">
                  FET Academic Complex
                </span>
              </div>
              <p className="text-xs text-slate-600 mt-1.5 leading-relaxed max-w-3xl">
                Ever settled in with your laptops and notes only to be booted out 15 minutes later when a scheduled 3rd-year AI & DS or VLSI lecture arrives? Vibecraft scans real-time academic timetables across <strong className="text-slate-900 font-semibold">CSE, AI&DS, ECE, EEE, Mechanical & Cyber Security</strong> at the SRM Trichy campus, showing you live kick-out countdowns, 3D wing layouts, and instant squad invites.
              </p>

              <div className="flex flex-wrap items-center gap-4 mt-3 text-xs text-slate-600 font-medium">
                <span className="flex items-center gap-1.5 text-slate-700">
                  <Timer className="w-3.5 h-3.5 text-amber-700" />
                  <span>Live Kick-Out Countdown</span>
                </span>
                <span className="text-slate-300 hidden sm:inline">·</span>
                <span className="flex items-center gap-1.5 text-slate-700">
                  <Search className="w-3.5 h-3.5 text-emerald-700" />
                  <span>Smart Search NLP Engine</span>
                </span>
                <span className="text-slate-300 hidden sm:inline">·</span>
                <span className="flex items-center gap-1.5 text-slate-700">
                  <Users className="w-3.5 h-3.5 text-sky-700" />
                  <span>Group Claim Local Sync</span>
                </span>
              </div>
            </div>
          </div>

          <button
            onClick={() => setIsDismissed(true)}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-200/60 transition-colors shrink-0"
            aria-label="Dismiss banner"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
