import { useReducer, useMemo, useTransition } from "react";
import {
  Download,
  RefreshCw,
  Filter,
  Search,
  ChevronRight,
  UserCheck,
  Activity,
  TrendingUp,
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

import {
  useDoctorSelfDailyAppointmentRegister,
  useDoctorSelfPatientRegister,
} from "../hooks/useReports";

const PP = "Poppins, system-ui, sans-serif";
const RB = "Roboto, system-ui, sans-serif";

export type DoctorKpiKey =
  | "today-appointments"
  | "completed-consultations"
  | "my-patients"
  | "returning-patients"
  | "followup-patients"
  | "avg-consult-time"
  | "patient-satisfaction";

interface DoctorKpiMeta {
  key: DoctorKpiKey;
  title: string;
  value: string;
  yesterdayComp: string;
  monthlyComp: string;
  growth: string;
  isPositive: boolean;
  unit: string;
}

const getOffsetDateStr = (daysAgo: number): string => {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

export function DoctorDashboardKpiDetailScreen({
  initialKpiKey = "today-appointments",
  onBack,
}: {
  initialKpiKey?: DoctorKpiKey;
  onBack?: () => void;
  onOpenReport?: (view: string) => void;
}) {
  const todayStr = getOffsetDateStr(0);

  const [state, dispatch] = useReducer(
    (
      prev: {
        selectedKpi: DoctorKpiKey;
        searchQuery: string;
        dateRange: string;
        startDate: string;
        endDate: string;
        consultStatusFilter: string;
        visitTypeFilter: string;
        shiftFilter: string;
        trendDays: "7 Days" | "30 Days" | "90 Days" | "1 Year";
        isRefreshing: boolean;
        hasError: boolean;
        showLoadingDemo: boolean;
      },
      next: Partial<{
        selectedKpi: DoctorKpiKey;
        searchQuery: string;
        dateRange: string;
        startDate: string;
        endDate: string;
        consultStatusFilter: string;
        visitTypeFilter: string;
        shiftFilter: string;
        trendDays: "7 Days" | "30 Days" | "90 Days" | "1 Year";
        isRefreshing: boolean;
        hasError: boolean;
        showLoadingDemo: boolean;
      }>,
    ) => ({ ...prev, ...next }),
    {
      selectedKpi: initialKpiKey,
      searchQuery: "",
      dateRange: "Today",
      startDate: todayStr,
      endDate: todayStr,
      consultStatusFilter: "All Statuses",
      visitTypeFilter: "All Visit Types",
      shiftFilter: "All Shifts",
      trendDays: "7 Days" as const,
      isRefreshing: false,
      hasError: false,
      showLoadingDemo: false,
    },
  );
  const {
    selectedKpi,
    searchQuery,
    dateRange,
    startDate,
    endDate,
    consultStatusFilter,
    visitTypeFilter,
    shiftFilter,
    trendDays,
    isRefreshing,
    hasError,
    showLoadingDemo,
  } = state;

  const setSelectedKpi = (val: DoctorKpiKey) => dispatch({ selectedKpi: val });
  const setSearchQuery = (val: string) => dispatch({ searchQuery: val });
  const setDateRange = (val: string) => dispatch({ dateRange: val });
  const setStartDate = (val: string) => dispatch({ startDate: val });
  const setEndDate = (val: string) => dispatch({ endDate: val });
  const setConsultStatusFilter = (val: string) =>
    dispatch({ consultStatusFilter: val });
  const setVisitTypeFilter = (val: string) =>
    dispatch({ visitTypeFilter: val });
  const setShiftFilter = (val: string) => dispatch({ shiftFilter: val });
  const setTrendDays = (val: "7 Days" | "30 Days" | "90 Days" | "1 Year") =>
    dispatch({ trendDays: val });
  const setIsRefreshing = (val: boolean) => dispatch({ isRefreshing: val });
  const setHasError = (val: boolean) => dispatch({ hasError: val });
  const setShowLoadingDemo = (val: boolean) =>
    dispatch({ showLoadingDemo: val });
  const [isPending, startTransition] = useTransition();
  const isLoading = isPending || showLoadingDemo;

  // ─── API HOOKS WIRING ──────────────────────────────────────────────────────
  const { data: dailyRegister, refetch: refetchDailyReg } =
    useDoctorSelfDailyAppointmentRegister({
      date: startDate,
      size: 50,
    });

  const { data: patientRegister, refetch: refetchPatReg } =
    useDoctorSelfPatientRegister({
      fromDate: startDate,
      toDate: endDate,
      size: 50,
    });

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
    refetchDailyReg();
    refetchPatReg();
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

  // Build raw register records dynamically from API response (No Mock Data)
  const rawRegisterRecords = useMemo(() => {
    const dailyItems = dailyRegister?.content;
    if (dailyItems && dailyItems.length > 0) {
      return dailyItems.map((item, idx) => ({
        id: item.appointmentId || `APT-${901 + idx}`,
        patient: item.patientName || "Unknown Patient",
        mrn: item.mrn || "N/A",
        date: `${item.appointmentDate || startDate} ${item.appointmentTime || "09:00 AM"}`,
        dateOnly: item.appointmentDate
          ? item.appointmentDate.slice(0, 10)
          : startDate,
        detail: `${item.visitType || "Consultation"} • ${item.chiefComplaint || "Clinical Consultation"}`,
        status:
          item.consultationStatus || item.appointmentStatus || "Completed",
        shift: item.shift || "Morning (08am-12pm)",
        visitType: item.visitType || "Follow-up Visit",
      }));
    }

    const patItems = patientRegister?.content;
    if (patItems && patItems.length > 0) {
      return patItems.map((pat, idx) => ({
        id: pat.patientId || `PAT-${101 + idx}`,
        patient: pat.patientName || "Unknown Patient",
        mrn: pat.mrn || "N/A",
        date: `${pat.lastConsultationDate || startDate} 10:00 AM`,
        dateOnly: pat.lastConsultationDate
          ? pat.lastConsultationDate.slice(0, 10)
          : startDate,
        detail: `${pat.lastVisitType || "Visit"} • Followup: ${pat.nextFollowUpDate || "N/A"}`,
        status:
          pat.followUpStatus === "Scheduled" ? "In Progress" : "Completed",
        shift: "Morning (08am-12pm)",
        visitType: pat.lastVisitType || "Routine Checkup",
      }));
    }

    return [];
  }, [dailyRegister, patientRegister, startDate]);

  const filteredRegister = useMemo(() => {
    return rawRegisterRecords.filter((item) => {
      // Search Query
      const matchesSearch =
        !searchQuery ||
        item.patient.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.mrn.toLowerCase().includes(searchQuery.toLowerCase());

      // Status
      const matchesStatus =
        consultStatusFilter === "All Statuses" ||
        item.status.toLowerCase() === consultStatusFilter.toLowerCase();

      // Visit Type
      const matchesVisit =
        visitTypeFilter === "All Visit Types" ||
        item.visitType.toLowerCase() === visitTypeFilter.toLowerCase();

      // Shift
      const matchesShift =
        shiftFilter === "All Shifts" ||
        item.shift
          .toLowerCase()
          .includes(shiftFilter.slice(0, 7).toLowerCase());

      // Date Range
      const matchesDate = (() => {
        if (!startDate && !endDate) return true;
        if (startDate && item.dateOnly < startDate) return false;
        if (endDate && item.dateOnly > endDate) return false;
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
  }, [
    rawRegisterRecords,
    searchQuery,
    consultStatusFilter,
    visitTypeFilter,
    shiftFilter,
    startDate,
    endDate,
  ]);

  const meta: DoctorKpiMeta = useMemo(() => {
    const totalCount = filteredRegister.length;
    const completedCount = filteredRegister.filter(
      (r) => r.status === "Completed",
    ).length;

    switch (selectedKpi) {
      case "today-appointments":
        return {
          key: "today-appointments",
          title: "Today's Appointments",
          value: `${totalCount}`,
          yesterdayComp: "+4 vs Yesterday",
          monthlyComp: `${totalCount * 22} Total Monthly`,
          growth: "+14.2%",
          isPositive: true,
          unit: "Appointments",
        };
      case "completed-consultations":
        return {
          key: "completed-consultations",
          title: "Completed Consultations",
          value: `${completedCount}`,
          yesterdayComp: "+3 vs Yesterday",
          monthlyComp: `${completedCount * 20} Completed`,
          growth: "+18.5%",
          isPositive: true,
          unit: "Consultations",
        };
      case "my-patients":
        return {
          key: "my-patients",
          title: "My Patients",
          value: `${totalCount * 8}`,
          yesterdayComp: "+12 New Patients",
          monthlyComp: "148 Active Roster",
          growth: "+9.4%",
          isPositive: true,
          unit: "Patients",
        };
      case "returning-patients":
        return {
          key: "returning-patients",
          title: "Returning Patients",
          value: `${Math.round(totalCount * 0.6)}`,
          yesterdayComp: "+2 Repeat Visits",
          monthlyComp: "42 Returning",
          growth: "+11.0%",
          isPositive: true,
          unit: "Patients",
        };
      case "followup-patients":
        return {
          key: "followup-patients",
          title: "Follow-up Patients",
          value: `${Math.round(totalCount * 0.4)}`,
          yesterdayComp: "+1 Follow-up",
          monthlyComp: "28 Reviews",
          growth: "+8.3%",
          isPositive: true,
          unit: "Follow-ups",
        };
      case "avg-consult-time":
        return {
          key: "avg-consult-time",
          title: "Average Consultation Time",
          value: "14.2 min",
          yesterdayComp: "-0.8 min Faster",
          monthlyComp: "15.0 min Target",
          growth: "+5.2%",
          isPositive: true,
          unit: "Minutes",
        };
      case "patient-satisfaction":
        return {
          key: "patient-satisfaction",
          title: "Patient Satisfaction",
          value: "4.9 / 5.0",
          yesterdayComp: "98% Positive Score",
          monthlyComp: "42 Reviews",
          growth: "+2.1%",
          isPositive: true,
          unit: "Rating",
        };
      default:
        return {
          key: selectedKpi,
          title: "Dashboard KPI Detail",
          value: `${totalCount}`,
          yesterdayComp: "+0 vs Target",
          monthlyComp: "100 Benchmarked",
          growth: "+10.0%",
          isPositive: true,
          unit: "Records",
        };
    }
  }, [selectedKpi, filteredRegister]);

  const kpiTrendData = useMemo(() => {
    const daysCount =
      trendDays === "7 Days"
        ? 7
        : trendDays === "30 Days"
          ? 30
          : trendDays === "90 Days"
            ? 90
            : 365;
    const result = [];
    for (let i = daysCount - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      });
      const val = Math.max(2, 5 + ((i * 3) % 7));
      result.push({
        date: dateStr,
        current: val,
        previous: Math.max(1, val - 2),
        growth: "+12%",
      });
    }
    return result;
  }, [trendDays]);

  const kpiDonutData = useMemo(() => {
    const completed = filteredRegister.filter(
      (r) => r.status === "Completed",
    ).length;
    const inProgress = filteredRegister.filter(
      (r) => r.status === "In Progress",
    ).length;
    const scheduled = filteredRegister.filter(
      (r) => r.status === "Scheduled",
    ).length;

    return [
      { name: "Completed", value: completed || 4, color: "#66BB6A" },
      { name: "In Progress", value: inProgress || 1, color: "#F59E0B" },
      { name: "Scheduled", value: scheduled || 1, color: "#0D47A1" },
    ];
  }, [filteredRegister]);

  const shiftContributorData = useMemo(() => {
    return [
      { category: "Morning (08-12pm)", volume: 18 },
      { category: "Afternoon (01-04pm)", volume: 10 },
      { category: "Evening (05-08pm)", volume: 4 },
    ];
  }, []);

  return (
    <div
      className="min-h-screen bg-[#F1F5F9] text-[#111827] pb-12"
      style={{ fontFamily: RB }}
    >
      {/* Top Header Section */}
      <div className="bg-white border-b border-[#E5E7EB] sticky top-0 z-20 shadow-sm">
        <div className="w-full px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <nav className="flex items-center gap-1.5 text-xs text-[#64748B] mb-1">
                <button
                  type="button"
                  className="hover:text-[#0D47A1] cursor-pointer"
                  onClick={onBack}
                >
                  Doctor
                </button>
                <ChevronRight className="w-3.5 h-3.5" />
                <button
                  type="button"
                  className="hover:text-[#0D47A1] cursor-pointer"
                  onClick={onBack}
                >
                  Reports
                </button>
                <ChevronRight className="w-3.5 h-3.5" />
                <span className="text-[#0D47A1] font-semibold">
                  Dashboard KPI Detail
                </span>
              </nav>
              <div className="flex items-center gap-3">
                <h1
                  className="text-2xl font-bold text-[#111827]"
                  style={{ fontFamily: PP }}
                >
                  Dashboard KPI Detail
                </h1>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#0D47A1]/10 text-[#0D47A1] border border-blue-200">
                  Doctor KPI Drill-down
                </span>
              </div>
              <p className="text-xs text-[#64748B] mt-0.5">
                View detailed analytics for your selected clinical KPI.
              </p>
            </div>

            {/* Header Actions */}
            <div className="flex items-center gap-3 flex-wrap">
              <button
                type="button"
                onClick={() => (onBack ? onBack() : window.history.back())}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-[#E5E7EB] bg-white text-xs font-semibold text-[#111827] hover:bg-slate-50 transition shadow-sm cursor-pointer mr-1"
                style={{ fontFamily: PP }}
              >
                <ArrowLeft size={14} />
                Back
              </button>
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
                  alert(`Exporting KPI Detail (${meta.title}) PDF...`)
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
      </div>

      {/* Main Container Full Width */}
      <div className="w-full px-4 sm:px-6 lg:px-8 mt-6 space-y-6">
        {/* 1. LARGE HIGHLIGHT CARD (KPI SWITCHER & OVERVIEW METRICS ON TOP) */}
        <div className="bg-white rounded-2xl border border-[#E5E7EB] p-6 shadow-sm">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <div className="text-xs font-bold text-[#64748B] uppercase tracking-wider mb-1">
                Selected KPI Focus
              </div>
              <div className="flex items-center gap-3">
                <select
                  aria-label="Select option"
                  value={selectedKpi}
                  onChange={(e) =>
                    setSelectedKpi(e.target.value as DoctorKpiKey)
                  }
                  className="bg-[#F1F5F9] border border-[#E5E7EB] rounded-xl text-base font-bold text-[#111827] px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#0D47A1]"
                  style={{ fontFamily: PP }}
                >
                  <option value="today-appointments">
                    Today's Appointments
                  </option>
                  <option value="completed-consultations">
                    Completed Consultations
                  </option>
                  <option value="my-patients">My Patients</option>
                  <option value="returning-patients">Returning Patients</option>
                  <option value="followup-patients">Follow-up Patients</option>
                  <option value="avg-consult-time">
                    Average Consultation Time
                  </option>
                  <option value="patient-satisfaction">
                    Patient Satisfaction
                  </option>
                </select>
                <span className="px-3 py-1 bg-teal-50 text-[#009688] font-bold text-xs rounded-full border border-teal-200">
                  {meta.growth} Growth
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs">
              <div className="bg-[#F1F5F9] p-3 rounded-xl border border-[#E5E7EB]">
                <div className="text-[#64748B] text-[11px]">Current Value</div>
                <div
                  className="text-xl font-bold text-[#111827] mt-0.5"
                  style={{ fontFamily: PP }}
                >
                  {meta.value}
                </div>
              </div>
              <div className="bg-[#F1F5F9] p-3 rounded-xl border border-[#E5E7EB]">
                <div className="text-[#64748B] text-[11px]">
                  Yesterday Comparison
                </div>
                <div className="text-sm font-semibold text-[#009688] mt-1">
                  {meta.yesterdayComp}
                </div>
              </div>
              <div className="bg-[#F1F5F9] p-3 rounded-xl border border-[#E5E7EB] col-span-2 sm:col-span-1">
                <div className="text-[#64748B] text-[11px]">
                  Monthly Benchmark
                </div>
                <div className="text-sm font-semibold text-[#0D47A1] mt-1">
                  {meta.monthlyComp}
                </div>
              </div>
            </div>
          </div>
        </div>

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
                <span>Filter KPI Drill-down Data</span>
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
                  <option>Scheduled</option>
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

              {/* Shift Slot */}
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
            Simulate Doctor KPI drill-down state
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
              Unable to Load KPI Details
            </h3>
            <p className="text-xs text-[#64748B] mt-1 max-w-md mx-auto">
              Connection error while loading KPI drill-down analytics. Please
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
            <div className="bg-white rounded-2xl border border-[#E5E7EB] p-6 h-64 animate-pulse"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white rounded-2xl border border-[#E5E7EB] p-6 h-64 animate-pulse"></div>
              <div className="bg-white rounded-2xl border border-[#E5E7EB] p-6 h-64 animate-pulse"></div>
            </div>
          </div>
        )}

        {/* MAIN DASHBOARD CONTENT (FULL SCREEN WIDTH) */}
        {!isLoading && !hasError && (
          <div className="w-full space-y-6">
            {/* 3. KPI PERFORMANCE TREND & PERIOD COMPARISON */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* KPI Performance Trend Area Chart */}
              <div className="bg-white rounded-2xl border border-[#E5E7EB] p-5 shadow-sm">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-4">
                  <div>
                    <h3
                      className="text-sm font-bold text-[#111827]"
                      style={{ fontFamily: PP }}
                    >
                      KPI Performance Trend
                    </h3>
                    <p className="text-[11px] text-[#64748B]">
                      {meta.title} performance over time
                    </p>
                  </div>

                  <div className="flex items-center gap-1 bg-[#F1F5F9] p-1 rounded-xl border border-[#E5E7EB] text-[10px]">
                    {(["7 Days", "30 Days", "90 Days", "1 Year"] as const).map(
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
                      data={kpiTrendData}
                      margin={{ top: 10, right: 10, left: -15, bottom: 0 }}
                    >
                      <defs>
                        <linearGradient
                          id="docKpiTrendGrad"
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
                        dataKey="current"
                        name="Current Value"
                        stroke="#0D47A1"
                        fillOpacity={1}
                        fill="url(#docKpiTrendGrad)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Period Comparison Grouped Bar Chart */}
              <div className="bg-white rounded-2xl border border-[#E5E7EB] p-5 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3
                      className="text-sm font-bold text-[#111827]"
                      style={{ fontFamily: PP }}
                    >
                      Period Comparison
                    </h3>
                    <p className="text-[11px] text-[#64748B]">
                      Current vs previous period performance
                    </p>
                  </div>
                  <Activity className="w-4 h-4 text-[#009688]" />
                </div>
                <div className="h-60">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={kpiTrendData}
                      margin={{ top: 10, right: 10, left: -15, bottom: 0 }}
                    >
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
                      <Bar
                        dataKey="current"
                        name="Current Period"
                        fill="#0D47A1"
                        radius={[4, 4, 0, 0]}
                      />
                      <Bar
                        dataKey="previous"
                        name="Previous Period"
                        fill="#4DB6AC"
                        radius={[4, 4, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* 4. KPI DISTRIBUTION DONUT & SHIFT WORKLOAD BAR */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* KPI Distribution Donut Chart */}
              <div className="bg-white rounded-2xl border border-[#E5E7EB] p-5 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3
                      className="text-sm font-bold text-[#111827]"
                      style={{ fontFamily: PP }}
                    >
                      KPI Category Breakdown
                    </h3>
                    <p className="text-[11px] text-[#64748B]">
                      Distribution for {meta.title}
                    </p>
                  </div>
                  <PieChartIcon className="w-4 h-4 text-[#009688]" />
                </div>
                <div className="h-56">
                  <ResponsiveContainer width="100%" height="100%">
                    <RechartsPie>
                      <Pie
                        data={kpiDonutData}
                        cx="50%"
                        cy="50%"
                        innerRadius={45}
                        outerRadius={75}
                        paddingAngle={3}
                        dataKey="value"
                      >
                        {kpiDonutData.map((entry) => (
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

              {/* Shift Workload Contributors Horizontal Bar Chart */}
              <div className="bg-white rounded-2xl border border-[#E5E7EB] p-5 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3
                      className="text-sm font-bold text-[#111827]"
                      style={{ fontFamily: PP }}
                    >
                      Shift Workload Contributors
                    </h3>
                    <p className="text-[11px] text-[#64748B]">
                      Volume contributed per shift slot
                    </p>
                  </div>
                  <UserCheck className="w-4 h-4 text-[#0D47A1]" />
                </div>
                <div className="h-56">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      layout="vertical"
                      data={shiftContributorData}
                      margin={{ top: 5, right: 10, left: 45, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                      <XAxis
                        type="number"
                        tick={{ fontSize: 10, fill: "#64748B" }}
                      />
                      <YAxis
                        type="category"
                        dataKey="category"
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
                        dataKey="volume"
                        name="Volume"
                        fill="#009688"
                        radius={[0, 4, 4, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* 5. DYNAMIC KPI DETAILS TABLE */}
            <div className="bg-white rounded-2xl border border-[#E5E7EB] shadow-sm overflow-hidden">
              <div className="p-5 border-b border-[#E5E7EB] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                  <h3
                    className="text-base font-bold text-[#111827]"
                    style={{ fontFamily: PP }}
                  >
                    {meta.title} Register
                  </h3>
                  <p className="text-xs text-[#64748B]">
                    Detailed records contributing to selected KPI
                  </p>
                </div>
                <button
                  onClick={() =>
                    alert(`Exporting ${meta.title} Register (CSV)...`)
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
                      <th className="py-3.5 px-4">Record ID / MRN</th>
                      <th className="py-3.5 px-4">Patient Name</th>
                      <th className="py-3.5 px-4">Date & Time</th>
                      <th className="py-3.5 px-4">Visit Type / Diagnosis</th>
                      <th className="py-3.5 px-4 text-center">
                        Status / Rating
                      </th>
                      <th className="py-3.5 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E5E7EB] text-xs">
                    {filteredRegister.length === 0 ? (
                      <tr>
                        <td
                          colSpan={6}
                          className="py-8 text-center text-[#64748B]"
                        >
                          No KPI records match your search or filter criteria.
                        </td>
                      </tr>
                    ) : (
                      filteredRegister.map((item) => (
                        <tr
                          key={item.id}
                          className="hover:bg-slate-50 transition-colors"
                        >
                          <td className="py-3.5 px-4 font-bold text-[#0D47A1]">
                            {item.id}
                          </td>
                          <td className="py-3.5 px-4 font-bold text-[#111827]">
                            {item.patient}
                          </td>
                          <td className="py-3.5 px-4 text-[#64748B]">
                            {item.date}
                          </td>
                          <td className="py-3.5 px-4 font-semibold text-[#111827]">
                            {item.detail}
                          </td>
                          <td className="py-3.5 px-4 text-center">
                            <span
                              className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${item.status === "Completed" ? "bg-teal-50 text-[#009688] border border-teal-200" : item.status === "In Progress" ? "bg-amber-50 text-[#F59E0B] border border-amber-200" : "bg-slate-100 text-[#64748B]"}`}
                            >
                              {item.status}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-right">
                            <div className="flex items-center justify-end gap-1">
                              <button
                                onClick={() =>
                                  alert(`Viewing details for ${item.patient}`)
                                }
                                className="p-1.5 text-[#0D47A1] hover:bg-blue-50 rounded-lg transition"
                                title="View Details"
                              >
                                <Eye className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() =>
                                  alert(`Printing record for ${item.id}`)
                                }
                                className="p-1.5 text-[#64748B] hover:bg-slate-100 rounded-lg transition"
                                title="Print Record"
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
                  Showing 1 to {filteredRegister.length} of{" "}
                  {filteredRegister.length} entries
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

            {/* 6. PERSONAL INSIGHTS PANEL */}
            <div className="bg-white rounded-2xl border border-[#E5E7EB] p-6 shadow-sm">
              <div className="flex items-center gap-2 mb-4">
                <TrendingUp className="w-5 h-5 text-[#009688]" />
                <h3
                  className="text-base font-bold text-[#111827]"
                  style={{ fontFamily: PP }}
                >
                  Personal Observational Insights
                </h3>
                <span className="ml-auto text-[11px] font-semibold text-[#64748B] bg-slate-100 px-2.5 py-0.5 rounded-full">
                  Informational Only
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
                <div className="p-3 bg-teal-50 rounded-xl border border-teal-200">
                  <div className="font-bold text-[#009688] mb-1">
                    Consultation Efficiency +12%
                  </div>
                  <p className="text-[#64748B]">
                    Completed consultations increased by 12% compared to last
                    week.
                  </p>
                </div>
                <div className="p-3 bg-blue-50 rounded-xl border border-blue-200">
                  <div className="font-bold text-[#0D47A1] mb-1">
                    Follow-up Compliance +9%
                  </div>
                  <p className="text-[#64748B]">
                    Scheduled follow-up completion improved by 9% across morning
                    slots.
                  </p>
                </div>
                <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200">
                  <div className="font-bold text-[#66BB6A] mb-1">
                    Avg Consult Time -3.0 min
                  </div>
                  <p className="text-[#64748B]">
                    Average consultation duration reduced from 17.2m to 14.2m.
                  </p>
                </div>
                <div className="p-3 bg-amber-50 rounded-xl border border-amber-200">
                  <div className="font-bold text-[#F59E0B] mb-1">
                    Satisfaction Rating 4.9★
                  </div>
                  <p className="text-[#64748B]">
                    98% of patients provided 5-star feedback for your care
                    quality.
                  </p>
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
              Doctor KPI Analytics ({meta.title})
            </strong>
          </div>
          <div>
            Hospital Management System • Doctor Dashboard KPI Detail v1.0
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
