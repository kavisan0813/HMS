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

export function DailyBillingReportPage() {
  const navigate = useNavigate();

  const [reportDate, setReportDate] = useState(
    () => new Date().toISOString().split("T")[0],
  );
  const [, setCashierFilter] = useState("All");
  const [methodFilter, setMethodFilter] = useState("All");
  const [deptFilter, setDeptFilter] = useState("All");

  // API hooks
  const { data: dashboardData, isLoading: dashboardLoading } =
    useBillingDashboard({ fromDate: reportDate, toDate: reportDate });
  const { data: billsData, isLoading: billsLoading } = useBillingList({
    page: 0,
    size: 200,
  });

  const invoices = useMemo(
    () => (billsData?.bills || []).map(mapApiBillToInvoiceRecord),
    [billsData],
  );

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

  const handleExportAllCsv = () => {
    // 1. Summary KPI Cards
    const kpiRows = [
      {
        Section: "1. SUMMARY KPI CARDS",
        Category_Item: "Today's Billed Revenue",
        Count_or_Amount: `INR ${metrics.todayRevenue}`,
        Percentage_Share: "100%",
        Primary_Detail: "Total Billed Revenue Today",
        Secondary_Detail: "Operational Daily Billing Total",
        Date_or_Status: "Total Billed",
      },
      {
        Section: "1. SUMMARY KPI CARDS",
        Category_Item: "Payments Collected",
        Count_or_Amount: `INR ${metrics.todayRevenue - metrics.outstanding}`,
        Percentage_Share: `${metrics.collectionRate.toFixed(1)}%`,
        Primary_Detail: "Total Realized Collections Today",
        Secondary_Detail: "Collection Rate Performance",
        Date_or_Status: "Collected Total",
      },
      {
        Section: "1. SUMMARY KPI CARDS",
        Category_Item: "Pending Payments Outstanding",
        Count_or_Amount: `INR ${metrics.outstanding}`,
        Percentage_Share: `${(100 - metrics.collectionRate).toFixed(1)}%`,
        Primary_Detail: "Uncollected Due Balances",
        Secondary_Detail: "Awaiting Settlement",
        Date_or_Status: "Outstanding",
      },
    ];

    // 2. Chart Performance: Payment Method Distribution Graph Share (%)
    const methodTotal =
      metrics.upiAmount + metrics.cashAmount + metrics.cardAmount || 1;
    const methodRows = [
      {
        Section: "2. PAYMENT METHOD GRAPH SHARE",
        Category_Item: "UPI",
        Count_or_Amount: `INR ${metrics.upiAmount}`,
        Percentage_Share: `${((metrics.upiAmount / methodTotal) * 100).toFixed(1)}%`,
        Primary_Detail: "Digital UPI Collections",
        Secondary_Detail: "Payment Method Breakdown",
        Date_or_Status: "Active",
      },
      {
        Section: "2. PAYMENT METHOD GRAPH SHARE",
        Category_Item: "Cash",
        Count_or_Amount: `INR ${metrics.cashAmount}`,
        Percentage_Share: `${((metrics.cashAmount / methodTotal) * 100).toFixed(1)}%`,
        Primary_Detail: "Counter Cash Collections",
        Secondary_Detail: "Payment Method Breakdown",
        Date_or_Status: "Active",
      },
      {
        Section: "2. PAYMENT METHOD GRAPH SHARE",
        Category_Item: "Card",
        Count_or_Amount: `INR ${metrics.cardAmount}`,
        Percentage_Share: `${((metrics.cardAmount / methodTotal) * 100).toFixed(1)}%`,
        Primary_Detail: "Card POS Terminal Collections",
        Secondary_Detail: "Payment Method Breakdown",
        Date_or_Status: "Active",
      },
    ];

    // 3. Chart Performance: Department Breakdown Graph Share (%)
    const totalDeptBilled =
      departmentBreakdown.reduce((sum, d) => sum + d.revenue, 0) || 1;
    const deptRows = departmentBreakdown.map((dept) => {
      const pct = ((dept.revenue / totalDeptBilled) * 100).toFixed(1);
      return {
        Section: "3. DEPARTMENT BREAKDOWN GRAPH SHARE",
        Category_Item: dept.department,
        Count_or_Amount: `INR ${dept.revenue} (${dept.invoices} Invoices)`,
        Percentage_Share: `${pct}%`,
        Primary_Detail: `Department Billed Total (Collected: INR ${dept.collected})`,
        Secondary_Detail: `Collection Rate: ${dept.pct}%`,
        Date_or_Status: "Active",
      };
    });

    // 4. Table Values: Detailed Invoice Registry
    const recordRows = invoices.map((rec) => ({
      Section: "4. DAILY INVOICE TABLE REGISTRY",
      Category_Item: rec.id || "N/A",
      Count_or_Amount: `Billed: INR ${rec.invoiceAmount || 0} (Paid: INR ${rec.paidAmount || 0})`,
      Percentage_Share:
        rec.invoiceAmount > 0
          ? `${(((rec.paidAmount || 0) / rec.invoiceAmount) * 100).toFixed(1)}%`
          : "0%",
      Primary_Detail: `Patient: ${rec.patientName} (${rec.mrn})`,
      Secondary_Detail: `Dept: ${rec.department} | Method: ${rec.paymentMethod}`,
      Date_or_Status: `Date: ${rec.invoiceDate || reportDate} | Status: ${rec.paymentStatus}`,
    }));

    const allRows = [...kpiRows, ...methodRows, ...deptRows, ...recordRows];

    exportDataToCsv(
      `Daily_Billing_Collection_Rate_Report_${new Date().toISOString().slice(0, 10)}.csv`,
      allRows,
    );
  };

  return (
    <div className="w-full flex-1 bg-[#F1F5F9] min-h-screen p-4 md:p-6 pb-28 md:pb-32 space-y-6">
      {/* 1. PAGE HEADER */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-white p-5 rounded-2xl border border-[#E5E7EB] shadow-sm">
        <div>
          <h1
            className="text-xl md:text-2xl font-bold text-[#111827] tracking-tight"
            style={{ fontFamily: PP }}
          >
            Daily Billing Report
          </h1>
          <p
            className="text-xs md:text-sm text-[#64748B] mt-0.5"
            style={{ fontFamily: RB }}
          >
            View today's billing collections, invoice statistics, payment
            summaries, and cashier performance.
          </p>
        </div>
        <div className="flex items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-white border border-[#E5E7EB] text-slate-700 text-xs font-semibold hover:bg-slate-50 transition-colors shadow-sm cursor-pointer"
            style={{ fontFamily: RB }}
          >
            <ArrowLeft size={14} />
            <span>Back</span>
          </button>
          <button
            onClick={() => window.print()}
            className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-white border border-[#E5E7EB] text-slate-700 text-xs font-semibold hover:bg-slate-50 transition-colors shadow-sm"
            style={{ fontFamily: RB }}
          >
            <Printer size={14} />
            <span className="hidden sm:inline">Print Report</span>
          </button>
          <button
            onClick={handleResetFilters}
            className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-700 text-xs font-semibold hover:bg-slate-100 transition-colors shadow-sm"
            style={{ fontFamily: RB }}
          >
            <RotateCcw size={14} />
            <span className="hidden sm:inline">Refresh</span>
          </button>
          <button
            onClick={handleExportAllCsv}
            className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-white border border-[#E5E7EB] text-slate-700 text-xs font-semibold hover:bg-slate-50 transition-colors shadow-sm cursor-pointer"
            style={{ fontFamily: RB }}
          >
            <Download size={14} className="text-emerald-600" />
            <span>Export Report</span>
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
              className="w-1/2 md:w-auto px-3 py-2 rounded-xl border border-slate-200 text-slate-600 font-medium hover:bg-slate-50"
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
                          className="px-2.5 py-1 rounded-lg text-xs font-semibold text-[#0D47A1] bg-blue-50 hover:bg-blue-100"
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
              className="w-full py-3 rounded-xl bg-[#0D47A1] text-white text-xs font-bold hover:bg-blue-900 transition-colors shadow-sm"
              style={{ fontFamily: PP }}
            >
              Print Daily Report
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
