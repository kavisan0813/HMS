import React, { useState, useMemo, useTransition } from "react";
import {
  Download,
  RefreshCw,
  Filter,
  Search,
  ChevronRight,
  Activity,
  TrendingUp,
  CheckCircle2,
  XCircle,
  Clock,
  PieChart as PieChartIcon,
  Printer,
  ChevronLeft,
  ChevronRight as ChevronRightIcon,
  AlertCircle,
  FileSpreadsheet,
  DollarSign,
  CreditCard,
  BarChartIcon,
  ArrowLeft,
} from "lucide-react";
import { useAccountantRefundLog } from "../hooks/useReports";

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

import { useDailyRevenueDetails, extractList } from "../hooks/useReports";
import { exportDataToCsv } from "../utils/export.utils";
import type { DailyRevenueDetail } from "../types/reports.types";

function AccountantRevenueReportScreen({
  onBack,
}: {
  onBack?: () => void;
  onOpenBillingReport?: () => void;
}) {
  const [searchQuery, setSearchQuery] = useState("");
  const [dateRange, setDateRange] = useState("Today");
  const [paymentStatusFilter, setPaymentStatusFilter] = useState(
    "All Payment Statuses",
  );
  const [paymentMethodFilter, setPaymentMethodFilter] = useState(
    "All Payment Methods",
  );
  const [invoiceStatusFilter, setInvoiceStatusFilter] = useState(
    "All Invoice Statuses",
  );
  const [collectedByFilter, setCollectedByFilter] = useState("All Collectors");

  const [trendRange, setTrendRange] = useState<
    "Today" | "7 Days" | "30 Days" | "90 Days"
  >("7 Days");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [showLoadingDemo, setShowLoadingDemo] = useState(false);
  const isLoading = isPending || showLoadingDemo;
  const [hasError, setHasError] = useState(false);

  const today = new Date().toISOString().slice(0, 10);
  const { data: rawRevenueDetails, refetch: refetchRevenue } =
    useDailyRevenueDetails({ fromDate: "2025-01-01", toDate: today });
  const revDetailsList = useMemo(
    () => extractList<DailyRevenueDetail>(rawRevenueDetails),
    [rawRevenueDetails],
  );
  const { refetch: refetchRefunds } = useAccountantRefundLog();

  const revenueRowsSource = useMemo(() => {
    const list = revDetailsList.map((d) => ({
      patientName: d.patientName || "N/A",
      mrn: d.mrn
        ? String(d.mrn).startsWith("MRN-")
          ? String(d.mrn)
          : `MRN-${d.mrn}`
        : `MRN-${d.patientId || ""}`,
      invoiceId: d.paymentId || d.receiptNumber || `INV-${d.id || ""}`,
      paymentStatus: d.paymentStatus || "Paid",
      paymentMethod: d.paymentMethod || "Cash",
      doctorName: d.doctorName || "Dr. sarath",
      department: d.department || "General Medicine",
      date: d.paidAt || today,
      invoiceDate: d.paidAt || today,
      paymentTime: "10:30 AM",
      invoiceAmount: Number(d.amount || d.billedAmount || 1500),
      amountPaid: Number(d.paidAmount || d.amount || 1500),
      outstandingAmount: Number(d.outstandingAmount || 0),
      collectedBy: "Accountant Desk",
    }));
    if (list.length === 0) {
      return [
        {
          patientName: "Kavisan R",
          mrn: "MRN-1001",
          invoiceId: "INV-2026-001",
          paymentStatus: "Paid",
          paymentMethod: "UPI",
          doctorName: "Dr. sarath",
          department: "EYE DEPT",
          date: today,
          invoiceDate: today,
          paymentTime: "10:30 AM",
          invoiceAmount: 1500,
          amountPaid: 1500,
          outstandingAmount: 0,
          collectedBy: "Accountant Desk",
        },
        {
          patientName: "Pradeep Kumar",
          mrn: "MRN-1002",
          invoiceId: "INV-2026-002",
          paymentStatus: "Paid",
          paymentMethod: "Cash",
          doctorName: "Dr. pradeep",
          department: "General Medicine",
          date: today,
          invoiceDate: today,
          paymentTime: "11:15 AM",
          invoiceAmount: 2200,
          amountPaid: 2200,
          outstandingAmount: 0,
          collectedBy: "Accountant Desk",
        },
      ];
    }
    return list;
  }, [revDetailsList, today]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    refetchRevenue();
    refetchRefunds();
    setTimeout(() => setIsRefreshing(false), 600);
  };

  const handleExportAllCsv = () => {
    const recordsToExport = (
      filteredRevenueRows.length > 0 ? filteredRevenueRows : revenueRowsSource
    ).map((rec) => ({
      Section: "ACCOUNTANT DAILY REVENUE REPORT",
      "Invoice ID": rec.invoiceId || "N/A",
      "Patient Name": rec.patientName || "N/A",
      MRN: rec.mrn || "N/A",
      Department: rec.department || "General Medicine",
      "Billed Amount (INR)": rec.invoiceAmount || 0,
      "Paid Amount (INR)": rec.amountPaid || 0,
      "Outstanding (INR)": rec.outstandingAmount || 0,
      "Payment Method": rec.paymentMethod || "Cash",
      "Payment Status": rec.paymentStatus || "Paid",
      "Collected By": rec.collectedBy || "Accountant Desk",
      Date: rec.invoiceDate || today,
    }));

    exportDataToCsv(
      `Accountant_Daily_Revenue_Report_All_Data_${new Date().toISOString().slice(0, 10)}.csv`,
      recordsToExport,
    );
  };

  const handleResetFilters = () => {
    setSearchQuery("");
    setDateRange("Today");
    setPaymentStatusFilter("All Payment Statuses");
    setPaymentMethodFilter("All Payment Methods");
    setInvoiceStatusFilter("All Invoice Statuses");
    setCollectedByFilter("All Collectors");
  };

  const filteredRevenueRows = revenueRowsSource.filter((item) => {
    const matchesSearch =
      item.patientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.mrn.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.invoiceId.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus =
      paymentStatusFilter === "All Payment Statuses" ||
      item.paymentStatus.toLowerCase() === paymentStatusFilter.toLowerCase();
    const matchesMethod =
      paymentMethodFilter === "All Payment Methods" ||
      item.paymentMethod.toLowerCase() === paymentMethodFilter.toLowerCase();
    return matchesSearch && matchesStatus && matchesMethod;
  });

  const trendData = useMemo(() => {
    const daysCount =
      trendRange === "Today"
        ? 1
        : trendRange === "7 Days"
          ? 7
          : trendRange === "30 Days"
            ? 30
            : 90;
    const result = [];
    for (let i = daysCount - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      });
      const rev = Math.max(50000, 150000 + ((i * 12345) % 50000));
      result.push({
        date: dateStr,
        revenue: rev,
        collections: Math.round(rev * 0.95),
      });
    }
    return result;
  }, [trendRange]);

  const paymentMethodData = useMemo(() => {
    const map: Record<string, number> = {};
    filteredRevenueRows.forEach((r) => {
      map[r.paymentMethod] = (map[r.paymentMethod] || 0) + r.amountPaid;
    });
    const colors: Record<string, string> = {
      Cash: "#009688",
      Card: "#0D47A1",
      UPI: "#66BB6A",
      "Bank Transfer": "#F59E0B",
    };
    const list = Object.entries(map).map(([name, value]) => ({
      name,
      value,
      color: colors[name] || "#0D47A1",
    }));
    if (list.length === 0) {
      return [
        { name: "UPI", value: 125000, color: "#66BB6A" },
        { name: "Cash", value: 85000, color: "#009688" },
        { name: "Card", value: 45000, color: "#0D47A1" },
      ];
    }
    return list;
  }, [filteredRevenueRows]);

  const hourlyCollectionData = useMemo(() => {
    return [
      { hour: "09 AM", amount: 25000 },
      { hour: "11 AM", amount: 68000 },
      { hour: "01 PM", amount: 42000 },
      { hour: "03 PM", amount: 85000 },
      { hour: "05 PM", amount: 31000 },
    ];
  }, []);

  const revenueComparisonData = useMemo(() => {
    return [
      { period: "Today", revenue: 251000 },
      { period: "Yesterday", revenue: 218000 },
      { period: "7-Day Avg", revenue: 235000 },
    ];
  }, []);

  return (
    <div
      className="min-h-screen bg-[#F1F5F9] text-[#111827] pb-12"
      style={{ fontFamily: RB }}
    >
      {/* Top Header Section */}
      <div className="bg-white border-b border-[#E5E7EB] sticky top-0 z-20 shadow-sm">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <nav className="flex items-center gap-1.5 text-xs text-[#64748B] mb-1">
                <button
                  type="button"
                  onClick={onBack}
                  className="hover:text-[#0D47A1] cursor-pointer"
                >
                  Accountant
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
                  Daily Revenue Report
                </span>
              </nav>
              <div className="flex items-center gap-3">
                <h1
                  className="text-2xl font-bold text-[#111827]"
                  style={{ fontFamily: PP }}
                >
                  Daily Revenue Report
                </h1>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#0D47A1]/10 text-[#0D47A1] border border-blue-200">
                  Accountant Scoped
                </span>
              </div>
              <p className="text-xs text-[#64748B] mt-0.5">
                Monitor daily revenue, payment collections and billing
                performance.
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
                onClick={() => alert("Exporting Daily Revenue Report (PDF)...")}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-medium text-white bg-[#0D47A1] hover:bg-blue-900 transition shadow-sm"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export PDF</span>
              </button>

              <button
                onClick={() =>
                  alert("Exporting Daily Revenue Report (Excel)...")
                }
                className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-medium text-[#009688] bg-teal-50 border border-teal-200 hover:bg-teal-100 transition shadow-sm"
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
                <span>Export Excel</span>
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
              <span>Filter Daily Revenue Data</span>
            </div>
            <span className="text-[11px] text-[#64748B] bg-slate-100 px-2.5 py-0.5 rounded-full font-semibold">
              Accountant Role Scoped
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
                Payment Status
                <select
                  aria-label="Select option"
                  value={paymentStatusFilter}
                  onChange={(e) => setPaymentStatusFilter(e.target.value)}
                  className="w-full bg-[#F1F5F9] border border-[#E5E7EB] rounded-xl text-xs px-2.5 py-2 text-[#111827] focus:outline-none focus:ring-2 focus:ring-[#0D47A1]"
                >
                  <option>All Payment Statuses</option>
                  <option>Paid</option>
                  <option>Pending</option>
                  <option>Partially Paid</option>
                  <option>Cancelled</option>
                  <option>Refunded</option>
                </select>
              </span>
            </div>

            <div>
              <span className="block text-[11px] font-medium text-[#64748B] mb-1">
                Payment Method
                <select
                  aria-label="Select option"
                  value={paymentMethodFilter}
                  onChange={(e) => setPaymentMethodFilter(e.target.value)}
                  className="w-full bg-[#F1F5F9] border border-[#E5E7EB] rounded-xl text-xs px-2.5 py-2 text-[#111827] focus:outline-none focus:ring-2 focus:ring-[#0D47A1]"
                >
                  <option>All Payment Methods</option>
                  <option>Cash</option>
                  <option>Card</option>
                  <option>UPI</option>
                  <option>Bank Transfer</option>
                </select>
              </span>
            </div>

            <div>
              <span className="block text-[11px] font-medium text-[#64748B] mb-1">
                Invoice Status
                <select
                  aria-label="Select option"
                  value={invoiceStatusFilter}
                  onChange={(e) => setInvoiceStatusFilter(e.target.value)}
                  className="w-full bg-[#F1F5F9] border border-[#E5E7EB] rounded-xl text-xs px-2.5 py-2 text-[#111827] focus:outline-none focus:ring-2 focus:ring-[#0D47A1]"
                >
                  <option>All Invoice Statuses</option>
                  <option>Issued</option>
                  <option>Cleared</option>
                  <option>Overdue</option>
                </select>
              </span>
            </div>

            <div>
              <span className="block text-[11px] font-medium text-[#64748B] mb-1">
                Collected By
                <select
                  aria-label="Select option"
                  value={collectedByFilter}
                  onChange={(e) => setCollectedByFilter(e.target.value)}
                  className="w-full bg-[#F1F5F9] border border-[#E5E7EB] rounded-xl text-xs px-2.5 py-2 text-[#111827] focus:outline-none focus:ring-2 focus:ring-[#0D47A1]"
                >
                  <option>All Collectors</option>
                  <option>Robert Vance</option>
                  <option>Elena Rostova</option>
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
                placeholder="Search Invoice ID, Patient Name, MRN, Payment Reference..."
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
            Simulate Daily Revenue report state
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
              Unable to Load Daily Revenue Report
            </h3>
            <p className="text-xs text-[#64748B] mt-1 max-w-md mx-auto">
              Connection error while loading revenue collections data. Please
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
          <div className="w-full space-y-6">
            {/* TOP 6 ACCOUNTANT REVENUE KPI CARDS */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
              {/* Card 1: Today's Revenue */}
              <div className="bg-white rounded-2xl border border-[#E5E7EB] p-4 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-[#64748B]">
                    Today's Revenue
                  </span>
                  <div className="p-2 rounded-xl bg-blue-50 text-[#0D47A1]">
                    <DollarSign className="w-4 h-4" />
                  </div>
                </div>
                <div
                  className="text-2xl font-bold text-[#111827] mb-1"
                  style={{ fontFamily: PP }}
                >
                  {"--"}
                </div>
                <div className="flex items-center gap-2 text-[11px] text-[#64748B] mb-3">
                  <span className="text-[#64748B] font-semibold flex items-center gap-0.5">
                    <TrendingUp className="w-3 h-3" /> {"--"}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-1 pt-2 border-t border-[#E5E7EB] text-[11px] text-center">
                  <div>
                    <div className="text-[#0D47A1] font-bold">{"--"}</div>
                    <div className="text-[#64748B]">Today Total</div>
                  </div>
                  <div>
                    <div className="text-[#009688] font-bold">{"--"}</div>
                    <div className="text-[#64748B]">Growth</div>
                  </div>
                </div>
              </div>

              {/* Card 2: Collected Amount */}
              <div className="bg-white rounded-2xl border border-[#E5E7EB] p-4 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-[#64748B]">
                    Collected Amount
                  </span>
                  <div className="p-2 rounded-xl bg-teal-50 text-[#009688]">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                </div>
                <div
                  className="text-2xl font-bold text-[#111827] mb-1"
                  style={{ fontFamily: PP }}
                >
                  {"--"}
                </div>
                <div className="flex items-center gap-2 text-[11px] text-[#64748B] mb-3">
                  <span className="text-[#009688] font-semibold">{"--"}</span>
                </div>
                <div className="grid grid-cols-2 gap-1 pt-2 border-t border-[#E5E7EB] text-[11px] text-center">
                  <div>
                    <div className="text-[#009688] font-bold">{"--"}</div>
                    <div className="text-[#64748B]">Collected</div>
                  </div>
                  <div>
                    <div className="text-[#0D47A1] font-bold">{"--"}</div>
                    <div className="text-[#64748B]">Rate</div>
                  </div>
                </div>
              </div>

              {/* Card 3: Outstanding Payments */}
              <div className="bg-white rounded-2xl border border-[#E5E7EB] p-4 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-[#64748B]">
                    Outstanding Payments
                  </span>
                  <div className="p-2 rounded-xl bg-amber-50 text-[#F59E0B]">
                    <Activity className="w-4 h-4" />
                  </div>
                </div>
                <div
                  className="text-2xl font-bold text-[#111827] mb-1"
                  style={{ fontFamily: PP }}
                >
                  {"--"}
                </div>
                <div className="flex items-center gap-2 text-[11px] text-[#64748B] mb-3">
                  <span className="text-[#F59E0B] font-semibold">{"--"}</span>
                </div>
                <div className="grid grid-cols-2 gap-1 pt-2 border-t border-[#E5E7EB] text-[11px] text-center">
                  <div>
                    <div className="text-[#F59E0B] font-bold">{"--"}</div>
                    <div className="text-[#64748B]">Outstanding</div>
                  </div>
                  <div>
                    <div className="text-[#0D47A1] font-bold">{"--"}</div>
                    <div className="text-[#64748B]">Invoices</div>
                  </div>
                </div>
              </div>

              {/* Card 4: Paid Invoices */}
              <div className="bg-white rounded-2xl border border-[#E5E7EB] p-4 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-[#64748B]">
                    Paid Invoices
                  </span>
                  <div className="p-2 rounded-xl bg-emerald-50 text-[#66BB6A]">
                    <CreditCard className="w-4 h-4" />
                  </div>
                </div>
                <div
                  className="text-2xl font-bold text-[#111827] mb-1"
                  style={{ fontFamily: PP }}
                >
                  {"--"}
                </div>
                <div className="flex items-center gap-2 text-[11px] text-[#64748B] mb-3">
                  <span className="text-[#66BB6A] font-semibold">{"--"}</span>
                </div>
                <div className="grid grid-cols-2 gap-1 pt-2 border-t border-[#E5E7EB] text-[11px] text-center">
                  <div>
                    <div className="text-[#66BB6A] font-bold">{"--"}</div>
                    <div className="text-[#64748B]">Paid Invoices</div>
                  </div>
                  <div>
                    <div className="text-[#0D47A1] font-bold">{"--"}</div>
                    <div className="text-[#64748B]">Rate</div>
                  </div>
                </div>
              </div>

              {/* Card 5: Refunded Amount */}
              <div className="bg-white rounded-2xl border border-[#E5E7EB] p-4 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-[#64748B]">
                    Refunded Amount
                  </span>
                  <div className="p-2 rounded-xl bg-red-50 text-[#EF4444]">
                    <XCircle className="w-4 h-4" />
                  </div>
                </div>
                <div
                  className="text-2xl font-bold text-[#111827] mb-1"
                  style={{ fontFamily: PP }}
                >
                  {"--"}
                </div>
                <div className="flex items-center gap-2 text-[11px] text-[#64748B] mb-3">
                  <span className="text-[#EF4444] font-semibold">{"--"}</span>
                </div>
                <div className="grid grid-cols-2 gap-1 pt-2 border-t border-[#E5E7EB] text-[11px] text-center">
                  <div>
                    <div className="text-[#EF4444] font-bold">{"--"}</div>
                    <div className="text-[#64748B]">Count</div>
                  </div>
                  <div>
                    <div className="text-[#64748B] font-bold">{"--"}</div>
                    <div className="text-[#64748B]">Refunded</div>
                  </div>
                </div>
              </div>

              {/* Card 6: Average Invoice Value */}
              <div className="bg-white rounded-2xl border border-[#E5E7EB] p-4 shadow-sm hover:shadow-md transition-shadow flex items-center justify-between">
                <div>
                  <span className="text-xs font-semibold text-[#64748B]">
                    Average Invoice Value
                  </span>
                  <div
                    className="text-2xl font-bold text-[#111827] mt-1"
                    style={{ fontFamily: PP }}
                  >
                    {"--"}
                  </div>
                  <p className="text-[11px] text-[#64748B] mt-1">{"--"}</p>
                  <div className="mt-2 text-[11px] font-semibold text-[#64748B]">
                    {"--"}
                  </div>
                </div>
                <CircularProgress percentage={0} size={64} strokeWidth={7} />
              </div>
            </div>

            {/* DAILY REVENUE TREND & PAYMENT METHOD BREAKDOWN CHARTS */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Daily Revenue Trend Area Chart */}
              <div className="bg-white rounded-2xl border border-[#E5E7EB] p-5 shadow-sm">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-4">
                  <div>
                    <h3
                      className="text-sm font-bold text-[#111827]"
                      style={{ fontFamily: PP }}
                    >
                      Daily Revenue Trend
                    </h3>
                    <p className="text-[11px] text-[#64748B]">
                      Revenue vs collections vs outstanding
                    </p>
                  </div>

                  <div className="flex items-center gap-1 bg-[#F1F5F9] p-1 rounded-xl border border-[#E5E7EB] text-[10px]">
                    {(["Today", "7 Days", "30 Days", "90 Days"] as const).map(
                      (r) => (
                        <button
                          key={r}
                          onClick={() => setTrendRange(r)}
                          className={`px-2 py-0.5 rounded-lg font-medium transition ${trendRange === r ? "bg-[#0D47A1] text-white shadow-sm" : "text-[#64748B]"}`}
                        >
                          {r}
                        </button>
                      ),
                    )}
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
                          id="accDailyRevGrad"
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
                          id="accDailyCollGrad"
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
                        dataKey="revenue"
                        name="Revenue ($)"
                        stroke="#0D47A1"
                        fillOpacity={1}
                        fill="url(#accDailyRevGrad)"
                      />
                      <Area
                        type="monotone"
                        dataKey="collections"
                        name="Collections ($)"
                        stroke="#66BB6A"
                        fillOpacity={1}
                        fill="url(#accDailyCollGrad)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Payment Method Breakdown Donut Chart */}
              <div className="bg-white rounded-2xl border border-[#E5E7EB] p-5 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3
                      className="text-sm font-bold text-[#111827]"
                      style={{ fontFamily: PP }}
                    >
                      Payment Method Breakdown
                    </h3>
                    <p className="text-[11px] text-[#64748B]">
                      Revenue distribution by payment mode
                    </p>
                  </div>
                  <PieChartIcon className="w-4 h-4 text-[#009688]" />
                </div>
                <div className="h-60">
                  <ResponsiveContainer width="100%" height="100%">
                    <RechartsPie>
                      <Pie
                        data={paymentMethodData}
                        cx="50%"
                        cy="50%"
                        innerRadius={45}
                        outerRadius={75}
                        paddingAngle={3}
                        dataKey="value"
                      >
                        {paymentMethodData.map(
                          (entry: { name?: string; color: string }) => (
                            <Cell key={entry.name} fill={entry.color} />
                          ),
                        )}
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

            {/* HOURLY COLLECTION ANALYSIS & REVENUE COMPARISON CHARTS */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Hourly Collection Analysis Vertical Bar Chart */}
              <div className="bg-white rounded-2xl border border-[#E5E7EB] p-5 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3
                      className="text-sm font-bold text-[#111827]"
                      style={{ fontFamily: PP }}
                    >
                      Hourly Collection Analysis
                    </h3>
                    <p className="text-[11px] text-[#64748B]">
                      Collections broken down by hour of day
                    </p>
                  </div>
                  <Clock className="w-4 h-4 text-[#0D47A1]" />
                </div>
                <div className="h-56">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={hourlyCollectionData}
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
                        dataKey="amount"
                        name="Amount Collected ($)"
                        fill="#0D47A1"
                        radius={[4, 4, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Revenue Comparison Grouped Bar Chart */}
              <div className="bg-white rounded-2xl border border-[#E5E7EB] p-5 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3
                      className="text-sm font-bold text-[#111827]"
                      style={{ fontFamily: PP }}
                    >
                      Revenue Comparison
                    </h3>
                    <p className="text-[11px] text-[#64748B]">
                      Today vs Yesterday vs 7-Day Average
                    </p>
                  </div>
                  <BarChartIcon className="w-4 h-4 text-[#009688]" />
                </div>
                <div className="h-56">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={revenueComparisonData}
                      margin={{ top: 10, right: 10, left: -15, bottom: 0 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                      <XAxis
                        dataKey="period"
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
                        dataKey="revenue"
                        name="Revenue ($)"
                        fill="#0D47A1"
                        radius={[4, 4, 0, 0]}
                      />
                      <Bar
                        dataKey="collection"
                        name="Collections ($)"
                        fill="#009688"
                        radius={[4, 4, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* DAILY REVENUE DATA TABLE */}
            <div className="bg-white rounded-2xl border border-[#E5E7EB] shadow-sm overflow-hidden">
              <div className="p-5 border-b border-[#E5E7EB] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                  <h3
                    className="text-base font-bold text-[#111827]"
                    style={{ fontFamily: PP }}
                  >
                    Daily Revenue Data Ledger
                  </h3>
                  <p className="text-xs text-[#64748B]">
                    Detailed log of invoice payments and collection amounts
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() =>
                      alert("Exporting Daily Revenue Ledger (Excel)...")
                    }
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-teal-50 border border-teal-200 text-xs font-semibold text-[#009688] rounded-xl hover:bg-teal-100 transition"
                  >
                    <FileSpreadsheet className="w-3.5 h-3.5" />
                    <span>Export Excel</span>
                  </button>
                  <button
                    onClick={() =>
                      alert("Exporting Daily Revenue Ledger (CSV)...")
                    }
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 border border-[#E5E7EB] text-xs font-semibold text-[#111827] rounded-xl hover:bg-slate-100 transition"
                  >
                    <Download className="w-3.5 h-3.5 text-[#0D47A1]" />
                    <span>Export CSV</span>
                  </button>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-[#F1F5F9] text-[11px] font-bold text-[#64748B] uppercase tracking-wider border-b border-[#E5E7EB]">
                      <th className="py-3.5 px-4">Invoice ID</th>
                      <th className="py-3.5 px-4">Patient Name</th>
                      <th className="py-3.5 px-4">MRN</th>
                      <th className="py-3.5 px-4">Invoice Date</th>
                      <th className="py-3.5 px-4">Payment Time</th>
                      <th className="py-3.5 px-4 text-right">Invoice Amount</th>
                      <th className="py-3.5 px-4 text-right">Amount Paid</th>
                      <th className="py-3.5 px-4 text-right">Outstanding</th>
                      <th className="py-3.5 px-4">Method</th>
                      <th className="py-3.5 px-4 text-center">Status</th>
                      <th className="py-3.5 px-4">Collected By</th>
                      <th className="py-3.5 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E5E7EB] text-xs">
                    {filteredRevenueRows.length === 0 ? (
                      <tr>
                        <td
                          colSpan={12}
                          className="py-8 text-center text-[#64748B]"
                        >
                          No revenue records match your search or filter
                          criteria.
                        </td>
                      </tr>
                    ) : (
                      filteredRevenueRows.map((item) => (
                        <tr
                          key={item.invoiceId}
                          className="hover:bg-slate-50 transition-colors"
                        >
                          <td className="py-3.5 px-4 font-mono font-bold text-[#0D47A1]">
                            {item.invoiceId}
                          </td>
                          <td className="py-3.5 px-4 font-bold text-[#111827]">
                            {item.patientName}
                          </td>
                          <td className="py-3.5 px-4 font-semibold text-[#0D47A1]">
                            {item.mrn}
                          </td>
                          <td className="py-3.5 px-4 text-[#64748B]">
                            {item.invoiceDate}
                          </td>
                          <td className="py-3.5 px-4 text-[#64748B]">
                            {item.paymentTime}
                          </td>
                          <td className="py-3.5 px-4 text-right font-bold text-[#111827]">
                            ${(item.invoiceAmount ?? 0).toFixed(2)}
                          </td>
                          <td className="py-3.5 px-4 text-right font-bold text-[#66BB6A]">
                            ${(item.amountPaid ?? 0).toFixed(2)}
                          </td>
                          <td className="py-3.5 px-4 text-right font-bold text-[#EF4444]">
                            ${(item.outstandingAmount ?? 0).toFixed(2)}
                          </td>
                          <td className="py-3.5 px-4 font-medium text-[#111827]">
                            {item.paymentMethod}
                          </td>
                          <td className="py-3.5 px-4 text-center">
                            <span
                              className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${item.paymentStatus === "Paid" ? "bg-teal-50 text-[#009688] border border-teal-200" : item.paymentStatus === "Partially Paid" ? "bg-blue-50 text-[#0D47A1] border border-blue-200" : item.paymentStatus === "Refunded" ? "bg-red-50 text-[#EF4444] border border-red-200" : "bg-amber-50 text-[#F59E0B] border border-amber-200"}`}
                            >
                              {item.paymentStatus}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-[#64748B]">
                            {item.collectedBy}
                          </td>
                          <td className="py-3.5 px-4 text-right">
                            <div className="flex items-center justify-end gap-1">
                              <button
                                onClick={() =>
                                  alert(`Viewing invoice ${item.invoiceId}`)
                                }
                                className="p-1.5 text-[#0D47A1] hover:bg-blue-50 rounded-lg transition"
                                title="View Invoice"
                              >
                                <CreditCard className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() =>
                                  alert(
                                    `Printing receipt for ${item.invoiceId}`,
                                  )
                                }
                                className="p-1.5 text-[#009688] hover:bg-teal-50 rounded-lg transition"
                                title="Print Invoice"
                              >
                                <Printer className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() =>
                                  alert(`Downloading PDF for ${item.invoiceId}`)
                                }
                                className="p-1.5 text-[#64748B] hover:bg-slate-100 rounded-lg transition"
                                title="Download PDF"
                              >
                                <Download className="w-4 h-4" />
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
                  Showing 1 to {filteredRevenueRows.length} of{" "}
                  {filteredRevenueRows.length} entries
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

            {/* FINANCIAL ACTIVITY TIMELINE */}
            <div className="bg-white rounded-2xl border border-[#E5E7EB] p-6 shadow-sm">
              <h3
                className="text-base font-bold text-[#111827] mb-4"
                style={{ fontFamily: PP }}
              >
                Recent Revenue Activity Logs
              </h3>
              <div className="space-y-4 relative before:absolute before:inset-0 before:left-3.5 before:w-0.5 before:bg-[#E5E7EB]">
                {(
                  [] as Array<{
                    id: string;
                    title: string;
                    time: string;
                    action?: string;
                    date?: string;
                    detail?: string;
                  }>
                ).map((act) => (
                  <div
                    key={act.id}
                    className="flex items-start gap-4 relative z-10"
                  >
                    <div className="w-7 h-7 rounded-full bg-white border-2 border-[#0D47A1] flex items-center justify-center text-[#0D47A1] shrink-0">
                      <DollarSign className="w-3.5 h-3.5" />
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
        )}

        {/* FOOTER */}
        <div className="mt-8 pt-4 border-t border-[#E5E7EB] flex flex-col sm:flex-row items-center justify-between text-xs text-[#64748B] gap-2">
          <div>
            Showing{" "}
            <strong className="text-[#111827]">
              {filteredRevenueRows.length} Revenue Report Results
            </strong>
          </div>
          <div>
            Hospital Management System â€¢ Accountant Daily Revenue Report v1.0
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

// â”€â”€â”€ ACCOUNTANT BILLING REPORT SCREEN (ACCOUNTANT RBAC VERSION) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export { AccountantRevenueReportScreen as AccountantDailyRevenueReportScreen };
