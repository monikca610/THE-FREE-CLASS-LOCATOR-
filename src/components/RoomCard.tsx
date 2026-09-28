import React from 'react';
import {
  Tv,
  Wind,
  Monitor,
  Zap,
  Users,
  Timer,
  CheckCircle2,
  XCircle,
  BookmarkCheck,
  ChevronRight,
  ShieldAlert,
} from 'lucide-react';
import { RoomLiveStatus, DayOfWeek } from '../types';
import { PERIOD_SLOTS } from '../data/timetableData';
import { LiveCountdownTimer } from './LiveCountdownTimer';
import { SquadShareButton } from './SquadShareButton';

interface RoomCardProps {
  roomStatus: RoomLiveStatus;
  selectedDay: DayOfWeek;
  currentTimeMinutes?: number;
  isSimulated?: boolean;
  onOpenDetails: () => void;
  onClaimRoom: () => void;
  onReleaseClaim: () => void;
}

export const RoomCard: React.FC<RoomCardProps> = ({
  roomStatus,
  selectedDay,
  currentTimeMinutes = 615,
  isSimulated = true,
  onOpenDetails,
  onClaimRoom,
  onReleaseClaim,
}) => {
  const {
    room,
    status,
    currentClass,
    nextClass,
    nextClassPeriod,
    minutesUntilNextClass,
    consecutiveFreeSlots,
    freeUntilTime,
    isClaimed,
    claimInfo,
  } = roomStatus;

  const isFree = status === 'FREE';
  const isFreeSoon = status === 'FREE_SOON';
  const isKickoutWarning = status === 'BUSY_SOON';
  const isBusy = status === 'BUSY';

  let cardBorderColor = 'border-slate-200/90';
  let statusBadgeBg = 'bg-slate-100 text-slate-700';
  let statusBadgeText = 'FREE';

  if (isClaimed) {
    cardBorderColor = 'border-sky-300 shadow-xs';
    statusBadgeBg = 'bg-sky-50 text-sky-800 border border-sky-200 font-semibold';
    statusBadgeText = 'CLAIMED BY GROUP';
  } else if (isBusy) {
    cardBorderColor = 'border-slate-200';
    statusBadgeBg = 'bg-rose-50 text-rose-800 border border-rose-200 font-semibold';
    statusBadgeText = 'OCCUPIED';
  } else if (isKickoutWarning) {
    cardBorderColor = 'border-amber-400 shadow-[0_4px_16px_rgba(245,158,11,0.12)] ring-1 ring-amber-400/40';
    statusBadgeBg = 'bg-amber-100 text-amber-900 border border-amber-300 font-bold animate-pulse';
    statusBadgeText = 'KICK-OUT WARNING';
  } else if (isFreeSoon) {
    cardBorderColor = 'border-amber-200/80';
    statusBadgeBg = 'bg-amber-50 text-amber-800 border border-amber-200 font-semibold';
    statusBadgeText = 'FREE (LIMITED TIME)';
  } else {
    // Completely Free
    cardBorderColor = 'border-emerald-200/80 hover:border-emerald-300 shadow-2xs';
    statusBadgeBg = 'bg-emerald-50 text-emerald-800 border border-emerald-200 font-semibold';
    statusBadgeText = 'AVAILABLE NOW';
  }

  const daySchedule = room.schedule.filter((s) => s.day === selectedDay);

  return (
    <div
      className={`group relative rounded-2xl bg-white border ${cardBorderColor} p-4 sm:p-5 transition-all duration-200 hover:shadow-md flex flex-col justify-between`}
    >
      {/* Top Header: Room ID, Floor, & Status */}
      <div>
        <div className="flex items-start justify-between gap-2 mb-2">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-slate-900 tracking-tight group-hover:text-amber-700 transition-colors">
                {room.name}
              </h3>
              <span className="text-[11px] font-mono text-slate-500 font-medium">
                {room.block}
              </span>
            </div>
            <div className="text-xs text-slate-500 mt-0.5 font-medium">
              <span>{room.floorName}</span>
              <span className="mx-1.5 text-slate-300">·</span>
              <span>{room.type}</span>
            </div>
          </div>

          {/* Status Indicator */}
          <div className="flex flex-col items-end">
            <span className={`text-[10px] font-mono uppercase tracking-wider px-2.5 py-0.5 rounded-full ${statusBadgeBg}`}>
              {statusBadgeText}
            </span>
          </div>
        </div>

        {/* Live Countdown Timer (HH:MM:SS) */}
        <div className="my-2.5">
          <LiveCountdownTimer
            roomStatus={roomStatus}
            currentDay={selectedDay}
            currentTimeMinutes={currentTimeMinutes}
            isSimulated={isSimulated}
            compact={true}
          />
        </div>

        {/* 8-Period Day Visual Mini-Timeline Bar */}
        <div className="mb-3">
          <div className="flex items-center justify-between text-[10px] text-slate-500 font-mono mb-1">
            <span>Day Slots (P1–P8):</span>
            <span className="text-emerald-700 font-semibold">
              {consecutiveFreeSlots > 0 ? `${consecutiveFreeSlots} slot(s) free` : ''}
            </span>
          </div>
          <div className="grid grid-cols-9 gap-1 h-3 rounded-lg bg-slate-100 p-0.5 border border-slate-200">
            {PERIOD_SLOTS.map((slot) => {
              if (slot.isLunch) {
                return (
                  <div
                    key="lunch"
                    title="Lunch Break (12:35 - 13:30)"
                    className="bg-amber-100 rounded-[3px]"
                  />
                );
              }
              const hasClass = daySchedule.some((s) => s.periodId === slot.id);
              const isCurrent = roomStatus.currentPeriod?.id === slot.id;
              return (
                <div
                  key={slot.id}
                  title={`${slot.name} (${slot.startTime}-${slot.endTime}): ${
                    hasClass ? 'Class Scheduled' : 'Free'
                  }`}
                  className={`rounded-[3px] transition-colors relative ${
                    hasClass
                      ? 'bg-rose-400'
                      : 'bg-emerald-500 hover:bg-emerald-600'
                  } ${isCurrent ? 'ring-2 ring-slate-900' : ''}`}
                />
              );
            })}
          </div>
        </div>

        {/* Amenity Badges & Capacity */}
        <div className="flex items-center gap-2 flex-wrap text-slate-600 text-xs mb-3 pt-2 border-t border-slate-100">
          <span className="flex items-center gap-1 font-mono text-[11px] text-slate-700 font-medium" title="Capacity">
            <Users className="w-3.5 h-3.5 text-slate-500" />
            <span>{room.capacity} seats</span>
          </span>

          <span className="text-slate-300">·</span>

          {room.amenities.ac && (
            <span className="flex items-center gap-1 text-[11px]" title="Air Conditioned">
              <Wind className="w-3 h-3 text-sky-600" />
              <span>AC</span>
            </span>
          )}

          {room.amenities.projector && (
            <span className="flex items-center gap-1 text-[11px]" title="Projector Equipped">
              <Tv className="w-3 h-3 text-amber-700" />
              <span>Projector</span>
            </span>
          )}

          {room.amenities.labComputers && (
            <span className="flex items-center gap-1 text-[11px]" title="Computer Workstations">
              <Monitor className="w-3 h-3 text-emerald-700" />
              <span>Workstations</span>
            </span>
          )}

          {room.amenities.powerSockets && (
            <span className="flex items-center gap-1 text-[11px]" title="Desk Outlets Available">
              <Zap className="w-3 h-3 text-amber-600" />
              <span>Sockets</span>
            </span>
          )}
        </div>
      </div>

      {/* Card Footer: Claim Action, Squad Share & Details Button */}
      <div className="pt-2.5 border-t border-slate-100 flex items-center justify-between gap-1.5 flex-wrap mt-auto">
        <div className="flex items-center gap-1.5">
          {!isBusy && !isClaimed ? (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onClaimRoom();
              }}
              className="px-2.5 py-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 text-xs font-semibold transition-colors flex items-center gap-1 shadow-2xs"
            >
              <BookmarkCheck className="w-3.5 h-3.5 text-amber-700" />
              <span>Claim</span>
            </button>
          ) : isClaimed ? (
            <span className="text-[11px] text-sky-800 font-mono font-bold flex items-center gap-1">
              <BookmarkCheck className="w-3.5 h-3.5 text-sky-700" />
              <span>Claimed</span>
            </span>
          ) : (
            <span className="text-[11px] text-slate-400 font-mono">
              In Session
            </span>
          )}

          {/* Squad Share Button */}
          {!isBusy && (
            <SquadShareButton
              roomStatus={roomStatus}
              currentDay={selectedDay}
              currentTimeMinutes={currentTimeMinutes}
              isSimulated={isSimulated}
              size="sm"
            />
          )}
        </div>

        <button
          onClick={onOpenDetails}
          className="text-xs text-slate-600 hover:text-slate-900 flex items-center gap-1 hover:underline font-medium p-1 ml-auto"
        >
          <span>Timetable</span>
          <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
        </button>
      </div>
    </div>
  );
};

