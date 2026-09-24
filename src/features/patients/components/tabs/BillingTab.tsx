import { useState, useEffect, useMemo } from "react";
import {
  Search,
  FileText,
  Clock,
  Eye,
  Printer,
  Download,
  RotateCcw,
  Percent,
} from "lucide-react";
import type { Patient, ApiPatientInvoice } from "../../types/patient.types";
import type { InvoiceRecord } from "../../../billing/types/billing.types";
import { PP, RB } from "../../../doctors/constants/doctors.constants";
import { patientsApi } from "../../api/patient.api";
import { InvoiceDetailsDrawer } from "../../../billing/components/InvoiceDetailsDrawer";
import { mapApiInvoiceToInvoiceRecord } from "../../../billing/utils/billing.utils";
import { DataTable } from "../../../../common/components/DataTable";

export interface BillingTabProps {
  patient: Patient;
  canEdit: boolean;
  isOwnProfile: boolean;
}

function parseAmount(val?: string | number): number {
  if (typeof val === "number") return val;
  if (typeof val === "string") {
    const num = parseFloat(val.replace(/[^0-9.-]/g, ""));
    return isNaN(num) ? 0 : num;
  }
  return 0;
}

function renderBillingStatusBadge(status?: string) {
  const s = (status || "Pending").trim();
  const lower = s.toLowerCase();
  let badgeStyle = "bg-amber-50 text-amber-700 border-amber-200";

  if (lower === "paid" || lower === "settled" || lower === "completed") {
    badgeStyle = "bg-emerald-50 text-emerald-700 border-emerald-200";
  } else if (lower.includes("partially") || lower === "partial") {
    badgeStyle = "bg-yellow-50 text-yellow-700 border-yellow-200";
  } else if (lower === "pending" || lower === "unpaid" || lower === "overdue") {
    badgeStyle = "bg-amber-50 text-amber-700 border-amber-200";
  }

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${badgeStyle}`}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-current" />
      {s}
    </span>
  );
}

export function PatientBillingTab({ patient }: BillingTabProps) {
  const [invoices, setInvoices] = useState<ApiPatientInvoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [prevMrn, setPrevMrn] = useState<string | null>(null);
  const [selectedInvoice, setSelectedInvoice] = useState<InvoiceRecord | null>(
    null,
  );

  // Search and Filter State
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");

  if (patient.mrn !== prevMrn) {
    setPrevMrn(patient.mrn);
    setLoading(true);
  }

  useEffect(() => {
    let cancelled = false;
    patientsApi
      .getBilling(patient.mrn)
      .then((data) => {
        if (!cancelled) setInvoices(data || []);
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [patient.mrn]);

  const safeInvoices = useMemo(
    () => (Array.isArray(invoices) ? invoices : []),
    [invoices],
  );

  // Summary Metrics (Total Billed, Total Paid, Outstanding, Payment Rate)
  const summary = useMemo(() => {
    let totalBilled = 0;
    let totalPaid = 0;
    let totalOutstanding = 0;

    safeInvoices.forEach((inv) => {
      const amt = parseAmount(inv.amount);
      const paid =
        inv.paidAmount != null
          ? inv.paidAmount
          : inv.status === "Paid"
            ? amt
            : 0;
      const bal = inv.balance != null ? inv.balance : Math.max(0, amt - paid);

      totalBilled += amt;
      totalPaid += paid;
      totalOutstanding += bal;
    });

    const paymentRate =
      totalBilled > 0 ? Math.round((totalPaid / totalBilled) * 100) : 0;

    return {
      totalBilled,
      totalPaid,
      totalOutstanding,
      paymentRate,
      count: safeInvoices.length,
    };
  }, [safeInvoices]);

  // Filtering
  const filteredInvoices = useMemo(() => {
    return safeInvoices.filter((inv) => {
      const q = searchQuery.toLowerCase().trim();
      const invNo = String(inv.invoiceNumber || inv.id || "").toLowerCase();
      const doc = String(inv.doctorName || "").toLowerCase();
      const status = String(inv.status || "").toLowerCase();

      const matchesSearch =
        !q || invNo.includes(q) || doc.includes(q) || status.includes(q);

      const matchesStatus =
        statusFilter === "All" ||
        status.toLowerCase() === statusFilter.toLowerCase();

      return matchesSearch && matchesStatus;
    });
  }, [safeInvoices, searchQuery, statusFilter]);

  const isFilterActive = searchQuery.trim() !== "" || statusFilter !== "All";

  const handleResetFilters = () => {
    setSearchQuery("");
    setStatusFilter("All");
  };

  const handleOpenInvoice = (apiInv: ApiPatientInvoice) => {
    const record = mapApiInvoiceToInvoiceRecord(
      apiInv,
      patient.fullName || patient.name || "Patient",
      patient.mrn,
    );
    setSelectedInvoice(record);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8 text-xs text-[#64748B]">
        Loading billing data...
      </div>
    );
  }

  return (
    <div className="space-y-5" style={{ fontFamily: RB }}>
      {/* 1. Summary Cards (Exact matching Image 2) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Total Billed */}
        <div className="bg-white p-4 rounded-2xl border border-[#E5E7EB] shadow-xs space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-bold uppercase tracking-wider">
              Total Billed
            </span>
            <FileText size={16} className="text-[#0D47A1]" />
          </div>
          <div
            className="text-xl font-bold text-[#0D47A1]"
            style={{ fontFamily: PP }}
          >
            ₹{summary.totalBilled.toLocaleString("en-IN")}
          </div>
          <span className="text-[10px] text-slate-400">
            {summary.count} invoices
          </span>
        </div>

        {/* Total Paid */}
        <div className="bg-white p-4 rounded-2xl border border-[#E5E7EB] shadow-xs space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-bold uppercase tracking-wider">
              Total Paid
            </span>
            <Clock size={16} className="text-[#66BB6A]" />
          </div>
          <div
            className="text-xl font-bold text-[#66BB6A]"
            style={{ fontFamily: PP }}
          >
            ₹{summary.totalPaid.toLocaleString("en-IN")}
          </div>
          <span className="text-[10px] text-[#66BB6A] font-medium">
            Settled
          </span>
        </div>

        {/* Outstanding */}
        <div className="bg-white p-4 rounded-2xl border border-[#E5E7EB] shadow-xs space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-bold uppercase tracking-wider">
              Outstanding
            </span>
            <Clock size={16} className="text-[#F59E0B]" />
          </div>
          <div
            className="text-xl font-bold text-[#F59E0B]"
            style={{ fontFamily: PP }}
          >
            ₹{summary.totalOutstanding.toLocaleString("en-IN")}
          </div>
          <span className="text-[10px] text-amber-600 font-medium">
            Awaiting payment
          </span>
        </div>

        {/* Payment Rate */}
        <div className="bg-white p-4 rounded-2xl border border-[#E5E7EB] shadow-xs space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-bold uppercase tracking-wider">
              Payment Rate
            </span>
            <Percent size={16} className="text-purple-600" />
          </div>
          <div
            className="text-xl font-bold text-[#111827]"
            style={{ fontFamily: PP }}
          >
            {summary.paymentRate}%
          </div>
          <span className="text-[10px] text-slate-400">Of total billed</span>
        </div>
      </div>

      {/* 2. Filter Toolbar */}
      <div className="bg-white p-4 rounded-2xl border border-[#E5E7EB] shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3 text-xs">
          <div className="md:col-span-2 relative flex-1">
            <Search
              className="absolute left-3.5 top-2.5 text-slate-400"
              size={16}
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by Invoice No, Doctor, Patient Name, MRN..."
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-[#E5E7EB] rounded-xl outline-none focus:border-[#0D47A1] focus:bg-white font-medium transition-colors"
            />
          </div>

          <div className="flex items-center gap-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 bg-slate-50 border border-[#E5E7EB] rounded-xl font-semibold text-slate-700 outline-none focus:border-[#0D47A1] cursor-pointer"
            >
              <option value="All">All Payment Statuses</option>
              <option value="Paid">Paid</option>
              <option value="Partially Paid">Partially Paid</option>
              <option value="Pending">Pending</option>
            </select>

            {isFilterActive && (
              <button
                onClick={handleResetFilters}
                className="px-3 py-2 rounded-xl border border-slate-200 text-slate-600 font-semibold hover:bg-slate-50 transition-colors text-xs flex items-center gap-1 cursor-pointer"
              >
                <RotateCcw size={12} /> Reset Filters
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 3. Main Invoices Table Card (Matching Image 2 Layout) */}
      <div className="bg-white rounded-2xl border border-[#E5E7EB] p-5 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-gray-100 pb-3">
          <div>
            <h3
              className="text-sm font-bold text-[#111827]"
              style={{ fontFamily: PP }}
            >
              MY INVOICES ({filteredInvoices.length})
            </h3>
            <p className="text-xs text-[#64748B]">
              Complete record of your medical billing invoices
            </p>
          </div>
        </div>

        {filteredInvoices.length === 0 ? (
          <div className="py-12 text-center text-xs text-[#64748B]">
            No invoices found matching your filters.
          </div>
        ) : (
          <>
            {/* Desktop Table View rendered via common DataTable */}
            <div className="hidden md:block">
              <DataTable<ApiPatientInvoice>
                data={filteredInvoices}
                columns={[
                  {
                    key: "invoiceNumber",
                    label: "INVOICE NO",
                    sortable: true,
                    getValue: (inv) => inv.invoiceNumber || String(inv.id),
                    render: (inv) => {
                      const billId = inv.invoiceNumber || String(inv.id);
                      const displayInvNo = billId.startsWith("BL-")
                        ? billId
                        : `BL-2026-${String(billId).padStart(6, "0")}`;
                      return (
                        <button
                          type="button"
                          onClick={() => handleOpenInvoice(inv)}
                          className="font-mono font-bold text-[#0D47A1] hover:underline text-left cursor-pointer"
                        >
                          {displayInvNo}
                        </button>
                      );
                    },
                  },
                  {
                    key: "date",
                    label: "DATE",
                    sortable: true,
                    getValue: (inv) => inv.date || "",
                    render: (inv) => (
                      <span className="text-slate-600 whitespace-nowrap">
                        {inv.date || "—"}
                      </span>
                    ),
                  },
                  {
                    key: "doctorName",
                    label: "DOCTOR",
                    sortable: true,
                    getValue: (inv) => inv.doctorName || "",
                    render: (inv) => (
                      <span className="text-slate-700 font-semibold">
                        {inv.doctorName || "—"}
                      </span>
                    ),
                  },
                  {
                    key: "amount",
                    label: "AMOUNT",
                    sortable: true,
                    align: "right",
                    getValue: (inv) => parseAmount(inv.amount),
                    render: (inv) => (
                      <span className="text-slate-900 font-bold">
                        ₹{parseAmount(inv.amount).toLocaleString("en-IN")}
                      </span>
                    ),
                  },
                  {
                    key: "paidAmount",
                    label: "PAID",
                    sortable: true,
                    align: "right",
                    getValue: (inv) =>
                      inv.paidAmount != null
                        ? inv.paidAmount
                        : inv.status === "Paid"
                          ? parseAmount(inv.amount)
                          : 0,
                    render: (inv) => {
                      const amountNum = parseAmount(inv.amount);
                      const paidNum =
                        inv.paidAmount != null
                          ? inv.paidAmount
                          : inv.status === "Paid"
                            ? amountNum
                            : 0;
                      return (
                        <span className="font-bold text-[#66BB6A]">
                          ₹{paidNum.toLocaleString("en-IN")}
                        </span>
                      );
                    },
                  },
                  {
                    key: "balance",
                    label: "BALANCE",
                    sortable: true,
                    align: "right",
                    getValue: (inv) => {
                      const amountNum = parseAmount(inv.amount);
                      const paidNum =
                        inv.paidAmount != null
                          ? inv.paidAmount
                          : inv.status === "Paid"
                            ? amountNum
                            : 0;
                      return inv.balance != null
                        ? inv.balance
                        : Math.max(0, amountNum - paidNum);
                    },
                    render: (inv) => {
                      const amountNum = parseAmount(inv.amount);
                      const paidNum =
                        inv.paidAmount != null
                          ? inv.paidAmount
                          : inv.status === "Paid"
                            ? amountNum
                            : 0;
                      const balanceNum =
                        inv.balance != null
                          ? inv.balance
                          : Math.max(0, amountNum - paidNum);
                      return (
                        <span className="font-semibold text-[#EF4444]">
                          ₹{balanceNum.toLocaleString("en-IN")}
                        </span>
                      );
                    },
                  },
                  {
                    key: "status",
                    label: "STATUS",
                    sortable: true,
                    align: "center",
                    getValue: (inv) => inv.status,
                    render: (inv) => renderBillingStatusBadge(inv.status),
                  },
                  {
                    key: "actions",
                    label: "ACTIONS",
                    sortable: false,
                    align: "center",
                    render: (inv) => (
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleOpenInvoice(inv)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-[#0D47A1] hover:bg-blue-50 transition-colors cursor-pointer"
                          title="View Invoice Details"
                        >
                          <Eye size={15} />
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            handleOpenInvoice(inv);
                            setTimeout(() => window.print(), 300);
                          }}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                          title="Print Invoice / Receipt"
                        >
                          <Printer size={15} />
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            handleOpenInvoice(inv);
                            setTimeout(() => window.print(), 300);
                          }}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                          title="Download Receipt PDF"
                        >
                          <Download size={15} />
                        </button>
                      </div>
                    ),
                  },
                ]}
                getRowId={(inv) => inv.id}
                pagination={true}
              />
            </div>

            {/* Mobile View */}
            <div className="block md:hidden divide-y divide-gray-100">
              {filteredInvoices.map((inv) => {
                const billId = inv.invoiceNumber || String(inv.id);
                const displayInvNo = billId.startsWith("BL-")
                  ? billId
                  : `BL-2026-${String(billId).padStart(6, "0")}`;
                const amountNum = parseAmount(inv.amount);
                const paidNum =
                  inv.paidAmount != null
                    ? inv.paidAmount
                    : inv.status === "Paid"
                      ? amountNum
                      : 0;
                const balanceNum =
                  inv.balance != null
                    ? inv.balance
                    : Math.max(0, amountNum - paidNum);

                return (
                  <div key={inv.id} className="p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="font-mono font-bold text-[#0D47A1] text-xs">
                        {displayInvNo}
                      </span>
                      {renderBillingStatusBadge(inv.status)}
                    </div>
                    <div className="space-y-1 text-xs">
                      <div className="text-slate-500">
                        Date: {inv.date || "—"}
                      </div>
                      <div className="text-slate-700 font-medium">
                        Doctor: {inv.doctorName || "—"}
                      </div>
                      <div className="flex items-center justify-between pt-1">
                        <span className="text-slate-500">
                          Amount: ₹{amountNum.toLocaleString("en-IN")}
                        </span>
                        <span className="text-[#EF4444] font-bold">
                          Balance: ₹{balanceNum.toLocaleString("en-IN")}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-100">
                      <button
                        type="button"
                        onClick={() => handleOpenInvoice(inv)}
                        className="px-3 py-1.5 bg-blue-50 text-[#0D47A1] text-xs font-semibold rounded-xl flex items-center gap-1 cursor-pointer"
                        style={{ fontFamily: PP }}
                      >
                        <Eye size={14} /> View
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          handleOpenInvoice(inv);
                          setTimeout(() => window.print(), 300);
                        }}
                        className="p-1.5 text-slate-500 hover:bg-slate-100 rounded-lg cursor-pointer"
                        title="Print"
                      >
                        <Printer size={15} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>

      {/* Invoice Details & Receipt Drawer */}
      <InvoiceDetailsDrawer
        invoice={selectedInvoice}
        onClose={() => setSelectedInvoice(null)}
        onPrint={() => window.print()}
      />
    </div>
  );
}
