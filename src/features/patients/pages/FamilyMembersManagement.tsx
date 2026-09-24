import { useReducer, useEffect, useState, lazy, Suspense } from "react";
import { useNavigate } from "react-router";
import {
  Users,
  UserPlus,
  Filter,
  CheckCircle2,
  Eye,
  Edit3,
  UserX,
  ArrowLeft,
} from "lucide-react";
import type { FamilyMember } from "../types/family.types";
import { apiClient } from "../../../lib/axios";
import { ROUTES } from "../../../app/routes/routes";
import { DataTable } from "../../../common/components/DataTable";
import { FamilyMemberViewDrawer } from "../components/family/FamilyMemberViewDrawer";
const RegisterPatientScreen = lazy(() =>
  import("./RegisterPatientScreen").then((m) => ({
    default: m.RegisterPatientScreen,
  })),
);
import { RemoveMemberConfirmDialog } from "../components/family/RemoveMemberConfirmDialog";

const PP = "'Poppins', system-ui, sans-serif";
const RB = "'Roboto', system-ui, sans-serif";

export type { FamilyMember } from "../types/family.types";

function calculateAge(dob?: string, ageVal?: number): number {
  if (typeof ageVal === "number" && ageVal > 0) return ageVal;
  if (!dob) return 0;
  try {
    const birthDate = new Date(dob);
    if (isNaN(birthDate.getTime())) return 0;
    const today = new Date();
    let computedAge = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (
      monthDiff < 0 ||
      (monthDiff === 0 && today.getDate() < birthDate.getDate())
    ) {
      computedAge--;
    }
    return Math.max(0, computedAge);
  } catch (err) {
    console.log(err);
    return 0;
  }
}

function normalizeRelationship(rel?: string): FamilyMember["relationship"] {
  if (!rel) return "Other";
  const lower = rel.toLowerCase();
  if (lower === "self") return "Self";
  if (lower === "spouse") return "Spouse";
  if (lower === "mother") return "Mother";
  if (lower === "father") return "Father";
  if (lower === "son") return "Son";
  if (lower === "daughter") return "Daughter";
  if (lower === "brother") return "Brother";
  if (lower === "sister") return "Sister";
  if (lower === "guardian") return "Guardian";
  if (lower === "grandparent") return "Grandparent";
  return "Other";
}

type FilterState = {
  searchTerm: string;
  relFilter: string;
  statusFilter: string;
};

type FilterAction = {
  type: "SET_FIELD";
  field: keyof FilterState;
  value: string;
};
const filterReducer = (
  state: FilterState,
  action: FilterAction,
): FilterState => ({
  ...state,
  [action.field]: action.value,
});

type DrawerState = {
  viewDrawerMember: FamilyMember | null;
  editRelMember: FamilyMember | null;
  editFormRel: FamilyMember["relationship"];
  editDisplayName: string;
  isPrimary: boolean;
  isEmergency: boolean;
  relFormError: string | null;
  toastMessage: string | null;
  removeDialogMember: FamilyMember | null;
  removeFromDrawer: boolean;
};

type DrawerAction =
  | { type: "OPEN_VIEW_DRAWER"; member: FamilyMember }
  | { type: "CLOSE_VIEW_DRAWER" }
  | { type: "OPEN_EDIT_DRAWER"; member: FamilyMember }
  | { type: "CLOSE_EDIT_DRAWER" }
  | {
      type: "SET_EDIT_FIELD";
      field: "editFormRel";
      value: FamilyMember["relationship"];
    }
  | { type: "SET_EDIT_FIELD"; field: "editDisplayName"; value: string }
  | { type: "SET_EDIT_FIELD"; field: "isPrimary"; value: boolean }
  | { type: "SET_EDIT_FIELD"; field: "isEmergency"; value: boolean }
  | { type: "SET_REL_FORM_ERROR"; error: string | null }
  | { type: "OPEN_REMOVE_DIALOG"; member: FamilyMember; fromDrawer: boolean }
  | { type: "CLOSE_REMOVE_DIALOG" }
  | { type: "SHOW_TOAST"; message: string }
  | { type: "CLEAR_TOAST" };

const drawerReducer = (
  state: DrawerState,
  action: DrawerAction,
): DrawerState => {
  switch (action.type) {
    case "OPEN_VIEW_DRAWER":
      return { ...state, viewDrawerMember: action.member };
    case "CLOSE_VIEW_DRAWER":
      return { ...state, viewDrawerMember: null, removeFromDrawer: false };
    case "OPEN_EDIT_DRAWER": {
      const norm = normalizeRelationship(action.member.relationship);
      return {
        ...state,
        editRelMember: action.member,
        editFormRel: norm,
        editDisplayName: action.member.patientName || "",
        isPrimary: norm === "Self",
        isEmergency: false,
        relFormError: null,
      };
    }
    case "CLOSE_EDIT_DRAWER":
      return {
        ...state,
        editRelMember: null,
        editFormRel: "Mother",
        editDisplayName: "",
        isPrimary: false,
        isEmergency: false,
        relFormError: null,
      };
    case "SET_EDIT_FIELD":
      return { ...state, [action.field]: action.value };
    case "SET_REL_FORM_ERROR":
      return { ...state, relFormError: action.error };
    case "OPEN_REMOVE_DIALOG":
      return {
        ...state,
        removeDialogMember: action.member,
        removeFromDrawer: action.fromDrawer,
      };
    case "CLOSE_REMOVE_DIALOG":
      return { ...state, removeDialogMember: null, removeFromDrawer: false };
    case "SHOW_TOAST":
      return { ...state, toastMessage: action.message };
    case "CLEAR_TOAST":
      return { ...state, toastMessage: null };
    default:
      return state;
  }
};

interface FamilyMembersManagementProps {
  familyMembers?: FamilyMember[];
  activeFamilyMember?: FamilyMember;
  onSwitchProfile?: (member: FamilyMember) => void;
  onAddFamilyMember?: (newMember?: Partial<FamilyMember>) => void;
  onRemoveFamilyMember?: (id: string) => void;
  onUpdateRelationship?: (
    id: string,
    relationship: FamilyMember["relationship"],
    updatedMemberData?: Record<string, unknown>,
  ) => void;
  onNavigateTab?: (tabId: string) => void;
}

const formatMemberDisplayName = (
  member?: FamilyMember | null,
  primaryMember?: FamilyMember | null,
): string => {
  if (!member) return "Patient";
  const isSelf = String(member.relationship || "").toUpperCase() === "SELF";
  const name = member.patientName || member.name || "Patient";
  if (isSelf) return name;
  const relStr = member.relationship ? ` (${member.relationship})` : "";
  if (primaryMember) {
    const primaryName =
      primaryMember.patientName || primaryMember.name || "Primary User";
    return `${name}${relStr} · Account Holder: ${primaryName}`;
  }
  return `${name}${relStr}`;
};

export function FamilyMembersManagement({
  familyMembers = [],
  activeFamilyMember,
  onSwitchProfile,
  onAddFamilyMember,
  onRemoveFamilyMember,
}: FamilyMembersManagementProps) {
  const navigate = useNavigate();

  // Filters state
  const [filterState, filterDispatch] = useReducer(filterReducer, {
    searchTerm: "",
    relFilter: "All",
    statusFilter: "All",
  });
  const { searchTerm, relFilter, statusFilter } = filterState;

  // Drawer & Dialog state
  const [drawerState, drawerDispatch] = useReducer(drawerReducer, {
    viewDrawerMember: null,
    editRelMember: null,
    editFormRel: "Mother",
    editDisplayName: "",
    isPrimary: false,
    isEmergency: false,
    relFormError: null,
    toastMessage: null,
    removeDialogMember: null,
    removeFromDrawer: false,
  });
  const {
    viewDrawerMember,
    toastMessage,
    removeDialogMember,
    removeFromDrawer,
  } = drawerState;

  // Modal data for View Details Drawer
  const [modalData, setModalData] = useState<{
    basicInfo?: Record<string, unknown>;
    loading: boolean;
  }>({ loading: false });

  // State for Full Patient Edit Modal (PUT /api/v1/patients/{mrn})
  const [editPatientMember, setEditPatientMember] =
    useState<FamilyMember | null>(null);

  // Load Member Basic Info for View Drawer
  useEffect(() => {
    let cancelled = false;

    async function loadMemberModalData() {
      if (!viewDrawerMember?.mrn) {
        setModalData({ loading: false });
        return;
      }
      setModalData((prev) => ({ ...prev, loading: true }));
      const mrn = viewDrawerMember.mrn;

      try {
        const basicRes = await apiClient.get(
          `/api/v1/patients/${encodeURIComponent(mrn)}`,
        );
        if (cancelled) return;
        const basic =
          (basicRes.data as { data?: unknown })?.data || basicRes.data;
        setModalData({
          basicInfo:
            basic && typeof basic === "object"
              ? (basic as Record<string, unknown>)
              : undefined,
          loading: false,
        });
      } catch (err) {
        console.log(err);
        if (!cancelled) setModalData({ loading: false });
      }
    }

    loadMemberModalData();

    return () => {
      cancelled = true;
    };
  }, [viewDrawerMember?.mrn]);

  // Top Summary Metrics
  const totalLinked = familyMembers.length;
  const verifiedCount = familyMembers.filter(
    (m) => m.verificationStatus === "Verified",
  ).length;

  // Filtered members list
  const filteredMembers = familyMembers.filter((m) => {
    const term = searchTerm.toLowerCase().trim();
    const nameMatch =
      !term ||
      m.patientName.toLowerCase().includes(term) ||
      m.mrn.toLowerCase().includes(term) ||
      m.relationship.toLowerCase().includes(term);
    const relMatch = relFilter === "All" || m.relationship === relFilter;
    const statusMatch =
      statusFilter === "All" || m.verificationStatus === statusFilter;
    return nameMatch && relMatch && statusMatch;
  });

  const handlePatientSaved = (updatedName: string) => {
    drawerDispatch({
      type: "SHOW_TOAST",
      message: `Patient details for ${updatedName} updated successfully.`,
    });
    setTimeout(() => drawerDispatch({ type: "CLEAR_TOAST" }), 3000);
    setEditPatientMember(null);

    // Refresh view drawer modalData if currently open
    if (viewDrawerMember?.mrn) {
      apiClient
        .get(`/api/v1/patients/${encodeURIComponent(viewDrawerMember.mrn)}`)
        .then((res) => {
          const basic = (res.data as { data?: unknown })?.data || res.data;
          setModalData((prev) => ({
            ...prev,
            basicInfo:
              basic && typeof basic === "object"
                ? (basic as Record<string, unknown>)
                : undefined,
          }));
        })
        .catch(() => null);
    }
  };

  const handleRemoveSuccess = (mrnOrId: string, name: string) => {
    onRemoveFamilyMember?.(mrnOrId);
    drawerDispatch({ type: "CLOSE_REMOVE_DIALOG" });
    if (removeFromDrawer) {
      drawerDispatch({ type: "CLOSE_VIEW_DRAWER" });
    }
    drawerDispatch({
      type: "SHOW_TOAST",
      message: `Family member ${name} unlinked successfully.`,
    });
    setTimeout(() => drawerDispatch({ type: "CLEAR_TOAST" }), 3000);
  };

  const handleRemoveError = (msg: string) => {
    drawerDispatch({ type: "SHOW_TOAST", message: msg });
    setTimeout(() => drawerDispatch({ type: "CLEAR_TOAST" }), 4000);
  };

  if (editPatientMember) {
    return (
      <Suspense
        fallback={
          <div className="flex min-h-100 items-center justify-center text-sm text-slate-500">
            Loading member edit form...
          </div>
        }
      >
        <RegisterPatientScreen
          isFamilyMode={true}
          isEditMode={true}
          editMember={editPatientMember}
          onBack={() => setEditPatientMember(null)}
          onRegistered={(m) => handlePatientSaved(m.patientName)}
        />
      </Suspense>
    );
  }

  const handleBack = () => {
    navigate(-1);
  };

  return (
    <div className="p-6 space-y-6 pb-12">
      {/* ── HEADER TITLE BLOCK ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <button
              type="button"
              onClick={handleBack}
              className="inline-flex items-center gap-2 px-3.5 py-2 mb-3 text-xs font-semibold text-slate-700 hover:text-slate-900 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl shadow-xs transition-all cursor-pointer"
              style={{ fontFamily: RB }}
            >
              <ArrowLeft size={16} />
              Back
            </button>
          <div className="flex items-center gap-2.5 mb-1">
            <h1
              className="text-xl font-bold text-[#111827]"
              style={{ fontFamily: PP }}
            >
              Family Members Management
            </h1>
            <span className="px-2.5 py-0.5 bg-blue-100 text-[#0D47A1] text-xs font-bold rounded-full">
              {totalLinked} Linked
            </span>
          </div>
          <p className="text-xs text-[#64748B]" style={{ fontFamily: RB }}>
            Manage linked family member profiles under your Patient Portal
            account
          </p>
        </div>
        <button
          onClick={() => onAddFamilyMember?.()}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-[#0D47A1] text-white rounded-xl text-xs font-bold hover:bg-[#0c3d8a] transition-all cursor-pointer shadow-sm shrink-0"
          style={{ fontFamily: PP }}
        >
          <UserPlus size={15} />
          Link Family Member
        </button>
      </div>

      {/* ── SUMMARY KPI CARDS ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-[#E5E7EB] shadow-2xs flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#0D47A1] flex items-center justify-center font-bold shrink-0">
              <Users size={20} />
            </div>
            <div>
              <div
                className="text-[10px] text-[#64748B] font-semibold uppercase tracking-wider"
                style={{ fontFamily: PP }}
              >
                Linked Profiles
              </div>
              <div
                className="text-lg font-bold text-[#111827]"
                style={{ fontFamily: PP }}
              >
                {totalLinked} Total
              </div>
            </div>
          </div>
          <div className="text-right text-xs text-[#64748B]">
            <span className="font-bold text-[#0D47A1]">{verifiedCount}</span>{" "}
            Verified
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-[#E5E7EB] shadow-2xs flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-[#66BB6A] flex items-center justify-center font-bold shrink-0">
              <CheckCircle2 size={20} />
            </div>
            <div>
              <div
                className="text-[10px] text-[#64748B] font-semibold uppercase tracking-wider"
                style={{ fontFamily: PP }}
              >
                Current Active Profile
              </div>
              <div
                className="text-sm font-bold text-[#111827] truncate max-w-50"
                style={{ fontFamily: PP }}
              >
                {formatMemberDisplayName(
                  activeFamilyMember || familyMembers[0],
                  familyMembers.find((f) => f.relationship === "Self") || null,
                )}
              </div>
            </div>
          </div>
          <button
            onClick={() => navigate(ROUTES.DASHBOARD)}
            className="text-xs text-[#0D47A1] font-bold hover:underline"
            style={{ fontFamily: PP }}
          >
            Portal Home →
          </button>
        </div>
      </div>

      {/* ── FAMILY MEMBERS DATATABLE WITH EMBEDDED FILTERS ── */}
      <div className="bg-white rounded-2xl border border-[#E5E7EB] shadow-2xs overflow-hidden">
        <DataTable<FamilyMember>
          data={filteredMembers}
          getRowId={(m) => m.id}
          title="Linked Family Profiles"
          subtitle="Manage linked family member profiles under your Patient Portal account."
          searchable={true}
          searchPlaceholder=" Search family member by name, MRN, relationship..."
          searchValue={searchTerm}
          onSearchChange={(val) =>
            filterDispatch({
              type: "SET_FIELD",
              field: "searchTerm",
              value: val,
            })
          }
          toolbar={
            <div className="bg-slate-50/80 border border-[#E5E7EB] rounded-xl p-2.5 space-y-2 shadow-2xs text-xs">
              <div className="flex items-center gap-2 flex-wrap">
                <div className="flex items-center gap-1.5 bg-white border border-[#E5E7EB] px-2.5 py-1 rounded-lg text-slate-700 font-medium">
                  <Filter className="w-3.5 h-3.5 text-slate-400" />
                  <span className="text-slate-400 text-[11px]">
                    Relationship:
                  </span>
                  <select
                    value={relFilter}
                    onChange={(e) =>
                      filterDispatch({
                        type: "SET_FIELD",
                        field: "relFilter",
                        value: e.target.value,
                      })
                    }
                    className="bg-transparent font-semibold text-[#0D47A1] outline-none cursor-pointer text-xs"
                    style={{ fontFamily: RB }}
                  >
                    <option value="All">All Relationships</option>
                    <option value="Self">Self</option>
                    <option value="Spouse">Spouse</option>
                    <option value="Mother">Mother</option>
                    <option value="Father">Father</option>
                    <option value="Son">Son</option>
                    <option value="Daughter">Daughter</option>
                    <option value="Brother">Brother</option>
                    <option value="Sister">Sister</option>
                    <option value="Guardian">Guardian</option>
                    <option value="Grandparent">Grandparent</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div className="flex items-center gap-1.5 bg-white border border-[#E5E7EB] px-2.5 py-1 rounded-lg text-slate-700 font-medium">
                  <span className="text-slate-400 text-[11px]">Status:</span>
                  <select
                    value={statusFilter}
                    onChange={(e) =>
                      filterDispatch({
                        type: "SET_FIELD",
                        field: "statusFilter",
                        value: e.target.value,
                      })
                    }
                    className="bg-transparent font-semibold text-[#0D47A1] outline-none cursor-pointer text-xs"
                    style={{ fontFamily: RB }}
                  >
                    <option value="All">All Statuses</option>
                    <option value="Verified">Verified</option>
                    <option value="Pending">Pending</option>
                  </select>
                </div>

                {(searchTerm ||
                  relFilter !== "All" ||
                  statusFilter !== "All") && (
                  <button
                    onClick={() => {
                      filterDispatch({
                        type: "SET_FIELD",
                        field: "searchTerm",
                        value: "",
                      });
                      filterDispatch({
                        type: "SET_FIELD",
                        field: "relFilter",
                        value: "All",
                      });
                      filterDispatch({
                        type: "SET_FIELD",
                        field: "statusFilter",
                        value: "All",
                      });
                    }}
                    className="px-2.5 py-1 rounded-lg border border-red-200 bg-red-50 hover:bg-red-100 text-red-600 text-[11px] font-semibold transition-colors flex items-center gap-1 cursor-pointer shadow-2xs shrink-0 ml-auto"
                    style={{ fontFamily: PP }}
                  >
                    Clear Filters
                  </button>
                )}
              </div>
            </div>
          }
          columns={[
            {
              key: "patientName",
              label: "MEMBER NAME",
              sortable: true,
              getValue: (m) => m.patientName,
              render: (m) => (
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-[#0D47A1] text-white flex items-center justify-center font-bold text-xs shrink-0">
                    {m.patientName[0]?.toUpperCase() || "P"}
                  </div>
                  <div>
                    <div
                      className="font-bold text-xs text-[#111827]"
                      style={{ fontFamily: PP }}
                    >
                      {m.patientName}
                    </div>
                    <div className="text-[11px] font-mono text-[#64748B]">
                      {m.mrn}
                    </div>
                  </div>
                </div>
              ),
            },
            {
              key: "relationship",
              label: "RELATIONSHIP",
              sortable: true,
              getValue: (m) => m.relationship,
              render: (m) => (
                <span className="px-2.5 py-1 bg-blue-50 text-[#0D47A1] font-semibold text-xs rounded-lg inline-block">
                  {m.relationship}
                </span>
              ),
            },
            {
              key: "age",
              label: "AGE / GENDER",
              sortable: true,
              getValue: (m) => m.age,
              render: (m) => (
                <span className="text-xs text-[#111827]">
                  {m.age > 0
                    ? `${m.age} yrs`
                    : m.dateOfBirth
                      ? `${calculateAge(m.dateOfBirth, m.age)} yrs`
                      : "—"}{" "}
                  · {m.gender || "Other"}
                </span>
              ),
            },
            {
              key: "registeredMobile",
              label: "CONTACT",
              sortable: false,
              render: (m) => (
                <span className="text-xs font-mono text-[#111827]">
                  {m.registeredMobile}
                </span>
              ),
            },
            {
              key: "verificationStatus",
              label: "STATUS",
              sortable: true,
              getValue: (m) => m.verificationStatus,
              render: (m) => (
                <span
                  className={`px-2.5 py-1 rounded-full text-xs font-semibold inline-block ${
                    m.verificationStatus === "Verified"
                      ? "bg-emerald-100 text-[#66BB6A]"
                      : "bg-amber-100 text-[#F59E0B]"
                  }`}
                >
                  {m.verificationStatus}
                </span>
              ),
            },
            {
              key: "actions",
              label: "ACTIONS",
              sortable: false,
              align: "right",
              render: (m) => {
                const isCurrentActive = activeFamilyMember?.id === m.id;
                return (
                  <div className="flex items-center justify-end gap-1.5 shrink-0">
                    {isCurrentActive ? (
                      <span
                        className="px-2.5 py-1 inline-flex items-center gap-1 bg-blue-50 text-[#0D47A1] rounded-lg text-xs font-bold border border-[#0D47A1]"
                        style={{ fontFamily: PP }}
                      >
                        <CheckCircle2 size={13} className="text-[#0D47A1]" />
                        Active
                      </span>
                    ) : onSwitchProfile ? (
                      <button
                        onClick={() => onSwitchProfile(m)}
                        className="px-2.5 py-1 bg-white border border-[#0D47A1] text-[#0D47A1] hover:bg-blue-50 rounded-lg text-xs font-bold transition-colors cursor-pointer"
                        style={{ fontFamily: PP }}
                      >
                        Switch
                      </button>
                    ) : null}

                    {m.relationship !== "Self" ? (
                      <button
                        onClick={() =>
                          drawerDispatch({
                            type: "OPEN_REMOVE_DIALOG",
                            member: m,
                            fromDrawer: false,
                          })
                        }
                        className="w-7 h-7 inline-flex items-center justify-center rounded-lg text-[#64748B] hover:text-[#EF4444] hover:bg-red-50 transition-colors cursor-pointer shrink-0"
                        title="Remove Link"
                      >
                        <UserX size={15} />
                      </button>
                    ) : (
                      <div className="w-7 h-7 shrink-0" />
                    )}

                    <button
                      onClick={() => setEditPatientMember(m)}
                      className="w-7 h-7 inline-flex items-center justify-center rounded-lg text-[#64748B] hover:text-[#0D47A1] hover:bg-blue-50 transition-colors cursor-pointer shrink-0"
                      title="Edit Patient Details"
                    >
                      <Edit3 size={15} />
                    </button>

                    <button
                      onClick={() =>
                        drawerDispatch({
                          type: "OPEN_VIEW_DRAWER",
                          member: m,
                        })
                      }
                      className="w-7 h-7 inline-flex items-center justify-center rounded-lg text-[#64748B] hover:text-[#0D47A1] hover:bg-slate-100 transition-colors cursor-pointer shrink-0"
                      title="View Details"
                    >
                      <Eye size={15} />
                    </button>
                  </div>
                );
              },
            },
          ]}
        />
      </div>

      {/* ── VIEW MEMBER DRAWER COMPONENT ── */}
      <FamilyMemberViewDrawer
        member={viewDrawerMember}
        modalData={modalData}
        onClose={() => drawerDispatch({ type: "CLOSE_VIEW_DRAWER" })}
        onOpenEdit={(m) => setEditPatientMember(m)}
        onOpenRemove={(m) =>
          drawerDispatch({
            type: "OPEN_REMOVE_DIALOG",
            member: m,
            fromDrawer: true,
          })
        }
      />

      {/* ── REMOVE FAMILY MEMBER CONFIRMATION DIALOG COMPONENT ── */}
      <RemoveMemberConfirmDialog
        member={removeDialogMember}
        removeFromDrawer={removeFromDrawer}
        onClose={() => drawerDispatch({ type: "CLOSE_REMOVE_DIALOG" })}
        onConfirmSuccess={handleRemoveSuccess}
        onError={handleRemoveError}
      />

      {/* ── SUCCESS TOAST NOTIFICATION ── */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 bg-[#111827] text-white px-5 py-3 rounded-2xl shadow-2xl border border-slate-700 transition-transform duration-200">
          <CheckCircle2 className="w-5 h-5 text-[#66BB6A] shrink-0" />
          <span className="text-xs font-semibold" style={{ fontFamily: PP }}>
            {toastMessage}
          </span>
        </div>
      )}
    </div>
  );
}
