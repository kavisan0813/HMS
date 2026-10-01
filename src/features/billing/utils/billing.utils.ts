import type {
  ApiPatientInvoice,
  BillListItem,
  InvoiceRecord,
  PaymentMethod,
} from "../types/billing.types";

function toCleanString(val: unknown): string {
  if (!val) return "";
  if (typeof val === "string") {
    const trimmed = val.trim();
    return trimmed && trimmed !== "[object Object]" ? trimmed : "";
  }
  if (typeof val === "object" && val !== null) {
    const obj = val as Record<string, unknown>;
    for (const key of [
      "departmentName",
      "deptName",
      "department_name",
      "dept_name",
      "name",
      "fullName",
      "full_name",
      "nameEn",
      "title",
      "doctorName",
      "departmentCode",
      "code",
      "label",
      "specialty",
    ]) {
      const propVal = obj[key];
      if (
        typeof propVal === "string" &&
        propVal.trim() &&
        propVal.trim() !== "[object Object]"
      ) {
        return propVal.trim();
      }
    }
  }
  return "";
}

export function mapApiInvoiceToInvoiceRecord(
  apiInv: ApiPatientInvoice,
  patientName: string,
  mrn: string,
): InvoiceRecord {
  const amount =
    typeof apiInv.amount === "number"
      ? apiInv.amount
      : parseFloat(String(apiInv.amount || "0").replace(/[^0-9.]/g, "")) || 0;

  const status = mapApiStatusToPaymentStatus(apiInv.status || "Pending");

  const invAny = apiInv as unknown as Record<string, unknown>;
  const docObj =
    typeof invAny.doctor === "object" && invAny.doctor !== null
      ? (invAny.doctor as Record<string, unknown>)
      : null;
  const deptObj =
    typeof invAny.department === "object" && invAny.department !== null
      ? (invAny.department as Record<string, unknown>)
      : null;

  const doctorName =
    toCleanString(invAny.doctorName) ||
    toCleanString(invAny.doctor_name) ||
    toCleanString(invAny.attendingDoctorName) ||
    toCleanString(invAny.attendingDoctor) ||
    toCleanString(invAny.doctor) ||
    toCleanString(docObj?.fullName) ||
    toCleanString(docObj?.doctorName) ||
    toCleanString(docObj?.name) ||
    "General Physician";

  const department =
    toCleanString(invAny.departmentName) ||
    toCleanString(invAny.departmentName) ||
    toCleanString(invAny.deptName) ||
    toCleanString(invAny.department_name) ||
    toCleanString(invAny.department) ||
    toCleanString(deptObj?.departmentName) ||
    toCleanString(deptObj?.deptName) ||
    toCleanString(deptObj?.name) ||
    toCleanString(docObj?.departmentName) ||
    toCleanString(docObj?.deptName) ||
    toCleanString(docObj?.department) ||
    toCleanString(docObj?.specialty) ||
    toCleanString(invAny.specialty) ||
    "General OPD";

  const paidAmount =
    typeof invAny.paidAmount === "number"
      ? (invAny.paidAmount as number)
      : status === "Paid"
        ? amount
        : 0;
  const balance =
    typeof invAny.balance === "number"
      ? (invAny.balance as number)
      : typeof invAny.balanceAmount === "number"
        ? (invAny.balanceAmount as number)
        : status === "Paid"
          ? 0
          : Math.max(0, amount - paidAmount);

  const rawNumericId =
    typeof apiInv.billId === "number"
      ? apiInv.billId
      : typeof apiInv.id === "number"
        ? apiInv.id
        : !isNaN(Number(apiInv.id)) && String(apiInv.id).trim() !== ""
          ? Number(apiInv.id)
          : undefined;

  const displayBillNumber =
    apiInv.invoiceNumber ||
    (rawNumericId ? `BL-2026-${String(rawNumericId).padStart(6, "0")}` : String(apiInv.id || ""));

  return {
    id: String(rawNumericId ?? apiInv.id ?? apiInv.invoiceNumber ?? ""),
    billId: rawNumericId,
    billNumber: displayBillNumber,
    invoiceDate: apiInv.date || "N/A",
    patientName: patientName,
    mrn: mrn,
    mobile: (invAny.mobile as string) || "",
    doctorName,
    department,
    invoiceAmount: amount,
    paidAmount,
    balance,
    paymentMethod: (invAny.paymentMethod as PaymentMethod) || "Cash",
    paymentStatus: status,
    collectedBy: (invAny.collectedBy as string) || "",
  };
}

function mapApiStatusToPaymentStatus(
  status: string,
): InvoiceRecord["paymentStatus"] {
  const s = status.toUpperCase();
  if (s === "PAID") return "Paid";
  if (s === "PENDING" || s === "UNPAID") return "Pending";
  if (s === "PARTIALLY_PAID" || s === "PARTIALLY PAID" || s === "PARTIAL_PAID")
    return "Partially Paid";
  if (s === "CANCELLED" || s === "VOIDED") return "Cancelled";
  if (s === "REFUNDED") return "Refunded";
  return "Pending";
}

export function mapApiBillToInvoiceRecord(bill: BillListItem): InvoiceRecord {
  const paymentStatus = mapApiStatusToPaymentStatus(bill.paymentStatus);

  const b = bill as unknown as Record<string, unknown>;
  const docObj =
    typeof b.doctor === "object" && b.doctor !== null
      ? (b.doctor as Record<string, unknown>)
      : null;
  const deptObj =
    typeof b.department === "object" && b.department !== null
      ? (b.department as Record<string, unknown>)
      : null;

  const doctorName =
    toCleanString(bill.doctorName) ||
    toCleanString(b.doctorName) ||
    toCleanString(b.doctor_name) ||
    toCleanString(b.attendingDoctorName) ||
    toCleanString(b.attendingDoctor) ||
    toCleanString(b.doctor) ||
    toCleanString(docObj?.fullName) ||
    toCleanString(docObj?.doctorName) ||
    toCleanString(docObj?.name) ||
    "General Physician";

  const department =
    toCleanString(b.departmentName) ||
    toCleanString(b.departmentName) ||
    toCleanString(b.deptName) ||
    toCleanString(b.department_name) ||
    toCleanString(b.department) ||
    toCleanString(deptObj?.departmentName) ||
    toCleanString(deptObj?.deptName) ||
    toCleanString(deptObj?.name) ||
    toCleanString(docObj?.departmentName) ||
    toCleanString(docObj?.deptName) ||
    toCleanString(docObj?.department) ||
    toCleanString(docObj?.specialty) ||
    toCleanString(b.specialty) ||
    "General OPD";

  const netAmount =
    (b.netAmount as number) ??
    bill.summary?.netAmount ??
    (typeof bill.consultationFee === "number"
      ? bill.consultationFee
      : Number(bill.consultationFee) || 0);
  const paidAmount =
    (b.paidAmount as number) ??
    bill.summary?.paidAmount ??
    (paymentStatus === "Paid" ? netAmount : 0);
  const balanceAmount =
    (b.balanceAmount as number) ??
    bill.summary?.balanceAmount ??
    Math.max(0, netAmount - paidAmount);

  const numericBillId =
    typeof bill.billId === "number"
      ? bill.billId
      : typeof bill.id === "number"
        ? bill.id
        : !isNaN(Number(bill.billId)) && String(bill.billId).trim() !== ""
          ? Number(bill.billId)
          : !isNaN(Number(bill.id)) && String(bill.id).trim() !== ""
            ? Number(bill.id)
            : undefined;

  return {
    id: String(numericBillId ?? bill.billId ?? bill.id ?? bill.billNumber ?? ""),
    billId: numericBillId,
    billNumber: bill.billNumber || (numericBillId ? `BL-2026-${String(numericBillId).padStart(6, "0")}` : ""),
    invoiceDate: bill.createdAt
      ? new Date(bill.createdAt).toLocaleDateString()
      : new Date().toLocaleDateString(),
    patientName: bill.patientName,
    mrn: bill.patientMrn,
    mobile: (b.mobile as string) || "",
    doctorName,
    department,
    invoiceAmount: netAmount,
    paidAmount,
    balance: balanceAmount,
    paymentMethod: (b.paymentMethod as PaymentMethod) || "Cash",
    paymentStatus,
    collectedBy: (b.collectedBy as string) || "",
    status: bill.status,
    appointmentId: bill.appointmentId,
    encounterId: bill.encounterId,
    patientId: bill.patientId,
    doctorId: bill.doctorId,
  };
}

/**
 * Format amounts into compact Indian currency notation (K, Lac, Cr)
 * e.g., 1,500 -> ₹1.5K, 5,00,000 -> ₹5 Lac, 54,34,56,542 -> ₹54.35 Cr
 */
export function formatCompactCurrency(
  val: number | string | null | undefined,
): string {
  if (val === null || val === undefined) return "₹0";
  const num =
    typeof val === "number"
      ? val
      : parseFloat(String(val).replace(/[^0-9.-]/g, "")) || 0;
  if (isNaN(num) || num === 0) return "₹0";

  const abs = Math.abs(num);
  const sign = num < 0 ? "-" : "";

  if (abs >= 10000000) {
    const cr = abs / 10000000;
    const formatted =
      cr % 1 === 0 ? cr.toString() : cr.toFixed(2).replace(/\.?0+$/, "");
    return `${sign}₹${formatted} Cr`;
  }
  if (abs >= 100000) {
    const lac = abs / 100000;
    const formatted =
      lac % 1 === 0 ? lac.toString() : lac.toFixed(2).replace(/\.?0+$/, "");
    return `${sign}₹${formatted} Lac`;
  }
  if (abs >= 1000) {
    const k = abs / 1000;
    const formatted =
      k % 1 === 0 ? k.toString() : k.toFixed(1).replace(/\.?0+$/, "");
    return `${sign}₹${formatted}K`;
  }

  return `${sign}₹${Math.round(abs).toLocaleString()}`;
}
