import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Activity, ChevronRight, Clock } from "lucide-react";
import { PP, RB } from "../../doctors/constants/doctors.constants";
import { vitalsService } from "../../vitals/services/vitals.service";
import { QUEUE_QUERY_KEY } from "../../opd/hooks/useQueue";
import { RecordPatientVitalsForm } from "../../vitals/components/RecordPatientVitalsForm";
import { VitalsDetailsScreen } from "../../vitals/components/VitalsDetailsScreen";
import type { AppointmentRecord } from "../../appointments/types/appointment.types";
import type {
  NurseWaitingPatient,
  RecordedVitalsData,
} from "../../vitals/types/vitals.types";

type VitalsWaitingItem = NurseWaitingPatient;

const getPatientName = (item: VitalsWaitingItem) =>
  item.patientName || item.patient?.fullName || item.patient?.name || "Patient";

const getDepartmentName = (item: VitalsWaitingItem) =>
  item.departmentName ||
  (typeof item.department === "string" ? item.department : "") ||
  item.doctor?.departmentName ||
  item.doctor?.department ||
  "-";

const toAppointmentRecord = (item: VitalsWaitingItem): AppointmentRecord => ({
  id: item.appointmentId,
  patientId: item.patientId || item.mrn,
  patientName: getPatientName(item),
  patientMrn: item.mrn,
  mrn: item.mrn,
  doctorId: item.doctorId || "",
  doctorName: item.doctorName || item.doctor?.name || "",
  appointmentDate: item.checkInTime || "",
  status: item.status || "WAITING_FOR_VITALS",
  department: getDepartmentName(item),
  specialty: item.specialty || item.doctor?.specialty || "",
  patientAge:
    typeof item.age === "number"
      ? item.age
      : Number.parseInt(item.age, 10) || 0,
  patientGender: item.gender,
  time: "",
  patient: {
    id: item.patientId || item.mrn,
    mrn: item.mrn,
    name: getPatientName(item),
    age:
      typeof item.age === "number"
        ? item.age
        : Number.parseInt(item.age, 10) || 0,
    gender: item.gender,
    phone: item.phone || item.contact || "—",
  },
});

export function NurseVitalsWorklistPage() {
  const queryClient = useQueryClient();
  const [waitingPatients, setWaitingPatients] = useState<VitalsWaitingItem[]>(
    [],
  );
  const [loading, setLoading] = useState(true);
  const [selectedPatient, setSelectedPatient] =
    useState<VitalsWaitingItem | null>(null);
  const [activeApt, setActiveApt] = useState<AppointmentRecord | null>(null);
  const [detailsVitals, setDetailsVitals] = useState<RecordedVitalsData | null>(
    null,
  );
  const [viewMode, setViewMode] = useState<"worklist" | "record" | "details">(
    "worklist",
  );
  const [isEditMode, setIsEditMode] = useState(false);

  const fetchWorklist = () => {
    setLoading(true);
    vitalsService
      .getWaitingPatients()
      .then((data) => setWaitingPatients(data))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    let cancelled = false;
    vitalsService
      .getWaitingPatients()
      .then((data) => {
        if (!cancelled) setWaitingPatients(data);
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const handlePatientSelect = (patient: VitalsWaitingItem) => {
    setSelectedPatient(patient);
    const aptRec = toAppointmentRecord(patient);
    setActiveApt(aptRec);
    setViewMode("record");
    setIsEditMode(false);
  };

  const handleMarkReady = async (submittedData?: RecordedVitalsData) => {
    if (submittedData) {
      setDetailsVitals(submittedData);
    }
    const aptId = selectedPatient?.appointmentId || activeApt?.id;
    if (aptId) {
      try {
        const freshVitals = await vitalsService.getVitals(aptId);
        if (freshVitals) {
          setDetailsVitals(freshVitals);
        }
      } catch {
        // Fallback to submittedData or default
      }
    }
    if (activeApt) {
      setActiveApt({
        ...activeApt,
        hasVitals: true,
        vitalsRecorded: true,
        status: "Vitals Recorded",
      });
    }
    setViewMode("details");
    fetchWorklist();
    queryClient.invalidateQueries({ queryKey: QUEUE_QUERY_KEY });
    queryClient.invalidateQueries({ queryKey: ["vitals"] });
    queryClient.invalidateQueries({ queryKey: ["appointments"] });
  };

  if (viewMode === "record" && activeApt) {
    return (
      <RecordPatientVitalsForm
        activeApt={activeApt}
        initialVitalsData={isEditMode ? detailsVitals : null}
        isEditMode={isEditMode}
        onBack={() => {
          setViewMode("worklist");
          setSelectedPatient(null);
          setActiveApt(null);
          setIsEditMode(false);
        }}
        onMarkReady={handleMarkReady}
      />
    );
  }

  if (viewMode === "details" && activeApt) {
    return (
      <VitalsDetailsScreen
        activeApt={activeApt}
        vitalsData={detailsVitals || undefined}
        onBack={() => {
          setViewMode("worklist");
          setSelectedPatient(null);
          setActiveApt(null);
          setDetailsVitals(null);
          setIsEditMode(false);
        }}
        onEditVitals={() => {
          setIsEditMode(true);
          setViewMode("record");
        }}
      />
    );
  }

  return (
    <div
      className="flex-1 overflow-y-auto p-6 bg-[#F1F5F9]"
      style={{ fontFamily: RB }}
    >
      <div className="max-w-4xl mx-auto space-y-4">
        <div className="flex items-center gap-2">
          <Activity size={20} className="text-[#0D47A1]" />
          <h1
            className="text-lg font-bold text-[#111827]"
            style={{ fontFamily: PP }}
          >
            Patients Waiting for Vitals
          </h1>
        </div>

        {loading ? (
          <div className="flex items-center justify-center p-8 text-xs text-[#64748B]">
            Loading worklist...
          </div>
        ) : (
          <div className="space-y-2">
            {waitingPatients.map((patient) => (
              <div
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    (e.currentTarget as HTMLElement).click();
                  }
                }}
                role="button"
                key={String(patient.appointmentId)}
                onClick={() => handlePatientSelect(patient)}
                className="flex items-center justify-between bg-white border border-[#E5E7EB] rounded-xl p-3 hover:bg-slate-50/50 cursor-pointer transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center font-bold text-sm">
                    {getPatientName(patient).charAt(0)}
                  </div>
                  <div>
                    <div className="text-sm font-bold text-[#111827]">
                      {getPatientName(patient)}
                    </div>
                    <div className="text-[11px] text-[#64748B]">
                      MRN: {patient.mrn} · {patient.gender} · {patient.age} yrs
                      · {getDepartmentName(patient)}
                    </div>
                    <div className="flex items-center gap-3 mt-1 text-[10px] text-slate-500">
                      {patient.checkInTime && (
                        <span className="flex items-center gap-1">
                          <Clock size={10} />
                          {patient.checkInTime}
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        Status: {patient.status || "WAITING_FOR_VITALS"}
                      </span>
                    </div>
                  </div>
                </div>
                <ChevronRight size={16} className="text-slate-400" />
              </div>
            ))}
            {waitingPatients.length === 0 && (
              <div className="text-center py-8 text-xs text-[#64748B]">
                No patients waiting for vitals.
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
