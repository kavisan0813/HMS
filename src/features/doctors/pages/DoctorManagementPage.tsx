import { useState, useEffect } from "react";
import { ChevronRight, RefreshCw, CheckCircle2 } from "lucide-react";
import type { DoctorRecord } from "../types/doctors.types";
import { PP, RB } from "../constants/doctors.constants";
import { normalizeRole, can } from "../utils/doctorPermissions";
import { doctorsService } from "../services/doctors.service";
import { doctorProfileService } from "../services/doctorProfile.service";
import { useDoctorFilters } from "../hooks/useDoctorFilters";
import { useToast } from "../hooks/useToast";
import { useAuthStore } from "../../auth/store/auth.store";
import { KpiCards } from "../components/KpiCards";
import { DoctorTable } from "../components/DoctorTable";
import { QuickDetailsDrawer } from "../components/QuickDetailsDrawer";
import { ScheduleModal } from "../components/ScheduleModal";
import { DeactivateDoctorDialog } from "../components/DeactivateDoctorDialog";
import { ActivateDoctorDialog } from "../components/ActivateDoctorDialog";
import { ResetPasswordDialog } from "../components/ResetPasswordDialog";
import { EditStaffUserDrawer } from "../../users/components/EditStaffUserDrawer";
import { doctorToEditUser } from "../utils/doctorToEditUser";
import { usersApi } from "../../users/api/users.api";
import { departmentsApi } from "../../users/api/departments.api";
import { DoctorProfileScreen } from "../components/DoctorProfileScreen";

const fetchDoctors = async () => {
  const res = await doctorsService.getAll();
  const overrides = JSON.parse(
    localStorage.getItem("doctor_status_overrides:v1") || "{}",
  );
  return res.items.map((r: DoctorRecord) => {
    if (overrides[r.id]) {
      return {
        ...r,
        status: overrides[r.id].status,
        availability: overrides[r.id].availability,
      };
    }
    return r;
  });
};

export function DoctorManagementPage() {
  const user = useAuthStore((state) => state.user);
  const currentRole = normalizeRole(String(user?.role ?? "ADMIN"));
  const { toastMsg, showToast } = useToast();

  const [doctors, setDoctors] = useState<DoctorRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [departments, setDepartments] = useState<string[]>([]);

  const [editingDoctor, setEditingDoctor] = useState<DoctorRecord | null>(null);
  const [quickDetailsDoctor, setQuickDetailsDoctor] =
    useState<DoctorRecord | null>(null);
  const [scheduleDoctor, setScheduleDoctor] = useState<DoctorRecord | null>(
    null,
  );
  const [fullProfileDoctor, setFullProfileDoctor] =
    useState<DoctorRecord | null>(null);
  const [deactivateDialogDoctor, setDeactivateDialogDoctor] =
    useState<DoctorRecord | null>(null);
  const [isDeactivating, setIsDeactivating] = useState(false);
  const [activateDialogDoctor, setActivateDialogDoctor] =
    useState<DoctorRecord | null>(null);
  const [isActivating, setIsActivating] = useState(false);
  const [resetPassDoctor, setResetPassDoctor] = useState<DoctorRecord | null>(
    null,
  );
  const [isResetting, setIsResetting] = useState(false);

  const [ownProfile, setOwnProfile] = useState<DoctorRecord | null>(null);
  const [ownProfileLoading, setOwnProfileLoading] = useState(false);

  const canEditProfile = can(currentRole, "editProfile");
  const canDeactivate = can(currentRole, "deactivate");
  const canViewSchedule = can(currentRole, "viewSchedule");

  const isDoctor = currentRole === "DOCTOR";

  const {
    searchDoctorQuery,
    setSearchDoctorQuery,
    deptFilter,
    setDeptFilter,
    specialtyFilter,
    setSpecialtyFilter,
    availabilityFilter,
    setAvailabilityFilter,
    statusFilter,
    setStatusFilter,
    experienceFilter,
    setExperienceFilter,
    sortColumn,
    sortDirection,
    filteredDoctors,
    handleSort,
    resetFilters,
  } = useDoctorFilters(doctors);

  useEffect(() => {
    let cancelled = false;

    async function loadData() {
      setLoading(true);
      try {
        const [doctorsData, deptList] = await Promise.all([
          fetchDoctors(),
          departmentsApi.getDepartmentLookup(true),
        ]);
        if (cancelled) return;
        if (!cancelled) {
          setDoctors(doctorsData);
          setDepartments(deptList.map((d) => d.departmentName));
        }
      } catch (err) {
        if (!cancelled) {
          console.error("Failed to load doctor management data:", err);
        }
      } finally {
        setLoading(false);
      }
    }

    void loadData();

    return () => {
      cancelled = true;
    };
  }, [isDoctor]);

  useEffect(() => {
    if (!isDoctor || !user?.id) return;
    let cancelled = false;
    doctorProfileService
      .getDoctorProfile(user.id)
      .then((record) => {
        if (!cancelled) setOwnProfile(record);
      })
      .catch((err) => {
        if (!cancelled)
          console.error("Failed to load own doctor profile:", err);
      })
      .finally(() => {
        setOwnProfileLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [isDoctor, user?.id]);

  const handleSaveEditDoctor = async () => {
    setEditingDoctor(null);
    try {
      const updated = await fetchDoctors();
      setDoctors(updated);
      showToast("Doctor information updated successfully.");
    } catch (err) {
      console.log(err);
      console.error("Failed to refresh doctors after edit");
    }
  };

  const handleEdit = async (doc: DoctorRecord) => {
    setEditingDoctor(doc);
  };

  const handleConfirmDeactivate = async () => {
    if (!deactivateDialogDoctor) return;
    setIsDeactivating(true);
    try {
      const numericId = deactivateDialogDoctor.id.replace(/^DOC-/, "");
      await usersApi.adminDeactivateUser(
        numericId,
        "Deactivated from Doctor Management",
      );
      const overrides = JSON.parse(
        localStorage.getItem("doctor_status_overrides:v1") || "{}",
      );
      overrides[deactivateDialogDoctor.id] = {
        status: "Inactive",
        availability: "Out of Office",
      };
      localStorage.setItem(
        "doctor_status_overrides:v1",
        JSON.stringify(overrides),
      );
      setDoctors((prev) =>
        prev.map((d) =>
          d.id === deactivateDialogDoctor.id
            ? {
                ...d,
                status: "Inactive" as DoctorRecord["status"],
                availability: "Out of Office" as DoctorRecord["availability"],
              }
            : d,
        ),
      );
      setDeactivateDialogDoctor(null);
      setEditingDoctor(null);
      showToast(`Doctor ${deactivateDialogDoctor.name} has been deactivated.`);
    } catch (err) {
      console.warn("Failed to deactivate doctor:", err);
      showToast("Failed to deactivate doctor. Please try again.");
    } finally {
      setIsDeactivating(false);
    }
  };

  const handleConfirmActivate = async () => {
    if (!activateDialogDoctor) return;
    setIsActivating(true);
    try {
      const numericId = activateDialogDoctor.id.replace(/^DOC-/, "");
      await usersApi.adminActivateUser(numericId);
      const overrides = JSON.parse(
        localStorage.getItem("doctor_status_overrides:v1") || "{}",
      );
      overrides[activateDialogDoctor.id] = {
        status: "Active",
        availability: "Available Today",
      };
      localStorage.setItem(
        "doctor_status_overrides:v1",
        JSON.stringify(overrides),
      );
      setDoctors((prev) =>
        prev.map((d) =>
          d.id === activateDialogDoctor.id
            ? {
                ...d,
                status: "Active" as DoctorRecord["status"],
                availability: "Available Today" as DoctorRecord["availability"],
              }
            : d,
        ),
      );
      setActivateDialogDoctor(null);
      showToast(`Doctor ${activateDialogDoctor.name} has been activated.`);
    } catch (err) {
      console.warn("Failed to activate doctor:", err);
      showToast("Failed to activate doctor. Please try again.");
    } finally {
      setIsActivating(false);
    }
  };

  const handleConfirmResetPassword = async () => {
    if (!resetPassDoctor) return;
    setIsResetting(true);
    try {
      const userId =
        resetPassDoctor.userId || resetPassDoctor.id.replace(/^DOC-/, "");
      await usersApi.adminResetPassword(userId);
      setResetPassDoctor(null);
      showToast(
        `Password reset triggered for ${resetPassDoctor.name}. Temporary instructions sent to ${resetPassDoctor.email}.`,
      );
    } catch (err) {
      console.warn("Failed to reset doctor password:", err);
      showToast("Failed to reset password. Please try again.");
    } finally {
      setIsResetting(false);
    }
  };

  const handleResetAllFilters = () => {
    resetFilters();
    showToast("All search criteria and filters reset.");
  };

  if (isDoctor) {
    if (ownProfileLoading || !ownProfile) {
      return (
        <div
          className="flex-1 overflow-y-auto p-6 bg-[#F1F5F9] flex items-center justify-center"
          style={{ fontFamily: RB }}
        >
          <div className="flex items-center gap-2 text-sm text-[#64748B]">
            <span className="w-4 h-4 border-2 border-[#0D47A1] border-t-transparent rounded-full animate-spin" />
            Loading your profile...
          </div>
        </div>
      );
    }

    return (
      <DoctorProfileScreen
        doctor={ownProfile}
        doctorId={String(ownProfile.id)}
        currentRole={currentRole}
        isOwnRecord={true}
        onBack={() => {}}
        onEdit={async (updatedDoc) => {
          try {
            await doctorProfileService.updateDoctor(updatedDoc);
            const refreshed = await doctorProfileService.getDoctorProfile(
              user!.id,
            );
            setOwnProfile(refreshed);
            showToast("Profile updated successfully.");
          } catch (err) {
            console.error("Failed to save profile:", err);
            showToast("Failed to update profile. Please try again.");
          }
        }}
      />
    );
  }

  if (fullProfileDoctor) {
    return (
      <DoctorProfileScreen
        doctor={fullProfileDoctor}
        doctorId={fullProfileDoctor.id}
        currentRole={currentRole}
        isOwnRecord={false}
        onBack={() => setFullProfileDoctor(null)}
        onEdit={(updatedDoc) => {
          setDoctors((prev) =>
            prev.map((d) => (d.id === updatedDoc.id ? updatedDoc : d)),
          );
          setFullProfileDoctor(updatedDoc);
        }}
      />
    );
  }

  const totalDoctorsCount = doctors.length;
  const availableTodayCount = doctors.filter(
    (d) => d.availability === "Available Today" || d.availability === "On Duty",
  ).length;
  const onLeaveCount = doctors.filter(
    (d) => d.availability === "On Leave" || d.status === "On Leave",
  ).length;
  const departmentsCoveredCount = new Set(doctors.map((d) => d.department))
    .size;

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
            {currentRole === "RECEPTIONIST"
              ? "Doctor Management"
              : "Doctor Management"}
          </h1>
          <div
            className="flex items-center gap-1.5 text-xs text-[#64748B] mt-1"
            style={{ fontFamily: RB }}
          >
            <span>Doctors</span>
            <ChevronRight size={13} className="text-slate-300" />
            <span className="font-medium text-[#111827]">
              Doctor Management
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={async () => {
              try {
                const updated = await fetchDoctors();
                setDoctors(updated);
                showToast("Refreshing doctor records from backend...");
              } catch (err) {
                console.log(err);
                console.error("Failed to refresh doctors");
              }
            }}
            className="px-3 py-2 rounded-xl bg-white border border-[#E5E7EB] text-slate-600 hover:text-[#0D47A1] text-xs font-semibold transition-colors flex items-center gap-1.5 shadow-sm"
          >
            <RefreshCw
              size={13}
              className={loading ? "animate-spin text-[#0D47A1]" : ""}
            />
            <span>{loading ? "Refreshing..." : "Refresh List"}</span>
          </button>
        </div>
      </div>

      <KpiCards
        totalDoctorsCount={totalDoctorsCount}
        availableTodayCount={availableTodayCount}
        onLeaveCount={onLeaveCount}
        departmentsCoveredCount={departmentsCoveredCount}
        isLoading={loading}
      />

      <DoctorTable
        doctors={doctors}
        filteredDoctors={filteredDoctors}
        isLoading={loading}
        searchQuery={searchDoctorQuery}
        onSearchChange={setSearchDoctorQuery}
        deptFilter={deptFilter}
        setDeptFilter={setDeptFilter}
        specialtyFilter={specialtyFilter}
        setSpecialtyFilter={setSpecialtyFilter}
        availabilityFilter={availabilityFilter}
        setAvailabilityFilter={setAvailabilityFilter}
        statusFilter={statusFilter}
        setStatusFilter={setStatusFilter}
        experienceFilter={experienceFilter}
        setExperienceFilter={setExperienceFilter}
        departments={departments}
        sortColumn={sortColumn}
        sortDirection={sortDirection}
        onSort={handleSort}
        onViewProfile={(doc) => setFullProfileDoctor(doc)}
        onQuickView={(doc) => setQuickDetailsDoctor(doc)}
        onEdit={canEditProfile ? handleEdit : undefined}
        onViewSchedule={
          canViewSchedule ? (doc) => setScheduleDoctor(doc) : undefined
        }
        onDeactivate={
          canDeactivate ? (doc) => setDeactivateDialogDoctor(doc) : undefined
        }
        onActivate={
          canDeactivate ? (doc) => setActivateDialogDoctor(doc) : undefined
        }
        onResetPassword={
          canDeactivate ? (doc) => setResetPassDoctor(doc) : undefined
        }
        onAddDoctor={undefined}
        onResetFilters={handleResetAllFilters}
      />

      <QuickDetailsDrawer
        isOpen={Boolean(quickDetailsDoctor)}
        doctor={quickDetailsDoctor}
        onClose={() => setQuickDetailsDoctor(null)}
        onViewFullProfile={(doc) => {
          setQuickDetailsDoctor(null);
          setFullProfileDoctor(doc);
        }}
      />

      <EditStaffUserDrawer
        user={editingDoctor ? doctorToEditUser(editingDoctor) : null}
        onClose={() => setEditingDoctor(null)}
        onSaved={handleSaveEditDoctor}
      />

      <ScheduleModal
        isOpen={Boolean(scheduleDoctor)}
        doctor={scheduleDoctor}
        onClose={() => setScheduleDoctor(null)}
      />

      <DeactivateDoctorDialog
        isOpen={Boolean(deactivateDialogDoctor)}
        doctor={deactivateDialogDoctor}
        onClose={() => setDeactivateDialogDoctor(null)}
        onConfirm={handleConfirmDeactivate}
        isDeactivating={isDeactivating}
      />

      <ActivateDoctorDialog
        isOpen={Boolean(activateDialogDoctor)}
        doctor={activateDialogDoctor}
        onClose={() => setActivateDialogDoctor(null)}
        onConfirm={handleConfirmActivate}
        isActivating={isActivating}
      />

      <ResetPasswordDialog
        isOpen={Boolean(resetPassDoctor)}
        doctor={resetPassDoctor}
        onClose={() => setResetPassDoctor(null)}
        onConfirm={handleConfirmResetPassword}
        isResetting={isResetting}
      />
    </div>
  );
}
