import React, { useReducer, useMemo, useTransition } from "react";
import {
  Download,
  RefreshCw,
  Filter,
  Search,
  Users,
  UserCheck,
  Activity,
  CheckCircle2,
  Clock,
  PieChart as PieChartIcon,
  Eye,
  Printer,
  ChevronLeft,
  ChevronRight as ChevronRightIcon,
  AlertCircle,
  Star,
  ArrowLeft,
  TrendingUp,
} from "lucide-react";

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
  LineChart,
  Line,
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

export interface DoctorConsultationPerformanceRecord {
  consultationId: string;
  patientName: string;
  mrn: string;
  appointmentDate: string;
  consultationTime: string;
  diagnosis: string;
  prescriptionStatus: string;
  followUp: string;
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

const SAMPLE_PERFORMANCE_RECORDS: DoctorConsultationPerformanceRecord[] = [
  {
    consultationId: "CNS-2026-001",
    patientName: "Eleanor Vance",
    mrn: "MRN-2026111086",
    appointmentDate: getOffsetDateStr(0),
    consultationTime: "09:15 AM",
    diagnosis: "Refractive Error & Astigmatism",
    prescriptionStatus: "Issued",
    followUp: getOffsetDateStr(-7),
    consultationStatus: "Completed",
  },
  {
    consultationId: "CNS-2026-002",
    patientName: "Marcus Brody",
    mrn: "MRN-2026925825",
    appointmentDate: getOffsetDateStr(0),
    consultationTime: "09:45 AM",
    diagnosis: "Essential Hypertension",
    prescriptionStatus: "Issued",
    followUp: getOffsetDateStr(-14),
    consultationStatus: "Completed",
  },
  {
    consultationId: "CNS-2026-003",
    patientName: "Sophia Martinez",
    mrn: "MRN-2026338491",
    appointmentDate: getOffsetDateStr(0),
    consultationTime: "10:30 AM",
    diagnosis: "General Health Screening",
    prescriptionStatus: "Pending",
    followUp: getOffsetDateStr(-30),
    consultationStatus: "In Progress",
  },
  {
    consultationId: "CNS-2026-004",
    patientName: "James Harrison",
    mrn: "MRN-2026447219",
    appointmentDate: getOffsetDateStr(1),
    consultationTime: "11:15 AM",
    diagnosis: "Type 2 Diabetes Mellitus",
    prescriptionStatus: "Issued",
    followUp: getOffsetDateStr(-5),
    consultationStatus: "Completed",
  },
  {
    consultationId: "CNS-2026-005",
    patientName: "Amara Okafor",
    mrn: "MRN-2026559102",
    appointmentDate: getOffsetDateStr(2),
    consultationTime: "02:15 PM",
    diagnosis: "Acute Migraine Headache",
    prescriptionStatus: "Pending",
    followUp: getOffsetDateStr(-10),
    consultationStatus: "Cancelled",
  },
  {
    consultationId: "CNS-2026-006",
    patientName: "David Chen",
    mrn: "MRN-2026771823",
    appointmentDate: getOffsetDateStr(4),
    consultationTime: "03:45 PM",
    diagnosis: "Acute Bronchitis",
    prescriptionStatus: "Issued",
    followUp: getOffsetDateStr(-3),
    consultationStatus: "Completed",
  },
];

export function DoctorDoctorReportScreen({ onBack }: { onBack?: () => void }) {
  const todayStr = getOffsetDateStr(0);

  const [state, dispatch] = useReducer(
    (
      prev: {
        searchQuery: string;
        dateRange: string;
        startDate: string;
        endDate: string;
        consultStatusFilter: string;
        visitTypeFilter: string;
        shiftFilter: string;
        trendDays: "7 Days" | "30 Days" | "90 Days";
        isRefreshing: boolean;
        showLoadingDemo: boolean;
        hasError: boolean;
      },
      next: Partial<{
        searchQuery: string;
        dateRange: string;
        startDate: string;
        endDate: string;
        consultStatusFilter: string;
        visitTypeFilter: string;
        shiftFilter: string;
        trendDays: "7 Days" | "30 Days" | "90 Days";
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
      consultStatusFilter: "All Statuses",
      visitTypeFilter: "All Visit Types",
      shiftFilter: "All Shifts",
      trendDays: "7 Days" as const,
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
    consultStatusFilter,
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
  const setConsultStatusFilter = (val: string) =>
    dispatch({ consultStatusFilter: val });
  const setVisitTypeFilter = (val: string) =>
    dispatch({ visitTypeFilter: val });
  const setShiftFilter = (val: string) => dispatch({ shiftFilter: val });
  const setTrendDays = (val: "7 Days" | "30 Days" | "90 Days") =>
    dispatch({ trendDays: val });
  const setIsRefreshing = (val: boolean) => dispatch({ isRefreshing: val });
  const setShowLoadingDemo = (val: boolean) => dispatch({ showLoadingDemo: val });
  const setHasError = (val: boolean) => dispatch({ hasError: val });
  const [isPending,] = useTransition();
  const isLoading = isPending || showLoadingDemo;

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
    setTimeout(() => setIsRefreshing(false), 600);
  };

  const handleResetFilters = () => {
    const tStr = getOffsetDateStr(0);
    setSearchQuery("");
    setDateRange("Today");
    setStartDate(tStr);
    setEndDate(tStr);
    setConsultStatusFilter("All Statuses");
    setVisitTypeFilter("All Visit Types");
    setShiftFilter("All Shifts");
  };

  const filteredPerformance = useMemo(() => {
    return SAMPLE_PERFORMANCE_RECORDS.filter((item) => {
      // 1. Search Query Filter
      const matchesSearch =
        !searchQuery ||
        item.patientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.mrn.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.consultationId.toLowerCase().includes(searchQuery.toLowerCase());

      // 2. Consultation Status Filter
      const matchesStatus =
        consultStatusFilter === "All Statuses" ||
        item.consultationStatus.toLowerCase() ===
          consultStatusFilter.toLowerCase();

      // 3. Shift Slot Filter
      const timeStr = item.consultationTime || "";
      const matchesShift =
        shiftFilter === "All Shifts" ||
        (shiftFilter.includes("Morning") &&
          (timeStr.includes("08:") ||
            timeStr.includes("09:") ||
            timeStr.includes("10:") ||
            timeStr.includes("11:"))) ||
        (shiftFilter.includes("Afternoon") &&
          (timeStr.includes("12:") ||
            timeStr.includes("01:") ||
            timeStr.includes("02:") ||
            timeStr.includes("03:") ||
            timeStr.includes("04:"))) ||
        (shiftFilter.includes("Evening") &&
          (timeStr.includes("05:") ||
            timeStr.includes("06:") ||
            timeStr.includes("07:") ||
            timeStr.includes("08:")));

      // 4. Date Range Filter
      const extractDateStr = (
        rec: DoctorConsultationPerformanceRecord,
      ): string | null => {
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

      return matchesSearch && matchesStatus && matchesShift && matchesDate;
    });
  }, [searchQuery, consultStatusFilter, shiftFilter, startDate, endDate]);

  const kpi = useMemo(() => {
    const totalConsultations = filteredPerformance.length;
    const completedConsultations = filteredPerformance.filter(
      (c) => c.consultationStatus === "Completed",
    ).length;
    const pendingConsultations = filteredPerformance.filter(
      (c) => c.consultationStatus === "In Progress",
    ).length;
    const cancelledConsultations = filteredPerformance.filter(
      (c) => c.consultationStatus === "Cancelled",
    ).length;
    const followUpCount = filteredPerformance.filter(
      (c) => c.followUp && c.followUp !== "N/A",
    ).length;
    const completionRate =
      totalConsultations > 0
        ? Math.round((completedConsultations / totalConsultations) * 100)
        : 0;

    return {
      totalConsultations,
      completedConsultations,
      pendingConsultations,
      cancelledConsultations,
      followUpCount,
      completionRate,
      avgConsultationTime: "14.2 min",
      rating: "4.9 / 5.0",
      avgDailyWorkload:
        totalConsultations > 0 ? (totalConsultations / 3).toFixed(1) : "0.0",
    };
  }, [filteredPerformance]);

  const trendData = useMemo(() => {
    const daysCount =
      trendDays === "7 Days" ? 7 : trendDays === "30 Days" ? 30 : 90;
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
        completed: Math.max(1, 4 + ((i * 2) % 5)),
        pending: Math.max(0, 1 + (i % 2)),
      });
    }
    return result;
  }, [trendDays]);

  const statusBreakdownData = useMemo(() => {
    const completed = filteredPerformance.filter(
      (c) => c.consultationStatus === "Completed",
    ).length;
    const inProgress = filteredPerformance.filter(
      (c) => c.consultationStatus === "In Progress",
    ).length;
    const cancelled = filteredPerformance.filter(
      (c) => c.consultationStatus === "Cancelled",
    ).length;

    return [
      { name: "Completed", value: completed || 28, color: "#66BB6A" },
      { name: "In Progress", value: inProgress || 3, color: "#F59E0B" },
      { name: "Cancelled", value: cancelled || 1, color: "#EF4444" },
    ];
  }, [filteredPerformance]);

  const visitTypeData = useMemo(() => {
    return [
      { visitType: "New Patient", count: 12 },
      { visitType: "Follow-up", count: 14 },
      { visitType: "Routine Checkup", count: 4 },
      { visitType: "Walk-In", count: 2 },
    ];
  }, []);

  const timeAnalysisData = useMemo(() => {
    return [
      { date: "Mon", avgMinutes: 14.5 },
      { date: "Tue", avgMinutes: 13.8 },
      { date: "Wed", avgMinutes: 15.2 },
      { date: "Thu", avgMinutes: 14.0 },
      { date: "Fri", avgMinutes: 13.5 },
      { date: "Sat", avgMinutes: 14.8 },
    ];
  }, []);

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
                  My Performance Report
                </h1>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#0D47A1]/10 text-[#0D47A1] border border-blue-200">
                  Doctor Access Scoped
                </span>
              </div>
              <p className="text-xs text-[#64748B] mt-0.5">
                Monitor your consultations, workload, patient care and clinical
                performance metrics.
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
                alert("Exporting My Performance Report (PDF)...")
              }
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-medium text-white bg-[#0D47A1] hover:bg-blue-900 transition shadow-sm"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export PDF</span>
            </button>

            <button
              onClick={() => window.print()}
              className="inline-flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium text-[#111827] bg-white border border-[#E5E7EB] hover:bg-slate-50 transition shadow-sm"
            >
              <Printer className="w-3.5 h-3.5 text-[#0D47A1]" />
              <span>Print Report</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Container Full Width */}
      <div className="w-full px-4 sm:px-6 lg:px-8 mt-6 space-y-6">
        {/* 1. TOP 6 DOCTOR PERFORMANCE KPI CARDS */}
        {!isLoading && !hasError && (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {/* Card 1: Total Consultations */}
            <div className="bg-white rounded-2xl border border-[#E5E7EB] p-4 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-[#64748B]">
                  Total Consults
                </span>
                <div className="p-2 rounded-xl bg-blue-50 text-[#0D47A1]">
                  <UserCheck className="w-4 h-4" />
                </div>
              </div>
              <div
                className="text-2xl font-bold text-[#111827] mb-1"
                style={{ fontFamily: PP }}
              >
                {kpi.totalConsultations}
              </div>
              <div className="flex items-center gap-2 text-[11px] text-[#64748B] mb-3">
                <span className="text-[#0D47A1] font-semibold flex items-center gap-0.5">
                  <TrendingUp className="w-3 h-3" /> Today's Schedule
                </span>
              </div>
              <div className="grid grid-cols-2 gap-1 pt-2 border-t border-[#E5E7EB] text-[11px] text-center">
                <div>
                  <div className="text-[#0D47A1] font-bold">
                    {kpi.totalConsultations}
                  </div>
                  <div className="text-[#64748B]">Today</div>
                </div>
                <div>
                  <div className="text-[#009688] font-bold">
                    {kpi.totalConsultations * 4}
                  </div>
                  <div className="text-[#64748B]">Monthly</div>
                </div>
              </div>
            </div>

            {/* Card 2: Completed Consultations */}
            <div className="bg-white rounded-2xl border border-[#E5E7EB] p-4 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-[#64748B]">
                  Completed
                </span>
                <div className="p-2 rounded-xl bg-emerald-50 text-[#66BB6A]">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
              </div>
              <div
                className="text-2xl font-bold text-[#111827] mb-1"
                style={{ fontFamily: PP }}
              >
                {kpi.completedConsultations}
              </div>
              <div className="flex items-center gap-2 text-[11px] text-[#64748B] mb-3">
                <span className="text-[#66BB6A] font-semibold">
                  {kpi.completionRate}% Completion Rate
                </span>
              </div>
              <div className="grid grid-cols-2 gap-1 pt-2 border-t border-[#E5E7EB] text-[11px] text-center">
                <div>
                  <div className="text-[#66BB6A] font-bold">
                    {kpi.completedConsultations}
                  </div>
                  <div className="text-[#64748B]">Completed</div>
                </div>
                <div>
                  <div className="text-[#0D47A1] font-bold">
                    {kpi.completionRate}%
                  </div>
                  <div className="text-[#64748B]">Rate</div>
                </div>
              </div>
            </div>

            {/* Card 3: Average Consultation Time */}
            <div className="bg-white rounded-2xl border border-[#E5E7EB] p-4 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-[#64748B]">
                  Avg Consult Time
                </span>
                <div className="p-2 rounded-xl bg-teal-50 text-[#009688]">
                  <Clock className="w-4 h-4" />
                </div>
              </div>
              <div
                className="text-2xl font-bold text-[#111827] mb-1"
                style={{ fontFamily: PP }}
              >
                {kpi.avgConsultationTime}
              </div>
              <div className="flex items-center gap-2 text-[11px] text-[#64748B] mb-3">
                <span className="text-[#009688] font-semibold">
                  -0.8 min vs Target
                </span>
              </div>
              <div className="grid grid-cols-2 gap-1 pt-2 border-t border-[#E5E7EB] text-[11px] text-center">
                <div>
                  <div className="text-[#009688] font-bold">14.2m</div>
                  <div className="text-[#64748B]">Actual</div>
                </div>
                <div>
                  <div className="text-[#64748B] font-bold">15.0m</div>
                  <div className="text-[#64748B]">Target</div>
                </div>
              </div>
            </div>

            {/* Card 4: Follow-up Patients */}
            <div className="bg-white rounded-2xl border border-[#E5E7EB] p-4 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-[#64748B]">
                  Follow-up Patients
                </span>
                <div className="p-2 rounded-xl bg-amber-50 text-[#F59E0B]">
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
                <span className="text-[#F59E0B] font-semibold">
                  Scheduled Follow-ups
                </span>
              </div>
              <div className="grid grid-cols-2 gap-1 pt-2 border-t border-[#E5E7EB] text-[11px] text-center">
                <div>
                  <div className="text-[#F59E0B] font-bold">
                    {kpi.followUpCount}
                  </div>
                  <div className="text-[#64748B]">Active</div>
                </div>
                <div>
                  <div className="text-[#66BB6A] font-bold">
                    {kpi.followUpCount + 12}
                  </div>
                  <div className="text-[#64748B]">Done</div>
                </div>
              </div>
            </div>

            {/* Card 5: Patient Satisfaction */}
            <div className="bg-white rounded-2xl border border-[#E5E7EB] p-4 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-[#64748B]">
                  Satisfaction
                </span>
                <div className="p-2 rounded-xl bg-[#0D47A1]/10 text-[#0D47A1]">
                  <Star className="w-4 h-4 fill-[#0D47A1]" />
                </div>
              </div>
              <div
                className="text-2xl font-bold text-[#111827] mb-1"
                style={{ fontFamily: PP }}
              >
                {kpi.rating}
              </div>
              <div className="flex items-center gap-2 text-[11px] text-[#64748B] mb-3">
                <span className="text-[#0D47A1] font-semibold">
                  98% Positive Score
                </span>
              </div>
              <div className="grid grid-cols-2 gap-1 pt-2 border-t border-[#E5E7EB] text-[11px] text-center">
                <div>
                  <div className="text-[#0D47A1] font-bold">4.9★</div>
                  <div className="text-[#64748B]">Rating</div>
                </div>
                <div>
                  <div className="text-[#64748B] font-bold">42</div>
                  <div className="text-[#64748B]">Reviews</div>
                </div>
              </div>
            </div>

            {/* Card 6: Daily Workload */}
            <div className="bg-white rounded-2xl border border-[#E5E7EB] p-4 shadow-sm hover:shadow-md transition-shadow flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold text-[#64748B]">
                  Daily Workload
                </span>
                <div
                  className="text-2xl font-bold text-[#111827] mt-1"
                  style={{ fontFamily: PP }}
                >
                  {kpi.avgDailyWorkload}
                </div>
                <p className="text-[11px] text-[#64748B] mt-1">
                  Avg Consults / Day
                </p>
                <div className="mt-2 text-[11px] font-semibold text-[#009688]">
                  Peak: 10am - 12pm
                </div>
              </div>
              <CircularProgress percentage={92} size={54} strokeWidth={6} />
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
                <span>Filter Clinical Performance Metrics</span>
              </div>
              <span className="text-[11px] text-[#64748B] bg-slate-100 px-2.5 py-0.5 rounded-full font-semibold">
                Filter: Active Doctor Practice
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
              {/* Date Preset */}
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

              {/* Consultation Status */}
              <div>
                <label className="block text-[11px] font-medium text-[#64748B] mb-1">
                  Consultation Status
                </label>
                <select
                  aria-label="Select option"
                  value={consultStatusFilter}
                  onChange={(e) => setConsultStatusFilter(e.target.value)}
                  className="w-full bg-[#F1F5F9] border border-[#E5E7EB] rounded-xl text-xs px-2.5 py-2 text-[#111827] focus:outline-none focus:ring-2 focus:ring-[#0D47A1]"
                >
                  <option>All Statuses</option>
                  <option>Completed</option>
                  <option>In Progress</option>
                  <option>Cancelled</option>
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
                  placeholder="Search patient, consultation ID, MRN..."
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

        {/* ERROR STATE */}
        {hasError && (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-6 mb-6 text-center">
            <AlertCircle className="w-10 h-10 text-[#EF4444] mx-auto mb-2" />
            <h3
              className="text-base font-bold text-[#111827]"
              style={{ fontFamily: PP }}
            >
              Unable to Load Doctor Performance Report
            </h3>
            <p className="text-xs text-[#64748B] mt-1 max-w-md mx-auto">
              Connection error while loading performance metrics. Please retry.
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
            {/* 3. CONSULTATION PERFORMANCE TREND & STATUS DISTRIBUTION */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Consultation Performance Trend Area Chart */}
              <div className="bg-white rounded-2xl border border-[#E5E7EB] p-5 shadow-sm">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-4">
                  <div>
                    <h3
                      className="text-sm font-bold text-[#111827]"
                      style={{ fontFamily: PP }}
                    >
                      Consultation Performance Trend
                    </h3>
                    <p className="text-[11px] text-[#64748B]">
                      Completed vs pending consultations over time
                    </p>
                  </div>

                  <div className="flex items-center gap-1 bg-[#F1F5F9] p-1 rounded-xl border border-[#E5E7EB] text-[10px]">
                    {(["7 Days", "30 Days", "90 Days"] as const).map((t) => (
                      <button
                        key={t}
                        onClick={() => setTrendDays(t)}
                        className={`px-2 py-0.5 rounded-lg font-medium transition ${trendDays === t ? "bg-[#0D47A1] text-white shadow-sm" : "text-[#64748B]"}`}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="h-60">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart
                      data={trendData}
                      margin={{ top: 10, right: 10, left: -15, bottom: 0 }}
                    >
                      <defs>
                        <linearGradient
                          id="docPerfCompGrad"
                          x1="0"
                          y1="0"
                          x2="0"
                          y2="1"
                        >
                          <stop
                            offset="5%"
                            stopColor="#66BB6A"
                            stopOpacity={0.4}
                          />
                          <stop
                            offset="95%"
                            stopColor="#66BB6A"
                            stopOpacity={0}
                          />
                        </linearGradient>
                        <linearGradient
                          id="docPerfPendGrad"
                          x1="0"
                          y1="0"
                          x2="0"
                          y2="1"
                        >
                          <stop
                            offset="5%"
                            stopColor="#F59E0B"
                            stopOpacity={0.4}
                          />
                          <stop
                            offset="95%"
                            stopColor="#F59E0B"
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
                        dataKey="completed"
                        name="Completed"
                        stroke="#66BB6A"
                        fillOpacity={1}
                        fill="url(#docPerfCompGrad)"
                      />
                      <Area
                        type="monotone"
                        dataKey="pending"
                        name="Pending"
                        stroke="#F59E0B"
                        fillOpacity={1}
                        fill="url(#docPerfPendGrad)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Consultation Status Distribution Donut Chart */}
              <div className="bg-white rounded-2xl border border-[#E5E7EB] p-5 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3
                      className="text-sm font-bold text-[#111827]"
                      style={{ fontFamily: PP }}
                    >
                      Consultation Status Breakdown
                    </h3>
                    <p className="text-[11px] text-[#64748B]">
                      Distribution of completed, pending & cancelled consults
                    </p>
                  </div>
                  <PieChartIcon className="w-4 h-4 text-[#009688]" />
                </div>
                <div className="h-60">
                  <ResponsiveContainer width="100%" height="100%">
                    <RechartsPie>
                      <Pie
                        data={statusBreakdownData}
                        cx="50%"
                        cy="50%"
                        innerRadius={45}
                        outerRadius={75}
                        paddingAngle={3}
                        dataKey="value"
                      >
                        {statusBreakdownData.map((entry) => (
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
            </div>

            {/* 4. PATIENT VISIT DISTRIBUTION & CONSULTATION TIME ANALYSIS */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Patient Visit Distribution Vertical Bar */}
              <div className="bg-white rounded-2xl border border-[#E5E7EB] p-5 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3
                      className="text-sm font-bold text-[#111827]"
                      style={{ fontFamily: PP }}
                    >
                      Patient Visit Distribution
                    </h3>
                    <p className="text-[11px] text-[#64748B]">
                      Consultation volume grouped by visit category
                    </p>
                  </div>
                  <Users className="w-4 h-4 text-[#0D47A1]" />
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
                        name="Patient Count"
                        fill="#0D47A1"
                        radius={[4, 4, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Consultation Time Analysis Interactive Line Chart */}
              <div className="bg-white rounded-2xl border border-[#E5E7EB] p-5 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3
                      className="text-sm font-bold text-[#111827]"
                      style={{ fontFamily: PP }}
                    >
                      Consultation Time Analysis
                    </h3>
                    <p className="text-[11px] text-[#64748B]">
                      Daily average consultation duration in minutes
                    </p>
                  </div>
                  <Clock className="w-4 h-4 text-[#009688]" />
                </div>
                <div className="h-56">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={timeAnalysisData}
                      margin={{ top: 10, right: 10, left: -15, bottom: 0 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                      <XAxis
                        dataKey="date"
                        tick={{ fontSize: 10, fill: "#64748B" }}
                      />
                      <YAxis
                        tick={{ fontSize: 10, fill: "#64748B" }}
                        domain={[10, 20]}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "#FFFFFF",
                          borderRadius: "12px",
                          borderColor: "#E5E7EB",
                          fontSize: "11px",
                        }}
                      />
                      <Line
                        type="monotone"
                        dataKey="avgMinutes"
                        name="Avg Minutes"
                        stroke="#009688"
                        strokeWidth={2}
                        dot={{ r: 3 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* 5. MY PERFORMANCE ENTERPRISE DATA TABLE */}
            <div className="bg-white rounded-2xl border border-[#E5E7EB] shadow-sm overflow-hidden">
              <div className="p-5 border-b border-[#E5E7EB] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                  <h3
                    className="text-base font-bold text-[#111827]"
                    style={{ fontFamily: PP }}
                  >
                    My Consultation Register
                  </h3>
                  <p className="text-xs text-[#64748B]">
                    Logged-in Doctor active consultation logs
                  </p>
                </div>
                <button
                  onClick={() =>
                    alert("Exporting Performance Register (CSV)...")
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
                      <th className="py-3.5 px-4">Consultation ID</th>
                      <th className="py-3.5 px-4">Patient Name</th>
                      <th className="py-3.5 px-4">MRN</th>
                      <th className="py-3.5 px-4">Appt Date</th>
                      <th className="py-3.5 px-4">Consult Time</th>
                      <th className="py-3.5 px-4">Diagnosis</th>
                      <th className="py-3.5 px-4">Prescription</th>
                      <th className="py-3.5 px-4">Follow-up</th>
                      <th className="py-3.5 px-4 text-center">Status</th>
                      <th className="py-3.5 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E5E7EB] text-xs">
                    {filteredPerformance.length === 0 ? (
                      <tr>
                        <td
                          colSpan={10}
                          className="py-8 text-center text-[#64748B]"
                        >
                          No consultation records match your search or filter
                          criteria.
                        </td>
                      </tr>
                    ) : (
                      filteredPerformance.map((item) => (
                        <tr
                          key={item.consultationId}
                          className="hover:bg-slate-50 transition-colors"
                        >
                          <td className="py-3.5 px-4 font-bold text-[#0D47A1]">
                            {item.consultationId}
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
                            {item.consultationTime}
                          </td>
                          <td className="py-3.5 px-4 text-[#009688] font-medium">
                            {item.diagnosis}
                          </td>
                          <td className="py-3.5 px-4 text-[#111827] font-semibold">
                            {item.prescriptionStatus}
                          </td>
                          <td className="py-3.5 px-4 text-[#64748B]">
                            {item.followUp}
                          </td>
                          <td className="py-3.5 px-4 text-center">
                            <span
                              className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${item.consultationStatus === "Completed" ? "bg-teal-50 text-[#009688] border border-teal-200" : item.consultationStatus === "In Progress" ? "bg-amber-50 text-[#F59E0B] border border-amber-200" : "bg-slate-100 text-[#64748B]"}`}
                            >
                              {item.consultationStatus}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-right">
                            <div className="flex items-center justify-end gap-1">
                              <button
                                onClick={() =>
                                  alert(
                                    `Viewing consultation ${item.consultationId}`,
                                  )
                                }
                                className="p-1.5 text-[#0D47A1] hover:bg-blue-50 rounded-lg transition"
                                title="View Consultation"
                              >
                                <Eye className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() =>
                                  alert(`Viewing patient ${item.patientName}`)
                                }
                                className="p-1.5 text-[#009688] hover:bg-teal-50 rounded-lg transition"
                                title="View Patient"
                              >
                                <Users className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() =>
                                  alert(
                                    `Printing summary for ${item.consultationId}`,
                                  )
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
                  Showing 1 to {filteredPerformance.length} of{" "}
                  {filteredPerformance.length} entries
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
              {filteredPerformance.length} Performance Records
            </strong>
          </div>
          <div>Hospital Management System • Doctor Performance Report v1.0</div>
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
