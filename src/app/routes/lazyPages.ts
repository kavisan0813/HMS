import { lazy } from "react";

export const BillingManagementPage = lazy(
  () => import("../../features/billing/pages/BillingManagementPage"),
);

export const CreateInvoiceWorkspacePage = lazy(
  () => import("../../features/billing/pages/CreateInvoiceWorkspacePage"),
);

export const CollectPaymentWorkspacePage = lazy(
  () => import("../../features/billing/pages/CollectPaymentWorkspacePage"),
);

export const InvoicePrintPreviewPage = lazy(
  () => import("../../features/billing/pages/InvoicePrintPreviewPage"),
);

export const BillingConfigurationPage = lazy(
  () => import("../../features/billing/pages/BillingConfigurationPage"),
);

export const InvoiceDetailsPage = lazy(
  () => import("../../features/billing/pages/InvoiceDetailsPage"),
);

export const PaymentHistoryPage = lazy(
  () => import("../../features/billing/pages/PaymentHistoryPage"),
);

export const DailyBillingReportPage = lazy(
  () => import("../../features/reports/pages/DailyBillingReport"),
);

export const ReceptionistPaymentCollectionPage = lazy(
  () =>
    import(
      "../../features/billing/pages/ReceptionistPaymentCollectionPage"
    ),
);

export const PatientMyBillsPage = lazy(
  () => import("../../features/billing/pages/PatientMyBillsPage"),
);

