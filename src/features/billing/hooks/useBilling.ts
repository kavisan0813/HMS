import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { billingService } from "../services/billing.service";
import type {
  BillingConfiguration,
  BillDiscountPayload,
  BillItemPayload,
  BillSummaryAmount,
  NormalizedBillWorkspace,
} from "../types/billing.types";

export const billingKeys = {
  all: ["billing"] as const,
  list: (params?: Record<string, unknown>) =>
    [...billingKeys.all, "list", params] as const,
  detail: (billId: number | string) =>
    [...billingKeys.all, "detail", billId] as const,
  summary: (billId: number | string) =>
    [...billingKeys.all, "summary", billId] as const,
  payments: (billId: number | string) =>
    [...billingKeys.all, "payments", billId] as const,
  receipt: (billId: number | string) =>
    [...billingKeys.all, "receipt", billId] as const,
  dashboard: (params?: { fromDate?: string; toDate?: string }) =>
    [...billingKeys.all, "dashboard", params] as const,
  patient: (mrn: string) => [...billingKeys.all, "patient", mrn] as const,
  outstanding: () => [...billingKeys.all, "outstanding"] as const,
  audit: (billId: number | string) =>
    [...billingKeys.all, "audit", billId] as const,
  pendingBilling: (params?: {
    page?: number;
    size?: number;
    search?: string;
    billingStatus?: string;
  }) => [...billingKeys.all, "pending-billing", params] as const,
  billingSearch: (query: string) =>
    [...billingKeys.all, "billing-search", query] as const,
};

import { useAuthStore } from "../../auth/store/auth.store";
import { DEFAULT_CONFIGURATION } from "../constants/billing.constants";

function isStaffBillingAllowed(): boolean {
  const role = useAuthStore.getState().user?.role;
  if (!role) return false;
  const r = String(role).toUpperCase();
  return !["DOCTOR", "NURSE", "PATIENT"].includes(r);
}

// ── useBilling ──────────────────────────────────────────────────────────────

export function useBilling(patientMrn?: string) {
  const patientQuery = useQuery({
    queryKey: billingKeys.patient(patientMrn || ""),
    queryFn: () => billingService.getPatientBilling(patientMrn || ""),
    enabled: !!patientMrn,
  });

  return {
    invoices: patientMrn ? patientQuery.data || [] : [],
    loading: patientMrn ? patientQuery.isLoading : false,
    refetch: () => {
      if (patientMrn) patientQuery.refetch();
    },
  };
}

// ── useBillingList ──────────────────────────────────────────────────────────

export function useBillingList(params?: {
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
  enabled?: boolean;
}) {
  const { enabled: paramEnabled, ...queryParams } = params ?? {};
  const isAllowed = isStaffBillingAllowed();
  return useQuery({
    queryKey: billingKeys.list(
      queryParams as Record<string, unknown> | undefined,
    ),
    queryFn: () => billingService.searchBills(queryParams),
    enabled: isAllowed && paramEnabled !== false,
  });
}

// ── useReadyForBillingSearch ────────────────────────────────────────────────
// Searches /api/v1/billing with status=READY_FOR_BILLING for the invoice workspace

export function useReadyForBillingSearch(
  search: string,
  options?: { enabled?: boolean },
) {
  const isAllowed = isStaffBillingAllowed();
  return useQuery({
    queryKey: [...billingKeys.all, "ready-for-billing-search", search] as const,
    queryFn: () =>
      billingService.searchBills({
        status: "READY_FOR_BILLING",
        paymentStatus: "UNPAID",
        search: search || undefined,
        page: 0,
        size: 20,
        sortBy: "createdAt",
        direction: "desc",
      }),
    enabled: isAllowed && options?.enabled !== false,
    staleTime: 30_000,
  });
}

// ── useInvoice ──────────────────────────────────────────────────────────────

export function useInvoice(billId?: number | string) {
  const queryClient = useQueryClient();

  const billQuery = useQuery({
    queryKey: billingKeys.detail(billId || ""),
    queryFn: () => billingService.getBill(billId!),
    enabled: !!billId,
    retry: (failureCount, error: { status?: number }) => {
      if (error?.status && error.status >= 400 && error.status < 500)
        return false;
      return failureCount < 2;
    },
  });

  const summaryQuery = useQuery({
    queryKey: billingKeys.summary(billId || ""),
    queryFn: () => billingService.getBillSummary(billId!),
    enabled: !!billId,
    retry: (failureCount, error: { status?: number }) => {
      if (error?.status && error.status >= 400 && error.status < 500)
        return false;
      return failureCount < 2;
    },
  });

  const createBillMutation = useMutation({
    mutationFn: billingService.createBill,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: billingKeys.all });
    },
  });

  const finalizeBillMutation = useMutation({
    mutationFn: (id: number | string) => billingService.finalizeBill(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: billingKeys.all });
    },
  });

  const cancelBillMutation = useMutation({
    mutationFn: ({ id, reason }: { id: number | string; reason?: string }) =>
      billingService.cancelBill(id, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: billingKeys.all });
    },
  });

  const addBillItemMutation = useMutation({
    mutationFn: ({
      billId,
      payload,
    }: {
      billId: number | string;
      payload: BillItemPayload;
    }) => billingService.addBillItem(billId, payload),
    onSuccess: () => {
      if (billId) {
        queryClient.invalidateQueries({ queryKey: billingKeys.detail(billId) });
        queryClient.invalidateQueries({
          queryKey: billingKeys.summary(billId),
        });
      }
    },
  });

  const deleteBillItemMutation = useMutation({
    mutationFn: ({
      billId,
      itemId,
    }: {
      billId: number | string;
      itemId: number | string;
    }) => billingService.deleteBillItem(billId, itemId),
    onSuccess: () => {
      if (billId) {
        queryClient.invalidateQueries({ queryKey: billingKeys.detail(billId) });
        queryClient.invalidateQueries({
          queryKey: billingKeys.summary(billId),
        });
      }
    },
  });

  const updateBillItemMutation = useMutation({
    mutationFn: ({
      billId,
      itemId,
      payload,
    }: {
      billId: number | string;
      itemId: number | string;
      payload: BillItemPayload;
    }) => billingService.updateBillItem(billId, itemId, payload),
    onSuccess: () => {
      if (billId) {
        queryClient.invalidateQueries({ queryKey: billingKeys.detail(billId) });
        queryClient.invalidateQueries({
          queryKey: billingKeys.summary(billId),
        });
      }
    },
  });

  const voidBillMutation = useMutation({
    mutationFn: ({ id, reason }: { id: number | string; reason: string }) =>
      billingService.voidBill(id, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: billingKeys.all });
    },
  });

  const refundMutation = useMutation({
    mutationFn: ({
      billId,
      amount,
      reason,
    }: {
      billId: number | string;
      amount: number;
      reason: string;
    }) => billingService.processRefund(billId, amount, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: billingKeys.all });
    },
  });

  const reprintReceiptMutation = useMutation({
    mutationFn: (id: number | string) => billingService.reprintReceipt(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: billingKeys.all });
    },
  });

  const applyDiscountMutation = useMutation({
    mutationFn: ({
      billId,
      ...payload
    }: {
      billId: number | string;
    } & BillDiscountPayload) => billingService.applyDiscount(billId, payload),
    onSuccess: (_data, variables) => {
      const targetBillId = variables.billId || billId;
      if (targetBillId) {
        queryClient.invalidateQueries({
          queryKey: billingKeys.detail(targetBillId),
        });
        queryClient.invalidateQueries({
          queryKey: billingKeys.summary(targetBillId),
        });
      }
    },
  });

  const workspace = billQuery.data || null;
  const rawBill = workspace?.bill || null;
  const rawSummary = workspace?.summary || summaryQuery.data?.amount || null;

  const billSummary: BillSummaryAmount = {
    grossAmount: rawSummary?.grossAmount ?? rawSummary?.netAmount ?? 0,
    discountAmount: rawSummary?.discountAmount ?? 0,
    taxableAmount: rawSummary?.taxableAmount,
    taxAmount: rawSummary?.taxAmount ?? 0,
    roundOff: rawSummary?.roundOff,
    roundOffAmount: rawSummary?.roundOffAmount,
    netAmount: rawSummary?.netAmount ?? 0,
    paidAmount: rawSummary?.paidAmount ?? 0,
    balanceAmount: rawSummary?.balanceAmount ?? 0,
    refundedAmount: rawSummary?.refundedAmount ?? 0,
    paymentStatus: rawSummary?.paymentStatus,
  };

  const normalizedBill: NormalizedBillWorkspace | null = workspace
    ? {
        ...workspace,
        id: String(rawBill?.id ?? rawBill?.billId ?? billId ?? ""),
        billId:
          rawBill?.id ??
          rawBill?.billId ??
          (typeof billId === "number" ? billId : Number(billId) || undefined),
        billNumber: String(
          rawBill?.billNumber || workspace.bill?.billNumber || billId || "",
        ),
        billType: String(rawBill?.billType || "OPD"),
        status: String(rawBill?.status || "FINALIZED"),
        paymentStatus: String(rawBill?.paymentStatus || "UNPAID"),
        discountType: rawBill?.discountType,
        discountValue: rawBill?.discountValue,
        discountReason: rawBill?.discountReason,
        version: rawBill?.version,
        createdAt: rawBill?.createdAt,
        updatedAt: rawBill?.updatedAt,
        patient: workspace.patient,
        doctor: workspace.doctor,
        appointment: workspace.appointment,
        encounter: workspace.encounter,
        summary: billSummary,
        items: workspace.items || [],
        paymentHistory: workspace.paymentHistory || [],
        auditHistory: workspace.auditHistory || [],
        capabilities: workspace.capabilities,
        bill: rawBill || workspace.bill,
      }
    : null;

  return {
    bill: normalizedBill,
    summary: billSummary,
    workspace: workspace,
    isLoading: billQuery.isLoading,
    isError: billQuery.isError,
    error: billQuery.error,

    createBill: createBillMutation.mutateAsync,
    isCreating: createBillMutation.isPending,

    finalizeBill: finalizeBillMutation.mutateAsync,
    isFinalizing: finalizeBillMutation.isPending,

    cancelBill: cancelBillMutation.mutateAsync,
    isCancelling: cancelBillMutation.isPending,

    voidBill: voidBillMutation.mutateAsync,
    isVoiding: voidBillMutation.isPending,

    refund: refundMutation.mutateAsync,
    isRefunding: refundMutation.isPending,

    reprintReceipt: reprintReceiptMutation.mutateAsync,
    isReprinting: reprintReceiptMutation.isPending,

    addBillItem: addBillItemMutation.mutateAsync,
    isAddingItem: addBillItemMutation.isPending,

    updateBillItem: updateBillItemMutation.mutateAsync,
    isUpdatingItem: updateBillItemMutation.isPending,

    deleteBillItem: deleteBillItemMutation.mutateAsync,
    isDeletingItem: deleteBillItemMutation.isPending,

    applyDiscount: applyDiscountMutation.mutateAsync,
    isApplyingDiscount: applyDiscountMutation.isPending,

    refetch: () => {
      billQuery.refetch();
      summaryQuery.refetch();
    },
  };
}

// ── usePayment ──────────────────────────────────────────────────────────────

export function usePayment(billId?: number | string) {
  const queryClient = useQueryClient();

  const paymentHistoryQuery = useQuery({
    queryKey: billingKeys.payments(billId || ""),
    queryFn: () => billingService.getPaymentHistory(billId!),
    enabled: !!billId,
    retry: (failureCount, error: { status?: number }) => {
      if (error?.status && error.status >= 400 && error.status < 500)
        return false;
      return failureCount < 2;
    },
  });

  const receivePaymentMutation = useMutation({
    mutationFn: ({
      billId,
      payments,
      remarks,
    }: {
      billId: number | string;
      payments: Array<{
        method: string;
        amount: number;
        referenceNumber?: string;
      }>;
      remarks?: string;
    }) => billingService.receivePayment(billId, { payments, remarks }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: billingKeys.all });
    },
  });

  const processRefundMutation = useMutation({
    mutationFn: ({
      billId,
      amount,
      reason,
    }: {
      billId: number | string;
      amount: number;
      reason: string;
    }) => billingService.processRefund(billId, amount, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: billingKeys.all });
    },
  });

  return {
    paymentHistory: paymentHistoryQuery.data || null,
    isLoading: paymentHistoryQuery.isLoading,

    receivePayment: receivePaymentMutation.mutateAsync,
    isReceiving: receivePaymentMutation.isPending,
    receivePaymentError: receivePaymentMutation.error,

    processRefund: processRefundMutation.mutateAsync,
    isRefunding: processRefundMutation.isPending,

    refetch: () => paymentHistoryQuery.refetch(),
  };
}

// ── useReceipt ──────────────────────────────────────────────────────────────

export function useReceipt(billId?: number | string) {
  const receiptQuery = useQuery({
    queryKey: billingKeys.receipt(billId || ""),
    queryFn: () => billingService.getReceipt(billId!),
    enabled: !!billId,
  });

  return {
    receipt: receiptQuery.data || null,
    isLoading: receiptQuery.isLoading,
    refetch: () => receiptQuery.refetch(),
  };
}

// ── useBillingDashboard ─────────────────────────────────────────────────────

export function useBillingDashboard(params?: {
  fromDate?: string;
  toDate?: string;
  enabled?: boolean;
}) {
  const { enabled: paramEnabled, ...queryParams } = params ?? {};
  const isAllowed = isStaffBillingAllowed();
  return useQuery({
    queryKey: billingKeys.dashboard(queryParams),
    queryFn: () => billingService.getDashboardSummary(queryParams),
    enabled: isAllowed && paramEnabled !== false,
  });
}

// ── useBillingConfiguration ─────────────────────────────────────────────────

const BILLING_CONFIG_KEY = "hms-billing-configuration:v1";

function loadBillingConfig(): BillingConfiguration | null {
  try {
    const raw = localStorage.getItem(BILLING_CONFIG_KEY);
    if (raw) return JSON.parse(raw);
  } catch {
    // ignore
  }
  return null;
}

function saveBillingConfig(config: BillingConfiguration) {
  localStorage.setItem(BILLING_CONFIG_KEY, JSON.stringify(config));
}

export function useBillingConfiguration() {
  const [configuration, setConfiguration] = useState<BillingConfiguration>(
    () => loadBillingConfig() || DEFAULT_CONFIGURATION,
  );

  const saveConfiguration = (config: BillingConfiguration) => {
    saveBillingConfig(config);
    setConfiguration(config);
  };

  return {
    configuration,
    saveConfiguration,
  };
}
