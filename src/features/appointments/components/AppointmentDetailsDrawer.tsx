import { useState, useEffect } from "react";
import type { AppointmentRecord } from "../types/appointment.types";
import type { UserRole } from "../types/appointment-screen.types";
import {
  PP,
  RB,
  appointmentToPatientSummary,
} from "../constants/appointment.constants";
import { appointmentService } from "../services/appointment.service";
import {
  DrawerAppointmentSection,
  DrawerClinicalSection,
  DrawerDoctorSection,
  DrawerFooter,
  DrawerHeader,
  DrawerPatientSection,
  DrawerSummary,
  DrawerTimelineSection,
} from "./Appointment/Appoinment";

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

interface TimelineEventItem {
  title: string;
  timestamp: string;
  by: string;
  status: string;
}

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
      } catch (err) {
        console.log(err);
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
