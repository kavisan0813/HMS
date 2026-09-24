import React from "react";
import { useNavigate } from "react-router";
import { ROUTES } from "../../../app/routes/routes";
import {
  CheckSquare,
  Clock,
  Receipt,
  FileText,
  TrendingDown,
  TrendingUp,
  DollarSign,
  CreditCard,
  BarChart2,
  Loader2,
  AlertTriangle,
} from "lucide-react";
import {
  useAccountantDashboard,
  useAccountantPaymentMethods,
  useAccountantRecentTransactions,
} from "../hooks/useAccountantDashboard";

import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
} from "../../../common/components/recharts-lazy";

const PP = "Poppins, system-ui, sans-serif";
const RB = "Roboto, system-ui, sans-serif";

// ─── Mini Shared Components ────────────────────────────────────────────────
function DKpi({
  title,
  value,
  sub,
  trend,
  up,
  data,
  color,
  gid,
  Icon,
  onClick,
}: {
  title: string;
  value: string;
  sub: string;
  trend: string;
  up: boolean;
  data: { v: number }[];
  color: string;
  gid: string;
  Icon: React.ElementType;
  onClick?: () => void;
}) {
  return (
    <div
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          (e.currentTarget as HTMLElement).click();
        }
      }}
      role="button"
      onClick={onClick}
      className={`bg-white rounded-2xl border border-[#E5E7EB] p-5 flex flex-col gap-3 shadow-sm ${
        onClick
          ? "cursor-pointer hover:shadow-md hover:border-[#0D47A1]/30 transition-colors duration-200"
          : ""
      }`}
    >
      <div className="flex items-start justify-between">
        <div>
          <div
            className="text-xs font-medium text-[#64748B] mb-1"
            style={{ fontFamily: RB }}
          >
            {title}
          </div>
          <div
            className={`${value.length > 12 ? "text-base" : value.length > 8 ? "text-lg" : "text-xl"} font-bold text-[#111827] leading-tight truncate`}
            style={{ fontFamily: PP }}
          >
            {value}
          </div>
          <div
            className="text-xs text-slate-400 mt-1 truncate"
            style={{ fontFamily: RB }}
          >
            {sub}
          </div>
        </div>
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
          style={{ background: color + "18" }}
        >
          <Icon size={16} style={{ color }} />
        </div>
      </div>
      <ResponsiveContainer width="100%" height={40}>
        <AreaChart
          data={data}
          margin={{ top: 2, right: 0, bottom: 0, left: 0 }}
        >
          <defs>
            <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.18} />
              <stop offset="100%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <Area
            type="monotone"
            dataKey="v"
            stroke={color}
            strokeWidth={1.5}
            fill={`url(#${gid})`}
            dot={false}
          />
        </AreaChart>
      </ResponsiveContainer>
      <div
        className={`flex items-center gap-1 text-xs font-medium ${up ? "text-[#66BB6A]" : "text-[#EF4444]"}`}
        style={{ fontFamily: RB }}
      >
        {up ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
        {trend}
      </div>
    </div>
  );
}

const ACCOUNTANT_AVATAR_PALETTE = [
  "bg-[#0D47A1]",
  "bg-[#009688]",
  "bg-violet-600",
  "bg-rose-500",
  "bg-amber-600",
];

function Av({
  name,
  size = "sm",
}: {
  name?: string;
  size?: "sm" | "md" | "lg";
}) {
  const safeName = (name || "??").trim() || "??";
  const initials = safeName
    .split(" ")
    .filter(Boolean)
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
  const bg =
    ACCOUNTANT_AVATAR_PALETTE[
      (safeName?.charCodeAt(0) ?? "?".charCodeAt(0)) %
        ACCOUNTANT_AVATAR_PALETTE.length
    ];
  const sz = {
    sm: "w-7 h-7 text-xs",
    md: "w-9 h-9 text-sm",
    lg: "w-11 h-11 text-base",
  }[size];
  return (
    <div
      className={`${sz} ${bg} rounded-full flex items-center justify-center text-white font-semibold shrink-0`}
      style={{ fontFamily: PP }}
    >
      {initials}
    </div>
  );
}

type ChipVariant =
  | "success"
  | "warning"
  | "error"
  | "info"
  | "teal"
  | "default";
const ACCOUNTANT_CHIP_MAP: Record<ChipVariant, string> = {
  success: "bg-green-50 text-[#66BB6A]",
  warning: "bg-amber-50 text-[#F59E0B]",
  error: "bg-red-50 text-[#EF4444]",
  info: "bg-blue-50 text-[#0D47A1]",
  teal: "bg-teal-50 text-[#009688]",
  default: "bg-slate-50 text-[#64748B]",
};

function Chip({
  label,
  variant = "default",
}: {
  label: string;
  variant?: ChipVariant;
}) {
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${ACCOUNTANT_CHIP_MAP[variant]}`}
      style={{ fontFamily: RB }}
    >
      {label}
    </span>
  );
}

function SH({
  title,
  sub,
  action,
}: {
  title: string;
  sub?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex items-start justify-between mb-4">
      <div>
        <div
          className="text-sm font-semibold text-[#111827]"
          style={{ fontFamily: PP }}
        >
          {title}
        </div>
        {sub && (
          <div
            className="text-xs text-[#64748B] mt-0.5"
            style={{ fontFamily: RB }}
          >
            {sub}
          </div>
        )}
      </div>
      {action}
    </div>
  );
}
const ACC_TRANSACTION_STATUS_CHIP: Record<
  string,
  "success" | "warning" | "info" | "error" | "teal" | "default"
> = {
  Paid: "success",
  Pending: "warning",
  Partial: "info",
  Cancelled: "error",
};

// Quick Actions strictly aligned with requirements
const ACC_QUICK_ACTIONS = [
  {
    label: "Generate Invoice",
    Icon: Receipt,
    color: "#0D47A1",
    action: "create",
  },
  {
    label: "Payment History Ledger",
    Icon: FileText,
    color: "#009688",
    action: "history",
  },
  {
    label: "Receive Payment",
    Icon: CreditCard,
    color: "#009688",
    action: "collect",
  },
  {
    label: "Billing Report",
    Icon: BarChart2,
    color: "#4DB6AC",
    action: "report",
  },
  {
    label: "View Pending Bills",
    Icon: Clock,
    color: "#F59E0B",
    action: "pending",
  },
  {
    label: "Daily Revenue",
    Icon: DollarSign,
    color: "#66BB6A",
    action: "revenue",
  },
];
export function AccountantDashboard({
  onCollectPaymentClick,
  onNavigateNav,
}: {
  onCreateInvoiceClick?: () => void;
  onCollectPaymentClick?: (invoiceNo?: string) => void;
  onNavigateNav?: (nav: string) => void;
}) {
  const navigate = useNavigate();
  const {
    data: dashboard,
    isLoading: loadingDashboard,
    isError: isDashboardError,
  } = useAccountantDashboard();
  const { data: paymentMethods, isError: isPaymentMethodsError } =
    useAccountantPaymentMethods();
  const { data: recentTransactions, isError: isTransactionsError } =
    useAccountantRecentTransactions(10);

  const hasError =
    isDashboardError || isPaymentMethodsError || isTransactionsError;

  // Map API data to chart formats
  const revenueTrend =
    dashboard?.hourlyRevenue?.map((h) => ({
      hour: h.hour,
      revenue: h.amount,
      invoices: 0,
    })) || [];

  const paymentMethodsDist =
    paymentMethods?.map((m) => {
      const colorMap: Record<string, string> = {
        CASH: "#009688",
        CARD: "#0D47A1",
        UPI: "#4DB6AC",
        BANK_TRANSFER: "#66BB6A",
        OTHER: "#F59E0B",
      };
      return {
        name: m.paymentMethod.replace("_", " "),
        value: m.amount,
        color: colorMap[m.paymentMethod] || "#64748B",
      };
    }) || [];

  const billingTransactions =
    recentTransactions?.map((t) => ({
      billId: t.billId,
      invoice: t.invoiceId,
      patient: t.patientName,
      type: t.billType,
      amount: t.amount,
      method: t.paymentMethod,
      status:
        t.status === "PAID"
          ? "Paid"
          : t.status === "UNPAID"
            ? "Pending"
            : t.status === "PARTIALLY_PAID"
              ? "Partial"
              : t.status,
      time: t.generatedAt
        ? new Date(t.generatedAt).toLocaleTimeString("en-IN", {
            hour: "2-digit",
            minute: "2-digit",
            hour12: true,
          })
        : "",
    })) || [];

  // Compute derived data
  const totalInvoices = dashboard?.todayInvoices ?? 0;
  const totalPaymentValue =
    paymentMethods?.reduce((acc, m) => acc + m.amount, 0) ?? 0;

  // Derive invoice status from transactions
  const invoiceStatusDist = (() => {
    if (!recentTransactions || recentTransactions.length === 0) return [];
    const statusCounts: Record<string, number> = {};
    recentTransactions.forEach((t) => {
      const key =
        t.status === "PAID"
          ? "Paid"
          : t.status === "UNPAID"
            ? "Pending"
            : t.status === "PARTIALLY_PAID"
              ? "Partial"
              : "Other";
      statusCounts[key] = (statusCounts[key] || 0) + 1;
    });
    const colorMap: Record<string, string> = {
      Paid: "#66BB6A",
      Pending: "#F59E0B",
      Partial: "#0D47A1",
      Other: "#EF4444",
      Cancelled: "#EF4444",
    };
    return Object.entries(statusCounts).map(([name, count]) => ({
      name,
      count,
      color: colorMap[name] || "#64748B",
    }));
  })();

  // Derive revenue by billing category from transactions
  const revenueCategories = (() => {
    if (!recentTransactions || recentTransactions.length === 0) return [];
    const categoryMap: Record<string, number> = {};
    recentTransactions.forEach((t) => {
      categoryMap[t.billType] = (categoryMap[t.billType] || 0) + t.amount;
    });
    return Object.entries(categoryMap)
      .map(([category, amount]) => ({ category, amount }))
      .sort((a, b) => b.amount - a.amount);
  })();

  // Financial summary metrics from API data
  const financialMetrics = [
    {
      metric: "Invoices Generated",
      today: String(dashboard?.todayInvoices ?? 0),
      yesterday: "--",
      status: "Today's Count",
    },
    {
      metric: "Pending Payments",
      today: `$${(dashboard?.pendingPayments ?? 0).toLocaleString()}`,
      yesterday: "--",
      status: "Outstanding",
    },
    {
      metric: "Collection Rate",
      today: `${dashboard?.collectionRate ?? 0}%`,
      yesterday: "--",
      status: "Efficiency",
    },
    {
      metric: "Today's Revenue",
      today: `$${(dashboard?.todayRevenue ?? 0).toLocaleString()}`,
      yesterday: "--",
      status: "Total Collected",
    },
    {
      metric: "Payment Methods",
      today: String(paymentMethods?.length ?? 0),
      yesterday: "--",
      status: "Active Methods",
    },
    {
      metric: "Recent Transactions",
      today: String(recentTransactions?.length ?? 0),
      yesterday: "--",
      status: "Last 10",
    },
  ];

  if (loadingDashboard) {
    return (
      <div
        className="flex-1 overflow-y-auto p-6 flex items-center justify-center"
        style={{ background: "#F1F5F9" }}
      >
        <div className="flex items-center gap-3 text-[#64748B]">
          <Loader2 size={20} className="animate-spin" />
          <span className="text-sm font-medium" style={{ fontFamily: RB }}>
            Loading accountant dashboard...
          </span>
        </div>
      </div>
    );
  }

  if (hasError) {
    return (
      <div
        className="flex-1 overflow-y-auto p-6 flex items-center justify-center"
        style={{ background: "#F1F5F9" }}
      >
        <div className="bg-white rounded-2xl border border-red-200 p-8 max-w-md w-full text-center shadow-sm">
          <AlertTriangle size={40} className="mx-auto text-[#EF4444] mb-4" />
          <h3
            className="text-base font-semibold text-[#111827] mb-2"
            style={{ fontFamily: PP }}
          >
            Failed to Load Dashboard
          </h3>
          <p className="text-sm text-[#64748B] mb-4" style={{ fontFamily: RB }}>
            Unable to fetch accountant dashboard data. Please check your
            connection and try again.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 rounded-xl bg-[#0D47A1] text-white text-xs font-semibold hover:bg-blue-800 transition-colors"
            style={{ fontFamily: PP }}
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      className="flex-1 overflow-y-auto p-6 space-y-6"
      style={{ background: "#F1F5F9" }}
    >
      {/* ── HEADER & QUICK ACTIONS ── */}
      <div className="flex items-center gap-3 flex-wrap">
        <span
          className="text-xs font-semibold text-[#64748B] uppercase tracking-wider mr-1"
          style={{ fontFamily: PP }}
        >
          Financial Quick Actions
        </span>
        {ACC_QUICK_ACTIONS.map(({ label, Icon, color, action }) => (
          <button
            key={label}
            onClick={() => {
              if (action === "create") {
                navigate(ROUTES.BILLING_CREATE);
              } else if (action === "history") {
                navigate(ROUTES.BILLING_HISTORY);
              } else if (action === "collect" && onCollectPaymentClick) {
                onCollectPaymentClick();
              } else if (action === "collect") {
                navigate(ROUTES.RECEPTIONIST_PAYMENT_COLLECTION);
              } else if (action === "pending") {
                navigate(ROUTES.BILLING);
              } else if (action === "report") {
                navigate(`${ROUTES.REPORTS}?report=billing-report`);
              } else if (action === "revenue") {
                navigate(`${ROUTES.REPORTS}?report=daily-revenue`);
              } else if (action === "search") {
                navigate(ROUTES.BILLING);
              } else if (onNavigateNav) {
                onNavigateNav(
                  action === "report" || action === "revenue"
                    ? "reports"
                    : "billing",
                );
              }
            }}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-[#E5E7EB] text-xs font-medium text-[#64748B] hover:border-[#0D47A1]/40 hover:text-[#0D47A1] hover:bg-blue-50 transition-colors shadow-sm"
            style={{ fontFamily: RB }}
          >
            <Icon size={13} style={{ color }} />
            {label}
          </button>
        ))}
      </div>

      {/* ── KPI Row — 5 Financial Operations KPI Cards ── */}
      <div className="grid grid-cols-2 xl:grid-cols-5 gap-4">
        <DKpi
          title="Today's Revenue"
          value={`₹${(dashboard?.todayRevenue ?? 0).toLocaleString()}`}
          sub="Total Amount Collected Today"
          trend={
            dashboard?.collectionRate
              ? `${dashboard.collectionRate}% Collection Rate`
              : "Loading..."
          }
          up={(dashboard?.collectionRate ?? 0) >= 50}
          data={revenueTrend.slice(-6).map((h) => ({ v: h.revenue }))}
          color="#0D47A1"
          gid="acc1"
          Icon={DollarSign}
          onClick={() => navigate(`${ROUTES.REPORTS}?report=daily-revenue`)}
        />
        <DKpi
          title="Invoices Generated"
          value={String(dashboard?.todayInvoices ?? 0)}
          sub="Today's Billing Count"
          trend="Today's Volume"
          up={true}
          data={revenueTrend.slice(-6).map((h) => ({ v: h.invoices }))}
          color="#009688"
          gid="acc2"
          Icon={Receipt}
          onClick={() => navigate(`${ROUTES.REPORTS}?report=billing-report`)}
        />
        <DKpi
          title="Pending Payments"
          value={`₹${(dashboard?.pendingPayments ?? 0).toLocaleString()}`}
          sub="Outstanding Bills"
          trend="Outstanding Amount"
          up={false}
          data={[
            { v: (dashboard?.pendingPayments ?? 0) + 2000 },
            { v: (dashboard?.pendingPayments ?? 0) + 1000 },
            { v: dashboard?.pendingPayments ?? 0 },
          ]}
          color="#F59E0B"
          gid="acc3"
          Icon={Clock}
          onClick={() => navigate(`${ROUTES.REPORTS}?report=billing-report`)}
        />
        <DKpi
          title="Collection Rate"
          value={`${dashboard?.collectionRate ?? 0}%`}
          sub="Today's Collection Efficiency"
          trend="Collection Rate"
          up={(dashboard?.collectionRate ?? 0) >= 50}
          data={[
            { v: (dashboard?.collectionRate ?? 0) - 10 },
            { v: (dashboard?.collectionRate ?? 0) - 5 },
            { v: dashboard?.collectionRate ?? 0 },
          ]}
          color="#66BB6A"
          gid="acc4"
          Icon={CheckSquare}
          onClick={() =>
            navigate(`${ROUTES.REPORTS}?kpi=Payment Collection Rate`)
          }
        />
        <DKpi
          title="Payment Methods"
          value={String(paymentMethods?.length ?? 0)}
          sub="Active Payment Methods"
          trend="Methods Available"
          up={true}
          data={paymentMethodsDist.slice(-6).map((m) => ({ v: m.value }))}
          color="#4DB6AC"
          gid="acc5"
          Icon={CreditCard}
          onClick={() =>
            navigate(`${ROUTES.REPORTS}?kpi=Payment Collection Rate`)
          }
        />
      </div>

      {/* ── Main Financial Operations Grid 1 ── */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
        {/* Section 01: Revenue Collection Trend (Large Line Chart) */}
        <div className="xl:col-span-2 bg-white rounded-2xl border border-[#E5E7EB] p-5 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <div>
              <div
                className="text-sm font-semibold text-[#111827]"
                style={{ fontFamily: PP }}
              >
                Revenue Collection Throughout the Day
              </div>
              <div
                className="text-xs text-[#64748B] mt-0.5"
                style={{ fontFamily: RB }}
              >
                Monitors hourly revenue collection flow (08 AM - 05 PM)
              </div>
            </div>
            <span
              className="text-[10px] font-semibold text-[#0D47A1] bg-blue-50 px-2 py-0.5 rounded-full"
              style={{ fontFamily: RB }}
            >
              Today: ₹{(dashboard?.todayRevenue ?? 0).toLocaleString()}
            </span>
          </div>
          <ResponsiveContainer width="100%" height={210}>
            <AreaChart
              data={
                revenueTrend.length > 0
                  ? revenueTrend
                  : [{ hour: "No Data", revenue: 0, invoices: 0 }]
              }
              margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
            >
              <defs>
                <linearGradient id="accRevGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#0D47A1" stopOpacity={0.25} />
                  <stop offset="100%" stopColor="#0D47A1" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis
                dataKey="hour"
                tick={{ fontSize: 11, fill: "#64748B", fontFamily: RB }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 10, fill: "#94A3B8" }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(val: unknown) => `₹${Number(val) / 1000}k`}
              />
              <Tooltip
                contentStyle={{
                  background: "#fff",
                  border: "1px solid #E5E7EB",
                  borderRadius: 12,
                  fontSize: 12,
                }}
                formatter={(val: unknown, name: unknown) => [
                  name === "revenue"
                    ? `₹${Number(val).toLocaleString()}.00`
                    : `${val} Invoices`,
                  name === "revenue"
                    ? "Revenue Collected"
                    : "Invoices Generated",
                ]}
              />
              <Area
                type="monotone"
                dataKey="revenue"
                stroke="#0D47A1"
                strokeWidth={2.5}
                fill="url(#accRevGrad)"
                dot={{ r: 3, fill: "#0D47A1" }}
              />
            </AreaChart>
          </ResponsiveContainer>
          <div
            className="mt-3 pt-3 border-t border-gray-50 flex items-center justify-between text-xs text-[#64748B]"
            style={{ fontFamily: RB }}
          >
            <span>
              {dashboard?.peakHourLabel ?? "Peak hour data unavailable"}
            </span>
            <span className="font-semibold text-[#111827]">
              {dashboard?.todayInvoices ?? 0} Invoices Processed
            </span>
          </div>
        </div>

        {/* Section 02: Payment Method Distribution (Donut Chart) */}
        <div className="bg-white rounded-2xl border border-[#E5E7EB] p-5 shadow-sm flex flex-col justify-between">
          <SH
            title="Payments by Method"
            sub="Understand Payment Method Distribution"
          />
          <ResponsiveContainer width="100%" height={170}>
            <BarChart
              data={
                paymentMethodsDist.length > 0
                  ? paymentMethodsDist
                  : [{ name: "No Data", value: 0, color: "#64748B" }]
              }
              layout="vertical"
              margin={{ top: 0, right: 15, left: 10, bottom: 0 }}
            >
              <XAxis type="number" hide />
              <YAxis
                dataKey="name"
                type="category"
                tick={{ fontSize: 11, fill: "#111827", fontFamily: RB }}
                axisLine={false}
                tickLine={false}
                width={85}
              />
              <Tooltip
                contentStyle={{
                  background: "#fff",
                  border: "1px solid #E5E7EB",
                  borderRadius: 12,
                  fontSize: 12,
                }}
                formatter={(v: unknown) => [
                  `₹${Number(v).toLocaleString()}.00`,
                  "Amount Collected",
                ]}
              />
              <Bar dataKey="value" radius={[0, 6, 6, 0]} barSize={13}>
                {(paymentMethodsDist.length > 0
                  ? paymentMethodsDist
                  : [{ name: "No Data", value: 0, color: "#64748B" }]
                ).map((entry) => (
                  <Cell key={entry.name} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          <div
            className="grid grid-cols-2 gap-1.5 mt-2 pt-3 border-t border-gray-50 text-xs"
            style={{ fontFamily: RB }}
          >
            {(paymentMethodsDist.length > 0
              ? paymentMethodsDist
              : [{ name: "No Data", value: 0, color: "#64748B" }]
            ).map((m) => (
              <div
                key={m.name}
                className="flex items-center justify-between p-1.5 rounded-lg bg-slate-50"
              >
                <div className="flex items-center gap-1.5">
                  <span
                    className="w-2 h-2 rounded-full shrink-0"
                    style={{ background: m.color }}
                  />
                  <span className="text-[#64748B] text-[11px]">{m.name}</span>
                </div>
                <span className="font-bold text-[#111827]">
                  ₹{(m.value / 1000).toFixed(1)}k
                </span>
              </div>
            ))}
          </div>
          <div
            className="mt-2 text-[11px] text-center text-[#64748B]"
            style={{ fontFamily: RB }}
          >
            Total Collected: ₹{totalPaymentValue.toLocaleString()}.00
          </div>
        </div>
      </div>

      {/* ── Section 03: Today's Billing Transactions Table ── */}
      <div className="bg-white rounded-2xl border border-[#E5E7EB] shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-50 flex items-center justify-between">
          <div>
            <div
              className="text-sm font-semibold text-[#111827]"
              style={{ fontFamily: PP }}
            >
              Today's Billing Transactions
            </div>
            <div
              className="text-xs text-[#64748B] mt-0.5"
              style={{ fontFamily: RB }}
            >
              Real-time invoice management and billing activity tracking
            </div>
          </div>
          <span
            className="text-xs font-semibold text-[#0D47A1] bg-blue-50 px-2.5 py-1 rounded-lg"
            style={{ fontFamily: RB }}
          >
            {dashboard?.todayInvoices ?? 0} Invoices Today
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-50 bg-slate-50/50">
                {[
                  "Invoice No",
                  "Patient Name",
                  "Bill Type",
                  "Amount",
                  "Payment Method",
                  "Status",
                  "Generated Time",
                  "Actions",
                ].map((h) => (
                  <th
                    key={h}
                    className="px-5 py-3 text-left text-xs font-semibold text-[#64748B]"
                    style={{ fontFamily: RB }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {billingTransactions.length > 0 ? (
                billingTransactions.map((t) => (
                  <tr
                    key={t.invoice}
                    className="hover:bg-slate-50 transition-colors"
                  >
                    <td className="px-5 py-3 font-mono text-xs font-bold text-[#0D47A1]">
                      {t.invoice}
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2">
                        <Av name={t.patient} size="sm" />
                        <span
                          className="text-xs font-medium text-[#111827]"
                          style={{ fontFamily: RB }}
                        >
                          {t.patient}
                        </span>
                      </div>
                    </td>
                    <td
                      className="px-5 py-3 text-xs text-[#64748B]"
                      style={{ fontFamily: RB }}
                    >
                      {t.type}
                    </td>
                    <td className="px-5 py-3 font-mono text-xs font-bold text-[#111827]">
                      ₹{t.amount.toFixed(2)}
                    </td>
                    <td
                      className="px-5 py-3 text-xs text-[#64748B]"
                      style={{ fontFamily: RB }}
                    >
                      {t.method}
                    </td>
                    <td className="px-5 py-3">
                      <Chip
                        label={t.status}
                        variant={
                          ACC_TRANSACTION_STATUS_CHIP[t.status] || "default"
                        }
                      />
                    </td>
                    <td className="px-5 py-3 font-mono text-xs text-slate-500">
                      {t.time}
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-1.5">
                        {t.status === "Pending" || t.status === "Partial" ? (
                          <button
                            onClick={() => {
                              const target = t.billId ?? t.invoice;
                              if (onCollectPaymentClick) {
                                onCollectPaymentClick(String(target));
                              } else {
                                navigate(`/billing/collect-payment/${target}`);
                              }
                            }}
                            className="px-2.5 py-1 rounded-lg bg-[#009688] text-white text-[11px] font-semibold hover:bg-teal-700 transition-colors"
                            style={{ fontFamily: PP }}
                          >
                            Collect
                          </button>
                        ) : (
                          <span className="text-xs text-slate-400 font-medium">
                            Logged
                          </span>
                        )}
                        <button
                          onClick={() => {
                            const target = t.billId ?? t.invoice;
                            navigate(`/billing/invoice/${target}`);
                          }}
                          className="px-2 py-1 rounded-lg bg-slate-100 text-[#0D47A1] text-[11px] font-semibold hover:bg-blue-50 transition-colors"
                        >
                          View
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={8}
                    className="px-5 py-8 text-center text-xs text-[#64748B]"
                    style={{ fontFamily: RB }}
                  >
                    No recent transactions found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Section 04, 05 & 06: Pending Summary, Revenue Categories & Invoice Status ── */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
        {/* Section 04: Pending Payment Summary (Reusable Summary Card) */}
        <div className="bg-white rounded-2xl border border-[#E5E7EB] p-5 shadow-sm flex flex-col justify-between">
          <SH
            title="Pending Payment Summary"
            sub="Outstanding Collections Overview"
          />
          <div className="space-y-3 my-auto">
            <div className="flex items-center justify-between p-2.5 rounded-xl border border-amber-100 bg-amber-50/50">
              <span
                className="text-xs text-[#64748B]"
                style={{ fontFamily: RB }}
              >
                Pending Bills Count
              </span>
              <span
                className="text-sm font-bold text-[#111827]"
                style={{ fontFamily: PP }}
              >
                {dashboard?.pendingBillsCount ?? "N/A"}
              </span>
            </div>
            <div className="flex items-center justify-between p-2.5 rounded-xl border border-red-100 bg-red-50/50">
              <span
                className="text-xs text-[#64748B]"
                style={{ fontFamily: RB }}
              >
                Pending Outstanding Amount
              </span>
              <span
                className="text-sm font-bold text-[#EF4444]"
                style={{ fontFamily: PP }}
              >
                ₹{(dashboard?.pendingPayments ?? 0).toLocaleString()}
              </span>
            </div>
            <div className="flex items-center justify-between p-2.5 rounded-xl border border-gray-100 bg-slate-50">
              <span
                className="text-xs text-[#64748B]"
                style={{ fontFamily: RB }}
              >
                Overdue Bills (&gt;3 Days)
              </span>
              <span
                className="text-sm font-bold text-[#F59E0B]"
                style={{ fontFamily: PP }}
              >
                {dashboard?.overdueBillsCount ?? "N/A"}
              </span>
            </div>
            <div className="flex items-center justify-between p-2.5 rounded-xl border border-gray-100 bg-slate-50">
              <span
                className="text-xs text-[#64748B]"
                style={{ fontFamily: RB }}
              >
                Average Due Amount
              </span>
              <span
                className="text-sm font-bold text-[#111827]"
                style={{ fontFamily: PP }}
              >
                {dashboard?.avgDueAmount != null
                  ? `₹${dashboard.avgDueAmount.toLocaleString()}`
                  : "N/A"}
              </span>
            </div>
            <div className="flex items-center justify-between p-2.5 rounded-xl border border-teal-100 bg-teal-50/50">
              <span
                className="text-xs text-[#64748B]"
                style={{ fontFamily: RB }}
              >
                Today's Collections Progress
              </span>
              <span
                className="text-sm font-bold text-[#009688]"
                style={{ fontFamily: PP }}
              >
                ₹{(dashboard?.todayRevenue ?? 0).toLocaleString()}
              </span>
            </div>
          </div>
          <div
            className="mt-3 pt-2 text-xs text-[#64748B] text-center"
            style={{ fontFamily: RB }}
          >
            Critical operational metrics for revenue recovery
          </div>
        </div>

        {/* Section 05: Revenue by Billing Category (Horizontal Bar Chart) */}
        <div className="bg-white rounded-2xl border border-[#E5E7EB] p-5 shadow-sm flex flex-col justify-between">
          <SH
            title="Revenue by Billing Type"
            sub="Revenue Breakdown by Category"
          />
          <ResponsiveContainer width="100%" height={180}>
            <BarChart
              data={
                revenueCategories.length > 0
                  ? revenueCategories
                  : [{ category: "No Data", amount: 0 }]
              }
              layout="vertical"
              margin={{ top: 0, right: 20, left: 25, bottom: 0 }}
            >
              <XAxis
                type="number"
                tick={{ fontSize: 10, fill: "#94A3B8" }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v: unknown) => `₹${Number(v) / 1000}k`}
              />
              <YAxis
                dataKey="category"
                type="category"
                tick={{ fontSize: 10, fill: "#111827", fontFamily: RB }}
                axisLine={false}
                tickLine={false}
                width={100}
              />
              <Tooltip
                contentStyle={{
                  background: "#fff",
                  border: "1px solid #E5E7EB",
                  borderRadius: 12,
                  fontSize: 12,
                }}
                formatter={(v: unknown) => [
                  `₹${Number(v).toLocaleString()}.00`,
                  "Collected Amount",
                ]}
              />
              <Bar
                dataKey="amount"
                fill="#0D47A1"
                radius={[0, 4, 4, 0]}
                barSize={13}
              />
            </BarChart>
          </ResponsiveContainer>
          <div
            className="mt-2 pt-2 border-t border-gray-50 text-xs text-[#64748B] flex items-center justify-between"
            style={{ fontFamily: RB }}
          >
            <span>Top Source: {dashboard?.topSource ?? "N/A"}</span>
            <span className="font-semibold text-[#0D47A1]">
              ₹{totalPaymentValue.toLocaleString()} Total
            </span>
          </div>
        </div>

        {/* Section 06: Invoice Status Distribution (Pie / Bar Chart) */}
        <div className="bg-white rounded-2xl border border-[#E5E7EB] p-5 shadow-sm flex flex-col justify-between">
          <SH
            title="Invoice Status Distribution"
            sub="Quick Overview of Billing Completion"
          />
          <ResponsiveContainer width="100%" height={160}>
            <BarChart
              data={
                invoiceStatusDist.length > 0
                  ? invoiceStatusDist
                  : [{ name: "No Data", count: 0, color: "#64748B" }]
              }
              margin={{ top: 10, right: 10, left: 10, bottom: 0 }}
            >
              <XAxis
                dataKey="name"
                tick={{ fontSize: 11, fill: "#64748B", fontFamily: RB }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 10, fill: "#94A3B8" }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                contentStyle={{
                  background: "#fff",
                  border: "1px solid #E5E7EB",
                  borderRadius: 12,
                  fontSize: 12,
                }}
                formatter={(v: unknown) => [`${v} Invoices`, "Count"]}
              />
              <Bar dataKey="count" radius={[4, 4, 0, 0]} barSize={22}>
                {(invoiceStatusDist.length > 0
                  ? invoiceStatusDist
                  : [{ name: "No Data", count: 0, color: "#64748B" }]
                ).map((entry) => (
                  <Cell key={entry.name} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          <div
            className="grid grid-cols-2 gap-1.5 mt-2 pt-2 border-t border-gray-50 text-xs"
            style={{ fontFamily: RB }}
          >
            {(invoiceStatusDist.length > 0
              ? invoiceStatusDist
              : [{ name: "No Data", count: 0, color: "#64748B" }]
            ).map((r) => (
              <div key={r.name} className="flex items-center justify-between">
                <span className="text-[#64748B] text-[11px]">{r.name}:</span>
                <span className="font-bold text-[#111827]">{r.count}</span>
              </div>
            ))}
          </div>
          <div
            className="mt-2 text-xs font-semibold text-center text-[#0D47A1]"
            style={{ fontFamily: PP }}
          >
            Total Invoices Today: {totalInvoices}
          </div>
        </div>
      </div>

      {/* ── Section 09: Today's Financial Summary ── */}
      <div className="bg-white rounded-2xl border border-[#E5E7EB] shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-50 flex items-center justify-between">
          <div>
            <div
              className="text-sm font-semibold text-[#111827]"
              style={{ fontFamily: PP }}
            >
              Today's Financial Summary
            </div>
            <div
              className="text-xs text-[#64748B] mt-0.5"
              style={{ fontFamily: RB }}
            >
              Financial operational statistics and daily collection performance
            </div>
          </div>
        </div>
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-50 bg-slate-50/50">
              {["Metric", "Today", "Yesterday", "Status"].map((h) => (
                <th
                  key={h}
                  className="px-5 py-3 text-left text-xs font-semibold text-[#64748B]"
                  style={{ fontFamily: RB }}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {financialMetrics.map((m) => (
              <tr
                key={m.metric}
                className="hover:bg-slate-50 transition-colors"
              >
                <td
                  className="px-5 py-3 text-xs font-medium text-[#111827]"
                  style={{ fontFamily: PP }}
                >
                  {m.metric}
                </td>
                <td className="px-5 py-3 font-mono text-xs font-bold text-[#0D47A1]">
                  {m.today}
                </td>
                <td className="px-5 py-3 font-mono text-xs font-semibold text-[#64748B]">
                  {m.yesterday}
                </td>
                <td className="px-5 py-3">
                  <Chip
                    label={m.status}
                    variant={
                      m.status.includes("Ahead") ||
                      m.status.includes("Optimal") ||
                      m.status.includes("High")
                        ? "success"
                        : m.status.includes("Low")
                          ? "info"
                          : "warning"
                    }
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
