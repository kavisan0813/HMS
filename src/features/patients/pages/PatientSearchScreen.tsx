import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router";
import { ROUTES } from "../../../app/routes/routes";
import { doctorsApi } from "../../doctors/api/doctors.api";
import {
  Calendar,
  Search,
  UserPlus,
  Users,
  TrendingUp,
  Clock,
  UserX,
} from "lucide-react";
import { usePatients, useDoctorPatients } from "../hooks/usePatients";
import { PP, RB } from "../constants/patient.fonts";
import { PatientTable } from "../components/PatientTable";
import { usePermissions } from "../../../permissions/usePermissions";
import type { Patient } from "../types/patient.types";
import { RegisterPatientScreen } from "./RegisterPatientScreen";
import { PatientProfileScreen } from "./PatientProfileScreen";
import { BookAppointmentDrawer } from "../../appointments/components/BookAppointmentDrawer";
import {
  DeactivatePatientDialog,
  ActivatePatientDialog,
} from "../components/PatientStatusDialogs";
import { patientsApi } from "../api/patient.api";

export function PatientSearchScreen({
  onPatientSelect,
  onRegisterClick,
  onBookAppointmentClick,
  onEditPatientClick,
  userRole,
}: {
  onBack?: () => void;
  onPatientSelect?: (mrn: string) => void;
  onRegisterClick?: () => void;
  onBookAppointmentClick?: (mrn: string) => void;
  onEditPatientClick?: (patient: Patient) => void;
  onCheckInClick?: (mrn: string) => void;
  userRole?: string;
}) {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All Statuses");
  const [regTypeFilter, setRegTypeFilter] = useState("All Types");
  const [genderFilter, setGenderFilter] = useState("All Genders");
  const [regDateFilter, setRegDateFilter] = useState("All Dates");
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(
    null,
  );
  const [activeActionMenuId, setActiveActionMenuId] = useState<string | null>(
    null,
  );
  const [registering, setRegistering] = useState(false);
  const [showBookDrawer, setShowBookDrawer] = useState(false);
  const [deactivatePatient, setDeactivatePatient] = useState<Patient | null>(
    null,
  );
  const [activatePatient, setActivatePatient] = useState<Patient | null>(null);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  // Viewing Patient Profile/Details states
  const [viewingPatientMrn, setViewingPatientMrn] = useState<string | null>(
    null,
  );

  const permissions = usePermissions();
  const activeRole = (
    userRole ||
    permissions.role ||
    "RECEPTIONIST"
  ).toUpperCase();

  // Backend API connection - use different hook for Doctor role
  const isDoctorRole = activeRole === "DOCTOR";

  const { data: generalPatientsResponse, isLoading: isGeneralLoading } =
    usePatients(undefined, { enabled: !isDoctorRole });
  const { data: doctorPatientsResponse, isLoading: isDoctorLoading } =
    useDoctorPatients(undefined, { enabled: isDoctorRole });

  const patientsResponse = isDoctorRole
    ? doctorPatientsResponse
    : generalPatientsResponse;
  const isLoading = isDoctorRole ? isDoctorLoading : isGeneralLoading;

  const [doctorMap, setDoctorMap] = useState<Record<string | number, string>>(
    {},
  );

  useEffect(() => {
    let cancelled = false;
    doctorsApi
      .getAll()
      .then((res) => {
        if (cancelled) return;
        const items = res?.items || [];
        const map: Record<string | number, string> = {};
        for (const doc of items) {
          const name = doc.name || doc.fullName || "";
          if (!name) continue;
          if (doc.id) {
            map[doc.id] = name;
            map[String(doc.id)] = name;
            map[String(doc.id).replace(/^DOC-/, "")] = name;
          }
          if (doc.userId) {
            map[doc.userId] = name;
            map[String(doc.userId)] = name;
          }
          if (doc.empId) {
            map[doc.empId] = name;
            map[String(doc.empId)] = name;
          }
        }
        setDoctorMap(map);
      })
      .catch(() => {
        // Silently handle if offline
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const dbPatients = useMemo(
    () => patientsResponse?.items ?? [],
    [patientsResponse],
  );

  // Dynamic KPI Stats calculation from API patient data
  const stats = useMemo(() => {
    const todayStr = new Date().toISOString().split("T")[0];
    const totalPatients = dbPatients.length;
    const newRegistrationsToday = dbPatients.filter(
      (p) =>
        typeof p.registrationDate === "string" &&
        p.registrationDate.startsWith(todayStr),
    ).length;
    const activePatients = dbPatients.filter(
      (p) =>
        p.status !== "Inactive" &&
        p.status !== "INACTIVE" &&
        p.status !== "Deceased",
    ).length;
    const inactivePatients = dbPatients.filter(
      (p) =>
        p.status === "Inactive" ||
        p.status === "INACTIVE" ||
        p.status === "Deceased",
    ).length;

    return {
      totalPatients,
      newRegistrationsToday,
      activePatients,
      inactivePatients,
    };
  }, [dbPatients]);

  // Filter Logic over DB Patients
  const filteredPatients = dbPatients.filter((p) => {
    const q = searchQuery.toLowerCase().trim();
    const mrnStr = (p.mrn || String(p.id)).toLowerCase();
    const nameStr = (p.patientName || p.name || "").toLowerCase();
    const phoneStr = (p.phone || "").toLowerCase();

    const matchSearch =
      q === "" ||
      mrnStr.includes(q) ||
      nameStr.includes(q) ||
      phoneStr.includes(q);

    const pStatus = p.status || "ACTIVE";
    const pGender = p.gender || "MALE";
    const pRegType = p.registrationType || "WALK_IN";

    const matchStatus =
      statusFilter === "All Statuses" ||
      pStatus.toUpperCase() === statusFilter.toUpperCase().replace("-", "_");
    const matchType =
      regTypeFilter === "All Types" ||
      pRegType.toUpperCase() ===
        regTypeFilter.toUpperCase().replace(/\s+/g, "_");
    const matchGender =
      genderFilter === "All Genders" ||
      pGender.toUpperCase() === genderFilter.toUpperCase() ||
      (genderFilter === "Female" && pGender === "F") ||
      (genderFilter === "Male" && pGender === "M");
    const matchDate =
      regDateFilter === "All Dates" ||
      (regDateFilter === "Today" &&
        p.registrationDate &&
        p.registrationDate.startsWith(new Date().toISOString().split("T")[0]));

    // Only show patients to the doctor after vitals have been completed
    const matchDoctorVisibility =
      !isDoctorRole ||
      (pStatus !== "WAITING_FOR_VITALS" &&
        pStatus !== "CHECKED_IN" &&
        pStatus !== "SCHEDULED");

    return (
      matchSearch &&
      matchStatus &&
      matchType &&
      matchGender &&
      matchDate &&
      matchDoctorVisibility
    );
  });

  const selectedPatient =
    dbPatients.find((p) => (p.mrn || String(p.id)) === selectedPatientId) ||
    filteredPatients[0];

  const resetFilters = () => {
    setSearchQuery("");
    setStatusFilter("All Statuses");
    setRegTypeFilter("All Types");
    setGenderFilter("All Genders");
    setRegDateFilter("All Dates");
  };

  const hasActiveFilters =
    searchQuery !== "" ||
    statusFilter !== "All Statuses" ||
    regTypeFilter !== "All Types" ||
    genderFilter !== "All Genders" ||
    regDateFilter !== "All Dates";

  // RBAC permission checks for action buttons
  const canRegister =
    permissions.can("PATIENT_CREATE") ||
    activeRole === "RECEPTIONIST" ||
    activeRole.includes("ADMIN");
  const canBook =
    (permissions.can("APPOINTMENT_CREATE") ||
      activeRole === "RECEPTIONIST" ||
      activeRole.includes("ADMIN")) &&
    !isDoctorRole;

  const handleRegisterClick = () => {
    if (onRegisterClick) {
      onRegisterClick();
    } else {
      navigate(ROUTES.PATIENT_REGISTER);
    }
  };

  const handleBookClick = () => {
    const targetMrn = selectedPatient
      ? selectedPatient.mrn || String(selectedPatient.id)
      : "";
    if (onBookAppointmentClick) {
      onBookAppointmentClick(targetMrn);
    } else {
      navigate(ROUTES.BOOK_APPOINTMENT);
    }
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
    } catch (err) {
      console.warn("Failed to deactivate patient:", err);
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  if (registering) {
    return (
      <RegisterPatientScreen
        onBack={() => setRegistering(false)}
        onViewProfile={(mrn) => {
          setRegistering(false);
          setViewingPatientMrn(mrn);
          if (onPatientSelect) onPatientSelect(mrn);
        }}
        onSwitchToNewPatient={(mrn) => {
          setRegistering(false);
          setViewingPatientMrn(mrn);
          if (onPatientSelect) onPatientSelect(mrn);
        }}
        onBookAppointment={(mrn) => {
          setRegistering(false);
          if (onBookAppointmentClick) {
            onBookAppointmentClick(mrn);
          } else {
            setSelectedPatientId(mrn);
            setShowBookDrawer(true);
          }
        }}
      />
    );
  }

  if (viewingPatientMrn) {
    return (
      <PatientProfileScreen
        patientMrn={viewingPatientMrn}
        onBack={() => setViewingPatientMrn(null)}
        onBookAppointment={(mrn) => {
          if (onBookAppointmentClick) {
            onBookAppointmentClick(mrn || viewingPatientMrn);
          } else {
            setShowBookDrawer(true);
          }
        }}
        onCheckInClick={(apptId) => {
          if (apptId) {
            patientsApi.checkInAppointment(apptId).catch(() => {});
          }
        }}
        onEditPatient={() => {}}
      />
    );
  }

  // Breadcrumb label based on role
  const roleLabel =
    activeRole === "DOCTOR"
      ? "Doctor Workspace"
      : activeRole.includes("ADMIN")
        ? "Hospital Admin"
        : "Reception";

  return (
    <div
      className="w-full min-h-screen flex flex-col p-6 space-y-6 bg-[#F1F5F9]"
      style={{ fontFamily: RB }}
    >
      {/* ── HEADER & BREADCRUMB & PRIMARY ACTIONS ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-[#E5E7EB] shadow-sm">
        <div>
          <div className="flex items-center gap-2 text-xs text-[#64748B] mb-1">
            <span>{roleLabel}</span>
            <span className="text-slate-400">/</span>
            <span className="font-semibold text-[#0D47A1]">Patient Search</span>
          </div>
          <h1
            className="text-2xl font-bold text-[#111827]"
            style={{ fontFamily: PP }}
          >
            Patient Management & Search
          </h1>
          <p className="text-xs text-[#64748B] mt-0.5">
            Search patient records, filter by status or department, and inspect
            record details.
          </p>
        </div>

        {/* Primary Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          {canBook && (
            <button
              onClick={handleBookClick}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#009688] text-white text-xs font-semibold hover:bg-teal-700 transition-colors shadow-sm cursor-pointer"
              style={{ fontFamily: PP }}
            >
              <Calendar size={15} />
              Book Appointment
            </button>
          )}
          {canRegister && (
            <button
              onClick={handleRegisterClick}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#0D47A1] text-white text-xs font-semibold hover:bg-[#0c3d8a] transition-colors shadow-sm cursor-pointer"
              style={{ fontFamily: PP }}
            >
              <UserPlus size={15} />
              Register Patient
            </button>
          )}
        </div>
      </div>

      {/* ── KPI SUMMARY CARDS ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {isLoading ? (
          [1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="bg-white p-5 rounded-2xl border border-[#E5E7EB] shadow-sm animate-pulse space-y-3"
            >
              <div className="h-4 bg-slate-100 rounded w-1/2"></div>
              <div className="h-8 bg-slate-200 rounded w-1/3"></div>
            </div>
          ))
        ) : (
          <>
            <div className="bg-white p-5 rounded-2xl border border-[#E5E7EB] shadow-sm relative overflow-hidden group hover:border-[#0D47A1]/30 transition-colors">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-[#64748B]">
                  Total DB Patients
                </span>
                <div className="w-9 h-9 rounded-xl bg-blue-50 text-[#0D47A1] flex items-center justify-center">
                  <Users size={18} />
                </div>
              </div>
              <div className="mt-3 flex items-baseline gap-2">
                <span
                  className="text-2xl font-extrabold text-[#111827]"
                  style={{ fontFamily: PP }}
                >
                  {stats.totalPatients}
                </span>
                <span className="text-[11px] text-emerald-600 font-semibold flex items-center gap-0.5">
                  <TrendingUp size={11} /> Live DB
                </span>
              </div>
              <p className="text-[11px] text-[#64748B] mt-1">
                Full registered patient base
              </p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-[#E5E7EB] shadow-sm relative overflow-hidden group hover:border-emerald-500/30 transition-colors">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-[#64748B]">
                  New Registrations
                </span>
                <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <Clock size={18} />
                </div>
              </div>
              <div className="mt-3 flex items-baseline gap-2">
                <span
                  className="text-2xl font-extrabold text-[#111827]"
                  style={{ fontFamily: PP }}
                >
                  {stats.newRegistrationsToday}
                </span>
                <span className="text-[11px] text-emerald-600 font-semibold">
                  Today
                </span>
              </div>
              <p className="text-[11px] text-[#64748B] mt-1">
                Registered on current date
              </p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-[#E5E7EB] shadow-sm relative overflow-hidden group hover:border-teal-500/30 transition-colors">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-[#64748B]">
                  Active Patients
                </span>
                <div className="w-9 h-9 rounded-xl bg-teal-50 text-[#009688] flex items-center justify-center">
                  <Users size={18} />
                </div>
              </div>
              <div className="mt-3 flex items-baseline gap-2">
                <span
                  className="text-2xl font-extrabold text-[#009688]"
                  style={{ fontFamily: PP }}
                >
                  {stats.activePatients}
                </span>
              </div>
              <p className="text-[11px] text-[#64748B] mt-1">
                Active status records
              </p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-[#E5E7EB] shadow-sm relative overflow-hidden group hover:border-slate-300 transition-colors">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-[#64748B]">
                  Inactive Records
                </span>
                <div className="w-9 h-9 rounded-xl bg-slate-100 text-slate-500 flex items-center justify-center">
                  <UserX size={18} />
                </div>
              </div>
              <div className="mt-3 flex items-baseline gap-2">
                <span
                  className="text-2xl font-extrabold text-slate-600"
                  style={{ fontFamily: PP }}
                >
                  {stats.inactivePatients}
                </span>
              </div>
              <p className="text-[11px] text-[#64748B] mt-1">
                Inactive or archived
              </p>
            </div>
          </>
        )}
      </div>

      {/* ── FILTERS & SEARCH BAR ── */}
      <div className="bg-white p-4 rounded-2xl border border-[#E5E7EB] shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="relative w-full md:w-96">
          <Search
            size={16}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
          />
          <input
            aria-label="Search by MRN, Name, or Phone..."
            type="text"
            placeholder="Search by MRN, Name, or Phone..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-xs bg-slate-50 border border-[#E5E7EB] rounded-xl text-[#111827] outline-none focus:border-[#0D47A1] focus:bg-white transition-colors placeholder:text-slate-400"
          />
        </div>

        <div className="flex items-center gap-2 flex-wrap w-full md:w-auto">
          <select
            aria-label="Select option"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 rounded-xl bg-slate-50 border border-[#E5E7EB] text-xs text-[#64748B] focus:outline-none font-medium"
          >
            <option>All Statuses</option>
            <option>Active</option>
            <option>Inactive</option>
          </select>

          <select
            aria-label="Select option"
            value={regTypeFilter}
            onChange={(e) => setRegTypeFilter(e.target.value)}
            className="px-3 py-2 rounded-xl bg-slate-50 border border-[#E5E7EB] text-xs text-[#64748B] focus:outline-none font-medium"
          >
            <option>All Types</option>
            <option>Walk-In</option>
            <option>Online</option>
          </select>

          <select
            aria-label="Select option"
            value={genderFilter}
            onChange={(e) => setGenderFilter(e.target.value)}
            className="px-3 py-2 rounded-xl bg-slate-50 border border-[#E5E7EB] text-xs text-[#64748B] focus:outline-none font-medium"
          >
            <option>All Genders</option>
            <option>Female</option>
            <option>Male</option>
          </select>

          <select
            aria-label="Select option"
            value={regDateFilter}
            onChange={(e) => setRegDateFilter(e.target.value)}
            className="px-3 py-2 rounded-xl bg-slate-50 border border-[#E5E7EB] text-xs text-[#64748B] focus:outline-none font-medium"
          >
            <option>All Dates</option>
            <option>Today</option>
          </select>

          <button
            onClick={resetFilters}
            className="px-3 py-2 rounded-xl text-xs text-[#EF4444] font-semibold hover:bg-red-50 transition-colors"
          >
            Reset Filters
          </button>
        </div>
      </div>

      {/* ── SINGLE COMMON PATIENT TABLE COMPONENT FOR ALL ROLES (RBAC CONTROLLED) ── */}
      <PatientTable
        patients={filteredPatients}
        totalCount={patientsResponse?.total ?? dbPatients.length}
        isLoading={isLoading}
        doctorMap={doctorMap}
        selectedPatientId={selectedPatientId}
        activeActionMenuId={activeActionMenuId}
        hasActiveFilters={hasActiveFilters}
        userRole={userRole}
        onSelectRow={(p: Patient) => {
          const id = p.mrn || String(p.id);
          setSelectedPatientId(id);
          if (onPatientSelect) onPatientSelect(id);
          else navigate(ROUTES.PATIENT_PROFILE.replace(":mrn", id));
        }}
        onToggleActionMenu={(id) => setActiveActionMenuId(id)}
        onViewProfile={(id) => {
          if (onPatientSelect) onPatientSelect(id);
          else navigate(ROUTES.PATIENT_PROFILE.replace(":mrn", id));
        }}
        onEditPatient={(p) => {
          const id = p.mrn || String(p.id);
          if (onEditPatientClick) {
            onEditPatientClick(p);
          } else {
            navigate(ROUTES.PATIENT_PROFILE.replace(":mrn", id));
          }
        }}
        onBookAppointment={
          isDoctorRole
            ? undefined
            : (p) => {
                const id = p.mrn || String(p.id);
                setSelectedPatientId(id);
                if (onBookAppointmentClick) {
                  onBookAppointmentClick(id);
                } else {
                  navigate(ROUTES.BOOK_APPOINTMENT);
                }
              }
        }
        onActivatePatient={(p) => setActivatePatient(p)}
        onDeactivatePatient={(p) => setDeactivatePatient(p)}
        onViewMedicalHistory={(id) => {
          if (onPatientSelect) onPatientSelect(id);
        }}
        onViewAppointments={(id) => {
          if (onPatientSelect) onPatientSelect(id);
        }}
        onGenerateBill={(id) => {
          if (onPatientSelect) onPatientSelect(id);
        }}
        onResetFilters={resetFilters}
      />

      <BookAppointmentDrawer
        isOpen={showBookDrawer}
        onClose={() => setShowBookDrawer(false)}
        onBookSuccess={() => {
          setShowBookDrawer(false);
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
