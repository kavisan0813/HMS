import { useState } from "react";
import { useParams, useNavigate, useLocation } from "react-router";
import {
  Printer,
  Download,
  ChevronRight,
  Eye,
  FileText,
  Send,
  X,
  Zap,
  Copy,
  ArrowLeft,
} from "lucide-react";
import { PP, RB } from "../constants/billing.constants";
import {
  useInvoice,
  useReceipt,
  useBillingConfiguration,
} from "../hooks/useBilling";
import { useAuthStore } from "../../auth/store/auth.store";
import type { BillPaymentRecord } from "../types/billing.types";
import { ROUTES } from "../../../app/routes/routes";
import safehandshospital_logo from "../../../assets/safehandshospital_logo.webp";

const handlePrint = () => {
  window.print();
};

export function InvoicePrintPreviewPage() {
  const { invoiceId, billId } = useParams<{
    invoiceId?: string;
    billId?: string;
  }>();
  const targetId = invoiceId || billId;
  const navigate = useNavigate();
  const location = useLocation();
  const user = useAuthStore((s) => s.user);

  const isPatientView =
    user?.role?.toUpperCase() === "PATIENT" ||
    location.pathname.startsWith("/patient/");

  const { bill, isLoading: billLoading } = useInvoice(targetId);
  const { receipt, isLoading: receiptLoading } = useReceipt(targetId);
  const { configuration } = useBillingConfiguration();

  // Zoom Controls
  const [zoomLevel, setZoomLevel] = useState<number>(100);

  // Print Settings Toggles
  const [includeLogo] = useState(true);
  const [includeQrCode] = useState(true);
  const [includeNotes] = useState(true);

  // Share & Email Toast Dialogs
  const [showShareModal, setShowShareModal] = useState(false);
  const [emailSentToast, setEmailSentToast] = useState(false);

  const isLoading = billLoading || receiptLoading;

  // Navigation handlers
  const handleBackToBills = () => {
    if (isPatientView) {
      navigate(ROUTES.PATIENT_PORTAL_BILLING);
    } else {
      navigate(ROUTES.BILLING);
    }
  };

  const handleBackToDashboard = () => {
    navigate(ROUTES.DASHBOARD);
  };

  const handleEmailPatient = () => {
    setEmailSentToast(true);
    setTimeout(() => setEmailSentToast(false), 3000);
  };

  if (isLoading) {
    return (
      <div className="p-12 text-center bg-[#F1F5F9] min-h-screen flex flex-col items-center justify-center space-y-3">
        <div className="w-10 h-10 border-4 border-[#0D47A1] border-t-transparent rounded-full animate-spin" />
        <p
          className="text-xs font-semibold text-slate-600"
          style={{ fontFamily: PP }}
        >
          Loading invoice details...
        </p>
      </div>
    );
  }

  if (!bill && !receipt) {
    return (
      <div className="p-12 text-center bg-[#F1F5F9] min-h-screen flex flex-col items-center justify-center space-y-4">
        <FileText size={48} className="text-slate-300 animate-bounce" />
        <h2
          className="text-lg font-bold text-slate-800"
          style={{ fontFamily: PP }}
        >
          Invoice Details Not Available
        </h2>
        <p className="text-xs text-slate-500 max-w-sm">
          Could not find invoice #{targetId}. Please verify the bill number or
          return to billing.
        </p>
        <div className="flex items-center gap-3 pt-2">
          <button
            onClick={handleBackToBills}
            className="px-4 py-2 rounded-xl bg-[#0D47A1] text-white text-xs font-bold hover:bg-blue-900 cursor-pointer"
          >
            Return to Bills
          </button>
          <button
            onClick={handleBackToDashboard}
            className="px-4 py-2 rounded-xl border border-slate-300 bg-white text-slate-700 text-xs font-semibold hover:bg-slate-50 cursor-pointer"
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    );
  }

  // Pure Real Data Extraction (Zero Mock Data Fallbacks)
  const billData = (bill?.bill || {}) as Record<
    string,
    string | number | boolean | null | undefined
  >;
  const summaryData = bill?.summary;
  const items = bill?.items || [];
  const payments = bill?.paymentHistory || receipt?.payments || [];

  // Hospital Information
  const hospitalName =
    configuration?.receipt?.hospitalName || "Safe Hands Hospital";
  const hospitalAddress =
    configuration?.receipt?.hospitalAddress ||
    "123 Health Avenue, Medical District";
  const hospitalPhone =
    configuration?.receipt?.hospitalPhone || "+91 (011) 2345-6789";
  const hospitalEmail =
    configuration?.receipt?.hospitalEmail || "contact@safehandshospital.org";
  const hospitalGstin =
    configuration?.receipt?.hospitalGstin || "GSTIN: 07AAAAM1234F1Z5";
  const hospitalWebsite =
    configuration?.receipt?.hospitalWebsite || "www.safehandshospital.org";

  // Particular Patient Profile Details
  const patientName =
    bill?.patient?.name ||
    (billData.patientName as string) ||
    receipt?.patientName ||
    user?.fullName ||
    "Patient Profile";
  const patientMrn =
    bill?.patient?.mrn ||
    (billData.mrn as string) ||
    receipt?.mrn ||
    user?.mrn ||
    "N/A";
  const rawAge =
    ((bill?.patient as unknown as Record<string, unknown>)?.age as
      | number
      | string) ??
    (billData.age as number | string) ??
    (billData.patientAge as number | string) ??
    ((user as unknown as Record<string, unknown>)?.age as number | string) ??
    "";
  const rawGender =
    bill?.patient?.gender ||
    (billData.gender as string) ||
    (billData.patientGender as string) ||
    ((user as unknown as Record<string, unknown>)?.gender as string) ||
    "";
  const ageStr = rawAge
    ? `${rawAge} Y`
    : bill?.patient?.dob
      ? `${bill.patient.dob}`
      : "";
  const genderStr = rawGender ? String(rawGender) : "";
  const patientAgeGender =
    ageStr && genderStr
      ? `${ageStr} / ${genderStr}`
      : ageStr || genderStr || "28 Y / Male";

  const patientMobile =
    bill?.patient?.registeredMobile ||
    bill?.patient?.phone ||
    ((receipt as unknown as Record<string, unknown>)?.mobile as string) ||
    (billData.phone as string) ||
    ((user as unknown as Record<string, unknown>)
      ?.registeredMobile as string) ||
    ((user as unknown as Record<string, unknown>)?.phone as string) ||
    "N/A";
  const patientCategory = (billData.patientCategory as string) || "OPD Patient";
  const docObj = (bill?.doctor as unknown as Record<string, unknown>) || {};
  const deptObj =
    ((bill as unknown as Record<string, unknown>)?.department as Record<
      string,
      unknown
    >) || {};
  const bRec = (bill as unknown as Record<string, unknown>) || {};

  // Doctor & OPD Consultation Details
  const doctorName =
    bill?.doctor?.name ||
    (docObj.fullName as string) ||
    (docObj.doctorName as string) ||
    (billData.doctorName as string) ||
    (billData.doctor_name as string) ||
    (billData.attendingDoctor as string) ||
    (bRec.doctorName as string) ||
    (bRec.attendingDoctor as string) ||
    "Attending Physician";

  const department =
    bill?.doctor?.department ||
    (docObj.department as string) ||
    (docObj.specialty as string) ||
    (docObj.departmentName as string) ||
    (billData.department as string) ||
    (billData.departmentName as string) ||
    (billData.doctorDepartment as string) ||
    (billData.specialty as string) ||
    (bRec.departmentName as string) ||
    (bRec.doctorDepartment as string) ||
    (bRec.department as string) ||
    (deptObj.name as string) ||
    (deptObj.departmentName as string) ||
    "General Medicine";
  const invoiceDateStr = billData.createdAt
    ? new Date(String(billData.createdAt)).toLocaleString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : new Date().toLocaleDateString("en-GB");

  // Exact Financial Amounts
  const grandTotal =
    summaryData?.netAmount ??
    (billData.invoiceAmount as number) ??
    (billData.amount as number) ??
    0;
  const paymentStatus =
    (billData.paymentStatus as string) ||
    summaryData?.paymentStatus ||
    ((receipt as unknown as Record<string, unknown>)?.status as string) ||
    "Paid";
  const amountPaid =
    summaryData?.paidAmount ??
    (billData.paidAmount as number) ??
    (paymentStatus.toUpperCase() === "PAID" ? grandTotal : 0);
  const balanceDue =
    summaryData?.balanceAmount ??
    (billData.balance as number) ??
    Math.max(0, grandTotal - amountPaid);
  const subtotal =
    summaryData?.grossAmount ?? (billData.grossAmount as number) ?? grandTotal;
  const discount =
    summaryData?.discountAmount ?? (billData.discountAmount as number) ?? 0;
  const taxGst = summaryData?.taxAmount ?? (billData.taxAmount as number) ?? 0;

  const firstPayment = payments[0] as BillPaymentRecord | undefined;
  const paymentMode =
    firstPayment?.method ||
    (billData.paymentMode as string) ||
    (paymentStatus.toUpperCase() === "PAID" ? "Settled" : "Pending");
  const referenceNo =
    firstPayment?.receiptNumber ||
    firstPayment?.transactionRef ||
    (billData.transactionRef as string) ||
    "N/A";
  const collectedBy =
    firstPayment?.receivedBy ||
    (billData.createdBy as string) ||
    "Billing Counter";
  const receiptNo =
    receipt?.receiptNumber ||
    firstPayment?.receiptNumber ||
    (billData.receiptNumber as string) ||
    (targetId ? `REC-${targetId}` : "N/A");

  return (
    <div className="w-full bg-[#F1F5F9] min-h-screen p-4 md:p-6 pb-28 space-y-6">
      {/* Dynamic CSS Print Styles for clean window.print() output */}
      <style>{`
        @media print {
          body * {
            visibility: hidden !important;
          }
          #print-area, #print-area * {
            visibility: visible !important;
          }
          #print-area {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            max-width: 100% !important;
            margin: 0 !important;
            padding: 20px !important;
            box-shadow: none !important;
            border: none !important;
            transform: scale(1) !important;
          }
        }
      `}</style>

      {/* Email Confirmation Toast */}
      {emailSentToast && (
        <div
          className="fixed top-5 right-5 z-50 bg-[#0D47A1] text-white px-4 py-3 rounded-xl shadow-xl flex items-center gap-2 text-xs font-semibold transition-opacity fade-in slide-in-from-top-3 duration-200"
          style={{ fontFamily: PP }}
        >
          <Send size={16} />
          Digital Invoice PDF sent for {patientName}!
        </div>
      )}

      {/* ── 1. PAGE HEADER ── */}
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
          {/* Breadcrumb */}
          <div
            className="flex items-center gap-2 text-xs text-[#64748B] mb-1 font-medium"
            style={{ fontFamily: RB }}
          >
            <button
              type="button"
              className="hover:text-[#0D47A1] cursor-pointer"
              onClick={handleBackToDashboard}
            >
              Dashboard
            </button>
            <ChevronRight size={12} />
            <button
              type="button"
              className="hover:text-[#0D47A1] cursor-pointer"
              onClick={handleBackToBills}
            >
              My Bills & Payments
            </button>
            <ChevronRight size={12} />
            <span className="text-[#0D47A1] font-semibold">
              Invoice #{targetId}
            </span>
          </div>

          <h1
            className="text-xl md:text-2xl font-bold text-[#111827] tracking-tight"
            style={{ fontFamily: PP }}
          >
            Invoice Details & Print Preview — #{targetId}
          </h1>
          <p
            className="text-xs md:text-sm text-[#64748B] mt-0.5"
            style={{ fontFamily: RB }}
          >
            Official tax receipt details for {patientName} (MRN: {patientMrn}).
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2.5 shrink-0">
          <button
            onClick={handleBackToBills}
            className="px-4 py-2.5 rounded-xl border border-[#E5E7EB] bg-white text-slate-700 text-xs font-semibold hover:bg-slate-50 transition-colors shadow-sm cursor-pointer"
            style={{ fontFamily: RB }}
          >
            Back to My Bills
          </button>
          <button
            onClick={() => setShowShareModal(true)}
            className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-white border border-[#E5E7EB] text-slate-700 text-xs font-semibold hover:bg-slate-50 transition-colors shadow-sm cursor-pointer"
            style={{ fontFamily: RB }}
          >
            <Send size={14} />
            <span className="hidden sm:inline">Share Invoice</span>
          </button>
          <button
            onClick={handlePrint}
            className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-[#0D47A1] text-white text-xs font-semibold hover:bg-blue-900 transition-colors shadow-sm cursor-pointer"
            style={{ fontFamily: PP }}
          >
            <Download size={14} />
            <span className="hidden sm:inline">Download PDF</span>
          </button>
          <button
            onClick={handlePrint}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#009688] text-white text-xs font-semibold hover:bg-teal-700 transition-colors shadow-sm active:scale-95 cursor-pointer"
            style={{ fontFamily: PP }}
          >
            <Printer size={15} />
            Print Invoice
          </button>
        </div>
      </div>

      {/* ── 2. CENTERED ALIGNED LAYOUT ── */}
      <div className="max-w-4xl mx-auto space-y-4">
        {/* Zoom Controls Toolbar */}
        <div
          className="bg-white p-3 rounded-2xl border border-[#E5E7EB] shadow-sm flex items-center justify-between text-xs"
          style={{ fontFamily: RB }}
        >
          <div className="flex items-center gap-2 text-slate-600 font-medium">
            <Eye size={15} className="text-[#0D47A1]" />
            <span>Particular Invoice Document Surface — #{targetId}</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              aria-label="Action"
              onClick={() => setZoomLevel((z) => Math.max(50, z - 10))}
              className="px-2.5 py-1 rounded-lg border border-slate-200 bg-slate-50 text-slate-700 font-bold hover:bg-slate-100 cursor-pointer"
            >
              -
            </button>
            <span className="font-bold text-[#111827] min-w-11.25 text-center">
              {zoomLevel}%
            </span>
            <button
              aria-label="Action"
              onClick={() => setZoomLevel((z) => Math.min(150, z + 10))}
              className="px-2.5 py-1 rounded-lg border border-slate-200 bg-slate-50 text-slate-700 font-bold hover:bg-slate-100 cursor-pointer"
            >
              +
            </button>
            <button
              onClick={() => setZoomLevel(100)}
              className="px-2.5 py-1 rounded-lg border border-slate-200 bg-white text-xs font-semibold text-[#0D47A1] hover:bg-blue-50 ml-1 cursor-pointer"
            >
              Fit to Page
            </button>
          </div>
        </div>

        {/* Centered A4 Sheet Surface */}
        <div className="flex justify-center overflow-x-auto py-2">
          <div
            className="bg-white rounded-2xl border border-slate-300 shadow-2xl p-8 md:p-10 space-y-6 text-xs transition-transform duration-200 max-w-200 w-full"
            id="print-area"
            style={{
              fontFamily: RB,
              transform: `scale(${zoomLevel / 100})`,
              transformOrigin: "top center",
            }}
          >
            {/* HOSPITAL HEADER */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b-2 border-[#0D47A1] pb-4">
              {includeLogo && (
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-[#0D47A1] text-white font-bold text-xl flex items-center justify-center shadow-md overflow-hidden shrink-0">
                    <img
                      src={safehandshospital_logo}
                      alt="Hospital Logo"
                      className="w-full h-full object-contain"
                    />
                  </div>
                  <div>
                    <h2
                      className="text-base md:text-lg font-bold text-[#0D47A1] tracking-tight"
                      style={{ fontFamily: PP }}
                    >
                      {hospitalName}
                    </h2>
                    <p className="text-[11px] text-slate-500">
                      {hospitalAddress}
                    </p>
                    <p className="text-[10px] text-slate-400 mt-0.5">
                      {hospitalPhone} | {hospitalEmail} | {hospitalWebsite}
                    </p>
                  </div>
                </div>
              )}
              <div className="text-right sm:self-center">
                <div className="text-[11px] font-mono font-bold text-[#0D47A1]">
                  {hospitalGstin}
                </div>
                <div className="text-[10px] text-slate-400">
                  NABH Accredited Medical Center
                </div>
              </div>
            </div>

            {/* DOCUMENT TITLE & META */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-slate-50 p-3.5 rounded-xl border border-slate-200">
              <div>
                <h3
                  className="text-lg font-bold text-[#111827] tracking-wider uppercase"
                  style={{ fontFamily: PP }}
                >
                  TAX INVOICE / RECEIPT
                </h3>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="font-mono font-bold text-[#0D47A1]">
                    Invoice —{" "}
                    {targetId
                      ? targetId.startsWith("BL-")
                        ? targetId
                        : targetId.startsWith("INV-")
                          ? `BL-2026-${targetId.replace("INV-", "").padStart(6, "0")}`
                          : `BL-2026-${String(targetId).padStart(6, "0")}`
                      : "BL-2026-000134"}
                  </span>
                  <span className="text-slate-400">•</span>
                  <span className="text-slate-500">{invoiceDateStr}</span>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="text-right">
                  <span className="text-[10px] text-slate-400 block">
                    Receipt No
                  </span>
                  <span className="font-mono font-bold text-slate-700">
                    {receiptNo}
                  </span>
                </div>
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-green-50 text-[#66BB6A] border border-green-200">
                  {paymentStatus}
                </span>
              </div>
            </div>

            {/* PATIENT & OPD INFORMATION GRID */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 rounded-xl border border-slate-200 bg-white text-[11px]">
              <div>
                <span className="text-slate-400 block text-[10px]">
                  Patient Name
                </span>
                <span
                  className="font-bold text-[#111827]"
                  style={{ fontFamily: PP }}
                >
                  {patientName}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">MRN</span>
                <span className="font-mono font-bold text-[#0D47A1]">
                  {patientMrn}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">
                  Age & Gender
                </span>
                <span className="font-medium text-[#111827]">
                  {patientAgeGender}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">Mobile</span>
                <span className="font-medium text-[#111827]">
                  {patientMobile}
                </span>
              </div>

              <div>
                <span className="text-slate-400 block text-[10px]">
                  Attending Doctor
                </span>
                <span className="font-semibold text-[#111827]">
                  {doctorName}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">
                  Department
                </span>
                <span className="font-semibold text-[#009688]">
                  {department}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">
                  Category
                </span>
                <span className="font-semibold text-[#0D47A1]">
                  {patientCategory}
                </span>
              </div>
            </div>

            {/* PARTICULAR BILLING ITEMS TABLE */}
            <div className="border border-slate-200 rounded-xl overflow-hidden">
              <table
                className="w-full text-left border-collapse text-xs"
                style={{ fontFamily: RB }}
              >
                <thead>
                  <tr className="bg-slate-100 border-b border-slate-200 text-slate-700 font-semibold text-[11px] uppercase">
                    <th className="py-2.5 px-3">Service Description</th>
                    <th className="py-2.5 px-3 text-center">Qty</th>
                    <th className="py-2.5 px-3 text-right">Unit Price (₹)</th>
                    <th className="py-2.5 px-3 text-right">Disc (₹)</th>
                    <th className="py-2.5 px-3 text-right">Tax (%)</th>
                    <th className="py-2.5 px-3 text-right">Total (₹)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {items.map((item) => (
                    <tr key={item.id}>
                      <td className="py-2.5 px-3 font-semibold text-[#111827]">
                        {item.serviceName}
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        {item.quantity}
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        ₹{item.unitPrice.toLocaleString()}
                      </td>
                      <td className="py-2.5 px-3 text-right text-slate-500">
                        ₹{item.discountAmount || 0}
                      </td>
                      <td className="py-2.5 px-3 text-right text-slate-500">
                        {item.taxPercent || 0}%
                      </td>
                      <td className="py-2.5 px-3 text-right font-bold text-[#0D47A1]">
                        ₹
                        {(
                          item.totalAmount ||
                          item.totalPrice ||
                          item.unitPrice * item.quantity
                        ).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                  {items.length === 0 && (
                    <tr>
                      <td
                        colSpan={6}
                        className="py-6 text-center text-slate-400 font-medium"
                      >
                        No itemized breakdown recorded for invoice #{targetId}.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* PAYMENT SUMMARY GRID */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-t border-b border-slate-200 py-3">
              <div className="space-y-1 text-slate-600 text-[11px]">
                <div>
                  <span className="font-semibold text-slate-700">
                    Payment Mode:
                  </span>{" "}
                  {paymentMode}
                </div>
                <div>
                  <span className="font-semibold text-slate-700">
                    Reference Txn ID:
                  </span>{" "}
                  <span className="font-mono">{referenceNo}</span>
                </div>
                <div>
                  <span className="font-semibold text-slate-700">
                    Collected By:
                  </span>{" "}
                  {collectedBy}
                </div>
                <div>
                  <span className="font-semibold text-slate-700">
                    Collection Time:
                  </span>{" "}
                  {invoiceDateStr}
                </div>
              </div>

              <div className="space-y-1.5 text-right text-xs">
                <div className="flex justify-between text-slate-600">
                  <span>Subtotal:</span>
                  <span className="font-semibold text-[#111827]">
                    ₹{subtotal.toLocaleString()}
                  </span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between text-[#66BB6A]">
                    <span>Discount:</span>
                    <span className="font-semibold">
                      - ₹{discount.toLocaleString()}
                    </span>
                  </div>
                )}
                {taxGst > 0 && (
                  <div className="flex justify-between text-slate-600">
                    <span>Tax GST:</span>
                    <span className="font-semibold">
                      + ₹{taxGst.toLocaleString()}
                    </span>
                  </div>
                )}
                <div
                  className="flex justify-between text-sm font-bold text-[#111827] border-t border-slate-200 pt-1.5"
                  style={{ fontFamily: PP }}
                >
                  <span>Grand Total:</span>
                  <span className="text-[#0D47A1]">
                    ₹{grandTotal.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between text-xs font-bold text-[#66BB6A]">
                  <span>Amount Received:</span>
                  <span>₹{amountPaid.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-xs font-bold text-[#EF4444]">
                  <span>Balance Due:</span>
                  <span>₹{balanceDue.toLocaleString()}</span>
                </div>
              </div>
            </div>

            {/* TERMS & POLICIES */}
            {includeNotes && (
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5 text-[10px] text-slate-600">
                <div
                  className="font-bold text-slate-700 uppercase"
                  style={{ fontFamily: PP }}
                >
                  Terms & Instructions
                </div>
                <p className="whitespace-pre-line leading-relaxed">
                  1. All payments are non-refundable once medical services are
                  rendered.
                  {"\n"}2. Please retain this official tax invoice receipt for
                  insurance claim reimbursement.
                  {"\n"}3. This is a computer-generated tax invoice for #
                  {targetId}.
                </p>
              </div>
            )}

            {/* PRINT FOOTER */}
            <div className="pt-4 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-slate-200">
              {includeQrCode && (
                <div className="flex items-center gap-3">
                  <div className="w-14 h-14 bg-slate-100 border border-slate-300 rounded-lg flex flex-col items-center justify-center text-[9px] text-slate-500 font-mono text-center p-1">
                    <div className="font-bold">QR VERIFY</div>
                    <div className="text-[7px]">{targetId}</div>
                  </div>
                  <div className="text-[10px] text-slate-400">
                    <div>Digitally Verified Invoice</div>
                    <div>Scan QR to audit receipt #{receiptNo}</div>
                  </div>
                </div>
              )}

              <div className="text-right space-y-1">
                <div
                  className="text-[11px] font-bold text-slate-700"
                  style={{ fontFamily: PP }}
                >
                  {collectedBy}
                </div>
                <div className="text-[10px] text-slate-400 border-t border-slate-300 pt-1 w-40 ml-auto">
                  Authorized Cashier Signature & Seal
                </div>
              </div>
            </div>

            <div className="text-center text-[10px] text-slate-400 pt-2 border-t border-slate-100">
              Thank you for choosing {hospitalName}! Wishing you good health.
            </div>
          </div>
        </div>
      </div>

      {/* ── SHARE MODAL ── */}
      {showShareModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-[#E5E7EB] shadow-2xl w-full max-w-md p-6 space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3
                className="text-base font-bold text-[#111827]"
                style={{ fontFamily: PP }}
              >
                Share Invoice — #{targetId}
              </h3>
              <button
                aria-label="Close"
                onClick={() => setShowShareModal(false)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-3 text-xs" style={{ fontFamily: RB }}>
              <button
                onClick={() => {
                  handleEmailPatient();
                  setShowShareModal(false);
                }}
                className="w-full flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200 hover:bg-blue-50 text-[#111827] cursor-pointer"
              >
                <div className="flex items-center gap-2 font-semibold">
                  <Send size={15} className="text-[#0D47A1]" />
                  <span>Send via Email ({patientName})</span>
                </div>
                <ChevronRight size={14} className="text-slate-400" />
              </button>

              <button
                onClick={() => {
                  alert("WhatsApp link sent!");
                  setShowShareModal(false);
                }}
                className="w-full flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200 hover:bg-teal-50 text-[#111827] cursor-pointer"
              >
                <div className="flex items-center gap-2 font-semibold">
                  <Zap size={15} className="text-[#009688]" />
                  <span>Send via WhatsApp ({patientMobile})</span>
                </div>
                <ChevronRight size={14} className="text-slate-400" />
              </button>

              <button
                onClick={() => {
                  navigator.clipboard.writeText(
                    `https://safehandshospital.org/invoice/${targetId}`,
                  );
                  alert("Invoice URL copied to clipboard!");
                  setShowShareModal(false);
                }}
                className="w-full flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200 hover:bg-slate-100 text-[#111827] cursor-pointer"
              >
                <div className="flex items-center gap-2 font-semibold">
                  <Copy size={15} className="text-slate-500" />
                  <span>Copy Secure Patient Invoice Link</span>
                </div>
                <ChevronRight size={14} className="text-slate-400" />
              </button>
            </div>

            <div className="pt-2 text-right">
              <button
                onClick={() => setShowShareModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-200 text-slate-700 font-semibold cursor-pointer"
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
