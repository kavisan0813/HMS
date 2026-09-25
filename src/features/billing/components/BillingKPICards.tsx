import React from "react";
import {
  Wallet,
  FileText,
  CheckCircle2,
  Clock,
  CreditCard,
  Ban,
  AlertCircle,
} from "lucide-react";
import { PP, RB } from "../constants/billing.constants";
import type {
  InvoiceRecord,
  BillingDashboardSummary,
} from "../types/billing.types";

interface KpiCardProps {
  title: string;
  value: string;
  trend?: string;
  isUp?: boolean;
  color: string;
  Icon: React.ElementType;
  bgTint: string;
}

function BillingKpiCard({
  title,
  value,
  trend,
  isUp,
  color,
  Icon,
  bgTint,
}: KpiCardProps) {
  return (
    <div className="bg-white rounded-2xl border border-[#E5E7EB] p-4 flex flex-col justify-between shadow-sm hover:shadow-md transition-colors duration-200 group">
      <div>
        <div className="flex items-center justify-between mb-2">
          <span
            className="text-xs font-semibold text-[#64748B]"
            style={{ fontFamily: RB }}
          >
            {title}
          </span>
          <div
            className="w-8 h-8 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110"
            style={{ background: bgTint }}
          >
            <Icon size={16} style={{ color }} />
          </div>
        </div>
        <div
          className="text-xl xl:text-2xl font-bold text-[#111827] tracking-tight"
          style={{ fontFamily: PP }}
        >
          {value}
        </div>
      </div>

      <div className="mt-3 pt-2 border-t border-slate-50 flex items-center justify-between">
        {trend ? (
          <span
            className={`inline-flex items-center gap-0.5 text-[11px] font-semibold ${
              isUp ? "text-[#66BB6A]" : "text-[#EF4444]"
            }`}
            style={{ fontFamily: RB }}
          >
            {isUp ? "↑" : "↓"} {trend} vs last week
          </span>
        ) : (
          <span
            className="text-[11px] text-slate-400"
            style={{ fontFamily: RB }}
          >
            Live OPD sync
          </span>
        )}
      </div>
    </div>
  );
}

import { formatCompactCurrency } from "../utils/billing.utils";

export function BillingKPICards({
  dashboardData,
  invoices,
  isLoading,
}: {
  dashboardData?: BillingDashboardSummary;
  invoices: InvoiceRecord[];
  isLoading?: boolean;
}) {
  // Use dashboard data from API if available, otherwise compute from invoices
  const totalRevenue =
    dashboardData?.todayRevenue ??
    invoices
      .filter((i) => i.paymentStatus !== "Cancelled")
      .reduce((sum, i) => sum + i.paidAmount, 0);

  const totalOutstanding =
    dashboardData?.outstanding ??
    invoices
      .filter(
        (i) =>
          i.paymentStatus !== "Cancelled" && i.paymentStatus !== "Refunded",
      )
      .reduce((sum, i) => sum + i.balance, 0);

  const countGenerated =
    dashboardData?.finalized !== undefined
      ? dashboardData.finalized + (dashboardData.draft || 0)
      : invoices.length;
  const countPaid =
    dashboardData?.paid !== undefined
      ? dashboardData.paid
      : invoices.filter(
          (i) => String(i.paymentStatus || "").toUpperCase() === "PAID",
        ).length;
  const countPending =
    dashboardData?.unpaid !== undefined
      ? dashboardData.unpaid
      : invoices.filter((i) => {
          const s = String(i.paymentStatus || "").toUpperCase();
          return s === "PENDING" || s === "UNPAID" || s === "DRAFT";
        }).length;
  const countPartial =
    dashboardData?.partiallyPaid !== undefined
      ? dashboardData.partiallyPaid
      : invoices.filter((i) => {
          const s = String(i.paymentStatus || "").toUpperCase();
          return (
            s === "PARTIALLY PAID" ||
            s === "PARTIALLY_PAID" ||
            s === "PARTIAL"
          );
        }).length;
  const countRefunded =
    dashboardData?.refunded !== undefined
      ? dashboardData.refunded
      : invoices.filter(
          (i) => String(i.paymentStatus || "").toUpperCase() === "REFUNDED",
        ).length;

  const isReady = !isLoading;

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-7 gap-3 md:gap-4">
      <BillingKpiCard
        title="Today's Revenue"
        value={isReady ? formatCompactCurrency(totalRevenue) : "—"}
        color="#0D47A1"
        Icon={Wallet}
        bgTint="rgba(13, 71, 161, 0.08)"
      />
      <BillingKpiCard
        title="Invoices Generated"
        value={isReady ? String(countGenerated) : "—"}
        color="#4DB6AC"
        Icon={FileText}
        bgTint="rgba(77, 182, 172, 0.12)"
      />
      <BillingKpiCard
        title="Paid Bills"
        value={isReady ? String(countPaid) : "—"}
        color="#66BB6A"
        Icon={CheckCircle2}
        bgTint="rgba(102, 187, 106, 0.12)"
      />
      <BillingKpiCard
        title="Pending Payments"
        value={isReady ? String(countPending) : "—"}
        color="#F59E0B"
        Icon={Clock}
        bgTint="rgba(245, 158, 11, 0.12)"
      />
      <BillingKpiCard
        title="Partially Paid"
        value={isReady ? String(countPartial) : "—"}
        color="#0D47A1"
        Icon={CreditCard}
        bgTint="rgba(13, 71, 161, 0.08)"
      />
      <BillingKpiCard
        title="Refunded Bills"
        value={isReady ? String(countRefunded) : "—"}
        color="#EF4444"
        Icon={Ban}
        bgTint="rgba(239, 68, 68, 0.12)"
      />
      <BillingKpiCard
        title="Outstanding Amount"
        value={isReady ? formatCompactCurrency(totalOutstanding) : "—"}
        color="#8B5CF6"
        Icon={AlertCircle}
        bgTint="rgba(139, 92, 246, 0.12)"
      />
    </div>
  );
}
