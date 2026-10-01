import { useCallback, useMemo, useReducer, useState } from "react";
import {
  Activity,
  AlertTriangle,
  ArrowLeft,
  ArrowUpRight,
  Database,
  Download,
  Eye,
  Lock,
  LogIn,
  Printer,
  RefreshCw,
  RotateCcw,
  Server,
  Trash2,
  Users,
} from "lucide-react";
import {
  useActiveSessions,
  useAuditDashboard,
  useAuditFilterOptions,
  useAuditMetrics,
  useAuditWorkspaces,
  useCriticalEvents,
  useDataChangeLogs,
  useDataChangesDashboard,
  useDeletedRecordLogs,
  useDeletedRecordsDashboard,
  useFailedLoginAttempts,
  useLockedAccounts,
  useLoginHistoryDashboard,
  useLoginHistoryFilterOptions,
  useLoginHistoryLogs,
  useMainAuditLogs,
  useSystemLogLogs,
  useSystemLogsDashboard,
  useUserActivitiesDashboard,
  useUserActivityLogs,
} from "../hooks/useAuditLog";
import { QUICK_ACTION_CARDS } from "../constants/auditlog-cards";
import { SeverityBadge, StatusBadge } from "../components/AuditBadges";
import { AuditLogDetailsPage } from "./AuditLogDetailsPage";
import { DataTable, type Column } from "../../../common/components/DataTable";
import { LoginSupplementaryData } from "../components/LoginSupplementaryPanels";
import {
  ApiFilterSelect,
  DateCalendarPicker,
  FilterSelect,
} from "../components/AuditLogFilterControls";
import {
  display,
  getDateRange,
  getErrorMessage,
  isInDateRange,
  matchesAnyCode,
  matchesCode,
  normalizeCode,
  safeArray,
} from "../utils/auditlog.utils";
import safehandshospital_logo from "../../../assets/safehandshospital_logo.webp";
import { useHospitalBranding } from "../../settings/hooks/useHospitalBranding";
import { useBillingConfiguration } from "../../billing/hooks/useBilling";
import type {
  AuditCategory,
  AuditFilterOptions,
  AuditLogListParams,
  AuditMetric,
  AuditRecord,
} from "../types/auditlog.types";

const PP = "Poppins, sans-serif";
const RB = "Roboto, sans-serif";
const PAGE_SIZE = 20;

type KpiCard = {
  title: string;
  value: number | string;
  trend?: number;
  Icon: typeof Activity;
};

function formatTrend(trend: number | undefined): string | null {
  if (trend === undefined || Number.isNaN(trend)) return null;
  return `${trend > 0 ? "+" : ""}${trend}%`;
}

function metricIcon(metric: AuditMetric): typeof Activity {
  const code = `${metric.code} ${metric.label}`.toUpperCase();
  if (code.includes("LOGIN")) return LogIn;
  if (code.includes("CHANGE") || code.includes("UPDATE")) return Database;
  if (code.includes("DELETE")) return Trash2;
  if (code.includes("CRIT") || code.includes("ALERT")) return AlertTriangle;
  return Activity;
}

function downloadCsv(records: AuditRecord[], filename: string): void {
  if (!records || records.length === 0) {
    alert("No audit records available to export.");
    return;
  }

  const header = [
    "Event ID",
    "Timestamp",
    "Category",
    "User",
    "Role",
    "Module",
    "Action",
    "Severity",
    "Status",
    "Description",
  ];
  const rows = records.map((record) => [
    record.id ?? "",
    record.timestamp ?? "",
    record.category ?? "",
    record.user ?? "",
    record.userRole ?? "",
    record.module ?? "",
    record.action ?? "",
    record.severity ?? "",
    record.status ?? "",
    record.description ?? "",
  ]);
  const csv = [header, ...rows]
    .map((row) =>
      row
        .map((value) => `"${String(value ?? "").replace(/"/g, '""')}"`)
        .join(","),
    )
    .join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename.endsWith(".csv") ? filename : `${filename}.csv`;
  anchor.style.display = "none";
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}
interface FilterState {
  currentWorkspace: AuditCategory;
  searchQuery: string;
  selectedDateRange: string;
  customStartDate: string;
  customEndDate: string;
  selectedModule: string;
  selectedDepartment: string;
  selectedRole: string;
  selectedUser: string;
  selectedSeverity: string;
  selectedStatus: string;
  selectedEventType: string;
}

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

export function AuditLogManagementPage() {
  const { logoUrl } = useHospitalBranding();
  const { configuration } = useBillingConfiguration();
  const [logoLoaded, setLogoLoaded] = useState(true);

  const effectiveLogo = logoUrl || safehandshospital_logo;
  const hospitalName =
    configuration?.receipt?.hospitalName || "Safe Hands Hospital";
  const hospitalAddress =
    configuration?.receipt?.hospitalAddress ||
    "123 Healthcare Ave, Medical District, City";
  const hospitalPhone =
    configuration?.receipt?.hospitalPhone || "+91 98765 43210";
  const hospitalEmail =
    configuration?.receipt?.hospitalEmail || "info@safehandshospital.com";
  const hospitalGstin = configuration?.receipt?.hospitalGstin || "";

  const [filters, dispatch] = useReducer(filterReducer, {
    currentWorkspace: "All Logs" as AuditCategory,
    searchQuery: "",
    selectedDateRange: "All Time",
    customStartDate: "",
    customEndDate: "",
    selectedModule: "All",
    selectedDepartment: "All",
    selectedRole: "All",
    selectedUser: "All",
    selectedSeverity: "All",
    selectedStatus: "All",
    selectedEventType: "All",
  });
  const setFilter = useCallback(
    (field: keyof FilterState, value: string) =>
      dispatch({ type: "SET_FIELD", field, value }),
    [],
  );

  const [activeDetailsRecord, setActiveDetailsRecord] =
    useState<AuditRecord | null>(null);
  const [page, setPage] = useState(0);

  const dateRange = useMemo(
    () =>
      getDateRange(
        filters.selectedDateRange,
        filters.customStartDate,
        filters.customEndDate,
      ),
    [filters.selectedDateRange, filters.customStartDate, filters.customEndDate],
  );
  const listParams = useMemo<AuditLogListParams>(
    () => ({ page, size: PAGE_SIZE, ...dateRange }),
    [dateRange, page],
  );

  const isAllWorkspace = filters.currentWorkspace === "All Logs";
  const isCriticalWorkspace = filters.currentWorkspace === "Critical Events";
  const isLoginWorkspace = filters.currentWorkspace === "Login History";

  // Shared endpoints are loaded once. Stream and workspace-dashboard calls are
  // only enabled for the selected workspace, preventing unrelated API errors.
  const allDashboardQuery = useAuditDashboard(
    dateRange.fromDate,
    dateRange.toDate,
  );
  const auditMetricsQuery = useAuditMetrics(
    dateRange.fromDate,
    dateRange.toDate,
  );
  const auditWorkspacesQuery = useAuditWorkspaces();
  const auditFilterOptionsQuery = useAuditFilterOptions();
  const loginFilterOptionsQuery =
    useLoginHistoryFilterOptions(isLoginWorkspace);

  const mainLogsQuery = useMainAuditLogs(listParams, isAllWorkspace);
  const criticalEventsQuery = useCriticalEvents(
    listParams,
    isAllWorkspace || isCriticalWorkspace,
  );
  const loginLogsQuery = useLoginHistoryLogs(listParams, isLoginWorkspace);
  const userActivityLogsQuery = useUserActivityLogs(
    listParams,
    filters.currentWorkspace === "User Activities",
  );
  const dataChangeLogsQuery = useDataChangeLogs(
    listParams,
    filters.currentWorkspace === "Data Changes",
  );
  const deletedRecordLogsQuery = useDeletedRecordLogs(
    listParams,
    filters.currentWorkspace === "Deleted Records",
  );
  const systemLogLogsQuery = useSystemLogLogs(
    listParams,
    filters.currentWorkspace === "System Logs",
  );

  const loginDashboardQuery = useLoginHistoryDashboard(
    dateRange.fromDate,
    dateRange.toDate,
    isLoginWorkspace,
  );
  const userActivitiesDashboardQuery = useUserActivitiesDashboard(
    dateRange.fromDate,
    dateRange.toDate,
    filters.currentWorkspace === "User Activities",
  );
  const dataChangesDashboardQuery = useDataChangesDashboard(
    dateRange.fromDate,
    dateRange.toDate,
    filters.currentWorkspace === "Data Changes",
  );
  const deletedRecordsDashboardQuery = useDeletedRecordsDashboard(
    dateRange.fromDate,
    dateRange.toDate,
    filters.currentWorkspace === "Deleted Records",
  );
  const systemLogsDashboardQuery = useSystemLogsDashboard(
    dateRange.fromDate,
    dateRange.toDate,
    filters.currentWorkspace === "System Logs",
  );

  const activeSessionsQuery = useActiveSessions(listParams, isLoginWorkspace);
  const failedAttemptsQuery = useFailedLoginAttempts(
    listParams,
    isLoginWorkspace,
  );
  const lockedAccountsQuery = useLockedAccounts(listParams, isLoginWorkspace);

  const activeQuery =
    filters.currentWorkspace === "Critical Events"
      ? criticalEventsQuery
      : filters.currentWorkspace === "Login History"
        ? loginLogsQuery
        : filters.currentWorkspace === "User Activities"
          ? userActivityLogsQuery
          : filters.currentWorkspace === "Data Changes"
            ? dataChangeLogsQuery
            : filters.currentWorkspace === "Deleted Records"
              ? deletedRecordLogsQuery
              : filters.currentWorkspace === "System Logs"
                ? systemLogLogsQuery
                : mainLogsQuery;

  const apiRecords = safeArray(activeQuery.data?.content);
  const totalElements = activeQuery.data?.totalElements ?? 0;
  const filterOptions: AuditFilterOptions | undefined = isLoginWorkspace
    ? (loginFilterOptionsQuery.data ?? auditFilterOptionsQuery.data)
    : auditFilterOptionsQuery.data;

  const filteredRecords = useMemo(() => {
    const search = filters.searchQuery.trim().toLowerCase();
    return apiRecords.filter((record) => {
      if (
        search &&
        ![
          record.id,
          record.user,
          record.userId,
          record.module,
          record.action,
          record.description,
          record.ipAddress,
          record.recordId,
          record.eventType,
        ]
          .filter(Boolean)
          .some((value) => value!.toLowerCase().includes(search))
      ) {
        return false;
      }
      if (!isInDateRange(record.timestamp, filters.selectedDateRange))
        return false;
      if (!matchesCode(record.module, filters.selectedModule)) return false;
      if (!matchesCode(record.department, filters.selectedDepartment))
        return false;
      if (!matchesCode(record.userRole, filters.selectedRole)) return false;
      if (
        filters.selectedUser !== "All" &&
        ![record.userId, record.user].some(
          (value) =>
            normalizeCode(value) === normalizeCode(filters.selectedUser),
        )
      ) {
        return false;
      }
      if (
        !matchesAnyCode(
          [record.severityCode, record.severity],
          filters.selectedSeverity,
        )
      ) {
        return false;
      }
      if (
        !matchesAnyCode(
          [record.statusCode, record.status],
          filters.selectedStatus,
        )
      ) {
        return false;
      }
      if (
        filters.selectedEventType !== "All" &&
        !matchesAnyCode(
          [record.eventType, record.action, record.categoryCode],
          filters.selectedEventType,
        )
      ) {
        return false;
      }
      return true;
    });
  }, [
    apiRecords,
    filters.searchQuery,
    filters.selectedDateRange,
    filters.selectedDepartment,
    filters.selectedEventType,
    filters.selectedModule,
    filters.selectedRole,
    filters.selectedSeverity,
    filters.selectedStatus,
    filters.selectedUser,
  ]);

  const tableColumns = useMemo<Column<AuditRecord>[]>(() => {
    const detailsCol: Column<AuditRecord> = {
      key: "actions",
      label: "ACTIONS",
      sortable: false,
      align: "right",
      render: (record) => (
        <button
          onClick={() => setActiveDetailsRecord(record)}
          className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-white bg-[#0D47A1] hover:bg-[#0c3d8a] rounded-lg transition-colors shadow-2xs cursor-pointer"
        >
          <Eye className="w-3.5 h-3.5" /> Details
        </button>
      ),
    };

    if (isLoginWorkspace) {
      return [
        {
          key: "user",
          label: "USER",
          sortable: true,
          getValue: (r) => r.user,
          render: (r) => (
            <span className="font-bold text-gray-900">{r.user}</span>
          ),
        },
        {
          key: "userRole",
          label: "ROLE",
          sortable: true,
          getValue: (r) => r.userRole || "",
          render: (r) => <span className="text-gray-600">{r.userRole}</span>,
        },
        {
          key: "loginTime",
          label: "LOGIN TIME",
          sortable: true,
          getValue: (r) => r.loginTime || r.timestamp || "",
          render: (r) => (
            <span className="font-mono text-gray-600">
              {display(r.loginTime || r.timestamp)}
            </span>
          ),
        },
        {
          key: "logoutTime",
          label: "LOGOUT TIME",
          sortable: true,
          getValue: (r) => r.logoutTime || "",
          render: (r) => (
            <span className="font-mono text-gray-500">
              {display(r.logoutTime)}
            </span>
          ),
        },
        {
          key: "ipAddress",
          label: "IP ADDRESS",
          sortable: true,
          getValue: (r) => r.ipAddress || "",
          render: (r) => (
            <span className="font-mono text-xs text-gray-600">
              {display(r.ipAddress)}
            </span>
          ),
        },
        {
          key: "device",
          label: "DEVICE",
          sortable: true,
          getValue: (r) => r.device || "",
          render: (r) => (
            <span className="text-gray-600 max-w-xs truncate block">
              {display(r.device)}
            </span>
          ),
        },
        {
          key: "status",
          label: "STATUS",
          sortable: true,
          getValue: (r) => r.status || "",
          render: (r) => <StatusBadge status={r.status} />,
        },
        detailsCol,
      ];
    }

    if (filters.currentWorkspace === "User Activities") {
      return [
        {
          key: "user",
          label: "USER",
          sortable: true,
          getValue: (r) => r.user,
          render: (r) => (
            <span className="font-bold text-gray-900">{r.user}</span>
          ),
        },
        {
          key: "module",
          label: "MODULE",
          sortable: true,
          getValue: (r) => r.module,
          render: (r) => (
            <span className="px-2 py-0.5 rounded bg-purple-50 text-purple-700 font-medium border border-purple-100">
              {r.module}
            </span>
          ),
        },
        {
          key: "action",
          label: "ACTION",
          sortable: true,
          getValue: (r) => r.action,
          render: (r) => (
            <span className="font-semibold text-blue-950">{r.action}</span>
          ),
        },
        {
          key: "description",
          label: "DESCRIPTION",
          sortable: true,
          getValue: (r) => r.description || "",
          render: (r) => (
            <span
              className="max-w-xs truncate text-gray-500 block"
              title={r.description}
            >
              {display(r.description)}
            </span>
          ),
        },
        {
          key: "timestamp",
          label: "TIMESTAMP",
          sortable: true,
          getValue: (r) => r.timestamp || "",
          render: (r) => (
            <span className="text-gray-500 font-mono">
              {display(r.timestamp)}
            </span>
          ),
        },
        {
          key: "status",
          label: "STATUS",
          sortable: true,
          getValue: (r) => r.status || "",
          render: (r) => <StatusBadge status={r.status} />,
        },
        detailsCol,
      ];
    }

    if (filters.currentWorkspace === "Data Changes") {
      return [
        {
          key: "module",
          label: "MODULE",
          sortable: true,
          getValue: (r) => r.module,
          render: (r) => (
            <span className="px-2 py-0.5 rounded bg-teal-50 text-teal-700 font-medium border border-teal-100">
              {r.module}
            </span>
          ),
        },
        {
          key: "recordId",
          label: "RECORD ID",
          sortable: true,
          getValue: (r) => r.recordId || "",
          render: (r) => (
            <span className="font-mono font-bold text-blue-700">
              {display(r.recordId)}
            </span>
          ),
        },
        {
          key: "fieldChanged",
          label: "FIELD",
          sortable: true,
          getValue: (r) => r.fieldChanged || "",
          render: (r) => (
            <span className="font-semibold text-gray-800">
              {display(r.fieldChanged)}
            </span>
          ),
        },
        {
          key: "oldValue",
          label: "OLD VALUE",
          sortable: true,
          getValue: (r) => r.oldValue || "",
          render: (r) => (
            <span
              className="font-mono text-red-600 max-w-48 truncate block"
              title={r.oldValue}
            >
              {display(r.oldValue)}
            </span>
          ),
        },
        {
          key: "newValue",
          label: "NEW VALUE",
          sortable: true,
          getValue: (r) => r.newValue || "",
          render: (r) => (
            <span
              className="font-mono text-emerald-600 max-w-48 truncate block"
              title={r.newValue}
            >
              {display(r.newValue)}
            </span>
          ),
        },
        {
          key: "user",
          label: "MODIFIED BY",
          sortable: true,
          getValue: (r) => r.user,
          render: (r) => (
            <span className="font-bold text-gray-900">{r.user}</span>
          ),
        },
        {
          key: "timestamp",
          label: "TIMESTAMP",
          sortable: true,
          getValue: (r) => r.timestamp || "",
          render: (r) => (
            <span className="text-gray-500 font-mono">
              {display(r.timestamp)}
            </span>
          ),
        },
        detailsCol,
      ];
    }

    if (filters.currentWorkspace === "Deleted Records") {
      return [
        {
          key: "recordId",
          label: "RECORD ID",
          sortable: true,
          getValue: (r) => r.recordId || "",
          render: (r) => (
            <span className="font-mono font-bold text-red-700">
              {display(r.recordId)}
            </span>
          ),
        },
        {
          key: "module",
          label: "MODULE",
          sortable: true,
          getValue: (r) => r.module,
          render: (r) => (
            <span className="px-2 py-0.5 rounded bg-amber-50 text-amber-800 font-medium border border-amber-200">
              {r.module}
            </span>
          ),
        },
        {
          key: "user",
          label: "DELETED BY",
          sortable: true,
          getValue: (r) => r.user,
          render: (r) => (
            <span className="font-bold text-gray-900">{r.user}</span>
          ),
        },
        {
          key: "reason",
          label: "REASON",
          sortable: true,
          getValue: (r) => r.deletionReason || r.description || "",
          render: (r) => (
            <span
              className="text-gray-600 max-w-xs truncate block"
              title={r.deletionReason || r.description}
            >
              {display(r.deletionReason || r.description)}
            </span>
          ),
        },
        {
          key: "timestamp",
          label: "DELETED TIME",
          sortable: true,
          getValue: (r) => r.timestamp || "",
          render: (r) => (
            <span className="text-gray-500 font-mono">
              {display(r.timestamp)}
            </span>
          ),
        },
        {
          key: "status",
          label: "STATUS",
          sortable: true,
          getValue: (r) => r.status || "",
          render: (r) => <StatusBadge status={r.status} />,
        },
        detailsCol,
      ];
    }

    if (filters.currentWorkspace === "System Logs") {
      return [
        {
          key: "severity",
          label: "SEVERITY",
          sortable: true,
          getValue: (r) => r.severity || "",
          render: (r) => <SeverityBadge severity={r.severity} />,
        },
        {
          key: "action",
          label: "EVENT",
          sortable: true,
          getValue: (r) => r.action,
          render: (r) => (
            <span className="font-semibold text-gray-900">{r.action}</span>
          ),
        },
        {
          key: "module",
          label: "MODULE",
          sortable: true,
          getValue: (r) => r.module,
          render: (r) => (
            <span className="px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 font-medium border border-indigo-100">
              {r.module}
            </span>
          ),
        },
        {
          key: "description",
          label: "DESCRIPTION",
          sortable: true,
          getValue: (r) => r.description || "",
          render: (r) => (
            <span
              className="max-w-xs truncate text-gray-500 block"
              title={r.description}
            >
              {display(r.description)}
            </span>
          ),
        },
        {
          key: "timestamp",
          label: "TIMESTAMP",
          sortable: true,
          getValue: (r) => r.timestamp || "",
          render: (r) => (
            <span className="text-gray-500 font-mono">
              {display(r.timestamp)}
            </span>
          ),
        },
        {
          key: "status",
          label: "STATUS",
          sortable: true,
          getValue: (r) => r.status || "",
          render: (r) => <StatusBadge status={r.status} />,
        },
        detailsCol,
      ];
    }

    // Default / All Logs
    return [
      {
        key: "timestamp",
        label: "TIMESTAMP",
        sortable: true,
        getValue: (r) => r.timestamp || "",
        render: (r) => (
          <span className="text-gray-500 font-mono">
            {display(r.timestamp)}
          </span>
        ),
      },
      {
        key: "category",
        label: "CATEGORY",
        sortable: true,
        getValue: (r) => r.category || "",
        render: (r) => (
          <span className="font-semibold text-gray-700">{r.category}</span>
        ),
      },
      {
        key: "user",
        label: "USER",
        sortable: true,
        getValue: (r) => r.user,
        render: (r) => (
          <span className="font-bold text-gray-900">{r.user}</span>
        ),
      },
      {
        key: "userRole",
        label: "ROLE",
        sortable: true,
        getValue: (r) => r.userRole || "",
        render: (r) => <span className="text-gray-600">{r.userRole}</span>,
      },
      {
        key: "module",
        label: "MODULE",
        sortable: true,
        getValue: (r) => r.module,
        render: (r) => (
          <span className="px-2 py-0.5 rounded bg-gray-100 font-medium text-gray-700">
            {r.module}
          </span>
        ),
      },
      {
        key: "action",
        label: "ACTION",
        sortable: true,
        getValue: (r) => r.action,
        render: (r) => (
          <span className="font-semibold text-blue-950">{r.action}</span>
        ),
      },
      {
        key: "severity",
        label: "SEVERITY",
        sortable: true,
        getValue: (r) => r.severity || "",
        render: (r) => <SeverityBadge severity={r.severity} />,
      },
      {
        key: "status",
        label: "STATUS",
        sortable: true,
        getValue: (r) => r.status || "",
        render: (r) => <StatusBadge status={r.status} />,
      },
      detailsCol,
    ];
  }, [filters.currentWorkspace, isLoginWorkspace]);

  const criticalRecords = safeArray(criticalEventsQuery.data?.content);
  const workspaceCards = useMemo(() => {
    const workspaces = safeArray(auditWorkspacesQuery.data);
    return QUICK_ACTION_CARDS.map((card) => {
      const backendWorkspace = card.workspaceCode
        ? workspaces.find((workspace) => workspace.code === card.workspaceCode)
        : undefined;
      return {
        ...card,
        title: backendWorkspace?.name || card.title,
        count:
          card.id === "All Logs"
            ? allDashboardQuery.data?.totalAuditEvents
            : backendWorkspace?.count,
      };
    });
  }, [allDashboardQuery.data?.totalAuditEvents, auditWorkspacesQuery.data]);

  const kpiCards = useMemo<KpiCard[]>(() => {
    const metrics = safeArray(auditMetricsQuery.data);
    if ((isAllWorkspace || isCriticalWorkspace) && metrics.length > 0) {
      return metrics.map((metric) => ({
        title: metric.label,
        value: metric.value,
        trend: metric.trend,
        Icon: metricIcon(metric),
      }));
    }

    if (isAllWorkspace || isCriticalWorkspace) {
      const dashboard = allDashboardQuery.data;
      if (!dashboard) return [];
      return [
        {
          title: "Total Audit Events",
          value: dashboard.totalAuditEvents,
          Icon: Activity,
        },
        {
          title: "Successful Logins",
          value: dashboard.successfulLogins,
          trend: dashboard.trends?.logins,
          Icon: LogIn,
        },
        {
          title: "User Activities",
          value: dashboard.userActivities,
          trend: dashboard.trends?.activities,
          Icon: Users,
        },
        { title: "Data Changes", value: dashboard.dataChanges, Icon: Database },
        {
          title: "Deleted Records",
          value: dashboard.deletedRecords,
          Icon: Trash2,
        },
        {
          title: "Critical Events",
          value: dashboard.criticalEvents,
          trend: dashboard.trends?.critical,
          Icon: AlertTriangle,
        },
      ];
    }

    if (isLoginWorkspace) {
      const dashboard = loginDashboardQuery.data;
      if (!dashboard) return [];
      return [
        {
          title: "Successful Logins",
          value: dashboard.successfulLogins,
          trend: dashboard.trends?.success,
          Icon: LogIn,
        },
        {
          title: "Failed Logins",
          value: dashboard.failedLogins,
          trend: dashboard.trends?.failed,
          Icon: AlertTriangle,
        },
        {
          title: "Locked Accounts",
          value: dashboard.lockedAccounts,
          Icon: Lock,
        },
        {
          title: "Active Sessions",
          value: dashboard.activeSessions,
          Icon: Users,
        },
      ];
    }

    if (filters.currentWorkspace === "User Activities") {
      const dashboard = userActivitiesDashboardQuery.data;
      if (!dashboard) return [];
      return [
        {
          title: "Total Activities",
          value: dashboard.totalActivities,
          trend: dashboard.trend,
          Icon: Activity,
        },
        {
          title: "High Priority",
          value: dashboard.highPriority,
          Icon: AlertTriangle,
        },
        {
          title: "Today's Actions",
          value: dashboard.todayActions,
          Icon: Users,
        },
        {
          title: "Most Active User",
          value: dashboard.mostActiveUser?.fullName || "—",
          trend: dashboard.mostActiveUser?.activityCount,
          Icon: Users,
        },
      ];
    }

    if (filters.currentWorkspace === "Data Changes") {
      const dashboard = dataChangesDashboardQuery.data;
      if (!dashboard) return [];
      return [
        {
          title: "Modified Records",
          value: dashboard.modifiedRecords,
          trend: dashboard.trend,
          Icon: Database,
        },
        {
          title: "Patient Updates",
          value: dashboard.patientUpdates,
          Icon: Users,
        },
        {
          title: "Doctor Updates",
          value: dashboard.doctorUpdates,
          Icon: Activity,
        },
        {
          title: "Billing Changes",
          value: dashboard.billingChanges,
          Icon: Database,
        },
      ];
    }

    if (filters.currentWorkspace === "Deleted Records") {
      const dashboard = deletedRecordsDashboardQuery.data;
      if (!dashboard) return [];
      return [
        {
          title: "Records Deleted",
          value: dashboard.recordsDeleted,
          trend: dashboard.trend,
          Icon: Trash2,
        },
        { title: "Restored", value: dashboard.restored, Icon: RotateCcw },
        {
          title: "Permanent Delete",
          value: dashboard.permanentDelete,
          Icon: Lock,
        },
        {
          title: "Pending Review",
          value: dashboard.pendingReview,
          Icon: AlertTriangle,
        },
      ];
    }

    const dashboard = systemLogsDashboardQuery.data;
    if (!dashboard) return [];
    return [
      {
        title: "Services Running",
        value: `${dashboard.servicesRunning}/${dashboard.totalServices}`,
        trend: dashboard.trend,
        Icon: Server,
      },
      {
        title: "Background Jobs",
        value: dashboard.backgroundJobs,
        Icon: Activity,
      },
      {
        title: "Warning Events",
        value: dashboard.warningEvents,
        Icon: AlertTriangle,
      },
      {
        title: "Critical Events",
        value: dashboard.criticalEvents,
        Icon: AlertTriangle,
      },
    ];
  }, [
    allDashboardQuery.data,
    auditMetricsQuery.data,
    filters.currentWorkspace,
    dataChangesDashboardQuery.data,
    deletedRecordsDashboardQuery.data,
    isAllWorkspace,
    isCriticalWorkspace,
    isLoginWorkspace,
    loginDashboardQuery.data,
    systemLogsDashboardQuery.data,
    userActivitiesDashboardQuery.data,
  ]);

  const resetFilters = () => {
    setFilter("searchQuery", "");
    setFilter("selectedDateRange", "All Time");
    setFilter("customStartDate", "");
    setFilter("customEndDate", "");
    setFilter("selectedModule", "All");
    setFilter("selectedDepartment", "All");
    setFilter("selectedRole", "All");
    setFilter("selectedUser", "All");
    setFilter("selectedSeverity", "All");
    setFilter("selectedStatus", "All");
    setFilter("selectedEventType", "All");
    setPage(0);
  };

  const handleWorkspaceChange = useCallback(
    (workspace: AuditCategory) => {
      setFilter("currentWorkspace", workspace);
      // Workspace streams use different server fields. Do not carry a module,
      // role, status, or event-type filter from another stream into this one.
      setFilter("searchQuery", "");
      setFilter("selectedModule", "All");
      setFilter("selectedDepartment", "All");
      setFilter("selectedRole", "All");
      setFilter("selectedUser", "All");
      setFilter("selectedSeverity", "All");
      setFilter("selectedStatus", "All");
      setFilter("selectedEventType", "All");
      setPage(0);
    },
    [setFilter, setPage],
  );

  const refreshAuditData = () => {
    void activeQuery.refetch();
    void allDashboardQuery.refetch();
    void auditMetricsQuery.refetch();
    void auditWorkspacesQuery.refetch();
    void auditFilterOptionsQuery.refetch();

    if (isAllWorkspace || isCriticalWorkspace)
      void criticalEventsQuery.refetch();
    if (isLoginWorkspace) {
      void loginDashboardQuery.refetch();
      void loginFilterOptionsQuery.refetch();
      void activeSessionsQuery.refetch();
      void failedAttemptsQuery.refetch();
      void lockedAccountsQuery.refetch();
    }
  };

  const currentPage = activeQuery.data?.number ?? page;
  const totalPages = activeQuery.data?.totalPages ?? 0;

  if (activeDetailsRecord) {
    return (
      <AuditLogDetailsPage
        recordId={activeDetailsRecord.id}
        sourceCategory={filters.currentWorkspace}
        onBack={() => setActiveDetailsRecord(null)}
      />
    );
  }

  return (
    <>
      {/* ─── PRINT-SPECIFIC CSS ─── */}
      <style>{`
        @page {
          size: A4 landscape;
          margin: 8mm;
        }
        @media screen {
          .audit-log-print-only {
            display: none !important;
          }
        }
        @media print {
          html, body {
            background: #ffffff !important;
            margin: 0 !important;
            padding: 0 !important;
            overflow: visible !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          /* Hide application shell, navbar, sidebar, buttons, and normal screen UI */
          .audit-log-screen-ui,
          nav,
          aside,
          header,
          footer,
          button,
          .no-print {
            display: none !important;
          }
          /* Show dedicated print document */
          .audit-log-print-only {
            display: block !important;
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
            background: #ffffff !important;
            color: #000000 !important;
            font-size: 8.5pt !important;
            line-height: 1.3 !important;
            overflow: visible !important;
          }
          .audit-log-print-only table {
            width: 100% !important;
            border-collapse: collapse !important;
            margin-top: 6px !important;
          }
          .audit-log-print-only thead {
            display: table-header-group !important;
          }
          .audit-log-print-only tbody {
            display: table-row-group !important;
          }
          .audit-log-print-only tr {
            break-inside: avoid !important;
            page-break-inside: avoid !important;
          }
          .audit-log-print-only th,
          .audit-log-print-only td {
            border: 1px solid #cbd5e1 !important;
            padding: 4px 6px !important;
            font-size: 8pt !important;
            vertical-align: top !important;
            white-space: normal !important;
            overflow-wrap: anywhere !important;
            word-break: break-word !important;
          }
          .audit-log-print-only th {
            background-color: #f1f5f9 !important;
            color: #0f172a !important;
            font-weight: 700 !important;
            text-align: left !important;
          }
        }
      `}</style>

      {/* ─── DEDICATED PRINT DOCUMENT (LANDSCAPE A4) ─── */}
      <div className="audit-log-print-only" style={{ fontFamily: PP }}>
        {/* A. HOSPITAL / REPORT HEADER */}
        <div className="border-b-2 border-slate-900 pb-3 mb-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              {logoLoaded && (
                <img
                  src={effectiveLogo}
                  alt=""
                  onError={() => setLogoLoaded(false)}
                  className="w-14 h-14 object-contain rounded"
                />
              )}
              <div>
                <h1 className="text-lg font-bold text-slate-900 tracking-tight leading-none uppercase">
                  {hospitalName}
                </h1>
                <p className="text-[9.5px] text-slate-600 mt-1">
                  {hospitalAddress}
                  {hospitalPhone && ` • Ph: ${hospitalPhone}`}
                  {hospitalEmail && ` • Email: ${hospitalEmail}`}
                  {hospitalGstin && ` • GSTIN: ${hospitalGstin}`}
                </p>
                <p className="text-[9px] text-slate-500 mt-0.5">
                  Hospital Administration Audit Records • {filters.currentWorkspace} Stream
                </p>
              </div>
            </div>

            <div className="text-right">
              <div className="inline-block px-2.5 py-1 bg-slate-900 text-white rounded text-[10px] font-bold tracking-wide uppercase">
                AUDIT LOG REPORT
              </div>
              <div className="text-[9.5px] text-slate-600 mt-1.5 space-y-0.5">
                <div>
                  <span className="font-semibold text-slate-800">Report Period: </span>
                  <span>
                    {filters.selectedDateRange}
                    {filters.selectedDateRange === "Custom Range" && (filters.customStartDate || filters.customEndDate)
                      ? ` (${filters.customStartDate || "Start"} to ${filters.customEndDate || "End"})`
                      : dateRange.fromDate || dateRange.toDate
                        ? ` (${dateRange.fromDate || ""} to ${dateRange.toDate || ""})`
                        : ""}
                  </span>
                </div>
                <div>
                  <span className="font-semibold text-slate-800">Generated: </span>
                  <span>{new Date().toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}</span>
                </div>
                <div>
                  <span className="font-semibold text-slate-800">Total Records: </span>
                  <span className="font-bold text-slate-900">
                    Showing {filteredRecords.length} of {totalElements.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* B. COMPACT AUDIT SUMMARY (From existing KPI metrics) */}
        {kpiCards.length > 0 && (
          <div className="mb-3 border border-slate-300 rounded p-2.5 bg-slate-50/70">
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-700 mb-2 border-b border-slate-200 pb-1">
              Audit Stream KPI Summary
            </div>
            <div className="grid grid-cols-6 gap-2 text-center">
              {kpiCards.map((card, idx) => (
                <div
                  key={card.title}
                  className={`${idx < kpiCards.length - 1 ? "border-r border-slate-200 pr-2" : ""}`}
                >
                  <span className="text-[9px] text-slate-500 block uppercase font-medium">
                    {card.title}
                  </span>
                  <span className="text-sm font-bold text-slate-900 block mt-0.5">
                    {typeof card.value === "number" ? card.value.toLocaleString() : card.value}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* C. ACTIVE FILTERS SUMMARY */}
        <div className="mb-3 bg-slate-50 border border-slate-200 rounded p-2 text-[9px] text-slate-700 flex flex-wrap items-center gap-x-4 gap-y-1">
          <div>
            <span className="font-semibold text-slate-900">Workspace: </span>
            <span>{filters.currentWorkspace}</span>
          </div>
          <div>
            <span className="font-semibold text-slate-900">Date Range: </span>
            <span>{filters.selectedDateRange}</span>
          </div>
          {filters.selectedModule !== "All" && (
            <div>
              <span className="font-semibold text-slate-900">Module: </span>
              <span>{filters.selectedModule}</span>
            </div>
          )}
          {filters.selectedDepartment !== "All" && (
            <div>
              <span className="font-semibold text-slate-900">Department: </span>
              <span>{filters.selectedDepartment}</span>
            </div>
          )}
          {filters.selectedRole !== "All" && (
            <div>
              <span className="font-semibold text-slate-900">Role: </span>
              <span>{filters.selectedRole}</span>
            </div>
          )}
          {filters.selectedUser !== "All" && (
            <div>
              <span className="font-semibold text-slate-900">User: </span>
              <span>{filters.selectedUser}</span>
            </div>
          )}
          {filters.selectedSeverity !== "All" && (
            <div>
              <span className="font-semibold text-slate-900">Severity: </span>
              <span>{filters.selectedSeverity}</span>
            </div>
          )}
          {filters.selectedStatus !== "All" && (
            <div>
              <span className="font-semibold text-slate-900">Status: </span>
              <span>{filters.selectedStatus}</span>
            </div>
          )}
          {filters.selectedEventType !== "All" && (
            <div>
              <span className="font-semibold text-slate-900">Event Type: </span>
              <span>{filters.selectedEventType}</span>
            </div>
          )}
          {filters.searchQuery && (
            <div>
              <span className="font-semibold text-slate-900">Search: </span>
              <span className="italic">{`"${filters.searchQuery}"`}</span>
            </div>
          )}
        </div>

        {/* D. FULL AUDIT LOG TABLE */}
        <div className="mb-3">
          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-700 mb-1 flex items-center justify-between">
            <span>Audit Trail Event Register</span>
            <span className="text-[9px] font-normal text-slate-500">
              Showing {filteredRecords.length} Loaded Events
            </span>
          </div>

          <table className="w-full text-left border border-slate-300 text-[9.5px]">
            {isLoginWorkspace ? (
              <>
                <thead>
                  <tr className="bg-slate-100 text-slate-800 font-bold border-b border-slate-300">
                    <th className="py-1.5 px-2 border-r border-slate-300 w-[120px]">User</th>
                    <th className="py-1.5 px-2 border-r border-slate-300 w-[90px]">Role</th>
                    <th className="py-1.5 px-2 border-r border-slate-300 w-[140px]">Login Time</th>
                    <th className="py-1.5 px-2 border-r border-slate-300 w-[140px]">Logout Time</th>
                    <th className="py-1.5 px-2 border-r border-slate-300 w-[110px]">IP Address</th>
                    <th className="py-1.5 px-2 border-r border-slate-300">Device</th>
                    <th className="py-1.5 px-2 text-center w-[80px]">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRecords.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="text-center py-4 text-slate-500">
                        No login audit records found.
                      </td>
                    </tr>
                  ) : (
                    filteredRecords.map((r) => (
                      <tr key={r.id} className="border-b border-slate-200">
                        <td className="py-1.5 px-2 font-bold text-slate-900 border-r border-slate-200">{r.user || "—"}</td>
                        <td className="py-1.5 px-2 text-slate-700 border-r border-slate-200">{r.userRole || "—"}</td>
                        <td className="py-1.5 px-2 font-mono text-slate-600 border-r border-slate-200">{display(r.loginTime || r.timestamp)}</td>
                        <td className="py-1.5 px-2 font-mono text-slate-600 border-r border-slate-200">{display(r.logoutTime)}</td>
                        <td className="py-1.5 px-2 font-mono text-slate-600 border-r border-slate-200">{display(r.ipAddress)}</td>
                        <td className="py-1.5 px-2 text-slate-700 border-r border-slate-200">{display(r.device)}</td>
                        <td className="py-1.5 px-2 text-center font-semibold text-slate-800">{r.status || "—"}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </>
            ) : filters.currentWorkspace === "User Activities" ? (
              <>
                <thead>
                  <tr className="bg-slate-100 text-slate-800 font-bold border-b border-slate-300">
                    <th className="py-1.5 px-2 border-r border-slate-300 w-[120px]">User</th>
                    <th className="py-1.5 px-2 border-r border-slate-300 w-[100px]">Module</th>
                    <th className="py-1.5 px-2 border-r border-slate-300 w-[130px]">Action</th>
                    <th className="py-1.5 px-2 border-r border-slate-300">Description</th>
                    <th className="py-1.5 px-2 border-r border-slate-300 w-[140px]">Timestamp</th>
                    <th className="py-1.5 px-2 text-center w-[80px]">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRecords.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center py-4 text-slate-500">
                        No activity records found.
                      </td>
                    </tr>
                  ) : (
                    filteredRecords.map((r) => (
                      <tr key={r.id} className="border-b border-slate-200">
                        <td className="py-1.5 px-2 font-bold text-slate-900 border-r border-slate-200">{r.user || "—"}</td>
                        <td className="py-1.5 px-2 text-slate-700 border-r border-slate-200">{r.module || "—"}</td>
                        <td className="py-1.5 px-2 font-semibold text-slate-900 border-r border-slate-200">{r.action || "—"}</td>
                        <td className="py-1.5 px-2 text-slate-600 border-r border-slate-200">{display(r.description)}</td>
                        <td className="py-1.5 px-2 font-mono text-slate-600 border-r border-slate-200">{display(r.timestamp)}</td>
                        <td className="py-1.5 px-2 text-center font-semibold text-slate-800">{r.status || "—"}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </>
            ) : filters.currentWorkspace === "Data Changes" ? (
              <>
                <thead>
                  <tr className="bg-slate-100 text-slate-800 font-bold border-b border-slate-300">
                    <th className="py-1.5 px-2 border-r border-slate-300 w-[100px]">Module</th>
                    <th className="py-1.5 px-2 border-r border-slate-300 w-[100px]">Record ID</th>
                    <th className="py-1.5 px-2 border-r border-slate-300 w-[110px]">Field</th>
                    <th className="py-1.5 px-2 border-r border-slate-300">Old Value</th>
                    <th className="py-1.5 px-2 border-r border-slate-300">New Value</th>
                    <th className="py-1.5 px-2 border-r border-slate-300 w-[120px]">Modified By</th>
                    <th className="py-1.5 px-2 w-[140px]">Timestamp</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRecords.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="text-center py-4 text-slate-500">
                        No data change records found.
                      </td>
                    </tr>
                  ) : (
                    filteredRecords.map((r) => (
                      <tr key={r.id} className="border-b border-slate-200">
                        <td className="py-1.5 px-2 text-slate-700 border-r border-slate-200">{r.module || "—"}</td>
                        <td className="py-1.5 px-2 font-mono font-bold text-slate-900 border-r border-slate-200">{display(r.recordId)}</td>
                        <td className="py-1.5 px-2 font-semibold text-slate-800 border-r border-slate-200">{display(r.fieldChanged)}</td>
                        <td className="py-1.5 px-2 font-mono text-red-700 border-r border-slate-200">{display(r.oldValue)}</td>
                        <td className="py-1.5 px-2 font-mono text-emerald-700 border-r border-slate-200">{display(r.newValue)}</td>
                        <td className="py-1.5 px-2 font-bold text-slate-900 border-r border-slate-200">{r.user || "—"}</td>
                        <td className="py-1.5 px-2 font-mono text-slate-600">{display(r.timestamp)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </>
            ) : filters.currentWorkspace === "Deleted Records" ? (
              <>
                <thead>
                  <tr className="bg-slate-100 text-slate-800 font-bold border-b border-slate-300">
                    <th className="py-1.5 px-2 border-r border-slate-300 w-[100px]">Record ID</th>
                    <th className="py-1.5 px-2 border-r border-slate-300 w-[100px]">Module</th>
                    <th className="py-1.5 px-2 border-r border-slate-300 w-[120px]">Deleted By</th>
                    <th className="py-1.5 px-2 border-r border-slate-300">Reason / Description</th>
                    <th className="py-1.5 px-2 border-r border-slate-300 w-[140px]">Deleted Time</th>
                    <th className="py-1.5 px-2 text-center w-[80px]">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRecords.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center py-4 text-slate-500">
                        No deleted records found.
                      </td>
                    </tr>
                  ) : (
                    filteredRecords.map((r) => (
                      <tr key={r.id} className="border-b border-slate-200">
                        <td className="py-1.5 px-2 font-mono font-bold text-red-700 border-r border-slate-200">{display(r.recordId)}</td>
                        <td className="py-1.5 px-2 text-slate-700 border-r border-slate-200">{r.module || "—"}</td>
                        <td className="py-1.5 px-2 font-bold text-slate-900 border-r border-slate-200">{r.user || "—"}</td>
                        <td className="py-1.5 px-2 text-slate-600 border-r border-slate-200">{display(r.deletionReason || r.description)}</td>
                        <td className="py-1.5 px-2 font-mono text-slate-600 border-r border-slate-200">{display(r.timestamp)}</td>
                        <td className="py-1.5 px-2 text-center font-semibold text-slate-800">{r.status || "—"}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </>
            ) : filters.currentWorkspace === "System Logs" ? (
              <>
                <thead>
                  <tr className="bg-slate-100 text-slate-800 font-bold border-b border-slate-300">
                    <th className="py-1.5 px-2 border-r border-slate-300 w-[80px]">Severity</th>
                    <th className="py-1.5 px-2 border-r border-slate-300 w-[130px]">Event</th>
                    <th className="py-1.5 px-2 border-r border-slate-300 w-[100px]">Module</th>
                    <th className="py-1.5 px-2 border-r border-slate-300">Description</th>
                    <th className="py-1.5 px-2 border-r border-slate-300 w-[140px]">Timestamp</th>
                    <th className="py-1.5 px-2 text-center w-[80px]">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRecords.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center py-4 text-slate-500">
                        No system logs found.
                      </td>
                    </tr>
                  ) : (
                    filteredRecords.map((r) => (
                      <tr key={r.id} className="border-b border-slate-200">
                        <td className="py-1.5 px-2 border-r border-slate-200 font-semibold">{r.severity || "—"}</td>
                        <td className="py-1.5 px-2 font-bold text-slate-900 border-r border-slate-200">{r.action || "—"}</td>
                        <td className="py-1.5 px-2 text-slate-700 border-r border-slate-200">{r.module || "—"}</td>
                        <td className="py-1.5 px-2 text-slate-600 border-r border-slate-200">{display(r.description)}</td>
                        <td className="py-1.5 px-2 font-mono text-slate-600 border-r border-slate-200">{display(r.timestamp)}</td>
                        <td className="py-1.5 px-2 text-center font-semibold text-slate-800">{r.status || "—"}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </>
            ) : (
              /* Default / All Logs / Critical Events */
              <>
                <thead>
                  <tr className="bg-slate-100 text-slate-800 font-bold border-b border-slate-300">
                    <th className="py-1.5 px-2 border-r border-slate-300 w-[130px]">Timestamp</th>
                    <th className="py-1.5 px-2 border-r border-slate-300 w-[95px]">Category</th>
                    <th className="py-1.5 px-2 border-r border-slate-300 w-[110px]">User</th>
                    <th className="py-1.5 px-2 border-r border-slate-300 w-[80px]">Role</th>
                    <th className="py-1.5 px-2 border-r border-slate-300 w-[90px]">Module</th>
                    <th className="py-1.5 px-2 border-r border-slate-300 w-[120px]">Action</th>
                    <th className="py-1.5 px-2 border-r border-slate-300 w-[75px]">Severity</th>
                    <th className="py-1.5 px-2 border-r border-slate-300 w-[75px]">Status</th>
                    <th className="py-1.5 px-2">Description</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRecords.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="text-center py-4 text-slate-500">
                        No audit records found.
                      </td>
                    </tr>
                  ) : (
                    filteredRecords.map((r) => (
                      <tr key={r.id} className="border-b border-slate-200">
                        <td className="py-1.5 px-2 font-mono text-slate-600 border-r border-slate-200 whitespace-nowrap">{display(r.timestamp)}</td>
                        <td className="py-1.5 px-2 font-semibold text-slate-700 border-r border-slate-200">{r.category || "—"}</td>
                        <td className="py-1.5 px-2 font-bold text-slate-900 border-r border-slate-200">{r.user || "—"}</td>
                        <td className="py-1.5 px-2 text-slate-600 border-r border-slate-200">{r.userRole || "—"}</td>
                        <td className="py-1.5 px-2 text-slate-700 border-r border-slate-200">{r.module || "—"}</td>
                        <td className="py-1.5 px-2 font-semibold text-slate-900 border-r border-slate-200">{r.action || "—"}</td>
                        <td className="py-1.5 px-2 border-r border-slate-200 font-semibold">{r.severity || "—"}</td>
                        <td className="py-1.5 px-2 border-r border-slate-200 font-semibold">{r.status || "—"}</td>
                        <td className="py-1.5 px-2 text-slate-600">{display(r.description)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </>
            )}
          </table>
        </div>

        {/* E. PAGE FOOTER */}
        <div className="border-t border-slate-300 pt-2 text-[8.5px] text-slate-500 flex justify-between items-center">
          <span>Safe Hands HMS • Audit & Governance Trail</span>
          <span>Confidential — Internal Administrative Use Only</span>
        </div>
      </div>

      {/* ─── NORMAL SCREEN UI ─── */}
      <div
        className="audit-log-screen-ui flex-1 overflow-y-auto p-6 space-y-6 bg-[#F1F5F9]"
        style={{ fontFamily: RB }}
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              {!isAllWorkspace && (
                <button
                  onClick={() => handleWorkspaceChange("All Logs")}
                  className="p-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 transition-colors"
                  title="Back to all audit logs"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
              )}
              <div>
                <h1
                  className="text-2xl font-bold text-gray-900"
                  style={{ fontFamily: PP }}
                >
                  {isAllWorkspace ? "Audit Logs" : filters.currentWorkspace}
                </h1>
                <p className="text-sm text-gray-500 mt-1">
                  Audit records are loaded directly from the hospital
                  administration.
                </p>
              </div>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={() => window.print()}
              className="inline-flex items-center gap-2 px-3.5 py-2 text-sm font-semibold text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors shadow-sm"
            >
              <Printer className="w-4 h-4" />
              Print
            </button>
            <button
              onClick={() => downloadCsv(filteredRecords, "audit-logs.csv")}
              disabled={filteredRecords.length === 0}
              className="inline-flex items-center gap-2 px-3.5 py-2 text-sm font-semibold text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
            >
              <Download className="w-4 h-4 text-emerald-600" />
              Export CSV
            </button>
            <button
              onClick={refreshAuditData}
              disabled={activeQuery.isFetching}
              className="inline-flex items-center gap-2 px-3.5 py-2 text-sm font-semibold text-white rounded-lg transition-colors shadow-sm disabled:opacity-70"
              style={{ backgroundColor: "#0D47A1" }}
            >
              <RefreshCw
                className={`w-4 h-4 ${activeQuery.isFetching ? "animate-spin" : ""}`}
              />
              Refresh
            </button>
          </div>
        </div>

      <section className="space-y-3">
        {kpiCards.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-4">
            {kpiCards.map((card) => {
              const CardIcon = card.Icon;
              const trend = formatTrend(card.trend);
              return (
                <div
                  key={card.title}
                  className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-blue-50 text-blue-700">
                      <CardIcon className="w-5 h-5" />
                    </div>
                    {trend && (
                      <span
                        className={`text-xs font-semibold px-2 py-0.5 rounded ${card.trend && card.trend < 0 ? "bg-red-50 text-red-700" : "bg-emerald-50 text-emerald-700"}`}
                      >
                        {trend}
                      </span>
                    )}
                  </div>
                  <div className="mt-4">
                    <div
                      className="text-2xl font-bold text-gray-900"
                      style={{ fontFamily: PP }}
                    >
                      {typeof card.value === "number"
                        ? card.value.toLocaleString()
                        : card.value}
                    </div>
                    <div className="text-xs font-medium text-gray-500 mt-1">
                      {card.title}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-gray-200 px-5 py-4 text-sm text-gray-500">
            {allDashboardQuery.isLoading
              ? "Loading audit summary…"
              : "No audit summary was returned by the server."}
          </div>
        )}
      </section>

      {isAllWorkspace && (
        <section className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between gap-4 border-b border-gray-100 pb-3">
            <div>
              <h2
                className="text-base font-bold text-gray-900"
                style={{ fontFamily: PP }}
              >
                Recent Critical Events
              </h2>
              <p className="text-xs text-gray-500 mt-0.5">
                Records from the critical-events audit endpoint.
              </p>
            </div>
            <span className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-xs font-bold border border-red-200">
              {(
                criticalEventsQuery.data?.totalElements ??
                criticalRecords.length
              ).toLocaleString()}{" "}
              alerts
            </span>
          </div>
          {criticalEventsQuery.isLoading ? (
            <p className="text-sm text-gray-500">Loading critical events…</p>
          ) : criticalEventsQuery.isError ? (
            <p className="text-sm text-red-700">
              {getErrorMessage(criticalEventsQuery.error)}
            </p>
          ) : criticalRecords.length === 0 ? (
            <p className="text-sm text-gray-500">
              No critical events were returned by the server.
            </p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {criticalRecords.slice(0, 3).map((record) => (
                <article
                  key={record.id}
                  className="p-4 rounded-xl border border-red-200 bg-red-50/40 space-y-2"
                >
                  <div className="flex justify-between gap-3">
                    <SeverityBadge severity={record.severity} />
                    <span className="text-[11px] font-mono text-gray-500">
                      {display(record.timestamp)}
                    </span>
                  </div>
                  <h3 className="text-sm font-bold text-gray-900">
                    {record.action}
                  </h3>
                  <p className="text-xs text-gray-600 line-clamp-2">
                    {display(record.description)}
                  </p>
                  <div className="pt-2 flex justify-between items-center border-t border-red-100">
                    <span className="text-[11px] font-semibold text-blue-900">
                      {record.module}
                    </span>
                    <button
                      onClick={() => setActiveDetailsRecord(record)}
                      className="text-xs font-bold text-blue-700 hover:text-blue-900 inline-flex items-center gap-1"
                    >
                      View details <ArrowUpRight className="w-3 h-3" />
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      )}

      <section className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-4">
        <div className="flex items-center justify-between gap-4 border-b border-gray-100 pb-3">
          <div>
            <h2
              className="text-base font-bold text-gray-900"
              style={{ fontFamily: PP }}
            >
              Audit Workspaces
            </h2>
            <p className="text-xs text-gray-500 mt-0.5">
              Workspace names and record counts are supplied by the audit API.
            </p>
          </div>
          <span className="text-xs font-bold text-blue-900 bg-blue-50 px-3 py-1 rounded-full border border-blue-200">
            {auditWorkspacesQuery.isLoading
              ? "Loading…"
              : `${workspaceCards.length} workspaces`}
          </span>
        </div>
        {auditWorkspacesQuery.isError && (
          <p className="text-xs text-red-700">
            {getErrorMessage(auditWorkspacesQuery.error)}
          </p>
        )}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {workspaceCards.map((card) => {
            const CardIcon = card.icon;
            const isActive = filters.currentWorkspace === card.id;
            return (
              <button
                key={card.id}
                onClick={() => handleWorkspaceChange(card.id)}
                className={`p-4 rounded-2xl border text-left transition-colors duration-200 flex flex-col justify-between group ${isActive ? "bg-blue-900 text-white border-blue-900 shadow-md" : "bg-white text-gray-900 border-gray-200 hover:border-blue-300 hover:shadow-md"}`}
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center ${isActive ? "bg-white/20 text-white" : `${card.bg} ${card.color}`}`}
                    >
                      <CardIcon className="w-5 h-5" />
                    </div>
                    <ArrowUpRight
                      className={`w-4 h-4 ${isActive ? "text-white" : "text-gray-400"}`}
                    />
                  </div>
                  <h3
                    className={`text-sm font-bold ${isActive ? "text-white" : "text-gray-900"}`}
                    style={{ fontFamily: PP }}
                  >
                    {card.title}
                  </h3>
                  <p
                    className={`text-[11px] mt-1 leading-relaxed ${isActive ? "text-blue-100" : "text-gray-500"}`}
                  >
                    {card.description}
                  </p>
                </div>
                <div
                  className={`mt-4 pt-2 border-t text-[11px] font-bold flex items-center justify-between ${isActive ? "border-white/20 text-blue-100" : "border-gray-100 text-gray-500"}`}
                >
                  <span>
                    {typeof card.count === "number"
                      ? `${card.count.toLocaleString()} records`
                      : "Count unavailable"}
                  </span>
                  {isActive && (
                    <span className="text-[9px] tracking-wider">ACTIVE</span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </section>

      {isLoginWorkspace && (
        <LoginSupplementaryData
          activeSessions={safeArray(activeSessionsQuery.data?.content)}
          failedAttempts={safeArray(failedAttemptsQuery.data?.content)}
          lockedAccounts={safeArray(lockedAccountsQuery.data?.content)}
          loading={
            activeSessionsQuery.isLoading ||
            failedAttemptsQuery.isLoading ||
            lockedAccountsQuery.isLoading
          }
          error={
            activeSessionsQuery.isError
              ? activeSessionsQuery.error
              : failedAttemptsQuery.isError
                ? failedAttemptsQuery.error
                : lockedAccountsQuery.isError
                  ? lockedAccountsQuery.error
                  : undefined
          }
        />
      )}

      <DataTable<AuditRecord>
        data={filteredRecords}
        columns={tableColumns}
        loading={activeQuery.isLoading}
        getRowId={(r) => r.id}
        title={`${filters.currentWorkspace} Stream`}
        subtitle="Comprehensive audit trail & system event logs."
        headerBadge={
          <span className="text-xs font-semibold text-[#0D47A1] bg-blue-50 px-3 py-1 rounded-xl border border-blue-100 font-mono">
            Showing {filteredRecords.length} of {totalElements.toLocaleString()}
          </span>
        }
        searchable={true}
        searchPlaceholder=" Search loaded records by event, user, module, action, or record ID..."
        searchValue={filters.searchQuery}
        onSearchChange={(v) => setFilter("searchQuery", v)}
        toolbar={
          <div className="bg-slate-50/80 border border-[#E5E7EB] rounded-xl p-2.5 space-y-2 shadow-2xs text-xs">
            <div className="flex items-center gap-2 flex-wrap">
              <FilterSelect
                label="Date range"
                value={filters.selectedDateRange}
                onChange={(value) => {
                  setFilter("selectedDateRange", value);
                  setPage(0);
                }}
              >
                <option value="All Time">All time</option>
                <option value="Today">Today</option>
                <option value="Yesterday">Yesterday</option>
                <option value="Last 7 Days">Last 7 days</option>
                <option value="Last 30 Days">Last 30 days</option>
                <option value="Custom Range">Custom Range</option>
              </FilterSelect>

              <DateCalendarPicker
                selectedDateRange={filters.selectedDateRange}
                startDate={filters.customStartDate}
                endDate={filters.customEndDate}
                onStartDateChange={(d) => setFilter("customStartDate", d)}
                onEndDateChange={(d) => setFilter("customEndDate", d)}
              />

              <ApiFilterSelect
                label="Module"
                value={filters.selectedModule}
                onChange={(v) => setFilter("selectedModule", v)}
                options={filterOptions?.modules}
                allLabel="All modules"
              />
              <ApiFilterSelect
                label="Department"
                value={filters.selectedDepartment}
                onChange={(v) => setFilter("selectedDepartment", v)}
                options={filterOptions?.departments}
                allLabel="All departments"
              />
              <ApiFilterSelect
                label="Role"
                value={filters.selectedRole}
                onChange={(v) => setFilter("selectedRole", v)}
                options={filterOptions?.roles}
                allLabel="All roles"
              />
              <ApiFilterSelect
                label="User"
                value={filters.selectedUser}
                onChange={(v) => setFilter("selectedUser", v)}
                options={filterOptions?.users}
                allLabel="All users"
              />
              <ApiFilterSelect
                label="Severity"
                value={filters.selectedSeverity}
                onChange={(v) => setFilter("selectedSeverity", v)}
                options={filterOptions?.severities}
                allLabel="All severities"
              />
              <ApiFilterSelect
                label="Status"
                value={filters.selectedStatus}
                onChange={(v) => setFilter("selectedStatus", v)}
                options={filterOptions?.statuses}
                allLabel="All statuses"
              />
              <ApiFilterSelect
                label="Event type"
                value={filters.selectedEventType}
                onChange={(v) => setFilter("selectedEventType", v)}
                options={filterOptions?.eventTypes}
                allLabel="All event types"
              />

              <button
                onClick={resetFilters}
                className="px-2.5 py-1.5 rounded-lg border border-red-200 bg-red-50 hover:bg-red-100 text-red-600 text-[11px] font-semibold transition-colors flex items-center gap-1 cursor-pointer shadow-2xs shrink-0 ml-auto"
                style={{ fontFamily: PP }}
              >
                <RotateCcw className="w-3.5 h-3.5" /> Reset filters
              </button>
            </div>
          </div>
        }
        emptyTitle="No Audit Records Found"
        emptySubtitle="The server returned no records matching the current search query or filters."
        pagination={true}
        serverPagination={true}
        page={currentPage + 1}
        pageSize={PAGE_SIZE}
        totalPages={totalPages}
        totalCount={totalElements}
        onPageChange={(newPage) => setPage(newPage - 1)}
      />
      </div>
    </>
  );
}
