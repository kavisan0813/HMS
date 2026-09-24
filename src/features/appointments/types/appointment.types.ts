import type { ReactNode } from "react";

export type UserRole =
  | "Receptionist"
  | "Admin"
  | "Hospital Admin"
  | "Super Admin"
  | "Doctor"
  | "Nurse"
  | "Patient";

type AppointmentStatusEnum =
  | "BOOKED"
  | "CONFIRMED"
  | "CHECKED_IN"
  | "WAITING_FOR_VITALS"
  | "WAITING_FOR_DOCTOR"
  | "WAITING_FOR_DOCTOR_CALL"
  | "CALLED"
  | "IN_CONSULTATION"
  | "CONSULTATION_COMPLETED"
  | "BILLING_PENDING"
  | "PAYMENT_COMPLETED"
  | "COMPLETED"
  | "CANCELLED"
  | "NO_SHOW"
  | "RESCHEDULED";

export type AppointmentStatus =
  | AppointmentStatusEnum
  | "Scheduled"
  | "Checked-In"
  | "Waiting"
  | "In Progress"
  | "Completed"
  | "Cancelled"
  | "No Show"
  | string;

type QueueStatusEnum =
  "WAITING" | "CALLED" | "IN_CONSULTATION" | "COMPLETED" | "SKIPPED";

type AppointmentTypeEnum =
  "CONSULTATION" | "WALK_IN" | "FOLLOW_UP" | "EMERGENCY" | "ROUTINE";

type FamilyRelationshipEnum =
  | "SELF"
  | "FATHER"
  | "MOTHER"
  | "SPOUSE"
  | "SON"
  | "DAUGHTER"
  | "CHILD"
  | "SIBLING"
  | "OTHER";

export interface DoctorSummary {
  fullName: string;
  id: number | string;
  doctorId?: number | string;
  name: string;
  departmentId?: number | string;
  departmentName?: string;
  department?: string;
  specialty?: string;
  qualification?: string;
  consultationFee?: number | string;
  opdRoom?: string;
  status?: string;
  active?: boolean;
}

export interface PatientSummary {
  id: number | string;
  patientId?: string;
  fullName?: string;
  name: string;
  gender?: string;
  age?: number;
  mobile?: string;
  phone: string;
  mrn?: string;
  emergencyContact?: string;
  bloodGroup?: string;
  assignedDoctor?: string;
}

export interface LinkedPatient {
  id: number | string;
  patientId: string;
  fullName: string;
  relationship: FamilyRelationshipEnum | string;
  gender?: string;
  dob?: string;
  mobile?: string;
  isSelf?: boolean;
}

export interface AppointmentRecord {
  scheduledTime?: string;
  specialty: string;
  time: string;
  tokenNumber?: string;
  appointmentTime?: string;
  reasonForVisit?: string;
  roomNumber?: string;
  appointmentId?: string | number;
  age?: ReactNode;
  gender?: ReactNode;
  bloodGroup?: ReactNode;
  mobile?: ReactNode;
  emergencyContact?: ReactNode;
  arrivalTime?: string;
  date?: string;
  id: number | string;
  appointmentNumber?: string;
  queueToken?: string;
  patientId: number | string;
  patientName: string;
  patientMrn?: string;
  doctorId: number | string;
  doctorName: string;
  appointmentDate: string;
  startTime?: string;
  endTime?: string;
  status: AppointmentStatus;
  queueStatus?: QueueStatusEnum | string;
  appointmentType?: AppointmentTypeEnum | string;
  reason?: string;
  symptoms?: string;
  departmentId?: number;
  departmentName?: string;
  patient?: PatientSummary;
  doctor?: DoctorSummary;
  cancellationReason?: string;
  rescheduleReason?: string;
  vitalsRecorded?: boolean;
  hasVitals?: boolean;
  vitalsId?: number | string;
  paymentStatus?: "PAID" | "UNPAID" | "PARTIAL" | "PENDING";
  priority?: string;
  arrivalStatus?: string;
  opdRoom?: string;
  waitingTimeMinutes?: number;
  isWalkIn?: boolean;
  createdDate?: string;
  department?:
    | string
    | {
        departmentName?: string;
        name?: string;
        departmentCode?: string;
      };

  // Legacy / Backward Compatibility Optional Fields
  mrn?: string;
  patientAge?: number;
  patientGender?: string;
  patientPhone?: string;
  doctorSpecialty?: string;
  tokenNo?: string;
  timeSlot?: string;
  visitType?: string;
  chiefComplaint?: string;
  notes?: string;
  feeAmount?: number;
}

export interface CreateAppointmentRequest {
  /** Patient MRN (Medical Record Number) */
  patientMrn: string;
  /** Doctor ID */
  doctorId: number | string;
  /** Department ID */
  departmentId?: number | string;
  /** Appointment date in YYYY-MM-DD format */
  appointmentDate: string;
  /** Appointment time slot (e.g., "10:30-10:45") */
  appointmentSlot?: string;
  /** Start time (legacy field, use appointmentSlot for new backend) */
  startTime?: string;
  /** Slot ID (optional) */
  slotId?: number;
  /** Appointment type: FIRST_VISIT, FOLLOW_UP, WALK_IN, EMERGENCY, ROUTINE */
  appointmentType?: string;
  /** Reason for visit */
  reason?: string;
  /** Symptoms */
  symptoms?: string;
  /** MRN (legacy field, use patientMrn for new backend) */
  mrn?: string;
}

export interface RescheduleAppointmentRequest {
  appointmentDate: string;
  startTime?: string;
  slotId?: number;
  reason: string;
}

export interface CancelAppointmentRequest {
  reason: string;
}

export interface QueueActionResponse {
  action: string;
  appointmentId: number;
  appointmentNumber: string;
  tokenNumber?: string;
  queueNumber?: number;
  appointmentStatus: AppointmentStatusEnum;
  queueStatus: QueueStatusEnum;
  queueSkipReason?: string;
  doctor?: DoctorSummary;
  patient?: PatientSummary;
  appointmentDate?: string;
  appointmentTime?: string;
  consultationStartTime?: string;
  consultationEndTime?: string;
}

export interface Department {
  id: number | string;
  departmentName: string;
  departmentCode?: string;
}

export interface OnboardingStatusResponse {
  onboardingCompleted: boolean;
  patientCount: number;
  hasLinkedPatients: boolean;
}
