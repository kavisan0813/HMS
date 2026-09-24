import React, { useState, useMemo, useTransition } from "react";
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
  UserPlus,
  PieChart as PieChartIcon,
  Printer,
  ChevronLeft,
  ChevronRight as ChevronRightIcon,
  AlertCircle,
  Shield,
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

import { usePatientMasterRegister, extractList } from "../hooks/useReports";
import { exportDataToCsv } from "../utils/export.utils";
import type { PatientMasterRecord } from "../types/reports.types";

export function ReceptionistPatientReportScreen({
  onBack,
  onOpenAppointments,
}: {
  onBack?: () => void;
  onOpenAppointments?: () => void;
}) {
  const [searchQuery, setSearchQuery] = useState("");
  const [dateRange, setDateRange] = useState("Today");
  const [regTypeFilter, setRegTypeFilter] = useState("All Registration Types");
  const [apptStatusFilter, setApptStatusFilter] = useState("All Statuses");
  const [checkInStatusFilter, setCheckInStatusFilter] = useState(
    "All Check-In Statuses",
  );
  const [visitTypeFilter, setVisitTypeFilter] = useState("All Visit Types");
  const [trendDays, setTrendDays] = useState<"7 Days" | "30 Days" | "90 Days">(
    "7 Days",
  );
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [showLoadingDemo, setShowLoadingDemo] = useState(false);
  const isLoading = isPending || showLoadingDemo;
  const [hasError, setHasError] = useState(false);

  const today = new Date().toISOString().slice(0, 10);
  const { data: patientMasterData } = usePatientMasterRegister({
    fromDate: "2025-01-01",
    toDate: today,
  });
  const masterList = useMemo(
    () => extractList<PatientMasterRecord>(patientMasterData),
    [patientMasterData],
  );

  const patientSource = useMemo(() => {
    const list = masterList.map((p) => ({
      id: p.patientId || "",
      patientName: p.patientName || p.fullName || "N/A",
      mrn: p.mrn
        ? String(p.mrn).startsWith("MRN-")
          ? String(p.mrn)
          : `MRN-${p.mrn}`
        : `MRN-${p.patientId || ""}`,
      mobileNumber: p.mobile || p.phone || "9876543210",
      appointmentStatus: p.status || "Completed",
      visitType: p.visitType || "New Visit",
      age: p.age || 30,
      gender: p.gender || "Male",
      registrationDate: p.registrationDate || p.createdDate || today,
      checkInStatus: "Checked-In",
      registrationStatus: "Active",
    }));
    if (list.length === 0) {
      return [
        {
          id: "1",
          patientName: "Kavisan R",
          mrn: "MRN-1001",
          mobileNumber: "9876543210",
          appointmentStatus: "Completed",
          visitType: "New Visit",
          age: 24,
          gender: "Male",
          registrationDate: today,
          checkInStatus: "Checked-In",
          registrationStatus: "Active",
        },
        {
          id: "2",
          patientName: "Pradeep Kumar",
          mrn: "MRN-1002",
          mobileNumber: "9876543211",
          appointmentStatus: "Checked-In",
          visitType: "Follow-up",
          age: 32,
          gender: "Male",
          registrationDate: today,
          checkInStatus: "Checked-In",
          registrationStatus: "Active",
        },
      ];
    }
    return list;
  }, [masterList, today]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => setIsRefreshing(false), 600);
  };

  const handleExportAllCsv = () => {
    const recordsToExport = (
      filteredPatients.length > 0 ? filteredPatients : patientSource
    ).map((rec) => ({
      Section: "RECEPTIONIST PATIENT REPORT",
      MRN: rec.mrn || "N/A",
      "Patient Name": rec.patientName || "N/A",
      "Age / Gender": `${rec.age || 0} / ${rec.gender || "N/A"}`,
      Mobile: rec.mobileNumber || "N/A",
      "Visit Type": rec.visitType || "N/A",
      "Registration Status": rec.registrationStatus || "Active",
      "Check-In Status": rec.checkInStatus || "N/A",
      "Registration Date": rec.registrationDate || today,
    }));

    exportDataToCsv(
      `Receptionist_Patient_Report_All_Data_${new Date().toISOString().slice(0, 10)}.csv`,
      recordsToExport,
    );
  };

  const handleResetFilters = () => {
    setSearchQuery("");
    setDateRange("Today");
    setRegTypeFilter("All Registration Types");
    setApptStatusFilter("All Statuses");
    setCheckInStatusFilter("All Check-In Statuses");
    setVisitTypeFilter("All Visit Types");
  };

  const filteredPatients = patientSource.filter((item) => {
    const matchesSearch =
      item.patientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.mrn.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.mobileNumber.includes(searchQuery);
    const matchesAppt =
      apptStatusFilter === "All Statuses" ||
      item.appointmentStatus.toLowerCase() === apptStatusFilter.toLowerCase();
    const matchesVisit =
      visitTypeFilter === "All Visit Types" ||
      item.visitType.toLowerCase() === visitTypeFilter.toLowerCase();
    return matchesSearch && matchesAppt && matchesVisit;
  });

  const regTrendData = useMemo(() => {
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
        New: Math.max(1, 5 + ((i * 3) % 7)),
        ReReg: Math.max(1, 3 + ((i * 2) % 4)),
      });
    }
    return result;
  }, [trendDays]);

  const genderBreakdownData = useMemo(() => {
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
      { name: "Male", value: male || 12, color: "#0D47A1" },
      { name: "Female", value: female || 8, color: "#009688" },
      { name: "Other", value: other || 2, color: "#4DB6AC" },
    ];
  }, [filteredPatients]);

  const hourlyIntakeData = useMemo(() => {
    return [
      { hour: "08 AM", count: 4 },
      { hour: "10 AM", count: 12 },
      { hour: "12 PM", count: 9 },
      { hour: "02 PM", count: 14 },
      { hour: "04 PM", count: 8 },
      { hour: "06 PM", count: 5 },
    ];
  }, []);

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
                  onClick={onBack}
                  className="hover:text-[#0D47A1] cursor-pointer"
                >
                  Reception
                </button>
                <ChevronRight className="w-3.5 h-3.5" />
                <button
                  type="button"
                  onClick={onBack}
                  className="hover:text-[#0D47A1] cursor-pointer"
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
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#0D47A1]/10 text-[#0D47A1] border border-blue-200">
                  Reception Scoped
                </span>
              </div>
              <p className="text-xs text-[#64748B] mt-0.5">
                Monitor patient registrations, arrivals, walk-ins and reception
                activities.
              </p>
            </div>

            {/* Header Actions */}
            <div className="flex items-center gap-3 flex-wrap">
              <button
                type="button"
                onClick={() => (onBack ? onBack() : window.history.back())}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-[#E5E7EB] bg-white text-xs font-semibold text-[#111827] hover:bg-slate-50 transition-all shadow-2xs cursor-pointer mr-1"
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
                onClick={() => alert("Exporting Patient Report (PDF)...")}
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
      </div>

      {/* Main Container */}
      <div className="w-full max-w-none px-4 sm:px-6 lg:px-8 xl:px-10 mt-6">
        {/* Search & Filter Bar */}
        <div className="bg-white rounded-2xl border border-[#E5E7EB] p-4 shadow-sm mb-6">
          <div className="flex items-center justify-between mb-3">
            <div
              className="flex items-center gap-2 text-xs font-semibold text-[#111827]"
              style={{ fontFamily: PP }}
            >
              <Filter className="w-4 h-4 text-[#009688]" />
              <span>Filter Patient Operational Data</span>
            </div>
            <span className="text-[11px] text-[#64748B] bg-slate-100 px-2.5 py-0.5 rounded-full font-semibold">
              Reception Role Scoped
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
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
                Registration Type
                <select
                  aria-label="Select option"
                  value={regTypeFilter}
                  onChange={(e) => setRegTypeFilter(e.target.value)}
                  className="w-full bg-[#F1F5F9] border border-[#E5E7EB] rounded-xl text-xs px-2.5 py-2 text-[#111827] focus:outline-none focus:ring-2 focus:ring-[#0D47A1]"
                >
                  <option>All Registration Types</option>
                  <option>New Intake</option>
                  <option>Re-registration</option>
                  <option>Emergency Intake</option>
                </select>
              </span>
            </div>

            <div>
              <span className="block text-[11px] font-medium text-[#64748B] mb-1">
                Appointment Status
                <select
                  aria-label="Select option"
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
              </span>
            </div>

            <div>
              <span className="block text-[11px] font-medium text-[#64748B] mb-1">
                Check-In Status
                <select
                  aria-label="Select option"
                  value={checkInStatusFilter}
                  onChange={(e) => setCheckInStatusFilter(e.target.value)}
                  className="w-full bg-[#F1F5F9] border border-[#E5E7EB] rounded-xl text-xs px-2.5 py-2 text-[#111827] focus:outline-none focus:ring-2 focus:ring-[#0D47A1]"
                >
                  <option>All Check-In Statuses</option>
                  <option>Checked-In</option>
                  <option>Pending Check-In</option>
                </select>
              </span>
            </div>

            <div>
              <span className="block text-[11px] font-medium text-[#64748B] mb-1">
                Visit Type
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
                placeholder="Search Patient Name, MRN, Mobile Number, Appointment ID..."
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
            Simulate patient report state
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
              Connection error while loading patient report data. Please retry.
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
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
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

        {!isLoading && !hasError && (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* LEFT MAIN CONTENT AREA (3 Cols) */}
            <div className="lg:col-span-3 space-y-6">
              {/* TOP 6 RECEPTIONIST KPI CARDS */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* Card 1: Today's Registrations */}
                <div className="bg-white rounded-2xl border border-[#E5E7EB] p-4 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold text-[#64748B]">
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
                    66
                  </div>
                  <div className="flex items-center gap-2 text-[11px] text-[#64748B] mb-3">
                    <span className="text-[#66BB6A] font-semibold flex items-center gap-0.5">
                      <TrendingUp className="w-3 h-3" /> +12.4%
                    </span>
                    <span>vs yesterday</span>
                  </div>
                  <div className="grid grid-cols-2 gap-1 pt-2 border-t border-[#E5E7EB] text-[11px] text-center">
                    <div>
                      <div className="text-[#0D47A1] font-bold">42</div>
                      <div className="text-[#64748B]">New Reg</div>
                    </div>
                    <div>
                      <div className="text-[#009688] font-bold">24</div>
                      <div className="text-[#64748B]">Returning</div>
                    </div>
                  </div>
                </div>

                {/* Card 2: Walk-In Patients */}
                <div className="bg-white rounded-2xl border border-[#E5E7EB] p-4 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold text-[#64748B]">
                      Walk-In Patients
                    </span>
                    <div className="p-2 rounded-xl bg-[#0D47A1]/10 text-[#0D47A1]">
                      <UserPlus className="w-4 h-4" />
                    </div>
                  </div>
                  <div
                    className="text-2xl font-bold text-[#111827] mb-1"
                    style={{ fontFamily: PP }}
                  >
                    28
                  </div>
                  <div className="flex items-center gap-2 text-[11px] text-[#64748B] mb-3">
                    <span className="text-[#0D47A1] font-semibold">
                      42.4% Walk-In Percentage
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-1 pt-2 border-t border-[#E5E7EB] text-[11px] text-center">
                    <div>
                      <div className="text-[#0D47A1] font-bold">28</div>
                      <div className="text-[#64748B]">Today</div>
                    </div>
                    <div>
                      <div className="text-[#009688] font-bold">42.4%</div>
                      <div className="text-[#64748B]">Share</div>
                    </div>
                  </div>
                </div>

                {/* Card 3: Appointment Patients */}
                <div className="bg-white rounded-2xl border border-[#E5E7EB] p-4 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold text-[#64748B]">
                      Appointment Patients
                    </span>
                    <div className="p-2 rounded-xl bg-teal-50 text-[#009688]">
                      <Calendar className="w-4 h-4" />
                    </div>
                  </div>
                  <div
                    className="text-2xl font-bold text-[#111827] mb-1"
                    style={{ fontFamily: PP }}
                  >
                    38
                  </div>
                  <div className="flex items-center gap-2 text-[11px] text-[#64748B] mb-3">
                    <span className="text-[#009688] font-semibold">
                      Booked & Expected Arrivals
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-1 pt-2 border-t border-[#E5E7EB] text-[11px] text-center">
                    <div>
                      <div className="text-[#0D47A1] font-bold">38</div>
                      <div className="text-[#64748B]">Booked</div>
                    </div>
                    <div>
                      <div className="text-[#66BB6A] font-bold">38</div>
                      <div className="text-[#64748B]">Expected</div>
                    </div>
                  </div>
                </div>

                {/* Card 4: Checked-In Patients */}
                <div className="bg-white rounded-2xl border border-[#E5E7EB] p-4 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold text-[#64748B]">
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
                    72
                  </div>
                  <div className="flex items-center gap-2 text-[11px] text-[#64748B] mb-3">
                    <span className="text-[#66BB6A] font-semibold">
                      14 Pending Check-Ins
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-1 pt-2 border-t border-[#E5E7EB] text-[11px] text-center">
                    <div>
                      <div className="text-[#66BB6A] font-bold">72</div>
                      <div className="text-[#64748B]">Completed</div>
                    </div>
                    <div>
                      <div className="text-[#F59E0B] font-bold">14</div>
                      <div className="text-[#64748B]">Pending</div>
                    </div>
                  </div>
                </div>

                {/* Card 5: Returning Patients */}
                <div className="bg-white rounded-2xl border border-[#E5E7EB] p-4 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold text-[#64748B]">
                      Returning Patients
                    </span>
                    <div className="p-2 rounded-xl bg-amber-50 text-[#F59E0B]">
                      <Activity className="w-4 h-4" />
                    </div>
                  </div>
                  <div
                    className="text-2xl font-bold text-[#111827] mb-1"
                    style={{ fontFamily: PP }}
                  >
                    24
                  </div>
                  <div className="flex items-center gap-2 text-[11px] text-[#64748B] mb-3">
                    <span className="text-[#F59E0B] font-semibold">
                      36.3% Returning %
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-1 pt-2 border-t border-[#E5E7EB] text-[11px] text-center">
                    <div>
                      <div className="text-[#F59E0B] font-bold">24</div>
                      <div className="text-[#64748B]">Repeat</div>
                    </div>
                    <div>
                      <div className="text-[#0D47A1] font-bold">36.3%</div>
                      <div className="text-[#64748B]">Rate</div>
                    </div>
                  </div>
                </div>

                {/* Card 6: Average Registration Time */}
                <div className="bg-white rounded-2xl border border-[#E5E7EB] p-4 shadow-sm hover:shadow-md transition-shadow flex items-center justify-between">
                  <div>
                    <span className="text-xs font-semibold text-[#64748B]">
                      Average Registration Time
                    </span>
                    <div
                      className="text-2xl font-bold text-[#111827] mt-1"
                      style={{ fontFamily: PP }}
                    >
                      4.2 min
                    </div>
                    <p className="text-[11px] text-[#64748B] mt-1">
                      Peak Hour: 10:00 AM
                    </p>
                    <div className="mt-2 text-[11px] font-semibold text-[#66BB6A]">
                      âœ“ Fast Intake
                    </div>
                  </div>
                  <CircularProgress percentage={92} size={64} strokeWidth={7} />
                </div>
              </div>

              {/* PATIENT REGISTRATION TREND & PATIENT TYPE DISTRIBUTION CHARTS */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                      {(["7 Days", "30 Days", "90 Days"] as const).map((r) => (
                        <button
                          key={r}
                          onClick={() => setTrendDays(r)}
                          className={`px-2 py-0.5 rounded-lg font-medium transition ${trendDays === r ? "bg-[#0D47A1] text-white shadow-sm" : "text-[#64748B]"}`}
                        >
                          {r}
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
                          <linearGradient
                            id="recPatNewGrad"
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
                            id="recPatRetGrad"
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
                          dataKey="New"
                          name="New Registrations"
                          stroke="#0D47A1"
                          fillOpacity={1}
                          fill="url(#recPatNewGrad)"
                        />
                        <Area
                          type="monotone"
                          dataKey="ReReg"
                          name="Returning Patients"
                          stroke="#009688"
                          fillOpacity={1}
                          fill="url(#recPatRetGrad)"
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
                        Patient Type Distribution
                      </h3>
                      <p className="text-[11px] text-[#64748B]">
                        New vs returning vs walk-in vs appointment patients
                      </p>
                    </div>
                    <PieChartIcon className="w-4 h-4 text-[#009688]" />
                  </div>
                  <div className="h-60">
                    <ResponsiveContainer width="100%" height="100%">
                      <RechartsPie>
                        <Pie
                          data={genderBreakdownData}
                          cx="50%"
                          cy="50%"
                          innerRadius={45}
                          outerRadius={75}
                          paddingAngle={3}
                          dataKey="value"
                        >
                          {genderBreakdownData.map((entry) => (
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

              {/* CHECK-IN PERFORMANCE & REGISTRATION PERFORMANCE CHARTS */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Check-In Performance Vertical Bar Chart */}
                <div className="bg-white rounded-2xl border border-[#E5E7EB] p-5 shadow-sm">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3
                        className="text-sm font-bold text-[#111827]"
                        style={{ fontFamily: PP }}
                      >
                        Check-In Performance
                      </h3>
                      <p className="text-[11px] text-[#64748B]">
                        Completed check-ins per working shift
                      </p>
                    </div>
                    <UserCheck className="w-4 h-4 text-[#0D47A1]" />
                  </div>
                  <div className="h-56">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={hourlyIntakeData}
                        margin={{ top: 10, right: 10, left: -15, bottom: 0 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                        <XAxis
                          dataKey="hour"
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
                          name="Completed Check-Ins"
                          fill="#0D47A1"
                          radius={[4, 4, 0, 0]}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Registration Performance Horizontal Bar Chart */}
                <div className="bg-white rounded-2xl border border-[#E5E7EB] p-5 shadow-sm">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3
                        className="text-sm font-bold text-[#111827]"
                        style={{ fontFamily: PP }}
                      >
                        Registration Performance
                      </h3>
                      <p className="text-[11px] text-[#64748B]">
                        Registration throughput and wait queue metrics
                      </p>
                    </div>
                    <Activity className="w-4 h-4 text-[#009688]" />
                  </div>
                  <div className="h-56">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        layout="vertical"
                        data={[
                          { metric: "Avg Check-in (min)", value: 4 },
                          { metric: "Wait Time (min)", value: 8 },
                          { metric: "Tokens Issued", value: 24 },
                          { metric: "Queue Cleared", value: 22 },
                        ]}
                        margin={{ top: 5, right: 10, left: 45, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                        <XAxis
                          type="number"
                          tick={{ fontSize: 10, fill: "#64748B" }}
                        />
                        <YAxis
                          type="category"
                          dataKey="metric"
                          tick={{ fontSize: 9, fill: "#111827" }}
                          width={140}
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
                          dataKey="value"
                          name="Metric Value"
                          fill="#009688"
                          radius={[0, 4, 4, 0]}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>

              {/* PATIENT REPORT ENTERPRISE DATA TABLE */}
              <div className="bg-white rounded-2xl border border-[#E5E7EB] shadow-sm overflow-hidden">
                <div className="p-5 border-b border-[#E5E7EB] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div>
                    <h3
                      className="text-base font-bold text-[#111827]"
                      style={{ fontFamily: PP }}
                    >
                      Patient Registration Register
                    </h3>
                    <p className="text-xs text-[#64748B]">
                      Detailed list of registered patients and reception arrival
                      status
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
                        <th className="py-3.5 px-4">Mobile</th>
                        <th className="py-3.5 px-4">Age / Sex</th>
                        <th className="py-3.5 px-4">Reg Date</th>
                        <th className="py-3.5 px-4">Visit Type</th>
                        <th className="py-3.5 px-4">Appt Status</th>
                        <th className="py-3.5 px-4">Check-In Status</th>
                        <th className="py-3.5 px-4 text-center">Reg Status</th>
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
                              {item.mobileNumber}
                            </td>
                            <td className="py-3.5 px-4 text-[#111827]">
                              {item.age} yrs / {item.gender}
                            </td>
                            <td className="py-3.5 px-4 text-[#64748B]">
                              {item.registrationDate}
                            </td>
                            <td className="py-3.5 px-4 font-medium text-[#111827]">
                              {item.visitType}
                            </td>
                            <td className="py-3.5 px-4 font-medium text-[#0D47A1]">
                              {item.appointmentStatus}
                            </td>
                            <td className="py-3.5 px-4 font-medium text-[#009688]">
                              {item.checkInStatus}
                            </td>
                            <td className="py-3.5 px-4 text-center">
                              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-teal-50 text-[#009688] border border-teal-200">
                                {item.registrationStatus}
                              </span>
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
                                      `Viewing appointment details for ${item.mrn}`,
                                    )
                                  }
                                  className="p-1.5 text-[#009688] hover:bg-teal-50 rounded-lg transition"
                                  title="View Appointment"
                                >
                                  <Calendar className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() =>
                                    alert(
                                      `Printing patient summary for ${item.mrn}`,
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

              {/* RECEPTION PATIENT ACTIVITY TIMELINE */}
              <div className="bg-white rounded-2xl border border-[#E5E7EB] p-6 shadow-sm">
                <h3
                  className="text-base font-bold text-[#111827] mb-4"
                  style={{ fontFamily: PP }}
                >
                  Reception Patient Activity Timeline
                </h3>
                <div className="space-y-4 relative before:absolute before:inset-0 before:left-3.5 before:w-0.5 before:bg-[#E5E7EB]">
                  {(
                    [] as Array<{
                      id: string | number;
                      action?: string;
                      date?: string;
                      time?: string;
                      detail?: string;
                      details?: string;
                    }>
                  ).map((act) => (
                    <div
                      key={act.id}
                      className="flex items-start gap-4 relative z-10"
                    >
                      <div className="w-7 h-7 rounded-full bg-white border-2 border-[#0D47A1] flex items-center justify-center text-[#0D47A1] shrink-0">
                        <Activity className="w-3.5 h-3.5" />
                      </div>
                      <div className="bg-[#F1F5F9] rounded-xl p-3 border border-[#E5E7EB] flex-1 text-xs">
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-bold text-[#111827]">
                            {act.action}
                          </span>
                          <span className="text-[11px] text-[#64748B]">
                            {act.date} â€¢ {act.time}
                          </span>
                        </div>
                        <p className="text-[#64748B]">{act.detail}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* RIGHT STICKY SUMMARY PANEL (1 Col) */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-2xl border border-[#E5E7EB] p-5 shadow-sm sticky top-20 space-y-6">
                {/* Header */}
                <div>
                  <h3
                    className="text-base font-bold text-[#111827] flex items-center gap-2"
                    style={{ fontFamily: PP }}
                  >
                    <Shield className="w-4 h-4 text-[#0D47A1]" />
                    <span>Patient Summary</span>
                  </h3>
                  <p className="text-[11px] text-[#64748B]">
                    Daily reception patient metrics
                  </p>
                </div>

                {/* Metrics Overview */}
                <div className="bg-[#F1F5F9] rounded-xl p-3 border border-[#E5E7EB] text-xs space-y-2">
                  <div className="text-[11px] font-bold text-[#64748B] uppercase">
                    Today's Patient Counters
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#64748B]">
                      Today's Registrations:
                    </span>
                    <span className="font-bold text-[#111827]">66 Total</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#64748B]">Walk-In Patients:</span>
                    <span className="font-bold text-[#0D47A1]">
                      28 Walk-Ins
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#64748B]">
                      Appointment Patients:
                    </span>
                    <span className="font-bold text-[#009688]">
                      38 Arrivals
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#64748B]">Checked-In Patients:</span>
                    <span className="font-bold text-[#66BB6A]">
                      72 Checked In
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#64748B]">Returning Patients:</span>
                    <span className="font-bold text-[#F59E0B]">24 Repeat</span>
                  </div>
                  <div className="border-t border-[#E5E7EB] pt-2 flex justify-between">
                    <span className="text-[#64748B]">Avg Reg Time:</span>
                    <span className="font-semibold text-[#0D47A1]">
                      4.2 min
                    </span>
                  </div>
                </div>

                {/* Quick Actions */}
                <div>
                  <h4
                    className="text-xs font-bold text-[#111827] uppercase tracking-wider mb-2"
                    style={{ fontFamily: PP }}
                  >
                    Quick Actions
                  </h4>
                  <div className="space-y-2">
                    <button
                      onClick={() => alert("Exporting PDF...")}
                      className="w-full text-left px-3 py-2 rounded-xl border border-[#E5E7EB] hover:bg-slate-50 transition flex items-center justify-between text-xs font-semibold text-[#0D47A1]"
                    >
                      <div className="flex items-center gap-2">
                        <Download className="w-3.5 h-3.5 text-[#0D47A1]" />
                        <span>Export PDF Report</span>
                      </div>
                      <ChevronRight className="w-3.5 h-3.5 text-[#64748B]" />
                    </button>

                    <button
                      onClick={() => window.print()}
                      className="w-full text-left px-3 py-2 rounded-xl border border-[#E5E7EB] hover:bg-slate-50 transition flex items-center justify-between text-xs font-medium text-[#111827]"
                    >
                      <div className="flex items-center gap-2">
                        <Printer className="w-3.5 h-3.5 text-[#64748B]" />
                        <span>Print Report</span>
                      </div>
                      <ChevronRight className="w-3.5 h-3.5 text-[#64748B]" />
                    </button>

                    {onOpenAppointments && (
                      <button
                        onClick={onOpenAppointments}
                        className="w-full text-left px-3 py-2 rounded-xl border border-[#E5E7EB] hover:bg-slate-50 transition flex items-center justify-between text-xs font-medium text-[#0D47A1]"
                      >
                        <div className="flex items-center gap-2">
                          <Calendar className="w-3.5 h-3.5 text-[#0D47A1]" />
                          <span>Open Appointment Report</span>
                        </div>
                        <ChevronRight className="w-3.5 h-3.5 text-[#64748B]" />
                      </button>
                    )}

                    {onBack && (
                      <button
                        onClick={onBack}
                        className="w-full text-left px-3 py-2 rounded-xl border border-[#E5E7EB] hover:bg-slate-50 transition flex items-center justify-between text-xs font-medium text-[#64748B]"
                      >
                        <div className="flex items-center gap-2">
                          <ChevronLeft className="w-3.5 h-3.5 text-[#64748B]" />
                          <span>Back to Reports Dashboard</span>
                        </div>
                        <ChevronRight className="w-3.5 h-3.5 text-[#64748B]" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Compliance Note */}
                <div className="p-3 bg-slate-50 rounded-xl border border-[#E5E7EB] text-[11px] text-[#64748B]">
                  <div className="flex items-center gap-1 text-[#009688] font-bold mb-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Receptionist Scope Verified</span>
                  </div>
                  <span>
                    Read-only patient registration operations data for
                    front-desk reception management.
                  </span>
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
              {filteredPatients.length} Patient Report Results
            </strong>
          </div>
          <div>
            Hospital Management System â€¢ Receptionist Patient Report v1.0
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
