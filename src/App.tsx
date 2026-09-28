/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { DayOfWeek, ClaimState } from './types';
import { ROOMS_DATA } from './data/timetableData';
import { getAllRoomsStatus } from './utils/statusEngine';
import { Header, NavTabType } from './components/Header';
import { ProblemBanner } from './components/ProblemBanner';
import { TimeController } from './components/TimeController';
import { Interactive3DBuildingMap } from './components/Interactive3DBuildingMap';
import { InteractiveFloorGrid } from './components/InteractiveFloorGrid';
import { SmartSearchBar } from './components/SmartSearchBar';
import { MasterTimetableMatrix } from './components/MasterTimetableMatrix';
import { RoomDetailModal } from './components/RoomDetailModal';
import { ClaimModal } from './components/ClaimModal';

const STORAGE_KEY = 'vibecraft_claimed_rooms_v1';

export default function App() {
  // Initialize to Monday 10:15 AM (Period 2) for immediate rich demonstration
  const [currentDay, setCurrentDay] = useState<DayOfWeek>('Monday');
  const [currentTimeMinutes, setTimeMinutes] = useState<number>(615); // 10:15 AM
  const [isSimulated, setIsSimulated] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<NavTabType>('3d-map');

  // Claimed rooms local state with persistence
  const [claimedRooms, setClaimedRooms] = useState<Record<string, ClaimState>>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (e) {
      console.error('Failed to load claims', e);
    }
    // Seed with one example claim for peer coordination demonstration
    return {
      'IST 416': {
        claimedBy: 'ECE Capstone Team Alpha',
        studyTopic: 'Antenna Simulation & Report Prep',
        claimedAt: Date.now(),
        validUntilMinutes: 700, // Period 3 end
        periodId: 2,
      },
    };
  });

  // Modals state
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);
  const [claimingRoomId, setClaimingRoomId] = useState<string | null>(null);

  // Sync claimed rooms to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(claimedRooms));
    } catch (e) {
      console.error('Failed to persist claims', e);
    }
  }, [claimedRooms]);

  // Real-time interval when not in simulator mode
  useEffect(() => {
    if (isSimulated) return;

    const updateFromRealClock = () => {
      const now = new Date();
      const mins = now.getHours() * 60 + now.getMinutes();
      setTimeMinutes(mins);

      const dayIdx = now.getDay();
      const dayMap: Record<number, DayOfWeek> = {
        1: 'Monday',
        2: 'Tuesday',
        3: 'Wednesday',
        4: 'Thursday',
        5: 'Friday',
      };
      if (dayMap[dayIdx]) {
        setCurrentDay(dayMap[dayIdx]);
      }
    };

    updateFromRealClock();
    const interval = setInterval(updateFromRealClock, 30000);
    return () => clearInterval(interval);
  }, [isSimulated]);

  // Compute live status across all rooms
  const allRoomsStatus = useMemo(() => {
    return getAllRoomsStatus(ROOMS_DATA, currentDay, currentTimeMinutes, claimedRooms);
  }, [currentDay, currentTimeMinutes, claimedRooms]);

  // Counts
  const freeCount = allRoomsStatus.filter(
    (r) => r.status === 'FREE' || r.status === 'FREE_SOON'
  ).length;

  const criticalKickoutCount = allRoomsStatus.filter(
    (r) => r.status === 'BUSY_SOON'
  ).length;

  // Find modal room status
  const selectedRoomStatus = useMemo(() => {
    if (!selectedRoomId) return null;
    return allRoomsStatus.find((r) => r.room.id === selectedRoomId) || null;
  }, [selectedRoomId, allRoomsStatus]);

  const claimingRoomStatus = useMemo(() => {
    if (!claimingRoomId) return null;
    return allRoomsStatus.find((r) => r.room.id === claimingRoomId) || null;
  }, [claimingRoomId, allRoomsStatus]);

  // Handle Claims
  const handleConfirmClaim = (
    roomId: string,
    claimedBy: string,
    topic: string,
    durationMinutes: number
  ) => {
    setClaimedRooms((prev) => ({
      ...prev,
      [roomId]: {
        claimedBy,
        studyTopic: topic,
        claimedAt: Date.now(),
        validUntilMinutes: currentTimeMinutes + durationMinutes,
        periodId: 1,
      },
    }));
    setClaimingRoomId(null);
  };

  const handleReleaseClaim = (roomId: string) => {
    setClaimedRooms((prev) => {
      const next = { ...prev };
      delete next[roomId];
      return next;
    });
  };

  const handleResetToLive = () => {
    const now = new Date();
    const mins = now.getHours() * 60 + now.getMinutes();
    const dayIdx = now.getDay();
    const dayMap: Record<number, DayOfWeek> = {
      1: 'Monday',
      2: 'Tuesday',
      3: 'Wednesday',
      4: 'Thursday',
      5: 'Friday',
    };
    setCurrentDay(dayMap[dayIdx] || 'Monday');
    setTimeMinutes(mins >= 540 && mins <= 1025 ? mins : 615);
    setIsSimulated(false);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans selection:bg-amber-500/20 selection:text-amber-950">
      {/* Top Header */}
      <Header
        currentDay={currentDay}
        currentTimeMinutes={currentTimeMinutes}
        isSimulated={isSimulated}
        onResetToLive={handleResetToLive}
        freeCount={freeCount}
        totalRooms={ROOMS_DATA.length}
        criticalKickoutCount={criticalKickoutCount}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-5 space-y-6">
        {/* Scenario Overview Banner */}
        <ProblemBanner />

        {/* Global Day & Period Simulator Controls */}
        <TimeController
          currentDay={currentDay}
          setDay={setCurrentDay}
          currentTimeMinutes={currentTimeMinutes}
          setTimeMinutes={setTimeMinutes}
          isSimulated={isSimulated}
          setIsSimulated={setIsSimulated}
          onResetToLive={handleResetToLive}
        />

        {/* Active Tab View */}
        {activeTab === '3d-map' && (
          <Interactive3DBuildingMap
            roomsStatus={allRoomsStatus}
            currentDay={currentDay}
            currentTimeMinutes={currentTimeMinutes}
            isSimulated={isSimulated}
            selectedRoomId={selectedRoomId}
            onSelectRoom={(roomId) => setSelectedRoomId(roomId)}
            onOpenDetails={(roomId) => setSelectedRoomId(roomId)}
            onClaimRoom={(roomId) => setClaimingRoomId(roomId)}
            onReleaseClaim={handleReleaseClaim}
          />
        )}

        {activeTab === 'floor-grid' && (
          <InteractiveFloorGrid
            roomsStatus={allRoomsStatus}
            selectedDay={currentDay}
            currentTimeMinutes={currentTimeMinutes}
            isSimulated={isSimulated}
            onOpenDetails={(roomId) => setSelectedRoomId(roomId)}
            onClaimRoom={(roomId) => setClaimingRoomId(roomId)}
            onReleaseClaim={handleReleaseClaim}
          />
        )}

        {activeTab === 'smart-search' && (
          <SmartSearchBar
            currentTimeMinutes={currentTimeMinutes}
            currentDay={currentDay}
            claimedRooms={claimedRooms}
            onOpenDetails={(roomId) => setSelectedRoomId(roomId)}
            onClaimRoom={(roomId) => setClaimingRoomId(roomId)}
            onReleaseClaim={handleReleaseClaim}
          />
        )}

        {activeTab === 'master-timetable' && (
          <MasterTimetableMatrix
            roomsStatus={allRoomsStatus}
            currentDay={currentDay}
            onSelectRoom={(roomId) => setSelectedRoomId(roomId)}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white mt-12 py-6 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-800">Vibecraft</span>
            <span>·</span>
            <span>Free Classroom Locator & Floor Manager</span>
            <span>·</span>
            <span className="text-slate-600 font-mono font-medium">SRM IST Timetable Engine</span>
          </div>
          <div className="flex items-center gap-4 text-slate-500">
            <span>Academic Periods (09:00 AM – 05:05 PM)</span>
            <span>·</span>
            <span>Local State Coordination Active</span>
          </div>
        </div>
      </footer>

      {/* Modals */}
      {selectedRoomStatus && (
        <RoomDetailModal
          roomStatus={selectedRoomStatus}
          currentDay={currentDay}
          currentTimeMinutes={currentTimeMinutes}
          isSimulated={isSimulated}
          onClose={() => setSelectedRoomId(null)}
          onClaimRoom={(id) => {
            setSelectedRoomId(null);
            setClaimingRoomId(id);
          }}
          onReleaseClaim={handleReleaseClaim}
        />
      )}

      {claimingRoomStatus && (
        <ClaimModal
          roomStatus={claimingRoomStatus}
          currentTimeMinutes={currentTimeMinutes}
          onClose={() => setClaimingRoomId(null)}
          onConfirmClaim={handleConfirmClaim}
        />
      )}
    </div>
  );
}
