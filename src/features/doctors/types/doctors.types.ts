export type DoctorAvailability =
  | "Available Today"
  | "On Duty"
  | "On Call"
  | "On Leave"
  | "Out of Office";

export type DoctorStatus = "Active" | "Inactive" | "On Leave" | "Suspended";

export interface DoctorRecord {
  fullName?: string;
  id: string;
  userId?: number;
  doctorId?: number;
  empId: string;
  regNumber: string;
  name: string;
  gender: "Male" | "Female" | "Other";
  department: string;
  primaryDepartmentId?: number;
  specialty: string;
  primarySpecialtyId?: number;
  qualification: string;
  designation?: string;
  experienceYrs: number;
  consultationFee: number;
  followUpFee?: number;
  slotDuration?: string;
  slotDurationMinutes?: number;
  availability: DoctorAvailability;
  status: DoctorStatus;
  email: string;
  phone: string;
  address?: string;
  dob?: string;
  opdRoom: string;
  joinedDate: string;
  shiftTimings: string;
  workingDays: string[];
  bio?: string;
  scheduleExceptions?: ApiScheduleExceptionItem[];
  rawAvailability?: ApiAvailabilityItem[];
  photoUrl?: string;
  photo?: string;
  effectiveFrom?: string;
  effectiveTo?: string;
  secondarySpecialties?: string[];
  availabilityTemplate?: string;
}

export interface DoctorAppointment {
  id: string;
  appointmentNumber?: string;
  patientId: string;
  patientName: string;
  gender: string;
  age: number;
  date: string;
  time: string;
  type: string;
  status: string;
  complaint: string;
}

export interface DoctorPatient {
  id: string;
  name: string;
  gender: string;
  age: number;
  lastVisit: string;
  status: string;
  complaint: string;
}

interface ApiDepartmentRef {
  departmentId: number;
  departmentName: string;
}

export interface ApiSpecialtyRef {
  specialtyId: number;
  specialtyName: string;
}

export interface ApiAvailabilityItem {
  availabilityId?: number;
  dayOfWeek: string;
  startTime: string;
  endTime: string;
}

export interface ApiScheduleExceptionItem {
  id?: number;
  doctorId?: number;
  exceptionDate?: string;
  reason: string;
  type?: string;
  exceptionType?: string;
  startDate?: string;
  endDate?: string;
  startTime?: string | null;
  endTime?: string | null;
  action?: string;
  status?: string;
  fullDay?: boolean;
  isFullDay?: boolean;
  createdBy?: ApiScheduleExceptionCreator;
  createdAt?: string;
}

interface ApiScheduleExceptionCreator {
  id: number;
  name: string;
}

export type DayOfWeek =
  | "MONDAY"
  | "TUESDAY"
  | "WEDNESDAY"
  | "THURSDAY"
  | "FRIDAY"
  | "SATURDAY"
  | "SUNDAY";

export type BreakType = "LUNCH" | "TEA" | "MEETING" | "PERSONAL";

export type ExceptionType =
  | "VACATION"
  | "TRAINING"
  | "CONFERENCE"
  | "EMERGENCY"
  | "SURGERY"
  | "OTHER";

export type ExceptionAction = "BLOCK_APPOINTMENTS";

type ExceptionStatus =
  | "ACTIVE"
  | "INACTIVE"
  | "CANCELLED"
  | "PENDING"
  | "COMPLETED";

export interface ApiScheduleBreak {
  id?: number;
  startTime: string;
  endTime: string;
  breakType: BreakType;
}

export interface ApiWorkingPeriod {
  id?: number;
  startTime: string;
  endTime: string;
  slotDurationMinutes: number;
  breaks?: ApiScheduleBreak[];
}

export interface ApiWeeklyScheduleDay {
  dayOfWeek: DayOfWeek;
  workingDay: boolean;
  workingPeriods: ApiWorkingPeriod[];
}

export interface ApiWeeklyScheduleData {
  doctorId: number;
  doctorName?: string;
  weeklySchedule: ApiWeeklyScheduleDay[];
}

interface UpdateScheduleDayBreakPayload {
  startTime: string;
  endTime: string;
  breakType: BreakType;
}

export interface UpdateScheduleDayWorkingPeriodPayload {
  startTime: string;
  endTime: string;
  slotDurationMinutes: number;
  breaks?: UpdateScheduleDayBreakPayload[];
}

export interface UpdateScheduleDayPayload {
  isWorkingDay: boolean;
  workingPeriods: UpdateScheduleDayWorkingPeriodPayload[];
}

export interface CreateScheduleExceptionPayload {
  exceptionType: ExceptionType;
  startDate: string;
  endDate: string;
  startTime?: string | null;
  endTime?: string | null;
  isFullDay: boolean;
  reason?: string;
  action: ExceptionAction;
}

export interface UpdateScheduleExceptionPayload {
  exceptionType?: ExceptionType;
  startDate?: string;
  endDate?: string;
  startTime?: string | null;
  endTime?: string | null;
  isFullDay?: boolean;
  reason?: string;
  action?: ExceptionAction;
  status?: ExceptionStatus;
}

export interface ApiDoctorProfile {
  [x: string]: unknown;
  doctorId: number;
  medicalRegistrationNumber: string;
  qualification: string;
  yearsOfExperience: number;
  primaryDepartment?: ApiDepartmentRef;
  secondaryDepartments?: ApiDepartmentRef[];
  primarySpecialty?: ApiSpecialtyRef;
  secondarySpecialties?: ApiSpecialtyRef[];
  consultationFee: number;
  followUpFee: number;
  slotDurationMinutes: number;
  availability: ApiAvailabilityItem[];
  scheduleExceptions: ApiScheduleExceptionItem[];
}

export interface ApiUserDoctorRecord {
  phone: string;
  phoneNumber: string;
  name: string;
  id: number;
  userId: number;
  employeeId: string;
  empId?: string;
  doctorId?: number;
  fullName: string;
  email: string;
  mobile: string;
  gender: string;
  dateOfBirth?: string;
  photo?: string;
  photoUrl?: string;
  residentialAddress?: string;
  professionalBio?: string;
  role: string;
  status: string;
  doctorProfile?: ApiDoctorProfile;
}

export interface CreateDoctorPayload {
  fullName: string;
  email: string;
  mobile: string;
  gender: string;
  dateOfBirth?: string;
  photo?: string;
  photoUrl?: string;
  residentialAddress?: string;
  professionalBio?: string;
  role: "DOCTOR";
  medicalRegistrationNumber: string;
  qualification: string;
  yearsOfExperience: number;
  doctorCode?: string;
  primaryDepartmentId: number;
  secondaryDepartmentIds?: number[];
  primarySpecialtyId: number;
  secondarySpecialtyIds?: number[];
  consultationFee: number;
  followUpFee: number;
  slotDurationMinutes: number;
  availability: ApiAvailabilityItem[];
  scheduleExceptions?: ApiScheduleExceptionItem[];
  sendCredentials?: boolean;
}

export interface UpdateDoctorPayload {
  fullName?: string;
  email?: string;
  mobile?: string;
  gender?: string;
  dateOfBirth?: string;
  photo?: string;
  photoUrl?: string;
  residentialAddress?: string;
  professionalBio?: string;
  medicalRegistrationNumber?: string;
  qualification?: string;
  yearsOfExperience?: number;
  primaryDepartmentId?: number;
  secondaryDepartmentIds?: number[];
  department?: string;
  primarySpecialtyId?: number;
  secondarySpecialtyIds?: number[];
  specialty?: string;
  consultationFee?: number;
  followUpFee?: number;
  slotDurationMinutes?: number;
  availability?: ApiAvailabilityItem[];
  scheduleExceptions?: ApiScheduleExceptionItem[];
  status?: string;
  designation?: string;
  version?: number;
  changeReason?: string;
}

export interface DoctorDailySlot {
  id: string;
  startTime: string;
  endTime: string;
  status: string;
  reason?: string;
  appointmentId?: number;
  exceptionId?: number;
}

export interface DoctorDailyAvailabilityData {
  doctorId: number;
  date: string;
  scheduleStatus: string;
  slots: DoctorDailySlot[];
}

export interface DoctorCalendarDayItem {
  date: string;
  status: string;
  totalSlots: number;
  availableSlots: number;
  bookedSlots: number;
  blockedSlots: number;
}

export interface DoctorMonthlyAvailabilityData {
  doctorId: number;
  month: string;
  days: DoctorCalendarDayItem[];
}

export interface DoctorApiResponse<T> {
  success: boolean;
  message: string;
  code?: string;
  timestamp?: string;
  data?: T;
  errors?: Record<string, unknown>;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface DoctorQueueSummary {
  waitingCount?: number;
  inConsultationCount?: number;
  completedCount?: number;
  [key: string]: unknown;
}

export interface DoctorQueueItem {
  queueId: number;
  appointmentId: number;
  appointmentNumber: string;
  token: string;
  queueNumber: number;
  position: number;
  priority: string;
  status: string;
  checkInTime: string;
  patient: {
    name: string;
    mrn: string;
    age: number;
    gender: string;
    contact?: string;
  };
  doctor?: {
    doctorId: number;
    name: string;
    doctorCode: string;
    department: string;
    specialty: string;
  };
  // Optional compatibility fields (flat / legacy queue payloads)
  id?: number | string;
  queueStatus?: string;
  patientId?: number | string;
  patientName?: string;
  mrn?: string;
  tokenNumber?: string;
  waitTime?: string;
  estimatedWaitMinutes?: number;
  patientsAhead?: number;
}

export interface DoctorCallNextResponse {
  action: string;
  appointmentId: number;
  appointmentNumber: string;
  tokenNumber: string;
  queueNumber: number;
  appointmentStatus: string;
  queueStatus: string;
  queueSkipReason?: string;
  doctor?: {
    doctorId: number;
    doctorCode: string;
    name: string;
  };
  patient?: {
    fullName: string;
    mrn: string;
    gender: string;
    age: string | number;
  };
  appointmentDate?: string;
  appointmentTime?: string;
  consultationStartTime?: string;
  consultationEndTime?: string;
  version?: number;
}

export interface FinalizePrescriptionRequest {
  confirmation: boolean;
}

export interface FinalizePrescriptionResponse {
  prescriptionId: string;
  status: string;
  version: number;
  issuedAt: string;
  issuedBy: {
    doctorId: string;
    fullName: string;
    registrationNumber: string;
  };
}
