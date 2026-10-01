import type { BillingConfiguration } from "../types/billing.types";

export const PP = "'Poppins', system-ui, sans-serif";
export const RB = "'Roboto', system-ui, sans-serif";

export const DEFAULT_CONFIGURATION: BillingConfiguration = {
  invoice: {
    prefix: "INV-",
    startingNumber: 1001,
    autoGenerate: true,
    allowManual: false,
  },
  tax: {
    enableTax: true,
    defaultPercentage: 18,
    taxName: "GST (Goods & Services Tax)",
    applyTaxTo: "All Services",
    showBreakdown: true,
  },
  paymentMethods: [
    {
      id: "p1",
      name: "Cash",
      enabled: true,
      isDefault: true,
      reqRef: false,
      iconName: "DollarSign",
    },
    {
      id: "p2",
      name: "UPI / QR Code",
      enabled: true,
      isDefault: false,
      reqRef: true,
      iconName: "QrCode",
    },
    {
      id: "p3",
      name: "Credit Card",
      enabled: true,
      isDefault: false,
      reqRef: true,
      iconName: "CreditCard",
    },
    {
      id: "p4",
      name: "Debit Card",
      enabled: true,
      isDefault: false,
      reqRef: true,
      iconName: "CreditCard",
    },
    {
      id: "p5",
      name: "Net Banking",
      enabled: true,
      isDefault: false,
      reqRef: true,
      iconName: "FileText",
    },
  ],
  discount: {
    allowDiscounts: true,
    maxDiscountPct: 20,
    approvalRequired: true,
    authorizedRoles: "Hospital Admin & Chief Accountant",
  },
  receipt: {
    showLogo: true,
    showQrCode: true,
    showPaymentSummary: true,
    showTaxDetails: true,
    showTerms: true,
    footerNotes: "Payment once settled is subject to official refund policy.",
    hospitalName: "",
    hospitalTagline: "",
    hospitalAddress: "",
    hospitalPhone: "",
    hospitalGstin: "",
    hospitalEmail: "",
    hospitalWebsite: "",
  },
  rules: {
    allowPartial: true,
    allowAdvance: true,
    allowRefunds: true,
    allowCancellation: true,
    gracePeriodDays: 7,
  },
};
