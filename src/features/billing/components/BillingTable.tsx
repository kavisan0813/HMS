import { useState, useMemo, useEffect } from "react";
import { createPortal } from "react-dom";
import {
  DollarSign,
  Printer,
  MoreVertical,
  History,
  Ban,
  FileText,
  Zap,
  RotateCcw,
  CreditCard,
  Building2,
  Filter,
  Calendar,
} from "lucide-react";
import { PP } from "../constants/billing.constants";
import type { InvoiceRecord } from "../types/billing.types";
import { BillingStatusBadge } from "./BillingStatusBadge";
import { DataTable, type Column } from "../../../common/components/DataTable";

interface BillingTableProps {
  invoices: InvoiceRecord[];
  isAdminReadOnly?: boolean;
  searchQuery?: string;
  onSearchChange?: (val: string) => void;
  statusFilter?: string;
  onStatusChange?: (val: string) => void;
  methodFilter?: string;
  onMethodChange?: (val: string) => void;
  deptFilter?: string;
  onDeptChange?: (val: string) => void;
  dateFilter?: string;
  onDateChange?: (val: string) => void;
  startDate?: string;
  onStartDateChange?: (val: string) => void;
  endDate?: string;
  onEndDateChange?: (val: string) => void;
  onResetFilters?: () => void;
  departmentOptions?: Array<{ value: string; label: string }>;
  title?: React.ReactNode;
  subtitle?: string;
  headerBadge?: React.ReactNode;
  loading?: boolean;
  onViewInvoiceDetailsClick?: (invoice: InvoiceRecord) => void;
  onCollectPaymentClick?: (invoice: InvoiceRecord) => void;
  onGenerateInvoiceClick?: (invoice: InvoiceRecord) => void;
  onCancelInvoice?: (invoiceId: string) => void;
  onViewPaymentHistory?: (invoice: InvoiceRecord) => void;
  onPrintInvoice?: (invoice: InvoiceRecord) => void;
}

export function BillingTable({
  invoices,
  isAdminReadOnly = false,
  searchQuery,
  onSearchChange,
  statusFilter = "All",
  onStatusChange,
  methodFilter = "All",
  onMethodChange,
  deptFilter = "All",
  onDeptChange,
  dateFilter = "All",
  onDateChange,
  startDate = "",
  onStartDateChange,
  endDate = "",
  onEndDateChange,
  onResetFilters,
  departmentOptions = [],
  title,
  subtitle,
  headerBadge,
  loading = false,
  onViewInvoiceDetailsClick,
  onCollectPaymentClick,
  onGenerateInvoiceClick,
  onCancelInvoice,
  onViewPaymentHistory,
  onPrintInvoice,
}: BillingTableProps) {
  const [menuAnchor, setMenuAnchor] = useState<{
    id: string;
    top?: number;
    bottom?: number;
    right: number;
    inv: InvoiceRecord;
  } | null>(null);

  useEffect(() => {
    if (!menuAnchor) return;
    const handleClose = () => setMenuAnchor(null);
    window.addEventListener("scroll", handleClose, true);
    window.addEventListener("resize", handleClose);
    return () => {
      window.removeEventListener("scroll", handleClose, true);
      window.removeEventListener("resize", handleClose);
    };
  }, [menuAnchor]);

  const columns: Column<InvoiceRecord>[] = useMemo(
    () => [
      {
        key: "billNumber",
        label: "INVOICE ID",
        sortable: true,
        getValue: (inv) => inv.billNumber || inv.id,
        render: (inv) => (
          <span className="font-bold text-[#0D47A1]" style={{ fontFamily: PP }}>
            {inv.billNumber || inv.id}
          </span>
        ),
      },
      {
        key: "patientName",
        label: "PATIENT NAME",
        sortable: true,
        getValue: (inv) => inv.patientName,
        render: (inv) => (
          <div>
            <span
              className="font-bold text-[#111827] block text-xs"
              style={{ fontFamily: PP }}
            >
              {inv.patientName}
            </span>
            <span className="text-[10px] text-slate-500 font-mono">
              MRN: {inv.mrn}
            </span>
          </div>
        ),
      },
      {
        key: "doctorName",
        label: "DOCTOR / DEPT",
        sortable: true,
        getValue: (inv) => inv.doctorName,
        render: (inv) => (
          <div>
            <span className="font-semibold text-slate-800 text-xs block">
              {inv.doctorName}
            </span>
            <span className="text-[10px] text-slate-500">
              {inv.department || "General OPD"}
            </span>
          </div>
        ),
      },
      {
        key: "invoiceDate",
        label: "DATE",
        sortable: true,
        getValue: (inv) => inv.invoiceDate,
        render: (inv) => (
          <span className="text-slate-600 font-medium text-xs font-mono">
            {inv.invoiceDate}
          </span>
        ),
      },
      {
        key: "invoiceAmount",
        label: "TOTAL",
        sortable: true,
        align: "right",
        getValue: (inv) => inv.invoiceAmount,
        render: (inv) => (
          <span className="font-bold text-slate-900" style={{ fontFamily: PP }}>
            ₹{inv.invoiceAmount.toFixed(2)}
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
          <span className="font-semibold text-[#009688]">
            ₹{inv.paidAmount.toFixed(2)}
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
          <span
            className={`font-bold ${
              inv.balance > 0 ? "text-[#EF4444]" : "text-slate-400"
            }`}
            style={{ fontFamily: PP }}
          >
            ₹{inv.balance.toFixed(2)}
          </span>
        ),
      },
      {
        key: "paymentStatus",
        label: "STATUS",
        sortable: true,
        getValue: (inv) => inv.paymentStatus || inv.status,
        render: (inv) => (
          <BillingStatusBadge status={inv.paymentStatus || inv.status} />
        ),
      },
      {
        key: "actions",
        label: "ACTIONS",
        sortable: false,
        align: "right",
        render: (inv) => (
          <div
            className="flex items-center justify-end gap-1.5"
            onClick={(e) => e.stopPropagation()}
          >
            {inv.status?.toUpperCase() === "READY_FOR_BILLING" ||
            inv.status?.toUpperCase() === "PENDING_BILLING" ||
            inv.status?.toUpperCase() === "PENDING" ? (
              !isAdminReadOnly && (
                <button
                  onClick={() => onGenerateInvoiceClick?.(inv)}
                  className="px-3 py-1.5 bg-[#0D47A1] hover:bg-[#0c3d8a] text-white text-xs font-semibold rounded-xl transition-colors flex items-center gap-1 cursor-pointer shadow-xs"
                  style={{ fontFamily: PP }}
                  title="Generate Invoice for this completed visit"
                >
                  <Zap size={13} /> Generate Invoice
                </button>
              )
            ) : (
              <button
                onClick={() => onViewInvoiceDetailsClick?.(inv)}
                className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
                style={{ fontFamily: PP }}
              >
                View
              </button>
            )}

            <div>
              <button
                type="button"
                aria-label="Action"
                onClick={(e) => {
                  e.stopPropagation();
                  if (menuAnchor?.id === inv.id) {
                    setMenuAnchor(null);
                  } else {
                    const rect = e.currentTarget.getBoundingClientRect();
                    const spaceBelow = window.innerHeight - rect.bottom;
                    const showAbove = spaceBelow < 140 && rect.top > 140;
                    setMenuAnchor({
                      id: inv.id,
                      top: showAbove ? undefined : rect.bottom + 4,
                      bottom: showAbove
                        ? window.innerHeight - rect.top + 4
                        : undefined,
                      right: window.innerWidth - rect.right,
                      inv,
                    });
                  }
                }}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <MoreVertical size={14} />
              </button>
            </div>
          </div>
        ),
      },
    ],
    [
      menuAnchor,
      isAdminReadOnly,
      onGenerateInvoiceClick,
      onViewInvoiceDetailsClick,
    ],
  );

  const hasActiveFilters =
    (statusFilter && statusFilter !== "All") ||
    (methodFilter && methodFilter !== "All") ||
    (deptFilter && deptFilter !== "All") ||
    (dateFilter && dateFilter !== "All") ||
    Boolean(startDate || endDate);

  const filterToolbar =
    onStatusChange || onMethodChange || onDeptChange || onDateChange ? (
      <div className="bg-slate-50/80 border border-[#E5E7EB] rounded-xl p-2.5 space-y-2 shadow-2xs text-xs">
        <div className="flex items-center gap-2 flex-wrap">
          {onDateChange && (
            <div className="flex items-center gap-1.5 bg-white border border-[#E5E7EB] px-2.5 py-1 rounded-lg text-slate-700 font-medium">
              <Calendar size={13} className="text-slate-400" />
              <span className="text-slate-400 text-[11px]">Date:</span>
              <select
                aria-label="Date range filter"
                value={dateFilter}
                onChange={(e) => onDateChange(e.target.value)}
                className="bg-transparent font-semibold text-[#0D47A1] outline-none cursor-pointer text-xs"
              >
                <option value="All">All Dates</option>
                <option value="Today">Today</option>
                <option value="Yesterday">Yesterday</option>
                <option value="This Week">This Week</option>
                <option value="This Month">This Month</option>
                <option value="Custom">Custom Range</option>
              </select>
            </div>
          )}

          {dateFilter === "Custom" && onStartDateChange && onEndDateChange && (
            <div className="flex items-center gap-1.5">
              <input
                type="date"
                value={startDate}
                onChange={(e) => onStartDateChange(e.target.value)}
                className="px-2 py-1 bg-white border border-[#E5E7EB] rounded-lg text-xs font-medium text-[#111827] outline-none focus:border-[#0D47A1]"
              />
              <span className="text-slate-400 text-xs">to</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => onEndDateChange(e.target.value)}
                className="px-2 py-1 bg-white border border-[#E5E7EB] rounded-lg text-xs font-medium text-[#111827] outline-none focus:border-[#0D47A1]"
              />
            </div>
          )}

          {onStatusChange && (
            <div className="flex items-center gap-1.5 bg-white border border-[#E5E7EB] px-2.5 py-1 rounded-lg text-slate-700 font-medium">
              <Filter size={13} className="text-slate-400" />
              <span className="text-slate-400 text-[11px]">
                Payment Status:
              </span>
              <select
                aria-label="Status filter"
                value={statusFilter}
                onChange={(e) => onStatusChange(e.target.value)}
                className="bg-transparent font-semibold text-[#0D47A1] outline-none cursor-pointer text-xs"
              >
                <option value="All">All Statuses</option>
                <option value="Pending">Pending</option>
                <option value="Partially Paid">Partially Paid</option>
                <option value="Paid">Paid</option>
                <option value="Cancelled">Cancelled</option>
                <option value="Refunded">Refunded</option>
              </select>
            </div>
          )}

          {onMethodChange && (
            <div className="flex items-center gap-1.5 bg-white border border-[#E5E7EB] px-2.5 py-1 rounded-lg text-slate-700 font-medium">
              <CreditCard size={13} className="text-slate-400" />
              <span className="text-slate-400 text-[11px]">Method:</span>
              <select
                aria-label="Payment method filter"
                value={methodFilter}
                onChange={(e) => onMethodChange(e.target.value)}
                className="bg-transparent font-semibold text-[#0D47A1] outline-none cursor-pointer text-xs"
              >
                <option value="All">All Methods</option>
                <option value="Cash">Cash</option>
                <option value="Card">Card</option>
                <option value="UPI">UPI</option>
                <option value="Bank Transfer">Bank Transfer</option>
              </select>
            </div>
          )}

          {onDeptChange && (
            <div className="flex items-center gap-1.5 bg-white border border-[#E5E7EB] px-2.5 py-1 rounded-lg text-slate-700 font-medium">
              <Building2 size={13} className="text-slate-400" />
              <span className="text-slate-400 text-[11px]">Dept:</span>
              <select
                aria-label="Department filter"
                value={deptFilter}
                onChange={(e) => onDeptChange(e.target.value)}
                className="bg-transparent font-semibold text-[#0D47A1] outline-none cursor-pointer text-xs"
              >
                <option value="All">All Departments</option>
                {departmentOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          )}

          {hasActiveFilters && onResetFilters && (
            <button
              onClick={onResetFilters}
              className="px-2.5 py-1 rounded-lg border border-red-200 bg-red-50 hover:bg-red-100 text-red-600 text-[11px] font-semibold transition-colors flex items-center gap-1 cursor-pointer shadow-2xs shrink-0 ml-auto"
              style={{ fontFamily: PP }}
            >
              <RotateCcw size={12} /> Clear Filters
            </button>
          )}
        </div>
      </div>
    ) : undefined;

  return (
    <>
      {menuAnchor && (
        <>
          <div
            role="presentation"
            className="fixed inset-0 z-40 bg-transparent"
            onClick={() => setMenuAnchor(null)}
          />
          {createPortal(
            <div
              style={{
                position: "fixed",
                ...(menuAnchor.top !== undefined
                  ? { top: `${menuAnchor.top}px` }
                  : {}),
                ...(menuAnchor.bottom !== undefined
                  ? { bottom: `${menuAnchor.bottom}px` }
                  : {}),
                right: `${menuAnchor.right}px`,
                zIndex: 9999,
              }}
              className="w-48 bg-white rounded-xl border border-[#E5E7EB] shadow-xl py-1 text-left"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                type="button"
                onClick={() => {
                  onViewPaymentHistory?.(menuAnchor.inv);
                  setMenuAnchor(null);
                }}
                className="w-full px-3 py-2 text-xs text-[#111827] hover:bg-slate-50 flex items-center gap-2 cursor-pointer font-medium"
              >
                <History size={13} className="text-slate-400" />
                View Payment History
              </button>
              {!isAdminReadOnly &&
                menuAnchor.inv.status?.toUpperCase() !== "READY_FOR_BILLING" &&
                menuAnchor.inv.status?.toUpperCase() !== "PENDING_BILLING" &&
                menuAnchor.inv.status?.toUpperCase() !== "PENDING" &&
                menuAnchor.inv.balance > 0 &&
                menuAnchor.inv.paymentStatus !== "Cancelled" && (
                  <button
                    type="button"
                    onClick={() => {
                      onCollectPaymentClick?.(menuAnchor.inv);
                      setMenuAnchor(null);
                    }}
                    className="w-full px-3 py-2 text-xs text-[#009688] hover:bg-teal-50 flex items-center gap-2 cursor-pointer font-medium"
                  >
                    <DollarSign size={13} className="text-[#009688]" />
                    Collect Payment
                  </button>
                )}
              <button
                type="button"
                onClick={() => {
                  if (onPrintInvoice) onPrintInvoice(menuAnchor.inv);
                  else onViewInvoiceDetailsClick?.(menuAnchor.inv);
                  setMenuAnchor(null);
                }}
                className="w-full px-3 py-2 text-xs text-slate-700 hover:bg-slate-50 flex items-center gap-2 cursor-pointer font-medium"
              >
                <Printer size={13} className="text-slate-400" />
                Print Invoice
              </button>
              {!isAdminReadOnly &&
                menuAnchor.inv.paymentStatus !== "Cancelled" &&
                menuAnchor.inv.paymentStatus !== "Refunded" && (
                  <button
                    type="button"
                    onClick={() => {
                      if (onCancelInvoice) onCancelInvoice(menuAnchor.inv.id);
                      setMenuAnchor(null);
                    }}
                    className="w-full px-3 py-2 text-xs text-[#EF4444] hover:bg-red-50 flex items-center gap-2 cursor-pointer font-medium"
                  >
                    <Ban size={13} className="text-slate-400" />
                    Cancel Invoice
                  </button>
                )}
            </div>,
            document.body,
          )}
        </>
      )}
      <DataTable<InvoiceRecord>
        data={invoices}
        columns={columns}
        loading={loading}
        getRowId={(inv) => inv.id}
        title={title}
        subtitle={subtitle}
        headerBadge={headerBadge}
        searchable={true}
        searchPlaceholder=" Search invoice number, patient name, doctor..."
        searchValue={searchQuery}
        onSearchChange={onSearchChange}
        toolbar={filterToolbar}
        emptyTitle="No invoices available"
        emptySubtitle="There are no billing records matching your search query or filter selection."
        emptyIcon={<FileText size={28} />}
        pagination={true}
      />
    </>
  );
}
