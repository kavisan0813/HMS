import { RotateCcw, Save, Settings as SettingsIcon } from "lucide-react";

const PP = "'Poppins', system-ui, sans-serif";

interface SettingsPageHeaderProps {
  onReset?: () => void;
  onSave?: () => void;
}

export function SettingsPageHeader({
  onReset = () => {},
  onSave = () => {},
}: SettingsPageHeaderProps) {
  return (
    <div
      style={{
        borderBottom: "1px solid #E5E7EB",
        padding: "20px 24px",
      }}
    >
      <div
        style={{
          width: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              fontSize: "12px",
              color: "#64748B",
              marginBottom: "6px",
            }}
          >
           
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
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
              <SettingsIcon size={20} style={{ color: "#0D47A1" }} />
            </div>
            <div>
              <h1
                style={{
                  fontFamily: PP,
                  fontSize: "22px",
                  fontWeight: 700,
                  color: "#111827",
                  margin: 0,
                }}
              >
                General Settings
              </h1>
              <p
                style={{
                  fontSize: "12px",
                  color: "#64748B",
                  margin: "2px 0 0 0",
                }}
              >
                Configure hospital-wide default application preferences used
                throughout the HMS.
              </p>
            </div>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <button
            onClick={onReset}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              padding: "9px 16px",
              borderRadius: "8px",
              border: "1px solid #E5E7EB",
              background: "#FFFFFF",
              color: "#374151",
              fontSize: "13px",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            <RotateCcw size={14} style={{ color: "#64748B" }} /> Reset
          </button>
          <button
            onClick={onSave}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              padding: "9px 20px",
              borderRadius: "8px",
              border: "none",
              background: "#0D47A1",
              color: "#FFFFFF",
              fontSize: "13px",
              fontWeight: 600,
              cursor: "pointer",
              boxShadow: "0 2px 4px rgba(13,71,161,0.2)",
            }}
          >
            <Save size={14} /> Save Changes
          </button>
        </div>
      </div>
    </div>
  );
}
