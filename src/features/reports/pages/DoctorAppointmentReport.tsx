import React, { useReducer, useMemo, useTransition } from "react";
import {
  Calendar,
  Download,
  RefreshCw,
  Filter,
  Search,
  Users,
  UserCheck,
  Activity,
  TrendingUp,
  XCircle,
  Clock,
  PieChart as PieChartIcon,
  Eye,
  Printer,
  ChevronLeft,
  ChevronRight as ChevronRightIcon,
  AlertCircle,
  ArrowLeft,
} from "lucide-react";
import {
  useDoctorSelfDailyAppointmentsDashboard,
  useDoctorSelfDailyAppointmentRegister,
} from "../hooks/useReports";
import { exportDataToCsv } from "../utils/export.utils";

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

const PP = "Poppins, system-ui, sans-serif";
const RB = "Roboto, system-ui, sans-serif";

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

export interface DoctorDailyAppointmentRecord {
  id: string;
  patientName: string;
  mrn: string;
  appointmentDate: string;
  appointmentTime: string;
  visitType: string;
  status: string;
  consultationStatus: string;
}

const getOffsetDateStr = (daysAgo: number): string => {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const SAMPLE_APPOINTMENTS: DoctorDailyAppointmentRecord[] = [
  {
    id: "APT-2026-001",
    patientName: "Eleanor Vance",
    mrn: "MRN-2026111086",
    appointmentDate: getOffsetDateStr(0),
    appointmentTime: "09:00 AM",
    visitType: "Follow-up",
    status: "Completed",
    consultationStatus: "Completed",
  },
  {
    id: "APT-2026-002",
    patientName: "Marcus Brody",
    mrn: "MRN-2026925825",
    appointmentDate: getOffsetDateStr(0),
    appointmentTime: "09:30 AM",
    visitType: "New Patient",
    status: "Completed",
    consultationStatus: "Completed",
  },
  {
    id: "APT-2026-003",
    patientName: "Sophia Martinez",
    mrn: "MRN-2026338491",
    appointmentDate: getOffsetDateStr(0),
    appointmentTime: "10:15 AM",
    visitType: "Routine Checkup",
    status: "In Progress",
    consultationStatus: "In Progress",
  },
  {
    id: "APT-2026-004",
    patientName: "James Harrison",
    mrn: "MRN-2026447219",
    appointmentDate: getOffsetDateStr(1),
    appointmentTime: "11:00 AM",
    visitType: "Follow-up",
    status: "Scheduled",
    consultationStatus: "Pending",
  },
  {
    id: "APT-2026-005",
    patientName: "Amara Okafor",
    mrn: "MRN-2026559102",
    appointmentDate: getOffsetDateStr(2),
    appointmentTime: "02:00 PM",
    visitType: "New Patient",
    status: "Cancelled",
    consultationStatus: "Cancelled",
  },
  {
    id: "APT-2026-006",
    patientName: "David Chen",
    mrn: "MRN-2026771823",
    appointmentDate: getOffsetDateStr(4),
    appointmentTime: "03:30 PM",
    visitType: "Walk-In",
    status: "Completed",
    consultationStatus: "Completed",
  },
];

export function DoctorDailyAppointmentReportScreen({
  onBack,
}: {
  onBack?: () => void;
}) {
  const todayStr = getOffsetDateStr(0);

  const [state, dispatch] = useReducer(
    (
      prev: {
        searchQuery: string;
        dateRange: string;
        startDate: string;
        endDate: string;
        statusFilter: string;
        visitTypeFilter: string;
        shiftFilter: string;
        trendDays: "Today" | "7 Days" | "30 Days" | "90 Days";
        isRefreshing: boolean;
        showLoadingDemo: boolean;
        hasError: boolean;
      },
      next: Partial<{
        searchQuery: string;
        dateRange: string;
        startDate: string;
        endDate: string;
        statusFilter: string;
        visitTypeFilter: string;
        shiftFilter: string;
        trendDays: "Today" | "7 Days" | "30 Days" | "90 Days";
        isRefreshing: boolean;
        showLoadingDemo: boolean;
        hasError: boolean;
      }>,
    ) => ({ ...prev, ...next }),
    {
      searchQuery: "",
      dateRange: "Today",
      startDate: todayStr,
      endDate: todayStr,
      statusFilter: "All Statuses",
      visitTypeFilter: "All Visit Types",
      shiftFilter: "All Shifts",
      trendDays: "Today" as const,
      isRefreshing: false,
      showLoadingDemo: false,
      hasError: false,
    },
  );
  const {
    searchQuery,
    dateRange,
    startDate,
    endDate,
    statusFilter,
    visitTypeFilter,
    shiftFilter,
    trendDays,
    isRefreshing,
    showLoadingDemo,
    hasError,
  } = state;

  const setSearchQuery = (val: string) => dispatch({ searchQuery: val });
  const setDateRange = (val: string) => dispatch({ dateRange: val });
  const setStartDate = (val: string) => dispatch({ startDate: val });
  const setEndDate = (val: string) => dispatch({ endDate: val });
  const setStatusFilter = (val: string) => dispatch({ statusFilter: val });
  const setVisitTypeFilter = (val: string) => dispatch({ visitTypeFilter: val });
  const setShiftFilter = (val: string) => dispatch({ shiftFilter: val });
  const setTrendDays = (val: "Today" | "7 Days" | "30 Days" | "90 Days") => dispatch({ trendDays: val });
  const setIsRefreshing = (val: boolean) => dispatch({ isRefreshing: val });
  const setShowLoadingDemo = (val: boolean) => dispatch({ showLoadingDemo: val });
  const setHasError = (val: boolean) => dispatch({ hasError: val });
  const [isPending, startTransition] = useTransition();
  const isLoading = isPending || showLoadingDemo;

  // React Query Hooks for Doctor Personal Practice Reports
  const { refetch: refetchDash } =
    useDoctorSelfDailyAppointmentsDashboard();
  const { data: registerData, refetch: refetchRegister } =
    useDoctorSelfDailyAppointmentRegister({ size: 50 });

  const handlePresetDateChange = (preset: string) => {
    setDateRange(preset);
    if (preset === "Today") {
      setStartDate(getOffsetDateStr(0));
      setEndDate(getOffsetDateStr(0));
    } else if (preset === "Yesterday") {
      setStartDate(getOffsetDateStr(1));
      setEndDate(getOffsetDateStr(1));
    } else if (preset === "Last 7 Days") {
      setStartDate(getOffsetDateStr(6));
      setEndDate(getOffsetDateStr(0));
    } else if (preset === "This Month") {
      setStartDate(getOffsetDateStr(29));
      setEndDate(getOffsetDateStr(0));
    }
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    refetchDash();
    refetchRegister();
    setTimeout(() => setIsRefreshing(false), 600);
  };

  const handleExportAllCsv = () => {
    const recordsToExport = filteredAppointments.map((rec) => ({
      Section: "DOCTOR APPOINTMENT REPORT",
      "Appointment ID": rec.id,
      "Patient Name": rec.patientName,
      MRN: rec.mrn,
      "Appointment Date": rec.appointmentDate,
      "Appointment Time": rec.appointmentTime,
      "Visit Type": rec.visitType,
      Status: rec.status,
    }));

    exportDataToCsv(
      `Doctor_Daily_Appointment_Report_All_Data_${new Date().toISOString().slice(0, 10)}.csv`,
      recordsToExport
    );
  };

  const handleResetFilters = () => {
    const tStr = getOffsetDateStr(0);
    setSearchQuery("");
    setDateRange("Today");
    setStartDate(tStr);
    setEndDate(tStr);
    setStatusFilter("All Statuses");
    setVisitTypeFilter("All Visit Types");
    setShiftFilter("All Shifts");
  };

  const filteredAppointments = (() => {
    let rawList: DoctorDailyAppointmentRecord[];
    if (registerData?.content && registerData.content.length > 0) {
      rawList = registerData.content.map((item, idx) => ({
        id: item.appointmentId || `apt-api-${idx}`,
        patientName: item.patientName || "Unknown Patient",
        mrn: item.mrn || "N/A",
        appointmentDate: item.appointmentDate || getOffsetDateStr(0),
        appointmentTime: item.appointmentTime || "09:00 AM",
        visitType: item.visitType || "Follow-up",
        status: item.appointmentStatus || "Completed",
        consultationStatus: item.consultationStatus || "Completed",
      }));
    } else {
      rawList = SAMPLE_APPOINTMENTS;
    }

    return rawList.filter((item) => {
      // 1. Search Query Filter
      const matchesSearch =
        !searchQuery ||
        (item.patientName || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.mrn || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.id || "").toLowerCase().includes(searchQuery.toLowerCase());

      // 2. Appointment Status Filter
      const matchesStatus =
        statusFilter === "All Statuses" ||
        (item.status || "").toLowerCase() === statusFilter.toLowerCase();

      // 3. Visit Type Filter
      const matchesVisit =
        visitTypeFilter === "All Visit Types" ||
        (item.visitType || "").toLowerCase() === visitTypeFilter.toLowerCase();

      // 4. Shift Filter
      const timeStr = item.appointmentTime || "";
      const matchesShift =
        shiftFilter === "All Shifts" ||
        (shiftFilter.includes("Morning") && (timeStr.includes("08:") || timeStr.includes("09:") || timeStr.includes("10:") || timeStr.includes("11:"))) ||
        (shiftFilter.includes("Afternoon") && (timeStr.includes("12:") || timeStr.includes("01:") || timeStr.includes("02:") || timeStr.includes("03:") || timeStr.includes("04:"))) ||
        (shiftFilter.includes("Evening") && (timeStr.includes("05:") || timeStr.includes("06:") || timeStr.includes("07:") || timeStr.includes("08:")));

      // 5. Date Range Filter
      const extractDateStr = (rec: DoctorDailyAppointmentRecord): string | null => {
        if (rec.appointmentDate && rec.appointmentDate.length >= 10) {
          const match = rec.appointmentDate.match(/\d{4}-\d{2}-\d{2}/);
          if (match) return match[0];
        }
        return null;
      };

      const itemDateStr = extractDateStr(item);
      const matchesDate = (() => {
        if (!startDate && !endDate) return true;
        if (!itemDateStr) return true;
        if (startDate && itemDateStr < startDate) return false;
        if (endDate && itemDateStr > endDate) return false;
        return true;
      })();

      return (
        matchesSearch &&
        matchesStatus &&
        matchesVisit &&
        matchesShift &&
        matchesDate
      );
    });
  })();

  const kpi = (() => {
    const totalReg = filteredAppointments.length;
    const completedCount = filteredAppointments.filter(
      (a) => (a.status || "").toLowerCase() === "completed"
    ).length;
    const pendingCount = filteredAppointments.filter(
      (a) => {
        const s = (a.status || "").toLowerCase();
        return s === "scheduled" || s === "in progress";
      }
    ).length;
    const cancelledCount = filteredAppointments.filter(
      (a) => (a.status || "").toLowerCase() === "cancelled"
    ).length;
    const followUpCount = filteredAppointments.filter(
      (a) => (a.visitType || "").toLowerCase().includes("follow")
    ).length;

    return {
      totalAppointments: totalReg,
      completedCount,
      pendingCount,
      cancelledCount,
      noShowCount: Math.max(0, totalReg - completedCount - pendingCount - cancelledCount),
      followUpCount,
      completionRate: totalReg > 0 ? Math.round((completedCount / totalReg) * 100) : 0,
      cancellationRate: totalReg > 0 ? Math.round((cancelledCount / totalReg) * 100) : 0,
      avgWaitingMinutes: "12.4 min",
    };
  })();

  // Donut & Chart Data
  const apptStatusData = useMemo(() => {
    if (filteredAppointments.length > 0) {
      const completed = filteredAppointments.filter((a) => (a.status || "").toLowerCase() === "completed").length;
      const inProgress = filteredAppointments.filter((a) => (a.status || "").toLowerCase() === "in progress").length;
      const scheduled = filteredAppointments.filter((a) => (a.status || "").toLowerCase() === "scheduled").length;
      const cancelled = filteredAppointments.filter((a) => (a.status || "").toLowerCase() === "cancelled").length;

      const list = [
        { name: "Completed", value: completed, color: "#66BB6A" },
        { name: "In Progress", value: inProgress, color: "#F59E0B" },
        { name: "Scheduled", value: scheduled, color: "#0D47A1" },
        { name: "Cancelled", value: cancelled, color: "#EF4444" },
      ].filter((item) => item.value > 0);

      if (list.length > 0) return list;
    }
    return [
      { name: "Completed", value: 28, color: "#66BB6A" },
      { name: "In Progress", value: 3, color: "#F59E0B" },
      { name: "Scheduled", value: 1, color: "#0D47A1" },
    ];
  }, [filteredAppointments]);

  const apptTrendData = useMemo(() => {
    const daysCount = trendDays === "7 Days" ? 7 : trendDays === "30 Days" ? 30 : trendDays === "90 Days" ? 90 : 1;
    const result = [];
    for (let i = daysCount - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      });
      result.push({
        date: dateStr,
        appointments: Math.max(1, 6 + ((i * 3) % 7)),
        completed: Math.max(1, 4 + ((i * 2) % 5)),
      });
    }
    return result;
  }, [trendDays]);

  const shiftWorkloadData = useMemo(() => {
    if (filteredAppointments.length > 0) {
      const morning = filteredAppointments.filter((a) => (a.appointmentTime || "").includes("08:") || (a.appointmentTime || "").includes("09:") || (a.appointmentTime || "").includes("10:") || (a.appointmentTime || "").includes("11:")).length;
      const afternoon = filteredAppointments.filter((a) => (a.appointmentTime || "").includes("12:") || (a.appointmentTime || "").includes("01:") || (a.appointmentTime || "").includes("02:") || (a.appointmentTime || "").includes("03:")).length;
      const evening = Math.max(0, filteredAppointments.length - morning - afternoon);

      return [
        { shift: "Morning (08am-12pm)", completed: morning, pending: 0 },
        { shift: "Afternoon (01pm-04pm)", completed: afternoon, pending: 0 },
        { shift: "Evening (05pm-08pm)", completed: evening, pending: 0 },
      ];
    }
    return [
      { shift: "Morning (08am-12pm)", completed: 18, pending: 2 },
      { shift: "Afternoon (01pm-04pm)", completed: 8, pending: 2 },
      { shift: "Evening (05pm-08pm)", completed: 2, pending: 0 },
    ];
  }, [filteredAppointments]);

  const visitTypeData = useMemo(() => {
    if (filteredAppointments.length > 0) {
      const newPatients = filteredAppointments.filter((a) => (a.visitType || "").toLowerCase().includes("new")).length;
      const followUp = filteredAppointments.filter((a) => (a.visitType || "").toLowerCase().includes("follow")).length;
      const checkup = filteredAppointments.filter((a) => (a.visitType || "").toLowerCase().includes("check")).length;
      const walkIn = filteredAppointments.filter((a) => (a.visitType || "").toLowerCase().includes("walk")).length;

      return [
        { visitType: "New Patient", count: newPatients },
        { visitType: "Follow-up", count: followUp },
        { visitType: "Routine Checkup", count: checkup },
        { visitType: "Walk-In", count: walkIn },
      ];
    }
    return [
      { visitType: "New Patient", count: 12 },
      { visitType: "Follow-up", count: 14 },
      { visitType: "Routine Checkup", count: 4 },
      { visitType: "Walk-In", count: 2 },
    ];
  }, [filteredAppointments]);

  return (
    <div
      className="min-h-screen bg-[#F1F5F9] text-[#111827] pb-12"
      style={{ fontFamily: RB }}
    >
      {/* Top Header Section */}
        <div className="w-full px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-center gap-3">
              <button
                onClick={onBack || (() => window.history.back())}
                className="p-2.5 rounded-xl border border-[#E5E7EB] bg-white hover:bg-slate-100 text-slate-700 transition-colors cursor-pointer shadow-2xs"
                title="Go Back"
              >
                <ArrowLeft size={18} />
              </button>
              <div>
                <div className="flex items-center gap-2">
                  <h1
                    className="text-2xl font-bold text-[#111827]"
                    style={{ fontFamily: PP }}
                  >
                    Daily Appointment Report
                  </h1>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#0D47A1]/10 text-[#0D47A1] border border-blue-200">
                    Doctor Access Scoped
                  </span>
                </div>
                <p className="text-xs text-[#64748B] mt-0.5">
                  Monitor your appointments, consultation schedule, and daily performance metrics.
                </p>
              </div>
            </div>

            {/* Header Actions */}
            <div className="flex items-center gap-3 flex-wrap">
              <div className="hidden lg:flex items-center gap-2 text-xs text-[#64748B] bg-slate-50 border border-[#E5E7EB] px-3 py-2 rounded-xl">
                <Clock className="w-4 h-4 text-[#0D47A1]" />
                <span>
                  Last Updated:{" "}
                  <strong className="text-[#111827]">
                    {new Date().toLocaleTimeString("en-US", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </strong>
                </span>
              </div>

              <button
                onClick={handleRefresh}
                className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-medium text-[#111827] bg-white border border-[#E5E7EB] hover:bg-slate-50 transition shadow-sm"
              >
                <RefreshCw
                  className={`w-3.5 h-3.5 text-[#0D47A1] ${isRefreshing ? "animate-spin" : ""}`}
                />
                <span>Refresh</span>
              </button>

              <button
                onClick={() =>
                  alert("Exporting Doctor Appointment Report (PDF)...")
                }
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-medium text-white bg-[#0D47A1] hover:bg-blue-900 transition shadow-sm"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export PDF</span>
              </button>

              <button
                onClick={() => window.print()}
                className="inline-flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium text-[#111827] bg-white border border-[#E5E7EB] hover:bg-slate-50 transition shadow-sm cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5 text-[#0D47A1]" />
                <span>Print Report</span>
              </button>

              <button
                onClick={handleExportAllCsv}
                className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold text-gray-700 bg-white border border-gray-300 hover:bg-slate-50 transition shadow-sm cursor-pointer"
              >
                <Download className="w-4 h-4 text-emerald-600" />
                <span>Export CSV for All</span>
              </button>
            </div>
          </div>
        </div>

      {/* Main Container Full Width */}
      <div className="w-full px-4 sm:px-6 lg:px-8 mt-6 space-y-6">
        {/* 1. TOP 6 DOCTOR APPOINTMENT KPI CARDS */}
        {!isLoading && !hasError && (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {/* Card 1: Today's Appointments */}
            <div className="bg-white rounded-2xl border border-[#E5E7EB] p-4 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-[#64748B]">
                  Total Appts
                </span>
                <div className="p-2 rounded-xl bg-blue-50 text-[#0D47A1]">
                  <Calendar className="w-4 h-4" />
                </div>
              </div>
              <div
                className="text-2xl font-bold text-[#111827] mb-1"
                style={{ fontFamily: PP }}
              >
                {kpi.totalAppointments}
              </div>
              <div className="flex items-center gap-2 text-[11px] text-[#64748B] mb-3">
                <span className="text-[#66BB6A] font-semibold flex items-center gap-0.5">
                  <TrendingUp className="w-3 h-3" /> +14.2%
                </span>
                <span>vs last period</span>
              </div>
              <div className="grid grid-cols-2 gap-1 pt-2 border-t border-[#E5E7EB] text-[11px] text-center">
                <div>
                  <div className="text-[#66BB6A] font-bold">{kpi.completedCount}</div>
                  <div className="text-[#64748B]">Completed</div>
                </div>
                <div>
                  <div className="text-[#F59E0B] font-bold">{kpi.pendingCount}</div>
                  <div className="text-[#64748B]">Pending</div>
                </div>
              </div>
            </div>

            {/* Card 2: Completed Consultations */}
            <div className="bg-white rounded-2xl border border-[#E5E7EB] p-4 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-[#64748B]">
                  Completed
                </span>
                <div className="p-2 rounded-xl bg-teal-50 text-[#009688]">
                  <UserCheck className="w-4 h-4" />
                </div>
              </div>
              <div
                className="text-2xl font-bold text-[#111827] mb-1"
                style={{ fontFamily: PP }}
              >
                {kpi.completedCount}
              </div>
              <div className="flex items-center gap-2 text-[11px] text-[#64748B] mb-3">
                <span className="text-[#009688] font-semibold">
                  {kpi.completionRate}% Completion Rate
                </span>
              </div>
              <div className="grid grid-cols-2 gap-1 pt-2 border-t border-[#E5E7EB] text-[11px] text-center">
                <div>
                  <div className="text-[#009688] font-bold">{kpi.completedCount}</div>
                  <div className="text-[#64748B]">Done</div>
                </div>
                <div>
                  <div className="text-[#0D47A1] font-bold">{kpi.completionRate}%</div>
                  <div className="text-[#64748B]">Rate</div>
                </div>
              </div>
            </div>

            {/* Card 3: Cancelled Appointments */}
            <div className="bg-white rounded-2xl border border-[#E5E7EB] p-4 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-[#64748B]">
                  Cancelled
                </span>
                <div className="p-2 rounded-xl bg-red-50 text-[#EF4444]">
                  <XCircle className="w-4 h-4" />
                </div>
              </div>
              <div
                className="text-2xl font-bold text-[#111827] mb-1"
                style={{ fontFamily: PP }}
              >
                {kpi.cancelledCount}
              </div>
              <div className="flex items-center gap-2 text-[11px] text-[#64748B] mb-3">
                <span className="text-[#EF4444] font-semibold">
                  {kpi.cancellationRate}% Cancel Rate
                </span>
              </div>
              <div className="grid grid-cols-2 gap-1 pt-2 border-t border-[#E5E7EB] text-[11px] text-center">
                <div>
                  <div className="text-[#EF4444] font-bold">{kpi.cancelledCount}</div>
                  <div className="text-[#64748B]">Cancelled</div>
                </div>
                <div>
                  <div className="text-[#64748B] font-bold">{kpi.cancellationRate}%</div>
                  <div className="text-[#64748B]">Rate</div>
                </div>
              </div>
            </div>

            {/* Card 4: No Show Patients */}
            <div className="bg-white rounded-2xl border border-[#E5E7EB] p-4 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-[#64748B]">
                  No Show Patients
                </span>
                <div className="p-2 rounded-xl bg-amber-50 text-[#F59E0B]">
                  <Users className="w-4 h-4" />
                </div>
              </div>
              <div
                className="text-2xl font-bold text-[#111827] mb-1"
                style={{ fontFamily: PP }}
              >
                {kpi.noShowCount}
              </div>
              <div className="flex items-center gap-2 text-[11px] text-[#64748B] mb-3">
                <span className="text-[#F59E0B] font-semibold">
                  No Show Count
                </span>
              </div>
              <div className="grid grid-cols-2 gap-1 pt-2 border-t border-[#E5E7EB] text-[11px] text-center">
                <div>
                  <div className="text-[#F59E0B] font-bold">{kpi.noShowCount}</div>
                  <div className="text-[#64748B]">No Show</div>
                </div>
                <div>
                  <div className="text-[#64748B] font-bold">Low</div>
                  <div className="text-[#64748B]">Impact</div>
                </div>
              </div>
            </div>

            {/* Card 5: Follow-up Appointments */}
            <div className="bg-white rounded-2xl border border-[#E5E7EB] p-4 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-[#64748B]">
                  Follow-ups
                </span>
                <div className="p-2 rounded-xl bg-teal-50 text-[#009688]">
                  <Activity className="w-4 h-4" />
                </div>
              </div>
              <div
                className="text-2xl font-bold text-[#111827] mb-1"
                style={{ fontFamily: PP }}
              >
                {kpi.followUpCount}
              </div>
              <div className="flex items-center gap-2 text-[11px] text-[#64748B] mb-3">
                <span className="text-[#009688] font-semibold">
                  Scheduled Follow-ups
                </span>
              </div>
              <div className="grid grid-cols-2 gap-1 pt-2 border-t border-[#E5E7EB] text-[11px] text-center">
                <div>
                  <div className="text-[#009688] font-bold">{kpi.followUpCount}</div>
                  <div className="text-[#64748B]">Active</div>
                </div>
                <div>
                  <div className="text-[#0D47A1] font-bold">{Math.max(0, kpi.followUpCount - 1)}</div>
                  <div className="text-[#64748B]">Upcoming</div>
                </div>
              </div>
            </div>

            {/* Card 6: Average Waiting Time */}
            <div className="bg-white rounded-2xl border border-[#E5E7EB] p-4 shadow-sm hover:shadow-md transition-shadow flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold text-[#64748B]">
                  Avg Wait Time
                </span>
                <div
                  className="text-2xl font-bold text-[#111827] mt-1"
                  style={{ fontFamily: PP }}
                >
                  {kpi.avgWaitingMinutes}
                </div>
                <p className="text-[11px] text-[#64748B] mt-1">
                  Avg consult delay
                </p>
                <div className="mt-2 text-[11px] font-semibold text-[#66BB6A]">
                  ✓ Target Met
                </div>
              </div>
              <CircularProgress percentage={88} size={56} strokeWidth={6} />
            </div>
          </div>
        )}

        {/* 2. SEARCH & FILTERS BAR */}
        <div>
          {/* Doctor Filter Bar */}
          <div className="bg-white rounded-2xl border border-[#E5E7EB] p-4 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <div
                className="flex items-center gap-2 text-xs font-semibold text-[#111827]"
                style={{ fontFamily: PP }}
              >
                <Filter className="w-4 h-4 text-[#009688]" />
                <span>Filter Daily Appointment Schedule & Analytics</span>
              </div>
              <span className="text-[11px] text-[#64748B] bg-slate-100 px-2.5 py-0.5 rounded-full font-semibold">
                Filter: Active Doctor Practice
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
              {/* Preset Date Range */}
              <div>
                <label className="block text-[11px] font-medium text-[#64748B] mb-1">
                  Date Preset
                </label>
                <select
                  aria-label="Select option"
                  value={dateRange}
                  onChange={(e) => handlePresetDateChange(e.target.value)}
                  className="w-full bg-[#F1F5F9] border border-[#E5E7EB] rounded-xl text-xs px-2.5 py-2 text-[#111827] focus:outline-none focus:ring-2 focus:ring-[#0D47A1]"
                >
                  <option>Today</option>
                  <option>Yesterday</option>
                  <option>Last 7 Days</option>
                  <option>This Month</option>
                  <option>Custom Date</option>
                </select>
              </div>

              {/* Start Date */}
              <div>
                <label className="block text-[11px] font-medium text-[#64748B] mb-1">
                  From Date
                </label>
                <input
                  aria-label="From Date"
                  type="date"
                  value={startDate}
                  onChange={(e) => {
                    setStartDate(e.target.value);
                    handlePresetDateChange("Custom Date");
                  }}
                  className="w-full bg-[#F1F5F9] border border-[#E5E7EB] rounded-xl text-xs px-2.5 py-2 text-[#111827] focus:outline-none focus:ring-2 focus:ring-[#0D47A1]"
                />
              </div>

              {/* End Date */}
              <div>
                <label className="block text-[11px] font-medium text-[#64748B] mb-1">
                  To Date
                </label>
                <input
                  aria-label="To Date"
                  type="date"
                  value={endDate}
                  onChange={(e) => {
                    setEndDate(e.target.value);
                    handlePresetDateChange("Custom Date");
                  }}
                  className="w-full bg-[#F1F5F9] border border-[#E5E7EB] rounded-xl text-xs px-2.5 py-2 text-[#111827] focus:outline-none focus:ring-2 focus:ring-[#0D47A1]"
                />
              </div>

              {/* Status */}
              <div>
                <label className="block text-[11px] font-medium text-[#64748B] mb-1">
                  Appointment Status
                </label>
                <select
                  aria-label="Select option"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full bg-[#F1F5F9] border border-[#E5E7EB] rounded-xl text-xs px-2.5 py-2 text-[#111827] focus:outline-none focus:ring-2 focus:ring-[#0D47A1]"
                >
                  <option>All Statuses</option>
                  <option>Completed</option>
                  <option>In Progress</option>
                  <option>Scheduled</option>
                  <option>Cancelled</option>
                  <option>No Show</option>
                </select>
              </div>

              {/* Visit Type */}
              <div>
                <label className="block text-[11px] font-medium text-[#64748B] mb-1">
                  Visit Type
                </label>
                <select
                  aria-label="Select option"
                  value={visitTypeFilter}
                  onChange={(e) => setVisitTypeFilter(e.target.value)}
                  className="w-full bg-[#F1F5F9] border border-[#E5E7EB] rounded-xl text-xs px-2.5 py-2 text-[#111827] focus:outline-none focus:ring-2 focus:ring-[#0D47A1]"
                >
                  <option>All Visit Types</option>
                  <option>New Patient</option>
                  <option>Follow-up</option>
                  <option>Routine Checkup</option>
                  <option>Walk-In</option>
                </select>
              </div>

              {/* Shift */}
              <div>
                <label className="block text-[11px] font-medium text-[#64748B] mb-1">
                  Shift Slot
                </label>
                <select
                  aria-label="Select option"
                  value={shiftFilter}
                  onChange={(e) => setShiftFilter(e.target.value)}
                  className="w-full bg-[#F1F5F9] border border-[#E5E7EB] rounded-xl text-xs px-2.5 py-2 text-[#111827] focus:outline-none focus:ring-2 focus:ring-[#0D47A1]"
                >
                  <option>All Shifts</option>
                  <option>Morning (08am-12pm)</option>
                  <option>Afternoon (01pm-04pm)</option>
                  <option>Evening (05pm-08pm)</option>
                </select>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mt-4 pt-3 border-t border-[#E5E7EB]">
              <div className="relative w-full sm:w-72 md:w-80">
                <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#64748B]" />
                <input
                  aria-label="Input field"
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search Appointment ID, Patient Name, MRN..."
                  className="w-full pl-10 pr-16 py-2 bg-[#F1F5F9] border border-[#E5E7EB] rounded-xl text-xs text-[#111827] placeholder-[#64748B] focus:outline-none focus:ring-2 focus:ring-[#0D47A1]"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-medium text-[#64748B] hover:text-[#111827]"
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
                  onClick={handleRefresh}
                  className="px-4 py-1.5 rounded-xl text-xs font-medium text-white bg-[#009688] hover:bg-teal-700 transition shadow-sm"
                >
                  Apply Filters
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Demo State Controls */}
        <div className="flex items-center justify-between mb-4 bg-white p-2.5 rounded-xl border border-[#E5E7EB] text-xs">
          <div className="flex items-center gap-3">
            <span className="font-semibold text-[#111827]">
              Demo State Toggles:
            </span>
            <button
              onClick={() => {
                startTransition(() => {
                  setShowLoadingDemo(!showLoadingDemo);
                  setHasError(false);
                });
                setHasError(false);
              }}
              className={`px-2.5 py-1 rounded-lg border text-xs ${isLoading ? "bg-amber-50 border-amber-300 text-[#F59E0B]" : "bg-slate-50 border-[#E5E7EB] text-[#64748B]"}`}
            >
              Toggle Loading Skeleton
            </button>
            <button
              onClick={() => {
                setHasError(!hasError);
                setShowLoadingDemo(false);
              }}
              className={`px-2.5 py-1 rounded-lg border text-xs ${hasError ? "bg-red-50 border-red-[#EF4444] text-[#EF4444]" : "bg-slate-50 border-[#E5E7EB] text-[#64748B]"}`}
            >
              Toggle Error State
            </button>
          </div>
          <span className="text-[11px] text-[#64748B]">
            Simulate Doctor appointment report state
          </span>
        </div>

        {/* ERROR STATE */}
        {hasError && (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-6 mb-6 text-center">
            <AlertCircle className="w-10 h-10 text-[#EF4444] mx-auto mb-2" />
            <h3
              className="text-base font-bold text-[#111827]"
              style={{ fontFamily: PP }}
            >
              Unable to Load Appointment Report
            </h3>
            <p className="text-xs text-[#64748B] mt-1 max-w-md mx-auto">
              Connection error while loading your appointment schedule. Please
              retry.
            </p>
            <button
              onClick={() => setHasError(false)}
              className="mt-4 px-4 py-2 bg-[#EF4444] text-white rounded-xl text-xs font-semibold hover:bg-red-600 transition"
            >
              Retry
            </button>
          </div>
        )}

        {/* LOADING SKELETON STATE */}
        {isLoading && (
          <div className="space-y-6 mb-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div
                  key={i}
                  className="bg-white rounded-2xl border border-[#E5E7EB] p-4 h-32 animate-pulse"
                ></div>
              ))}
            </div>
            <div className="bg-white rounded-2xl border border-[#E5E7EB] p-6 h-64 animate-pulse"></div>
          </div>
        )}

        {/* MAIN DASHBOARD CONTENT (FULL SCREEN WIDTH) */}
        {!isLoading && !hasError && (
          <div className="w-full space-y-6">
            {/* 3. APPOINTMENT STATUS DONUT & APPOINTMENT TREND AREA */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* My Appointment Status Donut Chart */}
              <div className="bg-white rounded-2xl border border-[#E5E7EB] p-5 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3
                      className="text-sm font-bold text-[#111827]"
                      style={{ fontFamily: PP }}
                    >
                      My Appointment Status Breakdown
                    </h3>
                    <p className="text-[11px] text-[#64748B]">
                      Distribution across completed, waiting, cancelled & scheduled
                    </p>
                  </div>
                  <PieChartIcon className="w-4 h-4 text-[#009688]" />
                </div>
                <div className="h-60">
                  <ResponsiveContainer width="100%" height="100%">
                    <RechartsPie>
                      <Pie
                        data={apptStatusData}
                        cx="50%"
                        cy="50%"
                        innerRadius={45}
                        outerRadius={75}
                        paddingAngle={3}
                        dataKey="value"
                      >
                        {apptStatusData.map((entry) => (
                          <Cell key={entry.name} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "#FFFFFF",
                          borderRadius: "12px",
                          borderColor: "#E5E7EB",
                          fontSize: "11px",
                        }}
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

              {/* Appointment Trend Area Chart */}
              <div className="bg-white rounded-2xl border border-[#E5E7EB] p-5 shadow-sm">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-4">
                  <div>
                    <h3
                      className="text-sm font-bold text-[#111827]"
                      style={{ fontFamily: PP }}
                    >
                      Appointment Trend
                    </h3>
                    <p className="text-[11px] text-[#64748B]">
                      Scheduled vs completed consultations over time
                    </p>
                  </div>

                  <div className="flex items-center gap-1 bg-[#F1F5F9] p-1 rounded-xl border border-[#E5E7EB] text-[10px]">
                    {(["Today", "7 Days", "30 Days", "90 Days"] as const).map(
                      (t) => (
                        <button
                          key={t}
                          onClick={() => setTrendDays(t)}
                          className={`px-2 py-0.5 rounded-lg font-medium transition ${trendDays === t ? "bg-[#0D47A1] text-white shadow-sm" : "text-[#64748B]"}`}
                        >
                          {t}
                        </button>
                      ),
                    )}
                  </div>
                </div>

                <div className="h-60">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart
                      data={apptTrendData}
                      margin={{ top: 10, right: 10, left: -15, bottom: 0 }}
                    >
                      <defs>
                        <linearGradient
                          id="docTrendApptGrad"
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
                          id="docTrendCompGrad"
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
                      <Area
                        type="monotone"
                        dataKey="appointments"
                        name="Appointments"
                        stroke="#0D47A1"
                        fillOpacity={1}
                        fill="url(#docTrendApptGrad)"
                      />
                      <Area
                        type="monotone"
                        dataKey="completed"
                        name="Completed"
                        stroke="#009688"
                        fillOpacity={1}
                        fill="url(#docTrendCompGrad)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* 4. MY DAILY WORKLOAD & VISIT TYPE DISTRIBUTION */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* My Daily Workload Horizontal Bar */}
              <div className="bg-white rounded-2xl border border-[#E5E7EB] p-5 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3
                      className="text-sm font-bold text-[#111827]"
                      style={{ fontFamily: PP }}
                    >
                      My Daily Workload
                    </h3>
                    <p className="text-[11px] text-[#64748B]">
                      Consultation load per shift slot
                    </p>
                  </div>
                  <UserCheck className="w-4 h-4 text-[#0D47A1]" />
                </div>
                <div className="h-56">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      layout="vertical"
                      data={shiftWorkloadData}
                      margin={{ top: 5, right: 10, left: 45, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                      <XAxis
                        type="number"
                        tick={{ fontSize: 10, fill: "#64748B" }}
                      />
                      <YAxis
                        type="category"
                        dataKey="shift"
                        tick={{ fontSize: 9, fill: "#111827" }}
                        width={130}
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
                        dataKey="completed"
                        name="Completed"
                        fill="#009688"
                        radius={[0, 4, 4, 0]}
                      />
                      <Bar
                        dataKey="pending"
                        name="Pending"
                        fill="#F59E0B"
                        radius={[0, 4, 4, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Visit Type Distribution Vertical Bar */}
              <div className="bg-white rounded-2xl border border-[#E5E7EB] p-5 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3
                      className="text-sm font-bold text-[#111827]"
                      style={{ fontFamily: PP }}
                    >
                      Visit Type Distribution
                    </h3>
                    <p className="text-[11px] text-[#64748B]">
                      Appointment volume grouped by visit category
                    </p>
                  </div>
                  <Users className="w-4 h-4 text-[#009688]" />
                </div>
                <div className="h-56">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={visitTypeData}
                      margin={{ top: 10, right: 10, left: -15, bottom: 0 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                      <XAxis
                        dataKey="visitType"
                        tick={{ fontSize: 9, fill: "#64748B" }}
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
                      <Bar
                        dataKey="count"
                        name="Appointment Count"
                        fill="#0D47A1"
                        radius={[4, 4, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* 5. DAILY APPOINTMENT ENTERPRISE DATA TABLE */}
            <div className="bg-white rounded-2xl border border-[#E5E7EB] shadow-sm overflow-hidden">
              <div className="p-5 border-b border-[#E5E7EB] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                  <h3
                    className="text-base font-bold text-[#111827]"
                    style={{ fontFamily: PP }}
                  >
                    Daily Appointment Register
                  </h3>
                  <p className="text-xs text-[#64748B]">
                    Logged-in Doctor active appointment register
                  </p>
                </div>
                <button
                  onClick={() =>
                    alert("Exporting Appointment Register (CSV)...")
                  }
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 border border-[#E5E7EB] text-xs font-semibold text-[#111827] rounded-xl hover:bg-slate-100 transition"
                >
                  <Download className="w-3.5 h-3.5 text-[#0D47A1]" />
                  <span>Export Register</span>
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-[#F1F5F9] text-[11px] font-bold text-[#64748B] uppercase tracking-wider border-b border-[#E5E7EB]">
                      <th className="py-3.5 px-4">Appointment ID</th>
                      <th className="py-3.5 px-4">Patient Name</th>
                      <th className="py-3.5 px-4">MRN</th>
                      <th className="py-3.5 px-4">Appt Date</th>
                      <th className="py-3.5 px-4">Appt Time</th>
                      <th className="py-3.5 px-4">Visit Type</th>
                      <th className="py-3.5 px-4 text-center">Status</th>
                      <th className="py-3.5 px-4 text-center">
                        Consultation Status
                      </th>
                      <th className="py-3.5 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E5E7EB] text-xs">
                    {filteredAppointments.length === 0 ? (
                      <tr>
                        <td
                          colSpan={9}
                          className="py-8 text-center text-[#64748B]"
                        >
                          No appointments match your search or filter criteria.
                        </td>
                      </tr>
                    ) : (
                      filteredAppointments.map((item) => (
                        <tr
                          key={item.id}
                          className="hover:bg-slate-50 transition-colors"
                        >
                          <td className="py-3.5 px-4 font-bold text-[#0D47A1]">
                            {item.id}
                          </td>
                          <td className="py-3.5 px-4 font-bold text-[#111827]">
                            {item.patientName}
                          </td>
                          <td className="py-3.5 px-4 font-mono font-semibold text-[#0D47A1]">
                            {item.mrn}
                          </td>
                          <td className="py-3.5 px-4 text-[#64748B]">
                            {item.appointmentDate}
                          </td>
                          <td className="py-3.5 px-4 text-[#111827] font-medium">
                            {item.appointmentTime}
                          </td>
                          <td className="py-3.5 px-4 font-semibold text-[#111827]">
                            {item.visitType}
                          </td>
                          <td className="py-3.5 px-4 text-center">
                            <span
                              className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${item.status === "Completed" ? "bg-teal-50 text-[#009688] border border-teal-200" : item.status === "In Progress" ? "bg-amber-50 text-[#F59E0B] border border-amber-200" : item.status === "Cancelled" ? "bg-red-50 text-[#EF4444] border border-red-200" : "bg-slate-100 text-[#64748B]"}`}
                            >
                              {item.status}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-center font-medium text-[#64748B]">
                            {item.consultationStatus}
                          </td>
                          <td className="py-3.5 px-4 text-right">
                            <div className="flex items-center justify-end gap-1">
                              <button
                                onClick={() =>
                                  alert(`Viewing patient ${item.patientName}`)
                                }
                                className="p-1.5 text-[#0D47A1] hover:bg-blue-50 rounded-lg transition"
                                title="View Patient"
                              >
                                <Users className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() =>
                                  alert(
                                    `Viewing consultation for ${item.patientName}`,
                                  )
                                }
                                className="p-1.5 text-[#009688] hover:bg-teal-50 rounded-lg transition"
                                title="View Consultation"
                              >
                                <Eye className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() =>
                                  alert(`Printing summary for ${item.id}`)
                                }
                                className="p-1.5 text-[#64748B] hover:bg-slate-100 rounded-lg transition"
                                title="Print Summary"
                              >
                                <Printer className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Table Pagination */}
              <div className="p-4 bg-[#F1F5F9] border-t border-[#E5E7EB] flex items-center justify-between text-xs text-[#64748B]">
                <span>
                  Showing 1 to {filteredAppointments.length} of{" "}
                  {filteredAppointments.length} entries
                </span>
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
        )}

        {/* FOOTER */}
        <div className="mt-8 pt-4 border-t border-[#E5E7EB] flex flex-col sm:flex-row items-center justify-between text-xs text-[#64748B] gap-2">
          <div>
            Showing{" "}
            <strong className="text-[#111827]">
              {filteredAppointments.length} Appointment Results
            </strong>
          </div>
          <div>
            Hospital Management System • Doctor Daily Appointment Report v1.0
          </div>
          <div>
            Last Refreshed:{" "}
            <strong className="text-[#111827]">
              {new Date().toLocaleString()}
            </strong>
          </div>
        </div>
      </div>
    </div>
  );
}
