import { useState } from "react";
import { SecuritySubHeader } from "../components/security/SecuritySubHeader";
import { SecurityKpiCards } from "../components/security/SecurityKpiCards";
import { AuthenticationSettings } from "../components/security/AuthenticationSettings";
import { PasswordPolicy } from "../components/security/PasswordPolicy";
import { SessionManagement } from "../components/security/SessionManagement";
import { LoginProtection } from "../components/security/LoginProtection";
import { AccessRestrictions } from "../components/security/AccessRestrictions";
import { SecurityEventsTable } from "../components/security/SecurityEventsTable";
import { SecurityAnalyticsCharts } from "../components/security/SecurityAnalyticsCharts";

import { SecuritySaveToast } from "../components/security/SecuritySaveToast";

export function SecuritySettingsPage() {
  const [saveToast, setSaveToast] = useState<string | null>(null);

  const handleSave = () => {
    setSaveToast(
      "Security Policies & Authentication Rules updated successfully!",
    );
    setTimeout(() => setSaveToast(null), 3000);
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        width: "100%",
        gap: "20px",
      }}
    >
      {/* MAIN CONTENT SECTIONS */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "20px",
          width: "100%",
        }}
      >
        {/* SUB-HEADER ACTION BAR */}
        <SecuritySubHeader onSave={handleSave} />

        {/* SECURITY OVERVIEW KPI CARDS */}
        <SecurityKpiCards />

        {/* SECTION 01: AUTHENTICATION SETTINGS */}
        <AuthenticationSettings />

        {/* SECTION 02: PASSWORD COMPLEXITY & EXPIRY */}
        <PasswordPolicy />

        {/* SECTION 03: SESSION MANAGEMENT */}
        <SessionManagement />

        {/* SECTION 04: LOGIN PROTECTION */}
        <LoginProtection />

        {/* SECTION 05: ACCESS RESTRICTIONS */}
        <AccessRestrictions />

        {/* SECTION 06: SECURITY EVENT LOGS */}
        <SecurityEventsTable />

        {/* SECTION 07: SECURITY ANALYTICS CHARTS */}
        <SecurityAnalyticsCharts />


      </div>

      {/* SAVE TOAST */}
      <SecuritySaveToast message={saveToast} />
    </div>
  );
}
