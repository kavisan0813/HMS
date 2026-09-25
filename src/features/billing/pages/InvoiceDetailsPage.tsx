import { useState } from "react";
import { useParams, useNavigate } from "react-router";
import {
  FileText,
  Printer,
  DollarSign,
  MoreVertical,
  Ban,
  RotateCcw,
  Eye,
  CheckCircle2,
  ArrowLeft,
} from "lucide-react";
import { PP, RB } from "../constants/billing.constants";
import { useInvoice, usePayment } from "../hooks/useBilling";
import { BillingStatusBadge } from "../components/BillingStatusBadge";
import { checkBillingPermission } from "../permissions/billing.permissions";
import { useAuthStore } from "../../auth/store/auth.store";
import type { BillPaymentRecord } from "../types/billing.types";

export function InvoiceDetailsPage() {
  const { invoiceId, billId } = useParams<{
    invoiceId?: string;
    billId?: string;
  }>();
  const targetId = invoiceId || billId;
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const role = user?.role;
  const isPatient = String(role || "").toUpperCase() === "PATIENT";
  const backUrl = isPatient ? "/patient/billing" : "/billing";

  const {
    bill,
    isLoading,
    isError,
    cancelBill,
    voidBill,
    isRefunding,
    refund,
  } = useInvoice(targetId);

  const { paymentHistory } = usePayment(targetId);

  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const [showRefundModal, setShowRefundModal] = useState(false);
  const [refundAmount, setRefundAmount] = useState<number>(0);
  const [refundReason, setRefundReason] = useState("");
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  const canEdit = !isPatient && checkBillingPermission(role, "edit_invoice");
  const canCancel =
    !isPatient && checkBillingPermission(role, "cancel_invoice");
  const canRefund =
    !isPatient && checkBillingPermission(role, "refund_invoice");
  const canCollectRole =
    !isPatient && checkBillingPermission(role, "collect_payment");

  const showSuccess = (message: string) => {
    setActionSuccess(message);
    setTimeout(() => setActionSuccess(null), 3000);
  };

  const handleCancel = async () => {
    if (targetId) {
      await cancelBill({
        id: targetId,
        reason: "Cancelled by " + (user?.name || "staff"),
      });
      showSuccess("Invoice cancelled successfully");
      setShowMoreMenu(false);
    }
  };

  const handleVoid = async () => {
    if (targetId) {
      await voidBill({
        id: targetId,
        reason: "Voided by " + (user?.name || "staff"),
      });
      showSuccess("Invoice voided successfully");
      setShowMoreMenu(false);
    }
  };

  const handleRefund = async () => {
    if (targetId && refundAmount > 0 && refundAmount <= paidAmount) {
      await refund({
        billId: targetId,
        amount: refundAmount,
        reason: refundReason,
      });
      setShowRefundModal(false);
      setRefundAmount(0);
      setRefundReason("");
      showSuccess("Refund processed successfully");
    }
  };

  const handleCollectPayment = () => {
    if (targetId) {
      navigate(`/billing/collect-payment/${targetId}`);
    }
  };

  const bRec = bill as unknown as Record<string, unknown>;
  const docObj = (bRec?.doctor as Record<string, unknown>) || {};
  const patObj = (bRec?.patient as Record<string, unknown>) || {};

  const patientName =
    (bRec?.patientName as string) ||
    (patObj.name as string) ||
    (patObj.fullName as string) ||
    "N/A";
  const patientMrn =
    (bRec?.patientMrn as string) ||
    (patObj.mrn as string) ||
    (bRec?.mrn as string) ||
    "N/A";
  const patientPhone = String(
    patObj.phone || patObj.registeredMobile || bRec?.mobile || "",
  );
  const doctorName = String(
    bRec?.doctorName ||
    bRec?.doctor_name ||
    docObj.fullName ||
    docObj.name ||
    docObj.doctorName ||
    bRec?.attendingDoctorName ||
    bRec?.attendingDoctor ||
    "N/A",
  );
  const displayInvoiceNo = targetId
    ? targetId.startsWith("BL-")
      ? targetId
      : targetId.startsWith("INV-")
        ? `BL-2026-${targetId.replace("INV-", "").padStart(6, "0")}`
        : `BL-2026-${String(targetId).padStart(6, "0")}`
    : bill?.billNumber || "BL-2026-000387";

  const doctorCode = String(docObj.doctorCode || docObj.code || "");
  const summaryData = bill?.summary;
  const items = bill?.items || [];
  const paymentRecords =
    bill?.paymentHistory && bill.paymentHistory.length > 0
      ? bill.paymentHistory
      : paymentHistory?.payments || [];

  const netAmount = summaryData?.netAmount ?? 0;
  const paidAmount = summaryData?.paidAmount ?? 0;
  const balanceAmount =
    summaryData?.balanceAmount ?? Math.max(0, netAmount - paidAmount);
  const progressPercent = Math.min(
    100,
    netAmount > 0 ? Math.round((paidAmount / netAmount) * 100) : 0,
  );

  const isDraft = bill?.status === "DRAFT";
  const isFinalized = bill?.status === "FINALIZED";
  const isCancelled = bill?.status === "CANCELLED";
  const isVoided = bill?.status === "VOIDED";

  const capabilities = bill?.capabilities;
  const canCollect =
    (capabilities?.canCollectPayment ??
      (balanceAmount > 0 && !isCancelled && !isVoided)) &&
    canCollectRole;
  const canCancelAction = (capabilities?.canCancel ?? isDraft) && canCancel;
  const canVoidAction = (capabilities?.canVoid ?? isFinalized) && canCancel;
  const canRefundAction =
    (capabilities?.canRefund ?? paidAmount > 0) && canRefund;

  if (isLoading) {
    return (
      <div className="p-8 text-center bg-slate-50 min-h-screen flex flex-col items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#0D47A1] mb-4" />
        <p className="text-sm text-slate-500">Loading invoice details...</p>
      </div>
    );
  }

  if (isError || !bill) {
    return (
      <div className="p-8 text-center bg-slate-50 min-h-screen flex flex-col items-center justify-center space-y-4">
        <FileText size={48} className="text-slate-300 animate-bounce" />
        <h2
          className="text-lg font-bold text-slate-800"
          style={{ fontFamily: PP }}
        >
          Invoice Not Found
        </h2>
        <p className="text-sm text-slate-500">
          The invoice reference "{targetId}" does not exist or you do not have
          permission to view it.
        </p>
        <button
          onClick={() => navigate(backUrl)}
          className="px-4 py-2 rounded-xl bg-[#0D47A1] text-white text-xs font-bold hover:bg-blue-900 cursor-pointer"
        >
          {isPatient ? "Return to My Bills" : "Return to Billing Register"}
        </button>
      </div>
    );
  }

  return (
    <div className="w-full bg-[#F1F5F9] min-h-screen p-4 md:p-6 pb-28 space-y-6">
      {/* Success Toast */}
      {actionSuccess && (
        <div className="fixed top-4 right-4 bg-white rounded-xl border border-[#E5E7EB] shadow-lg p-3 flex items-center gap-2 z-50 transition-opacity slide-in-from-right">
          <CheckCircle2 size={16} className="text-[#66BB6A]" />
          <span
            className="text-xs font-semibold text-[#111827]"
            style={{ fontFamily: RB }}
          >
            {actionSuccess}
          </span>
        </div>
      )}

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

          <div className="flex items-center gap-3">
            <h1
              className="text-xl md:text-2xl font-bold text-[#111827] tracking-tight"
              style={{ fontFamily: PP }}
            >
              Invoice — {displayInvoiceNo}
            </h1>
            <BillingStatusBadge status={String(bill.paymentStatus || "")} />
          </div>
          <p
            className="text-xs md:text-sm text-[#64748B] mt-0.5"
            style={{ fontFamily: RB }}
          >
            Review invoice details, itemizations, payment receipts, and
            collection records.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          {canCollect && canEdit && (
            <button
              onClick={handleCollectPayment}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#009688] text-white text-xs font-semibold hover:bg-teal-700 transition-colors shadow-sm active:scale-95 cursor-pointer"
              style={{ fontFamily: PP }}
            >
              <DollarSign size={15} />
              Collect Payment
            </button>
          )}
          <button
            onClick={() => navigate(`/billing/invoice/${targetId}/print`)}
            className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-white border border-[#E5E7EB] text-slate-700 text-xs font-semibold hover:bg-slate-50 transition-colors shadow-sm cursor-pointer"
            style={{ fontFamily: RB }}
          >
            <Eye size={14} />
            <span className="hidden sm:inline">Print Preview</span>
          </button>
          {!isPatient &&
            (canCancelAction || canVoidAction || canRefundAction) && (
              <div className="relative">
                <button
                  aria-label="Action"
                  onClick={() => setShowMoreMenu(!showMoreMenu)}
                  className="p-2.5 rounded-xl bg-white border border-[#E5E7EB] text-slate-500 hover:text-slate-700 hover:bg-slate-50 transition-colors shadow-sm cursor-pointer"
                >
                  <MoreVertical size={16} />
                </button>
                {showMoreMenu && (
                  <div
                    className="absolute right-0 mt-1 w-44 bg-white rounded-xl border border-[#E5E7EB] shadow-lg py-1 z-30 text-left text-xs"
                    style={{ fontFamily: RB }}
                  >
                    <button
                      onClick={() => {
                        navigate(`/billing/invoice/${targetId}/print`);
                        setShowMoreMenu(false);
                      }}
                      className="w-full px-3 py-2 text-slate-700 hover:bg-slate-50 flex items-center gap-2 font-medium cursor-pointer"
                    >
                      <Eye size={13} />
                      View Print Preview
                    </button>
                    {canCancelAction && (
                      <button
                        onClick={handleCancel}
                        className="w-full px-3 py-2 text-[#EF4444] hover:bg-red-50 flex items-center gap-2 font-medium cursor-pointer"
                      >
                        <Ban size={13} />
                        Cancel Invoice
                      </button>
                    )}
                    {canVoidAction && (
                      <button
                        onClick={handleVoid}
                        className="w-full px-3 py-2 text-[#F59E0B] hover:bg-amber-50 flex items-center gap-2 font-medium cursor-pointer"
                      >
                        <Ban size={13} />
                        Void Invoice
                      </button>
                    )}
                    {canRefundAction && (
                      <button
                        onClick={() => {
                          setShowRefundModal(true);
                          setShowMoreMenu(false);
                        }}
                        className="w-full px-3 py-2 text-[#F59E0B] hover:bg-amber-50 flex items-center gap-2 font-medium cursor-pointer"
                      >
                        <RotateCcw size={13} />
                        Process Refund
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}
        </div>
      </div>

      {/* 2. TWO-COLUMN LAYOUT */}
      <div className="grid grid-cols-1  gap-6">
        <div className="xl:col-span-2 space-y-6">
          {/* Invoice Metadata */}
          <div className="bg-white rounded-2xl border border-[#E5E7EB] p-5 shadow-sm space-y-4">
            <h2
              className="text-sm font-bold text-[#111827] border-b border-slate-100 pb-2"
              style={{ fontFamily: PP }}
            >
              Invoice Metadata
            </h2>
            <div
              className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 text-xs"
              style={{ fontFamily: RB }}
            >
              <div>
                <span className="text-slate-400 block text-[11px]">
                  Invoice Number
                </span>
                <span className="font-mono font-bold text-sm text-[#0D47A1]">
                  {displayInvoiceNo}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">
                  Bill Type
                </span>
                <span className="font-semibold text-[#111827]">
                  {bill.billType || "OPD"}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">
                  Bill Status
                </span>
                <span className="font-medium text-[#111827]">
                  {bill.status}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">
                  Payment Status
                </span>
                <span className="font-medium text-[#111827]">
                  {bill.paymentStatus}
                </span>
              </div>
              {bill.createdAt && (
                <div>
                  <span className="text-slate-400 block text-[11px]">
                    Created Date
                  </span>
                  <span className="font-medium text-slate-700">
                    {new Date(bill.createdAt).toLocaleDateString()}
                  </span>
                </div>
              )}
              {bill.appointment && (
                <div>
                  <span className="text-slate-400 block text-[11px]">
                    Appointment
                  </span>
                  <span className="font-mono text-slate-700">
                    {bill.appointment.appointmentNumber}
                  </span>
                </div>
              )}
              {bill.encounter && (
                <div>
                  <span className="text-slate-400 block text-[11px]">
                    Encounter
                  </span>
                  <span className="font-mono text-slate-700">
                    {bill.encounter.encounterNumber}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Patient Info */}
          <div className="bg-white rounded-2xl border border-[#E5E7EB] p-5 shadow-sm space-y-4">
            <h2
              className="text-sm font-bold text-[#111827] border-b border-slate-100 pb-2"
              style={{ fontFamily: PP }}
            >
              Patient Profile Details
            </h2>
            <div
              className="flex items-center gap-4 text-xs"
              style={{ fontFamily: RB }}
            >
              <div className="w-12 h-12 rounded-full bg-[#0D47A1] text-white font-bold text-base flex items-center justify-center shrink-0">
                {patientName.charAt(0)}
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                <div>
                  <span className="text-slate-400 block text-[11px]">
                    Patient Name
                  </span>
                  <span className="font-bold text-[#111827]">
                    {patientName}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">
                    MRN Reference
                  </span>
                  <span className="font-mono font-bold text-[#0D47A1]">
                    {patientMrn}
                  </span>
                </div>
                {patientPhone && (
                  <div>
                    <span className="text-slate-400 block text-[11px]">
                      Phone
                    </span>
                    <span className="font-medium text-[#111827]">
                      {patientPhone}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Doctor Info */}
          <div className="bg-white rounded-2xl border border-[#E5E7EB] p-5 shadow-sm space-y-4">
            <h2
              className="text-sm font-bold text-[#111827] border-b border-slate-100 pb-2"
              style={{ fontFamily: PP }}
            >
              Doctor & OPD Consultation
            </h2>
            <div
              className="grid grid-cols-2 md:grid-cols-3 gap-3 text-xs"
              style={{ fontFamily: RB }}
            >
              <div>
                <span className="text-slate-400 block text-[11px]">
                  Attending Physician
                </span>
                <span className="font-bold text-[#111827]">{doctorName}</span>
              </div>
              {doctorCode && (
                <div>
                  <span className="text-slate-400 block text-[11px]">
                    Doctor Code
                  </span>
                  <span className="font-mono font-semibold text-slate-700">
                    {doctorCode}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Line Items */}
          <div className="bg-white rounded-2xl border border-[#E5E7EB] p-5 shadow-sm space-y-4">
            <h2
              className="text-sm font-bold text-[#111827] border-b border-slate-100 pb-2"
              style={{ fontFamily: PP }}
            >
              Itemized Line Bill ({items.length} items)
            </h2>
            <div className="overflow-x-auto">
              <table
                className="w-full text-left border-collapse text-xs"
                style={{ fontFamily: RB }}
              >
                <thead>
                  <tr className="bg-slate-50 text-[10px] font-bold text-slate-500 uppercase border-b border-slate-200">
                    <th className="py-2.5 px-3">Service / Item Name</th>
                    <th className="py-2.5 px-3 text-right">Qty</th>
                    <th className="py-2.5 px-3 text-right">Unit Price</th>
                    <th className="py-2.5 px-3 text-right">Tax</th>
                    <th className="py-2.5 px-3 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {items.length > 0 ? (
                    items.map((item) => {
                      const itemName =
                        item.itemName ||
                        item.serviceName ||
                        "General Doctor Consultation Fee";
                      const unitPrice = item.unitPrice ?? 0;
                      const qty = item.quantity ?? 1;
                      const taxRate = item.taxRate ?? item.taxPercent ?? 0;
                      const totalAmount =
                        item.totalAmount ?? item.totalPrice ?? qty * unitPrice;

                      return (
                        <tr key={item.id}>
                          <td className="py-3 px-3">
                            <div className="font-semibold text-[#111827]">
                              {itemName}
                            </div>
                            {item.description && (
                              <div className="text-[11px] text-slate-500 mt-0.5">
                                {item.description}
                              </div>
                            )}
                            {item.serviceCode && (
                              <div className="text-[10px] font-mono text-slate-400 mt-0.5">
                                Code: {item.serviceCode}
                              </div>
                            )}
                          </td>
                          <td className="py-3 px-3 text-right font-medium">
                            {qty}
                          </td>
                          <td className="py-3 px-3 text-right">
                            ₹{unitPrice.toLocaleString()}
                          </td>
                          <td className="py-3 px-3 text-right text-slate-500">
                            {taxRate > 0 ? `${taxRate}%` : "0%"}
                          </td>
                          <td className="py-3 px-3 text-right font-semibold text-[#111827]">
                            ₹{totalAmount.toLocaleString()}
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td className="py-3 px-3 text-slate-400" colSpan={5}>
                        No line items recorded for this invoice.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Payment History */}
          {paymentRecords.length > 0 && (
            <div className="bg-white rounded-2xl border border-[#E5E7EB] p-5 shadow-sm space-y-4">
              <h2
                className="text-sm font-bold text-[#111827] border-b border-slate-100 pb-2"
                style={{ fontFamily: PP }}
              >
                Payment History ({paymentRecords.length} transactions)
              </h2>
              <div className="overflow-x-auto">
                <table
                  className="w-full text-left border-collapse text-xs"
                  style={{ fontFamily: RB }}
                >
                  <thead>
                    <tr className="bg-slate-50 text-[10px] font-bold text-slate-500 uppercase border-b border-slate-200">
                      <th className="py-2.5 px-3">Payment / Receipt No</th>
                      <th className="py-2.5 px-3">Method</th>
                      <th className="py-2.5 px-3 text-right">Amount</th>
                      <th className="py-2.5 px-3">Ref No</th>
                      <th className="py-2.5 px-3">Status</th>
                      <th className="py-2.5 px-3">Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {paymentRecords.map((p: BillPaymentRecord) => (
                      <tr key={p.receiptNumber || p.paymentNumber || p.id}>
                        <td className="py-3 px-3 font-mono font-medium text-[#0D47A1]">
                          {p.receiptNumber ||
                            p.paymentNumber ||
                            `PMT-${p.id || ""}`}
                        </td>
                        <td className="py-3 px-3 font-semibold">{p.method}</td>
                        <td className="py-3 px-3 text-right font-bold text-[#66BB6A]">
                          ₹{(p.amount ?? 0).toLocaleString()}
                        </td>
                        <td className="py-3 px-3 text-slate-500 font-mono">
                          {p.referenceNumber || p.transactionRef || "—"}
                        </td>
                        <td className="py-3 px-3">
                          <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold bg-green-50 text-green-700 border border-green-200">
                            {p.status || "SUCCESS"}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-slate-500">
                          {p.transactionDate || p.paidAt || "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Right Sidebar */}
        <div className="space-y-6 pb-12">
          {/* Action Buttons */}
          {canCollect && canEdit && (
            <div className="bg-white rounded-2xl border border-[#E5E7EB] p-5 shadow-sm space-y-3">
              <button
                onClick={handleCollectPayment}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#009688] text-white text-xs font-semibold hover:bg-teal-700 transition-colors shadow-sm active:scale-95 cursor-pointer"
                style={{ fontFamily: PP }}
              >
                <DollarSign size={15} />
                Collect Payment
              </button>
              <button
                onClick={() => navigate(`/billing/invoice/${targetId}/print`)}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-white border border-[#E5E7EB] text-slate-700 text-xs font-semibold hover:bg-slate-50 transition-colors shadow-sm cursor-pointer"
                style={{ fontFamily: RB }}
              >
                <Printer size={14} />
                Print Receipt
              </button>
            </div>
          )}

          {/* Payment Collection Summary */}
          <div className="bg-white rounded-2xl border border-[#E5E7EB] p-5 shadow-sm space-y-4">
            <h3
              className="text-sm font-bold text-[#111827]"
              style={{ fontFamily: PP }}
            >
              Payment Collection Summary
            </h3>
            <div className="space-y-3 text-xs" style={{ fontFamily: RB }}>
              <div className="flex justify-between">
                <span className="text-slate-500">Gross Amount:</span>
                <span className="font-semibold text-slate-800">
                  ₹
                  {(
                    summaryData?.grossAmount ??
                    summaryData?.netAmount ??
                    0
                  ).toLocaleString()}
                </span>
              </div>
              {(summaryData?.discountAmount ?? 0) > 0 && (
                <div className="flex justify-between text-[#EF4444]">
                  <span>Discount:</span>
                  <span className="font-semibold">
                    -₹{(summaryData?.discountAmount ?? 0).toLocaleString()}
                  </span>
                </div>
              )}
              {(summaryData?.taxAmount ?? 0) > 0 && (
                <div className="flex justify-between text-slate-600">
                  <span>Tax Amount:</span>
                  <span className="font-semibold">
                    +₹{(summaryData?.taxAmount ?? 0).toLocaleString()}
                  </span>
                </div>
              )}
              {(summaryData?.roundOffAmount ?? summaryData?.roundOff ?? 0) !==
                0 && (
                  <div className="flex justify-between text-slate-500">
                    <span>Round Off:</span>
                    <span className="font-semibold">
                      ₹
                      {(
                        summaryData?.roundOffAmount ??
                        summaryData?.roundOff ??
                        0
                      ).toLocaleString()}
                    </span>
                  </div>
                )}
              <div className="flex justify-between text-sm font-bold text-[#111827] border-t border-slate-100 pt-2">
                <span>Grand / Net Total:</span>
                <span className="text-[#0D47A1]">
                  ₹{netAmount.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between text-[#66BB6A] font-semibold">
                <span>Total Collected:</span>
                <span>₹{paidAmount.toLocaleString()}</span>
              </div>
              <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-[#66BB6A] h-full"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
              <div className="flex justify-between text-sm font-bold text-[#EF4444] border-t border-slate-100 pt-3">
                <span>Balance Due:</span>
                <span>₹{balanceAmount.toLocaleString()}</span>
              </div>
              {(summaryData?.refundedAmount ?? 0) > 0 && (
                <div className="flex justify-between text-xs font-semibold text-amber-600 border-t border-slate-100 pt-2">
                  <span>Refunded:</span>
                  <span>
                    ₹{(summaryData?.refundedAmount ?? 0).toLocaleString()}
                  </span>
                </div>
              )}

              {/* Integrated Settlement Status Banners */}
              {isCancelled && (
                <div className="mt-3 p-3 rounded-xl bg-red-50 border border-red-200 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-red-100 flex items-center justify-center shrink-0">
                    <Ban size={16} className="text-red-600" />
                  </div>
                  <div>
                    <h4
                      className="text-xs font-bold text-red-700"
                      style={{ fontFamily: PP }}
                    >
                      Invoice Cancelled
                    </h4>
                    <p
                      className="text-[11px] text-red-500"
                      style={{ fontFamily: RB }}
                    >
                      This invoice has been cancelled.
                    </p>
                  </div>
                </div>
              )}

              {isVoided && (
                <div className="mt-3 p-3 rounded-xl bg-amber-50 border border-amber-200 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center shrink-0">
                    <Ban size={16} className="text-amber-600" />
                  </div>
                  <div>
                    <h4
                      className="text-xs font-bold text-amber-700"
                      style={{ fontFamily: PP }}
                    >
                      Invoice Voided
                    </h4>
                    <p
                      className="text-[11px] text-amber-500"
                      style={{ fontFamily: RB }}
                    >
                      This invoice has been voided.
                    </p>
                  </div>
                </div>
              )}

              {!canCollect &&
                !isCancelled &&
                !isVoided &&
                balanceAmount <= 0 &&
                paidAmount > 0 && (
                  <div className="mt-3 p-3 rounded-xl bg-[#66BB6A]/10 border border-[#66BB6A]/30 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-[#66BB6A]/20 flex items-center justify-center shrink-0">
                      <CheckCircle2 size={16} className="text-[#66BB6A]" />
                    </div>
                    <div>
                      <h4
                        className="text-xs font-bold text-[#66BB6A]"
                        style={{ fontFamily: PP }}
                      >
                        Fully Paid
                      </h4>
                      <p
                        className="text-[11px] text-slate-500"
                        style={{ fontFamily: RB }}
                      >
                        This invoice is fully settled.
                      </p>
                    </div>
                  </div>
                )}
            </div>
          </div>
        </div>
      </div>

      {/* Refund Modal */}
      {showRefundModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-[#E5E7EB] shadow-2xl w-full max-w-md p-6 space-y-4">
            <div className="flex justify-between items-center">
              <h3
                className="text-sm font-bold text-[#111827]"
                style={{ fontFamily: PP }}
              >
                Process Refund
              </h3>
              <button
                aria-label="Action"
                onClick={() => setShowRefundModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                ✕
              </button>
            </div>
            <div className="space-y-3 text-xs" style={{ fontFamily: RB }}>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                <div className="flex justify-between">
                  <span className="text-slate-500">Invoice:</span>
                  <span className="font-mono font-bold text-[#0D47A1]">
                    {bill.billNumber || bill.id}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Paid Amount:</span>
                  <span className="font-bold text-[#66BB6A]">
                    ₹{paidAmount.toLocaleString()}
                  </span>
                </div>
              </div>
              <div>
                <span className="block text-slate-700 font-semibold mb-1">
                  Refund Amount (₹) *
                  <input
                    aria-label="Input field"
                    type="number"
                    value={refundAmount || ""}
                    onChange={(e) => {
                      const v = e.currentTarget.valueAsNumber;
                      setRefundAmount(Number.isFinite(v) ? v : 0);
                    }}
                    max={paidAmount}
                    className="w-full px-3 py-2.5 rounded-xl border border-[#E5E7EB] bg-slate-50 text-sm font-bold focus:bg-white focus:border-[#0D47A1] focus:outline-none"
                  />
                </span>
              </div>
              <div>
                <span className="block text-slate-700 font-semibold mb-1">
                  Reason *
                </span>
                <textarea
                  aria-label="Text area"
                  rows={2}
                  value={refundReason}
                  onChange={(e) => setRefundReason(e.target.value)}
                  placeholder="Enter refund reason..."
                  className="w-full px-3 py-2 rounded-xl border border-[#E5E7EB] bg-slate-50 text-xs focus:bg-white focus:border-[#0D47A1] focus:outline-none"
                />
              </div>
            </div>
            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setShowRefundModal(false)}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-xs font-semibold hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={handleRefund}
                disabled={
                  isRefunding || refundAmount <= 0 || refundAmount > paidAmount
                }
                className="flex-1 py-2.5 rounded-xl bg-amber-500 text-white text-xs font-bold hover:bg-amber-600 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <RotateCcw size={14} />
                {isRefunding
                  ? "Processing..."
                  : `Refund ₹${refundAmount.toLocaleString()}`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
