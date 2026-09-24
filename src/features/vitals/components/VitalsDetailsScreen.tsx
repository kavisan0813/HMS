import { useMemo } from "react";
import {
  Activity,
  Heart,
  CheckCircle2,
  ArrowLeft,
  Clock,
  User,
  FileText,
  ShieldAlert,
  Printer,
  Calendar,
  Edit,
} from "lucide-react";
import type { AppointmentRecord } from "../../appointments/types/appointment.types";
import type { RecordedVitalsData } from "../types/vitals.types";
import { Avatar } from "../../../common/components/Avatar";

const PP = "Poppins, sans-serif";
const RB = "Roboto, sans-serif";

export interface VitalsDetailsScreenProps {
  activeApt: AppointmentRecord | null;
  vitalsData?: RecordedVitalsData;
  onBack: () => void;
  onEditVitals?: () => void;
  onPatientSelect?: (id: number | string) => void;
  onPrint?: () => void;
}

/* ─────────────────────────────────────────────────────────────────────────────
   VITALS DETAILS SCREEN COMPONENT
   ───────────────────────────────────────────────────────────────────────────── */
export function VitalsDetailsScreen({
  activeApt,
  vitalsData = {
    height: "—",
    weight: "—",
    bmi: "—",
    temp: "—",
    temperature: "—",
    bloodPressure: "—",
    systolic: "—",
    diastolic: "—",
    pulse: "—",
    heartRate: "—",
    spo2: "—",
    oxygenSaturation: "—",
    respRate: "—",
    bloodSugar: "—",
    sugar: "—",
    appearance: "Normal, no acute distress",
    consciousness: "Alert and Oriented (A&O x 4)",
    chiefComplaint: "Pre-consultation Vitals Check",
    symptoms: "None reported",
    diagnosis: "Pre-consultation Vitals Check Completed",
    clinicalNotes:
      "Patient vital signs recorded and stable for physician review.",
    observation: "Vitals within normal limits.",
    recordedBy: { employeeId: "NUR-0412", name: "Sarah Jenkins, RN" },
    recordedAt: "Today, 10:45 AM",
    lastUpdatedBy: { employeeId: "NUR-0412", name: "Sarah Jenkins, RN" },
    lastUpdatedAt: "Today, 10:45 AM",
    lastReviewedBy: { employeeId: "DOC-108", name: "Dr. Alexander Wright, MD" },
    lastReviewedAt: "Pending Doctor Review",
    status: "Vitals Recorded",
    version: 1,
  },
  onBack,
  onEditVitals,
  onPatientSelect,
  onPrint,
}: VitalsDetailsScreenProps) {
  const patientInfo = useMemo(() => {
    if (!activeApt) return null;
    const activeObj = activeApt as unknown as Record<string, unknown>;
    const patObj = (activeApt.patient || {}) as Record<string, unknown>;

    const phone =
      activeApt.patientPhone ||
      (patObj.phone as string) ||
      (patObj.contact as string) ||
      (patObj.mobile as string) ||
      (patObj.phoneNumber as string) ||
      (activeObj.phone as string) ||
      (activeObj.mobile as string) ||
      (activeObj.contact as string) ||
      "—";

    const bloodGroup =
      (patObj.bloodGroup as string) ||
      (patObj.bloodType as string) ||
      (activeObj.bloodGroup as string) ||
      (activeObj.bloodType as string) ||
      "—";

    const emergencyContact =
      (patObj.emergencyContact as string) ||
      (patObj.emergencyPhone as string) ||
      (patObj.emergencyContactNumber as string) ||
      (activeObj.emergencyContact as string) ||
      (activeObj.emergencyPhone as string) ||
      "—";

    return {
      id: activeApt.patientId || patObj.id,
      mrn: activeApt.mrn || patObj.mrn,
      name: activeApt.patientName || patObj.name || patObj.fullName,
      age: activeApt.patientAge || patObj.age,
      gender: activeApt.patientGender || patObj.gender,
      bloodGroup: bloodGroup !== "—" ? bloodGroup : "—",
      phone: phone !== "—" ? phone : "—",
      emergencyContact: emergencyContact !== "—" ? emergencyContact : "—",
    };
  }, [activeApt]);

  const handlePrintAction = () => {
    if (onPrint) {
      onPrint();
    } else {
      window.print();
    }
  };

  if (!activeApt) {
    return (
      <div
        className="flex-1 overflow-y-auto bg-[#F1F5F9] p-6 flex flex-col items-center justify-center space-y-4"
        style={{ fontFamily: RB }}
      >
        <div className="bg-white p-8 rounded-2xl border border-[#E5E7EB] shadow-sm max-w-md w-full text-center space-y-3">
          <div className="w-16 h-16 rounded-2xl bg-amber-50 text-[#F59E0B] flex items-center justify-center mx-auto border border-amber-100">
            <Activity size={32} />
          </div>
          <h2
            className="text-base font-bold text-[#111827]"
            style={{ fontFamily: PP }}
          >
            No vitals have been recorded for this patient.
          </h2>
          <p className="text-xs text-[#64748B]">
            Please select a patient from the prep queue to record vital signs or
            view details.
          </p>
          <button
            onClick={onBack}
            className="px-4 py-2 rounded-xl bg-[#0D47A1] text-white text-xs font-semibold hover:bg-[#0c3d8a] transition-colors"
            style={{ fontFamily: PP }}
          >
            Back to Vitals Queue
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      className="flex-1 overflow-y-auto bg-[#F1F5F9] p-6 space-y-6"
      style={{ fontFamily: RB }}
    >
      {/* HEADER & BACK NAVIGATION */}
      <div className=" flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="w-9 h-9 rounded-xl bg-slate-50 hover:bg-slate-100 border border-[#E5E7EB] flex items-center justify-center  bg-white text-slate-600 transition-colors cursor-pointer"
            title="Back to Vitals Queue"
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <h1
              className="text-xl font-bold text-[#111827]"
              style={{ fontFamily: PP }}
            >
              Vitals Details
            </h1>
            <p className="text-xs text-[#64748B] mt-0.5">
              Review patient vitals before consultation.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
            {onEditVitals && (
              <button
                onClick={onEditVitals}
                className="px-5 py-2.5 rounded-xl bg-[#009688] hover:bg-[#00796b] text-white text-xs font-bold transition-colors flex items-center gap-1.5 shadow-sm cursor-pointer"
                style={{ fontFamily: PP }}
              >
                <Edit size={14} /> Edit / Amend Vitals
              </button>
            )}
            <button
              onClick={handlePrintAction}
              className="px-5 py-2.5 rounded-xl bg-[#0D47A1] text-white text-xs font-bold hover:bg-[#0c3d8a] transition-colors flex items-center gap-1.5 shadow-sm cursor-pointer"
              style={{ fontFamily: PP }}
            >
              <Printer size={14} /> Print Vitals
            </button>
          </div>
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
              <span className="text-xs font-bold bg-[#66BB6A] text-white px-2 py-0.5 rounded flex items-center gap-1">
                <CheckCircle2 size={12} /> Vitals Recorded
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
              {activeApt.mrn} · {activeApt.patientAge}y /{" "}
              {activeApt.patientGender} · Blood Group:{" "}
              <strong className="text-white">
                {patientInfo?.bloodGroup || "O+"}
              </strong>{" "}
              · Doctor:{" "}
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

      {/* MAIN WORKSPACE */}
      <div className="w-full space-y-6">
        {/* MAIN CONTENT AREA */}
        <div className="w-full space-y-6">
          {/* SECTION 01 & SECTION 02 Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* SECTION 01: Patient Information */}
            <div className="bg-white rounded-2xl border border-[#E5E7EB] p-5 shadow-sm space-y-4">
              <h3
                className="text-xs font-bold text-[#111827] uppercase tracking-wider border-b border-gray-100 pb-2 flex items-center gap-1.5"
                style={{ fontFamily: PP }}
              >
                <User size={14} className="text-[#0D47A1]" /> Patient
                Information
              </h3>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-400">Patient Name</span>
                  <strong className="text-slate-700">
                    {activeApt.patientName}
                  </strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">MRN</span>
                  <strong className="text-slate-700 font-mono">
                    {activeApt.mrn}
                  </strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Age / Gender</span>
                  <strong className="text-slate-700">
                    {activeApt.patientAge}y / {activeApt.patientGender}
                  </strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Blood Group</span>
                  <strong className="text-slate-700">
                    {patientInfo?.bloodGroup || "—"}
                  </strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Mobile Number</span>
                  <strong className="text-slate-700 font-mono">
                    {activeApt.patientPhone || "—"}
                  </strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Known Allergies</span>
                  <strong className="text-slate-700">
                    {((activeApt as unknown as Record<string, unknown>)
                      .allergies as string) || "None reported"}
                  </strong>
                </div>
              </div>
            </div>

            {/* SECTION 02: Appointment Information */}
            <div className="bg-white rounded-2xl border border-[#E5E7EB] p-5 shadow-sm space-y-4">
              <h3
                className="text-xs font-bold text-[#111827] uppercase tracking-wider border-b border-gray-100 pb-2 flex items-center gap-1.5"
                style={{ fontFamily: PP }}
              >
                <Calendar size={14} className="text-[#0D47A1]" /> Appointment
                Information
              </h3>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-400">Appointment ID</span>
                  <strong className="text-slate-700 font-mono">
                    {activeApt.id}
                  </strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Appointment Date</span>
                  <strong className="text-slate-700">
                    {activeApt.appointmentDate}
                  </strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Appointment Time</span>
                  <strong className="text-slate-700 font-mono">
                    {activeApt.timeSlot}
                  </strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Assigned Doctor</span>
                  <strong className="text-slate-700">
                    {activeApt.doctorName}
                  </strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Department</span>
                  <strong className="text-slate-700">
                    {typeof activeApt.department === "string"
                      ? activeApt.department
                      : activeApt.department?.departmentName ||
                        activeApt.department?.name ||
                        activeApt.department?.departmentCode ||
                        ""}
                  </strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Visit Type</span>
                  <strong className="text-[#009688] font-bold">
                    {activeApt.visitType}
                  </strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Queue Status</span>
                  <strong className="text-[#66BB6A] font-bold">
                    Ready for Consultation
                  </strong>
                </div>
              </div>
            </div>
          </div>

          {/* SECTION 03: Recorded Vitals Cards */}
          <div className="bg-white rounded-2xl border border-[#E5E7EB] p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 pb-2">
              <h3
                className="text-xs font-bold text-[#111827] uppercase tracking-wider flex items-center gap-1.5"
                style={{ fontFamily: PP }}
              >
                <Heart size={15} className="text-[#EF4444]" /> Recorded Clinical
                Vitals
              </h3>
              <span className="text-[11px] text-slate-400 flex items-center gap-1">
                <Clock size={12} /> Recorded at {vitalsData.recordedAt}
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-8 gap-3">
              {/* Height */}
              <div className="bg-slate-50/80 p-3.5 rounded-xl border border-slate-200/80 space-y-1">
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Height
                </div>
                <div
                  className="text-lg font-bold text-[#111827] font-mono"
                  style={{ fontFamily: PP }}
                >
                  {vitalsData.height || "—"}{" "}
                  {vitalsData.height ? (
                    <span className="text-xs text-slate-500 font-normal">
                      cm
                    </span>
                  ) : null}
                </div>
              </div>

              {/* Weight */}
              <div className="bg-slate-50/80 p-3.5 rounded-xl border border-slate-200/80 space-y-1">
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Weight
                </div>
                <div
                  className="text-lg font-bold text-[#111827] font-mono"
                  style={{ fontFamily: PP }}
                >
                  {vitalsData.weight || "—"}{" "}
                  {vitalsData.weight ? (
                    <span className="text-xs text-slate-500 font-normal">
                      kg
                    </span>
                  ) : null}
                </div>
              </div>

              {/* BMI */}
              <div className="bg-teal-50/60 p-3.5 rounded-xl border border-teal-100 space-y-1">
                <div className="text-[10px] font-bold text-teal-800 uppercase tracking-wider">
                  BMI
                </div>
                <div
                  className="text-lg font-bold text-[#009688] font-mono"
                  style={{ fontFamily: PP }}
                >
                  {vitalsData.bmi ||
                    (vitalsData.weight && vitalsData.height
                      ? (
                          Number(vitalsData.weight) /
                          Math.pow(Number(vitalsData.height) / 100, 2)
                        ).toFixed(1)
                      : "—")}
                </div>
              </div>

              {/* Temperature */}
              <div className="bg-slate-50/80 p-3.5 rounded-xl border border-slate-200/80 space-y-1">
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Temperature
                </div>
                <div
                  className="text-lg font-bold text-[#111827] font-mono"
                  style={{ fontFamily: PP }}
                >
                  {vitalsData.temp || vitalsData.temperature || "—"}{" "}
                  {vitalsData.temp || vitalsData.temperature ? (
                    <span className="text-xs text-slate-500 font-normal">
                      °F
                    </span>
                  ) : null}
                </div>
              </div>

              {/* Blood Pressure */}
              <div className="bg-blue-50/60 p-3.5 rounded-xl border border-blue-100 space-y-1">
                <div className="text-[10px] font-bold text-blue-900 uppercase tracking-wider">
                  Blood Pressure
                </div>
                <div
                  className="text-lg font-bold text-[#0D47A1] font-mono"
                  style={{ fontFamily: PP }}
                >
                  {vitalsData.bloodPressure ||
                    (vitalsData.systolic && vitalsData.diastolic
                      ? `${vitalsData.systolic}/${vitalsData.diastolic}`
                      : "—")}{" "}
                  {vitalsData.bloodPressure ||
                  (vitalsData.systolic && vitalsData.diastolic) ? (
                    <span className="text-xs text-blue-700 font-normal">
                      mmHg
                    </span>
                  ) : null}
                </div>
              </div>

              {/* Pulse Rate */}
              <div className="bg-slate-50/80 p-3.5 rounded-xl border border-slate-200/80 space-y-1">
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Pulse Rate
                </div>
                <div
                  className="text-lg font-bold text-[#111827] font-mono"
                  style={{ fontFamily: PP }}
                >
                  {vitalsData.pulse || vitalsData.heartRate || "—"}{" "}
                  {vitalsData.pulse || vitalsData.heartRate ? (
                    <span className="text-xs text-slate-500 font-normal">
                      bpm
                    </span>
                  ) : null}
                </div>
              </div>

              {/* SpO2 */}
              <div className="bg-emerald-50/60 p-3.5 rounded-xl border border-emerald-100 space-y-1">
                <div className="text-[10px] font-bold text-emerald-900 uppercase tracking-wider">
                  SpO₂ Oxygen
                </div>
                <div
                  className="text-lg font-bold text-[#66BB6A] font-mono"
                  style={{ fontFamily: PP }}
                >
                  {vitalsData.spo2 || vitalsData.oxygenSaturation || "—"}{" "}
                  {vitalsData.spo2 || vitalsData.oxygenSaturation ? (
                    <span className="text-xs text-emerald-700 font-normal">
                      %
                    </span>
                  ) : null}
                </div>
              </div>
            </div>
          </div>

          {/* SECTION 04: Clinical Observation */}
          <div className="bg-white rounded-2xl border border-[#E5E7EB] p-5 shadow-sm space-y-4">
            <h3
              className="text-xs font-bold text-[#111827] uppercase tracking-wider border-b border-gray-100 pb-2 flex items-center gap-1.5"
              style={{ fontFamily: PP }}
            >
              <FileText size={14} className="text-[#0D47A1]" /> Clinical
              Observation
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="md:col-span-2 bg-slate-50 p-3.5 rounded-xl border border-slate-100 space-y-1">
                <span className="text-slate-400 block font-medium">
                  Chief Complaint
                </span>
                <p className="text-slate-700 font-medium leading-relaxed">
                  {vitalsData.chiefComplaint || activeApt.chiefComplaint || "—"}
                </p>
              </div>
              {vitalsData.symptoms && (
                <div className="md:col-span-2 bg-slate-50 p-3.5 rounded-xl border border-slate-100 space-y-1">
                  <span className="text-slate-400 block font-medium">
                    Symptoms
                  </span>
                  <p className="text-slate-700 font-medium leading-relaxed">
                    {vitalsData.symptoms}
                  </p>
                </div>
              )}
              {vitalsData.diagnosis && (
                <div className="md:col-span-2 bg-slate-50 p-3.5 rounded-xl border border-slate-100 space-y-1">
                  <span className="text-slate-400 block font-medium">
                    Diagnosis / Clinical Findings
                  </span>
                  <p className="text-slate-700 font-medium leading-relaxed">
                    {vitalsData.diagnosis}
                  </p>
                </div>
              )}
              <div className="md:col-span-2 bg-slate-50 p-3.5 rounded-xl border border-slate-100 space-y-1">
                <span className="text-slate-400 block font-medium">
                  Nursing Observation & Clinical Prep Notes
                </span>
                <p className="text-slate-700 font-medium leading-relaxed">
                  {vitalsData.clinicalNotes || vitalsData.observation || "—"}
                </p>
              </div>
            </div>
          </div>

          {/* SECTION 05: Patient Alerts */}
          <div className="bg-white rounded-2xl border border-[#E5E7EB] p-5 shadow-sm space-y-3">
            <h3
              className="text-xs font-bold text-[#111827] uppercase tracking-wider border-b border-gray-100 pb-2 flex items-center gap-1.5"
              style={{ fontFamily: PP }}
            >
              <ShieldAlert size={14} className="text-[#0D47A1]" /> Patient
              Alerts & Clinical Risk Indicators
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="bg-slate-50 border border-slate-200 p-3.5 rounded-xl space-y-1">
                <strong
                  className="text-slate-800 block font-bold"
                  style={{ fontFamily: PP }}
                >
                  Known Allergies
                </strong>
                <p className="text-slate-600 font-medium">
                  {((activeApt as unknown as Record<string, unknown>)
                    .allergies as string) ||
                    "No known drug allergies reported."}
                </p>
              </div>
              <div className="bg-slate-50 border border-slate-200 p-3.5 rounded-xl space-y-1">
                <strong
                  className="text-slate-800 block font-bold"
                  style={{ fontFamily: PP }}
                >
                  Chronic Conditions / Notes
                </strong>
                <p className="text-slate-600 font-medium">
                  {activeApt.notes ||
                    ((activeApt as unknown as Record<string, unknown>)
                      .medicalConditions as string) ||
                    "No active chronic conditions noted."}
                </p>
              </div>
            </div>
          </div>

          {/* SECTION 06: Vitals Audit & Activity Metadata */}
          <div className="bg-white rounded-2xl border border-[#E5E7EB] p-5 shadow-sm space-y-4">
            <h3
              className="text-xs font-bold text-[#111827] uppercase tracking-wider border-b border-gray-100 pb-2 flex items-center gap-1.5"
              style={{ fontFamily: PP }}
            >
              <Clock size={14} className="text-[#0D47A1]" /> Audit Metadata &
              Audit Log
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                <span className="text-[10px] text-slate-400 font-bold uppercase block">
                  Recorded By
                </span>
                <strong className="text-slate-800 font-semibold">
                  {typeof vitalsData.recordedBy === "object" &&
                  vitalsData.recordedBy !== null
                    ? `${(vitalsData.recordedBy as { name?: string; employeeId?: string }).name || ""}${(vitalsData.recordedBy as { name?: string; employeeId?: string }).employeeId ? ` (${(vitalsData.recordedBy as { name?: string; employeeId?: string }).employeeId})` : ""}` ||
                      "—"
                    : String(vitalsData.recordedBy || "—")}
                </strong>
                <span className="text-[10px] text-slate-400 block mt-0.5">
                  {vitalsData.recordedAt || "—"}
                </span>
              </div>

              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                <span className="text-[10px] text-slate-400 font-bold uppercase block">
                  Last Updated By
                </span>
                <strong className="text-slate-800 font-semibold">
                  {typeof vitalsData.lastUpdatedBy === "object" &&
                  vitalsData.lastUpdatedBy !== null
                    ? `${(vitalsData.lastUpdatedBy as { name?: string; employeeId?: string }).name || ""}${(vitalsData.lastUpdatedBy as { name?: string; employeeId?: string }).employeeId ? ` (${(vitalsData.lastUpdatedBy as { name?: string; employeeId?: string }).employeeId})` : ""}` ||
                      "—"
                    : String(vitalsData.lastUpdatedBy || "—")}
                </strong>
                <span className="text-[10px] text-slate-400 block mt-0.5">
                  {vitalsData.lastUpdatedAt || "—"}
                </span>
              </div>

              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                <span className="text-[10px] text-slate-400 font-bold uppercase block">
                  Last Reviewed By
                </span>
                <strong className="text-slate-800 font-semibold">
                  {typeof vitalsData.lastReviewedBy === "object" &&
                  vitalsData.lastReviewedBy !== null
                    ? `${(vitalsData.lastReviewedBy as { name?: string; employeeId?: string }).name || ""}${(vitalsData.lastReviewedBy as { name?: string; employeeId?: string }).employeeId ? ` (${(vitalsData.lastReviewedBy as { name?: string; employeeId?: string }).employeeId})` : ""}` ||
                      "—"
                    : String(vitalsData.lastReviewedBy || "—")}
                </strong>
                <span className="text-[10px] text-slate-400 block mt-0.5">
                  {vitalsData.lastReviewedAt || "—"}
                </span>
              </div>

              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                <span className="text-[10px] text-slate-400 font-bold uppercase block">
                  Status & Version
                </span>
                <strong className="text-[#009688] font-bold">
                  {vitalsData.status || "COMPLETED"}
                </strong>
                {vitalsData.version != null && (
                  <span className="text-[10px] text-slate-400 block mt-0.5 font-mono">
                    v{vitalsData.version}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
