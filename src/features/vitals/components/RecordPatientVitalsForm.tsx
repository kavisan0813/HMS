import { useState } from "react";
import {
  ArrowLeft,
  User,
  FileText,
  Heart,
  Check,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import type { AppointmentRecord } from "../../appointments/types/appointment.types";
import type { RecordedVitalsData } from "../types/vitals.types";
import { Avatar } from "../../../common/components/Avatar";
import { vitalsService } from "../services/vitals.service";
import { usePermissions } from "../../../permissions/usePermissions";

const PP = "Poppins, sans-serif";
const RB = "Roboto, sans-serif";

export interface RecordPatientVitalsFormProps {
  activeApt: AppointmentRecord;
  initialVitalsData?: RecordedVitalsData | null;
  isEditMode?: boolean;
  onBack: () => void;
  onPatientSelect?: (id: number | string) => void;
  onMarkReady: (submittedData?: RecordedVitalsData) => void | Promise<void>;
}

/* ─────────────────────────────────────────────────────────────────────────────
   RECORD PATIENT VITALS WORKSPACE FORM
   ───────────────────────────────────────────────────────────────────────────── */
export function RecordPatientVitalsForm({
  activeApt,
  initialVitalsData,
  isEditMode = false,
  onBack,
  onPatientSelect,
  onMarkReady,
}: RecordPatientVitalsFormProps) {
  const { can } = usePermissions();
  const [chiefComplaint, setChiefComplaint] = useState(
    initialVitalsData?.chiefComplaint ||
      (activeApt.chiefComplaint &&
      activeApt.chiefComplaint !== "Pre-consultation Vitals Check"
        ? activeApt.chiefComplaint
        : ""),
  );
  const [symptoms, setSymptoms] = useState(initialVitalsData?.symptoms || "");
  const [diagnosis, setDiagnosis] = useState(
    initialVitalsData?.diagnosis || "",
  );
  const [clinicalNotes, setClinicalNotes] = useState(
    initialVitalsData?.clinicalNotes || initialVitalsData?.observation || "",
  );

  const [height, setHeight] = useState(initialVitalsData?.height || "");
  const [weight, setWeight] = useState(initialVitalsData?.weight || "");
  const [temperature, setTemperature] = useState(
    initialVitalsData?.temp || initialVitalsData?.temperature || "",
  );
  const [bloodPressure, setBloodPressure] = useState(
    initialVitalsData?.systolic && initialVitalsData?.diastolic
      ? `${initialVitalsData.systolic}/${initialVitalsData.diastolic}`
      : initialVitalsData?.bloodPressure || "",
  );
  const [pulse, setPulse] = useState(initialVitalsData?.pulse || "");
  const [spo2, setSpo2] = useState(initialVitalsData?.spo2 || "");
  const [bloodSugar, setBloodSugar] = useState(
    initialVitalsData?.bloodSugar || initialVitalsData?.sugar || "",
  );
  const [bloodGroup] = useState(
    initialVitalsData?.bloodGroup ||
      ((activeApt as unknown as Record<string, unknown>)
        .bloodGroup as string) ||
      ((activeApt.patient as unknown as Record<string, unknown>)
        ?.bloodGroup as string) ||
      "O+",
  );

  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "info" | "error";
  } | null>(null);

  const triggerToast = (
    message: string,
    type: "success" | "info" | "error" = "success",
  ) => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [completedVitalsData, setCompletedVitalsData] =
    useState<RecordedVitalsData | null>(null);

  const handleReturnToTable = async () => {
    setShowSuccessModal(false);
    if (completedVitalsData) {
      await onMarkReady(completedVitalsData);
    }
    onBack();
  };

  const handleSaveVitals = async () => {
    try {
      const payload = {
        chiefComplaint,
        symptoms,
        diagnosis,
        clinicalNotes,
        temperature: Number(temperature),
        weight: Number(weight),
        height: Number(height),
        bloodPressure,
        pulse: Number(pulse),
        spo2: Number(spo2),
        bloodSugar: bloodSugar
          ? isNaN(Number(bloodSugar))
            ? bloodSugar
            : Number(bloodSugar)
          : undefined,
      };

      if (isEditMode) {
        // Step 8: Correction / Amendment via PUT /api/v1/nurse/appointments/{appointmentId}/vitals
        const wasSaved = await vitalsService.updateVitals(
          activeApt.id,
          payload,
        );
        if (!wasSaved) throw new Error("Vitals amendment was not accepted");
        triggerToast("Vitals amended successfully!", "success");
      } else {
        // Step 4 & 5: Record vitals via POST /api/v1/nurse/appointments/{appointmentId}/vitals
        const wasSaved = await vitalsService.submitVitals(
          activeApt.id,
          payload,
          activeApt.status,
        );
        if (!wasSaved) throw new Error("Vitals submission was not accepted");
        triggerToast("Vitals recorded successfully!", "success");
      }

      const bpParts = bloodPressure.includes("/")
        ? bloodPressure.split("/")
        : [bloodPressure, ""];
      const savedVitalsData: RecordedVitalsData = {
        height: height || "—",
        weight: weight || "—",
        bmi:
          height && weight && Number(height) > 0
            ? (Number(weight) / Math.pow(Number(height) / 100, 2)).toFixed(1)
            : "—",
        temp: temperature || "—",
        temperature: temperature || "—",
        bloodPressure: bloodPressure || "—",
        systolic: bpParts[0] || "—",
        diastolic: bpParts[1] || "—",
        pulse: pulse || "—",
        heartRate: pulse || "—",
        spo2: spo2 || "—",
        oxygenSaturation: spo2 || "—",
        respRate: "—",
        bloodSugar: bloodSugar || "—",
        sugar: bloodSugar || "—",
        appearance: "Normal, no acute distress",
        consciousness: "Alert and Oriented",
        chiefComplaint: chiefComplaint || "Pre-consultation Vitals Check",
        symptoms: symptoms || "None reported",
        diagnosis: diagnosis || "Pre-consultation Vitals Check Completed",
        clinicalNotes: clinicalNotes || "Patient vital signs recorded.",
        observation: clinicalNotes || "Vitals recorded by nurse.",
        status: "Vitals Recorded",
        bloodGroup: bloodGroup || "O+",
      };

      setCompletedVitalsData(savedVitalsData);
      setShowSuccessModal(true);
    } catch (err) {
      console.log(err);
      triggerToast(
        isEditMode ? "Unable to amend vitals." : "Unable to record vitals.",
        "error",
      );
    }
  };

  return (
    <div
      className="flex-1 overflow-y-auto bg-[#F1F5F9] p-6 space-y-6"
      style={{ fontFamily: RB }}
    >
      {/* Toast Alert */}
      {toast && (
        <div
          className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-xl shadow-lg border text-white text-xs font-semibold flex items-center gap-2 transition-opacity duration-200 ${
            toast.type === "success"
              ? "bg-[#66BB6A] border-green-300"
              : toast.type === "error"
                ? "bg-[#EF4444] border-red-300"
                : "bg-[#0D47A1] border-blue-300"
          }`}
        >
          <AlertCircle size={16} />
          {toast.message}
        </div>
      )}

      {/* HEADER BAR WITH BACK BUTTON */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-2.5 rounded-xl border border-[#E5E7EB] bg-white text-slate-700 transition-colors flex items-center justify-center cursor-pointer shadow-2xs"
            title="Go Back"
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <h1
              className="text-xl font-bold text-[#111827]"
              style={{ fontFamily: PP }}
            >
              {isEditMode ? "Edit Patient Vitals" : "Record Patient Vitals"}
            </h1>
            <p className="text-xs text-[#64748B] mt-0.5">
              {isEditMode
                ? "Update recorded vital signs and clinical prep findings."
                : "Record patient vital signs before outpatient consultation."}
            </p>
          </div>
        </div>
        <button
            onClick={handleSaveVitals}
            disabled={!can("VITALS_CREATE")}
            className="px-6 py-2.5 rounded-xl bg-[#0D47A1] text-white text-xs font-bold hover:bg-[#0c3d8a] transition-colors flex items-center gap-1.5 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            style={{ fontFamily: PP }}
          >
            <Check size={14} />{" "}
            {isEditMode ? "Update / Amend Vitals" : "Save Vitals"}
          </button>
      </div>

      {/* STICKY PATIENT SUMMARY STRIP */}
      <div className="bg-linear-to-r from-blue-900 via-[#0D47A1] to-[#009688] rounded-2xl p-5 text-white shadow-md flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Avatar name={activeApt.patientName} size="lg" />
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-mono text-xs font-bold bg-white/20 px-2 py-0.5 rounded text-white">
                {activeApt.tokenNo}
              </span>
              <span className="text-xs font-bold bg-amber-500 text-white px-2 py-0.5 rounded">
                Waiting for Vitals
              </span>
              <span className="text-xs text-blue-100 font-mono">
                {activeApt.timeSlot}
              </span>
            </div>
            <h2
              className="text-lg font-bold text-white mt-1"
              style={{ fontFamily: PP }}
            >
              {activeApt.patientName}
            </h2>
            <div className="text-xs text-blue-100 mt-0.5">
              MRN: {activeApt.mrn} · {activeApt.patientAge}y /{" "}
              {activeApt.patientGender} · Blood Group:{" "}
              <strong className="text-white">{bloodGroup || "O+"}</strong> ·
              Doctor:{" "}
              <strong className="text-white">{activeApt.doctorName}</strong> ·
              Dept:{" "}
              <strong className="text-white">
                {typeof activeApt.department === "string"
                  ? activeApt.department
                  : activeApt.department?.departmentName ||
                    activeApt.department?.name ||
                    activeApt.department?.departmentCode ||
                    ""}
              </strong>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {onPatientSelect && (
            <button
              onClick={() => onPatientSelect(activeApt.patientId)}
              className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition-colors flex items-center justify-center gap-1.5"
              style={{ fontFamily: PP }}
            >
              <User size={13} /> View Patient Profile
            </button>
          )}
        </div>
      </div>

      {/* FORM WORKSPACE */}
      <div className="space-y-6">
        {/* SECTION 01: Patient Information (Read Only) */}
        <div className="bg-white rounded-2xl border border-[#E5E7EB] p-5 shadow-sm space-y-4">
          <h3
            className="text-xs font-bold text-[#111827] uppercase tracking-wider border-b border-gray-100 pb-2 flex items-center gap-1.5"
            style={{ fontFamily: PP }}
          >
            <User size={14} className="text-[#0D47A1]" /> Patient Information
            (Read Only)
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4 text-xs">
            <div>
              <span className="text-slate-400 block text-[11px]">
                Patient Name
              </span>
              <strong className="text-slate-800 text-sm font-semibold">
                {activeApt.patientName}
              </strong>
            </div>
            <div>
              <span className="text-slate-400 block text-[11px]">MRN</span>
              <strong className="text-slate-800 font-mono text-xs">
                {activeApt.mrn}
              </strong>
            </div>
            <div>
              <span className="text-slate-400 block text-[11px]">
                Blood Group
              </span>
              <strong className="text-[#0D47A1] font-bold text-xs bg-blue-50 px-2 py-0.5 rounded border border-blue-100">
                {bloodGroup || "O+"}
              </strong>
            </div>
            <div>
              <span className="text-slate-400 block text-[11px]">
                Appointment ID
              </span>
              <strong className="text-slate-800 font-mono text-xs">
                {activeApt.id}
              </strong>
            </div>
            <div>
              <span className="text-slate-400 block text-[11px]">Doctor</span>
              <strong className="text-slate-800 font-semibold">
                {activeApt.doctorName}
              </strong>
            </div>
            <div>
              <span className="text-slate-400 block text-[11px]">
                Department
              </span>
              <strong className="text-slate-800 font-semibold">
                {typeof activeApt.department === "string"
                  ? activeApt.department
                  : activeApt.department?.departmentName ||
                    activeApt.department?.name ||
                    activeApt.department?.departmentCode ||
                    ""}
              </strong>
            </div>
            <div>
              <span className="text-slate-400 block text-[11px]">Token</span>
              <strong className="text-[#0D47A1] font-bold font-mono text-xs bg-blue-50 px-2 py-0.5 rounded border border-blue-100">
                {activeApt.tokenNo}
              </strong>
            </div>
          </div>
        </div>

        {/* SECTION 02: Clinical Information */}
        <div className="bg-white rounded-2xl border border-[#E5E7EB] p-5 shadow-sm space-y-4">
          <h3
            className="text-xs font-bold text-[#111827] uppercase tracking-wider border-b border-gray-100 pb-2 flex items-center gap-1.5"
            style={{ fontFamily: PP }}
          >
            <FileText size={14} className="text-[#0D47A1]" /> Clinical
            Information
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-[#64748B] block">
                Chief Complaint
              </span>
              <textarea
                aria-label="Text area"
                value={chiefComplaint}
                onChange={(e) => setChiefComplaint(e.target.value)}
                placeholder="Enter chief complaint"
                rows={3}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-[#E5E7EB] rounded-xl outline-none focus:border-[#0D47A1] focus:bg-white transition-colors text-slate-700 resize-y"
              />
            </div>

            <div className="space-y-1">
              <span className="text-[10px] font-bold text-[#64748B] block">
                Symptoms
              </span>
              <textarea
                aria-label="Text area"
                value={symptoms}
                onChange={(e) => setSymptoms(e.target.value)}
                placeholder="Enter symptoms"
                rows={3}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-[#E5E7EB] rounded-xl outline-none focus:border-[#0D47A1] focus:bg-white transition-colors text-slate-700 resize-y"
              />
            </div>

            <div className="space-y-1">
              <span className="text-[10px] font-bold text-[#64748B] block">
                Diagnosis
              </span>
              <textarea
                aria-label="Text area"
                value={diagnosis}
                onChange={(e) => setDiagnosis(e.target.value)}
                placeholder="Provisional diagnosis"
                rows={3}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-[#E5E7EB] rounded-xl outline-none focus:border-[#0D47A1] focus:bg-white transition-colors text-slate-700 resize-y"
              />
            </div>

            <div className="space-y-1">
              <span className="text-[10px] font-bold text-[#64748B] block">
                Clinical Notes
              </span>
              <textarea
                aria-label="Text area"
                value={clinicalNotes}
                onChange={(e) => setClinicalNotes(e.target.value)}
                placeholder="Clinical observations"
                rows={3}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-[#E5E7EB] rounded-xl outline-none focus:border-[#0D47A1] focus:bg-white transition-colors text-slate-700 resize-y"
              />
            </div>
          </div>
        </div>

        {/* SECTION 03: Vital Signs */}
        <div className="bg-white rounded-2xl border border-[#E5E7EB] p-5 shadow-sm space-y-4">
          <h3
            className="text-xs font-bold text-[#111827] uppercase tracking-wider border-b border-gray-100 pb-2 flex items-center gap-1.5"
            style={{ fontFamily: PP }}
          >
            <Heart size={14} className="text-[#EF4444]" /> Vital Signs
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-[#64748B] block">
                Height (cm)
                <input
                  aria-label="Input field"
                  type="number"
                  value={height}
                  onChange={(e) => setHeight(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-[#E5E7EB] rounded-xl outline-none focus:border-[#0D47A1] focus:bg-white transition-colors text-slate-700"
                />
              </span>
            </div>

            <div className="space-y-1">
              <span className="text-[10px] font-bold text-[#64748B] block">
                Weight (kg)
                <input
                  aria-label="Input field"
                  type="number"
                  value={weight}
                  onChange={(e) => setWeight(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-[#E5E7EB] rounded-xl outline-none focus:border-[#0D47A1] focus:bg-white transition-colors text-slate-700"
                />
              </span>
            </div>

            <div className="space-y-1">
              <span className="text-[10px] font-bold text-[#64748B] block">
                Temperature
                <input
                  aria-label="Input field"
                  type="number"
                  step="0.1"
                  value={temperature}
                  onChange={(e) => setTemperature(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-[#E5E7EB] rounded-xl outline-none focus:border-[#0D47A1] focus:bg-white transition-colors text-slate-700"
                />
              </span>
            </div>

            <div className="space-y-1">
              <span className="text-[10px] font-bold text-[#64748B] block">
                Blood Pressure
                <input
                  aria-label="120/80"
                  value={bloodPressure}
                  placeholder="120/80"
                  onChange={(e) => setBloodPressure(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-[#E5E7EB] rounded-xl outline-none focus:border-[#0D47A1] focus:bg-white transition-colors text-slate-700 font-mono"
                />
              </span>
            </div>

            <div className="space-y-1">
              <span className="text-[10px] font-bold text-[#64748B] block">
                Pulse
                <input
                  aria-label="Input field"
                  type="number"
                  value={pulse}
                  onChange={(e) => setPulse(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-[#E5E7EB] rounded-xl outline-none focus:border-[#0D47A1] focus:bg-white transition-colors text-slate-700"
                />
              </span>
            </div>

            <div className="space-y-1">
              <span className="text-[10px] font-bold text-[#64748B] block">
                SpO₂
                <input
                  aria-label="Input field"
                  type="number"
                  value={spo2}
                  onChange={(e) => setSpo2(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-[#E5E7EB] rounded-xl outline-none focus:border-[#0D47A1] focus:bg-white transition-colors text-slate-700"
                />
              </span>
            </div>

            <div className="space-y-1">
              <span className="text-[10px] font-bold text-[#64748B] block">
                Blood Sugar (mg/dL)
                <input
                  aria-label="Blood Sugar"
                  type="number"
                  value={bloodSugar}
                  onChange={(e) => setBloodSugar(e.target.value)}
                  placeholder="110"
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-[#E5E7EB] rounded-xl outline-none focus:border-[#0D47A1] focus:bg-white transition-colors text-slate-700 font-mono"
                />
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* SUCCESS CONFIRMATION MODAL MATCHING DESIGN */}
      {showSuccessModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div
            className="bg-white rounded-3xl max-w-lg w-full p-7 shadow-2xl space-y-5 text-center transition-transform duration-200 border border-slate-100"
            style={{ fontFamily: RB }}
          >
            {/* Top Checkmark Circle */}
            <div className="w-16 h-16 rounded-full bg-emerald-100/80 border border-emerald-200 text-emerald-600 flex items-center justify-center mx-auto shadow-inner">
              <CheckCircle2 size={34} />
            </div>

            <div className="space-y-1">
              <h2
                className="text-xl font-bold text-[#111827]"
                style={{ fontFamily: PP }}
              >
                {isEditMode
                  ? "Vitals Amended Successfully!"
                  : "Vitals Recorded Successfully!"}
              </h2>
              <p className="text-xs text-slate-500 font-medium max-w-md mx-auto">
                Patient vital signs have been registered with the Healthcare
                Operations Center.
              </p>
            </div>

            {/* Vitals ID Pill */}
            <div>
              <span className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-blue-50/80 border border-blue-100 text-[#0D47A1] text-xs font-mono font-bold">
                <span>Vitals ID:</span>
                <span className="font-extrabold">
                  VIT-{String(activeApt.id).slice(-8).toUpperCase()}
                </span>
              </span>
            </div>

            {/* Inner Details Card matching Reference Image */}
            <div className="bg-slate-50/70 border border-slate-200/80 rounded-2xl p-4 text-left space-y-3.5">
              {/* Doctor Header Row */}
              <div className="flex items-center justify-between border-b border-slate-200/60 pb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#0D47A1] text-white flex items-center justify-center font-bold text-xs shadow-xs">
                    {(activeApt.doctorName || "DR").slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <div
                      className="text-xs font-bold text-[#111827]"
                      style={{ fontFamily: PP }}
                    >
                      {activeApt.doctorName || "Attending Doctor"}
                    </div>
                    <div className="text-[11px] text-slate-500">
                      {typeof activeApt.department === "string"
                        ? activeApt.department
                        : activeApt.departmentName || "General OPD"}
                    </div>
                  </div>
                </div>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-[#0D47A1] border border-blue-100">
                  Ready for Consultation
                </span>
              </div>

              {/* Patient Info Row */}
              <div className="bg-white border border-slate-200/80 rounded-xl p-3 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-blue-100 text-[#0D47A1] flex items-center justify-center font-bold text-xs">
                    {(activeApt.patientName || "Patient")
                      .slice(0, 2)
                      .toUpperCase()}
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 font-medium block">
                      Patient Name
                    </span>
                    <span className="text-xs font-bold text-[#111827]">
                      {activeApt.patientName || "Unknown Patient"}
                    </span>
                  </div>
                </div>
                {activeApt.mrn && (
                  <span className="px-2 py-0.5 rounded-md bg-blue-50 text-[#0D47A1] border border-blue-100 text-[10px] font-mono font-bold">
                    MRN: {activeApt.mrn}
                  </span>
                )}
              </div>

              {/* 2-Column Field Grid */}
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-[10px] text-slate-400 font-medium block">
                    Blood Pressure
                  </span>
                  <span className="font-bold text-[#111827] font-mono">
                    {completedVitalsData?.bloodPressure || bloodPressure || "—"}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 font-medium block">
                    Pulse Rate
                  </span>
                  <span className="font-bold text-[#0D47A1]">
                    {completedVitalsData?.pulse || pulse || "—"} bpm
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 font-medium block">
                    Temperature
                  </span>
                  <span className="font-semibold text-slate-700">
                    {completedVitalsData?.temp || temperature || "—"} °F
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 font-medium block">
                    Blood Group
                  </span>
                  <span className="font-bold text-[#0D47A1]">
                    {String(
                      completedVitalsData?.bloodGroup ||
                        (activeApt as unknown as Record<string, unknown>)
                          .bloodGroup ||
                        "O+",
                    )}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 font-medium block">
                    SpO₂ Saturation
                  </span>
                  <span className="font-bold text-[#009688]">
                    {completedVitalsData?.spo2 || spo2 || "—"} %
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 font-medium block">
                    Chief Complaint
                  </span>
                  <span className="font-medium text-slate-700 truncate block">
                    {chiefComplaint || "Pre-consultation Vitals Check"}
                  </span>
                </div>
              </div>
            </div>

            {/* Action Buttons matching Reference Image */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={async () => {
                  setShowSuccessModal(false);
                  if (completedVitalsData) {
                    await onMarkReady(completedVitalsData);
                  }
                  onBack();
                }}
                className="w-full sm:flex-1 py-3 px-5 rounded-xl bg-[#0D47A1] hover:bg-[#0c3d8a] text-white text-xs font-bold transition-colors shadow-xs flex items-center justify-center cursor-pointer"
                style={{ fontFamily: PP }}
              >
                View Vitals Details
              </button>
              <button
                type="button"
                onClick={handleReturnToTable}
                className="w-full sm:flex-1 py-3 px-5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold transition-colors cursor-pointer"
                style={{ fontFamily: PP }}
              >
                Return to Vitals Table
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
