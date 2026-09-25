import { forwardRef, useImperativeHandle, useState } from "react";
import {
  AlertTriangle,
  Building2,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Clock,
  Globe,
  Sliders,
} from "lucide-react";

const PP = "'Poppins', system-ui, sans-serif";

export interface GeneralSettingsContentHandle {
  openResetModal: () => void;
  saveGeneralSettings?: () => void;
}

interface GeneralSettingsContentProps {
  onSave?: (message?: string) => void;
}

export const GeneralSettingsContent = forwardRef<
  GeneralSettingsContentHandle,
  GeneralSettingsContentProps
>(function GeneralSettingsContent({ onSave = () => { } }, ref) {
  // Accordion State (single expanded accordion at a time)
  const [expandedAccordion, setExpandedAccordion] = useState<string | null>(
    "accordion-1",
  );

  // General Settings Form State (Compliant)
  const [generalSettings, setGeneralSettings] = useState({
    defaultLanguage: "English",
    timezone: "Asia/Kolkata (IST - UTC +05:30)",
    dateFormat: "DD/MM/YYYY",
    timeFormat: "12 Hour",
    weekStartsOn: "Monday",
    hospitalDisplayName: "St. Jude Multispecialty Hospital",
    hospitalShortCode: "SJH-01",
    defaultLandingDashboard: "Super Admin Operations Center",
    defaultWorkingShift: "Morning (08:00 AM - 04:00 PM)",
    enableAutoLogout: true,
    autoLogoutDuration: "15 Minutes",
    compactTableView: false,
    enableAnimations: true,
    showBreadcrumbs: true,
    enableTooltips: true,
    defaultTheme: "Light",
    defaultApptDuration: "30 Minutes",
    queueTokenPrefix: "OPD",
    defaultPatientSearchMode: "MRN / Name",
    enableConfirmationDialogs: true,
  });

  const [showResetWarning, setShowResetWarning] = useState(false);

  useImperativeHandle(ref, () => ({
    openResetModal: () => setShowResetWarning(true),
    saveGeneralSettings: () => onSave?.("General settings saved successfully!"),
  }));

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      {/* TOP CONFIGURATION HEALTH CARDS (4 Reusable Enterprise KPI Cards) */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          gap: "16px",
        }}
      >
        <div
          style={{
            background: "#FFFFFF",
            borderRadius: "16px",
            border: "1px solid #E5E7EB",
            padding: "18px",
            boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: "8px",
            }}
          >
            <span
              style={{
                fontSize: "12px",
                fontWeight: 600,
                color: "#64748B",
              }}
            >
              Configuration Status
            </span>
            <div
              style={{
                width: "36px",
                height: "36px",
                borderRadius: "10px",
                background: "#E3F2FD",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <CheckCircle2 size={18} style={{ color: "#0D47A1" }} />
            </div>
          </div>
          <div
            style={{
              fontFamily: PP,
              fontSize: "22px",
              fontWeight: 800,
              color: "#111827",
            }}
          >
            92% Complete
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginTop: "6px",
            }}
          >
            <span style={{ fontSize: "11px", color: "#94A3B8" }}>
              Compliant
            </span>
            <span
              style={{
                fontSize: "10px",
                fontWeight: 600,
                color: "#2E7D32",
                background: "#E8F5E9",
                padding: "1px 6px",
                borderRadius: "4px",
              }}
            >
              Configured
            </span>
          </div>
        </div>

        <div
          style={{
            background: "#FFFFFF",
            borderRadius: "16px",
            border: "1px solid #E5E7EB",
            padding: "18px",
            boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: "8px",
            }}
          >
            <span
              style={{
                fontSize: "12px",
                fontWeight: 600,
                color: "#64748B",
              }}
            >
              Regional Settings
            </span>
            <div
              style={{
                width: "36px",
                height: "36px",
                borderRadius: "10px",
                background: "#E0F2F1",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Globe size={18} style={{ color: "#009688" }} />
            </div>
          </div>
          <div
            style={{
              fontFamily: PP,
              fontSize: "22px",
              fontWeight: 800,
              color: "#111827",
            }}
          >
            Healthy
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginTop: "6px",
            }}
          >
            <span style={{ fontSize: "11px", color: "#94A3B8" }}>
              Last Updated Today
            </span>
            <span
              style={{
                fontSize: "10px",
                fontWeight: 600,
                color: "#009688",
                background: "#E0F2F1",
                padding: "1px 6px",
                borderRadius: "4px",
              }}
            >
              Active
            </span>
          </div>
        </div>

        <div
          style={{
            background: "#FFFFFF",
            borderRadius: "16px",
            border: "1px solid #E5E7EB",
            padding: "18px",
            boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: "8px",
            }}
          >
            <span
              style={{
                fontSize: "12px",
                fontWeight: 600,
                color: "#64748B",
              }}
            >
              Application Defaults
            </span>
            <div
              style={{
                width: "36px",
                height: "36px",
                borderRadius: "10px",
                background: "#E3F2FD",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Sliders size={18} style={{ color: "#0D47A1" }} />
            </div>
          </div>
          <div
            style={{
              fontFamily: PP,
              fontSize: "22px",
              fontWeight: 800,
              color: "#111827",
            }}
          >
            Configured
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginTop: "6px",
            }}
          >
            <span style={{ fontSize: "11px", color: "#94A3B8" }}>
              No Pending Changes
            </span>
            <span
              style={{
                fontSize: "10px",
                fontWeight: 600,
                color: "#0D47A1",
                background: "#E3F2FD",
                padding: "1px 6px",
                borderRadius: "4px",
              }}
            >
              Verified
            </span>
          </div>
        </div>

        <div
          style={{
            background: "#FFFFFF",
            borderRadius: "16px",
            border: "1px solid #E5E7EB",
            padding: "18px",
            boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: "8px",
            }}
          >
            <span
              style={{
                fontSize: "12px",
                fontWeight: 600,
                color: "#64748B",
              }}
            >
              System Preferences
            </span>
            <div
              style={{
                width: "36px",
                height: "36px",
                borderRadius: "10px",
                background: "#E8F5E9",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <CheckCircle2 size={18} style={{ color: "#2E7D32" }} />
            </div>
          </div>
          <div
            style={{
              fontFamily: PP,
              fontSize: "22px",
              fontWeight: 800,
              color: "#111827",
            }}
          >
            Operational
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginTop: "6px",
            }}
          >
            <span style={{ fontSize: "11px", color: "#94A3B8" }}>
              Saved by Hospital Admin
            </span>
            <span
              style={{
                fontSize: "10px",
                fontWeight: 600,
                color: "#2E7D32",
                background: "#E8F5E9",
                padding: "1px 6px",
                borderRadius: "4px",
              }}
            >
              Operational
            </span>
          </div>
        </div>
      </div>

      {/* CONFIGURATION WORKSPACE (EXPANDABLE ACCORDIONS) */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "14px",
        }}
      >
        {/* ACCORDION 01: Localization & Regional Preferences */}
        <div
          style={{
            background: "#FFFFFF",
            borderRadius: "16px",
            border:
              expandedAccordion === "accordion-1"
                ? "2px solid #0D47A1"
                : "1px solid #E5E7EB",
            overflow: "hidden",
            boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
            transition: "background-color 0.2s ease, border-color 0.2s ease",
          }}
        >
          <div
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                (e.currentTarget as HTMLElement).click();
              }
            }}
            role="button"
            onClick={() =>
              setExpandedAccordion(
                expandedAccordion === "accordion-1" ? null : "accordion-1",
              )
            }
            style={{
              padding: "18px 20px",
              background:
                expandedAccordion === "accordion-1" ? "#F0F7FF" : "#FFFFFF",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              cursor: "pointer",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "12px",
              }}
            >
              <div
                style={{
                  width: "36px",
                  height: "36px",
                  borderRadius: "10px",
                  background: "#E0F2F1",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Globe size={18} style={{ color: "#009688" }} />
              </div>
              <div>
                <h3
                  style={{
                    fontFamily: PP,
                    fontSize: "15px",
                    fontWeight: 700,
                    color: "#111827",
                    margin: 0,
                  }}
                >
                  Localization & Regional Preferences
                </h3>
                <p
                  style={{
                    fontSize: "12px",
                    color: "#64748B",
                    margin: "2px 0 0 0",
                  }}
                >
                  Configure hospital-wide regional preferences.
                </p>
              </div>
            </div>

            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "12px",
              }}
            >
              <span
                style={{
                  fontSize: "11px",
                  fontWeight: 600,
                  padding: "3px 8px",
                  borderRadius: "12px",
                  background: "#E8F5E9",
                  color: "#2E7D32",
                }}
              >
                Configured
              </span>
              {expandedAccordion === "accordion-1" ? (
                <ChevronDown size={18} style={{ color: "#0D47A1" }} />
              ) : (
                <ChevronRight size={18} style={{ color: "#94A3B8" }} />
              )}
            </div>
          </div>

          {expandedAccordion === "accordion-1" && (
            <div
              style={{
                padding: "20px",
                borderTop: "1px solid #E5E7EB",
                display: "grid",
                gridTemplateColumns: "1fr 1fr 1fr",
                gap: "16px",
              }}
            >
              <div>
                <span
                  style={{
                    display: "block",
                    fontSize: "12px",
                    fontWeight: 600,
                    color: "#374151",
                    marginBottom: "6px",
                  }}
                >
                  Default Language
                  <select
                    aria-label="Select option"
                    value={generalSettings.defaultLanguage}
                    onChange={(e) =>
                      setGeneralSettings((prev) => ({
                        ...prev,
                        defaultLanguage: e.target.value,
                      }))
                    }
                    style={{
                      width: "100%",
                      padding: "9px 12px",
                      borderRadius: "8px",
                      border: "1px solid #D1D5DB",
                      fontSize: "13px",
                      background: "#FFFFFF",
                    }}
                  >
                    <option value="English">English</option>
                    <option value="Hindi">Hindi (हिंदी)</option>
                    <option value="Spanish">Spanish (Español)</option>
                    <option value="French">French (Français)</option>
                  </select>
                </span>
              </div>

              <div>
                <span
                  style={{
                    display: "block",
                    fontSize: "12px",
                    fontWeight: 600,
                    color: "#374151",
                    marginBottom: "6px",
                  }}
                >
                  Timezone
                  <select
                    aria-label="Select option"
                    value={generalSettings.timezone}
                    onChange={(e) =>
                      setGeneralSettings((prev) => ({
                        ...prev,
                        timezone: e.target.value,
                      }))
                    }
                    style={{
                      width: "100%",
                      padding: "9px 12px",
                      borderRadius: "8px",
                      border: "1px solid #D1D5DB",
                      fontSize: "13px",
                      background: "#FFFFFF",
                    }}
                  >
                    <option value="Asia/Kolkata (IST - UTC +05:30)">
                      Asia/Kolkata (IST - UTC +05:30)
                    </option>
                    <option value="UTC (Greenwich Mean Time)">
                      UTC (Greenwich Mean Time)
                    </option>
                    <option value="America/New_York (EST - UTC -05:00)">
                      America/New_York (EST - UTC -05:00)
                    </option>
                    <option value="Europe/London (BST - UTC +01:00)">
                      Europe/London (BST - UTC +01:00)
                    </option>
                  </select>
                </span>
              </div>

              <div>
                <span
                  style={{
                    display: "block",
                    fontSize: "12px",
                    fontWeight: 600,
                    color: "#374151",
                    marginBottom: "6px",
                  }}
                >
                  Date Format
                  <select
                    aria-label="Select option"
                    value={generalSettings.dateFormat}
                    onChange={(e) =>
                      setGeneralSettings((prev) => ({
                        ...prev,
                        dateFormat: e.target.value,
                      }))
                    }
                    style={{
                      width: "100%",
                      padding: "9px 12px",
                      borderRadius: "8px",
                      border: "1px solid #D1D5DB",
                      fontSize: "13px",
                      background: "#FFFFFF",
                    }}
                  >
                    <option value="DD/MM/YYYY">DD/MM/YYYY (31/12/2026)</option>
                    <option value="MM/DD/YYYY">MM/DD/YYYY (12/31/2026)</option>
                    <option value="YYYY-MM-DD">YYYY-MM-DD (2026-12-31)</option>
                  </select>
                </span>
              </div>

              <div>
                <span
                  style={{
                    display: "block",
                    fontSize: "12px",
                    fontWeight: 600,
                    color: "#374151",
                    marginBottom: "6px",
                  }}
                >
                  Time Format
                  <select
                    aria-label="Select option"
                    value={generalSettings.timeFormat}
                    onChange={(e) =>
                      setGeneralSettings((prev) => ({
                        ...prev,
                        timeFormat: e.target.value,
                      }))
                    }
                    style={{
                      width: "100%",
                      padding: "9px 12px",
                      borderRadius: "8px",
                      border: "1px solid #D1D5DB",
                      fontSize: "13px",
                      background: "#FFFFFF",
                    }}
                  >
                    <option value="12 Hour">
                      12 Hour (09:30 AM / 04:15 PM)
                    </option>
                    <option value="24 Hour">24 Hour (09:30 / 16:15)</option>
                  </select>
                </span>
              </div>

              <div>
                <span
                  style={{
                    display: "block",
                    fontSize: "12px",
                    fontWeight: 600,
                    color: "#374151",
                    marginBottom: "6px",
                  }}
                >
                  Week Starts On
                  <select
                    aria-label="Select option"
                    value={generalSettings.weekStartsOn}
                    onChange={(e) =>
                      setGeneralSettings((prev) => ({
                        ...prev,
                        weekStartsOn: e.target.value,
                      }))
                    }
                    style={{
                      width: "100%",
                      padding: "9px 12px",
                      borderRadius: "8px",
                      border: "1px solid #D1D5DB",
                      fontSize: "13px",
                      background: "#FFFFFF",
                    }}
                  >
                    <option value="Monday">Monday</option>
                    <option value="Sunday">Sunday</option>
                  </select>
                </span>
              </div>
            </div>
          )}
        </div>

        {/* ACCORDION 02: Application Defaults */}
        <div
          style={{
            background: "#FFFFFF",
            borderRadius: "16px",
            border:
              expandedAccordion === "accordion-2"
                ? "2px solid #0D47A1"
                : "1px solid #E5E7EB",
            overflow: "hidden",
            boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
            transition: "background-color 0.2s ease, border-color 0.2s ease",
          }}
        >
          <div
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                (e.currentTarget as HTMLElement).click();
              }
            }}
            role="button"
            onClick={() =>
              setExpandedAccordion(
                expandedAccordion === "accordion-2" ? null : "accordion-2",
              )
            }
            style={{
              padding: "18px 20px",
              background:
                expandedAccordion === "accordion-2" ? "#F0F7FF" : "#FFFFFF",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              cursor: "pointer",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "12px",
              }}
            >
              <div
                style={{
                  width: "36px",
                  height: "36px",
                  borderRadius: "10px",
                  background: "#E3F2FD",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Building2 size={18} style={{ color: "#0D47A1" }} />
              </div>
              <div>
                <h3
                  style={{
                    fontFamily: PP,
                    fontSize: "15px",
                    fontWeight: 700,
                    color: "#111827",
                    margin: 0,
                  }}
                >
                  Application Defaults
                </h3>
                <p
                  style={{
                    fontSize: "12px",
                    color: "#64748B",
                    margin: "2px 0 0 0",
                  }}
                >
                  Configure basic HMS application defaults.
                </p>
              </div>
            </div>

            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "12px",
              }}
            >
              <span
                style={{
                  fontSize: "11px",
                  fontWeight: 600,
                  padding: "3px 8px",
                  borderRadius: "12px",
                  background: "#E8F5E9",
                  color: "#2E7D32",
                }}
              >
                Configured
              </span>
              {expandedAccordion === "accordion-2" ? (
                <ChevronDown size={18} style={{ color: "#0D47A1" }} />
              ) : (
                <ChevronRight size={18} style={{ color: "#94A3B8" }} />
              )}
            </div>
          </div>

          {expandedAccordion === "accordion-2" && (
            <div
              style={{
                padding: "20px",
                borderTop: "1px solid #E5E7EB",
                display: "flex",
                flexDirection: "column",
                gap: "16px",
              }}
            >
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr 1fr",
                  gap: "16px",
                }}
              >
                <div>
                  <span
                    style={{
                      display: "block",
                      fontSize: "12px",
                      fontWeight: 600,
                      color: "#374151",
                      marginBottom: "6px",
                    }}
                  >
                    Hospital Display Name *
                    <input
                      aria-label="Input field"
                      type="text"
                      value={generalSettings.hospitalDisplayName}
                      onChange={(e) =>
                        setGeneralSettings((prev) => ({
                          ...prev,
                          hospitalDisplayName: e.target.value,
                        }))
                      }
                      placeholder="St. Jude Multispecialty Hospital"
                      style={{
                        width: "100%",
                        padding: "9px 12px",
                        borderRadius: "8px",
                        border: "1px solid #D1D5DB",
                        fontSize: "13px",
                        boxSizing: "border-box",
                      }}
                    />
                  </span>
                </div>

                <div>
                  <span
                    style={{
                      display: "block",
                      fontSize: "12px",
                      fontWeight: 600,
                      color: "#374151",
                      marginBottom: "6px",
                    }}
                  >
                    Hospital Short Code *
                    <input
                      aria-label="Input field"
                      type="text"
                      value={generalSettings.hospitalShortCode}
                      onChange={(e) =>
                        setGeneralSettings((prev) => ({
                          ...prev,
                          hospitalShortCode: e.target.value,
                        }))
                      }
                      placeholder="SJH-01"
                      style={{
                        width: "100%",
                        padding: "9px 12px",
                        borderRadius: "8px",
                        border: "1px solid #D1D5DB",
                        fontSize: "13px",
                        boxSizing: "border-box",
                      }}
                    />
                  </span>
                </div>

                <div>
                  <span
                    style={{
                      display: "block",
                      fontSize: "12px",
                      fontWeight: 600,
                      color: "#374151",
                      marginBottom: "6px",
                    }}
                  >
                    Default Landing Dashboard
                    <select
                      aria-label="Select option"
                      value={generalSettings.defaultLandingDashboard}
                      onChange={(e) =>
                        setGeneralSettings((prev) => ({
                          ...prev,
                          defaultLandingDashboard: e.target.value,
                        }))
                      }
                      style={{
                        width: "100%",
                        padding: "9px 12px",
                        borderRadius: "8px",
                        border: "1px solid #D1D5DB",
                        fontSize: "13px",
                        background: "#FFFFFF",
                      }}
                    >
                      <option value="Super Admin Operations Center">
                        Super Admin Operations Center
                      </option>
                      <option value="Hospital Executive Summary">
                        Hospital Executive Summary
                      </option>
                      <option value="OPD Clinical Dashboard">
                        OPD Clinical Dashboard
                      </option>
                      <option value="Reception Counter Dashboard">
                        Reception Counter Dashboard
                      </option>
                    </select>
                  </span>
                </div>
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr 1fr",
                  gap: "16px",
                }}
              >
                <div>
                  <span
                    style={{
                      display: "block",
                      fontSize: "12px",
                      fontWeight: 600,
                      color: "#374151",
                      marginBottom: "6px",
                    }}
                  >
                    Default Working Shift
                    <select
                      aria-label="Select option"
                      value={generalSettings.defaultWorkingShift}
                      onChange={(e) =>
                        setGeneralSettings((prev) => ({
                          ...prev,
                          defaultWorkingShift: e.target.value,
                        }))
                      }
                      style={{
                        width: "100%",
                        padding: "9px 12px",
                        borderRadius: "8px",
                        border: "1px solid #D1D5DB",
                        fontSize: "13px",
                        background: "#FFFFFF",
                      }}
                    >
                      <option value="Morning (08:00 AM - 04:00 PM)">
                        Morning (08:00 AM - 04:00 PM)
                      </option>
                      <option value="Evening (04:00 PM - 12:00 AM)">
                        Evening (04:00 PM - 12:00 AM)
                      </option>
                      <option value="Night Shift (12:00 AM - 08:00 AM)">
                        Night Shift (12:00 AM - 08:00 AM)
                      </option>
                      <option value="24/7 Rotational Schedule">
                        24/7 Rotational Schedule
                      </option>
                    </select>
                  </span>
                </div>

                <div>
                  <span
                    style={{
                      display: "block",
                      fontSize: "12px",
                      fontWeight: 600,
                      color: "#374151",
                      marginBottom: "6px",
                    }}
                  >
                    Auto Logout Duration
                    <select
                      aria-label="Select option"
                      value={generalSettings.autoLogoutDuration}
                      onChange={(e) =>
                        setGeneralSettings((prev) => ({
                          ...prev,
                          autoLogoutDuration: e.target.value,
                        }))
                      }
                      disabled={!generalSettings.enableAutoLogout}
                      style={{
                        width: "100%",
                        padding: "9px 12px",
                        borderRadius: "8px",
                        border: "1px solid #D1D5DB",
                        fontSize: "13px",
                        background: "#FFFFFF",
                        opacity: generalSettings.enableAutoLogout ? 1 : 0.6,
                      }}
                    >
                      <option value="15 Minutes">
                        15 Minutes (HIPAA Standard)
                      </option>
                      <option value="30 Minutes">30 Minutes</option>
                      <option value="60 Minutes">60 Minutes</option>
                    </select>
                  </span>
                </div>
              </div>

              <div
                style={{
                  background: "#F8FAFC",
                  padding: "12px 14px",
                  borderRadius: "10px",
                  border: "1px solid #E2E8F0",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <div>
                  <div
                    style={{
                      fontSize: "13px",
                      fontWeight: 600,
                      color: "#111827",
                    }}
                  >
                    Enable Auto Logout
                  </div>
                  <div style={{ fontSize: "11px", color: "#64748B" }}>
                    Automatically locks workstation session after period of
                    inactivity
                  </div>
                </div>
                <input
                  aria-label="Toggle option"
                  type="checkbox"
                  checked={generalSettings.enableAutoLogout}
                  onChange={(e) =>
                    setGeneralSettings((prev) => ({
                      ...prev,
                      enableAutoLogout: e.target.checked,
                    }))
                  }
                  style={{
                    accentColor: "#0D47A1",
                    width: "18px",
                    height: "18px",
                    cursor: "pointer",
                  }}
                />
              </div>
            </div>
          )}
        </div>

        {/* ACCORDION 03: Operational Preferences */}
        <div
          style={{
            background: "#FFFFFF",
            borderRadius: "16px",
            border:
              expandedAccordion === "accordion-4"
                ? "2px solid #0D47A1"
                : "1px solid #E5E7EB",
            overflow: "hidden",
            boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
            transition: "background-color 0.2s ease, border-color 0.2s ease",
          }}
        >
          <div
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                (e.currentTarget as HTMLElement).click();
              }
            }}
            role="button"
            onClick={() =>
              setExpandedAccordion(
                expandedAccordion === "accordion-4" ? null : "accordion-4",
              )
            }
            style={{
              padding: "18px 20px",
              background:
                expandedAccordion === "accordion-4" ? "#F0F7FF" : "#FFFFFF",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              cursor: "pointer",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "12px",
              }}
            >
              <div
                style={{
                  width: "36px",
                  height: "36px",
                  borderRadius: "10px",
                  background: "#E8F5E9",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Clock size={18} style={{ color: "#2E7D32" }} />
              </div>
              <div>
                <h3
                  style={{
                    fontFamily: PP,
                    fontSize: "15px",
                    fontWeight: 700,
                    color: "#111827",
                    margin: 0,
                  }}
                >
                  Operational Preferences
                </h3>
                <p
                  style={{
                    fontSize: "12px",
                    color: "#64748B",
                    margin: "2px 0 0 0",
                  }}
                >
                  Configure operational defaults.
                </p>
              </div>
            </div>

            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "12px",
              }}
            >
              <span
                style={{
                  fontSize: "11px",
                  fontWeight: 600,
                  padding: "3px 8px",
                  borderRadius: "12px",
                  background: "#E8F5E9",
                  color: "#2E7D32",
                }}
              >
                Configured
              </span>
              {expandedAccordion === "accordion-4" ? (
                <ChevronDown size={18} style={{ color: "#0D47A1" }} />
              ) : (
                <ChevronRight size={18} style={{ color: "#94A3B8" }} />
              )}
            </div>
          </div>

          {expandedAccordion === "accordion-4" && (
            <div
              style={{
                padding: "20px",
                borderTop: "1px solid #E5E7EB",
                display: "flex",
                flexDirection: "column",
                gap: "16px",
              }}
            >
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr 1fr",
                  gap: "16px",
                }}
              >
                <div>
                  <span
                    style={{
                      display: "block",
                      fontSize: "12px",
                      fontWeight: 600,
                      color: "#374151",
                      marginBottom: "6px",
                    }}
                  >
                    Default Appointment Duration
                    <select
                      aria-label="Select option"
                      value={generalSettings.defaultApptDuration}
                      onChange={(e) =>
                        setGeneralSettings((prev) => ({
                          ...prev,
                          defaultApptDuration: e.target.value,
                        }))
                      }
                      style={{
                        width: "100%",
                        padding: "9px 12px",
                        borderRadius: "8px",
                        border: "1px solid #D1D5DB",
                        fontSize: "13px",
                        background: "#FFFFFF",
                      }}
                    >
                      <option value="15 Minutes">15 Minutes</option>
                      <option value="20 Minutes">20 Minutes</option>
                      <option value="30 Minutes">30 Minutes (Standard)</option>
                      <option value="45 Minutes">45 Minutes</option>
                    </select>
                  </span>
                </div>

                <div>
                  <span
                    style={{
                      display: "block",
                      fontSize: "12px",
                      fontWeight: 600,
                      color: "#374151",
                      marginBottom: "6px",
                    }}
                  >
                    Queue Token Prefix
                    <input
                      aria-label="Input field"
                      type="text"
                      value={generalSettings.queueTokenPrefix}
                      onChange={(e) =>
                        setGeneralSettings((prev) => ({
                          ...prev,
                          queueTokenPrefix: e.target.value,
                        }))
                      }
                      placeholder="OPD"
                      style={{
                        width: "100%",
                        padding: "9px 12px",
                        borderRadius: "8px",
                        border: "1px solid #D1D5DB",
                        fontSize: "13px",
                        boxSizing: "border-box",
                      }}
                    />
                  </span>
                </div>

                <div>
                  <span
                    style={{
                      display: "block",
                      fontSize: "12px",
                      fontWeight: 600,
                      color: "#374151",
                      marginBottom: "6px",
                    }}
                  >
                    Default Patient Search Mode
                    <select
                      aria-label="Select option"
                      value={generalSettings.defaultPatientSearchMode}
                      onChange={(e) =>
                        setGeneralSettings((prev) => ({
                          ...prev,
                          defaultPatientSearchMode: e.target.value,
                        }))
                      }
                      style={{
                        width: "100%",
                        padding: "9px 12px",
                        borderRadius: "8px",
                        border: "1px solid #D1D5DB",
                        fontSize: "13px",
                        background: "#FFFFFF",
                      }}
                    >
                      <option value="MRN / Name">MRN / Name (Instant)</option>
                      <option value="Phone Number">Phone Number</option>
                      <option value="National Identity ID">
                        National Identity ID
                      </option>
                    </select>
                  </span>
                </div>
              </div>

              <div
                style={{
                  background: "#F8FAFC",
                  padding: "12px 14px",
                  borderRadius: "10px",
                  border: "1px solid #E2E8F0",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <div>
                  <div
                    style={{
                      fontSize: "13px",
                      fontWeight: 600,
                      color: "#111827",
                    }}
                  >
                    Enable Confirmation Dialogs
                  </div>
                  <div style={{ fontSize: "11px", color: "#64748B" }}>
                    Prompts safety confirmation before saving critical record
                    changes
                  </div>
                </div>
                <input
                  aria-label="Toggle option"
                  type="checkbox"
                  checked={generalSettings.enableConfirmationDialogs}
                  onChange={(e) =>
                    setGeneralSettings((prev) => ({
                      ...prev,
                      enableConfirmationDialogs: e.target.checked,
                    }))
                  }
                  style={{
                    accentColor: "#0D47A1",
                    width: "18px",
                    height: "18px",
                    cursor: "pointer",
                  }}
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* RECENT CONFIGURATION ACTIVITY TIMELINE */}
      <div
        style={{
          background: "#FFFFFF",
          borderRadius: "16px",
          border: "1px solid #E5E7EB",
          padding: "20px",
          boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: "16px",
          }}
        >
          <h3
            style={{
              fontFamily: PP,
              fontSize: "16px",
              fontWeight: 700,
              color: "#111827",
              margin: 0,
              display: "flex",
              alignItems: "center",
              gap: "8px",
            }}
          >
            <Clock size={18} style={{ color: "#0D47A1" }} /> Recent
            Configuration Activity
          </h3>
          <span style={{ fontSize: "11px", color: "#64748B" }}>
            Audit Event Trail
          </span>
        </div>

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "12px",
          }}
        >
          {[
            {
              user: "Super Admin (Dr. Rajesh)",
              date: "26/07/2026",
              time: "10:15 AM",
              action: "Hospital Name Updated",
              status: "Success",
            },
            {
              user: "Admin (Sarah Jenkins)",
              date: "25/07/2026",
              time: "04:30 PM",
              action: "Theme Changed to Light Mode",
              status: "Updated",
            },
            {
              user: "Super Admin (Dr. Rajesh)",
              date: "24/07/2026",
              time: "11:00 AM",
              action: "Timezone Updated to Asia/Kolkata",
              status: "Success",
            },
            {
              user: "Security Auditor",
              date: "23/07/2026",
              time: "02:15 PM",
              action: "Session Timeout Modified to 15 Minutes",
              status: "Configured",
            },
            {
              user: "Admin (Sarah Jenkins)",
              date: "22/07/2026",
              time: "09:45 AM",
              action: "Date Format Updated to DD/MM/YYYY",
              status: "Updated",
            },
          ].map((act) => (
            <div
              key={act.action}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "12px 14px",
                borderRadius: "10px",
                background: "#F8FAFC",
                border: "1px solid #E2E8F0",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                }}
              >
                <div
                  style={{
                    width: "32px",
                    height: "32px",
                    borderRadius: "8px",
                    background: "#E3F2FD",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  <Sliders size={16} style={{ color: "#0D47A1" }} />
                </div>
                <div>
                  <div
                    style={{
                      fontSize: "13px",
                      fontWeight: 600,
                      color: "#111827",
                    }}
                  >
                    {act.action}
                  </div>
                  <div
                    style={{
                      fontSize: "11px",
                      color: "#64748B",
                      marginTop: "2px",
                    }}
                  >
                    User: <strong>{act.user}</strong>
                  </div>
                </div>
              </div>

              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "16px",
                }}
              >
                <span style={{ fontSize: "11px", color: "#94A3B8" }}>
                  {act.date} • {act.time}
                </span>
                <span
                  style={{
                    fontSize: "10px",
                    fontWeight: 600,
                    padding: "2px 8px",
                    borderRadius: "4px",
                    background: "#E8F5E9",
                    color: "#2E7D32",
                  }}
                >
                  {act.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* CONFIGURATION SUMMARY CARD (In normal flow) */}
      <div
        style={{
          background: "#FFFFFF",
          borderRadius: "16px",
          border: "1px solid #E5E7EB",
          padding: "20px",
          boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
        }}
      >
        <h3
          style={{
            fontFamily: PP,
            fontSize: "15px",
            fontWeight: 700,
            color: "#111827",
            margin: "0 0 14px 0",
            display: "flex",
            alignItems: "center",
            gap: "8px",
          }}
        >
          <CheckCircle2 size={18} style={{ color: "#009688" }} /> General
          Configuration Summary
        </h3>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(5, 1fr)",
            gap: "16px",
            background: "#F8FAFC",
            padding: "16px",
            borderRadius: "12px",
            border: "1px solid #E2E8F0",
          }}
        >
          <div>
            <span
              style={{
                fontSize: "11px",
                color: "#64748B",
                display: "block",
              }}
            >
              Total Settings
            </span>
            <span
              style={{
                fontFamily: PP,
                fontSize: "18px",
                fontWeight: 700,
                color: "#111827",
              }}
            >
              18 Parameters
            </span>
          </div>
          <div>
            <span
              style={{
                fontSize: "11px",
                color: "#64748B",
                display: "block",
              }}
            >
              Configured
            </span>
            <span
              style={{
                fontFamily: PP,
                fontSize: "18px",
                fontWeight: 700,
                color: "#2E7D32",
              }}
            >
              17 Parameters
            </span>
          </div>
          <div>
            <span
              style={{
                fontSize: "11px",
                color: "#64748B",
                display: "block",
              }}
            >
              Pending
            </span>
            <span
              style={{
                fontFamily: PP,
                fontSize: "18px",
                fontWeight: 700,
                color: "#B45309",
              }}
            >
              1 Parameter
            </span>
          </div>
          <div>
            <span
              style={{
                fontSize: "11px",
                color: "#64748B",
                display: "block",
              }}
            >
              Last Updated
            </span>
            <span
              style={{
                fontFamily: PP,
                fontSize: "14px",
                fontWeight: 600,
                color: "#111827",
              }}
            >
              Today, 10:15 AM
            </span>
          </div>
          <div>
            <span
              style={{
                fontSize: "11px",
                color: "#64748B",
                display: "block",
              }}
            >
              Updated By
            </span>
            <span
              style={{
                fontFamily: PP,
                fontSize: "14px",
                fontWeight: 600,
                color: "#0D47A1",
              }}
            >
              Super Admin
            </span>
          </div>
        </div>
      </div>

      {/* RESET WARNING MODAL */}
      {showResetWarning && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(15,23,42,0.4)",
            backdropFilter: "blur(4px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 110,
            padding: "20px",
          }}
        >
          <div
            style={{
              background: "#FFFFFF",
              borderRadius: "16px",
              maxWidth: "440px",
              width: "100%",
              padding: "24px",
              boxShadow: "0 20px 25px -5px rgba(0,0,0,0.1)",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "12px",
                marginBottom: "14px",
              }}
            >
              <div
                style={{
                  width: "40px",
                  height: "40px",
                  borderRadius: "10px",
                  background: "#FEF3C7",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                <AlertTriangle size={20} style={{ color: "#B45309" }} />
              </div>
              <div>
                <h3
                  style={{
                    fontFamily: PP,
                    fontSize: "16px",
                    fontWeight: 700,
                    margin: 0,
                    color: "#111827",
                  }}
                >
                  Reset General Settings?
                </h3>
                <span style={{ fontSize: "11px", color: "#64748B" }}>
                  Confirmation Required
                </span>
              </div>
            </div>

            <p
              style={{
                fontSize: "13px",
                color: "#475569",
                lineHeight: "1.5",
                margin: "0 0 20px 0",
              }}
            >
              Are you sure you want to reset all General Settings parameters
              back to default system values? Any unsaved regional, display, and
              operational changes will be discarded.
            </p>

            <div
              style={{
                display: "flex",
                justifyContent: "flex-end",
                gap: "10px",
              }}
            >
              <button
                onClick={() => setShowResetWarning(false)}
                style={{
                  padding: "8px 16px",
                  borderRadius: "8px",
                  border: "1px solid #E5E7EB",
                  background: "#FFFFFF",
                  color: "#64748B",
                  fontSize: "13px",
                  fontWeight: 500,
                  cursor: "pointer",
                }}
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setGeneralSettings({
                    defaultLanguage: "English",
                    timezone: "Asia/Kolkata (IST - UTC +05:30)",
                    dateFormat: "DD/MM/YYYY",
                    timeFormat: "12 Hour",
                    weekStartsOn: "Monday",
                    hospitalDisplayName: "St. Jude Multispecialty Hospital",
                    hospitalShortCode: "SJH-01",
                    defaultLandingDashboard: "Super Admin Operations Center",
                    defaultWorkingShift: "Morning (08:00 AM - 04:00 PM)",
                    enableAutoLogout: true,
                    autoLogoutDuration: "15 Minutes",
                    compactTableView: false,
                    enableAnimations: true,
                    showBreadcrumbs: true,
                    enableTooltips: true,
                    defaultTheme: "Light",
                    defaultApptDuration: "30 Minutes",
                    queueTokenPrefix: "OPD",
                    defaultPatientSearchMode: "MRN / Name",
                    enableConfirmationDialogs: true,
                  });
                  setShowResetWarning(false);
                  onSave("Settings reset to default values");
                }}
                style={{
                  padding: "8px 18px",
                  borderRadius: "8px",
                  border: "none",
                  background: "#EF4444",
                  color: "#FFFFFF",
                  fontSize: "13px",
                  fontWeight: 600,
                  cursor: "pointer",
                  boxShadow: "0 2px 4px rgba(239,68,68,0.2)",
                }}
              >
                Reset All Settings
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
});
