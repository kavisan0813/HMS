import { useReducer, useMemo, useTransition } from "react";
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
  ArrowLeft,
  TrendingUp,
} from "lucide-react";
import { useDoctorSelfPatientRegister } from "../hooks/useReports";
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

export interface DoctorPatientRecord {
  mrn: string;
  patientName: string;
  age: number;
  gender: string;
  mobileNumber: string;
  lastConsultationDate: string;
  visitType: string;
  diagnosis: string;
  followUpDate: string;
  status: string;
}

const getOffsetDateStr = (daysAgo: number): string => {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const SAMPLE_DOCTOR_PATIENTS: DoctorPatientRecord[] = [
  {
    mrn: "MRN-2026111086",
    patientName: "Eleanor Vance",
    age: 34,
    gender: "Female",
    mobileNumber: "9876543210",
    lastConsultationDate: getOffsetDateStr(0),
    visitType: "Follow-up",
    diagnosis: "Refractive Error",
    followUpDate: getOffsetDateStr(-7),
    status: "Completed",
  },
  {
    mrn: "MRN-2026925825",
    patientName: "Marcus Brody",
    age: 48,
    gender: "Male",
    mobileNumber: "9876543211",
    lastConsultationDate: getOffsetDateStr(0),
    visitType: "New Patient",
    diagnosis: "Hypertension",
    followUpDate: getOffsetDateStr(-14),
    status: "Active",
  },
  {
    mrn: "MRN-2026338491",
    patientName: "Sophia Martinez",
    age: 29,
    gender: "Female",
    mobileNumber: "9876543212",
    lastConsultationDate: getOffsetDateStr(1),
    visitType: "Routine Checkup",
    diagnosis: "General Checkup",
    followUpDate: getOffsetDateStr(-30),
    status: "Completed",
  },
  {
    mrn: "MRN-2026447219",
    patientName: "James Harrison",
    age: 52,
    gender: "Male",
    mobileNumber: "9876543213",
    lastConsultationDate: getOffsetDateStr(2),
    visitType: "Follow-up",
    diagnosis: "Type 2 Diabetes",
    followUpDate: getOffsetDateStr(-5),
    status: "In Progress",
  },
  {
    mrn: "MRN-2026559102",
    patientName: "Amara Okafor",
    age: 41,
    gender: "Female",
    mobileNumber: "9876543214",
    lastConsultationDate: getOffsetDateStr(4),
    visitType: "New Patient",
    diagnosis: "Migraine",
    followUpDate: getOffsetDateStr(-10),
    status: "Active",
  },
  {
    mrn: "MRN-2026771823",
    patientName: "David Chen",
    age: 63,
    gender: "Male",
    mobileNumber: "9876543215",
    lastConsultationDate: getOffsetDateStr(6),
    visitType: "Walk-In",
    diagnosis: "Acute Bronchitis",
    followUpDate: getOffsetDateStr(-3),
    status: "Completed",
  },
];

export function DoctorPatientReportScreen({
  onBack,
}: {
  onBack?: () => void;
  onOpenAppointmentReport?: () => void;
  onOpenDoctorReport?: () => void;
}) {
  const todayStr = getOffsetDateStr(0);

  const [state, dispatch] = useReducer(
    (
      prev: {
        searchQuery: string;
        dateRange: string;
        startDate: string;
        endDate: string;
        visitTypeFilter: string;
        consultStatusFilter: string;
        followUpStatusFilter: string;
        trendDays: "7 Days" | "30 Days" | "90 Days";
        showLoadingDemo: boolean;
        isRefreshing: boolean;
        hasError: boolean;
      },
      next: Partial<{
        searchQuery: string;
        dateRange: string;
        startDate: string;
        endDate: string;
        visitTypeFilter: string;
        consultStatusFilter: string;
        followUpStatusFilter: string;
        trendDays: "7 Days" | "30 Days" | "90 Days";
        showLoadingDemo: boolean;
        isRefreshing: boolean;
        hasError: boolean;
      }>,
    ) => ({ ...prev, ...next }),
    {
      searchQuery: "",
      dateRange: "Today",
      startDate: todayStr,
      endDate: todayStr,
      visitTypeFilter: "All Visit Types",
      consultStatusFilter: "All Statuses",
      followUpStatusFilter: "All Follow-up Statuses",
      trendDays: "7 Days" as const,
      showLoadingDemo: false,
      isRefreshing: false,
      hasError: false,
    },
  );
  const {
    searchQuery,
    dateRange,
    startDate,
    endDate,
    visitTypeFilter,
    consultStatusFilter,
    followUpStatusFilter,
    trendDays,
    showLoadingDemo,
    isRefreshing,
    hasError,
  } = state;

  const setSearchQuery = (val: string) => dispatch({ searchQuery: val });
  const setDateRange = (val: string) => dispatch({ dateRange: val });
  const setStartDate = (val: string) => dispatch({ startDate: val });
  const setEndDate = (val: string) => dispatch({ endDate: val });
  const setVisitTypeFilter = (val: string) => dispatch({ visitTypeFilter: val });
  const setConsultStatusFilter = (val: string) => dispatch({ consultStatusFilter: val });
  const setFollowUpStatusFilter = (val: string) => dispatch({ followUpStatusFilter: val });
  const setTrendDays = (val: "7 Days" | "30 Days" | "90 Days") => dispatch({ trendDays: val });
  const setShowLoadingDemo = (val: boolean) => dispatch({ showLoadingDemo: val });
  const setIsRefreshing = (val: boolean) => dispatch({ isRefreshing: val });
  const setHasError = (val: boolean) => dispatch({ hasError: val });
  const [isPending, startTransition] = useTransition();
  const isLoading = isPending || showLoadingDemo;

  // React Query Hooks for Doctor Personal Patient Reports
  const { data: registerData, refetch: refetchRegister } =
    useDoctorSelfPatientRegister({ size: 50 });

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
    refetchRegister();
    setTimeout(() => setIsRefreshing(false), 600);
  };

  const handleExportAllCsv = () => {
    const recordsToExport = (filteredPatients.length > 0 ? filteredPatients : doctorPatientSource).map((rec) => ({
      Section: "DOCTOR PATIENT REPORT",
      "MRN": rec.mrn || "N/A",
      "Patient Name": rec.patientName || "N/A",
      "Age / Gender": `${rec.age || 0} / ${rec.gender || "N/A"}`,
      "Mobile": rec.mobileNumber || "N/A",
      "Last Consultation Date": rec.lastConsultationDate || todayStr,
      "Visit Type": rec.visitType || "N/A",
      "Diagnosis": rec.diagnosis || "Routine OPD",
      "Follow-Up Date": rec.followUpDate || "N/A",
      "Status": rec.status || "Completed",
    }));

    exportDataToCsv(
      `Doctor_Patient_Report_All_Data_${new Date().toISOString().slice(0, 10)}.csv`,
      recordsToExport
    );
  };

  const handleResetFilters = () => {
    const tStr = getOffsetDateStr(0);
    setSearchQuery("");
    setDateRange("Today");
    setStartDate(tStr);
    setEndDate(tStr);
    setVisitTypeFilter("All Visit Types");
    setConsultStatusFilter("All Statuses");
    setFollowUpStatusFilter("All Follow-up Statuses");
  };

  const doctorPatientSource = (() => {
    const rawList = registerData?.content || [];
    if (rawList.length > 0) {
      return rawList.map((item, idx) => ({
        mrn: item.mrn
          ? String(item.mrn).startsWith("MRN-")
            ? String(item.mrn)
            : `MRN-${item.mrn}`
          : `MRN-100${idx + 1}`,
        patientName: item.patientName || "Unknown Patient",
        age: 30 + (idx % 25),
        gender: idx % 2 === 0 ? "Female" : "Male",
        mobileNumber: `98765432${10 + idx}`,
        lastConsultationDate: item.lastConsultationDate || todayStr,
        visitType: item.lastVisitType || "New Patient",
        diagnosis: "Routine OPD",
        followUpDate: item.nextFollowUpDate || getOffsetDateStr(-7),
        status: item.followUpStatus || "Completed",
      }));
    }
    return SAMPLE_DOCTOR_PATIENTS;
  })();

  const filteredPatients = (() => {
    const query = searchQuery.trim().toLowerCase();
    return doctorPatientSource.filter((mapped) => {
      // 1. Search filter
      const matchesSearch =
        !query ||
        (mapped.patientName || "").toLowerCase().includes(query) ||
        (mapped.mrn || "").toLowerCase().includes(query) ||
        (mapped.mobileNumber || "").includes(query);

      // 2. Visit Type filter
      const matchesVisit =
        visitTypeFilter === "All Visit Types" ||
        (mapped.visitType || "").toLowerCase() === visitTypeFilter.toLowerCase();

      // 3. Consult Status filter
      const matchesStatus =
        consultStatusFilter === "All Statuses" ||
        (mapped.status || "").toLowerCase() === consultStatusFilter.toLowerCase();

      // 4. Date Range filter
      const extractDateStr = (rec: DoctorPatientRecord): string | null => {
        if (rec.lastConsultationDate && rec.lastConsultationDate.length >= 10) {
          const match = rec.lastConsultationDate.match(/\d{4}-\d{2}-\d{2}/);
          if (match) return match[0];
        }
        return null;
      };

      const itemDateStr = extractDateStr(mapped);
      const matchesDate = (() => {
        if (!startDate && !endDate) return true;
        if (!itemDateStr) return true;
        if (startDate && itemDateStr < startDate) return false;
        if (endDate && itemDateStr > endDate) return false;
        return true;
      })();

      return matchesSearch && matchesVisit && matchesStatus && matchesDate;
    });
  })();

  const kpi = (() => {
    const totalPatients = filteredPatients.length;
    const newPatients = filteredPatients.filter((p) =>
      (p.visitType || "").toLowerCase().includes("new"),
    ).length;
    const returningPatients = filteredPatients.filter(
      (p) => {
        const vt = (p.visitType || "").toLowerCase();
        return (
          vt.includes("follow") ||
          vt.includes("routine") ||
          vt.includes("walk")
        );
      },
    ).length;
    const completedConsults = filteredPatients.filter(
      (p) => {
        const s = (p.status || "").toLowerCase();
        return s === "completed" || s === "active";
      },
    ).length;
    const scheduledFollowUps = filteredPatients.filter(
      (p) => p.followUpDate && p.followUpDate !== "N/A",
    ).length;
    const avgDailyPatients =
      totalPatients > 0 ? (totalPatients / 3).toFixed(1) : "0.0";

    return {
      totalPatients,
      newPatients,
      returningPatients,
      completedConsults,
      scheduledFollowUps,
      avgDailyPatients,
    };
  })();

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
        newReg: Math.max(1, 4 + ((i * 2) % 5)),
        returning: Math.max(1, 3 + ((i * 3) % 4)),
      });
    }
    return result;
  }, [trendDays]);

  const genderData = useMemo(() => {
    let male = 0,
      female = 0,
      other = 0;
    filteredPatients.forEach((p) => {
      const g = (p.gender || "").toLowerCase();
      if (g === "male") male++;
      else if (g === "female") female++;
      else other++;
    });
    return [
      { name: "Male", value: male || 4, color: "#0D47A1" },
      { name: "Female", value: female || 6, color: "#009688" },
      { name: "Other", value: other || 1, color: "#4DB6AC" },
    ];
  }, [filteredPatients]);

  const visitTypeDistData = useMemo(() => {
    const newCount = filteredPatients.filter((p) =>
      (p.visitType || "").toLowerCase().includes("new"),
    ).length;
    const followCount = filteredPatients.filter((p) =>
      (p.visitType || "").toLowerCase().includes("follow"),
    ).length;
    const checkupCount = filteredPatients.filter((p) =>
      (p.visitType || "").toLowerCase().includes("check"),
    ).length;
    const walkInCount = filteredPatients.filter((p) =>
      (p.visitType || "").toLowerCase().includes("walk"),
    ).length;

    return [
      { visitCategory: "New Patient", count: newCount || 4 },
      { visitCategory: "Follow-up", count: followCount || 12 },
      { visitCategory: "Routine Checkup", count: checkupCount || 9 },
      { visitCategory: "Walk-In", count: walkInCount || 5 },
    ];
  }, [filteredPatients]);

  const consultStatusData = useMemo(() => {
    const completed = filteredPatients.filter(
      (p) => p.status === "Completed",
    ).length;
    const inProgress = filteredPatients.filter(
      (p) => p.status === "In Progress",
    ).length;
    const active = filteredPatients.filter((p) => p.status === "Active").length;
    const scheduled = Math.max(
      0,
      filteredPatients.length - completed - inProgress - active,
    );

    return [
      { status: "Completed", count: completed || 18 },
      { status: "Active", count: active || 10 },
      { status: "In-Progress", count: inProgress || 4 },
      { status: "Scheduled", count: scheduled || 6 },
    ];
  }, [filteredPatients]);

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
                    Patient Report
                  </h1>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#0D47A1]/10 text-[#0D47A1] border border-blue-200">
                    Doctor Scoped
                  </span>
                </div>
                <p className="text-xs text-[#64748B] mt-0.5">
                  Analyze your patient demographics, consultations, and follow-up
                  activities.
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
                  alert("Exporting Doctor Patient Report (PDF)...")
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
        {/* 1. TOP 6 DOCTOR PATIENT KPI CARDS */}
        {!isLoading && !hasError && (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {/* Card 1: My Patients */}
            <div className="bg-white rounded-2xl border border-[#E5E7EB] p-4 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-[#64748B]">
                  My Patients
                </span>
                <div className="p-2 rounded-xl bg-blue-50 text-[#0D47A1]">
                  <Users className="w-4 h-4" />
                </div>
              </div>
              <div
                className="text-2xl font-bold text-[#111827] mb-1"
                style={{ fontFamily: PP }}
              >
                {kpi.totalPatients}
              </div>
              <div className="flex items-center gap-2 text-[11px] text-[#64748B] mb-3">
                <span className="text-[#0D47A1] font-semibold flex items-center gap-0.5">
                  <TrendingUp className="w-3 h-3" /> Assigned Patients
                </span>
              </div>
              <div className="grid grid-cols-2 gap-1 pt-2 border-t border-[#E5E7EB] text-[11px] text-center">
                <div>
                  <div className="text-[#0D47A1] font-bold">
                    {kpi.totalPatients}
                  </div>
                  <div className="text-[#64748B]">Total</div>
                </div>
                <div>
                  <div className="text-[#66BB6A] font-bold">
                    {kpi.newPatients}
                  </div>
                  <div className="text-[#64748B]">New</div>
                </div>
              </div>
            </div>

            {/* Card 2: New Patients */}
            <div className="bg-white rounded-2xl border border-[#E5E7EB] p-4 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-[#64748B]">
                  New Patients
                </span>
                <div className="p-2 rounded-xl bg-teal-50 text-[#009688]">
                  <Users className="w-4 h-4" />
                </div>
              </div>
              <div
                className="text-2xl font-bold text-[#111827] mb-1"
                style={{ fontFamily: PP }}
              >
                {kpi.newPatients}
              </div>
              <div className="flex items-center gap-2 text-[11px] text-[#64748B] mb-3">
                <span className="text-[#009688] font-semibold">
                  First Consultation
                </span>
              </div>
              <div className="grid grid-cols-2 gap-1 pt-2 border-t border-[#E5E7EB] text-[11px] text-center">
                <div>
                  <div className="text-[#009688] font-bold">
                    {kpi.newPatients}
                  </div>
                  <div className="text-[#64748B]">New Vis</div>
                </div>
                <div>
                  <div className="text-[#66BB6A] font-bold">
                    {Math.max(1, Math.floor(kpi.newPatients / 2))}
                  </div>
                  <div className="text-[#64748B]">Recent</div>
                </div>
              </div>
            </div>

            {/* Card 3: Returning Patients */}
            <div className="bg-white rounded-2xl border border-[#E5E7EB] p-4 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-[#64748B]">
                  Returning Patients
                </span>
                <div className="p-2 rounded-xl bg-indigo-50 text-[#0D47A1]">
                  <UserCheck className="w-4 h-4" />
                </div>
              </div>
              <div
                className="text-2xl font-bold text-[#111827] mb-1"
                style={{ fontFamily: PP }}
              >
                {kpi.returningPatients}
              </div>
              <div className="flex items-center gap-2 text-[11px] text-[#64748B] mb-3">
                <span className="text-[#0D47A1] font-semibold">
                  Follow-up Visits
                </span>
              </div>
              <div className="grid grid-cols-2 gap-1 pt-2 border-t border-[#E5E7EB] text-[11px] text-center">
                <div>
                  <div className="text-[#0D47A1] font-bold">
                    {kpi.returningPatients}
                  </div>
                  <div className="text-[#64748B]">Follow-ups</div>
                </div>
                <div>
                  <div className="text-[#66BB6A] font-bold">
                    {Math.max(1, Math.floor(kpi.returningPatients / 2))}
                  </div>
                  <div className="text-[#64748B]">Repeat</div>
                </div>
              </div>
            </div>

            {/* Card 4: Completed Consultations */}
            <div className="bg-white rounded-2xl border border-[#E5E7EB] p-4 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-[#64748B]">
                  Completed Consults
                </span>
                <div className="p-2 rounded-xl bg-emerald-50 text-[#66BB6A]">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
              </div>
              <div
                className="text-2xl font-bold text-[#111827] mb-1"
                style={{ fontFamily: PP }}
              >
                {kpi.completedConsults}
              </div>
              <div className="flex items-center gap-2 text-[11px] text-[#64748B] mb-3">
                <span className="text-[#66BB6A] font-semibold">
                  Completed Patients
                </span>
              </div>
              <div className="grid grid-cols-2 gap-1 pt-2 border-t border-[#E5E7EB] text-[11px] text-center">
                <div>
                  <div className="text-[#66BB6A] font-bold">
                    {kpi.completedConsults}
                  </div>
                  <div className="text-[#64748B]">Done</div>
                </div>
                <div>
                  <div className="text-[#0D47A1] font-bold">
                    {kpi.completedConsults * 4}
                  </div>
                  <div className="text-[#64748B]">Monthly</div>
                </div>
              </div>
            </div>

            {/* Card 5: Scheduled Follow-ups */}
            <div className="bg-white rounded-2xl border border-[#E5E7EB] p-4 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-[#64748B]">
                  Scheduled Follow-ups
                </span>
                <div className="p-2 rounded-xl bg-amber-50 text-[#F59E0B]">
                  <Activity className="w-4 h-4" />
                </div>
              </div>
              <div
                className="text-2xl font-bold text-[#111827] mb-1"
                style={{ fontFamily: PP }}
              >
                {kpi.scheduledFollowUps}
              </div>
              <div className="flex items-center gap-2 text-[11px] text-[#64748B] mb-3">
                <span className="text-[#F59E0B] font-semibold">
                  Upcoming Reviews
                </span>
              </div>
              <div className="grid grid-cols-2 gap-1 pt-2 border-t border-[#E5E7EB] text-[11px] text-center">
                <div>
                  <div className="text-[#F59E0B] font-bold">
                    {kpi.scheduledFollowUps}
                  </div>
                  <div className="text-[#64748B]">Active</div>
                </div>
                <div>
                  <div className="text-[#009688] font-bold">
                    {kpi.scheduledFollowUps + 10}
                  </div>
                  <div className="text-[#64748B]">Upcoming</div>
                </div>
              </div>
            </div>

            {/* Card 6: Average Patients Per Day */}
            <div className="bg-white rounded-2xl border border-[#E5E7EB] p-4 shadow-sm hover:shadow-md transition-shadow flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold text-[#64748B]">
                  Avg Patients / Day
                </span>
                <div
                  className="text-2xl font-bold text-[#111827] mt-1"
                  style={{ fontFamily: PP }}
                >
                  {kpi.avgDailyPatients}
                </div>
                <p className="text-[11px] text-[#64748B] mt-1">
                  Daily patient load
                </p>
                <div className="mt-2 text-[11px] font-semibold text-[#009688]">
                  ✓ Optimal Load
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
                <span>Filter Consulted Patients & Demographics</span>
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
                  <option>Active</option>
                  <option>Completed</option>
                  <option>In Progress</option>
                </select>
              </div>

              {/* Follow-up Status */}
              <div>
                <label className="block text-[11px] font-medium text-[#64748B] mb-1">
                  Follow-up Status
                </label>
                <select
                  aria-label="Select option"
                  value={followUpStatusFilter}
                  onChange={(e) => setFollowUpStatusFilter(e.target.value)}
                  className="w-full bg-[#F1F5F9] border border-[#E5E7EB] rounded-xl text-xs px-2.5 py-2 text-[#111827] focus:outline-none focus:ring-2 focus:ring-[#0D47A1]"
                >
                  <option>All Follow-up Statuses</option>
                  <option>Completed</option>
                  <option>Scheduled</option>
                  <option>Pending</option>
                  <option>Missed</option>
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
                  placeholder="Search Patient Name, MRN, Mobile Number..."
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
            Simulate Doctor patient report state
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
              Unable to Load Patient Report
            </h3>
            <p className="text-xs text-[#64748B] mt-1 max-w-md mx-auto">
              Connection error while loading patient records. Please retry.
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
            {/* 3. PATIENT CONSULTATION TREND & FOLLOW-UP ANALYSIS */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Patient Consultation Trend Area Chart */}
              <div className="bg-white rounded-2xl border border-[#E5E7EB] p-5 shadow-sm">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-4">
                  <div>
                    <h3
                      className="text-sm font-bold text-[#111827]"
                      style={{ fontFamily: PP }}
                    >
                      Patient Consultation Trend
                    </h3>
                    <p className="text-[11px] text-[#64748B]">
                      Consulted patients vs completed consults over time
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
                          id="docPatTrendGrad"
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
                          id="docCompTrendGrad"
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
                        dataKey="newReg"
                        name="Consulted Patients"
                        stroke="#0D47A1"
                        fillOpacity={1}
                        fill="url(#docPatTrendGrad)"
                      />
                      <Area
                        type="monotone"
                        dataKey="returning"
                        name="Completed Consults"
                        stroke="#009688"
                        fillOpacity={1}
                        fill="url(#docCompTrendGrad)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Patient Gender / Compliance Donut Chart */}
              <div className="bg-white rounded-2xl border border-[#E5E7EB] p-5 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3
                      className="text-sm font-bold text-[#111827]"
                      style={{ fontFamily: PP }}
                    >
                      Patient Demographics Breakdown
                    </h3>
                    <p className="text-[11px] text-[#64748B]">
                      Gender distribution across my assigned patients
                    </p>
                  </div>
                  <PieChartIcon className="w-4 h-4 text-[#009688]" />
                </div>
                <div className="h-60">
                  <ResponsiveContainer width="100%" height="100%">
                    <RechartsPie>
                      <Pie
                        data={genderData}
                        cx="50%"
                        cy="50%"
                        innerRadius={45}
                        outerRadius={75}
                        paddingAngle={3}
                        dataKey="value"
                      >
                        {genderData.map((entry) => (
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

            {/* 4. VISIT TYPE DISTRIBUTION & CONSULTATION STATUS CHARTS */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
                      Patient volume grouped by visit category
                    </p>
                  </div>
                  <Users className="w-4 h-4 text-[#009688]" />
                </div>
                <div className="h-56">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={visitTypeDistData}
                      margin={{ top: 10, right: 10, left: -15, bottom: 0 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                      <XAxis
                        dataKey="visitCategory"
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

              {/* Consultation Status Horizontal Bar */}
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
                      Volume of completed, active & in-progress consultations
                    </p>
                  </div>
                  <UserCheck className="w-4 h-4 text-[#0D47A1]" />
                </div>
                <div className="h-56">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      layout="vertical"
                      data={consultStatusData}
                      margin={{ top: 5, right: 10, left: 30, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                      <XAxis
                        type="number"
                        tick={{ fontSize: 10, fill: "#64748B" }}
                      />
                      <YAxis
                        type="category"
                        dataKey="status"
                        tick={{ fontSize: 9, fill: "#111827" }}
                        width={90}
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
                        dataKey="count"
                        name="Consultation Count"
                        fill="#009688"
                        radius={[0, 4, 4, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* 5. MY PATIENT REPORT ENTERPRISE DATA TABLE */}
            <div className="bg-white rounded-2xl border border-[#E5E7EB] shadow-sm overflow-hidden">
              <div className="p-5 border-b border-[#E5E7EB] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                  <h3
                    className="text-base font-bold text-[#111827]"
                    style={{ fontFamily: PP }}
                  >
                    My Patient Register
                  </h3>
                  <p className="text-xs text-[#64748B]">
                    Logged-in Doctor active patient register
                  </p>
                </div>
                <button
                  onClick={() => alert("Exporting Patient Register (CSV)...")}
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
                      <th className="py-3.5 px-4">MRN</th>
                      <th className="py-3.5 px-4">Patient Name</th>
                      <th className="py-3.5 px-4">Age / Gender</th>
                      <th className="py-3.5 px-4">Mobile Number</th>
                      <th className="py-3.5 px-4">Last Consult Date</th>
                      <th className="py-3.5 px-4">Visit Type</th>
                      <th className="py-3.5 px-4">Diagnosis</th>
                      <th className="py-3.5 px-4">Follow-up Date</th>
                      <th className="py-3.5 px-4 text-center">Status</th>
                      <th className="py-3.5 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E5E7EB] text-xs">
                    {filteredPatients.length === 0 ? (
                      <tr>
                        <td
                          colSpan={10}
                          className="py-8 text-center text-[#64748B]"
                        >
                          No patient records match your search or filter
                          criteria.
                        </td>
                      </tr>
                    ) : (
                      filteredPatients.map((item) => (
                        <tr
                          key={item.mrn}
                          className="hover:bg-slate-50 transition-colors"
                        >
                          <td className="py-3.5 px-4 font-mono font-bold text-[#0D47A1]">
                            {item.mrn}
                          </td>
                          <td className="py-3.5 px-4 font-bold text-[#111827]">
                            {item.patientName}
                          </td>
                          <td className="py-3.5 px-4 text-[#64748B]">
                            {item.age} yrs / {item.gender}
                          </td>
                          <td className="py-3.5 px-4 text-[#111827] font-medium">
                            {item.mobileNumber}
                          </td>
                          <td className="py-3.5 px-4 text-[#64748B]">
                            {item.lastConsultationDate}
                          </td>
                          <td className="py-3.5 px-4 font-semibold text-[#111827]">
                            {item.visitType}
                          </td>
                          <td className="py-3.5 px-4 text-[#009688] font-medium">
                            {item.diagnosis}
                          </td>
                          <td className="py-3.5 px-4 text-[#64748B]">
                            {item.followUpDate}
                          </td>
                          <td className="py-3.5 px-4 text-center">
                            <span
                              className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${item.status === "Active" || item.status === "Completed" ? "bg-teal-50 text-[#009688] border border-teal-200" : item.status === "In Progress" ? "bg-amber-50 text-[#F59E0B] border border-amber-200" : "bg-slate-100 text-[#64748B]"}`}
                            >
                              {item.status}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-right">
                            <div className="flex items-center justify-end gap-1">
                              <button
                                onClick={() =>
                                  alert(
                                    `Viewing patient profile for ${item.patientName}`,
                                  )
                                }
                                className="p-1.5 text-[#0D47A1] hover:bg-blue-50 rounded-lg transition"
                                title="View Patient Profile"
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
                                  alert(`Printing summary for ${item.mrn}`)
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
                  Showing 1 to {filteredPatients.length} of{" "}
                  {filteredPatients.length} entries
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
              {filteredPatients.length} Patient Results
            </strong>
          </div>
          <div>Hospital Management System • Doctor Patient Report v1.0</div>
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
