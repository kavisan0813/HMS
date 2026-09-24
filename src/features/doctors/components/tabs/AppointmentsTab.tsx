import { useState, useEffect } from "react";
import { ChevronRight } from "lucide-react";
import type {
  DoctorRecord,
  DoctorAppointment,
} from "../../types/doctors.types";
import { PP } from "../../constants/doctors.constants";
import { doctorsService } from "../../services/doctors.service";

import { resolveDoctorId } from "../../services/doctorProfile.service";

export interface AppointmentsTabProps {
  doctor: DoctorRecord;
  canEdit?: boolean;
  isOwnProfile?: boolean;
}

const APPT_STATUS_STYLE: Record<string, string> = {
  Completed: "bg-emerald-50 text-[#66BB6A] border-emerald-200",
  "In Progress": "bg-blue-50 text-[#0D47A1] border-blue-200",
  "Checked-In": "bg-sky-50 text-sky-700 border-sky-200",
  Waiting: "bg-amber-50 text-[#F59E0B] border-amber-200",
  Cancelled: "bg-red-50 text-[#EF4444] border-red-200",
  Scheduled: "bg-slate-100 text-slate-600 border-slate-200",
};

export function AppointmentsTab({
  doctor,
  isOwnProfile = false,
}: AppointmentsTabProps) {
  const [appointments, setAppointments] = useState<DoctorAppointment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const loadAppointments = async () => {
      try {
        const targetId = resolveDoctorId(doctor);
        const data: DoctorAppointment[] =
          await doctorsService.listDoctorAppointments(targetId);
        if (!cancelled) setAppointments(data || []);
      } catch (err) {
        console.log(err);
        if (!cancelled) setAppointments([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void loadAppointments();

    return () => {
      cancelled = true;
    };
  }, [doctor]);

  const safeAppointments = Array.isArray(appointments) ? appointments : [];
  const filtered = isOwnProfile
    ? safeAppointments.filter(
        (a) => a.status !== "Cancelled" && a.status !== "Completed",
      )
    : safeAppointments;

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8 text-xs text-[#64748B]">
        Loading appointments...
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3
          className="text-sm font-bold text-[#111827]"
          style={{ fontFamily: PP }}
        >
          Appointments
        </h3>
        <span className="text-[11px] text-[#64748B]">
          {filtered.length} appointments
        </span>
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-8 text-xs text-[#64748B]">
          No appointments found.
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((appt) => {
            const rawPatient =
              appt.patientName ??
              (appt as unknown as Record<string, unknown>).name;
            const pName =
              typeof rawPatient === "string"
                ? rawPatient
                : rawPatient && typeof rawPatient === "object"
                  ? (rawPatient as { fullName?: string; name?: string })
                      .fullName ||
                    (rawPatient as { fullName?: string; name?: string }).name ||
                    "Patient"
                  : "Patient";
            const initial = String(pName).trim().charAt(0) || "P";

            return (
              <div
                key={appt.id}
                className="flex items-center justify-between bg-white border border-[#E5E7EB] rounded-xl p-3 hover:bg-slate-50/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-blue-50 text-[#0D47A1] flex items-center justify-center text-xs font-bold">
                    {initial}
                  </div>
                  <div>
                    <div className="text-xs font-bold text-[#111827]">
                      {pName}
                    </div>
                    <div className="text-[11px] text-[#64748B]">
                      {appt.date} at {appt.time}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-medium border ${APPT_STATUS_STYLE[appt.status] || "bg-slate-100 text-slate-600 border-slate-200"}`}
                  >
                    {appt.status}
                  </span>
                  <ChevronRight size={14} className="text-slate-400" />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
