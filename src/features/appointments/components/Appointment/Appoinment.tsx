import {
  Eye,
  Printer,
  X,
  User,
  Calendar,
  Stethoscope,
  FileText,
  Clock,
  Check,
  CheckCircle2,
  RefreshCw,
} from "lucide-react";
import type { AppointmentRecord } from "../../types/appointment.types";
import { StatusBadge } from "../StatusBadge";
import { Avatar } from "../Avatar";
import {
  PP,
  RB,
  appointmentToPatientSummary,
} from "../../constants/appointment.constants";
import type { UserRole } from "../../types/appointment-screen.types";

export interface Props {
  onPatientSelect?: (id: number | string) => void;
  onStartConsultation?: (
    apt?: AppointmentRecord | null | string | number,
  ) => void;
  onBookAppointmentClick?: () => void;
  onReceptionQueueClick?: () => void;
  userRole?: UserRole;
  doctorId?: number | string;
  onBack?: () => void;
  onConfirmSuccess?: (uhid: string | number) => void;
  onRegisterNewPatientClick?: () => void;
  onViewPatientProfileClick?: (uhid: string | number) => void;
  initialUhid?: string;
  initialAptId?: string;
  onCheckInSuccess?: (uhid: string | number) => void;
  onViewQueueClick?: (uhid?: string | number) => void;
  onCheckInClick?: (token?: string | number, uhid?: string | number) => void;
  onPatientSearchClick?: () => void;
  onRegisterPatientClick?: () => void;
}

type DrawerHeaderProps = {
  isNurse: boolean;
  isDoctor: boolean;
  onClose: () => void;
};

type DrawerPatientSectionProps = {
  patientInfo: ReturnType<typeof appointmentToPatientSummary>;
  rawPatientInfo: Record<string, unknown>;
  apt: AppointmentRecord;
  onPatientSelect?: (id: number | string) => void;
};

interface TimelineEventItem {
  title: string;
  timestamp: string;
  by: string;
  status: string;
}

type DrawerDoctorInfo = {
  id: string | number;
  name: string;
  department: string;
  specialty: string;
  qualification: string;
  consultationFee: string | number;
  opdRoom: string;
};

type DrawerFooterAction = "nurse" | "doctor" | "check-in" | "edit";

type DrawerFooterProps = {
  onClose: () => void;
  onPrintClick: (apt: AppointmentRecord) => void;
  apt: AppointmentRecord;
  action: DrawerFooterAction;
  onPatientSelect?: (id: number | string) => void;
  onStartConsultation?: (aptId?: string | number) => void;
  handleCheckIn: () => Promise<void>;
  isCheckingIn: boolean;
  onEditClick: (apt: AppointmentRecord) => void;
};

type ClinicalAppointment = AppointmentRecord & {
  reason?: string;
  notes?: string;
  symptoms?: string;
};

export const DrawerHeader = ({
  isNurse,
  isDoctor,
  onClose,
}: DrawerHeaderProps) => (
  <div className="px-6 py-4 bg-[#0D47A1] text-white flex items-center justify-between shadow-sm shrink-0">
    <div>
      <div
        className="text-[10px] font-semibold text-blue-200 uppercase tracking-wider mb-0.5"
        style={{ fontFamily: PP }}
      >
        {isNurse
          ? "Nurse / Appointment Management / Appointment Details"
          : isDoctor
            ? "Doctor / Appointment Management / Appointment Details"
            : "Reception / Appointment Details"}
      </div>
      <h2
        className="text-base font-bold flex items-center gap-2"
        style={{ fontFamily: PP }}
      >
        <Eye size={18} /> Appointment Details
      </h2>
      <p className="text-xs text-blue-200 mt-0.5" style={{ fontFamily: RB }}>
        {isNurse
          ? "View patient appointment information, clinical prep notes, alerts, and timeline."
          : isDoctor
            ? "Review appointment information before consultation."
            : "View complete appointment information and timeline activity."}
      </p>
    </div>

    <div className="flex items-center gap-2">
      <button
        aria-label="Close"
        type="button"
        onClick={onClose}
        className="p-1.5 text-white/80 hover:text-white rounded-lg hover:bg-white/10 transition-colors"
      >
        <X size={20} />
      </button>
    </div>
  </div>
);

export const DrawerSummary = ({ apt }: { apt: AppointmentRecord }) => (
  <div className="bg-slate-50 p-4 border-b border-[#E5E7EB] shrink-0 space-y-2.5">
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <span className="font-mono text-sm font-bold text-[#0D47A1]">
          {apt.appointmentNumber || apt.id}
        </span>
        <span className="text-xs text-slate-400 font-mono">
          ({apt.tokenNo})
        </span>
      </div>
      <StatusBadge status={apt.status} />
    </div>

    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
      <div className="bg-white p-2 rounded-xl border border-slate-200/80">
        <span className="text-[10px] text-slate-400 block font-medium">
          Date
        </span>
        <strong className="text-[#111827]">{apt.appointmentDate}</strong>
      </div>
      <div className="bg-white p-2 rounded-xl border border-slate-200/80">
        <span className="text-[10px] text-slate-400 block font-medium">
          Time Slot
        </span>
        <strong className="text-[#0D47A1] font-mono">{apt.timeSlot}</strong>
      </div>
      <div className="bg-white p-2 rounded-xl border border-slate-200/80">
        <span className="text-[10px] text-slate-400 block font-medium">
          Visit Type
        </span>
        <span className="font-bold text-[#009688]">{apt.visitType}</span>
      </div>
      <div className="bg-white p-2 rounded-xl border border-slate-200/80">
        <span className="text-[10px] text-slate-400 block font-medium">
          Token No
        </span>
        <span className="font-mono font-bold text-[#0D47A1]">
          {apt.tokenNo}
        </span>
      </div>
    </div>
  </div>
);

export const DrawerPatientSection = ({
  patientInfo,
  rawPatientInfo,
  apt,
  onPatientSelect,
}: DrawerPatientSectionProps) => (
  <div className="bg-white p-5 rounded-2xl border border-[#E5E7EB] shadow-sm space-y-4">
    <div className="flex items-center justify-between border-b border-gray-100 pb-3 flex-wrap gap-2">
      <h3
        className="text-xs font-bold text-[#111827] uppercase tracking-wider flex items-center gap-2"
        style={{ fontFamily: PP }}
      >
        <User size={15} className="text-[#0D47A1]" /> Section 01 · Patient
        Information
      </h3>
      {onPatientSelect && (
        <button
          type="button"
          onClick={() => onPatientSelect(patientInfo.id)}
          className="px-3 py-1.5 rounded-xl bg-blue-50 text-[#0D47A1] border border-blue-100 text-xs font-bold hover:bg-blue-100 transition-colors flex items-center gap-1.5"
          style={{ fontFamily: PP }}
        >
          <User size={13} /> View Patient Profile
        </button>
      )}
    </div>

    <div className="flex items-start gap-4">
      <Avatar name={patientInfo.name} size="lg" />
      <div className="flex-1 min-w-0">
        <h4
          className="text-base font-bold text-[#111827]"
          style={{ fontFamily: PP }}
        >
          {patientInfo.name}
        </h4>
        <div className="text-xs text-slate-500 font-mono mt-0.5">
          <span className="text-[#0D47A1] font-bold">{patientInfo.mrn}</span>
        </div>
      </div>
    </div>

    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
      <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
        <span className="text-slate-400 text-[10px] block font-medium">
          Age & Gender
        </span>
        <strong className="text-[#111827]">
          {patientInfo.age} yrs / {patientInfo.gender}
        </strong>
      </div>
      <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
        <span className="text-slate-400 text-[10px] block font-medium">
          Blood Group
        </span>
        <strong className="text-[#0D47A1]">{patientInfo.bloodGroup}</strong>
      </div>
      <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
        <span className="text-slate-400 text-[10px] block font-medium">
          Mobile Number
        </span>
        <strong className="text-[#111827]">{patientInfo.phone}</strong>
      </div>
      <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100 col-span-2 sm:col-span-2">
        <span className="text-slate-400 text-[10px] block font-medium">
          Emergency Contact
        </span>
        <strong className="text-[#111827]">
          {patientInfo.emergencyContact}
        </strong>
      </div>
      <div className="bg-red-50/70 p-2.5 rounded-xl border border-red-100 col-span-2 sm:col-span-1">
        <span className="text-red-600 text-[10px] block font-bold">
          Known Allergies
        </span>
        <strong className="text-red-900">
          {rawPatientInfo.allergies ||
          (apt.patient as unknown as Record<string, unknown>)?.allergies
            ? String(
                rawPatientInfo.allergies ||
                  (apt.patient as unknown as Record<string, unknown>)
                    ?.allergies,
              )
            : "None reported"}
        </strong>
      </div>
    </div>
  </div>
);

export const DrawerAppointmentSection = ({
  apt,
}: {
  apt: AppointmentRecord;
}) => (
  <div className="bg-white p-5 rounded-2xl border border-[#E5E7EB] shadow-sm space-y-4">
    <h3
      className="text-xs font-bold text-[#111827] uppercase tracking-wider border-b border-gray-100 pb-3 flex items-center gap-2"
      style={{ fontFamily: PP }}
    >
      <Calendar size={15} className="text-[#0D47A1]" /> Section 02 · Appointment
      Information
    </h3>

    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
      <div>
        <span className="text-slate-400 text-[10px] block font-medium">
          Appointment ID
        </span>
        <strong className="text-[#0D47A1] font-mono">
          {apt.appointmentNumber || apt.id}
        </strong>
      </div>
      <div>
        <span className="text-slate-400 text-[10px] block font-medium">
          Appointment Date
        </span>
        <strong className="text-[#111827]">{apt.appointmentDate}</strong>
      </div>
      <div>
        <span className="text-slate-400 text-[10px] block font-medium">
          Appointment Time
        </span>
        <strong className="text-[#0D47A1] font-mono">{apt.timeSlot}</strong>
      </div>
      <div>
        <span className="text-slate-400 text-[10px] block font-medium">
          Token Number
        </span>
        <strong className="text-[#0D47A1] font-mono">
          {apt.tokenNo || apt.queueToken || "Pending"}
        </strong>
      </div>
      <div>
        <span className="text-slate-400 text-[10px] block font-medium">
          Visit Type
        </span>
        <span className="font-bold text-[#009688]">
          {apt.visitType || "CONSULTATION"}
        </span>
      </div>
      <div>
        <span className="text-slate-400 text-[10px] block font-medium">
          Status
        </span>
        <StatusBadge status={apt.status} />
      </div>
      <div>
        <span className="text-slate-400 text-[10px] block font-medium">
          Booking Source
        </span>
        <span className="text-slate-700 font-semibold">
          {(apt as AppointmentRecord & { bookingChannel?: string })
            .bookingChannel || "Reception Desk"}
        </span>
      </div>
      <div>
        <span className="text-slate-400 text-[10px] block font-medium">
          Created Date
        </span>
        <span className="text-slate-600">
          {apt.createdDate || apt.appointmentDate}
        </span>
      </div>
    </div>
  </div>
);

export const DrawerDoctorSection = ({
  doctorInfo,
}: {
  doctorInfo: DrawerDoctorInfo;
}) => (
  <div className="bg-white p-5 rounded-2xl border border-[#E5E7EB] shadow-sm space-y-4">
    <h3
      className="text-xs font-bold text-[#111827] uppercase tracking-wider border-b border-gray-100 pb-3 flex items-center gap-2"
      style={{ fontFamily: PP }}
    >
      <Stethoscope size={15} className="text-[#0D47A1]" /> Section 03 · Doctor
      Information
    </h3>

    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
      <div className="col-span-2 sm:col-span-1">
        <span className="text-slate-400 text-[10px] block font-medium">
          Attending Doctor
        </span>
        <strong className="text-[#111827] text-sm">
          {doctorInfo.name || "Consultant"}
        </strong>
      </div>
      <div>
        <span className="text-slate-400 text-[10px] block font-medium">
          Doctor ID
        </span>
        <strong className="text-[#0D47A1] font-mono">
          {doctorInfo.id || "—"}
        </strong>
      </div>
      <div>
        <span className="text-slate-400 text-[10px] block font-medium">
          Department
        </span>
        <strong className="text-[#0D47A1]">
          {doctorInfo.department || "General OPD"}
        </strong>
      </div>
      <div>
        <span className="text-slate-400 text-[10px] block font-medium">
          Specialization
        </span>
        <span className="text-slate-700 font-semibold">
          {doctorInfo.specialty || "General Physician"}
        </span>
      </div>
      <div>
        <span className="text-slate-400 text-[10px] block font-medium">
          Qualification
        </span>
        <span className="text-slate-700 font-semibold">
          {doctorInfo.qualification || "MBBS"}
        </span>
      </div>
      <div>
        <span className="text-slate-400 text-[10px] block font-medium">
          Consultation Fee
        </span>
        <strong className="text-[#009688]">{doctorInfo.consultationFee}</strong>
      </div>
      <div>
        <span className="text-slate-400 text-[10px] block font-medium">
          Consultation Duration
        </span>
        <span className="text-slate-700 font-semibold font-mono">15 Mins</span>
      </div>
    </div>
  </div>
);

export const DrawerClinicalSection = ({
  apt,
}: {
  apt: ClinicalAppointment;
}) => (
  <div className="bg-white p-5 rounded-2xl border border-[#E5E7EB] shadow-sm space-y-4">
    <h3
      className="text-xs font-bold text-[#111827] uppercase tracking-wider border-b border-gray-100 pb-3 flex items-center gap-2"
      style={{ fontFamily: PP }}
    >
      <FileText size={15} className="text-[#009688]" /> Section 04 · Clinical
      Preparation
    </h3>

    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
      <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
        <span className="text-slate-400 text-[10px] block font-medium">
          Previous Visit Date
        </span>
        <strong className="text-[#111827]">
          {(apt as unknown as Record<string, unknown>).previousVisitDate
            ? String(
                (apt as unknown as Record<string, unknown>).previousVisitDate,
              )
            : "No previous visits"}
        </strong>
      </div>
      <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
        <span className="text-slate-400 text-[10px] block font-medium">
          Previous Diagnosis Summary
        </span>
        <strong className="text-[#0D47A1]">
          {(apt as unknown as Record<string, unknown>).previousDiagnosis
            ? String(
                (apt as unknown as Record<string, unknown>).previousDiagnosis,
              )
            : "No previous diagnosis summary"}
        </strong>
      </div>
    </div>

    <div className="space-y-2 text-xs">
      <div>
        <span className="text-slate-400 text-[10px] block font-medium mb-1">
          Current Chief Complaint
        </span>
        <div className="p-3 bg-amber-50/80 border border-amber-100 rounded-xl text-amber-950 font-medium">
          {apt.chiefComplaint || apt.reason || "General Consultation"}
        </div>
      </div>
      <div>
        <span className="text-slate-400 text-[10px] block font-medium mb-1">
          Reason for Visit
        </span>
        <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl text-slate-700 font-medium">
          {apt.reason || apt.chiefComplaint || "Routine OPD Consultation"}
        </div>
      </div>
      <div>
        <span className="text-slate-400 text-[10px] block font-medium mb-1">
          Special Notes
        </span>
        <div className="p-3 bg-blue-50/50 border border-blue-100 rounded-xl text-blue-950 font-medium text-[11px]">
          {apt.notes || apt.symptoms || "No special notes recorded."}
        </div>
      </div>
    </div>
  </div>
);

export const DrawerTimelineSection = ({
  timelineSteps,
  isLoadingTimeline,
}: {
  timelineSteps: TimelineEventItem[];
  isLoadingTimeline: boolean;
}) => (
  <div className="bg-white p-5 rounded-2xl border border-[#E5E7EB] shadow-sm space-y-4">
    <h3
      className="text-xs font-bold text-[#111827] uppercase tracking-wider border-b border-gray-100 pb-3 flex items-center justify-between"
      style={{ fontFamily: PP }}
    >
      <div className="flex items-center gap-2">
        <Clock size={15} className="text-[#0D47A1]" /> Section 05 · Appointment
        Timeline
      </div>
      {isLoadingTimeline && (
        <div className="flex items-center gap-1.5 text-[10px] text-teal-600 font-normal normal-case">
          <RefreshCw size={12} className="animate-spin" /> Loading timeline...
        </div>
      )}
    </h3>

    <div className="relative pl-6 space-y-4 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
      {timelineSteps.map((step) => (
        <div key={step.title} className="relative">
          <div
            className={`absolute -left-6 top-0.5 w-4 h-4 rounded-full border-2 bg-white flex items-center justify-center ${step.status === "completed" ? "border-[#66BB6A] text-[#66BB6A]" : step.status === "active" ? "border-[#0D47A1] text-[#0D47A1]" : "border-slate-300"}`}
          >
            {step.status === "completed" && <Check size={10} />}
            {step.status === "active" && (
              <div className="w-1.5 h-1.5 rounded-full bg-[#0D47A1]" />
            )}
          </div>
          <div>
            <div
              className="text-xs font-bold text-[#111827]"
              style={{ fontFamily: PP }}
            >
              {step.title}
            </div>
            <div className="text-[11px] text-slate-500 font-mono mt-0.5">
              {step.timestamp} · {step.by}
            </div>
          </div>
        </div>
      ))}
    </div>
  </div>
);

export const DrawerFooter = ({
  onClose,
  onPrintClick,
  apt,
  action,
  onPatientSelect,
  onStartConsultation,
  handleCheckIn,
  isCheckingIn,
}: DrawerFooterProps) => (
  <div className="px-6 py-4 bg-white border-t border-gray-200 flex items-center justify-between gap-3 shrink-0">
    <button
      type="button"
      onClick={onClose}
      className="px-5 py-2.5 rounded-xl border border-[#E5E7EB] text-xs font-semibold text-[#64748B] hover:bg-slate-100 transition-colors"
      style={{ fontFamily: RB }}
    >
      Close
    </button>

    <div className="flex items-center gap-2 flex-1 justify-end">
      <button
        type="button"
        onClick={() => {
          onPrintClick?.(apt);
        }}
        className="px-3.5 py-2.5 rounded-xl border border-[#E5E7EB] bg-white text-slate-700 text-xs font-bold hover:bg-slate-50 transition-colors flex items-center gap-1.5 cursor-pointer"
        style={{ fontFamily: PP }}
      >
        <Printer size={14} /> Print Summary
      </button>

      {action === "nurse" ? (
        <button
          type="button"
          onClick={() => {
            onClose();
            onPatientSelect?.(apt.patientId);
          }}
          className="py-2.5 px-4 rounded-xl bg-[#0D47A1] text-white text-xs font-bold hover:bg-[#0c3d8a] transition-colors shadow-sm flex items-center justify-center gap-2"
          style={{ fontFamily: PP }}
        >
          <User size={14} /> View Patient Profile
        </button>
      ) : action === "doctor" ? (
        <button
          type="button"
          onClick={() => {
            onClose();
            onStartConsultation?.(apt.id);
          }}
          className="py-2.5 px-4 rounded-xl bg-[#009688] text-white text-xs font-bold hover:bg-[#00796B] transition-colors shadow-sm flex items-center justify-center gap-2"
          style={{ fontFamily: PP }}
        >
          <Stethoscope size={16} /> Start Consultation
        </button>
      ) : action === "check-in" ? (
        <button
          type="button"
          onClick={handleCheckIn}
          disabled={isCheckingIn}
          className="py-2.5 px-4 rounded-xl bg-[#009688] text-white text-xs font-bold hover:bg-teal-700 transition-colors shadow-sm flex items-center justify-center gap-2 disabled:opacity-50"
          style={{ fontFamily: PP }}
        >
          <CheckCircle2 size={14} />
          {isCheckingIn ? "Checking In..." : "Check-In Patient"}
        </button>
      ) : null}
    </div>
  </div>
);
