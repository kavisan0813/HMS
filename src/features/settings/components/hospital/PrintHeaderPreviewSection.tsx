import { Printer } from "lucide-react";
import type { HospitalInformationForm } from "../../types/settings.types";

const PP = "'Poppins', system-ui, sans-serif";

interface PrintHeaderPreviewSectionProps {
  form: HospitalInformationForm;
}

export function PrintHeaderPreviewSection({
  form,
}: PrintHeaderPreviewSectionProps) {
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
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: "14px",
        }}
      >
        <h3
          style={{
            fontFamily: PP,
            fontSize: "15px",
            fontWeight: 700,
            color: "#111827",
            margin: 0,
            display: "flex",
            alignItems: "center",
            gap: "8px",
          }}
        >
          <Printer size={18} style={{ color: "#0D47A1" }} /> Section 05: Live
          Invoice & Print Header Preview
        </h3>
        <span
          style={{
            fontSize: "11px",
            color: "#64748B",
            background: "#F1F5F9",
            padding: "3px 8px",
            borderRadius: "4px",
            fontWeight: 600,
          }}
        >
          Standard Header Output
        </span>
      </div>

      <p style={{ fontSize: "12px", color: "#64748B", margin: "0 0 16px 0" }}>
        This official header will automatically populate across all Invoices,
        Prescriptions, Lab Reports, Receipts, and Official Medical Certificates.
      </p>

      {/* Live Document Header Box */}
      <div
        style={{
          background: "#FFFFFF",
          borderRadius: "12px",
          border: "2px solid #0D47A1",
          padding: "20px",
          boxShadow: "0 4px 12px rgba(0,0,0,0.04)",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            borderBottom: "2px solid #E5E7EB",
            paddingBottom: "14px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
            <div
              style={{
                width: "52px",
                height: "52px",
                borderRadius: "10px",
                background: "#0D47A1",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#FFFFFF",
                fontWeight: 800,
                fontFamily: PP,
                fontSize: "20px",
              }}
            >
              SHH
            </div>
            <div>
              <h4
                style={{
                  fontFamily: PP,
                  fontSize: "18px",
                  fontWeight: 800,
                  color: "#0D47A1",
                  margin: 0,
                }}
              >
                {form.hospitalName}
              </h4>
              <div
                style={{
                  fontSize: "11px",
                  fontWeight: 600,
                  color: "#009688",
                  marginTop: "2px",
                }}
              >
                {form.hospitalTagline}
              </div>
              <div
                style={{
                  fontSize: "10px",
                  color: "#64748B",
                  marginTop: "2px",
                }}
              >
                Reg No: {form.registrationNumber} | License:{" "}
                {form.licenseNumber}
              </div>
            </div>
          </div>

          <div
            style={{
              textAlign: "right",
              fontSize: "11px",
              color: "#475569",
              lineHeight: "1.4",
            }}
          >
            <div>
              <strong>{form.addressLine1}</strong>
            </div>
            <div>
              {form.city}, {form.state} - {form.postalCode}
            </div>
            <div>Phone: {form.primaryPhone}</div>
            <div>Email: {form.officialEmail}</div>
            <div>Website: {form.website}</div>
          </div>
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            paddingTop: "10px",
            fontSize: "10px",
            color: "#94A3B8",
            fontWeight: 500,
          }}
        >
          <span>NABH & JCI Accredited Hospital</span>
          <span>24/7 Emergency Helpline: {form.emergencyPhone}</span>
        </div>
      </div>
    </div>
  );
}
