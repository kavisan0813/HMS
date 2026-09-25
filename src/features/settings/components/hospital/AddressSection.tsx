import { MapPin } from "lucide-react";
import type { HospitalInformationForm } from "../../types/settings.types";

const PP = "'Poppins', system-ui, sans-serif";

interface AddressSectionProps {
  form: HospitalInformationForm;
  errors: Record<string, string>;
  onChange: (field: string, value: string | boolean | number) => void;
}

export function AddressSection({ form, onChange }: AddressSectionProps) {
  return (
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
          margin: "0 0 16px 0",
          display: "flex",
          alignItems: "center",
          gap: "8px",
        }}
      >
        <MapPin size={18} style={{ color: "#0D47A1" }} /> Section 03: Hospital
        Address & Location
      </h3>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "16px",
        }}
      >
        <div style={{ gridColumn: "span 2" }}>
          <span
            style={{
              display: "block",
              fontSize: "12px",
              fontWeight: 600,
              color: "#374151",
              marginBottom: "6px",
            }}
          >
            Address Line 1 *
            <input
              aria-label="Input field"
              type="text"
              value={form.addressLine1}
              onChange={(e) => onChange("addressLine1", e.target.value)}
              style={{
                width: "100%",
                padding: "10px 12px",
                borderRadius: "8px",
                border: "1px solid #D1D5DB",
                fontSize: "13px",
                boxSizing: "border-box",
              }}
            />
          </span>
        </div>

        <div style={{ gridColumn: "span 2" }}>
          <span
            style={{
              display: "block",
              fontSize: "12px",
              fontWeight: 600,
              color: "#374151",
              marginBottom: "6px",
            }}
          >
            Address Line 2 (Building / Suite / Landmark)
            <input
              aria-label="Input field"
              type="text"
              value={form.addressLine2}
              onChange={(e) => onChange("addressLine2", e.target.value)}
              style={{
                width: "100%",
                padding: "10px 12px",
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
            City
            <input
              aria-label="Input field"
              type="text"
              value={form.city}
              onChange={(e) => onChange("city", e.target.value)}
              style={{
                width: "100%",
                padding: "10px 12px",
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
            District
            <input
              aria-label="Input field"
              type="text"
              value={form.district}
              onChange={(e) => onChange("district", e.target.value)}
              style={{
                width: "100%",
                padding: "10px 12px",
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
            State / Province
            <input
              aria-label="Input field"
              type="text"
              value={form.state}
              onChange={(e) => onChange("state", e.target.value)}
              style={{
                width: "100%",
                padding: "10px 12px",
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
            Country
            <input
              aria-label="Input field"
              type="text"
              value={form.country}
              onChange={(e) => onChange("country", e.target.value)}
              style={{
                width: "100%",
                padding: "10px 12px",
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
            Postal / Zip Code
            <input
              aria-label="Input field"
              type="text"
              value={form.postalCode}
              onChange={(e) => onChange("postalCode", e.target.value)}
              style={{
                width: "100%",
                padding: "10px 12px",
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
            Google Map Embed URL
            <input
              aria-label="Input field"
              type="text"
              value={form.mapUrl}
              onChange={(e) => onChange("mapUrl", e.target.value)}
              style={{
                width: "100%",
                padding: "10px 12px",
                borderRadius: "8px",
                border: "1px solid #D1D5DB",
                fontSize: "13px",
                boxSizing: "border-box",
              }}
            />
          </span>
        </div>
      </div>

      {/* Location Map Preview Placeholder */}
      <div
        style={{
          marginTop: "16px",
          background: "#F1F5F9",
          borderRadius: "12px",
          padding: "16px",
          border: "1px dashed #CBD5E1",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "8px",
          color: "#64748B",
          fontSize: "12px",
        }}
      >
      </div>
    </div>
  );
}
