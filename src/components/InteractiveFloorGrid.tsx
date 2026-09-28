import React, { useState, useMemo } from 'react';
import { Layers, Filter, Tv, Wind, Monitor, Search, Building, GraduationCap, BookOpen, RotateCcw } from 'lucide-react';
import { DayOfWeek, Department, RoomLiveStatus, Year } from '../types';
import { RoomCard } from './RoomCard';

interface InteractiveFloorGridProps {
  roomsStatus: RoomLiveStatus[];
  selectedDay: DayOfWeek;
  currentTimeMinutes?: number;
  isSimulated?: boolean;
  onOpenDetails: (roomId: string) => void;
  onClaimRoom: (roomId: string) => void;
  onReleaseClaim: (roomId: string) => void;
}

const FLOOR_OPTIONS = [
  { value: 'all', label: 'All Floors' },
  { value: '0', label: 'Ground Floor' },
  { value: '1', label: '1st Floor' },
  { value: '2', label: '2nd Floor' },
  { value: '3', label: '3rd Floor' },
  { value: '4', label: '4th Floor' },
];

export const InteractiveFloorGrid: React.FC<InteractiveFloorGridProps> = ({
  roomsStatus,
  selectedDay,
  currentTimeMinutes = 615,
  isSimulated = true,
  onOpenDetails,
  onClaimRoom,
  onReleaseClaim,
}) => {
  const [selectedFloor, setSelectedFloor] = useState<string>('all');
  const [onlyFree, setOnlyFree] = useState<boolean>(false);
  const [filterAC, setFilterAC] = useState<boolean>(false);
  const [filterProjector, setFilterProjector] = useState<boolean>(false);
  const [filterLabOnly, setFilterLabOnly] = useState<boolean>(false);
  const [filterDepartment, setFilterDepartment] = useState<string>('all');
  const [filterYear, setFilterYear] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const filteredRooms = useMemo(() => {
    return roomsStatus.filter((item) => {
      // Floor filter
      if (selectedFloor !== 'all' && item.room.floor.toString() !== selectedFloor) {
        return false;
      }

      // Free filter
      if (onlyFree && item.status !== 'FREE' && item.status !== 'FREE_SOON') {
        return false;
      }

      // Amenities filter
      if (filterAC && !item.room.amenities.ac) return false;
      if (filterProjector && !item.room.amenities.projector) return false;
      if (filterLabOnly && !item.room.type.includes('Lab')) return false;

      // Department filter
      if (filterDepartment !== 'all') {
        const hasDeptClass = item.room.schedule.some(
          (s) => s.day === selectedDay && s.department === filterDepartment
        );
        // Include if currently hosting this dept or room is tailored for this dept
        if (!hasDeptClass && item.status === 'BUSY') return false;
      }

      // Year filter
      if (filterYear !== 'all') {
        const hasYearClass = item.room.schedule.some(
          (s) => s.day === selectedDay && s.year === filterYear
        );
        if (!hasYearClass && item.status === 'BUSY') return false;
      }

      // Text query (Search Room, Subject Code, Subject Name, Faculty, Batch)
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = item.room.name.toLowerCase().includes(q);
        const matchesType = item.room.type.toLowerCase().includes(q);
        const matchesFloor = item.room.floorName.toLowerCase().includes(q);

        const matchesCurrentClass =
          item.currentClass &&
          (item.currentClass.courseName.toLowerCase().includes(q) ||
            item.currentClass.courseCode.toLowerCase().includes(q) ||
            item.currentClass.faculty.toLowerCase().includes(q) ||
            item.currentClass.batch.toLowerCase().includes(q) ||
            item.currentClass.department.toLowerCase().includes(q));

        const matchesNextClass =
          item.nextClass &&
          (item.nextClass.courseName.toLowerCase().includes(q) ||
            item.nextClass.courseCode.toLowerCase().includes(q) ||
            item.nextClass.faculty.toLowerCase().includes(q));

        const matchesAnyTodaySchedule = item.room.schedule.some(
          (s) =>
            s.day === selectedDay &&
            (s.courseName.toLowerCase().includes(q) ||
              s.courseCode.toLowerCase().includes(q) ||
              s.faculty.toLowerCase().includes(q) ||
              s.department.toLowerCase().includes(q))
        );

        if (!matchesName && !matchesType && !matchesFloor && !matchesCurrentClass && !matchesNextClass && !matchesAnyTodaySchedule) {
          return false;
        }
      }

      return true;
    });
  }, [
    roomsStatus,
    selectedFloor,
    onlyFree,
    filterAC,
    filterProjector,
    filterLabOnly,
    filterDepartment,
    filterYear,
    searchQuery,
    selectedDay,
  ]);

  const groupedByFloor = useMemo(() => {
    const map = new Map<number, RoomLiveStatus[]>();
    for (const item of filteredRooms) {
      const fl = item.room.floor;
      if (!map.has(fl)) {
        map.set(fl, []);
      }
      map.get(fl)!.push(item);
    }
    return Array.from(map.entries()).sort((a, b) => a[0] - b[0]);
  }, [filteredRooms]);

  const handleResetFilters = () => {
    setSelectedFloor('all');
    setOnlyFree(false);
    setFilterAC(false);
    setFilterProjector(false);
    setFilterLabOnly(false);
    setFilterDepartment('all');
    setFilterYear('all');
    setSearchQuery('');
  };

  const isAnyFilterActive =
    selectedFloor !== 'all' ||
    onlyFree ||
    filterAC ||
    filterProjector ||
    filterLabOnly ||
    filterDepartment !== 'all' ||
    filterYear !== 'all' ||
    searchQuery.trim() !== '';

  return (
    <div className="space-y-6">
      {/* Floor Filter Bar & Quick Controls */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-4 sm:p-5 shadow-xs space-y-4">
        {/* Floor Tabs */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500">
              <Layers className="w-3.5 h-3.5 text-amber-600" />
              <span>Select Floor:</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono text-slate-500">
                Showing {filteredRooms.length} of {roomsStatus.length} rooms
              </span>
              {isAnyFilterActive && (
                <button
                  onClick={handleResetFilters}
                  className="text-[11px] text-amber-700 hover:text-amber-900 font-semibold flex items-center gap-1 hover:underline"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Reset</span>
                </button>
              )}
            </div>
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-thin">
            {FLOOR_OPTIONS.map((opt) => {
              const isSelected = selectedFloor === opt.value;
              const count =
                opt.value === 'all'
                  ? roomsStatus.length
                  : roomsStatus.filter((r) => r.room.floor.toString() === opt.value).length;

              return (
                <button
                  key={opt.value}
                  onClick={() => setSelectedFloor(opt.value)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-xl transition-all whitespace-nowrap flex items-center gap-1.5 ${
                    isSelected
                      ? 'bg-slate-900 text-white font-bold shadow-xs'
                      : 'bg-slate-50 text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-slate-200/80'
                  }`}
                >
                  <span>{opt.label}</span>
                  <span className={`text-[10px] px-1.5 py-0.2 rounded font-mono ${isSelected ? 'bg-white/20 text-white' : 'bg-slate-200/70 text-slate-600'}`}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Feature Switches, Department Dropdown & Accurate Subject/Faculty Search */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pt-3.5 border-t border-slate-100">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs text-slate-400 font-semibold flex items-center gap-1">
              <Filter className="w-3 h-3 text-slate-400" />
              <span>Filters:</span>
            </span>

            {/* Only Free Toggle */}
            <button
              onClick={() => setOnlyFree(!onlyFree)}
              className={`px-3 py-1.5 text-xs font-medium rounded-xl border transition-colors flex items-center gap-1.5 shadow-2xs ${
                onlyFree
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-300 font-bold'
                  : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <div className={`w-2 h-2 rounded-full ${onlyFree ? 'bg-emerald-600' : 'bg-slate-400'}`} />
              <span>Only Free Rooms</span>
            </button>

            {/* Department Filter Dropdown */}
            <div className="flex items-center gap-1 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1">
              <BookOpen className="w-3 h-3 text-slate-400" />
              <select
                value={filterDepartment}
                onChange={(e) => setFilterDepartment(e.target.value)}
                className="bg-transparent text-xs text-slate-700 font-medium focus:outline-none cursor-pointer"
              >
                <option value="all">All Depts</option>
                <option value="CSE">CSE</option>
                <option value="AI & DS">AI & DS</option>
                <option value="AIML">AIML</option>
                <option value="ECE">ECE</option>
                <option value="EEE">EEE</option>
                <option value="Mechanical">Mechanical</option>
                <option value="Cyber Security">Cyber Security</option>
              </select>
            </div>

            {/* Year Filter Dropdown */}
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

            {/* AC Filter */}
            <button
              onClick={() => setFilterAC(!filterAC)}
              className={`px-3 py-1.5 text-xs font-medium rounded-xl border transition-colors flex items-center gap-1.5 shadow-2xs ${
                filterAC
                  ? 'bg-sky-50 text-sky-800 border-sky-300 font-bold'
                  : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <Wind className="w-3 h-3" />
              <span>AC</span>
            </button>

            {/* Projector Filter */}
            <button
              onClick={() => setFilterProjector(!filterProjector)}
              className={`px-3 py-1.5 text-xs font-medium rounded-xl border transition-colors flex items-center gap-1.5 shadow-2xs ${
                filterProjector
                  ? 'bg-amber-50 text-amber-900 border-amber-300 font-bold'
                  : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <Tv className="w-3 h-3" />
              <span>Projector</span>
            </button>

            {/* Labs Only */}
            <button
              onClick={() => setFilterLabOnly(!filterLabOnly)}
              className={`px-3 py-1.5 text-xs font-medium rounded-xl border transition-colors flex items-center gap-1.5 shadow-2xs ${
                filterLabOnly
                  ? 'bg-purple-50 text-purple-800 border-purple-300 font-bold'
                  : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <Monitor className="w-3 h-3" />
              <span>Labs Only</span>
            </button>
          </div>

          {/* Quick Accurate Search Bar */}
          <div className="relative w-full lg:w-72">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search code (e.g. 21ECC), subject, room, faculty..."
              className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-amber-600 focus:bg-white"
            />
          </div>
        </div>
      </div>

      {/* Grouped Floor Sections */}
      {groupedByFloor.length > 0 ? (
        <div className="space-y-8">
          {groupedByFloor.map(([floorNum, rooms]) => {
            const floorName = rooms[0]?.room.floorName || `Floor ${floorNum}`;
            const freeInFloor = rooms.filter((r) => r.status === 'FREE' || r.status === 'FREE_SOON').length;

            return (
              <section key={floorNum} className="space-y-3">
                {/* Section Header */}
                <div className="flex items-center justify-between border-b border-slate-200 pb-2.5">
                  <div className="flex items-center gap-2">
                    <Building className="w-4 h-4 text-amber-700" />
                    <h3 className="text-sm font-bold text-slate-900 tracking-tight">
                      {floorName}
                    </h3>
                    <span className="text-xs text-slate-400">
                      ({rooms.length} venues mapped)
                    </span>
                  </div>

                  <div className="flex items-center gap-2 text-xs">
                    <span className="text-slate-500 font-medium">Available:</span>
                    <span className="font-mono font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                      {freeInFloor} / {rooms.length}
                    </span>
                  </div>
                </div>

                {/* Grid of rooms */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {rooms.map((roomStatus) => (
                    <RoomCard
                      key={roomStatus.room.id}
                      roomStatus={roomStatus}
                      selectedDay={selectedDay}
                      currentTimeMinutes={currentTimeMinutes}
                      isSimulated={isSimulated}
                      onOpenDetails={() => onOpenDetails(roomStatus.room.id)}
                      onClaimRoom={() => onClaimRoom(roomStatus.room.id)}
                      onReleaseClaim={() => onReleaseClaim(roomStatus.room.id)}
                    />
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      ) : (
        /* Empty State */
        <div className="text-center py-16 px-4 rounded-2xl border border-slate-200 bg-white shadow-xs">
          <Building className="w-10 h-10 text-slate-400 mx-auto mb-3" />
          <h4 className="text-sm font-bold text-slate-800">No rooms match your active filters</h4>
          <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 mb-4">
            Try resetting your floor selection or clearing the search query / department filter.
          </p>
          <button
            onClick={handleResetFilters}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-xl transition-colors shadow-xs"
          >
            Reset All Filters
          </button>
        </div>
      )}
    </div>
  );
};
