const handlePrint = () => {
  window.print();
};

const formatDateTime = (dateStr?: string | null) => {
  if (!dateStr) return "N/A";
  try {
    return new Date(dateStr).toLocaleString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch (err) {
    console.log(err);
    return dateStr;
  }
};

const getDoseString = (dose?: PrescriptionMedicationItem["dose"]) => {
  if (!dose) return "—";
  if (typeof dose === "string") return dose;
  if (typeof dose === "object") {
    return `${dose.value ?? ""} ${dose.unit ?? ""}`.trim() || "—";
  }
  return "—";
};

const getFrequencyString = (freq?: PrescriptionMedicationItem["frequency"]) => {
  if (!freq) return "—";
  if (typeof freq === "string") return freq;
  if (typeof freq === "object") {
    return freq.display || freq.code || "—";
  }
  return "—";
};

const getDurationString = (
  duration?: PrescriptionMedicationItem["duration"],
) => {
  if (!duration) return "—";
  if (typeof duration === "string") return duration;
  if (typeof duration === "object") {
    return `${duration.value ?? ""} ${duration.unit ?? ""}`.trim() || "—";
  }
  return "—";
};

const getQuantityString = (qty?: PrescriptionMedicationItem["quantity"]) => {
  if (!qty && qty !== 0) return "—";
  if (typeof qty === "string" || typeof qty === "number") return String(qty);
  if (typeof qty === "object") {
    return `${qty.value ?? ""} ${qty.unit ?? ""}`.trim() || "—";
  }
  return "—";
};

const getStatusBadge = (status?: string) => {
  const s = String(status || "DRAFT").toUpperCase();
  if (s === "FINALIZED" || s === "ISSUED" || s === "COMPLETED") {
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
        <CheckCircle2 size={13} />
        {s}
      </span>
    );
  }
  if (s === "CANCELLED" || s === "VOIDED") {
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
        <FileWarning size={13} />
        {s}
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
      <Clock size={13} />
      {s}
    </span>
  );
};

import React from "react";
import { useParams, useNavigate } from "react-router";
import {
  FileText,
  Printer,
  ChevronRight,
  ArrowLeft,
  User,
  Stethoscope,
  Clock,
  CheckCircle2,
  FileWarning,
  AlertCircle,
  Pill,
  RefreshCw,
  Info,
} from "lucide-react";
import { useEncounterPrescription } from "../hooks/useEncounterPrescription";
import type { PrescriptionMedicationItem } from "../types/prescription.types";

const PP = "'Poppins', system-ui, sans-serif";
const RB = "'Roboto', system-ui, sans-serif";

export const EncounterPrescriptionPage: React.FC = () => {
  const { encounterId } = useParams<{ encounterId: string }>();
  const navigate = useNavigate();

  const {
    data: prescription,
    isLoading,
    isError,
    error,
    refetch,
  } = useEncounterPrescription(encounterId, {
    enabled: Boolean(encounterId),
  });

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col font-sans">
      {/* Stylesheet for printing */}
      <style>{`
        @media print {
          body {
            background: white !important;
            color: black !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          body > :not(#printable-prescription-page) {
            display: none !important;
          }
          #printable-prescription-page {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            padding: 0 !important;
            margin: 0 !important;
          }
          .no-print {
            display: none !important;
          }
          .print-page-break {
            page-break-inside: avoid;
          }
        }
      `}</style>

      {/* Top Navigation Bar */}
      <div className="bg-white border-b border-slate-200 px-6 py-4 sticky top-0 z-30 shadow-xs no-print">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="space-y-1">
            <div
              className="flex items-center gap-2 text-xs text-slate-500 font-medium"
              style={{ fontFamily: RB }}
            >
              <button
                onClick={() => navigate(-1)}
                className="hover:text-[#0D47A1] flex items-center gap-1 cursor-pointer"
              >
                <ArrowLeft size={13} /> Back
              </button>
              <ChevronRight size={12} />
              <button
                type="button"
                className="hover:text-[#0D47A1] cursor-pointer"
                onClick={() => navigate("/prescriptions")}
              >
                Prescriptions
              </button>
              <ChevronRight size={12} />
              <span className="text-[#0D47A1] font-semibold">
                Encounter ENC-{encounterId}
              </span>
            </div>
            <h1
              className="text-xl font-bold text-slate-800 tracking-tight flex items-center gap-2"
              style={{ fontFamily: PP }}
            >
              <FileText size={20} className="text-[#009688]" />
              Official Prescription Details
            </h1>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate(-1)}
              className="px-4 py-2 border border-slate-200 text-slate-600 hover:bg-slate-50 rounded-xl text-xs font-bold transition-colors cursor-pointer"
              style={{ fontFamily: PP }}
            >
              Close & Exit
            </button>
            <button
              onClick={handlePrint}
              disabled={isLoading || !prescription}
              className="inline-flex items-center gap-2 px-5 py-2 bg-[#0D47A1] hover:bg-[#0a3880] text-white rounded-xl text-xs font-bold transition-opacity shadow-sm cursor-pointer disabled:opacity-50"
              style={{ fontFamily: PP }}
            >
              <Printer size={15} />
              Print Prescription
            </button>
          </div>
        </div>
      </div>

      {/* Main Page Content */}
      <div
        id="printable-prescription-page"
        className="max-w-5xl w-full mx-auto p-4 sm:p-6 lg:p-8 flex-1 space-y-6 text-xs"
        style={{ fontFamily: RB }}
      >
        {/* Loading State */}
        {isLoading && (
          <div className="py-24 text-center space-y-3 bg-white rounded-3xl p-8 border border-slate-100 shadow-sm">
            <div className="w-10 h-10 border-3 border-[#009688] border-t-transparent rounded-full animate-spin mx-auto" />
            <div
              className="text-sm font-bold text-slate-800"
              style={{ fontFamily: PP }}
            >
              Loading Prescription Record...
            </div>
            <p className="text-xs text-slate-500">
              Retrieving prescription for encounter ENC-{encounterId}...
            </p>
          </div>
        )}

        {/* Error State */}
        {isError && !isLoading && (
          <div className="p-6 bg-red-50 border border-red-200 rounded-3xl space-y-3 shadow-sm">
            <div className="flex items-center gap-2.5 text-red-700 font-bold text-sm">
              <AlertCircle size={18} />
              Failed to Retrieve Prescription
            </div>
            <p className="text-xs text-red-600">
              {error instanceof Error
                ? error.message
                : "Unable to load prescription data from the server."}
            </p>
            <button
              onClick={() => refetch()}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
              style={{ fontFamily: PP }}
            >
              <RefreshCw size={13} /> Retry Loading
            </button>
          </div>
        )}

        {/* Empty State */}
        {!isLoading && !isError && !prescription && (
          <div className="py-16 text-center space-y-3 bg-white rounded-3xl border border-slate-100 p-8 shadow-sm">
            <Info size={36} className="text-slate-400 mx-auto" />
            <div
              className="text-base font-bold text-slate-700"
              style={{ fontFamily: PP }}
            >
              No Prescription Record Found
            </div>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              No prescription has been generated or finalized for encounter ENC-
              {encounterId}.
            </p>
          </div>
        )}

        {/* Prescription Loaded View */}
        {!isLoading && !isError && prescription && (
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-sm space-y-6">
            {/* Header Print Top Banner */}
            <div className="hidden print:flex items-center justify-between border-b-2 border-[#0D47A1] pb-4 mb-4">
              <div>
                <h1
                  className="text-2xl font-black text-[#0D47A1] tracking-tight uppercase"
                  style={{ fontFamily: PP }}
                >
                  METROPOLITAN HEALTH HOSPITAL
                </h1>
                <p className="text-xs text-slate-500">
                  Official Outpatient Medical Prescription & EMR Record
                </p>
              </div>
              <div className="text-right">
                <span className="font-mono text-sm font-bold text-[#0D47A1] block">
                  {prescription.prescriptionId || `RX-${prescription.id}`}
                </span>
                <span className="text-[10px] text-slate-500">
                  ENC-
                  {prescription.encounterNumber ||
                    prescription.encounterId ||
                    encounterId}
                </span>
              </div>
            </div>

            {/* Key Metadata Strip */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-200/70">
              <div>
                <span className="text-[10px] font-bold uppercase text-slate-400 block tracking-wider">
                  Prescription ID
                </span>
                <span className="font-mono font-bold text-xs sm:text-sm text-[#0D47A1]">
                  {prescription.prescriptionId ||
                    `RX-${prescription.id || "N/A"}`}
                </span>
                {prescription.id && (
                  <span className="text-[10px] text-slate-400 block">
                    (Record #{prescription.id})
                  </span>
                )}
              </div>

              <div>
                <span className="text-[10px] font-bold uppercase text-slate-400 block tracking-wider">
                  Encounter Number
                </span>
                <span className="font-mono font-bold text-xs sm:text-sm text-slate-800">
                  {prescription.encounterNumber ||
                    `ENC-${prescription.encounterId || encounterId}`}
                </span>
                <span className="text-[10px] text-slate-400 block">
                  ID: {prescription.encounterId || encounterId}
                </span>
              </div>

              <div>
                <span className="text-[10px] font-bold uppercase text-slate-400 block tracking-wider">
                  Prescription Status
                </span>
                <div className="mt-0.5">
                  {getStatusBadge(prescription.status)}
                </div>
              </div>

              <div>
                <span className="text-[10px] font-bold uppercase text-slate-400 block tracking-wider">
                  Version / Outcome
                </span>
                <span className="font-semibold text-xs text-slate-800 block">
                  v{prescription.currentVersion ?? 1}{" "}
                  {prescription.amendedFromVersion && (
                    <span className="text-[10px] text-amber-600 font-normal">
                      (Amended from v{prescription.amendedFromVersion})
                    </span>
                  )}
                </span>
                <span className="text-[10px] text-slate-500 truncate block">
                  {prescription.outcome || "MEDICATION_PRESCRIBED"}
                </span>
              </div>
            </div>

            {/* 2-Column Info: Patient & Prescriber Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Patient Information Card */}
              <div className="p-4 bg-slate-50/70 rounded-2xl border border-slate-200/80 space-y-2.5">
                <div className="flex items-center gap-2 text-slate-800 border-b border-slate-200/80 pb-2">
                  <User size={15} className="text-[#0D47A1]" />
                  <h3
                    className="text-xs font-bold text-slate-800 uppercase tracking-wider"
                    style={{ fontFamily: PP }}
                  >
                    Patient Profile
                  </h3>
                </div>
                <div className="grid grid-cols-2 gap-y-2 text-xs">
                  <span className="text-slate-500 font-medium">Full Name:</span>
                  <span className="font-bold text-slate-800">
                    {prescription.patient?.fullName || "N/A"}
                  </span>

                  <span className="text-slate-500 font-medium">MRN:</span>
                  <span className="font-mono font-bold text-[#0D47A1]">
                    {prescription.patient?.mrn || "N/A"}
                  </span>

                  <span className="text-slate-500 font-medium">
                    Age / Gender:
                  </span>
                  <span className="font-medium text-slate-700">
                    {prescription.patient?.age
                      ? `${prescription.patient.age} Yrs`
                      : "N/A"}{" "}
                    / {prescription.patient?.gender || "N/A"}
                  </span>
                </div>
              </div>

              {/* Prescriber / Doctor Information Card */}
              <div className="p-4 bg-slate-50/70 rounded-2xl border border-slate-200/80 space-y-2.5">
                <div className="flex items-center gap-2 text-slate-800 border-b border-slate-200/80 pb-2">
                  <Stethoscope size={15} className="text-[#009688]" />
                  <h3
                    className="text-xs font-bold text-slate-800 uppercase tracking-wider"
                    style={{ fontFamily: PP }}
                  >
                    Attending Prescriber
                  </h3>
                </div>
                <div className="grid grid-cols-2 gap-y-2 text-xs">
                  <span className="text-slate-500 font-medium">
                    Doctor Name:
                  </span>
                  <span className="font-bold text-slate-800">
                    {prescription.prescriber?.fullName || "Attending Physician"}
                  </span>

                  <span className="text-slate-500 font-medium">
                    Doctor ID / Code:
                  </span>
                  <span className="font-mono text-slate-700">
                    {prescription.prescriber?.doctorId || "N/A"}
                  </span>

                  <span className="text-slate-500 font-medium">
                    Registration No:
                  </span>
                  <span className="font-mono font-medium text-slate-700">
                    {prescription.prescriber?.registrationNumber ||
                      "MCI / State Council"}
                  </span>

                  <span className="text-slate-500 font-medium">
                    Department:
                  </span>
                  <span className="font-semibold text-slate-700">
                    {prescription.prescriber?.department || "OPD Services"}
                  </span>
                </div>
              </div>
            </div>

            {/* Prescribed Medications Section */}
            <div className="space-y-3">
              <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-teal-50 text-[#009688] rounded-lg">
                    <Pill size={15} />
                  </div>
                  <h3
                    className="text-xs font-bold text-slate-800 uppercase tracking-wider"
                    style={{ fontFamily: PP }}
                  >
                    Prescribed Medications (
                    {prescription.medications?.length || 0})
                  </h3>
                </div>
              </div>

              {prescription.medications &&
              prescription.medications.length > 0 ? (
                <div className="overflow-x-auto rounded-2xl border border-slate-200 shadow-xs">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr
                        className="bg-slate-50 text-[11px] font-bold text-slate-600 uppercase border-b border-slate-200 tracking-wider"
                        style={{ fontFamily: PP }}
                      >
                        <th className="py-2.5 px-3 w-8">#</th>
                        <th className="py-2.5 px-3">Medicine & Strength</th>
                        <th className="py-2.5 px-3">Route</th>
                        <th className="py-2.5 px-3">Dosage</th>
                        <th className="py-2.5 px-3">Frequency</th>
                        <th className="py-2.5 px-3">Duration</th>
                        <th className="py-2.5 px-3">Qty</th>
                        <th className="py-2.5 px-3">Instructions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 bg-white">
                      {prescription.medications.map((med, idx) => (
                        <tr
                          key={
                            med.medicationId ||
                            med.medicineId ||
                            `med-${med.medicineName}-${med.dose || ""}`
                          }
                          className="hover:bg-slate-50/50 transition-colors"
                        >
                          <td className="py-3 px-3 font-mono text-slate-400">
                            {med.displayOrder ?? idx + 1}
                          </td>
                          <td className="py-3 px-3">
                            <div className="font-bold text-slate-800">
                              {med.medicineName}
                            </div>
                            <div className="text-[10px] text-slate-500">
                              {med.strength && (
                                <span className="font-medium text-slate-600">
                                  {med.strength}
                                </span>
                              )}
                              {med.form && ` • ${med.form}`}
                            </div>
                          </td>
                          <td className="py-3 px-3 text-slate-600 font-medium">
                            {med.route || "ORAL"}
                          </td>
                          <td className="py-3 px-3 font-semibold text-slate-700">
                            {getDoseString(med.dose)}
                          </td>
                          <td className="py-3 px-3 font-bold text-[#0D47A1]">
                            {getFrequencyString(med.frequency)}
                          </td>
                          <td className="py-3 px-3 font-medium text-slate-600">
                            {getDurationString(med.duration)}
                          </td>
                          <td className="py-3 px-3 font-mono font-medium text-slate-700">
                            {getQuantityString(med.quantity)}
                          </td>
                          <td className="py-3 px-3 text-slate-600 italic">
                            {med.instructions || "As directed by physician"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="p-4 bg-slate-50 rounded-xl border border-dashed border-slate-200 text-center text-slate-500 text-xs">
                  No medications prescribed in this session (Advice /
                  Observation only).
                </div>
              )}
            </div>

            {/* Advice & Follow-Up Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 print-page-break">
              {/* Clinical Advice */}
              <div className="p-4 bg-slate-50/70 rounded-2xl border border-slate-200/80 space-y-3">
                <h3
                  className="text-xs font-bold text-slate-800 uppercase tracking-wider border-b border-slate-200/80 pb-2"
                  style={{ fontFamily: PP }}
                >
                  Clinical & Dietary Advice
                </h3>
                <div className="space-y-2 text-xs">
                  <div>
                    <span className="text-[11px] font-bold text-slate-500 block">
                      General Advice:
                    </span>
                    <p className="text-slate-800 mt-0.5">
                      {prescription.advice?.general ||
                        "Follow physician instructions and maintain hydration."}
                    </p>
                  </div>

                  {prescription.advice?.diet && (
                    <div>
                      <span className="text-[11px] font-bold text-slate-500 block">
                        Diet & Lifestyle:
                      </span>
                      <p className="text-slate-800 mt-0.5">
                        {prescription.advice.diet}
                      </p>
                    </div>
                  )}

                  {prescription.advice?.precautions && (
                    <div>
                      <span className="text-[11px] font-bold text-slate-500 block">
                        Precautions:
                      </span>
                      <p className="text-slate-800 mt-0.5">
                        {prescription.advice.precautions}
                      </p>
                    </div>
                  )}

                  {prescription.advice?.additionalInstructions && (
                    <div>
                      <span className="text-[11px] font-bold text-slate-500 block">
                        Additional Notes:
                      </span>
                      <p className="text-slate-800 mt-0.5">
                        {prescription.advice.additionalInstructions}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Follow-up Instructions */}
              <div className="p-4 bg-slate-50/70 rounded-2xl border border-slate-200/80 space-y-3">
                <h3
                  className="text-xs font-bold text-slate-800 uppercase tracking-wider border-b border-slate-200/80 pb-2"
                  style={{ fontFamily: PP }}
                >
                  Follow-Up Instructions
                </h3>
                <div className="space-y-2.5 text-xs">
                  {prescription.followUp?.followUpDate ? (
                    <div className="p-3 bg-amber-50 rounded-xl border border-amber-200">
                      <span className="text-[11px] font-bold text-amber-800 block">
                        Next Recommended Visit Date:
                      </span>
                      <span className="font-mono font-bold text-sm text-amber-900 block mt-0.5">
                        {prescription.followUp.followUpDate}
                      </span>
                    </div>
                  ) : prescription.followUp?.intervalValue ? (
                    <div className="p-3 bg-amber-50 rounded-xl border border-amber-200">
                      <span className="text-[11px] font-bold text-amber-800 block">
                        Recommended Follow-up Interval:
                      </span>
                      <span className="font-bold text-xs text-amber-900 block mt-0.5">
                        After {prescription.followUp.intervalValue}{" "}
                        {prescription.followUp.intervalUnit || "Days"}
                      </span>
                    </div>
                  ) : (
                    <div className="text-slate-500 italic">
                      Follow up as needed or if symptoms persist.
                    </div>
                  )}

                  {prescription.followUp?.instructions && (
                    <div>
                      <span className="text-[11px] font-bold text-slate-500 block">
                        Instructions:
                      </span>
                      <p className="text-slate-800 mt-0.5">
                        {prescription.followUp.instructions}
                      </p>
                    </div>
                  )}

                  {prescription.followUp?.type && (
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] text-slate-400">
                        Review Type:
                      </span>
                      <span className="font-medium text-slate-700">
                        {prescription.followUp.type}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Audit Timestamps Strip */}
            <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100 grid grid-cols-1 sm:grid-cols-3 gap-2 text-[11px] text-slate-500">
              <div>
                <span className="font-semibold text-slate-600 block">
                  Created At:
                </span>
                <span>{formatDateTime(prescription.createdAt)}</span>
              </div>
              <div>
                <span className="font-semibold text-slate-600 block">
                  Last Updated:
                </span>
                <span>{formatDateTime(prescription.updatedAt)}</span>
              </div>
              <div>
                <span className="font-semibold text-slate-600 block">
                  Finalized At:
                </span>
                <span className="font-semibold text-slate-700">
                  {prescription.finalizedAt
                    ? formatDateTime(prescription.finalizedAt)
                    : "Pending Finalization / N/A"}
                </span>
              </div>
            </div>

            {/* Signature Line for Print */}
            <div className="hidden print:block pt-16 border-t border-slate-100 text-right">
              <div className="inline-block border-t border-slate-400 pt-2 w-56 text-center">
                <p className="text-xs font-bold text-slate-800">
                  {prescription.prescriber?.fullName || "Dr. Pradeep Kumar"}
                </p>
                <p className="text-[10px] text-slate-500 font-mono">
                  Reg No:{" "}
                  {prescription.prescriber?.registrationNumber || "MCI-45612"}
                </p>
                <p className="text-[10px] text-slate-400">
                  Authorized Medical Practitioner
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
