import React from 'react';
import { Compass, Clock, Sparkles, ShieldAlert, Box } from 'lucide-react';
import { DayOfWeek } from '../types';
import { formatMinutesToTime } from '../utils/statusEngine';
import { DAY_ORDER_MAP } from '../data/timetableData';

export type NavTabType = '3d-map' | 'floor-grid' | 'smart-search' | 'master-timetable';

interface HeaderProps {
  currentDay: DayOfWeek;
  currentTimeMinutes: number;
  isSimulated: boolean;
  onResetToLive: () => void;
  freeCount: number;
  totalRooms: number;
  criticalKickoutCount: number;
  activeTab: NavTabType;
  setActiveTab: (tab: NavTabType) => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentDay,
  currentTimeMinutes,
  isSimulated,
  onResetToLive,
  freeCount,
  totalRooms,
  criticalKickoutCount,
  activeTab,
  setActiveTab,
}) => {
  return (
    <header className="border-b border-slate-200/80 bg-white/95 backdrop-blur-md sticky top-0 z-40 shadow-xs">
      {/* Top Bar Contract: Brand - Nav - Actions */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-4">
        {/* Brand Zone */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-700 shadow-xs">
            <Compass className="w-5 h-5" />
          </div>
          <div>
            <a href="/" className="text-base sm:text-lg font-bold tracking-tight text-slate-900 flex items-center gap-2">
              <span>Vibecraft</span>
              <span className="text-[11px] font-mono font-medium text-amber-800 uppercase tracking-widest px-2 py-0.5 rounded bg-amber-100/70 border border-amber-200">
                SRM Trichy
              </span>
            </a>
            <p className="text-xs text-slate-500 hidden sm:block">
              SRM Institute of Science & Technology · Tiruchirappalli Campus (Irungalur)
            </p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="flex items-center gap-1 sm:gap-1.5 bg-slate-100/90 p-1 rounded-xl border border-slate-200/80 text-xs font-medium">
          <button
            onClick={() => setActiveTab('3d-map')}
            className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === '3d-map'
                ? 'bg-slate-900 text-white shadow-xs font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Box className={`w-3.5 h-3.5 ${activeTab === '3d-map' ? 'text-amber-400' : 'text-slate-500'}`} />
            <span>3D Map</span>
          </button>
          <button
            onClick={() => setActiveTab('floor-grid')}
            className={`px-3 py-1.5 rounded-lg transition-all whitespace-nowrap ${
              activeTab === 'floor-grid'
                ? 'bg-white text-slate-900 shadow-xs font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Floor Grid
          </button>
          <button
            onClick={() => setActiveTab('smart-search')}
            className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'smart-search'
                ? 'bg-white text-slate-900 shadow-xs font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-600" />
            <span>Smart Search</span>
          </button>
          <button
            onClick={() => setActiveTab('master-timetable')}
            className={`px-3 py-1.5 rounded-lg transition-all whitespace-nowrap hidden md:block ${
              activeTab === 'master-timetable'
                ? 'bg-white text-slate-900 shadow-xs font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Master Timetable
          </button>
        </nav>

        {/* Live Clock / Simulator Indicator */}
        <div className="flex items-center gap-3">
          <div className="text-right hidden sm:block">
            <div className="flex items-center gap-2 justify-end">
              <span className="relative flex h-2 w-2">
                <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${isSimulated ? 'bg-amber-400' : 'bg-emerald-400'}`}></span>
                <span className={`relative inline-flex rounded-full h-2 w-2 ${isSimulated ? 'bg-amber-500' : 'bg-emerald-500'}`}></span>
              </span>
              <span className="font-mono text-xs font-bold text-slate-800 tracking-wide">
                {currentDay} (Day Order {DAY_ORDER_MAP[currentDay]}), {formatMinutesToTime(currentTimeMinutes)}
              </span>
            </div>
            <div className="text-[11px] text-slate-500">
              {isSimulated ? (
                <button
                  onClick={onResetToLive}
                  className="text-amber-700 hover:text-amber-900 hover:underline flex items-center gap-1 ml-auto font-medium"
                >
                  <Clock className="w-3 h-3" />
                  <span>Simulator active (Reset)</span>
                </button>
              ) : (
                <span className="text-emerald-700 font-medium">Live Campus Mode</span>
              )}
            </div>
          </div>

          {/* Quick Stat Pill */}
          <div className="bg-slate-100 border border-slate-200/90 rounded-xl px-3 py-1.5 flex items-center gap-2 text-xs shadow-2xs">
            <span className="text-slate-500 font-medium">Free:</span>
            <span className="font-mono font-bold text-emerald-700">{freeCount}/{totalRooms}</span>
            {criticalKickoutCount > 0 && (
              <span className="flex items-center gap-1 text-amber-700 pl-1.5 border-l border-slate-300 font-medium" title={`${criticalKickoutCount} room(s) have classes starting in <= 20 min`}>
                <ShieldAlert className="w-3.5 h-3.5 text-amber-600" />
                <span className="font-mono font-bold">{criticalKickoutCount}</span>
              </span>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
