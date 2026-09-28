import React, { useState, useEffect } from 'react';
import { Timer, AlertTriangle, CheckCircle2, XCircle, ShieldAlert } from 'lucide-react';
import { RoomLiveStatus, DayOfWeek } from '../types';
import { formatMinutesToTime } from '../utils/statusEngine';

interface LiveCountdownTimerProps {
  roomStatus: RoomLiveStatus;
  currentDay: DayOfWeek;
  currentTimeMinutes: number;
  isSimulated: boolean;
  compact?: boolean;
}

export const LiveCountdownTimer: React.FC<LiveCountdownTimerProps> = ({
  roomStatus,
  currentDay,
  currentTimeMinutes,
  isSimulated,
  compact = false,
}) => {
  const {
    status,
    nextClass,
    nextClassPeriod,
    currentClass,
    nextAvailableTime,
    isClaimed,
    claimInfo,
  } = roomStatus;

  // Live ticking second counter that updates every second without requiring page reload
  const [ticker, setTicker] = useState<number>(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setTicker((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Compute live seconds of current day
  let currentTotalSeconds = 0;
  if (!isSimulated) {
    const now = new Date();
    currentTotalSeconds =
      now.getHours() * 3600 + now.getMinutes() * 60 + now.getSeconds();
  } else {
    // In simulation mode, start at selected minute and advance by live elapsed seconds
    currentTotalSeconds = currentTimeMinutes * 60 + (ticker % 60);
  }

  // Calculate remaining seconds until next scheduled lecture
  let remainingSeconds: number | null = null;
  if (nextClassPeriod && status !== 'BUSY') {
    const targetSeconds = nextClassPeriod.startMinutes * 60;
    remainingSeconds = Math.max(0, targetSeconds - currentTotalSeconds);
  }

  // Format in HH:MM:SS
  const formatSecondsToHMS = (totalSec: number) => {
    const h = Math.floor(totalSec / 3600);
    const m = Math.floor((totalSec % 3600) / 60);
    const s = totalSec % 60;
    const pad = (n: number) => (n < 10 ? `0${n}` : `${n}`);
    return `${pad(h)}:${pad(m)}:${pad(s)}`;
  };

  // Case 1: Room is occupied
  if (status === 'BUSY') {
    return (
      <div
        className={`rounded-2xl border ${
          compact
            ? 'p-2.5 bg-rose-50/70 border-rose-200'
            : 'p-4 bg-rose-50 border-rose-200 shadow-2xs'
        } text-xs`}
      >
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-2 text-rose-900 font-bold">
            <XCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span className="text-sm">Currently occupied</span>
          </div>

          {nextAvailableTime ? (
            <span className="font-mono text-emerald-800 bg-emerald-100/90 px-2.5 py-1 rounded-lg font-bold text-xs border border-emerald-300">
              Next available at {nextAvailableTime}
            </span>
          ) : (
            <span className="font-mono text-rose-800 text-[11px] font-medium bg-rose-100/80 px-2 py-0.5 rounded border border-rose-300">
              No further free slot today
            </span>
          )}
        </div>

        <p className="text-xs text-slate-600 mt-2 font-medium">
          {currentClass ? (
            <span>
              <strong className="text-slate-900 font-semibold">{currentClass.courseCode}</strong>: {currentClass.courseName} · {currentClass.faculty} ({currentClass.department})
            </span>
          ) : isClaimed && claimInfo ? (
            <span>
              Claimed by <strong className="text-slate-900">{claimInfo.claimedBy}</strong> for "{claimInfo.studyTopic}"
            </span>
          ) : (
            'Active academic session in progress'
          )}
        </p>
      </div>
    );
  }

  // Case 2: Room is free, and there is an upcoming class scheduled today
  if (remainingSeconds !== null && nextClassPeriod && nextClass) {
    const isImminent = remainingSeconds <= 600; // <= 10 minutes
    const isWarning = remainingSeconds <= 1200; // <= 20 minutes
    const hmsString = formatSecondsToHMS(remainingSeconds);
    const nextClassStartTime = formatMinutesToTime(nextClassPeriod.startMinutes);

    const remainingMinutesCeil = Math.max(1, Math.ceil(remainingSeconds / 60));

    return (
      <div
        className={`rounded-2xl border transition-all ${
          isImminent
            ? 'bg-amber-100/90 border-amber-400 text-amber-950 shadow-xs ring-1 ring-amber-400/40'
            : isWarning
            ? 'bg-amber-50 border-amber-300 text-amber-900'
            : 'bg-emerald-50/80 border-emerald-200 text-emerald-950'
        } ${compact ? 'p-2.5' : 'p-4'}`}
      >
        <div className="flex items-center justify-between gap-3 flex-wrap">
          {/* Main Status Text */}
          <div className="flex items-center gap-2">
            {isImminent ? (
              <ShieldAlert className="w-5 h-5 text-amber-700 animate-bounce shrink-0" />
            ) : isWarning ? (
              <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
            ) : (
              <Timer className="w-5 h-5 text-emerald-700 shrink-0" />
            )}

            <div>
              <div className="font-bold text-sm tracking-tight">
                {isImminent ? (
                  <span className="text-amber-950">
                    Class starts in {remainingMinutesCeil} minute{remainingMinutesCeil === 1 ? '' : 's'}
                  </span>
                ) : (
                  <span>Free for {hmsString}</span>
                )}
              </div>
              <div className="text-xs text-slate-600 font-medium">
                Next class starts at <strong className="text-slate-900 font-bold">{nextClassStartTime}</strong>
              </div>
            </div>
          </div>

          {/* Exact Live Countdown Display in HH:MM:SS */}
          <div className="font-mono font-bold text-sm sm:text-base tracking-widest px-3 py-1 rounded-xl bg-white/95 border border-slate-200/90 text-slate-900 shadow-2xs">
            {hmsString}
          </div>
        </div>

        {/* Detailed info footer */}
        {!compact && (
          <div className="mt-3 pt-2.5 border-t border-slate-200/60 flex items-center justify-between text-xs text-slate-600 flex-wrap gap-1">
            <span>
              Upcoming: <strong className="text-slate-900">{nextClass.courseCode}</strong> ({nextClass.courseName})
            </span>
            <span className="font-mono text-slate-500">
              {nextClassPeriod.name} ({nextClassPeriod.slotCode})
            </span>
          </div>
        )}
      </div>
    );
  }

  // Case 3: No upcoming classes scheduled in the available schedule
  return (
    <div
      className={`rounded-2xl border bg-emerald-50/80 border-emerald-200 text-emerald-950 ${
        compact ? 'p-2.5' : 'p-4'
      }`}
    >
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 text-emerald-700 shrink-0" />
          <div>
            <div className="text-sm font-bold text-emerald-900">
              No upcoming class scheduled
            </div>
            <div className="text-xs text-slate-600">
              Zero lectures remaining for {currentDay} in this venue
            </div>
          </div>
        </div>

        <span className="font-mono text-emerald-800 bg-emerald-100/90 px-3 py-1 rounded-xl text-xs font-bold border border-emerald-300">
          Open for study
        </span>
      </div>
    </div>
  );
};
