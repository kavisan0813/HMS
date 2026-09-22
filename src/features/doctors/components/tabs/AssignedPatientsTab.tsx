import { useState, useEffect } from "react";
import { Clock } from "lucide-react";
import type {
  DoctorRecord,
  DoctorAppointment,
} from "../../types/doctors.types";
import { PP } from "../../constants/doctors.constants";
import { doctorsService } from "../../services/doctors.service";

import { resolveDoctorId } from "../../services/doctorProfile.service";

export interface AssignedPatientsTabProps {
  doctor: DoctorRecord;
  canEdit?: boolean;
  isOwnProfile?: boolean;
}

export function AssignedPatientsTab({
  doctor,
  isOwnProfile = false,
}: AssignedPatientsTabProps) {
  const [appointments, setAppointments] = useState<DoctorAppointment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const loadPatients = async () => {
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

    void loadPatients();

    return () => {
      cancelled = true;
    };
  }, [doctor]);

  const safeAppointments = Array.isArray(appointments) ? appointments : [];
  const patients = isOwnProfile
    ? safeAppointments.filter((a) => a.status !== "Cancelled")
    : safeAppointments;

  const uniquePatients = Array.from(
    new Map(patients.map((p) => [p.patientId, p])).values(),
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8 text-xs text-[#64748B]">
        Loading patients...
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
          Assigned Patients
        </h3>
        <span className="text-[11px] text-[#64748B]">
          {uniquePatients.length} patients
        </span>
      </div>

      {uniquePatients.length === 0 ? (
        <div className="text-center py-8 text-xs text-[#64748B]">
          No patients assigned.
        </div>
      ) : (
        <div className="space-y-2">
          {uniquePatients.map((patient) => {
            const rawPatient =
              patient.patientName ??
              (patient as unknown as Record<string, unknown>).name;
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
                key={patient.patientId}
                className="flex items-center justify-between bg-white border border-[#E5E7EB] rounded-xl p-3"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-teal-50 text-[#009688] flex items-center justify-center text-xs font-bold">
                    {initial}
                  </div>
                  <div>
                    <div className="text-xs font-bold text-[#111827]">
                      {pName}
                    </div>
                    <div className="text-[11px] text-[#64748B]">
                      {patient.gender} · Age {patient.age}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-[#64748B]">
                    {patient.complaint}
                  </span>
                  <Clock size={12} className="text-slate-400" />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
