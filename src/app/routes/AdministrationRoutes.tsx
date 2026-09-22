import { Route } from "react-router";
import { ROUTES } from "./routes";
import { RouteGuard } from "../../permissions/guards";
import {
  ReportsDashboardScreen,
  SettingsPage,
  UserProfileRoute,
  UserManagementCenterScreen,
  AuditLogManagementPage,
  NotificationCenterPage,
} from "./lazyPages";

export function AdministrationRoutes() {
  return (
    <>
      <Route
        path={ROUTES.REPORTS}
        element={
          <RouteGuard requiredPermission="REPORT_VIEW">
            <ReportsDashboardScreen />
          </RouteGuard>
        }
      />
      <Route
        path={ROUTES.SETTINGS}
        element={
          <RouteGuard requiredPermission="USER_VIEW">
            <SettingsPage />
          </RouteGuard>
        }
      />
      <Route
        path={ROUTES.DOCTOR_ME_PROFILE}
        element={
          <RouteGuard requiredPermission="PROFILE_VIEW">
            <UserProfileRoute />
          </RouteGuard>
        }
      />
      <Route
        path={ROUTES.PROFILE}
        element={
          <RouteGuard requiredPermission="PROFILE_VIEW">
            <UserProfileRoute />
          </RouteGuard>
        }
      />
      <Route
        path="/profile/:userId"
        element={
          <RouteGuard requiredPermission="PROFILE_VIEW">
            <UserProfileRoute />
          </RouteGuard>
        }
      />
      <Route
        path={ROUTES.MY_PROFILE}
        element={
          <RouteGuard requiredPermission="PROFILE_VIEW">
            <UserProfileRoute />
          </RouteGuard>
        }
      />
      <Route
        path={ROUTES.USER_MANAGEMENT}
        element={
          <RouteGuard requiredPermission="USER_VIEW">
            <UserManagementCenterScreen />
          </RouteGuard>
        }
      />
      <Route
        path={ROUTES.AUDIT_LOGS}
        element={
          <RouteGuard requiredPermission="USER_VIEW">
            <AuditLogManagementPage />
          </RouteGuard>
        }
      />
      <Route
        path={ROUTES.NOTIFICATIONS}
        element={
          <RouteGuard requiredPermission="NOTIFICATION_VIEW">
            <NotificationCenterPage />
          </RouteGuard>
        }
      />
    </>
  );
}
