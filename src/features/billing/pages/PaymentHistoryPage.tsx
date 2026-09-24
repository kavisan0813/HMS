import { useState, useMemo } from "react";
import { useNavigate } from "react-router";
import {
  Printer,
  Eye,
  Download,
  MoreVertical,
  X,
  FileText,
  Copy,
  ArrowLeft,
} from "lucide-react";
import { PP, RB } from "../constants/billing.constants";
import { useBillingList } from "../hooks/useBilling";
import { BillingStatusBadge } from "../components/BillingStatusBadge";
import { useAuthStore } from "../../auth/store/auth.store";
import { mapApiBillToInvoiceRecord } from "../utils/billing.utils";
import { DataTable } from "../../../common/components/DataTable";

interface PaymentHistoryRecord {
  receiptNo: string;
  invoiceId: string;
  paymentDate: string;
  patientName: string;
  mrn: string;
  mobile: string;
  doctorName: string;
  department: string;
  paymentMethod: string;
  referenceNo: string;
  invoiceAmount: number;
  amountPaid: number;
  balance: number;
  collectedBy: string;
  status: string;
  remarks: string;
}

export function PaymentHistoryPage() {
  const navigate = useNavigate();
  const role = useAuthStore((s) => s.user)?.role;
  const isUnauthorizedRole = ["DOCTOR", "NURSE", "PATIENT"].includes(
    String(role).toUpperCase(),
  );

  const { data: billsData, isLoading } = useBillingList(
    isUnauthorizedRole ? { enabled: false } : { page: 0, size: 200 },
  );
  const invoices = useMemo(
    () => (billsData?.bills || []).map(mapApiBillToInvoiceRecord),
    [billsData],
  );

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<string>("All");
  const [selectedMethod, setSelectedMethod] = useState<string>("All");
  const [selectedCashier, setSelectedCashier] = useState<string>("All");
  const [dateRange, setDateRange] = useState<string>("This Month");

  // Drawer State
  const [selectedDrawerPayment, setSelectedDrawerPayment] =
    useState<PaymentHistoryRecord | null>(null);
  const [showMoreMenuId, setShowMoreMenuId] = useState<string | null>(null);

  // Map invoices into ledger records
  const payments = useMemo((): PaymentHistoryRecord[] => {
    return invoices.flatMap((inv) => {
      if (inv.paidAmount <= 0 && inv.paymentStatus === "Pending") return [];
      return [
        {
          receiptNo: inv.billNumber || inv.id,
          invoiceId: inv.id,
          paymentDate: inv.invoiceDate,
          patientName: inv.patientName,
          mrn: inv.mrn,
          mobile: inv.mobile,
          doctorName: inv.doctorName,
          department: inv.department,
          paymentMethod: inv.paymentMethod,
          referenceNo: inv.notes || "",
          invoiceAmount: inv.invoiceAmount,
          amountPaid: inv.paidAmount,
          balance: inv.balance,
          collectedBy: inv.collectedBy,
          status: inv.paymentStatus,
          remarks: "",
        },
      ];
    });
  }, [invoices]);

  // Filtering
  const filteredPayments = useMemo(() => {
    return payments.filter((pay) => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        pay.receiptNo.toLowerCase().includes(q) ||
        pay.invoiceId.toLowerCase().includes(q) ||
        pay.patientName.toLowerCase().includes(q) ||
        pay.mrn.toLowerCase().includes(q) ||
        pay.mobile.includes(searchQuery);
      const matchesStatus =
        selectedStatus === "All" || pay.status === selectedStatus;
      const matchesMethod =
        selectedMethod === "All" || pay.paymentMethod === selectedMethod;
      const matchesCashier =
        selectedCashier === "All" || pay.collectedBy === selectedCashier;
      return matchesSearch && matchesStatus && matchesMethod && matchesCashier;
    });
  }, [payments, searchQuery, selectedStatus, selectedMethod, selectedCashier]);

  const handleResetFilters = () => {
    setSearchQuery("");
    setSelectedStatus("All");
    setSelectedMethod("All");
    setSelectedCashier("All");
    setDateRange("This Month");
  };

  const paymentFilterToolbar = (
    <div className="flex items-center justify-between gap-3 flex-wrap text-xs">
      <div className="flex items-center gap-2 flex-wrap">
        <select
          aria-label="Select date range"
          value={dateRange}
          onChange={(e) => setDateRange(e.target.value)}
          className="px-3 py-1.5 rounded-xl border border-[#E5E7EB] bg-white font-semibold text-[#0D47A1] text-xs outline-none cursor-pointer"
        >
          <option value="Today">Today's Transactions</option>
          <option value="This Week">This Week</option>
          <option value="This Month">This Month</option>
        </select>

        <select
          aria-label="Select payment status"
          value={selectedStatus}
          onChange={(e) => setSelectedStatus(e.target.value)}
          className="px-3 py-1.5 rounded-xl border border-[#E5E7EB] bg-white font-semibold text-[#0D47A1] text-xs outline-none cursor-pointer"
        >
          <option value="All">All Payment Statuses</option>
          <option value="Paid">Paid</option>
          <option value="Partially Paid">Partially Paid</option>
          <option value="Pending">Pending</option>
        </select>

        <select
          aria-label="Select payment method"
          value={selectedMethod}
          onChange={(e) => setSelectedMethod(e.target.value)}
          className="px-3 py-1.5 rounded-xl border border-[#E5E7EB] bg-white font-medium text-slate-700 text-xs outline-none cursor-pointer"
        >
          <option value="All">All Payment Methods</option>
          <option value="UPI">UPI / GPay / PhonePe</option>
          <option value="Cash">Cash</option>
          <option value="Card">Credit / Debit Card</option>
          <option value="Bank Transfer">Bank Transfer</option>
        </select>

        <select
          aria-label="Select cashier"
          value={selectedCashier}
          onChange={(e) => setSelectedCashier(e.target.value)}
          className="px-3 py-1.5 rounded-xl border border-[#E5E7EB] bg-white font-medium text-slate-700 text-xs outline-none cursor-pointer"
        >
          <option value="All">All Cashiers / Users</option>
        </select>

        <button
          onClick={handleResetFilters}
          className="px-3 py-1.5 rounded-xl text-xs text-[#EF4444] font-semibold hover:bg-red-50 transition-colors cursor-pointer"
        >
          Reset Filters
        </button>
      </div>

      <div className="text-xs text-[#64748B] font-medium">
        Showing{" "}
        <span className="font-bold text-[#0D47A1]">
          {filteredPayments.length}
        </span>{" "}
        records
      </div>
    </div>
  );

  return (
    <div className="w-full bg-[#F1F5F9] min-h-screen p-4 md:p-6 pb-28 space-y-6">
      {/* 1. PAGE HEADER */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
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
            className="text-xl md:text-2xl font-bold text-[#111827] tracking-tight"
            style={{ fontFamily: PP }}
          >
            Payment History Ledger
          </h1>
          <p
            className="text-xs md:text-sm text-[#64748B] mt-0.5"
            style={{ fontFamily: RB }}
          >
            Review all payment transactions, receipts and payment records.
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
            onClick={() => console.log("Exporting Payment History...")}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#0D47A1] text-white text-xs font-semibold hover:bg-blue-900 transition-colors shadow-sm active:scale-95 cursor-pointer"
            style={{ fontFamily: PP }}
          >
            <Download size={15} />
            Export Payment History
          </button>
        </div>
      </div>

      {/* 2. TRANSACTION LEDGER DATA TABLE */}
      <DataTable<PaymentHistoryRecord>
        data={filteredPayments}
        columns={[
          {
            key: "receiptNo",
            label: "RECEIPT NO",
            sortable: true,
            getValue: (p) => p.receiptNo,
            render: (p) => (
              <span className="font-mono font-bold text-[#0D47A1]">
                {p.receiptNo}
              </span>
            ),
          },
          {
            key: "invoiceId",
            label: "INVOICE ID",
            sortable: true,
            getValue: (p) => p.invoiceId,
            render: (p) => (
              <span className="font-mono text-slate-700">
                {p.invoiceId}
              </span>
            ),
          },
          {
            key: "paymentDate",
            label: "PAYMENT DATE",
            sortable: true,
            getValue: (p) => p.paymentDate,
            render: (p) => (
              <span className="text-slate-600 whitespace-nowrap">
                {p.paymentDate}
              </span>
            ),
          },
          {
            key: "patientName",
            label: "PATIENT & MRN",
            sortable: true,
            getValue: (p) => p.patientName,
            render: (p) => (
              <div>
                <span
                  className="font-bold text-[#111827] block"
                  style={{ fontFamily: PP }}
                >
                  {p.patientName}
                </span>
                <span className="font-mono text-[11px] text-slate-400">
                  {p.mrn}
                </span>
              </div>
            ),
          },
          {
            key: "doctorName",
            label: "DOCTOR",
            sortable: true,
            getValue: (p) => p.doctorName,
            render: (p) => (
              <span className="text-slate-700 font-medium">
                {p.doctorName}
              </span>
            ),
          },
          {
            key: "paymentMethod",
            label: "METHOD",
            sortable: true,
            getValue: (p) => p.paymentMethod,
            render: (p) => (
              <span className="font-medium">{p.paymentMethod}</span>
            ),
          },
          {
            key: "invoiceAmount",
            label: "INV AMOUNT",
            sortable: true,
            align: "right",
            getValue: (p) => p.invoiceAmount,
            render: (p) => (
              <span className="text-slate-700">
                ₹{p.invoiceAmount.toLocaleString()}
              </span>
            ),
          },
          {
            key: "amountPaid",
            label: "PAID",
            sortable: true,
            align: "right",
            getValue: (p) => p.amountPaid,
            render: (p) => (
              <span className="font-bold text-[#66BB6A]">
                ₹{p.amountPaid.toLocaleString()}
              </span>
            ),
          },
          {
            key: "balance",
            label: "BALANCE",
            sortable: true,
            align: "right",
            getValue: (p) => p.balance,
            render: (p) => (
              <span className="font-semibold text-[#EF4444]">
                {p.balance > 0 ? `₹${p.balance.toLocaleString()}` : "₹0"}
              </span>
            ),
          },
          {
            key: "collectedBy",
            label: "CASHIER",
            sortable: true,
            getValue: (p) => p.collectedBy,
            render: (p) => (
              <span className="text-slate-700">{p.collectedBy}</span>
            ),
          },
          {
            key: "status",
            label: "STATUS",
            sortable: true,
            align: "center",
            getValue: (p) => p.status,
            render: (p) => <BillingStatusBadge status={p.status} />,
          },
          {
            key: "actions",
            label: "ACTIONS",
            sortable: false,
            align: "center",
            render: (p) => (
              <div className="flex items-center justify-center gap-1">
                <button
                  onClick={() => setSelectedDrawerPayment(p)}
                  className="p-1.5 rounded-lg text-slate-500 hover:text-[#0D47A1] hover:bg-blue-50 transition-colors cursor-pointer"
                  title="View Details"
                >
                  <Eye size={14} />
                </button>
                <button
                  onClick={() =>
                    navigate(`/billing/invoice/${p.invoiceId}`)
                  }
                  className="p-1.5 rounded-lg text-slate-500 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                  title="Print Receipt"
                >
                  <Printer size={14} />
                </button>
                <div className="relative">
                  <button
                    aria-label="Action"
                    onClick={() =>
                      setShowMoreMenuId(
                        showMoreMenuId === p.receiptNo
                          ? null
                          : p.receiptNo,
                      )
                    }
                    className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-50 cursor-pointer"
                  >
                    <MoreVertical size={14} />
                  </button>
                  {showMoreMenuId === p.receiptNo && (
                    <div
                      className="absolute right-0 mt-1 w-44 bg-white rounded-xl border border-[#E5E7EB] shadow-lg py-1 z-30 text-left text-xs"
                      style={{ fontFamily: RB }}
                    >
                      <button
                        onClick={() => {
                          navigate(`/billing/invoice/${p.invoiceId}`);
                          setShowMoreMenuId(null);
                        }}
                        className="w-full px-3 py-2 text-[#111827] hover:bg-slate-50 flex items-center gap-2 cursor-pointer"
                      >
                        <FileText
                          size={13}
                          className="text-slate-400"
                        />
                        View Invoice
                      </button>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(p.referenceNo);
                          setShowMoreMenuId(null);
                        }}
                        className="w-full px-3 py-2 text-[#111827] hover:bg-slate-50 flex items-center gap-2 cursor-pointer"
                      >
                        <Copy size={13} className="text-slate-400" />
                        Copy Txn Reference
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ),
          },
        ]}
        getRowId={(p) => p.receiptNo}
        title="TRANSACTION LEDGER"
        subtitle="Complete record of receipts and collected payments"
        headerBadge={
          <span className="text-xs text-[#64748B]">
            Showing{" "}
            <strong className="text-[#111827]">
              {filteredPayments.length}
            </strong>{" "}
            records
          </span>
        }
        loading={isLoading}
        searchable={true}
        searchPlaceholder="Search by Receipt No, Invoice ID, Patient Name, MRN..."
        searchValue={searchQuery}
        onSearchChange={setSearchQuery}
        toolbar={paymentFilterToolbar}
        emptyTitle="No payment transactions found"
        emptySubtitle="Adjust filters or search for another receipt number, patient name or transaction reference."
        emptyIcon={<FileText size={32} />}
        emptyAction={
          <button
            onClick={handleResetFilters}
            className="px-4 py-2 rounded-xl bg-[#0D47A1] text-white text-xs font-semibold hover:bg-blue-900 cursor-pointer"
            style={{ fontFamily: PP }}
          >
            Clear Filters
          </button>
        }
        pagination={true}
      />

      {/* PAYMENT DETAILS DRAWER */}
      {selectedDrawerPayment && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs z-50 flex justify-end transition-opacity duration-200">
          <div className="bg-white w-full max-w-md h-full shadow-2xl p-6 overflow-y-auto space-y-5 transition-transform duration-200">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <div>
                <span className="text-[10px] text-[#0D47A1] font-bold uppercase tracking-wider">
                  Payment Ledger Record
                </span>
                <h3
                  className="text-base font-bold text-[#111827]"
                  style={{ fontFamily: PP }}
                >
                  {selectedDrawerPayment.receiptNo}
                </h3>
              </div>
              <button
                aria-label="Close"
                onClick={() => setSelectedDrawerPayment(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X size={18} />
              </button>
            </div>
            <div
              className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex justify-between items-center text-xs"
              style={{ fontFamily: RB }}
            >
              <div>
                <span className="text-slate-400 block text-[11px]">
                  Collected Amount
                </span>
                <span
                  className="text-lg font-bold text-[#66BB6A]"
                  style={{ fontFamily: PP }}
                >
                  ₹{selectedDrawerPayment.amountPaid.toLocaleString()}
                </span>
              </div>
              <BillingStatusBadge status={selectedDrawerPayment.status} />
            </div>
            <div className="space-y-3 text-xs" style={{ fontFamily: RB }}>
              <div className="grid grid-cols-2 gap-3 p-3.5 rounded-xl border border-slate-100 bg-white">
                <div>
                  <span className="text-slate-400 block text-[11px]">
                    Invoice ID
                  </span>
                  <span className="font-mono font-bold text-[#0D47A1]">
                    {selectedDrawerPayment.invoiceId}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">
                    Payment Date
                  </span>
                  <span className="font-medium text-[#111827]">
                    {selectedDrawerPayment.paymentDate}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">
                    Payment Mode
                  </span>
                  <span className="font-semibold text-slate-700">
                    {selectedDrawerPayment.paymentMethod}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">
                    Transaction Reference
                  </span>
                  <span className="font-mono text-slate-600 text-[11px]">
                    {selectedDrawerPayment.referenceNo}
                  </span>
                </div>
              </div>
              <div className="p-3.5 rounded-xl border border-slate-100 bg-white space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-500">Patient Name:</span>
                  <span className="font-bold text-[#111827]">
                    {selectedDrawerPayment.patientName}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">MRN:</span>
                  <span className="font-mono font-bold text-[#0D47A1]">
                    {selectedDrawerPayment.mrn}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Attending Doctor:</span>
                  <span className="text-slate-700">
                    {selectedDrawerPayment.doctorName}
                  </span>
                </div>
                <div className="flex justify-between border-t border-slate-100 pt-2 font-semibold">
                  <span className="text-slate-600">Collected By:</span>
                  <span className="text-[#111827]">
                    {selectedDrawerPayment.collectedBy}
                  </span>
                </div>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-[11px] text-slate-600">
                <span className="font-bold block text-slate-700">Remarks:</span>
                {selectedDrawerPayment.remarks}
              </div>
            </div>
            <div className="space-y-2 pt-2">
              <button
                onClick={() => {
                  navigate(
                    `/billing/invoice/${selectedDrawerPayment.invoiceId}`,
                  );
                  setSelectedDrawerPayment(null);
                }}
                className="w-full py-2.5 rounded-xl bg-[#0D47A1] text-white text-xs font-bold hover:bg-blue-900"
                style={{ fontFamily: PP }}
              >
                View Full Invoice Details
              </button>
              <button
                onClick={() => setSelectedDrawerPayment(null)}
                className="w-full py-2.5 rounded-xl border border-slate-200 text-slate-700 text-xs font-semibold hover:bg-slate-50"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


