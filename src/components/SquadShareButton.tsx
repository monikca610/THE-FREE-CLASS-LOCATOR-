import React, { useState } from 'react';
import { MessageCircle, Check, Copy } from 'lucide-react';
import { RoomLiveStatus, DayOfWeek } from '../types';
import { formatMinutesToTime } from '../utils/statusEngine';

interface SquadShareButtonProps {
  roomStatus: RoomLiveStatus;
  currentDay: DayOfWeek;
  currentTimeMinutes: number;
  isSimulated: boolean;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const SquadShareButton: React.FC<SquadShareButtonProps> = ({
  roomStatus,
  currentDay: _currentDay,
  currentTimeMinutes: _currentTimeMinutes,
  isSimulated: _isSimulated,
  className = '',
  size = 'md',
}) => {
  const { room, status, nextClass, nextClassPeriod } = roomStatus;
  const [copiedNotification, setCopiedNotification] = useState<boolean>(false);

  // Requirement: Only active when room is currently free
  const isFree = status === 'FREE' || status === 'FREE_SOON' || status === 'BUSY_SOON';
  if (!isFree) {
    return null;
  }

  // Generate dynamic, authentic WhatsApp message strictly adhering to actual dataset schedule:
  // Example from requirement: "📍 Heading to IST 509! It's free until 2:30 PM. Come fast!"
  let message = '';
  let availableUntilText = '';

  if (nextClassPeriod && nextClass) {
    const formattedNextTime = formatMinutesToTime(nextClassPeriod.startMinutes);
    availableUntilText = formattedNextTime;
    message = `📍 Heading to ${room.name}! It's free until ${formattedNextTime}. Come fast!`;
  } else {
    // If no upcoming classes in schedule for today, state accurately without inventing
    availableUntilText = 'End of Day';
    message = `📍 Heading to ${room.name}! It's free with no upcoming classes scheduled today. Come fast!`;
  }

  const encodedUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;

  const handleCopy = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(message);
      }
      setCopiedNotification(true);
      setTimeout(() => setCopiedNotification(false), 2500);
    } catch {
      // Fallback
      setCopiedNotification(true);
      setTimeout(() => setCopiedNotification(false), 2500);
    }
  };

  const sizeClasses = {
    sm: 'px-2.5 py-1 text-xs gap-1.5',
    md: 'px-3.5 py-2 text-xs font-semibold gap-2',
    lg: 'px-5 py-3 text-sm font-bold gap-2.5',
  }[size];

  return (
    <div className={`flex items-center gap-1.5 ${className}`}>
      {/* Official WhatsApp Share link - safe native anchor, avoiding window.open */}
      <a
        href={encodedUrl}
        target="_blank"
        rel="noopener noreferrer"
        onClick={(e) => e.stopPropagation()}
        title={`Share on WhatsApp: "${message}"`}
        className={`inline-flex items-center justify-center rounded-xl bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white transition-all shadow-xs hover:shadow-md cursor-pointer ${sizeClasses}`}
      >
        <MessageCircle className="w-4 h-4 fill-white/20 text-white shrink-0" />
        <span>Call the Squad</span>
      </a>

      {/* Quick Copy Message action */}
      <button
        type="button"
        onClick={handleCopy}
        title="Copy invitation message to clipboard"
        className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors border border-slate-200/80 shrink-0"
      >
        {copiedNotification ? (
          <Check className="w-3.5 h-3.5 text-emerald-600" />
        ) : (
          <Copy className="w-3.5 h-3.5 text-slate-500" />
        )}
      </button>

      {copiedNotification && (
        <span className="text-[11px] font-mono text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
          Copied!
        </span>
      )}
    </div>
  );
};
