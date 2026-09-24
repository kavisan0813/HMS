import { useQuery } from "@tanstack/react-query";
import {
  X,
  Printer,
  Pill,
  Calendar,
  AlertTriangle,
  User,
  Building2,
  Loader2,
  CheckCircle2,
} from "lucide-react";
import { PP, RB } from "../../../doctors/constants/doctors.constants";
import { patientsApi } from "../../api/patient.api";
import { prescriptionApi } from "../../../prescriptions/api/prescription.api";
import type {
  Patient,
  ApiPatientPrescription,
} from "../../types/patient.types";
import type { PrescriptionDetailResponse } from "../../../prescriptions/api/prescription.api";

interface PrescriptionDetailsModalProps {
  prescriptionId: string | number | null;
  initialData?: ApiPatientPrescription | null;
  patient: Patient;
  isOpen: boolean;
  onClose: () => void;
}

/**
 * Robust formatter to ensure no raw nested objects (e.g. {value, unit}, {code, display})
 * are ever passed directly to JSX as React children.
 */
function formatField(val: unknown, fallback: string = "—"): string {
  if (val == null) return fallback;
  if (
    typeof val === "string" ||
    typeof val === "number" ||
    typeof val === "boolean"
  ) {
    const s = String(val).trim();
    if (!s || s === "[object Object]") return fallback;
    return s;
  }
  if (typeof val === "object") {
    const obj = val as Record<string, unknown>;
    if ("display" in obj && obj.display != null && String(obj.display).trim()) {
      const res = String(obj.display).trim();
      if (res !== "[object Object]") return res;
    }
    if ("value" in obj && obj.value != null && String(obj.value).trim()) {
      const v = String(obj.value).trim();
      const u = obj.unit ? ` ${String(obj.unit).trim()}` : "";
      const res = `${v}${u}`.trim();
      if (res && res !== "[object Object]") return res;
    }
    if (
      "fullName" in obj &&
      obj.fullName != null &&
      String(obj.fullName).trim()
    )
      return String(obj.fullName).trim();
    if (
      "doctorName" in obj &&
      obj.doctorName != null &&
      String(obj.doctorName).trim()
    )
      return String(obj.doctorName).trim();
    if (
      "departmentName" in obj &&
      obj.departmentName != null &&
      String(obj.departmentName).trim()
    )
      return String(obj.departmentName).trim();
    if ("name" in obj && obj.name != null && String(obj.name).trim()) {
      const res = String(obj.name).trim();
      if (res !== "[object Object]") return res;
    }
    if ("title" in obj && obj.title != null && String(obj.title).trim())
      return String(obj.title).trim();
    if ("text" in obj && obj.text != null && String(obj.text).trim())
      return String(obj.text).trim();
    if ("code" in obj && obj.code != null && String(obj.code).trim())
      return String(obj.code).trim();
    if (
      "followUpDate" in obj &&
      obj.followUpDate != null &&
      String(obj.followUpDate).trim()
    )
      return String(obj.followUpDate).trim();
    if ("department" in obj && obj.department != null) {
      return formatField(obj.department, fallback);
    }
    if ("doctor" in obj && obj.doctor != null) {
      return formatField(obj.doctor, fallback);
    }
    if (Array.isArray(val)) {
      return (
        val
          .flatMap((item) => {
            const formatted = formatField(item, "");
            return formatted ? [formatted] : [];
          })
          .join(", ") || fallback
      );
    }
  }
  return fallback;
}

export function PrescriptionDetailsModal({
  prescriptionId,
  initialData,
  patient,
  isOpen,
  onClose,
}: PrescriptionDetailsModalProps) {
  const { data: details, isLoading } = useQuery({
    queryKey: ["prescription", "details", prescriptionId],
    queryFn: async () => {
      if (!prescriptionId) return null;
      try {
        const full =
          await prescriptionApi.getPrescriptionDetails(prescriptionId);
        if (full) return full;
      } catch (err) {
        console.log(err);
        // continue
      }
      try {
        const fallback = await patientsApi.getPrescriptionById(
          String(prescriptionId),
        );
        if (fallback) {
          return {
            prescriptionId: fallback.id,
            doctorName: fallback.doctorName,
            department: fallback.department,
            status: fallback.status,
            createdAt: fallback.date,
            medicines: fallback.medicines,
            followUp: fallback.followUpDate
              ? { followUpDate: fallback.followUpDate }
              : undefined,
          } as PrescriptionDetailResponse;
        }
      } catch (err) {
        console.log(err);
        // continue
      }
      return null;
    },
    enabled: Boolean(isOpen && prescriptionId),
  });

  if (!isOpen || !prescriptionId) return null;

  const detObj = (details as unknown as Record<string, unknown>) || {};
  const initObj = (initialData as unknown as Record<string, unknown>) || {};
  const patObj = (patient as unknown as Record<string, unknown>) || {};
  const detPatObj = (detObj?.patient as Record<string, unknown>) || {};
  const initPatObj = (initObj?.patient as Record<string, unknown>) || {};

  // Safe formatting for header & metadata
  const idStr = formatField(
    details?.prescriptionNumber ||
      details?.prescriptionId ||
      initialData?.id ||
      prescriptionId,
    "Prescription",
  );
  const rawDoctor =
    details?.doctorName ||
    (detObj?.doctorName as string) ||
    detObj?.doctor ||
    initialData?.doctorName ||
    (initObj?.doctorName as string) ||
    initObj?.doctor;

  const doctorName = formatField(rawDoctor, "Doctor");

  const rawDepartment =
    details?.department ||
    (detObj?.department as unknown) ||
    (detObj?.departmentName as string) ||
    initialData?.department ||
    (initObj?.department as unknown) ||
    (initObj?.departmentName as string);

  const department = formatField(rawDepartment, "General Medicine");
  const issueDateRaw =
    details?.finalizedAt ||
    details?.createdAt ||
    (detObj?.issueDate as string) ||
    (detObj?.date as string) ||
    initialData?.date;

  const dateStr = issueDateRaw
    ? new Date(issueDateRaw as string | number | Date).toLocaleDateString(
        "en-GB",
        {
          day: "2-digit",
          month: "short",
          year: "numeric",
        },
      )
    : new Date().toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
  const status = formatField(details?.status || initialData?.status, "Issued");
  const medicines = (details?.medicines ||
    initialData?.medicines ||
    []) as unknown as Array<Record<string, unknown>>;
  const diagnosis = formatField(
    details?.outcome ||
      detObj?.diagnosis ||
      detObj?.provisionalDiagnosis ||
      detObj?.finalDiagnosis ||
      detObj?.clinicalNotes ||
      initObj?.diagnosis ||
      initObj?.provisionalDiagnosis ||
      initObj?.finalDiagnosis,
    "",
  );
  const icdCode = formatField(
    detObj?.icdCode ||
      detObj?.icd10Code ||
      initObj?.icdCode ||
      initObj?.icd10Code,
    "",
  );
  const followUpObj = (detObj?.followUp as Record<string, unknown>) || {};
  const followUpDate = formatField(
    followUpObj.followUpDate || detObj?.followUp || initialData?.followUpDate,
    "",
  );
  const bloodGroup = String(
    patObj?.bloodGroup ||
      patObj?.blood_group ||
      detObj?.bloodGroup ||
      detObj?.blood_group ||
      detPatObj?.bloodGroup ||
      detPatObj?.blood_group ||
      initObj?.bloodGroup ||
      initObj?.blood_group ||
      initPatObj?.bloodGroup ||
      "",
  ).trim();
  const advice = detObj?.advice as Record<string, unknown> | undefined;

  const handlePrint = () => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      window.print();
      return;
    }

    const medsRows = medicines
      .map((m: Record<string, unknown>, idx: number) => {
        const medName = formatField(
          m.medicineName || m.name,
          `Medication #${idx + 1}`,
        );
        const dose = formatField(m.dosage || m.dose, "—");
        const freq = formatField(m.frequency, "—");
        const dur = formatField(m.duration, "—");
        const inst = formatField(m.instructions, "As directed");
        return `
          <tr>
            <td style="padding: 10px 12px; border-bottom: 1px solid #F1F5F9; font-weight: 800; color: #0F172A;">${medName}</td>
            <td style="padding: 10px 12px; border-bottom: 1px solid #F1F5F9;">${dose}</td>
            <td style="padding: 10px 12px; border-bottom: 1px solid #F1F5F9; color: #0D47A1; font-weight: 700;">${freq}</td>
            <td style="padding: 10px 12px; border-bottom: 1px solid #F1F5F9;">${dur}</td>
            <td style="padding: 10px 12px; border-bottom: 1px solid #F1F5F9; color: #64748B; font-style: italic;">${inst}</td>
          </tr>
        `;
      })
      .join("");

    const printContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8"/>
        <title>Prescription_${idStr}</title>
        <style>
          body { font-family: 'Helvetica Neue', Arial, sans-serif; padding: 24px; color: #1E293B; background: #FFF; }
          .container { max-width: 800px; margin: 0 auto; border: 2px solid #0D47A1; border-radius: 16px; padding: 32px; }
          .header { border-bottom: 2px solid #E2E8F0; padding-bottom: 16px; margin-bottom: 20px; display: flex; justify-content: space-between; align-items: center; }
          .hospital-title { font-size: 22px; font-weight: 800; color: #0D47A1; text-transform: uppercase; margin: 0; }
          .hospital-sub { font-size: 11px; color: #64748B; margin-top: 4px; }
          .badge { background: #0D47A1; color: #FFF; padding: 6px 14px; border-radius: 20px; font-size: 12px; font-weight: 700; font-family: monospace; }
          .meta-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; background: #F8FAFC; padding: 14px; border-radius: 12px; font-size: 12px; margin-bottom: 20px; border: 1px solid #E2E8F0; }
          .section-title { font-size: 12px; font-weight: 800; color: #0D47A1; text-transform: uppercase; border-bottom: 1px solid #E2E8F0; padding-bottom: 6px; margin: 20px 0 12px; }
          .notes-box { background: #EFF6FF; border-left: 4px solid #0D47A1; padding: 12px 16px; border-radius: 6px; font-size: 12px; margin-bottom: 20px; color: #1E293B; }
          table { width: 100%; border-collapse: collapse; font-size: 12px; margin-top: 8px; }
          th { background: #F1F5F9; color: #475569; font-weight: 700; text-transform: uppercase; font-size: 10px; padding: 8px 12px; text-align: left; border-bottom: 1px solid #E2E8F0; }
          @media print {
            body { padding: 0; }
            .container { border: none; padding: 0; max-width: 100%; }
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div>
              <h1 class="hospital-title">SafeHands Hospital</h1>
              <div class="hospital-sub">Outpatient Department (OPD) · Official Medical Prescription</div>
            </div>
            <div class="badge">${idStr}</div>
          </div>

          <div class="meta-grid">
            <div>
              <div style="font-weight: bold; font-size: 13px; color: #0F172A; margin-bottom: 4px;">${patient.fullName || patient.name || "Patient"}</div>
              <div>MRN: <span style="font-family: monospace; color: #0D47A1; font-weight: bold;">${patient.mrn}</span></div>
              <div>Age / Gender: ${patient.age ?? "—"} Y / ${patient.gender || "—"}</div>
              <div>Blood Group: <strong style="color: #DC2626;">${bloodGroup || "Not Specified"}</strong></div>
            </div>
            <div style="text-align: right;">
              <div style="font-weight: bold; font-size: 13px; color: #0F172A; margin-bottom: 4px;">${doctorName}</div>
              <div style="color: #009688; font-weight: 600;">${department}</div>
              <div style="color: #64748B;">Issue Date: ${dateStr}</div>
              <div style="color: #16A34A; font-weight: bold; margin-top: 2px;">Status: ${status}</div>
            </div>
          </div>

          ${
            diagnosis || icdCode
              ? `
            <div class="section-title">Clinical Examination & Diagnosis</div>
            <div class="notes-box">
              ${diagnosis ? `<div><strong>Diagnosis / Clinical Findings:</strong> <span style="font-weight: 800; color: #0D47A1;">${diagnosis}</span></div>` : ""}
              ${icdCode ? `<div style="margin-top: 6px; font-family: monospace;"><strong>ICD Code:</strong> <span style="background: #DBEAFE; color: #1E40AF; padding: 2px 8px; border-radius: 4px; font-weight: bold;">${icdCode}</span></div>` : ""}
            </div>
          `
              : ""
          }

          <div class="section-title">Prescribed Medications (Rx)</div>
          ${
            medicines.length === 0
              ? '<p style="font-size: 12px; color: #64748B; font-style: italic;">No medications listed.</p>'
              : `
            <table>
              <thead>
                <tr>
                  <th>Medicine Name</th>
                  <th>Dosage</th>
                  <th>Frequency</th>
                  <th>Duration</th>
                  <th>Instructions</th>
                </tr>
              </thead>
              <tbody>
                ${medsRows}
              </tbody>
            </table>
          `
          }

          ${
            advice
              ? `
            <div class="section-title">Advice & Special Instructions</div>
            <div style="font-size: 12px; background: #FFFBEB; padding: 12px; border-radius: 8px; border: 1px solid #FDE68A; color: #78350F;">
              ${advice.general ? `<div style="margin-bottom: 4px;"><strong>General:</strong> ${formatField(advice.general, "")}</div>` : ""}
              ${advice.diet ? `<div style="margin-bottom: 4px;"><strong>Diet:</strong> ${formatField(advice.diet, "")}</div>` : ""}
              ${advice.precautions ? `<div><strong>Precautions:</strong> ${formatField(advice.precautions, "")}</div>` : ""}
            </div>
          `
              : ""
          }

          ${
            followUpDate
              ? `
            <div style="margin-top: 20px; padding: 12px; background: #F0FDF4; border: 1px solid #BBF7D0; border-radius: 8px; font-size: 12px; color: #166534; font-weight: bold;">
              Scheduled Follow-up Date: ${followUpDate}
            </div>
          `
              : ""
          }

          <div style="margin-top: 36px; padding-top: 16px; border-top: 1px solid #E2E8F0; text-align: right; font-size: 11px; color: #64748B;">
            <div style="width: 160px; border-bottom: 1px solid #94A3B8; margin: 0 0 4px auto;"></div>
            <div>Authorized Medical Practitioner Signature</div>
          </div>
        </div>

        <script>
          window.onload = function() {
            window.print();
            setTimeout(function() { window.close(); }, 500);
          };
        </script>
      </body>
      </html>
    `;

    printWindow.document.write(printContent);
    printWindow.document.close();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs transition-opacity duration-150">
      <div
        className="bg-white rounded-2xl border border-[#E5E7EB] shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden transition-transform duration-200"
        style={{ fontFamily: RB }}
      >
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-[#E5E7EB] flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center">
              <Pill size={18} />
            </div>
            <div>
              <span className="text-[10px] font-bold text-purple-700 uppercase tracking-wider block">
                Prescription Details
              </span>
              <h3
                className="text-sm font-bold text-[#111827]"
                style={{ fontFamily: PP }}
              >
                {idStr}
              </h3>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span
              className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold border ${
                status === "Issued" ||
                status === "FINALIZED" ||
                status === "Completed"
                  ? "bg-emerald-50 text-[#66BB6A] border-emerald-200"
                  : "bg-slate-100 text-slate-700 border-slate-200"
              }`}
            >
              {status}
            </span>
            <button
              aria-label="Close"
              onClick={onClose}
              className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Modal Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-12 text-slate-400 gap-2">
              <Loader2 className="animate-spin text-[#0D47A1]" size={24} />
              <span className="text-xs">Loading prescription details...</span>
            </div>
          ) : (
            <>
              {/* Patient & Doctor Meta */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4 bg-slate-50 rounded-xl border border-slate-100 text-xs">
                <div className="space-y-1">
                  <div className="flex items-center gap-1.5 font-bold text-[#111827]">
                    <User size={13} className="text-[#0D47A1]" />
                    <span>{patient.fullName || patient.name || "Patient"}</span>
                  </div>
                  <div className="text-[11px] text-slate-500 font-mono">
                    MRN: {patient.mrn} · {patient.age ?? 0} Y /{" "}
                    {patient.gender || "Unknown"}
                    {bloodGroup && (
                      <>
                        {" "}
                        · Blood:{" "}
                        <strong className="text-red-600 font-bold">
                          {bloodGroup}
                        </strong>
                      </>
                    )}
                  </div>
                  {patient.phone && (
                    <div className="text-[11px] text-slate-500">
                      Phone: {patient.phone}
                    </div>
                  )}
                </div>

                <div className="space-y-1 sm:text-right">
                  <div className="flex items-center gap-1.5 font-bold text-[#111827] sm:justify-end">
                    <Building2 size={13} className="text-[#009688]" />
                    <span>{doctorName}</span>
                  </div>
                  <div className="text-[11px] text-slate-500">{department}</div>
                  <div className="text-[11px] text-slate-500 flex items-center gap-1 sm:justify-end">
                    <Calendar size={11} />
                    <span>Issue Date: {dateStr}</span>
                  </div>
                </div>
              </div>

              {/* Diagnosis if available */}
              {(diagnosis || icdCode) && (
                <div className="p-3 bg-blue-50/50 rounded-xl border border-blue-100 text-xs space-y-1">
                  <span className="text-[10px] font-bold text-[#0D47A1] uppercase tracking-wider block mb-1">
                    Diagnosis / Clinical Notes
                  </span>
                  {diagnosis && (
                    <div className="text-slate-700 font-medium">
                      {diagnosis}
                    </div>
                  )}
                  {icdCode && (
                    <div className="text-[11px] text-slate-500 font-mono">
                      ICD Code:{" "}
                      <span className="font-bold text-[#0D47A1]">
                        {icdCode}
                      </span>
                    </div>
                  )}
                </div>
              )}

              {/* Medications Table */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h4
                    className="text-xs font-bold text-[#111827] uppercase tracking-wider flex items-center gap-1.5"
                    style={{ fontFamily: PP }}
                  >
                    <Pill size={14} className="text-purple-600" /> Prescribed
                    Medications ({medicines.length})
                  </h4>
                </div>

                {medicines.length === 0 ? (
                  <div className="text-center py-6 bg-slate-50 rounded-xl text-xs text-slate-400">
                    No individual medications listed for this prescription.
                  </div>
                ) : (
                  <div className="border border-[#E5E7EB] rounded-xl overflow-hidden">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead className="bg-slate-50 text-slate-600 font-bold border-b border-[#E5E7EB]">
                        <tr>
                          <th className="py-2.5 px-3">Medicine</th>
                          <th className="py-2.5 px-3">Dosage</th>
                          <th className="py-2.5 px-3">Frequency</th>
                          <th className="py-2.5 px-3">Duration</th>
                          <th className="py-2.5 px-3">Instructions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {medicines.map(
                          (m: Record<string, unknown>, idx: number) => {
                            const medName = formatField(
                              m.medicineName || m.name,
                              `Medication #${idx + 1}`,
                            );
                            const strengthStr = formatField(m.strength, "");
                            const strength = strengthStr
                              ? ` (${strengthStr})`
                              : "";
                            const dose = formatField(m.dosage || m.dose, "—");
                            const freq = formatField(m.frequency, "—");
                            const dur = formatField(m.duration, "—");
                            const inst = formatField(
                              m.instructions,
                              "As directed",
                            );

                            return (
                              <tr
                                key={
                                  (m.id as string) ||
                                  (m.medicineName as string) ||
                                  (m.name as string) ||
                                  medName
                                }
                                className="hover:bg-slate-50/50"
                              >
                                <td className="py-2.5 px-3 font-semibold text-[#111827]">
                                  {medName}
                                  {strength && (
                                    <span className="text-slate-400 font-normal">
                                      {strength}
                                    </span>
                                  )}
                                </td>
                                <td className="py-2.5 px-3 text-slate-600 font-medium">
                                  {dose}
                                </td>
                                <td className="py-2.5 px-3 text-slate-600 font-medium">
                                  {freq}
                                </td>
                                <td className="py-2.5 px-3 text-slate-600 font-medium">
                                  {dur}
                                </td>
                                <td className="py-2.5 px-3 text-slate-500 italic text-[11px]">
                                  {inst}
                                </td>
                              </tr>
                            );
                          },
                        )}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Advice & Instructions */}
              {advice &&
                Boolean(
                  advice.general || advice.diet || advice.precautions,
                ) && (
                  <div className="p-3 bg-amber-50/60 rounded-xl border border-amber-100 text-xs space-y-1.5">
                    <div className="flex items-center gap-1.5 text-amber-800 font-bold">
                      <AlertTriangle size={13} />
                      <span>Doctor&apos;s Advice &amp; Precautions</span>
                    </div>
                    {Boolean(advice.general) && (
                      <div className="text-amber-900">
                        <span className="font-semibold">General:</span>{" "}
                        {formatField(advice.general, "")}
                      </div>
                    )}
                    {Boolean(advice.diet) && (
                      <div className="text-amber-900">
                        <span className="font-semibold">Diet:</span>{" "}
                        {formatField(advice.diet, "")}
                      </div>
                    )}
                    {Boolean(advice.precautions) && (
                      <div className="text-amber-900">
                        <span className="font-semibold">Precautions:</span>{" "}
                        {formatField(advice.precautions, "")}
                      </div>
                    )}
                  </div>
                )}

              {/* Follow-up Note */}
              {followUpDate && (
                <div className="flex items-center gap-2 p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-700">
                  <CheckCircle2 size={15} className="text-[#009688]" />
                  <span>
                    <strong className="text-[#111827]">
                      Scheduled Follow-up:
                    </strong>{" "}
                    {followUpDate}
                  </span>
                </div>
              )}
            </>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3.5 border-t border-[#E5E7EB] bg-slate-50 flex items-center justify-between">
          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white border border-[#E5E7EB] text-slate-700 text-xs font-semibold hover:bg-slate-100 transition-colors shadow-xs"
          >
            <Printer size={14} />
            <span>Print Prescription</span>
          </button>
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-[#0D47A1] text-white text-xs font-bold hover:bg-[#0b3c88] transition-colors shadow-xs"
            style={{ fontFamily: PP }}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
