import React, { useEffect, useState } from "react";
import {
  X,
  Printer,
  ChevronRight,
  ChevronLeft,
  AlertTriangle,
} from "lucide-react";
import type { UnifiedPrescription } from "../types/prescription.types";
import { PrescriptionStatusBadge } from "./PrescriptionStatusBadge";
import { prescriptionService } from "../services/prescription.service";
import { useAuthStore } from "../../auth/store/auth.store";
import { usePatientPortal } from "../../patients/context/usePatientPortal";

const PP = "'Poppins', system-ui, sans-serif";
const RB = "'Roboto', system-ui, sans-serif";

const getDiagnosisString = (diag: unknown): string => {
  if (!diag) return "";
  if (typeof diag === "string") return diag.trim();
  if (typeof diag === "object" && diag !== null) {
    const d = diag as Record<string, unknown>;
    const res =
      (d.finalDiagnosis as string) ||
      (d.primaryDiagnosis as string) ||
      (d.diagnosis as string) ||
      (d.chiefComplaint as string) ||
      (d.clinicalFindings as string) ||
      (d.consultationNotes as string) ||
      (d.impression as string) ||
      (d.notes as string) ||
      (d.icdCode ? `ICD: ${d.icdCode}` : "");
    return res ? String(res).trim() : "";
  }
  return String(diag);
};

const safeStr = (val: unknown, fallback: string = ""): string => {
  if (val == null) return fallback;
  if (
    typeof val === "string" ||
    typeof val === "number" ||
    typeof val === "boolean"
  ) {
    const s = String(val).trim();
    return s || fallback;
  }
  if (typeof val === "object") {
    const obj = val as Record<string, unknown>;
    if ("display" in obj && obj.display != null)
      return String(obj.display).trim() || fallback;
    if ("value" in obj && obj.value != null) {
      const v = String(obj.value).trim();
      const u = obj.unit ? ` ${String(obj.unit).trim()}` : "";
      return `${v}${u}`.trim() || fallback;
    }
    if ("name" in obj && obj.name != null)
      return String(obj.name).trim() || fallback;
    if ("text" in obj && obj.text != null)
      return String(obj.text).trim() || fallback;
    if ("code" in obj && obj.code != null)
      return String(obj.code).trim() || fallback;
    if ("label" in obj && obj.label != null)
      return String(obj.label).trim() || fallback;
  }
  return fallback;
};

interface DetailsModalProps {
  prescription: UnifiedPrescription;
  onClose: () => void;
  onDownload: () => void;
}

export const PrescriptionDetailsModal: React.FC<DetailsModalProps> = ({
  prescription: initialPrescription,
  onClose,
}) => {
  const [prescriptionData, setPrescriptionData] =
    useState<UnifiedPrescription>(initialPrescription);

  useEffect(() => {
    let mounted = true;
    if (
      initialPrescription?.medicines &&
      initialPrescription.medicines.length > 0
    ) {
      return;
    }

    const rawEncId =
      initialPrescription?.encounterId || initialPrescription?.consultationId;
    const num = Number(rawEncId);

    if (num > 0 && num < 10000000000) {
      prescriptionService
        .getPrescriptionDetails(num)
        .then((res) => {
          if (mounted && res) {
            setPrescriptionData(res);
          }
        })
        .catch(() => null);
    }
    return () => {
      mounted = false;
    };
  }, [initialPrescription]);

  const user = useAuthStore((s) => s.user);
  const portal = usePatientPortal();
  const activePatient = portal?.activePatient;

  const prescription = prescriptionData || initialPrescription;
  const pRecord = prescription as unknown as Record<string, unknown>;
  const patientObj = (pRecord.patient as Record<string, unknown>) || {};
  const doctorObj = (pRecord.doctor as Record<string, unknown>) || {};
  const diagObj = (pRecord.diagnosis as Record<string, unknown>) || {};
  const adviceObj = (pRecord.advice as Record<string, unknown>) || {};
  const followUpObj =
    (pRecord.followUp as Record<string, unknown>) ||
    (pRecord.followup as Record<string, unknown>) ||
    {};

  const patientName = safeStr(
    prescription.patientName && prescription.patientName !== "Patient"
      ? prescription.patientName
      : patientObj.fullName || activePatient?.patientName || user?.fullName,
    "Patient",
  );
  const mrn = safeStr(
    prescription.mrn || patientObj.mrn || activePatient?.mrn || user?.patientId,
    "—",
  );
  const rxId = safeStr(prescription.id, "—");
  const uRecord = user as unknown as Record<string, unknown>;
  const age = safeStr(
    pRecord.age || patientObj.age || activePatient?.age || uRecord?.age,
    "—",
  );
  const gender = safeStr(
    pRecord.gender ||
      patientObj.gender ||
      activePatient?.gender ||
      user?.gender,
    "—",
  );
  const bloodGroup = safeStr(
    pRecord.bloodGroup ||
      patientObj.bloodGroup ||
      activePatient?.bloodGroup ||
      uRecord?.bloodGroup,
    "—",
  );
  const doctorName = safeStr(
    prescription.doctorName || doctorObj.fullName || doctorObj.doctorName,
    "—",
  );
  const department = safeStr(
    prescription.department || doctorObj.department,
    "—",
  );
  const rawConsultationDate = safeStr(
    prescription.consultationDate ||
      pRecord.visitDateTime ||
      pRecord.date ||
      pRecord.createdAt,
    "",
  );
  const consultationDate =
    rawConsultationDate && rawConsultationDate !== "—"
      ? (() => {
          try {
            const parsed = new Date(rawConsultationDate);
            return isNaN(parsed.getTime())
              ? rawConsultationDate
              : parsed.toLocaleDateString("en-GB", {
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
                });
          } catch {
            return rawConsultationDate;
          }
        })()
      : "—";

  const allergies = Array.isArray(pRecord.allergies)
    ? (pRecord.allergies as unknown[]).flatMap((a) => {
        const val = safeStr(a, "");
        return val ? [val] : [];
      })
    : Array.isArray(patientObj.allergies)
      ? (patientObj.allergies as unknown[]).flatMap((a) => {
          const val = safeStr(a, "");
          return val ? [val] : [];
        })
      : [];

  const chiefComplaint = safeStr(
    pRecord.chiefComplaint ||
      diagObj.chiefComplaint ||
      getDiagnosisString(prescription.diagnosis),
    "—",
  );
  const clinicalFindings = safeStr(
    pRecord.clinicalFindings || diagObj.clinicalFindings,
    "—",
  );
  const finalDiagnosis = safeStr(
    pRecord.finalDiagnosis ||
      diagObj.finalDiagnosis ||
      getDiagnosisString(prescription.diagnosis),
    "—",
  );
  const icdCode = safeStr(pRecord.icdCode || diagObj.icdCode, "—");
  const doctorNotes = safeStr(
    pRecord.doctorNotes || diagObj.doctorNotes || pRecord.notes,
    "—",
  );

  const dietAdvice = safeStr(
    pRecord.dietAdvice || adviceObj.diet || adviceObj.dietAdvice,
    "—",
  );
  const lifestyleAdvice = safeStr(
    pRecord.lifestyleAdvice || adviceObj.lifestyle || adviceObj.lifestyleAdvice,
    "—",
  );
  const exerciseAdvice = safeStr(
    pRecord.exerciseAdvice || adviceObj.exercise || adviceObj.exerciseAdvice,
    "—",
  );
  const specialInstructions = safeStr(
    pRecord.specialInstructions ||
      adviceObj.specialInstructions ||
      adviceObj.precautions ||
      adviceObj.generalAdvice ||
      adviceObj.general,
    "—",
  );

  const followupRequired =
    prescription.followup || followUpObj.required ? "Yes" : "No";
  const rawNextVisitDate = safeStr(
    prescription.followupDate ||
      followUpObj.nextVisitDate ||
      followUpObj.followUpDate,
    "",
  );
  const nextVisitDate =
    rawNextVisitDate && rawNextVisitDate !== "—"
      ? (() => {
          try {
            const parsed = new Date(rawNextVisitDate);
            return isNaN(parsed.getTime())
              ? rawNextVisitDate
              : parsed.toLocaleDateString("en-GB", {
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
                });
          } catch {
            return rawNextVisitDate;
          }
        })()
      : "—";
  const followupNotes = safeStr(
    pRecord.followupNotes || followUpObj.notes || followUpObj.instructions,
    "—",
  );

  return (
    <div
      className="flex-1 bg-[#F1F5F9] overflow-y-auto flex flex-col font-sans relative min-h-screen pb-20"
      style={{ fontFamily: RB }}
    >
      {/* Top Breadcrumb & Page Header */}
      <div className="bg-white border-b border-[#E5E7EB] px-6 py-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4 shrink-0">
        <div>
          <div
            className="flex items-center gap-2 text-xs text-[#64748B] mb-1"
            style={{ fontFamily: RB }}
          >
            <span>Patient Portal</span>
            <ChevronRight size={12} className="text-slate-400" />
            <span>My Prescriptions</span>
            <ChevronRight size={12} className="text-slate-400" />
            <span className="font-semibold text-[#0D47A1]">
              Prescription Details
            </span>
          </div>
          <div className="flex items-center gap-3">
            <h1
              className="text-xl sm:text-2xl font-bold text-[#111827]"
              style={{ fontFamily: PP }}
            >
              Prescription Details
            </h1>
            <PrescriptionStatusBadge status={prescription.status} />
          </div>
          <p
            className="text-xs text-[#64748B] mt-0.5"
            style={{ fontFamily: RB }}
          >
            View your prescription, medicines and follow-up instructions.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onClose}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-[#E5E7EB] bg-white text-[#111827] hover:bg-slate-50 text-xs font-semibold transition-colors shadow-xs cursor-pointer"
            style={{ fontFamily: PP }}
          >
            <ChevronLeft size={14} />
            Back
          </button>
          <button
            onClick={() => window.print()}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-[#E5E7EB] bg-white text-[#009688] hover:bg-teal-50 text-xs font-semibold transition-colors shadow-xs cursor-pointer"
            style={{ fontFamily: PP }}
          >
            <Printer size={14} />
            Print
          </button>
        </div>
      </div>

      {/* Patient Hero Header */}
      <div className="bg-white border-b border-[#E5E7EB] px-6 py-3 shadow-xs shrink-0">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          <div className="flex items-center gap-3 overflow-x-auto">
            <div
              className="w-10 h-10 rounded-full bg-blue-100 text-[#0D47A1] font-bold flex items-center justify-center text-sm shrink-0 border border-blue-200"
              style={{ fontFamily: PP }}
            >
              {patientName
                .split(" ")
                .map((n) => n[0])
                .join("")
                .slice(0, 2)}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span
                  className="font-bold text-sm text-[#111827]"
                  style={{ fontFamily: PP }}
                >
                  {patientName}
                </span>
                <span className="font-mono text-[10px] bg-blue-50 text-[#0D47A1] px-2 py-0.5 rounded font-bold">
                  {mrn}
                </span>
                <span className="font-mono text-[10px] bg-emerald-50 text-[#009688] px-2 py-0.5 rounded font-bold">
                  {rxId}
                </span>
              </div>
              <div
                className="flex items-center gap-3 text-xs text-[#64748B] mt-0.5 flex-wrap"
                style={{ fontFamily: RB }}
              >
                <span>
                  {age} yrs / {gender}
                </span>
                <span>•</span>
                <span>
                  Blood Group:{" "}
                  <strong className="text-[#111827]">{bloodGroup}</strong>
                </span>
                <span>•</span>
                <span>
                  Doctor:{" "}
                  <strong className="text-[#111827]">
                    {doctorName} ({department})
                  </strong>
                </span>
                <span>•</span>
                <span>
                  Consultation Date:{" "}
                  <strong className="text-[#111827]">{consultationDate}</strong>
                </span>
              </div>
            </div>

            {/* Allergy alert badge */}
            {allergies.length > 0 && (
              <div
                className="flex items-center gap-1.5 px-2.5 py-1 bg-red-50 text-red-600 border border-red-100 rounded-full text-[11px] font-semibold shrink-0"
                style={{ fontFamily: PP }}
              >
                <AlertTriangle size={13} />
                <span>Allergies: {allergies.join(", ")}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Full-width Content */}
      <div className="p-6 overflow-y-auto space-y-5 flex-1">
        <div className="space-y-5">
          {/* Section 01: Diagnosis Summary */}
          <div className="bg-white rounded-2xl border border-[#E5E7EB] p-5 shadow-xs space-y-4">
            <div className="flex items-center gap-2 mb-4 pb-3 border-b border-gray-100">
              <div className="w-6 h-6 rounded-md bg-blue-50 text-[#0D47A1] flex items-center justify-center font-bold text-xs">
                01
              </div>
              <h3
                className="text-sm font-bold text-[#111827]"
                style={{ fontFamily: PP }}
              >
                Diagnosis Summary
              </h3>
            </div>

            <div className="space-y-4 text-xs" style={{ fontFamily: RB }}>
              <div>
                <span
                  className="text-[10px] font-bold text-slate-400 uppercase block mb-0.5"
                  style={{ fontFamily: PP }}
                >
                  Chief Complaint
                </span>
                <p className="p-2.5 bg-slate-50 rounded-xl text-slate-800 font-medium border border-gray-100">
                  {chiefComplaint}
                </p>
              </div>

              <div>
                <span
                  className="text-[10px] font-bold text-slate-400 uppercase block mb-0.5"
                  style={{ fontFamily: PP }}
                >
                  Clinical Findings
                </span>
                <p className="p-2.5 bg-slate-50 rounded-xl text-slate-700 border border-gray-100">
                  {clinicalFindings}
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <span
                    className="text-[10px] font-bold text-slate-400 uppercase block mb-0.5"
                    style={{ fontFamily: PP }}
                  >
                    Final Diagnosis
                  </span>
                  <p className="p-2.5 bg-blue-50/50 rounded-xl font-bold text-[#111827] border border-blue-100">
                    {finalDiagnosis}
                  </p>
                </div>
                <div>
                  <span
                    className="text-[10px] font-bold text-slate-400 uppercase block mb-0.5"
                    style={{ fontFamily: PP }}
                  >
                    ICD-10 Code
                  </span>
                  <p className="p-2.5 bg-blue-50 text-[#0D47A1] rounded-xl font-mono font-bold border border-blue-100">
                    {icdCode}
                  </p>
                </div>
              </div>

              <div>
                <span
                  className="text-[10px] font-bold text-slate-400 uppercase block mb-0.5"
                  style={{ fontFamily: PP }}
                >
                  Doctor Notes
                </span>
                <p className="p-2.5 bg-slate-50 rounded-xl text-slate-700 italic border border-gray-100">
                  {doctorNotes}
                </p>
              </div>
            </div>
          </div>

          {/* Section 02: Medicine List Table */}
          <div className="bg-white rounded-2xl border border-[#E5E7EB] p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-md bg-teal-50 text-[#009688] flex items-center justify-center font-bold text-xs">
                  02
                </div>
                <h3
                  className="text-sm font-bold text-[#111827]"
                  style={{ fontFamily: PP }}
                >
                  Prescribed Medications
                </h3>
              </div>
              <span className="text-xs font-bold text-[#009688] bg-teal-50 px-2.5 py-1 rounded-full border border-teal-100">
                Total: {prescription.medicines.length} Medicines
              </span>
            </div>

            <div className="overflow-x-auto">
              <table
                className="w-full text-left border-collapse text-xs"
                style={{ fontFamily: RB }}
              >
                <thead>
                  <tr
                    className="bg-slate-50 border-b border-gray-200 text-[10px] font-bold text-slate-500 uppercase"
                    style={{ fontFamily: PP }}
                  >
                    <th className="p-2">Medicine Name</th>
                    <th className="p-2">Strength</th>
                    <th className="p-2">Route</th>
                    <th className="p-2">Dosage</th>
                    <th className="p-2">Frequency</th>
                    <th className="p-2">Duration</th>
                    <th className="p-2">Qty</th>
                    <th className="p-2">Instructions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {prescription.medicines.map((m) => {
                    const mObj = (
                      m && typeof m === "object" ? m : {}
                    ) as Record<string, unknown>;

                    const nameStr = safeStr(
                      m.name ||
                        mObj.medicineName ||
                        mObj.medicine ||
                        mObj.item ||
                        mObj.drugName,
                      "—",
                    );

                    const doseObj = mObj.dose as
                      | { value?: unknown; unit?: unknown }
                      | undefined;
                    const doseVal =
                      typeof mObj.dose === "object" && mObj.dose !== null
                        ? `${doseObj?.value ?? ""} ${doseObj?.unit ?? ""}`.trim()
                        : mObj.doseValue != null
                          ? `${mObj.doseValue} ${mObj.doseUnit || ""}`.trim()
                          : m.dosage ||
                            mObj.dosage ||
                            mObj.dose ||
                            mObj.strength;

                    const strengthStr = safeStr(
                      m.strength || mObj.strength || doseVal,
                      "—",
                    );

                    const routeStr = safeStr(
                      m.route || mObj.route || mObj.form,
                      "ORAL",
                    );

                    const dosageStr = safeStr(m.dosage || doseVal, "—");

                    const freqObj = mObj.frequency as
                      | { code?: unknown; display?: unknown }
                      | undefined;
                    const freqVal =
                      typeof mObj.frequency === "object" &&
                      mObj.frequency !== null
                        ? String(freqObj?.display || freqObj?.code || "")
                        : mObj.frequencyDisplay ||
                          mObj.frequencyCode ||
                          mObj.frequencyLabel ||
                          m.frequency ||
                          mObj.frequency;
                    const frequencyStr = safeStr(freqVal, "—");

                    const durObj = mObj.duration as
                      | { value?: unknown; unit?: unknown }
                      | undefined;
                    const durVal =
                      typeof mObj.duration === "object" &&
                      mObj.duration !== null
                        ? `${durObj?.value ?? ""} ${durObj?.unit ?? ""}`.trim()
                        : mObj.durationValue != null
                          ? `${mObj.durationValue} ${mObj.durationUnit || "DAYS"}`.trim()
                          : m.duration || mObj.duration;
                    const durationStr = safeStr(durVal, "—");

                    const qtyObj = mObj.quantity as
                      | { value?: unknown; unit?: unknown }
                      | undefined;
                    const qtyVal =
                      typeof mObj.quantity === "object" &&
                      mObj.quantity !== null
                        ? `${qtyObj?.value ?? ""} ${qtyObj?.unit ?? ""}`.trim()
                        : mObj.quantityValue != null
                          ? `${mObj.quantityValue} ${mObj.quantityUnit || ""}`.trim()
                          : m.quantity || mObj.quantity;
                    const qtyStr = safeStr(qtyVal, "—");

                    const instructionsStr = safeStr(
                      m.instructions ||
                        mObj.instructions ||
                        mObj.specialInstructions ||
                        mObj.notes,
                      "—",
                    );

                    return (
                      <tr
                        key={(mObj.id as string) || nameStr}
                        className="hover:bg-slate-50/50 transition-colors"
                      >
                        <td
                          className="p-2 font-bold text-[#111827]"
                          style={{ fontFamily: PP }}
                        >
                          {nameStr}
                        </td>
                        <td className="p-2 text-slate-700">{strengthStr}</td>
                        <td className="p-2 text-slate-600 font-mono text-[10px]">
                          {routeStr}
                        </td>
                        <td className="p-2 font-medium">{dosageStr}</td>
                        <td className="p-2 font-semibold text-[#0D47A1]">
                          {frequencyStr}
                        </td>
                        <td className="p-2 text-slate-600">{durationStr}</td>
                        <td className="p-2 font-mono font-medium">{qtyStr}</td>
                        <td className="p-2 text-slate-600 italic text-[11px]">
                          {instructionsStr}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Section 03: General Advice & Care Plan */}
          <div className="bg-white rounded-2xl border border-[#E5E7EB] p-5 shadow-xs space-y-4">
            <div className="flex items-center gap-2 mb-4 pb-3 border-b border-gray-100">
              <div className="w-6 h-6 rounded-md bg-purple-50 text-purple-700 flex items-center justify-center font-bold text-xs">
                03
              </div>
              <h3
                className="text-sm font-bold text-[#111827]"
                style={{ fontFamily: PP }}
              >
                General Advice & Care Plan
              </h3>
            </div>

            <div
              className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs"
              style={{ fontFamily: RB }}
            >
              <div className="p-3 bg-slate-50 rounded-xl border border-gray-100">
                <span
                  className="text-[10px] font-bold text-slate-400 uppercase block mb-1"
                  style={{ fontFamily: PP }}
                >
                  Diet Advice
                </span>
                <p className="text-slate-700">{dietAdvice}</p>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-gray-100">
                <span
                  className="text-[10px] font-bold text-slate-400 uppercase block mb-1"
                  style={{ fontFamily: PP }}
                >
                  Lifestyle Advice
                </span>
                <p className="text-slate-700">{lifestyleAdvice}</p>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-gray-100">
                <span
                  className="text-[10px] font-bold text-slate-400 uppercase block mb-1"
                  style={{ fontFamily: PP }}
                >
                  Exercise Advice
                </span>
                <p className="text-slate-700">{exerciseAdvice}</p>
              </div>
              <div className="p-3 bg-amber-50 rounded-xl border border-amber-200">
                <span
                  className="text-[10px] font-bold text-amber-800 uppercase block mb-1"
                  style={{ fontFamily: PP }}
                >
                  Special Instructions
                </span>
                <p className="text-amber-900 font-medium">
                  {specialInstructions}
                </p>
              </div>
            </div>
          </div>

          {/* Section 04: Follow-up Instructions */}
          <div className="bg-white rounded-2xl border border-[#E5E7EB] p-5 shadow-xs space-y-3">
            <div className="flex items-center gap-2 mb-3 pb-3 border-b border-gray-100">
              <div className="w-6 h-6 rounded-md bg-amber-50 text-amber-700 flex items-center justify-center font-bold text-xs">
                04
              </div>
              <h3
                className="text-sm font-bold text-[#111827]"
                style={{ fontFamily: PP }}
              >
                Follow-up Instructions
              </h3>
            </div>

            <div
              className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs"
              style={{ fontFamily: RB }}
            >
              <div>
                <span
                  className="text-[10px] font-bold text-slate-400 uppercase block"
                  style={{ fontFamily: PP }}
                >
                  Follow-up Required
                </span>
                <span className="inline-block mt-0.5 px-2.5 py-0.5 rounded font-bold bg-amber-50 text-amber-700 border border-amber-200">
                  {followupRequired}
                </span>
              </div>

              <div>
                <span
                  className="text-[10px] font-bold text-slate-400 uppercase block"
                  style={{ fontFamily: PP }}
                >
                  Next Visit Date
                </span>
                <span className="font-bold text-[#111827] text-sm mt-0.5 block">
                  {nextVisitDate}
                </span>
              </div>
            </div>

            <div>
              <span
                className="text-[10px] font-bold text-slate-400 uppercase block mb-1"
                style={{ fontFamily: PP }}
              >
                Follow-up Notes
              </span>
              <p
                className="p-3 bg-slate-50 rounded-xl border border-gray-100 text-xs text-slate-700"
                style={{ fontFamily: RB }}
              >
                {followupNotes}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

interface PrintModalProps {
  prescription: UnifiedPrescription;
  onClose: () => void;
  onPrint: () => void;
}

export const PrescriptionPrintModal: React.FC<PrintModalProps> = ({
  prescription,
  onClose,
  onPrint,
}) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-gray-100 transition-transform duration-150">
        <div className="flex items-center justify-between border-b border-gray-100 pb-4 mb-4">
          <div className="flex items-center gap-2">
            <Printer size={18} className="text-[#0D47A1]" />
            <h3
              className="text-base font-bold text-[#111827]"
              style={{ fontFamily: PP }}
            >
              Print Prescription Preview
            </h3>
          </div>
          <button
            aria-label="Close"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600"
          >
            <X size={18} />
          </button>
        </div>

        <div
          className="p-4 bg-slate-50 rounded-xl border border-gray-200 mb-5 text-xs text-slate-700 space-y-3"
          style={{ fontFamily: RB }}
        >
          <div className="flex justify-between border-b border-gray-200 pb-2">
            <span className="font-bold text-[#0D47A1]">
              HMS Hospital & Research Center
            </span>
            <span className="font-mono text-slate-500">{prescription.id}</span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {prescription.patientName && (
              <div>
                <strong>Patient:</strong> {prescription.patientName}
              </div>
            )}
            {prescription.mrn && (
              <div>
                <strong>MRN:</strong> {prescription.mrn}
              </div>
            )}
            <div>
              <strong>Doctor:</strong> {prescription.doctorName}
            </div>
            <div>
              <strong>Date:</strong> {prescription.consultationDate}
            </div>
          </div>
          <div>
            <strong>Diagnosis:</strong>{" "}
            {getDiagnosisString(prescription.diagnosis)}
          </div>
          <div className="pt-2 border-t border-gray-200">
            <div className="font-bold mb-1">Medicines Rx:</div>
            <ul className="list-disc pl-4 space-y-0.5">
              {prescription.medicines.map((m) => (
                <li key={m.name}>
                  {m.name} {m.strength ? `(${m.strength})` : ""} — {m.frequency}
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
            style={{ fontFamily: PP }}
          >
            Cancel
          </button>
          <button
            onClick={onPrint}
            className="px-4 py-2 rounded-xl text-xs font-semibold bg-[#0D47A1] text-white hover:bg-[#0c3d8a] transition-colors"
            style={{ fontFamily: PP }}
          >
            Print Prescription
          </button>
        </div>
      </div>
    </div>
  );
};
