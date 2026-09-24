import { useState, useMemo } from "react";
import { useNavigate } from "react-router";
import {
  FileText,
  Eye,
  Clock,
  Printer,
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

export function PatientMyBillsPage() {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const portal = usePatientPortal();
  const patientMrn = String(
    portal?.activeMrn ||
      portal?.primaryMrn ||
      user?.patientId ||
      user?.mrn ||
      user?.id ||
      "",
  );

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

  const columns: Column<InvoiceRecord>[] = useMemo(
    () => [
      {
        key: "id",
        label: "INVOICE NO",
        sortable: true,
        getValue: (inv) => inv.id,
        render: (inv) => (
          <span className="font-mono font-bold text-[#0D47A1]">
            {inv.id
              ? String(inv.id).startsWith("BL-")
                ? String(inv.id)
                : `BL-2026-${String(inv.id).padStart(6, "0")}`
              : inv.id}
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
        render: (inv) => (
          <div className="flex items-center justify-center gap-1">
            <button
              onClick={() =>
                navigate(
                  ROUTES.PATIENT_PORTAL_BILLING_DETAIL.replace(
                    ":billId",
                    inv.id,
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
                  ROUTES.BILLING_PRINT_PREVIEW.replace(":invoiceId", inv.id),
                )
              }
              className="p-1.5 rounded-lg text-slate-500 hover:text-[#0D47A1] hover:bg-blue-50 transition-colors cursor-pointer"
              title="Print Receipt"
            >
              <Printer size={15} />
            </button>
          </div>
        ),
      },
    ],
    [navigate],
  );

  return (
    <div className="w-full bg-[#F1F5F9] min-h-screen p-4 md:p-6 pb-28 space-y-6">
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
            className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-white border border-[#E5E7EB] text-slate-700 text-xs font-semibold hover:bg-slate-50 transition-colors shadow-sm"
            style={{ fontFamily: RB }}
          >
            <Printer size={14} />
            <span className="hidden sm:inline">Print Summary</span>
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

      {/* 4. BILLS TABLE WITH EMBEDDED FILTERS */}
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
  );
}
