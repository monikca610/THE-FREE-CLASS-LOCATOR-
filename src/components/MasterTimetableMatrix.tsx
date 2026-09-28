import React, { useState } from 'react';
import { Table, CheckCircle2, GraduationCap, BookOpen, Download, Copy, Check } from 'lucide-react';
import { DayOfWeek, Department, RoomLiveStatus, Year } from '../types';
import { PERIOD_SLOTS, DAYS_OF_WEEK, DAY_ORDER_MAP } from '../data/timetableData';

interface MasterTimetableMatrixProps {
  roomsStatus: RoomLiveStatus[];
  currentDay: DayOfWeek;
  onSelectRoom: (roomId: string) => void;
}

export const MasterTimetableMatrix: React.FC<MasterTimetableMatrixProps> = ({
  roomsStatus,
  currentDay,
  onSelectRoom,
}) => {
  const [selectedDay, setSelectedDay] = useState<DayOfWeek>(currentDay);
  const [filterDept, setFilterDept] = useState<string>('all');
  const [filterYear, setFilterYear] = useState<string>('all');
  const [copied, setCopied] = useState<boolean>(false);

  // Filtered rooms in the matrix
  const filteredRooms = roomsStatus.filter(({ room }) => {
    if (filterDept !== 'all') {
      const hasDeptClass = room.schedule.some((s) => s.day === selectedDay && s.department === filterDept);
      if (!hasDeptClass) return false;
    }
    if (filterYear !== 'all') {
      const hasYearClass = room.schedule.some((s) => s.day === selectedDay && s.year === filterYear);
      if (!hasYearClass) return false;
    }
    return true;
  });

  const handleCopySummary = () => {
    let summaryText = `SRM IST Tiruchirappalli - Free Classroom Summary for ${selectedDay} (Day Order ${DAY_ORDER_MAP[selectedDay]})\n`;
    summaryText += `=========================================================================\n`;

    for (const slot of PERIOD_SLOTS) {
      if (slot.isLunch) continue;
      const freeInSlot: string[] = [];
      for (const { room } of roomsStatus) {
        const hasClass = room.schedule.some((s) => s.day === selectedDay && s.periodId === slot.id);
        if (!hasClass) {
          freeInSlot.push(`${room.name} (${room.floorName})`);
        }
      }
      summaryText += `${slot.name} (${slot.slotCode} · ${slot.startTime}-${slot.endTime}):\n`;
      summaryText += `  Free Rooms: ${freeInSlot.join(', ')}\n\n`;
    }

    navigator.clipboard.writeText(summaryText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="bg-white border border-slate-200/90 rounded-2xl p-4 sm:p-6 shadow-xs space-y-4">
      {/* Header & Day/Dept/Year Filter */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-100 pb-4">
        <div>
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Table className="w-5 h-5 text-amber-700" />
            <span>Master Timetable Matrix (SRM Tiruchirappalli)</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Academic schedule across CSE, AI&DS, AIML, ECE, EEE, Mechanical & Cyber Security departments
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Day Selector with SRM Day Order */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200">
            {DAYS_OF_WEEK.map((day) => (
              <button
                key={day}
                onClick={() => setSelectedDay(day)}
                className={`px-3 py-1 text-xs rounded-lg transition-colors font-medium flex items-center gap-1 ${
                  selectedDay === day
                    ? 'bg-slate-900 text-white font-bold shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <span>{day.slice(0, 3)}</span>
                <span className="text-[10px] opacity-75 font-mono">D{DAY_ORDER_MAP[day]}</span>
              </button>
            ))}
          </div>

          {/* Department Filter */}
          <div className="flex items-center gap-1 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1">
            <BookOpen className="w-3 h-3 text-slate-400" />
            <select
              value={filterDept}
              onChange={(e) => setFilterDept(e.target.value)}
              className="bg-transparent text-xs text-slate-700 font-medium focus:outline-none cursor-pointer"
            >
              <option value="all">All Departments</option>
              <option value="CSE">CSE</option>
              <option value="AI & DS">AI & DS</option>
              <option value="AIML">AIML</option>
              <option value="ECE">ECE</option>
              <option value="EEE">EEE</option>
              <option value="Mechanical">Mechanical</option>
              <option value="Cyber Security">Cyber Security</option>
            </select>
          </div>

          {/* Year Filter */}
          <div className="flex items-center gap-1 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1">
            <GraduationCap className="w-3 h-3 text-slate-400" />
            <select
              value={filterYear}
              onChange={(e) => setFilterYear(e.target.value)}
              className="bg-transparent text-xs text-slate-700 font-medium focus:outline-none cursor-pointer"
            >
              <option value="all">All Years</option>
              <option value="Year 1">Year 1</option>
              <option value="Year 2">Year 2</option>
              <option value="Year 3">Year 3</option>
              <option value="Year 4">Year 4</option>
            </select>
          </div>

          {/* Copy Summary Action */}
          <button
            onClick={handleCopySummary}
            className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl border border-slate-200/90 transition-colors flex items-center gap-1.5 shadow-2xs"
            title="Copy list of free rooms for every slot today"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-slate-500" />}
            <span>{copied ? 'Summary Copied!' : 'Copy Free Slots'}</span>
          </button>
        </div>
      </div>

      {/* Timetable Matrix Grid */}
      <div className="overflow-x-auto rounded-2xl border border-slate-200 scrollbar-thin shadow-2xs">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 text-slate-700 font-mono">
              <th className="p-3 sticky left-0 bg-slate-50 z-10 min-w-[140px] border-r border-slate-200 font-bold">
                Venue / Floor
              </th>
              {PERIOD_SLOTS.map((slot) => (
                <th
                  key={slot.id}
                  className={`p-2.5 text-center min-w-[130px] border-r border-slate-200 ${
                    slot.isLunch ? 'bg-amber-50 text-amber-900 font-bold' : ''
                  }`}
                >
                  <div className="font-bold text-slate-900">{slot.label}</div>
                  <div className="text-[10px] text-amber-800 font-semibold">{slot.slotCode}</div>
                  <div className="text-[10px] text-slate-500 font-normal">
                    {slot.startTime}–{slot.endTime}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredRooms.map(({ room }) => {
              const dayClasses = room.schedule.filter((s) => s.day === selectedDay);

              return (
                <tr key={room.id} className="hover:bg-slate-50/70 transition-colors">
                  {/* Left Fixed Column: Room Info */}
                  <td className="p-3 sticky left-0 bg-white z-10 border-r border-slate-200 font-medium">
                    <button
                      onClick={() => onSelectRoom(room.id)}
                      className="text-left group hover:text-amber-800 transition-colors"
                    >
                      <div className="font-bold text-slate-900 group-hover:text-amber-800">
                        {room.name}
                      </div>
                      <div className="text-[11px] text-slate-500 font-normal">
                        {room.floorName} · {room.type}
                      </div>
                    </button>
                  </td>

                  {/* Period Columns */}
                  {PERIOD_SLOTS.map((slot) => {
                    if (slot.isLunch) {
                      return (
                        <td
                          key="lunch"
                          className="p-2 text-center bg-amber-50/40 border-r border-slate-200 text-amber-800 font-mono text-[11px] font-medium"
                        >
                          Lunch
                        </td>
                      );
                    }

                    const scheduled = dayClasses.find((s) => s.periodId === slot.id);
                    const isDeptMatch =
                      filterDept === 'all' || (scheduled && scheduled.department === filterDept);
                    const isYearMatch =
                      filterYear === 'all' || (scheduled && scheduled.year === filterYear);

                    return (
                      <td
                        key={slot.id}
                        className={`p-2 border-r border-slate-100 align-top transition-colors ${
                          scheduled
                            ? isDeptMatch && isYearMatch
                              ? 'bg-rose-50/40'
                              : 'bg-slate-50/50 opacity-40'
                            : 'bg-emerald-50/30'
                        }`}
                      >
                        {scheduled ? (
                          <div className="space-y-0.5">
                            <span className="font-mono font-bold text-rose-800 block text-[11px] truncate">
                              {scheduled.courseCode}
                            </span>
                            <div className="text-slate-900 font-semibold truncate text-[11px]" title={scheduled.courseName}>
                              {scheduled.courseName}
                            </div>
                            <div className="text-[10px] text-slate-500 truncate">
                              {scheduled.faculty} ({scheduled.department} · {scheduled.year})
                            </div>
                          </div>
                        ) : (
                          <div className="h-full flex items-center justify-center py-2 text-emerald-700 font-mono text-[10px] font-bold">
                            <CheckCircle2 className="w-3.5 h-3.5 mr-1 text-emerald-600" />
                            <span>FREE</span>
                          </div>
                        )}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
