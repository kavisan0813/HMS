import { useState, useReducer, useMemo } from "react";
import { useNavigate } from "react-router";
import {
  Search,
  DollarSign,
  FileText,
  CheckCircle2,
  ChevronRight,
  Printer,
  User,
  ArrowLeft,
} from "lucide-react";
import { PP, RB } from "../constants/billing.constants";
import { useBillingList, usePayment } from "../hooks/useBilling";
import { BillingStatusBadge } from "../components/BillingStatusBadge";
import { mapApiBillToInvoiceRecord } from "../utils/billing.utils";
import type {
  PaymentMethod,
  InvoiceRecord,
  PaymentReceiveResponse,
} from "../types/billing.types";

type PaymentFormState = {
  searchQuery: string;
  paymentMethod: PaymentMethod;
  amount: number;
  referenceNumber: string;
  remarks: string;
};

type PaymentFormAction = {
  type: "SET_FIELD";
  field: keyof PaymentFormState;
  value: string | number;
};

const paymentFormReducer = (
  state: PaymentFormState,
  action: PaymentFormAction,
): PaymentFormState => ({
  ...state,
  [action.field]: action.value,
});

const RECEPTIONIST_BILLING_PARAMS = { page: 0, size: 200 } as const;

export function ReceptionistPaymentCollectionPage() {
  const navigate = useNavigate();
  const {
    data: billsData,
    isLoading,
    refetch,
  } = useBillingList(RECEPTIONIST_BILLING_PARAMS);
  const invoices = useMemo(
    () => (billsData?.bills || []).map(mapApiBillToInvoiceRecord),
    [billsData],
  );

  const [form, dispatch] = useReducer(paymentFormReducer, {
    searchQuery: "",
    paymentMethod: "Cash" as PaymentMethod,
    amount: 0,
    referenceNumber: "",
    remarks: "",
  });
  const setField = (field: keyof PaymentFormState, value: string | number) =>
    dispatch({ type: "SET_FIELD", field, value });

  const [selectedBill, setSelectedBill] = useState<InvoiceRecord | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [receiptData, setReceiptData] = useState<PaymentReceiveResponse | null>(
    null,
  );

  // Use selectedBill.id for payment
  const { receivePayment, isReceiving } = usePayment(selectedBill?.id);

  // Filter outstanding invoices
  const outstandingInvoices = useMemo(() => {
    return invoices.filter(
      (inv) =>
        inv.balance > 0 &&
        inv.paymentStatus !== "Paid" &&
        inv.paymentStatus !== "Cancelled",
    );
  }, [invoices]);

  const filteredInvoices = useMemo(() => {
    const q = form.searchQuery.toLowerCase().trim();
    if (!q) return outstandingInvoices;
    return outstandingInvoices.filter(
      (inv) =>
        inv.id.toLowerCase().includes(q) ||
        inv.patientName.toLowerCase().includes(q) ||
        inv.mrn.toLowerCase().includes(q) ||
        inv.mobile.includes(form.searchQuery),
    );
  }, [outstandingInvoices, form.searchQuery]);

  const handleSelectBill = (inv: InvoiceRecord) => {
    setSelectedBill(inv);
    setField("amount", inv.balance);
    setField("paymentMethod", "Cash");
    setField("referenceNumber", "");
    setField("remarks", "");
  };

  const [paymentError, setPaymentError] = useState<string | null>(null);

  const handleCollectPayment = async () => {
    if (!selectedBill || form.amount <= 0) return;
    if (
      form.paymentMethod.toUpperCase() !== "CASH" &&
      !form.referenceNumber.trim()
    ) {
      setPaymentError(
        "Reference / Transaction number is mandatory for non-cash payment methods (UPI, Card, Bank Transfer, Cheque).",
      );
      return;
    }
    setPaymentError(null);
    try {
      const result = await receivePayment({
        billId: selectedBill.id,
        payments: [
          {
            method: form.paymentMethod,
            amount: form.amount,
            referenceNumber: form.referenceNumber || undefined,
          },
        ],
        remarks: form.remarks || undefined,
      });
      setReceiptData(result);
      setShowSuccess(true);
      refetch();
    } catch (err: unknown) {
      console.error("Payment failed:", err);
      setPaymentError(
        err instanceof Error ? err.message : "Payment collection failed.",
      );
    }
  };

  const handleReset = () => {
    setSelectedBill(null);
    setField("amount", 0);
    setField("paymentMethod", "Cash");
    setField("referenceNumber", "");
    setField("remarks", "");
  };

  return (
    <div className="w-full bg-[#F1F5F9] min-h-screen p-4 md:p-6 pb-28 space-y-6">
      {/* 1. PAGE HEADER */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-white p-5 rounded-2xl border border-[#E5E7EB] shadow-sm">
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
          <div
            className="flex items-center gap-2 text-xs text-[#64748B] mb-1 font-medium"
            style={{ fontFamily: RB }}
          >
            <button
              type="button"
              className="hover:text-[#0D47A1] cursor-pointer"
              onClick={() => navigate("/billing")}
            >
              Home
            </button>
            <ChevronRight size={12} />
            <button
              type="button"
              className="hover:text-[#0D47A1] cursor-pointer"
              onClick={() => navigate("/billing")}
            >
              Billing & Payments
            </button>
            <ChevronRight size={12} />
            <span className="text-[#0D47A1] font-semibold">
              Receptionist Collection
            </span>
          </div>
          <h1
            className="text-xl md:text-2xl font-bold text-[#111827] tracking-tight"
            style={{ fontFamily: PP }}
          >
            Payment Collection Desk
          </h1>
          <p
            className="text-xs md:text-sm text-[#64748B] mt-0.5"
            style={{ fontFamily: RB }}
          >
            Quick payment collection for walk-in patients and outstanding
            invoices. Select a bill and process payment.
          </p>
        </div>
        <div className="flex items-center gap-2.5 shrink-0">
          <button
            onClick={() => window.print()}
            className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-white border border-[#E5E7EB] text-slate-700 text-xs font-semibold hover:bg-slate-50 transition-colors shadow-sm"
            style={{ fontFamily: RB }}
          >
            <Printer size={14} />
            <span className="hidden sm:inline">Print Report</span>
          </button>
        </div>
      </div>

      {/* 2. VERIFICATION CHECKLIST */}
      <div className="bg-white rounded-2xl border border-[#E5E7EB] p-5 shadow-sm">
        <div className="flex items-center gap-2 border-b border-gray-100 pb-3 mb-3">
          <CheckCircle2 size={14} className="text-[#66BB6A]" />
          <h2
            className="text-sm font-bold text-[#111827]"
            style={{ fontFamily: PP }}
          >
            PRE-COLLECTION VERIFICATION
          </h2>
        </div>
        <div
          className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs"
          style={{ fontFamily: RB }}
        >
          {[
            { label: "Patient Identity Verified", done: !!selectedBill },
            { label: "Invoice Number Confirmed", done: !!selectedBill },
            {
              label: "Payment Amount Matches",
              done:
                selectedBill &&
                form.amount > 0 &&
                form.amount <= selectedBill.balance,
            },
            { label: "Payment Method Selected", done: true },
          ].map((item, i) => (
            <div
              key={item.label}
              className={`p-3 rounded-xl border flex items-center gap-2 ${item.done ? "border-green-200 bg-green-50" : "border-slate-200 bg-slate-50"}`}
            >
              <div
                className={`w-5 h-5 rounded-full flex items-center justify-center ${item.done ? "bg-[#66BB6A] text-white" : "bg-slate-200 text-slate-400"}`}
              >
                {item.done ? (
                  <CheckCircle2 size={12} />
                ) : (
                  <span className="text-[10px]">{i + 1}</span>
                )}
              </div>
              <span
                className={`font-medium ${item.done ? "text-green-700" : "text-slate-500"}`}
              >
                {item.label}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* 3. TWO-COLUMN LAYOUT */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* LEFT: OUTSTANDING INVOICES */}
        <div className="xl:col-span-2 space-y-4">
          <div className="bg-white rounded-2xl border border-[#E5E7EB] p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-amber-50 text-[#F59E0B] flex items-center justify-center font-bold">
                  <FileText size={16} />
                </div>
                <div>
                  <h2
                    className="text-sm font-bold text-[#111827]"
                    style={{ fontFamily: PP }}
                  >
                    OUTSTANDING INVOICES ({outstandingInvoices.length})
                  </h2>
                  <p
                    className="text-xs text-[#64748B]"
                    style={{ fontFamily: RB }}
                  >
                    Select an invoice to collect payment
                  </p>
                </div>
              </div>
            </div>

            {/* SEARCH */}
            <div className="relative">
              <Search
                className="absolute left-3.5 top-2.5 text-slate-400"
                size={16}
              />
              <input
                aria-label="Input field"
                type="text"
                value={form.searchQuery}
                onChange={(e) => setField("searchQuery", e.target.value)}
                placeholder="Search by Invoice No, Patient Name, MRN..."
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[#E5E7EB] bg-slate-50 focus:bg-white focus:border-[#0D47A1] focus:outline-none text-xs font-medium"
              />
            </div>

            {/* INVOICE LIST */}
            <div className="space-y-2 max-h-100 overflow-y-auto">
              {isLoading ? (
                <div className="py-8 text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#0D47A1] mx-auto mb-2" />
                  <p className="text-xs text-slate-500">Loading invoices...</p>
                </div>
              ) : filteredInvoices.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-400">
                  {form.searchQuery
                    ? "No invoices match your search."
                    : "No outstanding invoices found."}
                </div>
              ) : (
                filteredInvoices.map((inv) => (
                  <div
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        (e.currentTarget as HTMLElement).click();
                      }
                    }}
                    role="button"
                    key={inv.id}
                    onClick={() => handleSelectBill(inv)}
                    className={`p-4 rounded-xl border cursor-pointer transition-colors ${selectedBill?.id === inv.id ? "border-[#0D47A1] bg-blue-50 shadow-sm" : "border-[#E5E7EB] bg-white hover:bg-slate-50"}`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-[#0D47A1] text-white font-bold text-sm flex items-center justify-center shrink-0">
                          {inv.patientName.charAt(0)}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-sm text-[#0D47A1]">
                              {inv.id}
                            </span>
                            <BillingStatusBadge status={inv.paymentStatus} />
                          </div>
                          <div
                            className="text-xs font-bold text-[#111827]"
                            style={{ fontFamily: PP }}
                          >
                            {inv.patientName}
                          </div>
                          <div className="text-[10px] text-slate-400 font-mono">
                            {inv.mrn}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-xs text-slate-500">
                          Balance Due
                        </div>
                        <div
                          className="text-lg font-bold text-[#EF4444]"
                          style={{ fontFamily: PP }}
                        >
                          ₹{inv.balance.toLocaleString()}
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* RIGHT: PAYMENT ENTRY */}
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-[#E5E7EB] p-5 shadow-sm space-y-4 sticky top-6">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div>
                <span className="text-[10px] text-[#0D47A1] font-bold tracking-widest uppercase">
                  Payment
                </span>
                <h3
                  className="text-sm font-bold text-[#111827]"
                  style={{ fontFamily: PP }}
                >
                  Collect Payment
                </h3>
              </div>
              {selectedBill && (
                <button
                  onClick={handleReset}
                  className="text-[10px] text-slate-400 hover:text-slate-600 font-semibold"
                >
                  Reset
                </button>
              )}
            </div>

            {selectedBill ? (
              <div className="space-y-4 text-xs" style={{ fontFamily: RB }}>
                {/* Selected Bill Summary */}
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Invoice:</span>
                    <span className="font-mono font-bold text-[#0D47A1]">
                      {selectedBill.id}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Patient:</span>
                    <span className="font-bold text-[#111827]">
                      {selectedBill.patientName}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Invoice Amount:</span>
                    <span className="font-semibold">
                      ₹{selectedBill.invoiceAmount.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Already Paid:</span>
                    <span className="font-semibold text-[#66BB6A]">
                      ₹{selectedBill.paidAmount.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between border-t border-slate-200 pt-2">
                    <span className="font-bold text-[#EF4444]">
                      Balance Due:
                    </span>
                    <span className="font-bold text-[#EF4444]">
                      ₹{selectedBill.balance.toLocaleString()}
                    </span>
                  </div>
                </div>

                {/* Payment Method */}
                <div>
                  <span className="block text-slate-700 font-semibold mb-2">
                    Payment Method *
                  </span>
                  <div className="grid grid-cols-2 gap-2">
                    {(
                      [
                        "Cash",
                        "UPI",
                        "Card",
                        "Bank Transfer",
                      ] as PaymentMethod[]
                    ).map((pm) => (
                      <button
                        key={pm}
                        type="button"
                        onClick={() => setField("paymentMethod", pm)}
                        className={`p-2.5 rounded-xl border text-xs font-semibold transition-colors ${form.paymentMethod === pm ? "border-[#0D47A1] bg-blue-50 text-[#0D47A1]" : "border-[#E5E7EB] text-slate-600 hover:bg-slate-50"}`}
                      >
                        {pm}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Amount */}
                <div>
                  <span className="block text-slate-700 font-semibold mb-1">
                    Amount (₹) *
                    <input
                      aria-label="Input field"
                      type="number"
                      value={form.amount || ""}
                      onChange={(e) => {
                        const v = e.currentTarget.valueAsNumber;
                        setField("amount", Number.isFinite(v) ? v : 0);
                      }}
                      max={selectedBill.balance}
                      className="w-full px-3 py-2.5 rounded-xl border border-[#E5E7EB] bg-slate-50 text-sm font-bold text-[#111827] focus:bg-white focus:border-[#0D47A1] focus:outline-none"
                    />
                  </span>
                  <button
                    type="button"
                    onClick={() => setField("amount", selectedBill.balance)}
                    className="text-[10px] text-[#0D47A1] font-bold hover:underline mt-1"
                  >
                    Pay Full Balance
                  </button>
                </div>

                {/* Reference */}
                {form.paymentMethod.toUpperCase() !== "CASH" && (
                  <div>
                    <span className="block text-slate-700 font-semibold mb-1">
                      Reference Number
                      <input
                        aria-label="Input field"
                        type="text"
                        value={form.referenceNumber}
                        onChange={(e) =>
                          setField("referenceNumber", e.target.value)
                        }
                        placeholder="e.g. UPI Ref / Txn ID"
                        className="w-full px-3 py-2 rounded-xl border border-[#E5E7EB] bg-slate-50 text-xs font-mono focus:bg-white focus:border-[#0D47A1] focus:outline-none"
                      />
                    </span>
                  </div>
                )}

                {/* Remarks */}
                <div>
                  <span className="block text-slate-700 font-semibold mb-1">
                    Remarks
                  </span>
                  <textarea
                    aria-label="Text area"
                    rows={2}
                    value={form.remarks}
                    onChange={(e) => setField("remarks", e.target.value)}
                    placeholder="Optional notes..."
                    className="w-full px-3 py-2 rounded-xl border border-[#E5E7EB] bg-slate-50 text-xs focus:bg-white focus:border-[#0D47A1] focus:outline-none"
                  />
                </div>

                {paymentError && (
                  <p className="text-[11px] text-red-600 font-medium bg-red-50 p-2 rounded-lg border border-red-200">
                    {paymentError}
                  </p>
                )}

                {/* Collect Button */}
                <button
                  onClick={handleCollectPayment}
                  disabled={
                    isReceiving ||
                    form.amount <= 0 ||
                    form.amount > selectedBill.balance
                  }
                  className="w-full py-3 rounded-xl bg-[#009688] text-white text-xs font-bold hover:bg-teal-700 transition-colors shadow-sm disabled:opacity-50 flex items-center justify-center gap-2"
                  style={{ fontFamily: PP }}
                >
                  <DollarSign size={15} />
                  {isReceiving
                    ? "Processing..."
                    : `Collect ₹${form.amount.toLocaleString()}`}
                </button>
              </div>
            ) : (
              <div className="py-8 text-center space-y-3">
                <div className="w-14 h-14 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                  <User size={24} />
                </div>
                <p
                  className="text-xs text-slate-500 font-medium"
                  style={{ fontFamily: RB }}
                >
                  Select an outstanding invoice from the list to collect
                  payment.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* BOTTOM STICKY BAR */}
      <div className="sticky bottom-0 -mx-4 md:-mx-6 -mb-4 md:-mb-6 bg-white/95 backdrop-blur-md border-t border-[#E5E7EB] p-3.5 px-6 z-40 flex items-center justify-between shadow-lg">
        <button
          onClick={() => navigate("/billing")}
          className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 text-xs font-medium hover:bg-slate-100"
        >
          Back to Billing
        </button>
        {selectedBill && (
          <button
            onClick={handleCollectPayment}
            disabled={
              isReceiving ||
              form.amount <= 0 ||
              form.amount > selectedBill.balance
            }
            className="flex items-center gap-2 px-6 py-2 rounded-xl bg-[#009688] text-white text-xs font-bold hover:bg-teal-700 transition-colors shadow-sm disabled:opacity-50"
            style={{ fontFamily: PP }}
          >
            <DollarSign size={15} />
            {isReceiving
              ? "Processing..."
              : `Collect ₹${form.amount.toLocaleString()}`}
          </button>
        )}
      </div>

      {/* SUCCESS MODAL */}
      {showSuccess && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-[#E5E7EB] shadow-2xl w-full max-w-md p-6 text-center space-y-4 transition-transform duration-200">
            <div className="w-14 h-14 rounded-full bg-green-50 text-[#66BB6A] flex items-center justify-center mx-auto border-2 border-green-200">
              <CheckCircle2 size={32} />
            </div>
            <div>
              <h3
                className="text-lg font-bold text-[#111827]"
                style={{ fontFamily: PP }}
              >
                Payment Collected!
              </h3>
              <p
                className="text-xs text-[#64748B] mt-1"
                style={{ fontFamily: RB }}
              >
                Receipt{" "}
                <span className="font-bold text-[#0D47A1]">
                  {receiptData?.receiptNumber || selectedBill?.id}
                </span>{" "}
                generated.
              </p>
            </div>
            <div
              className="p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs space-y-1 text-left"
              style={{ fontFamily: RB }}
            >
              <div className="flex justify-between">
                <span className="text-slate-500">Amount Collected:</span>
                <span className="font-bold text-[#66BB6A]">
                  ₹{form.amount.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Payment Method:</span>
                <span className="font-semibold text-[#111827]">
                  {form.paymentMethod}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Patient:</span>
                <span className="font-bold text-[#111827]">
                  {selectedBill?.patientName}
                </span>
              </div>
            </div>
            <div className="pt-2 space-y-2">
              <button
                onClick={() => {
                  setShowSuccess(false);
                  handleReset();
                }}
                className="w-full py-2.5 rounded-xl bg-[#0D47A1] text-white text-xs font-bold hover:bg-blue-900 transition-colors shadow-sm"
                style={{ fontFamily: PP }}
              >
                Collect Another Payment
              </button>
              <button
                onClick={() => {
                  setShowSuccess(false);
                  navigate("/billing");
                }}
                className="w-full py-2 rounded-xl border border-slate-200 text-slate-600 text-xs font-medium hover:bg-slate-50"
              >
                Back to Billing Dashboard
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
