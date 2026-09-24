import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router";
import {
  Clock,
  MapPin,
  Phone,
  AlertCircle,
  CheckCircle2,
  RefreshCw,
  Calendar,
  Stethoscope,
  Timer,
  ChevronRight,
} from "lucide-react";
import { patientsApi } from "../api/patient.api";
import { PP, RB } from "../constants/patient.fonts";
import { usePatientPortal } from "../context/usePatientPortal";
import { ROUTES } from "../../../app/routes/routes";

type QueueStatus = {
  appointmentId: number;
  token: string;
  position: number;
  patientsAhead: number;
  estimatedWaitMinutes: number;
  status: string;
  doctorName: string;
  departmentName: string;
} | null;

export function PatientQueueStatusScreen() {
  const navigate = useNavigate();
  const portal = usePatientPortal();
  const activeMrn = portal?.activeMrn;
  const [queueStatus, setQueueStatus] = useState<QueueStatus>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const triggerToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  };

  const loadQueueData = useCallback(async () => {
    if (!activeMrn) return null;
    const data = await patientsApi.getPatientQueue(activeMrn);
    if (!data) return null;
    const queue = data as Record<string, unknown>;
    return {
      appointmentId: Number(queue.appointmentId || 0),
      token: String(queue.token || queue.tokenNumber || "—"),
      position: Number(queue.position ?? 0),
      patientsAhead: Number(queue.patientsAhead ?? 0),
      estimatedWaitMinutes: Number(queue.estimatedWaitMinutes ?? 0),
      status: String(queue.status || queue.queueStatus || "WAITING"),
      doctorName: String(queue.doctorName || "—"),
      departmentName: String(queue.departmentName || "—"),
    };
  }, [activeMrn]);

  const fetchQueue = useCallback(async () => {
    setIsLoading(true);
    try {
      const result = await loadQueueData();
      setQueueStatus(result);
    } catch (err) {
      console.log(err);
      setQueueStatus(null);
    } finally {
      setIsLoading(false);
    }
  }, [loadQueueData]);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const result = await loadQueueData();
        if (!cancelled) setQueueStatus(result);
      } catch (err) {
        console.log(err);
        if (!cancelled) setQueueStatus(null);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [loadQueueData]);

  const statusColor =
    queueStatus?.status === "WAITING"
      ? "text-amber-600 bg-amber-50 border-amber-200"
      : queueStatus?.status === "CALLED"
        ? "text-[#009688] bg-teal-50 border-teal-200"
        : queueStatus?.status === "IN_CONSULTATION"
          ? "text-[#0D47A1] bg-blue-50 border-blue-200"
          : "text-slate-600 bg-slate-50 border-slate-200";

  return (
    <div
      className="flex-1 overflow-y-auto p-6 space-y-6 bg-[#F1F5F9]"
      style={{ fontFamily: RB }}
    >
      {toastMsg && (
        <div className="fixed top-5 right-5 z-50 bg-[#111827] text-white text-xs font-semibold px-4 py-3 rounded-xl shadow-xl flex items-center gap-2 transition-opacity duration-200">
          <CheckCircle2 size={16} className="text-[#66BB6A]" />
          <span>{toastMsg}</span>
        </div>
      )}

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1
            className="text-xl font-bold text-[#111827]"
            style={{ fontFamily: PP }}
          >
            My Queue Status
          </h1>
          <p
            className="text-xs text-[#64748B] mt-0.5"
            style={{ fontFamily: RB }}
          >
            View your current queue token, position, and estimated wait time.
          </p>
          <div
            className="flex items-center gap-1.5 text-xs text-[#64748B] mt-1"
            style={{ fontFamily: RB }}
          >
            <button
              type="button"
              onClick={() => navigate(ROUTES.DASHBOARD)}
              className="hover:text-[#0D47A1] transition-colors font-medium cursor-pointer"
            >
              Patient Portal
            </button>
            <ChevronRight size={13} className="text-slate-300" />
            <span className="font-medium text-[#111827]">Queue Status</span>
          </div>
        </div>
        <button
          onClick={fetchQueue}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-[#E5E7EB] text-xs font-semibold text-[#111827] hover:bg-slate-50 transition-colors shadow-sm"
        >
          <RefreshCw size={14} /> Refresh
        </button>
      </div>

      {isLoading ? (
        <div className="text-center text-xs text-slate-500 py-12">
          Loading queue status...
        </div>
      ) : !queueStatus ? (
        <div className="bg-white rounded-2xl border border-[#E5E7EB] p-12 text-center shadow-sm">
          <Clock size={32} className="mx-auto text-slate-300 mb-3" />
          <h3 className="text-sm font-bold text-[#111827]">No active queue</h3>
          <p className="text-xs text-[#64748B] mt-1">
            You are not currently in the queue. Book an appointment to join.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white p-6 rounded-2xl border border-[#E5E7EB] shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <h3
                  className="text-sm font-bold text-[#111827]"
                  style={{ fontFamily: PP }}
                >
                  Current Queue Position
                </h3>
                <span
                  className={`px-3 py-1 rounded-full text-xs font-bold border ${statusColor}`}
                >
                  {queueStatus.status.replace(/_/g, " ")}
                </span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 text-center">
                  <div className="text-xs text-[#64748B] mb-1">
                    Token Number
                  </div>
                  <div
                    className="text-2xl font-bold text-[#0D47A1]"
                    style={{ fontFamily: PP }}
                  >
                    {queueStatus.token}
                  </div>
                </div>
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 text-center">
                  <div className="text-xs text-[#64748B] mb-1">Position</div>
                  <div
                    className="text-2xl font-bold text-[#111827]"
                    style={{ fontFamily: PP }}
                  >
                    #{queueStatus.position}
                  </div>
                </div>
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 text-center">
                  <div className="text-xs text-[#64748B] mb-1">
                    Ahead of You
                  </div>
                  <div
                    className="text-2xl font-bold text-amber-600"
                    style={{ fontFamily: PP }}
                  >
                    {queueStatus.patientsAhead}
                  </div>
                </div>
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 text-center">
                  <div className="text-xs text-[#64748B] mb-1">Est. Wait</div>
                  <div
                    className="text-2xl font-bold text-[#009688]"
                    style={{ fontFamily: PP }}
                  >
                    {queueStatus.estimatedWaitMinutes}
                    <span className="text-xs font-medium text-slate-500 ml-1">
                      min
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-[#E5E7EB] shadow-sm space-y-3">
              <h3
                className="text-sm font-bold text-[#111827]"
                style={{ fontFamily: PP }}
              >
                Appointment Details
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="flex items-center gap-2">
                  <Stethoscope size={14} className="text-[#0D47A1]" />
                  <span className="text-[#64748B]">Doctor:</span>
                  <span className="font-semibold text-[#111827]">
                    {queueStatus.doctorName}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin size={14} className="text-[#EF4444]" />
                  <span className="text-[#64748B]">Department:</span>
                  <span className="font-semibold text-[#111827]">
                    {queueStatus.departmentName}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar size={14} className="text-[#009688]" />
                  <span className="text-[#64748B]">Appointment ID:</span>
                  <span className="font-mono font-semibold text-[#111827]">
                    {queueStatus.appointmentId}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Timer size={14} className="text-[#F59E0B]" />
                  <span className="text-[#64748B]">Status:</span>
                  <span className="font-semibold text-[#111827]">
                    {queueStatus.status.replace(/_/g, " ")}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="bg-white p-5 rounded-2xl border border-[#E5E7EB] shadow-sm space-y-3">
              <h3
                className="text-xs font-bold text-[#111827] uppercase tracking-wider"
                style={{ fontFamily: PP }}
              >
                Queue Guidelines
              </h3>
              <div className="space-y-2 text-xs text-[#64748B]">
                <div className="flex items-start gap-2">
                  <CheckCircle2
                    size={14}
                    className="text-[#66BB6A] mt-0.5 shrink-0"
                  />
                  <span>
                    Arrive at the hospital at least 15 minutes before your
                    estimated time.
                  </span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle2
                    size={14}
                    className="text-[#66BB6A] mt-0.5 shrink-0"
                  />
                  <span>Carry your token number and valid ID proof.</span>
                </div>
                <div className="flex items-start gap-2">
                  <AlertCircle
                    size={14}
                    className="text-amber-500 mt-0.5 shrink-0"
                  />
                  <span>
                    If you miss your turn, please inform the reception desk
                    immediately.
                  </span>
                </div>
              </div>
            </div>
            <div className="bg-white p-5 rounded-2xl border border-[#E5E7EB] shadow-sm space-y-3">
              <h3
                className="text-xs font-bold text-[#111827] uppercase tracking-wider"
                style={{ fontFamily: PP }}
              >
                Need Help?
              </h3>
              <p className="text-xs text-[#64748B]">
                Contact the reception desk for queue-related queries.
              </p>
              <button
                onClick={() => triggerToast("Calling reception desk...")}
                className="w-full py-2 rounded-xl bg-[#0D47A1] text-white text-xs font-bold hover:bg-[#0c3d8a] transition-colors flex items-center justify-center gap-2"
              >
                <Phone size={14} /> Contact Reception
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
