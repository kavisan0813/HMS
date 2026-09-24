import React, { useReducer, useMemo, useTransition } from "react";
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
  Clock,
  PieChart as PieChartIcon,
  Eye,
  Printer,
  AlertCircle,
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

import {
  useDoctorDailyAnalytics,
  useDoctorDailyDashboard,
  useDoctorDailyRegister,
  useDoctorPatientAnalytics,
  useDoctorPatientDashboard,
  useDoctorPatientRegister,
} from "../../../features/doctors/hooks/useDoctorReports";
import type {
  DoctorDailyAnalyticsData,
  DoctorPatientAnalyticsData,
} from "../../../features/doctors/types/doctorReports.types";

const PP = "Poppins, system-ui, sans-serif";
const RB = "Roboto, system-ui, sans-serif";


export interface DoctorConsultationRecord {
  id: string;
  patientName: string;
  mrn: string;
  appointmentDate: string;
  consultationTime: string;
  diagnosis: string;
  prescription: string;
  status: string;
  visitType: string;
}

const getOffsetDateStr = (daysAgo: number): string => {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const SAMPLE_DOCTOR_CONSULTATIONS: DoctorConsultationRecord[] = [
  {
    id: "DOC-2026-001",
    patientName: "Eleanor Vance",
    mrn: "MRN-2026111086",
    appointmentDate: getOffsetDateStr(0),
    consultationTime: "09:00 AM",
    diagnosis: "Hypertension Stage 1",
    prescription: "Amlodipine 5mg OD",
    status: "Completed",
    visitType: "Follow-up Visit",
  },
  {
    id: "DOC-2026-002",
    patientName: "Marcus Brody",
    mrn: "MRN-2026925825",
    appointmentDate: getOffsetDateStr(0),
    consultationTime: "09:30 AM",
    diagnosis: "Type 2 Diabetes Mellitus",
    prescription: "Metformin 500mg BD",
    status: "Completed",
    visitType: "New Consultation",
  },
  {
    id: "DOC-2026-003",
    patientName: "Sophia Martinez",
    mrn: "MRN-2026338491",
    appointmentDate: getOffsetDateStr(0),
    consultationTime: "10:15 AM",
    diagnosis: "Acute Bronchitis",
    prescription: "Azithromycin 500mg OD",
    status: "In Progress",
    visitType: "Routine Checkup",
  },
  {
    id: "DOC-2026-004",
    patientName: "James Harrison",
    mrn: "MRN-2026447219",
    appointmentDate: getOffsetDateStr(1),
    consultationTime: "11:00 AM",
    diagnosis: "Lumbar Spondylosis",
    prescription: "Physiotherapy & Naproxen",
    status: "Scheduled",
    visitType: "Follow-up Visit",
  },
  {
    id: "DOC-2026-005",
    patientName: "Amara Okafor",
    mrn: "MRN-2026559102",
    appointmentDate: getOffsetDateStr(3),
    consultationTime: "02:00 PM",
    diagnosis: "Allergic Rhinitis",
    prescription: "Cetirizine 10mg HS",
    status: "Completed",
    visitType: "New Consultation",
  },
  {
    id: "DOC-2026-006",
    patientName: "David Chen",
    mrn: "MRN-2026771823",
    appointmentDate: getOffsetDateStr(5),
    consultationTime: "03:30 PM",
    diagnosis: "Gastroesophageal Reflux",
    prescription: "Pantoprazole 40mg OD",
    status: "Completed",
    visitType: "Follow-up Visit",
  },
];

// 1. Header Component
const DoctorDashboardHeader = ({
  isRefreshing,
  onRefresh,
}: {
  isRefreshing: boolean;
  onRefresh: () => void;
}) => (
  <div className="w-full px-4 sm:px-6 lg:px-8 py-4">
    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
      <div>
        <div className="flex items-center gap-3">
          <h1
            className="text-2xl font-bold text-[#111827]"
            style={{ fontFamily: PP }}
          >
            Doctor Reports Dashboard
          </h1>
          <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#0D47A1]/10 text-[#0D47A1] border border-blue-200">
            Doctor Access Level
          </span>
        </div>
        <p className="text-xs text-[#64748B] mt-0.5">
          Monitor your appointments, consultations, and patient activity
          analytics.
        </p>
      </div>

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
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-medium text-[#111827] bg-white border border-[#E5E7EB] hover:bg-slate-50 transition shadow-sm"
        >
          <RefreshCw
            className={`w-3.5 h-3.5 text-[#0D47A1] ${isRefreshing ? "animate-spin" : ""}`}
          />
          <span>Refresh</span>
        </button>

        <button
          onClick={() => alert("Exporting Doctor Summary (PDF)...")}
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
);

// 2. Filters Component
interface DoctorFiltersProps {
  searchQuery: string;
  setSearchQuery: (v: string) => void;
  dateRangeFilter: string;
  setDateRangeFilter: (v: string) => void;
  startDate: string;
  setStartDate: (v: string) => void;
  endDate: string;
  setEndDate: (v: string) => void;
  statusFilter: string;
  setStatusFilter: (v: string) => void;
  visitTypeFilter: string;
  setVisitTypeFilter: (v: string) => void;
  onApply: () => void;
  onReset: () => void;
  handlePresetDateChange: (preset: string) => void;
}

const DoctorFilters = ({
  searchQuery,
  setSearchQuery,
  dateRangeFilter,
  startDate,
  setStartDate,
  endDate,
  setEndDate,
  statusFilter,
  setStatusFilter,
  visitTypeFilter,
  setVisitTypeFilter,
  onApply,
  onReset,
  handlePresetDateChange,
}: DoctorFiltersProps) => (
  <div className="mb-6">
    {/* Search & Filter Panel */}
    <div className="bg-white rounded-2xl border border-[#E5E7EB] p-4 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <div
          className="flex items-center gap-2 text-xs font-semibold text-[#111827]"
          style={{ fontFamily: PP }}
        >
          <Filter className="w-4 h-4 text-[#009688]" />
          <span>Filter Doctor Practice & Clinical Analytics</span>
        </div>
        {/* <span className="text-[11px] text-[#64748B] bg-slate-100 px-2.5 py-0.5 rounded-full font-semibold">
          Doctor Context: Active Logged-in Practice
        </span> */}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
        {/* Preset Date Range Dropdown */}
        <div>
          <label className="block text-[11px] font-medium text-[#64748B] mb-1">
            Date Preset
          </label>
          <select
            aria-label="Date preset"
            value={dateRangeFilter}
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

        {/* Appointment Status */}
        <div>
          <label className="block text-[11px] font-medium text-[#64748B] mb-1">
            Appointment Status
          </label>
          <select
            aria-label="Appointment status filter"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full bg-[#F1F5F9] border border-[#E5E7EB] rounded-xl text-xs px-2.5 py-2 text-[#111827] focus:outline-none focus:ring-2 focus:ring-[#0D47A1]"
          >
            <option>All Statuses</option>
            <option>Completed</option>
            <option>In Progress</option>
            <option>Scheduled</option>
            <option>Cancelled</option>
          </select>
        </div>

        {/* Visit Type */}
        <div>
          <label className="block text-[11px] font-medium text-[#64748B] mb-1">
            Visit Type
          </label>
          <select
            aria-label="Visit type filter"
            value={visitTypeFilter}
            onChange={(e) => setVisitTypeFilter(e.target.value)}
            className="w-full bg-[#F1F5F9] border border-[#E5E7EB] rounded-xl text-xs px-2.5 py-2 text-[#111827] focus:outline-none focus:ring-2 focus:ring-[#0D47A1]"
          >
            <option>All Visit Types</option>
            <option>New Consultation</option>
            <option>Follow-up Visit</option>
            <option>Routine Checkup</option>
          </select>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mt-4 pt-3 border-t border-[#E5E7EB]">
        <div className="relative w-full sm:w-72 md:w-80">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#64748B]" />
          <input
            aria-label="Search field"
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search patient name, MRN, diagnosis or prescription..."
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
    </div>
  </div>
);

// 3. Top 6 KPI Cards Component
const DoctorKpiCards = ({
  kpi,
  navigate,
}: {
  kpi: {
    todayAppointments: number;
    completedToday: number;
    cancelledToday: number;
    pendingToday: number;
    myPatients: number;
    newPatients: number;
    returningPatients: number;
    completedConsultations: number;
    monthlyConsultations: number;
    scheduledFollowUps: number;
    avgConsultTime: string;
  };
  navigate: (path: string) => void;
}) => (
  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-6">
    {/* Card 1: Today's Appointments */}
    <div
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          navigate(ROUTES.DOCTOR_APPOINTMENTS);
        }
      }}
      role="button"
      onClick={() => navigate(ROUTES.DOCTOR_APPOINTMENTS)}
      className="bg-white rounded-2xl border border-[#E5E7EB] p-4 shadow-sm hover:shadow-md transition-shadow cursor-pointer group"
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-semibold text-[#64748B] group-hover:text-[#0D47A1] transition">
          Today's Appts
        </span>
        <div className="p-2 rounded-xl bg-blue-50 text-[#0D47A1]">
          <Calendar className="w-4 h-4" />
        </div>
      </div>
      <div
        className="text-2xl font-bold text-[#111827] mb-1"
        style={{ fontFamily: PP }}
      >
        {kpi.todayAppointments}
      </div>
      <div className="flex items-center justify-between text-[11px] text-[#64748B] mb-3">
        <span className="text-[#66BB6A] font-semibold flex items-center gap-0.5">
          Active Schedule
        </span>
        <span className="text-[#0D47A1] font-semibold flex items-center gap-0.5 group-hover:underline">
          Detail <ChevronRight className="w-3 h-3" />
        </span>
      </div>
      <div className="grid grid-cols-3 gap-1 pt-2 border-t border-[#E5E7EB] text-[11px] text-center">
        <div>
          <div className="text-[#66BB6A] font-bold">{kpi.completedToday}</div>
          <div className="text-[#64748B]">Done</div>
        </div>
        <div>
          <div className="text-[#EF4444] font-bold">{kpi.cancelledToday}</div>
          <div className="text-[#64748B]">Cancel</div>
        </div>
        <div>
          <div className="text-[#F59E0B] font-bold">{kpi.pendingToday}</div>
          <div className="text-[#64748B]">Pending</div>
        </div>
      </div>
    </div>

    {/* Card 2: My Patients */}
    <div
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          navigate(ROUTES.DOCTOR_PATIENTS);
        }
      }}
      role="button"
      onClick={() => navigate(ROUTES.DOCTOR_PATIENTS)}
      className="bg-white rounded-2xl border border-[#E5E7EB] p-4 shadow-sm hover:shadow-md transition-shadow cursor-pointer group"
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-semibold text-[#64748B] group-hover:text-[#009688] transition">
          My Patients
        </span>
        <div className="p-2 rounded-xl bg-teal-50 text-[#009688]">
          <Users className="w-4 h-4" />
        </div>
      </div>
      <div
        className="text-2xl font-bold text-[#111827] mb-1"
        style={{ fontFamily: PP }}
      >
        {kpi.myPatients}
      </div>
      <div className="flex items-center justify-between text-[11px] text-[#64748B] mb-3">
        <span className="text-[#009688] font-semibold flex items-center gap-0.5">
          Patient Roster
        </span>
        <span className="text-[#009688] font-semibold flex items-center gap-0.5 group-hover:underline">
          Detail <ChevronRight className="w-3 h-3" />
        </span>
      </div>
      <div className="grid grid-cols-2 gap-1 pt-2 border-t border-[#E5E7EB] text-[11px] text-center">
        <div>
          <div className="text-[#009688] font-bold">{kpi.newPatients}</div>
          <div className="text-[#64748B]">New</div>
        </div>
        <div>
          <div className="text-[#0D47A1] font-bold">
            {kpi.returningPatients}
          </div>
          <div className="text-[#64748B]">Return</div>
        </div>
      </div>
    </div>

    {/* Card 3: Completed Consultations */}
    <div
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          navigate(ROUTES.DOCTOR_CONSULTATION);
        }
      }}
      role="button"
      onClick={() => navigate(ROUTES.DOCTOR_CONSULTATION)}
      className="bg-white rounded-2xl border border-[#E5E7EB] p-4 shadow-sm hover:shadow-md transition-shadow cursor-pointer group"
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-semibold text-[#64748B] group-hover:text-[#0D47A1] transition">
          Completed Consults
        </span>
        <div className="p-2 rounded-xl bg-indigo-50 text-[#0D47A1]">
          <UserCheck className="w-4 h-4" />
        </div>
      </div>
      <div
        className="text-2xl font-bold text-[#111827] mb-1"
        style={{ fontFamily: PP }}
      >
        {kpi.completedConsultations}
      </div>
      <div className="flex items-center justify-between text-[11px] text-[#64748B] mb-3">
        <span className="text-[#0D47A1] font-semibold">Completed</span>
        <span className="text-[#0D47A1] font-semibold flex items-center gap-0.5 group-hover:underline">
          Detail <ChevronRight className="w-3 h-3" />
        </span>
      </div>
      <div className="grid grid-cols-2 gap-1 pt-2 border-t border-[#E5E7EB] text-[11px] text-center">
        <div>
          <div className="text-[#0D47A1] font-bold">{kpi.completedToday}</div>
          <div className="text-[#64748B]">Today</div>
        </div>
        <div>
          <div className="text-[#66BB6A] font-bold">
            {kpi.monthlyConsultations}
          </div>
          <div className="text-[#64748B]">Monthly</div>
        </div>
      </div>
    </div>

    {/* Card 4: Follow-up Patients */}
    <div
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          navigate(ROUTES.DOCTOR_APPOINTMENTS);
        }
      }}
      role="button"
      onClick={() => navigate(ROUTES.DOCTOR_APPOINTMENTS)}
      className="bg-white rounded-2xl border border-[#E5E7EB] p-4 shadow-sm hover:shadow-md transition-shadow cursor-pointer group"
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-semibold text-[#64748B] group-hover:text-[#F59E0B] transition">
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
        {kpi.scheduledFollowUps}
      </div>
      <div className="flex items-center justify-between text-[11px] text-[#64748B] mb-3">
        <span className="text-[#F59E0B] font-semibold">Scheduled</span>
        <span className="text-[#0D47A1] font-semibold flex items-center gap-0.5 group-hover:underline">
          Detail <ChevronRight className="w-3 h-3" />
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
            {Math.max(0, kpi.scheduledFollowUps - 1)}
          </div>
          <div className="text-[#64748B]">Upcoming</div>
        </div>
      </div>
    </div>

    {/* Card 5: Average Consultation Time */}
    <div className="bg-white rounded-2xl border border-[#E5E7EB] p-4 shadow-sm hover:shadow-md transition-shadow cursor-pointer group">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-semibold text-[#64748B] group-hover:text-[#009688] transition">
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
        {kpi.avgConsultTime}
      </div>
      <div className="flex items-center justify-between text-[11px] text-[#64748B] mb-3">
        <span className="text-[#009688] font-semibold">Per Patient</span>
      </div>
      <div className="grid grid-cols-2 gap-1 pt-2 border-t border-[#E5E7EB] text-[11px] text-center">
        <div>
          <div className="text-[#009688] font-bold">{kpi.avgConsultTime}</div>
          <div className="text-[#64748B]">My Avg</div>
        </div>
        <div>
          <div className="text-[#64748B] font-bold">15 min</div>
          <div className="text-[#64748B]">Dept Avg</div>
        </div>
      </div>
    </div>
  </div>
);

// 4. Available Doctor Reports Cards
const AvailableDoctorReports = ({
  onOpenReport,
}: {
  onOpenReport?: (reportId: string) => void;
  onOpenKpiDetail?: (kpiName?: string) => void;
}) => (
  <div className="bg-white rounded-2xl border border-[#E5E7EB] p-6 shadow-sm mb-6">
    <div className="flex items-center justify-between mb-4">
      <div>
        <h2
          className="text-lg font-bold text-[#111827]"
          style={{ fontFamily: PP }}
        >
          Available Doctor Reports
        </h2>
        <p className="text-xs text-[#64748B]">
          Select any report to view your appointments and clinical metrics.
        </p>
      </div>
      <span className="text-xs font-semibold text-[#0D47A1] bg-blue-50 border border-blue-200 px-3 py-1 rounded-full">
        3 Reports Accessible
      </span>
    </div>

    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {/* Report 1: Daily Appointment Report */}
      <div className="border border-[#E5E7EB] rounded-2xl p-4 hover:border-[#0D47A1] hover:shadow-md transition-colors flex flex-col justify-between group bg-white">
        <div>
          <div className="flex items-center justify-between mb-3">
            <div className="p-2.5 rounded-xl bg-blue-50 text-[#0D47A1]">
              <Calendar className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-semibold text-[#64748B] bg-slate-100 px-2 py-0.5 rounded-full">
              Appointments
            </span>
          </div>
          <h3
            className="text-sm font-bold text-[#111827] group-hover:text-[#0D47A1] transition"
            style={{ fontFamily: PP }}
          >
            Daily Appointment Report
          </h3>
          <p className="text-xs text-[#64748B] mt-1.5 leading-relaxed line-clamp-2">
            View detailed list of your scheduled, completed, and pending
            consultations.
          </p>
        </div>
        <div className="mt-4 pt-3 border-t border-[#E5E7EB] flex items-center justify-between">
          <span className="text-[11px] text-[#64748B]">
            Scope: Logged-in Doctor
          </span>
          <button
            onClick={() => onOpenReport?.("REP-001")}
            className="inline-flex items-center gap-1 text-xs font-semibold text-[#0D47A1] hover:text-blue-900 transition"
          >
            <span>Open Report</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Report 2: Patient Report */}
      <div className="border border-[#E5E7EB] rounded-2xl p-4 hover:border-[#009688] hover:shadow-md transition-colors flex flex-col justify-between group bg-white">
        <div>
          <div className="flex items-center justify-between mb-3">
            <div className="p-2.5 rounded-xl bg-teal-50 text-[#009688]">
              <Users className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-semibold text-[#64748B] bg-slate-100 px-2 py-0.5 rounded-full">
              Patients
            </span>
          </div>
          <h3
            className="text-sm font-bold text-[#111827] group-hover:text-[#009688] transition"
            style={{ fontFamily: PP }}
          >
            Patient Report
          </h3>
          <p className="text-xs text-[#64748B] mt-1.5 leading-relaxed line-clamp-2">
            Patient demographics, visit history, and consultation summaries.
          </p>
        </div>
        <div className="mt-4 pt-3 border-t border-[#E5E7EB] flex items-center justify-between">
          <span className="text-[11px] text-[#64748B]">Scope: My Patients</span>
          <button
            onClick={() => onOpenReport?.("REP-003")}
            className="inline-flex items-center gap-1 text-xs font-semibold text-[#009688] hover:text-teal-900 transition"
          >
            <span>Open Report</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Report 3: Doctor Performance Report */}
      <div className="border border-[#E5E7EB] rounded-2xl p-4 hover:border-[#0D47A1] hover:shadow-md transition-colors flex flex-col justify-between group bg-white">
        <div>
          <div className="flex items-center justify-between mb-3">
            <div className="p-2.5 rounded-xl bg-indigo-50 text-[#0D47A1]">
              <UserCheck className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-semibold text-[#64748B] bg-slate-100 px-2 py-0.5 rounded-full">
              Clinical
            </span>
          </div>
          <h3
            className="text-sm font-bold text-[#111827] group-hover:text-[#0D47A1] transition"
            style={{ fontFamily: PP }}
          >
            Doctor Performance Report
          </h3>
          <p className="text-xs text-[#64748B] mt-1.5 leading-relaxed line-clamp-2">
            Track consultation efficiency, completion rates, and patient
            feedback.
          </p>
        </div>
        <div className="mt-4 pt-3 border-t border-[#E5E7EB] flex items-center justify-between">
          <span className="text-[11px] text-[#64748B]">
            Scope: Personal Metrics
          </span>
          <button
            onClick={() => onOpenReport?.("REP-004")}
            className="inline-flex items-center gap-1 text-xs font-semibold text-[#0D47A1] hover:text-blue-900 transition"
          >
            <span>Open Report</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  </div>
);

// 5. Dashboard Charts Component
interface DoctorDashboardChartsProps {
  trendDays: "7" | "30" | "90";
  setTrendDays: (v: "7" | "30" | "90") => void;
  dailyAnalytics?: DoctorDailyAnalyticsData;
  patientAnalytics?: DoctorPatientAnalyticsData;
  filteredConsultations: DoctorConsultationRecord[];
}

const DoctorDashboardCharts = ({
  trendDays,
  setTrendDays,
  dailyAnalytics,
  patientAnalytics,
  filteredConsultations,
}: DoctorDashboardChartsProps) => {
  // 1. Appointment Trend Area Chart Data
  const apptTrendData = useMemo(() => {
    if (
      dailyAnalytics?.appointmentTrend &&
      dailyAnalytics.appointmentTrend.length > 0
    ) {
      return dailyAnalytics.appointmentTrend.map((item) => ({
        date: item.date,
        appointments: item.appointments,
        completed: item.completed,
      }));
    }
    const daysCount = parseInt(trendDays, 10);
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
        appointments: Math.max(1, 5 + ((i * 3) % 7)),
        completed: Math.max(1, 3 + ((i * 2) % 5)),
      });
    }
    return result;
  }, [dailyAnalytics, trendDays]);

  // 2. Patient Type Distribution Donut Chart Data
  const patientTypeData = useMemo(() => {
    if (
      dailyAnalytics?.visitTypeDistribution &&
      dailyAnalytics.visitTypeDistribution.length > 0
    ) {
      const colors = ["#0D47A1", "#009688", "#F59E0B", "#66BB6A", "#EF4444"];
      return dailyAnalytics.visitTypeDistribution.map((item, idx) => ({
        name: item.visitType,
        value: item.count,
        color: colors[idx % colors.length],
      }));
    }
    if (filteredConsultations.length > 0) {
      const newConsults = filteredConsultations.filter(
        (c) => c.visitType === "New Consultation",
      ).length;
      const followUps = filteredConsultations.filter(
        (c) => c.visitType === "Follow-up Visit",
      ).length;
      const routine = filteredConsultations.filter(
        (c) => c.visitType === "Routine Checkup",
      ).length;

      const list = [
        { name: "New Consultation", value: newConsults, color: "#0D47A1" },
        { name: "Follow-up Visit", value: followUps, color: "#009688" },
        { name: "Routine Checkup", value: routine, color: "#F59E0B" },
      ].filter((item) => item.value > 0);

      if (list.length > 0) return list;
    }
    return [
      { name: "New Consultation", value: 4, color: "#0D47A1" },
      { name: "Follow-up Visit", value: 3, color: "#009688" },
      { name: "Routine Checkup", value: 2, color: "#F59E0B" },
    ];
  }, [dailyAnalytics, filteredConsultations]);

  // 3. Intraday Consultation Progress Line Chart Data
  const progressLineData = useMemo(() => {
    if (
      patientAnalytics?.consultationTrend &&
      patientAnalytics.consultationTrend.length > 0
    ) {
      return patientAnalytics.consultationTrend.map((item) => ({
        date: item.date,
        completed: item.completedConsultations,
        patients: item.patients,
      }));
    }
    return [
      { date: "09:00 AM", completed: 1, patients: 2 },
      { date: "11:00 AM", completed: 3, patients: 4 },
      { date: "01:00 PM", completed: 4, patients: 5 },
      { date: "03:00 PM", completed: 6, patients: 7 },
      { date: "05:00 PM", completed: 8, patients: 9 },
    ];
  }, [patientAnalytics]);

  // 4. Shift Workload Distribution Bar Chart Data
  const shiftWorkloadData = useMemo(() => {
    if (
      dailyAnalytics?.dailyWorkload &&
      dailyAnalytics.dailyWorkload.length > 0
    ) {
      return dailyAnalytics.dailyWorkload.map((item) => ({
        slot: item.shift,
        completed: item.completed,
        pending: Math.max(0, item.appointments - item.completed),
      }));
    }
    return [
      { slot: "Morning (08-12)", completed: 4, pending: 1 },
      { slot: "Afternoon (12-04)", completed: 3, pending: 2 },
      { slot: "Evening (04-08)", completed: 1, pending: 0 },
    ];
  }, [dailyAnalytics]);

  return (
    <div className="space-y-6 mb-6">
      {/* APPOINTMENT TREND & PATIENT TYPE DONUT */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* My Appointment Trend Area Chart */}
        <div className="bg-white rounded-2xl border border-[#E5E7EB] p-5 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <div>
              <h3
                className="text-base font-bold text-[#111827]"
                style={{ fontFamily: PP }}
              >
                My Appointment Trend
              </h3>
              <p className="text-xs text-[#64748B]">
                Tracking scheduled vs completed consultations
              </p>
            </div>

            <div className="flex items-center gap-1 bg-[#F1F5F9] p-1 rounded-xl border border-[#E5E7EB] text-xs">
              {(["7", "30", "90"] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setTrendDays(t)}
                  className={`px-3 py-1 rounded-lg font-medium transition ${trendDays === t ? "bg-[#0D47A1] text-white shadow-sm" : "text-[#64748B]"}`}
                >
                  {t} Days
                </button>
              ))}
            </div>
          </div>

          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={apptTrendData}
                margin={{ top: 10, right: 10, left: -15, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="docApptGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0D47A1" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#0D47A1" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="docCompGrad" x1="0" y1="0" x2="0" y2="1">
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
                <Legend
                  verticalAlign="top"
                  height={32}
                  wrapperStyle={{ fontSize: "11px" }}
                />
                <Area
                  type="monotone"
                  dataKey="appointments"
                  name="Total Appointments"
                  stroke="#0D47A1"
                  fillOpacity={1}
                  fill="url(#docApptGrad)"
                />
                <Area
                  type="monotone"
                  dataKey="completed"
                  name="Completed Consultations"
                  stroke="#009688"
                  fillOpacity={1}
                  fill="url(#docCompGrad)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Patient Type Distribution Donut Chart */}
        <div className="bg-white rounded-2xl border border-[#E5E7EB] p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3
                className="text-sm font-bold text-[#111827]"
                style={{ fontFamily: PP }}
              >
                Patient Visit Type Distribution
              </h3>
              <p className="text-[11px] text-[#64748B]">
                Breakdown of new vs returning vs follow-up consultations
              </p>
            </div>
            <PieChartIcon className="w-4 h-4 text-[#009688]" />
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <RechartsPie>
                <Pie
                  data={patientTypeData}
                  cx="50%"
                  cy="50%"
                  innerRadius={45}
                  outerRadius={75}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {patientTypeData.map((entry) => (
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

      {/* CONSULTATION PROGRESS & SHIFT WORKLOAD */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Intraday Consultation Progress Line Chart */}
        <div className="bg-white rounded-2xl border border-[#E5E7EB] p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3
                className="text-sm font-bold text-[#111827]"
                style={{ fontFamily: PP }}
              >
                Intraday Consultation Progress
              </h3>
              <p className="text-[11px] text-[#64748B]">
                Consultations completed over practice hours
              </p>
            </div>
            <Clock className="w-4 h-4 text-[#0D47A1]" />
          </div>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={progressLineData}
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
                  dataKey="completed"
                  name="Completed"
                  stroke="#0D47A1"
                  strokeWidth={2}
                  dot={{ fill: "#0D47A1" }}
                />
                <Line
                  type="monotone"
                  dataKey="patients"
                  name="Total Patients"
                  stroke="#009688"
                  strokeWidth={2}
                  dot={{ fill: "#009688" }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Shift Workload Distribution Bar Chart */}
        <div className="bg-white rounded-2xl border border-[#E5E7EB] p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3
                className="text-sm font-bold text-[#111827]"
                style={{ fontFamily: PP }}
              >
                Shift Workload Distribution
              </h3>
              <p className="text-[11px] text-[#64748B]">
                Consultation load across morning, afternoon & evening shifts
              </p>
            </div>
            <UserCheck className="w-4 h-4 text-[#0D47A1]" />
          </div>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                layout="vertical"
                data={shiftWorkloadData}
                margin={{ top: 5, right: 10, left: 35, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                <XAxis type="number" tick={{ fontSize: 10, fill: "#64748B" }} />
                <YAxis
                  type="category"
                  dataKey="slot"
                  tick={{ fontSize: 9, fill: "#111827" }}
                  width={120}
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
      </div>
    </div>
  );
};

// 6. Consultations Table Component
const DoctorConsultationsTable = ({
  filteredConsultations,
}: {
  filteredConsultations: DoctorConsultationRecord[];
}) => (
  <div className="bg-white rounded-2xl border border-[#E5E7EB] shadow-sm overflow-hidden mb-6">
    <div className="p-5 border-b border-[#E5E7EB] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
      <div>
        <h3
          className="text-base font-bold text-[#111827]"
          style={{ fontFamily: PP }}
        >
          Recent Patient Consultations
        </h3>
        <p className="text-xs text-[#64748B]">
          Logged-in Doctor active consultation history register
        </p>
      </div>
      <button
        onClick={() => alert("Exporting Consultation Summary (CSV)...")}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 border border-[#E5E7EB] text-xs font-semibold text-[#111827] rounded-xl hover:bg-slate-100 transition"
      >
        <Download className="w-3.5 h-3.5 text-[#0D47A1]" />
        <span>Export Summary</span>
      </button>
    </div>

    <div className="overflow-x-auto">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="bg-[#F1F5F9] text-[11px] font-bold text-[#64748B] uppercase tracking-wider border-b border-[#E5E7EB]">
            <th className="py-3.5 px-4">Patient Name</th>
            <th className="py-3.5 px-4">MRN</th>
            <th className="py-3.5 px-4">Appt Date</th>
            <th className="py-3.5 px-4">Consult Time</th>
            <th className="py-3.5 px-4">Diagnosis</th>
            <th className="py-3.5 px-4">Prescription</th>
            <th className="py-3.5 px-4">Visit Type</th>
            <th className="py-3.5 px-4 text-center">Status</th>
            <th className="py-3.5 px-4 text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[#E5E7EB] text-xs">
          {filteredConsultations.length === 0 ? (
            <tr>
              <td colSpan={9} className="py-8 text-center text-[#64748B]">
                No consultation records match your filter criteria.
              </td>
            </tr>
          ) : (
            filteredConsultations.map((item) => (
              <tr
                key={item.id}
                className="hover:bg-slate-50 transition-colors"
              >
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
                <td className="py-3.5 px-4 font-semibold text-[#111827]">
                  {item.diagnosis}
                </td>
                <td className="py-3.5 px-4 text-[#009688] font-medium">
                  {item.prescription}
                </td>
                <td className="py-3.5 px-4 text-[#64748B] font-medium">
                  {item.visitType}
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
                        alert(
                          `Viewing consultation details for ${item.patientName}`,
                        )
                      }
                      className="p-1.5 text-[#0D47A1] hover:bg-blue-50 rounded-lg transition"
                      title="View Consultation"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() =>
                        alert(`Printing summary for ${item.patientName}`)
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

    {/* Table Pagination / Footer */}
    <div className="p-4 bg-[#F1F5F9] border-t border-[#E5E7EB] flex items-center justify-between text-xs text-[#64748B]">
      <span>
        Showing 1 to {filteredConsultations.length} of{" "}
        {filteredConsultations.length} entries
      </span>
      <div className="flex items-center gap-2">
        <button
          disabled
          className="px-3 py-1 bg-white border border-[#E5E7EB] rounded-lg opacity-50 cursor-not-allowed"
        >
          Previous
        </button>
        <span className="font-semibold text-[#111827]">Page 1 of 1</span>
        <button
          disabled
          className="px-3 py-1 bg-white border border-[#E5E7EB] rounded-lg opacity-50 cursor-not-allowed"
        >
          Next
        </button>
      </div>
    </div>
  </div>
);

// Main Screen Component
export function DoctorReportsDashboardScreen({
  onOpenReport,
}: {
  onOpenReport?: (reportId: string) => void;
}) {
  const navigate = useNavigate();
  const todayStr = getOffsetDateStr(0);

  const [state, dispatch] = useReducer(
    (
      prev: {
        searchQuery: string;
        dateRangeFilter: string;
        startDate: string;
        endDate: string;
        statusFilter: string;
        visitTypeFilter: string;
        trendDays: "7" | "30" | "90";
        isRefreshing: boolean;
        showLoadingDemo: boolean;
        hasError: boolean;
      },
      next: Partial<{
        searchQuery: string;
        dateRangeFilter: string;
        startDate: string;
        endDate: string;
        statusFilter: string;
        visitTypeFilter: string;
        trendDays: "7" | "30" | "90";
        isRefreshing: boolean;
        showLoadingDemo: boolean;
        hasError: boolean;
      }>,
    ) => ({ ...prev, ...next }),
    {
      searchQuery: "",
      dateRangeFilter: "Today",
      startDate: todayStr,
      endDate: todayStr,
      statusFilter: "All Statuses",
      visitTypeFilter: "All Visit Types",
      trendDays: "7" as const,
      isRefreshing: false,
      showLoadingDemo: false,
      hasError: false,
    },
  );
  const {
    searchQuery,
    dateRangeFilter,
    startDate,
    endDate,
    statusFilter,
    visitTypeFilter,
    trendDays,
    isRefreshing,
    showLoadingDemo,
    hasError,
  } = state;

  const setSearchQuery = (val: string) => dispatch({ searchQuery: val });
  const setDateRangeFilter = (val: string) => dispatch({ dateRangeFilter: val });
  const setStartDate = (val: string) => dispatch({ startDate: val });
  const setEndDate = (val: string) => dispatch({ endDate: val });
  const setStatusFilter = (val: string) => dispatch({ statusFilter: val });
  const setVisitTypeFilter = (val: string) => dispatch({ visitTypeFilter: val });
  const setTrendDays = (val: "7" | "30" | "90") => dispatch({ trendDays: val });
  const setIsRefreshing = (val: boolean) => dispatch({ isRefreshing: val });
  const setShowLoadingDemo = (val: boolean) => dispatch({ showLoadingDemo: val });
  const setHasError = (val: boolean) => dispatch({ hasError: val });
  const [isPending,] = useTransition();
  const isLoading = isPending || showLoadingDemo;

  const singleDateParam =
    startDate && endDate && startDate === endDate ? startDate : undefined;

  // React Query Hooks for Backend Doctor Reports APIs
  const { data: dailyDashboard, refetch: refetchDailyDash } =
    useDoctorDailyDashboard(singleDateParam);
  const { data: dailyAnalytics, refetch: refetchDailyAnalytics } =
    useDoctorDailyAnalytics({
      date: singleDateParam,
      period: `${trendDays}days`,
    });
  const { data: dailyRegister, refetch: refetchDailyReg } =
    useDoctorDailyRegister({
      date: singleDateParam,
      search: searchQuery || undefined,
      status: statusFilter !== "All Statuses" ? statusFilter : undefined,
      size: 50,
    });
  const { data: patientDashboard, refetch: refetchPatDash } =
    useDoctorPatientDashboard({
      fromDate: startDate,
      toDate: endDate,
    });
  const { data: patientAnalytics, refetch: refetchPatAnalytics } =
    useDoctorPatientAnalytics({
      fromDate: startDate,
      toDate: endDate,
      period: `${trendDays}days`,
    });
  const { refetch: refetchPatReg } =
    useDoctorPatientRegister({
      fromDate: startDate,
      toDate: endDate,
      search: searchQuery || undefined,
      size: 50,
    });

  const handlePresetDateChange = (preset: string) => {
    setDateRangeFilter(preset);
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
    refetchDailyDash();
    refetchDailyAnalytics();
    refetchDailyReg();
    refetchPatDash();
    refetchPatAnalytics();
    refetchPatReg();
    setTimeout(() => setIsRefreshing(false), 600);
  };

  const handleResetFilters = () => {
    const tStr = getOffsetDateStr(0);
    setSearchQuery("");
    setDateRangeFilter("Today");
    setStartDate(tStr);
    setEndDate(tStr);
    setStatusFilter("All Statuses");
    setVisitTypeFilter("All Visit Types");
  };

  const filteredConsultations = useMemo(() => {
    let rawList: DoctorConsultationRecord[];

    if (dailyRegister?.content && dailyRegister.content.length > 0) {
      rawList = dailyRegister.content.map((item, idx) => ({
        id: item.appointmentId || `reg-api-${idx}`,
        patientName: item.patientName || "Unknown Patient",
        mrn: item.mrn || "N/A",
        appointmentDate: item.appointmentDate || getOffsetDateStr(0),
        consultationTime: item.appointmentTime || "09:00 AM",
        diagnosis: "Clinical Consultation",
        prescription: "Standard Rx",
        status:
          item.consultationStatus || item.appointmentStatus || "Completed",
        visitType: item.visitType || "Follow-up Visit",
      }));
    } else {
      rawList = SAMPLE_DOCTOR_CONSULTATIONS;
    }

    return rawList.filter((item) => {
      // 1. Search Query Filter
      const matchesSearch =
        !searchQuery ||
        (item.patientName || "")
          .toLowerCase()
          .includes(searchQuery.toLowerCase()) ||
        (item.mrn || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.diagnosis || "")
          .toLowerCase()
          .includes(searchQuery.toLowerCase()) ||
        (item.prescription || "")
          .toLowerCase()
          .includes(searchQuery.toLowerCase());

      // 2. Appointment Status Filter
      const matchesStatus =
        statusFilter === "All Statuses" ||
        item.status.toLowerCase() === statusFilter.toLowerCase();

      // 3. Visit Type Filter
      const matchesVisit =
        visitTypeFilter === "All Visit Types" ||
        item.visitType.toLowerCase() === visitTypeFilter.toLowerCase();

      // 4. Date Range Filter
      const extractDateStr = (rec: DoctorConsultationRecord): string | null => {
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

      return matchesSearch && matchesStatus && matchesVisit && matchesDate;
    });
  }, [
    dailyRegister,
    searchQuery,
    statusFilter,
    visitTypeFilter,
    startDate,
    endDate,
  ]);

  const kpi = useMemo(() => {
    const summary = dailyDashboard?.summary || patientDashboard?.summary;

    const apiTodayAppts = summary?.todayConsultations;
    const apiMyPatients = summary?.myPatients;
    const apiCompleted = summary?.completedConsultations;
    const apiFollowUps = summary?.scheduledFollowUps;

    const totalReg = filteredConsultations.length;
    const completedCount = filteredConsultations.filter(
      (a) => a.status === "Completed",
    ).length;
    const pendingCount = filteredConsultations.filter(
      (a) => a.status === "Scheduled" || a.status === "In Progress",
    ).length;
    const cancelledCount = filteredConsultations.filter(
      (a) => a.status === "Cancelled",
    ).length;

    return {
      todayAppointments: apiTodayAppts ?? totalReg,
      completedToday: completedCount,
      cancelledToday: cancelledCount,
      pendingToday: pendingCount,
      myPatients: apiMyPatients ?? totalReg,
      newPatients: summary?.newPatients ?? Math.ceil(totalReg / 2),
      returningPatients: summary?.returningPatients ?? Math.floor(totalReg / 2),
      completedConsultations: apiCompleted ?? completedCount,
      monthlyConsultations:
        summary?.monthlyConsultations ?? completedCount * 12,
      scheduledFollowUps: apiFollowUps ?? Math.max(1, Math.floor(totalReg / 3)),
      avgConsultTime: summary?.averagePatientsPerDay
        ? `${Math.round(summary.averagePatientsPerDay * 10)} min`
        : "12 min",
    };
  }, [dailyDashboard, patientDashboard, filteredConsultations]);

  return (
    <div
      className="min-h-screen bg-[#F1F5F9] text-[#111827] pb-12"
      style={{ fontFamily: RB }}
    >
      {/* Top Header Section */}
      <DoctorDashboardHeader
        isRefreshing={isRefreshing}
        onRefresh={handleRefresh}
      />

      {/* Main Container Full Width */}
      <div className="w-full px-4 sm:px-6 lg:px-8 mt-6 space-y-6">
        {/* 1. TOP 5 DOCTOR KPI CARDS */}
        {!isLoading && !hasError && (
          <DoctorKpiCards kpi={kpi} navigate={navigate} />
        )}

        {/* 2. DOCTOR FILTERS SECTION */}
        <DoctorFilters
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          dateRangeFilter={dateRangeFilter}
          setDateRangeFilter={setDateRangeFilter}
          startDate={startDate}
          setStartDate={setStartDate}
          endDate={endDate}
          setEndDate={setEndDate}
          statusFilter={statusFilter}
          setStatusFilter={setStatusFilter}
          visitTypeFilter={visitTypeFilter}
          setVisitTypeFilter={setVisitTypeFilter}
          onApply={handleRefresh}
          onReset={handleResetFilters}
          handlePresetDateChange={handlePresetDateChange}
        />

        {/* ERROR STATE */}
        {hasError && (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-6 mb-6 text-center">
            <AlertCircle className="w-10 h-10 text-[#EF4444] mx-auto mb-2" />
            <h3
              className="text-base font-bold text-[#111827]"
              style={{ fontFamily: PP }}
            >
              Unable to Load Doctor Reports
            </h3>
            <p className="text-xs text-[#64748B] mt-1 max-w-md mx-auto">
              Connection timeout while loading your consultation metrics. Please
              retry.
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
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
              {[1, 2, 3, 4, 5].map((i) => (
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
            {/* 3. AVAILABLE DOCTOR REPORTS CARDS */}
            <AvailableDoctorReports
              onOpenReport={onOpenReport}
            />

            {/* 3. DASHBOARD CHARTS */}
            <DoctorDashboardCharts
              trendDays={trendDays}
              setTrendDays={setTrendDays}
              dailyAnalytics={dailyAnalytics}
              patientAnalytics={patientAnalytics}
              filteredConsultations={filteredConsultations}
            />

            {/* 4. RECENT CONSULTATIONS TABLE */}
            <DoctorConsultationsTable
              filteredConsultations={filteredConsultations}
            />
          </div>
        )}

        {/* FOOTER */}
        <div className="mt-8 pt-4 border-t border-[#E5E7EB] flex flex-col sm:flex-row items-center justify-between text-xs text-[#64748B] gap-2">
          <div>
            Showing{" "}
            <strong className="text-[#111827]">
              {filteredConsultations.length} Consultations
            </strong>
          </div>
          <div>Hospital Management System • Doctor Reports Dashboard v1.0</div>
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
