import { useState, useReducer, useMemo } from "react";
import { useNavigate } from "react-router";
import { ROUTES } from "../../../app/routes/routes";
import {
  Calendar,
  Download,
  RefreshCw,
  Filter,
  Search,
  ChevronRight,
  Users,
  UserCheck,
  Activity,
  TrendingUp,
  CheckCircle2,
  Clock,
  PieChart as PieChartIcon,
  Printer,
  ChevronLeft,
  ChevronRight as ChevronRightIcon,
  AlertCircle,
} from "lucide-react";
import { useHospitalBranding } from "../../settings/hooks/useHospitalBranding";
import safehandshospital_logo from "../../../assets/safehandshospital_logo.webp";
import {
  useReceptionDashboardSummary,
  useReceptionSummaryWidget,
  useReceptionRegister,
  useReceptionActivityLog,
  useReceptionAppointmentStatus,
  useReceptionCheckinAnalytics,
  useReceptionRegistrationTrend,
  useReceptionQueuePerformance,
} from "../../reception/hooks/useReceptionReports";
import type {
  ReceptionAppointmentStatusData,
  ReceptionCheckinAnalyticsData,
  ReceptionQueuePerformanceData,
  ReceptionRegistrationTrendData,
} from "../../reception/types/receptionReports.types";
import { downloadAppointmentSlipPdf } from "../../../utils/appointmentPdf.utils";
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

export interface ReceptionistActivityRecord {
  mrn: string;
  patientName: string;
  appointmentId: string;
  visitType: string;
  registrationDate?: string;
  registrationTime: string;
  checkInTime: string;
  queueStatus: string;
  appointmentStatus: string;
}

const getOffsetDateStr = (daysAgo: number) => {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const SAMPLE_RECEPTION_ACTIVITIES: ReceptionistActivityRecord[] = [
  {
    mrn: "MRN-2026-001",
    patientName: "John Doe",
    appointmentId: "APT-1001",
    visitType: "New Patient",
    registrationDate: getOffsetDateStr(0),
    registrationTime: "08:30 AM",
    checkInTime: "08:35 AM",
    queueStatus: "In Consultation",
    appointmentStatus: "Completed",
  },
  {
    mrn: "MRN-2026-002",
    patientName: "Jane Smith",
    appointmentId: "APT-1002",
    visitType: "Follow-up",
    registrationDate: getOffsetDateStr(0),
    registrationTime: "09:00 AM",
    checkInTime: "09:10 AM",
    queueStatus: "Waiting Room",
    appointmentStatus: "Checked-In",
  },
  {
    mrn: "MRN-2026-003",
    patientName: "Robert Johnson",
    appointmentId: "APT-1003",
    visitType: "Walk-In",
    registrationDate: getOffsetDateStr(1),
    registrationTime: "09:15 AM",
    checkInTime: "09:20 AM",
    queueStatus: "Completed Queue",
    appointmentStatus: "Completed",
  },
  {
    mrn: "MRN-2026-004",
    patientName: "Emily Davis",
    appointmentId: "APT-1004",
    visitType: "Routine Checkup",
    registrationDate: getOffsetDateStr(1),
    registrationTime: "10:00 AM",
    checkInTime: "10:05 AM",
    queueStatus: "Waiting Room",
    appointmentStatus: "Booked",
  },
  {
    mrn: "MRN-2026-005",
    patientName: "Michael Brown",
    appointmentId: "APT-1005",
    visitType: "New Patient",
    registrationDate: getOffsetDateStr(3),
    registrationTime: "10:30 AM",
    checkInTime: "10:35 AM",
    queueStatus: "In Consultation",
    appointmentStatus: "Checked-In",
  },
  {
    mrn: "MRN-2026-006",
    patientName: "Sarah Wilson",
    appointmentId: "APT-1006",
    visitType: "Follow-up",
    registrationDate: getOffsetDateStr(5),
    registrationTime: "11:00 AM",
    checkInTime: "Pending",
    queueStatus: "Waiting Room",
    appointmentStatus: "Booked",
  },
  {
    mrn: "MRN-2026-007",
    patientName: "David Miller",
    appointmentId: "APT-1007",
    visitType: "Walk-In",
    registrationDate: getOffsetDateStr(12),
    registrationTime: "02:15 PM",
    checkInTime: "02:20 PM",
    queueStatus: "Completed Queue",
    appointmentStatus: "Completed",
  },
];

type ReceptionDashboardHeaderProps = {
  isRefreshing: boolean;
  onRefresh: () => void;
  onExportCsv: () => void;
  onPrint: () => void;
};

const ReceptionDashboardHeader = ({
  isRefreshing,
  onRefresh,
  onExportCsv,
  onPrint,
}: ReceptionDashboardHeaderProps) => (
  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
    <div>
      <div className="flex items-center gap-3">
        <h1
          className="text-xl font-bold text-[#111827]"
          style={{ fontFamily: PP }}
        >
          Reports Dashboard
        </h1>
        <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#0D47A1]/10 text-[#0D47A1] border border-blue-200">
          Reception Scoped
        </span>
      </div>
      <p className="text-xs text-[#64748B] mt-0.5">
        Monitor daily reception activities, patient registrations,
        appointments and queue performance.
      </p>
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
        onClick={onRefresh}
        className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-medium text-[#111827] bg-white border border-[#E5E7EB] hover:bg-slate-50 transition shadow-sm cursor-pointer"
      >
        <RefreshCw
          className={`w-3.5 h-3.5 text-[#0D47A1] ${isRefreshing ? "animate-spin" : ""}`}
        />
        <span>Refresh</span>
      </button>

      <button
        onClick={onExportCsv}
        className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-medium text-white bg-[#0D47A1] hover:bg-blue-900 transition shadow-sm cursor-pointer"
      >
        <Download className="w-3.5 h-3.5" />
        <span>Export CSV</span>
      </button>

      <button
        onClick={onPrint}
        className="inline-flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium text-[#111827] bg-white border border-[#E5E7EB] hover:bg-slate-50 transition shadow-sm cursor-pointer"
      >
        <Printer className="w-3.5 h-3.5 text-[#0D47A1]" />
        <span>Print Report</span>
      </button>
    </div>
  </div>
);

type ReceptionKpiCardsProps = {
  kpi: {
    todayRegistrations: number;
    todayAppointments: number;
    checkedInPatients: number;
    receptionQueue: number;
    completedCheckIns: number;
    avgWaitingTime: string;
  };
  navigate: ReturnType<typeof useNavigate>;
};

const ReceptionKpiCards = ({ kpi, navigate }: ReceptionKpiCardsProps) => (
  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
    {/* Card 1: Today's Registrations */}
    <div
      role="button"
      tabIndex={0}
      onClick={() => navigate(ROUTES.PATIENTS)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          navigate(ROUTES.PATIENTS);
        }
      }}
      className="bg-white rounded-2xl border border-[#E5E7EB] p-4 shadow-sm hover:shadow-md transition-shadow cursor-pointer group flex flex-col justify-between"
    >
      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold text-[#64748B] group-hover:text-[#0D47A1] transition">
            Today's Registrations
          </span>
          <div className="p-2 rounded-xl bg-blue-50 text-[#0D47A1]">
            <Users className="w-4 h-4" />
          </div>
        </div>
        <div
          className="text-2xl font-bold text-[#111827] mb-1"
          style={{ fontFamily: PP }}
        >
          {kpi.todayRegistrations}
        </div>
      </div>
      <div>
        <div className="flex items-center justify-between text-[11px] text-[#64748B] mb-2">
          <span className="text-[#66BB6A] font-semibold flex items-center gap-0.5">
            <TrendingUp className="w-3 h-3" /> Live
          </span>
          <span className="text-[#0D47A1] font-semibold flex items-center gap-0.5 group-hover:underline">
            View <ChevronRight className="w-3 h-3" />
          </span>
        </div>
        <div className="grid grid-cols-2 gap-1 pt-2 border-t border-[#E5E7EB] text-[11px] text-center">
          <div>
            <div className="text-[#0D47A1] font-bold">
              {kpi.todayRegistrations}
            </div>
            <div className="text-[#64748B]">New</div>
          </div>
          <div>
            <div className="text-[#009688] font-bold">0</div>
            <div className="text-[#64748B]">Return</div>
          </div>
        </div>
      </div>
    </div>

    {/* Card 2: Today's Appointments */}
    <div
      role="button"
      tabIndex={0}
      onClick={() => navigate(ROUTES.APPOINTMENTS)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          navigate(ROUTES.APPOINTMENTS);
        }
      }}
      className="bg-white rounded-2xl border border-[#E5E7EB] p-4 shadow-sm hover:shadow-md transition-shadow cursor-pointer group flex flex-col justify-between"
    >
      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold text-[#64748B] group-hover:text-[#009688] transition">
            Today's Appointments
          </span>
          <div className="p-2 rounded-xl bg-teal-50 text-[#009688]">
            <Calendar className="w-4 h-4" />
          </div>
        </div>
        <div
          className="text-2xl font-bold text-[#111827] mb-1"
          style={{ fontFamily: PP }}
        >
          {kpi.todayAppointments}
        </div>
      </div>
      <div>
        <div className="flex items-center justify-between text-[11px] text-[#64748B] mb-2">
          <span className="text-[#009688] font-semibold">
            {kpi.completedCheckIns} Done
          </span>
          <span className="text-[#009688] font-semibold flex items-center gap-0.5 group-hover:underline">
            View <ChevronRight className="w-3 h-3" />
          </span>
        </div>
        <div className="grid grid-cols-2 gap-1 pt-2 border-t border-[#E5E7EB] text-[11px] text-center">
          <div>
            <div className="text-[#0D47A1] font-bold">
              {kpi.todayAppointments}
            </div>
            <div className="text-[#64748B]">Booked</div>
          </div>
          <div>
            <div className="text-[#66BB6A] font-bold">
              {kpi.completedCheckIns}
            </div>
            <div className="text-[#64748B]">Completed</div>
          </div>
        </div>
      </div>
    </div>

    {/* Card 3: Checked-In Patients */}
    <div
      role="button"
      tabIndex={0}
      onClick={() => navigate(ROUTES.QUEUE)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          navigate(ROUTES.QUEUE);
        }
      }}
      className="bg-white rounded-2xl border border-[#E5E7EB] p-4 shadow-sm hover:shadow-md transition-shadow cursor-pointer group flex flex-col justify-between"
    >
      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold text-[#64748B] group-hover:text-[#66BB6A] transition">
            Checked-In Patients
          </span>
          <div className="p-2 rounded-xl bg-emerald-50 text-[#66BB6A]">
            <UserCheck className="w-4 h-4" />
          </div>
        </div>
        <div
          className="text-2xl font-bold text-[#111827] mb-1"
          style={{ fontFamily: PP }}
        >
          {kpi.checkedInPatients}
        </div>
      </div>
      <div>
        <div className="flex items-center justify-between text-[11px] text-[#64748B] mb-2">
          <span className="text-[#66BB6A] font-semibold">Checked Rate</span>
          <span className="text-[#66BB6A] font-semibold flex items-center gap-0.5 group-hover:underline">
            View <ChevronRight className="w-3 h-3" />
          </span>
        </div>
        <div className="grid grid-cols-2 gap-1 pt-2 border-t border-[#E5E7EB] text-[11px] text-center">
          <div>
            <div className="text-[#66BB6A] font-bold">
              {kpi.checkedInPatients}
            </div>
            <div className="text-[#64748B]">Checked In</div>
          </div>
          <div>
            <div className="text-[#F59E0B] font-bold">{kpi.receptionQueue}</div>
            <div className="text-[#64748B]">Waiting</div>
          </div>
        </div>
      </div>
    </div>

    {/* Card 4: Reception Queue */}
    <div className="bg-white rounded-2xl border border-[#E5E7EB] p-4 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold text-[#64748B]">
            Reception Queue
          </span>
          <div className="p-2 rounded-xl bg-amber-50 text-[#F59E0B]">
            <Activity className="w-4 h-4" />
          </div>
        </div>
        <div
          className="text-2xl font-bold text-[#111827] mb-1"
          style={{ fontFamily: PP }}
        >
          {kpi.receptionQueue}
        </div>
      </div>
      <div>
        <div className="flex items-center gap-2 text-[11px] text-[#64748B] mb-2">
          <span className="text-[#F59E0B] font-semibold">Patients Waiting</span>
        </div>
        <div className="grid grid-cols-2 gap-1 pt-2 border-t border-[#E5E7EB] text-[11px] text-center">
          <div>
            <div className="text-[#F59E0B] font-bold">{kpi.receptionQueue}</div>
            <div className="text-[#64748B]">Waiting</div>
          </div>
          <div>
            <div className="text-[#0D47A1] font-bold">{kpi.avgWaitingTime}</div>
            <div className="text-[#64748B]">Avg Queue</div>
          </div>
        </div>
      </div>
    </div>

    {/* Card 5: Completed Check-Ins */}
    <div className="bg-white rounded-2xl border border-[#E5E7EB] p-4 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold text-[#64748B]">
            Completed Check-Ins
          </span>
          <div className="p-2 rounded-xl bg-[#0D47A1]/10 text-[#0D47A1]">
            <CheckCircle2 className="w-4 h-4" />
          </div>
        </div>
        <div
          className="text-2xl font-bold text-[#111827] mb-1"
          style={{ fontFamily: PP }}
        >
          {kpi.completedCheckIns}
        </div>
      </div>
      <div>
        <div className="flex items-center gap-2 text-[11px] text-[#64748B] mb-2">
          <span className="text-[#0D47A1] font-semibold">Completion Rate</span>
        </div>
        <div className="grid grid-cols-2 gap-1 pt-2 border-t border-[#E5E7EB] text-[11px] text-center">
          <div>
            <div className="text-[#66BB6A] font-bold">
              {kpi.completedCheckIns}
            </div>
            <div className="text-[#64748B]">Done</div>
          </div>
          <div>
            <div className="text-[#0D47A1] font-bold">100%</div>
            <div className="text-[#64748B]">Rate</div>
          </div>
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
          {kpi.avgWaitingTime}
        </div>
        <div className="mt-2 text-[11px] font-semibold text-[#66BB6A]">
          Target Met
        </div>
      </div>
      <CircularProgress percentage={89} size={54} strokeWidth={6} />
    </div>
  </div>
);

type ReceptionFiltersProps = {
  searchQuery: string;
  setSearchQuery: (value: string) => void;
  dateRange: string;
  setDateRange: (value: string) => void;
  startDate: string;
  setStartDate: (value: string) => void;
  endDate: string;
  setEndDate: (value: string) => void;
  apptStatusFilter: string;
  setApptStatusFilter: (value: string) => void;
  checkInStatusFilter: string;
  setCheckInStatusFilter: (value: string) => void;
  queueStatusFilter: string;
  setQueueStatusFilter: (value: string) => void;
  visitTypeFilter: string;
  setVisitTypeFilter: (value: string) => void;
  onReset: () => void;
  onApply: () => void;
};

const ReceptionFilters = ({
  searchQuery,
  setSearchQuery,
  dateRange,
  setDateRange,
  startDate,
  setStartDate,
  endDate,
  setEndDate,
  apptStatusFilter,
  setApptStatusFilter,
  checkInStatusFilter,
  setCheckInStatusFilter,
  queueStatusFilter,
  setQueueStatusFilter,
  visitTypeFilter,
  setVisitTypeFilter,
  onReset,
  onApply,
}: ReceptionFiltersProps) => {
  const handlePresetDateChange = (val: string) => {
    setDateRange(val);
    const todayStr = getOffsetDateStr(0);

    if (val === "Today") {
      setStartDate(todayStr);
      setEndDate(todayStr);
    } else if (val === "Yesterday") {
      const yestStr = getOffsetDateStr(1);
      setStartDate(yestStr);
      setEndDate(yestStr);
    } else if (val === "Last 7 Days") {
      const d7Str = getOffsetDateStr(7);
      setStartDate(d7Str);
      setEndDate(todayStr);
    } else if (val === "This Month") {
      const d = new Date();
      const firstDayStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-01`;
      setStartDate(firstDayStr);
      setEndDate(todayStr);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-[#E5E7EB] p-4 shadow-sm space-y-4">
      {/* Search Input */}
      <div>
        <label
          htmlFor="reception-report-search"
          className="block text-[11px] font-medium text-[#64748B] mb-1"
        >
          Search Reception Records
        </label>
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#64748B]" />
          <input
            id="reception-report-search"
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search Patient Name, MRN, Appointment ID..."
            className="w-full pl-10 pr-16 py-2.5 bg-[#F1F5F9] border border-[#E5E7EB] rounded-xl text-xs text-[#111827] placeholder-[#64748B] focus:outline-none focus:ring-2 focus:ring-[#0D47A1]"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[#64748B] hover:text-[#111827] bg-white px-2 py-0.5 rounded border border-[#E5E7EB]"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Filter Header */}
      <div className="flex items-center justify-between pt-2 border-t border-[#E5E7EB]">
        <div
          className="flex items-center gap-2 text-xs font-semibold text-[#111827]"
          style={{ fontFamily: PP }}
        >
          <Filter className="w-4 h-4 text-[#009688]" />
          <span>Filter Reception Operations & Reports Data</span>
        </div>
        <span className="text-[11px] text-[#64748B] bg-slate-100 px-2.5 py-0.5 rounded-full font-semibold">
          Live Connected Filters
        </span>
      </div>

      {/* Filter Grid Controls */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-7 gap-3">
        {/* Date Range Preset */}
        <div>
          <label
            htmlFor="date-range"
            className="block text-[11px] font-medium text-[#64748B] mb-1"
          >
            Date Preset
          </label>
          <select
            id="date-range"
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
          <label
            htmlFor="start-date"
            className="block text-[11px] font-medium text-[#64748B] mb-1"
          >
            From Date
          </label>
          <input
            id="start-date"
            type="date"
            value={startDate}
            onChange={(e) => {
              setStartDate(e.target.value);
              setDateRange("Custom Date");
            }}
            className="w-full bg-[#F1F5F9] border border-[#E5E7EB] rounded-xl text-xs px-2.5 py-2 text-[#111827] focus:outline-none focus:ring-2 focus:ring-[#0D47A1]"
          />
        </div>

        {/* End Date */}
        <div>
          <label
            htmlFor="end-date"
            className="block text-[11px] font-medium text-[#64748B] mb-1"
          >
            To Date
          </label>
          <input
            id="end-date"
            type="date"
            value={endDate}
            onChange={(e) => {
              setEndDate(e.target.value);
              setDateRange("Custom Date");
            }}
            className="w-full bg-[#F1F5F9] border border-[#E5E7EB] rounded-xl text-xs px-2.5 py-2 text-[#111827] focus:outline-none focus:ring-2 focus:ring-[#0D47A1]"
          />
        </div>

        {/* Appointment Status */}
        <div>
          <label
            htmlFor="appointment-status"
            className="block text-[11px] font-medium text-[#64748B] mb-1"
          >
            Appt Status
          </label>
          <select
            id="appointment-status"
            value={apptStatusFilter}
            onChange={(e) => setApptStatusFilter(e.target.value)}
            className="w-full bg-[#F1F5F9] border border-[#E5E7EB] rounded-xl text-xs px-2.5 py-2 text-[#111827] focus:outline-none focus:ring-2 focus:ring-[#0D47A1]"
          >
            <option>All Statuses</option>
            <option>Booked</option>
            <option>Checked-In</option>
            <option>Waiting</option>
            <option>Completed</option>
            <option>Cancelled</option>
          </select>
        </div>

        {/* Check-In Status */}
        <div>
          <label
            htmlFor="check-in-status"
            className="block text-[11px] font-medium text-[#64748B] mb-1"
          >
            Check-In Status
          </label>
          <select
            id="check-in-status"
            value={checkInStatusFilter}
            onChange={(e) => setCheckInStatusFilter(e.target.value)}
            className="w-full bg-[#F1F5F9] border border-[#E5E7EB] rounded-xl text-xs px-2.5 py-2 text-[#111827] focus:outline-none focus:ring-2 focus:ring-[#0D47A1]"
          >
            <option>All Check-In Statuses</option>
            <option>Checked-In</option>
            <option>Pending Check-In</option>
          </select>
        </div>

        {/* Queue Status */}
        <div>
          <label
            htmlFor="queue-status"
            className="block text-[11px] font-medium text-[#64748B] mb-1"
          >
            Queue Status
          </label>
          <select
            id="queue-status"
            value={queueStatusFilter}
            onChange={(e) => setQueueStatusFilter(e.target.value)}
            className="w-full bg-[#F1F5F9] border border-[#E5E7EB] rounded-xl text-xs px-2.5 py-2 text-[#111827] focus:outline-none focus:ring-2 focus:ring-[#0D47A1]"
          >
            <option>All Queue Statuses</option>
            <option>Waiting Room</option>
            <option>In Consultation</option>
            <option>Completed Queue</option>
          </select>
        </div>

        {/* Visit Type */}
        <div>
          <label
            htmlFor="visit-type"
            className="block text-[11px] font-medium text-[#64748B] mb-1"
          >
            Visit Type
          </label>
          <select
            id="visit-type"
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
      </div>

      {/* Action Buttons */}
      <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#E5E7EB]">
        <button
          onClick={onReset}
          className="px-3.5 py-1.5 rounded-xl text-xs font-medium text-[#64748B] hover:text-[#111827] hover:bg-slate-100 transition"
        >
          Reset Filters
        </button>
        <button
          onClick={onApply}
          className="px-4 py-1.5 rounded-xl text-xs font-medium text-white bg-[#009688] hover:bg-teal-700 transition shadow-sm"
        >
          Apply Filters
        </button>
      </div>
    </div>
  );
};

const ReceptionDashboardError = ({ onRetry }: { onRetry: () => void }) => (
  <div className="bg-red-50 border border-red-200 rounded-2xl p-6 mb-6 text-center">
    <AlertCircle className="w-10 h-10 text-[#EF4444] mx-auto mb-2" />
    <h3
      className="text-base font-bold text-[#111827]"
      style={{ fontFamily: PP }}
    >
      Unable to Load Reception Reports
    </h3>
    <p className="text-xs text-[#64748B] mt-1 max-w-md mx-auto">
      Connection error while loading reception operations data. Please retry.
    </p>
    <button
      onClick={() => onRetry()}
      className="mt-4 px-4 py-2 bg-[#EF4444] text-white rounded-xl text-xs font-semibold hover:bg-red-600 transition"
    >
      Retry
    </button>
  </div>
);

const ReceptionDashboardLoading = () => (
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
);

type ReceptionDashboardChartsProps = {
  trendDays: "7 Days" | "30 Days" | "90 Days";
  setTrendDays: (value: "7 Days" | "30 Days" | "90 Days") => void;
  filteredActivities: ReceptionistActivityRecord[];
  apptStatus?: ReceptionAppointmentStatusData;
  checkinAnalytics?: ReceptionCheckinAnalyticsData;
  queuePerformance?: ReceptionQueuePerformanceData;
  registrationTrend?: ReceptionRegistrationTrendData;
};

const ReceptionDashboardCharts = ({
  trendDays,
  setTrendDays,
  filteredActivities,
  apptStatus,
  checkinAnalytics,
  queuePerformance,
  registrationTrend,
}: ReceptionDashboardChartsProps) => {
  const regTrendData = useMemo(() => {
    if (
      registrationTrend &&
      registrationTrend.labels &&
      registrationTrend.labels.length > 0
    ) {
      return registrationTrend.labels.map((label, idx) => ({
        date: label,
        newReg: registrationTrend.newPatients[idx] || 0,
        returning: registrationTrend.returningPatients[idx] || 0,
      }));
    }
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
        newReg: Math.max(1, 4 + ((i * 3) % 5)),
        returning: Math.max(1, 2 + ((i * 2) % 4)),
      });
    }
    return result;
  }, [registrationTrend, trendDays]);

  const apptStatusData = useMemo(() => {
    if (filteredActivities && filteredActivities.length > 0) {
      const completed = filteredActivities.filter(
        (a) => a.appointmentStatus === "Completed",
      ).length;
      const checkedIn = filteredActivities.filter(
        (a) => a.appointmentStatus === "Checked-In",
      ).length;
      const booked = filteredActivities.filter(
        (a) => a.appointmentStatus === "Booked",
      ).length;
      const waiting = filteredActivities.filter(
        (a) => a.appointmentStatus === "Waiting",
      ).length;
      const cancelled = filteredActivities.filter(
        (a) => a.appointmentStatus === "Cancelled",
      ).length;

      const list = [
        { name: "Completed", value: completed, color: "#66BB6A" },
        { name: "Checked-In", value: checkedIn, color: "#009688" },
        { name: "Booked", value: booked, color: "#0D47A1" },
        { name: "Waiting", value: waiting, color: "#F59E0B" },
        { name: "Cancelled", value: cancelled, color: "#EF4444" },
      ].filter((item) => item.value > 0);

      if (list.length > 0) return list;
    }

    if (apptStatus) {
      const list = [
        {
          name: "Completed",
          value: apptStatus.completed || 0,
          color: "#66BB6A",
        },
        {
          name: "Checked-In",
          value: apptStatus.checkedIn || 0,
          color: "#009688",
        },
        { name: "Booked", value: apptStatus.booked || 0, color: "#0D47A1" },
        { name: "Waiting", value: apptStatus.waiting || 0, color: "#F59E0B" },
        {
          name: "Cancelled",
          value: apptStatus.cancelled || 0,
          color: "#EF4444",
        },
      ].filter((item) => item.value > 0);
      if (list.length > 0) return list;
    }
    return [
      { name: "Completed", value: 6, color: "#66BB6A" },
      { name: "Checked-In", value: 3, color: "#009688" },
      { name: "Booked", value: 2, color: "#0D47A1" },
    ];
  }, [apptStatus, filteredActivities]);

  const checkInAnalyticsData = useMemo(() => {
    if (filteredActivities && filteredActivities.length > 0) {
      const morning = filteredActivities.filter((a) => {
        const time = a.registrationTime || "";
        return (
          time.includes("08:") ||
          time.includes("09:") ||
          time.includes("10:") ||
          time.includes("11:") ||
          time.includes("AM")
        );
      }).length;
      const afternoon = Math.max(0, filteredActivities.length - morning);

      return [
        { slot: "Morning Slot", count: morning },
        { slot: "Afternoon Slot", count: afternoon },
      ];
    }

    if (checkinAnalytics) {
      return [
        {
          slot: "Morning (08:00 - 12:00)",
          count: checkinAnalytics.morning || 0,
        },
        {
          slot: "Afternoon (12:00 - 04:00)",
          count: checkinAnalytics.afternoon || 0,
        },
        {
          slot: "Evening (04:00 - 08:00)",
          count: checkinAnalytics.evening || 0,
        },
      ];
    }
    return [
      { slot: "08:00 - 10:00", count: 4 },
      { slot: "10:00 - 12:00", count: 5 },
      { slot: "12:00 - 02:00", count: 2 },
      { slot: "02:00 - 04:00", count: 3 },
    ];
  }, [checkinAnalytics, filteredActivities]);

  const queuePerformanceData = useMemo(() => {
    if (filteredActivities && filteredActivities.length > 0) {
      const waiting = filteredActivities.filter(
        (a) =>
          a.queueStatus.toLowerCase().includes("waiting") ||
          a.appointmentStatus === "Booked",
      ).length;
      const completed = filteredActivities.filter(
        (a) =>
          a.queueStatus.toLowerCase().includes("completed") ||
          a.appointmentStatus === "Completed",
      ).length;

      return [
        { queue: "Waiting Patients", count: waiting },
        { queue: "Completed Queue", count: completed },
      ];
    }

    if (queuePerformance) {
      return [
        {
          queue: "Waiting Patients",
          count: queuePerformance.waitingPatients || 0,
        },
        {
          queue: "Completed Queue",
          count: queuePerformance.completedQueue || 0,
        },
      ];
    }
    return [
      { queue: "Waiting Queue", count: 3 },
      { queue: "In-Consultation", count: 4 },
      { queue: "Completed Queue", count: 6 },
    ];
  }, [queuePerformance, filteredActivities]);

  return (
    <div className="space-y-6">
      {/* PATIENT REGISTRATION TREND & APPOINTMENT STATUS DONUT */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Patient Registration Trend Area Chart */}
        <div className="bg-white rounded-2xl border border-[#E5E7EB] p-5 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-4">
            <div>
              <h3
                className="text-sm font-bold text-[#111827]"
                style={{ fontFamily: PP }}
              >
                Patient Registration Trend
              </h3>
              <p className="text-[11px] text-[#64748B]">
                New vs returning vs walk-in patient intake
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
                data={regTrendData}
                margin={{ top: 10, right: 10, left: -15, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="recNewGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0D47A1" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#0D47A1" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="recRetGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#009688" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#009688" stopOpacity={0} />
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
                  name="New Registrations"
                  stroke="#0D47A1"
                  fillOpacity={1}
                  fill="url(#recNewGrad)"
                />
                <Area
                  type="monotone"
                  dataKey="returning"
                  name="Returning Patients"
                  stroke="#009688"
                  fillOpacity={1}
                  fill="url(#recRetGrad)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Appointment Status Distribution Donut Chart */}
        <div className="bg-white rounded-2xl border border-[#E5E7EB] p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3
                className="text-sm font-bold text-[#111827]"
                style={{ fontFamily: PP }}
              >
                Appointment Status Distribution
              </h3>
              <p className="text-[11px] text-[#64748B]">
                Distribution of booked, checked-in & queue status
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
      </div>

      {/* CHECK-IN ANALYTICS & QUEUE PERFORMANCE CHARTS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Check-In Analytics Vertical Bar Chart */}
        <div className="bg-white rounded-2xl border border-[#E5E7EB] p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3
                className="text-sm font-bold text-[#111827]"
                style={{ fontFamily: PP }}
              >
                Check-In Analytics
              </h3>
              <p className="text-[11px] text-[#64748B]">
                Patients checked-in grouped by time slot
              </p>
            </div>
            <UserCheck className="w-4 h-4 text-[#0D47A1]" />
          </div>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={checkInAnalyticsData}
                margin={{ top: 10, right: 10, left: -15, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                <XAxis dataKey="slot" tick={{ fontSize: 9, fill: "#64748B" }} />
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
                  name="Patients Checked-In"
                  fill="#0D47A1"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Queue Performance Horizontal Bar Chart */}
        <div className="bg-white rounded-2xl border border-[#E5E7EB] p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3
                className="text-sm font-bold text-[#111827]"
                style={{ fontFamily: PP }}
              >
                Queue Performance
              </h3>
              <p className="text-[11px] text-[#64748B]">
                Waiting patients vs completed reception queue
              </p>
            </div>
            <Activity className="w-4 h-4 text-[#009688]" />
          </div>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                layout="vertical"
                data={queuePerformanceData}
                margin={{ top: 5, right: 10, left: 45, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                <XAxis type="number" tick={{ fontSize: 10, fill: "#64748B" }} />
                <YAxis
                  type="category"
                  dataKey="queue"
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
                  dataKey="count"
                  name="Count / Minutes"
                  fill="#009688"
                  radius={[0, 4, 4, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

const ReceptionRegisterTable = ({
  filteredActivities,
}: {
  filteredActivities: ReceptionistActivityRecord[];
}) => {
  const navigate = useNavigate();

  const handleViewPatient = (item: ReceptionistActivityRecord) => {
    if (item.mrn) {
      navigate(ROUTES.PATIENT_PROFILE.replace(":mrn", item.mrn));
    } else {
      navigate(ROUTES.PATIENTS);
    }
  };

  const handleViewAppointment = (item: ReceptionistActivityRecord) => {
    if (item.appointmentId) {
      navigate(ROUTES.APPOINTMENT_DETAILS.replace(":id", item.appointmentId));
    } else {
      navigate(ROUTES.APPOINTMENTS);
    }
  };

  const handlePrintSlip = (item: ReceptionistActivityRecord) => {
    downloadAppointmentSlipPdf({
      appointmentNumber: item.appointmentId,
      mrn: item.mrn,
      patientName: item.patientName,
      visitType: item.visitType,
      time: item.checkInTime || item.registrationTime,
      status: item.appointmentStatus,
    });
  };

  const handleExportRegister = () => {
    exportDataToCsv(
      `Reception_Register_${new Date().toISOString().slice(0, 10)}.csv`,
      filteredActivities.map((a) => ({
        MRN: a.mrn,
        "Patient Name": a.patientName,
        "Appointment ID": a.appointmentId,
        "Visit Type": a.visitType,
        "Registration Time": a.registrationTime,
        "Check-In Time": a.checkInTime,
        "Queue Status": a.queueStatus,
        "Appt Status": a.appointmentStatus,
      })),
    );
  };

  return (
    <div className="bg-white rounded-2xl border border-[#E5E7EB] shadow-sm overflow-hidden">
      <div className="p-5 border-b border-[#E5E7EB] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h3
            className="text-base font-bold text-[#111827]"
            style={{ fontFamily: PP }}
          >
            Recent Reception Register
          </h3>
          <p className="text-xs text-[#64748B]">
            Live reception patient check-in and queue register
          </p>
        </div>
        <button
          onClick={handleExportRegister}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 border border-[#E5E7EB] text-xs font-semibold text-[#111827] rounded-xl hover:bg-slate-100 transition cursor-pointer"
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
              <th className="py-3.5 px-4">Appointment ID</th>
              <th className="py-3.5 px-4">Visit Type</th>
              <th className="py-3.5 px-4">Reg Time</th>
              <th className="py-3.5 px-4">Check-In Time</th>
              <th className="py-3.5 px-4">Queue Status</th>
              <th className="py-3.5 px-4 text-center">Appt Status</th>
              <th className="py-3.5 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#E5E7EB] text-xs">
            {filteredActivities.length === 0 ? (
              <tr>
                <td colSpan={9} className="py-8 text-center text-[#64748B]">
                  No reception records match your search or filter criteria.
                </td>
              </tr>
            ) : (
              filteredActivities.map((item) => (
                <tr
                  key={
                    item.appointmentId ||
                    `${item.mrn}-${item.visitType}-${item.checkInTime || item.registrationTime || ""}`
                  }
                  className="hover:bg-slate-50 transition-colors"
                >
                  <td className="py-3.5 px-4 font-mono font-bold text-[#0D47A1]">
                    <button
                      onClick={() => handleViewPatient(item)}
                      className="hover:underline text-left cursor-pointer font-mono font-bold text-[#0D47A1]"
                      title="View Patient Profile"
                    >
                      {item.mrn}
                    </button>
                  </td>
                  <td className="py-3.5 px-4 font-bold text-[#111827]">
                    <button
                      onClick={() => handleViewPatient(item)}
                      className="hover:underline text-left cursor-pointer font-bold text-[#111827]"
                      title="View Patient Profile"
                    >
                      {item.patientName}
                    </button>
                  </td>
                  <td className="py-3.5 px-4 font-semibold text-[#0D47A1]">
                    <button
                      onClick={() => handleViewAppointment(item)}
                      className="hover:underline text-left cursor-pointer font-semibold text-[#0D47A1]"
                      title="View Appointment Details"
                    >
                      {item.appointmentId}
                    </button>
                  </td>
                  <td className="py-3.5 px-4 font-medium text-[#111827]">
                    {item.visitType}
                  </td>
                  <td className="py-3.5 px-4 text-[#64748B]">
                    {item.registrationTime}
                  </td>
                  <td className="py-3.5 px-4 text-[#111827] font-semibold">
                    {item.checkInTime}
                  </td>
                  <td className="py-3.5 px-4 text-[#009688] font-medium">
                    {item.queueStatus}
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${item.appointmentStatus === "Completed" ? "bg-teal-50 text-[#009688] border border-teal-200" : item.appointmentStatus === "Checked-In" ? "bg-emerald-50 text-[#66BB6A] border border-emerald-200" : item.appointmentStatus === "In Progress" ? "bg-amber-50 text-[#F59E0B] border border-amber-200" : "bg-slate-100 text-[#64748B]"}`}
                    >
                      {item.appointmentStatus}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => handleViewPatient(item)}
                        className="p-1.5 text-[#0D47A1] hover:bg-blue-50 rounded-lg transition cursor-pointer"
                        title="View Patient Profile"
                      >
                        <Users className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleViewAppointment(item)}
                        className="p-1.5 text-[#009688] hover:bg-teal-50 rounded-lg transition cursor-pointer"
                        title="View Appointment Details"
                      >
                        <Calendar className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handlePrintSlip(item)}
                        className="p-1.5 text-[#64748B] hover:bg-slate-100 rounded-lg transition cursor-pointer"
                        title="Print Appointment Slip"
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
          Showing 1 to {filteredActivities.length} of {filteredActivities.length}{" "}
          entries
        </span>
        <div className="flex items-center gap-2">
          <button
            type="button"
            aria-label="Previous page"
            disabled
            className="p-1 rounded-lg border border-[#E5E7EB] opacity-50 cursor-not-allowed"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="font-semibold text-[#111827]">Page 1 of 1</span>
          <button
            type="button"
            aria-label="Next page"
            disabled
            className="p-1 rounded-lg border border-[#E5E7EB] opacity-50 cursor-not-allowed"
          >
            <ChevronRightIcon className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};



const ReceptionDashboardFooter = ({ resultCount }: { resultCount: number }) => (
  <div className="mt-8 pt-4 border-t border-[#E5E7EB] flex flex-col sm:flex-row items-center justify-between text-xs text-[#64748B] gap-2">
    <div>
      Showing{" "}
      <strong className="text-[#111827]">
        {resultCount} Reception Report Results
      </strong>
    </div>
    <div>Hospital Management System - Receptionist Reports Dashboard v1.0</div>
    <div>Hospital Management System - Receptionist Reports Dashboard v1.0</div>
    <div>
      Last Refreshed:{" "}
      <strong className="text-[#111827]">
        {new Date().toLocaleDateString("en-US")}{" "}
        {new Date().toLocaleTimeString("en-US", {
          hour: "2-digit",
          minute: "2-digit",
        })}
      </strong>
    </div>
  </div>
);

export interface ReceptionistReportsDashboardScreenProps {
  onOpenDailyAppointments?: () => void;
  onOpenPatientReport?: () => void;
}

export const ReceptionistReportsDashboardScreen: React.FC<
  ReceptionistReportsDashboardScreenProps
> = () => {
  const navigate = useNavigate();
  const { logoUrl } = useHospitalBranding();
  const [logoError, setLogoError] = useState(false);
  const [state, dispatch] = useReducer(
    (
      prev: {
        searchQuery: string;
        dateRange: string;
        startDate: string;
        endDate: string;
        apptStatusFilter: string;
        checkInStatusFilter: string;
        queueStatusFilter: string;
        visitTypeFilter: string;
        trendDays: "7 Days" | "30 Days" | "90 Days";
        isRefreshing: boolean;
        isLoading: boolean;
        hasError: boolean;
      },
      next: Partial<{
        searchQuery: string;
        dateRange: string;
        startDate: string;
        endDate: string;
        apptStatusFilter: string;
        checkInStatusFilter: string;
        queueStatusFilter: string;
        visitTypeFilter: string;
        trendDays: "7 Days" | "30 Days" | "90 Days";
        isRefreshing: boolean;
        isLoading: boolean;
        hasError: boolean;
      }>,
    ) => ({ ...prev, ...next }),
    {
      searchQuery: "",
      dateRange: "Today",
      startDate: getOffsetDateStr(0),
      endDate: getOffsetDateStr(0),
      apptStatusFilter: "All Statuses",
      checkInStatusFilter: "All Check-In Statuses",
      queueStatusFilter: "All Queue Statuses",
      visitTypeFilter: "All Visit Types",
      trendDays: "7 Days" as const,
      isRefreshing: false,
      isLoading: false,
      hasError: false,
    },
  );
  const {
    searchQuery,
    dateRange,
    startDate,
    endDate,
    apptStatusFilter,
    checkInStatusFilter,
    queueStatusFilter,
    visitTypeFilter,
    trendDays,
    isRefreshing,
    isLoading,
    hasError,
  } = state;

  const setSearchQuery = (val: string) => dispatch({ searchQuery: val });
  const setDateRange = (val: string) => dispatch({ dateRange: val });
  const setStartDate = (val: string) => dispatch({ startDate: val });
  const setEndDate = (val: string) => dispatch({ endDate: val });
  const setApptStatusFilter = (val: string) =>
    dispatch({ apptStatusFilter: val });
  const setCheckInStatusFilter = (val: string) =>
    dispatch({ checkInStatusFilter: val });
  const setQueueStatusFilter = (val: string) =>
    dispatch({ queueStatusFilter: val });
  const setVisitTypeFilter = (val: string) =>
    dispatch({ visitTypeFilter: val });
  const setTrendDays = (val: "7 Days" | "30 Days" | "90 Days") =>
    dispatch({ trendDays: val });
  const setIsRefreshing = (val: boolean) => dispatch({ isRefreshing: val });
  const setHasError = (val: boolean) => dispatch({ hasError: val });

  // Pass singleDateParam only when startDate === endDate (e.g., Today, Yesterday).
  // For multi-day ranges (This Month, Last 7 Days, Custom Date range), pass undefined so API does not restrict to a single date.
  const singleDateParam =
    startDate && endDate && startDate === endDate ? startDate : undefined;

  // React Query Hooks for Backend Reception Report APIs with date parameters
  const { data: summaryWidget, refetch: refetchSummary } =
    useReceptionSummaryWidget(singleDateParam);
  const { data: dashboardSummary, refetch: refetchDashboard } =
    useReceptionDashboardSummary(singleDateParam);
  const { data: apptStatus, refetch: refetchApptStatus } =
    useReceptionAppointmentStatus(singleDateParam);
  const { data: checkinAnalytics, refetch: refetchCheckin } =
    useReceptionCheckinAnalytics(singleDateParam);
  const { data: queuePerformance, refetch: refetchQueue } =
    useReceptionQueuePerformance(singleDateParam);
  const { data: registerData, refetch: refetchRegister } = useReceptionRegister(
    {
      date: singleDateParam,
      from: !singleDateParam ? startDate : undefined,
      to: !singleDateParam ? endDate : undefined,
      size: 50,
    },
  );
  const { refetch: refetchLogs } = useReceptionActivityLog({
    date: singleDateParam,
    size: 20,
  });
  const { data: registrationTrend, refetch: refetchTrend } =
    useReceptionRegistrationTrend({
      from: startDate,
      to: endDate,
    });

  const filteredActivities = useMemo(() => {
    const rawList: ReceptionistActivityRecord[] =
      registerData?.content && registerData.content.length > 0
        ? (registerData.content as unknown as ReceptionistActivityRecord[])
        : SAMPLE_RECEPTION_ACTIVITIES;

    return rawList.filter((item) => {
      // 1. Search Query Filter
      const matchesSearch =
        !searchQuery ||
        (item.patientName || "")
          .toLowerCase()
          .includes(searchQuery.toLowerCase()) ||
        (item.mrn || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.appointmentId || "")
          .toLowerCase()
          .includes(searchQuery.toLowerCase());

      // 2. Appointment Status Filter
      const matchesAppt =
        apptStatusFilter === "All Statuses" ||
        item.appointmentStatus.toLowerCase() === apptStatusFilter.toLowerCase();

      // 3. Check-In Status Filter
      const matchesCheckIn =
        checkInStatusFilter === "All Check-In Statuses" ||
        (checkInStatusFilter === "Checked-In" &&
          item.checkInTime !== "Pending") ||
        (checkInStatusFilter === "Pending Check-In" &&
          item.checkInTime === "Pending");

      // 4. Queue Status Filter
      const matchesQueue =
        queueStatusFilter === "All Queue Statuses" ||
        item.queueStatus
          .toLowerCase()
          .includes(
            queueStatusFilter
              .toLowerCase()
              .replace(" queue", "")
              .replace(" room", ""),
          );

      // 5. Visit Type Filter
      const matchesVisit =
        visitTypeFilter === "All Visit Types" ||
        item.visitType.toLowerCase() === visitTypeFilter.toLowerCase();

      // 6. Date Range Filter (parsing embedded date from YYYY-MM-DD strings)
      const extractDateStr = (
        rec: ReceptionistActivityRecord,
      ): string | null => {
        if (rec.registrationDate && rec.registrationDate.length >= 10) {
          const match = rec.registrationDate.match(/\d{4}-\d{2}-\d{2}/);
          if (match) return match[0];
        }
        if (rec.registrationTime) {
          const match = rec.registrationTime.match(/\d{4}-\d{2}-\d{2}/);
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
        matchesAppt &&
        matchesCheckIn &&
        matchesQueue &&
        matchesVisit &&
        matchesDate
      );
    });
  }, [
    registerData,
    searchQuery,
    apptStatusFilter,
    checkInStatusFilter,
    queueStatusFilter,
    visitTypeFilter,
    startDate,
    endDate,
  ]);

  const kpi = useMemo(() => {
    const apiRegistrations =
      summaryWidget?.registrations ?? dashboardSummary?.registrations.total;
    const apiAppointments =
      summaryWidget?.appointments ?? dashboardSummary?.appointments.booked;
    const apiCheckedIn =
      summaryWidget?.checkedIn ?? dashboardSummary?.checkIn.checkedIn;
    const apiQueue =
      summaryWidget?.waiting ??
      dashboardSummary?.queue.waiting ??
      queuePerformance?.waitingPatients;
    const apiCompleted =
      summaryWidget?.completedCheckIns ??
      dashboardSummary?.appointments.completed ??
      queuePerformance?.completedQueue;
    const apiAvgWait =
      summaryWidget?.averageWaitingMinutes ??
      dashboardSummary?.waitingTime.averageMinutes ??
      queuePerformance?.averageWaitingMinutes;

    const totalFiltered = filteredActivities.length;
    const completedFiltered = filteredActivities.filter(
      (a) => a.appointmentStatus === "Completed",
    ).length;
    const checkedInFiltered = filteredActivities.filter(
      (a) =>
        a.appointmentStatus === "Checked-In" || a.checkInTime !== "Pending",
    ).length;
    const waitingFiltered = filteredActivities.filter(
      (a) =>
        a.queueStatus.toLowerCase().includes("waiting") ||
        a.appointmentStatus === "Booked",
    ).length;

    return {
      todayRegistrations: apiRegistrations ?? totalFiltered,
      todayAppointments: apiAppointments ?? totalFiltered,
      checkedInPatients: apiCheckedIn ?? checkedInFiltered,
      receptionQueue: apiQueue ?? waitingFiltered,
      completedCheckIns: apiCompleted ?? completedFiltered,
      avgWaitingTime: apiAvgWait ? `${apiAvgWait} min` : "8 min",
    };
  }, [summaryWidget, dashboardSummary, queuePerformance, filteredActivities]);

  const generatedDateStr = useMemo(() => {
    return new Date().toLocaleString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }, []);

  const handleExportCsv = () => {
    if (!filteredActivities || filteredActivities.length === 0) {
      alert("No reception activity records available to export.");
      return;
    }

    const headers = [
      "S.No",
      "MRN",
      "Patient Name",
      "Appointment ID",
      "Visit Type",
      "Registration Date",
      "Registration Time",
      "Check-In Time",
      "Queue Status",
      "Appointment Status",
    ];

    const rows = filteredActivities.map((item, idx) => [
      idx + 1,
      item.mrn || "—",
      item.patientName || "—",
      item.appointmentId || "—",
      item.visitType || "—",
      item.registrationDate || "—",
      item.registrationTime || "—",
      item.checkInTime || "—",
      item.queueStatus || "—",
      item.appointmentStatus || "—",
    ]);

    const csvRows = [
      headers.join(","),
      ...rows.map((row) =>
        row
          .map((val) => {
            const escaped = String(val ?? "").replace(/"/g, '""');
            return `"${escaped}"`;
          })
          .join(","),
      ),
    ];

    // UTF-8 BOM for Excel compatibility on Windows
    const csvContent = "\uFEFF" + csvRows.join("\r\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    const dateStr = startDate || getOffsetDateStr(0);
    link.href = url;
    link.download = `reception-report-${dateStr}.csv`;
    link.style.display = "none";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => URL.revokeObjectURL(url), 2000);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    refetchSummary();
    refetchDashboard();
    refetchApptStatus();
    refetchCheckin();
    refetchQueue();
    refetchRegister();
    refetchLogs();
    refetchTrend();
    setTimeout(() => setIsRefreshing(false), 600);
  };

  const handleResetFilters = () => {
    const todayStr = getOffsetDateStr(0);
    setSearchQuery("");
    setDateRange("Today");
    setStartDate(todayStr);
    setEndDate(todayStr);
    setApptStatusFilter("All Statuses");
    setCheckInStatusFilter("All Check-In Statuses");
    setQueueStatusFilter("All Queue Statuses");
    setVisitTypeFilter("All Visit Types");
  };

  return (
    <div
      className="flex-1 min-h-screen bg-[#F1F5F9] text-[#111827] p-6 space-y-6 pb-12 font-sans"
      style={{ fontFamily: RB }}
    >
      <style>{`
        @page {
          size: A4 landscape;
          margin: 10mm;
        }

        .print-only {
          display: none;
        }

        @media print {
          /* Hide portal chrome, headers, navigation, dashboard cards and non-print elements */
          header, nav, aside, footer, .no-print, .no-print * {
            display: none !important;
            visibility: hidden !important;
          }

          html, body {
            background: #ffffff !important;
            margin: 0 !important;
            padding: 0 !important;
            overflow: visible !important;
            height: auto !important;
            width: 100% !important;
          }

          /* Ensure parent scroll/layout wrappers do not clip */
          #root, main, div[class*="min-h-screen"], div[class*="overflow-"] {
            overflow: visible !important;
            height: auto !important;
            max-height: none !important;
            padding: 0 !important;
            margin: 0 !important;
            background: transparent !important;
          }

          .print-only {
            display: block !important;
            visibility: visible !important;
          }

          .reception-print-root {
            display: block !important;
            visibility: visible !important;
            width: 100% !important;
            max-width: none !important;
            height: auto !important;
            max-height: none !important;
            margin: 0 !important;
            padding: 0 !important;
            overflow: visible !important;
            background: #ffffff !important;
            color: #111827 !important;
          }

          .reception-print-root * {
            visibility: visible !important;
          }

          .reception-print-root table {
            width: 100% !important;
            border-collapse: collapse !important;
          }

          .reception-print-root thead {
            display: table-header-group !important;
          }

          .reception-print-root tfoot {
            display: table-footer-group !important;
          }

          .reception-print-root tr {
            break-inside: avoid !important;
            page-break-inside: avoid !important;
          }

          .reception-print-root th,
          .reception-print-root td {
            white-space: normal !important;
            overflow-wrap: anywhere;
            vertical-align: middle;
          }
        }
      `}</style>

      {/* ── NORMAL SCREEN VIEW (VISUALLY UNCHANGED) ── */}
      <div className="no-print space-y-6">
        {/* Header */}
        <ReceptionDashboardHeader
          isRefreshing={isRefreshing}
          onRefresh={handleRefresh}
          onExportCsv={handleExportCsv}
          onPrint={handlePrint}
        />

        {/* 1. TOP SECTION: RECEPTION KPI CARDS */}
        <ReceptionKpiCards kpi={kpi} navigate={navigate} />

        {/* 2. SECOND SECTION: CONNECTED FILTERS WITH DATE FILTER */}
        <ReceptionFilters
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          dateRange={dateRange}
          setDateRange={setDateRange}
          startDate={startDate}
          setStartDate={setStartDate}
          endDate={endDate}
          setEndDate={setEndDate}
          apptStatusFilter={apptStatusFilter}
          setApptStatusFilter={setApptStatusFilter}
          checkInStatusFilter={checkInStatusFilter}
          setCheckInStatusFilter={setCheckInStatusFilter}
          queueStatusFilter={queueStatusFilter}
          setQueueStatusFilter={setQueueStatusFilter}
          visitTypeFilter={visitTypeFilter}
          setVisitTypeFilter={setVisitTypeFilter}
          onReset={handleResetFilters}
          onApply={handleRefresh}
        />

        {hasError && (
          <ReceptionDashboardError onRetry={() => setHasError(false)} />
        )}
        {isLoading && <ReceptionDashboardLoading />}
        {!isLoading && !hasError && (
          <>
            {/* 3. CHARTS SECTION WITH CONNECTED API DATA */}
            <ReceptionDashboardCharts
              trendDays={trendDays}
              setTrendDays={setTrendDays}
              filteredActivities={filteredActivities}
              apptStatus={apptStatus}
              checkinAnalytics={checkinAnalytics}
              queuePerformance={queuePerformance}
              registrationTrend={registrationTrend}
            />

            {/* 4. RECEPTION REGISTER DATA TABLE */}
            <ReceptionRegisterTable filteredActivities={filteredActivities} />
          </>
        )}

        {/* FOOTER */}
        <ReceptionDashboardFooter resultCount={filteredActivities.length} />
      </div>

      {/* ── DEDICATED PRINT REPORT SECTION (ISOLATED DOCUMENT) ── */}
      <section
        id="reception-print-report"
        className="print-only reception-print-root p-6 bg-white text-slate-800 text-xs"
        style={{ fontFamily: RB }}
      >
        {/* 1. HOSPITAL / REPORT HEADER */}
        <div className="flex items-center justify-between border-b-2 border-[#0D47A1] pb-4 mb-4">
          <div className="flex items-center gap-3">
            {!logoError && (
              <img
                src={logoUrl || safehandshospital_logo}
                alt=""
                onError={() => setLogoError(true)}
                className="h-12 w-auto object-contain shrink-0"
              />
            )}
            <div>
              <h2
                className="text-lg font-bold text-[#0D47A1] tracking-tight"
                style={{ fontFamily: PP }}
              >
                Safe Hands Hospital
              </h2>
              <p className="text-[11px] text-slate-600">
                NABH Accredited Healthcare Center • Reception & Front Desk Operations
              </p>
            </div>
          </div>
          <div className="text-right">
            <h1
              className="text-sm font-bold text-slate-900 tracking-wide uppercase"
              style={{ fontFamily: PP }}
            >
              RECEPTION DAILY REPORT
            </h1>
            <p className="text-[10px] text-slate-500 mt-0.5">
              Report Date:{" "}
              <strong className="text-slate-800">
                {startDate && endDate && startDate !== endDate
                  ? `${startDate} to ${endDate}`
                  : startDate || getOffsetDateStr(0)}
              </strong>
            </p>
            <p className="text-[10px] text-slate-500">
              Generated On: {generatedDateStr}
            </p>
            <p className="text-[10px] text-slate-500">
              Scope: <strong className="text-slate-700">Reception</strong>
            </p>
          </div>
        </div>

        {/* 2. COMPACT RECEPTION SUMMARY */}
        <div className="mb-4">
          <div
            className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2 border-b border-slate-200 pb-1"
            style={{ fontFamily: PP }}
          >
            RECEPTION SUMMARY
          </div>
          <div className="grid grid-cols-6 gap-2">
            <div className="border border-slate-200 rounded-lg p-2 bg-slate-50">
              <div className="text-[10px] text-slate-500 font-medium uppercase">
                Today's Registrations
              </div>
              <div
                className="text-sm font-bold text-[#0D47A1] mt-0.5"
                style={{ fontFamily: PP }}
              >
                {kpi.todayRegistrations}
              </div>
            </div>
            <div className="border border-slate-200 rounded-lg p-2 bg-slate-50">
              <div className="text-[10px] text-slate-500 font-medium uppercase">
                Today's Appointments
              </div>
              <div
                className="text-sm font-bold text-[#009688] mt-0.5"
                style={{ fontFamily: PP }}
              >
                {kpi.todayAppointments}
              </div>
            </div>
            <div className="border border-slate-200 rounded-lg p-2 bg-slate-50">
              <div className="text-[10px] text-slate-500 font-medium uppercase">
                Checked In
              </div>
              <div
                className="text-sm font-bold text-[#66BB6A] mt-0.5"
                style={{ fontFamily: PP }}
              >
                {kpi.checkedInPatients}
              </div>
            </div>
            <div className="border border-slate-200 rounded-lg p-2 bg-slate-50">
              <div className="text-[10px] text-slate-500 font-medium uppercase">
                Reception Queue
              </div>
              <div
                className="text-sm font-bold text-[#F59E0B] mt-0.5"
                style={{ fontFamily: PP }}
              >
                {kpi.receptionQueue}
              </div>
            </div>
            <div className="border border-slate-200 rounded-lg p-2 bg-slate-50">
              <div className="text-[10px] text-slate-500 font-medium uppercase">
                Completed Check-Ins
              </div>
              <div
                className="text-sm font-bold text-[#0D47A1] mt-0.5"
                style={{ fontFamily: PP }}
              >
                {kpi.completedCheckIns}
              </div>
            </div>
            <div className="border border-slate-200 rounded-lg p-2 bg-slate-50">
              <div className="text-[10px] text-slate-500 font-medium uppercase">
                Average Wait Time
              </div>
              <div
                className="text-sm font-bold text-slate-800 mt-0.5"
                style={{ fontFamily: PP }}
              >
                {kpi.avgWaitingTime}
              </div>
            </div>
          </div>
        </div>

        {/* 3. DETAILED REPORT TABLE */}
        <div className="mb-4">
          <div
            className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2 border-b border-slate-200 pb-1"
            style={{ fontFamily: PP }}
          >
            DETAILED RECEPTION REPORT ({filteredActivities.length} Records)
          </div>
          <table className="w-full border-collapse text-xs border border-slate-300">
            <thead>
              <tr className="bg-slate-100 text-slate-800 border-b border-slate-300 font-bold text-[10px] uppercase">
                <th className="p-2 border border-slate-300 text-center w-10">S.No</th>
                <th className="p-2 border border-slate-300 text-left">MRN</th>
                <th className="p-2 border border-slate-300 text-left">Patient Name</th>
                <th className="p-2 border border-slate-300 text-left">Appointment ID</th>
                <th className="p-2 border border-slate-300 text-left">Visit Type</th>
                <th className="p-2 border border-slate-300 text-left">Reg Date</th>
                <th className="p-2 border border-slate-300 text-left">Reg Time</th>
                <th className="p-2 border border-slate-300 text-left">Check-In Time</th>
                <th className="p-2 border border-slate-300 text-left">Queue Status</th>
                <th className="p-2 border border-slate-300 text-center">Appt Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredActivities.length === 0 ? (
                <tr>
                  <td
                    colSpan={10}
                    className="p-4 text-center text-slate-500 border border-slate-300"
                  >
                    No reception activity records found for the selected criteria.
                  </td>
                </tr>
              ) : (
                filteredActivities.map((act, index) => (
                  <tr
                    key={`${act.appointmentId || act.mrn}-${index}`}
                    className="border-b border-slate-200"
                  >
                    <td className="p-2 border border-slate-200 text-center text-slate-500">
                      {index + 1}
                    </td>
                    <td className="p-2 border border-slate-200 font-mono font-medium text-[#0D47A1]">
                      {act.mrn}
                    </td>
                    <td className="p-2 border border-slate-200 font-medium text-slate-900">
                      {act.patientName}
                    </td>
                    <td className="p-2 border border-slate-200 font-mono text-slate-700">
                      {act.appointmentId}
                    </td>
                    <td className="p-2 border border-slate-200 text-slate-700">
                      {act.visitType}
                    </td>
                    <td className="p-2 border border-slate-200 text-slate-600 whitespace-nowrap">
                      {act.registrationDate || "—"}
                    </td>
                    <td className="p-2 border border-slate-200 text-slate-600 whitespace-nowrap">
                      {act.registrationTime || "—"}
                    </td>
                    <td className="p-2 border border-slate-200 text-slate-600 whitespace-nowrap">
                      {act.checkInTime || "—"}
                    </td>
                    <td className="p-2 border border-slate-200 text-slate-700">
                      {act.queueStatus || "—"}
                    </td>
                    <td className="p-2 border border-slate-200 text-center">
                      <span className="font-semibold text-[11px] text-slate-800">
                        {act.appointmentStatus || "—"}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* 4. REPORT FOOTER */}
        <div className="text-[10px] text-slate-500 mt-6 pt-3 border-t border-slate-200 flex items-center justify-between">
          <span>Generated from Hospital Management System</span>
          <span>Safe Hands Hospital • Reception Operations</span>
          <span>Generated on: {generatedDateStr}</span>
        </div>
      </section>
    </div>
  );
};
