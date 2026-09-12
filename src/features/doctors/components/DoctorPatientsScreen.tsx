import { useState, useEffect, useRef } from "react";
import {
  Search,
  User,
  ChevronRight,
  RefreshCw,
  Phone,
  ArrowLeft,
} from "lucide-react";
import { useAuthStore } from "../../auth/store/auth.store";
import { patientsApi } from "../../patients/api/patient.api";
import { mapApiPatientToPatientRecord } from "../../patients/api/mapApiPatientToPatientRecord";
import { PatientProfilePage } from "../../patients/pages/PatientProfilePage";
import type { Patient } from "../../patients/types/patient.types";
import { PP, RB } from "../constants/doctors.constants";

type PatientRow = {
  id: string;
  name: string;
  mrn: string;
  gender: string;
  age: number;
  mobile: string;
  lastVisit: string;
  visits: number;
};

const processDoctorPatients = (data: { items?: Patient[] } | null) => {
  if (!data?.items) return [];
  return data.items.map((item) => {
    const p = mapApiPatientToPatientRecord(item);
    const rawP = p as unknown as Record<string, unknown>;
    const ageVal =
      p.age && Number(p.age) > 0
        ? Number(p.age)
        : rawP.patientAge && Number(rawP.patientAge) > 0
          ? Number(rawP.patientAge)
          : 0;

    return {
      id: String(p.id || p.mrn || ""),
      name: p.fullName || p.name || p.patientName || "Unknown",
      mrn: p.mrn || "",
      gender: p.gender || "Unknown",
      age: ageVal,
      mobile: p.mobileNumber || p.phone || p.mobile || "",
      lastVisit: p.lastVisit || p.lastVisitDate || "",
      visits: p.totalVisits || p.visitCount || 0,
    };
  });
};

export function DoctorPatientsScreen() {
  const { user } = useAuthStore();
  const doctorId = user?.doctorId || user?.doctorProfile?.doctorId;
  const [searchQuery, setSearchQuery] = useState("");
  const [patients, setPatients] = useState<PatientRow[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const doctorIdRef = useRef(doctorId);
  const [prevDoctorId, setPrevDoctorId] = useState<number | string | undefined>(
    undefined,
  );
  if (doctorId !== prevDoctorId) {
    setPrevDoctorId(doctorId);
    setIsLoading(Boolean(doctorId));
  }

  const computedError = !doctorId
    ? "Doctor profile not linked to your account. Please contact administrator."
    : error;

  const fetchPatients = async () => {
    const id = doctorIdRef.current;
    if (!id) {
      setError("Doctor profile not found. Please contact administrator.");
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const result = await patientsApi.getDoctorPatients(100);
      setPatients(processDoctorPatients(result));
    } catch {
      setError("Failed to load patients. Please try again.");
      setPatients([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    doctorIdRef.current = doctorId;
    if (!doctorId) {
      return;
    }
    let cancelled = false;

    patientsApi
      .getDoctorPatients(100)
      .then((result) => {
        if (!cancelled) setPatients(processDoctorPatients(result));
      })
      .catch(() => {
        if (!cancelled) {
          setError("Failed to load patients.");
          setPatients([]);
        }
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [doctorId]);

  const handleSelectPatient = async (patientRow: PatientRow) => {
    try {
      setIsLoading(true);
      const response = await patientsApi.getPatientByMrn(patientRow.mrn);
      setSelectedPatient(mapApiPatientToPatientRecord(response));
    } catch {
      setSelectedPatient({
        id: patientRow.id,
        mrn: patientRow.mrn,
        fullName: patientRow.name,
        gender: patientRow.gender,
        age: patientRow.age,
        mobileNumber: patientRow.mobile,
        status: "ACTIVE",
      } as unknown as Patient);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredPatients = patients.filter(
    (p) =>
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.mrn.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.mobile.includes(searchQuery),
  );

  if (selectedPatient) {
    const currentIndex = filteredPatients.findIndex(
      (p) =>
        p.mrn === selectedPatient.mrn || p.id === String(selectedPatient.id),
    );
    const hasNext =
      currentIndex >= 0 && currentIndex < filteredPatients.length - 1;
    const hasPrev = currentIndex > 0;

    const handleSelectRow = (patientRow: PatientRow) => {
      setIsLoading(true);
      patientsApi
        .getPatientByMrn(patientRow.mrn)
        .then((data) => {
          setSelectedPatient(mapApiPatientToPatientRecord(data));
        })
        .catch(() => {
          setSelectedPatient({
            id: patientRow.id,
            mrn: patientRow.mrn,
            fullName: patientRow.name,
            gender: patientRow.gender,
            age: patientRow.age,
            mobileNumber: patientRow.mobile,
            status: "ACTIVE",
          } as unknown as Patient);
        })
        .finally(() => {
          setIsLoading(false);
        });
    };

    return (
      <PatientProfilePage
        patient={selectedPatient}
        currentRole="DOCTOR"
        onBack={() => setSelectedPatient(null)}
        onNextPatient={
          hasNext
            ? () => handleSelectRow(filteredPatients[currentIndex + 1])
            : undefined
        }
        onPrevPatient={
          hasPrev
            ? () => handleSelectRow(filteredPatients[currentIndex - 1])
            : undefined
        }
      />
    );
  }

  return (
    <div className="w-full min-h-screen flex flex-col p-6 space-y-6 bg-[#F1F5F9]">
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
            My Patients
          </h1>
          <p
            className="text-sm text-[#64748B] mt-0.5"
            style={{ fontFamily: RB }}
          >
            View and manage patients under your care.
          </p>
        </div>
      </div>

      {computedError && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-700">
          {computedError}
        </div>
      )}

      <div className="bg-white rounded-2xl border border-[#E5E7EB] shadow-sm">
        <div className="p-4 border-b border-[#E5E7EB]">
          <div className="flex items-center gap-2">
            <button
              onClick={fetchPatients}
              title="Refresh Patients"
              className="p-2.5 rounded-xl border border-gray-100 bg-slate-50 hover:bg-slate-100 text-[#0D47A1] transition-colors"
            >
              <RefreshCw size={16} />
            </button>
            <div className="relative flex-1">
              <Search
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                aria-label="Search patients by name, MRN, or phone..."
                type="text"
                placeholder="Search patients by name, MRN, or phone..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2.5 text-sm bg-slate-50 border border-gray-100 rounded-xl text-[#111827] placeholder-slate-400 outline-none focus:border-[#0D47A1] focus:bg-white transition-colors"
              />
            </div>
          </div>
        </div>

        <div className="p-2 border-b border-[#E5E7EB] bg-slate-50/50">
          <div className="flex items-center justify-between px-2">
            <span
              className="text-xs font-semibold text-[#64748B]"
              style={{ fontFamily: PP }}
            >
              {filteredPatients.length} Patient
              {filteredPatients.length !== 1 ? "s" : ""}
            </span>
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <RefreshCw size={20} className="animate-spin text-[#0D47A1]" />
          </div>
        ) : filteredPatients.length === 0 ? (
          <div className="text-center py-12">
            <User size={40} className="mx-auto text-slate-300 mb-3" />
            <p
              className="text-sm font-semibold text-[#111827]"
              style={{ fontFamily: PP }}
            >
              No patients found
            </p>
            <p
              className="text-xs text-[#64748B] mt-1"
              style={{ fontFamily: RB }}
            >
              {searchQuery
                ? "Try a different search term"
                : "No patients have been assigned to you yet."}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-[#E5E7EB]">
            {filteredPatients.map((patient) => (
              <button
                key={patient.id}
                onClick={() => handleSelectPatient(patient)}
                className="w-full flex items-center justify-between p-4 hover:bg-slate-50 transition-colors text-left"
              >
                <div className="flex items-center gap-4">
                  <div className="w-11 h-11 rounded-full bg-[#0D47A1] text-white flex items-center justify-center font-bold text-sm">
                    {patient.name.charAt(0)}
                  </div>
                  <div className="space-y-0.5">
                    <div
                      className="text-sm font-bold text-[#111827]"
                      style={{ fontFamily: PP }}
                    >
                      {patient.name}
                    </div>
                    <div
                      className="flex items-center gap-3 text-xs text-[#64748B]"
                      style={{ fontFamily: RB }}
                    >
                      <span className="font-mono">{patient.mrn}</span>
                      <span>|</span>
                      <span>
                        {patient.gender || "Gender N/A"} ·{" "}
                        {patient.age > 0 ? `${patient.age} yrs` : "Age N/A"}
                      </span>
                      {patient.mobile && (
                        <>
                          <span>|</span>
                          <span className="flex items-center gap-1">
                            <Phone size={10} />
                            {patient.mobile}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <div
                      className="text-xs font-semibold text-[#111827]"
                      style={{ fontFamily: PP }}
                    >
                      {patient.visits} visit{patient.visits !== 1 ? "s" : ""}
                    </div>
                    {patient.lastVisit && (
                      <div
                        className="text-[10px] text-[#64748B]"
                        style={{ fontFamily: RB }}
                      >
                        Last:{" "}
                        {new Date(patient.lastVisit).toLocaleDateString(
                          "en-IN",
                          {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          },
                        )}
                      </div>
                    )}
                  </div>
                  <ChevronRight size={16} className="text-slate-400" />
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
