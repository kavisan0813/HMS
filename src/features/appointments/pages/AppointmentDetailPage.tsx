import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router";
import {
  ChevronLeft,
  ChevronRight,
  User,
  Calendar,
  Stethoscope,
  FileText,
  AlertTriangle,
  Clock,
  Check,
  Printer,
} from "lucide-react";
import { ROUTES } from "../../../app/routes/routes";
import { PP, RB } from "../constants/appointment.constants";
import { appointmentService } from "../services/appointment.service";
import { appointmentToPatientSummary } from "../constants/appointment.constants";
import { StatusBadge } from "../components/StatusBadge";
import { Avatar } from "../components/Avatar";
import type { AppointmentRecord } from "../types/appointment.types";

type DoctorInfo = {
  id: string | number;
  name: string;
  department?: string;
  specialty?: string;
  opdRoom?: string;
};

type TimelineStep = {
  title: string;
  timestamp: string;
  by: string;
  status: "completed" | "active" | "upcoming";
};

const AppointmentDetailHeader = ({
  navigate,
  apt,
}: {
  navigate: ReturnType<typeof useNavigate>;
  apt: AppointmentRecord;
}) => (
  <div>
    <div className="flex items-center gap-2 mb-1">
      <button
        aria-label="Previous"
        onClick={() => navigate(ROUTES.APPOINTMENTS)}
        className="p-1.5 -ml-1.5 text-slate-400 hover:text-[#0D47A1] hover:bg-blue-50 rounded-lg transition-colors"
      >
        <ChevronLeft size={20} />
      </button>
      <h1
        className="text-xl font-bold text-[#111827]"
        style={{ fontFamily: PP }}
      >
        Appointment Details
      </h1>
    </div>
    <div
      className="flex items-center gap-1.5 text-xs text-slate-500 pl-8"
      style={{ fontFamily: RB }}
    >
      <span>Appointments</span>
      <ChevronRight size={13} className="text-slate-300" />
      <span className="font-semibold text-[#111827]">{apt.id}</span>
    </div>
  </div>
);

const AppointmentSummary = ({ apt }: { apt: AppointmentRecord }) => (
  <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 space-y-2.5">
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <span className="font-mono text-sm font-bold text-[#0D47A1]">
          {apt.id}
        </span>
        <span className="text-xs text-slate-400 font-mono">
          ({apt.tokenNo})
        </span>
      </div>
      <StatusBadge status={apt.status} />
    </div>
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
      <div className="bg-slate-50 p-2 rounded-xl border border-slate-200/80">
        <span className="text-[10px] text-slate-400 block font-medium">
          Date
        </span>
        <strong className="text-[#111827]">{apt.appointmentDate}</strong>
      </div>
      <div className="bg-slate-50 p-2 rounded-xl border border-slate-200/80">
        <span className="text-[10px] text-slate-400 block font-medium">
          Time Slot
        </span>
        <strong className="text-[#0D47A1] font-mono">{apt.timeSlot}</strong>
      </div>
      <div className="bg-slate-50 p-2 rounded-xl border border-slate-200/80">
        <span className="text-[10px] text-slate-400 block font-medium">
          Visit Type
        </span>
        <span className="font-bold text-[#009688]">{apt.visitType}</span>
      </div>
      <div className="bg-slate-50 p-2 rounded-xl border border-slate-200/80">
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

const AppointmentPatientSection = ({
  navigate,
  patientInfo,
}: {
  navigate: ReturnType<typeof useNavigate>;
  patientInfo: ReturnType<typeof appointmentToPatientSummary>;
}) => (
  <div className="bg-white p-5 rounded-2xl border border-[#E5E7EB] shadow-sm space-y-4">
    <div className="flex items-center justify-between border-b border-gray-100 pb-3 flex-wrap gap-2">
      <h3
        className="text-xs font-bold text-[#111827] uppercase tracking-wider flex items-center gap-2"
        style={{ fontFamily: PP }}
      >
        <User size={15} className="text-[#0D47A1]" /> Patient Information
      </h3>
      <button
        onClick={() => navigate(`/patients/profile/${patientInfo.mrn}`)}
        className="px-3 py-1.5 rounded-xl bg-blue-50 text-[#0D47A1] border border-blue-100 text-xs font-bold hover:bg-blue-100 transition-colors flex items-center gap-1.5"
        style={{ fontFamily: PP }}
      >
        <User size={13} /> View Patient Profile
      </button>
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
          <span className="text-[#0D47A1] font-bold">{patientInfo.mrn}</span> ·
          ID: {patientInfo.id}
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
    </div>
  </div>
);

const AppointmentDoctorSection = ({
  doctorInfo,
}: {
  doctorInfo: DoctorInfo;
}) => (
  <div className="bg-white p-5 rounded-2xl border border-[#E5E7EB] shadow-sm space-y-4">
    <h3
      className="text-xs font-bold text-[#111827] uppercase tracking-wider border-b border-gray-100 pb-3 flex items-center gap-2"
      style={{ fontFamily: PP }}
    >
      <Stethoscope size={15} className="text-[#0D47A1]" /> Doctor Information
    </h3>
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
      <div className="col-span-2 sm:col-span-1">
        <span className="text-slate-400 text-[10px] block font-medium">
          Attending Doctor
        </span>
        <strong className="text-[#111827] text-sm">{doctorInfo.name}</strong>
      </div>
      <div>
        <span className="text-slate-400 text-[10px] block font-medium">
          Department
        </span>
        <strong className="text-[#0D47A1]">{doctorInfo.department}</strong>
      </div>
      <div>
        <span className="text-slate-400 text-[10px] block font-medium">
          Room Number
        </span>
        <strong className="text-[#009688]">{doctorInfo.opdRoom}</strong>
      </div>
    </div>
  </div>
);

const AppointmentClinicalSection = ({ apt }: { apt: AppointmentRecord }) => (
  <div className="bg-white p-5 rounded-2xl border border-[#E5E7EB] shadow-sm space-y-4">
    <h3
      className="text-xs font-bold text-[#111827] uppercase tracking-wider border-b border-gray-100 pb-3 flex items-center gap-2"
      style={{ fontFamily: PP }}
    >
      <FileText size={15} className="text-[#009688]" /> Clinical Preparation
    </h3>
    <div className="space-y-2 text-xs">
      <div>
        <span className="text-slate-400 text-[10px] block font-medium mb-1">
          Chief Complaint
        </span>
        <div className="p-3 bg-amber-50/80 border border-amber-100 rounded-xl text-amber-950 font-medium">
          {apt.chiefComplaint || "No chief complaint recorded."}
        </div>
      </div>
    </div>
  </div>
);

const AppointmentTimeline = ({
  timelineSteps,
}: {
  timelineSteps: TimelineStep[];
}) => (
  <div className="bg-white p-5 rounded-2xl border border-[#E5E7EB] shadow-sm space-y-4">
    <h3
      className="text-xs font-bold text-[#111827] uppercase tracking-wider border-b border-gray-100 pb-3 flex items-center gap-2"
      style={{ fontFamily: PP }}
    >
      <Clock size={15} className="text-[#0D47A1]" /> Appointment Timeline
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

const AppointmentDetailActions = ({
  navigate,
}: {
  navigate: ReturnType<typeof useNavigate>;
}) => (
  <div className="flex items-center justify-between">
    <button
      onClick={() => navigate(ROUTES.APPOINTMENTS)}
      className="px-5 py-2.5 rounded-xl border border-[#E5E7EB] text-xs font-semibold text-[#64748B] hover:bg-slate-100 transition-colors"
      style={{ fontFamily: RB }}
    >
      Back to Appointments
    </button>
    <button
      onClick={() => window.print()}
      className="px-3.5 py-2.5 rounded-xl border border-[#E5E7EB] bg-white text-slate-700 text-xs font-bold hover:bg-slate-50 transition-colors flex items-center gap-1.5"
      style={{ fontFamily: PP }}
    >
      <Printer size={14} /> Print Summary
    </button>
  </div>
);

export function AppointmentDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [apt, setApt] = useState<AppointmentRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<
    "all" | "patient" | "appointment" | "clinical" | "alerts" | "timeline"
  >("all");

  useEffect(() => {
    if (!id) return;
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const data = await appointmentService.getAppointment(String(id));
        if (cancelled) return;
        if (!cancelled) {
          if (data) {
            setApt(data);
          } else {
            setError("Appointment not found.");
          }
        }
      } catch (err) {
        console.log(err);
        if (!cancelled) setError("Failed to load appointment details.");
      } finally {
        setLoading(false);
      }
    }

    void load();

    return () => {
      cancelled = true;
    };
  }, [id]);

  if (loading) {
    return (
      <div className="flex-1 overflow-y-auto p-6 bg-[#F1F5F9]">
        <div className="flex items-center justify-center h-64 text-xs text-[#64748B]">
          Loading appointment details...
        </div>
      </div>
    );
  }

  if (error || !apt) {
    return (
      <div className="flex-1 overflow-y-auto p-6 bg-[#F1F5F9]">
        <div className="text-center space-y-4">
          <p className="text-sm text-red-500">
            {error || "Appointment not found."}
          </p>
          <button
            onClick={() => navigate(ROUTES.APPOINTMENTS)}
            className="px-4 py-2 rounded-xl bg-[#0D47A1] text-white text-xs font-bold hover:bg-[#0c3d8a] transition-colors"
          >
            Back to Appointments
          </button>
        </div>
      </div>
    );
  }

  const patientInfo = appointmentToPatientSummary(apt);
  const doctorInfo = apt.doctor || {
    id: apt.doctorId || "DOC-402",
    name: apt.doctorName,
    department:
      typeof apt.department === "string"
        ? apt.department
        : apt.department?.departmentName ||
          apt.department?.name ||
          apt.department?.departmentCode ||
          "",
    specialty: apt.doctorSpecialty || "Senior Specialist",
    opdRoom: apt.opdRoom || "Room 104 - Wing A",
  };

  const timelineSteps: TimelineStep[] = [
    {
      title: "Appointment Booked",
      timestamp: `${apt.createdDate} 09:15 AM`,
      by: "Receptionist Desk",
      status: "completed",
    },
    {
      title: "Patient Checked-In",
      timestamp: `${apt.appointmentDate} 08:42 AM`,
      by: "Triage Nurse Desk",
      status: "completed",
    },
    {
      title: "Waiting in OPD Queue",
      timestamp: `${apt.appointmentDate} 08:50 AM`,
      by: "OPD Queue System",
      status: "active",
    },
    {
      title: "Ready for Consultation",
      timestamp: `${apt.appointmentDate} 09:00 AM`,
      by: doctorInfo.name || "Doctor",
      status: "upcoming",
    },
  ];

  return (
    <div
      className="flex-1 overflow-y-auto p-6 bg-[#F1F5F9]"
      style={{ fontFamily: RB }}
    >
      <div className="w-full space-y-6">
        <AppointmentDetailHeader navigate={navigate} apt={apt} />
        <AppointmentSummary apt={apt} />

        {/* Navigation Tabs */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
          <div className="border-b border-gray-100 px-6 flex items-center gap-4 sm:gap-6 text-xs font-semibold overflow-x-auto">
            {(
              [
                { id: "all" as const, label: "All Sections" },
                { id: "patient" as const, label: "Patient Info" },
                { id: "appointment" as const, label: "Appointment" },
                { id: "clinical" as const, label: "Clinical Prep" },
                { id: "alerts" as const, label: "Patient Alerts" },
                { id: "timeline" as const, label: "Timeline" },
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

          <div className="p-6 space-y-5">
            {(activeTab === "all" || activeTab === "patient") && (
              <AppointmentPatientSection
                navigate={navigate}
                patientInfo={patientInfo}
              />
            )}

            {(activeTab === "all" || activeTab === "appointment") && (
              <div className="bg-white p-5 rounded-2xl border border-[#E5E7EB] shadow-sm space-y-4">
                <h3
                  className="text-xs font-bold text-[#111827] uppercase tracking-wider border-b border-gray-100 pb-3 flex items-center gap-2"
                  style={{ fontFamily: PP }}
                >
                  <Calendar size={15} className="text-[#0D47A1]" /> Appointment
                  Information
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div>
                    <span className="text-slate-400 text-[10px] block font-medium">
                      Appointment ID
                    </span>
                    <strong className="text-[#0D47A1] font-mono">
                      {apt.id}
                    </strong>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[10px] block font-medium">
                      Appointment Date
                    </span>
                    <strong className="text-[#111827]">
                      {apt.appointmentDate}
                    </strong>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[10px] block font-medium">
                      Appointment Time
                    </span>
                    <strong className="text-[#0D47A1] font-mono">
                      {apt.timeSlot}
                    </strong>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[10px] block font-medium">
                      Status
                    </span>
                    <StatusBadge status={apt.status} />
                  </div>
                </div>
              </div>
            )}

            {(activeTab === "all" || activeTab === "appointment") && (
              <AppointmentDoctorSection doctorInfo={doctorInfo} />
            )}

            {(activeTab === "all" || activeTab === "clinical") && (
              <AppointmentClinicalSection apt={apt} />
            )}

            {(activeTab === "all" || activeTab === "alerts") && (
              <div className="bg-white p-5 rounded-2xl border border-[#E5E7EB] shadow-sm space-y-4">
                <h3
                  className="text-xs font-bold text-[#111827] uppercase tracking-wider border-b border-gray-100 pb-3 flex items-center gap-2"
                  style={{ fontFamily: PP }}
                >
                  <AlertTriangle size={15} className="text-[#EF4444]" /> Patient
                  Alerts
                </h3>
                <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-3">
                  <AlertTriangle
                    size={16}
                    className="text-[#F59E0B] mt-0.5 shrink-0"
                  />
                  <div>
                    <div
                      className="text-xs font-bold text-amber-900"
                      style={{ fontFamily: PP }}
                    >
                      Patient Alerts
                    </div>
                    <div className="text-xs text-amber-800 mt-0.5 font-medium">
                      Review patient medical history and allergies before
                      consultation.
                    </div>
                  </div>
                </div>
              </div>
            )}

            {(activeTab === "all" || activeTab === "timeline") && (
              <AppointmentTimeline timelineSteps={timelineSteps} />
            )}
          </div>
        </div>

        <AppointmentDetailActions navigate={navigate} />
      </div>
    </div>
  );
}
