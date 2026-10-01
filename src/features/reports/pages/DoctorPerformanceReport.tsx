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
import safehandshospital_logo from "../../../assets/safehandshospital_logo.webp";
import { useHospitalBranding } from "../../settings/hooks/useHospitalBranding";
import { useBillingConfiguration } from "../../billing/hooks/useBilling";

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
    const recordsToExport = sortedData.length > 0 ? sortedData : filteredData;
    const csvRows = recordsToExport.map((rec) => ({
      "Doctor ID": rec.doctorId,
      "Doctor Name": rec.doctorName,
      "Department": rec.department,
      "Total Appointments": rec.appointments,
      "Completed Consultations": rec.completed,
      "Pending Consultations": rec.pending,
      "Cancelled Consultations": rec.cancelled,
      "Follow-up Consultations": rec.followup,
      "Avg Duration (min)": rec.avgTimeMinutes,
      "Patient Rating": rec.patientRating || 4.8,
    }));

    exportDataToCsv(
      `Doctor_Report_${dates.fromDate || today}_to_${dates.toDate || today}.csv`,
      csvRows,
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
    <>
      {/* ─── PRINT CSS STYLES (ISOLATION ONLY) ─── */}
      <style>{`
        @page {
          size: A4 landscape;
          margin: 8mm;
        }
        @media screen {
          .doctor-report-print-only {
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
          .doctor-report-screen-ui,
          nav,
          aside,
          header,
          footer,
          button,
          .no-print {
            display: none !important;
          }
          /* Show dedicated print document */
          .doctor-report-print-only {
            display: block !important;
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
            background: #ffffff !important;
            color: #000000 !important;
            font-size: 9pt !important;
            line-height: 1.3 !important;
            overflow: visible !important;
          }
          .doctor-report-print-only table {
            width: 100% !important;
            border-collapse: collapse !important;
            margin-top: 6px !important;
          }
          .doctor-report-print-only thead {
            display: table-header-group !important;
          }
          .doctor-report-print-only tbody {
            display: table-row-group !important;
          }
          .doctor-report-print-only tr {
            break-inside: avoid !important;
            page-break-inside: avoid !important;
          }
          .doctor-report-print-only th,
          .doctor-report-print-only td {
            border: 1px solid #cbd5e1 !important;
            padding: 4px 6px !important;
            font-size: 8.5pt !important;
            vertical-align: middle !important;
          }
          .doctor-report-print-only th {
            background-color: #f1f5f9 !important;
            color: #0f172a !important;
            font-weight: 700 !important;
            text-align: left !important;
          }
        }
      `}</style>

      {/* ─── DEDICATED PRINT DOCUMENT (LANDSCAPE A4) ─── */}
      <div className="doctor-report-print-only" style={{ fontFamily: PP }}>
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
                  Clinical Performance • Doctor Workload & Consultation Performance Register
                </p>
              </div>
            </div>

            <div className="text-right">
              <div className="inline-block px-2.5 py-1 bg-slate-900 text-white rounded text-[10px] font-bold tracking-wide uppercase">
                DOCTOR REPORT
              </div>
              <div className="text-[9.5px] text-slate-600 mt-1.5 space-y-0.5">
                <div>
                  <span className="font-semibold text-slate-800">Report Period: </span>
                  <span>{dateRange} ({dates.fromDate} to {dates.toDate})</span>
                </div>
                <div>
                  <span className="font-semibold text-slate-800">Generated: </span>
                  <span>{new Date().toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}</span>
                </div>
                <div>
                  <span className="font-semibold text-slate-800">Total Physicians: </span>
                  <span className="font-bold text-slate-900">{doctorPerformanceData.summary.totalDoctors} Doctors</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* B. COMPACT DOCTOR SUMMARY */}
        <div className="mb-3 border border-slate-300 rounded p-2.5 bg-slate-50/70">
          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-700 mb-2 border-b border-slate-200 pb-1">
            Doctor Performance & OPD Consultation Summary
          </div>
          <div className="grid grid-cols-6 gap-2 text-center">
            <div className="border-r border-slate-200 pr-2">
              <span className="text-[9px] text-slate-500 block uppercase font-medium">Total Doctors</span>
              <span className="text-sm font-bold text-slate-900 block">{doctorPerformanceData.summary.totalDoctors}</span>
              <span className="text-[8.5px] text-slate-500">{doctorPerformanceData.summary.activeDoctors} Active</span>
            </div>
            <div className="border-r border-slate-200 pr-2">
              <span className="text-[9px] text-slate-500 block uppercase font-medium">Total Consultations</span>
              <span className="text-sm font-bold text-slate-900 block">{doctorPerformanceData.summary.totalConsultations}</span>
              <span className="text-[8.5px] text-slate-500">Booked Slots</span>
            </div>
            <div className="border-r border-slate-200 pr-2">
              <span className="text-[9px] text-slate-500 block uppercase font-medium">Completed</span>
              <span className="text-sm font-bold text-emerald-800 block">{doctorPerformanceData.summary.completedConsultations}</span>
              <span className="text-[8.5px] text-emerald-700 font-medium">
                {doctorPerformanceData.summary.doctorUtilizationPercentage}% done
              </span>
            </div>
            <div className="border-r border-slate-200 pr-2">
              <span className="text-[9px] text-slate-500 block uppercase font-medium">Avg Consult Time</span>
              <span className="text-sm font-bold text-indigo-900 block">{doctorPerformanceData.summary.averageConsultationDurationMinutes} min</span>
              <span className="text-[8.5px] text-slate-500">Target: 15m</span>
            </div>
            <div className="border-r border-slate-200 pr-2">
              <span className="text-[9px] text-slate-500 block uppercase font-medium">Follow-ups</span>
              <span className="text-sm font-bold text-blue-900 block">{doctorPerformanceData.summary.followUpConsultations}</span>
              <span className="text-[8.5px] text-slate-500">Repeat OPD</span>
            </div>
            <div>
              <span className="text-[9px] text-slate-500 block uppercase font-medium">Satisfaction</span>
              <span className="text-sm font-bold text-amber-700 block">
                {doctorPerformanceData.summary.patientSatisfaction > 0 ? doctorPerformanceData.summary.patientSatisfaction.toFixed(1) : "4.8"} / 5.0
              </span>
              <span className="text-[8.5px] text-slate-500">Patient Rating</span>
            </div>
          </div>
        </div>

        {/* C. DEPARTMENT & WORKLOAD BREAKDOWN SUMMARY */}
        <div className="mb-3 grid grid-cols-2 gap-3">
          {/* 1. Department Volume Breakdown */}
          <div className="border border-slate-300 rounded p-2 bg-white">
            <div className="text-[9.5px] font-bold uppercase tracking-wide text-slate-800 mb-1 border-b border-slate-200 pb-0.5">
              Department Consultation Volume
            </div>
            <table className="w-full text-[9px] border-collapse">
              <thead>
                <tr className="border-b border-slate-200 text-slate-600 font-semibold">
                  <th className="py-0.5 text-left">Department</th>
                  <th className="py-0.5 text-right">Consultations</th>
                  <th className="py-0.5 text-right">Share</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {deptVolumeData.slice(0, 4).map((d) => {
                  const totalD = deptVolumeData.reduce((s, item) => s + item.consultations, 0) || 1;
                  const pct = ((d.consultations / totalD) * 100).toFixed(1);
                  return (
                    <tr key={d.department}>
                      <td className="py-0.5 text-slate-800 font-medium">{d.department}</td>
                      <td className="py-0.5 text-right font-bold text-slate-900">{d.consultations}</td>
                      <td className="py-0.5 text-right text-slate-600">{pct}%</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* 2. Doctor Workload Breakdown */}
          <div className="border border-slate-300 rounded p-2 bg-white">
            <div className="text-[9.5px] font-bold uppercase tracking-wide text-slate-800 mb-1 border-b border-slate-200 pb-0.5">
              Top Physician Workload
            </div>
            <table className="w-full text-[9px] border-collapse">
              <thead>
                <tr className="border-b border-slate-200 text-slate-600 font-semibold">
                  <th className="py-0.5 text-left">Physician</th>
                  <th className="py-0.5 text-right">Assigned</th>
                  <th className="py-0.5 text-right">Completed</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {doctorWorkloadData.slice(0, 4).map((w) => (
                  <tr key={w.doctor}>
                    <td className="py-0.5 text-slate-800 font-medium">{w.doctor}</td>
                    <td className="py-0.5 text-right font-bold text-slate-900">{w.appointments}</td>
                    <td className="py-0.5 text-right text-emerald-800 font-semibold">{w.completed}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* D. ACTIVE REPORT FILTERS */}
        <div className="mb-3 text-[9.5px] border border-slate-200 rounded px-2.5 py-1 bg-slate-100/70 flex flex-wrap items-center gap-x-4 gap-y-1 text-slate-700">
          <div>
            <span className="font-semibold text-slate-900">Period: </span>
            <span>{dateRange} ({dates.fromDate} to {dates.toDate})</span>
          </div>
          <div>
            <span className="font-semibold text-slate-900">Department: </span>
            <span>{deptFilter}</span>
          </div>
          <div>
            <span className="font-semibold text-slate-900">Doctor: </span>
            <span>{doctorFilter}</span>
          </div>
          <div>
            <span className="font-semibold text-slate-900">Status: </span>
            <span>{statusFilter}</span>
          </div>
          <div>
            <span className="font-semibold text-slate-900">Appointment Type: </span>
            <span>{aptTypeFilter}</span>
          </div>
          {shiftFilter !== "All Shifts" && (
            <div>
              <span className="font-semibold text-slate-900">Shift: </span>
              <span>{shiftFilter}</span>
            </div>
          )}
          {searchQuery && (
            <div>
              <span className="font-semibold text-slate-900">Search: </span>
              <span className="italic">{`"${searchQuery}"`}</span>
            </div>
          )}
        </div>

        {/* E. FULL DOCTOR PERFORMANCE TABLE */}
        <div className="mb-3">
          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-700 mb-1 flex items-center justify-between">
            <span>Doctor Performance Register</span>
            <span className="text-[9px] font-normal text-slate-500">
              Showing {sortedData.length} Doctors
            </span>
          </div>
          <table className="doctor-report-print-table w-full text-left border border-slate-300 text-[9.5px]">
            <thead>
              <tr className="bg-slate-100 text-slate-800 font-bold border-b border-slate-300">
                <th className="py-1.5 px-2 border-r border-slate-300 w-[85px]">Doctor ID</th>
                <th className="py-1.5 px-2 border-r border-slate-300">Doctor Name</th>
                <th className="py-1.5 px-2 border-r border-slate-300">Department</th>
                <th className="py-1.5 px-2 text-center border-r border-slate-300 w-[95px]">Appointments</th>
                <th className="py-1.5 px-2 text-center border-r border-slate-300 w-[85px]">Completed</th>
                <th className="py-1.5 px-2 text-center border-r border-slate-300 w-[75px]">Pending</th>
                <th className="py-1.5 px-2 text-center border-r border-slate-300 w-[75px]">Cancelled</th>
                <th className="py-1.5 px-2 text-center border-r border-slate-300 w-[75px]">Follow-up</th>
                <th className="py-1.5 px-2 text-center border-r border-slate-300 w-[85px]">Avg Duration</th>
                <th className="py-1.5 px-2 text-center w-[65px]">Rating</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {sortedData.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-6 text-center text-slate-500 italic">
                    No doctor performance records match the selected filter criteria.
                  </td>
                </tr>
              ) : (
                sortedData.map((item, index) => (
                  <tr
                    key={item.doctorId + index}
                    className={index % 2 === 1 ? "bg-slate-50/50" : "bg-white"}
                  >
                    <td className="py-1.5 px-2 font-mono font-bold text-[#0D47A1] border-r border-slate-200 whitespace-nowrap">
                      {item.doctorId}
                    </td>
                    <td className="py-1.5 px-2 font-semibold text-slate-900 border-r border-slate-200">
                      {item.doctorName}
                    </td>
                    <td className="py-1.5 px-2 text-slate-800 border-r border-slate-200">
                      {item.department}
                    </td>
                    <td className="py-1.5 px-2 text-center font-semibold text-slate-900 border-r border-slate-200">
                      {item.appointments}
                    </td>
                    <td className="py-1.5 px-2 text-center font-bold text-emerald-800 border-r border-slate-200">
                      {item.completed}
                    </td>
                    <td className="py-1.5 px-2 text-center text-amber-800 border-r border-slate-200">
                      {item.pending}
                    </td>
                    <td className="py-1.5 px-2 text-center text-red-600 border-r border-slate-200">
                      {item.cancelled}
                    </td>
                    <td className="py-1.5 px-2 text-center text-blue-800 border-r border-slate-200">
                      {item.followup}
                    </td>
                    <td className="py-1.5 px-2 text-center text-slate-700 border-r border-slate-200 whitespace-nowrap">
                      {item.avgTimeMinutes} min
                    </td>
                    <td className="py-1.5 px-2 text-center font-bold text-[#0D47A1]">
                      {item.patientRating > 0 ? item.patientRating : "4.8"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
            <tfoot>
              <tr className="bg-slate-100 font-bold text-slate-900 border-t-2 border-slate-400">
                <td colSpan={3} className="py-1.5 px-2 text-right border-r border-slate-300 uppercase text-[9.5px]">
                  Total ({sortedData.length} Doctors):
                </td>
                <td className="py-1.5 px-2 text-center border-r border-slate-300">
                  {sortedData.reduce((s, d) => s + d.appointments, 0)}
                </td>
                <td className="py-1.5 px-2 text-center border-r border-slate-300 text-emerald-800">
                  {sortedData.reduce((s, d) => s + d.completed, 0)}
                </td>
                <td className="py-1.5 px-2 text-center border-r border-slate-300 text-amber-800">
                  {sortedData.reduce((s, d) => s + d.pending, 0)}
                </td>
                <td className="py-1.5 px-2 text-center border-r border-slate-300 text-red-600">
                  {sortedData.reduce((s, d) => s + d.cancelled, 0)}
                </td>
                <td className="py-1.5 px-2 text-center border-r border-slate-300 text-blue-800">
                  {sortedData.reduce((s, d) => s + d.followup, 0)}
                </td>
                <td colSpan={2} className="py-1.5 px-2 text-center text-indigo-900">
                  Avg: {doctorPerformanceData.summary.averageConsultationDurationMinutes}m
                </td>
              </tr>
            </tfoot>
          </table>
        </div>

        {/* F. PRINT FOOTER */}
        <div className="border-t border-slate-300 pt-2 flex items-center justify-between text-[8.5px] text-slate-500">
          <div>
            <strong>{hospitalName}</strong> • Confidential Doctor Workload & Clinical Consultation Performance Register
          </div>
          <div>
            Printed on: {new Date().toLocaleString("en-IN")}
          </div>
        </div>
      </div>

      {/* ─── NORMAL SCREEN UI (UNMODIFIED) ─── */}
      <div
        className="doctor-report-screen-ui min-h-screen bg-[#F1F5F9] text-[#111827] pb-12"
        style={{ fontFamily: RB }}
      >
      {/* Top Header Section */}
        <div className="w-full max-w-none px-4 sm:px-6 lg:px-8 xl:px-10 py-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
               <button
                type="button"
                onClick={() => (onBack ? onBack() : window.history.back())}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-[#E5E7EB] bg-white text-xs font-semibold text-[#111827] hover:bg-slate-50 transition-all shadow-2xs cursor-pointer mr-1"
                style={{ fontFamily: PP }}
              >
                <ArrowLeft size={14} />
                Back
              </button>
              <div className="flex items-center gap-3">
                <h1
                  className="text-2xl font-bold text-[#111827]"
                  style={{ fontFamily: PP }}
                >
                  Doctor Report
                </h1>
              </div>
              <p className="text-xs text-[#64748B] mt-0.5">
                Analyze doctor workload, consultation performance and OPD
                activity.
              </p>
            </div>

            {/* Header Actions */}
            <div className="flex items-center gap-2 flex-wrap">
            
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
    </>
  );
}
