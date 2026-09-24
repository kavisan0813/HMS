import { useState, useEffect, useRef } from "react";
import {
  RefreshCw,
  UserPlus,
  PhoneCall,
  Clock,
  CheckCircle2,
  Users,
  PlayCircle,
  Flag,
  ArrowLeft,
} from "lucide-react";
import { useAuthStore } from "../../auth/store/auth.store";
import { doctorsApi } from "../api/doctors.api";
import { appointmentService } from "../../appointments/services/appointment.service";
import { PP, RB } from "../constants/doctors.constants";
import { Pagination } from "../../../common/components/Pagination";
import type {
  DoctorQueueItem,
  DoctorQueueSummary,
} from "../types/doctors.types";

type QueueItemStatus =
  | "WAITING"
  | "WAITING_FOR_VITALS"
  | "WAITING_FOR_DOCTOR_CALL"
  | "CALLED"
  | "IN_CONSULTATION"
  | "COMPLETED"
  | "CANCELLED"
  | "NO_SHOW"
  | string;

const STATUS_META: Record<
  string,
  { label: string; chip: string; row: string }
> = {
  WAITING: {
    label: "Waiting",
    chip: "bg-amber-100 text-amber-700",
    row: "bg-white",
  },
  WAITING_FOR_VITALS: {
    label: "Waiting for Vitals",
    chip: "bg-blue-100 text-[#0D47A1]",
    row: "bg-white",
  },
  WAITING_FOR_DOCTOR: {
    label: "Waiting for Doctor",
    chip: "bg-amber-100 text-amber-700",
    row: "bg-white",
  },
  WAITING_FOR_DOCTOR_CALL: {
    label: "Waiting for Doctor",
    chip: "bg-amber-100 text-amber-700",
    row: "bg-white",
  },
  CHECKED_IN: {
    label: "Waiting for Vitals",
    chip: "bg-blue-100 text-[#0D47A1]",
    row: "bg-white",
  },
  CALLED: {
    label: "Called",
    chip: "bg-purple-100 text-purple-700",
    row: "bg-purple-50/40",
  },
  IN_CONSULTATION: {
    label: "In Consultation",
    chip: "bg-teal-100 text-teal-700",
    row: "bg-teal-50/40",
  },
  COMPLETED: {
    label: "Completed",
    chip: "bg-emerald-100 text-emerald-700",
    row: "bg-slate-50",
  },
  CANCELLED: {
    label: "Cancelled",
    chip: "bg-red-100 text-red-600",
    row: "bg-slate-50",
  },
  NO_SHOW: {
    label: "No Show",
    chip: "bg-red-100 text-red-600",
    row: "bg-slate-50",
  },
};

const statusKey = (status: unknown): QueueItemStatus =>
  String(status || "WAITING")
    .toUpperCase()
    .replace(/[\s-]/g, "_");

export function DoctorQueueScreen() {
  const { user } = useAuthStore();
  const isDoctor = user?.role === "Doctor" || user?.role === "DOCTOR";
  const doctorId =
    user?.doctorId ||
    user?.doctorProfile?.doctorId ||
    (isDoctor ? user?.id : undefined);
  const [queue, setQueue] = useState<{
    summary: DoctorQueueSummary;
    content: DoctorQueueItem[];
  }>({
    summary: {},
    content: [],
  });
  const [isLoading, setIsLoading] = useState(false);
  const [callingNext, setCallingNext] = useState(false);
  const [actionId, setActionId] = useState<number | string | null>(null);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const doctorIdRef = useRef(doctorId);

  const [prevDoctorId, setPrevDoctorId] = useState<number | string | undefined>(
    undefined,
  );
  if (doctorId !== prevDoctorId) {
    setPrevDoctorId(doctorId);
    setIsLoading(Boolean(doctorId));
  }

  const fetchQueue = async () => {
    const id = doctorIdRef.current;
    if (!id) return;
    setIsLoading(true);
    try {
      const data = await doctorsApi.getQueue(id);
      setQueue({
        summary: data.summary || {},
        content: Array.isArray(data.content) ? data.content : [],
      });
    } catch (err) {
      console.log(err);
      setQueue({ summary: {}, content: [] });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    doctorIdRef.current = doctorId;
    if (!doctorId) return;
    let cancelled = false;

    doctorsApi
      .getQueue(doctorId)
      .then((data) => {
        if (!cancelled) {
          setQueue({
            summary: data.summary || {},
            content: Array.isArray(data.content) ? data.content : [],
          });
        }
      })
      .catch(() => {
        if (!cancelled) setQueue({ summary: {}, content: [] });
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [doctorId]);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  };

  const handleCallNext = async () => {
    if (!doctorId || callingNext) return;
    setCallingNext(true);
    try {
      const res = await doctorsApi.callNext(doctorId);
      showToast(
        `Called patient ${res.tokenNumber || res.token || ""} successfully.`,
      );
      fetchQueue();
    } catch (err) {
      console.log(err);
      showToast("Failed to call next patient.");
    } finally {
      setCallingNext(false);
    }
  };

  const handleStartConsultation = async (appointmentId: number | string) => {
    if (!appointmentId || actionId) return;
    setActionId(appointmentId);
    try {
      await appointmentService.doctorStartConsultation(appointmentId);
      showToast("Consultation started. Encounter created.");
      fetchQueue();
    } catch (err) {
      console.log(err);
      showToast("Failed to start consultation.");
    } finally {
      setActionId(null);
    }
  };

  const handleCompleteConsultation = async (appointmentId: number | string) => {
    if (!appointmentId || actionId) return;
    setActionId(appointmentId);
    try {
      await appointmentService.doctorCompleteConsultation(appointmentId);
      showToast("Consultation completed successfully.");
      fetchQueue();
    } catch (err) {
      console.log(err);
      showToast("Failed to complete consultation.");
    } finally {
      setActionId(null);
    }
  };

  const content: DoctorQueueItem[] = (queue.content || []).filter((p) => {
    const key = statusKey(p.status || p.queueStatus);
    return (
      key !== "WAITING_FOR_VITALS" &&
      key !== "CHECKED_IN" &&
      key !== "BOOKED" &&
      key !== "SCHEDULED"
    );
  });
  const waitingCount = content.filter((p) =>
    ["WAITING_FOR_DOCTOR", "WAITING_FOR_DOCTOR_CALL", "WAITING"].includes(
      statusKey(p.status || p.queueStatus),
    ),
  ).length;
  const inProgressCount = content.filter(
    (p) =>
      statusKey(p.status || p.queueStatus) === "IN_CONSULTATION" ||
      statusKey(p.status || p.queueStatus) === "IN_PROGRESS",
  ).length;
  const completedToday = content.filter(
    (p) => statusKey(p.status || p.queueStatus) === "COMPLETED",
  ).length;

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;
  const totalPages = Math.ceil(content.length / pageSize);
  const paginatedContent = content.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize,
  );

  const firstWaitingPatient = content.find((p) =>
    ["WAITING_FOR_DOCTOR", "WAITING_FOR_DOCTOR_CALL", "WAITING"].includes(
      statusKey(p.status || p.queueStatus),
    ),
  );
  const isCallNextBlocked = !firstWaitingPatient;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => window.history.back()}
            className="p-2.5 rounded-xl border border-[#E5E7EB] bg-white hover:bg-slate-50 text-slate-700 transition-colors cursor-pointer shadow-2xs"
            title="Go Back"
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <h1
              className="text-2xl font-bold text-[#111827]"
              style={{ fontFamily: PP }}
            >
              My Queue
            </h1>
            <p
              className="text-sm text-[#64748B] mt-0.5"
              style={{ fontFamily: RB }}
            >
              Call the next patient, start the consultation, and complete the
              visit.
            </p>
          </div>
        </div>
        <button
          onClick={handleCallNext}
          disabled={
            callingNext || waitingCount === 0 || !isDoctor || isCallNextBlocked
          }
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#0D47A1] text-white rounded-xl text-sm font-semibold hover:bg-[#0c3d8a] transition-colors shadow-sm shadow-[#0D47A1]/20 disabled:opacity-50 disabled:cursor-not-allowed"
          style={{ fontFamily: PP }}
          title={
            isCallNextBlocked ? "Next patient is waiting for vitals" : undefined
          }
        >
          {callingNext ? (
            <RefreshCw size={16} className="animate-spin" />
          ) : (
            <PhoneCall size={16} />
          )}
          {callingNext ? "Calling..." : "Call Next Patient"}
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-[#E5E7EB] shadow-sm">
          <div className="flex items-center justify-between">
            <span
              className="text-xs font-semibold text-[#64748B]"
              style={{ fontFamily: PP }}
            >
              Waiting
            </span>
            <div className="w-9 h-9 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600">
              <Clock size={18} />
            </div>
          </div>
          <div
            className="text-2xl font-bold text-[#111827] mt-3"
            style={{ fontFamily: PP }}
          >
            {waitingCount}
          </div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-[#E5E7EB] shadow-sm">
          <div className="flex items-center justify-between">
            <span
              className="text-xs font-semibold text-[#64748B]"
              style={{ fontFamily: PP }}
            >
              In Consultation
            </span>
            <div className="w-9 h-9 rounded-xl bg-teal-50 flex items-center justify-center text-teal-600">
              <UserPlus size={18} />
            </div>
          </div>
          <div
            className="text-2xl font-bold text-[#111827] mt-3"
            style={{ fontFamily: PP }}
          >
            {inProgressCount}
          </div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-[#E5E7EB] shadow-sm">
          <div className="flex items-center justify-between">
            <span
              className="text-xs font-semibold text-[#64748B]"
              style={{ fontFamily: PP }}
            >
              Completed Today
            </span>
            <div className="w-9 h-9 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600">
              <CheckCircle2 size={18} />
            </div>
          </div>
          <div
            className="text-2xl font-bold text-[#111827] mt-3"
            style={{ fontFamily: PP }}
          >
            {completedToday}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-[#E5E7EB] shadow-sm">
        <div className="p-6 border-b border-[#E5E7EB]">
          <h2
            className="text-lg font-bold text-[#111827]"
            style={{ fontFamily: PP }}
          >
            Queue List
          </h2>
        </div>
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <RefreshCw size={20} className="animate-spin text-[#0D47A1]" />
          </div>
        ) : content.length === 0 ? (
          <div className="text-center py-12">
            <Users size={40} className="mx-auto text-slate-300 mb-3" />
            <p className="text-sm text-[#64748B]" style={{ fontFamily: RB }}>
              No patients in queue.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-[#E5E7EB]">
            {paginatedContent.map((patient, idx) => {
              const key = statusKey(patient.status || patient.queueStatus);
              const meta = STATUS_META[key] || {
                label: key.replace(/_/g, " "),
                chip: "bg-slate-100 text-slate-600",
                row: "bg-white",
              };
              const patientDisplayName =
                patient.patientName ||
                patient.patient?.name ||
                "Unknown Patient";
              const patientMrn =
                patient.mrn || patient.patient?.mrn || patient.patientId || "";
              const tokenNo =
                patient.tokenNumber ||
                patient.token ||
                (patient.patient ? `#${idx + 1}` : "");
              const appointmentId =
                patient.appointmentId ?? patient.id ?? patient.queueId;
              const isActionBusy = actionId === appointmentId;

              return (
                <div
                  key={
                    patient.queueId ||
                    patient.appointmentId ||
                    patient.appointmentNumber ||
                    patient.id ||
                    patient.patientId ||
                    patientMrn ||
                    patientDisplayName
                  }
                  className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 ${meta.row}`}
                >
                  <div className="flex items-center gap-4">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${
                        key === "CALLED" || key === "IN_CONSULTATION"
                          ? "bg-[#0D47A1] text-white"
                          : "bg-slate-200 text-slate-700"
                      }`}
                    >
                      {patientDisplayName[0]}
                    </div>
                    <div>
                      <div
                        className="text-sm font-bold text-[#111827]"
                        style={{ fontFamily: PP }}
                      >
                        {patientDisplayName}
                      </div>
                      <div
                        className="text-xs text-[#64748B] font-mono"
                        style={{ fontFamily: RB }}
                      >
                        {patientMrn ? `${patientMrn} · ` : ""}Token {tokenNo}
                        {appointmentId ? ` · Apt #${appointmentId}` : ""}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 flex-wrap">
                    <span
                      className={`px-3 py-1 rounded-full text-[10px] font-bold ${meta.chip}`}
                      style={{ fontFamily: PP }}
                    >
                      {meta.label}
                    </span>
                    {key === "CALLED" && (
                      <button
                        onClick={() => handleStartConsultation(appointmentId)}
                        disabled={!appointmentId || isActionBusy}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-teal-600 text-white text-[11px] font-bold hover:bg-teal-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isActionBusy ? (
                          <RefreshCw size={12} className="animate-spin" />
                        ) : (
                          <PlayCircle size={13} />
                        )}
                        Start Consultation
                      </button>
                    )}
                    {key === "IN_CONSULTATION" && (
                      <button
                        onClick={() =>
                          handleCompleteConsultation(appointmentId)
                        }
                        disabled={!appointmentId || isActionBusy}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 text-white text-[11px] font-bold hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isActionBusy ? (
                          <RefreshCw size={12} className="animate-spin" />
                        ) : (
                          <Flag size={13} />
                        )}
                        Complete Consultation
                      </button>
                    )}
                    {patient.estimatedWaitMinutes !== undefined && (
                      <span
                        className="text-xs text-[#64748B]"
                        style={{ fontFamily: RB }}
                      >
                        <Clock size={12} className="inline mr-1" />
                        {patient.estimatedWaitMinutes} min
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
        {content.length > 0 && (
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
            pageSize={pageSize}
            totalCount={content.length}
          />
        )}
      </div>

      {toastMsg && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 bg-[#111827] text-white px-5 py-3 rounded-2xl shadow-2xl border border-slate-700 transition-transform duration-200">
          <CheckCircle2 className="w-5 h-5 text-[#66BB6A] shrink-0" />
          <span className="text-xs font-semibold" style={{ fontFamily: PP }}>
            {toastMsg}
          </span>
        </div>
      )}
    </div>
  );
}
