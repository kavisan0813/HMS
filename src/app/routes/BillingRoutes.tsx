import { Route } from "react-router";
import { ROUTES } from "./routes";
import { RouteGuard } from "../../permissions/guards";
import {
  BillingManagementPage,
  CreateInvoiceWorkspacePage,
  CollectPaymentWorkspacePage,
  InvoicePrintPreviewPage,
  BillingConfigurationPage,
  InvoiceDetailsPage,
  PaymentHistoryPage,
  DailyBillingReportPage,
  ReceptionistPaymentCollectionPage,
  PatientMyBillsPage,
} from "./lazyPages";

export function BillingRoutes() {
  return (
    <>
      <Route
        path={ROUTES.BILLING}
        element={
          <RouteGuard requiredPermission="BILLING_VIEW">
            <BillingManagementPage />
          </RouteGuard>
        }
      />
      <Route
        path={ROUTES.BILLING_CREATE}
        element={
          <RouteGuard requiredPermission="BILLING_VIEW">
            <CreateInvoiceWorkspacePage />
          </RouteGuard>
        }
      />
      <Route
        path={ROUTES.BILLING_COLLECT_PAYMENT}
        element={
          <RouteGuard requiredPermission="BILLING_VIEW">
            <CollectPaymentWorkspacePage />
          </RouteGuard>
        }
      />
      <Route
        path={ROUTES.BILLING_PRINT_PREVIEW}
        element={
          <RouteGuard requiredPermission="BILLING_VIEW">
            <InvoicePrintPreviewPage />
          </RouteGuard>
        }
      />
      <Route
        path={ROUTES.BILLING_CONFIGURATION}
        element={
          <RouteGuard requiredPermission="BILLING_VIEW">
            <BillingConfigurationPage />
          </RouteGuard>
        }
      />
      <Route
        path={ROUTES.BILLING_INVOICE}
        element={
          <RouteGuard requiredPermission="BILLING_VIEW">
            <InvoiceDetailsPage />
          </RouteGuard>
        }
      />
      <Route
        path={ROUTES.BILLING_HISTORY}
        element={
          <RouteGuard requiredPermission="BILLING_VIEW">
            <PaymentHistoryPage />
          </RouteGuard>
        }
      />
      <Route
        path={ROUTES.BILLING_REPORT}
        element={
          <RouteGuard requiredPermission="BILLING_VIEW">
            <DailyBillingReportPage />
          </RouteGuard>
        }
      />
      <Route
        path={ROUTES.RECEPTIONIST_PAYMENT_COLLECTION}
        element={
          <RouteGuard requiredPermission="BILLING_VIEW">
            <ReceptionistPaymentCollectionPage />
          </RouteGuard>
        }
      />
      <Route
        path={ROUTES.PATIENT_MY_BILLS}
        element={
          <RouteGuard requiredPermission="BILLING_VIEW">
            <PatientMyBillsPage />
          </RouteGuard>
        }
      />
      <Route
        path={ROUTES.PATIENT_PORTAL_BILLING}
        element={
          <RouteGuard requiredPermission="BILLING_VIEW">
            <PatientMyBillsPage />
          </RouteGuard>
        }
      />
      <Route
        path={ROUTES.PATIENT_PORTAL_BILLING_DETAIL}
        element={
          <RouteGuard requiredPermission="BILLING_VIEW">
            <InvoiceDetailsPage />
          </RouteGuard>
        }
      />
      <Route
        path={ROUTES.PATIENT_PORTAL_BILLING_RECEIPT}
        element={
          <RouteGuard requiredPermission="BILLING_VIEW">
            <InvoicePrintPreviewPage />
          </RouteGuard>
        }
      />
      <Route
        path="/patients/billing/:billId"
        element={
          <RouteGuard requiredPermission="BILLING_VIEW">
            <InvoiceDetailsPage />
          </RouteGuard>
        }
      />
      <Route
        path="/patients/billing/:billId/receipt"
        element={
          <RouteGuard requiredPermission="BILLING_VIEW">
            <InvoicePrintPreviewPage />
          </RouteGuard>
        }
      />
    </>
  );
}
