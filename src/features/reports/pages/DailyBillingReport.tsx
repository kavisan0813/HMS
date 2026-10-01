import { useState, useMemo } from "react";
import { useNavigate } from "react-router";
import {
  Printer,
  Download,
  CreditCard,
  FileText,
  Clock,
  CheckCircle2,
  RotateCcw,
  DollarSign,
  Eye,
  ArrowLeft,
} from "lucide-react";
import { PP, RB } from "../../billing/constants/billing.constants";
import {
  useBillingDashboard,
  useBillingList,
} from "../../billing/hooks/useBilling";
import { BillingStatusBadge } from "../../billing/components/BillingStatusBadge";
import { mapApiBillToInvoiceRecord } from "../../billing/utils/billing.utils";
import { exportDataToCsv } from "../utils/export.utils";
import safehandshospital_logo from "../../../assets/safehandshospital_logo.webp";
import { useHospitalBranding } from "../../settings/hooks/useHospitalBranding";

const DAILY_REPORT_BILLING_PARAMS = { page: 0, size: 200 } as const;

function formatDateDDMMYYYY(dateStr: string): string {
  if (!dateStr) return "";
  const parts = dateStr.split("-");
  if (parts.length === 3 && parts[0].length === 4) {
    return `${parts[2]}-${parts[1]}-${parts[0]}`;
  }
  try {
    const d = new Date(dateStr);
    if (!isNaN(d.getTime())) {
      const day = String(d.getDate()).padStart(2, "0");
      const month = String(d.getMonth() + 1).padStart(2, "0");
      const year = d.getFullYear();
      return `${day}-${month}-${year}`;
    }
  } catch {
    // fallback
  }
  return dateStr;
}

function formatDateTimeDDMMYYYY(date: Date = new Date()): string {
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();
  let hours = date.getHours();
  const minutes = String(date.getMinutes()).padStart(2, "0");
  const ampm = hours >= 12 ? "PM" : "AM";
  hours = hours % 12;
  hours = hours ? hours : 12;
  const strHours = String(hours).padStart(2, "0");
  return `${day}-${month}-${year} ${strHours}:${minutes} ${ampm}`;
}

export function DailyBillingReportPage() {
  const navigate = useNavigate();
  const { logoUrl } = useHospitalBranding();
  const [logoLoaded, setLogoLoaded] = useState(true);
  const effectiveLogo = logoUrl || safehandshospital_logo;

  const [reportDate, setReportDate] = useState(
    () => new Date().toISOString().split("T")[0],
  );
  const [, setCashierFilter] = useState("All");
  const [methodFilter, setMethodFilter] = useState("All");
  const [deptFilter, setDeptFilter] = useState("All");

  const dashboardParams = useMemo(
    () => ({ fromDate: reportDate, toDate: reportDate }),
    [reportDate],
  );

  // API hooks
  const { data: dashboardData, isLoading: dashboardLoading } =
    useBillingDashboard(dashboardParams);
  const { data: billsData, isLoading: billsLoading } = useBillingList(
    DAILY_REPORT_BILLING_PARAMS,
  );

  const invoices = useMemo(
    () =>
      (billsData?.bills || []).map((b) => {
        const inv = mapApiBillToInvoiceRecord(b);
        return {
          ...inv,
          createdAt: b.createdAt,
        };
      }),
    [billsData],
  );

  // Derived filtered invoices respecting reportDate, methodFilter, and deptFilter
  const filteredInvoices = useMemo(() => {
    return invoices.filter((inv) => {
      // 1. Report Date filter
      if (reportDate) {
        let matchesDate = false;
        if (inv.createdAt && typeof inv.createdAt === "string") {
          if (inv.createdAt.slice(0, 10) === reportDate) {
            matchesDate = true;
          }
        }
        if (!matchesDate && inv.invoiceDate) {
          try {
            const d = new Date(inv.invoiceDate);
            if (!isNaN(d.getTime())) {
              const y = d.getFullYear();
              const m = String(d.getMonth() + 1).padStart(2, "0");
              const day = String(d.getDate()).padStart(2, "0");
              if (`${y}-${m}-${day}` === reportDate) {
                matchesDate = true;
              }
            }
          } catch {
            // ignore
          }
          if (!matchesDate && inv.invoiceDate.includes(reportDate)) {
            matchesDate = true;
          }
        }
        if (!matchesDate && !inv.createdAt && !inv.invoiceDate) {
          matchesDate = true;
        }
        if (!matchesDate) return false;
      }

      // 2. Payment Method filter
      if (methodFilter !== "All") {
        const invMethod = (inv.paymentMethod || "").toLowerCase();
        const targetMethod = methodFilter.toLowerCase();
        if (targetMethod === "card" && !invMethod.includes("card")) return false;
        else if (targetMethod === "upi" && !invMethod.includes("upi")) return false;
        else if (targetMethod === "cash" && !invMethod.includes("cash")) return false;
        else if (invMethod !== targetMethod && !invMethod.includes(targetMethod)) return false;
      }

      // 3. Department filter
      if (deptFilter !== "All") {
        if ((inv.department || "").toLowerCase() !== deptFilter.toLowerCase()) {
          return false;
        }
      }

      return true;
    });
  }, [invoices, reportDate, methodFilter, deptFilter]);

  // Derived totals for filtered invoices
  const filteredTotals = useMemo(() => {
    const totalInvoices = filteredInvoices.length;
    const totalBilled = filteredInvoices.reduce((sum, i) => sum + (i.invoiceAmount || 0), 0);
    const totalPaid = filteredInvoices.reduce((sum, i) => sum + (i.paidAmount || 0), 0);
    const totalPending = filteredInvoices.reduce((sum, i) => sum + (i.balance || 0), 0);
    return { totalInvoices, totalBilled, totalPaid, totalPending };
  }, [filteredInvoices]);

  // Compute metrics from API data
  const metrics = useMemo(() => {
    const todayRevenue =
      dashboardData?.todayRevenue ??
      invoices.reduce((sum, inv) => sum + inv.paidAmount, 0);
    const outstanding =
      dashboardData?.outstanding ??
      invoices.reduce((sum, inv) => sum + inv.balance, 0);
    const invoicesCount =
      dashboardData?.readyForBilling ?? dashboardData?.draft ?? invoices.length;
    const pendingAmount =
      dashboardData?.unpaid ??
      invoices
        .filter((i) => i.paymentStatus === "Pending")
        .reduce((s, i) => s + i.balance, 0);
    const collectionRate =
      todayRevenue > 0
        ? ((todayRevenue - outstanding) / todayRevenue) * 100
        : 100;

    const upiAmount = invoices
      .filter((i) => i.paymentMethod === "UPI")
      .reduce((s, i) => s + i.paidAmount, 0);
    const cashAmount = invoices
      .filter((i) => i.paymentMethod === "Cash")
      .reduce((s, i) => s + i.paidAmount, 0);
    const cardAmount = invoices
      .filter((i) => i.paymentMethod === "Card")
      .reduce((s, i) => s + i.paidAmount, 0);
    const totalPaid = upiAmount + cashAmount + cardAmount;

    return {
      todayRevenue,
      outstanding,
      invoicesCount,
      pendingAmount,
      collectionRate,
      upiAmount,
      cashAmount,
      cardAmount,
      totalPaid,
    };
  }, [invoices, dashboardData]);

  const isLoading = dashboardLoading || billsLoading;

  // Department breakdown (computed from invoices)
  const departmentBreakdown = useMemo(() => {
    const depts: Record<
      string,
      { invoices: number; revenue: number; collected: number; pending: number }
    > = {};
    invoices.forEach((inv) => {
      const dept = inv.department || "General";
      if (!depts[dept])
        depts[dept] = { invoices: 0, revenue: 0, collected: 0, pending: 0 };
      depts[dept].invoices++;
      depts[dept].revenue += inv.invoiceAmount;
      depts[dept].collected += inv.paidAmount;
      depts[dept].pending += inv.balance;
    });
    return Object.entries(depts).map(([department, data]) => ({
      department,
      ...data,
      pct:
        data.revenue > 0
          ? Math.round((data.collected / data.revenue) * 100)
          : 100,
    }));
  }, [invoices]);

  const handleResetFilters = () => {
    setReportDate(new Date().toISOString().split("T")[0]);
    setCashierFilter("All");
    setMethodFilter("All");
    setDeptFilter("All");
  };

  const handleExportCsv = () => {
    if (!filteredInvoices || filteredInvoices.length === 0) {
      alert("No billing records found for the selected report criteria.");
      return;
    }

    const rows = filteredInvoices.map((inv, idx) => ({
      "S.No": idx + 1,
      "Invoice No": inv.billNumber || inv.id || "N/A",
      "Patient Name": inv.patientName || "N/A",
      "MRN": inv.mrn || "N/A",
      "Department": inv.department || "General OPD",
      "Doctor": inv.doctorName || "General Physician",
      "Invoice Date": inv.invoiceDate || reportDate,
      "Payment Method": inv.paymentMethod || "Cash",
      "Billing Amount": inv.invoiceAmount ?? 0,
      "Paid Amount": inv.paidAmount ?? 0,
      "Pending Amount": inv.balance ?? 0,
      "Payment Status": inv.paymentStatus || "Pending",
    }));

    exportDataToCsv(
      `daily-billing-report-${reportDate || new Date().toISOString().slice(0, 10)}.csv`,
      rows,
    );
  };

  return (
    <>
      {/* ─── PRINT-SPECIFIC CSS RULES ─── */}
      <style>{`
        @media screen {
          .daily-billing-print-only {
            display: none !important;
          }
        }

        @media print {
          @page {
            size: A4 portrait;
            margin: 10mm;
          }

          html, body {
            background: #ffffff !important;
            color: #0f172a !important;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif !important;
            margin: 0 !important;
            padding: 0 !important;
            width: 100% !important;
            height: auto !important;
            min-height: 100% !important;
            overflow: visible !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }

          /* Hide everything in normal screen UI when printing */
          .daily-billing-screen-ui,
          .no-print,
          nav,
          aside,
          header,
          footer,
          button,
          input,
          select {
            display: none !important;
          }

          body * {
            visibility: hidden;
          }

          .daily-billing-print-only,
          .daily-billing-print-only * {
            visibility: visible !important;
          }

          .daily-billing-print-only {
            display: block !important;
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            min-width: 100% !important;
            max-width: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
            background: #ffffff !important;
            color: #0f172a !important;
            overflow: visible !important;
          }

          .daily-billing-print-table {
            width: 100% !important;
            border-collapse: collapse !important;
            table-layout: auto !important;
          }

          .daily-billing-print-table thead {
            display: table-header-group !important;
          }

          .daily-billing-print-table tfoot {
            display: table-footer-group !important;
          }

          .daily-billing-print-table tr {
            break-inside: avoid !important;
            page-break-inside: avoid !important;
          }

          .daily-billing-print-table th,
          .daily-billing-print-table td {
            word-break: break-word !important;
          }
        }
      `}</style>

      {/* ─── DEDICATED PRINT PRESENTATION (VISIBLE ONLY IN PRINT) ─── */}
      <div className="daily-billing-print-only font-sans">
        {/* A. HOSPITAL HEADER */}
        <div className="border-b-2 border-slate-800 pb-3 mb-4">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              {logoLoaded && effectiveLogo ? (
                <img
                  src={effectiveLogo}
                  alt=""
                  className="h-12 w-auto max-w-[140px] object-contain"
                  onError={() => setLogoLoaded(false)}
                />
              ) : null}
              <div>
                <h1 className="text-lg font-bold tracking-tight text-slate-900 uppercase">
                  Safe Hands Hospital
                </h1>
                <p className="text-[10px] text-slate-600 font-medium leading-tight">
                  Hospital Management &amp; Clinical Information System
                </p>
              </div>
            </div>
            <div className="text-right">
              <h2 className="text-base font-bold text-slate-900 uppercase tracking-wider">
                DAILY BILLING REPORT
              </h2>
              <p className="text-[11px] text-slate-500 font-medium">
                Official Financial Summary Slip
              </p>
            </div>
          </div>

          {/* Metadata Grid */}
          <div className="mt-3 grid grid-cols-4 gap-2 text-[10px] bg-slate-50 border border-slate-200 rounded p-2 text-slate-800">
            <div>
              <span className="font-bold text-slate-600">Report Date:</span>{" "}
              <span className="font-semibold">{formatDateDDMMYYYY(reportDate)}</span>
            </div>
            <div>
              <span className="font-bold text-slate-600">Payment Method:</span>{" "}
              <span className="font-semibold">
                {methodFilter === "All" ? "All Methods" : methodFilter}
              </span>
            </div>
            <div>
              <span className="font-bold text-slate-600">Department:</span>{" "}
              <span className="font-semibold">
                {deptFilter === "All" ? "All Departments" : deptFilter}
              </span>
            </div>
            <div className="text-right">
              <span className="font-bold text-slate-600">Generated On:</span>{" "}
              <span className="font-semibold">{formatDateTimeDDMMYYYY(new Date())}</span>
            </div>
          </div>
        </div>

        {/* B. BILLING SUMMARY */}
        <div className="mb-4">
          <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wide mb-1.5 pb-1 border-b border-slate-200">
            Billing Summary
          </h3>
          <table className="w-full text-left border-collapse text-[10px] border border-slate-300">
            <thead>
              <tr className="bg-slate-100 border-b border-slate-300 text-slate-700 font-bold uppercase text-[9px]">
                <th className="p-1.5 border-r border-slate-300">Today's Revenue</th>
                <th className="p-1.5 border-r border-slate-300 text-center">Invoices Generated</th>
                <th className="p-1.5 border-r border-slate-300 text-right">Payments Collected</th>
                <th className="p-1.5 border-r border-slate-300 text-right">Pending Payments</th>
                <th className="p-1.5 text-right">Average Invoice</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-slate-200 font-semibold text-slate-900">
                <td className="p-1.5 border-r border-slate-300">
                  ₹{metrics.todayRevenue.toLocaleString()}
                </td>
                <td className="p-1.5 border-r border-slate-300 text-center">
                  {metrics.invoicesCount}
                </td>
                <td className="p-1.5 border-r border-slate-300 text-right">
                  ₹{(metrics.todayRevenue - metrics.outstanding).toLocaleString()}
                </td>
                <td className="p-1.5 border-r border-slate-300 text-right">
                  ₹{metrics.outstanding.toLocaleString()}
                </td>
                <td className="p-1.5 text-right">
                  ₹
                  {metrics.invoicesCount > 0
                    ? Math.round(metrics.todayRevenue / metrics.invoicesCount).toLocaleString()
                    : "0"}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* C. PAYMENT METHOD BREAKDOWN */}
        <div className="mb-4">
          <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wide mb-1.5 pb-1 border-b border-slate-200">
            Payment Method Breakdown
          </h3>
          <table className="w-full text-left border-collapse text-[10px] border border-slate-300">
            <thead>
              <tr className="bg-slate-100 border-b border-slate-300 text-slate-700 font-bold uppercase text-[9px]">
                <th className="p-1.5 border-r border-slate-300">Payment Method</th>
                <th className="p-1.5 border-r border-slate-300 text-right">Amount</th>
                <th className="p-1.5 text-right">Percentage</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-slate-800">
              <tr>
                <td className="p-1.5 border-r border-slate-300 font-medium">Cash</td>
                <td className="p-1.5 border-r border-slate-300 text-right font-semibold">
                  ₹{metrics.cashAmount.toLocaleString()}
                </td>
                <td className="p-1.5 text-right">
                  {metrics.totalPaid > 0
                    ? Math.round((metrics.cashAmount / metrics.totalPaid) * 100)
                    : 0}%
                </td>
              </tr>
              <tr>
                <td className="p-1.5 border-r border-slate-300 font-medium">UPI / GPay / PhonePe</td>
                <td className="p-1.5 border-r border-slate-300 text-right font-semibold">
                  ₹{metrics.upiAmount.toLocaleString()}
                </td>
                <td className="p-1.5 text-right">
                  {metrics.totalPaid > 0
                    ? Math.round((metrics.upiAmount / metrics.totalPaid) * 100)
                    : 0}%
                </td>
              </tr>
              <tr>
                <td className="p-1.5 border-r border-slate-300 font-medium">Credit / Debit Card</td>
                <td className="p-1.5 border-r border-slate-300 text-right font-semibold">
                  ₹{metrics.cardAmount.toLocaleString()}
                </td>
                <td className="p-1.5 text-right">
                  {metrics.totalPaid > 0
                    ? Math.round((metrics.cardAmount / metrics.totalPaid) * 100)
                    : 0}%
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* D. DAILY BILLING DETAILS */}
        <div className="mb-4">
          <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wide mb-1.5 pb-1 border-b border-slate-200">
            Daily Billing Details
          </h3>
          <table className="daily-billing-print-table w-full text-left border-collapse text-[9.5px] border border-slate-300">
            <thead>
              <tr className="bg-slate-100 border-b border-slate-300 text-slate-700 font-bold uppercase text-[8.5px]">
                <th className="p-1 border-r border-slate-300 text-center w-8">S.No</th>
                <th className="p-1 border-r border-slate-300">Invoice No</th>
                <th className="p-1 border-r border-slate-300">Patient Name</th>
                <th className="p-1 border-r border-slate-300">MRN</th>
                <th className="p-1 border-r border-slate-300">Department</th>
                <th className="p-1 border-r border-slate-300">Doctor</th>
                <th className="p-1 border-r border-slate-300">Invoice Date</th>
                <th className="p-1 border-r border-slate-300 text-center">Payment Method</th>
                <th className="p-1 border-r border-slate-300 text-right">Amount</th>
                <th className="p-1 border-r border-slate-300 text-right">Paid</th>
                <th className="p-1 border-r border-slate-300 text-right">Pending</th>
                <th className="p-1 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-slate-800">
              {filteredInvoices.map((inv, idx) => (
                <tr key={inv.id || idx} className="border-b border-slate-200">
                  <td className="p-1 border-r border-slate-300 text-center font-medium">
                    {idx + 1}
                  </td>
                  <td className="p-1 border-r border-slate-300 font-mono font-semibold">
                    {inv.billNumber || inv.id || "—"}
                  </td>
                  <td className="p-1 border-r border-slate-300 font-medium">
                    {inv.patientName || "—"}
                  </td>
                  <td className="p-1 border-r border-slate-300 font-mono">
                    {inv.mrn || "—"}
                  </td>
                  <td className="p-1 border-r border-slate-300">
                    {inv.department || "General OPD"}
                  </td>
                  <td className="p-1 border-r border-slate-300">
                    {inv.doctorName || "—"}
                  </td>
                  <td className="p-1 border-r border-slate-300 whitespace-nowrap">
                    {inv.invoiceDate || reportDate}
                  </td>
                  <td className="p-1 border-r border-slate-300 text-center">
                    {inv.paymentMethod || "Cash"}
                  </td>
                  <td className="p-1 border-r border-slate-300 text-right font-semibold">
                    ₹{(inv.invoiceAmount || 0).toLocaleString()}
                  </td>
                  <td className="p-1 border-r border-slate-300 text-right">
                    ₹{(inv.paidAmount || 0).toLocaleString()}
                  </td>
                  <td className="p-1 border-r border-slate-300 text-right">
                    ₹{(inv.balance || 0).toLocaleString()}
                  </td>
                  <td className="p-1 text-center font-medium">
                    {inv.paymentStatus || "Pending"}
                  </td>
                </tr>
              ))}
              {filteredInvoices.length === 0 && (
                <tr>
                  <td colSpan={12} className="p-4 text-center text-slate-500 font-medium italic">
                    No billing records found for the selected report criteria.
                  </td>
                </tr>
              )}
            </tbody>
            {filteredInvoices.length > 0 && (
              <tfoot>
                <tr className="bg-slate-100 border-t-2 border-slate-400 font-bold text-slate-900 text-[9.5px]">
                  <td colSpan={8} className="p-1.5 border-r border-slate-300 text-right uppercase">
                    Total ({filteredTotals.totalInvoices} Invoices):
                  </td>
                  <td className="p-1.5 border-r border-slate-300 text-right">
                    ₹{filteredTotals.totalBilled.toLocaleString()}
                  </td>
                  <td className="p-1.5 border-r border-slate-300 text-right">
                    ₹{filteredTotals.totalPaid.toLocaleString()}
                  </td>
                  <td className="p-1.5 border-r border-slate-300 text-right">
                    ₹{filteredTotals.totalPending.toLocaleString()}
                  </td>
                  <td className="p-1.5 text-center">—</td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>

        {/* E. PRINT FOOTER */}
        <div className="pt-2 border-t border-slate-300 flex items-center justify-between text-[9px] text-slate-500">
          <span>Generated from Safe Hands HMS</span>
          <span>Generated: {formatDateTimeDDMMYYYY(new Date())}</span>
        </div>
      </div>

      {/* ─── NORMAL APPLICATION SCREEN UI ─── */}
      <div className="daily-billing-screen-ui w-full flex-1 bg-[#F1F5F9] min-h-screen p-4 md:p-6 pb-28 md:pb-32 space-y-6">
        {/* 1. PAGE HEADER */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-white p-5 rounded-2xl border border-[#E5E7EB] shadow-sm">
          <div>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => navigate(-1)}
                className="flex items-center justify-center p-2 rounded-xl bg-white border border-[#E5E7EB] text-slate-700 text-xs font-semibold hover:bg-slate-50 transition-colors shadow-sm cursor-pointer"
                style={{ fontFamily: RB }}
              >
                <ArrowLeft size={16} />
              </button>
              <h1
                className="text-xl md:text-2xl font-bold text-[#111827] tracking-tight"
                style={{ fontFamily: PP }}
              >
                Daily Billing Report
              </h1>
            </div>
            <p
              className="text-xs md:text-sm text-[#64748B] mt-1.5"
              style={{ fontFamily: RB }}
            >
              View today's billing collections, invoice statistics, payment
              summaries, and cashier performance.
            </p>
          </div>
          <div className="flex items-center gap-2.5 shrink-0">
            <button
              onClick={() => window.print()}
              className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-white border border-[#E5E7EB] text-slate-700 text-xs font-semibold hover:bg-slate-50 transition-colors shadow-sm cursor-pointer"
              style={{ fontFamily: RB }}
            >
              <Printer size={14} />
              <span className="hidden sm:inline">Print Report</span>
            </button>
            <button
              onClick={handleResetFilters}
              className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-700 text-xs font-semibold hover:bg-slate-100 transition-colors shadow-sm cursor-pointer"
              style={{ fontFamily: RB }}
            >
              <RotateCcw size={14} />
              <span className="hidden sm:inline">Refresh</span>
            </button>
            <button
              onClick={handleExportCsv}
              className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-white border border-[#E5E7EB] text-slate-700 text-xs font-semibold hover:bg-slate-50 transition-colors shadow-sm cursor-pointer"
              style={{ fontFamily: RB }}
            >
              <Download size={14} className="text-emerald-600" />
              <span>Export CSV</span>
            </button>
          </div>
        </div>

        {/* 2. FILTER BAR */}
        <div className="bg-white p-4 rounded-2xl border border-[#E5E7EB] shadow-sm space-y-3">
          <div
            className="grid grid-cols-2 md:grid-cols-5 gap-3 text-xs"
            style={{ fontFamily: RB }}
          >
            <div>
              <span className="block text-slate-600 font-semibold mb-1">
                Report Date
                <input
                  aria-label="Input field"
                  type="date"
                  value={reportDate}
                  onChange={(e) => setReportDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-[#E5E7EB] bg-slate-50 font-medium"
                />
              </span>
            </div>
            <div>
              <span className="block text-slate-600 font-semibold mb-1">
                Payment Method
                <select
                  aria-label="Select option"
                  value={methodFilter}
                  onChange={(e) => setMethodFilter(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-[#E5E7EB] bg-slate-50 font-medium"
                >
                  <option value="All">All Methods</option>
                  <option value="Cash">Cash</option>
                  <option value="UPI">UPI</option>
                  <option value="Card">Card</option>
                </select>
              </span>
            </div>
            <div>
              <span className="block text-slate-600 font-semibold mb-1">
                Department
                <select
                  aria-label="Select option"
                  value={deptFilter}
                  onChange={(e) => setDeptFilter(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-[#E5E7EB] bg-slate-50 font-medium"
                >
                  <option value="All">All Departments</option>
                  {departmentBreakdown.map((d) => (
                    <option key={d.department} value={d.department}>
                      {d.department}
                    </option>
                  ))}
                </select>
              </span>
            </div>
            <div className="col-span-2 md:col-span-1 flex items-end justify-end gap-2">
              <button
                onClick={handleResetFilters}
                className="w-1/2 md:w-auto px-3 py-2 rounded-xl border border-slate-200 text-slate-600 font-medium hover:bg-slate-50 cursor-pointer"
              >
                Reset
              </button>
            </div>
          </div>
        </div>

        {/* 3. KPI CARDS */}
        <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-5 gap-4">
          <div className="bg-white p-4 rounded-2xl border border-[#E5E7EB] shadow-sm space-y-1">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-[11px] font-bold uppercase tracking-wider">
                Today's Revenue
              </span>
              <DollarSign size={16} className="text-[#0D47A1]" />
            </div>
            {isLoading ? (
              <div className="h-7 bg-slate-100 rounded animate-pulse" />
            ) : (
              <div
                className="text-xl font-bold text-[#0D47A1]"
                style={{ fontFamily: PP }}
              >
                ₹{metrics.todayRevenue.toLocaleString()}
              </div>
            )}
            <span className="text-[10px] text-[#66BB6A] font-semibold">
              Live Data
            </span>
          </div>
          <div className="bg-white p-4 rounded-2xl border border-[#E5E7EB] shadow-sm space-y-1">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-[11px] font-bold uppercase tracking-wider">
                Invoices Generated
              </span>
              <FileText size={16} className="text-slate-600" />
            </div>
            {isLoading ? (
              <div className="h-7 bg-slate-100 rounded animate-pulse" />
            ) : (
              <div
                className="text-xl font-bold text-[#111827]"
                style={{ fontFamily: PP }}
              >
                {metrics.invoicesCount}
              </div>
            )}
            <span className="text-[10px] text-slate-400">
              OPD Consultation Bills
            </span>
          </div>
          <div className="bg-white p-4 rounded-2xl border border-[#E5E7EB] shadow-sm space-y-1">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-[11px] font-bold uppercase tracking-wider">
                Payments Collected
              </span>
              <CheckCircle2 size={16} className="text-[#66BB6A]" />
            </div>
            {isLoading ? (
              <div className="h-7 bg-slate-100 rounded animate-pulse" />
            ) : (
              <div
                className="text-xl font-bold text-[#66BB6A]"
                style={{ fontFamily: PP }}
              >
                ₹{(metrics.todayRevenue - metrics.outstanding).toLocaleString()}
              </div>
            )}
            <span className="text-[10px] text-slate-500">
              Collection Rate: {metrics.collectionRate.toFixed(1)}%
            </span>
          </div>
          <div className="bg-white p-4 rounded-2xl border border-[#E5E7EB] shadow-sm space-y-1">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-[11px] font-bold uppercase tracking-wider">
                Pending Payments
              </span>
              <Clock size={16} className="text-[#F59E0B]" />
            </div>
            {isLoading ? (
              <div className="h-7 bg-slate-100 rounded animate-pulse" />
            ) : (
              <div
                className="text-xl font-bold text-[#F59E0B]"
                style={{ fontFamily: PP }}
              >
                ₹{metrics.outstanding.toLocaleString()}
              </div>
            )}
            <span className="text-[10px] text-amber-600 font-medium">
              Awaiting Settlement
            </span>
          </div>
          <div className="bg-white p-4 rounded-2xl border border-[#E5E7EB] shadow-sm space-y-1 col-span-2 md:col-span-4 xl:col-span-1">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-[11px] font-bold uppercase tracking-wider">
                Average Invoice
              </span>
              <CreditCard size={16} className="text-purple-600" />
            </div>
            {isLoading ? (
              <div className="h-7 bg-slate-100 rounded animate-pulse" />
            ) : (
              <div
                className="text-xl font-bold text-[#111827]"
                style={{ fontFamily: PP }}
              >
                ₹
                {metrics.invoicesCount > 0
                  ? Math.round(
                      metrics.todayRevenue / metrics.invoicesCount,
                    ).toLocaleString()
                  : "0"}
              </div>
            )}
            <span className="text-[10px] text-slate-400">Per Patient Bill</span>
          </div>
        </div>

        {/* 4. TWO-COLUMN LAYOUT */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <div className="xl:col-span-2 space-y-6">
            {/* PAYMENT METHOD BREAKDOWN */}
            <div className="bg-white rounded-2xl border border-[#E5E7EB] p-5 shadow-sm space-y-4">
              <div className="flex items-center gap-2 border-b border-gray-100 pb-3">
                <div className="w-8 h-8 rounded-xl bg-teal-50 text-[#009688] flex items-center justify-center font-bold">
                  <CreditCard size={16} />
                </div>
                <div>
                  <h2
                    className="text-sm font-bold text-[#111827]"
                    style={{ fontFamily: PP }}
                  >
                    PAYMENT METHOD BREAKDOWN
                  </h2>
                  <p
                    className="text-xs text-[#64748B]"
                    style={{ fontFamily: RB }}
                  >
                    Collection breakdown by channel
                  </p>
                </div>
              </div>
              <div
                className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs"
                style={{ fontFamily: RB }}
              >
                {[
                  {
                    method: "UPI / GPay / PhonePe",
                    amount: metrics.upiAmount,
                    pct:
                      metrics.totalPaid > 0
                        ? Math.round(
                            (metrics.upiAmount / metrics.totalPaid) * 100,
                          )
                        : 0,
                    color: "#009688",
                  },
                  {
                    method: "Cash",
                    amount: metrics.cashAmount,
                    pct:
                      metrics.totalPaid > 0
                        ? Math.round(
                            (metrics.cashAmount / metrics.totalPaid) * 100,
                          )
                        : 0,
                    color: "#0D47A1",
                  },
                  {
                    method: "Credit / Debit Card",
                    amount: metrics.cardAmount,
                    pct:
                      metrics.totalPaid > 0
                        ? Math.round(
                            (metrics.cardAmount / metrics.totalPaid) * 100,
                          )
                        : 0,
                    color: "#66BB6A",
                  },
                ].map((pm) => (
                  <div
                    key={pm.method}
                    className="p-3.5 rounded-xl border border-slate-100 bg-slate-50 flex items-center justify-between"
                  >
                    <div>
                      <div className="font-bold text-[#111827]">{pm.method}</div>
                      <div className="text-slate-400 text-[11px]">
                        {pm.pct}% of Total
                      </div>
                    </div>
                    <div className="text-right">
                      <div
                        className="font-bold text-sm text-[#0D47A1]"
                        style={{ fontFamily: PP }}
                      >
                        ₹{pm.amount.toLocaleString()}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* DEPARTMENT COLLECTION SUMMARY */}
            {departmentBreakdown.length > 0 && (
              <div className="bg-white rounded-2xl border border-[#E5E7EB] p-5 shadow-sm space-y-4">
                <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                  <div>
                    <h2
                      className="text-sm font-bold text-[#111827]"
                      style={{ fontFamily: PP }}
                    >
                      DEPARTMENT COLLECTION SUMMARY
                    </h2>
                    <p
                      className="text-xs text-[#64748B]"
                      style={{ fontFamily: RB }}
                    >
                      Revenue generated per medical department
                    </p>
                  </div>
                </div>
                <div className="overflow-x-auto border border-slate-200 rounded-xl">
                  <table
                    className="w-full text-left border-collapse text-xs"
                    style={{ fontFamily: RB }}
                  >
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 text-[#64748B] font-semibold text-[11px] uppercase tracking-wider">
                        <th className="py-2.5 px-4">Department</th>
                        <th className="py-2.5 px-4 text-center">Invoices</th>
                        <th className="py-2.5 px-4 text-right">Revenue</th>
                        <th className="py-2.5 px-4 text-right">Collected</th>
                        <th className="py-2.5 px-4 text-right">Pending</th>
                        <th className="py-2.5 px-4 text-right">Collection %</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {departmentBreakdown.map((dept) => (
                        <tr
                          key={dept.department}
                          className="hover:bg-slate-50/70 transition-colors"
                        >
                          <td className="py-3 px-4 font-bold text-[#111827]">
                            {dept.department}
                          </td>
                          <td className="py-3 px-4 text-center font-semibold">
                            {dept.invoices}
                          </td>
                          <td className="py-3 px-4 text-right text-slate-700">
                            ₹{dept.revenue.toLocaleString()}
                          </td>
                          <td className="py-3 px-4 text-right font-bold text-[#66BB6A]">
                            ₹{dept.collected.toLocaleString()}
                          </td>
                          <td className="py-3 px-4 text-right text-[#F59E0B]">
                            ₹{dept.pending.toLocaleString()}
                          </td>
                          <td className="py-3 px-4 text-right font-bold text-[#0D47A1]">
                            {dept.pct}%
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* RECENT INVOICES */}
            <div className="bg-white rounded-2xl border border-[#E5E7EB] p-5 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                <div>
                  <h3
                    className="text-sm font-bold text-[#111827]"
                    style={{ fontFamily: PP }}
                  >
                    RECENT TODAY'S INVOICES
                  </h3>
                  <p
                    className="text-xs text-[#64748B]"
                    style={{ fontFamily: RB }}
                  >
                    Top recent invoices generated today
                  </p>
                </div>
              </div>
              <div className="overflow-x-auto border border-slate-200 rounded-xl">
                <table
                  className="w-full text-left border-collapse text-xs"
                  style={{ fontFamily: RB }}
                >
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-[#64748B] font-semibold text-[11px] uppercase tracking-wider">
                      <th className="py-2.5 px-4">Invoice No</th>
                      <th className="py-2.5 px-4">Patient</th>
                      <th className="py-2.5 px-4">Doctor</th>
                      <th className="py-2.5 px-4 text-right">Amount</th>
                      <th className="py-2.5 px-4 text-center">Status</th>
                      <th className="py-2.5 px-4 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {invoices.slice(0, 10).map((inv) => (
                      <tr
                        key={inv.id}
                        className="hover:bg-slate-50/70 transition-colors"
                      >
                        <td className="py-3 px-4 font-mono font-bold text-[#0D47A1]">
                          {inv.id}
                        </td>
                        <td className="py-3 px-4 font-semibold text-[#111827]">
                          {inv.patientName}
                        </td>
                        <td className="py-3 px-4 text-slate-700">
                          {inv.doctorName}
                        </td>
                        <td className="py-3 px-4 text-right font-bold text-[#111827]">
                          ₹{inv.invoiceAmount.toLocaleString()}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <BillingStatusBadge status={inv.paymentStatus} />
                        </td>
                        <td className="py-3 px-4 text-center">
                          <button
                            onClick={() => navigate(`/billing/invoice/${inv.id}`)}
                            className="px-2.5 py-1 rounded-lg text-xs font-semibold text-[#0D47A1] bg-blue-50 hover:bg-blue-100 cursor-pointer"
                          >
                            <Eye size={13} className="inline mr-1" />
                            View
                          </button>
                        </td>
                      </tr>
                    ))}
                    {invoices.length === 0 && !isLoading && (
                      <tr>
                        <td
                          colSpan={6}
                          className="py-8 text-center text-slate-400 text-xs"
                        >
                          No invoices found for this date.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* RIGHT PANEL */}
          <div className="space-y-6">
            <div className="bg-white rounded-2xl border border-[#E5E7EB] p-5 shadow-sm space-y-4 sticky top-6">
              <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                <div>
                  <span className="text-[10px] text-[#0D47A1] font-bold tracking-widest uppercase">
                    Summary
                  </span>
                  <h3
                    className="text-sm font-bold text-[#111827]"
                    style={{ fontFamily: PP }}
                  >
                    Today's Billing Summary
                  </h3>
                </div>
                <span className="text-[10px] text-slate-400 font-medium">
                  Updated: {new Date().toLocaleTimeString()}
                </span>
              </div>
              <div
                className="space-y-2 text-xs border-b border-gray-100 pb-3"
                style={{ fontFamily: RB }}
              >
                <div className="flex justify-between text-slate-600">
                  <span>Today's Revenue:</span>
                  <span className="font-bold text-[#0D47A1]">
                    ₹{metrics.todayRevenue.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between text-[#66BB6A] font-semibold">
                  <span>Total Collected:</span>
                  <span>
                    ₹
                    {(
                      metrics.todayRevenue - metrics.outstanding
                    ).toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between text-[#F59E0B] font-semibold">
                  <span>Pending Amount:</span>
                  <span>₹{metrics.outstanding.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Invoices Generated:</span>
                  <span className="font-bold text-[#111827]">
                    {metrics.invoicesCount} bills
                  </span>
                </div>
              </div>
              <div
                className="p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs space-y-1.5"
                style={{ fontFamily: RB }}
              >
                <div
                  className="font-bold text-[#111827]"
                  style={{ fontFamily: PP }}
                >
                  Payment Method Split
                </div>
                <div className="flex justify-between text-[11px]">
                  <span className="text-slate-500">Digital (UPI + Card):</span>
                  <span className="font-bold text-[#0D47A1]">
                    ₹{(metrics.upiAmount + metrics.cardAmount).toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between text-[11px]">
                  <span className="text-slate-500">Cash Collections:</span>
                  <span className="font-bold text-slate-700">
                    ₹{metrics.cashAmount.toLocaleString()}
                  </span>
                </div>
              </div>
              <button
                onClick={() => window.print()}
                className="w-full py-3 rounded-xl bg-[#0D47A1] text-white text-xs font-bold hover:bg-blue-900 transition-colors shadow-sm cursor-pointer"
                style={{ fontFamily: PP }}
              >
                Print Daily Report
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
