export type DayOfWeek = 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday';

export type RoomType =
  | 'Classroom'
  | 'Smart Lecture Hall'
  | 'Hardware Lab'
  | 'Computing Lab'
  | 'Seminar Hall'
  | 'Auditorium'
  | 'Research Lab'
  | 'Conference Suite';

export type Department =
  | 'CSE'
  | 'AI & DS'
  | 'AIML'
  | 'ECE'
  | 'EEE'
  | 'Mechanical'
  | 'Cyber Security'
  | 'Information Technology'
  | 'Data Science'
  | 'BME';

export type Year = 'Year 1' | 'Year 2' | 'Year 3' | 'Year 4';

export interface PeriodSlot {
  id: number;
  label: string;
  name: string;
  slotCode: string; // e.g. "A", "B", "C", "D", "E", "F", "G", "H"
  startTime: string; // "09:00"
  endTime: string;   // "09:50"
  startMinutes: number; // 540
  endMinutes: number;   // 590
  isLunch?: boolean;
}

export interface ClassScheduleItem {
  id: string;
  day: DayOfWeek;
  dayOrder: number; // 1 to 5
  periodId: number; // 1-8
  slotCode: string;
  courseCode: string;
  courseName: string;
  department: Department;
  year: Year;
  faculty: string;
  batch: string;
}

export interface RoomAmenities {
  projector: boolean;
  ac: boolean;
  labComputers: boolean;
  powerSockets: boolean;
  whiteboard: boolean;
  wifiSignal: 'Strong' | 'Excellent';
}

export interface ClaimState {
  claimedBy: string;
  studyTopic: string;
  claimedAt: number; // timestamp
  validUntilMinutes: number; // end of period or time
  periodId: number;
}

export interface Room {
  id: string;
  name: string;
  floor: number;
  floorName: string;
  block: string;
  type: RoomType;
  capacity: number;
  amenities: RoomAmenities;
  schedule: ClassScheduleItem[];
}

export type RoomStatusType = 'FREE' | 'BUSY' | 'BUSY_SOON' | 'FREE_SOON';

export interface RoomLiveStatus {
  room: Room;
  status: RoomStatusType;
  currentPeriod: PeriodSlot | null;
  currentClass: ClassScheduleItem | null;
  nextClass: ClassScheduleItem | null;
  nextClassPeriod: PeriodSlot | null;
  minutesUntilNextClass: number | null; // e.g. 45 min until kick-out
  consecutiveFreeSlots: number;
  freeUntilTime: string | null;
  nextAvailableTime?: string | null;
  isClaimed: boolean;
  claimInfo?: ClaimState | null;
  statusMessage: string;
}

export interface ParsedNLPQuery {
  rawQuery: string;
  floor: number | null;
  day: DayOfWeek | null;
  targetTimeMinutes: number | null; // minutes from 00:00
  durationMinutes: number | null;
  requiredAmenities: {
    projector?: boolean;
    ac?: boolean;
    labComputers?: boolean;
    powerSockets?: boolean;
  };
  nearRoomId: string | null;
  onlyQuiet: boolean;
  explanation: string[];
}
