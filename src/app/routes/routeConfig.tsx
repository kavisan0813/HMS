import { Suspense } from "react";
import { Routes, Route, Navigate } from "react-router";
import { ROUTES } from "./routes";
import { ProtectedRoute } from "./ProtectedRoute";

// Base App Shell
import { HMSAppShell } from "../../components/layout/HMSAppShell";
import { DashboardDispatcher } from "./DashboardDispatcher";

// Auth and Context
import { PatientPortalProvider } from "../../features/patients/context/PatientPortalContext.tsx";
import { PatientOnboardingRoute } from "../../features/patients/routes/PatientOnboardingRoute";

// Change Password
import { ChangePasswordPage } from "../../features/auth/pages/ChangePasswordPage";

// Sub-route imports
import { PublicAuthRoutes } from "./PublicAuthRoutes";
import { PatientRoutes } from "./PatientRoutes";
import { DoctorRoutes } from "./DoctorRoutes";
import { AppointmentRoutes } from "./AppointmentRoutes";
import { BillingRoutes } from "./BillingRoutes";
import { AdministrationRoutes } from "./AdministrationRoutes";

function RouteLoading() {
  return (
    <div className="flex min-h-[40vh] items-center justify-center">
      <div className="flex items-center gap-3 text-sm text-slate-500">
        <div className="h-5 w-5 animate-spin rounded-full border-2 border-slate-300 border-t-primary" />
        <span>Loading...</span>
      </div>
    </div>
  );
}

export function AppRoutes() {
  return (
    <Suspense fallback={<RouteLoading />}>
      <Routes>
        {PublicAuthRoutes()}

        {/* Protected Password Change Route */}
        <Route
          path={ROUTES.CHANGE_PASSWORD}
          element={
            <ProtectedRoute>
              <ChangePasswordPage />
            </ProtectedRoute>
          }
        />

        {/* Protected Feature-Based Routes with App Shell Layout */}
        <Route
          element={
            <ProtectedRoute>
              <PatientPortalProvider>
                <HMSAppShell />
              </PatientPortalProvider>
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to={ROUTES.DASHBOARD} replace />} />
          <Route element={<PatientOnboardingRoute />}>
            <Route path={ROUTES.DASHBOARD} element={<DashboardDispatcher />} />
          </Route>

          {PatientRoutes()}
          {DoctorRoutes()}
          {AppointmentRoutes()}
          {BillingRoutes()}
          {AdministrationRoutes()}
        </Route>

        {/* Catch-all fallback */}
        <Route
          path={ROUTES.NOT_FOUND}
          element={<Navigate to={ROUTES.DASHBOARD} replace />}
        />
      </Routes>
    </Suspense>
  );
}
