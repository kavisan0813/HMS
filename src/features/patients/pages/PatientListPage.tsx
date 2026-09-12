import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router";
import { ROUTES } from "../../../app/routes/routes";
import { ChevronRight, RefreshCw, UserPlus, Calendar } from "lucide-react";
import type { Patient } from "../types/patient.types";
import { PP, RB } from "../../doctors/constants/doctors.constants";
import { patientsApi } from "../api/patient.api";
import { mapApiPatientToPatientRecord } from "../api/mapApiPatientToPatientRecord";
import { can } from "../utils/patientPermissions";
import type { Role } from "../utils/patientPermissions";
import { PatientTable } from "../components/PatientTable";
import type { PatientFilterValues } from "../components/PatientFilters";
import { PatientProfilePage } from "./PatientProfilePage";
import { RegisterPatientScreen } from "./RegisterPatientScreen";
import { EditPatientScreen } from "./EditPatientScreen";
import {
  DeactivatePatientDialog,
  ActivatePatientDialog,
} from "../components/PatientStatusDialogs";
import { BookAppointmentDrawer } from "../../appointments/components/BookAppointmentDrawer";
import { BookAppointmentScreen } from "../../appointments/pages/BookAppointmentScreen";

const DEFAULT_FILTERS: PatientFilterValues = {
  searchQuery: "",
  genderFilter: "All",
  statusFilter: "All",
  registrationTypeFilter: "All",
};

export function PatientListPage({ currentRole }: { currentRole: Role }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalPatients, setTotalPatients] = useState(0);
  const [activePatients, setActivePatients] = useState(0);
  const [viewingPatient, setViewingPatient] = useState<Patient | null>(null);
  const [registering, setRegistering] = useState(false);
  const [bookingAppt, setBookingAppt] = useState(false);
  const [editingPatient, setEditingPatient] = useState<Patient | null>(null);
  const [deactivatePatient, setDeactivatePatient] = useState<Patient | null>(
    null,
  );
  const [activatePatient, setActivatePatient] = useState<Patient | null>(null);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [showBookDrawer, setShowBookDrawer] = useState(false);
  const [filters, setFilters] = useState<PatientFilterValues>(DEFAULT_FILTERS);
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(
    null,
  );
  const [activeActionMenuId, setActiveActionMenuId] = useState<string | null>(
    null,
  );

  const [prevLocationKey, setPrevLocationKey] = useState(location.key);
  if (prevLocationKey !== location.key) {
    setPrevLocationKey(location.key);
    setViewingPatient(null);
    setRegistering(false);
    setBookingAppt(false);
    setEditingPatient(null);
  }

  const fetchPatients = async () => {
    try {
      setLoading(true);
      const isDoctor = currentRole === "DOCTOR";
      const response = isDoctor
        ? await patientsApi.getDoctorPatients(undefined, { page: 0, size: 100 })
        : await patientsApi.listPatients();
      const records = response.items.map(mapApiPatientToPatientRecord);
      setPatients(records);
      setTotalPatients(response.total);
      setActivePatients(records.filter((p) => p.status === "ACTIVE").length);
    } catch (err) {
      console.warn("Failed to fetch patients:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let cancelled = false;
    const isDoctor = currentRole === "DOCTOR";
    const request = isDoctor
      ? patientsApi.getDoctorPatients(undefined, { page: 0, size: 100 })
      : patientsApi.listPatients();

    request
      .then((response) => {
        if (cancelled) return;
        const records = response.items.map(mapApiPatientToPatientRecord);
        setPatients(records);
        setTotalPatients(response.total);
        setActivePatients(records.filter((p) => p.status === "ACTIVE").length);
      })
      .catch((err) => {
        if (!cancelled) console.warn("Failed to fetch patients:", err);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [currentRole]);

  const hasActiveFilters =
    filters.searchQuery !== "" ||
    filters.genderFilter !== "All" ||
    filters.statusFilter !== "All" ||
    filters.registrationTypeFilter !== "All";

  const filteredPatients = patients.filter((p) => {
    const q = filters.searchQuery.toLowerCase().trim();
    const matchesSearch =
      !q ||
      p.mrn?.toLowerCase().includes(q) ||
      p.fullName?.toLowerCase().includes(q) ||
      p.name?.toLowerCase().includes(q) ||
      p.patientName?.toLowerCase().includes(q) ||
      p.phone?.toLowerCase().includes(q) ||
      p.mobileNumber?.toLowerCase().includes(q) ||
      p.email?.toLowerCase().includes(q) ||
      p.nationalId?.toLowerCase().includes(q);

    // Gender filter (normalized matching)
    let matchesGender = true;
    if (filters.genderFilter !== "All") {
      const pGender = (p.gender || "").toUpperCase();
      const fGender = filters.genderFilter.toUpperCase();
      matchesGender =
        pGender === fGender ||
        (fGender === "MALE" && (pGender === "MALE" || pGender === "M")) ||
        (fGender === "FEMALE" && (pGender === "FEMALE" || pGender === "F")) ||
        (fGender === "OTHER" &&
          pGender !== "MALE" &&
          pGender !== "M" &&
          pGender !== "FEMALE" &&
          pGender !== "F");
    }

    // Status filter (normalized matching)
    let matchesStatus = true;
    if (filters.statusFilter !== "All") {
      const pStatus = (p.status || "").toUpperCase();
      const fStatus = filters.statusFilter.toUpperCase();
      matchesStatus = pStatus === fStatus;
    }

    // Registration Type filter (normalized matching)
    let matchesRegType = true;
    if (filters.registrationTypeFilter !== "All") {
      const pReg = (p.registrationType || "")
        .toUpperCase()
        .replace(/[\s_-]/g, "");
      const fReg = filters.registrationTypeFilter
        .toUpperCase()
        .replace(/[\s_-]/g, "");
      matchesRegType =
        pReg === fReg ||
        (fReg.includes("ONLINE") && pReg.includes("ONLINE")) ||
        (fReg.includes("WALK") &&
          (pReg.includes("WALK") || pReg.includes("IN")));
    }

    return matchesSearch && matchesGender && matchesStatus && matchesRegType;
  });

  const canRegister = can(currentRole, "register");
  const canEdit = can(currentRole, "editProfile");
  const canView = can(currentRole, "viewProfile");

  const openPatientProfile = (id: string) => {
    navigate(ROUTES.PATIENT_PROFILE.replace(":mrn", id));
  };

  const handleConfirmActivate = async () => {
    if (!activatePatient) return;
    setIsUpdatingStatus(true);
    try {
      const targetId = (activatePatient.mrn || activatePatient.id) as
        | string
        | number;
      await patientsApi.update(targetId, { status: "ACTIVE" });
      setActivatePatient(null);
      fetchPatients();
    } catch (err) {
      console.warn("Failed to activate patient:", err);
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handleConfirmDeactivate = async () => {
    if (!deactivatePatient) return;
    setIsUpdatingStatus(true);
    try {
      const targetId = (deactivatePatient.mrn || deactivatePatient.id) as
        | string
        | number;
      await patientsApi.update(targetId, { status: "INACTIVE" });
      setDeactivatePatient(null);
      fetchPatients();
    } catch (err) {
      console.warn("Failed to deactivate patient:", err);
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  if (viewingPatient) {
    const currentIndex = filteredPatients.findIndex(
      (p) =>
        (p.mrn || String(p.id)) ===
        (viewingPatient.mrn || String(viewingPatient.id)),
    );
    const hasNext =
      currentIndex >= 0 && currentIndex < filteredPatients.length - 1;
    const hasPrev = currentIndex > 0;

    return (
      <PatientProfilePage
        patient={viewingPatient}
        currentRole={currentRole}
        onBack={() => setViewingPatient(null)}
        onNextPatient={
          hasNext
            ? () => setViewingPatient(filteredPatients[currentIndex + 1])
            : undefined
        }
        onPrevPatient={
          hasPrev
            ? () => setViewingPatient(filteredPatients[currentIndex - 1])
            : undefined
        }
      />
    );
  }

  if (registering) {
    return (
      <RegisterPatientScreen
        onBack={() => setRegistering(false)}
        onViewProfile={(mrn) => {
          setRegistering(false);
          fetchPatients();
          patientsApi
            .getPatientByMrn(mrn)
            .then((data) =>
              setViewingPatient(mapApiPatientToPatientRecord(data)),
            )
            .catch(() => {});
        }}
      />
    );
  }

  if (bookingAppt) {
    return (
      <BookAppointmentScreen
        role={
          currentRole.toLowerCase() as
            | "super-admin"
            | "admin"
            | "doctor"
            | "nurse"
            | "receptionist"
            | "accountant"
            | "patient"
        }
        onBack={() => setBookingAppt(false)}
        onBookSuccess={() => {
          setBookingAppt(false);
          fetchPatients();
        }}
      />
    );
  }

  if (editingPatient) {
    return (
      <EditPatientScreen
        patient={editingPatient}
        onBack={() => {
          setEditingPatient(null);
          fetchPatients();
        }}
      />
    );
  }

  return (
    <div
      className="flex-1 overflow-y-auto p-6 space-y-6 bg-[#F1F5F9]"
      style={{ fontFamily: RB }}
    >
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1
            className="text-xl font-bold text-[#111827]"
            style={{ fontFamily: PP }}
          >
            Patient Management
          </h1>
          <div
            className="flex items-center gap-1.5 text-xs text-[#64748B] mt-1"
            style={{ fontFamily: RB }}
          >
            <span>Patients</span>
            <ChevronRight size={13} className="text-slate-300" />
            <span className="font-medium text-[#111827]">Patient List</span>
          </div>
        </div>
        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={() => {
              setLoading(true);
              void fetchPatients();
            }}
            className="px-3 py-2 rounded-xl bg-white border border-[#E5E7EB] text-slate-600 hover:text-[#0D47A1] text-xs font-semibold transition-colors flex items-center gap-1.5 shadow-sm"
          >
            <RefreshCw
              size={13}
              className={loading ? "animate-spin text-[#0D47A1]" : ""}
            />
            <span>{loading ? "Refreshing..." : "Refresh"}</span>
          </button>
          {currentRole !== "DOCTOR" && (
            <button
              onClick={() => setBookingAppt(true)}
              className="px-4 py-2.5 rounded-xl bg-[#009688] text-white text-xs font-bold hover:bg-teal-700 transition-colors flex items-center gap-2 shadow-sm shrink-0 cursor-pointer"
              style={{ fontFamily: PP }}
            >
              <Calendar size={15} /> Book Appointment
            </button>
          )}
          {canRegister && (
            <button
              onClick={() => setRegistering(true)}
              className="px-4 py-2.5 rounded-xl bg-[#0D47A1] text-white text-xs font-bold hover:bg-[#0c3d8a] transition-colors flex items-center gap-2 shadow-sm shrink-0 cursor-pointer"
              style={{ fontFamily: PP }}
            >
              <UserPlus size={15} /> Register Patient
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl border border-[#E5E7EB] p-4 shadow-sm">
          <div className="text-xs text-[#64748B] font-medium">
            Total Patients
          </div>
          <div className="text-2xl font-bold text-[#111827] mt-0.5">
            {totalPatients}
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-[#E5E7EB] p-4 shadow-sm">
          <div className="text-xs text-[#64748B] font-medium">
            Active Patients
          </div>
          <div className="text-2xl font-bold text-[#009688] mt-0.5">
            {activePatients}
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-[#E5E7EB] p-4 shadow-sm">
          <div className="text-xs text-[#64748B] font-medium">
            Inactive Patients
          </div>
          <div className="text-2xl font-bold text-[#F59E0B] mt-0.5">
            {Math.max(0, totalPatients - activePatients)}
          </div>
        </div>
      </div>

      <PatientTable
        patients={filteredPatients}
        totalCount={patients.length}
        isLoading={loading}
        filterValues={filters}
        onFilterChange={(patch) =>
          setFilters((prev) => ({ ...prev, ...patch }))
        }
        onResetFilters={() => setFilters(DEFAULT_FILTERS)}
        hasActiveFilters={hasActiveFilters}
        selectedPatientId={selectedPatientId}
        activeActionMenuId={activeActionMenuId}
        onSelectRow={(p) => setSelectedPatientId(p.mrn || String(p.id))}
        onToggleActionMenu={(id) => setActiveActionMenuId(id)}
        onViewProfile={canView ? openPatientProfile : () => {}}
        onEditPatient={
          canEdit
            ? (p) =>
                navigate(
                  ROUTES.PATIENT_PROFILE.replace(":mrn", p.mrn || String(p.id)),
                )
            : undefined
        }
        onBookAppointment={
          currentRole !== "DOCTOR"
            ? () => navigate(ROUTES.BOOK_APPOINTMENT)
            : undefined
        }
        onActivatePatient={canEdit ? (p) => setActivatePatient(p) : undefined}
        onDeactivatePatient={
          canEdit ? (p) => setDeactivatePatient(p) : undefined
        }
        userRole={currentRole}
      />

      <BookAppointmentDrawer
        isOpen={showBookDrawer}
        onClose={() => setShowBookDrawer(false)}
        onBookSuccess={() => {
          setShowBookDrawer(false);
          fetchPatients();
        }}
      />

      <DeactivatePatientDialog
        isOpen={!!deactivatePatient}
        patient={deactivatePatient}
        onClose={() => setDeactivatePatient(null)}
        onConfirm={handleConfirmDeactivate}
        isDeactivating={isUpdatingStatus}
      />

      <ActivatePatientDialog
        isOpen={!!activatePatient}
        patient={activatePatient}
        onClose={() => setActivatePatient(null)}
        onConfirm={handleConfirmActivate}
        isActivating={isUpdatingStatus}
      />
    </div>
  );
}
