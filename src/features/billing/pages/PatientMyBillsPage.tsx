import { useState, useMemo } from "react";
import { useNavigate } from "react-router";
import {
  FileText,
  Eye,
  Clock,
  Printer,
  Download,
  ArrowLeft,
  Calendar,
  Filter,
  RotateCcw,
} from "lucide-react";
import { PP, RB } from "../constants/billing.constants";
import { useBilling } from "../hooks/useBilling";
import { useAuthStore } from "../../auth/store/auth.store";
import { usePatientPortal } from "../../patients/context/usePatientPortal";
import { BillingStatusBadge } from "../components/BillingStatusBadge";
import { ROUTES } from "../../../app/routes/routes";
import { DataTable, type Column } from "../../../common/components/DataTable";
import type { InvoiceRecord } from "../types/billing.types";
import { useHospitalBranding } from "../../settings/hooks/useHospitalBranding";
import safehandshospital_logo from "../../../assets/safehandshospital_logo.webp";
import { exportElementToPdf } from "../../reports/utils/exportToPdf";

export function PatientMyBillsPage() {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const portal = usePatientPortal();
  const { logoUrl } = useHospitalBranding();
  const [logoError, setLogoError] = useState(false);
  const [isExportingPdf, setIsExportingPdf] = useState(false);

  const patientMrn = String(
    portal?.activeMrn ||
      portal?.primaryMrn ||
      user?.patientId ||
      user?.mrn ||
      user?.id ||
      "",
  );

  const patientName =
    portal?.activePatient?.patientName ||
    portal?.activePatient?.name ||
    user?.fullName ||
    "Patient";

  const hospitalName = "Safe Hands Hospital";

  const { invoices, loading: isLoading } = useBilling(patientMrn || undefined);

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [dateFilter, setDateFilter] = useState("All");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const filteredInvoices = useMemo(() => {
    return invoices.filter((inv) => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        inv.id.toLowerCase().includes(q) ||
        inv.patientName.toLowerCase().includes(q) ||
        inv.mrn.toLowerCase().includes(q);
      const matchesStatus =
        statusFilter === "All" || inv.paymentStatus === statusFilter;

      let matchesDate = true;
      if (dateFilter && dateFilter !== "All" && inv.invoiceDate) {
        const d = new Date(inv.invoiceDate).getTime();
        if (!isNaN(d)) {
          const now = new Date();
          const todayStart = new Date(
            now.getFullYear(),
            now.getMonth(),
            now.getDate(),
          ).getTime();
          if (dateFilter === "Today") matchesDate = d >= todayStart;
          else if (dateFilter === "Yesterday")
            matchesDate = d >= todayStart - 86400000 && d < todayStart;
          else if (dateFilter === "This Week")
            matchesDate = d >= todayStart - 6 * 86400000;
          else if (dateFilter === "This Month")
            matchesDate =
              d >= new Date(now.getFullYear(), now.getMonth(), 1).getTime();
          else if (dateFilter === "Custom Range" || dateFilter === "Custom") {
            if (startDate)
              matchesDate = matchesDate && d >= new Date(startDate).getTime();
            if (endDate)
              matchesDate =
                matchesDate && d <= new Date(endDate).setHours(23, 59, 59, 999);
          }
        }
      }

      return matchesSearch && matchesStatus && matchesDate;
    });
  }, [invoices, searchQuery, statusFilter, dateFilter, startDate, endDate]);

  const summary = useMemo(() => {
    const totalBilled = invoices.reduce(
      (sum, inv) => sum + inv.invoiceAmount,
      0,
    );
    const totalPaid = invoices.reduce((sum, inv) => sum + inv.paidAmount, 0);
    const totalPending = invoices.reduce((sum, inv) => sum + inv.balance, 0);
    return { totalBilled, totalPaid, totalPending, count: invoices.length };
  }, [invoices]);

  const handleResetFilters = () => {
    setSearchQuery("");
    setStatusFilter("All");
    setDateFilter("All");
    setStartDate("");
    setEndDate("");
  };

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
    if (!filteredInvoices || filteredInvoices.length === 0) {
      alert("No invoices available to export.");
      return;
    }

    const headers = [
      "Invoice No",
      "Invoice Date",
      "Doctor",
      "Department",
      "Billed Amount",
      "Paid Amount",
      "Outstanding Balance",
      "Payment Status",
      "Payment Method",
    ];

    const rows = filteredInvoices.map((inv) => {
      const invNo =
        inv.billNumber ||
        (inv.id
          ? String(inv.id).startsWith("BL-")
            ? String(inv.id)
            : `BL-2026-${String(inv.id).padStart(6, "0")}`
          : "");
      const date = inv.invoiceDate || "";
      const doctor = inv.doctorName || "—";
      const dept = inv.department || "—";
      const billed = inv.invoiceAmount ?? 0;
      const paid = inv.paidAmount ?? 0;
      const balance = inv.balance ?? 0;
      const status = inv.paymentStatus || "";
      const method = inv.paymentMethod || "";

      return [
        invNo,
        date,
        doctor,
        dept,
        billed,
        paid,
        balance,
        status,
        method,
      ];
    });

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
    const cleanMrn = (patientMrn || "patient").replace(/[^a-zA-Z0-9_-]/g, "_");
    link.href = url;
    link.download = `Billing_Invoices_${cleanMrn}.csv`;
    link.style.display = "none";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => URL.revokeObjectURL(url), 2000);
  };

  const handleExportPdf = async () => {
    setIsExportingPdf(true);
    const el = document.getElementById("billing-print-summary");
    if (!el) {
      setIsExportingPdf(false);
      return;
    }

    // Temporarily reveal element for html2canvas capture in an off-screen fixed overlay
    const originalDisplay = el.style.display;
    const originalPosition = el.style.position;
    const originalLeft = el.style.left;
    const originalTop = el.style.top;
    const originalZIndex = el.style.zIndex;
    const originalWidth = el.style.width;
    const originalBackground = el.style.backgroundColor;

    el.style.display = "block";
    el.style.position = "fixed";
    el.style.left = "-9999px";
    el.style.top = "0";
    el.style.width = "1100px";
    el.style.zIndex = "-1000";
    el.style.backgroundColor = "#ffffff";

    try {
      const cleanMrn = (patientMrn || "patient").replace(/[^a-zA-Z0-9_-]/g, "_");
      await exportElementToPdf({
        elementOrId: el,
        fileName: `Billing_Summary_${cleanMrn}.pdf`,
        orientation: "landscape",
        format: "a4",
        backgroundColor: "#FFFFFF",
        margin: 8,
      });
    } catch (err) {
      console.error("Export PDF error:", err);
    } finally {
      el.style.display = originalDisplay;
      el.style.position = originalPosition;
      el.style.left = originalLeft;
      el.style.top = originalTop;
      el.style.zIndex = originalZIndex;
      el.style.width = originalWidth;
      el.style.backgroundColor = originalBackground;
      setIsExportingPdf(false);
    }
  };

  const columns: Column<InvoiceRecord>[] = useMemo(
    () => [
      {
        key: "billNumber",
        label: "INVOICE NO",
        sortable: true,
        getValue: (inv) => inv.billNumber || inv.id,
        render: (inv) => (
          <span className="font-mono font-bold text-[#0D47A1]">
            {inv.billNumber ||
              (inv.id
                ? String(inv.id).startsWith("BL-")
                  ? String(inv.id)
                  : `BL-2026-${String(inv.id).padStart(6, "0")}`
                : inv.id)}
          </span>
        ),
      },
      {
        key: "invoiceDate",
        label: "DATE",
        sortable: true,
        getValue: (inv) => inv.invoiceDate,
        render: (inv) => (
          <span className="text-slate-600 whitespace-nowrap">
            {inv.invoiceDate}
          </span>
        ),
      },
      {
        key: "doctorName",
        label: "DOCTOR",
        sortable: true,
        getValue: (inv) => inv.doctorName || "",
        render: (inv) => (
          <span className="text-slate-700 font-medium">
            {inv.doctorName || "—"}
          </span>
        ),
      },
      {
        key: "invoiceAmount",
        label: "AMOUNT",
        sortable: true,
        align: "right",
        getValue: (inv) => inv.invoiceAmount,
        render: (inv) => (
          <span className="text-slate-700">
            ₹{inv.invoiceAmount.toLocaleString()}
          </span>
        ),
      },
      {
        key: "paidAmount",
        label: "PAID",
        sortable: true,
        align: "right",
        getValue: (inv) => inv.paidAmount,
        render: (inv) => (
          <span className="font-bold text-[#66BB6A]">
            ₹{inv.paidAmount.toLocaleString()}
          </span>
        ),
      },
      {
        key: "balance",
        label: "BALANCE",
        sortable: true,
        align: "right",
        getValue: (inv) => inv.balance,
        render: (inv) => (
          <span className="font-semibold text-[#EF4444]">
            {inv.balance > 0 ? `₹${inv.balance.toLocaleString()}` : "₹0"}
          </span>
        ),
      },
      {
        key: "paymentStatus",
        label: "STATUS",
        sortable: true,
        align: "center",
        getValue: (inv) => inv.paymentStatus,
        render: (inv) => <BillingStatusBadge status={inv.paymentStatus} />,
      },
      {
        key: "actions",
        label: "ACTIONS",
        sortable: false,
        align: "center",
        render: (inv) => {
          const numericTarget = String(inv.billId ?? inv.id);
          return (
            <div className="flex items-center justify-center gap-1">
              <button
                onClick={() =>
                  navigate(
                    ROUTES.PATIENT_PORTAL_BILLING_DETAIL.replace(
                      ":billId",
                      numericTarget,
                    ),
                  )
                }
                className="p-1.5 rounded-lg text-slate-500 hover:text-[#0D47A1] hover:bg-blue-50 transition-colors cursor-pointer"
                title="View Details"
              >
                <Eye size={15} />
              </button>
              <button
                onClick={() =>
                  navigate(
                    ROUTES.PATIENT_PORTAL_BILLING_RECEIPT.replace(
                      ":billId",
                      numericTarget,
                    ),
                  )
                }
                className="p-1.5 rounded-lg text-slate-500 hover:text-[#0D47A1] hover:bg-blue-50 transition-colors cursor-pointer"
                title="Print Receipt"
              >
                <Printer size={15} />
              </button>
            </div>
          );
        },
      },
    ],
    [navigate],
  );

  return (
    <div className="w-full bg-[#F1F5F9] min-h-screen p-4 md:p-6 pb-28">
      {/* Scoped Print and PDF Styles */}
      <style>{`
        .print-only {
          display: none;
        }

        @page {
          size: A4 landscape;
          margin: 8mm;
        }

        @media print {
          /* Hide portal chrome, headers, navigation and non-print elements */
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

          .billing-print {
            display: block !important;
            visibility: visible !important;
            width: 100% !important;
            max-width: none !important;
            height: auto !important;
            max-height: none !important;
            margin: 0 !important;
            padding: 16px !important;
            overflow: visible !important;
            background: #ffffff !important;
            color: #1e293b !important;
          }

          .billing-print * {
            visibility: visible !important;
          }

          .billing-print table {
            width: 100% !important;
            border-collapse: collapse !important;
          }

          .billing-print thead {
            display: table-header-group !important;
          }

          .billing-print tr {
            break-inside: avoid !important;
            page-break-inside: avoid !important;
          }

          .billing-print th,
          .billing-print td {
            white-space: normal !important;
            overflow-wrap: anywhere;
            vertical-align: middle;
          }
        }
      `}</style>

      {/* ── NORMAL SCREEN VIEW (VISUALLY UNCHANGED) ── */}
      <div className="no-print space-y-6">
        {/* 1. PAGE HEADER */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="inline-flex items-center gap-2 px-3.5 py-2 mb-3 text-xs font-semibold text-slate-700 hover:text-slate-900 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl shadow-xs transition-all cursor-pointer"
              style={{ fontFamily: RB }}
            >
              <ArrowLeft size={16} />
              Back
            </button>
            <h1
              className="text-xl font-bold text-[#111827]"
              style={{ fontFamily: PP }}
            >
              My Bills & Payments
            </h1>
            <p
              className="text-xs text-[#64748B] mt-0.5"
              style={{ fontFamily: RB }}
            >
              View all your invoices, payment status and download official
              receipts.
            </p>
          </div>
          <div className="flex items-center gap-2.5 shrink-0">
            <button
              onClick={() => window.print()}
              className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-white border border-[#E5E7EB] text-slate-700 text-xs font-semibold hover:bg-slate-50 transition-colors shadow-sm cursor-pointer"
              style={{ fontFamily: RB }}
            >
              <Printer size={14} />
              <span className="hidden sm:inline">Print Summary</span>
            </button>
            <button
              onClick={handleExportPdf}
              disabled={isExportingPdf}
              className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-white border border-[#E5E7EB] text-slate-700 text-xs font-semibold hover:bg-slate-50 transition-colors shadow-sm cursor-pointer disabled:opacity-60"
              style={{ fontFamily: RB }}
            >
              <Download size={14} />
              <span className="hidden sm:inline">
                {isExportingPdf ? "Exporting..." : "Export PDF"}
              </span>
            </button>
            <button
              onClick={handleExportCsv}
              className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-white border border-[#E5E7EB] text-slate-700 text-xs font-semibold hover:bg-slate-50 transition-colors shadow-sm cursor-pointer"
              style={{ fontFamily: RB }}
            >
              <FileText size={14} />
              <span className="hidden sm:inline">Export CSV</span>
            </button>
          </div>
        </div>

        {/* 2. SUMMARY CARDS */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-2xl border border-[#E5E7EB] shadow-sm space-y-1">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-[11px] font-bold uppercase tracking-wider">
                Total Billed
              </span>
              <FileText size={16} className="text-[#0D47A1]" />
            </div>
            {isLoading ? (
              <div className="h-7 bg-slate-100 rounded animate-pulse" />
            ) : (
              <div
                className="text-xl font-bold text-[#0D47A1]"
                style={{ fontFamily: PP }}
              >
                ₹{summary.totalBilled.toLocaleString()}
              </div>
            )}
            <span className="text-[10px] text-slate-400">
              {summary.count} invoices
            </span>
          </div>
          <div className="bg-white p-4 rounded-2xl border border-[#E5E7EB] shadow-sm space-y-1">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-[11px] font-bold uppercase tracking-wider">
                Total Paid
              </span>
              <Clock size={16} className="text-[#66BB6A]" />
            </div>
            {isLoading ? (
              <div className="h-7 bg-slate-100 rounded animate-pulse" />
            ) : (
              <div
                className="text-xl font-bold text-[#66BB6A]"
                style={{ fontFamily: PP }}
              >
                ₹{summary.totalPaid.toLocaleString()}
              </div>
            )}
            <span className="text-[10px] text-[#66BB6A] font-medium">
              Settled
            </span>
          </div>
          <div className="bg-white p-4 rounded-2xl border border-[#E5E7EB] shadow-sm space-y-1">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-[11px] font-bold uppercase tracking-wider">
                Outstanding
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
                ₹{summary.totalPending.toLocaleString()}
              </div>
            )}
            <span className="text-[10px] text-amber-600 font-medium">
              Awaiting payment
            </span>
          </div>
          <div className="bg-white p-4 rounded-2xl border border-[#E5E7EB] shadow-sm space-y-1">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-[11px] font-bold uppercase tracking-wider">
                Payment Rate
              </span>
              <FileText size={16} className="text-purple-600" />
            </div>
            {isLoading ? (
              <div className="h-7 bg-slate-100 rounded animate-pulse" />
            ) : (
              <div
                className="text-xl font-bold text-[#111827]"
                style={{ fontFamily: PP }}
              >
                {summary.totalBilled > 0
                  ? Math.round((summary.totalPaid / summary.totalBilled) * 100)
                  : 100}
                %
              </div>
            )}
            <span className="text-[10px] text-slate-400">Of total billed</span>
          </div>
        </div>

        {/* 3. BILLS TABLE WITH EMBEDDED FILTERS */}
        <DataTable
          data={filteredInvoices}
          columns={columns}
          loading={isLoading}
          getRowId={(inv) => inv.id}
          title="MY INVOICES"
          subtitle="Complete record of your medical billing invoices"
          headerBadge={
            <span className="text-xs font-semibold text-[#0D47A1] bg-blue-50 px-3 py-1 rounded-xl border border-blue-100 font-mono">
              {filteredInvoices.length} Invoices
            </span>
          }
          searchable={true}
          searchPlaceholder=" Search by Invoice No, Patient Name, MRN..."
          searchValue={searchQuery}
          onSearchChange={setSearchQuery}
          toolbar={
            <div className="bg-slate-50/80 border border-[#E5E7EB] rounded-xl p-2.5 space-y-2 shadow-2xs text-xs">
              <div className="flex items-center gap-2 flex-wrap">
                <div className="flex items-center gap-1.5 bg-white border border-[#E5E7EB] px-2.5 py-1 rounded-lg text-slate-700 font-medium">
                  <Calendar size={13} className="text-slate-400" />
                  <span className="text-slate-400 text-[11px]">Date:</span>
                  <select
                    value={dateFilter}
                    onChange={(e) => setDateFilter(e.target.value)}
                    className="bg-transparent font-semibold text-[#0D47A1] outline-none cursor-pointer text-xs"
                  >
                    <option value="All">All Dates</option>
                    <option value="Today">Today</option>
                    <option value="Yesterday">Yesterday</option>
                    <option value="This Week">This Week</option>
                    <option value="This Month">This Month</option>
                  </select>
                </div>

                <div className="flex items-center gap-1.5 bg-white border border-[#E5E7EB] px-2.5 py-1 rounded-lg text-slate-700 font-medium">
                  <Filter size={13} className="text-slate-400" />
                  <span className="text-slate-400 text-[11px]">Status:</span>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="bg-transparent font-semibold text-[#0D47A1] outline-none cursor-pointer text-xs"
                  >
                    <option value="All">All Payment Statuses</option>
                    <option value="Paid">Paid</option>
                    <option value="Partially Paid">Partially Paid</option>
                    <option value="Pending">Pending</option>
                  </select>
                </div>

                {(searchQuery ||
                  statusFilter !== "All" ||
                  dateFilter !== "All") && (
                  <button
                    onClick={handleResetFilters}
                    className="px-2.5 py-1 rounded-lg border border-red-200 bg-red-50 hover:bg-red-100 text-red-600 text-[11px] font-semibold transition-colors flex items-center gap-1 cursor-pointer shadow-2xs shrink-0 ml-auto"
                    style={{ fontFamily: PP }}
                  >
                    <RotateCcw size={12} /> Clear Filters
                  </button>
                )}
              </div>
            </div>
          }
          emptyTitle="No invoices found"
          emptySubtitle={
            searchQuery
              ? "Try adjusting your search or filters."
              : "You don't have any billing records yet."
          }
          emptyIcon={<FileText size={28} />}
          emptyAction={
            searchQuery ? (
              <button
                onClick={handleResetFilters}
                className="px-4 py-2 rounded-xl bg-[#0D47A1] text-white text-xs font-semibold hover:bg-blue-900 cursor-pointer"
                style={{ fontFamily: PP }}
              >
                Clear Filters
              </button>
            ) : undefined
          }
          pagination={true}
        />
      </div>

      {/* ── DEDICATED PRINT / PDF REPORT SECTION (ISOLATED DOCUMENT) ── */}
      <section
        id="billing-print-summary"
        className="billing-print print-only p-6 bg-white text-slate-800 text-xs"
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
                {hospitalName}
              </h2>
              <p className="text-[11px] text-slate-600">
                NABH Accredited Healthcare Center • Comprehensive Medical
                Services
              </p>
            </div>
          </div>
          <div className="text-right">
            <h1
              className="text-sm font-bold text-slate-900 tracking-wide uppercase"
              style={{ fontFamily: PP }}
            >
              BILLING & PAYMENT SUMMARY
            </h1>
            <p className="text-[10px] text-slate-500 mt-0.5">
              Generated: {generatedDateStr}
            </p>
          </div>
        </div>

        {/* 2. PATIENT INFORMATION */}
        <div className="bg-slate-50 rounded-xl border border-slate-200 p-3.5 mb-4">
          <div
            className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2"
            style={{ fontFamily: PP }}
          >
            PATIENT INFORMATION
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
            <div>
              <span className="text-slate-500">Patient Name: </span>
              <span className="font-bold text-slate-900">{patientName}</span>
            </div>
            <div>
              <span className="text-slate-500">MRN: </span>
              <span className="font-mono font-bold text-[#0D47A1]">
                {patientMrn || "N/A"}
              </span>
            </div>
            <div>
              <span className="text-slate-500">Invoices: </span>
              <span className="font-semibold text-slate-800">
                {filteredInvoices.length}
              </span>
            </div>
            <div>
              <span className="text-slate-500">Payment Status: </span>
              <span
                className={`font-bold ${
                  summary.totalPending <= 0
                    ? "text-[#66BB6A]"
                    : "text-[#F59E0B]"
                }`}
              >
                {summary.totalPending <= 0 ? "Settled" : "Pending"}
              </span>
            </div>
          </div>
        </div>

        {/* 3. COMPACT BILLING SUMMARY */}
        <div className="mb-4">
          <div
            className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2"
            style={{ fontFamily: PP }}
          >
            BILLING SUMMARY
          </div>
          <div className="grid grid-cols-4 gap-3">
            <div className="border border-slate-200 rounded-lg p-2.5 bg-slate-50/50">
              <div className="text-[10px] text-slate-500 font-medium uppercase">
                Total Billed
              </div>
              <div
                className="text-sm font-bold text-[#0D47A1] mt-0.5"
                style={{ fontFamily: PP }}
              >
                ₹{summary.totalBilled.toLocaleString()}
              </div>
            </div>
            <div className="border border-slate-200 rounded-lg p-2.5 bg-slate-50/50">
              <div className="text-[10px] text-slate-500 font-medium uppercase">
                Total Paid
              </div>
              <div
                className="text-sm font-bold text-[#66BB6A] mt-0.5"
                style={{ fontFamily: PP }}
              >
                ₹{summary.totalPaid.toLocaleString()}
              </div>
            </div>
            <div className="border border-slate-200 rounded-lg p-2.5 bg-slate-50/50">
              <div className="text-[10px] text-slate-500 font-medium uppercase">
                Outstanding
              </div>
              <div
                className="text-sm font-bold text-[#EF4444] mt-0.5"
                style={{ fontFamily: PP }}
              >
                ₹{summary.totalPending.toLocaleString()}
              </div>
            </div>
            <div className="border border-slate-200 rounded-lg p-2.5 bg-slate-50/50">
              <div className="text-[10px] text-slate-500 font-medium uppercase">
                Payment Rate
              </div>
              <div
                className="text-sm font-bold text-slate-900 mt-0.5"
                style={{ fontFamily: PP }}
              >
                {summary.totalBilled > 0
                  ? Math.round((summary.totalPaid / summary.totalBilled) * 100)
                  : 100}
                %
              </div>
            </div>
          </div>
        </div>

        {/* 4. FULL INVOICE DETAILS TABLE */}
        <div className="mb-4">
          <div
            className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2"
            style={{ fontFamily: PP }}
          >
            INVOICE DETAILS ({filteredInvoices.length}{" "}
            {filteredInvoices.length === 1 ? "Record" : "Records"})
          </div>
          <table className="w-full border-collapse border border-slate-300 text-xs">
            <thead>
              <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-300 text-[11px]">
                <th className="p-2 border border-slate-300 text-left">
                  Invoice No
                </th>
                <th className="p-2 border border-slate-300 text-left">Date</th>
                <th className="p-2 border border-slate-300 text-left">
                  Doctor
                </th>
                <th className="p-2 border border-slate-300 text-left">
                  Department
                </th>
                <th className="p-2 border border-slate-300 text-right">
                  Billed Amount
                </th>
                <th className="p-2 border border-slate-300 text-right">
                  Paid Amount
                </th>
                <th className="p-2 border border-slate-300 text-right">
                  Due Balance
                </th>
                <th className="p-2 border border-slate-300 text-center">
                  Status
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredInvoices.length === 0 ? (
                <tr>
                  <td
                    colSpan={8}
                    className="p-4 text-center text-slate-500 italic"
                  >
                    No invoice records found.
                  </td>
                </tr>
              ) : (
                filteredInvoices.map((inv, idx) => (
                  <tr key={inv.id || idx} className="border-b border-slate-200">
                    <td className="p-2 border border-slate-200 font-mono font-bold text-[#0D47A1]">
                      {inv.billNumber ||
                        (inv.id
                          ? String(inv.id).startsWith("BL-")
                            ? String(inv.id)
                            : `BL-2026-${String(inv.id).padStart(6, "0")}`
                          : "—")}
                    </td>
                    <td className="p-2 border border-slate-200 text-slate-600 whitespace-nowrap">
                      {inv.invoiceDate || "—"}
                    </td>
                    <td className="p-2 border border-slate-200 text-slate-800 font-medium">
                      {inv.doctorName || "—"}
                    </td>
                    <td className="p-2 border border-slate-200 text-slate-600">
                      {inv.department || "—"}
                    </td>
                    <td className="p-2 border border-slate-200 text-right font-medium text-slate-800">
                      ₹{inv.invoiceAmount.toLocaleString()}
                    </td>
                    <td className="p-2 border border-slate-200 text-right font-bold text-[#66BB6A]">
                      ₹{inv.paidAmount.toLocaleString()}
                    </td>
                    <td className="p-2 border border-slate-200 text-right font-semibold text-[#EF4444]">
                      {inv.balance > 0
                        ? `₹${inv.balance.toLocaleString()}`
                        : "₹0"}
                    </td>
                    <td className="p-2 border border-slate-200 text-center">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          inv.paymentStatus?.toUpperCase() === "PAID"
                            ? "bg-green-100 text-green-800 border border-green-200"
                            : inv.paymentStatus?.toUpperCase() ===
                                  "PARTIALLY PAID" ||
                                inv.paymentStatus?.toUpperCase() ===
                                  "PARTIALLY_PAID"
                              ? "bg-amber-100 text-amber-800 border border-amber-200"
                              : "bg-red-100 text-red-800 border border-red-200"
                        }`}
                      >
                        {inv.paymentStatus || "Pending"}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
            {filteredInvoices.length > 0 && (
              <tfoot>
                <tr className="bg-slate-100 font-bold text-slate-900 border-t-2 border-slate-400">
                  <td
                    colSpan={4}
                    className="p-2 border border-slate-300 text-right uppercase tracking-wider"
                  >
                    Total Summary
                  </td>
                  <td className="p-2 border border-slate-300 text-right text-[#0D47A1]">
                    ₹{summary.totalBilled.toLocaleString()}
                  </td>
                  <td className="p-2 border border-slate-300 text-right text-[#66BB6A]">
                    ₹{summary.totalPaid.toLocaleString()}
                  </td>
                  <td className="p-2 border border-slate-300 text-right text-[#EF4444]">
                    ₹{summary.totalPending.toLocaleString()}
                  </td>
                  <td className="p-2 border border-slate-300 text-center">
                    {summary.totalBilled > 0
                      ? Math.round(
                          (summary.totalPaid / summary.totalBilled) * 100,
                        )
                      : 100}
                    % Paid
                  </td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>

        {/* 5. TOTALS SECTION */}
        <div className="flex justify-end pt-2 border-t border-slate-200">
          <div className="w-72 bg-slate-50 border border-slate-200 rounded-xl p-3 space-y-1.5 text-xs">
            <div className="flex justify-between text-slate-600">
              <span className="font-semibold">TOTAL BILLED</span>
              <span className="font-bold text-slate-900">
                ₹{summary.totalBilled.toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span className="font-semibold">TOTAL PAID</span>
              <span className="font-bold text-[#66BB6A]">
                ₹{summary.totalPaid.toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between text-slate-600 border-t border-slate-200 pt-1">
              <span className="font-bold text-slate-900">OUTSTANDING</span>
              <span className="font-bold text-[#EF4444]">
                ₹{summary.totalPending.toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between text-slate-500 text-[11px] pt-0.5">
              <span>Payment Rate</span>
              <span className="font-semibold text-slate-800">
                {summary.totalBilled > 0
                  ? Math.round(
                      (summary.totalPaid / summary.totalBilled) * 100,
                    )
                  : 100}
                %
              </span>
            </div>
          </div>
        </div>

        {/* 6. HOSPITAL STATEMENT NOTICE */}
        <div className="text-[10px] text-slate-400 text-center mt-6 pt-3 border-t border-slate-100">
          This is a computer-generated billing statement issued by Safe Hands
          Hospital and does not require a physical signature.
        </div>
      </section>
    </div>
  );
}

