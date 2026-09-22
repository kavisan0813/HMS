import { useRef, useState, lazy, Suspense } from "react";
import { HospitalInformationPage } from "./HospitalInformationPage";
import { UserRolesPermissionsPage } from "./UserRolesPermissionsPage";
import { AppointmentConfigurationPage } from "./AppointmentConfigurationPage";
const BillingConfigurationPage = lazy(() =>
  import("../../billing/pages/BillingConfigurationPage").then((m) => ({
    default: m.BillingConfigurationPage,
  })),
);
import { NotificationCommunicationPage } from "../../notification/pages/NotificationCommunicationPage";
import { SecuritySettingsPage } from "./SecuritySettingsPage";
import { BackupMaintenancePage } from "./BackupMaintenancePage";
import { SettingsPageHeader } from "../components/shell/SettingsPageHeader";
import { QuickConfigToolbar } from "../components/shell/QuickConfigToolbar";
import {
  GeneralSettingsContent,
  type GeneralSettingsContentHandle,
} from "../components/shell/GeneralSettingsContent";
import { BottomActionBar } from "../components/shell/BottomActionBar";
import {
  Building2,
  Calendar,
  CreditCard,
  Bell,
  Lock,
  Database,
  Sliders,
  ShieldCheck,
  Stethoscope,
} from "lucide-react";

const RB = "'Roboto', system-ui, sans-serif";

interface SettingsPageProps {
  onNavigate?: (screen: string) => void;
}

const QUICK_CONFIG_CARDS = [
  {
    id: "general",
    title: "General",
    description: "System overview & status",
    icon: Sliders,
    status: "Overview",
  },
  {
    id: "hospital-info",
    title: "Hospital Information",
    description: "Branding, contact & address",
    icon: Building2,
    status: "Configured",
  },
  {
    id: "user-roles",
    title: "User Roles & Permissions",
    description: "RBAC & access control",
    icon: ShieldCheck,
    status: "Active",
  },
  {
    id: "opd-config",
    title: "OPD & Clinical Configuration",
    description: "Consultation & queue settings",
    icon: Stethoscope,
    status: "Active",
  },
  {
    id: "appointment-settings",
    title: "Appointment & Scheduling",
    description: "Slots, working hours & holidays",
    icon: Calendar,
    status: "Configured",
  },
  {
    id: "billing-config",
    title: "Billing & Financial Settings",
    description: "Invoicing, taxes & payment rules",
    icon: CreditCard,
    status: "Configured",
  },
  {
    id: "notification-settings",
    title: "Notifications & Messaging",
    description: "Templates, SMS & Email alerts",
    icon: Bell,
    status: "Configured",
  },
  {
    id: "security-audit",
    title: "Security, Auth & Compliance",
    description: "Session, 2FA & Audit policy",
    icon: Lock,
    status: "Secured",
  },
  {
    id: "backup-maintenance",
    title: "Backup, Restore & Maintenance",
    description: "Database export & system logs",
    icon: Database,
    status: "Healthy",
  },
];

export function SettingsPage({ onNavigate }: SettingsPageProps) {
  void onNavigate;
  const [activeMenu, setActiveMenu] = useState<string>("general");
  const [saveStatus, setSaveStatus] = useState<string | null>(null);
  const generalSettingsRef = useRef<GeneralSettingsContentHandle>(null);

  // Quick Configuration Toolbar items
  const handleSave = (message?: string) => {
    setSaveStatus(message ?? "Settings saved successfully!");
    setTimeout(() => setSaveStatus(null), 3000);
  };

  // Keep browser click events out of the human-readable status string.
  const handleButtonSave = () => handleSave();

  const handleCancel = () => {
    setActiveMenu("general");
    setSaveStatus(null);
  };

  const openResetModal = () => {
    generalSettingsRef.current?.openResetModal();
  };

  const activeTitle =
    QUICK_CONFIG_CARDS.find((q) => q.id === activeMenu)?.title ||
    "Settings Workspace";

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        width: "100%",
        flex: 1,
        background: "#F1F5F9",
        fontFamily: RB,
      }}
    >
      {/* ─── PAGE HEADER ────────────────────────────────────────────────── */}
      <SettingsPageHeader onReset={openResetModal} onSave={handleButtonSave} />

      {/* ─── HORIZONTAL QUICK CONFIGURATION TOOLBAR ────────────────────── */}
      <QuickConfigToolbar
        items={QUICK_CONFIG_CARDS}
        activeId={activeMenu}
        onSelect={setActiveMenu}
      />

      {/* ─── SINGLE FULL-WIDTH WORKSPACE CONTENT AREA ───────────────────── */}
      <div
        style={{
          flex: 1,
          padding: "24px",
          width: "100%",
          boxSizing: "border-box",
        }}
      >
        {/* Render Active Settings Workspace Full Width */}
        <div style={{ width: "100%", transition: "opacity 0.2s ease-in-out" }}>
          {activeMenu === "general" ? (
            <GeneralSettingsContent
              ref={generalSettingsRef}
              onSave={handleSave}
            />
          ) : activeMenu === "hospital-info" ? (
            <HospitalInformationPage />
          ) : activeMenu === "user-roles" ||
            activeMenu === "roles-permissions" ? (
            <UserRolesPermissionsPage />
          ) : activeMenu === "appointment-settings" ||
            activeMenu === "appointments" ? (
            <AppointmentConfigurationPage />
          ) : activeMenu === "billing-config" || activeMenu === "billing" ? (
            <Suspense
              fallback={
                <div className="flex min-h-75 items-center justify-center text-sm text-slate-500">
                  Loading billing configuration...
                </div>
              }
            >
              <BillingConfigurationPage />
            </Suspense>
          ) : activeMenu === "notification-settings" ||
            activeMenu === "notifications" ? (
            <NotificationCommunicationPage />
          ) : activeMenu === "security-audit" || activeMenu === "security" ? (
            <SecuritySettingsPage />
          ) : activeMenu === "backup-maintenance" || activeMenu === "backup" ? (
            <BackupMaintenancePage />
          ) : null}
        </div>
      </div>

      {/* ─── BOTTOM STICKY ACTION BAR ────────────────────────────────────── */}
      <BottomActionBar
        saveStatus={saveStatus}
        activeTitle={activeTitle}
        onCancel={handleCancel}
        onSave={handleButtonSave}
        onReset={openResetModal}
      />
    </div>
  );
}
