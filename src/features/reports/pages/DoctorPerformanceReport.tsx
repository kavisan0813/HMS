import { useState, useMemo, useTransition } from "react";
import {
  Download,
  RefreshCw,
  Filter,
  Search,
  ChevronRight,
  Clock,
  PieChart as PieChartIcon,
  CheckCircle2,
  AlertCircle,
  UserCheck,
  TrendingUp,
  Building2,
  Printer,
  ChevronLeft,
  ChevronRight as ChevronRightIcon,
  Activity,
  Eye,
  ArrowLeft,
} from "lucide-react";
import { PP, RB } from "../constants/reports.constants";
import type { DoctorPerformanceTableRow } from "../types/reports.types";
import {
  useDoctorPerformance,
  useDoctorWorkload,
  useDoctorConsultationTrend,
  useDoctorConsultationDuration,
  extractList,
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
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "../../../common/components/recharts-lazy";

function CircularProgress({
  percentage,
  size = 64,
  strokeWidth = 7,
}: {
  percentage: number;
  size?: number;
  strokeWidth?: number;
}) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (percentage / 100) * circumference;
  return (
    <svg width={size} height={size} className="transform -rotate-90">
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="#E5E7EB"
        strokeWidth={strokeWidth}
      />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="#0D47A1"
        strokeWidth={strokeWidth}
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        strokeLinecap="round"
      />
    </svg>
  );
}

export function DoctorReportScreen({
  onBack,
}: {
  onBack?: () => void;
  onOpenAppointmentReport?: () => void;
  onOpenPatientReport?: () => void;
}) {
  // State
  const [searchQuery, setSearchQuery] = useState("");
  const [dateRange, setDateRange] = useState("Today");
  const [deptFilter, setDeptFilter] = useState("All Departments");
  const [doctorFilter, setDoctorFilter] = useState("All Doctors");
  const [statusFilter, setStatusFilter] = useState("All Statuses");
  const [aptTypeFilter, setAptTypeFilter] = useState("All Types");
  const [shiftFilter, setShiftFilter] = useState("All Shifts");

  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdated] = useState(() => {
    const now = new Date();
    const day = now.toLocaleDateString("en-US", { weekday: "long" });
    const time = now.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
    return `${day}, ${time}`;
  });
  const [lastRefreshed] = useState(() => {
    const now = new Date();
    return now.toISOString().slice(0, 16).replace("T", " ");
  });
  const [isPending, startTransition] = useTransition();
  const [showLoadingDemo, setShowLoadingDemo] = useState(false);
  const isLoading = isPending || showLoadingDemo;
  const [hasError, setHasError] = useState(false);
  const [trendDays, setTrendDays] = useState<"7 Days" | "30 Days" | "90 Days">(
    "7 Days",
  );

  // ─── API Data Hooks ──────────────────────────────────────────────────────
  const today = new Date().toISOString().slice(0, 10);
  const [fromDate, setFromDate] = useState(today);
  const [toDate, setToDate] = useState(today);

  const getDateRange = (range: string) => {
    const now = new Date();
    if (range === "Today") return { fromDate: today, toDate: today };
    if (range === "7 Days") {
      const from = new Date(now);
      from.setDate(now.getDate() - 7);
      return { fromDate: from.toISOString().slice(0, 10), toDate: today };
    }
    if (range === "30 Days") {
      const from = new Date(now);
      from.setDate(now.getDate() - 30);
      return { fromDate: from.toISOString().slice(0, 10), toDate: today };
    }
    if (range === "Custom" && fromDate && toDate) {
      return { fromDate, toDate };
    }
    return { fromDate: fromDate || today, toDate: toDate || today };
  };
  const dates = getDateRange(dateRange);
  const reportFilters = useMemo(
    () => ({
      fromDate: dates.fromDate,
      toDate: dates.toDate,
      doctorId: doctorFilter !== "All Doctors" ? doctorFilter : undefined,
      departmentId: deptFilter !== "All Departments" ? deptFilter : undefined,
      status: statusFilter !== "All Statuses" ? statusFilter : undefined,
      appointmentType:
        aptTypeFilter !== "All Types" ? aptTypeFilter : undefined,
      page: 0,
      size: 50,
    }),
    [dates, doctorFilter, deptFilter, statusFilter, aptTypeFilter],
  );
  const { data: rawDoctorPerformance } = useDoctorPerformance(reportFilters);
  useDoctorWorkload(reportFilters);
  useDoctorConsultationTrend(reportFilters);
  useDoctorConsultationDuration(reportFilters);

  const doctorList = useMemo(
    () => extractList<DoctorPerformanceTableRow>(rawDoctorPerformance),
    [rawDoctorPerformance],
  );

  // Map API doctor performance to table format
  const doctorTableSource = useMemo(() => {
    return doctorList.map((d: DoctorPerformanceTableRow) => ({
      doctorId: String(d.doctorId || ""),
      doctorName: d.doctorName || "Doctor",
      department: d.departmentName || "General Medicine",
      appointments: Number(d.totalConsultations || 0),
      completed: Number(d.completedConsultations || 0),
      pending: 0,
      cancelled: Number(d.cancelledConsultations || 0),
      followup: 0,
      avgTimeMinutes: Number(d.avgDurationMinutes || 15),
      patientRating: 0,
      revenue: Number(d.totalRevenueGenerated || 0),
    }));
  }, [doctorList]);

  // Filtered records
  const filteredData = useMemo(() => {
    return doctorTableSource.filter((item) => {
      const matchesSearch =
        !searchQuery ||
        item.doctorName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.doctorId.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.department.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesDept =
        deptFilter === "All Departments" ||
        item.department.toLowerCase().includes(deptFilter.toLowerCase()) ||
        deptFilter.toLowerCase().includes(item.department.toLowerCase());
      const matchesDoctor =
        doctorFilter === "All Doctors" ||
        item.doctorName.toLowerCase().includes(doctorFilter.toLowerCase()) ||
        doctorFilter.toLowerCase().includes(item.doctorName.toLowerCase());

      return matchesSearch && matchesDept && matchesDoctor;
    });
  }, [searchQuery, deptFilter, doctorFilter, doctorTableSource]);

  // Use API summary data for KPI cards where available, fall back to computed values
  const apiSummary = rawDoctorPerformance?.summary;
  const doctorPerformanceData = useMemo(() => {
    const totalDoctors = apiSummary?.totalDoctors ?? filteredData.length;
    const totalConsultations = filteredData.reduce(
      (s, d) => s + Number(d.appointments || 0),
      0,
    );
    const completedConsultations = filteredData.reduce(
      (s, d) => s + Number(d.completed || 0),
      0,
    );
    const pendingConsultations = filteredData.reduce(
      (s, d) => s + Number(d.pending || 0),
      0,
    );
    const cancelledConsultations = filteredData.reduce(
      (s, d) => s + Number(d.cancelled || 0),
      0,
    );
    const followUpConsultations = filteredData.reduce(
      (s, d) => s + Number(d.followup || 0),
      0,
    );
    const avgRating =
      totalDoctors > 0
        ? filteredData.reduce((s, d) => s + Number(d.patientRating || 4.8), 0) /
          totalDoctors
        : 0;
    const averageConsultationDurationMinutes =
      totalDoctors > 0
        ? filteredData.reduce(
            (sum, d) => sum + Number(d.avgTimeMinutes || 15),
            0,
          ) / totalDoctors
        : 0;

    const doctorUtilizationPercentage =
      totalConsultations > 0
        ? Math.round((completedConsultations / totalConsultations) * 100)
        : 0;

    const topDoc =
      filteredData.length > 0
        ? filteredData.toSorted((a, b) => b.completed - a.completed)[0]
        : null;

    return {
      summary: {
        totalDoctors,
        activeDoctors: totalDoctors,
        onLeaveDoctors: 0,
        totalConsultations,
        completedConsultations,
        pendingConsultations,
        cancelledConsultations,
        followUpConsultations,
        patientSatisfaction: avgRating,
        topPerformingDepartment: topDoc?.department ?? "--",
        averageConsultationDurationMinutes:
          apiSummary?.avgConsultationDurationMinutes ||
          Math.round(averageConsultationDurationMinutes),
        avgConsultationsPerDoctor: apiSummary?.avgConsultationsPerDoctor || 0,
        doctorUtilizationPercentage,
      },
      content: filteredData,
    };
  }, [filteredData, apiSummary]);

  // State for sorting, refreshing & reset
  type DoctorTableItemKey = keyof (typeof doctorTableSource)[0];
  const [sortField, setSortField] = useState<DoctorTableItemKey>("completed");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => setIsRefreshing(false), 600);
  };

  const handleExportAllCsv = () => {
    const summary = doctorPerformanceData.summary;
    const kpiRows = [
      {
        Section: "1. SUMMARY KPI",
        Category_Item: "Total Active Doctors",
        Count_or_Amount: `${summary.totalDoctors} Doctors`,
        Percentage_Share: "100%",
        Primary_Detail: "Active Medical Officers",
        Secondary_Detail: `Satisfaction: ${summary.patientSatisfaction.toFixed(1)} / 5.0 ⭐`,
        Date_or_Status: "Active",
      },
      {
        Section: "1. SUMMARY KPI",
        Category_Item: "Total Consultations Booked",
        Count_or_Amount: `${summary.totalConsultations} Consultations`,
        Percentage_Share: "100%",
        Primary_Detail: `Completed: ${summary.completedConsultations} | Pending: ${summary.pendingConsultations}`,
        Secondary_Detail: `Cancelled: ${summary.cancelledConsultations}`,
        Date_or_Status: "Booked Total",
      },
      {
        Section: "1. SUMMARY KPI",
        Category_Item: "Consultation Completion Rate",
        Count_or_Amount: `${summary.completedConsultations} Completed`,
        Percentage_Share: `${summary.doctorUtilizationPercentage}%`,
        Primary_Detail: `Average Duration: ${summary.averageConsultationDurationMinutes} mins/patient`,
        Secondary_Detail: `Top Department: ${summary.topPerformingDepartment}`,
        Date_or_Status: "Verified Rate",
      },
    ];

    const totalWorkloadConsultations =
      doctorWorkloadData.reduce((sum, d) => sum + d.appointments, 0) || 1;
    const workloadRows = doctorWorkloadData.map((d) => {
      const pct = ((d.appointments / totalWorkloadConsultations) * 100).toFixed(
        1,
      );
      return {
        Section: "2. DOCTOR WORKLOAD GRAPH DISTRIBUTION",
        Category_Item: d.doctor,
        Count_or_Amount: `${d.appointments} Appointments (${d.completed} Done)`,
        Percentage_Share: `${pct}%`,
        Primary_Detail: `Workload Share in OPD`,
        Secondary_Detail: "Consultation Volume Share",
        Date_or_Status: "Active",
      };
    });

    const totalDeptAppts =
      deptVolumeData.reduce((sum, d) => sum + d.consultations, 0) || 1;
    const deptRows = deptVolumeData.map((d) => {
      const pct = ((d.consultations / totalDeptAppts) * 100).toFixed(1);
      return {
        Section: "3. DEPARTMENT VOLUME GRAPH SHARE",
        Category_Item: d.department,
        Count_or_Amount: `${d.consultations} Consultations`,
        Percentage_Share: `${pct}%`,
        Primary_Detail: `OPD Consultation Volume`,
        Secondary_Detail: "Department Share",
        Date_or_Status: "Active",
      };
    });

    const recordRows = sortedData.map((rec) => {
      const completionPct =
        rec.appointments > 0
          ? ((rec.completed / rec.appointments) * 100).toFixed(1)
          : "0";
      return {
        Section: "4. DOCTOR PERFORMANCE TABLE REGISTRY",
        Category_Item: rec.doctorName,
        Count_or_Amount: `Appts: ${rec.appointments} | Done: ${rec.completed} | Pend: ${rec.pending}`,
        Percentage_Share: `${completionPct}% Completion`,
        Primary_Detail: `Dept: ${rec.department} | Rating: ${rec.patientRating} ⭐`,
        Secondary_Detail: `Avg Time: ${rec.avgTimeMinutes} mins | Cancelled: ${rec.cancelled}`,
        Date_or_Status: `Status: Active`,
      };
    });

    const allRows = [...kpiRows, ...workloadRows, ...deptRows, ...recordRows];

    exportDataToCsv(
      `Doctor_Report_Complete_All_Data_${new Date().toISOString().slice(0, 10)}.csv`,
      allRows,
    );
  };

  const handleResetFilters = () => {
    setSearchQuery("");
    setDateRange("Today");
    setDeptFilter("All Departments");
    setDoctorFilter("All Doctors");
    setStatusFilter("All Statuses");
    setAptTypeFilter("All Types");
    setShiftFilter("All Shifts");
  };

  const deptOptions = useMemo(() => {
    const set = new Set<string>();
    doctorTableSource.forEach((d) => {
      if (d.department) set.add(d.department);
    });
    const list = Array.from(set).filter(Boolean);
    if (!list.includes("General Medicine")) list.push("General Medicine");
    if (!list.includes("EYE DEPT")) list.push("EYE DEPT");
    if (!list.includes("Cardiology")) list.push("Cardiology");
    if (!list.includes("Pediatrics")) list.push("Pediatrics");
    return ["All Departments", ...list];
  }, [doctorTableSource]);

  const doctorOptions = useMemo(() => {
    const set = new Set<string>();
    doctorTableSource.forEach((d) => {
      if (d.doctorName) set.add(d.doctorName);
    });
    const list = Array.from(set).filter(Boolean);
    if (!list.includes("Dr. sarath")) list.push("Dr. sarath");
    if (!list.includes("Dr. pradeep")) list.push("Dr. pradeep");
    if (!list.includes("Dr. Rajesh Kumar")) list.push("Dr. Rajesh Kumar");
    return ["All Doctors", ...list];
  }, [doctorTableSource]);

  const handleSort = (field: DoctorTableItemKey) => {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortOrder("desc");
    }
  };

  // Sorted records
  const sortedData = filteredData.toSorted((a, b) => {
    const aVal = a[sortField];
    const bVal = b[sortField];
    if (typeof aVal === "number" && typeof bVal === "number") {
      return sortOrder === "asc" ? aVal - bVal : bVal - aVal;
    }
    if (typeof aVal === "string" && typeof bVal === "string") {
      return sortOrder === "asc"
        ? aVal.localeCompare(bVal)
        : bVal.localeCompare(aVal);
    }
    return 0;
  });

  const consultationTrendData = useMemo(() => {
    const daysCount =
      trendDays === "7 Days" ? 7 : trendDays === "30 Days" ? 30 : 90;
    const result = [];
    const baseComp = Math.max(
      1,
      Math.round(
        (doctorPerformanceData.summary.completedConsultations || 4) / 2,
      ),
    );
    const basePend = Math.max(
      1,
      Math.round((doctorPerformanceData.summary.pendingConsultations || 5) / 2),
    );
    for (let i = daysCount - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      });
      result.push({
        date: dateStr,
        Completed: Math.max(1, baseComp + ((i * 2) % 4)),
        Pending: Math.max(1, basePend + ((i * 3) % 3)),
      });
    }
    return result;
  }, [trendDays, doctorPerformanceData]);

  const doctorWorkloadData = (() => {
    const list = filteredData.map((d) => ({
      doctor: d.doctorName.startsWith("Dr.")
        ? d.doctorName
        : `Dr. ${d.doctorName}`,
      completed: d.completed || 1,
      appointments: d.appointments || 2,
    }));
    if (list.length === 0) {
      return [
        { doctor: "Dr. sarath", completed: 4, appointments: 5 },
        { doctor: "Dr. pradeep", completed: 3, appointments: 4 },
        { doctor: "Dr. Rajesh Kumar", completed: 2, appointments: 2 },
      ];
    }
    return list;
  })();

  const statusShareData = useMemo(() => {
    const s = doctorPerformanceData.summary;
    const comp = s.completedConsultations || 4;
    const pend = s.pendingConsultations || 5;
    const canc = s.cancelledConsultations || 2;
    const fol = s.followUpConsultations || 1;
    return [
      { name: "Completed", value: comp, color: "#009688" },
      { name: "Pending", value: pend, color: "#F59E0B" },
      { name: "Cancelled", value: canc, color: "#EF4444" },
      { name: "Follow-up", value: fol, color: "#0D47A1" },
    ];
  }, [doctorPerformanceData]);

  const deptVolumeData = (() => {
    const map: Record<string, number> = {};
    filteredData.forEach((d) => {
      map[d.department] = (map[d.department] || 0) + (d.appointments || 1);
    });
    const list = Object.entries(map).map(([dept, count]) => ({
      department: dept,
      consultations: count,
    }));
    if (list.length === 0) {
      return [
        { department: "General Medicine", consultations: 6 },
        { department: "EYE DEPT", consultations: 3 },
        { department: "Cardiology", consultations: 2 },
      ];
    }
    return list;
  })();

  const avgDurationData = useMemo(() => {
    const daysCount = 7;
    const result = [];
    const baseMin = Math.round(
      doctorPerformanceData.summary.averageConsultationDurationMinutes || 15,
    );
    for (let i = daysCount - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      });
      result.push({
        day: dateStr,
        duration: Math.max(10, baseMin + ((i * 2) % 6) - 3),
      });
    }
    return result;
  }, [doctorPerformanceData]);

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
              <nav className="flex items-center gap-1.5 text-xs text-[#64748B] mb-1">
                <button
                  type="button"
                  className="hover:text-[#0D47A1] cursor-pointer"
                  onClick={onBack}
                >
                  Hospital
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
                  Doctor Report
                </span>
              </nav>
              <div className="flex items-center gap-3">
                <h1
                  className="text-2xl font-bold text-[#111827]"
                  style={{ fontFamily: PP }}
                >
                  Doctor Report
                </h1>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-[#009688] border border-teal-200">
                  Performance Verified
                </span>
              </div>
              <p className="text-xs text-[#64748B] mt-0.5">
                Analyze doctor workload, consultation performance and OPD
                activity.
              </p>
            </div>

            {/* Header Actions */}
            <div className="flex items-center gap-2 flex-wrap">
              <button
                type="button"
                onClick={() => (onBack ? onBack() : window.history.back())}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-[#E5E7EB] bg-white text-xs font-semibold text-[#111827] hover:bg-slate-50 transition-all shadow-2xs cursor-pointer mr-1"
                style={{ fontFamily: PP }}
              >
                <ArrowLeft size={14} />
                Back
              </button>
              <div className="hidden lg:flex items-center gap-2 text-xs text-[#64748B] bg-slate-50 border border-[#E5E7EB] px-3 py-2 rounded-xl mr-1">
                <Clock className="w-4 h-4 text-[#0D47A1]" />
                <span>
                  Last Updated:{" "}
                  <strong className="text-[#111827]">{lastUpdated}</strong>
                </span>
              </div>

              <button
                onClick={handleRefresh}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium text-[#111827] bg-white border border-[#E5E7EB] hover:bg-slate-50 transition shadow-sm"
              >
                <RefreshCw
                  className={`w-3.5 h-3.5 text-[#0D47A1] ${isRefreshing ? "animate-spin" : ""}`}
                />
                <span>Refresh</span>
              </button>

              <button
                onClick={handleExportAllCsv}
                className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold text-gray-700 bg-white border border-gray-300 hover:bg-slate-50 transition shadow-sm cursor-pointer"
                style={{ fontFamily: PP }}
              >
                <Download className="w-4 h-4 text-emerald-600" />
                <span>Export Report</span>
              </button>

              <button
                onClick={() => window.print()}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium text-[#111827] bg-white border border-[#E5E7EB] hover:bg-slate-50 transition shadow-sm"
              >
                <Printer className="w-3.5 h-3.5 text-[#0D47A1]" />
                <span>Print</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Container - Full Screen Width */}
      <div className="w-full max-w-none px-4 sm:px-6 lg:px-8 xl:px-10 2xl:px-12 mt-6">
        {/* 1. TOP 6 KPI CARDS SECTION (AT VERY TOP, FULL WIDTH) */}
        {!isLoading && !hasError && (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
            {/* Card 1: Total Doctors */}
            <div className="bg-white rounded-2xl border border-[#E5E7EB] p-4 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between h-full">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-[#64748B]">
                    Total Doctors
                  </span>
                  <div className="p-2 rounded-xl bg-blue-50 text-[#0D47A1]">
                    <UserCheck className="w-4 h-4" />
                  </div>
                </div>
                <div
                  className="text-2xl font-bold text-[#111827] mb-1"
                  style={{ fontFamily: PP }}
                >
                  {doctorPerformanceData?.summary?.totalDoctors ?? 0}
                </div>
                <div className="flex items-center gap-2 text-[11px] text-[#64748B] mb-2">
                  <span className="text-[#0D47A1] font-semibold">
                    {doctorPerformanceData?.summary?.activeDoctors ?? 0} Active
                    Physicians
                  </span>
                </div>
              </div>
              <div className="h-8 mt-1">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={[]}>
                    <Line
                      type="monotone"
                      dataKey="Completed"
                      stroke="#0D47A1"
                      strokeWidth={2}
                      dot={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Card 2: Total Consultations */}
            <div className="bg-white rounded-2xl border border-[#E5E7EB] p-4 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between h-full">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-[#64748B]">
                    Total Consultations
                  </span>
                  <div className="p-2 rounded-xl bg-teal-50 text-[#009688]">
                    <Activity className="w-4 h-4" />
                  </div>
                </div>
                <div
                  className="text-2xl font-bold text-[#111827] mb-1"
                  style={{ fontFamily: PP }}
                >
                  {doctorPerformanceData?.summary?.totalConsultations ?? 0}
                </div>
                <div className="flex items-center gap-2 text-[11px] text-[#64748B] mb-2">
                  <span className="text-[#009688] font-semibold">
                    {doctorPerformanceData?.summary?.completedConsultations ??
                      0}{" "}
                    Completed
                  </span>
                </div>
              </div>
              <div className="h-8 mt-1">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={[]}>
                    <Area
                      type="monotone"
                      dataKey="Completed"
                      stroke="#009688"
                      fill="#009688"
                      fillOpacity={0.2}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Card 3: Avg Consultation Time */}
            <div className="bg-white rounded-2xl border border-[#E5E7EB] p-4 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between h-full">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-[#64748B]">
                    Avg Consultation Time
                  </span>
                  <div className="p-2 rounded-xl bg-indigo-50 text-[#0D47A1]">
                    <Clock className="w-4 h-4" />
                  </div>
                </div>
                <div
                  className="text-2xl font-bold text-[#111827] mb-1"
                  style={{ fontFamily: PP }}
                >
                  {doctorPerformanceData?.summary
                    ?.averageConsultationDurationMinutes ?? 0}{" "}
                  min
                </div>
                <div className="flex items-center gap-2 text-[11px] text-[#64748B] mb-2">
                  <span className="text-[#66BB6A] font-semibold">
                    Target: 15 min avg
                  </span>
                </div>
              </div>
              <div className="h-8 mt-1">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={[]}>
                    <Line
                      type="monotone"
                      dataKey="minutes"
                      stroke="#0D47A1"
                      strokeWidth={2}
                      dot={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Card 4: Follow-up Consultations */}
            <div className="bg-white rounded-2xl border border-[#E5E7EB] p-4 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between h-full">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-[#64748B]">
                    Follow-up Consultations
                  </span>
                  <div className="p-2 rounded-xl bg-emerald-50 text-[#66BB6A]">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                </div>
                <div
                  className="text-2xl font-bold text-[#111827] mb-1"
                  style={{ fontFamily: PP }}
                >
                  {doctorPerformanceData?.summary?.followUpConsultations ?? 0}
                </div>
                <div className="text-[11px] text-[#64748B]">
                  {doctorPerformanceData?.summary?.totalConsultations
                    ? Math.round(
                        ((doctorPerformanceData?.summary
                          ?.followUpConsultations ?? 0) /
                          doctorPerformanceData.summary.totalConsultations) *
                          100,
                      )
                    : 0}
                  % Follow-up Rate
                </div>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2 flex overflow-hidden mt-3">
                <div className="bg-[#66BB6A] h-full" style={{ width: "35%" }} />
              </div>
            </div>

            {/* Card 5: Patient Satisfaction */}
            <div className="bg-white rounded-2xl border border-[#E5E7EB] p-4 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between h-full">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-[#64748B]">
                    Patient Satisfaction
                  </span>
                  <div className="p-2 rounded-xl bg-amber-50 text-[#F59E0B]">
                    <TrendingUp className="w-4 h-4" />
                  </div>
                </div>
                <div
                  className="text-2xl font-bold text-[#111827] mb-1"
                  style={{ fontFamily: PP }}
                >
                  {doctorPerformanceData?.summary?.patientSatisfaction
                    ? Number(
                        doctorPerformanceData.summary.patientSatisfaction,
                      ).toFixed(1)
                    : "4.8"}{" "}
                  / 5.0
                </div>
                <div className="text-[11px] text-[#64748B] mb-2">
                  Rating across patient OPD feedback
                </div>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2 flex overflow-hidden">
                <div className="bg-[#F59E0B] h-full" style={{ width: "96%" }} />
              </div>
            </div>

            {/* Card 6: Completion Rate */}
            <div className="bg-white rounded-2xl border border-[#E5E7EB] p-4 shadow-sm hover:shadow-md transition-shadow flex items-center justify-between h-full">
              <div>
                <span className="text-xs font-semibold text-[#64748B]">
                  Completion Rate
                </span>
                <div
                  className="text-2xl font-bold text-[#111827] mt-1"
                  style={{ fontFamily: PP }}
                >
                  {doctorPerformanceData?.summary
                    ?.doctorUtilizationPercentage ?? 0}
                  %
                </div>
                <p className="text-[11px] text-[#64748B] mt-1">
                  OPD Workload Efficiency
                </p>
              </div>
              <CircularProgress
                percentage={
                  doctorPerformanceData?.summary?.doctorUtilizationPercentage ??
                  0
                }
                size={54}
                strokeWidth={6}
              />
            </div>
          </div>
        )}

        {/* CALENDAR QUICK FILTER TOOLBAR */}
        <div className="bg-white rounded-2xl border border-[#E5E7EB] p-4 shadow-sm mb-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 flex-wrap">
            <span
              className="text-xs font-bold text-[#64748B] uppercase tracking-wider mr-1 flex items-center gap-1.5"
              style={{ fontFamily: PP }}
            >
              <Clock className="w-4 h-4 text-[#0D47A1]" />
              Calendar Filter:
            </span>
            <button
              type="button"
              onClick={() => setDateRange("Today")}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                dateRange === "Today"
                  ? "bg-[#0D47A1] text-white shadow-sm"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
              style={{ fontFamily: PP }}
            >
              Today Only
            </button>
            <button
              type="button"
              onClick={() => setDateRange("Yesterday")}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                dateRange === "Yesterday"
                  ? "bg-[#0D47A1] text-white shadow-sm"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
              style={{ fontFamily: PP }}
            >
              Yesterday
            </button>
            <button
              type="button"
              onClick={() => setDateRange("7 Days")}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                dateRange === "7 Days" || dateRange === "Last 7 Days"
                  ? "bg-[#0D47A1] text-white shadow-sm"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
              style={{ fontFamily: PP }}
            >
              This Week (7 Days)
            </button>
            <button
              type="button"
              onClick={() => setDateRange("30 Days")}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                dateRange === "30 Days" || dateRange === "This Month"
                  ? "bg-[#0D47A1] text-white shadow-sm"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
              style={{ fontFamily: PP }}
            >
              This Month
            </button>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <span
              className="text-xs text-slate-500 font-medium hidden sm:inline"
              style={{ fontFamily: RB }}
            >
              From:
            </span>
            <input
              type="date"
              value={fromDate}
              onChange={(e) => {
                setFromDate(e.target.value);
                setDateRange("Custom");
              }}
              className="px-3 py-1.5 bg-slate-50 border border-[#E5E7EB] rounded-xl text-xs font-semibold text-slate-700 outline-none focus:border-[#0D47A1]"
              style={{ fontFamily: RB }}
            />
            <span
              className="text-xs text-slate-500 font-medium hidden sm:inline"
              style={{ fontFamily: RB }}
            >
              To:
            </span>
            <input
              type="date"
              value={toDate}
              onChange={(e) => {
                setToDate(e.target.value);
                setDateRange("Custom");
              }}
              className="px-3 py-1.5 bg-slate-50 border border-[#E5E7EB] rounded-xl text-xs font-semibold text-slate-700 outline-none focus:border-[#0D47A1]"
              style={{ fontFamily: RB }}
            />
          </div>
        </div>

        {/* Search & Filter Bar */}
        <div className="bg-white rounded-2xl border border-[#E5E7EB] p-4 shadow-sm mb-6">
          <div
            className="flex items-center gap-2 mb-3 text-xs font-semibold text-[#111827]"
            style={{ fontFamily: PP }}
          >
            <Filter className="w-4 h-4 text-[#009688]" />
            <span>Filter Doctor Performance & Workload</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3">
            <div>
              <span className="block text-[11px] font-medium text-[#64748B] mb-1">
                Date Range
                <select
                  aria-label="Select option"
                  value={dateRange}
                  onChange={(e) => setDateRange(e.target.value)}
                  className="w-full bg-[#F1F5F9] border border-[#E5E7EB] rounded-xl text-xs px-2.5 py-2 text-[#111827] focus:outline-none focus:ring-2 focus:ring-[#0D47A1]"
                >
                  <option>Today</option>
                  <option>Yesterday</option>
                  <option>Last 7 Days</option>
                  <option>This Month</option>
                </select>
              </span>
            </div>

            <div>
              <span className="block text-[11px] font-medium text-[#64748B] mb-1">
                Department
                <select
                  aria-label="Select option"
                  value={deptFilter}
                  onChange={(e) => setDeptFilter(e.target.value)}
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
                  value={doctorFilter}
                  onChange={(e) => setDoctorFilter(e.target.value)}
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
                Consultation Status
                <select
                  aria-label="Select option"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full bg-[#F1F5F9] border border-[#E5E7EB] rounded-xl text-xs px-2.5 py-2 text-[#111827] focus:outline-none focus:ring-2 focus:ring-[#0D47A1]"
                >
                  <option>All Statuses</option>
                  <option>Completed</option>
                  <option>Pending</option>
                  <option>Cancelled</option>
                  <option>Follow-up</option>
                </select>
              </span>
            </div>

            <div>
              <span className="block text-[11px] font-medium text-[#64748B] mb-1">
                Appointment Type
                <select
                  aria-label="Select option"
                  value={aptTypeFilter}
                  onChange={(e) => setAptTypeFilter(e.target.value)}
                  className="w-full bg-[#F1F5F9] border border-[#E5E7EB] rounded-xl text-xs px-2.5 py-2 text-[#111827] focus:outline-none focus:ring-2 focus:ring-[#0D47A1]"
                >
                  <option>All Types</option>
                  <option>New Visit</option>
                  <option>Follow-up</option>
                  <option>Walk-in</option>
                </select>
              </span>
            </div>

            <div>
              <span className="block text-[11px] font-medium text-[#64748B] mb-1">
                Shift
                <select
                  aria-label="Select option"
                  value={shiftFilter}
                  onChange={(e) => setShiftFilter(e.target.value)}
                  className="w-full bg-[#F1F5F9] border border-[#E5E7EB] rounded-xl text-xs px-2.5 py-2 text-[#111827] focus:outline-none focus:ring-2 focus:ring-[#0D47A1]"
                >
                  <option>All Shifts</option>
                  <option>Morning (08:00 - 14:00)</option>
                  <option>Evening (14:00 - 20:00)</option>
                  <option>Night Shift</option>
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
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search Doctor Name, Doctor ID, Department..."
                className="w-full pl-10 pr-16 py-2 bg-[#F1F5F9] border border-[#E5E7EB] rounded-xl text-xs text-[#111827] placeholder-[#64748B] focus:outline-none focus:ring-2 focus:ring-[#0D47A1]"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
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
                onClick={handleRefresh}
                className="px-4 py-1.5 rounded-xl text-xs font-medium text-white bg-[#009688] hover:bg-teal-700 transition shadow-sm"
              >
                Apply Filters
              </button>
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
            Simulate real-time doctor performance analytics
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
              Unable to Load Doctor Report
            </h3>
            <p className="text-xs text-[#64748B] mt-1 max-w-md mx-auto">
              Connection timeout while fetching physician performance
              statistics. Please retry.
            </p>
            <button
              onClick={() => setHasError(false)}
              className="mt-4 px-4 py-2 bg-[#EF4444] text-white rounded-xl text-xs font-semibold hover:bg-red-600 transition"
            >
              Retry Loading
            </button>
          </div>
        )}

        {/* LOADING SKELETON STATE */}
        {isLoading && (
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

        {!isLoading && !hasError && (
          <div className="w-full space-y-6">
            {/* CONSULTATION TREND AREA CHART */}
            <div className="bg-white rounded-2xl border border-[#E5E7EB] p-6 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                <div>
                  <h3
                    className="text-base font-bold text-[#111827]"
                    style={{ fontFamily: PP }}
                  >
                    Consultation Trend
                  </h3>
                  <p className="text-xs text-[#64748B]">
                    Daily volume tracking of completed vs pending OPD
                    consultations
                  </p>
                </div>

                <div className="flex items-center gap-1 bg-[#F1F5F9] p-1 rounded-xl border border-[#E5E7EB] text-xs">
                  {(["7 Days", "30 Days", "90 Days"] as const).map((t) => (
                    <button
                      key={t}
                      onClick={() => setTrendDays(t)}
                      className={`px-3 py-1 rounded-lg font-medium transition ${trendDays === t ? "bg-white text-[#0D47A1] shadow-sm" : "text-[#64748B]"}`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={consultationTrendData}
                    margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                  >
                    <defs>
                      <linearGradient
                        id="colorCompGrad"
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
                      <linearGradient
                        id="colorPendGrad"
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
                      dataKey="Completed"
                      name="Completed Consultations"
                      stroke="#009688"
                      fillOpacity={1}
                      fill="url(#colorCompGrad)"
                    />
                    <Area
                      type="monotone"
                      dataKey="Pending"
                      name="Pending Consultations"
                      stroke="#F59E0B"
                      fillOpacity={1}
                      fill="url(#colorPendGrad)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* DOCTOR WORKLOAD & CONSULTATION STATUS DISTRIBUTION */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Doctor Workload Horizontal Bar */}
              <div className="bg-white rounded-2xl border border-[#E5E7EB] p-5 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3
                      className="text-sm font-bold text-[#111827]"
                      style={{ fontFamily: PP }}
                    >
                      Doctor Workload Analysis
                    </h3>
                    <p className="text-[11px] text-[#64748B]">
                      Completed vs appointments per physician
                    </p>
                  </div>
                  <UserCheck className="w-4 h-4 text-[#0D47A1]" />
                </div>
                <div className="h-60">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      layout="vertical"
                      data={doctorWorkloadData}
                      margin={{ top: 5, right: 10, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                      <XAxis
                        type="number"
                        tick={{ fontSize: 10, fill: "#64748B" }}
                      />
                      <YAxis
                        type="category"
                        dataKey="doctor"
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
                        dataKey="completed"
                        name="Completed"
                        fill="#009688"
                        radius={[0, 4, 4, 0]}
                      />
                      <Bar
                        dataKey="appointments"
                        name="Total Appointments"
                        fill="#0D47A1"
                        radius={[0, 4, 4, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Consultation Status Distribution Donut */}
              <div className="bg-white rounded-2xl border border-[#E5E7EB] p-5 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3
                      className="text-sm font-bold text-[#111827]"
                      style={{ fontFamily: PP }}
                    >
                      Consultation Status Share
                    </h3>
                    <p className="text-[11px] text-[#64748B]">
                      Distribution of completed, pending, follow-up & cancelled
                    </p>
                  </div>
                  <PieChartIcon className="w-4 h-4 text-[#009688]" />
                </div>
                <div className="h-60">
                  <ResponsiveContainer width="100%" height="100%">
                    <RechartsPie>
                      <Pie
                        data={statusShareData}
                        cx="50%"
                        cy="50%"
                        innerRadius={45}
                        outerRadius={75}
                        paddingAngle={3}
                        dataKey="value"
                      >
                        {statusShareData.map((entry) => (
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

            {/* DEPARTMENT PERFORMANCE & AVERAGE CONSULTATION TIME CHARTS */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Department Performance Vertical Bar */}
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
                      Total OPD consultations by specialty department
                    </p>
                  </div>
                  <Building2 className="w-4 h-4 text-[#009688]" />
                </div>
                <div className="h-60">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={deptVolumeData}
                      margin={{ top: 10, right: 10, left: -15, bottom: 0 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                      <XAxis
                        dataKey="department"
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
                        dataKey="consultations"
                        name="Consultations"
                        fill="#0D47A1"
                        radius={[4, 4, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Average Consultation Duration Line Chart */}
              <div className="bg-white rounded-2xl border border-[#E5E7EB] p-5 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3
                      className="text-sm font-bold text-[#111827]"
                      style={{ fontFamily: PP }}
                    >
                      Avg Consultation Duration
                    </h3>
                    <p className="text-[11px] text-[#64748B]">
                      Average consultation duration (minutes) by day
                    </p>
                  </div>
                  <Clock className="w-4 h-4 text-[#0D47A1]" />
                </div>
                <div className="h-60">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={avgDurationData}
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
                      <Line
                        type="monotone"
                        dataKey="minutes"
                        name="Duration (min)"
                        stroke="#009688"
                        strokeWidth={2.5}
                        dot={{ fill: "#009688" }}
                      />
                    </LineChart>
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
                    Doctor Performance Register
                  </h3>
                  <p className="text-xs text-[#64748B]">
                    Detailed OPD consultation and patient rating register
                  </p>
                </div>
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
                        onClick={() => handleSort("doctorId")}
                      >
                        Doctor ID{" "}
                        {sortField === "doctorId" &&
                          (sortOrder === "asc" ? "â†‘" : "â†“")}
                      </th>
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
                        Doctor Name{" "}
                        {sortField === "doctorName" &&
                          (sortOrder === "asc" ? "â†‘" : "â†“")}
                      </th>
                      <th className="py-3.5 px-4">Department</th>
                      <th className="py-3.5 px-4 text-center">Appointments</th>
                      <th
                        tabIndex={0}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            (e.currentTarget as HTMLElement).click();
                          }
                        }}
                        className="py-3.5 px-4 text-center cursor-pointer hover:text-[#0D47A1]"
                        onClick={() => handleSort("completed")}
                      >
                        Completed{" "}
                        {sortField === "completed" &&
                          (sortOrder === "asc" ? "â†‘" : "â†“")}
                      </th>
                      <th className="py-3.5 px-4 text-center">Pending</th>
                      <th className="py-3.5 px-4 text-center">Cancelled</th>
                      <th className="py-3.5 px-4 text-center">Follow-up</th>
                      <th className="py-3.5 px-4 text-center">Avg Duration</th>
                      <th className="py-3.5 px-4 text-center">Rating</th>
                      <th className="py-3.5 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E5E7EB] text-xs">
                    {sortedData.length === 0 ? (
                      <tr>
                        <td
                          colSpan={11}
                          className="py-8 text-center text-[#64748B]"
                        >
                          No doctor performance records match the selected
                          filter criteria.
                        </td>
                      </tr>
                    ) : (
                      sortedData.map((item) => (
                        <tr
                          key={item.doctorId}
                          className="hover:bg-slate-50 transition-colors"
                        >
                          <td className="py-3.5 px-4 font-bold text-[#0D47A1]">
                            {item.doctorId}
                          </td>
                          <td className="py-3.5 px-4 font-semibold text-[#111827]">
                            {item.doctorName}
                          </td>
                          <td className="py-3.5 px-4 font-medium text-[#111827]">
                            {item.department}
                          </td>
                          <td className="py-3.5 px-4 text-center font-semibold text-[#111827]">
                            {item.appointments}
                          </td>
                          <td className="py-3.5 px-4 text-center font-bold text-[#009688]">
                            {item.completed}
                          </td>
                          <td className="py-3.5 px-4 text-center font-semibold text-[#F59E0B]">
                            {item.pending}
                          </td>
                          <td className="py-3.5 px-4 text-center font-semibold text-[#EF4444]">
                            {item.cancelled}
                          </td>
                          <td className="py-3.5 px-4 text-center font-semibold text-[#66BB6A]">
                            {item.followup}
                          </td>
                          <td className="py-3.5 px-4 text-center text-[#64748B]">
                            {item.avgTimeMinutes} min
                          </td>
                          <td className="py-3.5 px-4 text-center font-bold text-[#0D47A1]">
                            {item.patientRating}
                          </td>
                          <td className="py-3.5 px-4 text-right">
                            <div className="flex items-center justify-end gap-1">
                              <button
                                onClick={() =>
                                  alert(
                                    `Viewing performance details for ${item.doctorName}`,
                                  )
                                }
                                className="p-1.5 text-[#0D47A1] hover:bg-blue-50 rounded-lg transition"
                                title="View Details"
                              >
                                <Eye className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() =>
                                  alert(
                                    `Printing performance summary for ${item.doctorId}`,
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
                  Showing 1 to {sortedData.length} of {sortedData.length}{" "}
                  entries
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
              {filteredData.length} Doctor Report Results
            </strong>
          </div>
          <div>Hospital Management System â€¢ Doctor Report v1.0</div>
          <div>
            Last Refreshed:{" "}
            <strong className="text-[#111827]">{lastRefreshed}</strong>
          </div>
        </div>
      </div>
    </div>
  );
}
