import {
  useReducer,
  useState,
  useMemo,
  useCallback,
  useEffect,
  startTransition,
} from "react";
import { useNavigate, useSearchParams } from "react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  User,
  Search,
  CreditCard,
  DollarSign,
  FileText,
  CheckCircle2,
  Plus,
  Copy,
  X,
  AlertCircle,
  ArrowLeft,
} from "lucide-react";
import { PP, RB } from "../constants/billing.constants";
import {
  useReadyForBillingSearch,
  useInvoice,
  usePayment,
  billingKeys,
} from "../hooks/useBilling";
import { billingService } from "../services/billing.service";
import { usePatient } from "../../patients/hooks/usePatients";
import { useAppointment } from "../../appointments/hooks/useAppointment";
import { BillingStatusBadge } from "../components/BillingStatusBadge";
import type {
  PaymentMethod,
  PaymentStatus,
  BillListItem,
} from "../types/billing.types";
import type { Patient } from "../../patients/types/patient.types";

interface BillingLineItem {
  id: string;
  serviceName: string;
  category: string;
  quantity: number;
  unitPrice: number;
  discount: number;
  tax: number;
  total: number;
}

const SERVICE_CATALOG = [
  {
    serviceName: "OPD Consultation Fee",
    category: "Consultation",
    unitPrice: 500,
  },
  {
    serviceName: "ECG 12-Lead Diagnostic",
    category: "Diagnostics",
    unitPrice: 850,
  },
  { serviceName: "Blood Sugar Test", category: "Lab", unitPrice: 200 },
  {
    serviceName: "CBC (Complete Blood Count)",
    category: "Lab",
    unitPrice: 350,
  },
  { serviceName: "X-Ray Chest PA View", category: "Radiology", unitPrice: 600 },
  { serviceName: "Urine Routine", category: "Lab", unitPrice: 150 },
  {
    serviceName: "EEG (Electroencephalogram)",
    category: "Diagnostics",
    unitPrice: 1200,
  },
  { serviceName: "Physiotherapy Session", category: "Therapy", unitPrice: 800 },
  {
    serviceName: "Dressing & Bandaging",
    category: "Procedure",
    unitPrice: 250,
  },
  {
    serviceName: "Injection Administration",
    category: "Procedure",
    unitPrice: 100,
  },
];

interface BillingFormState {
  patientSearch: string;
  showSearchDropdown: boolean;
  selectedPatient: Patient | null;
  selectedBillingRecord: BillListItem | null;
  patientCategory: "General" | "Insurance" | "Corporate" | "VIP";
  lineItems: BillingLineItem[];
  discountType: "Fixed" | "Percentage";
  discountValue: number;
  taxPercentage: number;
  additionalCharges: number;
  billingRemarks: string;
}

type BillingFormAction =
  | { type: "SET_PATIENT_SEARCH"; payload: string }
  | { type: "SET_SHOW_SEARCH_DROPDOWN"; payload: boolean }
  | {
    type: "SELECT_PATIENT";
    payload: { patient: Patient | null; search: string };
  }
  | { type: "SELECT_BILLING_RECORD"; payload: BillListItem | null }
  | {
    type: "SET_PATIENT_CATEGORY";
    payload: "General" | "Insurance" | "Corporate" | "VIP";
  }
  | { type: "SET_LINE_ITEMS"; payload: BillingLineItem[] }
  | {
    type: "UPDATE_LINE_ITEM";
    payload: {
      id: string;
      field: keyof BillingLineItem;
      val: string | number;
    };
  }
  | { type: "ADD_LINE_ITEM"; payload: BillingLineItem }
  | { type: "DUPLICATE_LINE_ITEM"; payload: BillingLineItem }
  | { type: "REMOVE_LINE_ITEM"; payload: string }
  | { type: "SET_DISCOUNT_TYPE"; payload: "Fixed" | "Percentage" }
  | { type: "SET_DISCOUNT_VALUE"; payload: number }
  | { type: "SET_TAX_PERCENTAGE"; payload: number }
  | { type: "SET_ADDITIONAL_CHARGES"; payload: number }
  | { type: "SET_BILLING_REMARKS"; payload: string }
  | {
    type: "LOAD_BILL_WORKSPACE";
    payload: {
      lineItems?: BillingLineItem[];
      discountType?: "Fixed" | "Percentage";
      discountValue?: number;
      billingRemarks?: string;
    };
  };

function billingFormReducer(
  state: BillingFormState,
  action: BillingFormAction,
): BillingFormState {
  switch (action.type) {
    case "SET_PATIENT_SEARCH":
      return { ...state, patientSearch: action.payload };
    case "SET_SHOW_SEARCH_DROPDOWN":
      return { ...state, showSearchDropdown: action.payload };
    case "SELECT_PATIENT":
      return {
        ...state,
        selectedPatient: action.payload.patient,
        patientSearch: action.payload.search,
        showSearchDropdown: false,
      };
    case "SELECT_BILLING_RECORD":
      return { ...state, selectedBillingRecord: action.payload };
    case "SET_PATIENT_CATEGORY":
      return { ...state, patientCategory: action.payload };
    case "SET_LINE_ITEMS":
      return { ...state, lineItems: action.payload };
    case "UPDATE_LINE_ITEM": {
      const { id, field, val } = action.payload;
      return {
        ...state,
        lineItems: state.lineItems.map((item) => {
          if (item.id === id) {
            const updated = { ...item, [field]: val };
            const base = updated.quantity * updated.unitPrice;
            const disc = updated.discount;
            const afterDisc = Math.max(0, base - disc);
            const tx = (afterDisc * updated.tax) / 100;
            updated.total = Math.round(afterDisc + tx);
            return updated;
          }
          return item;
        }),
      };
    }
    case "ADD_LINE_ITEM":
      return { ...state, lineItems: [...state.lineItems, action.payload] };
    case "DUPLICATE_LINE_ITEM":
      return {
        ...state,
        lineItems: [
          ...state.lineItems,
          { ...action.payload, id: `ITEM-${Date.now()}` },
        ],
      };
    case "REMOVE_LINE_ITEM":
      return {
        ...state,
        lineItems: state.lineItems.filter((i) => i.id !== action.payload),
      };
    case "SET_DISCOUNT_TYPE":
      return { ...state, discountType: action.payload };
    case "SET_DISCOUNT_VALUE":
      return { ...state, discountValue: action.payload };
    case "SET_TAX_PERCENTAGE":
      return { ...state, taxPercentage: action.payload };
    case "SET_ADDITIONAL_CHARGES":
      return { ...state, additionalCharges: action.payload };
    case "SET_BILLING_REMARKS":
      return { ...state, billingRemarks: action.payload };
    case "LOAD_BILL_WORKSPACE":
      return {
        ...state,
        ...(action.payload.lineItems != null && {
          lineItems: action.payload.lineItems,
        }),
        ...(action.payload.discountType != null && {
          discountType: action.payload.discountType,
        }),
        ...(action.payload.discountValue != null && {
          discountValue: action.payload.discountValue,
        }),
        ...(action.payload.billingRemarks != null && {
          billingRemarks: action.payload.billingRemarks,
        }),
      };
    default:
      return state;
  }
}

const initialBillingFormState: BillingFormState = {
  patientSearch: "",
  showSearchDropdown: true,
  selectedPatient: null,
  selectedBillingRecord: null,
  patientCategory: "General",
  lineItems: [
    {
      id: "ITEM-1",
      serviceName: "OPD Consultation Fee",
      category: "Consultation",
      quantity: 1,
      unitPrice: 500,
      discount: 0,
      tax: 0,
      total: 500,
    },
  ],
  discountType: "Fixed",
  discountValue: 0,
  taxPercentage: 18,
  additionalCharges: 0,
  billingRemarks: "",
};

export function CreateInvoiceWorkspacePage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const queryClient = useQueryClient();

  // URL params for pre-population from consultation
  const urlAppointmentId = searchParams.get("appointmentId");
  const urlEncounterId = searchParams.get("encounterId");
  const urlPatientMrn = searchParams.get("patientMrn");
  const urlDoctorId = searchParams.get("doctorId");
  const urlPatientId = searchParams.get("patientId");
  const rawUrlBillId = searchParams.get("billId");
  const urlBillId =
    rawUrlBillId && rawUrlBillId !== "undefined" && rawUrlBillId !== "null"
      ? rawUrlBillId
      : null;

  // Billing form state (patient search, line items, discounts, taxes, category)
  const [form, dispatch] = useReducer(
    billingFormReducer,
    initialBillingFormState,
  );
  const {
    patientSearch,
    showSearchDropdown,
    selectedPatient,
    selectedBillingRecord,
    patientCategory,
    lineItems,
    discountType,
    discountValue,
    taxPercentage,
    additionalCharges,
    billingRemarks,
  } = form;

  // Load existing bill workspace if urlBillId is present
  const { data: billWorkspace, isLoading: isBillLoading } = useQuery({
    queryKey: billingKeys.detail(urlBillId || ""),
    queryFn: () => billingService.getBill(urlBillId!),
    enabled: !!urlBillId,
  });

  const isAlreadyPaidOrFinalized = useMemo(() => {
    const status = billWorkspace?.bill?.status?.toUpperCase();
    const payStatus = billWorkspace?.bill?.paymentStatus?.toUpperCase();
    return (
      payStatus === "PAID" ||
      status === "FINALIZED" ||
      status === "VOIDED" ||
      status === "CANCELLED" ||
      status === "REFUNDED"
    );
  }, [billWorkspace]);

  // Resolved clinical context (from selected record, URL params, or loaded billWorkspace)
  const resolvedAppointmentId =
    selectedBillingRecord?.appointmentId ||
    urlAppointmentId ||
    billWorkspace?.appointment?.id;
  const resolvedEncounterId =
    selectedBillingRecord?.encounterId ||
    urlEncounterId ||
    billWorkspace?.encounter?.id;
  const resolvedDoctorId =
    selectedBillingRecord?.doctorId || urlDoctorId || billWorkspace?.doctor?.id;
  const resolvedPatientMrn =
    selectedBillingRecord?.patientMrn ||
    selectedBillingRecord?.mrn ||
    urlPatientMrn ||
    billWorkspace?.patient?.mrn;
  const resolvedPatientId =
    selectedBillingRecord?.patientId ||
    urlPatientId ||
    billWorkspace?.patient?.id;

  // Payment Details
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>("Pending");
  const [paymentMode, setPaymentMode] = useState<PaymentMethod>("UPI");
  const [amountReceived, setAmountReceived] = useState<number>(0);
  const [referenceNo, setReferenceNo] = useState("");
  const [txnNotes, setTxnNotes] = useState("");

  // Modals
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [createdBillId, setCreatedBillId] = useState<string | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // API hooks — search ready-for-billing records from /api/v1/billing
  const { data: billingSearchData } = useReadyForBillingSearch(patientSearch);
  const {
    createBill,
    addBillItem,
    updateBillItem,
    deleteBillItem,
    applyDiscount,
    finalizeBill,
  } = useInvoice(urlBillId || undefined);
  const { receivePayment } = usePayment(urlBillId || undefined);

  // Fetch details from backend (for URL-param-based pre-population)
  const { data: patientDetails } = usePatient(resolvedPatientMrn || "");
  const { appointment } = useAppointment(String(resolvedAppointmentId || ""));
  const [autoLoaded, setAutoLoaded] = useState(false);
  const [workspaceInitialized, setWorkspaceInitialized] = useState(false);

  // Auto-load from URL params when navigating from Pending Billing tab
  useEffect(() => {
    if (
      resolvedPatientMrn &&
      patientDetails &&
      !selectedPatient &&
      !autoLoaded
    ) {
      queueMicrotask(() => {
        dispatch({
          type: "SELECT_PATIENT",
          payload: {
            patient: patientDetails,
            search: patientDetails.fullName || patientDetails.name || "",
          },
        });
      });
    }
  }, [patientDetails, resolvedPatientMrn, selectedPatient, autoLoaded]);

  // Pre-populate fields once when billWorkspace is loaded
  useEffect(() => {
    if (billWorkspace && !workspaceInitialized) {
      startTransition(() => {
        // Pre-populate items
        if (billWorkspace.items && billWorkspace.items.length > 0) {
          const mappedItems = billWorkspace.items.map((item) => ({
            id: String(item.id),
            serviceName:
              item.serviceName || item.itemName || "Consultation Fee",
            category: "Consultation",
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            discount: item.discountAmount || 0,
            tax: item.taxRate || 0,
            total: item.totalAmount,
          }));
          dispatch({ type: "SET_LINE_ITEMS", payload: mappedItems });
        }

        // Pre-populate discount and remarks
        if (billWorkspace.bill) {
          const type =
            billWorkspace.bill.discountType === "PERCENTAGE"
              ? "Percentage"
              : "Fixed";
          dispatch({ type: "SET_DISCOUNT_TYPE", payload: type });
          dispatch({
            type: "SET_DISCOUNT_VALUE",
            payload: Number(billWorkspace.bill.discountValue || 0),
          });
          dispatch({
            type: "SET_BILLING_REMARKS",
            payload: String(billWorkspace.bill.discountReason || ""),
          });
        }

        // Pre-populate status if existing
        if (billWorkspace.bill?.paymentStatus) {
          const payStatus = billWorkspace.bill.paymentStatus.toUpperCase();
          if (payStatus === "PAID") {
            setPaymentStatus("Paid");
          } else if (
            payStatus === "PARTIALLY_PAID" ||
            payStatus === "PARTIAL_PAID"
          ) {
            setPaymentStatus("Partially Paid");
          } else {
            setPaymentStatus("Pending");
          }
        } else if (
          billWorkspace.summary &&
          billWorkspace.summary.paidAmount > 0
        ) {
          if (billWorkspace.summary.balanceAmount <= 0) {
            setPaymentStatus("Paid");
          } else {
            setPaymentStatus("Partially Paid");
          }
        } else {
          setPaymentStatus("Pending");
        }
        setWorkspaceInitialized(true);
      });
    }
  }, [billWorkspace, workspaceInitialized]);

  // Auto-set line item fee from appointment (URL param) or billing record
  useEffect(() => {
    if (autoLoaded || urlBillId) return;
    if (appointment || selectedBillingRecord) {
      const fee = Number(
        appointment?.doctor?.consultationFee ||
        appointment?.feeAmount ||
        selectedBillingRecord?.consultationFee ||
        selectedBillingRecord?.summary?.grossAmount ||
        selectedBillingRecord?.summary?.netAmount ||
        0,
      );
      queueMicrotask(() => {
        dispatch({
          type: "SET_LINE_ITEMS",
          payload: [
            {
              id: "ITEM-1",
              serviceName: "OPD Consultation Fee",
              category: "Consultation",
              quantity: 1,
              unitPrice: fee,
              discount: 0,
              tax: 0,
              total: fee,
            },
          ],
        });
        setAutoLoaded(true);
      });
    }
  }, [appointment, autoLoaded, selectedBillingRecord, urlBillId]);

  // Billing-eligible patient search results (from /api/v1/billing)
  const filteredBills: BillListItem[] = useMemo(() => {
    if (!billingSearchData?.bills) return [];
    return billingSearchData.bills.slice(0, 8);
  }, [billingSearchData]);

  // Calculations — rawSubtotal uses pre-tax base (qty*unitPrice - discount)
  // to avoid double-counting tax (per-item tax is already in item.total)
  const rawSubtotal = useMemo(
    () =>
      lineItems.reduce((acc, item) => {
        const base = item.quantity * item.unitPrice;
        const afterDisc = Math.max(0, base - item.discount);
        return acc + afterDisc;
      }, 0),
    [lineItems],
  );

  const calculatedDiscount = useMemo(() => {
    if (discountType === "Percentage")
      return (rawSubtotal * discountValue) / 100;
    return discountValue;
  }, [rawSubtotal, discountType, discountValue]);

  const taxableAmount = Math.max(0, rawSubtotal - calculatedDiscount);
  const calculatedTax = useMemo(() => {
    if (billWorkspace?.summary != null) {
      return billWorkspace.summary.taxAmount;
    }
    return (taxableAmount * taxPercentage) / 100;
  }, [billWorkspace, taxableAmount, taxPercentage]);
  const grandTotal = Math.round(
    taxableAmount + calculatedTax + Number(additionalCharges),
  );

  // Previously paid amount on existing bill
  const previouslyPaid = useMemo(() => {
    return Number(
      billWorkspace?.summary?.paidAmount ??
      selectedBillingRecord?.summary?.paidAmount ??
      0,
    );
  }, [billWorkspace, selectedBillingRecord]);

  // Outstanding balance before this transaction
  const outstandingBalance = useMemo(() => {
    return Math.max(0, grandTotal - previouslyPaid);
  }, [grandTotal, previouslyPaid]);

  // Current payment amount entered in the Received Amount field
  const currentReceived = useMemo(() => {
    const val = Number(amountReceived);
    return Number.isFinite(val) ? val : 0;
  }, [amountReceived]);

  // Balance due = Grand Total - Previously Paid - Current Received
  const balanceDue = useMemo(() => {
    return Math.max(
      0,
      grandTotal - previouslyPaid - Math.max(0, currentReceived),
    );
  }, [grandTotal, previouslyPaid, currentReceived]);

  // Payment validations
  const isOverpayment = currentReceived > outstandingBalance;
  const isNegativePayment = currentReceived < 0;
  const hasReceivedAmount = currentReceived > 0;
  const isPaymentValid =
    hasReceivedAmount && !isOverpayment && !isNegativePayment;

  const canCollect =
    !isSubmitting &&
    !isBillLoading &&
    !!selectedPatient &&
    isPaymentValid &&
    !isAlreadyPaidOrFinalized;

  const handlePaymentStatusChange = (newStatus: PaymentStatus) => {
    setPaymentStatus(newStatus);
    if (newStatus === "Paid") {
      setAmountReceived(outstandingBalance);
    } else if (newStatus === "Pending") {
      setAmountReceived(0);
    } else if (newStatus === "Partially Paid") {
      if (currentReceived <= 0 || currentReceived >= outstandingBalance) {
        setAmountReceived(Math.round(outstandingBalance / 2));
      }
    }
  };

  const handleAmountReceivedChange = (val: number) => {
    setAmountReceived(val);
    if (val >= outstandingBalance && outstandingBalance > 0) {
      setPaymentStatus("Paid");
    } else if (val > 0 && val < outstandingBalance) {
      setPaymentStatus("Partially Paid");
    } else if (val <= 0) {
      setPaymentStatus("Pending");
    }
  };

  // Update item totals on row change
  const handleUpdateItem = (
    id: string,
    field: keyof BillingLineItem,
    val: string | number,
  ) => {
    dispatch({ type: "UPDATE_LINE_ITEM", payload: { id, field, val } });
  };

  const handleAddLineItem = () => {
    const defaultService = SERVICE_CATALOG[0];
    const newItem: BillingLineItem = {
      id: `ITEM-${Date.now()}`,
      serviceName: defaultService.serviceName,
      category: defaultService.category,
      quantity: 1,
      unitPrice: defaultService.unitPrice,
      discount: 0,
      tax: 0,
      total: defaultService.unitPrice,
    };
    dispatch({ type: "ADD_LINE_ITEM", payload: newItem });
  };

  const handleDuplicateRow = (item: BillingLineItem) => {
    dispatch({ type: "DUPLICATE_LINE_ITEM", payload: item });
  };

  const handleRemoveRow = (id: string) => {
    if (lineItems.length <= 1) return;
    dispatch({ type: "REMOVE_LINE_ITEM", payload: id });
  };

  const handleGenerateInvoice = useCallback(
    async (isCollectPayment = false) => {
      if (!selectedPatient || !resolvedPatientMrn) return;
      if (isAlreadyPaidOrFinalized) {
        return;
      }
      if (
        !resolvedPatientId ||
        !resolvedAppointmentId ||
        !resolvedEncounterId
      ) {
        setValidationError(
          "This billable visit is missing a patient ID, appointment ID, or encounter ID. Select the patient from the completed-consultation results.",
        );
        return;
      }

      const numReceived = Math.max(0, Number(amountReceived) || 0);

      // Validation for payment collection
      if (isCollectPayment) {
        if (numReceived <= 0) {
          setValidationError(
            "Please enter an amount received to collect payment.",
          );
          return;
        }
        if (numReceived > outstandingBalance) {
          setValidationError(
            `Received amount (₹${numReceived.toLocaleString()}) cannot exceed the outstanding balance (₹${outstandingBalance.toLocaleString()}).`,
          );
          return;
        }
        if (Number(amountReceived) < 0) {
          setValidationError("Received amount cannot be negative.");
          return;
        }
      }

      setValidationError(null);
      setIsSubmitting(true);
      try {
        let billId = Number(urlBillId);

        if (!billId) {
          // Create the bill with real values from the clinical context
          const result = await createBill({
            appointmentId: Number(resolvedAppointmentId),
            encounterId: Number(resolvedEncounterId),
            patientMrn: resolvedPatientMrn || selectedPatient.mrn,
            doctorId: Number(resolvedDoctorId),
            patientId: Number(resolvedPatientId),
          });
          billId = result.billId;

          // Add line items
          await Promise.all(
            lineItems.map((item) =>
              addBillItem({
                billId,
                payload: {
                  serviceCode:
                    item.serviceName === "OPD Consultation Fee"
                      ? "SERV_CONSULT_GEN"
                      : "SERV_" +
                      item.serviceName
                        .toUpperCase()
                        .replace(/[^A-Z0-9]/g, "_"),
                  itemName: item.serviceName,
                  description: `${item.category} service: ${item.serviceName}`,
                  quantity: item.quantity,
                  unitPrice: item.unitPrice,
                  taxRate: item.tax || 18.0,
                },
              }),
            ),
          );
        } else {
          // Sync items for existing bill only if it is in DRAFT status
          const isDraft = billWorkspace?.bill?.status === "DRAFT";
          if (isDraft) {
            const existingItems = billWorkspace?.items || [];
            const lineItemServiceNameSet = new Set(
              lineItems.map((item) => item.serviceName),
            );
            const existingItemsMap = new Map(
              existingItems.map((ext) => [ext.serviceName || "", ext]),
            );

            // 1. Delete items that are no longer in lineItems
            const toDelete = existingItems.filter(
              (extItem) =>
                !lineItemServiceNameSet.has(extItem.serviceName || ""),
            );
            await Promise.all(
              toDelete.map((extItem) =>
                deleteBillItem({ billId, itemId: extItem.id }),
              ),
            );

            // 2. Add or update items
            await Promise.all(
              lineItems.map(async (item) => {
                const extItem = existingItemsMap.get(item.serviceName);
                if (extItem) {
                  if (extItem.quantity !== item.quantity) {
                    await updateBillItem({
                      billId,
                      itemId: extItem.id,
                      payload: {
                        serviceCode:
                          item.serviceName === "OPD Consultation Fee"
                            ? "SERV_CONSULT_GEN"
                            : "SERV_" +
                            item.serviceName
                              .toUpperCase()
                              .replace(/[^A-Z0-9]/g, "_"),
                        itemName: item.serviceName,
                        description: `${item.category} service: ${item.serviceName} (Updated)`,
                        quantity: item.quantity,
                        unitPrice: item.unitPrice,
                        taxRate: item.tax || 18.0,
                      },
                    });
                  }
                } else {
                  await addBillItem({
                    billId,
                    payload: {
                      serviceCode:
                        item.serviceName === "OPD Consultation Fee"
                          ? "SERV_CONSULT_GEN"
                          : "SERV_" +
                          item.serviceName
                            .toUpperCase()
                            .replace(/[^A-Z0-9]/g, "_"),
                      itemName: item.serviceName,
                      description: `${item.category} service: ${item.serviceName}`,
                      quantity: item.quantity,
                      unitPrice: item.unitPrice,
                      taxRate: item.tax || 18.0,
                    },
                  });
                }
              }),
            );
          }
        }

        // Apply discount
        if (discountValue > 0) {
          await applyDiscount({
            billId,
            discountType:
              discountType === "Percentage" ? "PERCENTAGE" : "FIXED",
            value: discountValue,
            reason: billingRemarks || "Invoice discount",
          });
        }

        // Only finalize when collecting payment or finalizing non-draft bill; keep DRAFT for "Save as Draft"
        const isDraftSave = !isCollectPayment && numReceived <= 0;
        if (!isDraftSave) {
          try {
            await finalizeBill(billId);
          } catch (finErr) {
            console.warn("Unconditional finalization warning:", finErr);
          }
        }

        // Receive payment if isCollectPayment is true and numReceived > 0 (Must be done AFTER finalizing)
        if (isCollectPayment && numReceived > 0) {
          let payAmount = numReceived;

          // Fetch latest bill balance to ensure we don't exceed backend balance
          try {
            const currentBill = await billingService.getBill(billId);
            const billObj = currentBill as unknown as Record<string, unknown>;
            const summaryObj = billObj?.summary as
              | Record<string, unknown>
              | undefined;
            const rawBalance =
              summaryObj?.balanceAmount ??
              billObj?.balanceAmount ??
              billObj?.balance ??
              billObj?.netAmount;

            if (typeof rawBalance === "number" && rawBalance > 0) {
              payAmount = Math.min(numReceived, rawBalance);
            }
          } catch (fetchErr) {
            console.warn(
              "Could not fetch bill balance before payment:",
              fetchErr,
            );
          }

          let payRes: { paymentStatus?: string } | null = null;
          try {
            payRes = await receivePayment({
              billId,
              payments: [
                {
                  method: paymentMode,
                  amount: payAmount,
                  referenceNumber: referenceNo || undefined,
                },
              ],
              remarks: txnNotes || undefined,
            });
          } catch (payErr) {
            const errObj = payErr as
              | { message?: string; data?: { message?: string } }
              | null
              | undefined;
            const errMsg = String(
              errObj?.message || errObj?.data?.message || payErr || "",
            );
            if (errMsg.toLowerCase().includes("overpayment")) {
              // Retry with exact backend balance if overpayment detected
              try {
                const refreshed = await billingService.getBill(billId);
                const refreshedObj = refreshed as unknown as Record<
                  string,
                  unknown
                >;
                const refreshedSummary = refreshedObj?.summary as
                  | Record<string, unknown>
                  | undefined;
                const exactBalance =
                  refreshedSummary?.balanceAmount ??
                  refreshedObj?.balanceAmount ??
                  refreshedObj?.balance ??
                  refreshedObj?.netAmount;

                if (typeof exactBalance === "number" && exactBalance > 0) {
                  payRes = await receivePayment({
                    billId,
                    payments: [
                      {
                        method: paymentMode,
                        amount: exactBalance,
                        referenceNumber: referenceNo || undefined,
                      },
                    ],
                    remarks: txnNotes || undefined,
                  });
                }
              } catch (retryErr) {
                console.error("Retry payment failed:", retryErr);
                throw payErr;
              }
            } else {
              throw payErr;
            }
          }

          // Map API response status to frontend titlecase status
          if (payRes && payRes.paymentStatus) {
            const apiStatus = payRes.paymentStatus.toUpperCase();
            if (apiStatus === "PAID") setPaymentStatus("Paid");
            else if (
              apiStatus === "PARTIALLY_PAID" ||
              apiStatus === "PARTIAL_PAID"
            )
              setPaymentStatus("Partially Paid");
            else if (apiStatus === "CANCELLED" || apiStatus === "VOIDED")
              setPaymentStatus("Cancelled");
            else if (apiStatus === "REFUNDED") setPaymentStatus("Refunded");
            else setPaymentStatus("Pending");
          } else {
            const totalPaidSoFar = previouslyPaid + payAmount;
            setPaymentStatus(
              totalPaidSoFar >= grandTotal ? "Paid" : "Partially Paid",
            );
          }
        } else if (isDraftSave) {
          setPaymentStatus("Pending");
        } else {
          setPaymentStatus("Pending");
        }

        // Refresh billing queries
        queryClient.invalidateQueries({ queryKey: billingKeys.all });

        setCreatedBillId(String(billId));
        setShowSuccessModal(true);
      } catch (err) {
        console.error("Failed to create/finalize invoice:", err);
      } finally {
        setIsSubmitting(false);
      }
    },
    [
      selectedPatient,
      lineItems,
      discountType,
      discountValue,
      billingRemarks,
      createBill,
      addBillItem,
      updateBillItem,
      deleteBillItem,
      applyDiscount,
      finalizeBill,
      receivePayment,
      resolvedAppointmentId,
      resolvedEncounterId,
      resolvedDoctorId,
      resolvedPatientMrn,
      resolvedPatientId,
      urlBillId,
      billWorkspace,
      amountReceived,
      paymentMode,
      referenceNo,
      txnNotes,
      grandTotal,
      previouslyPaid,
      outstandingBalance,
      isAlreadyPaidOrFinalized,
      queryClient,
    ],
  );

  return (
    <div className="w-full bg-[#F1F5F9] min-h-screen p-4 md:p-6 pb-28 space-y-6">
      {/* 1. PAGE HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
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
            className="text-xl font-bold text-[#111827]"
            style={{ fontFamily: PP }}
          >
            Create Invoice Workspace
          </h1>
          <p
            className="text-xs text-[#64748B] mt-0.5"
            style={{ fontFamily: RB }}
          >
            Generate an invoice for completed consultation services, calculate
            charges, collect payment information and prepare the final bill.
          </p>
        </div>
        <div className="flex items-center gap-2.5 shrink-0">
          <button
            onClick={() => navigate("/billing")}
            className="px-4 py-2.5 rounded-xl bg-white border border-[#E5E7EB] text-slate-700 text-xs font-semibold hover:bg-slate-50 transition-colors shadow-sm cursor-pointer"
            style={{ fontFamily: RB }}
          >
            Cancel
          </button>
        </div>
      </div>

      {/* Validation Error Banner */}
      {validationError && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-4 flex items-start gap-3">
          <AlertCircle size={18} className="text-red-500 shrink-0 mt-0.5" />
          <div className="flex-1">
            <p
              className="text-xs font-semibold text-red-700"
              style={{ fontFamily: PP }}
            >
              {validationError}
            </p>
            <p
              className="text-[11px] text-red-600 mt-1"
              style={{ fontFamily: RB }}
            >
              Go back to the consultation and click{" "}
              <strong>"Generate Invoice"</strong> to pass the required context.
            </p>
          </div>
          <button
            aria-label="Close"
            onClick={() => setValidationError(null)}
            className="text-red-400 hover:text-red-600"
          >
            <X size={14} />
          </button>
        </div>
      )}

      {/* 2. TWO-COLUMN LAYOUT */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* LEFT COLUMN */}
        <div className="xl:col-span-2 space-y-6">
          {/* SECTION 01: PATIENT INFORMATION */}
          <div className="bg-white rounded-2xl border border-[#E5E7EB] p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-blue-50 text-[#0D47A1] flex items-center justify-center font-bold">
                  <User size={16} />
                </div>
                <div>
                  <h2
                    className="text-sm font-bold text-[#111827]"
                    style={{ fontFamily: PP }}
                  >
                    SECTION 01: PATIENT INFORMATION
                  </h2>
                  <p
                    className="text-xs text-[#64748B]"
                    style={{ fontFamily: RB }}
                  >
                    Search and select patient to auto-fill OPD visit records
                  </p>
                </div>
              </div>
              {selectedPatient && (
                <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-teal-50 text-[#009688]">
                  OPD Consult Completed
                </span>
              )}
            </div>

            <div className="relative">
              <span
                className="block text-xs font-semibold text-slate-700 mb-1"
                style={{ fontFamily: RB }}
              >
                Patient Search (MRN, Name, or Mobile) *
              </span>
              <div className="relative">
                <Search
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                  size={15}
                />
                <input
                  aria-label="Input field"
                  type="text"
                  value={patientSearch}
                  onFocus={() =>
                    dispatch({
                      type: "SET_SHOW_SEARCH_DROPDOWN",
                      payload: true,
                    })
                  }
                  onChange={(e) => {
                    dispatch({
                      type: "SET_PATIENT_SEARCH",
                      payload: e.target.value,
                    });
                    dispatch({
                      type: "SET_SHOW_SEARCH_DROPDOWN",
                      payload: true,
                    });
                  }}
                  placeholder="Search patient by MRN, name, or mobile..."
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[#E5E7EB] bg-slate-50 text-xs text-[#111827] focus:bg-white focus:border-[#0D47A1] focus:outline-none"
                  style={{ fontFamily: RB }}
                />
              </div>
              {showSearchDropdown && filteredBills.length > 0 && (
                <div className="mt-4 bg-white rounded-2xl border border-[#E5E7EB] shadow-sm overflow-hidden divide-y divide-slate-100">
                  <div className="p-1 space-y-1">
                    {filteredBills.map((bill: BillListItem) => {
                      const b = bill as BillListItem & {
                        patientPhone?: string;
                        phone?: string;
                        mobile?: string;
                      };
                      const patientPhone =
                        b.patientPhone || b.phone || b.mobile || "";
                      return (
                        <div
                          key={`${bill.billId ?? bill.id ?? bill.billNumber}-${bill.appointmentId}`}
                          className="flex flex-col md:flex-row md:items-center justify-between p-4 hover:bg-slate-50 rounded-xl transition-colors gap-4"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#0D47A1] flex items-center justify-center font-bold shrink-0">
                              <User size={18} />
                            </div>
                            <div>
                              <div
                                className="text-sm font-bold text-[#111827]"
                                style={{ fontFamily: PP }}
                              >
                                {bill.patientName}
                              </div>
                              <div className="text-xs text-slate-500 font-mono mt-0.5">
                                {bill.patientMrn}{" "}
                                <span className="text-slate-300 mx-1.5">·</span>{" "}
                                {patientPhone}
                              </div>
                            </div>
                          </div>

                          <div className="text-xs">
                            <div className="font-semibold text-slate-700">
                              Dr. {bill.doctorName || "N/A"}
                            </div>
                            <div className="text-[11px] text-slate-400 mt-0.5">
                              {bill.billType || ""}{" "}
                              {bill.billType && (
                                <span className="text-slate-300 mx-1">·</span>
                              )}
                              OPD
                            </div>
                          </div>

                          <div className="text-xs text-slate-600 space-y-0.5">
                            <div>
                              <span className="text-slate-400">Appt ID:</span>{" "}
                              {bill.appointmentId || "—"}
                            </div>
                            <div>
                              <span className="text-slate-400">
                                Encounter ID:
                              </span>{" "}
                              {bill.encounterId || "—"}
                            </div>
                          </div>

                          <div className="flex flex-wrap items-center gap-1.5">
                            {bill.status === "READY_FOR_BILLING" ? (
                              <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-100">
                                Ready for Billing
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-semibold bg-blue-50 text-[#0D47A1] border border-blue-100">
                                {String(bill.status).replace(/_/g, " ")}
                              </span>
                            )}
                            <span
                              className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-semibold border ${String(bill.paymentStatus).toUpperCase() ===
                                "PAID"
                                ? "bg-emerald-50 text-emerald-700 border-emerald-100"
                                : String(bill.paymentStatus).toUpperCase() ===
                                  "PARTIALLY_PAID" ||
                                  String(
                                    bill.paymentStatus,
                                  ).toUpperCase() === "PARTIAL_PAID"
                                  ? "bg-blue-50 text-blue-700 border-blue-100"
                                  : "bg-amber-50 text-amber-700 border-amber-100"
                                }`}
                            >
                              {String(bill.paymentStatus || "Unpaid").replace(
                                /_/g,
                                " ",
                              )}
                            </span>
                          </div>

                          <button
                            type="button"
                            onClick={() => {
                              dispatch({
                                type: "SELECT_BILLING_RECORD",
                                payload: bill,
                              });
                              dispatch({
                                type: "SELECT_PATIENT",
                                payload: {
                                  patient: null,
                                  search: bill.patientName || "",
                                },
                              });
                              setAutoLoaded(false);
                            }}
                            className="px-4 py-1.5 rounded-xl border border-blue-200 text-[#0D47A1] text-xs font-semibold hover:bg-blue-50 transition-colors shadow-xs shrink-0 self-start md:self-auto"
                            style={{ fontFamily: PP }}
                          >
                            Select
                          </button>
                        </div>
                      );
                    })}
                  </div>
                  <div className="bg-slate-50 px-4 py-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                    <span>
                      Showing {filteredBills.length} of{" "}
                      {billingSearchData?.totalElements ?? filteredBills.length}{" "}
                      results
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        dispatch({
                          type: "SET_SHOW_SEARCH_DROPDOWN",
                          payload: false,
                        })
                      }
                      className="font-semibold text-[#0D47A1] hover:underline"
                    >
                      View all results
                    </button>
                  </div>
                </div>
              )}
            </div>

            {selectedPatient && (
              <div
                className="p-4 rounded-2xl bg-slate-50/80 border border-slate-200/80 grid grid-cols-2 md:grid-cols-4 gap-4 text-xs"
                style={{ fontFamily: RB }}
              >
                <div>
                  <span className="text-slate-400 block text-[11px]">
                    Patient Name
                  </span>
                  <span
                    className="font-bold text-[#111827] text-sm"
                    style={{ fontFamily: PP }}
                  >
                    {selectedPatient.fullName || selectedPatient.name || "N/A"}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">MRN</span>
                  <span className="font-mono font-bold text-[#0D47A1]">
                    {selectedPatient.mrn}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">
                    Age & Gender
                  </span>
                  <span className="font-medium text-[#111827]">
                    {selectedPatient.age || "N/A"} Yrs /{" "}
                    {selectedPatient.gender || "N/A"}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">
                    Mobile Number
                  </span>
                  <span className="font-medium text-[#111827]">
                    {selectedPatient.phone ||
                      selectedPatient.mobileNumber ||
                      "N/A"}
                  </span>
                </div>
                <div className="col-span-2 md:col-span-4 pt-2 border-t border-slate-200 flex items-center justify-between">
                  <span className="text-slate-600 font-semibold">
                    Patient Category:
                  </span>
                  <div className="flex items-center gap-2">
                    {(
                      ["General", "Insurance", "Corporate", "VIP"] as const
                    ).map((cat) => (
                      <button
                        key={cat}
                        type="button"
                        onClick={() =>
                          dispatch({
                            type: "SET_PATIENT_CATEGORY",
                            payload: cat,
                          })
                        }
                        className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors ${patientCategory === cat ? "bg-[#0D47A1] text-white shadow-xs" : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-100"}`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Clinical Context (from billing record or URL params) */}
          {(selectedBillingRecord || resolvedAppointmentId) && (
            <div className="bg-white rounded-2xl border border-[#E5E7EB] p-5 shadow-sm space-y-4">
              <div className="flex items-center gap-2 border-b border-gray-100 pb-3">
                <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
                  <FileText size={16} />
                </div>
                <h2
                  className="text-sm font-bold text-[#111827]"
                  style={{ fontFamily: PP }}
                >
                  SECTION 01B: CLINICAL CONTEXT
                </h2>
              </div>
              <div
                className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs"
                style={{ fontFamily: RB }}
              >
                <div>
                  <span className="text-slate-400 block text-[11px]">
                    Attending Doctor
                  </span>
                  <span className="font-medium text-[#111827]">
                    {selectedBillingRecord?.doctorName ||
                      appointment?.doctorName ||
                      "N/A"}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">
                    Department
                  </span>
                  <span className="font-medium text-[#111827]">
                    {appointment?.departmentName || ""}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">
                    Appointment ID
                  </span>
                  <span className="font-mono font-bold text-[#0D47A1]">
                    {resolvedAppointmentId
                      ? `#${resolvedAppointmentId}`
                      : "N/A"}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">
                    Consultation ID
                  </span>
                  <span className="font-mono font-bold text-[#0D47A1]">
                    {selectedBillingRecord?.consultationId || "—"}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">
                    Encounter ID
                  </span>
                  <span className="font-mono font-bold text-[#0D47A1]">
                    {resolvedEncounterId ? `ENC-${resolvedEncounterId}` : "N/A"}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">
                    Consultation Date
                  </span>
                  <span className="font-medium text-[#111827]">
                    {appointment?.appointmentDate ||
                      selectedBillingRecord?.createdAt ||
                      "N/A"}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">
                    Invoice No.
                  </span>
                  <span className="font-medium text-slate-500">
                    Assigned by the billing service when generated
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* SECTION 02: BILLING ITEMS */}
          <div className="bg-white rounded-2xl border border-[#E5E7EB] p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-teal-50 text-[#009688] flex items-center justify-center font-bold">
                  <CreditCard size={16} />
                </div>
                <div>
                  <h2
                    className="text-sm font-bold text-[#111827]"
                    style={{ fontFamily: PP }}
                  >
                    SECTION 02: BILLING ITEMS
                  </h2>
                  <p
                    className="text-xs text-[#64748B]"
                    style={{ fontFamily: RB }}
                  >
                    Add charges, procedures, diagnostics, or consultation fees
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleAddLineItem}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#009688] text-white text-xs font-semibold hover:bg-teal-700 transition-colors shadow-xs"
                style={{ fontFamily: PP }}
              >
                <Plus size={14} /> Add Charge
              </button>
            </div>

            <div className="overflow-x-auto border border-slate-200 rounded-xl">
              <table
                className="w-full text-left border-collapse text-xs"
                style={{ fontFamily: RB }}
              >
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-[#64748B] font-semibold text-[11px] uppercase tracking-wider">
                    <th className="py-2.5 px-3">Service Name</th>
                    <th className="py-2.5 px-3">Category</th>
                    <th className="py-2.5 px-3 text-center">Qty</th>
                    <th className="py-2.5 px-3 text-right">Unit Price</th>
                    <th className="py-2.5 px-3 text-right">Discount</th>
                    <th className="py-2.5 px-3 text-right">Tax %</th>
                    <th className="py-2.5 px-3 text-right">Total</th>
                    <th className="py-2.5 px-3 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {lineItems.map((item) => (
                    <tr
                      key={item.id}
                      className="hover:bg-slate-50/70 transition-colors"
                    >
                      <td className="py-2 px-3">
                        <select
                          aria-label="Select option"
                          value={item.serviceName}
                          onChange={(e) => {
                            const found = SERVICE_CATALOG.find(
                              (s) => s.serviceName === e.target.value,
                            );
                            if (found) {
                              handleUpdateItem(
                                item.id,
                                "serviceName",
                                found.serviceName,
                              );
                              handleUpdateItem(
                                item.id,
                                "category",
                                found.category,
                              );
                              handleUpdateItem(
                                item.id,
                                "unitPrice",
                                found.unitPrice,
                              );
                            }
                          }}
                          className="w-full px-2 py-1.5 rounded-lg border border-slate-200 bg-white font-medium text-[#111827] focus:border-[#0D47A1] focus:outline-none"
                        >
                          {SERVICE_CATALOG.map((s) => (
                            <option key={s.serviceName} value={s.serviceName}>
                              {s.serviceName}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="py-2 px-3">
                        <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 text-[11px] font-medium">
                          {item.category}
                        </span>
                      </td>
                      <td className="py-2 px-3 text-center">
                        <div className="inline-flex items-center border border-slate-200 rounded-lg overflow-hidden bg-white">
                          <button
                            aria-label="Action"
                            type="button"
                            onClick={() =>
                              handleUpdateItem(
                                item.id,
                                "quantity",
                                Math.max(1, item.quantity - 1),
                              )
                            }
                            className="px-2 py-1 text-slate-600 hover:bg-slate-100"
                          >
                            -
                          </button>
                          <span className="px-2 py-1 font-bold text-[#111827]">
                            {item.quantity}
                          </span>
                          <button
                            aria-label="Action"
                            type="button"
                            onClick={() =>
                              handleUpdateItem(
                                item.id,
                                "quantity",
                                item.quantity + 1,
                              )
                            }
                            className="px-2 py-1 text-slate-600 hover:bg-slate-100"
                          >
                            +
                          </button>
                        </div>
                      </td>
                      <td className="py-2 px-3 text-right">
                        <input
                          aria-label="Input field"
                          type="number"
                          value={item.unitPrice}
                          onChange={(e) =>
                            handleUpdateItem(
                              item.id,
                              "unitPrice",
                              Number.isFinite(e.currentTarget.valueAsNumber)
                                ? e.currentTarget.valueAsNumber
                                : 0,
                            )
                          }
                          className="w-20 px-2 py-1 text-right rounded-lg border border-slate-200 bg-white focus:border-[#0D47A1] focus:outline-none font-bold text-[#111827]"
                        />
                      </td>
                      <td className="py-2 px-3 text-right">
                        <input
                          aria-label="Input field"
                          type="number"
                          value={item.discount}
                          onChange={(e) =>
                            handleUpdateItem(
                              item.id,
                              "discount",
                              e.currentTarget.valueAsNumber,
                            )
                          }
                          className="w-16 px-2 py-1 text-right rounded-lg border border-slate-200 bg-white focus:border-[#0D47A1] focus:outline-none font-medium"
                        />
                      </td>
                      <td className="py-2 px-3 text-right">
                        <input
                          aria-label="Input field"
                          type="number"
                          value={item.tax}
                          onChange={(e) =>
                            handleUpdateItem(
                              item.id,
                              "tax",
                              e.currentTarget.valueAsNumber,
                            )
                          }
                          className="w-14 px-2 py-1 text-right rounded-lg border border-slate-200 bg-white focus:border-[#0D47A1] focus:outline-none font-medium"
                        />
                      </td>
                      <td className="py-2 px-3 text-right font-bold text-[#0D47A1]">
                        ₹{item.total.toLocaleString()}
                      </td>
                      <td className="py-2 px-3 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            type="button"
                            onClick={() => handleDuplicateRow(item)}
                            className="p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100"
                            title="Duplicate"
                          >
                            <Copy size={13} />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleRemoveRow(item.id)}
                            className="p-1 rounded-md text-slate-400 hover:text-[#EF4444] hover:bg-red-50"
                            title="Delete"
                          >
                            <X size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div
              className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex justify-between items-center text-xs font-bold"
              style={{ fontFamily: PP }}
            >
              <span className="text-slate-600">Line Items Subtotal:</span>
              <span className="text-base text-[#0D47A1]">
                ₹{rawSubtotal.toLocaleString()}
              </span>
            </div>
          </div>

          {/* SECTION 03: DISCOUNTS & TAXES */}
          <div className="bg-white rounded-2xl border border-[#E5E7EB] p-5 shadow-sm space-y-4">
            <div className="flex items-center gap-2 border-b border-gray-100 pb-3">
              <div className="w-8 h-8 rounded-xl bg-amber-50 text-[#F59E0B] flex items-center justify-center font-bold">
                <DollarSign size={16} />
              </div>
              <div>
                <h2
                  className="text-sm font-bold text-[#111827]"
                  style={{ fontFamily: PP }}
                >
                  SECTION 03: DISCOUNTS & TAXES
                </h2>
                <p
                  className="text-xs text-[#64748B]"
                  style={{ fontFamily: RB }}
                >
                  Configure invoice-level discounts, GST/VAT rates, and billing
                  remarks
                </p>
              </div>
            </div>
            <div
              className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs"
              style={{ fontFamily: RB }}
            >
              <div>
                <span className="block text-slate-700 font-semibold mb-1">
                  Discount Type
                </span>
                <div className="flex items-center gap-4 mb-2">
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="radio"
                      name="discType"
                      checked={discountType === "Fixed"}
                      onChange={() =>
                        dispatch({
                          type: "SET_DISCOUNT_TYPE",
                          payload: "Fixed",
                        })
                      }
                      className="text-[#0D47A1]"
                    />
                    <span>Fixed (₹)</span>
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="radio"
                      name="discType"
                      checked={discountType === "Percentage"}
                      onChange={() =>
                        dispatch({
                          type: "SET_DISCOUNT_TYPE",
                          payload: "Percentage",
                        })
                      }
                      className="text-[#0D47A1]"
                    />
                    <span>Percentage (%)</span>
                  </label>
                </div>
                <input
                  aria-label="Input field"
                  type="number"
                  value={discountValue}
                  onChange={(e) => {
                    const v = e.currentTarget.valueAsNumber;
                    dispatch({
                      type: "SET_DISCOUNT_VALUE",
                      payload: Number.isFinite(v) ? v : 0,
                    });
                  }}
                  className="w-full px-3 py-2 rounded-xl border border-[#E5E7EB] bg-slate-50 focus:bg-white focus:border-[#0D47A1] focus:outline-none"
                />
              </div>
              <div>
                <span className="block text-slate-700 font-semibold mb-1">
                  Tax Percentage (%)
                  <input
                    aria-label="Input field"
                    type="number"
                    value={taxPercentage}
                    onChange={(e) => {
                      const v = e.currentTarget.valueAsNumber;
                      dispatch({
                        type: "SET_TAX_PERCENTAGE",
                        payload: Number.isFinite(v) ? v : 0,
                      });
                    }}
                    className="w-full px-3 py-2 rounded-xl border border-[#E5E7EB] bg-slate-50 focus:bg-white focus:border-[#0D47A1] focus:outline-none"
                  />
                </span>
              </div>
              <div>
                <span className="block text-slate-700 font-semibold mb-1">
                  Additional Charges (₹)
                  <input
                    aria-label="Input field"
                    type="number"
                    value={additionalCharges}
                    onChange={(e) => {
                      const v = e.currentTarget.valueAsNumber;
                      dispatch({
                        type: "SET_ADDITIONAL_CHARGES",
                        payload: Number.isFinite(v) ? v : 0,
                      });
                    }}
                    placeholder="e.g. PPE / Admin Fee"
                    className="w-full px-3 py-2 rounded-xl border border-[#E5E7EB] bg-slate-50 focus:bg-white focus:border-[#0D47A1] focus:outline-none"
                  />
                </span>
              </div>
            </div>
            <div
              className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs"
              style={{ fontFamily: RB }}
            >
              <div>
                <span className="block text-slate-700 font-semibold mb-1">
                  Billing Remarks & Internal Notes
                </span>
                <textarea
                  aria-label="Text area"
                  rows={2}
                  value={billingRemarks}
                  onChange={(e) =>
                    dispatch({
                      type: "SET_BILLING_REMARKS",
                      payload: e.target.value,
                    })
                  }
                  placeholder="Notes for accountant or insurance verification..."
                  className="w-full px-3 py-2 rounded-xl border border-[#E5E7EB] bg-slate-50 focus:bg-white focus:border-[#0D47A1] focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* SECTION 04: PAYMENT INFORMATION */}
          <div className="bg-white rounded-2xl border border-[#E5E7EB] p-5 shadow-sm space-y-4">
            <div className="flex items-center gap-2 border-b border-gray-100 pb-3">
              <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
                <FileText size={16} />
              </div>
              <div>
                <h2
                  className="text-sm font-bold text-[#111827]"
                  style={{ fontFamily: PP }}
                >
                  SECTION 04: PAYMENT INFORMATION
                </h2>
                <p
                  className="text-xs text-[#64748B]"
                  style={{ fontFamily: RB }}
                >
                  Record initial payment status, mode, and transaction
                  references
                </p>
              </div>
            </div>
            <div
              className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs"
              style={{ fontFamily: RB }}
            >
              <div>
                <span className="block text-slate-700 font-semibold mb-1">
                  Payment Status *
                  <select
                    aria-label="Select option"
                    value={paymentStatus}
                    onChange={(e) =>
                      handlePaymentStatusChange(e.target.value as PaymentStatus)
                    }
                    className="w-full px-3 py-2 rounded-xl border border-[#E5E7EB] bg-slate-50 font-bold focus:bg-white focus:border-[#0D47A1] focus:outline-none"
                  >
                    <option value="Paid">Paid</option>
                    <option value="Partially Paid">Partially Paid</option>
                    <option value="Pending">Pending</option>
                  </select>
                </span>
              </div>
              <div>
                <span className="block text-slate-700 font-semibold mb-1">
                  Payment Mode *
                  <select
                    aria-label="Select option"
                    value={paymentMode}
                    onChange={(e) =>
                      setPaymentMode(e.target.value as PaymentMethod)
                    }
                    className="w-full px-3 py-2 rounded-xl border border-[#E5E7EB] bg-slate-50 font-semibold focus:bg-white focus:border-[#0D47A1] focus:outline-none"
                  >
                    <option value="UPI">UPI / GPay / PhonePe</option>
                    <option value="Cash">Cash / Hand Cash</option>
                    <option value="Card">Credit / Debit Card</option>
                    <option value="Bank Transfer">
                      Bank Transfer (NEFT/IMPS)
                    </option>
                  </select>
                </span>
              </div>
              <div>
                <span className="block text-slate-700 font-semibold mb-1">
                  Amount Received (₹) *
                  <input
                    aria-label="Input field"
                    type="number"
                    min="0"
                    max={outstandingBalance}
                    value={amountReceived}
                    onChange={(e) => {
                      const v = e.currentTarget.valueAsNumber;
                      handleAmountReceivedChange(Number.isFinite(v) ? v : 0);
                    }}
                    className={`w-full px-3 py-2 rounded-xl border ${isOverpayment || isNegativePayment
                      ? "border-red-400 bg-red-50/50"
                      : "border-[#E5E7EB] bg-slate-50"
                      } font-bold text-[#111827] focus:bg-white focus:border-[#0D47A1] focus:outline-none`}
                  />
                </span>
                {isOverpayment && (
                  <p className="text-[11px] text-red-600 mt-1">
                    Cannot exceed outstanding balance of ₹
                    {outstandingBalance.toLocaleString()}
                  </p>
                )}
                {isNegativePayment && (
                  <p className="text-[11px] text-red-600 mt-1">
                    Amount cannot be negative
                  </p>
                )}
              </div>
              {paymentMode !== "Cash" && (
                <div>
                  <span className="block text-slate-700 font-semibold mb-1">
                    Txn / Reference Number
                    <input
                      aria-label="Input field"
                      type="text"
                      value={referenceNo}
                      onChange={(e) => setReferenceNo(e.target.value)}
                      placeholder="e.g. UPI/890123/OKAX"
                      className="w-full px-3 py-2 rounded-xl border border-[#E5E7EB] bg-slate-50 focus:bg-white focus:border-[#0D47A1] focus:outline-none font-mono"
                    />
                  </span>
                </div>
              )}
              <div>
                <span className="block text-slate-700 font-semibold mb-1">
                  Transaction Notes
                  <input
                    aria-label="Input field"
                    type="text"
                    value={txnNotes}
                    onChange={(e) => setTxnNotes(e.target.value)}
                    placeholder="Optional cashier note..."
                    className="w-full px-3 py-2 rounded-xl border border-[#E5E7EB] bg-slate-50 focus:bg-white focus:border-[#0D47A1] focus:outline-none"
                  />
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN - INVOICE SUMMARY */}
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-[#E5E7EB] p-5 shadow-sm space-y-4 sticky top-6">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div>
                <span className="text-[10px] text-[#0D47A1] font-bold tracking-widest uppercase">
                  Summary
                </span>
                <h3
                  className="text-sm font-bold text-[#111827]"
                  style={{ fontFamily: PP }}
                >
                  Invoice Summary
                </h3>
              </div>
              <BillingStatusBadge status={paymentStatus} />
            </div>
            <div
              className="p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs space-y-1"
              style={{ fontFamily: RB }}
            >
              <div className="flex justify-between">
                <span className="text-slate-500">Invoice No:</span>
                <span className="font-bold text-[#0D47A1]">
                  Assigned on generation
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Patient:</span>
                <span className="font-semibold text-[#111827]">
                  {selectedPatient?.fullName || selectedPatient?.name || "N/A"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Total Services:</span>
                <span className="font-bold text-[#111827]">
                  {lineItems.length} items
                </span>
              </div>
            </div>
            <div
              className="space-y-2 text-xs border-t border-b border-gray-100 py-3"
              style={{ fontFamily: RB }}
            >
              <div className="flex justify-between text-slate-600">
                <span>Subtotal:</span>
                <span className="font-semibold text-[#111827]">
                  ₹{rawSubtotal.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between text-[#66BB6A]">
                <span>Discount ({discountType}):</span>
                <span className="font-semibold">
                  - ₹{calculatedDiscount.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Tax GST ({taxPercentage}%):</span>
                <span className="font-semibold">
                  + ₹{Math.round(calculatedTax).toLocaleString()}
                </span>
              </div>
              {additionalCharges > 0 && (
                <div className="flex justify-between text-slate-600">
                  <span>Additional Charges:</span>
                  <span className="font-semibold">
                    + ₹{additionalCharges.toLocaleString()}
                  </span>
                </div>
              )}
              <div
                className="flex justify-between text-base font-bold text-[#111827] pt-2 border-t border-slate-200"
                style={{ fontFamily: PP }}
              >
                <span>Grand Total:</span>
                <span className="text-[#0D47A1]">
                  ₹{grandTotal.toLocaleString()}
                </span>
              </div>
              {previouslyPaid > 0 && (
                <div className="flex justify-between text-xs font-semibold text-slate-500">
                  <span>Previously Paid:</span>
                  <span>₹{previouslyPaid.toLocaleString()}</span>
                </div>
              )}
              <div className="flex justify-between text-xs font-semibold text-[#66BB6A]">
                <span>Received Amount:</span>
                <span>₹{currentReceived.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-xs font-bold text-[#EF4444]">
                <span>Balance Due:</span>
                <span>₹{balanceDue.toLocaleString()}</span>
              </div>
            </div>
            <div className="space-y-2 pt-2">
              {isAlreadyPaidOrFinalized ? (
                <button
                  onClick={() => {
                    const targetId =
                      billWorkspace?.bill?.id ||
                      billWorkspace?.bill?.billId ||
                      urlBillId;
                    if (targetId) navigate(`/billing/invoice/${targetId}`);
                  }}
                  className="w-full py-3 rounded-xl bg-[#0D47A1] text-white text-xs font-bold hover:bg-blue-900 transition-colors shadow-sm flex items-center justify-center gap-2"
                  style={{ fontFamily: PP }}
                >
                  <FileText size={16} />
                  View Invoice
                </button>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={() => handleGenerateInvoice(true)}
                    disabled={!canCollect}
                    className="w-full py-3 rounded-xl bg-[#0D47A1] text-white text-xs font-bold hover:bg-blue-900 transition-colors shadow-sm disabled:opacity-50 flex items-center justify-center gap-2"
                    style={{ fontFamily: PP }}
                  >
                    <CheckCircle2 size={16} />
                    {isSubmitting
                      ? "Generating & Collecting..."
                      : isPaymentValid
                        ? `Generate & Collect (₹${currentReceived.toLocaleString()})`
                        : "Generate & Collect"}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleGenerateInvoice(false)}
                    disabled={isSubmitting || isBillLoading || !selectedPatient}
                    className="w-full py-2.5 rounded-xl border border-[#E5E7EB] text-slate-600 text-xs font-semibold hover:bg-slate-50 flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    <FileText size={15} className="text-slate-400" />
                    Save as Draft
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>


      {/* SUCCESS MODAL */}
      {showSuccessModal && (
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
                Invoice Created Successfully!
              </h3>
              <p
                className="text-xs text-[#64748B] mt-1"
                style={{ fontFamily: RB }}
              >
                Invoice{" "}
                <span className="font-bold text-[#0D47A1]">
                  {createdBillId || "the billing service"}
                </span>{" "}
                has been issued.
              </p>
            </div>
            <div
              className="p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs space-y-1 text-left"
              style={{ fontFamily: RB }}
            >
              <div className="flex justify-between">
                <span className="text-slate-500">Grand Total:</span>
                <span className="font-bold text-[#111827]">
                  ₹{grandTotal.toLocaleString()}
                </span>
              </div>
              {previouslyPaid > 0 && (
                <div className="flex justify-between">
                  <span className="text-slate-500">Previously Paid:</span>
                  <span className="font-medium text-slate-700">
                    ₹{previouslyPaid.toLocaleString()}
                  </span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-slate-500">Amount Paid:</span>
                <span className="font-bold text-[#66BB6A]">
                  ₹{currentReceived.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Balance Due:</span>
                <span className="font-bold text-[#EF4444]">
                  ₹{balanceDue.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Payment Status:</span>
                <BillingStatusBadge status={paymentStatus} />
              </div>
            </div>
            <div className="pt-2 space-y-2">
              <button
                onClick={() => {
                  setShowSuccessModal(false);
                  navigate(
                    createdBillId
                      ? `/billing/invoice/${createdBillId}`
                      : "/billing",
                  );
                }}
                className="w-full py-2.5 rounded-xl bg-[#0D47A1] text-white text-xs font-bold hover:bg-blue-900 transition-colors shadow-sm"
                style={{ fontFamily: PP }}
              >
                View Invoice Details
              </button>
              <button
                onClick={() => {
                  setShowSuccessModal(false);
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
