const getRoleBadgeStyle = (role: SystemRole) => {
  switch (role) {
    case "Super Admin":
      return "bg-purple-50 text-purple-700 border-purple-200";
    case "Hospital Admin":
      return "bg-blue-50 text-[#0D47A1] border-blue-200";
    case "Doctor":
      return "bg-teal-50 text-[#009688] border-teal-200";
    case "Nurse":
      return "bg-emerald-50 text-emerald-700 border-emerald-200";
    case "Receptionist":
      return "bg-cyan-50 text-cyan-700 border-cyan-200";
    case "Accountant":
      return "bg-amber-50 text-[#F59E0B] border-amber-200";
    case "Patient":
      return "bg-indigo-50 text-indigo-700 border-indigo-200";
    default:
      return "bg-slate-50 text-slate-700 border-slate-200";
  }
};

import React, { useState, useMemo, useEffect, useCallback } from "react";
import { useNavigate } from "react-router";
import { ROUTES } from "../../../app/routes/routes";
import {
  Users,
  UserCheck,
  UserX,
  Filter,
  Shield,
  Key,
  Edit,
  Eye,
  X,
  CheckCircle2,
  AlertTriangle,
  Mail,
  Clock,
  RotateCcw,
  UserPlus,
  Loader2,
  Building,
} from "lucide-react";
import DashboardHeader from "../../dashboard/components/DashboardHeader";
import CreateStaffPage from "./CreateStaffPage";
import { DepartmentsSpecialtiesWorkspace } from "./DepartmentsSpecialtiesWorkspace";
import { usersApi } from "../api/users.api";
import { departmentsApi } from "../api/departments.api";
import { EditStaffUserDrawer } from "../components/EditStaffUserDrawer";
import type { User } from "../../auth/types/auth.types";
import { DataTable } from "../../../common/components/DataTable";

// --- Typography & Design Tokens ---
const PP = "Poppins, sans-serif";
const RB = "Roboto, sans-serif";

const formatLastLogin = (lastLogin: string | null): string => {
  if (!lastLogin) return "—";
  try {
    const date = new Date(lastLogin);
    if (isNaN(date.getTime())) return "—";
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  } catch (err) {
    console.log(err);
    return "—";
  }
};

type SystemRole =
  | "Super Admin"
  | "Hospital Admin"
  | "Doctor"
  | "Receptionist"
  | "Nurse"
  | "Accountant"
  | "Patient";

type AccountStatus = "Active" | "Inactive" | "Pending" | "Suspended";

interface UserRecord {
  id: string;
  empId: string;
  fullName: string;
  username: string;
  email: string;
  phone: string;
  role: SystemRole;
  department: string | null;
  status: AccountStatus;
  lastLogin: string | null;
  joinedDate: string;
  twoFactor: boolean;
  departmentId?: number;
  photoUrl?: string | null;
  photo?: string | null;
}

// Map backend roles to frontend display roles
const BACKEND_TO_DISPLAY_ROLE: Record<string, SystemRole> = {
  SUPER_ADMIN: "Super Admin",
  HOSPITAL_ADMIN: "Hospital Admin",
  DOCTOR: "Doctor",
  RECEPTIONIST: "Receptionist",
  NURSE: "Nurse",
  ACCOUNTANT: "Accountant",
  PATIENT: "Patient",
};

// Map backend statuses to frontend display statuses
const BACKEND_TO_DISPLAY_STATUS: Record<string, AccountStatus> = {
  ACTIVE: "Active",
  INACTIVE: "Inactive",
  PENDING: "Pending",
  SUSPENDED: "Suspended",
};

const UserManagement: React.FC = () => {
  const navigate = useNavigate();

  const [isCreatingStaff, setIsCreatingStaff] = useState(false);
  const [userMgmtTab, setUserMgmtTab] = useState<"users" | "departments">(
    "users",
  );

  // Main Data States
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("All");
  const [statusFilter, setStatusFilter] = useState<string>("All");

  // Sorting
  const [sortColumn] = useState<keyof UserRecord>("empId");
  const [sortDirection] = useState<"asc" | "desc">("asc");

  // Departments fetched from API (replaces hardcoded DEPARTMENT_NAME_TO_ID)
  const [apiDepartments, setApiDepartments] = useState<
    { id: number | string; name: string }[]
  >([]);

  const deptIdToName = useMemo(() => {
    const map: Record<number, string> = {};
    apiDepartments.forEach((d) => {
      map[Number(d.id)] = d.name;
    });
    return map;
  }, [apiDepartments]);

  // Toast state
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const triggerToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 4000);
  };

  // Drawer States
  const [editingUser, setEditingUser] = useState<UserRecord | null>(null);
  const [detailsUser, setDetailsUser] = useState<UserRecord | null>(null);
  const [fullUserDetail, setFullUserDetail] = useState<
    import("../types/users.types").UserDetailData | null
  >(null);
  const [isFetchingDetail, setIsFetchingDetail] = useState(false);

  // Dialog States
  const [resetPassUser, setResetPassUser] = useState<UserRecord | null>(null);
  const [statusDialogUser, setStatusDialogUser] = useState<{
    user: UserRecord;
    action: "Activate" | "Suspend" | "Deactivate";
  } | null>(null);

  // Loading states for actions
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  // Local override map for status persistence across backend refetches
  const [localStatusOverrides, setLocalStatusOverrides] = useState<
    Record<string, AccountStatus>
  >({});

  // Fetch departments from API (mirrors ConsultationDetailsSection approach)
  useEffect(() => {
    departmentsApi.getDepartmentLookup(true).then((lookupList) => {
      if (lookupList && lookupList.length > 0) {
        const mapped = lookupList.map((d) => ({
          id: d.departmentId,
          name: d.departmentName,
        }));
        setApiDepartments(mapped);
      } else {
        departmentsApi.getDepartments({ activeOnly: true }).then((list) => {
          const items = Array.isArray(list) ? list : list?.content || [];
          const mapped = items.flatMap(
            (d: {
              departmentId?: string | number;
              id?: string | number;
              departmentName?: string;
              name?: string;
            }) => {
              const name = d.departmentName || d.name || "";
              return name
                ? [
                    {
                      id: d.departmentId ?? d.id ?? "",
                      name,
                    },
                  ]
                : [];
            },
          );
          if (mapped.length > 0) setApiDepartments(mapped);
        });
      }
    });
  }, []);

  // Fetch Users function
  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setErrorMsg(null);

    try {
      const response = await usersApi.adminGetUsers();
      const rawList = Array.isArray(response)
        ? response
        : Array.isArray(response?.data)
          ? response.data
          : [];

      if (rawList.length > 0 || response?.success) {
        const mappedUsers: UserRecord[] = rawList.map(
          (u: User & { userId?: number }, index: number) => {
            const userId = u.userId ?? u.id;
            const roleDisplay =
              BACKEND_TO_DISPLAY_ROLE[String(u.role).toUpperCase()] || "Doctor";
            const uid = userId ? String(userId) : `user-record-${index}`;
            const statusDisplay =
              localStatusOverrides[uid] ||
              BACKEND_TO_DISPLAY_STATUS[String(u.status).toUpperCase()] ||
              "Active";
            const deptId =
              Number(u.primaryDepartmentId ?? u.departmentId ?? u.hospitalId) ||
              undefined;

            const uRecord = u as unknown as Record<string, unknown>;
            const doctorProfile = uRecord.doctorProfile as
              | Record<string, unknown>
              | undefined;
            const primaryDept = doctorProfile?.primaryDepartment as
              | Record<string, unknown>
              | undefined;
            const deptName =
              u.departmentName ??
              u.department ??
              (primaryDept?.departmentName as string) ??
              (deptId !== undefined ? deptIdToName[deptId] : null) ??
              null;

            const photoVal =
              uRecord.photoUrl ||
              uRecord.photo ||
              doctorProfile?.photoUrl ||
              doctorProfile?.photo ||
              null;

            return {
              id: uid,
              empId:
                u.employeeId ||
                `EMP-${roleDisplay.substring(0, 3).toUpperCase()}-${userId ?? index}`,
              fullName: u.fullName || "Staff User",
              username: u.email
                ? u.email.split("@")[0]
                : `user_${userId ?? index}`,
              email: u.email || "",
              phone: u.mobile || "+1 (555) 000-0000",
              role: roleDisplay,
              department: deptName,
              departmentId: deptId,
              status: statusDisplay,
              photoUrl: photoVal ? String(photoVal) : null,
              photo: photoVal ? String(photoVal) : null,
              lastLogin: uRecord.lastSuccessfulLogin
                ? String(uRecord.lastSuccessfulLogin)
                : uRecord.lastLogin
                  ? String(uRecord.lastLogin)
                  : null,
              joinedDate: "2023-11-01",
              twoFactor: false,
            };
          },
        );
        setUsers(mappedUsers);
      } else {
        setErrorMsg(response?.message || "Failed to retrieve staff list.");
      }
    } catch (err: unknown) {
      const errMsg =
        err instanceof Error ? err.message : "Error fetching staff accounts";
      setErrorMsg(errMsg);
    } finally {
      setLoading(false);
    }
  }, [deptIdToName, localStatusOverrides]);

  // Fetch users on mount
  useEffect(() => {
    let active = true;
    const loadData = async () => {
      setLoading(true);
      setErrorMsg(null);

      try {
        const response = await usersApi.adminGetUsers();
        const rawList = Array.isArray(response)
          ? response
          : Array.isArray(response?.data)
            ? response.data
            : [];

        if (active) {
          if (rawList.length > 0 || response?.success) {
            const mappedUsers: UserRecord[] = rawList.map(
              (u: User & { userId?: number }, index: number) => {
                const userId = u.userId ?? u.id;
                const roleDisplay =
                  BACKEND_TO_DISPLAY_ROLE[String(u.role).toUpperCase()] ||
                  "Doctor";
                const uid = userId ? String(userId) : `user-record-${index}`;
                const statusDisplay =
                  localStatusOverrides[uid] ||
                  BACKEND_TO_DISPLAY_STATUS[String(u.status).toUpperCase()] ||
                  "Active";
                const deptId =
                  Number(
                    u.primaryDepartmentId ?? u.departmentId ?? u.hospitalId,
                  ) || undefined;

                const uRecord = u as unknown as Record<string, unknown>;
                const doctorProfile = uRecord.doctorProfile as
                  | Record<string, unknown>
                  | undefined;
                const primaryDept = doctorProfile?.primaryDepartment as
                  | Record<string, unknown>
                  | undefined;
                const deptName =
                  u.departmentName ??
                  u.department ??
                  (primaryDept?.departmentName as string) ??
                  (deptId !== undefined ? deptIdToName[deptId] : null) ??
                  null;

                const photoVal =
                  uRecord.photoUrl ||
                  uRecord.photo ||
                  doctorProfile?.photoUrl ||
                  doctorProfile?.photo ||
                  null;

                return {
                  id: uid,
                  empId:
                    u.employeeId ||
                    `EMP-${roleDisplay.substring(0, 3).toUpperCase()}-${userId ?? index}`,
                  fullName: u.fullName || "Staff User",
                  username: u.email
                    ? u.email.split("@")[0]
                    : `user_${userId ?? index}`,
                  email: u.email || "",
                  phone: u.mobile || "+1 (555) 000-0000",
                  role: roleDisplay,
                  department: deptName,
                  departmentId: deptId,
                  status: statusDisplay,
                  photoUrl: photoVal ? String(photoVal) : null,
                  photo: photoVal ? String(photoVal) : null,
                  lastLogin: uRecord.lastSuccessfulLogin
                    ? String(uRecord.lastSuccessfulLogin)
                    : uRecord.lastLogin
                      ? String(uRecord.lastLogin)
                      : null,
                  joinedDate: "2023-11-01",
                  twoFactor: false,
                };
              },
            );
            setUsers(mappedUsers);
          } else {
            setErrorMsg(response?.message || "Failed to retrieve staff list.");
          }
        }
      } catch (err: unknown) {
        if (active) {
          const errMsg =
            err instanceof Error
              ? err.message
              : "Error fetching staff accounts";
          setErrorMsg(errMsg);
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    void loadData();

    return () => {
      active = false;
    };
  }, [deptIdToName, localStatusOverrides]);

  // Open View Details Drawer & fetch full backend record
  const handleOpenDetailsDrawer = async (user: UserRecord) => {
    setDetailsUser(user);
    setFullUserDetail(null);
    setIsFetchingDetail(true);
    try {
      const response = await usersApi.adminGetUserById(user.id);
      if (response.success && response.data) {
        setFullUserDetail(response.data);
      }
    } catch (err: unknown) {
      console.error("Failed to fetch full user details:", err);
    } finally {
      setIsFetchingDetail(false);
    }
  };

  // Open Edit Drawer (shared EditStaffUserDrawer prefills & saves via usersApi)
  const handleOpenEditDrawer = (user: UserRecord) => {
    setEditingUser(user);
  };

  const handleSavedEditUser = () => {
    setEditingUser(null);
    triggerToast(
      `User ${editingUser?.empId ?? ""} profile updated successfully!`,
    );
    fetchUsers(); // Refresh database list
  };

  // Handle Password Reset Request (POST /api/v1/admin/users/{userId}/reset-password)
  const handleConfirmResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetPassUser) return;

    setIsSubmitting(true);
    try {
      const response = await usersApi.adminResetPassword(resetPassUser.id);
      if (response.success) {
        triggerToast(
          `Password reset triggered successfully for ${resetPassUser.empId}. Temporary instructions sent.`,
        );
        setResetPassUser(null);
      } else {
        triggerToast(response.message || "Failed to reset password.");
      }
    } catch (err: unknown) {
      const errMsg =
        err instanceof Error ? err.message : "Error resetting password";
      triggerToast(errMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Account Status Toggles (Activate / Suspend / Deactivate)
  const handleConfirmStatusChange = async () => {
    if (!statusDialogUser) return;
    const { user, action } = statusDialogUser;

    const loadingKey = `${action.toLowerCase()}-${user.id}`;
    setActionLoadingId(loadingKey);
    setStatusDialogUser(null); // Close dialog immediately

    try {
      let response;
      if (action === "Activate") {
        response = await usersApi.adminActivateUser(user.id);
      } else {
        response = await usersApi.adminDeactivateUser(
          user.id,
          `${action} triggered from dashboard`,
        );
      }

      if (response && response.success) {
        const newStatus: AccountStatus =
          action === "Activate" ? "Active" : "Inactive";
        setLocalStatusOverrides((prev) => ({ ...prev, [user.id]: newStatus }));
        setUsers((prevUsers) =>
          prevUsers.map((u) =>
            u.id === user.id ? { ...u, status: newStatus } : u,
          ),
        );
        triggerToast(
          `User ${user.empId} account status successfully changed to "${newStatus}".`,
        );
      } else {
        triggerToast(response?.message || "Failed to toggle account status.");
      }
    } catch (err: unknown) {
      const errMsg =
        err instanceof Error ? err.message : "Error changing account status";
      triggerToast(errMsg);
    } finally {
      setActionLoadingId(null);
    }
  };

  // --- KPI Counts ---
  const totalUsersCount = users.length;
  const activeUsersCount = users.filter((u) => u.status === "Active").length;
  const inactiveUsersCount = users.filter(
    (u) => u.status === "Inactive" || u.status === "Suspended",
  ).length;
  const pendingUsersCount = users.filter((u) => u.status === "Pending").length;

  // Filtered & Sorted Users dataset
  const filteredUsers = useMemo(() => {
    return users
      .filter((u) => {
        // Search
        if (searchQuery) {
          const q = searchQuery.toLowerCase();
          const match =
            u.empId.toLowerCase().includes(q) ||
            u.fullName.toLowerCase().includes(q) ||
            u.email.toLowerCase().includes(q) ||
            u.username.toLowerCase().includes(q) ||
            (u.department?.toLowerCase() || "").includes(q);
          if (!match) return false;
        }
        // Filters
        if (roleFilter !== "All" && u.role !== roleFilter) return false;
        if (statusFilter !== "All" && u.status !== statusFilter) return false;
        return true;
      })
      .sort((a, b) => {
        let valA = a[sortColumn] ?? "";
        let valB = b[sortColumn] ?? "";
        if (typeof valA === "string") valA = valA.toLowerCase();
        if (typeof valB === "string") valB = valB.toLowerCase();
        if (valA < valB) return sortDirection === "asc" ? -1 : 1;
        if (valA > valB) return sortDirection === "asc" ? 1 : -1;
        return 0;
      });
  }, [users, searchQuery, roleFilter, statusFilter, sortColumn, sortDirection]);

  // Role badge styles

  if (isCreatingStaff) {
    return (
      <CreateStaffPage
        onBack={() => setIsCreatingStaff(false)}
        onSuccess={() => {
          setIsCreatingStaff(false);
          fetchUsers();
        }}
      />
    );
  }

  return (
    <div
      className="flex-1 overflow-y-auto space-y-6"
      style={{ fontFamily: RB }}
    >
      {/* Toast Notification */}
      {toastMsg && (
        <div className="fixed top-5 right-5 z-50 bg-[#111827] text-white text-xs font-semibold px-4 py-3 rounded-xl shadow-xl flex items-center gap-2 animate-fade-in">
          <CheckCircle2 size={16} className="text-[#66BB6A]" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* ── 1. PAGE HEADER & BREADCRUMB ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <DashboardHeader
          title="Roles & Management"
          description="Manage active clinical staff accounts, system users, departments, and security roles."
        />

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() =>
              setUserMgmtTab(
                userMgmtTab === "departments" ? "users" : "departments",
              )
            }
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-colors flex items-center gap-2 shadow-sm cursor-pointer ${
              userMgmtTab === "departments"
                ? "bg-[#009688] text-white"
                : "bg-white border border-gray-200 text-[#0D47A1] hover:bg-slate-50"
            }`}
            style={{ fontFamily: PP }}
          >
            <Building size={15} /> Department
          </button>

          <button
            onClick={() => {
              setUserMgmtTab("users");
              setIsCreatingStaff(true);
              if (navigate) {
                try {
                  navigate(ROUTES.USER_MANAGEMENT);
                } catch (e) {
                  console.log(e);
                }
              }
            }}
            className="px-4 py-2.5 rounded-xl bg-[#0D47A1] hover:bg-[#0c3d8a] text-white text-xs font-bold transition-colors flex items-center gap-2 shadow-sm shrink-0 cursor-pointer"
            style={{ fontFamily: PP }}
          >
            <UserPlus size={15} /> Add User
          </button>
        </div>
      </div>

      {userMgmtTab === "departments" ? (
        <DepartmentsSpecialtiesWorkspace />
      ) : (
        <div className="bg-slate-50/50 rounded-2xl shadow-sm border border-gray-200 min-h-175 overflow-hidden flex flex-col font-medium transition-opacity duration-200 w-full space-y-6 relative p-6">
          {errorMsg && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-xs flex items-center justify-between">
              <span>{errorMsg}</span>
              <button
                onClick={() => setErrorMsg(null)}
                className="text-red-500 hover:text-red-700 font-bold ml-2 cursor-pointer"
              >
                ✕
              </button>
            </div>
          )}

          {/* ── 2. SUMMARY KPI CARDS ── */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Total Users */}
            <div className="bg-white rounded-2xl border border-[#E5E7EB] p-4 shadow-sm flex items-center justify-between">
              <div>
                <div className="text-xs text-[#64748B] font-medium">
                  Total Users
                </div>
                <div
                  className="text-2xl font-bold text-[#111827] mt-0.5"
                  style={{ fontFamily: PP }}
                >
                  {totalUsersCount}
                </div>
                <div className="text-[11px] text-[#0D47A1] font-medium mt-1">
                  Across all departments
                </div>
              </div>
              <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-[#0D47A1]">
                <Users size={20} />
              </div>
            </div>

            {/* Active Users */}
            <div className="bg-white rounded-2xl border border-[#E5E7EB] p-4 shadow-sm flex items-center justify-between">
              <div>
                <div className="text-xs text-[#64748B] font-medium">
                  Active Users
                </div>
                <div
                  className="text-2xl font-bold text-[#111827] mt-0.5"
                  style={{ fontFamily: PP }}
                >
                  {activeUsersCount}
                </div>
                <div className="text-[11px] text-[#66BB6A] font-medium mt-1">
                  {totalUsersCount > 0
                    ? Math.round((activeUsersCount / totalUsersCount) * 100)
                    : 0}
                  % of total system users
                </div>
              </div>
              <div className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center text-[#66BB6A]">
                <UserCheck size={20} />
              </div>
            </div>

            {/* Inactive Users */}
            <div className="bg-white rounded-2xl border border-[#E5E7EB] p-4 shadow-sm flex items-center justify-between">
              <div>
                <div className="text-xs text-[#64748B] font-medium">
                  Inactive / Suspended
                </div>
                <div
                  className="text-2xl font-bold text-[#111827] mt-0.5"
                  style={{ fontFamily: PP }}
                >
                  {inactiveUsersCount}
                </div>
                <div className="text-[11px] text-[#EF4444] font-medium mt-1">
                  Access revoked or offboarded
                </div>
              </div>
              <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center text-[#EF4444]">
                <UserX size={20} />
              </div>
            </div>

            {/* Pending Activation */}
            <div className="bg-white rounded-2xl border border-[#E5E7EB] p-4 shadow-sm flex items-center justify-between">
              <div>
                <div className="text-xs text-[#64748B] font-medium">
                  Pending Activation
                </div>
                <div
                  className="text-2xl font-bold text-[#111827] mt-0.5"
                  style={{ fontFamily: PP }}
                >
                  {pendingUsersCount}
                </div>
                <div className="text-[11px] text-[#F59E0B] font-medium mt-1">
                  Awaiting initial password setup
                </div>
              </div>
              <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center text-[#F59E0B]">
                <Clock size={20} />
              </div>
            </div>
          </div>

          {/* ── 3. MAIN ROLES & USER MANAGEMENT TABLE ── */}
          <DataTable<UserRecord>
            data={filteredUsers}
            loading={loading}
            getRowId={(u) => u.id}
            title="Roles & Staff User Roster"
            subtitle="Manage clinical staff accounts, system users, access permissions, and account statuses."
            headerBadge={
              <span className="text-xs font-semibold text-[#0D47A1] bg-blue-50 px-3 py-1 rounded-xl border border-blue-100 font-mono">
                Showing {filteredUsers.length} of {users.length} Users
              </span>
            }
            searchable={true}
            searchPlaceholder=" Search by User Name, Employee ID, Email, Username..."
            searchValue={searchQuery}
            onSearchChange={setSearchQuery}
            toolbar={
              <div className="bg-slate-50/80 border border-[#E5E7EB] rounded-xl p-2.5 space-y-2 shadow-2xs text-xs">
                <div className="flex items-center gap-2 flex-wrap">
                  <div className="flex items-center gap-1.5 bg-white border border-[#E5E7EB] px-2.5 py-1 rounded-lg text-slate-700 font-medium">
                    <Shield size={13} className="text-slate-400" />
                    <span className="text-slate-400 text-[11px]">Role:</span>
                    <select
                      aria-label="Role filter"
                      value={roleFilter}
                      onChange={(e) => setRoleFilter(e.target.value)}
                      className="bg-transparent font-semibold text-[#0D47A1] outline-none cursor-pointer text-xs"
                    >
                      <option value="All">All Roles</option>
                      <option value="Hospital Admin">Hospital Admin</option>
                      <option value="Doctor">Doctor</option>
                      <option value="Receptionist">Receptionist</option>
                      <option value="Nurse">Nurse</option>
                      <option value="Accountant">Accountant</option>
                      <option value="Super Admin">Super Admin</option>
                      <option value="Patient">Patient</option>
                    </select>
                  </div>

                  <div className="flex items-center gap-1.5 bg-white border border-[#E5E7EB] px-2.5 py-1 rounded-lg text-slate-700 font-medium">
                    <Filter size={13} className="text-slate-400" />
                    <span className="text-slate-400 text-[11px]">Status:</span>
                    <select
                      aria-label="Status filter"
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      className="bg-transparent font-semibold text-[#0D47A1] outline-none cursor-pointer text-xs"
                    >
                      <option value="All">All Statuses</option>
                      <option value="Active">Active</option>
                      <option value="Inactive">Inactive</option>
                      <option value="Pending">Pending</option>
                      <option value="Suspended">Suspended</option>
                    </select>
                  </div>

                  {(roleFilter !== "All" ||
                    statusFilter !== "All" ||
                    searchQuery) && (
                    <button
                      onClick={() => {
                        setSearchQuery("");
                        setRoleFilter("All");
                        setStatusFilter("All");
                        triggerToast("Filters reset.");
                      }}
                      className="px-2.5 py-1 rounded-lg border border-red-200 bg-red-50 hover:bg-red-100 text-red-600 text-[11px] font-semibold transition-colors flex items-center gap-1 cursor-pointer shadow-2xs shrink-0 ml-auto"
                      style={{ fontFamily: PP }}
                    >
                      <RotateCcw size={12} /> Clear Filters
                    </button>
                  )}
                </div>
              </div>
            }
            columns={[
              {
                key: "empId",
                label: "EMPLOYEE ID",
                sortable: true,
                getValue: (user) => user.empId,
                render: (user) => (
                  <span className="font-mono font-bold text-[#0D47A1]">
                    {user.empId}
                  </span>
                ),
              },
              {
                key: "fullName",
                label: "FULL NAME",
                sortable: true,
                getValue: (user) => user.fullName,
                render: (user) => {
                  const initials = user.fullName
                    .split(" ")
                    .filter((n) => n.length > 0)
                    .map((n) => n[0])
                    .join("")
                    .toUpperCase()
                    .slice(0, 2);
                  return (
                    <div className="flex items-center gap-3">
                      <div
                        className="w-8 h-8 rounded-xl bg-blue-100 text-[#0D47A1] font-bold text-xs flex items-center justify-center shrink-0"
                        style={{ fontFamily: PP }}
                      >
                        {initials}
                      </div>
                      <div>
                        <span
                          className="font-bold text-[#111827] block"
                          style={{ fontFamily: PP }}
                        >
                          {user.fullName}
                        </span>
                        <span className="text-[10px] text-[#64748B]">
                          @{user.username}
                        </span>
                      </div>
                    </div>
                  );
                },
              },
              {
                key: "role",
                label: "ROLE",
                sortable: true,
                getValue: (user) => user.role,
                render: (user) => (
                  <span
                    className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold border ${getRoleBadgeStyle(user.role)}`}
                  >
                    <Shield size={11} /> {user.role}
                  </span>
                ),
              },
              {
                key: "email",
                label: "EMAIL",
                sortable: true,
                getValue: (user) => user.email,
                render: (user) => (
                  <a
                    href={`mailto:${user.email}`}
                    className="hover:text-[#0D47A1] hover:underline flex items-center gap-1 text-slate-600"
                  >
                    <Mail size={12} className="text-slate-400 shrink-0" />
                    <span className="truncate max-w-40">{user.email}</span>
                  </a>
                ),
              },
              {
                key: "phone",
                label: "PHONE",
                sortable: true,
                getValue: (user) => user.phone,
                render: (user) => (
                  <span className="text-slate-600 font-mono">{user.phone}</span>
                ),
              },
              {
                key: "status",
                label: "STATUS",
                sortable: true,
                getValue: (user) => user.status,
                render: (user) => (
                  <span
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${
                      user.status === "Active"
                        ? "bg-green-50 text-[#66BB6A]"
                        : user.status === "Pending"
                          ? "bg-amber-50 text-[#F59E0B]"
                          : user.status === "Suspended"
                            ? "bg-orange-50 text-orange-600"
                            : "bg-red-50 text-[#EF4444]"
                    }`}
                  >
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        user.status === "Active"
                          ? "bg-[#66BB6A]"
                          : user.status === "Pending"
                            ? "bg-[#F59E0B]"
                            : user.status === "Suspended"
                              ? "bg-orange-500"
                              : "bg-[#EF4444]"
                      }`}
                    />
                    {user.status}
                  </span>
                ),
              },
              {
                key: "lastLogin",
                label: "LAST LOGIN",
                sortable: true,
                getValue: (user) => user.lastLogin || "",
                render: (user) => (
                  <span className="text-slate-500 text-[11px]">
                    {formatLastLogin(user.lastLogin)}
                  </span>
                ),
              },
              {
                key: "actions",
                label: "ACTIONS",
                sortable: false,
                align: "right",
                render: (user) => (
                  <div className="flex items-center justify-end gap-1">
                    <button
                      onClick={() => handleOpenDetailsDrawer(user)}
                      className="p-1.5 text-slate-500 hover:text-[#0D47A1] hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                      title="View User Details"
                    >
                      <Eye size={15} />
                    </button>

                    <button
                      onClick={() => handleOpenEditDrawer(user)}
                      className="p-1.5 text-slate-500 hover:text-[#009688] hover:bg-teal-50 rounded-lg transition-colors cursor-pointer"
                      title="Edit User Information"
                    >
                      <Edit size={15} />
                    </button>

                    <button
                      onClick={() => setResetPassUser(user)}
                      className="p-1.5 text-slate-500 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors cursor-pointer"
                      title="Reset Password"
                    >
                      <Key size={15} />
                    </button>

                    {user.status === "Active" ? (
                      <button
                        onClick={() =>
                          setStatusDialogUser({
                            user,
                            action: "Deactivate",
                          })
                        }
                        disabled={actionLoadingId === `suspend-${user.id}`}
                        className="p-1.5 text-slate-400 hover:text-[#EF4444] hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                        title="Suspend Account"
                      >
                        {actionLoadingId === `suspend-${user.id}` ? (
                          <Loader2
                            size={14}
                            className="animate-spin text-red-500"
                          />
                        ) : (
                          <UserX size={15} />
                        )}
                      </button>
                    ) : (
                      <button
                        onClick={() =>
                          setStatusDialogUser({
                            user,
                            action: "Activate",
                          })
                        }
                        disabled={actionLoadingId === `activate-${user.id}`}
                        className="p-1.5 text-slate-400 hover:text-[#66BB6A] hover:bg-green-50 rounded-lg transition-colors cursor-pointer"
                        title="Activate Account"
                      >
                        {actionLoadingId === `activate-${user.id}` ? (
                          <Loader2
                            size={14}
                            className="animate-spin text-green-500"
                          />
                        ) : (
                          <UserCheck size={15} />
                        )}
                      </button>
                    )}
                  </div>
                ),
              },
            ]}
            emptyTitle="No users found"
            emptySubtitle="No user records match your search or filter criteria."
            emptyIcon={<Users size={28} />}
            pagination={true}
          />
        </div>
      )}

      {/* ── 6. RIGHT DRAWER: EDIT USER ── */}
      <EditStaffUserDrawer
        user={editingUser}
        onClose={() => setEditingUser(null)}
        onSaved={handleSavedEditUser}
      />

      {/* ── 7. RIGHT DRAWER: VIEW DETAILS ── */}
      {detailsUser && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          <div
            role="presentation"
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs"
            onClick={() => setDetailsUser(null)}
          />
          <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
            <div className="w-screen max-w-lg bg-white shadow-2xl flex flex-col border-l border-gray-100 transition-transform duration-200">
              <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between shadow-sm">
                <div>
                  <h2
                    className="text-base font-bold flex items-center gap-2"
                    style={{ fontFamily: PP }}
                  >
                    <Eye size={18} /> Staff Profile Overview
                  </h2>
                  <p className="text-xs text-slate-300 mt-0.5">
                    Auditing record fields for {detailsUser.empId}
                  </p>
                </div>
                <button
                  aria-label="Close"
                  onClick={() => setDetailsUser(null)}
                  className="p-1.5 text-white/80 hover:text-white rounded-lg hover:bg-white/10 cursor-pointer"
                >
                  <X size={20} />
                </button>
              </div>

              <div
                className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50"
                style={{ fontFamily: RB }}
              >
                {/* Profile Header Card */}
                <div className="bg-white rounded-2xl border border-[#E5E7EB] p-5 text-center flex flex-col items-center shadow-xs">
                  <div className="w-16 h-16 rounded-full bg-blue-100 text-[#0D47A1] font-bold text-lg flex items-center justify-center mb-3">
                    {detailsUser.fullName
                      .split(" ")
                      .map((n) => n[0])
                      .join("")
                      .slice(0, 2)
                      .toUpperCase()}
                  </div>
                  <h3
                    className="font-bold text-base text-[#111827]"
                    style={{ fontFamily: PP }}
                  >
                    {detailsUser.fullName}
                  </h3>
                  <p className="text-xs text-slate-400">
                    @{detailsUser.username}
                  </p>

                  <div className="flex gap-2 mt-4">
                    <span
                      className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-bold border ${getRoleBadgeStyle(detailsUser.role)}`}
                    >
                      {detailsUser.role}
                    </span>
                    <span
                      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-bold ${
                        detailsUser.status === "Active"
                          ? "bg-green-50 text-[#66BB6A]"
                          : "bg-red-50 text-red-500"
                      }`}
                    >
                      {detailsUser.status}
                    </span>
                  </div>
                </div>

                {/* Database Fields */}
                <div className="bg-white rounded-2xl border border-[#E5E7EB] p-5 space-y-4">
                  <h4 className="font-heading text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                    Account Registry Metadata
                  </h4>

                  {isFetchingDetail ? (
                    <div className="flex items-center justify-center py-6 text-slate-400 gap-2 text-xs">
                      <Loader2 size={16} className="animate-spin" /> Fetching
                      complete profile...
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-4 text-xs">
                      <div>
                        <span className="text-slate-400 block font-medium">
                          Employee Reference ID
                        </span>
                        <span className="font-bold text-slate-900 mt-1 block font-mono">
                          {detailsUser.empId}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400 block font-medium">
                          Department Unit
                        </span>
                        <span className="font-bold text-slate-900 mt-1 block">
                          {fullUserDetail?.doctorProfile?.primaryDepartment
                            ?.departmentName || detailsUser.department}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400 block font-medium">
                          System User ID
                        </span>
                        <span className="font-semibold text-slate-700 mt-1 block font-mono">
                          {detailsUser.id}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400 block font-medium">
                          Gender & Date of Birth
                        </span>
                        <span className="font-bold text-slate-900 mt-1 block">
                          {fullUserDetail?.gender || "N/A"}{" "}
                          {fullUserDetail?.dateOfBirth
                            ? `(${fullUserDetail.dateOfBirth})`
                            : ""}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400 block font-medium">
                          Email Address
                        </span>
                        <span className="font-bold text-slate-900 mt-1 block">
                          {detailsUser.email}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400 block font-medium">
                          Mobile Contact
                        </span>
                        <span className="font-bold text-slate-900 mt-1 block font-mono">
                          {fullUserDetail?.mobile || detailsUser.phone}
                        </span>
                      </div>
                      {fullUserDetail?.residentialAddress && (
                        <div className="col-span-2">
                          <span className="text-slate-400 block font-medium">
                            Residential Address
                          </span>
                          <span className="font-bold text-slate-900 mt-1 block">
                            {fullUserDetail.residentialAddress}
                          </span>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Doctor Clinical Profile (If Doctor Role or Doctor Profile exists) */}
                {fullUserDetail?.doctorProfile && (
                  <div className="bg-white rounded-2xl border border-teal-100 p-5 space-y-4 shadow-xs">
                    <h4 className="font-heading text-xs font-bold text-teal-600 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                      <Shield size={14} /> Doctor Clinical Profile & Fees
                    </h4>

                    <div className="grid grid-cols-2 gap-4 text-xs">
                      <div>
                        <span className="text-slate-400 block font-medium">
                          Registration No.
                        </span>
                        <span className="font-bold text-slate-900 mt-1 block font-mono">
                          {fullUserDetail.doctorProfile
                            .medicalRegistrationNumber || "N/A"}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400 block font-medium">
                          Qualification
                        </span>
                        <span className="font-bold text-slate-900 mt-1 block">
                          {fullUserDetail.doctorProfile.qualification || "N/A"}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400 block font-medium">
                          Experience (Years)
                        </span>
                        <span className="font-bold text-slate-900 mt-1 block font-mono">
                          {fullUserDetail.doctorProfile.yearsOfExperience ??
                            "N/A"}{" "}
                          yrs
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400 block font-medium">
                          Primary Specialty
                        </span>
                        <span className="font-bold text-teal-700 mt-1 block">
                          {fullUserDetail.doctorProfile.primarySpecialty
                            ?.specialtyName || "General Cardiology"}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400 block font-medium">
                          Consultation Fee
                        </span>
                        <span className="font-bold text-slate-900 mt-1 block font-mono">
                          ₹{fullUserDetail.doctorProfile.consultationFee ?? 0}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400 block font-medium">
                          Follow-Up Fee
                        </span>
                        <span className="font-bold text-slate-900 mt-1 block font-mono">
                          ₹{fullUserDetail.doctorProfile.followUpFee ?? 0}
                        </span>
                      </div>
                      <div className="col-span-2">
                        <span className="text-slate-400 block font-medium">
                          Slot Duration
                        </span>
                        <span className="font-bold text-slate-900 mt-1 block font-mono">
                          {fullUserDetail.doctorProfile.slotDurationMinutes ||
                            15}{" "}
                          minutes / patient slot
                        </span>
                      </div>
                    </div>

                    {/* Weekly Availability Schedule */}
                    {fullUserDetail.doctorProfile.availability &&
                      fullUserDetail.doctorProfile.availability.length > 0 && (
                        <div className="mt-3 pt-3 border-t border-slate-100">
                          <span className="text-slate-400 block font-bold text-[11px] mb-2 uppercase">
                            Weekly Availability
                          </span>
                          <div className="flex flex-wrap gap-2">
                            {fullUserDetail.doctorProfile.availability.map(
                              (slot) => (
                                <span
                                  key={`slot-${slot.dayOfWeek || ""}-${slot.startTime}-${slot.endTime}`}
                                  className="bg-teal-50 border border-teal-200 text-teal-800 text-[11px] font-semibold px-2.5 py-1 rounded-lg"
                                >
                                  {slot.dayOfWeek}: {slot.startTime} -{" "}
                                  {slot.endTime}
                                </span>
                              ),
                            )}
                          </div>
                        </div>
                      )}
                  </div>
                )}

                {/* Security Metrics */}
                <div className="bg-white rounded-2xl border border-[#E5E7EB] p-5 space-y-4">
                  <h4 className="font-heading text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                    Access & Security Settings
                  </h4>

                  <div className="grid grid-cols-2 gap-4 text-xs">
                    <div>
                      <span className="text-slate-400 block font-medium">
                        Last Login Timestamp
                      </span>
                      <span className="font-bold text-slate-900 mt-1 block">
                        {formatLastLogin(detailsUser.lastLogin)}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block font-medium">
                        2FA Multi-Factor Auth
                      </span>
                      <span
                        className={`font-bold mt-1 block ${detailsUser.twoFactor ? "text-green-500" : "text-slate-400"}`}
                      >
                        {detailsUser.twoFactor
                          ? "Active (MFA Enforced)"
                          : "Inactive"}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setDetailsUser(null);
                      handleOpenEditDrawer(detailsUser);
                    }}
                    className="flex-1 bg-[#0D47A1] hover:bg-[#0c3d8a] text-white py-3 rounded-xl font-heading font-semibold text-xs transition-colors cursor-pointer"
                  >
                    Edit Profile
                  </button>
                  <button
                    onClick={() => setDetailsUser(null)}
                    className="flex-1 bg-slate-200 hover:bg-slate-300 text-slate-700 py-3 rounded-xl font-heading font-semibold text-xs transition-colors cursor-pointer"
                  >
                    Close Panel
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── 8. CONFIRM PASSWORD RESET DIALOG ── */}
      {resetPassUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-xl overflow-hidden border border-[#E5E7EB] animate-scale-in">
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
              <h3 className="font-heading font-bold text-sm flex items-center gap-2">
                <Key size={16} className="text-amber-500" /> Administrative
                Password Reset
              </h3>
              <button
                aria-label="Close"
                onClick={() => setResetPassUser(null)}
                className="text-white/80 hover:text-white cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <form
              onSubmit={handleConfirmResetPassword}
              className="p-6 space-y-4 text-xs font-body"
            >
              <p className="text-slate-500 leading-relaxed">
                You are about to trigger a password reset for{" "}
                <strong className="text-slate-900">
                  {resetPassUser.fullName} ({resetPassUser.empId})
                </strong>
                . This will revoke their current password immediately.
              </p>

              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex gap-2.5 text-amber-800">
                <AlertTriangle
                  size={18}
                  className="shrink-0 text-amber-600 mt-0.5"
                />
                <p className="leading-relaxed">
                  Upon submission, the user's login access will be set to
                  Pending Password Setup. A password reset link will be sent to
                  the email: <strong>{resetPassUser.email}</strong>.
                </p>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-border mt-4">
                <button
                  type="button"
                  onClick={() => setResetPassUser(null)}
                  className="px-4 py-2 border rounded-xl font-semibold hover:bg-slate-50 text-slate-500 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  {isSubmitting && (
                    <Loader2 size={12} className="animate-spin" />
                  )}
                  Confirm Reset
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── 9. CONFIRM STATUS CHANGE DIALOG ── */}
      {statusDialogUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-xl overflow-hidden border border-[#E5E7EB] animate-scale-in">
            <div className="px-6 py-4 bg-slate-950 text-white flex items-center justify-between">
              <h3 className="font-heading font-bold text-sm flex items-center gap-2">
                <Shield size={16} className="text-[#0D47A1]" /> Administrative
                Account Control
              </h3>
              <button
                aria-label="Close"
                onClick={() => setStatusDialogUser(null)}
                className="text-white/80 hover:text-white cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs font-body">
              <p className="text-slate-500 leading-relaxed">
                Are you sure you want to perform the action{" "}
                <strong>{statusDialogUser.action}</strong> on the account
                belonging to{" "}
                <strong className="text-slate-900">
                  {statusDialogUser.user.fullName} (
                  {statusDialogUser.user.empId})
                </strong>
                ?
              </p>

              {statusDialogUser.action === "Deactivate" && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-3 flex gap-2.5 text-red-800">
                  <AlertTriangle
                    size={18}
                    className="shrink-0 text-red-600 mt-0.5"
                  />
                  <p className="leading-relaxed">
                    This action will immediately deactivate the user account and
                    revoke their active session. They will be logged out and
                    unable to log back in until re-activated.
                  </p>
                </div>
              )}

              {statusDialogUser.action === "Activate" && (
                <div className="bg-green-50 border border-green-200 rounded-xl p-3 flex gap-2.5 text-green-800">
                  <CheckCircle2
                    size={18}
                    className="shrink-0 text-green-600 mt-0.5"
                  />
                  <p className="leading-relaxed">
                    This action will re-activate the user account and restore
                    their system login privileges.
                  </p>
                </div>
              )}

              <div className="flex justify-end gap-3 pt-3 border-t border-border mt-4">
                <button
                  onClick={() => setStatusDialogUser(null)}
                  className="px-4 py-2 border rounded-xl font-semibold hover:bg-slate-50 text-slate-500 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmStatusChange}
                  className={`px-4 py-2 text-white rounded-xl font-bold transition-colors cursor-pointer ${
                    statusDialogUser.action === "Deactivate"
                      ? "bg-red-600 hover:bg-red-700"
                      : "bg-green-600 hover:bg-green-700"
                  }`}
                >
                  Confirm {statusDialogUser.action}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagement;
