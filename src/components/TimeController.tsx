import React from 'react';
import { Calendar, Clock, FastForward, RotateCcw } from 'lucide-react';
import { DayOfWeek, PeriodSlot } from '../types';
import { DAYS_OF_WEEK, PERIOD_SLOTS, DAY_ORDER_MAP } from '../data/timetableData';
import { formatMinutesToTime, getCurrentPeriodForTime } from '../utils/statusEngine';

interface TimeControllerProps {
  currentDay: DayOfWeek;
  setDay: (day: DayOfWeek) => void;
  currentTimeMinutes: number;
  setTimeMinutes: (minutes: number) => void;
  isSimulated: boolean;
  setIsSimulated: (simulated: boolean) => void;
  onResetToLive: () => void;
}

export const TimeController: React.FC<TimeControllerProps> = ({
  currentDay,
  setDay,
  currentTimeMinutes,
  setTimeMinutes,
  isSimulated,
  setIsSimulated,
  onResetToLive,
}) => {
  const currentPeriod = getCurrentPeriodForTime(currentTimeMinutes);

  const handlePeriodJump = (slot: PeriodSlot) => {
    setIsSimulated(true);
    // Jump 10 minutes into the period to simulate active mid-class state
    setTimeMinutes(slot.startMinutes + 10);
  };

  return (
    <div className="bg-white border border-slate-200/90 rounded-2xl p-4 sm:p-5 shadow-xs">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        {/* Left: Day Selector with SRM Day Order */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 mr-1">
            <Calendar className="w-3.5 h-3.5 text-amber-600" />
            <span>Day:</span>
          </div>
          <div className="flex items-center gap-1 bg-slate-100/90 p-1 rounded-xl border border-slate-200/80">
            {DAYS_OF_WEEK.map((day) => {
              const isSelected = currentDay === day;
              const order = DAY_ORDER_MAP[day];
              return (
                <button
                  key={day}
                  onClick={() => {
                    setDay(day);
                    setIsSimulated(true);
                  }}
                  className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all flex items-center gap-1 ${
                    isSelected
                      ? 'bg-white text-slate-900 shadow-xs border border-slate-200/90 font-bold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <span>{day.slice(0, 3)}</span>
                  <span className={`text-[10px] px-1 py-0.2 rounded font-mono ${isSelected ? 'bg-amber-100 text-amber-900 font-bold' : 'text-slate-400'}`}>
                    D{order}
                  </span>
                </button>
              );
            })}
          </div>
          <span className="text-[11px] font-mono text-slate-400 font-medium ml-1 hidden sm:inline">
            (SRM IST Day Order {DAY_ORDER_MAP[currentDay]})
          </span>
        </div>

        {/* Center: Live Time / Period Information */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2.5 px-3.5 py-1.5 bg-slate-50 rounded-xl border border-slate-200/90 shadow-2xs">
            <Clock className="w-4 h-4 text-amber-700" />
            <span className="font-mono text-sm font-bold text-slate-900 tracking-wider">
              {formatMinutesToTime(currentTimeMinutes)}
            </span>
            <span className="text-slate-300">|</span>
            <span className="text-xs font-medium text-slate-700">
              {currentPeriod ? (
                <span className="text-amber-800 font-semibold">
                  {currentPeriod.name} ({currentPeriod.startTime}–{currentPeriod.endTime}) · <span className="font-mono text-amber-700 font-bold">{currentPeriod.slotCode}</span>
                </span>
              ) : currentTimeMinutes < 540 ? (
                <span className="text-slate-500">Before Campus Hours (09:00 AM)</span>
              ) : (
                <span className="text-slate-500">After Campus Hours (05:05 PM)</span>
              )}
            </span>
          </div>

          {isSimulated && (
            <button
              onClick={onResetToLive}
              title="Reset to device real-time clock"
              className="px-2.5 py-1.5 rounded-xl border border-slate-200 bg-white text-slate-600 hover:text-slate-900 hover:border-slate-300 text-xs transition-colors flex items-center gap-1.5 shadow-2xs font-medium"
            >
              <RotateCcw className="w-3.5 h-3.5 text-amber-700" />
              <span className="hidden sm:inline">Reset Real-Time</span>
            </button>
          )}
        </div>

        {/* Right: Quick Time Slider */}
        <div className="flex items-center gap-3 w-full lg:w-72">
          <span className="text-[11px] font-mono text-slate-400 shrink-0">09:00</span>
          <input
            type="range"
            min={540} // 09:00
            max={1025} // 17:05
            step={5}
            value={currentTimeMinutes}
            onChange={(e) => {
              setIsSimulated(true);
              setTimeMinutes(parseInt(e.target.value, 10));
            }}
            className="w-full accent-amber-600 bg-slate-200 h-1.5 rounded-lg cursor-pointer"
          />
          <span className="text-[11px] font-mono text-slate-400 shrink-0">17:05</span>
        </div>
      </div>

      {/* Period Quick Jump Bar */}
      <div className="mt-3.5 pt-3.5 border-t border-slate-100 flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-thin">
        <div className="flex items-center gap-1 text-[11px] text-slate-500 font-semibold whitespace-nowrap mr-2 shrink-0">
          <FastForward className="w-3 h-3 text-amber-600" />
          <span>Quick Jump:</span>
        </div>
        {PERIOD_SLOTS.map((slot) => {
          const isSlotActive = currentPeriod?.id === slot.id;
          return (
            <button
              key={slot.id}
              onClick={() => handlePeriodJump(slot)}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-mono font-medium transition-all whitespace-nowrap ${
                isSlotActive
                  ? 'bg-slate-900 text-white font-bold shadow-xs'
                  : slot.isLunch
                  ? 'bg-amber-50 text-amber-800 hover:bg-amber-100 border border-amber-200'
                  : 'bg-slate-50 text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-slate-200/80'
              }`}
            >
              <span>{slot.label}</span>
              <span className="text-[9px] opacity-75 ml-1">({slot.startTime})</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
