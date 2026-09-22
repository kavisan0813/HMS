import { Route } from "react-router";
import { ROUTES } from "./routes";
import { RouteGuard } from "../../permissions/guards";
import { DoctorScheduleScreen } from "../../features/doctors/components/DoctorScheduleScreen";
import { DoctorQueueScreen } from "../../features/doctors/components/DoctorQueueScreen";
import { DoctorPatientsScreen } from "../../features/doctors/components/DoctorPatientsScreen";
import { DoctorAppointmentsScreen } from "../../features/doctors/components/DoctorAppointmentsScreen";
import { OpdConsultationCenterScreen } from "../../features/opd/pages/OPDConsultationPage";
import { StartConsultationPage as StartOpdConsultationWorkspaceScreen } from "../../features/opd/pages/StartConsultationPage";
import { PrescriptionManagementPage } from "../../features/prescriptions/pages/PrescriptionManagementPage";
import { DoctorProfileRoute } from "../../features/doctors/pages/DoctorProfileRoute";
import { DoctorsRouteDispatcher } from "../../features/doctors/routes/DoctorsRouteDispatcher";

export function DoctorRoutes() {
  return (
    <>
      <Route
        path={ROUTES.DOCTOR_MY_SCHEDULE}
        element={
          <RouteGuard requiredPermission="DOCTOR_SCHEDULE_VIEW">
            <DoctorScheduleScreen />
          </RouteGuard>
        }
      />
      <Route
        path={ROUTES.DOCTOR_MY_QUEUE}
        element={
          <RouteGuard requiredPermission="QUEUE_VIEW">
            <DoctorQueueScreen />
          </RouteGuard>
        }
      />
      <Route
        path={ROUTES.DOCTOR_PATIENTS}
        element={
          <RouteGuard requiredPermission="PATIENT_VIEW">
            <DoctorPatientsScreen />
          </RouteGuard>
        }
      />
      <Route
        path={ROUTES.DOCTOR_APPOINTMENTS}
        element={
          <RouteGuard requiredPermission="APPOINTMENT_VIEW">
            <DoctorAppointmentsScreen />
          </RouteGuard>
        }
      />
      <Route
        path={ROUTES.DOCTOR_CONSULTATION}
        element={
          <RouteGuard requiredPermission="OPD_VIEW">
            <OpdConsultationCenterScreen />
          </RouteGuard>
        }
      />
      <Route
        path={ROUTES.DOCTOR_CONSULTATION_ID}
        element={
          <RouteGuard requiredPermission="OPD_VIEW">
            <StartOpdConsultationWorkspaceScreen />
          </RouteGuard>
        }
      />
      <Route
        path={ROUTES.DOCTOR_PRESCRIPTIONS}
        element={
          <RouteGuard requiredPermission="PRESCRIPTION_VIEW">
            <PrescriptionManagementPage />
          </RouteGuard>
        }
      />
      <Route
        path={ROUTES.DOCTORS}
        element={
          <RouteGuard requiredPermission="DOCTOR_VIEW">
            <DoctorsRouteDispatcher />
          </RouteGuard>
        }
      />
      <Route
        path={ROUTES.DOCTOR_PROFILE}
        element={
          <RouteGuard requiredPermission="DOCTOR_PROFILE_VIEW">
            <DoctorProfileRoute />
          </RouteGuard>
        }
      />
      <Route
        path={ROUTES.DOCTOR_DIRECTORY}
        element={
          <RouteGuard requiredPermission="DOCTOR_VIEW">
            <DoctorsRouteDispatcher />
          </RouteGuard>
        }
      />
    </>
  );
}
