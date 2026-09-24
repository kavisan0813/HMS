import { billingApi } from "../api/billing.api";
import { apiClient } from "../../../lib/axios";
import type {
  BillListItem,
  BillWorkspace,
  BillCreatePayload,
  BillCreateResponse,
  BillItemPayload,
  BillDiscountPayload,
  BillSummary,
  BillFinalizeResponse,
  PaymentHistoryResponse,
  PaymentReceivePayload,
  PaymentReceiveResponse,
  ReceiptData,
  BillingDashboardSummary,
  OutstandingBill,
  DailyReport,
  PaymentModeReport,
  BillAuditResponse,
  InvoiceRecord,
  PendingBillingRecord,
} from "../types/billing.types";
import { mapApiBillToInvoiceRecord } from "../utils/billing.utils";

const billIdCache = new Map<string, number>();

async function resolveBillId(rawId: number | string): Promise<number | string> {
  if (rawId === null || rawId === undefined) return rawId;
  const strId = String(rawId).trim();
  if (!strId) return rawId;

  if (/^\d+$/.test(strId)) {
    return Number(strId);
  }

  if (billIdCache.has(strId)) {
    return billIdCache.get(strId)!;
  }

  try {
    const response = await billingApi.searchBills({
      search: strId,
      page: 0,
      size: 10,
    });
    const content =
      (response.data as unknown as { content?: Array<Record<string, unknown>> })
        ?.content || [];
    const found = content.find(
      (b: Record<string, unknown>) =>
        b.billNumber === strId ||
        b.invoiceId === strId ||
        (b.billNumber &&
          String(b.billNumber).toLowerCase() === strId.toLowerCase()),
    );
    const numericId = found?.billId ?? found?.id;
    if (numericId != null && !isNaN(Number(numericId))) {
      const parsed = Number(numericId);
      billIdCache.set(strId, parsed);
      return parsed;
    }
  } catch (err) {
    console.warn("Could not resolve numeric billId for string:", strId, err);
  }

  return rawId;
}

export const billingService = {
  // ── Bill CRUD ────────────────────────────────────────────────────────────

  async searchBills(params?: {
    page?: number;
    size?: number;
    sort?: string;
    sortBy?: string;
    direction?: string;
    status?: string;
    billStatus?: string;
    paymentStatus?: string;
    paymentMethod?: string;
    patientId?: string | number;
    mrn?: string;
    doctorId?: string | number;
    search?: string;
    fromDate?: string;
    toDate?: string;
  }): Promise<{
    bills: BillListItem[];
    totalElements: number;
    totalPages: number;
  }> {
    const response = await billingApi.searchBills(params);
    const data = response.data;
    return {
      bills: (data.content || []) as unknown as BillListItem[],
      totalElements: data.totalElements || 0,
      totalPages: data.totalPages || 0,
    };
  },

  async getBill(billId: number | string): Promise<BillWorkspace> {
    const targetId = await resolveBillId(billId);
    const response = await billingApi.getBill(targetId);
    return response.data;
  },

  async searchPendingBilling(params?: {
    page?: number;
    size?: number;
    sort?: string;
    search?: string;
    date?: string;
    fromDate?: string;
    toDate?: string;
    billingStatus?: string;
  }): Promise<{
    records: PendingBillingRecord[];
    totalElements: number;
    totalPages: number;
  }> {
    const response = await billingApi.getPendingBilling(params);
    const data = response.data;
    return {
      records: data.content || [],
      totalElements: data.totalElements || 0,
      totalPages: data.totalPages || 0,
    };
  },

  async searchBillingPatients(query: string): Promise<PendingBillingRecord[]> {
    const response = await billingApi.searchBillingPatients(query);
    return response.data || [];
  },

  async createBill(payload: BillCreatePayload): Promise<BillCreateResponse> {
    const response = await billingApi.createBill(payload);
    return response.data;
  },

  async addBillItem(
    billId: number | string,
    payload: BillItemPayload,
  ): Promise<void> {
    const targetId = await resolveBillId(billId);
    await billingApi.addBillItem(targetId, payload);
  },

  async updateBillItem(
    billId: number | string,
    itemId: number | string,
    payload: BillItemPayload,
  ): Promise<void> {
    const targetId = await resolveBillId(billId);
    await billingApi.updateBillItem(targetId, itemId, payload);
  },

  async deleteBillItem(
    billId: number | string,
    itemId: number | string,
  ): Promise<void> {
    const targetId = await resolveBillId(billId);
    await billingApi.deleteBillItem(targetId, itemId);
  },

  async applyDiscount(
    billId: number | string,
    payload: BillDiscountPayload,
  ): Promise<void> {
    const targetId = await resolveBillId(billId);
    await billingApi.applyDiscount(targetId, payload);
  },

  async getBillSummary(billId: number | string): Promise<BillSummary> {
    const targetId = await resolveBillId(billId);
    const response = await billingApi.getBillSummary(targetId);
    return response.data;
  },

  async finalizeBill(billId: number | string): Promise<BillFinalizeResponse> {
    const targetId = await resolveBillId(billId);
    const response = await billingApi.finalizeBill(targetId);
    return response.data;
  },

  async cancelBill(billId: number | string, reason?: string): Promise<void> {
    const targetId = await resolveBillId(billId);
    await billingApi.cancelBill(targetId, reason ? { reason } : undefined);
  },

  async voidBill(billId: number | string, reason: string): Promise<void> {
    const targetId = await resolveBillId(billId);
    await billingApi.voidBill(targetId, { reason });
  },

  // ── Payments ─────────────────────────────────────────────────────────────

  async getPaymentHistory(
    billId: number | string,
  ): Promise<PaymentHistoryResponse> {
    const targetId = await resolveBillId(billId);
    const response = await billingApi.getPaymentHistory(targetId);
    return response.data;
  },

  async receivePayment(
    billId: number | string,
    payload: PaymentReceivePayload,
  ): Promise<PaymentReceiveResponse> {
    const targetId = await resolveBillId(billId);

    const normalizedPayments = (payload.payments || []).map((p) => {
      const rawMethod = String(p.method || "CASH")
        .trim()
        .toUpperCase();
      let method = rawMethod;
      if (
        rawMethod === "CASH" ||
        rawMethod === "HAND CASH" ||
        rawMethod === "HAND_CASH" ||
        rawMethod === "PHYSICAL CASH" ||
        rawMethod === "CURRENCY"
      ) {
        method = "CASH";
      } else if (
        rawMethod.includes("BANK") ||
        rawMethod.includes("TRANSFER") ||
        rawMethod.includes("NEFT") ||
        rawMethod.includes("IMPS")
      ) {
        method = "BANK_TRANSFER";
      } else if (
        rawMethod.includes("CARD") ||
        rawMethod.includes("CREDIT") ||
        rawMethod.includes("DEBIT")
      ) {
        method = "CARD";
      } else if (
        rawMethod.includes("UPI") ||
        rawMethod.includes("GPAY") ||
        rawMethod.includes("PHONEPE") ||
        rawMethod.includes("PAYTM")
      ) {
        method = "UPI";
      }

      // For CASH (hand cash) payments, reference number is not needed
      const refNum =
        method === "CASH"
          ? undefined
          : p.referenceNumber && p.referenceNumber.trim()
            ? p.referenceNumber.trim()
            : undefined;

      return {
        ...p,
        method,
        referenceNumber: refNum,
      };
    });

    const response = await billingApi.receivePayment(targetId, {
      ...payload,
      payments: normalizedPayments,
    });
    return response.data;
  },

  async processRefund(
    billId: number | string,
    amount: number,
    reason: string,
  ): Promise<void> {
    const targetId = await resolveBillId(billId);
    await billingApi.processRefund(targetId, { amount, reason });
  },

  // ── Receipts ─────────────────────────────────────────────────────────────

  async getReceipt(billId: number | string): Promise<ReceiptData> {
    const targetId = await resolveBillId(billId);
    const response = await billingApi.getReceipt(targetId);
    return response.data;
  },

  async reprintReceipt(billId: number | string): Promise<ReceiptData> {
    const targetId = await resolveBillId(billId);
    const response = await billingApi.reprintReceipt(targetId);
    return response.data;
  },

  // ── Dashboard ────────────────────────────────────────────────────────────

  async getDashboardSummary(params?: {
    fromDate?: string;
    toDate?: string;
  }): Promise<BillingDashboardSummary> {
    const response = await billingApi.getDashboardSummary(params);
    return response.data;
  },

  async getOutstanding(): Promise<{
    totalOutstanding: number;
    bills: OutstandingBill[];
  }> {
    const response = await billingApi.getOutstanding();
    return response.data;
  },

  // ── Patient Billing ──────────────────────────────────────────────────────

  async getPatientBilling(mrn: string): Promise<InvoiceRecord[]> {
    try {
      let responseData: Record<string, unknown> | null = null;
      try {
        const response = await billingApi.getPatientBilling(mrn);
        responseData = response.data as unknown as Record<string, unknown>;
      } catch (err) {
        console.log(err);
        try {
          const res = await apiClient.get<Record<string, unknown>>(
            `/api/v1/patients/${encodeURIComponent(mrn)}/billing`,
          );
          responseData = (res.data?.data || res.data) as Record<
            string,
            unknown
          >;
        } catch (err) {
          console.log(err);
          try {
            const res = await apiClient.get<Record<string, unknown>>(
              `/api/v1/billing?mrn=${encodeURIComponent(mrn)}`,
            );
            responseData = (res.data?.data || res.data) as Record<
              string,
              unknown
            >;
          } catch (err) {
            console.log(err);
            return [];
          }
        }
      }

      if (!responseData) return [];

      const rawBills = Array.isArray(responseData.bills)
        ? (responseData.bills as Record<string, unknown>[])
        : Array.isArray(responseData.content)
          ? (responseData.content as Record<string, unknown>[])
          : Array.isArray(responseData)
            ? (responseData as Record<string, unknown>[])
            : [];

      return rawBills.map((bill: Record<string, unknown>) => {
        const summaryObj = (bill.summary || {}) as Record<string, unknown>;
        const patientObj = (bill.patient || {}) as Record<string, unknown>;
        const doctorObj = (bill.doctor || {}) as Record<string, unknown>;
        const deptObj = (bill.department || {}) as Record<string, unknown>;

        const doctorName = String(
          bill.doctorName ||
            bill.doctor_name ||
            bill.attendingDoctorName ||
            bill.attendingDoctor ||
            (typeof bill.doctor === "string" ? bill.doctor : "") ||
            doctorObj.fullName ||
            doctorObj.doctorName ||
            doctorObj.name ||
            "",
        );

        const departmentName = String(
          bill.departmentName ||
            bill.department_name ||
            (typeof bill.department === "string" ? bill.department : "") ||
            deptObj.departmentName ||
            deptObj.name ||
            "",
        );

        return mapApiBillToInvoiceRecord({
          ...bill,
          billId: (bill.billId || bill.id) as number | undefined,
          billNumber: String(
            bill.billNumber ||
              bill.invoiceNumber ||
              bill.billId ||
              bill.id ||
              "",
          ),
          patientName: String(
            bill.patientName ||
              responseData?.patientName ||
              patientObj.name ||
              patientObj.fullName ||
              "",
          ),
          patientMrn: String(
            bill.patientMrn || responseData?.mrn || patientObj.mrn || mrn,
          ),
          mrn: String(
            bill.patientMrn || responseData?.mrn || patientObj.mrn || mrn,
          ),
          doctorName,
          departmentName,
          consultationFee: 0,
          status: String(bill.billStatus || bill.status || "FINALIZED"),
          paymentStatus: String(bill.paymentStatus || "UNPAID"),
          summary: {
            grossAmount: Number(
              summaryObj.grossAmount || bill.amount || bill.totalAmount || 0,
            ),
            discountAmount: Number(
              summaryObj.discountAmount || bill.discount || 0,
            ),
            taxAmount: Number(summaryObj.taxAmount || bill.tax || 0),
            netAmount: Number(
              summaryObj.netAmount || bill.amount || bill.netAmount || 0,
            ),
            paidAmount: Number(
              summaryObj.paidAmount ||
                (bill.paymentStatus === "PAID" ? bill.amount || 0 : 0),
            ),
            balanceAmount: Number(
              summaryObj.balanceAmount ||
                (bill.paymentStatus === "PAID" ? 0 : bill.amount || 0),
            ),
          },
        } as unknown as BillListItem);
      });
    } catch (err) {
      console.log(err);
      return [];
    }
  },

  // ── Reports ──────────────────────────────────────────────────────────────

  async getDailyReport(): Promise<DailyReport> {
    const response = await billingApi.getDailyReport();
    return response.data;
  },

  async getPaymentModesReport(): Promise<PaymentModeReport> {
    const response = await billingApi.getPaymentModesReport();
    return response.data;
  },

  // ── Audit ────────────────────────────────────────────────────────────────

  async getBillAudit(billId: number | string): Promise<BillAuditResponse> {
    const response = await billingApi.getBillAudit(billId);
    return response.data;
  },

  // ── Legacy helpers (for backward compat) ─────────────────────────────────

  mapBillToInvoice(bill: BillListItem): InvoiceRecord {
    return mapApiBillToInvoiceRecord(bill);
  },

  mapBillsToInvoices(bills: BillListItem[]): InvoiceRecord[] {
    return bills.map(mapApiBillToInvoiceRecord);
  },

  calculateSummary(invoices: InvoiceRecord[]) {
    let totalBilled = 0;
    let totalPaid = 0;
    let totalPending = 0;

    invoices.forEach((inv) => {
      totalBilled += inv.invoiceAmount;
      totalPaid += inv.paidAmount;
      totalPending += inv.balance;
    });

    return {
      totalBilled,
      totalPaid,
      totalPending,
      invoiceCount: invoices.length,
    };
  },
};
