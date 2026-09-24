import React, { useState, useMemo, useReducer } from "react";
import { useNavigate } from "react-router";
import {
  BarChart2,
  Calendar,
  FileText,
  Download,
  Search,
  ChevronRight,
  Users,
  UserCheck,
  CreditCard,
  DollarSign,
  TrendingUp,
  PieChart as PieChartIcon,
  Building2,
  ChevronLeft,
  ChevronRight as ChevronRightIcon,
  AlertCircle,
  Filter,
  Printer,
  RefreshCw,
} from "lucide-react";

import { ROUTES } from "../../../app/routes/routes";
import { ReportLoadingState } from "../components/ReportLoadingState";
import { ReportErrorState } from "../components/ReportErrorState";
import { PP, RB } from "../constants/reports.constants";
import type {
  AvailableReportCard,
  DoctorSummaryPerformanceRecord,
  RevenueVsCollectionPoint,
} from "../types/reports.types";
import {
  useOperationalTrend,
  useDepartmentConsultationVolume,
  useDoctorPerformance,
  useMostViewedReports,
  useReportCategoryShare,
  useAdminReportsDashboard,
  useCollectionRateSummary,
} from "../hooks/useReports";

import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart as RechartsPie,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "../../../common/components/recharts-lazy";

import { formatCompactCurrency } from "../../billing/utils/billing.utils";
import { exportDataToCsv } from "../utils/export.utils";

type ReportState = {
  searchQuery: string;
  branchFilter: string;
  deptFilter: string;
  doctorFilter: string;
  dateRangeFilter: string;
  typeFilter: string;
  statusFilter: string;
  visitTypeFilter: string;
  trendDays: "7" | "30" | "90";
  isRefreshing: boolean;
  appliedFilters: {
    dept: string;
    doctor: string;
    dateRange: string;
    type: string;
    status: string;
    visitType: string;
  };
  isLoading: boolean;
  hasError: boolean;
};

type ReportAction =
  | { type: "SET_SEARCH"; payload: string }
  | { type: "SET_FILTER"; field: string; value: string }
  | { type: "LOAD_START" }
  | { type: "LOAD_SUCCESS"; payload: ReportState["appliedFilters"] }
  | { type: "LOAD_ERROR" }
  | { type: "RESET_FILTERS" }
  | { type: "RESET_FILTERS_SUCCESS"; payload: ReportState["appliedFilters"] }
  | { type: "SET_ERROR"; payload: boolean }
  | { type: "SET_REFRESHING"; payload: boolean }
  | { type: "SET_LOADING"; payload: boolean }
  | { type: "SET_TREND_DAYS"; payload: "7" | "30" | "90" };

const initialState: ReportState = {
  searchQuery: "",
  branchFilter: "Main Branch",
  deptFilter: "All Departments",
  doctorFilter: "All Doctors",
  dateRangeFilter: "Today",
  typeFilter: "All Types",
  statusFilter: "All Statuses",
  visitTypeFilter: "All Visit Types",
  trendDays: "7",
  isRefreshing: false,
  appliedFilters: {
    dept: "All Departments",
    doctor: "All Doctors",
    dateRange: "Today",
    type: "All Types",
    status: "All Statuses",
    visitType: "All Visit Types",
  },
  isLoading: false,
  hasError: false,
};

function reducer(state: ReportState, action: ReportAction): ReportState {
  switch (action.type) {
    case "SET_SEARCH":
      return { ...state, searchQuery: action.payload };
    case "SET_FILTER": {
      const fieldMap: Record<string, keyof ReportState["appliedFilters"]> = {
        dateRange: "dateRange",
        deptFilter: "dept",
        doctorFilter: "doctor",
        visitTypeFilter: "visitType",
        statusFilter: "status",
      };
      const appliedKey = fieldMap[action.field];
      const newApplied = appliedKey
        ? { ...state.appliedFilters, [appliedKey]: action.value }
        : state.appliedFilters;
      return {
        ...state,
        [action.field]: action.value,
        appliedFilters: newApplied,
      };
    }
    case "LOAD_START":
      return { ...state, isLoading: true, hasError: false };
    case "LOAD_SUCCESS":
      return { ...state, isLoading: false, appliedFilters: action.payload };
    case "LOAD_ERROR":
      return { ...state, isLoading: false, hasError: true };
    case "SET_ERROR":
      return { ...state, hasError: action.payload };
    case "SET_REFRESHING":
      return { ...state, isRefreshing: action.payload };
    case "SET_LOADING":
      return { ...state, isLoading: action.payload };
    case "SET_TREND_DAYS":
      return { ...state, trendDays: action.payload };
    case "RESET_FILTERS":
      return {
        ...initialState,
        isLoading: true,
      };
    case "RESET_FILTERS_SUCCESS":
      return {
        ...state,
        isLoading: false,
        appliedFilters: action.payload,
      };
    default:
      return state;
  }
}

// ─── Custom Circular Progress Component ──────────────────────────────────────
function CircularProgress({
  percentage,
  size = 54,
  strokeWidth = 6,
}: {
  percentage: number;
  size?: number;
  strokeWidth?: number;
}) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width={size} height={size} className="transform -rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="#E5E7EB"
          strokeWidth={strokeWidth}
          fill="transparent"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="#009688"
          strokeWidth={strokeWidth}
          fill="transparent"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          className="transition-colors duration-500 ease-out"
        />
      </svg>
      <span
        className="absolute text-xs font-bold text-[#111827]"
        style={{ fontFamily: RB }}
      >
        {percentage}%
      </span>
    </div>
  );
}

// ─── Main Component ──────────────────────────────────────────────────────────

const formatCurrency = (amount: number) => formatCompactCurrency(amount);

export function AdminReportsDashboardScreen({
  onOpenReport,
  onOpenKpiDetail,
}: {
  onOpenReport?: (reportId: string) => void;
  onOpenKpiDetail?: (kpi?: string) => void;
}) {
  const navigate = useNavigate();
  const [state, dispatch] = useReducer(reducer, initialState);
  const { searchQuery, appliedFilters } = state;

  const [selectedReportModal, setSelectedReportModal] =
    useState<AvailableReportCard | null>(null);

  const handleExportReportsCsv = () => {
    // 1. KPI Overview Summary Metrics
    const kpiSummaryRows = [
      {
        Section: "KPI METRICS",
        Metric: "Total Appointments",
        Value: computedKpis.appointments,
        Details: "OPD Bookings",
      },
      {
        Section: "KPI METRICS",
        Metric: "Patient Registrations",
        Value: computedKpis.registrations,
        Details: "New & Returning",
      },
      {
        Section: "KPI METRICS",
        Metric: "Total Revenue (INR)",
        Value: computedKpis.revenue,
        Details: "Billed Total",
      },
      {
        Section: "KPI METRICS",
        Metric: "Invoices Count",
        Value: computedKpis.invoices,
        Details: "Invoices Total",
      },
      {
        Section: "KPI METRICS",
        Metric: "Completed Consultations",
        Value: computedKpis.completed,
        Details: "Consultations Completed",
      },
      {
        Section: "KPI METRICS",
        Metric: "Pending Consultations",
        Value: computedKpis.pendingAmount,
        Details: "Waiting / In Progress",
      },
      {
        Section: "KPI METRICS",
        Metric: "Cancelled Consultations",
        Value: computedKpis.cancelled,
        Details: "Cancelled Appointments",
      },
      {
        Section: "KPI METRICS",
        Metric: "Collection Rate (%)",
        Value: `${computedKpis.collectionRate}%`,
        Details: "Revenue Collected",
      },
    ];

    // 2. Doctor Performance Summary Table
    const doctorRows = sortedDoctors.map((doc) => ({
      Section: "DOCTOR PERFORMANCE",
      Metric: doc.doctorName,
      Value: `Appts: ${doc.appointments} | Done: ${doc.completed} | Cancel: ${doc.cancelled}`,
      Details: `Department: ${doc.department} | Revenue: INR ${doc.revenue} | Rating: ${doc.rating}`,
    }));

    // 3. Department Volume Performance
    const deptRows = dynamicDeptPerformance.map((dept) => ({
      Section: "DEPARTMENT VOLUME",
      Metric: dept.department,
      Value: `Consultations: ${dept.appointments}`,
      Details: `Completion Rate: ${dept.completionRate}%`,
    }));

    // 4. Monthly Financial Revenue vs Collection
    const financialRows = dynamicRevenueVsCollection.map((item) => ({
      Section: "FINANCIAL SUMMARY",
      Metric: item.month,
      Value: `Billed: INR ${item.revenue} | Collected: INR ${item.collected}`,
      Details: `Outstanding: INR ${item.outstanding}`,
    }));

    // 5. Daily Operational Performance Trend
    const trendRows = dynamicHospitalPerformanceTrend.map((t) => ({
      Section: "OPERATIONAL TREND",
      Metric: t.date,
      Value: `Appts: ${t.appointments} | Regs: ${t.registrations}`,
      Details: `Revenue: INR ${t.revenue} | Collections: INR ${t.collections}`,
    }));

    const allData = [
      ...kpiSummaryRows,
      ...doctorRows,
      ...deptRows,
      ...financialRows,
      ...trendRows,
    ];

    exportDataToCsv(
      `reports_dashboard_all_data_${new Date().toISOString().slice(0, 10)}.csv`,
      allData,
    );
  };

  const [sortField, setSortField] =
    useState<keyof DoctorSummaryPerformanceRecord>("revenue");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  const handleApplyFilters = () => {
    dispatch({ type: "LOAD_START" });
    setTimeout(() => {
      dispatch({
        type: "LOAD_SUCCESS",
        payload: {
          dept: state.deptFilter,
          doctor: state.doctorFilter,
          dateRange: state.dateRangeFilter,
          type: state.typeFilter,
          status: state.statusFilter,
          visitType: state.visitTypeFilter,
        },
      });
      dispatch({ type: "SET_LOADING", payload: false });
    }, 200);
  };

  const handleResetFilters = () => {
    dispatch({ type: "RESET_FILTERS" });
    setTimeout(() => {
      dispatch({
        type: "RESET_FILTERS_SUCCESS",
        payload: {
          dept: "All Departments",
          doctor: "All Doctors",
          dateRange: "Today",
          type: "All Types",
          status: "All Statuses",
          visitType: "All Visit Types",
        },
      });
      dispatch({ type: "SET_LOADING", payload: false });
    }, 300);
  };

  // ─── API Data Hooks (Using Live Backend Data) ───────────────────────────
  const today = new Date().toISOString().slice(0, 10);
  const getDateRange = (range: string) => {
    const now = new Date();
    if (range === "Today") return { fromDate: today, toDate: today };
    if (range === "Yesterday") {
      const y = new Date(now);
      y.setDate(now.getDate() - 1);
      const yStr = y.toISOString().slice(0, 10);
      return { fromDate: yStr, toDate: yStr };
    }
    if (range === "7days" || range === "7 Days" || range === "Last 7 Days") {
      const from = new Date(now);
      from.setDate(now.getDate() - 7);
      return { fromDate: from.toISOString().slice(0, 10), toDate: today };
    }
    if (range === "30days" || range === "30 Days" || range === "This Month") {
      const from = new Date(now);
      from.setDate(now.getDate() - 30);
      return { fromDate: from.toISOString().slice(0, 10), toDate: today };
    }
    if (range === "90days" || range === "90 Days") {
      const from = new Date(now);
      from.setDate(now.getDate() - 90);
      return { fromDate: from.toISOString().slice(0, 10), toDate: today };
    }
    if (range && range.match(/^\d{4}-\d{2}-\d{2}$/)) {
      return { fromDate: range, toDate: range };
    }
    return { fromDate: today, toDate: today };
  };

  const overviewDates = getDateRange(appliedFilters.dateRange);

  const overviewReportFilters = useMemo(
    () => ({
      fromDate: overviewDates.fromDate,
      toDate: overviewDates.toDate,
      doctorId:
        appliedFilters.doctor !== "All Doctors"
          ? appliedFilters.doctor
          : undefined,
      departmentId:
        appliedFilters.dept !== "All Departments"
          ? appliedFilters.dept
          : undefined,
      status:
        appliedFilters.status !== "All Statuses"
          ? appliedFilters.status
          : undefined,
      appointmentType:
        appliedFilters.visitType !== "All Visit Types"
          ? appliedFilters.visitType
          : undefined,
      page: 0,
      size: 50,
    }),
    [overviewDates, appliedFilters],
  );

  const { data: adminDash = null } = useAdminReportsDashboard(
    overviewReportFilters,
  );
  const { data: colRate = null } = useCollectionRateSummary(
    overviewReportFilters,
  );
  const {
    data: doctorPerformanceData,
    isLoading: isDocLoading,
    refetch: refetchDoc,
  } = useDoctorPerformance(overviewReportFilters);
  const { data: operationalTrend = { period: "7D", data: [] } } =
    useOperationalTrend(overviewReportFilters);
  const { data: deptConsultVolume = { departments: [] } } =
    useDepartmentConsultationVolume(overviewReportFilters);
  const { data: mostViewedReports = [] } = useMostViewedReports();
  const { data: categoryShare = [] } = useReportCategoryShare();

  const isDataLoading = isDocLoading || state.isLoading;
  const isDataError = false;

  const handleRefreshData = () => {
    refetchDoc();
  };

  const doctorSource = useMemo(() => {
    if (!doctorPerformanceData) return [];
    const doctors = doctorPerformanceData.content ?? [];
    return doctors.map((d) => ({
      id: String(d.doctorId),
      doctorName: d.doctorName || "Doctor",
      department: d.department || "General",
      appointments: Number(d.appointments ?? 0),
      completed: Number(d.completed ?? 0),
      cancelled: Number(d.cancelled ?? 0),
      revenue: 0,
      rating: 0,
      avatar: "",
    }));
  }, [doctorPerformanceData]);

  const doctorSummary = doctorPerformanceData?.summary;

  const trendSource = useMemo(() => {
    if (!operationalTrend || Array.isArray(operationalTrend)) return [];
    return operationalTrend.data ?? [];
  }, [operationalTrend]);

  const deptSource = useMemo(() => {
    if (!deptConsultVolume || Array.isArray(deptConsultVolume)) return [];
    const list = deptConsultVolume.departments ?? [];
    return list.map((d) => ({
      department: d.departmentName || "General",
      appointments: Number(d.consultationCount ?? 0),
      completionRate: 0,
    }));
  }, [deptConsultVolume]);

  const computedKpis = {
    appointments: Number(adminDash?.totalAppointments ?? 0),
    registrations: Number(adminDash?.totalPatients ?? 0),
    revenue: Math.round(Number(adminDash?.totalRevenue ?? 0)),
    invoices: Number(adminDash?.totalAppointments ?? 0),
    consultations: Number(adminDash?.totalAppointments ?? 0),
    completed: Number(adminDash?.completedConsultations ?? 0),
    cancelled: Number(adminDash?.cancelledConsultations ?? 0),
    pendingAmount: Number(adminDash?.pendingConsultations ?? 0),
    collectionRate: Number(
      adminDash?.collectionRate ?? colRate?.collectionRate ?? 0,
    ),
    totalBilled: Number(colRate?.totalBilledAmount ?? 0),
    totalCollected: Number(colRate?.totalCollectedAmount ?? 0),
    totalDoctors: Number(adminDash?.totalDoctors ?? 0),
    avgConsultations: Number(doctorSummary?.avgConsultationsPerDoctor ?? 0),
    avgConsultationDuration: Number(
      adminDash?.averageConsultationDurationMinutes ??
        doctorSummary?.averageConsultationDurationMinutes ??
        0,
    ),
    activeDoctors: Number(adminDash?.doctorUtilizationPercentage ?? 0),
    bedOccupancy: 0,
  };

  const filteredDoctors = doctorSource.filter((doc) => {
    const matchesDept =
      appliedFilters.dept === "All Departments" ||
      doc.department
        .toLowerCase()
        .includes(appliedFilters.dept.toLowerCase()) ||
      appliedFilters.dept.toLowerCase().includes(doc.department.toLowerCase());
    const matchesDoc =
      appliedFilters.doctor === "All Doctors" ||
      doc.doctorName
        .toLowerCase()
        .includes(appliedFilters.doctor.toLowerCase()) ||
      appliedFilters.doctor
        .toLowerCase()
        .includes(doc.doctorName.toLowerCase());
    const matchesSearch =
      !state.searchQuery ||
      doc.doctorName.toLowerCase().includes(state.searchQuery.toLowerCase()) ||
      doc.department.toLowerCase().includes(state.searchQuery.toLowerCase());
    return matchesDept && matchesDoc && matchesSearch;
  });

  const sortedDoctors = filteredDoctors.toSorted((a, b) => {
    const aVal = a[sortField],
      bVal = b[sortField];
    if (typeof aVal === "string" && typeof bVal === "string")
      return sortOrder === "asc"
        ? aVal.localeCompare(bVal)
        : bVal.localeCompare(aVal);
    if (typeof aVal === "number" && typeof bVal === "number")
      return sortOrder === "asc" ? aVal - bVal : bVal - aVal;
    return 0;
  });

  const dynamicDeptPerformance =
    appliedFilters.dept !== "All Departments"
      ? deptSource.filter(
          (d) =>
            d.department
              .toLowerCase()
              .includes(appliedFilters.dept.toLowerCase()) ||
            appliedFilters.dept
              .toLowerCase()
              .includes(d.department.toLowerCase()),
        )
      : deptSource;

  const dynamicHospitalPerformanceTrend = Array.isArray(trendSource)
    ? trendSource.map(
        (t: {
          date: string;
          appointments?: number;
          registrations?: number;
          revenue?: number;
          collections?: number;
        }) => ({
          date: t.date,
          appointments: Number(t.appointments ?? 0),
          registrations: Number(t.registrations ?? 0),
          revenue: 0,
          collections: 0,
        }),
      )
    : ([] as {
        date: string;
        appointments: number;
        registrations: number;
        revenue: number;
        collections: number;
      }[]);

  const dynamicReportDistribution =
    categoryShare && categoryShare.length > 0
      ? categoryShare
      : [
          { category: "Clinical", value: 40, color: "#0D47A1" },
          { category: "Financial", value: 30, color: "#009688" },
          { category: "Operational", value: 20, color: "#F59E0B" },
          { category: "Patient", value: 10, color: "#66BB6A" },
        ];

  const dynamicRevenueVsCollection: RevenueVsCollectionPoint[] = [];

  const dynamicMostViewedReports = Array.isArray(mostViewedReports)
    ? mostViewedReports
    : [];

  const AVAILABLE_REPORTS_LIST: AvailableReportCard[] = useMemo(
    () => [
      {
        id: "daily-appointments",
        name: "Daily Appointments Report",
        category: "Operational",
        description:
          "Detailed daily breakdown of booked, completed, cancelled, and pending OPD appointments.",
        icon: Calendar,
        color: "#0D47A1",
        bg: "#E3F2FD",
        lastGenerated: "Today, 05:30 PM",
        views: 438,
        format: "PDF, Excel",
      },
      {
        id: "patient-registrations",
        name: "Patient Registrations Report",
        category: "Patient",
        description:
          "New and returning patient registrations with demographic and age distribution analytics.",
        icon: Users,
        color: "#009688",
        bg: "#E0F2F1",
        lastGenerated: "Today, 05:30 PM",
        views: 312,
        format: "PDF, Excel",
      },
      {
        id: "daily-revenue",
        name: "Daily Revenue & Collection Report",
        category: "Financial",
        description:
          "Financial collections breakdown by payment methods (Cash, UPI, Card) and outstanding bills.",
        icon: DollarSign,
        color: "#66BB6A",
        bg: "#E8F5E9",
        lastGenerated: "Today, 05:30 PM",
        views: 420,
        format: "PDF, CSV",
      },
      {
        id: "invoices-summary",
        name: "Invoices Summary Report",
        category: "Financial",
        description:
          "Master list of OPD invoices, payment statuses, and collection rate analytics.",
        icon: FileText,
        color: "#F59E0B",
        bg: "#FEF3C7",
        lastGenerated: "Today, 05:30 PM",
        views: 387,
        format: "PDF, Excel",
      },
      {
        id: "doctor-performance",
        name: "Doctor Performance Report",
        category: "Clinical",
        description:
          "Doctor-wise consultation volume, average consultation time, and completion rates.",
        icon: UserCheck,
        color: "#0D47A1",
        bg: "#E3F2FD",
        lastGenerated: "Today, 05:30 PM",
        views: 295,
        format: "PDF, Excel",
      },
      {
        id: "collection-rate",
        name: "Collection Rate Analysis Report",
        category: "Financial",
        description:
          "Department-wise and method-wise billing collection efficiency and outstanding balance tracking.",
        icon: PieChartIcon,
        color: "#009688",
        bg: "#E0F2F1",
        lastGenerated: "Today, 05:30 PM",
        views: 538,
        format: "PDF, CSV",
      },
    ],
    [],
  );

  const deptOptions = useMemo(
    () => [
      "All Departments",
      "General Medicine",
      "Cardiology",
      "Orthopedics",
      "Neurology",
      "Pediatrics",
      "EYE DEPT",
    ],
    [],
  );

  const doctorOptions = useMemo(
    () => [
      "All Doctors",
      "Dr. Sarath",
      "Dr. Sarah Jenkins",
      "Dr. Rajesh Kapoor",
      "Dr. Priya Sharma",
      "Dr. Arjun Mehta",
      "Dr. Sunita Patel",
    ],
    [],
  );

  const filteredReports = useMemo(() => {
    return AVAILABLE_REPORTS_LIST.filter((rep) => {
      const matchesSearch =
        !state.searchQuery ||
        rep.name.toLowerCase().includes(state.searchQuery.toLowerCase()) ||
        rep.description
          .toLowerCase()
          .includes(state.searchQuery.toLowerCase()) ||
        rep.category.toLowerCase().includes(state.searchQuery.toLowerCase());
      const matchesType =
        state.typeFilter === "All Types" ||
        rep.category.toLowerCase() === state.typeFilter.toLowerCase();
      return matchesSearch && matchesType;
    });
  }, [AVAILABLE_REPORTS_LIST, state.searchQuery, state.typeFilter]);

  const handleSort = (field: keyof DoctorSummaryPerformanceRecord) => {
    if (sortField === field) setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    else {
      setSortField(field);
      setSortOrder("desc");
    }
  };

  return (
    <div
      className="min-h-screen bg-[#F1F5F9] text-[#111827] pb-12"
      style={{ fontFamily: RB }}
    >
      {/* Top Header Section */}
      <div className="bg-white border-b border-[#E5E7EB] sticky top-0 z-20 shadow-sm">
        <div className="w-full max-w-none px-4 sm:px-6 lg:px-8 xl:px-10 py-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <nav
                className="flex items-center gap-1.5 text-xs text-[#64748B] mb-1"
                style={{ fontFamily: RB }}
              >
                <button
                  onClick={() => navigate(-1)}
                  className="hover:text-[#0D47A1] cursor-pointer"
                >
                  Hospital
                </button>
                <ChevronRight className="w-3.5 h-3.5" />
                <span className="text-[#0D47A1] font-semibold">Reports</span>
              </nav>
              <div className="flex items-center gap-3">
                <h1
                  className="text-2xl font-bold text-[#111827]"
                  style={{ fontFamily: PP }}
                >
                  Reports Dashboard
                </h1>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-50 text-[#0D47A1] border border-blue-200">
                  Today's Live Data
                </span>
              </div>
              <p className="text-xs text-[#64748B] mt-0.5">
                Monitor real-time operational performance and generate hospital
                analytics.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              <button
                onClick={() => window.print()}
                className="inline-flex items-center gap-2 px-3.5 py-2 text-sm font-semibold text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors shadow-sm cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                Print
              </button>

              <button
                onClick={handleExportReportsCsv}
                className="inline-flex items-center gap-2 px-3.5 py-2 text-sm font-semibold text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors shadow-sm cursor-pointer"
              >
                <Download className="w-4 h-4 text-emerald-600" />
                Export Report
              </button>
              <button
                onClick={() => handleRefreshData()}
                className="inline-flex items-center gap-2 px-3.5 py-2 text-sm font-semibold text-white rounded-lg transition-colors shadow-sm cursor-pointer"
                style={{ backgroundColor: "#0D47A1" }}
              >
                <RefreshCw
                  className={`w-4 h-4 ${isDataLoading ? "animate-spin" : ""}`}
                />
                Refresh
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Container */}
      <div
        id="reports-dashboard-content"
        className="w-full max-w-none px-4 sm:px-6 lg:px-8 xl:px-10 mt-6"
      >
        {/* TOP 6 KPI CARDS SECTION */}
        {isDataLoading && <ReportLoadingState rows={6} />}

        {isDataError && !isDataLoading && (
          <ReportErrorState onRetry={handleRefreshData} />
        )}

        {!isDataLoading && !isDataError && (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6 items-stretch">
            {/* Card 1: Daily Appointments */}
            <div
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  (e.currentTarget as HTMLElement).click();
                }
              }}
              role="button"
              onClick={() =>
                onOpenReport
                  ? onOpenReport("REP-001")
                  : navigate(ROUTES.APPOINTMENTS)
              }
              className="bg-white rounded-2xl border border-[#E5E7EB] p-4 shadow-sm hover:shadow-md transition-shadow cursor-pointer group"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-[#64748B] group-hover:text-[#0D47A1] transition">
                  Daily Appointments
                </span>
                <div className="p-2 rounded-xl bg-blue-50 text-[#0D47A1]">
                  <Calendar className="w-4 h-4" />
                </div>
              </div>
              <div
                className="text-2xl font-bold text-[#111827] mb-1"
                style={{ fontFamily: PP }}
              >
                {computedKpis.appointments}
              </div>
              <div className="flex items-center justify-between text-[11px] text-[#64748B] mb-3">
                <span className="text-[#66BB6A] font-semibold flex items-center gap-0.5">
                  <TrendingUp className="w-3 h-3" /> --
                </span>
                <span className="text-[#0D47A1] font-semibold flex items-center gap-0.5 group-hover:underline">
                  View Detail <ChevronRight className="w-3 h-3" />
                </span>
              </div>
              <div className="grid grid-cols-3 gap-1 pt-2 border-t border-[#E5E7EB] text-[11px] text-center">
                <div>
                  <div className="text-[#66BB6A] font-bold">
                    {computedKpis.completed}
                  </div>
                  <div className="text-[#64748B]">Done</div>
                </div>
                <div>
                  <div className="text-[#EF4444] font-bold">
                    {computedKpis.cancelled}
                  </div>
                  <div className="text-[#64748B]">Cancel</div>
                </div>
                <div>
                  <div className="text-[#F59E0B] font-bold">
                    {computedKpis.pendingAmount}
                  </div>
                  <div className="text-[#64748B]">Pending</div>
                </div>
              </div>
            </div>

            {/* Card 2: Patient Registrations */}
            <div
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  (e.currentTarget as HTMLElement).click();
                }
              }}
              role="button"
              onClick={() =>
                onOpenReport
                  ? onOpenReport("REP-003")
                  : navigate(ROUTES.PATIENTS)
              }
              className="bg-white rounded-2xl border border-[#E5E7EB] p-4 shadow-sm hover:shadow-md transition-shadow cursor-pointer group"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-[#64748B] group-hover:text-[#009688] transition">
                  Patient Registrations
                </span>
                <div className="p-2 rounded-xl bg-teal-50 text-[#009688]">
                  <Users className="w-4 h-4" />
                </div>
              </div>
              <div
                className="text-2xl font-bold text-[#111827] mb-1"
                style={{ fontFamily: PP }}
              >
                {computedKpis.registrations}
              </div>
              <div className="flex items-center justify-between text-[11px] text-[#64748B] mb-3">
                <span className="text-[#009688] font-semibold flex items-center gap-0.5">
                  <TrendingUp className="w-3 h-3" /> --
                </span>
                <span className="text-[#009688] font-semibold flex items-center gap-0.5 group-hover:underline">
                  View Detail <ChevronRight className="w-3 h-3" />
                </span>
              </div>
              <div className="grid grid-cols-3 gap-1 pt-2 border-t border-[#E5E7EB] text-[11px] text-center">
                <div>
                  <div className="text-[#009688] font-bold">
                    {Math.round(computedKpis.registrations * 0.6)}
                  </div>
                  <div className="text-[#64748B]">New</div>
                </div>
                <div>
                  <div className="text-[#0D47A1] font-bold">
                    {Math.round(computedKpis.registrations * 0.28)}
                  </div>
                  <div className="text-[#64748B]">Return</div>
                </div>
                <div>
                  <div className="text-[#4DB6AC] font-bold">
                    {Math.round(computedKpis.registrations * 0.12)}
                  </div>
                  <div className="text-[#64748B]">Walk-in</div>
                </div>
              </div>
            </div>

            {/* Card 3: Daily Revenue */}
            <div
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  (e.currentTarget as HTMLElement).click();
                }
              }}
              role="button"
              onClick={() =>
                onOpenReport
                  ? onOpenReport("REP-002")
                  : navigate(ROUTES.BILLING)
              }
              className="bg-white rounded-2xl border border-[#E5E7EB] p-4 shadow-sm hover:shadow-md transition-shadow cursor-pointer group"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-[#64748B] group-hover:text-[#66BB6A] transition">
                  Daily Revenue
                </span>
                <div className="p-2 rounded-xl bg-emerald-50 text-[#66BB6A]">
                  <DollarSign className="w-4 h-4" />
                </div>
              </div>
              <div
                className="text-2xl font-bold text-[#111827] mb-1"
                style={{ fontFamily: PP }}
              >
                {formatCurrency(computedKpis.revenue)}
              </div>
              <div className="flex items-center justify-between text-[11px] text-[#64748B] mb-3">
                <span className="text-[#66BB6A] font-semibold flex items-center gap-0.5">
                  <TrendingUp className="w-3 h-3" /> --
                </span>
                <span className="text-[#66BB6A] font-semibold flex items-center gap-0.5 group-hover:underline">
                  View Detail <ChevronRight className="w-3 h-3" />
                </span>
              </div>
              <div className="grid grid-cols-2 gap-1 pt-2 border-t border-[#E5E7EB] text-[11px] text-center">
                <div>
                  <div className="text-[#66BB6A] font-bold">
                    {formatCurrency(Math.round(computedKpis.revenue * 0.95))}
                  </div>
                  <div className="text-[#64748B]">Collected</div>
                </div>
                <div>
                  <div className="text-[#F59E0B] font-bold">
                    {formatCurrency(Math.round(computedKpis.revenue * 0.05))}
                  </div>
                  <div className="text-[#64748B]">Outstanding</div>
                </div>
              </div>
            </div>

            {/* Card 4: Invoices Summary */}
            <div
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  (e.currentTarget as HTMLElement).click();
                }
              }}
              role="button"
              onClick={() =>
                onOpenReport
                  ? onOpenReport("REP-005")
                  : navigate(ROUTES.BILLING)
              }
              className="bg-white rounded-2xl border border-[#E5E7EB] p-4 shadow-sm hover:shadow-md transition-shadow cursor-pointer group"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-[#64748B] group-hover:text-[#F59E0B] transition">
                  Invoices Summary
                </span>
                <div className="p-2 rounded-xl bg-amber-50 text-[#F59E0B]">
                  <CreditCard className="w-4 h-4" />
                </div>
              </div>
              <div
                className="text-2xl font-bold text-[#111827] mb-1"
                style={{ fontFamily: PP }}
              >
                {computedKpis.invoices}
              </div>
              <div className="flex items-center justify-between text-[11px] text-[#64748B] mb-3">
                <span className="text-[#0D47A1] font-semibold">
                  {computedKpis.collectionRate != 0
                    ? `${computedKpis.collectionRate}% Collection Rate`
                    : "--"}
                </span>
                <span className="text-[#0D47A1] font-semibold flex items-center gap-0.5 group-hover:underline">
                  View Detail <ChevronRight className="w-3 h-3" />
                </span>
              </div>
              <div className="grid grid-cols-3 gap-1 pt-2 border-t border-[#E5E7EB] text-[11px] text-center">
                <div>
                  <div className="text-[#66BB6A] font-bold">
                    {Math.round(computedKpis.invoices * 0.9)}
                  </div>
                  <div className="text-[#64748B]">Paid</div>
                </div>
                <div>
                  <div className="text-[#F59E0B] font-bold">
                    {Math.round(computedKpis.invoices * 0.07)}
                  </div>
                  <div className="text-[#64748B]">Pending</div>
                </div>
                <div>
                  <div className="text-[#64748B] font-bold">
                    {Math.round(computedKpis.invoices * 0.03)}
                  </div>
                  <div className="text-[#64748B]">Void</div>
                </div>
              </div>
            </div>

            {/* Card 5: Doctor Performance */}
            <div
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  (e.currentTarget as HTMLElement).click();
                }
              }}
              role="button"
              onClick={() =>
                onOpenReport
                  ? onOpenReport("REP-004")
                  : navigate(ROUTES.DOCTORS)
              }
              className="bg-white rounded-2xl border border-[#E5E7EB] p-4 shadow-sm hover:shadow-md transition-shadow cursor-pointer group"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-[#64748B] group-hover:text-[#0D47A1] transition">
                  Doctor Performance
                </span>
                <div className="p-2 rounded-xl bg-indigo-50 text-[#0D47A1]">
                  <UserCheck className="w-4 h-4" />
                </div>
              </div>
              <div
                className="text-2xl font-bold text-[#111827] mb-1"
                style={{ fontFamily: PP }}
              >
                {computedKpis.avgConsultationDuration != 0
                  ? `${computedKpis.avgConsultationDuration} min`
                  : "15 min"}
              </div>
              <div className="flex items-center justify-between text-[11px] text-[#64748B] mb-3">
                <span className="text-[#009688] font-semibold">
                  Avg Consult Time
                </span>
                <span className="text-[#0D47A1] font-semibold flex items-center gap-0.5 group-hover:underline">
                  View Detail <ChevronRight className="w-3 h-3" />
                </span>
              </div>
              <div className="grid grid-cols-2 gap-1 pt-2 border-t border-[#E5E7EB] text-[11px] text-center">
                <div>
                  <div className="text-[#0D47A1] font-bold">
                    {computedKpis.totalDoctors != 0
                      ? `${computedKpis.totalDoctors}`
                      : "0"}
                  </div>
                  <div className="text-[#64748B]">Completion</div>
                </div>
                <div>
                  <div className="text-[#66BB6A] font-bold">
                    {computedKpis.avgConsultations != 0
                      ? `${computedKpis.avgConsultations}`
                      : "0"}
                  </div>
                  <div className="text-[#64748B]">Avg Rating</div>
                </div>
              </div>
            </div>

            {/* Card 6: Collection Rate Circular */}
            <div
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  (e.currentTarget as HTMLElement).click();
                }
              }}
              role="button"
              onClick={() =>
                onOpenKpiDetail
                  ? onOpenKpiDetail("Collection Rate")
                  : navigate(ROUTES.BILLING)
              }
              className="bg-white rounded-2xl border border-[#E5E7EB] p-4 shadow-sm hover:shadow-md transition-shadow flex items-center justify-between cursor-pointer group"
            >
              <div>
                <span className="text-xs font-semibold text-[#64748B] group-hover:text-[#009688] transition">
                  Collection Rate
                </span>
                <div
                  className="text-2xl font-bold text-[#111827] mt-1"
                  style={{ fontFamily: PP }}
                >
                  {computedKpis.collectionRate != 0
                    ? `${computedKpis.collectionRate}%`
                    : "--"}
                </div>
                <p className="text-[11px] text-[#64748B] mt-1">
                  {computedKpis.totalCollected != 0
                    ? formatCurrency(Math.round(computedKpis.totalCollected))
                    : "--"}{" "}
                  collected
                </p>
                <div className="mt-2 text-[11px] font-semibold text-[#009688] flex items-center gap-0.5 group-hover:underline">
                  View Detail <ChevronRight className="w-3 h-3" />
                </div>
              </div>
              <CircularProgress
                percentage={computedKpis.collectionRate || 0}
                size={64}
                strokeWidth={7}
              />
            </div>
          </div>
        )}

        {/* Calendar Filter Toolbar for Today's Data */}
        <div className="bg-white rounded-2xl border border-[#E5E7EB] p-4 shadow-sm mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-2 overflow-x-auto">
            <Filter size={16} className="text-[#0D47A1] shrink-0" />
            <span
              className="text-xs font-bold text-[#111827] shrink-0 mr-1"
              style={{ fontFamily: PP }}
            >
              Calendar Filter:
            </span>
            <button
              onClick={() =>
                dispatch({
                  type: "SET_FILTER",
                  field: "dateRange",
                  value: "Today",
                })
              }
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                appliedFilters.dateRange === "Today"
                  ? "bg-[#0D47A1] text-white shadow-sm"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
              style={{ fontFamily: PP }}
            >
              Today Only
            </button>
            <button
              onClick={() =>
                dispatch({
                  type: "SET_FILTER",
                  field: "dateRange",
                  value: "Yesterday",
                })
              }
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                appliedFilters.dateRange === "Yesterday"
                  ? "bg-[#0D47A1] text-white shadow-sm"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
              style={{ fontFamily: PP }}
            >
              Yesterday
            </button>
            <button
              onClick={() =>
                dispatch({
                  type: "SET_FILTER",
                  field: "dateRange",
                  value: "7days",
                })
              }
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                appliedFilters.dateRange === "7days"
                  ? "bg-[#0D47A1] text-white shadow-sm"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
              style={{ fontFamily: PP }}
            >
              This Week
            </button>
            <button
              onClick={() =>
                dispatch({
                  type: "SET_FILTER",
                  field: "dateRange",
                  value: "30days",
                })
              }
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                appliedFilters.dateRange === "30days"
                  ? "bg-[#0D47A1] text-white shadow-sm"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
              style={{ fontFamily: PP }}
            >
              This Month
            </button>
          </div>

          <div className="flex items-center gap-2">
            <span
              className="text-xs text-slate-500 font-medium hidden sm:inline"
              style={{ fontFamily: RB }}
            >
              Select Date:
            </span>
            <input
              type="date"
              defaultValue={new Date().toISOString().split("T")[0]}
              onChange={(e) =>
                dispatch({
                  type: "SET_FILTER",
                  field: "dateRange",
                  value: e.target.value,
                })
              }
              className="px-3 py-1.5 bg-slate-50 border border-[#E5E7EB] rounded-xl text-xs font-semibold text-slate-700 outline-none focus:border-[#0D47A1]"
              style={{ fontFamily: RB }}
            />
          </div>
        </div>
        {/* Filter & Search Bar */}
        <div className="bg-white rounded-2xl border border-[#E5E7EB] p-4 shadow-sm mb-6">
          <div
            className="flex items-center gap-2 mb-3 text-xs font-semibold text-[#111827]"
            style={{ fontFamily: PP }}
          >
            <Filter className="w-4 h-4 text-[#009688]" />
            <span>Filter Operational Reports</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            <div>
              <span className="block text-[11px] font-medium text-[#64748B] mb-1">
                Date Range
                <select
                  aria-label="Select option"
                  value={state.dateRangeFilter}
                  onChange={(e) =>
                    dispatch({
                      type: "SET_FILTER",
                      field: "dateRangeFilter",
                      value: e.target.value,
                    })
                  }
                  className="w-full bg-[#F1F5F9] border border-[#E5E7EB] rounded-xl text-xs px-2.5 py-2 text-[#111827] focus:outline-none focus:ring-2 focus:ring-[#0D47A1]"
                >
                  <option value="Today">Today</option>
                  <option value="Yesterday">Yesterday</option>
                  <option value="7days">This Week (7 Days)</option>
                  <option value="30days">This Month (30 Days)</option>
                </select>
              </span>
            </div>
            <div>
              <span className="block text-[11px] font-medium text-[#64748B] mb-1">
                Department
                <select
                  aria-label="Select option"
                  value={state.deptFilter}
                  onChange={(e) =>
                    dispatch({
                      type: "SET_FILTER",
                      field: "deptFilter",
                      value: e.target.value,
                    })
                  }
                  className="w-full bg-[#F1F5F9] border border-[#E5E7EB] rounded-xl text-xs px-2.5 py-2 text-[#111827] focus:outline-none focus:ring-2 focus:ring-[#0D47A1]"
                >
                  {deptOptions.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
              </span>
            </div>
            <div>
              <span className="block text-[11px] font-medium text-[#64748B] mb-1">
                Doctor
                <select
                  aria-label="Select option"
                  value={state.doctorFilter}
                  onChange={(e) =>
                    dispatch({
                      type: "SET_FILTER",
                      field: "doctorFilter",
                      value: e.target.value,
                    })
                  }
                  className="w-full bg-[#F1F5F9] border border-[#E5E7EB] rounded-xl text-xs px-2.5 py-2 text-[#111827] focus:outline-none focus:ring-2 focus:ring-[#0D47A1]"
                >
                  {doctorOptions.map((doc) => (
                    <option key={doc} value={doc}>
                      {doc}
                    </option>
                  ))}
                </select>
              </span>
            </div>
            <div>
              <span className="block text-[11px] font-medium text-[#64748B] mb-1">
                Visit Type
                <select
                  aria-label="Select option"
                  value={state.visitTypeFilter}
                  onChange={(e) =>
                    dispatch({
                      type: "SET_FILTER",
                      field: "visitTypeFilter",
                      value: e.target.value,
                    })
                  }
                  className="w-full bg-[#F1F5F9] border border-[#E5E7EB] rounded-xl text-xs px-2.5 py-2 text-[#111827] focus:outline-none focus:ring-2 focus:ring-[#0D47A1]"
                >
                  <option value="All Visit Types">All Visit Types</option>
                  <option value="New">New</option>
                  <option value="Follow-up">Follow-up</option>
                </select>
              </span>
            </div>
            <div>
              <span className="block text-[11px] font-medium text-[#64748B] mb-1">
                Appointment Status
                <select
                  aria-label="Select option"
                  value={state.statusFilter}
                  onChange={(e) =>
                    dispatch({
                      type: "SET_FILTER",
                      field: "statusFilter",
                      value: e.target.value,
                    })
                  }
                  className="w-full bg-[#F1F5F9] border border-[#E5E7EB] rounded-xl text-xs px-2.5 py-2 text-[#111827] focus:outline-none focus:ring-2 focus:ring-[#0D47A1]"
                >
                  <option value="All Statuses">All Statuses</option>
                  <option value="Completed">Completed</option>
                  <option value="Pending Audit">Pending Audit</option>
                  <option value="Archived">Archived</option>
                </select>
              </span>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mt-4 pt-3 border-t border-[#E5E7EB]">
            <div className="relative w-full sm:w-72 md:w-80">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#64748B]" />
              <input
                aria-label="Input field"
                type="text"
                value={searchQuery}
                onChange={(e) =>
                  dispatch({ type: "SET_SEARCH", payload: e.target.value })
                }
                placeholder="Search reports, patients, doctors, invoices..."
                className="w-full pl-10 pr-16 py-2 bg-[#F1F5F9] border border-[#E5E7EB] rounded-xl text-xs text-[#111827] placeholder-[#64748B] focus:outline-none focus:ring-2 focus:ring-[#0D47A1]"
              />
              {state.searchQuery && (
                <button
                  onClick={() => dispatch({ type: "SET_SEARCH", payload: "" })}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[#64748B] hover:text-[#111827]"
                >
                  Clear
                </button>
              )}
            </div>
            <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
              <button
                onClick={handleResetFilters}
                className="px-3.5 py-1.5 rounded-xl text-xs font-medium text-[#64748B] hover:text-[#111827] hover:bg-slate-100 transition"
              >
                Reset Filters
              </button>
              <button
                onClick={handleApplyFilters}
                className="px-4 py-1.5 rounded-xl text-xs font-semibold text-white bg-[#009688] hover:bg-teal-700 transition shadow-sm cursor-pointer"
                style={{ fontFamily: PP }}
              >
                Apply Filters
              </button>
            </div>
          </div>
        </div>

        {/* Filter Summary Chips */}
        {(appliedFilters.dateRange !== "Today" ||
          appliedFilters.dept !== "All Departments" ||
          appliedFilters.doctor !== "All Doctors" ||
          appliedFilters.visitType !== "All Visit Types" ||
          appliedFilters.status !== "All Statuses" ||
          state.searchQuery) && (
          <div className="bg-white rounded-2xl border border-[#E5E7EB] p-3.5 shadow-sm mb-6 flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span
                className="font-semibold text-[#64748B] uppercase tracking-wider text-[10px] mr-1"
                style={{ fontFamily: PP }}
              >
                Active Filters:
              </span>
              {appliedFilters.dateRange !== "Today" && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-blue-50 text-[#0D47A1] border border-blue-200 font-medium">
                  Date: {appliedFilters.dateRange}
                  <button
                    aria-label="Filter"
                    onClick={() => {
                      dispatch({
                        type: "SET_FILTER",
                        field: "dateRangeFilter",
                        value: "Today",
                      });
                      dispatch({
                        type: "LOAD_SUCCESS",
                        payload: { ...appliedFilters, dateRange: "Today" },
                      });
                    }}
                    className="hover:text-red-500 font-bold ml-1 cursor-pointer"
                  >
                    ×
                  </button>
                </span>
              )}
              {appliedFilters.dept !== "All Departments" && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-teal-50 text-[#009688] border border-teal-200 font-medium">
                  Dept: {appliedFilters.dept}
                  <button
                    aria-label="Filter"
                    onClick={() => {
                      dispatch({
                        type: "SET_FILTER",
                        field: "deptFilter",
                        value: "All Departments",
                      });
                      dispatch({
                        type: "LOAD_SUCCESS",
                        payload: { ...appliedFilters, dept: "All Departments" },
                      });
                    }}
                    className="hover:text-red-500 font-bold ml-1 cursor-pointer"
                  >
                    ×
                  </button>
                </span>
              )}
              {appliedFilters.doctor !== "All Doctors" && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-50 text-[#66BB6A] border border-emerald-200 font-medium">
                  Doctor: {appliedFilters.doctor}
                  <button
                    aria-label="Filter"
                    onClick={() => {
                      dispatch({
                        type: "SET_FILTER",
                        field: "doctorFilter",
                        value: "All Doctors",
                      });
                      dispatch({
                        type: "LOAD_SUCCESS",
                        payload: { ...appliedFilters, doctor: "All Doctors" },
                      });
                    }}
                    className="hover:text-red-500 font-bold ml-1 cursor-pointer"
                  >
                    ×
                  </button>
                </span>
              )}
              {appliedFilters.visitType !== "All Visit Types" && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-50 text-[#F59E0B] border border-amber-200 font-medium">
                  Visit: {appliedFilters.visitType}
                  <button
                    aria-label="Filter"
                    onClick={() => {
                      dispatch({
                        type: "SET_FILTER",
                        field: "visitTypeFilter",
                        value: "All Visit Types",
                      });
                      dispatch({
                        type: "LOAD_SUCCESS",
                        payload: {
                          ...appliedFilters,
                          visitType: "All Visit Types",
                        },
                      });
                    }}
                    className="hover:text-red-500 font-bold ml-1 cursor-pointer"
                  >
                    ×
                  </button>
                </span>
              )}
              {appliedFilters.status !== "All Statuses" && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-indigo-50 text-[#0D47A1] border border-indigo-200 font-medium">
                  Status: {appliedFilters.status}
                  <button
                    aria-label="Filter"
                    onClick={() => {
                      dispatch({
                        type: "SET_FILTER",
                        field: "statusFilter",
                        value: "All Statuses",
                      });
                      dispatch({
                        type: "LOAD_SUCCESS",
                        payload: { ...appliedFilters, status: "All Statuses" },
                      });
                    }}
                    className="hover:text-red-500 font-bold ml-1 cursor-pointer"
                  >
                    ×
                  </button>
                </span>
              )}
              {state.searchQuery && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-100 text-[#111827] border border-slate-300 font-medium">
                  Search: "{state.searchQuery}"
                  <button
                    aria-label="Action"
                    onClick={() =>
                      dispatch({ type: "SET_SEARCH", payload: "" })
                    }
                    className="hover:text-red-500 font-bold ml-1 cursor-pointer"
                  >
                    ×
                  </button>
                </span>
              )}
            </div>
            <button
              onClick={handleResetFilters}
              className="text-xs font-semibold text-[#EF4444] hover:underline cursor-pointer"
              style={{ fontFamily: PP }}
            >
              Clear All Filters
            </button>
          </div>
        )}
        {/* State Banners for Demo Testing */}
        {/*   <div className="flex items-center justify-between mb-4 bg-white p-2.5 rounded-xl border border-[#E5E7EB] text-xs">
          <div className="flex items-center gap-3">
            <span className="font-semibold text-[#111827]">
              Dashboard State Controls:
            </span>
            <button
              onClick={() => {
                if (isLoading) {
                  dispatch({ type: "LOAD_SUCCESS", payload: appliedFilters });
                } else {
                  dispatch({ type: "LOAD_START" });
                }
                dispatch({ type: "SET_ERROR", payload: false });
              }}
              className={`px-2.5 py-1 rounded-lg border text-xs ${state.isLoading ? "bg-amber-50 border-amber-300 text-[#F59E0B]" : "bg-slate-50 border-[#E5E7EB] text-[#64748B]"}`}
            >
              Toggle Loading Skeleton
            </button>
            <button
              onClick={() => {
                dispatch({ type: "SET_ERROR", payload: !hasError });
              }}
              className={`px-2.5 py-1 rounded-lg border text-xs ${state.hasError ? "bg-red-50 border-red-300 text-[#EF4444]" : "bg-slate-50 border-[#E5E7EB] text-[#64748B]"}`}
            >
              Toggle Error State
            </button>
          </div>
          <span className="text-[11px] text-[#64748B]">
            Click toggles to test UI loading and error handlers
          </span>
        </div> */}

        {/* ERROR STATE DISPLAY */}
        {state.hasError && (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-6 mb-6 text-center">
            <AlertCircle className="w-10 h-10 text-[#EF4444] mx-auto mb-2" />
            <h3
              className="text-base font-bold text-[#111827]"
              style={{ fontFamily: PP }}
            >
              Unable to Load Reports Data
            </h3>
            <p className="text-xs text-[#64748B] mt-1 max-w-md mx-auto">
              A temporary network timeout occurred while fetching analytics.
              Please retry or contact system admin.
            </p>
            <button
              onClick={() => dispatch({ type: "SET_ERROR", payload: false })}
              className="mt-4 px-4 py-2 bg-[#EF4444] text-white rounded-xl text-xs font-semibold hover:bg-red-600 transition"
            >
              Retry Loading
            </button>
          </div>
        )}

        {/* LOADING SKELETON STATE */}
        {state.isLoading && (
          <div className="space-y-6 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div
                  key={i}
                  className="bg-white rounded-2xl border border-[#E5E7EB] p-4 h-32 animate-pulse flex flex-col justify-between"
                >
                  <div className="h-4 bg-slate-200 rounded w-1/2"></div>
                  <div className="h-6 bg-slate-200 rounded w-3/4"></div>
                  <div className="h-3 bg-slate-200 rounded w-1/3"></div>
                </div>
              ))}
            </div>
            <div className="bg-white rounded-2xl border border-[#E5E7EB] p-6 h-64 animate-pulse"></div>
          </div>
        )}

        {!state.isLoading && !state.hasError && (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            <div className="lg:col-span-4 space-y-6">
              {/* AVAILABLE REPORTS (PHASE 1 GRID) */}
              <div className="bg-white rounded-2xl border border-[#E5E7EB] p-6 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2
                      className="text-lg font-bold text-[#111827]"
                      style={{ fontFamily: PP }}
                    >
                      Reports
                    </h2>
                    <p className="text-xs text-[#64748B]">
                      Select any verified report to view details, print, or
                      download.
                    </p>
                  </div>
                  <span className="text-xs font-semibold text-[#0D47A1] bg-blue-50 border border-blue-200 px-3 py-1 rounded-full">
                    {filteredReports.length} Available
                  </span>
                </div>
                {filteredReports.length === 0 ? (
                  <div className="py-12 text-center border-2 border-dashed border-[#E5E7EB] rounded-2xl">
                    <FileText className="w-10 h-10 text-[#64748B] mx-auto mb-2" />
                    <h4 className="text-sm font-bold text-[#111827]">
                      No Reports Found
                    </h4>
                    <p className="text-xs text-[#64748B] mt-1">
                      No report matches your current search criteria.
                    </p>
                    <button
                      onClick={handleResetFilters}
                      className="mt-3 px-3.5 py-1.5 bg-[#0D47A1] text-white rounded-xl text-xs font-medium"
                    >
                      Reset Filters
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                    {filteredReports.map((report) => {
                      const IconComp = report.icon;
                      return (
                        <div
                          key={report.id}
                          className="border border-[#E5E7EB] rounded-2xl p-4 hover:border-[#0D47A1] hover:shadow-md transition-colors flex flex-col justify-between group bg-white"
                        >
                          <div>
                            <div className="flex items-center justify-between mb-3">
                              <div className={`p-2.5 rounded-xl ${report.bg}`}>
                                <IconComp
                                  className="w-5 h-5"
                                  style={{ color: report.color }}
                                />
                              </div>
                              <span className="text-[10px] font-semibold text-[#64748B] bg-slate-100 px-2 py-0.5 rounded-full">
                                {report.category}
                              </span>
                            </div>
                            <h3
                              className="text-sm font-bold text-[#111827] group-hover:text-[#0D47A1] transition"
                              style={{ fontFamily: PP }}
                            >
                              {report.name}
                            </h3>
                            <p className="text-xs text-[#64748B] mt-1.5 leading-relaxed line-clamp-2">
                              {report.description}
                            </p>
                          </div>
                          <div className="mt-4 pt-3 border-t border-[#E5E7EB] flex items-center justify-between">
                            <span className="text-[11px] text-[#64748B]">
                              Views: {report.views}
                            </span>
                            <button
                              onClick={() => {
                                if (onOpenReport) {
                                  onOpenReport(report.id);
                                } else {
                                  setSelectedReportModal(report);
                                }
                              }}
                              className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#0D47A1] hover:text-blue-900 transition"
                            >
                              <span>Open Report</span>
                              <ChevronRight className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* REPORT ANALYTICS (2-COLUMN) */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* LEFT: Most Viewed Reports Bar Chart */}
                <div className="bg-white rounded-2xl border border-[#E5E7EB] p-5 shadow-sm">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3
                        className="text-sm font-bold text-[#111827]"
                        style={{ fontFamily: PP }}
                      >
                        Most Viewed Reports
                      </h3>
                      <p className="text-[11px] text-[#64748B]">
                        Total view frequency by hospital staff
                      </p>
                    </div>
                    <BarChart2 className="w-4 h-4 text-[#0D47A1]" />
                  </div>
                  <div className="h-56">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={dynamicMostViewedReports}
                        margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                        <XAxis
                          dataKey="name"
                          tick={{ fontSize: 10, fill: "#64748B" }}
                        />
                        <YAxis tick={{ fontSize: 10, fill: "#64748B" }} />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "#FFFFFF",
                            borderRadius: "12px",
                            borderColor: "#E5E7EB",
                            fontSize: "11px",
                          }}
                          formatter={(val: unknown) => [
                            `${val} views`,
                            "Total Views",
                          ]}
                        />
                        <Bar
                          dataKey="views"
                          fill="#0D47A1"
                          radius={[6, 6, 0, 0]}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* RIGHT: Report Distribution Donut Chart */}
                <div className="bg-white rounded-2xl border border-[#E5E7EB] p-5 shadow-sm">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3
                        className="text-sm font-bold text-[#111827]"
                        style={{ fontFamily: PP }}
                      >
                        Report Category Share
                      </h3>
                      <p className="text-[11px] text-[#64748B]">
                        Percentage distribution across operational modules
                      </p>
                    </div>
                    <PieChartIcon className="w-4 h-4 text-[#009688]" />
                  </div>
                  <div className="h-56">
                    <ResponsiveContainer width="100%" height="100%">
                      <RechartsPie>
                        <Pie
                          data={dynamicReportDistribution}
                          cx="50%"
                          cy="50%"
                          innerRadius={45}
                          outerRadius={75}
                          paddingAngle={3}
                          dataKey="value"
                        >
                          {dynamicReportDistribution.map((entry) => (
                            <Cell key={entry.category} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "#FFFFFF",
                            borderRadius: "12px",
                            borderColor: "#E5E7EB",
                            fontSize: "11px",
                          }}
                          formatter={(val: unknown) => [`${val}%`, "Share"]}
                        />
                        <Legend
                          layout="horizontal"
                          verticalAlign="bottom"
                          align="center"
                          wrapperStyle={{
                            fontSize: "10px",
                            paddingTop: "10px",
                          }}
                        />
                      </RechartsPie>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>

              {/* HOSPITAL PERFORMANCE AREA CHART */}
              <div className="bg-white rounded-2xl border border-[#E5E7EB] p-6 shadow-sm">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                  <div>
                    <h3
                      className="text-base font-bold text-[#111827]"
                      style={{ fontFamily: PP }}
                    >
                      Hospital Operational Trend
                    </h3>
                    <p className="text-xs text-[#64748B]">
                      Comparative volume of appointments, registrations, and
                      revenue
                    </p>
                  </div>
                  <div className="flex items-center gap-1 bg-[#F1F5F9] p-1 rounded-xl border border-[#E5E7EB] text-xs">
                    <button
                      onClick={() =>
                        dispatch({ type: "SET_TREND_DAYS", payload: "7" })
                      }
                      className={`px-3 py-1 rounded-lg font-medium transition ${state.trendDays === "7" ? "bg-white text-[#0D47A1] shadow-sm" : "text-[#64748B]"}`}
                    >
                      7 Days
                    </button>
                    <button
                      onClick={() =>
                        dispatch({ type: "SET_TREND_DAYS", payload: "30" })
                      }
                      className={`px-3 py-1 rounded-lg font-medium transition ${state.trendDays === "30" ? "bg-white text-[#0D47A1] shadow-sm" : "text-[#64748B]"}`}
                    >
                      30 Days
                    </button>
                    <button
                      onClick={() =>
                        dispatch({ type: "SET_TREND_DAYS", payload: "90" })
                      }
                      className={`px-3 py-1 rounded-lg font-medium transition ${state.trendDays === "90" ? "bg-white text-[#0D47A1] shadow-sm" : "text-[#64748B]"}`}
                    >
                      90 Days
                    </button>
                  </div>
                </div>
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart
                      data={dynamicHospitalPerformanceTrend}
                      margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
                    >
                      <defs>
                        <linearGradient
                          id="colorApp"
                          x1="0"
                          y1="0"
                          x2="0"
                          y2="1"
                        >
                          <stop
                            offset="5%"
                            stopColor="#0D47A1"
                            stopOpacity={0.4}
                          />
                          <stop
                            offset="95%"
                            stopColor="#0D47A1"
                            stopOpacity={0}
                          />
                        </linearGradient>
                        <linearGradient
                          id="colorRev"
                          x1="0"
                          y1="0"
                          x2="0"
                          y2="1"
                        >
                          <stop
                            offset="5%"
                            stopColor="#009688"
                            stopOpacity={0.4}
                          />
                          <stop
                            offset="95%"
                            stopColor="#009688"
                            stopOpacity={0}
                          />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                      <XAxis
                        dataKey="date"
                        tick={{ fontSize: 11, fill: "#64748B" }}
                      />
                      <YAxis tick={{ fontSize: 11, fill: "#64748B" }} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "#FFFFFF",
                          borderRadius: "12px",
                          borderColor: "#E5E7EB",
                          fontSize: "11px",
                        }}
                      />
                      <Legend
                        verticalAlign="top"
                        height={36}
                        wrapperStyle={{ fontSize: "11px" }}
                      />
                      <Area
                        type="monotone"
                        dataKey="appointments"
                        name="Appointments"
                        stroke="#0D47A1"
                        fillOpacity={1}
                        fill="url(#colorApp)"
                      />
                      <Area
                        type="monotone"
                        dataKey="registrations"
                        name="Registrations"
                        stroke="#4DB6AC"
                        fillOpacity={0.2}
                        fill="#4DB6AC"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* DEPARTMENT PERFORMANCE & REVENUE VS COLLECTION */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white rounded-2xl border border-[#E5E7EB] p-5 shadow-sm">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3
                        className="text-sm font-bold text-[#111827]"
                        style={{ fontFamily: PP }}
                      >
                        Department Consultation Volume
                      </h3>
                      <p className="text-[11px] text-[#64748B]">
                        Total completed appointments per specialty
                      </p>
                    </div>
                    <Building2 className="w-4 h-4 text-[#009688]" />
                  </div>
                  <div className="h-60">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        layout="vertical"
                        data={dynamicDeptPerformance}
                        margin={{ top: 5, right: 10, left: 20, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                        <XAxis
                          type="number"
                          tick={{ fontSize: 10, fill: "#64748B" }}
                        />
                        <YAxis
                          type="category"
                          dataKey="department"
                          tick={{ fontSize: 10, fill: "#111827" }}
                          width={80}
                        />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "#FFFFFF",
                            borderRadius: "12px",
                            borderColor: "#E5E7EB",
                            fontSize: "11px",
                          }}
                        />
                        <Bar
                          dataKey="appointments"
                          fill="#009688"
                          radius={[0, 6, 6, 0]}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
                <div className="bg-white rounded-2xl border border-[#E5E7EB] p-5 shadow-sm">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3
                        className="text-sm font-bold text-[#111827]"
                        style={{ fontFamily: PP }}
                      >
                        Revenue vs Collection
                      </h3>
                      <p className="text-[11px] text-[#64748B]">
                        Monthly billed vs collected revenue comparison
                      </p>
                    </div>
                    <DollarSign className="w-4 h-4 text-[#66BB6A]" />
                  </div>
                  <div className="h-60">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={dynamicRevenueVsCollection}
                        margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                        <XAxis
                          dataKey="month"
                          tick={{ fontSize: 10, fill: "#64748B" }}
                        />
                        <YAxis tick={{ fontSize: 10, fill: "#64748B" }} />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "#FFFFFF",
                            borderRadius: "12px",
                            borderColor: "#E5E7EB",
                            fontSize: "11px",
                          }}
                        />
                        <Legend
                          verticalAlign="top"
                          height={30}
                          wrapperStyle={{ fontSize: "10px" }}
                        />
                        <Bar
                          dataKey="revenue"
                          name="Billed"
                          fill="#0D47A1"
                          radius={[4, 4, 0, 0]}
                        />
                        <Bar
                          dataKey="collected"
                          name="Collected"
                          fill="#66BB6A"
                          radius={[4, 4, 0, 0]}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>

              {/* DOCTOR PERFORMANCE TABLE */}
              <div className="bg-white rounded-2xl border border-[#E5E7EB] shadow-sm overflow-hidden">
                <div className="p-5 border-b border-[#E5E7EB] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div>
                    <h3
                      className="text-base font-bold text-[#111827]"
                      style={{ fontFamily: PP }}
                    >
                      Doctor Performance Summary
                    </h3>
                    <p className="text-xs text-[#64748B]">
                      Clinical volume, completion metrics, revenue, and ratings
                    </p>
                  </div>
                  <button
                    onClick={() =>
                      alert("Exporting Doctor Performance Table (CSV)...")
                    }
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 border border-[#E5E7EB] text-xs font-semibold text-[#111827] rounded-xl hover:bg-slate-100 transition"
                  >
                    <Download className="w-3.5 h-3.5 text-[#0D47A1]" />
                    <span>Export Table</span>
                  </button>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-[#F1F5F9] text-[11px] font-bold text-[#64748B] uppercase tracking-wider border-b border-[#E5E7EB]">
                        <th
                          tabIndex={0}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" || e.key === " ") {
                              e.preventDefault();
                              (e.currentTarget as HTMLElement).click();
                            }
                          }}
                          className="py-3.5 px-4 cursor-pointer hover:text-[#0D47A1]"
                          onClick={() => handleSort("doctorName")}
                        >
                          Doctor{" "}
                          {sortField === "doctorName" &&
                            (sortOrder === "asc" ? "↑" : "↓")}
                        </th>
                        <th className="py-3.5 px-4">Department</th>
                        <th
                          tabIndex={0}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" || e.key === " ") {
                              e.preventDefault();
                              (e.currentTarget as HTMLElement).click();
                            }
                          }}
                          className="py-3.5 px-4 text-center cursor-pointer hover:text-[#0D47A1]"
                          onClick={() => handleSort("appointments")}
                        >
                          Appointments{" "}
                          {sortField === "appointments" &&
                            (sortOrder === "asc" ? "↑" : "↓")}
                        </th>
                        <th className="py-3.5 px-4 text-center">Completed</th>
                        <th className="py-3.5 px-4 text-center">Cancelled</th>
                        <th
                          tabIndex={0}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" || e.key === " ") {
                              e.preventDefault();
                              (e.currentTarget as HTMLElement).click();
                            }
                          }}
                          className="py-3.5 px-4 text-right cursor-pointer hover:text-[#0D47A1]"
                          onClick={() => handleSort("revenue")}
                        >
                          Revenue{" "}
                          {sortField === "revenue" &&
                            (sortOrder === "asc" ? "↑" : "↓")}
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E5E7EB] text-xs">
                      {sortedDoctors.length === 0 ? (
                        <tr>
                          <td
                            colSpan={6}
                            className="py-12 text-center bg-white"
                          >
                            <div className="flex flex-col items-center justify-center">
                              <FileText className="w-10 h-10 text-[#64748B] mb-2" />
                              <h4
                                className="text-sm font-bold text-[#111827]"
                                style={{ fontFamily: PP }}
                              >
                                No Reports Found
                              </h4>
                              <p className="text-xs text-[#64748B] mt-1 max-w-xs">
                                No report data matches the selected filters.
                              </p>
                              <button
                                onClick={handleResetFilters}
                                className="mt-3 px-3.5 py-1.5 bg-[#0D47A1] text-white rounded-xl text-xs font-semibold hover:bg-blue-900 transition shadow-sm"
                                style={{ fontFamily: PP }}
                              >
                                Reset Filters
                              </button>
                            </div>
                          </td>
                        </tr>
                      ) : (
                        sortedDoctors.map((doc) => (
                          <tr
                            key={doc.id}
                            className="hover:bg-slate-50 transition-colors"
                          >
                            <td className="py-3.5 px-4">
                              <div className="flex items-center gap-3">
                                {doc.avatar ? (
                                  <img
                                    src={doc.avatar}
                                    alt={doc.doctorName}
                                    className="w-8 h-8 rounded-full object-cover border border-[#E5E7EB]"
                                  />
                                ) : (
                                  <div className="w-8 h-8 rounded-full bg-[#E0F2F1] border border-[#E5E7EB] flex items-center justify-center text-[#009688] font-bold text-xs">
                                    {doc.doctorName?.charAt(0) || "?"}
                                  </div>
                                )}
                                <div>
                                  <div className="font-bold text-[#111827]">
                                    {doc.doctorName}
                                  </div>
                                  <div className="text-[10px] text-[#64748B]">
                                    {doc.id}
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td className="py-3.5 px-4 font-medium text-[#111827]">
                              {doc.department}
                            </td>
                            <td className="py-3.5 px-4 text-center font-bold text-[#0D47A1]">
                              {doc.appointments}
                            </td>
                            <td className="py-3.5 px-4 text-center font-semibold text-[#66BB6A]">
                              {doc.completed}
                            </td>
                            <td className="py-3.5 px-4 text-center text-[#EF4444] font-medium">
                              {doc.cancelled}
                            </td>
                            <td className="py-3.5 px-4 text-right font-bold text-[#111827]">
                              {formatCurrency(doc.revenue)}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
                <div className="p-4 bg-[#F1F5F9] border-t border-[#E5E7EB] flex items-center justify-between text-xs text-[#64748B]">
                  <span>Showing 1 to 5 of 5 doctor records</span>
                  <div className="flex items-center gap-2">
                    <button
                      aria-label="Previous"
                      disabled
                      className="p-1 rounded-lg border border-[#E5E7EB] opacity-50 cursor-not-allowed"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <span className="font-semibold text-[#111827]">
                      Page 1 of 1
                    </span>
                    <button
                      aria-label="Next"
                      disabled
                      className="p-1 rounded-lg border border-[#E5E7EB] opacity-50 cursor-not-allowed"
                    >
                      <ChevronRightIcon className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* FOOTER */}
        <div className="mt-8 pt-4 border-t border-[#E5E7EB] flex flex-col sm:flex-row items-center justify-between text-xs text-[#64748B] gap-2">
          <div>
            Showing{" "}
            <strong className="text-[#111827]">
              {filteredReports.length} Available Reports
            </strong>
          </div>
          <div>Hospital Management System • Reports Module v1.0</div>
          <div>
            Last Refreshed:{" "}
            <strong className="text-[#111827]">
              {new Date().toLocaleString()}
            </strong>
          </div>
        </div>
      </div>

      {/* REPORT MODAL PREVIEW */}
      {selectedReportModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-[#E5E7EB] max-w-xl w-full p-6 shadow-2xl relative transition-opacity duration-200">
            <button
              aria-label="Action"
              onClick={() => setSelectedReportModal(null)}
              className="absolute top-4 right-4 p-1 rounded-lg text-[#64748B] hover:text-[#111827] hover:bg-slate-100 transition"
            >
              ✕
            </button>
            <div className="flex items-center gap-3 mb-4">
              <div className={`p-3 rounded-xl ${selectedReportModal.bg}`}>
                {React.createElement(selectedReportModal.icon, {
                  className: "w-6 h-6",
                  style: { color: selectedReportModal.color },
                })}
              </div>
              <div>
                <h3
                  className="text-lg font-bold text-[#111827]"
                  style={{ fontFamily: PP }}
                >
                  {selectedReportModal.name}
                </h3>
                <span className="text-xs font-semibold text-[#009688] bg-teal-50 px-2.5 py-0.5 rounded-full border border-teal-200">
                  {selectedReportModal.category} Report
                </span>
              </div>
            </div>
            <p className="text-xs text-[#64748B] leading-relaxed mb-4">
              {selectedReportModal.description}
            </p>
            <div className="bg-[#F1F5F9] rounded-xl p-3 border border-[#E5E7EB] text-xs space-y-2 mb-6">
              <div className="flex justify-between">
                <span className="text-[#64748B]">Last Generated:</span>
                <span className="font-semibold text-[#111827]">
                  {selectedReportModal.lastGenerated}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#64748B]">Supported Formats:</span>
                <span className="font-semibold text-[#0D47A1]">
                  {selectedReportModal.format}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#64748B]">Historical Views:</span>
                <span className="font-semibold text-[#111827]">
                  {selectedReportModal.views} Total Views
                </span>
              </div>
            </div>
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#E5E7EB]">
              <button
                onClick={() => setSelectedReportModal(null)}
                className="px-4 py-2 bg-slate-100 text-[#111827] rounded-xl text-xs font-semibold hover:bg-slate-200 transition"
              >
                Close
              </button>
              <button
                onClick={() => {
                  alert(
                    `Downloading ${selectedReportModal.name} in PDF format...`,
                  );
                  setSelectedReportModal(null);
                }}
                className="px-4 py-2 bg-[#0D47A1] text-white rounded-xl text-xs font-semibold hover:bg-blue-900 transition flex items-center gap-1.5"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download Report</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
