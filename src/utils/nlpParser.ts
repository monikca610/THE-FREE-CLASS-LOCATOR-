import { DayOfWeek, ParsedNLPQuery, RoomLiveStatus } from '../types';
import { calculateRoomStatus, parseTimeToMinutes } from './statusEngine';
import { ROOMS_DATA, PERIOD_SLOTS } from '../data/timetableData';

export function parseNaturalLanguageQuery(
  query: string,
  currentSimulatedTimeMinutes: number,
  currentSimulatedDay: DayOfWeek
): ParsedNLPQuery {
  const q = query.toLowerCase().trim();
  const explanation: string[] = [];

  // 1. Detect Day
  let day: DayOfWeek | null = null;
  if (q.includes('monday') || q.includes('mon')) {
    day = 'Monday';
    explanation.push('Day: Monday');
  } else if (q.includes('tuesday') || q.includes('tue')) {
    day = 'Tuesday';
    explanation.push('Day: Tuesday');
  } else if (q.includes('wednesday') || q.includes('wed')) {
    day = 'Wednesday';
    explanation.push('Day: Wednesday');
  } else if (q.includes('thursday') || q.includes('thu')) {
    day = 'Thursday';
    explanation.push('Day: Thursday');
  } else if (q.includes('friday') || q.includes('fri')) {
    day = 'Friday';
    explanation.push('Day: Friday');
  } else if (q.includes('today') || q.includes('right now') || q.includes('now')) {
    day = currentSimulatedDay;
    explanation.push(`Day: Today (${currentSimulatedDay})`);
  }

  // 2. Detect Floor
  let floor: number | null = null;
  if (/ground(\s*floor)?|\bgf\b|\b0th\b|\bfloor 0\b/i.test(q)) {
    floor = 0;
    explanation.push('Floor: Ground Floor (0)');
  } else if (/1st(\s*floor)?|\bfirst floor\b|\bfloor 1\b/i.test(q)) {
    floor = 1;
    explanation.push('Floor: 1st Floor');
  } else if (/2nd(\s*floor)?|\bsecond floor\b|\bfloor 2\b/i.test(q)) {
    floor = 2;
    explanation.push('Floor: 2nd Floor');
  } else if (/3rd(\s*floor)?|\bthird floor\b|\bfloor 3\b/i.test(q)) {
    floor = 2; // IST 3xx or 4xx
    explanation.push('Floor: 3rd Floor / 2nd Floor');
  } else if (/4th(\s*floor)?|\bfourth floor\b|\bfloor 4\b/i.test(q)) {
    floor = 4;
    explanation.push('Floor: 4th Floor');
  } else if (/5th(\s*floor)?|\bfifth floor\b|\bfloor 5\b/i.test(q)) {
    floor = 5;
    explanation.push('Floor: 5th Floor');
  } else if (/6th(\s*floor)?|\bsixth floor\b|\bfloor 6\b/i.test(q)) {
    floor = 6;
    explanation.push('Floor: 6th Floor');
  } else if (/7th(\s*floor)?|\bseventh floor\b|\bfloor 7\b/i.test(q)) {
    floor = 7;
    explanation.push('Floor: 7th Floor');
  }

  // 3. Detect Proximity to Room (e.g. "near TRP 101", "near 203", "near G02", "around Turing Lab")
  let nearRoomId: string | null = null;
  const nearMatch = q.match(/near\s+(?:trp\s*|room\s*|lab\s*)?(g\d{2}|\d{3})/i);
  if (nearMatch) {
    const code = nearMatch[1].toLowerCase();
    const foundRoom = ROOMS_DATA.find((r) => r.id.toLowerCase().includes(code));
    if (foundRoom) {
      nearRoomId = foundRoom.id;
      if (floor === null) {
        floor = foundRoom.floor;
      }
      explanation.push(`Proximity: Near ${foundRoom.name} (${foundRoom.floorName})`);
    }
  } else if (q.includes('turing')) {
    const foundRoom = ROOMS_DATA.find((r) => r.id === 'TRP G02');
    if (foundRoom) {
      nearRoomId = foundRoom.id;
      if (floor === null) floor = 0;
      explanation.push('Proximity: Near Turing Lab (TRP G02)');
    }
  } else if (q.includes('kalam')) {
    const foundRoom = ROOMS_DATA.find((r) => r.id === 'TRP G10' || r.block.toLowerCase().includes('kalam'));
    if (foundRoom) {
      nearRoomId = foundRoom.id;
      explanation.push('Proximity: Near Kalam Wing');
    }
  }

  // 4. Detect Start Time
  let targetTimeMinutes: number | null = null;
  // Patterns like "after 1:30 pm", "at 10:50 am", "from 11:45", "1:30 pm"
  const timeRegex = /(?:after|at|from)?\s*(\d{1,2})(?::(\d{2}))?\s*(am|pm)?/i;
  const explicitTimeMatch = q.match(/(?:after|at|from)\s+(\d{1,2})(?::(\d{2}))?\s*(am|pm)?/i);

  if (explicitTimeMatch) {
    let hour = parseInt(explicitTimeMatch[1], 10);
    const min = explicitTimeMatch[2] ? parseInt(explicitTimeMatch[2], 10) : 0;
    const meridian = explicitTimeMatch[3]?.toLowerCase();

    if (meridian === 'pm' && hour < 12) hour += 12;
    if (meridian === 'am' && hour === 12) hour = 0;
    // Default afternoon heuristic if 1 <= hour <= 5 and no meridian specified
    if (!meridian && hour >= 1 && hour <= 6) hour += 12;

    targetTimeMinutes = hour * 60 + min;
    explanation.push(`Time: ${explicitTimeMatch[0].trim()}`);
  } else if (q.includes('after lunch') || q.includes('post lunch')) {
    targetTimeMinutes = 13 * 60 + 30; // 1:30 PM (Period 5)
    explanation.push('Time: After Lunch (01:30 PM)');
  } else if (q.includes('right now') || q.includes('current') || q.includes('now')) {
    targetTimeMinutes = currentSimulatedTimeMinutes;
    explanation.push('Time: Current Time');
  }

  // Period-specific mentions like "period 3", "p4"
  const periodMatch = q.match(/\b(?:period|slot|p)\s*([1-8])\b/i);
  if (periodMatch && targetTimeMinutes === null) {
    const pId = parseInt(periodMatch[1], 10);
    const pSlot = PERIOD_SLOTS.find((p) => p.id === pId);
    if (pSlot) {
      targetTimeMinutes = pSlot.startMinutes;
      explanation.push(`Slot: Period ${pId} (${pSlot.startTime})`);
    }
  }

  // 5. Detect Duration
  let durationMinutes: number | null = null;
  const hourMatch = q.match(/(\d+)\s*(?:hour|hr|hours|hrs)/i);
  const minMatch = q.match(/(\d+)\s*(?:minute|min|minutes|mins)/i);

  if (hourMatch) {
    const hours = parseInt(hourMatch[1], 10);
    durationMinutes = hours * 60;
    explanation.push(`Duration: ${hours} hour(s)`);
  } else if (minMatch) {
    const mins = parseInt(minMatch[1], 10);
    durationMinutes = mins;
    explanation.push(`Duration: ${mins} minutes`);
  }

  // 6. Amenities & Preferences
  const requiredAmenities: ParsedNLPQuery['requiredAmenities'] = {};
  if (q.includes('projector') || q.includes('screen') || q.includes('presentation')) {
    requiredAmenities.projector = true;
    explanation.push('Feature: Projector');
  }
  if (q.includes('ac') || q.includes('air conditioning') || q.includes('air condition')) {
    requiredAmenities.ac = true;
    explanation.push('Feature: AC');
  }
  if (q.includes('lab') || q.includes('computer') || q.includes('systems') || q.includes('pc')) {
    requiredAmenities.labComputers = true;
    explanation.push('Feature: Lab Computers');
  }
  if (q.includes('socket') || q.includes('plug') || q.includes('charger') || q.includes('power')) {
    requiredAmenities.powerSockets = true;
    explanation.push('Feature: Power Sockets');
  }

  const onlyQuiet = q.includes('quiet') || q.includes('study') || q.includes('focus');
  if (onlyQuiet) {
    explanation.push('Preference: Quiet / Group Study');
  }

  return {
    rawQuery: query,
    floor,
    day: day || currentSimulatedDay,
    targetTimeMinutes: targetTimeMinutes ?? currentSimulatedTimeMinutes,
    durationMinutes,
    requiredAmenities,
    nearRoomId,
    onlyQuiet,
    explanation,
  };
}

export interface ScoredRoomResult {
  roomStatus: RoomLiveStatus;
  score: number;
  matchReasons: string[];
}

export function rankRoomsByNLP(
  parsed: ParsedNLPQuery,
  rooms: typeof ROOMS_DATA,
  claimedRooms: Record<string, any>
): ScoredRoomResult[] {
  const targetDay = parsed.day || 'Monday';
  const targetTime = parsed.targetTimeMinutes || 540;

  const results: ScoredRoomResult[] = rooms.map((room) => {
    const status = calculateRoomStatus(room, targetDay, targetTime, claimedRooms);
    let score = 0;
    const matchReasons: string[] = [];

    // Base availability check
    if (status.status === 'FREE') {
      score += 50;
      matchReasons.push('Available now');
    } else if (status.status === 'FREE_SOON') {
      score += 25;
      matchReasons.push('Free window soon');
    } else {
      score -= 30; // Active lecture or claimed
    }

    // Floor match
    if (parsed.floor !== null) {
      if (room.floor === parsed.floor) {
        score += 40;
        matchReasons.push(`${room.floorName} match`);
      } else {
        const floorDist = Math.abs(room.floor - parsed.floor);
        score -= floorDist * 10;
      }
    }

    // Proximity match
    if (parsed.nearRoomId) {
      if (room.id === parsed.nearRoomId) {
        score += 35;
        matchReasons.push(`Exact target venue (${room.id})`);
      } else {
        const targetVenue = ROOMS_DATA.find((r) => r.id === parsed.nearRoomId);
        if (targetVenue && targetVenue.floor === room.floor) {
          score += 25;
          matchReasons.push(`Same floor as ${targetVenue.name}`);
        }
      }
    }

    // Duration match
    if (parsed.durationMinutes && status.minutesUntilNextClass !== null) {
      if (status.minutesUntilNextClass >= parsed.durationMinutes) {
        score += 30;
        matchReasons.push(`Free for requested duration (${Math.floor(status.minutesUntilNextClass / 60)}h ${status.minutesUntilNextClass % 60}m available)`);
      } else if (status.minutesUntilNextClass > 0) {
        score -= 20; // Will be kicked out before duration finishes!
      }
    } else if (status.minutesUntilNextClass === null && status.status === 'FREE') {
      // Entire rest of day free
      score += 35;
      matchReasons.push('Free for the remainder of the day');
    }

    // Amenities
    if (parsed.requiredAmenities.projector && room.amenities.projector) {
      score += 15;
      matchReasons.push('Projector equipped');
    }
    if (parsed.requiredAmenities.ac && room.amenities.ac) {
      score += 15;
      matchReasons.push('Air conditioned');
    }
    if (parsed.requiredAmenities.labComputers && room.amenities.labComputers) {
      score += 20;
      matchReasons.push('Computing lab workstations');
    }
    if (parsed.requiredAmenities.powerSockets && room.amenities.powerSockets) {
      score += 10;
      matchReasons.push('Power sockets available');
    }

    // Quiet preference
    if (parsed.onlyQuiet) {
      if (room.floor >= 4) {
        score += 10; // Upper floors are notably quieter in SRM IST
        matchReasons.push('Upper floor quiet zone');
      }
      if (room.type === 'Classroom' || room.type === 'Smart Lecture Hall') {
        score += 5;
      }
    }

    return {
      roomStatus: status,
      score,
      matchReasons,
    };
  });

  return results.sort((a, b) => b.score - a.score);
}
