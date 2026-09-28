import { DayOfWeek, PeriodSlot, Room, RoomLiveStatus, RoomStatusType, ClaimState } from '../types';
import { PERIOD_SLOTS } from '../data/timetableData';

export function parseTimeToMinutes(timeStr: string): number {
  const [hStr, mStr] = timeStr.split(':');
  return parseInt(hStr, 10) * 60 + parseInt(mStr, 10);
}

export function formatMinutesToTime(minutes: number): string {
  const h24 = Math.floor(minutes / 60);
  const m = minutes % 60;
  const ampm = h24 >= 12 ? 'PM' : 'AM';
  const h12 = h24 % 12 === 0 ? 12 : h24 % 12;
  const mm = m < 10 ? `0${m}` : `${m}`;
  return `${h12}:${mm} ${ampm}`;
}

export function getCurrentPeriodForTime(timeMinutes: number): PeriodSlot | null {
  for (const slot of PERIOD_SLOTS) {
    if (timeMinutes >= slot.startMinutes && timeMinutes <= slot.endMinutes) {
      return slot;
    }
  }
  // If between two periods during the 5-min break:
  for (let i = 0; i < PERIOD_SLOTS.length - 1; i++) {
    const current = PERIOD_SLOTS[i];
    const next = PERIOD_SLOTS[i + 1];
    if (timeMinutes > current.endMinutes && timeMinutes < next.startMinutes) {
      // 5 min passing period - return the upcoming slot so students get prepared
      return next;
    }
  }
  return null;
}

export function calculateRoomStatus(
  room: Room,
  targetDay: DayOfWeek,
  timeMinutes: number,
  claimedRooms: Record<string, ClaimState> = {}
): RoomLiveStatus {
  const currentPeriod = getCurrentPeriodForTime(timeMinutes);
  const daySchedule = room.schedule.filter((s) => s.day === targetDay);

  // Check claim state
  const claim = claimedRooms[room.id];
  const isClaimed = !!claim && claim.validUntilMinutes >= timeMinutes;

  // Active class in current period
  let currentClass = null;
  if (currentPeriod && currentPeriod.id !== 0) {
    currentClass = daySchedule.find((s) => s.periodId === currentPeriod.id) || null;
  }

  // Future classes today after current time
  const upcomingClasses = daySchedule
    .map((s) => {
      const slot = PERIOD_SLOTS.find((p) => p.id === s.periodId);
      return { schedule: s, slot };
    })
    .filter((item) => item.slot && item.slot.startMinutes > timeMinutes)
    .sort((a, b) => (a.slot?.startMinutes || 0) - (b.slot?.startMinutes || 0));

  const nextClass = upcomingClasses.length > 0 ? upcomingClasses[0].schedule : null;
  const nextClassPeriod = upcomingClasses.length > 0 && upcomingClasses[0].slot ? upcomingClasses[0].slot : null;

  let minutesUntilNextClass: number | null = null;
  if (nextClassPeriod) {
    minutesUntilNextClass = Math.max(0, nextClassPeriod.startMinutes - timeMinutes);
  }

  // Determine status
  let status: RoomStatusType = 'FREE';
  let statusMessage = 'Completely Free';

  if (currentClass) {
    status = 'BUSY';
    statusMessage = `${currentClass.courseCode}: ${currentClass.courseName} (${currentClass.faculty})`;
  } else if (isClaimed) {
    status = 'BUSY';
    statusMessage = `Claimed by ${claim.claimedBy} (${claim.studyTopic})`;
  } else if (minutesUntilNextClass !== null) {
    if (minutesUntilNextClass <= 20) {
      status = 'BUSY_SOON'; // Kick-out imminent
      statusMessage = `Kick-out warning! Class starts in ${minutesUntilNextClass}m (${nextClass?.courseCode})`;
    } else if (minutesUntilNextClass <= 60) {
      status = 'FREE_SOON';
      statusMessage = `Free for ${minutesUntilNextClass}m until ${nextClassPeriod?.startTime}`;
    } else {
      status = 'FREE';
      statusMessage = `Free until ${nextClassPeriod?.startTime} (${Math.floor(minutesUntilNextClass / 60)}h ${minutesUntilNextClass % 60}m)`;
    }
  } else {
    // No more classes today!
    status = 'FREE';
    statusMessage = 'Free for remainder of the day (No scheduled classes)';
  }

  // Calculate consecutive free periods from current period
  let consecutiveFreeSlots = 0;
  let freeUntilTime: string | null = null;
  let nextAvailableTime: string | null = null;

  const startIndex = currentPeriod ? PERIOD_SLOTS.findIndex((p) => p.id === currentPeriod.id) : 0;
  if (startIndex >= 0 && !currentClass && !isClaimed) {
    for (let i = startIndex; i < PERIOD_SLOTS.length; i++) {
      const slot = PERIOD_SLOTS[i];
      if (slot.isLunch) {
        consecutiveFreeSlots++;
        freeUntilTime = slot.endTime;
        continue;
      }
      const hasClass = daySchedule.some((s) => s.periodId === slot.id);
      if (hasClass) {
        break;
      }
      consecutiveFreeSlots++;
      freeUntilTime = slot.endTime;
    }
  } else if (startIndex >= 0 && (currentClass || isClaimed)) {
    // If room is busy, find when it next becomes free today
    for (let i = startIndex + 1; i < PERIOD_SLOTS.length; i++) {
      const slot = PERIOD_SLOTS[i];
      const hasClass = daySchedule.some((s) => s.periodId === slot.id);
      if (!hasClass) {
        nextAvailableTime = slot.startTime;
        break;
      }
    }
  }

  return {
    room,
    status,
    currentPeriod,
    currentClass,
    nextClass,
    nextClassPeriod,
    minutesUntilNextClass,
    consecutiveFreeSlots,
    freeUntilTime,
    nextAvailableTime,
    isClaimed,
    claimInfo: isClaimed ? claim : null,
    statusMessage,
  };
}

export function getAllRoomsStatus(
  rooms: Room[],
  targetDay: DayOfWeek,
  timeMinutes: number,
  claimedRooms: Record<string, ClaimState> = {}
): RoomLiveStatus[] {
  return rooms.map((room) => calculateRoomStatus(room, targetDay, timeMinutes, claimedRooms));
}
