import React, { useState } from 'react';
import { Search, Sparkles, X, ArrowRight, Check } from 'lucide-react';
import { ParsedNLPQuery, DayOfWeek } from '../types';
import { parseNaturalLanguageQuery, rankRoomsByNLP, ScoredRoomResult } from '../utils/nlpParser';
import { ROOMS_DATA } from '../data/timetableData';
import { RoomCard } from './RoomCard';

interface SmartSearchBarProps {
  currentTimeMinutes: number;
  currentDay: DayOfWeek;
  claimedRooms: Record<string, any>;
  onOpenDetails: (roomId: string) => void;
  onClaimRoom: (roomId: string) => void;
  onReleaseClaim: (roomId: string) => void;
}

const PRESET_QUERIES = [
  'I need a room on the 2nd floor for the next 2 hours',
  'Find me a free room right now near TRP 101',
  'Where can my group sit quietly after 1:30 PM on Wednesday?',
  'Free lab with computers and AC right now',
  'Quiet room on 3rd floor with projector',
  'Find an available computing lab on ground floor',
];

export const SmartSearchBar: React.FC<SmartSearchBarProps> = ({
  currentTimeMinutes,
  currentDay,
  claimedRooms,
  onOpenDetails,
  onClaimRoom,
  onReleaseClaim,
}) => {
  const [query, setQuery] = useState('');
  const [parsedResult, setParsedResult] = useState<ParsedNLPQuery | null>(null);
  const [rankedResults, setRankedResults] = useState<ScoredRoomResult[] | null>(null);

  const handleSearch = (textToSearch: string) => {
    const q = textToSearch.trim();
    if (!q) {
      setParsedResult(null);
      setRankedResults(null);
      return;
    }

    const parsed = parseNaturalLanguageQuery(q, currentTimeMinutes, currentDay);
    const ranked = rankRoomsByNLP(parsed, ROOMS_DATA, claimedRooms);

    setParsedResult(parsed);
    setRankedResults(ranked);
  };

  const handlePresetClick = (preset: string) => {
    setQuery(preset);
    handleSearch(preset);
  };

  const handleClear = () => {
    setQuery('');
    setParsedResult(null);
    setRankedResults(null);
  };

  return (
    <div className="space-y-6">
      {/* Search Input Box */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-5 sm:p-6 shadow-xs">
        <div className="flex items-center gap-2 mb-2 text-xs font-bold text-amber-800 uppercase tracking-wider">
          <Sparkles className="w-4 h-4 text-amber-600" />
          <span>Natural Language AI Room Finder</span>
        </div>
        <p className="text-xs text-slate-500 mb-4">
          Type queries like you would ask a friend. Specify desired floor, duration, time, equipment, or reference rooms.
        </p>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSearch(query);
          }}
          className="relative flex items-center"
        >
          <div className="absolute left-3.5 text-slate-400 pointer-events-none">
            <Search className="w-5 h-5 text-amber-700" />
          </div>

          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="e.g., I need a room on the 5th floor for the next 2 hours..."
            className="w-full bg-slate-50/70 border border-slate-300 rounded-xl pl-11 pr-24 py-3.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-amber-600 focus:bg-white focus:ring-2 focus:ring-amber-500/20 transition-all font-sans shadow-inner"
          />

          <div className="absolute right-2 flex items-center gap-1.5">
            {query && (
              <button
                type="button"
                onClick={handleClear}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-md transition-colors"
                aria-label="Clear query"
              >
                <X className="w-4 h-4" />
              </button>
            )}
            <button
              type="submit"
              className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 shadow-xs"
            >
              <span>Search</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </form>

        {/* Preset Query Chips */}
        <div className="mt-4 pt-3.5 border-t border-slate-100">
          <div className="text-[11px] text-slate-500 font-semibold mb-2">Try quick natural prompts:</div>
          <div className="flex flex-wrap gap-2">
            {PRESET_QUERIES.map((preset, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handlePresetClick(preset)}
                className="text-xs px-3 py-1.5 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 hover:border-amber-300 transition-all text-left font-medium shadow-2xs"
              >
                "{preset}"
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Query Interpretation Breakdown Banner */}
      {parsedResult && (
        <div className="bg-white border border-slate-200/90 rounded-2xl p-4 sm:p-5 shadow-xs">
          <div className="flex items-center justify-between gap-2 mb-2">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-900">Interpreted Parameters:</span>
              <span className="text-[11px] text-slate-500 font-mono">
                Rule-Based NLP Engine
              </span>
            </div>
            {rankedResults && (
              <span className="text-xs font-mono font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                {rankedResults.length} venues evaluated
              </span>
            )}
          </div>

          <div className="flex flex-wrap gap-2 pt-1">
            {parsedResult.explanation.length > 0 ? (
              parsedResult.explanation.map((item, i) => (
                <span
                  key={i}
                  className="px-2.5 py-1 bg-amber-50 border border-amber-200 text-amber-900 text-xs rounded-lg font-mono font-medium flex items-center gap-1.5 shadow-2xs"
                >
                  <Check className="w-3 h-3 text-amber-700" />
                  <span>{item}</span>
                </span>
              ))
            ) : (
              <span className="text-xs text-slate-500 italic">
                Scanning all floors and rooms for current timetable state.
              </span>
            )}
          </div>
        </div>
      )}

      {/* Search Ranked Results Grid */}
      {rankedResults && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <span>Top Recommended Rooms</span>
              <span className="text-xs font-mono text-slate-500 font-normal">
                (Ranked by availability, floor proximity & amenities)
              </span>
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {rankedResults.map(({ roomStatus, score, matchReasons }) => (
              <div key={roomStatus.room.id} className="relative flex flex-col">
                {/* Match Reason Header Tag */}
                {matchReasons.length > 0 && (
                  <div className="mb-1 text-[11px] font-mono text-amber-800 font-medium truncate flex items-center gap-1 px-1">
                    <Sparkles className="w-3 h-3 text-amber-600 shrink-0" />
                    <span>{matchReasons.slice(0, 2).join(' · ')}</span>
                  </div>
                )}
                <RoomCard
                  roomStatus={roomStatus}
                  selectedDay={parsedResult?.day || currentDay}
                  onOpenDetails={() => onOpenDetails(roomStatus.room.id)}
                  onClaimRoom={() => onClaimRoom(roomStatus.room.id)}
                  onReleaseClaim={() => onReleaseClaim(roomStatus.room.id)}
                />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
