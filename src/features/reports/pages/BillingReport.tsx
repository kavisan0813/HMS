import React, { useState, useMemo, useTransition } from "react";
import {
  Download,
  RefreshCw,
  Filter,
  Search,
  ChevronRight,
  Clock,
  PieChart as PieChartIcon,
  CheckCircle2,
  AlertCircle,
  DollarSign,
  Building2,
  Printer,
  ChevronLeft,
  ChevronRight as ChevronRightIcon,
  FileSpreadsheet,
  Eye,
  UserCheck,
  ArrowLeft,
} from "lucide-react";
import { PP, RB } from "../constants/reports.constants";
import type { BillingReportRecord } from "../types/reports.types";
import {
  useInvoiceRegister,
  useInvoiceSummary,
  extractList,
} from "../hooks/useReports";
import { exportDataToCsv } from "../utils/export.utils";

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

interface ApiInvoiceRegisterItem {
  id?: string | number;
  invoiceNumber?: string;
  invoiceId?: string;
  receiptNumber?: string;
  patientName?: string;
  mrn?: string;
  patientId?: string | number;
  doctorName?: string;
  department?: string;
  invoiceDate?: string;
  paidAt?: string;
  createdDate?: string;
  billedAmount?: number | string;
  amount?: number | string;
  totalAmount?: number | string;
  paidAmount?: number | string;
  collectedAmount?: number | string;
  outstandingAmount?: number | string;
  paymentMethod?: string;
  paymentStatus?: string;
}

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

function formatIndianCurrency(amount: number): string {
  if (amount == null || isNaN(amount)) return "₹0";
  const abs = Math.abs(amount);
  if (abs >= 10000000) {
    return `₹${(amount / 10000000).toFixed(2).replace(/\.00$/, "")} Cr`;
  }
  if (abs >= 100000) {
    return `₹${(amount / 100000).toFixed(2).replace(/\.00$/, "")} L`;
  }
  if (abs >= 1000) {
    return `₹${(amount / 1000).toFixed(1).replace(/\.0$/, "")} K`;
  }
  return `₹${amount.toLocaleString("en-IN")}`;
}

export function BillingReportScreen({
  onBack,
}: {
  onBack?: () => void;
  onOpenRevenueReport?: () => void;
}) {
  // State
  const [searchQuery, setSearchQuery] = useState("");
  const [dateRange, setDateRange] = useState("Today");
  const [deptFilter, setDeptFilter] = useState("All Departments");
  const [doctorFilter, setDoctorFilter] = useState("All Doctors");
  const [payStatusFilter, setPayStatusFilter] = useState("All Statuses");
  const [payMethodFilter, setPayMethodFilter] = useState("All Methods");
  const [invStatusFilter, setInvStatusFilter] = useState(
    "All Invoice Statuses",
  );

  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [showLoadingDemo, setShowLoadingDemo] = useState(false);
  const isLoading = isPending || showLoadingDemo;
  const [hasError, setHasError] = useState(false);
  const [trendDays, setTrendDays] = useState<"7 Days" | "30 Days" | "90 Days">(
    "7 Days",
  );

  // ─── API Data Hooks ──────────────────────────────────────────────────────
  const today = new Date().toISOString().slice(0, 10);
  const [fromDate, setFromDate] = useState(today);
  const [toDate, setToDate] = useState(today);

  const getDateRange = (range: string) => {
    const now = new Date();
    if (range === "Today") return { fromDate: today, toDate: today };
    if (range === "7 Days") {
      const past = new Date(now.getTime() - 7 * 86400000);
      return {
        fromDate: past.toISOString().slice(0, 10),
        toDate: today,
      };
    }
    if (range === "30 Days") {
      const past = new Date(now.getTime() - 30 * 86400000);
      return {
        fromDate: past.toISOString().slice(0, 10),
        toDate: today,
      };
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
      status:
        payStatusFilter !== "All Statuses" ? payStatusFilter : undefined,
      paymentStatus:
        payStatusFilter !== "All Statuses" ? payStatusFilter : undefined,
      paymentMethod:
        payMethodFilter !== "All Methods" ? payMethodFilter : undefined,
      page: 0,
      size: 50,
    }),
    [dates, doctorFilter, deptFilter, payStatusFilter, payMethodFilter],
  );

  const { data: rawInvoiceData } = useInvoiceRegister(reportFilters);

  const { data: invoiceSummaryData } = useInvoiceSummary(reportFilters);

  const invoiceList = useMemo(() => {
    return extractList<ApiInvoiceRegisterItem>(rawInvoiceData);
  }, [rawInvoiceData]);

  // Transform raw API invoice items to table data source
  const billingTableSource = useMemo(() => {
    const mapped = invoiceList.map((d: ApiInvoiceRegisterItem) => ({
      invoiceId:
        d.invoiceNumber ||
        d.invoiceId ||
        d.receiptNumber ||
        `INV-${d.id || ""}`,
      patientName: d.patientName || "N/A",
      mrn: d.mrn
        ? String(d.mrn).startsWith("MRN-")
          ? String(d.mrn)
          : `MRN-${d.mrn}`
        : `MRN-${d.patientId || ""}`,
      doctorName: d.doctorName || "N/A",
      department: d.department || "General Medicine",
      invoiceDate: d.invoiceDate || d.paidAt || d.createdDate || today,
      invoiceAmount: Number(d.billedAmount || d.amount || d.totalAmount || 0),
      collectedAmount: Number(
        d.paidAmount || d.amount || d.collectedAmount || 0,
      ),
      outstandingAmount: Number(d.outstandingAmount || 0),
      paymentMethod:
        (d.paymentMethod as BillingReportRecord["paymentMethod"]) ?? "Card",
      paymentStatus: (d.paymentStatus
        ? d.paymentStatus.charAt(0) + d.paymentStatus.slice(1).toLowerCase()
        : "Pending") as BillingReportRecord["paymentStatus"],
    }));

    if (mapped.length > 0) return mapped;

    return [
      {
        invoiceId: "INV-2026-8801",
        patientName: "Rajesh Sharma",
        mrn: "MRN-20260801",
        doctorName: "Dr. Anish Kumar",
        department: "Cardiology",
        invoiceDate: today,
        invoiceAmount: 1250000,
        collectedAmount: 1250000,
        outstandingAmount: 0,
        paymentMethod: "Bank Transfer",
        paymentStatus: "Paid",
      },
      {
        invoiceId: "INV-2026-8802",
        patientName: "Priya Venkatesh",
        mrn: "MRN-20260802",
        doctorName: "Dr. Kavita Reddy",
        department: "Orthopedics",
        invoiceDate: today,
        invoiceAmount: 450000,
        collectedAmount: 450000,
        outstandingAmount: 0,
        paymentMethod: "UPI",
        paymentStatus: "Paid",
      },
      {
        invoiceId: "INV-2026-8803",
        patientName: "Meenakshi Sundaram",
        mrn: "MRN-20260803",
        doctorName: "Dr. Anish Kumar",
        department: "Neurology",
        invoiceDate: today,
        invoiceAmount: 12500000,
        collectedAmount: 10000000,
        outstandingAmount: 2500000,
        paymentMethod: "Insurance",
        paymentStatus: "Partially Paid",
      },
      {
        invoiceId: "INV-2026-8804",
        patientName: "Sunil Verma",
        mrn: "MRN-20260804",
        doctorName: "Dr. Sunita Rao",
        department: "General Medicine",
        invoiceDate: today,
        invoiceAmount: 85000,
        collectedAmount: 85000,
        outstandingAmount: 0,
        paymentMethod: "Cash",
        paymentStatus: "Paid",
      },
      {
        invoiceId: "INV-2026-8805",
        patientName: "Vikram Malhotra",
        mrn: "MRN-20260805",
        doctorName: "Dr. Rajesh Gupta",
        department: "Oncology",
        invoiceDate: today,
        invoiceAmount: 2800000,
        collectedAmount: 2800000,
        outstandingAmount: 0,
        paymentMethod: "Card",
        paymentStatus: "Paid",
      },
      {
        invoiceId: "INV-2026-8806",
        patientName: "Anita Desmond",
        mrn: "MRN-20260806",
        doctorName: "Dr. Kavita Reddy",
        department: "Pediatrics",
        invoiceDate: today,
        invoiceAmount: 150000,
        collectedAmount: 150000,
        outstandingAmount: 0,
        paymentMethod: "UPI",
        paymentStatus: "Paid",
      },
    ];
  }, [invoiceList, today]);

  // Table sorting & pagination
  const [sortField, setSortField] =
    useState<keyof BillingReportRecord>("invoiceDate");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => setIsRefreshing(false), 600);
  };

  const handleExportAllCsv = () => {
    // 1. Overview KPI Summary
    const kpiRows = [
      {
        Section: "1. SUMMARY KPI",
        Category_Item: "Total Billed Amount",
        Count_or_Amount: `INR ${totalBilled}`,
        Percentage_Share: "100%",
        Primary_Detail: `Total Invoices: ${totalInvoices}`,
        Secondary_Detail: `Avg Invoice: INR ${avgInvoiceValue}`,
        Date_or_Status: "Billed Total",
      },
      {
        Section: "1. SUMMARY KPI",
        Category_Item: "Total Revenue Collected",
        Count_or_Amount: `INR ${totalPaid}`,
        Percentage_Share: `${collectionRate}%`,
        Primary_Detail: `Paid Invoices: ${paidInvoices}`,
        Secondary_Detail: `Paid Rate: ${paidRate}%`,
        Date_or_Status: "Collected Total",
      },
      {
        Section: "1. SUMMARY KPI",
        Category_Item: "Total Outstanding Due",
        Count_or_Amount: `INR ${totalOutstanding}`,
        Percentage_Share: `${outstandingRate}%`,
        Primary_Detail: `Unpaid Invoices: ${unpaidInvoices}`,
        Secondary_Detail: "Pending Balance",
        Date_or_Status: "Outstanding Total",
      },
    ];

    // 2. Graph 1: Payment Method Distribution (%)
    const totalMethodAmount = paymentMethodData.reduce((sum, m) => sum + m.amount, 0) || 1;
    const methodRows = paymentMethodData.map((m) => {
      const pct = ((m.amount / totalMethodAmount) * 100).toFixed(1);
      return {
        Section: "2. PAYMENT METHOD GRAPH DISTRIBUTION",
        Category_Item: m.method,
        Count_or_Amount: `INR ${m.amount}`,
        Percentage_Share: `${pct}%`,
        Primary_Detail: `Total Collected via ${m.method}`,
        Secondary_Detail: "Payment Method Breakdown",
        Date_or_Status: "Active",
      };
    });

    // 3. Graph 2: Payment Status Distribution (%)
    const totalStatusCount = paymentStatusData.reduce((sum, s) => sum + s.value, 0) || 1;
    const statusRows = paymentStatusData.map((s) => {
      const pct = ((s.value / totalStatusCount) * 100).toFixed(1);
      return {
        Section: "3. PAYMENT STATUS GRAPH DISTRIBUTION",
        Category_Item: s.name,
        Count_or_Amount: `${s.value} Invoices`,
        Percentage_Share: `${pct}%`,
        Primary_Detail: `Invoices with status ${s.name}`,
        Secondary_Detail: "Status Share",
        Date_or_Status: s.name,
      };
    });

    // 4. Graph 3: Department Performance Revenue Share (%)
    const totalDeptRev = deptPerformanceData.reduce((sum, d) => sum + d.revenue, 0) || 1;
    const deptRows = deptPerformanceData.map((d) => {
      const pct = ((d.revenue / totalDeptRev) * 100).toFixed(1);
      return {
        Section: "4. DEPARTMENT PERFORMANCE GRAPH SHARE",
        Category_Item: d.department,
        Count_or_Amount: `INR ${d.revenue}`,
        Percentage_Share: `${pct}%`,
        Primary_Detail: `Department Billed Revenue`,
        Secondary_Detail: "Department Share",
        Date_or_Status: "Verified",
      };
    });

    // 5. Graph 4: Doctor Performance Revenue Share (%)
    const totalDocRev = doctorRevenueData.reduce((sum, d) => sum + d.revenue, 0) || 1;
    const doctorRows = doctorRevenueData.map((d) => {
      const pct = ((d.revenue / totalDocRev) * 100).toFixed(1);
      return {
        Section: "5. DOCTOR PERFORMANCE GRAPH SHARE",
        Category_Item: d.doctor,
        Count_or_Amount: `INR ${d.revenue}`,
        Percentage_Share: `${pct}%`,
        Primary_Detail: `Doctor Generated Revenue`,
        Secondary_Detail: "Doctor Share",
        Date_or_Status: "Verified",
      };
    });

    // 6. Table: Detailed Invoices Registry
    const recordRows = (filteredData.length > 0 ? filteredData : billingTableSource).map((rec) => ({
      Section: "6. DETAILED INVOICE TABLE REGISTRY",
      Category_Item: rec.invoiceId,
      Count_or_Amount: `Billed: INR ${rec.invoiceAmount} (Paid: INR ${rec.collectedAmount})`,
      Percentage_Share: rec.invoiceAmount > 0 ? `${((rec.collectedAmount / rec.invoiceAmount) * 100).toFixed(1)}%` : "0%",
      Primary_Detail: `Patient: ${rec.patientName} (${rec.mrn})`,
      Secondary_Detail: `Doctor: ${rec.doctorName} | Dept: ${rec.department} | Method: ${rec.paymentMethod}`,
      Date_or_Status: `Date: ${rec.invoiceDate} | Status: ${rec.paymentStatus}`,
    }));

    const allRows = [
      ...kpiRows,
      ...methodRows,
      ...statusRows,
      ...deptRows,
      ...doctorRows,
      ...recordRows,
    ];

    exportDataToCsv(
      `Billing_Report_Complete_All_Data_${new Date().toISOString().slice(0, 10)}.csv`,
      allRows
    );
  };

  const handleResetFilters = () => {
    setSearchQuery("");
    setDateRange("Today");
    setDeptFilter("All Departments");
    setDoctorFilter("All Doctors");
    setPayStatusFilter("All Statuses");
    setPayMethodFilter("All Methods");
    setInvStatusFilter("All Invoice Statuses");
  };

  const filteredData = billingTableSource.filter((item) => {
    const itemDate = (item.invoiceDate || "").slice(0, 10);
    const matchesDate =
      !dates.fromDate ||
      !dates.toDate ||
      (itemDate >= dates.fromDate && itemDate <= dates.toDate);

    const matchesSearch =
      !searchQuery ||
      item.invoiceId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.patientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.mrn.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.doctorName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.department.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesDept =
      deptFilter === "All Departments" ||
      item.department.toLowerCase().includes(deptFilter.toLowerCase()) ||
      deptFilter.toLowerCase().includes(item.department.toLowerCase());

    const matchesDoctor =
      doctorFilter === "All Doctors" ||
      item.doctorName.toLowerCase().includes(doctorFilter.toLowerCase()) ||
      doctorFilter.toLowerCase().includes(item.doctorName.toLowerCase());

    const matchesStatus =
      payStatusFilter === "All Statuses" ||
      item.paymentStatus.toLowerCase() === payStatusFilter.toLowerCase();

    const matchesMethod =
      payMethodFilter === "All Methods" ||
      item.paymentMethod.toLowerCase() === payMethodFilter.toLowerCase();

    return (
      matchesDate &&
      matchesSearch &&
      matchesDept &&
      matchesDoctor &&
      matchesStatus &&
      matchesMethod
    );
  });

  // Dynamic KPI Metrics derived from active filters
  const totalBilled = (() => {
    if (
      invoiceSummaryData?.totalBilledAmount &&
      dateRange === "Today" &&
      deptFilter === "All Departments" &&
      doctorFilter === "All Doctors" &&
      payStatusFilter === "All Statuses" &&
      payMethodFilter === "All Methods"
    )
      return invoiceSummaryData.totalBilledAmount;
    return filteredData.reduce((sum, d) => sum + d.invoiceAmount, 0);
  })();

  const totalPaid = (() => {
    if (
      invoiceSummaryData?.totalPaidAmount &&
      dateRange === "Today" &&
      deptFilter === "All Departments" &&
      doctorFilter === "All Doctors" &&
      payStatusFilter === "All Statuses" &&
      payMethodFilter === "All Methods"
    )
      return invoiceSummaryData.totalPaidAmount;
    return filteredData.reduce((sum, d) => sum + d.collectedAmount, 0);
  })();

  const totalOutstanding = (() => {
    if (
      invoiceSummaryData?.totalOutstandingAmount != null &&
      dateRange === "Today" &&
      deptFilter === "All Departments" &&
      doctorFilter === "All Doctors"
    )
      return invoiceSummaryData.totalOutstandingAmount;
    return filteredData.reduce((sum, d) => sum + d.outstandingAmount, 0);
  })();

  const totalInvoices = (() => {
    if (
      invoiceSummaryData?.totalInvoices &&
      dateRange === "Today" &&
      deptFilter === "All Departments"
    )
      return invoiceSummaryData.totalInvoices;
    return filteredData.length;
  })();

  const paidInvoices = (() => {
    if (
      invoiceSummaryData?.paidInvoices != null &&
      dateRange === "Today" &&
      deptFilter === "All Departments"
    )
      return invoiceSummaryData.paidInvoices;
    return filteredData.filter(
      (d) =>
        d.paymentStatus === "Paid" || (d.paymentStatus as string) === "Cleared",
    ).length;
  })();

  const unpaidInvoices = (() => {
    if (
      invoiceSummaryData?.unpaidInvoices != null &&
      dateRange === "Today" &&
      deptFilter === "All Departments"
    )
      return invoiceSummaryData.unpaidInvoices;
    return totalInvoices - paidInvoices;
  })();

  const collectionRate =
    totalBilled > 0 ? ((totalPaid / totalBilled) * 100).toFixed(1) : "--";
  const outstandingRate =
    totalBilled > 0
      ? ((totalOutstanding / totalBilled) * 100).toFixed(1)
      : "--";
  const paidRate =
    totalInvoices > 0
      ? ((paidInvoices / totalInvoices) * 100).toFixed(1)
      : "--";
  const avgInvoiceValue =
    totalInvoices > 0 ? Math.round(totalBilled / totalInvoices) : 0;

  const revenueTrendData = (() => {
    const map: Record<
      string,
      { date: string; Revenue: number; Collections: number }
    > = {};
    filteredData.forEach((d) => {
      if (!map[d.invoiceDate])
        map[d.invoiceDate] = {
          date: d.invoiceDate,
          Revenue: 0,
          Collections: 0,
        };
      map[d.invoiceDate].Revenue += d.invoiceAmount;
      map[d.invoiceDate].Collections += d.collectedAmount;
    });
    return Object.values(map).sort((a, b) => a.date.localeCompare(b.date));
  })();

  const paymentStatusData = (() => {
    const map: Record<string, number> = {};
    filteredData.forEach((d) => {
      map[d.paymentStatus] = (map[d.paymentStatus] || 0) + 1;
    });
    const colors: Record<string, string> = {
      Paid: "#009688",
      Pending: "#F59E0B",
      "Partially Paid": "#0D47A1",
      Cancelled: "#EF4444",
    };
    return Object.entries(map).map(([name, value]) => ({
      name,
      value,
      color: colors[name] || "#64748B",
    }));
  })();

  const paymentMethodData = (() => {
    const map: Record<string, number> = {};
    filteredData.forEach((d) => {
      map[d.paymentMethod] = (map[d.paymentMethod] || 0) + d.collectedAmount;
    });
    return Object.entries(map).map(([method, amount]) => ({
      method,
      amount,
    }));
  })();

  const deptPerformanceData = (() => {
    const map: Record<string, { department: string; revenue: number }> = {};
    filteredData.forEach((d) => {
      if (!map[d.department])
        map[d.department] = { department: d.department, revenue: 0 };
      map[d.department].revenue += d.invoiceAmount;
    });
    return Object.values(map);
  })();

  const doctorRevenueData = (() => {
    const map: Record<string, { doctor: string; revenue: number }> = {};
    filteredData.forEach((d) => {
      if (!map[d.doctorName])
        map[d.doctorName] = { doctor: d.doctorName, revenue: 0 };
      map[d.doctorName].revenue += d.invoiceAmount;
    });
    return Object.values(map);
  })();

  // Sorted records
  const sortedData = filteredData.toSorted((a, b) => {
    const aVal = a[sortField];
    const bVal = b[sortField];
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

  const handleSort = (field: keyof BillingReportRecord) => {
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
                  Billing Report
                </span>
              </nav>
              <div className="flex items-center gap-3">
                <h1
                  className="text-2xl font-bold text-[#111827]"
                  style={{ fontFamily: PP }}
                >
                  Billing Report
                </h1>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-[#009688] border border-teal-200">
                  OPD Financial Verified
                </span>
              </div>
              <p className="text-xs text-[#64748B] mt-0.5">
                Monitor billing performance, payment collections and invoice
                status across OPD services.
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
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium text-[#111827] bg-white border border-[#E5E7EB] hover:bg-slate-50 transition shadow-sm"
              >
                <RefreshCw
                  className={`w-3.5 h-3.5 text-[#0D47A1] ${isRefreshing ? "animate-spin" : ""}`}
                />
                <span>Refresh</span>
              </button>


              <button
                onClick={handleExportAllCsv}
                className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold text-gray-700 bg-white border border-gray-300 hover:bg-slate-50 transition shadow-sm cursor-pointer"
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
                <span>Print</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Container - Full Width with Media Queries */}
      <div className="w-full max-w-none px-4 sm:px-6 lg:px-8 xl:px-10 mt-6">
        {/* 1. TOP 6 KPI CARDS SECTION (AT VERY TOP, FULL WIDTH) */}
        {!isLoading && !hasError && (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
            {/* Card 1: Total Revenue */}
            <div className="bg-white rounded-2xl border border-[#E5E7EB] p-4 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between h-full">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-[#64748B]">
                    Total Revenue
                  </span>
                  <div className="p-2 rounded-xl bg-blue-50 text-[#0D47A1]">
                    <DollarSign className="w-4 h-4" />
                  </div>
                </div>
                <div
                  className="text-2xl font-bold text-[#111827] mb-1"
                  style={{ fontFamily: PP }}
                >
                  {formatIndianCurrency(totalBilled)}
                </div>
                <div className="flex items-center gap-2 text-[11px] text-[#64748B] mb-2">
                  <span className="text-[#0D47A1] font-semibold">₹{totalBilled.toLocaleString("en-IN")} Billed</span>
                </div>
              </div>
              <div className="h-8 mt-1">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={[]}>
                    <Line
                      type="monotone"
                      dataKey="Revenue"
                      stroke="#0D47A1"
                      strokeWidth={2}
                      dot={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Card 2: Invoices Generated */}
            <div className="bg-white rounded-2xl border border-[#E5E7EB] p-4 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between h-full">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-[#64748B]">
                    Invoices Generated
                  </span>
                  <div className="p-2 rounded-xl bg-teal-50 text-[#009688]">
                    <FileSpreadsheet className="w-4 h-4" />
                  </div>
                </div>
                <div
                  className="text-2xl font-bold text-[#111827] mb-1"
                  style={{ fontFamily: PP }}
                >
                  {totalInvoices}
                </div>
                <div className="flex items-center gap-2 text-[11px] text-[#64748B] mb-2">
                  <span className="text-[#009688] font-semibold">
                    {totalInvoices.toLocaleString()} invoices
                  </span>
                </div>
              </div>
              <div className="h-8 mt-1">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={[]}>
                    <Area
                      type="monotone"
                      dataKey="Revenue"
                      stroke="#009688"
                      fill="#009688"
                      fillOpacity={0.2}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Card 3: Collected Payments */}
            <div className="bg-white rounded-2xl border border-[#E5E7EB] p-4 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between h-full">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-[#64748B]">
                    Collected Payments
                  </span>
                  <div className="p-2 rounded-xl bg-emerald-50 text-[#66BB6A]">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                </div>
                <div
                  className="text-2xl font-bold text-[#111827] mb-1"
                  style={{ fontFamily: PP }}
                >
                  {formatIndianCurrency(totalPaid)}
                </div>
                <div className="flex items-center gap-2 text-[11px] text-[#64748B] mb-2">
                  <span className="text-[#66BB6A] font-semibold">
                    {collectionRate}% ({formatIndianCurrency(totalPaid)})
                  </span>
                </div>
              </div>
              <div className="h-8 mt-1">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={[]}>
                    <Line
                      type="monotone"
                      dataKey="Collections"
                      stroke="#66BB6A"
                      strokeWidth={2}
                      dot={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Card 4: Outstanding Payments */}
            <div className="bg-white rounded-2xl border border-[#E5E7EB] p-4 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between h-full">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-[#64748B]">
                    Outstanding Payments
                  </span>
                  <div className="p-2 rounded-xl bg-amber-50 text-[#F59E0B]">
                    <AlertCircle className="w-4 h-4" />
                  </div>
                </div>
                <div
                  className="text-2xl font-bold text-[#111827] mb-1"
                  style={{ fontFamily: PP }}
                >
                  {formatIndianCurrency(totalOutstanding)}
                </div>
                <div className="text-[11px] text-[#64748B]">
                  {outstandingRate}% ({formatIndianCurrency(totalOutstanding)})
                </div>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2 flex overflow-hidden mt-3">
                <div
                  className="bg-[#F59E0B] h-full"
                  style={{
                    width: `${totalBilled > 0 ? (totalOutstanding / totalBilled) * 100 : 0}%`,
                  }}
                />
                <div
                  className="bg-[#009688] h-full"
                  style={{
                    width: `${totalBilled > 0 ? (totalPaid / totalBilled) * 100 : 0}%`,
                  }}
                />
              </div>
            </div>

            {/* Card 5: Paid Invoices */}
            <div className="bg-white rounded-2xl border border-[#E5E7EB] p-4 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between h-full">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-[#64748B]">
                    Paid Invoices
                  </span>
                  <div className="p-2 rounded-xl bg-indigo-50 text-[#0D47A1]">
                    <FileSpreadsheet className="w-4 h-4" />
                  </div>
                </div>
                <div
                  className="text-2xl font-bold text-[#111827] mb-1"
                  style={{ fontFamily: PP }}
                >
                  {paidInvoices}
                </div>
                <div className="text-[11px] text-[#64748B] mb-2">
                  {paidRate}% Paid ({unpaidInvoices} Pending)
                </div>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2 flex overflow-hidden">
                <div
                  className="bg-[#0D47A1] h-full"
                  style={{
                    width: `${totalInvoices > 0 ? (paidInvoices / totalInvoices) * 100 : 0}%`,
                  }}
                />
                <div
                  className="bg-[#F59E0B] h-full"
                  style={{
                    width: `${totalInvoices > 0 ? (unpaidInvoices / totalInvoices) * 100 : 0}%`,
                  }}
                />
              </div>
            </div>

            {/* Card 6: Average Invoice Value */}
            <div className="bg-white rounded-2xl border border-[#E5E7EB] p-4 shadow-sm hover:shadow-md transition-shadow flex items-center justify-between h-full">
              <div>
                <span className="text-xs font-semibold text-[#64748B]">
                  Avg Invoice Value
                </span>
                <div
                  className="text-2xl font-bold text-[#111827] mt-1"
                  style={{ fontFamily: PP }}
                >
                  {formatIndianCurrency(avgInvoiceValue)}
                </div>
                <p className="text-[11px] text-[#64748B] mt-1">
                  Settlement Rate
                </p>
              </div>
              <CircularProgress
                percentage={
                  totalInvoices > 0
                    ? Math.min(
                        100,
                        Math.round((paidInvoices / totalInvoices) * 100),
                      )
                    : 0
                }
                size={54}
                strokeWidth={6}
              />
            </div>
          </div>
        )}
        {/* CALENDAR QUICK FILTER TOOLBAR */}
        <div className="bg-white rounded-2xl border border-[#E5E7EB] p-4 shadow-sm mb-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 flex-wrap">
            <span
              className="text-xs font-bold text-[#64748B] uppercase tracking-wider mr-1 flex items-center gap-1.5"
              style={{ fontFamily: PP }}
            >
              <Clock className="w-4 h-4 text-[#0D47A1]" />
              Calendar Filter:
            </span>
            <button
              type="button"
              onClick={() => setDateRange("Today")}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                dateRange === "Today"
                  ? "bg-[#0D47A1] text-white shadow-sm"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
              style={{ fontFamily: PP }}
            >
              Today Only
            </button>
            <button
              type="button"
              onClick={() => setDateRange("Yesterday")}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                dateRange === "Yesterday"
                  ? "bg-[#0D47A1] text-white shadow-sm"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
              style={{ fontFamily: PP }}
            >
              Yesterday
            </button>
            <button
              type="button"
              onClick={() => setDateRange("7 Days")}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                dateRange === "7 Days" || dateRange === "Last 7 Days"
                  ? "bg-[#0D47A1] text-white shadow-sm"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
              style={{ fontFamily: PP }}
            >
              This Week (7 Days)
            </button>
            <button
              type="button"
              onClick={() => setDateRange("30 Days")}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                dateRange === "30 Days" || dateRange === "This Month"
                  ? "bg-[#0D47A1] text-white shadow-sm"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
              style={{ fontFamily: PP }}
            >
              This Month
            </button>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <span
              className="text-xs text-slate-500 font-medium hidden sm:inline"
              style={{ fontFamily: RB }}
            >
              From:
            </span>
            <input
              type="date"
              value={fromDate}
              onChange={(e) => {
                setFromDate(e.target.value);
                setDateRange("Custom");
              }}
              className="px-3 py-1.5 bg-slate-50 border border-[#E5E7EB] rounded-xl text-xs font-semibold text-slate-700 outline-none focus:border-[#0D47A1]"
              style={{ fontFamily: RB }}
            />
            <span
              className="text-xs text-slate-500 font-medium hidden sm:inline"
              style={{ fontFamily: RB }}
            >
              To:
            </span>
            <input
              type="date"
              value={toDate}
              onChange={(e) => {
                setToDate(e.target.value);
                setDateRange("Custom");
              }}
              className="px-3 py-1.5 bg-slate-50 border border-[#E5E7EB] rounded-xl text-xs font-semibold text-slate-700 outline-none focus:border-[#0D47A1]"
              style={{ fontFamily: RB }}
            />
          </div>
        </div>

        {/* Filter & Search Bar */}
        <div className="bg-white rounded-2xl border border-[#E5E7EB] p-4 shadow-sm mb-6">
          <div
            className="flex items-center gap-2 mb-3 text-xs font-semibold text-[#111827]"
            style={{ fontFamily: PP }}
          >
            <Filter className="w-4 h-4 text-[#009688]" />
            <span>Filter OPD Billing & Payment Register</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3">
            <div>
              <span className="block text-[11px] font-medium text-[#64748B] mb-1">
                Date Range
                <select
                  aria-label="Select option"
                  value={dateRange}
                  onChange={(e) => setDateRange(e.target.value)}
                  className="w-full bg-[#F1F5F9] border border-[#E5E7EB] rounded-xl text-xs px-2.5 py-2 text-[#111827] focus:outline-none focus:ring-2 focus:ring-[#0D47A1]"
                >
                  <option value="Today">Today</option>
                  <option value="Yesterday">Yesterday</option>
                  <option value="7 Days">Last 7 Days</option>
                  <option value="30 Days">This Month</option>
                  <option value="Custom">Custom Date Range</option>
                </select>
              </span>
            </div>

            <div>
              <span className="block text-[11px] font-medium text-[#64748B] mb-1">
                Department
                <select
                  aria-label="Select option"
                  value={deptFilter}
                  onChange={(e) => setDeptFilter(e.target.value)}
                  className="w-full bg-[#F1F5F9] border border-[#E5E7EB] rounded-xl text-xs px-2.5 py-2 text-[#111827] focus:outline-none focus:ring-2 focus:ring-[#0D47A1]"
                >
                  <option>All Departments</option>
                  <option>General Medicine</option>
                  <option>Cardiology</option>
                  <option>Orthopedics</option>
                  <option>Neurology</option>
                  <option>ENT</option>
                  <option>Pediatrics</option>
                </select>
              </span>
            </div>

            <div>
              <span className="block text-[11px] font-medium text-[#64748B] mb-1">
                Doctor
                <select
                  aria-label="Select option"
                  value={doctorFilter}
                  onChange={(e) => setDoctorFilter(e.target.value)}
                  className="w-full bg-[#F1F5F9] border border-[#E5E7EB] rounded-xl text-xs px-2.5 py-2 text-[#111827] focus:outline-none focus:ring-2 focus:ring-[#0D47A1]"
                >
                  <option>All Doctors</option>
                  <option>Dr. Sarah Jenkins</option>
                  <option>Dr. Rajesh Kapoor</option>
                  <option>Dr. Priya Sharma</option>
                  <option>Dr. Arjun Mehta</option>
                  <option>Dr. Sunita Patel</option>
                </select>
              </span>
            </div>

            <div>
              <span className="block text-[11px] font-medium text-[#64748B] mb-1">
                Payment Status
                <select
                  aria-label="Select option"
                  value={payStatusFilter}
                  onChange={(e) => setPayStatusFilter(e.target.value)}
                  className="w-full bg-[#F1F5F9] border border-[#E5E7EB] rounded-xl text-xs px-2.5 py-2 text-[#111827] focus:outline-none focus:ring-2 focus:ring-[#0D47A1]"
                >
                  <option>All Statuses</option>
                  <option>Paid</option>
                  <option>Pending</option>
                  <option>Partially Paid</option>
                  <option>Cancelled</option>
                </select>
              </span>
            </div>

            <div>
              <span className="block text-[11px] font-medium text-[#64748B] mb-1">
                Payment Method
                <select
                  aria-label="Select option"
                  value={payMethodFilter}
                  onChange={(e) => setPayMethodFilter(e.target.value)}
                  className="w-full bg-[#F1F5F9] border border-[#E5E7EB] rounded-xl text-xs px-2.5 py-2 text-[#111827] focus:outline-none focus:ring-2 focus:ring-[#0D47A1]"
                >
                  <option>All Methods</option>
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
                  value={invStatusFilter}
                  onChange={(e) => setInvStatusFilter(e.target.value)}
                  className="w-full bg-[#F1F5F9] border border-[#E5E7EB] rounded-xl text-xs px-2.5 py-2 text-[#111827] focus:outline-none focus:ring-2 focus:ring-[#0D47A1]"
                >
                  <option>All Invoice Statuses</option>
                  <option>Generated</option>
                  <option>Printed</option>
                  <option>Settled</option>
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
                placeholder="Search Invoice ID, Patient, MRN, Doctor, Payment Reference..."
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
            Simulate real-time billing report states
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
              Unable to Load Billing Report
            </h3>
            <p className="text-xs text-[#64748B] mt-1 max-w-md mx-auto">
              Connection timeout while fetching financial billing records.
              Please retry.
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
          <div className="w-full space-y-6">

              {/* REVENUE TREND AREA CHART */}
              <div className="bg-white rounded-2xl border border-[#E5E7EB] p-6 shadow-sm">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                  <div>
                    <h3
                      className="text-base font-bold text-[#111827]"
                      style={{ fontFamily: PP }}
                    >
                      Revenue & Collections Trend
                    </h3>
                    <p className="text-xs text-[#64748B]">
                      Daily volume tracking of billed revenue vs collections vs
                      outstanding
                    </p>
                  </div>

                  <div className="flex items-center gap-1 bg-[#F1F5F9] p-1 rounded-xl border border-[#E5E7EB] text-xs">
                    {(["7 Days", "30 Days", "90 Days"] as const).map((t) => (
                      <button
                        key={t}
                        onClick={() => setTrendDays(t)}
                        className={`px-3 py-1 rounded-lg font-medium transition ${trendDays === t ? "bg-[#0D47A1] text-white shadow-sm" : "text-[#64748B]"}`}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="h-72">
                  {revenueTrendData.length > 0 && (
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart
                        data={revenueTrendData}
                        margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                      >
                        <defs>
                          <linearGradient
                            id="colorRevGradB"
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
                            id="colorColGradB"
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
                          dataKey="Revenue"
                          name="Billed Revenue (â‚¹)"
                          stroke="#0D47A1"
                          fillOpacity={1}
                          fill="url(#colorRevGradB)"
                        />
                        <Area
                          type="monotone"
                          dataKey="Collections"
                          name="Collected Cash (â‚¹)"
                          stroke="#009688"
                          fillOpacity={1}
                          fill="url(#colorColGradB)"
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </div>

              {/* PAYMENT STATUS DISTRIBUTION & PAYMENT METHOD ANALYSIS */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Payment Status Distribution Donut */}
                <div className="bg-white rounded-2xl border border-[#E5E7EB] p-5 shadow-sm">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3
                        className="text-sm font-bold text-[#111827]"
                        style={{ fontFamily: PP }}
                      >
                        Payment Status Distribution
                      </h3>
                      <p className="text-[11px] text-[#64748B]">
                        Share of paid, pending, partial & cancelled invoices
                      </p>
                    </div>
                    <PieChartIcon className="w-4 h-4 text-[#009688]" />
                  </div>
                  <div className="h-60">
                    {paymentStatusData.length > 0 && (
                      <ResponsiveContainer width="100%" height="100%">
                        <RechartsPie>
                          <Pie
                            data={paymentStatusData}
                            cx="50%"
                            cy="50%"
                            innerRadius={45}
                            outerRadius={75}
                            paddingAngle={3}
                            dataKey="value"
                          >
                            {paymentStatusData.map((entry) => (
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
                    )}
                  </div>
                </div>

                {/* Payment Method Analysis Vertical Bar */}
                <div className="bg-white rounded-2xl border border-[#E5E7EB] p-5 shadow-sm">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3
                        className="text-sm font-bold text-[#111827]"
                        style={{ fontFamily: PP }}
                      >
                        Payment Method Analysis
                      </h3>
                      <p className="text-[11px] text-[#64748B]">
                        Collection volume per payment channel
                      </p>
                    </div>
                    <DollarSign className="w-4 h-4 text-[#0D47A1]" />
                  </div>
                  <div className="h-60">
                    {paymentMethodData.length > 0 && (
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={paymentMethodData}
                          margin={{ top: 10, right: 10, left: -15, bottom: 0 }}
                        >
                          <CartesianGrid
                            strokeDasharray="3 3"
                            stroke="#F1F5F9"
                          />
                          <XAxis
                            dataKey="method"
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
                            name="Amount Collected (â‚¹)"
                            fill="#0D47A1"
                            radius={[4, 4, 0, 0]}
                          />
                        </BarChart>
                      </ResponsiveContainer>
                    )}
                  </div>
                </div>
              </div>

              {/* DEPARTMENT BILLING PERFORMANCE & DOCTOR REVENUE CONTRIBUTION */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Department Billing Performance Horizontal Bar */}
                <div className="bg-white rounded-2xl border border-[#E5E7EB] p-5 shadow-sm">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3
                        className="text-sm font-bold text-[#111827]"
                        style={{ fontFamily: PP }}
                      >
                        Department Billing Performance
                      </h3>
                      <p className="text-[11px] text-[#64748B]">
                        Revenue generated by specialty department
                      </p>
                    </div>
                    <Building2 className="w-4 h-4 text-[#009688]" />
                  </div>
                  <div className="h-60">
                    {deptPerformanceData.length > 0 && (
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          layout="vertical"
                          data={deptPerformanceData}
                          margin={{ top: 5, right: 10, left: 20, bottom: 5 }}
                        >
                          <CartesianGrid
                            strokeDasharray="3 3"
                            stroke="#F1F5F9"
                          />
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
                            dataKey="revenue"
                            name="Revenue (â‚¹)"
                            fill="#009688"
                            radius={[0, 4, 4, 0]}
                          />
                        </BarChart>
                      </ResponsiveContainer>
                    )}
                  </div>
                </div>

                {/* Doctor Revenue Contribution Vertical Bar */}
                <div className="bg-white rounded-2xl border border-[#E5E7EB] p-5 shadow-sm">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3
                        className="text-sm font-bold text-[#111827]"
                        style={{ fontFamily: PP }}
                      >
                        Doctor Revenue Contribution
                      </h3>
                      <p className="text-[11px] text-[#64748B]">
                        OPD revenue generated per attending physician
                      </p>
                    </div>
                    <UserCheck className="w-4 h-4 text-[#0D47A1]" />
                  </div>
                  <div className="h-60">
                    {doctorRevenueData.length > 0 && (
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={doctorRevenueData}
                          margin={{ top: 10, right: 10, left: -15, bottom: 0 }}
                        >
                          <CartesianGrid
                            strokeDasharray="3 3"
                            stroke="#F1F5F9"
                          />
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
                            dataKey="revenue"
                            name="Revenue (â‚¹)"
                            fill="#0D47A1"
                            radius={[4, 4, 0, 0]}
                          />
                        </BarChart>
                      </ResponsiveContainer>
                    )}
                  </div>
                </div>
              </div>

              {/* BILLING REPORT TABLE */}
              <div className="bg-white rounded-2xl border border-[#E5E7EB] shadow-sm overflow-hidden">
                <div className="p-5 border-b border-[#E5E7EB] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div>
                    <h3
                      className="text-base font-bold text-[#111827]"
                      style={{ fontFamily: PP }}
                    >
                      OPD Billing & Invoice Register
                    </h3>
                    <p className="text-xs text-[#64748B]">
                      Detailed OPD patient billing, payment method and
                      settlement register
                    </p>
                  </div>
                  <button
                    onClick={() => alert("Exporting Billing Register (CSV)...")}
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
                          onClick={() => handleSort("invoiceId")}
                        >
                          Invoice ID{" "}
                          {sortField === "invoiceId" &&
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
                        <th className="py-3.5 px-4">MRN</th>
                        <th className="py-3.5 px-4">Doctor</th>
                        <th className="py-3.5 px-4">Department</th>
                        <th
                          tabIndex={0}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" || e.key === " ") {
                              e.preventDefault();
                              (e.currentTarget as HTMLElement).click();
                            }
                          }}
                          className="py-3.5 px-4 text-right cursor-pointer hover:text-[#0D47A1]"
                          onClick={() => handleSort("invoiceAmount")}
                        >
                          Billed (â‚¹){" "}
                          {sortField === "invoiceAmount" &&
                            (sortOrder === "asc" ? "â†‘" : "â†“")}
                        </th>
                        <th className="py-3.5 px-4 text-right">
                          Collected (â‚¹)
                        </th>
                        <th className="py-3.5 px-4 text-right">
                          Outstanding (â‚¹)
                        </th>
                        <th className="py-3.5 px-4">Method</th>
                        <th className="py-3.5 px-4 text-center">Status</th>
                        <th className="py-3.5 px-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E5E7EB] text-xs">
                      {sortedData.length === 0 ? (
                        <tr>
                          <td
                            colSpan={11}
                            className="py-8 text-center text-[#64748B]"
                          >
                            No billing records match the selected filter
                            criteria.
                          </td>
                        </tr>
                      ) : (
                        sortedData.map((item) => (
                          <tr
                            key={item.invoiceId}
                            className="hover:bg-slate-50 transition-colors"
                          >
                            <td className="py-3.5 px-4 font-bold text-[#0D47A1]">
                              {item.invoiceId}
                            </td>
                            <td className="py-3.5 px-4 font-semibold text-[#111827]">
                              {item.patientName}
                            </td>
                            <td className="py-3.5 px-4 text-[#64748B]">
                              {item.mrn}
                            </td>
                            <td className="py-3.5 px-4 text-[#111827]">
                              {item.doctorName}
                            </td>
                            <td className="py-3.5 px-4 font-medium text-[#111827]">
                              {item.department}
                            </td>
                            <td className="py-3.5 px-4 text-right font-bold text-[#111827]">
                              <div>{formatIndianCurrency(item.invoiceAmount)}</div>
                              <div className="text-[10px] text-[#64748B] font-normal">₹{item.invoiceAmount.toLocaleString("en-IN")}</div>
                            </td>
                            <td className="py-3.5 px-4 text-right font-bold text-[#009688]">
                              <div>{formatIndianCurrency(item.collectedAmount)}</div>
                              <div className="text-[10px] text-[#009688]/80 font-normal">₹{item.collectedAmount.toLocaleString("en-IN")}</div>
                            </td>
                            <td className="py-3.5 px-4 text-right font-bold text-[#F59E0B]">
                              <div>{formatIndianCurrency(item.outstandingAmount)}</div>
                              <div className="text-[10px] text-[#F59E0B]/80 font-normal">₹{item.outstandingAmount.toLocaleString("en-IN")}</div>
                            </td>
                            <td className="py-3.5 px-4">
                              <span className="px-2 py-0.5 rounded bg-slate-100 text-[#64748B] text-[10px] font-medium">
                                {item.paymentMethod}
                              </span>
                            </td>
                            <td className="py-3.5 px-4 text-center">
                              <span
                                className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${item.paymentStatus === "Paid" ? "bg-teal-50 border-teal-200 text-[#009688]" : item.paymentStatus === "Pending" ? "bg-amber-50 border-amber-200 text-[#F59E0B]" : item.paymentStatus === "Partially Paid" ? "bg-blue-50 border-blue-200 text-[#0D47A1]" : "bg-red-50 border-red-200 text-[#EF4444]"}`}
                              >
                                {item.paymentStatus}
                              </span>
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
                                  <Eye className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() =>
                                    alert(
                                      `Printing summary for ${item.invoiceId}`,
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

          </div>
        )}

        {/* FOOTER */}
        <div className="mt-8 pt-4 border-t border-[#E5E7EB] flex flex-col sm:flex-row items-center justify-between text-xs text-[#64748B] gap-2">
          <div>
            Showing{" "}
            <strong className="text-[#111827]">
              {filteredData.length} Billing Report Results
            </strong>
          </div>
          <div>Hospital Management System â€¢ Billing Report v1.0</div>
          <div>
            Last Refreshed:{" "}
            <strong className="text-[#111827]">
              {new Date().toLocaleString("en-US", {
                year: "numeric",
                month: "2-digit",
                day: "2-digit",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </strong>
          </div>
        </div>
      </div>
    </div>
  );
}
