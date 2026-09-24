import { useState, useTransition } from "react";
import {
  Download,
  RefreshCw,
  Filter,
  Search,
  ChevronRight,
  Activity,
  TrendingUp,
  CheckCircle2,
  Clock,
  PieChart as PieChartIcon,
  Printer,
  ChevronLeft,
  AlertCircle,
  Shield,
  CreditCard,
  FileSpreadsheet,
  BarChartIcon,
  DollarSign,
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

interface AccountantKpiMeta {
  title?: string;
  description?: string;
  currentValue?: string;
  unit?: string;
  yesterdayComp?: string;
  growthPercent?: string;
  monthlyComp?: string;
  isPositive?: boolean;
}

export type AccountantKpiType =
  | "Today's Revenue"
  | "Today's Invoices"
  | "Paid Bills"
  | "Pending Payments"
  | "Outstanding Amount"
  | "Refunded Bills"
  | "Payment Collection Rate"
  | "Average Invoice Value";

const ACCOUNTANT_KPI_TREND_DATA: Array<{ date: string; value: number }> = [];
const ACCOUNTANT_KPI_DONUT_DATA: Array<{
  name: string;
  value: number;
  color: string;
}> = [];

export function AccountantDashboardKpiDetailScreen({
  onBack,
  onOpenReport,
}: {
  onBack?: () => void;
  onOpenReport?: (view: string) => void;
}) {
  const [selectedKpi, setSelectedKpi] =
    useState<AccountantKpiType>("Today's Revenue");
  const [searchQuery, setSearchQuery] = useState("");
  const [dateRange, setDateRange] = useState("Today");
  const [invoiceStatusFilter, setInvoiceStatusFilter] = useState(
    "All Invoice Statuses",
  );
  const [paymentStatusFilter, setPaymentStatusFilter] = useState(
    "All Payment Statuses",
  );
  const [paymentMethodFilter, setPaymentMethodFilter] = useState(
    "All Payment Methods",
  );
  const [collectedByFilter, setCollectedByFilter] = useState("All Collectors");

  const [trendRange, setTrendRange] = useState<
    "Today" | "7 Days" | "30 Days" | "90 Days" | "1 Year"
  >("7 Days");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [showLoadingDemo, setShowLoadingDemo] = useState(false);
  const isLoading = isPending || showLoadingDemo;
  const [hasError, setHasError] = useState(false);

  const meta: AccountantKpiMeta =
    ({} as Record<string, AccountantKpiMeta>)[selectedKpi] ?? {};
  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => setIsRefreshing(false), 600);
  };

  const handleResetFilters = () => {
    setSearchQuery("");
    setDateRange("Today");
    setInvoiceStatusFilter("All Invoice Statuses");
    setPaymentStatusFilter("All Payment Statuses");
    setPaymentMethodFilter("All Payment Methods");
    setCollectedByFilter("All Collectors");
  };

  return (
    <div
      className="min-h-screen bg-[#F1F5F9] text-[#111827] pb-12"
      style={{ fontFamily: RB }}
    >
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
                  Accountant Scoped
                </span>
              </div>
              <p className="text-xs text-[#64748B] mt-0.5">
                View detailed financial analytics for the selected KPI.
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
                onClick={() =>
                  alert(`Exporting ${selectedKpi} Detail (PDF)...`)
                }
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-medium text-white bg-[#0D47A1] hover:bg-blue-900 transition shadow-sm"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export PDF</span>
              </button>

              <button
                onClick={() =>
                  alert(`Exporting ${selectedKpi} Detail (Excel)...`)
                }
                className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-medium text-[#009688] bg-teal-50 border border-teal-200 hover:bg-teal-100 transition shadow-sm"
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
                <span>Export Excel</span>
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

      {/* Main Container */}
      <div className="w-full max-w-none px-4 sm:px-6 lg:px-8 xl:px-10 mt-6">
        {/* SELECTED KPI LARGE HIGHLIGHT CARD & SWITCHER */}
        <div className="bg-white rounded-2xl border border-[#E5E7EB] p-6 shadow-sm mb-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-[#E5E7EB] pb-4 mb-4">
            <div>
              <div className="flex items-center gap-2 text-xs font-semibold text-[#64748B] mb-1">
                <span>Select Financial KPI Metric:</span>
              </div>
              <select
                aria-label="Select option"
                value={selectedKpi}
                onChange={(e) =>
                  setSelectedKpi(e.target.value as AccountantKpiType)
                }
                className="bg-[#F1F5F9] border border-[#0D47A1] rounded-xl text-sm font-bold text-[#0D47A1] px-3.5 py-2 focus:outline-none focus:ring-2 focus:ring-[#0D47A1]"
                style={{ fontFamily: PP }}
              >
                <option value="Today's Revenue">Today's Revenue</option>
                <option value="Today's Invoices">Today's Invoices</option>
                <option value="Paid Bills">Paid Bills</option>
                <option value="Pending Payments">Pending Payments</option>
                <option value="Outstanding Amount">Outstanding Amount</option>
                <option value="Refunded Bills">Refunded Bills</option>
                <option value="Payment Collection Rate">
                  Payment Collection Rate
                </option>
                <option value="Average Invoice Value">
                  Average Invoice Value
                </option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-[#64748B]">KPI Status:</span>
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-teal-50 text-[#009688] border border-teal-200">
                âœ“ Financial Target Met
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div>
              <span className="text-xs font-semibold text-[#64748B]">
                Selected KPI Metric
              </span>
              <h2
                className="text-xl font-bold text-[#111827] mt-0.5"
                style={{ fontFamily: PP }}
              >
                {meta.title}
              </h2>
              <p className="text-xs text-[#64748B] mt-1">{meta.description}</p>
            </div>

            <div>
              <span className="text-xs font-semibold text-[#64748B]">
                Current Value
              </span>
              <div
                className="text-3xl font-extrabold text-[#0D47A1] mt-0.5"
                style={{ fontFamily: PP }}
              >
                {meta.currentValue}
              </div>
              <span className="text-[11px] text-[#64748B]">
                Unit: {meta.unit}
              </span>
            </div>

            <div>
              <span className="text-xs font-semibold text-[#64748B]">
                Yesterday Comparison
              </span>
              <div className="text-base font-bold text-[#111827] mt-1">
                {meta.yesterdayComp}
              </div>
              <span className="text-xs text-[#66BB6A] font-semibold flex items-center gap-1 mt-0.5">
                <TrendingUp className="w-3.5 h-3.5" /> {meta.growthPercent}{" "}
                growth
              </span>
            </div>

            <div>
              <span className="text-xs font-semibold text-[#64748B]">
                Monthly Benchmark
              </span>
              <div className="text-base font-bold text-[#009688] mt-1">
                {meta.monthlyComp}
              </div>
              <span className="text-[11px] text-[#64748B]">
                Monthly Avg Comparison
              </span>
            </div>
          </div>
        </div>

        {/* Search & Filter Bar */}
        <div className="bg-white rounded-2xl border border-[#E5E7EB] p-4 shadow-sm mb-6">
          <div className="flex items-center justify-between mb-3">
            <div
              className="flex items-center gap-2 text-xs font-semibold text-[#111827]"
              style={{ fontFamily: PP }}
            >
              <Filter className="w-4 h-4 text-[#009688]" />
              <span>Filter Financial KPI Drill-Down Data</span>
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
            Simulate KPI detail state
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
              Connection error while loading financial KPI details data. Please
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
            <div className="bg-white rounded-2xl border border-[#E5E7EB] p-6 h-40 animate-pulse"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white rounded-2xl border border-[#E5E7EB] p-6 h-64 animate-pulse"></div>
              <div className="bg-white rounded-2xl border border-[#E5E7EB] p-6 h-64 animate-pulse"></div>
            </div>
          </div>
        )}

        {!isLoading && !hasError && (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* LEFT MAIN CONTENT AREA (3 Cols) */}
            <div className="lg:col-span-3 space-y-6">
              {/* KPI PERFORMANCE TREND & PERIOD COMPARISON CHARTS */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                        Current vs previous trend for {selectedKpi}
                      </p>
                    </div>

                    <div className="flex items-center gap-1 bg-[#F1F5F9] p-1 rounded-xl border border-[#E5E7EB] text-[10px]">
                      {(
                        [
                          "Today",
                          "7 Days",
                          "30 Days",
                          "90 Days",
                          "1 Year",
                        ] as const
                      ).map((r) => (
                        <button
                          key={r}
                          onClick={() => setTrendRange(r)}
                          className={`px-2 py-0.5 rounded-lg font-medium transition ${trendRange === r ? "bg-[#0D47A1] text-white shadow-sm" : "text-[#64748B]"}`}
                        >
                          {r}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="h-60">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart
                        data={ACCOUNTANT_KPI_TREND_DATA}
                        margin={{ top: 10, right: 10, left: -15, bottom: 0 }}
                      >
                        <defs>
                          <linearGradient
                            id="accKpiCurGrad"
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
                            id="accKpiPrevGrad"
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
                          dataKey="current"
                          name="Current Period"
                          stroke="#0D47A1"
                          fillOpacity={1}
                          fill="url(#accKpiCurGrad)"
                        />
                        <Area
                          type="monotone"
                          dataKey="previous"
                          name="Previous Period"
                          stroke="#009688"
                          fillOpacity={1}
                          fill="url(#accKpiPrevGrad)"
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
                        Grouped comparison of current vs previous period
                      </p>
                    </div>
                    <BarChartIcon className="w-4 h-4 text-[#009688]" />
                  </div>
                  <div className="h-60">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={ACCOUNTANT_KPI_TREND_DATA}
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
                          name="Current"
                          fill="#0D47A1"
                          radius={[4, 4, 0, 0]}
                        />
                        <Bar
                          dataKey="previous"
                          name="Previous"
                          fill="#4DB6AC"
                          radius={[4, 4, 0, 0]}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>

              {/* KPI DISTRIBUTION & PAYMENT METHOD PERFORMANCE CHARTS */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* KPI Distribution Donut Chart */}
                <div className="bg-white rounded-2xl border border-[#E5E7EB] p-5 shadow-sm">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3
                        className="text-sm font-bold text-[#111827]"
                        style={{ fontFamily: PP }}
                      >
                        KPI Distribution Breakdown
                      </h3>
                      <p className="text-[11px] text-[#64748B]">
                        Distribution breakdown for {selectedKpi}
                      </p>
                    </div>
                    <PieChartIcon className="w-4 h-4 text-[#009688]" />
                  </div>
                  <div className="h-60">
                    <ResponsiveContainer width="100%" height="100%">
                      <RechartsPie>
                        <Pie
                          data={ACCOUNTANT_KPI_DONUT_DATA}
                          cx="50%"
                          cy="50%"
                          innerRadius={45}
                          outerRadius={75}
                          paddingAngle={3}
                          dataKey="value"
                        >
                          {ACCOUNTANT_KPI_DONUT_DATA.map((entry) => (
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

                {/* Payment Method Performance Horizontal Bar Chart */}
                <div className="bg-white rounded-2xl border border-[#E5E7EB] p-5 shadow-sm">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3
                        className="text-sm font-bold text-[#111827]"
                        style={{ fontFamily: PP }}
                      >
                        Payment Method Performance
                      </h3>
                      <p className="text-[11px] text-[#64748B]">
                        Revenue share across Card, Cash, UPI, Bank Transfer
                      </p>
                    </div>
                    <CreditCard className="w-4 h-4 text-[#0D47A1]" />
                  </div>
                  <div className="h-60">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        layout="vertical"
                        data={[]}
                        margin={{ top: 5, right: 10, left: 45, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                        <XAxis
                          type="number"
                          tick={{ fontSize: 10, fill: "#64748B" }}
                        />
                        <YAxis
                          type="category"
                          dataKey="method"
                          tick={{ fontSize: 9, fill: "#111827" }}
                          width={100}
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
                          dataKey="revenue"
                          name="Revenue ($)"
                          fill="#0D47A1"
                          radius={[0, 4, 4, 0]}
                        />
                        <Bar
                          dataKey="collectedPct"
                          name="Collection %"
                          fill="#009688"
                          radius={[0, 4, 4, 0]}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>

              {/* FINANCIAL INSIGHTS PANEL */}
              <div className="bg-white rounded-2xl border border-[#E5E7EB] p-6 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <h3
                    className="text-base font-bold text-[#111827] flex items-center gap-2"
                    style={{ fontFamily: PP }}
                  >
                    <Activity className="w-4 h-4 text-[#009688]" />
                    <span>Financial Operational Insights</span>
                  </h3>
                  <span className="text-[11px] font-semibold text-[#009688] bg-teal-50 px-2.5 py-0.5 rounded-full border border-teal-200">
                    Rule-Based Insights
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 rounded-xl bg-blue-50 border border-blue-200 text-xs">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-[#0D47A1] flex items-center gap-1.5">
                        <TrendingUp className="w-3.5 h-3.5" /> Revenue Increased
                        by +14.2%
                      </span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-[#0D47A1]">
                        Info
                      </span>
                    </div>
                    <p className="text-[#64748B]">
                      Daily billing collections reached -- today compared to
                      $13,500 yesterday, driven by card settlements.
                    </p>
                    <div className="mt-2 font-semibold text-[#0D47A1]">
                      Recommendation: Maintain current settlement batch
                      schedules to keep cash flow optimized.
                    </div>
                  </div>

                  <div className="p-4 rounded-xl bg-teal-50 border border-teal-200 text-xs">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-[#009688] flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Collection Rate
                        Improved to --
                      </span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-teal-100 text-[#009688]">
                        Positive
                      </span>
                    </div>
                    <p className="text-[#64748B]">
                      Same-day payment collection rate exceeded the 90.0%
                      operational benchmark target.
                    </p>
                    <div className="mt-2 font-semibold text-[#009688]">
                      Recommendation: Continue digital UPI and QR payment
                      prompts at front-desk counters.
                    </div>
                  </div>
                </div>
              </div>

              {/* FINANCIAL ACTIVITY TIMELINE */}
              <div className="bg-white rounded-2xl border border-[#E5E7EB] p-6 shadow-sm">
                <h3
                  className="text-base font-bold text-[#111827] mb-4"
                  style={{ fontFamily: PP }}
                >
                  Recent Financial Activity Logs
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
                    <span>KPI Summary</span>
                  </h3>
                  <p className="text-[11px] text-[#64748B]">
                    Selected KPI focus summary
                  </p>
                </div>

                {/* Selected KPI Overview */}
                <div className="bg-[#F1F5F9] rounded-xl p-3 border border-[#E5E7EB] text-xs space-y-2">
                  <div className="text-[11px] font-bold text-[#64748B] uppercase">
                    Focus Metric
                  </div>
                  <div className="text-sm font-bold text-[#0D47A1]">
                    {meta.title}
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#64748B]">Current Value:</span>
                    <span className="font-bold text-[#111827]">
                      {meta.currentValue}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#64748B]">Growth %:</span>
                    <span className="font-bold text-[#66BB6A]">
                      {meta.growthPercent}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#64748B]">Date Range:</span>
                    <span className="font-semibold text-[#111827]">
                      {dateRange}
                    </span>
                  </div>
                  <div className="border-t border-[#E5E7EB] pt-2 flex justify-between">
                    <span className="text-[#64748B]">Last Updated:</span>
                    <span className="font-semibold text-[#0D47A1]">
                      {new Date().toLocaleTimeString("en-US", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
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
                      onClick={() =>
                        alert(`Exporting ${selectedKpi} Detail (PDF)...`)
                      }
                      className="w-full text-left px-3 py-2 rounded-xl border border-[#E5E7EB] hover:bg-slate-50 transition flex items-center justify-between text-xs font-semibold text-[#0D47A1]"
                    >
                      <div className="flex items-center gap-2">
                        <Download className="w-3.5 h-3.5 text-[#0D47A1]" />
                        <span>Export PDF Report</span>
                      </div>
                      <ChevronRight className="w-3.5 h-3.5 text-[#64748B]" />
                    </button>

                    <button
                      onClick={() =>
                        alert(`Exporting ${selectedKpi} Detail (Excel)...`)
                      }
                      className="w-full text-left px-3 py-2 rounded-xl border border-[#E5E7EB] hover:bg-slate-50 transition flex items-center justify-between text-xs font-semibold text-[#009688]"
                    >
                      <div className="flex items-center gap-2">
                        <FileSpreadsheet className="w-3.5 h-3.5 text-[#009688]" />
                        <span>Export Excel Report</span>
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

                    {onOpenReport && (
                      <button
                        onClick={() => onOpenReport("daily-revenue")}
                        className="w-full text-left px-3 py-2 rounded-xl border border-[#E5E7EB] hover:bg-slate-50 transition flex items-center justify-between text-xs font-medium text-[#009688]"
                      >
                        <div className="flex items-center gap-2">
                          <DollarSign className="w-3.5 h-3.5 text-[#009688]" />
                          <span>Open Related Report</span>
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
                    <span>Accountant Scope Verified</span>
                  </div>
                  <span>
                    Read-only financial KPI drill-down analytics for hospital
                    billing and revenue tracking.
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
              Financial KPI Analytics ({meta.title})
            </strong>
          </div>
          <div>
            Hospital Management System â€¢ Accountant Dashboard KPI Detail v1.0
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
