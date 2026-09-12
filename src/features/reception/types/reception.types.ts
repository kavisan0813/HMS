export type QueueStatus =
  | "WAITING"
  | "WAITING_FOR_VITALS"
  | "IN_CONSULTATION"
  | "COMPLETED"
  | "CANCELLED"
  | "NO_SHOW"
  | "CHECKED_IN";

export type BillingStatus =
  | "PAID"
  | "PENDING"
  | "PARTIAL"
  | "EXEMPT"
  | "REFUNDED";

export interface ReceptionQueueItem {
  id: string | number;
  tokenNumber: string;
  patientId: string | number;
  patientName: string;
  mrn: string;
  mobile: string;
  gender: string;
  age?: number | string;
  dateOfBirth?: string;
  appointmentId?: string | number;
  appointmentTime: string;
  arrivalTime?: string;
  checkInTimestamp?: string;
  departmentId: string | number;
  departmentName: string;
  doctorId: string | number;
  doctorName: string;
  queueStatus: QueueStatus;
  billingStatus: BillingStatus;
  consultationFee: number;
  visitType: "WALK_IN" | "APPOINTMENT" | "FOLLOW_UP" | "EMERGENCY";
  notes?: string;
}

export interface ArrivalCheckInPayload {
  queueItemId: string | number;
  patientId: string | number;
  appointmentId?: string | number;
  checkInTime?: string;
  vitalsCaptured?: boolean;
  notes?: string;
}

export interface WalkInRegistrationPayload {
  fullName: string;
  mobile: string;
  gender: string;
  dateOfBirth?: string;
  age?: number;
  address?: string;
  departmentId: string | number;
  doctorId: string | number;
  consultationFee: number;
  visitType: "WALK_IN" | "EMERGENCY";
  paymentMode: "CASH" | "CARD" | "UPI" | "INSURANCE" | "PENDING";
}
