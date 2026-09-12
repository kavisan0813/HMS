export type PaymentStatus =
  | "Pending"
  | "Partially Paid"
  | "Paid"
  | "Cancelled"
  | "Refunded";

export type PaymentMethod = "Cash" | "Card" | "UPI" | "Bank Transfer";

type BillingStatus =
  | "PENDING_BILLING"
  | "PENDING_PAYMENT"
  | "PAID"
  | "PARTIALLY_PAID"
  | "CANCELLED"
  | "REFUNDED";

export interface InvoiceRecord {
  id: string;
  /** Human-readable number returned by the billing service. */
  billNumber?: string;
  invoiceDate: string;
  patientName: string;
  mrn: string;
  mobile: string;
  doctorName: string;
  department: string;
  invoiceAmount: number;
  paidAmount: number;
  balance: number;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  collectedBy: string;
  serviceName?: string;
  notes?: string;
  status?: string;
  appointmentId?: number;
  encounterId?: number;
  consultationId?: number | string;
  patientId?: number;
  doctorId?: number;
}

export interface ApiPatientInvoice {
  id: string | number;
  invoiceNumber?: string;
  date?: string;
  status?: string;
  amount?: string | number;
}

export interface InvoiceConfiguration {
  prefix: string;
  startingNumber: number;
  autoGenerate: boolean;
  allowManual: boolean;
}

export interface TaxConfiguration {
  enableTax: boolean;
  defaultPercentage: number;
  taxName: string;
  applyTaxTo: string;
  showBreakdown: boolean;
}

export interface PaymentMethodItem {
  id: string;
  name: string;
  enabled: boolean;
  isDefault: boolean;
  reqRef: boolean;
  iconName: string;
}

export interface DiscountConfiguration {
  allowDiscounts: boolean;
  maxDiscountPct: number;
  approvalRequired: boolean;
  authorizedRoles: string;
}

export interface ReceiptConfiguration {
  showLogo: boolean;
  showQrCode: boolean;
  showPaymentSummary: boolean;
  showTaxDetails: boolean;
  showTerms: boolean;
  footerNotes: string;
  hospitalName: string;
  hospitalTagline: string;
  hospitalAddress: string;
  hospitalPhone: string;
  hospitalGstin: string;
  hospitalEmail: string;
  hospitalWebsite: string;
}

export interface BillingRuleConfiguration {
  allowPartial: boolean;
  allowAdvance: boolean;
  allowRefunds: boolean;
  allowCancellation: boolean;
  gracePeriodDays: number;
}

export interface BillingConfiguration {
  invoice: InvoiceConfiguration;
  tax: TaxConfiguration;
  paymentMethods: PaymentMethodItem[];
  discount: DiscountConfiguration;
  receipt: ReceiptConfiguration;
  rules: BillingRuleConfiguration;
}

// ─── Backend Response Types ─────────────────────────────────────────────────

export interface BillSummaryAmount {
  grossAmount: number;
  discountAmount: number;
  taxableAmount?: number;
  taxAmount: number;
  roundOff?: number;
  roundOffAmount?: number;
  netAmount: number;
  paidAmount: number;
  balanceAmount: number;
  refundedAmount?: number;
  paymentStatus?: string;
}

export interface BillListItem {
  consultationFee: string | number;
  mrn: string;
  /** The API currently returns billId; id is kept for backward compatibility. */
  billId?: number;
  id?: number;
  billNumber: string;
  billType?: string;
  appointmentId?: number;
  encounterId?: number;
  consultationId?: number | string;
  patientId?: number;
  patientMrn: string;
  patientName: string;
  doctorId?: number;
  doctorName?: string;
  status: string;
  paymentStatus: string;
  summary?: BillSummaryAmount;
  currency?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface PendingBillingRecord {
  patientId?: string | number;
  patientName: string;
  mrn: string;
  patientAge?: number;
  patientGender?: string;
  patientPhone?: string;
  appointmentId: number;
  appointmentNumber: string;
  appointmentDate: string;
  consultationId?: string;
  encounterId: number;
  encounterNumber?: string;
  doctorId: number;
  doctorName: string;
  departmentName: string;
  consultationFee: number;
  billingStatus: BillingStatus;
  paymentStatus: PaymentStatus;
}

export interface BillCreatePayload {
  appointmentId: number;
  encounterId: number;
  consultationId?: string | number;
  patientMrn: string;
  doctorId: number;
  patientId?: number;
}

export interface BillCreateResponse {
  billId: number;
  billNumber: string;
  status: string;
  grossAmount: number;
  discountAmount: number;
  netAmount: number;
  balanceAmount: number;
}

interface BillItem {
  id: number;
  serviceId?: string;
  serviceCode?: string;
  serviceName?: string;
  itemName?: string;
  description?: string | null;
  quantity: number;
  unitPrice: number;
  taxRate?: number;
  taxPercent?: number;
  discountAmount?: number;
  totalPrice?: number;
  totalAmount: number;
}

interface BillDetailPatient {
  id: number;
  mrn: string;
  name: string;
  phone?: string;
  dob?: string;
  gender?: string;
  registeredMobile?: string;
}

interface BillDetailDoctor {
  id: number;
  name: string;
  doctorCode?: string;
  department?: string;
}

interface BillDetailAppointment {
  id: number;
  appointmentNumber: string;
  date: string;
}

interface BillDetailEncounter {
  id: number;
  encounterNumber: string;
  status: string;
}

interface BillCapabilities {
  canAddItems?: boolean;
  canEditItems?: boolean;
  canApplyDiscount?: boolean;
  canFinalize?: boolean;
  canCollectPayment?: boolean;
  canRefund?: boolean;
  canVoid?: boolean;
  canCancel?: boolean;
}

interface BillDetailBill {
  billId: number;
  bill: Record<string, unknown>;
  summary: BillSummaryAmount;
  paymentHistory: BillPaymentRecord[];
  items: BillItem[];
  appointment?: BillDetailAppointment;
  doctor?: BillDetailDoctor;
  patient?: BillDetailPatient;
  id: number;
  billNumber: string;
  billType: string;
  status: string;
  paymentStatus: string;
  discountType?: string;
  discountValue?: number;
  discountReason?: string;
  version?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface BillWorkspace {
  patient?: BillDetailPatient;
  doctor?: BillDetailDoctor;
  appointment?: BillDetailAppointment;
  encounter?: BillDetailEncounter;
  bill: BillDetailBill;
  summary: BillSummaryAmount;
  items: BillItem[];
  paymentHistory: BillPaymentRecord[];
  auditHistory: BillAuditLog[];
  capabilities?: BillCapabilities;
}

export interface NormalizedBillWorkspace extends BillWorkspace {
  id: string;
  billId?: number;
  billNumber: string;
  billType: string;
  status: string;
  paymentStatus: string;
  discountType?: string;
  discountValue?: number;
  discountReason?: string;
  version?: number;
  createdAt?: string;
  updatedAt?: string;
  patient?: BillDetailPatient;
  doctor?: BillDetailDoctor;
  appointment?: BillDetailAppointment;
  encounter?: BillDetailEncounter;
  summary: BillSummaryAmount;
  items: BillItem[];
  paymentHistory: BillPaymentRecord[];
  auditHistory: BillAuditLog[];
  capabilities?: BillCapabilities;
  bill: BillDetailBill;
}

export interface BillItemPayload {
  serviceCode: string;
  itemName: string;
  description: string;
  quantity: number;
  unitPrice: number;
  taxRate: number;
}

export interface BillDiscountPayload {
  discountType: "PERCENTAGE" | "FIXED";
  value: number;
  reason: string;
}

export interface BillSummary {
  billId: number;
  billNumber: string;
  status: {
    billStatus: string;
    paymentStatus: string;
  };
  amount: BillSummaryAmount;
}

export interface BillFinalizeResponse {
  billNumber: string;
  status: string;
  netAmount: number;
}

export interface BillPaymentRecord {
  transactionDate?: string;
  id?: number;
  paymentId?: number;
  paymentNumber?: string;
  receiptNumber?: string;
  method: string;
  status?: string;
  amount: number;
  referenceNumber?: string;
  transactionRef?: string;
  receivedBy?: string;
  paidAt?: string;
}

export interface PaymentHistoryResponse {
  billId: number;
  billNumber: string;
  paymentSummary: {
    netAmount: number;
    paidAmount: number;
    balanceAmount: number;
    refundedAmount: number;
  };
  payments: BillPaymentRecord[];
}

export interface PaymentReceivePayload {
  payments: PaymentEntry[];
  remarks?: string;
}

interface PaymentEntry {
  method: string;
  amount: number;
  referenceNumber?: string;
}

export interface PaymentReceiveResponse {
  receiptNumber: string;
  paymentStatus: string;
  totalPaid: number;
  balance: number;
}

export interface ReceiptData {
  receiptNumber: string;
  billNumber: string;
  patientName: string;
  mrn: string;
  grossAmount: number;
  discountAmount: number;
  taxAmount: number;
  netAmount: number;
  totalPaid: number;
  balance: number;
  payments: Array<{
    method: string;
    amount: number;
    referenceNumber?: string;
  }>;
}

export interface BillingDashboardSummary {
  readyForBilling: number;
  draft: number;
  finalized: number;
  unpaid: number;
  partiallyPaid: number;
  paid?: number;
  cancelled?: number;
  voided?: number;
  refunded?: number;
  todayRevenue: number;
  todayCollections: number;
  outstanding: number;
}

export interface OutstandingBill {
  billId: number;
  billNumber: string;
  patientName: string;
  netAmount: number;
  paidAmount: number;
  balanceAmount: number;
}

export interface DailyReport {
  date: string;
  billSummary: {
    totalBills: number;
    totalRevenue: number;
  };
  collection: {
    cash: number;
    upi: number;
    card: number;
    total: number;
  };
  outstanding: number;
}

export interface PaymentModeReport {
  period: {
    from: string;
    to: string;
  };
  paymentModes: Array<{
    method: string;
    transactionCount: number;
    amount: number;
  }>;
  totalCollection: number;
}

interface BillAuditLog {
  id?: number;
  action: string;
  oldValue?: string;
  newValue?: string;
  performedByUserId?: number;
  performedAt?: string;
}

export interface BillAuditResponse {
  billId: number;
  auditLogs: BillAuditLog[];
}
