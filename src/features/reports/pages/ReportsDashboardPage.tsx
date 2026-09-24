import React, { lazy } from "react";
import { useReports } from "../hooks/useReports";

// Admin pages
const AdminReportsDashboardScreen = lazy(() =>
  import("./ReportsOverview").then((m) => ({
    default: m.AdminReportsDashboardScreen,
  })),
);
const DailyAppointmentReportScreen = lazy(() =>
  import("./AppointmentReport").then((m) => ({
    default: m.DailyAppointmentReportScreen,
  })),
);
const DailyRevenueReportScreen = lazy(() =>
  import("./RevenueReport").then((m) => ({
    default: m.DailyRevenueReportScreen,
  })),
);
const PatientReportScreen = lazy(() =>
  import("./PatientReport").then((m) => ({
    default: m.PatientReportScreen,
  })),
);
const DoctorReportScreen = lazy(() =>
  import("./DoctorPerformanceReport").then((m) => ({
    default: m.DoctorReportScreen,
  })),
);
const BillingReportScreen = lazy(() =>
  import("./BillingReport").then((m) => ({
    default: m.BillingReportScreen,
  })),
);
const DashboardKpiDetailScreen = lazy(() =>
  import("./KpiDetail").then((m) => ({
    default: m.DashboardKpiDetailScreen,
  })),
);

// Doctor pages
const DoctorReportsDashboardScreen = lazy(() =>
  import("./DoctorDashboard").then((m) => ({
    default: m.DoctorReportsDashboardScreen,
  })),
);
const DoctorDailyAppointmentReportScreen = lazy(() =>
  import("./DoctorAppointmentReport").then((m) => ({
    default: m.DoctorDailyAppointmentReportScreen,
  })),
);
const DoctorPatientReportScreen = lazy(() =>
  import("./DoctorPatientReport").then((m) => ({
    default: m.DoctorPatientReportScreen,
  })),
);
const DoctorDoctorReportScreen = lazy(() =>
  import("./DoctorSelfReport").then((m) => ({
    default: m.DoctorDoctorReportScreen,
  })),
);


// Receptionist pages
const ReceptionistReportsDashboardScreen = lazy(() =>
  import("./ReceptionistDashboard").then((m) => ({
    default: m.ReceptionistReportsDashboardScreen,
  })),
);
const ReceptionistDailyAppointmentReportScreen = lazy(() =>
  import("./ReceptionistAppointmentReport").then((m) => ({
    default: m.ReceptionistDailyAppointmentReportScreen,
  })),
);
const ReceptionistPatientReportScreen = lazy(() =>
  import("./ReceptionistPatientReport").then((m) => ({
    default: m.ReceptionistPatientReportScreen,
  })),
);
const ReceptionistDashboardKpiDetailScreen = lazy(() =>
  import("./ReceptionistKpiDetail").then((m) => ({
    default: m.ReceptionistDashboardKpiDetailScreen,
  })),
);

// Accountant pages
const AccountantReportsDashboardScreen = lazy(() =>
  import("./AccountantDashboard").then((m) => ({
    default: m.AccountantReportsDashboardScreen,
  })),
);
const AccountantDailyRevenueReportScreen = lazy(() =>
  import("./AccountantRevenueReport").then((m) => ({
    default: m.AccountantDailyRevenueReportScreen,
  })),
);
const AccountantBillingReportScreen = lazy(() =>
  import("./AccountantBillingReport").then((m) => ({
    default: m.AccountantBillingReportScreen,
  })),
);
const AccountantDashboardKpiDetailScreen = lazy(() =>
  import("./AccountantKpiDetail").then((m) => ({
    default: m.AccountantDashboardKpiDetailScreen,
  })),
);

export function ReportsDashboardPage() {
  const {
    role,
    activeView,
    activeKpi,
    handleOpenReport,
    handleOpenKpi,
    handleBack,
  } = useReports();

  // Doctor role
  if (role === "DOCTOR") {
    if (activeView === "daily-appointments" || activeView === "REP-001") {
      return <DoctorDailyAppointmentReportScreen onBack={handleBack} />;
    }
    if (activeView === "patient-registrations" || activeView === "REP-003") {
      return <DoctorPatientReportScreen onBack={handleBack} />;
    }
    if (activeView === "doctor-performance" || activeView === "REP-004") {
      return <DoctorDoctorReportScreen onBack={handleBack} />;
    }
    return <DoctorReportsDashboardScreen onOpenReport={handleOpenReport} />;
  }

  // Receptionist role
  if (role === "RECEPTIONIST") {
    if (activeView === "daily-appointments" || activeView === "REP-001") {
      return <ReceptionistDailyAppointmentReportScreen onBack={handleBack} />;
    }
    if (activeView === "patient-registrations" || activeView === "REP-003") {
      return <ReceptionistPatientReportScreen onBack={handleBack} />;
    }
    if (activeKpi) {
      return (
        <ReceptionistDashboardKpiDetailScreen
          onBack={handleBack}
          onOpenReport={handleOpenReport}
        />
      );
    }
    return (
      <ReceptionistReportsDashboardScreen
        onOpenDailyAppointments={() => handleOpenReport("daily-appointments")}
        onOpenPatientReport={() => handleOpenReport("patient-registrations")}
      />
    );
  }

  // Accountant role
  if (role === "ACCOUNTANT") {
    if (activeView === "daily-revenue" || activeView === "REP-002") {
      return <AccountantDailyRevenueReportScreen onBack={handleBack} />;
    }
    if (activeView === "billing-report" || activeView === "REP-005") {
      return <AccountantBillingReportScreen onBack={handleBack} />;
    }
    if (activeKpi) {
      return (
        <AccountantDashboardKpiDetailScreen
          onBack={handleBack}
          onOpenReport={handleOpenReport}
        />
      );
    }
    return (
      <AccountantReportsDashboardScreen
        onOpenDailyRevenue={() => handleOpenReport("daily-revenue")}
        onOpenBillingReport={() => handleOpenReport("billing-report")}
        onOpenKpiDetail={() => handleOpenKpi("Collection Rate")}
      />
    );
  }

  // Admin / Super Admin (Default fallback)
  if (activeView === "REP-001" || activeView === "daily-appointments") {
    return (
      <DailyAppointmentReportScreen
        onBack={handleBack}
        onOpenPatientReport={() => handleOpenReport("REP-003")}
        onOpenDoctorReport={() => handleOpenReport("REP-004")}
      />
    );
  }
  if (activeView === "REP-002" || activeView === "daily-revenue") {
    return (
      <DailyRevenueReportScreen
        onBack={handleBack}
        onOpenBillingReport={() => handleOpenReport("REP-005")}
      />
    );
  }
  if (activeView === "REP-003" || activeView === "patient-registrations") {
    return (
      <PatientReportScreen
        onBack={handleBack}
        onOpenAppointmentReport={() => handleOpenReport("REP-001")}
        onOpenDoctorReport={() => handleOpenReport("REP-004")}
      />
    );
  }
  if (activeView === "REP-004" || activeView === "doctor-performance") {
    return (
      <DoctorReportScreen
        onBack={handleBack}
        onOpenAppointmentReport={() => handleOpenReport("REP-001")}
        onOpenPatientReport={() => handleOpenReport("REP-003")}
      />
    );
  }
  if (
    activeView === "REP-005" ||
    activeView === "invoices-summary" ||
    activeView === "billing-report"
  ) {
    return (
      <BillingReportScreen
        onBack={handleBack}
        onOpenRevenueReport={() => handleOpenReport("REP-002")}
      />
    );
  }
  if (
    activeKpi ||
    activeView === "KPI" ||
    activeView === "collection-rate" ||
    activeView === "REP-006"
  ) {
    return (
      <DashboardKpiDetailScreen
        onBack={handleBack}
        initialKpi={activeKpi || "Collection Rate"}
        onOpenRelatedReport={() => handleOpenReport("REP-002")}
      />
    );
  }

  return (
    <AdminReportsDashboardScreen
      onOpenReport={handleOpenReport}
      onOpenKpiDetail={handleOpenKpi}
    />
  );
}
