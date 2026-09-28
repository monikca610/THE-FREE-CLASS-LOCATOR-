import React, { useState } from 'react';
import { X, BookmarkCheck, Users, BookOpen, AlertTriangle } from 'lucide-react';
import { RoomLiveStatus } from '../types';
import { formatMinutesToTime } from '../utils/statusEngine';

interface ClaimModalProps {
  roomStatus: RoomLiveStatus | null;
  currentTimeMinutes: number;
  onClose: () => void;
  onConfirmClaim: (roomId: string, claimedBy: string, topic: string, durationMinutes: number) => void;
}

export const ClaimModal: React.FC<ClaimModalProps> = ({
  roomStatus,
  currentTimeMinutes,
  onClose,
  onConfirmClaim,
}) => {
  const [claimedBy, setClaimedBy] = useState('');
  const [topic, setTopic] = useState('');
  const [durationMinutes, setDurationMinutes] = useState(60);

  if (!roomStatus) return null;

  const { room, minutesUntilNextClass, nextClass, nextClassPeriod } = roomStatus;
  const maxSafeMinutes = minutesUntilNextClass !== null ? minutesUntilNextClass : 180;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!claimedBy.trim()) return;
    onConfirmClaim(
      room.id,
      claimedBy.trim(),
      topic.trim() || 'Study & Project Collaboration',
      Math.min(durationMinutes, maxSafeMinutes)
    );
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="bg-white border border-slate-200 rounded-3xl w-full max-w-md overflow-hidden shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-slate-200 bg-slate-50/70 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-100 border border-amber-200 text-amber-800">
              <BookmarkCheck className="w-5 h-5 text-amber-700" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 tracking-tight">
                Claim {room.name}
              </h3>
              <p className="text-xs text-slate-500 font-medium">
                Mark as occupied by your study group
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 p-1.5 rounded-lg hover:bg-slate-200/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-4 text-xs">
          {/* Kick-Out Advisory */}
          {minutesUntilNextClass !== null && (
            <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 flex items-start gap-2.5 text-amber-900">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold">Notice: Next Class at {nextClassPeriod?.startTime}</span>
                <p className="text-[11px] text-amber-800 mt-0.5">
                  This room is only safe for the next {minutesUntilNextClass} minutes before {nextClass?.courseCode} begins.
                </p>
              </div>
            </div>
          )}

          <div>
            <label className="block text-slate-700 font-bold mb-1">
              Group / Student Name <span className="text-amber-600">*</span>
            </label>
            <div className="relative">
              <Users className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                required
                value={claimedBy}
                onChange={(e) => setClaimedBy(e.target.value)}
                placeholder="e.g. ECE Capstone Team, Rahul & Ananya"
                className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-9 pr-3 py-2.5 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-amber-600 focus:bg-white focus:ring-1 focus:ring-amber-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-700 font-bold mb-1">
              Study Topic or Purpose
            </label>
            <div className="relative">
              <BookOpen className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="e.g. VLSI Lab Prep, Hackathon Pitch Practice"
                className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-9 pr-3 py-2.5 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-amber-600 focus:bg-white focus:ring-1 focus:ring-amber-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-700 font-bold mb-1">
              Duration of Occupancy
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[30, 45, 60, 90, 120].map((mins) => {
                const disabled = minutesUntilNextClass !== null && mins > minutesUntilNextClass;
                return (
                  <button
                    key={mins}
                    type="button"
                    disabled={disabled}
                    onClick={() => setDurationMinutes(mins)}
                    className={`py-2 px-2 rounded-xl border text-center font-mono transition-colors ${
                      durationMinutes === mins
                        ? 'bg-amber-100 text-amber-950 border-amber-400 font-bold shadow-2xs'
                        : disabled
                        ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed line-through'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    {mins} mins
                  </button>
                );
              })}
            </div>
            <p className="text-[11px] text-slate-500 mt-1.5 font-medium">
              Occupied until approx {formatMinutesToTime(currentTimeMinutes + durationMinutes)}
            </p>
          </div>

          {/* Actions */}
          <div className="pt-3.5 border-t border-slate-100 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition-colors font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl transition-colors font-semibold shadow-xs"
            >
              Confirm Claim
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
