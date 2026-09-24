import { lazy } from "react";

// ==========================================
// Billing & Invoicing Pages
// ==========================================
export const BillingManagementPage = lazy(() =>
  import("../../features/billing/pages/BillingManagementPage").then((m) => ({
    default: m.BillingManagementPage,
  })),
);

export const CreateInvoiceWorkspacePage = lazy(() =>
  import("../../features/billing/pages/CreateInvoiceWorkspacePage").then(
    (m) => ({
      default: m.CreateInvoiceWorkspacePage,
    }),
  ),
);

export const CollectPaymentWorkspacePage = lazy(() =>
  import("../../features/billing/pages/CollectPaymentWorkspacePage").then(
    (m) => ({
      default: m.CollectPaymentWorkspacePage,
    }),
  ),
);

export const InvoicePrintPreviewPage = lazy(() =>
  import("../../features/billing/pages/InvoicePrintPreviewPage").then((m) => ({
    default: m.InvoicePrintPreviewPage,
  })),
);

export const BillingConfigurationPage = lazy(() =>
  import("../../features/billing/pages/BillingConfigurationPage").then((m) => ({
    default: m.BillingConfigurationPage,
  })),
);

export const InvoiceDetailsPage = lazy(() =>
  import("../../features/billing/pages/InvoiceDetailsPage").then((m) => ({
    default: m.InvoiceDetailsPage,
  })),
);

export const PaymentHistoryPage = lazy(() =>
  import("../../features/billing/pages/PaymentHistoryPage").then((m) => ({
    default: m.PaymentHistoryPage,
  })),
);

export const DailyBillingReportPage = lazy(() =>
  import("../../features/reports/pages/DailyBillingReport").then((m) => ({
    default: m.DailyBillingReportPage,
  })),
);

export const ReceptionistPaymentCollectionPage = lazy(() =>
  import("../../features/billing/pages/ReceptionistPaymentCollectionPage").then(
    (m) => ({
      default: m.ReceptionistPaymentCollectionPage,
    }),
  ),
);

export const PatientMyBillsPage = lazy(() =>
  import("../../features/billing/pages/PatientMyBillsPage").then((m) => ({
    default: m.PatientMyBillsPage,
  })),
);

// ==========================================
// Appointment & Clinical Consultation Pages
// ==========================================
export const AppointmentManagementCenterScreen = lazy(() =>
  import("../../features/appointments/pages/AppointmentManagementCenterScreen").then(
    (m) => ({
      default: m.AppointmentManagementCenterScreen,
    }),
  ),
);

export const BookAppointmentScreen = lazy(() =>
  import("../../features/appointments/pages/BookAppointmentScreen").then(
    (m) => ({
      default: m.BookAppointmentScreen,
    }),
  ),
);

export const AppointmentDetailPage = lazy(() =>
  import("../../features/appointments/pages/AppointmentDetailPage").then(
    (m) => ({
      default: m.AppointmentDetailPage,
    }),
  ),
);

export const PatientCheckInScreen = lazy(() =>
  import("../../features/appointments/pages/PatientCheckInScreen").then(
    (m) => ({
      default: m.PatientCheckInScreen,
    }),
  ),
);

export const QueueManagementScreen = lazy(() =>
  import("../../features/appointments/pages/QueueManagementScreen").then(
    (m) => ({
      default: m.QueueManagementScreen,
    }),
  ),
);

export const RecordPatientVitalsScreen = lazy(() =>
  import("../../features/vitals/pages/VitalsManagementScreen").then((m) => ({
    default: m.RecordPatientVitalsScreen,
  })),
);

export const OpdConsultationCenterScreen = lazy(() =>
  import("../../features/opd/pages/OPDConsultationPage").then((m) => ({
    default: m.OpdConsultationCenterScreen,
  })),
);

export const StartOpdConsultationWorkspaceScreen = lazy(() =>
  import("../../features/opd/pages/StartConsultationPage").then((m) => ({
    default: m.StartConsultationPage,
  })),
);

export const PrescriptionManagementPage = lazy(() =>
  import("../../features/prescriptions/pages/PrescriptionManagementPage").then(
    (m) => ({
      default: m.PrescriptionManagementPage,
    }),
  ),
);

export const EncounterPrescriptionPage = lazy(() =>
  import("../../features/prescriptions/pages/EncounterPrescriptionPage").then(
    (m) => ({
      default: m.EncounterPrescriptionPage,
    }),
  ),
);

// ==========================================
// Patient Pages & Routes
// ==========================================
export const PatientListPageRoute = lazy(() =>
  import("../../features/patients/routes/PatientListPageRoute").then((m) => ({
    default: m.PatientListPageRoute,
  })),
);

export const RegisterPatientScreen = lazy(() =>
  import("../../features/patients/pages/RegisterPatientScreen").then((m) => ({
    default: m.RegisterPatientScreen,
  })),
);

export const PatientAppointmentsScreen = lazy(() =>
  import("../../features/patients/pages/PatientAppointmentsScreen").then(
    (m) => ({
      default: m.PatientAppointmentsScreen,
    }),
  ),
);

export const PatientMedicalRecordsScreen = lazy(() =>
  import("../../features/patients/pages/PatientMedicalRecordsScreen").then(
    (m) => ({
      default: m.PatientMedicalRecordsScreen,
    }),
  ),
);

export const PatientNotificationsPage = lazy(() =>
  import("../../features/notification/pages/PatientNotificationsPage").then(
    (m) => ({
      default: m.PatientNotificationsPage,
    }),
  ),
);

export const PatientProfileRoute = lazy(() =>
  import("../../features/patients/routes/PatientProfileRoute").then((m) => ({
    default: m.PatientProfileRoute,
  })),
);

export const PatientMyProfileRoute = lazy(() =>
  import("../../features/patients/routes/PatientMyProfileRoute").then((m) => ({
    default: m.PatientMyProfileRoute,
  })),
);

export const DoctorAssignedPatientsRoute = lazy(() =>
  import("../../features/patients/routes/DoctorAssignedPatientsRoute").then(
    (m) => ({
      default: m.DoctorAssignedPatientsRoute,
    }),
  ),
);

export const NurseVitalsWorklistPage = lazy(() =>
  import("../../features/patients/pages/NurseVitalsWorklistPage").then((m) => ({
    default: m.NurseVitalsWorklistPage,
  })),
);

export const PatientDoctorSearchScreen = lazy(() =>
  import("../../features/patients/pages/PatientDoctorSearchScreen").then(
    (m) => ({
      default: m.PatientDoctorSearchScreen,
    }),
  ),
);

export const PatientQueueStatusScreen = lazy(() =>
  import("../../features/patients/pages/PatientQueueStatusScreen").then(
    (m) => ({
      default: m.PatientQueueStatusScreen,
    }),
  ),
);

// ==========================================
// Doctor Pages
// ==========================================
export const DoctorScheduleScreen = lazy(() =>
  import("../../features/doctors/components/DoctorScheduleScreen").then(
    (m) => ({
      default: m.DoctorScheduleScreen,
    }),
  ),
);

export const DoctorQueueScreen = lazy(() =>
  import("../../features/doctors/components/DoctorQueueScreen").then((m) => ({
    default: m.DoctorQueueScreen,
  })),
);

export const DoctorPatientsScreen = lazy(() =>
  import("../../features/doctors/components/DoctorPatientsScreen").then(
    (m) => ({
      default: m.DoctorPatientsScreen,
    }),
  ),
);

export const DoctorAppointmentsScreen = lazy(() =>
  import("../../features/doctors/components/DoctorAppointmentsScreen").then(
    (m) => ({
      default: m.DoctorAppointmentsScreen,
    }),
  ),
);

export const DoctorProfileRoute = lazy(() =>
  import("../../features/doctors/pages/DoctorProfileRoute").then((m) => ({
    default: m.DoctorProfileRoute,
  })),
);

// ==========================================
// Administration Pages
// ==========================================
export const ReportsDashboardScreen = lazy(() =>
  import("../../features/reports/pages/ReportsDashboardPage").then((m) => ({
    default: m.ReportsDashboardPage,
  })),
);

export const SettingsPage = lazy(() =>
  import("../../features/settings/pages/SettingsPage").then((m) => ({
    default: m.SettingsPage,
  })),
);

export const UserProfileRoute = lazy(() =>
  import("../../features/patients/routes/UserProfileRoute").then((m) => ({
    default: m.UserProfileRoute,
  })),
);

export const UserManagementCenterScreen = lazy(
  () => import("../../features/users/pages/UserManagement"),
);

export const AuditLogManagementPage = lazy(() =>
  import("../../features/auditlog/pages/AuditLogManagementPage").then((m) => ({
    default: m.AuditLogManagementPage,
  })),
);

export const NotificationCenterPage = lazy(() =>
  import("../../features/notification/pages/NotificationCenterPage").then(
    (m) => ({
      default: m.NotificationCenterPage,
    }),
  ),
);
