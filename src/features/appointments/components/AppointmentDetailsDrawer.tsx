import { useState, useEffect } from "react";
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
import type { AppointmentRecord } from "../types/appointment.types";
import type { UserRole } from "../types/appointment-screen.types";
import { StatusBadge } from "./StatusBadge";
import { Avatar } from "./Avatar";
import {
  PP,
  RB,
  appointmentToPatientSummary,
} from "../constants/appointment.constants";
import { appointmentService } from "../services/appointment.service";

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

interface TimelineEventItem {
  title: string;
  timestamp: string;
  by: string;
  status: string;
}

const DrawerHeader = ({ isNurse, isDoctor, onClose }: DrawerHeaderProps) => (
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

const DrawerSummary = ({ apt }: { apt: AppointmentRecord }) => (
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

const DrawerPatientSection = ({
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

const DrawerAppointmentSection = ({ apt }: { apt: AppointmentRecord }) => (
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

const DrawerDoctorSection = ({
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

const DrawerClinicalSection = ({ apt }: { apt: ClinicalAppointment }) => (
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

const DrawerTimelineSection = ({
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

const DrawerFooter = ({
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

type DrawerContentProps = {
  activeTab: "all" | "patient" | "appointment" | "clinical" | "timeline";
  setActiveTab: (
    tab: "all" | "patient" | "appointment" | "clinical" | "timeline",
  ) => void;
  patientInfo: ReturnType<typeof appointmentToPatientSummary>;
  rawPatientInfo: Record<string, unknown>;
  apt: AppointmentRecord;
  doctorInfo: DrawerDoctorInfo;
  timelineSteps: TimelineEventItem[];
  isLoadingTimeline: boolean;
  onPatientSelect?: (id: number | string) => void;
};

const DrawerContent = ({
  activeTab,
  setActiveTab,
  patientInfo,
  rawPatientInfo,
  apt,
  doctorInfo,
  timelineSteps,
  isLoadingTimeline,
  onPatientSelect,
}: DrawerContentProps) => (
  <>
    <div className="bg-white border-b border-[#E5E7EB] px-6 flex items-center gap-4 sm:gap-6 shrink-0 text-xs font-semibold overflow-x-auto">
      {(
        [
          { id: "all", label: "All Sections" },
          { id: "patient", label: "Patient Info" },
          { id: "appointment", label: "Appointment" },
          { id: "clinical", label: "Clinical Prep" },
          { id: "timeline", label: "Timeline" },
        ] as const
      ).map((tab) => (
        <button
          key={tab.id}
          onClick={() => setActiveTab(tab.id)}
          className={`py-3 border-b-2 transition-colors whitespace-nowrap ${
            activeTab === tab.id
              ? "border-[#0D47A1] text-[#0D47A1]"
              : "border-transparent text-slate-500 hover:text-slate-700"
          }`}
          style={{ fontFamily: PP }}
        >
          {tab.label}
        </button>
      ))}
    </div>

    <div
      className="flex-1 overflow-y-auto p-6 space-y-5 bg-[#F1F5F9]/50"
      style={{ fontFamily: RB }}
    >
      {(activeTab === "all" || activeTab === "patient") && (
        <DrawerPatientSection
          patientInfo={patientInfo}
          rawPatientInfo={rawPatientInfo}
          apt={apt}
          onPatientSelect={onPatientSelect}
        />
      )}

      {(activeTab === "all" || activeTab === "appointment") && (
        <DrawerAppointmentSection apt={apt} />
      )}

      {(activeTab === "all" || activeTab === "appointment") && (
        <DrawerDoctorSection doctorInfo={doctorInfo} />
      )}

      {(activeTab === "all" || activeTab === "clinical") && (
        <DrawerClinicalSection apt={apt} />
      )}

      {(activeTab === "all" || activeTab === "timeline") && (
        <DrawerTimelineSection
          timelineSteps={timelineSteps}
          isLoadingTimeline={isLoadingTimeline}
        />
      )}
    </div>
  </>
);

export function AppointmentDetailsDrawer({
  apt,
  isOpen,
  onClose,
  onEditClick,
  onPrintClick,
  onPatientSelect,
  isDetailsLoading,
  userRole = "Receptionist",
  onCheckInSuccess,
  onError,
  onStartConsultation,
}: {
  apt: AppointmentRecord | null;
  isOpen: boolean;
  onClose: () => void;
  onEditClick: (apt: AppointmentRecord) => void;
  onPrintClick: (apt: AppointmentRecord) => void;
  onPatientSelect?: (id: number | string) => void;
  isDetailsLoading?: boolean;
  userRole?: UserRole;
  onStartConsultation?: (aptId?: string | number) => void;
  onCheckInSuccess?: (token?: string) => void;
  onError?: (message: string) => void;
}) {
  void isDetailsLoading;
  const [activeTab, setActiveTab] = useState<
    "all" | "patient" | "appointment" | "clinical" | "timeline"
  >("all");
  const [isCheckingIn, setIsCheckingIn] = useState(false);

  const [apiTimelineEvents, setApiTimelineEvents] = useState<
    TimelineEventItem[]
  >([]);
  const [isLoadingTimeline, setIsLoadingTimeline] = useState(false);

  useEffect(() => {
    if (!isOpen || !apt?.id) return;
    let cancelled = false;
    const aptId = apt.id;
    const aptApptDate = apt.appointmentDate;

    async function loadTimeline() {
      setIsLoadingTimeline(true);
      try {
        const res = await appointmentService.getQueueTimeline(aptId);
        if (cancelled) return;
        const resData = (res as { data?: unknown })?.data ?? res;
        const events = Array.isArray(resData)
          ? resData
          : Array.isArray((resData as { events?: unknown[] })?.events)
            ? (resData as { events: unknown[] }).events
            : [];

        if (!cancelled) {
          if (events.length > 0) {
            const mapped = events.map((evtItem: unknown) => {
              const e = (evtItem as Record<string, unknown>) || {};
              const title = String(
                e.remarks ||
                  e.eventType ||
                  e.newStatus ||
                  "Queue Event Updated",
              );
              const roleStr = e.role ? ` (${e.role})` : "";
              const by = `${e.performedBy || "System"}${roleStr}`;
              const timeRaw = String(e.timestamp || e.createdDate || "");
              const formattedTime = timeRaw
                ? timeRaw.includes("T")
                  ? timeRaw.replace("T", " ").slice(0, 19)
                  : timeRaw
                : aptApptDate;

              return {
                title,
                timestamp: formattedTime,
                by,
                status: "completed",
              };
            });
            setApiTimelineEvents(mapped);
          } else {
            setApiTimelineEvents([]);
          }
        }
      } catch {
        if (!cancelled) {
          setApiTimelineEvents([]);
        }
      } finally {
        setIsLoadingTimeline(false);
      }
    }

    void loadTimeline();

    return () => {
      cancelled = true;
    };
  }, [isOpen, apt?.id, apt?.appointmentDate]);

  if (!isOpen || !apt) return null;

  const isDoctor = userRole === "Doctor";
  const isNurse = userRole === "Nurse";
  const canCheckIn =
    !isDoctor &&
    !isNurse &&
    (userRole === "Receptionist" ||
      userRole === "Hospital Admin" ||
      userRole === "Admin" ||
      userRole === "Super Admin");
  const showCheckInButton =
    canCheckIn &&
    (apt.status === "Booked" ||
      apt.status === "Scheduled" ||
      apt.status === "BOOKED");

  const footerAction: DrawerFooterAction = isNurse
    ? "nurse"
    : isDoctor
      ? "doctor"
      : showCheckInButton
        ? "check-in"
        : "edit";

  const handleCheckIn = async () => {
    if (!apt) return;
    setIsCheckingIn(true);
    try {
      const res = await appointmentService.receptionCheckIn(apt.id);
      const tokenNo =
        (res as unknown as { tokenNumber?: string })?.tokenNumber ||
        `TK-${apt.id}`;
      onCheckInSuccess?.(tokenNo);
      onClose();
    } catch (err) {
      const error = err as Error | null | undefined;
      const msg =
        error?.message || "Check-in is only allowed on the appointment date.";
      onError?.(msg);
    } finally {
      setIsCheckingIn(false);
    }
  };

  const rawApt = apt as unknown as Record<string, unknown>;
  const patientObj = ((apt.patient as unknown as Record<string, unknown>) ||
    {}) as Record<string, unknown>;

  const patientInfo = {
    id:
      apt.patientId ||
      (patientObj.id as string | number) ||
      (rawApt.patientId as string | number) ||
      "—",
    mrn:
      apt.patientMrn ||
      apt.mrn ||
      (patientObj.mrn as string) ||
      (rawApt.mrn as string) ||
      "—",
    name:
      apt.patientName ||
      (patientObj.fullName as string) ||
      (patientObj.name as string) ||
      (rawApt.patientName as string) ||
      "Patient",
    age:
      apt.patientAge ||
      (patientObj.age as number) ||
      (rawApt.age as number) ||
      0,
    gender:
      (apt.patientGender as "Male" | "Female" | "Other") ||
      (patientObj.gender as "Male" | "Female" | "Other") ||
      (rawApt.gender as "Male" | "Female" | "Other") ||
      "Other",
    bloodGroup:
      (patientObj.bloodGroup as string) ||
      (patientObj.blood_group as string) ||
      (rawApt.bloodGroup as string) ||
      (rawApt.patientBloodGroup as string) ||
      (rawApt.blood_group as string) ||
      "Not Specified",
    phone:
      apt.patientPhone ||
      (patientObj.phone as string) ||
      (patientObj.mobile as string) ||
      (patientObj.contact as string) ||
      (rawApt.patientPhone as string) ||
      (rawApt.phone as string) ||
      (rawApt.mobile as string) ||
      "Not Provided",
    emergencyContact:
      (patientObj.emergencyContact as string) ||
      (patientObj.emergencyPhone as string) ||
      (patientObj.emergencyMobile as string) ||
      (rawApt.emergencyContact as string) ||
      (rawApt.emergencyPhone as string) ||
      "Not Provided",
    allergies:
      (patientObj.allergies as string) ||
      (rawApt.allergies as string) ||
      "None reported",
    assignedDoctor: apt.doctorName || (rawApt.doctorName as string) || "",
  };

  const rawPatientInfo = patientInfo as unknown as Record<string, unknown>;

  const doctorObj = ((apt.doctor as unknown as Record<string, unknown>) ||
    {}) as Record<string, unknown>;

  const rawFee =
    (doctorObj.consultationFee as string | number) ||
    (doctorObj.fee as string | number) ||
    (rawApt.consultationFee as string | number) ||
    (rawApt.billingAmount as string | number) ||
    (rawApt.fee as string | number);

  const formattedFee = rawFee
    ? typeof rawFee === "number"
      ? `₹${rawFee}`
      : String(rawFee).startsWith("₹")
        ? String(rawFee)
        : `₹${rawFee}`
    : "Standard Fee";

  const doctorInfo = {
    id:
      apt.doctorId ||
      (doctorObj.id as string | number) ||
      (doctorObj.doctorId as string | number) ||
      (rawApt.doctorId as string | number) ||
      "—",
    name:
      apt.doctorName ||
      (doctorObj.name as string) ||
      (doctorObj.fullName as string) ||
      (rawApt.doctorName as string) ||
      "Consultant",
    department:
      apt.departmentName ||
      (typeof apt.department === "string"
        ? apt.department
        : apt.department?.departmentName ||
          apt.department?.name ||
          apt.department?.departmentCode) ||
      (doctorObj.department as string) ||
      (rawApt.departmentName as string) ||
      (rawApt.department as string) ||
      "General OPD",
    specialty:
      apt.doctorSpecialty ||
      apt.specialty ||
      (doctorObj.specialty as string) ||
      (doctorObj.primarySpecialty as unknown as { specialtyName?: string })
        ?.specialtyName ||
      (doctorObj.specialization as string) ||
      (rawApt.specialty as string) ||
      (rawApt.doctorSpecialty as string) ||
      "General Physician",
    qualification:
      (doctorObj.qualification as string) ||
      (rawApt.qualification as string) ||
      "MBBS",
    consultationFee: formattedFee,
    opdRoom: "",
  };

  const timelineSteps =
    apiTimelineEvents.length > 0
      ? apiTimelineEvents
      : [
          {
            title: "Appointment Booked",
            timestamp: `${apt.createdDate || apt.appointmentDate} ${apt.timeSlot || ""}`,
            by:
              (apt as AppointmentRecord & { bookingChannel?: string })
                .bookingChannel || "Reception Desk",
            status: "completed",
          },
          ...(apt.status === "Checked-In" ||
          apt.status === "In Consultation" ||
          apt.status === "Completed"
            ? [
                {
                  title: "Patient Checked-In",
                  timestamp: `${apt.appointmentDate} ${apt.timeSlot || ""}`,
                  by: "Triage / Reception Desk",
                  status: "completed",
                },
              ]
            : []),
          ...(apt.status === "In Consultation" || apt.status === "Completed"
            ? [
                {
                  title: "In Consultation",
                  timestamp: `${apt.appointmentDate} ${apt.timeSlot || ""}`,
                  by: doctorInfo.name || "Attending Doctor",
                  status:
                    apt.status === "In Consultation" ? "active" : "completed",
                },
              ]
            : []),
          ...(apt.status === "Completed"
            ? [
                {
                  title: "Consultation Completed",
                  timestamp: `${apt.appointmentDate}`,
                  by: doctorInfo.name || "Attending Doctor",
                  status: "completed",
                },
              ]
            : []),
        ];

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      <div
        role="presentation"
        className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm"
        onClick={onClose}
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-6 sm:pl-10">
        <div className="w-screen max-w-2xl bg-white shadow-2xl flex flex-col border-l border-gray-100 transition-transform duration-200">
          <DrawerHeader
            isNurse={isNurse}
            isDoctor={isDoctor}
            onClose={onClose}
          />

          <DrawerSummary apt={apt} />

          <DrawerContent
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            patientInfo={patientInfo}
            rawPatientInfo={rawPatientInfo}
            apt={apt}
            doctorInfo={doctorInfo}
            timelineSteps={timelineSteps}
            isLoadingTimeline={isLoadingTimeline}
            onPatientSelect={onPatientSelect}
          />

          <DrawerFooter
            onClose={onClose}
            onPrintClick={onPrintClick}
            apt={apt}
            action={footerAction}
            onPatientSelect={onPatientSelect}
            onStartConsultation={onStartConsultation}
            handleCheckIn={handleCheckIn}
            isCheckingIn={isCheckingIn}
            onEditClick={onEditClick}
          />
        </div>
      </div>
    </div>
  );
}
