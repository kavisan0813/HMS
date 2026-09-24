import React from "react";
import { useReports } from "../hooks/useReports";

// Admin pages
import { AdminReportsDashboardScreen } from "./ReportsOverview";
import { DailyAppointmentReportScreen } from "./AppointmentReport";
import { DailyRevenueReportScreen } from "./RevenueReport";
import { PatientReportScreen } from "./PatientReport";
import { DoctorReportScreen } from "./DoctorPerformanceReport";
import { BillingReportScreen } from "./BillingReport";
import { DashboardKpiDetailScreen } from "./KpiDetail";

// Doctor pages
import { DoctorReportsDashboardScreen } from "./DoctorDashboard";
import { DoctorDailyAppointmentReportScreen } from "./DoctorAppointmentReport";
import { DoctorPatientReportScreen } from "./DoctorPatientReport";
import { DoctorDoctorReportScreen } from "./DoctorSelfReport";

// Receptionist pages
import { ReceptionistReportsDashboardScreen } from "./ReceptionistDashboard";
import { ReceptionistDailyAppointmentReportScreen } from "./ReceptionistAppointmentReport";
import { ReceptionistPatientReportScreen } from "./ReceptionistPatientReport";
import { ReceptionistDashboardKpiDetailScreen } from "./ReceptionistKpiDetail";

// Accountant pages
import { AccountantReportsDashboardScreen } from "./AccountantDashboard";
import { AccountantDailyRevenueReportScreen } from "./AccountantRevenueReport";
import { AccountantBillingReportScreen } from "./AccountantBillingReport";
import { AccountantDashboardKpiDetailScreen } from "./AccountantKpiDetail";


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
