import React, { useState, useMemo, useReducer } from "react";

type ReportState = {
  searchQuery: string;
  dateRange: string;
  genderFilter: string;
  ageGroupFilter: string;
  deptFilter: string;
  doctorFilter: string;
  visitTypeFilter: string;
  regStatusFilter: string;
  appliedFilters: {
    dateRange: string;
    gender: string;
    ageGroup: string;
    dept: string;
    doctor: string;
    visitType: string;
    regStatus: string;
  };
  isLoading: boolean;
  hasError: boolean;
};

type ReportAction =
  | { type: "SET_SEARCH"; payload: string }
  | { type: "SET_FILTER"; field: string; value: string }
  | {
      type: "SET_APPLIED_FILTER";
      field: keyof ReportState["appliedFilters"];
      value: string;
    }
  | { type: "LOAD_START" }
  | { type: "LOAD_SUCCESS"; payload: ReportState["appliedFilters"] }
  | { type: "LOAD_ERROR" }
  | { type: "RESET_FILTERS" }
  | { type: "RESET_FILTERS_SUCCESS"; payload: ReportState["appliedFilters"] }
  | { type: "SET_ERROR"; payload: boolean };

const initialState: ReportState = {
  searchQuery: "",
  dateRange: "Today",
  genderFilter: "All Genders",
  ageGroupFilter: "All Age Groups",
  deptFilter: "All Departments",
  doctorFilter: "All Doctors",
  visitTypeFilter: "All Visit Types",
  regStatusFilter: "All Statuses",
  appliedFilters: {
    dateRange: "Today",
    gender: "All Genders",
    ageGroup: "All Age Groups",
    dept: "All Departments",
    doctor: "All Doctors",
    visitType: "All Visit Types",
    regStatus: "All Statuses",
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
        genderFilter: "gender",
        ageGroupFilter: "ageGroup",
        deptFilter: "dept",
        doctorFilter: "doctor",
        visitTypeFilter: "visitType",
        regStatusFilter: "regStatus",
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
    case "SET_APPLIED_FILTER":
      return {
        ...state,
        appliedFilters: {
          ...state.appliedFilters,
          [action.field]: action.value,
        },
      };
    case "LOAD_START":
      return { ...state, isLoading: true, hasError: false };
    case "LOAD_SUCCESS":
      return { ...state, isLoading: false, appliedFilters: action.payload };
    case "LOAD_ERROR":
      return { ...state, isLoading: false, hasError: true };
    case "SET_ERROR":
      return { ...state, hasError: action.payload };
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
import {
  Download,
  RefreshCw,
  Filter,
  Search,
  ChevronRight,
  Clock,
  PieChart as PieChartIcon,
  AlertCircle,
  Activity,
  Users,
  UserCheck,
  TrendingUp,
  Building2,
  Printer,
  ChevronLeft,
  ChevronRight as ChevronRightIcon,
  Eye,
  User,
  X,
  ArrowLeft,
} from "lucide-react";
import { PP, RB } from "../constants/reports.constants";
import type {
  PatientReportRecord,
  PatientMasterRecord,
} from "../types/reports.types";
import {
  useDepartmentPatientVisits,
  useGenderBreakdown,
  usePatientRegistrationSummary,
  usePatientMasterRegister,
  usePatientDashboard,
  usePatientRegistrationTrend,
  extractList,
} from "../hooks/useReports";
import { exportDataToCsv } from "../utils/export.utils";

import { usePermissions } from "../../../permissions/usePermissions";
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

export function PatientReportScreen({
  onBack,
}: {
  onBack?: () => void;
  onOpenAppointmentReport?: () => void;
  onOpenDoctorReport?: () => void;
}) {
  const {role } = usePermissions();
  // State
  const [state, dispatch] = useReducer(reducer, initialState);
  const {
    searchQuery,
    dateRange,
    genderFilter,
    ageGroupFilter,
    deptFilter,
    doctorFilter,
    visitTypeFilter,
    regStatusFilter,
    appliedFilters,
    isLoading,
    hasError,
  } = state;

  // ─── API Data Hooks ──────────────────────────────────────────────────────
  const today = new Date().toISOString().slice(0, 10);
  const [fromDate] = useState(today);
  const [toDate] = useState(today);

  const getDateRange = (range: string) => {
    const now = new Date();
    if (range === "Today") return { fromDate: today, toDate: today };
    if (range === "Yesterday") {
      const y = new Date(now);
      y.setDate(now.getDate() - 1);
      const yStr = y.toISOString().slice(0, 10);
      return { fromDate: yStr, toDate: yStr };
    }
    if (range === "7 Days" || range === "Last 7 Days") {
      const from = new Date(now);
      from.setDate(now.getDate() - 7);
      return { fromDate: from.toISOString().slice(0, 10), toDate: today };
    }
    if (range === "30 Days" || range === "This Month") {
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
      status: regStatusFilter !== "All Statuses" ? regStatusFilter : undefined,
      visitType:
        visitTypeFilter !== "All Visit Types" ? visitTypeFilter : undefined,
      gender: genderFilter !== "All Genders" ? genderFilter : undefined,
      ageGroup: ageGroupFilter !== "All Age Groups" ? ageGroupFilter : undefined,
      page: 0,
      size: 50,
    }),
    [dates, doctorFilter, deptFilter, regStatusFilter, visitTypeFilter, genderFilter, ageGroupFilter],
  );

  useDepartmentPatientVisits(reportFilters);
  const { data: genderData = null } = useGenderBreakdown(reportFilters);
  const { data: regSummary = null } = usePatientRegistrationSummary(reportFilters);
  const { data: patientMasterData } = usePatientMasterRegister(reportFilters);
  const { data: patientDashboard = null } = usePatientDashboard(reportFilters);
  const { data: registrationTrend = null } = usePatientRegistrationTrend(reportFilters);

  const [showExportModal, setShowExportModal] = useState(false);
  const [exportFormat, setExportFormat] = useState<"pdf" | "excel" | "csv">(
    "pdf",
  );
  const [exportScope, setExportScope] = useState<
    "page" | "filtered" | "complete"
  >("filtered");
  const [includeOptions, setIncludeOptions] = useState({
    kpi: true,
    charts: true,
    tables: true,
    filters: true,
  });

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

  const [trendDays, setTrendDays] = useState<"7 Days" | "30 Days" | "90 Days">(
    "7 Days",
  );

  const [sortField, setSortField] =
    useState<string>("registrationDate");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [selectedPatientModal, setSelectedPatientModal] = useState<{
    patientId: string | number;
    patientName: string;
    mrn: string;
    mobile: string;
    gender: string;
    age: number;
    department: string;
    doctorName: string;
    visitType: string;
    status: string;
    registrationDate: string;
  } | null>(null);

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => setIsRefreshing(false), 400);
  };

  const handleExportAllCsv = () => {
    // 1. KPI Cards Summary
    const kpiRows = [
      {
        Section: "1. SUMMARY KPI CARDS",
        Category_Item: "Total Patient Registrations",
        Count_or_Amount: `${computedPatientStats.totalReg} Patients`,
        Percentage_Share: "100%",
        Primary_Detail: "Total Registered OPD Patients",
        Secondary_Detail: `Active Patients: ${computedPatientStats.activeCount}`,
        Date_or_Status: "Total Registrations",
      },
      {
        Section: "1. SUMMARY KPI CARDS",
        Category_Item: "New Patients",
        Count_or_Amount: `${computedPatientStats.newCount} Patients`,
        Percentage_Share: `${((computedPatientStats.newCount / (computedPatientStats.totalReg || 1)) * 100).toFixed(1)}%`,
        Primary_Detail: "First-Time Registered Patients",
        Secondary_Detail: "New Patient Registrations",
        Date_or_Status: "New Patient",
      },
      {
        Section: "1. SUMMARY KPI CARDS",
        Category_Item: "Returning / Follow-Up Patients",
        Count_or_Amount: `${computedPatientStats.returningCount} Patients`,
        Percentage_Share: `${((computedPatientStats.returningCount / (computedPatientStats.totalReg || 1)) * 100).toFixed(1)}%`,
        Primary_Detail: "Returning & Follow-up Visits",
        Secondary_Detail: "Follow-up Registrations",
        Date_or_Status: "Returning Patient",
      },
      {
        Section: "1. SUMMARY KPI CARDS",
        Category_Item: "Walk-In Patients",
        Count_or_Amount: `${computedPatientStats.walkIns} Patients`,
        Percentage_Share: `${((computedPatientStats.walkIns / (computedPatientStats.totalReg || 1)) * 100).toFixed(1)}%`,
        Primary_Detail: "Walk-In Registrations",
        Secondary_Detail: "Counter Registration",
        Date_or_Status: "Walk-In",
      },
      {
        Section: "1. SUMMARY KPI CARDS",
        Category_Item: "Scheduled Patients",
        Count_or_Amount: `${computedPatientStats.scheduled} Patients`,
        Percentage_Share: `${((computedPatientStats.scheduled / (computedPatientStats.totalReg || 1)) * 100).toFixed(1)}%`,
        Primary_Detail: "Pre-Booked Appointments",
        Secondary_Detail: "Appointment Registrations",
        Date_or_Status: "Scheduled",
      },
    ];

    // 2. Graph 1: Gender Distribution Graph Share (%)
    const totalGender = dynamicGenderData.reduce((s, g) => s + g.value, 0) || 1;
    const genderChartRows = dynamicGenderData.map((g) => {
      const pct = ((g.value / totalGender) * 100).toFixed(1);
      return {
        Section: "2. GENDER DEMOGRAPHICS GRAPH SHARE",
        Category_Item: g.name,
        Count_or_Amount: `${g.value} Patients`,
        Percentage_Share: `${pct}%`,
        Primary_Detail: `${g.name} Patient Demographics`,
        Secondary_Detail: "Gender Share Graph",
        Date_or_Status: "Active",
      };
    });

    // 3. Graph 2: Age Group Demographics Graph Share (%)
    const totalAgeCount = dynamicAgeData.reduce((s, a) => s + a.count, 0) || 1;
    const ageChartRows = dynamicAgeData.map((a) => {
      const pct = ((a.count / totalAgeCount) * 100).toFixed(1);
      return {
        Section: "3. AGE GROUP DEMOGRAPHICS GRAPH SHARE",
        Category_Item: `Age Group ${a.group}`,
        Count_or_Amount: `${a.count} Patients`,
        Percentage_Share: `${pct}%`,
        Primary_Detail: `Age Group ${a.group} Share`,
        Secondary_Detail: "Age Demographics Graph",
        Date_or_Status: "Active",
      };
    });

    // 4. Graph 3: Department Registrations Share (%)
    const totalDeptCount = dynamicDeptData.reduce((s, d) => s + d.total, 0) || 1;
    const deptChartRows = dynamicDeptData.map((d) => {
      const pct = ((d.total / totalDeptCount) * 100).toFixed(1);
      return {
        Section: "4. DEPARTMENT PATIENTS GRAPH SHARE",
        Category_Item: d.department,
        Count_or_Amount: `${d.total} Patients`,
        Percentage_Share: `${pct}%`,
        Primary_Detail: `Department Patient Volume`,
        Secondary_Detail: "Department Share Graph",
        Date_or_Status: "Active",
      };
    });

    // 5. Table: Detailed Patient Registry Records
    const recordRows = filteredData.map((rec) => ({
      Section: "5. PATIENT MASTER TABLE REGISTRY",
      Category_Item: rec.mrn,
      Count_or_Amount: `Age: ${rec.age} | Gender: ${rec.gender}`,
      Percentage_Share: rec.status === "Active" ? "100%" : "0%",
      Primary_Detail: `Patient: ${rec.patientName} (Mobile: ${rec.mobile})`,
      Secondary_Detail: `Doctor: ${rec.doctorName} | Dept: ${rec.department} | Visit: ${rec.visitType}`,
      Date_or_Status: `Reg Date: ${rec.registrationDate} | Status: ${rec.status}`,
    }));

    const allRows = [
      ...kpiRows,
      ...genderChartRows,
      ...ageChartRows,
      ...deptChartRows,
      ...recordRows,
    ];

    exportDataToCsv(
      `Patient_Report_Complete_All_Data_${new Date().toISOString().slice(0, 10)}.csv`,
      allRows
    );
  };

  const handleApplyFilters = () => {
    dispatch({ type: "LOAD_START" });
    setTimeout(() => {
      dispatch({
        type: "LOAD_SUCCESS",
        payload: {
          dateRange,
          gender: genderFilter,
          ageGroup: ageGroupFilter,
          dept: deptFilter,
          doctor: doctorFilter,
          visitType: visitTypeFilter,
          regStatus: regStatusFilter,
        },
      });
    }, 300);
  };

  const handleResetFilters = () => {
    dispatch({ type: "RESET_FILTERS" });
    setTimeout(() => {
      dispatch({
        type: "RESET_FILTERS_SUCCESS",
        payload: {
          dateRange: "Today",
          gender: "All Genders",
          ageGroup: "All Age Groups",
          dept: "All Departments",
          doctor: "All Doctors",
          visitType: "All Visit Types",
          regStatus: "All Statuses",
        },
      });
    }, 300);
  };

  const patientMasterList = useMemo(
    () => extractList<PatientMasterRecord>(patientMasterData),
    [patientMasterData],
  );

   // Computed KPI Card Values from API hooks
  const computedPatientStats = {
    totalReg: patientDashboard?.totalPatients ?? patientMasterList.length ?? 0,
    newCount: patientDashboard?.newPatients?.count ?? 0,
    returningCount: patientDashboard?.returningPatients?.count ?? 0,
    emergencyVisits: patientDashboard?.emergencyVisits ?? 0,
    avgAge: patientDashboard?.averageAge ?? 0,
    malePct: patientDashboard?.malePercentage ?? 0,
    femalePct: patientDashboard?.femalePercentage ?? 0,
    otherPct: patientDashboard?.otherPercentage ?? 0,
    walkIns: patientMasterList.filter((p) => p.visitType === "Walk-In").length ?? 0,
    scheduled: patientMasterList.filter((p) => p.visitType === "Scheduled").length ?? 0,
    activeCount: patientMasterList.filter((p) => p.status === "Active" || !p.status).length ?? (patientDashboard?.totalPatients ?? patientMasterList.length ?? 0),
  };

  const registrationTrendData = (() => {
    if (registrationTrend?.dataPoints) {
      return registrationTrend.dataPoints.map((d) => ({
        date: d.date,
        New: d.newPatients,
        Returning: d.returningPatients,
        Total: d.newPatients + d.returningPatients,
      }));
    }
    const daysCount = trendDays === "7 Days" ? 7 : trendDays === "30 Days" ? 30 : 90;
    const result = [];
    const baseNew = Math.max(2, Math.round((computedPatientStats.newCount || 20) / (daysCount / 4)));
    const baseRet = Math.max(1, Math.round((computedPatientStats.returningCount || 10) / (daysCount / 4)));
    for (let i = daysCount - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
      const dayNew = Math.max(1, baseNew + ((i * 3) % 7));
      const dayRet = Math.max(1, baseRet + ((i * 2) % 5));
      result.push({
        date: dateStr,
        New: dayNew,
        Returning: dayRet,
        Total: dayNew + dayRet,
      });
    }
    return result;
  })();

  // Filtered records
  const filteredData = (() => {
    const source = patientMasterList.map((d: PatientMasterRecord) => ({
      patientId: d.patientId || "",
      patientName: d.patientName || d.fullName || "N/A",
      mrn: d.mrn
        ? String(d.mrn).startsWith("MRN-")
          ? String(d.mrn)
          : `MRN-${d.mrn}`
        : `MRN-${d.patientId || ""}`,
      mobile: d.mobile || d.phone || "",
      gender: d.gender || "Other",
      age: d.age || 0,
      department: d.department || "General Medicine",
      doctorName: d.doctorName || "Unassigned",
      visitType: d.visitType || "New Visit",
      status: d.status || "Active",
      registrationDate: d.registrationDate || d.createdDate || today,
    }));
    return source.filter((item) => {
      const matchesSearch =
        item.patientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.mrn.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.mobile.includes(searchQuery) ||
        item.doctorName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.department.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesGender =
        appliedFilters.gender === "All Genders" ||
        item.gender.toLowerCase() === appliedFilters.gender.toLowerCase();
      const matchesDept =
        appliedFilters.dept === "All Departments" ||
        item.department.toLowerCase().includes(appliedFilters.dept.toLowerCase()) ||
        appliedFilters.dept.toLowerCase().includes(item.department.toLowerCase());
      const matchesDoctor =
        appliedFilters.doctor === "All Doctors" ||
        item.doctorName.toLowerCase().includes(appliedFilters.doctor.toLowerCase()) ||
        appliedFilters.doctor.toLowerCase().includes(item.doctorName.toLowerCase());
      const matchesVisit =
        appliedFilters.visitType === "All Visit Types" ||
        item.visitType.toLowerCase() === appliedFilters.visitType.toLowerCase();
      const matchesStatus =
        appliedFilters.regStatus === "All Statuses" ||
        item.status.toLowerCase() === appliedFilters.regStatus.toLowerCase();

      return (
        matchesSearch &&
        matchesGender &&
        matchesDept &&
        matchesDoctor &&
        matchesVisit &&
        matchesStatus
      );
    });
  })();

  const dynamicAgeData = (() => {
    const groups = [
      { group: "0–12", count: 0 },
      { group: "13–18", count: 0 },
      { group: "19–30", count: 0 },
      { group: "31–45", count: 0 },
      { group: "46–60", count: 0 },
      { group: "60+", count: 0 },
    ];
    filteredData.forEach((p) => {
      const age = p.age || 0;
      if (age <= 12) groups[0].count++;
      else if (age <= 18) groups[1].count++;
      else if (age <= 30) groups[2].count++;
      else if (age <= 45) groups[3].count++;
      else if (age <= 60) groups[4].count++;
      else groups[5].count++;
    });
    const totalCount = groups.reduce((acc, g) => acc + g.count, 0);
    if (totalCount === 0) {
      return [
        { group: "0–12", count: 12 },
        { group: "13–18", count: 8 },
        { group: "19–30", count: 35 },
        { group: "31–45", count: 42 },
        { group: "46–60", count: 28 },
        { group: "60+", count: 15 },
      ];
    }
    return groups;
  })();

  const dynamicGenderData = (() => {
    if (genderData && genderData.breakdown) {
      return genderData.breakdown.map((item) => ({
        name: item.label,
        value: item.value,
        color: item.label.toLowerCase() === "male" ? "#0D47A1"
               : item.label.toLowerCase() === "female" ? "#009688"
               : "#4DB6AC",
      }));
    }
    if (genderData) {
      return [
        { name: "Male", value: genderData.maleCount, color: "#0D47A1" },
        { name: "Female", value: genderData.femaleCount, color: "#009688" },
        { name: "Other", value: genderData.otherCount, color: "#4DB6AC" },
      ];
    }
    let male = 0, female = 0, other = 0;
    filteredData.forEach((p) => {
      const g = (p.gender || "").toLowerCase();
      if (g === "male") male++;
      else if (g === "female") female++;
      else other++;
    });
    return [
      { name: "Male", value: male || 52, color: "#0D47A1" },
      { name: "Female", value: female || 44, color: "#009688" },
      { name: "Other", value: other || 4, color: "#4DB6AC" },
    ];
  })();

  const dynamicDeptData = (() => {
    const map: Record<string, number> = {};
    filteredData.forEach((p) => {
      const d = p.department || "General Medicine";
      map[d] = (map[d] || 0) + 1;
    });
    const list = Object.entries(map).map(([dept, total]) => ({ department: dept, total }));
    if (list.length === 0) {
      return [
        { department: "General", total: 42 },
        { department: "Eye Dept", total: 28 },
        { department: "Cardiology", total: 19 },
        { department: "Pediatrics", total: 15 },
        { department: "Orthopedics", total: 12 },
      ];
    }
    return list;
  })();

  const dynamicDoctorData = (() => {
    const map: Record<string, number> = {};
    filteredData.forEach((p) => {
      const doc = p.doctorName || "Dr. Sarath";
      map[doc] = (map[doc] || 0) + 1;
    });
    const list = Object.entries(map).map(([doc, count]) => ({ doctor: doc, count }));
    if (list.length === 0) {
      return [
        { doctor: "Dr. Sarath", count: 35 },
        { doctor: "Dr. Pradeep", count: 24 },
        { doctor: "Dr. Rajesh", count: 18 },
        { doctor: "Dr. Subha", count: 12 },
      ];
    }
    return list;
  })();

  const deptOptions = useMemo(() => {
    const set = new Set<string>();
    patientMasterList.forEach((p) => {
      if (p.department) set.add(p.department);
    });
    const list = Array.from(set).filter(Boolean);
    if (!list.includes("General Medicine")) list.push("General Medicine");
    if (!list.includes("EYE DEPT")) list.push("EYE DEPT");
    if (!list.includes("Cardiology")) list.push("Cardiology");
    if (!list.includes("Pediatrics")) list.push("Pediatrics");
    return ["All Departments", ...list];
  }, [patientMasterList]);

  const doctorOptions = useMemo(() => {
    const set = new Set<string>();
    patientMasterList.forEach((p) => {
      if (p.doctorName) set.add(p.doctorName);
    });
    const list = Array.from(set).filter(Boolean);
    if (!list.includes("Dr. sarath")) list.push("Dr. sarath");
    if (!list.includes("Dr. pradeep")) list.push("Dr. pradeep");
    if (!list.includes("Dr. Rajesh Kumar")) list.push("Dr. Rajesh Kumar");
    return ["All Doctors", ...list];
  }, [patientMasterList]);

  // Sorted records
  const sortedData = useMemo(() => {
    return filteredData.toSorted((a, b) => {
      const aVal = (a as Record<string, unknown>)[sortField as string];
      const bVal = (b as Record<string, unknown>)[sortField as string];
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
  }, [filteredData, sortField, sortOrder]);

  const handleSort = (field: keyof PatientReportRecord) => {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
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
                  Patient Report
                </span>
              </nav>
              <div className="flex items-center gap-3">
                <h1
                  className="text-2xl font-bold text-[#111827]"
                  style={{ fontFamily: PP }}
                >
                  Patient Report
                </h1>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-[#009688] border border-teal-200">
                  {role || "HOSPITAL_ADMIN"} RBAC Active
                </span>
              </div>
              <p className="text-xs text-[#64748B] mt-0.5">
                Analyze patient registrations, demographics, visit history and
                OPD patient activity.
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
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium text-[#111827] bg-white border border-[#E5E7EB] hover:bg-slate-50 transition shadow-sm cursor-pointer"
              >
                <RefreshCw
                  className={`w-3.5 h-3.5 text-[#0D47A1] ${isRefreshing ? "animate-spin" : ""}`}
                />
                <span>Refresh</span>
              </button>

              <button
                onClick={handleExportAllCsv}
                className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold text-gray-700 bg-white border border-gray-300 hover:bg-slate-50 transition shadow-sm cursor-pointer mr-1"
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
                <span>Print Report</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Container */}
      <div className="w-full max-w-none px-4 sm:px-6 lg:px-8 xl:px-10 mt-6">
        {/* TOP 6 KPI CARDS SECTION AT THE VERY TOP */}
        {!isLoading && !hasError && (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
            {/* Card 1: Total Registered Patients */}
            <div className="bg-white rounded-2xl border border-[#E5E7EB] p-4 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-[#64748B]">
                    Total Registered Patients
                  </span>
                  <div className="p-2 rounded-xl bg-blue-50 text-[#0D47A1]">
                    <Users className="w-4 h-4" />
                  </div>
                </div>
                <div
                  className="text-2xl font-bold text-[#111827] mb-1"
                  style={{ fontFamily: PP }}
                >
                  {computedPatientStats.totalReg}
                </div>
                <div className="flex items-center gap-2 text-[11px] text-[#64748B] mb-2">
                  <span className="text-[#66BB6A] font-semibold flex items-center gap-0.5">
                    <TrendingUp className="w-3 h-3" /> +12.8%
                  </span>
                  <span>1,240 monthly total</span>
                </div>
              </div>
              <div className="h-8">
                {registrationTrendData.length > 0 && (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={registrationTrendData}>
                      <Line
                        type="monotone"
                        dataKey="Total"
                        stroke="#0D47A1"
                        strokeWidth={2}
                        dot={false}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>

            {/* Card 2: New Patients */}
            <div className="bg-white rounded-2xl border border-[#E5E7EB] p-4 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-[#64748B]">
                    New Patients
                  </span>
                  <div className="p-2 rounded-xl bg-teal-50 text-[#009688]">
                    <UserCheck className="w-4 h-4" />
                  </div>
                </div>
                <div
                  className="text-2xl font-bold text-[#111827] mb-1"
                  style={{ fontFamily: PP }}
                >
                   {computedPatientStats.newCount}
                </div>
                <div className="flex items-center gap-2 text-[11px] text-[#64748B] mb-2">
                  <span className="text-[#009688] font-semibold">
                    +18.2% vs last week
                  </span>
                </div>
              </div>
              {registrationTrendData.length > 0 && (
                <div className="h-8">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={registrationTrendData}>
                      <Area
                        type="monotone"
                        dataKey="New"
                        stroke="#009688"
                        fill="#009688"
                        fillOpacity={0.2}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>

            {/* Card 3: Returning Patients */}
            <div className="bg-white rounded-2xl border border-[#E5E7EB] p-4 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-[#64748B]">
                    Returning Patients
                  </span>
                  <div className="p-2 rounded-xl bg-emerald-50 text-[#66BB6A]">
                    <Activity className="w-4 h-4" />
                  </div>
                </div>
                <div
                  className="text-2xl font-bold text-[#111827] mb-1"
                  style={{ fontFamily: PP }}
                >
                   {computedPatientStats.returningCount}
                </div>
                <div className="flex items-center gap-2 text-[11px] text-[#64748B] mb-2">
                  <span className="text-[#66BB6A] font-semibold">
                    16 Repeat | 8 Follow-up
                  </span>
                </div>
              </div>
              <div className="h-8">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={[]}>
                    <Line
                      type="monotone"
                      dataKey="Returning"
                      stroke="#66BB6A"
                      strokeWidth={2}
                      dot={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Card 4: Walk-In Patients */}
            <div className="bg-white rounded-2xl border border-[#E5E7EB] p-4 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-[#64748B]">
                    Walk-In Patients
                  </span>
                  <div className="p-2 rounded-xl bg-amber-50 text-[#F59E0B]">
                    <Users className="w-4 h-4" />
                  </div>
                </div>
                <div
                  className="text-2xl font-bold text-[#111827] mb-1"
                  style={{ fontFamily: PP }}
                >
                  0
                </div>
                <div className="text-[11px] text-[#64748B]">
                  26 Scheduled Appointments
                </div>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2 flex overflow-hidden mt-3">
                <div
                  className="bg-[#F59E0B] h-full"
                  style={{ width: "24%" }}
                />
                <div
                  className="bg-[#0D47A1] h-full"
                  style={{ width: "76%" }}
                />
              </div>
            </div>

            {/* Card 5: Gender Distribution Mini */}
            <div className="bg-white rounded-2xl border border-[#E5E7EB] p-4 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-[#64748B]">
                    Gender Distribution
                  </span>
                  <div className="p-2 rounded-xl bg-indigo-50 text-[#0D47A1]">
                    <PieChartIcon className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-xs font-bold text-[#111827] mb-1">
                  Male: {genderData?.breakdown?.[0]?.percentage ?? genderData?.maleCount ? Math.round((genderData.maleCount / (genderData.totalCount || 1)) * 100) : 0}% | Female:{" "}
                  {genderData?.breakdown?.[1]?.percentage ?? genderData?.femaleCount ? Math.round((genderData.femaleCount / (genderData.totalCount || 1)) * 100) : 0}%
                </div>
                <div className="text-[11px] text-[#64748B] mb-2">
                  Other: {genderData?.breakdown?.[2]?.percentage ?? genderData?.otherCount ? Math.round((genderData.otherCount / (genderData.totalCount || 1)) * 100) : 0}%
                </div>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2 flex overflow-hidden">
                <div
                  className="bg-[#0D47A1] h-full"
                  style={{ width: "50%" }}
                />
                <div
                  className="bg-[#009688] h-full"
                  style={{ width: "46%" }}
                />
                <div
                  className="bg-[#4DB6AC] h-full"
                  style={{ width: "4%" }}
                />
              </div>
            </div>

            {/* Card 6: Average Daily Registrations */}
            <div className="bg-white rounded-2xl border border-[#E5E7EB] p-4 shadow-sm hover:shadow-md transition-shadow flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold text-[#64748B]">
                  Avg Daily Registrations
                </span>
                <div
                  className="text-2xl font-bold text-[#111827] mt-1"
                  style={{ fontFamily: PP }}
                >
                  {regSummary?.totalRegistrations
                    ? Math.round(regSummary.totalRegistrations / 7)
                    : 0}{" "}
                  / day
                </div>
                <p className="text-[11px] text-[#64748B] mt-1">
                  Peak Day: Monday (58)
                </p>
                <div className="mt-1 text-[11px] font-semibold text-[#66BB6A]">
                  Optimal Intake Capacity
                </div>
              </div>
              <CircularProgress percentage={0} size={64} strokeWidth={7} />
            </div>
          </div>
        )}

        {/* Filter & Search Bar */}
        <div className="bg-white rounded-2xl border border-[#E5E7EB] p-4 shadow-sm mb-6">
          <div
            className="flex items-center gap-2 mb-3 text-xs font-semibold text-[#111827]"
            style={{ fontFamily: PP }}
          >
            <Filter className="w-4 h-4 text-[#009688]" />
            <span>Filter Patient Demographics & Activity</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-7 gap-3">
            <div>
              <span className="block text-[11px] font-medium text-[#64748B] mb-1">
                Date Range
                <select
                  aria-label="Select option"
                  value={dateRange}
                  onChange={(e) =>
                    dispatch({
                      type: "SET_FILTER",
                      field: "dateRange",
                      value: e.target.value,
                    })
                  }
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
                Gender
                <select
                  aria-label="Select option"
                  value={genderFilter}
                  onChange={(e) =>
                    dispatch({
                      type: "SET_FILTER",
                      field: "genderFilter",
                      value: e.target.value,
                    })
                  }
                  className="w-full bg-[#F1F5F9] border border-[#E5E7EB] rounded-xl text-xs px-2.5 py-2 text-[#111827] focus:outline-none focus:ring-2 focus:ring-[#0D47A1]"
                >
                  <option>All Genders</option>
                  <option>Male</option>
                  <option>Female</option>
                  <option>Other</option>
                </select>
              </span>
            </div>

            <div>
              <span className="block text-[11px] font-medium text-[#64748B] mb-1">
                Age Group
                <select
                  aria-label="Select option"
                  value={ageGroupFilter}
                  onChange={(e) =>
                    dispatch({
                      type: "SET_FILTER",
                      field: "ageGroupFilter",
                      value: e.target.value,
                    })
                  }
                  className="w-full bg-[#F1F5F9] border border-[#E5E7EB] rounded-xl text-xs px-2.5 py-2 text-[#111827] focus:outline-none focus:ring-2 focus:ring-[#0D47A1]"
                >
                  <option>All Age Groups</option>
                  <option>0-12</option>
                  <option>13-18</option>
                  <option>19-30</option>
                  <option>31-45</option>
                  <option>46-60</option>
                  <option>60+</option>
                </select>
              </span>
            </div>

            <div>
              <span className="block text-[11px] font-medium text-[#64748B] mb-1">
                Department
                <select
                  aria-label="Select option"
                  value={deptFilter}
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
                  value={doctorFilter}
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
                  value={visitTypeFilter}
                  onChange={(e) =>
                    dispatch({
                      type: "SET_FILTER",
                      field: "visitTypeFilter",
                      value: e.target.value,
                    })
                  }
                  className="w-full bg-[#F1F5F9] border border-[#E5E7EB] rounded-xl text-xs px-2.5 py-2 text-[#111827] focus:outline-none focus:ring-2 focus:ring-[#0D47A1]"
                >
                  <option>All Visit Types</option>
                  <option>New Visit</option>
                  <option>Follow-up</option>
                  <option>Walk-in</option>
                  <option>Emergency</option>
                </select>
              </span>
            </div>

            <div>
              <span className="block text-[11px] font-medium text-[#64748B] mb-1">
                Status
                <select
                  aria-label="Select option"
                  value={regStatusFilter}
                  onChange={(e) =>
                    dispatch({
                      type: "SET_FILTER",
                      field: "regStatusFilter",
                      value: e.target.value,
                    })
                  }
                  className="w-full bg-[#F1F5F9] border border-[#E5E7EB] rounded-xl text-xs px-2.5 py-2 text-[#111827] focus:outline-none focus:ring-2 focus:ring-[#0D47A1]"
                >
                  <option>All Statuses</option>
                  <option>Active</option>
                  <option>Completed</option>
                  <option>Pending Follow-up</option>
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
                placeholder="Search Patient Name, MRN, Mobile Number, Doctor, Department..."
                className="w-full pl-10 pr-16 py-2 bg-[#F1F5F9] border border-[#E5E7EB] rounded-xl text-xs text-[#111827] placeholder-[#64748B] focus:outline-none focus:ring-2 focus:ring-[#0D47A1]"
              />
              {searchQuery && (
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
                className="px-4 py-1.5 rounded-xl text-xs font-medium text-white bg-[#009688] hover:bg-teal-700 transition shadow-sm"
              >
                Apply Filters
              </button>
            </div>
          </div>
        </div>

        {/* APPLIED FILTER CHIPS */}
        {(appliedFilters.dateRange !== "Today" ||
          appliedFilters.gender !== "All Genders" ||
          appliedFilters.ageGroup !== "All Age Groups" ||
          appliedFilters.dept !== "All Departments" ||
          appliedFilters.doctor !== "All Doctors" ||
          appliedFilters.visitType !== "All Visit Types" ||
          appliedFilters.regStatus !== "All Statuses" ||
          searchQuery) && (
          <div className="flex items-center gap-2 flex-wrap mb-4 bg-white p-3 rounded-2xl border border-[#E5E7EB] text-xs">
            <span
              className="font-semibold text-[#64748B] mr-1"
              style={{ fontFamily: PP }}
            >
              Applied Filters:
            </span>
            {appliedFilters.dateRange !== "Today" && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-blue-50 text-[#0D47A1] border border-blue-200 font-medium">
                Period: {appliedFilters.dateRange}
                <button
                  onClick={() => {
                    dispatch({
                      type: "SET_FILTER",
                      field: "dateRange",
                      value: "Today",
                    });
                    dispatch({
                      type: "SET_APPLIED_FILTER",
                      field: "dateRange",
                      value: "Today",
                    });
                  }}
                  className="hover:text-red-500 font-bold ml-1"
                >
                  Ã—
                </button>
              </span>
            )}
            {appliedFilters.dept !== "All Departments" && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-teal-50 text-[#009688] border border-teal-200 font-medium">
                Dept: {appliedFilters.dept}
                <button
                  onClick={() => {
                    dispatch({
                      type: "SET_FILTER",
                      field: "deptFilter",
                      value: "All Departments",
                    });
                    dispatch({
                      type: "SET_APPLIED_FILTER",
                      field: "dept",
                      value: "All Departments",
                    });
                  }}
                  className="hover:text-red-500 font-bold ml-1"
                >
                  Ã—
                </button>
              </span>
            )}
            {appliedFilters.doctor !== "All Doctors" && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-50 text-[#66BB6A] border border-emerald-200 font-medium">
                Doctor: {appliedFilters.doctor}
                <button
                  onClick={() => {
                    dispatch({
                      type: "SET_FILTER",
                      field: "doctorFilter",
                      value: "All Doctors",
                    });
                    dispatch({
                      type: "SET_APPLIED_FILTER",
                      field: "doctor",
                      value: "All Doctors",
                    });
                  }}
                  className="hover:text-red-500 font-bold ml-1"
                >
                  Ã—
                </button>
              </span>
            )}
            {appliedFilters.gender !== "All Genders" && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#F1F5F9] text-[#111827] border border-[#E5E7EB] font-medium">
                Gender: {appliedFilters.gender}
                <button
                  onClick={() => {
                    dispatch({
                      type: "SET_FILTER",
                      field: "genderFilter",
                      value: "All Genders",
                    });
                    dispatch({
                      type: "SET_APPLIED_FILTER",
                      field: "gender",
                      value: "All Genders",
                    });
                  }}
                  className="hover:text-red-500 font-bold ml-1"
                >
                  Ã—
                </button>
              </span>
            )}
            {appliedFilters.visitType !== "All Visit Types" && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-50 text-[#F59E0B] border border-amber-200 font-medium">
                Type: {appliedFilters.visitType}
                <button
                  onClick={() => {
                    dispatch({
                      type: "SET_FILTER",
                      field: "visitTypeFilter",
                      value: "All Visit Types",
                    });
                    dispatch({
                      type: "SET_APPLIED_FILTER",
                      field: "visitType",
                      value: "All Visit Types",
                    });
                  }}
                  className="hover:text-red-500 font-bold ml-1"
                >
                  Ã—
                </button>
              </span>
            )}
            {searchQuery && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-100 text-[#111827] border border-slate-300 font-medium">
                Search: "{searchQuery}"
                <button
                  onClick={() => dispatch({ type: "SET_SEARCH", payload: "" })}
                  className="hover:text-red-500 font-bold ml-1"
                >
                  Ã—
                </button>
              </span>
            )}
            <button
              onClick={handleResetFilters}
              className="text-xs text-[#EF4444] font-semibold hover:underline ml-auto"
            >
              Clear All Filters
            </button>
          </div>
        )}

        {/* Demo State Controls */}
        <div className="flex items-center justify-between mb-4 bg-white p-2.5 rounded-xl border border-[#E5E7EB] text-xs">
          <div className="flex items-center gap-3">
            <span className="font-semibold text-[#111827]">
              Demo State Toggles:
            </span>
            <button
              onClick={() => {
                dispatch({ type: "LOAD_START" });
                dispatch({ type: "SET_ERROR", payload: false });
              }}
              className={`px-2.5 py-1 rounded-lg border text-xs ${isLoading ? "bg-amber-50 border-amber-300 text-[#F59E0B]" : "bg-slate-50 border-[#E5E7EB] text-[#64748B]"}`}
            >
              Toggle Loading Skeleton
            </button>
            <button
              onClick={() => {
                dispatch({ type: "SET_ERROR", payload: !hasError });
              }}
              className={`px-2.5 py-1 rounded-lg border text-xs ${hasError ? "bg-red-50 border-red-300 text-[#EF4444]" : "bg-slate-50 border-[#E5E7EB] text-[#64748B]"}`}
            >
              Toggle Error State
            </button>
          </div>
          <span className="text-[11px] text-[#64748B]">
            Simulate real-time patient register states
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
              Connection timeout while fetching patient demographic database.
              Please retry.
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
          <div className="space-y-6 w-full">

              {/* PATIENT REGISTRATION TREND AREA CHART */}
              <div className="bg-white rounded-2xl border border-[#E5E7EB] p-6 shadow-sm">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                  <div>
                    <h3
                      className="text-base font-bold text-[#111827]"
                      style={{ fontFamily: PP }}
                    >
                      Patient Registration Trend
                    </h3>
                    <p className="text-xs text-[#64748B]">
                      Daily volume tracking of new vs returning registered
                      patients
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
                      data={registrationTrendData}
                      margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                    >
                      <defs>
                        <linearGradient
                          id="colorNewGrad"
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
                          id="colorRetGrad"
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
                        dataKey="New"
                        name="New Patients"
                        stroke="#009688"
                        fillOpacity={1}
                        fill="url(#colorNewGrad)"
                      />
                      <Area
                        type="monotone"
                        dataKey="Returning"
                        name="Returning Patients"
                        stroke="#0D47A1"
                        fillOpacity={1}
                        fill="url(#colorRetGrad)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* AGE DISTRIBUTION & GENDER DISTRIBUTION CHARTS */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Patient Age Distribution Vertical Bar */}
                <div className="bg-white rounded-2xl border border-[#E5E7EB] p-5 shadow-sm">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3
                        className="text-sm font-bold text-[#111827]"
                        style={{ fontFamily: PP }}
                      >
                        Patient Age Demographics
                      </h3>
                      <p className="text-[11px] text-[#64748B]">
                        Distribution of patients across age groups
                      </p>
                    </div>
                    <Users className="w-4 h-4 text-[#0D47A1]" />
                  </div>
                  <div className="h-60">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={dynamicAgeData}
                        margin={{ top: 10, right: 10, left: -15, bottom: 0 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                        <XAxis
                          dataKey="group"
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
                          dataKey="count"
                          name="Patient Count"
                          fill="#0D47A1"
                          radius={[4, 4, 0, 0]}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Gender Distribution Donut */}
                <div className="bg-white rounded-2xl border border-[#E5E7EB] p-5 shadow-sm">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3
                        className="text-sm font-bold text-[#111827]"
                        style={{ fontFamily: PP }}
                      >
                        Gender Breakdown
                      </h3>
                      <p className="text-[11px] text-[#64748B]">
                        Ratio of Male, Female, and Other registrations
                      </p>
                    </div>
                    <PieChartIcon className="w-4 h-4 text-[#009688]" />
                  </div>
                  <div className="h-60">
                    <ResponsiveContainer width="100%" height="100%">
                      <RechartsPie>
                        <Pie
                          data={dynamicGenderData}
                          cx="50%"
                          cy="50%"
                          innerRadius={45}
                          outerRadius={75}
                          paddingAngle={3}
                          dataKey="value"
                        >
                          {dynamicGenderData.map((entry) => (
                            <Cell
                              key={entry.name}
                              fill={entry.color || "#0D47A1"}
                            />
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

              {/* DEPARTMENT PATIENT VISITS & DOCTOR PATIENT DISTRIBUTION */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Department Visits Horizontal Bar */}
                <div className="bg-white rounded-2xl border border-[#E5E7EB] p-5 shadow-sm">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3
                        className="text-sm font-bold text-[#111827]"
                        style={{ fontFamily: PP }}
                      >
                        Department-wise Patient Visits
                      </h3>
                      <p className="text-[11px] text-[#64748B]">
                        Total patient visits per specialty department
                      </p>
                    </div>
                    <Building2 className="w-4 h-4 text-[#009688]" />
                  </div>
                  <div className="h-60">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        layout="vertical"
                        data={dynamicDeptData}
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
                          dataKey="total"
                          name="Total Visits"
                          fill="#009688"
                          radius={[0, 4, 4, 0]}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Doctor Patient Distribution Vertical Bar */}
                <div className="bg-white rounded-2xl border border-[#E5E7EB] p-5 shadow-sm">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3
                        className="text-sm font-bold text-[#111827]"
                        style={{ fontFamily: PP }}
                      >
                        Doctor-wise Patient Workload
                      </h3>
                      <p className="text-[11px] text-[#64748B]">
                        Assigned patient load per attending physician
                      </p>
                    </div>
                    <UserCheck className="w-4 h-4 text-[#0D47A1]" />
                  </div>
                  <div className="h-60">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={dynamicDoctorData}
                        margin={{ top: 10, right: 10, left: -15, bottom: 0 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                        <XAxis
                          dataKey="doctor"
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
                          dataKey="assigned"
                          name="Assigned Patients"
                          fill="#0D47A1"
                          radius={[4, 4, 0, 0]}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>

              {/* PATIENT REPORT TABLE */}
              <div className="bg-white rounded-2xl border border-[#E5E7EB] shadow-sm overflow-hidden">
                <div className="p-5 border-b border-[#E5E7EB] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div>
                    <h3
                      className="text-base font-bold text-[#111827]"
                      style={{ fontFamily: PP }}
                    >
                      Patient Master Register
                    </h3>
                    <p className="text-xs text-[#64748B]">
                      Detailed OPD patient demographic and visit registry
                    </p>
                  </div>
                  <button
                    onClick={() =>
                      alert("Exporting Patient Master Register (CSV)...")
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
                        <th
                          tabIndex={0}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" || e.key === " ") {
                              e.preventDefault();
                              (e.currentTarget as HTMLElement).click();
                            }
                          }}
                          className="py-3.5 px-4 cursor-pointer hover:text-[#0D47A1]"
                          onClick={() => handleSort("mrn")}
                        >
                          MRN{" "}
                          {sortField === "mrn" &&
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
                          onClick={() => handleSort("patientName")}
                        >
                          Patient Name{" "}
                          {sortField === "patientName" &&
                            (sortOrder === "asc" ? "â†‘" : "â†“")}
                        </th>
                        <th className="py-3.5 px-4">Age / Gender</th>
                        <th className="py-3.5 px-4">Mobile</th>
                        <th className="py-3.5 px-4">Department</th>
                        <th className="py-3.5 px-4">Attending Doctor</th>
                        <th className="py-3.5 px-4">Reg. Date</th>
                        <th className="py-3.5 px-4">Visit Type</th>
                        <th className="py-3.5 px-4 text-center">Status</th>
                        <th className="py-3.5 px-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E5E7EB] text-xs">
                      {sortedData.length === 0 ? (
                        <tr>
                          <td
                            colSpan={10}
                            className="py-8 text-center text-[#64748B]"
                          >
                            No patient records match the selected filter
                            criteria.
                          </td>
                        </tr>
                      ) : (
                        sortedData.map((item) => (
                          <tr
                            key={item.mrn}
                            className="hover:bg-slate-50 transition-colors"
                          >
                            <td className="py-3.5 px-4 font-bold text-[#0D47A1]">
                              {item.mrn}
                            </td>
                            <td className="py-3.5 px-4 font-semibold text-[#111827]">
                              {item.patientName}
                            </td>
                            <td className="py-3.5 px-4 text-[#64748B]">
                              {item.age} yrs / {item.gender}
                            </td>
                            <td className="py-3.5 px-4 text-[#64748B]">
                              {item.mobile}
                            </td>
                            <td className="py-3.5 px-4 font-medium text-[#111827]">
                              {item.department}
                            </td>
                            <td className="py-3.5 px-4 text-[#111827]">
                              {item.doctorName}
                            </td>
                            <td className="py-3.5 px-4 text-[#64748B]">
                              {item.registrationDate}
                            </td>
                            <td className="py-3.5 px-4">
                              <span className="px-2 py-0.5 rounded bg-slate-100 text-[#64748B] text-[10px] font-medium">
                                {item.visitType}
                              </span>
                            </td>
                            <td className="py-3.5 px-4 text-center">
                              <span
                                className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${item.status === "Active" ? "bg-teal-50 border-teal-200 text-[#009688]" : item.status === "Completed" ? "bg-green-50 border-green-200 text-[#66BB6A]" : "bg-amber-50 border-amber-200 text-[#F59E0B]"}`}
                              >
                                {item.status}
                              </span>
                            </td>
                            <td className="py-3.5 px-4 text-right">
                              <div className="flex items-center justify-end gap-1">
                                <button
                                  onClick={() => setSelectedPatientModal(item)}
                                  className="p-1.5 text-[#0D47A1] hover:bg-blue-50 rounded-lg transition cursor-pointer"
                                  title="View Patient Details"
                                >
                                  <Eye className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() =>
                                    alert(`Printing summary for ${item.mrn}`)
                                  }
                                  className="p-1.5 text-[#64748B] hover:bg-slate-100 rounded-lg transition cursor-pointer"
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

              {/* RECENT PATIENT VISIT ACTIVITY TIMELINE */}
              <div className="bg-white rounded-2xl border border-[#E5E7EB] p-6 shadow-sm">
                <h3
                  className="text-base font-bold text-[#111827] mb-4"
                  style={{ fontFamily: PP }}
                >
                  Recent Patient Registration & Visit Activity
                </h3>
                <div className="space-y-4 relative before:absolute before:inset-0 before:left-3.5 before:w-0.5 before:bg-[#E5E7EB]">
                  {filteredData.slice(0, 5).map((act, idx) => (
                    <div
                      key={act.mrn + idx}
                      className="flex items-start gap-4 relative z-10"
                    >
                      <div className="w-7 h-7 rounded-full bg-white border-2 border-[#0D47A1] flex items-center justify-center text-[#0D47A1] shrink-0">
                        <UserCheck className="w-3.5 h-3.5" />
                      </div>
                      <div className="bg-[#F1F5F9] rounded-xl p-3 border border-[#E5E7EB] flex-1 text-xs">
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-bold text-[#111827]">
                            {act.patientName} ({act.mrn})
                          </span>
                          <span className="text-[11px] text-[#64748B]">
                            {act.registrationDate}
                          </span>
                        </div>
                        <p className="text-[#64748B]">
                          Event:{" "}
                          <strong className="text-[#0D47A1]">{act.visitType}</strong>{" "}
                          with{" "}
                          <span className="font-semibold text-[#111827]">
                            {act.doctorName}
                          </span>
                          .
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
          </div>
        )}

        {/* FOOTER */}
        <div className="mt-8 pt-4 border-t border-[#E5E7EB] flex flex-col sm:flex-row items-center justify-between text-xs text-[#64748B] gap-2">
          <div>
            Showing{" "}
            <strong className="text-[#111827]">
              {filteredData.length} Patient Report Results
            </strong>
          </div>
          <div>Hospital Management System â€¢ Patient Report v1.0</div>
          <div>
            Last Refreshed:{" "}
            <strong className="text-[#111827]">{lastRefreshed}</strong>
          </div>
        </div>
      </div>

      {/* ENTERPRISE EXPORT REPORT MODAL */}
      {showExportModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-[#E5E7EB] max-w-md w-full p-6 shadow-2xl relative transition-opacity duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-[#E5E7EB] mb-4">
              <h3
                className="text-base font-bold text-[#111827]"
                style={{ fontFamily: PP }}
              >
                Export Patient Report
              </h3>
              <button
                onClick={() => setShowExportModal(false)}
                className="p-1 rounded-lg text-[#64748B] hover:text-[#111827] hover:bg-slate-100 transition"
              >
                âœ•
              </button>
            </div>

            <div className="space-y-4 text-xs" style={{ fontFamily: RB }}>
              <div>
                <span
                  className="block font-semibold text-[#111827] mb-2"
                  style={{ fontFamily: PP }}
                >
                  Export Format
                </span>
                <div className="grid grid-cols-3 gap-2">
                  <label
                    className={`flex items-center gap-2 p-2.5 rounded-xl border cursor-pointer transition ${exportFormat === "pdf" ? "bg-blue-50 border-[#0D47A1] text-[#0D47A1] font-semibold" : "bg-slate-50 border-[#E5E7EB] text-[#64748B]"}`}
                  >
                    <input
                      type="radio"
                      name="exportFormat"
                      value="pdf"
                      checked={exportFormat === "pdf"}
                      onChange={() => setExportFormat("pdf")}
                      className="accent-[#0D47A1]"
                    />
                    <span>PDF</span>
                  </label>
                  <label
                    className={`flex items-center gap-2 p-2.5 rounded-xl border cursor-pointer transition ${exportFormat === "excel" ? "bg-teal-50 border-[#009688] text-[#009688] font-semibold" : "bg-slate-50 border-[#E5E7EB] text-[#64748B]"}`}
                  >
                    <input
                      type="radio"
                      name="exportFormat"
                      value="excel"
                      checked={exportFormat === "excel"}
                      onChange={() => setExportFormat("excel")}
                      className="accent-[#009688]"
                    />
                    <span>Excel</span>
                  </label>
                  <label
                    className={`flex items-center gap-2 p-2.5 rounded-xl border cursor-pointer transition ${exportFormat === "csv" ? "bg-slate-100 border-slate-400 text-[#111827] font-semibold" : "bg-slate-50 border-[#E5E7EB] text-[#64748B]"}`}
                  >
                    <input
                      type="radio"
                      name="exportFormat"
                      value="csv"
                      checked={exportFormat === "csv"}
                      onChange={() => setExportFormat("csv")}
                      className="accent-slate-700"
                    />
                    <span>CSV</span>
                  </label>
                </div>
              </div>

              <div>
                <span
                  className="block font-semibold text-[#111827] mb-2"
                  style={{ fontFamily: PP }}
                >
                  Export Scope
                </span>
                <div className="grid grid-cols-3 gap-2">
                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="exportScope"
                      value="page"
                      checked={exportScope === "page"}
                      onChange={() => setExportScope("page")}
                      className="accent-[#0D47A1]"
                    />
                    <span>Current Page</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="exportScope"
                      value="filtered"
                      checked={exportScope === "filtered"}
                      onChange={() => setExportScope("filtered")}
                      className="accent-[#0D47A1]"
                    />
                    <span>Filtered Data</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="exportScope"
                      value="complete"
                      checked={exportScope === "complete"}
                      onChange={() => setExportScope("complete")}
                      className="accent-[#0D47A1]"
                    />
                    <span>Complete</span>
                  </label>
                </div>
              </div>

              {exportFormat !== "csv" && (
                <div>
                  <span
                    className="block font-semibold text-[#111827] mb-2"
                    style={{ fontFamily: PP }}
                  >
                    Include Options
                  </span>
                  <div className="grid grid-cols-2 gap-2">
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={includeOptions.kpi}
                        onChange={(e) =>
                          setIncludeOptions({
                            ...includeOptions,
                            kpi: e.target.checked,
                          })
                        }
                        className="accent-[#0D47A1]"
                      />
                      <span>KPI Summary</span>
                    </label>
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={includeOptions.charts}
                        onChange={(e) =>
                          setIncludeOptions({
                            ...includeOptions,
                            charts: e.target.checked,
                          })
                        }
                        className="accent-[#0D47A1]"
                      />
                      <span>Charts</span>
                    </label>
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={includeOptions.tables}
                        onChange={(e) =>
                          setIncludeOptions({
                            ...includeOptions,
                            tables: e.target.checked,
                          })
                        }
                        className="accent-[#0D47A1]"
                      />
                      <span>Tables</span>
                    </label>
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={includeOptions.filters}
                        onChange={(e) =>
                          setIncludeOptions({
                            ...includeOptions,
                            filters: e.target.checked,
                          })
                        }
                        className="accent-[#0D47A1]"
                      />
                      <span>Applied Filters</span>
                    </label>
                  </div>
                </div>
              )}

              <div>
                <span
                  className="block font-semibold text-[#111827] mb-1"
                  style={{ fontFamily: PP }}
                >
                  File Name
                </span>
                <div className="p-2.5 bg-slate-50 border border-[#E5E7EB] rounded-xl font-mono text-xs text-[#0D47A1] font-semibold">
                  Patient_Report_{dateRange.replace(/\s+/g, "_")}.
                  {exportFormat === "excel" ? "xlsx" : exportFormat}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#E5E7EB] mt-6">
              <button
                onClick={() => setShowExportModal(false)}
                className="px-4 py-2 bg-white border border-[#E5E7EB] text-[#64748B] rounded-xl text-xs font-semibold hover:bg-slate-50 transition"
                style={{ fontFamily: PP }}
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  alert(
                    `Exporting Patient Report as ${exportFormat.toUpperCase()}...`,
                  );
                  setShowExportModal(false);
                }}
                className="px-4 py-2 bg-[#0D47A1] text-white rounded-xl text-xs font-semibold hover:bg-blue-900 transition shadow-sm flex items-center gap-1.5"
                style={{ fontFamily: PP }}
              >
                <Download size={14} />
                <span>Export</span>
              </button>
            </div>
          </div>
        </div>
      )}
      {/* PATIENT DETAILS MODAL */}
      {selectedPatientModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-[#E5E7EB] shadow-2xl max-w-md w-full p-6 space-y-4 transition-transform duration-200">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#0D47A1] flex items-center justify-center font-bold">
                  <User size={20} />
                </div>
                <div>
                  <h3
                    className="text-sm font-bold text-[#111827]"
                    style={{ fontFamily: PP }}
                  >
                    {selectedPatientModal.patientName}
                  </h3>
                  <p className="text-xs text-[#0D47A1] font-mono font-semibold">
                    {selectedPatientModal.mrn}
                  </p>
                </div>
              </div>
              <button
                aria-label="Close modal"
                onClick={() => setSelectedPatientModal(null)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <div
              className="grid grid-cols-2 gap-3 text-xs"
              style={{ fontFamily: RB }}
            >
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-slate-400 block text-[10px] uppercase font-bold mb-0.5">
                  Age / Gender
                </span>
                <span className="font-semibold text-[#111827]">
                  {selectedPatientModal.age} yrs / {selectedPatientModal.gender}
                </span>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-slate-400 block text-[10px] uppercase font-bold mb-0.5">
                  Mobile
                </span>
                <span className="font-semibold text-[#111827]">
                  {selectedPatientModal.mobile || "N/A"}
                </span>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-slate-400 block text-[10px] uppercase font-bold mb-0.5">
                  Department
                </span>
                <span className="font-semibold text-[#009688]">
                  {selectedPatientModal.department}
                </span>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-slate-400 block text-[10px] uppercase font-bold mb-0.5">
                  Doctor
                </span>
                <span className="font-semibold text-[#111827]">
                  {selectedPatientModal.doctorName}
                </span>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-slate-400 block text-[10px] uppercase font-bold mb-0.5">
                  Visit Type
                </span>
                <span className="font-semibold text-[#111827]">
                  {selectedPatientModal.visitType}
                </span>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-slate-400 block text-[10px] uppercase font-bold mb-0.5">
                  Reg. Date
                </span>
                <span className="font-semibold text-[#111827]">
                  {selectedPatientModal.registrationDate}
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-gray-100">
              <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-teal-50 text-[#009688] border border-teal-200">
                Status: {selectedPatientModal.status}
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="px-3.5 py-2 rounded-xl border border-slate-200 text-slate-700 text-xs font-semibold hover:bg-slate-50 flex items-center gap-1.5 cursor-pointer"
                >
                  <Printer size={14} />
                  Print Record
                </button>
                <button
                  onClick={() => setSelectedPatientModal(null)}
                  className="px-4 py-2 rounded-xl bg-[#0D47A1] text-white text-xs font-bold hover:bg-blue-900 transition shadow-sm cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
