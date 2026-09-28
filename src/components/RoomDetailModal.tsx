import React, { useState } from 'react';
import {
  X,
  Building,
  Users,
  Tv,
  Wind,
  Monitor,
  Zap,
  BookmarkCheck,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';
import { RoomLiveStatus, DayOfWeek } from '../types';
import { PERIOD_SLOTS, DAYS_OF_WEEK } from '../data/timetableData';
import { LiveCountdownTimer } from './LiveCountdownTimer';
import { SquadShareButton } from './SquadShareButton';

interface RoomDetailModalProps {
  roomStatus: RoomLiveStatus | null;
  currentDay: DayOfWeek;
  currentTimeMinutes: number;
  isSimulated?: boolean;
  onClose: () => void;
  onClaimRoom: (roomId: string) => void;
  onReleaseClaim: (roomId: string) => void;
}

export const RoomDetailModal: React.FC<RoomDetailModalProps> = ({
  roomStatus,
  currentDay,
  currentTimeMinutes,
  isSimulated = true,
  onClose,
  onClaimRoom,
  onReleaseClaim,
}) => {
  const [activeDayTab, setActiveDayTab] = useState<DayOfWeek>(currentDay);

  if (!roomStatus) return null;

  const { room, status, isClaimed } = roomStatus;
  const scheduleForActiveDay = room.schedule.filter((s) => s.day === activeDayTab);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="bg-white border border-slate-200 rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-slate-200 bg-slate-50/80 flex items-start justify-between">
          <div className="flex items-start gap-3.5">
            <div className="p-3 rounded-2xl bg-amber-100 border border-amber-200 text-amber-800 shadow-2xs">
              <Building className="w-6 h-6 text-amber-700" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                  {room.name || 'Not available'}
                </h2>
                <span className="text-xs font-mono font-medium px-2.5 py-0.5 rounded-full bg-slate-200/80 text-slate-800 border border-slate-300">
                  {room.type || 'Not available'}
                </span>
                <span
                  className={`text-[10px] font-mono uppercase font-bold tracking-wider px-2.5 py-0.5 rounded-full ${
                    status === 'BUSY'
                      ? 'bg-rose-100 text-rose-800 border border-rose-200'
                      : status === 'BUSY_SOON'
                      ? 'bg-amber-100 text-amber-900 border border-amber-300'
                      : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                  }`}
                >
                  {status === 'BUSY'
                    ? 'Occupied'
                    : status === 'BUSY_SOON'
                    ? 'Class Starting Soon'
                    : 'Available'}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1 font-medium">
                Floor: {room.floorName || 'Not available'} · Block: {room.block || 'Not available'} · SRM IST Tiruchirappalli (Trichy)
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Scrollable */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-6">
          {/* Phase 2: Live Countdown Timer */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Live Availability Countdown
              </span>
              <span className="text-[11px] font-mono text-slate-400">
                Updates every second
              </span>
            </div>
            <LiveCountdownTimer
              roomStatus={roomStatus}
              currentDay={currentDay}
              currentTimeMinutes={currentTimeMinutes}
              isSimulated={isSimulated}
            />
          </div>

          {/* Phase 2: Call the Squad – WhatsApp Share */}
          {status !== 'BUSY' && (
            <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-50/80 to-teal-50/80 border border-emerald-200/90 shadow-2xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h4 className="text-sm font-bold text-emerald-950 flex items-center gap-1.5">
                    <span>Call the Squad</span>
                    <span className="text-[10px] font-mono font-medium text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded border border-emerald-300">
                      WhatsApp Share
                    </span>
                  </h4>
                  <p className="text-xs text-emerald-900/80 mt-0.5">
                    Send a pre-filled invitation to your group with this room number and available-until time.
                  </p>
                </div>

                <div className="shrink-0">
                  <SquadShareButton
                    roomStatus={roomStatus}
                    currentDay={currentDay}
                    currentTimeMinutes={currentTimeMinutes}
                    isSimulated={isSimulated}
                    size="md"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Room Specs & Amenities (Strictly from dataset) */}
          <div>
            <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2.5">
              Room Specifications & Amenities
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center gap-2 text-xs">
                <Users className="w-4 h-4 text-slate-500 shrink-0" />
                <span>
                  Capacity: <strong className="text-slate-900">{room.capacity ? `${room.capacity} seats` : 'Not available'}</strong>
                </span>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center gap-2 text-xs">
                <Wind className={`w-4 h-4 shrink-0 ${room.amenities?.ac ? 'text-sky-600' : 'text-slate-400'}`} />
                <span className={room.amenities?.ac ? 'text-slate-900 font-medium' : 'text-slate-500'}>
                  {room.amenities ? (room.amenities.ac ? 'Air Conditioned' : 'Non-AC') : 'Not available'}
                </span>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center gap-2 text-xs">
                <Tv className={`w-4 h-4 shrink-0 ${room.amenities?.projector ? 'text-amber-600' : 'text-slate-400'}`} />
                <span className={room.amenities?.projector ? 'text-slate-900 font-medium' : 'text-slate-400'}>
                  {room.amenities ? (room.amenities.projector ? 'HD Projector' : 'No Projector') : 'Not available'}
                </span>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center gap-2 text-xs">
                <Zap className="w-4 h-4 text-amber-500 shrink-0" />
                <span className="text-slate-900 font-medium">
                  {room.amenities ? (room.amenities.powerSockets ? 'Desk Outlets' : 'Wall Sockets') : 'Not available'}
                </span>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center gap-2 text-xs">
                <Monitor className={`w-4 h-4 shrink-0 ${room.amenities?.labComputers ? 'text-emerald-600' : 'text-slate-400'}`} />
                <span className={room.amenities?.labComputers ? 'text-slate-900 font-medium' : 'text-slate-400'}>
                  {room.amenities ? (room.amenities.labComputers ? 'PC Workstations' : 'Standard Desks') : 'Not available'}
                </span>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center gap-2 text-xs">
                <Sparkles className="w-4 h-4 text-purple-600 shrink-0" />
                <span className="text-slate-900 font-medium">
                  Wi-Fi: {room.amenities?.wifiSignal || 'Not available'}
                </span>
              </div>
            </div>
          </div>

          {/* Schedule Breakdown */}
          <div>
            <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
              <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Full Day Timetable (Dataset)
              </h3>
              {/* Day Selector Tabs */}
              <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200">
                {DAYS_OF_WEEK.map((day) => (
                  <button
                    key={day}
                    onClick={() => setActiveDayTab(day)}
                    className={`px-2.5 py-1 text-xs rounded-lg transition-colors font-medium ${
                      activeDayTab === day
                        ? 'bg-white text-slate-900 shadow-2xs font-bold'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {day.slice(0, 3)}
                  </button>
                ))}
              </div>
            </div>

            <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-2xs">
              <div className="divide-y divide-slate-100">
                {PERIOD_SLOTS.map((slot) => {
                  if (slot.isLunch) {
                    return (
                      <div
                        key="lunch"
                        className="px-4 py-2.5 bg-amber-50/70 text-xs flex items-center justify-between text-amber-900 font-mono"
                      >
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded bg-amber-200/80 text-[10px] font-bold">LUNCH</span>
                          <span>Lunch Break (12:35 PM – 01:30 PM)</span>
                        </div>
                        <span className="text-amber-800 font-medium">Classrooms Open</span>
                      </div>
                    );
                  }

                  const scheduledClass = scheduleForActiveDay.find((s) => s.periodId === slot.id);
                  const isCurrent =
                    activeDayTab === currentDay &&
                    currentTimeMinutes >= slot.startMinutes &&
                    currentTimeMinutes <= slot.endMinutes;

                  return (
                    <div
                      key={slot.id}
                      className={`px-4 py-3 flex items-center justify-between gap-4 text-xs transition-colors ${
                        isCurrent
                          ? 'bg-amber-50/60 border-l-4 border-l-amber-500'
                          : scheduledClass
                          ? 'bg-white'
                          : 'bg-slate-50/40'
                      }`}
                    >
                      {/* Left: Slot & Time */}
                      <div className="w-28 shrink-0">
                        <span className="font-mono font-bold text-slate-900 block">
                          {slot.name}
                        </span>
                        <span className="text-[11px] font-mono text-amber-800 font-semibold block">
                          {slot.slotCode}
                        </span>
                        <span className="text-[11px] font-mono text-slate-500">
                          {slot.startTime}–{slot.endTime}
                        </span>
                      </div>

                      {/* Middle: Content */}
                      <div className="flex-1 min-w-0">
                        {scheduledClass ? (
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-mono font-bold text-rose-700">
                                {scheduledClass.courseCode}
                              </span>
                              <span className="text-slate-900 truncate font-semibold">
                                {scheduledClass.courseName}
                              </span>
                            </div>
                            <div className="text-[11px] text-slate-500 mt-0.5">
                              Faculty: {scheduledClass.faculty} · {scheduledClass.batch} ({scheduledClass.department})
                            </div>
                          </div>
                        ) : (
                          <div className="text-emerald-700 font-medium flex items-center gap-1.5">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                            <span>Free / Available for Study</span>
                          </div>
                        )}
                      </div>

                      {/* Right: Badge */}
                      <div className="shrink-0 text-right">
                        {scheduledClass ? (
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-rose-50 text-rose-700 border border-rose-200 font-medium">
                            Occupied
                          </span>
                        ) : (
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 font-medium">
                            Available
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 sm:p-5 border-t border-slate-200 bg-slate-50 flex items-center justify-between text-xs text-slate-500">
          <div className="flex items-center gap-2">
            {isClaimed ? (
              <button
                onClick={() => onReleaseClaim(room.id)}
                className="px-3.5 py-1.5 bg-white hover:bg-slate-100 text-sky-800 font-semibold rounded-xl border border-sky-300 transition-colors shadow-2xs"
              >
                Release Room Claim
              </button>
            ) : status !== 'BUSY' ? (
              <button
                onClick={() => onClaimRoom(room.id)}
                className="px-3.5 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-900 font-semibold rounded-xl border border-amber-300 transition-colors flex items-center gap-1.5 shadow-2xs"
              >
                <BookmarkCheck className="w-4 h-4 text-amber-700" />
                <span>Claim for Study Group</span>
              </button>
            ) : null}
          </div>

          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl transition-colors font-medium shadow-xs"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
