import { useState, useMemo, useEffect } from "react";
import {
  CheckCircle2,
  AlertCircle,
  ChevronDown,
  Plus,
  Trash2,
  Save,
  Info,
  Edit3,
  Loader2,
} from "lucide-react";
import {
  EditConsultationHeader,
  EditConsultationPatientBanner,
  EditConsultationMetadataCard,
  EditConsultationVisitInfoCard,
  EditConsultationVitalsCard,
  EditConsultationExaminationCard,
  EditConsultationClinicalNotesCard,
  EditConsultationFollowupCard,
  EditConsultationFooter,
} from "./edit";
import { encountersApi } from "../../encounters/api/encounters.api";
import { patientsApi } from "../../patients/api/patient.api";
import { doctorsApi } from "../../doctors/api/doctors.api";
import { vitalsApi } from "../../vitals/api/vitals.api";
import { ConsultationHistoryScreen } from "./ConsultationHistoryScreen";

// --- Design System Tokens ---
const PP = "'Poppins', system-ui, sans-serif";
const RB = "'Roboto', system-ui, sans-serif";

export interface MedicineItem {
  id: string;
  medicationId?: number;
  name: string;
  dosage: string;
  frequency: string;
  frequencyCode?: string;
  duration: string;
  durationValue?: number;
  durationUnit?: string;
  quantityValue?: number;
  quantityUnit?: string;
  doseValue?: number;
  doseUnit?: string;
  form?: string;
  route?: string;
  instructions: string;
}

export interface EditConsultationScreenProps {
  consultationId?: string;
  encounterId?: string | number;
  initialRecord?: Record<string, unknown>;
  autoEdit?: boolean;
  onBack?: () => void;
  onUpdateSuccess?: () => void;
  onViewHistory?: (patientId?: string) => void;
}

function unwrapApiData<T = unknown>(response: unknown): T {
  if (!response) return null as unknown as T;
  return ((response as Record<string, unknown>)?.data ?? response) as T;
}

function toStringValue(value: unknown): string {
  if (value === null || value === undefined) return "";
  return String(value);
}

function formatDateTime(dateVal?: unknown): string {
  if (!dateVal || dateVal === "—") return "—";
  try {
    const d = new Date(String(dateVal));
    if (isNaN(d.getTime())) return String(dateVal);
    const day = String(d.getDate()).padStart(2, "0");
    const months = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ];
    const month = months[d.getMonth()];
    const year = d.getFullYear();
    let hours = d.getHours();
    const minutes = String(d.getMinutes()).padStart(2, "0");
    const ampm = hours >= 12 ? "PM" : "AM";
    hours = hours % 12;
    hours = hours ? hours : 12;
    const formattedHours = String(hours).padStart(2, "0");
    return `${day} ${month} ${year}, ${formattedHours}:${minutes} ${ampm}`;
  } catch {
    return String(dateVal);
  }
}

export function EditConsultationScreen({
  consultationId = "",
  encounterId: propEncounterId,
  initialRecord,
  autoEdit = true,
  onBack,
  onUpdateSuccess,
  onViewHistory,
}: EditConsultationScreenProps) {
  // Collapsible section states
  const [collapsedSections, setCollapsedSections] = useState<
    Record<string, boolean>
  >({
    metadata: false,
    visitInfo: false,
    vitals: false,
    examination: false,
    prescription: false,
    investigation: false,
    clinicalNotes: false,
    followup: false,
    summary: false,
    revisionNotes: false,
  });

  const [showHistoryModal, setShowHistoryModal] = useState(false);

  const handleViewHistory = (mrn?: string) => {
    const targetMrn = mrn || formData.mrn;
    if (onViewHistory) {
      onViewHistory(targetMrn);
    }
    setShowHistoryModal(true);
  };

  const toggleSection = (key: string) => {
    setCollapsedSections((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  // Pre-fill initial form state from initialRecord if passed from Consultation Details screen
  const buildInitialFormData = (rec?: Record<string, unknown> | null) => {
    const rawMeds = (rec?.medicines || rec?.medications || []) as Array<
      Record<string, unknown>
    >;
    const medicines: MedicineItem[] = Array.isArray(rawMeds)
      ? rawMeds.map((med: Record<string, unknown>, idx: number) => ({
          id: String(med.id ?? med.medicationId ?? idx + 1),
          medicationId: Number(med.medicationId ?? med.id ?? 0),
          name: String(med.name ?? med.medicineName ?? ""),
          dosage: String(med.dosage ?? med.strength ?? ""),
          frequency: String(med.frequency ?? "Once Daily"),
          frequencyCode: String(med.frequencyCode ?? "QD"),
          duration: String(med.duration ?? ""),
          durationValue: Number(med.durationValue ?? 0),
          durationUnit: String(med.durationUnit ?? "DAYS"),
          quantityValue: Number(med.quantityValue ?? 0),
          quantityUnit: String(med.quantityUnit ?? ""),
          doseValue: Number(med.doseValue ?? 0),
          doseUnit: String(med.doseUnit ?? ""),
          form: String(med.form ?? ""),
          route: String(med.route ?? ""),
          instructions: String(med.instructions ?? ""),
        }))
      : [];

    const stripUnit = (val?: unknown) => {
      if (!val || val === "—" || val === "N/A") return "";
      return String(val)
        .replace(/[^0-9./-]/g, "")
        .trim();
    };

    const rawInvs = (rec?.investigations || []) as Array<
      Record<string, unknown> | string
    >;
    const invNames = Array.isArray(rawInvs)
      ? rawInvs.map((i) =>
          typeof i === "string"
            ? i.toUpperCase()
            : String(
                (i as Record<string, unknown>)?.name ||
                  (i as Record<string, unknown>)?.testName ||
                  "",
              ).toUpperCase(),
        )
      : [];

    const fuReq =
      rec?.followupRequired === "Yes" ||
      rec?.followupRequired === true ||
      Boolean(rec?.nextVisitDate);

    const recIdStr = toStringValue(rec?.id);
    const consultationIdStr = toStringValue(consultationId);
    const propEncIdStr = propEncounterId != null ? String(propEncounterId) : "";
    const recVitals = rec?.vitals as Record<string, unknown> | undefined;

    return {
      consultationId: toStringValue(
        rec?.id ?? consultationId ?? String(propEncounterId ?? ""),
      ),
      consultationNumericId: Number(recIdStr.replace(/\D+/g, "") || 0),
      encounterId: Number(
        propEncIdStr
          ? propEncIdStr.replace(/\D+/g, "")
          : recIdStr
            ? recIdStr.replace(/\D+/g, "")
            : consultationIdStr
              ? consultationIdStr.replace(/\D+/g, "")
              : 0,
      ),
      diagnosisId: 0,
      prescriptionId: 0,
      version: 1,

      status: toStringValue(rec?.status ?? "In Progress"),
      createdBy: toStringValue(rec?.createdBy ?? "—"),
      createdDate: formatDateTime(
        rec?.createdDate ?? rec?.startedAt ?? rec?.createdAt ?? rec?.visitDate,
      ),
      lastUpdatedBy: toStringValue(rec?.lastUpdatedBy ?? "—"),
      lastUpdatedDate: formatDateTime(
        rec?.lastUpdatedDate ?? rec?.updatedAt ?? rec?.completedAt,
      ),
      revisionNumber: 1,

      visitDate: toStringValue(
        rec?.visitDate ?? new Date().toISOString().split("T")[0],
      ),
      doctorName: toStringValue(rec?.doctorName ?? "—"),
      department: toStringValue(rec?.department ?? "—"),
      visitType: (rec?.visitType ?? "First Visit") as
        | "New Consultation"
        | "Follow-up"
        | "First Visit",
      chiefComplaint: toStringValue(rec?.chiefComplaint ?? ""),
      durationOfSymptoms: toStringValue(rec?.durationOfSymptoms ?? ""),

      // Vitals
      height: stripUnit(recVitals?.height),
      weight: stripUnit(recVitals?.weight),
      temperature: stripUnit(recVitals?.temperature),
      bp: toStringValue(recVitals?.bp ?? ""),
      pulse: stripUnit(recVitals?.pulse),
      respiratoryRate: stripUnit(recVitals?.respiratoryRate),
      spo2: stripUnit(recVitals?.spo2),
      bloodSugar: stripUnit(
        recVitals?.bloodSugar ??
          recVitals?.sugar ??
          recVitals?.bloodSugarMgDl ??
          recVitals?.randomBloodSugar ??
          recVitals?.fastingBloodSugar ??
          recVitals?.blood_sugar ??
          recVitals?.glucose,
      ),

      // Clinical Examination & Diagnosis
      clinicalExamination: toStringValue(rec?.clinicalExamination ?? ""),
      provisionalDiagnosis: toStringValue(rec?.provisionalDiagnosis ?? ""),
      finalDiagnosis: toStringValue(rec?.finalDiagnosis ?? ""),
      icdCode: toStringValue(rec?.icdCode ?? ""),

      // Medicines
      medicines,

      // Investigations
      investigations: {
        cbc: invNames.some(
          (n: string) =>
            n.includes("CBC") ||
            n.includes("HAEMOGRAM") ||
            n.includes("HEMOGRAM"),
        ),
        ecg: invNames.some(
          (n: string) => n.includes("ECG") || n.includes("EKG"),
        ),
        xray: invNames.some(
          (n: string) =>
            n.includes("XRAY") || n.includes("X-RAY") || n.includes("CHEST X"),
        ),
        ultrasound: invNames.some(
          (n: string) =>
            n.includes("ULTRASOUND") ||
            n.includes("USG") ||
            n.includes("SONOGRAPHY"),
        ),
        other: invNames.some(
          (n: string) =>
            !n.includes("CBC") &&
            !n.includes("HAEMOGRAM") &&
            !n.includes("HEMOGRAM") &&
            !n.includes("ECG") &&
            !n.includes("EKG") &&
            !n.includes("XRAY") &&
            !n.includes("X-RAY") &&
            !n.includes("ULTRASOUND") &&
            !n.includes("USG"),
        ),
      },
      customInvestigation: invNames
        .filter(
          (n: string) =>
            !n.includes("CBC") &&
            !n.includes("HAEMOGRAM") &&
            !n.includes("HEMOGRAM") &&
            !n.includes("ECG") &&
            !n.includes("EKG") &&
            !n.includes("XRAY") &&
            !n.includes("X-RAY") &&
            !n.includes("ULTRASOUND") &&
            !n.includes("USG"),
        )
        .join(", "),
      investigationRemarks: toStringValue(rec?.investigationRemarks ?? ""),

      // Clinical Notes
      symptoms: toStringValue(rec?.symptoms ?? ""),
      assessment: toStringValue(rec?.assessment ?? rec?.finalDiagnosis ?? ""),
      advice: toStringValue(rec?.advice ?? ""),
      lifestyleRecommendations: toStringValue(
        rec?.lifestyleRecommendations ?? "",
      ),

      generalAdvice: toStringValue(rec?.advice ?? ""),
      dietAdvice: toStringValue(rec?.lifestyleRecommendations ?? ""),
      precautions: toStringValue(rec?.followupNotes ?? ""),
      additionalInstructions: toStringValue(rec?.advice ?? ""),

      // Follow-up
      followupRequired: fuReq,
      nextVisitDate: toStringValue(rec?.nextVisitDate ?? ""),
      followupNotes: toStringValue(rec?.followupNotes ?? ""),
      followUpType: toStringValue(rec?.followUpType ?? "ROUTINE"),
      followUpIntervalValue: Number(rec?.followUpIntervalValue ?? 7),
      followUpIntervalUnit: toStringValue(rec?.followUpIntervalUnit ?? "DAYS"),

      // Revision Notes
      revisionReason: "",

      // Patient Context
      patientName: toStringValue(rec?.patientName ?? "—"),
      mrn: toStringValue(rec?.mrn ?? "—"),
      age: Number(rec?.age ?? 0),
      gender: toStringValue(rec?.gender ?? "—"),
      bloodGroup: toStringValue(rec?.bloodGroup ?? "—"),
      allergies: Array.isArray(rec?.allergies) ? rec.allergies : [],
    };
  };

  const initialForm = buildInitialFormData(initialRecord);

  // Consultation Form State
  const [formData, setFormData] = useState(initialForm);
  const [originalFormData, setOriginalFormData] = useState(initialForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // UI States
  const [showToast, setShowToast] = useState(false);
  const [, setAmendmentLogs] = useState<Array<Record<string, unknown>>>([]);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [isDraftSaved, setIsDraftSaved] = useState(false);
  const [isEditing, setIsEditing] = useState(autoEdit);
  const [editSnapshot, setEditSnapshot] = useState<typeof formData | null>(
    initialForm,
  );
  // ── LOAD CONSULTATION DATA FROM BACKEND ──
  useEffect(() => {
    let mounted = true;

    async function loadConsultation() {
      const targetIdStr = String(
        propEncounterId || consultationId || "",
      ).trim();
      const numericId = parseInt(targetIdStr.replace(/\D+/g, ""), 10) || 0;

      if (!numericId && !targetIdStr) {
        if (mounted) setLoading(false);
        return;
      }

      try {
        if (mounted) setLoading(true);

        // 1. Fetch Workspace
        let workspace: Record<string, unknown> | null = null;
        try {
          workspace = unwrapApiData(
            await encountersApi.getWorkspace(numericId || targetIdStr),
          );
        } catch (e) {
          console.warn("Workspace fetch warning:", e);
        }

        if (!mounted) return;

        const encounter = (workspace?.encounter ?? {}) as Record<
          string,
          unknown
        >;
        let patient = (workspace?.patient ?? {}) as Record<string, unknown>;
        const appointment = (workspace?.appointment ?? {}) as Record<
          string,
          unknown
        >;
        let doctor = (workspace?.doctor ?? {}) as Record<string, unknown>;
        let vitals = (workspace?.vitals ?? {}) as Record<string, unknown>;

        const realEncounterId = Number(
          encounter.encounterId ?? encounter.id ?? numericId,
        );

        // 1.b Fallback Patient details fetch
        const targetMrn =
          patient.mrn ||
          encounter.patientMrn ||
          appointment.mrn ||
          patient.mrnNumber;
        const targetPatientId =
          patient.id || patient.patientId || encounter.patientId;
        if (
          !patient.fullName &&
          !patient.name &&
          (targetMrn || targetPatientId)
        ) {
          try {
            if (targetMrn) {
              const pRes = unwrapApiData<Record<string, unknown>>(
                await patientsApi.getPatientByMrn(String(targetMrn)),
              );
              if (pRes) patient = { ...patient, ...pRes };
            } else if (targetPatientId) {
              const pRes = unwrapApiData<Record<string, unknown>>(
                await patientsApi.getById(String(targetPatientId)),
              );
              if (pRes) patient = { ...patient, ...pRes };
            }
          } catch (e) {
            console.warn("Patient fetch warning:", e);
          }
        }

        // 1.c Fallback Doctor details fetch
        const targetDocId =
          doctor.id ||
          doctor.doctorId ||
          encounter.doctorId ||
          appointment.doctorId;
        if (!doctor.fullName && !doctor.name && targetDocId) {
          try {
            const dRes = unwrapApiData<Record<string, unknown>>(
              await doctorsApi.getById(String(targetDocId)),
            );
            if (dRes) doctor = { ...doctor, ...dRes };
          } catch (e) {
            console.warn("Doctor fetch warning:", e);
          }
        }

        // 1.d Fallback Vitals fetch
        if (
          !vitals.height &&
          !vitals.temperature &&
          !vitals.bloodPressure &&
          !vitals.bp &&
          realEncounterId
        ) {
          try {
            const vRes = unwrapApiData<Record<string, unknown>>(
              await vitalsApi.getVitalsByEncounterId(realEncounterId),
            );
            if (vRes) vitals = { ...vitals, ...vRes };
          } catch (e) {
            console.warn("Vitals fetch warning:", e);
          }
        }

        // 2. Fetch Consultation
        let consultation: Record<string, unknown> | null =
          (workspace?.consultation ?? null) as Record<string, unknown> | null;
        if (!consultation?.id && realEncounterId) {
          try {
            consultation = unwrapApiData(
              await encountersApi.getConsultation(realEncounterId),
            );
          } catch (e) {
            console.warn("Consultation details fetch warning:", e);
          }
        }

        // 3. Fetch Diagnoses
        let diagnoses: Array<Record<string, unknown>> = Array.isArray(
          workspace?.diagnoses,
        )
          ? (workspace?.diagnoses as Array<Record<string, unknown>>)
          : [];
        if (diagnoses.length === 0 && realEncounterId) {
          try {
            const diagRes = unwrapApiData<Array<Record<string, unknown>>>(
              await encountersApi.getDiagnoses(realEncounterId),
            );
            diagnoses = Array.isArray(diagRes) ? diagRes : [];
          } catch (e) {
            console.warn("Diagnoses fetch warning:", e);
          }
        }

        const primaryDiagnosis =
          diagnoses.find(
            (d) =>
              d.active !== false &&
              (d.diagnosisType === "PRIMARY" || d.type === "PRIMARY"),
          ) ??
          diagnoses.find((d) => d.active !== false) ??
          {};

        const provisionalDiagnosisObj =
          diagnoses.find(
            (d) =>
              d.active !== false &&
              (d.diagnosisType === "PROVISIONAL" || d.type === "PROVISIONAL"),
          ) ?? {};

        // 4. Fetch Prescription
        let prescription: Record<string, unknown> | null = null;
        if (realEncounterId) {
          try {
            prescription = unwrapApiData<Record<string, unknown>>(
              await encountersApi.getPrescriptionByEncounterId(realEncounterId),
            );
          } catch (e) {
            console.warn("Prescription fetch warning:", e);
          }
        }

        // 5. Fetch Amendments Log
        let amendments: Array<Record<string, unknown>> = [];
        if (realEncounterId) {
          try {
            const amendRes = unwrapApiData<Array<Record<string, unknown>>>(
              await encountersApi.getAmendments(realEncounterId),
            );
            amendments = Array.isArray(amendRes) ? amendRes : [];
          } catch (e) {
            console.warn("Amendments fetch warning:", e);
          }
        }

        // 6. Map Medications
        const rawMeds = Array.isArray(prescription?.medications)
          ? (prescription?.medications as Array<Record<string, unknown>>)
          : [];
        const medicines: MedicineItem[] = rawMeds.map(
          (med: Record<string, unknown>, idx: number) => {
            const freqObj = med.frequency as
              | Record<string, unknown>
              | undefined;
            const durObj = med.duration as Record<string, unknown> | undefined;
            const qtyObj = med.quantity as Record<string, unknown> | undefined;
            const doseObj = med.dose as Record<string, unknown> | undefined;
            const doseVal = (() => {
              if (doseObj && typeof doseObj === "object") {
                const val = doseObj.value != null ? String(doseObj.value) : "";
                const unit = doseObj.unit != null ? String(doseObj.unit) : "";
                const text = `${val} ${unit}`.trim();
                if (text) return text;
              }
              if (med.doseValue != null || med.doseUnit != null) {
                const val = med.doseValue != null ? String(med.doseValue) : "";
                const unit = med.doseUnit != null ? String(med.doseUnit) : "";
                const text = `${val} ${unit}`.trim();
                if (text) return text;
              }
              if (typeof med.dosage === "string" && med.dosage.trim())
                return med.dosage.trim();
              if (typeof med.dose === "string" && med.dose.trim())
                return med.dose.trim();
              if (typeof med.strength === "string" && med.strength.trim())
                return med.strength.trim();
              return "";
            })();

            return {
              id: String(med.medicationId ?? med.id ?? idx + 1),
              medicationId: Number(med.medicationId ?? med.id ?? 0),
              name: toStringValue(med.medicineName ?? med.name),
              dosage:
                doseVal || toStringValue(med.strength ?? med.dosage ?? "1 tab"),
              frequency: toStringValue(
                freqObj?.display ??
                  med.frequencyDisplay ??
                  med.frequency ??
                  "Once Daily",
              ),
              frequencyCode: toStringValue(
                freqObj?.code ?? med.frequencyCode ?? "QD",
              ),
              duration: durObj
                ? `${toStringValue(durObj.value)} ${toStringValue(durObj.unit)}`.trim()
                : toStringValue(med.duration),
              durationValue: Number(durObj?.value ?? med.durationValue ?? 0),
              durationUnit: toStringValue(
                durObj?.unit ?? med.durationUnit ?? "DAYS",
              ),
              quantityValue: Number(qtyObj?.value ?? med.quantityValue ?? 0),
              quantityUnit: toStringValue(qtyObj?.unit ?? med.quantityUnit),
              doseValue: Number(doseObj?.value ?? med.doseValue ?? 0),
              doseUnit: toStringValue(doseObj?.unit ?? med.doseUnit),
              form: toStringValue(med.form),
              route: toStringValue(med.route),
              instructions: toStringValue(med.instructions),
            };
          },
        );

        // 7. Map Vitals
        const bpObj =
          vitals.bloodPressure && typeof vitals.bloodPressure === "object"
            ? (vitals.bloodPressure as Record<string, unknown>)
            : null;
        const bpStr = bpObj
          ? `${toStringValue(bpObj.systolic)}/${toStringValue(bpObj.diastolic)}`
          : typeof vitals.bloodPressure === "string" ||
              typeof vitals.bloodPressure === "number"
            ? String(vitals.bloodPressure)
            : vitals.bpSystolic != null && vitals.bpDiastolic != null
              ? `${vitals.bpSystolic}/${vitals.bpDiastolic}`
              : toStringValue(vitals.bp);

        const getVitalVal = (v: unknown): string => {
          if (v === null || v === undefined) return "";
          if (typeof v === "object" && v !== null && "value" in v) {
            return toStringValue((v as Record<string, unknown>).value);
          }
          return toStringValue(v);
        };

        const realDocName =
          doctor?.fullName ??
          doctor?.name ??
          appointment?.doctorName ??
          encounter?.doctorName ??
          "—";
        const realDept =
          doctor?.department ??
          appointment?.department ??
          encounter?.department ??
          "—";
        const realPatientName =
          patient?.fullName ?? patient?.name ?? appointment?.patientName ?? "—";
        const realMrn =
          patient?.mrn ?? appointment?.mrn ?? encounter?.mrn ?? "—";

        const rawVisitType = String(
          appointment?.visitType ?? encounter?.visitType ?? "First Visit",
        );
        const visitType: "New Consultation" | "Follow-up" | "First Visit" =
          rawVisitType === "Follow-up" || rawVisitType === "New Consultation"
            ? rawVisitType
            : "First Visit";

        const adviceObj = prescription?.advice as
          | Record<string, unknown>
          | undefined;
        const followUpObj = prescription?.followUp as
          | Record<string, unknown>
          | undefined;

        const loadedData = {
          consultationId: toStringValue(
            consultation?.id ??
              encounter?.encounterNumber ??
              realEncounterId ??
              targetIdStr,
          ),
          consultationNumericId: Number(consultation?.id ?? 0),
          encounterId: realEncounterId,
          diagnosisId: Number(
            primaryDiagnosis?.id ?? primaryDiagnosis?.diagnosisId ?? 0,
          ),
          prescriptionId: Number(
            prescription?.id ?? prescription?.prescriptionId ?? 0,
          ),
          version: Number(consultation?.version ?? encounter?.version ?? 1),

          status: toStringValue(
            consultation?.status ?? encounter?.status ?? "Completed",
          ),
          createdBy: toStringValue(encounter?.createdBy ?? realDocName),
          createdDate: formatDateTime(
            encounter?.createdAt ??
              encounter?.startedAt ??
              encounter?.visitDate ??
              appointment?.appointmentDate ??
              consultation?.createdAt,
          ),
          lastUpdatedBy: toStringValue(encounter?.updatedBy ?? realDocName),
          lastUpdatedDate: formatDateTime(
            encounter?.updatedAt ??
              encounter?.completedAt ??
              encounter?.finalizedAt ??
              consultation?.updatedAt ??
              encounter?.createdAt,
          ),
          revisionNumber: Number(
            consultation?.version ?? encounter?.version ?? 1,
          ),

          visitDate: toStringValue(
            appointment?.appointmentDate ??
              appointment?.date ??
              encounter?.visitDate ??
              new Date().toISOString().split("T")[0],
          ),
          doctorName: toStringValue(realDocName),
          department: toStringValue(realDept),
          visitType,
          chiefComplaint: toStringValue(
            consultation?.chiefComplaint ?? workspace?.chiefComplaint ?? "",
          ),
          durationOfSymptoms: toStringValue(
            consultation?.durationOfSymptoms ?? "",
          ),

          height: getVitalVal(vitals?.height),
          weight: getVitalVal(vitals?.weight),
          temperature:
            getVitalVal(vitals?.temperature) || getVitalVal(vitals?.temp),
          bp: toStringValue(bpStr),
          pulse:
            getVitalVal(vitals?.pulseRate) ||
            getVitalVal(vitals?.pulse) ||
            getVitalVal(vitals?.heartRate),
          respiratoryRate: getVitalVal(vitals?.respiratoryRate),
          spo2:
            getVitalVal(vitals?.oxygenSaturation) || getVitalVal(vitals?.spo2),
          bloodSugar:
            getVitalVal(vitals?.bloodSugar) ||
            getVitalVal(vitals?.sugar) ||
            getVitalVal(vitals?.bloodSugarMgDl) ||
            getVitalVal(vitals?.randomBloodSugar) ||
            getVitalVal(vitals?.fastingBloodSugar) ||
            getVitalVal(vitals?.blood_sugar) ||
            getVitalVal(vitals?.glucose) ||
            "",

          clinicalExamination:
            [
              consultation?.generalExamination,
              consultation?.physicalExamination,
            ]
              .filter(Boolean)
              .join("\n") ||
            toStringValue(consultation?.examinationNotes ?? ""),
          provisionalDiagnosis: toStringValue(
            consultation?.provisionalDiagnosis ??
              provisionalDiagnosisObj.diagnosisName ??
              provisionalDiagnosisObj.name ??
              primaryDiagnosis?.diagnosisName ??
              "",
          ),
          finalDiagnosis: toStringValue(
            primaryDiagnosis?.diagnosisName ??
              consultation?.assessmentSummary ??
              "",
          ),
          icdCode: toStringValue(primaryDiagnosis?.diagnosisCode ?? ""),

          medicines: medicines,

          investigations: (() => {
            const rawInv =
              workspace?.investigations ||
              workspace?.orders ||
              workspace?.labOrders ||
              workspace?.radiologyOrders ||
              consultation?.investigations ||
              [];
            const invNames = Array.isArray(rawInv)
              ? (rawInv as Array<Record<string, unknown> | string>).map(
                  (item) => {
                    if (typeof item === "string") return item.toUpperCase();
                    return String(
                      (item as Record<string, unknown>)?.testName ||
                        (item as Record<string, unknown>)?.investigationName ||
                        (item as Record<string, unknown>)?.name ||
                        (item as Record<string, unknown>)?.displayName ||
                        (item as Record<string, unknown>)?.testCode ||
                        "",
                    ).toUpperCase();
                  },
                )
              : [];
            return {
              cbc: invNames.some(
                (n: string) =>
                  n.includes("CBC") ||
                  n.includes("HAEMOGRAM") ||
                  n.includes("HEMOGRAM"),
              ),
              ecg: invNames.some(
                (n: string) => n.includes("ECG") || n.includes("EKG"),
              ),
              xray: invNames.some(
                (n: string) =>
                  n.includes("XRAY") ||
                  n.includes("X-RAY") ||
                  n.includes("CHEST X"),
              ),
              ultrasound: invNames.some(
                (n: string) =>
                  n.includes("ULTRASOUND") ||
                  n.includes("USG") ||
                  n.includes("SONOGRAPHY"),
              ),
              other: invNames.some(
                (n: string) =>
                  !n.includes("CBC") &&
                  !n.includes("HAEMOGRAM") &&
                  !n.includes("HEMOGRAM") &&
                  !n.includes("ECG") &&
                  !n.includes("EKG") &&
                  !n.includes("XRAY") &&
                  !n.includes("X-RAY") &&
                  !n.includes("ULTRASOUND") &&
                  !n.includes("USG"),
              ),
            };
          })(),
          customInvestigation: toStringValue(
            workspace?.customInvestigation ??
              consultation?.customInvestigation ??
              "",
          ),
          investigationRemarks: toStringValue(
            workspace?.investigationRemarks ??
              consultation?.investigationRemarks ??
              "",
          ),

          symptoms: toStringValue(
            consultation?.chiefComplaint ??
              consultation?.historyOfPresentIllness ??
              consultation?.symptoms ??
              "",
          ),
          assessment: toStringValue(
            primaryDiagnosis?.diagnosisName ??
              consultation?.assessmentSummary ??
              consultation?.assessment ??
              "",
          ),
          advice: toStringValue(
            adviceObj?.general ??
              consultation?.advice ??
              consultation?.generalAdvice ??
              "",
          ),
          lifestyleRecommendations: toStringValue(adviceObj?.diet ?? ""),

          generalAdvice: toStringValue(adviceObj?.general ?? ""),
          dietAdvice: toStringValue(adviceObj?.diet ?? ""),
          precautions: toStringValue(adviceObj?.precautions ?? ""),
          additionalInstructions: toStringValue(
            adviceObj?.additionalInstructions ?? "",
          ),

          followupRequired: Boolean(
            followUpObj?.followUpDate ??
            consultation?.followUpDate ??
            consultation?.followUpInstructions,
          ),
          nextVisitDate: toStringValue(
            followUpObj?.followUpDate ?? consultation?.followUpDate ?? "",
          ),
          followupNotes: toStringValue(
            followUpObj?.instructions ??
              consultation?.followUpInstructions ??
              "",
          ),
          followUpType: toStringValue(
            consultation?.followUpType ?? followUpObj?.type ?? "ROUTINE",
          ),
          followUpIntervalValue: Number(
            consultation?.followUpIntervalValue ??
              followUpObj?.intervalValue ??
              7,
          ),
          followUpIntervalUnit: toStringValue(
            consultation?.followUpIntervalUnit ??
              followUpObj?.intervalUnit ??
              "DAYS",
          ),

          revisionReason: toStringValue(consultation?.revisionReason ?? ""),

          patientName: toStringValue(realPatientName),
          mrn: toStringValue(realMrn),
          age: Number(patient?.age ?? 0),
          gender: toStringValue(patient?.gender ?? "—"),
          bloodGroup: toStringValue(patient?.bloodGroup ?? "—"),
          allergies: Array.isArray(patient?.allergies)
            ? patient.allergies
            : patient?.allergies
              ? [String(patient.allergies)]
              : [],
        };

        if (mounted) {
          setAmendmentLogs(amendments);
          setFormData(loadedData);
          setOriginalFormData(structuredClone(loadedData));
          setEditSnapshot(structuredClone(loadedData));
        }
      } catch (err) {
        console.error("Failed to load consultation:", err);
        if (mounted) {
          setValidationErrors([
            "Unable to load consultation details from backend.",
          ]);
        }
      } finally {
        if (mounted) setLoading(false);
      }
    }

    void loadConsultation();

    return () => {
      mounted = false;
    };
  }, [consultationId, propEncounterId]);

  // Auto-calculated BMI
  const calculatedBmi = useMemo(() => {
    const h = parseFloat(formData.height) / 100;
    const w = parseFloat(formData.weight);
    if (h > 0 && w > 0) return (w / (h * h)).toFixed(1);
    return "--";
  }, [formData.height, formData.weight]);

  const handleStartEditing = () => {
    setEditSnapshot(structuredClone(formData));
    setValidationErrors([]);
    setIsEditing(true);
  };

  const handleCancelEditing = () => {
    if (editSnapshot) {
      setFormData(structuredClone(editSnapshot));
    } else {
      setFormData(structuredClone(originalFormData));
    }
    setEditSnapshot(null);
    setValidationErrors([]);
    setIsEditing(false);
  };

  // Add Medicine Row
  const handleAddMedicine = () => {
    if (!isEditing) return;
    const newMed: MedicineItem = {
      id: Date.now().toString(),
      name: "",
      dosage: "5mg",
      frequency: "Once Daily",
      duration: "7 Days",
      instructions: "After Meals",
    };
    setFormData((prev) => ({
      ...prev,
      medicines: [...prev.medicines, newMed],
    }));
  };

  // Update Medicine Row
  const handleUpdateMedicine = (
    id: string,
    field: keyof MedicineItem,
    val: string,
  ) => {
    if (!isEditing) return;
    setFormData((prev) => ({
      ...prev,
      medicines: prev.medicines.map((m) =>
        m.id === id ? { ...m, [field]: val } : m,
      ),
    }));
  };

  // Remove Medicine Row
  const handleRemoveMedicine = (id: string) => {
    if (!isEditing) return;
    setFormData((prev) => ({
      ...prev,
      medicines: prev.medicines.filter((m) => m.id !== id),
    }));
  };

  // Save Draft Action
  const handleSaveDraft = async () => {
    if (!isEditing) return;
    try {
      if (formData.encounterId > 0) {
        await encountersApi.saveDraft(formData.encounterId, {
          chiefComplaint: formData.chiefComplaint,
          finalDiagnosis: formData.finalDiagnosis,
          revisionReason: formData.revisionReason,
          formData,
        });
      }
    } catch (e) {
      console.warn("Draft save notice:", e);
    }
    setIsDraftSaved(true);
    setEditSnapshot(structuredClone(formData));
    setTimeout(() => setIsDraftSaved(false), 2500);
  };

  // Update Consultation Action (API PUT Calls)
  const handleUpdateConsultation = async () => {
    if (saving) return;

    const errors: string[] = [];
    if (!formData.chiefComplaint.trim())
      errors.push("Chief Complaint is required.");
    if (!formData.finalDiagnosis.trim())
      errors.push("Final Diagnosis is required.");
    if (!formData.revisionReason.trim())
      errors.push("Revision Reason is mandatory before saving changes.");

    if (errors.length > 0) {
      setValidationErrors(errors);
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    setValidationErrors([]);
    setSaving(true);

    try {
      const encounterId = Number(formData.encounterId);
      const consultationIdNum = Number(
        formData.consultationNumericId || encounterId,
      );

      // 1. UPDATE CONSULTATION & FOLLOW-UP (PUT /api/v1/encounters/{encounterId}/consultation)
      if (encounterId > 0 || consultationIdNum > 0) {
        const targetEncId = encounterId || consultationIdNum;
        const consultationPayload = {
          chiefComplaint: formData.chiefComplaint,
          historyOfPresentIllness: formData.symptoms,
          generalExamination: formData.clinicalExamination,
          assessmentSummary: formData.assessment || formData.finalDiagnosis,
          advice: formData.advice,
          followUpInstructions: formData.followupNotes,
          followUpType: formData.followupRequired
            ? formData.followUpType || "ROUTINE"
            : undefined,
          followUpIntervalValue: formData.followupRequired
            ? Number(formData.followUpIntervalValue || 7)
            : undefined,
          followUpIntervalUnit: formData.followupRequired
            ? formData.followUpIntervalUnit || "DAYS"
            : undefined,
          followUpDate: formData.followupRequired
            ? formData.nextVisitDate
            : undefined,
        };

        try {
          await encountersApi.initConsultationPut(
            targetEncId,
            consultationPayload,
          );
        } catch (e) {
          console.warn(
            "PUT /api/v1/encounters/{id}/consultation fallback notice:",
            e,
          );
          if (consultationIdNum > 0) {
            await encountersApi.updateClinicalNotes(consultationIdNum, {
              ...consultationPayload,
              version: formData.version,
            });
          }
        }
      }

      // 2. UPDATE VITALS
      if (encounterId > 0) {
        const [systolic, diastolic] = formData.bp.split("/").map(Number);

        await encountersApi.updateVitals(encounterId, {
          temperature: formData.temperature
            ? { value: Number(formData.temperature), unit: "FAHRENHEIT" }
            : undefined,
          bloodPressure:
            Number.isFinite(systolic) && Number.isFinite(diastolic)
              ? { systolic, diastolic, unit: "mmHg" }
              : undefined,
          pulseRate: formData.pulse
            ? { value: Number(formData.pulse), unit: "bpm" }
            : undefined,
          respiratoryRate: formData.respiratoryRate
            ? { value: Number(formData.respiratoryRate), unit: "breaths/min" }
            : undefined,
          oxygenSaturation: formData.spo2
            ? { value: Number(formData.spo2), unit: "%" }
            : undefined,
          weight: formData.weight
            ? { value: Number(formData.weight), unit: "kg" }
            : undefined,
          height: formData.height
            ? { value: Number(formData.height), unit: "cm" }
            : undefined,

          tempValue: Number(formData.temperature),
          bloodPressureStr: formData.bp,
          bpSystolicVal: Number(systolic),
          bpDiastolicVal: Number(diastolic),
          pulseVal: Number(formData.pulse),
          respiratoryRateVal: Number(formData.respiratoryRate),
          spo2Val: Number(formData.spo2),
          weightVal: Number(formData.weight),
          heightVal: Number(formData.height),
          chiefComplaint: formData.chiefComplaint,
          symptoms: formData.symptoms,
        });
      }

      // 3. UPDATE DIAGNOSIS
      if (encounterId > 0 && formData.diagnosisId > 0) {
        await encountersApi.updateDiagnosis(encounterId, formData.diagnosisId, {
          diagnosisCode: formData.icdCode,
          diagnosisName: formData.finalDiagnosis,
          codingSystem: "ICD-10",
          diagnosisType: "PRIMARY",
          certainty: "CONFIRMED",
          clinicalNotes: formData.assessment,
        });
      }

      // 4. UPDATE PRESCRIPTION ADVICE
      if (formData.prescriptionId > 0) {
        await encountersApi.updatePrescriptionAdvice(formData.prescriptionId, {
          generalAdvice: formData.advice || formData.generalAdvice,
          dietAdvice: formData.lifestyleRecommendations || formData.dietAdvice,
          precautions: formData.followupNotes || formData.precautions,
          additionalInstructions:
            formData.advice || formData.additionalInstructions,
          followUpRequired: formData.followupRequired,
          followUpDate: formData.followupRequired
            ? formData.nextVisitDate
            : undefined,
          followUpNotes: formData.followupNotes,
        });
      }

      // 5. UPDATE EXISTING MEDICATIONS
      if (formData.prescriptionId > 0 && formData.medicines.length > 0) {
        const medicationUpdates = formData.medicines
          .filter((med) => med.medicationId && med.medicationId > 0)
          .map((med) =>
            encountersApi.updatePrescriptionMedication(
              formData.prescriptionId,
              med.medicationId!,
              {
                strength: med.dosage,
                form: med.form,
                route: med.route,
                doseValue:
                  med.doseValue || Number(med.dosage.replace(/\D+/g, "")) || 0,
                doseUnit: med.doseUnit || "mg",
                frequencyCode: med.frequencyCode || "QD",
                frequencyDisplay: med.frequency,
                durationValue:
                  med.durationValue ||
                  Number(med.duration.replace(/\D+/g, "")) ||
                  0,
                durationUnit: med.durationUnit || "DAYS",
                quantityValue: med.quantityValue || 0,
                quantityUnit: med.quantityUnit || "tablets",
                instructions: med.instructions,
              },
            ),
          );

        await Promise.all(medicationUpdates);
      }

      // 6. SUCCESS ACTIONS
      setOriginalFormData(structuredClone(formData));
      setEditSnapshot(null);
      setIsEditing(false);
      setShowToast(true);

      setTimeout(() => {
        setShowToast(false);
        if (onUpdateSuccess) onUpdateSuccess();
      }, 2000);
    } catch (error: unknown) {
      console.error("Consultation update failed:", error);
      const errObj = error as { message?: string };
      setValidationErrors([
        errObj?.message ||
          "Failed to update consultation. Please check API connection and try again.",
      ]);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } finally {
      setSaving(false);
    }
  };

  // Count active investigations
  const activeInvestigationsCount = useMemo(() => {
    let count = Object.values(formData.investigations).filter(Boolean).length;
    if (formData.customInvestigation.trim()) count++;
    return count;
  }, [formData.investigations, formData.customInvestigation]);

  if (loading) {
    return (
      <div className="flex-1 bg-[#F1F5F9] flex items-center justify-center p-12 min-h-100">
        <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm text-center max-w-sm w-full space-y-3">
          <Loader2 size={32} className="text-[#0D47A1] animate-spin mx-auto" />
          <p
            className="text-sm font-bold text-slate-800"
            style={{ fontFamily: PP }}
          >
            Loading Consultation Details
          </p>
          <p className="text-xs text-slate-500" style={{ fontFamily: RB }}>
            Fetching patient encounter records, vitals, diagnoses, and
            prescriptions...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 bg-[#F1F5F9] overflow-y-auto flex flex-col font-sans relative pb-24">
      {/* ── SUCCESS TOAST NOTIFICATION ── */}
      {showToast && (
        <div
          className="fixed top-5 right-5 z-50 bg-[#66BB6A] text-white px-5 py-3.5 rounded-2xl shadow-xl flex items-center gap-3 animate-in fade-in slide-in-from-top-4"
          style={{ fontFamily: PP }}
        >
          <CheckCircle2 size={20} />
          <div>
            <div className="font-bold text-sm">
              Consultation updated successfully.
            </div>
            <div
              className="text-xs opacity-90 font-sans"
              style={{ fontFamily: RB }}
            >
              Revision record #{formData.revisionNumber} saved to patient log.
            </div>
          </div>
        </div>
      )}

      {/* ── DRAFT TOAST NOTIFICATION ── */}
      {isDraftSaved && (
        <div
          className="fixed top-5 right-5 z-50 bg-[#0D47A1] text-white px-5 py-3 rounded-2xl shadow-xl flex items-center gap-3 animate-in fade-in slide-in-from-top-4"
          style={{ fontFamily: PP }}
        >
          <Save size={18} />
          <div className="text-xs font-semibold">
            Edit draft saved successfully.
          </div>
        </div>
      )}

      {/* ── BREADCRUMB & HEADER SECTION ── */}
      <EditConsultationHeader
        isEditing={isEditing}
        saving={saving}
        revisionNumber={formData.revisionNumber}
        onStartEditing={handleStartEditing}
        onCancelEditing={handleCancelEditing}
        onBack={onBack}
      />

      <EditConsultationPatientBanner
        patientInitials={
          formData.patientName
            .split(" ")
            .map((n) => n[0])
            .join("")
            .slice(0, 2) || "PT"
        }
        patientName={formData.patientName}
        mrn={formData.mrn}
        consultationId={formData.consultationId}
        age={formData.age}
        gender={formData.gender}
        bloodGroup={formData.bloodGroup}
        tokenNo={
          formData.consultationNumericId
            ? String(formData.consultationNumericId)
            : ""
        }
        doctorName={formData.doctorName}
        department={formData.department}
        visitDate={formData.visitDate}
        allergies={formData.allergies}
        onViewPatientProfile={() => {}}
        onViewHistory={handleViewHistory}
      />

      {/* ── MAIN WORKSPACE CONTAINER ── */}
      <div className="p-6 space-y-6">
        {!isEditing && (
          <div className="flex items-center justify-between gap-4 px-4 py-3 bg-blue-50 border border-blue-100 rounded-2xl">
            <div
              className="flex items-center gap-2 text-xs text-[#0D47A1]"
              style={{ fontFamily: RB }}
            >
              <Info size={15} />
              <span>
                Consultation is in view mode. Click{" "}
                <strong>Edit All Details</strong> to edit all editable fields at
                once.
              </span>
            </div>
            <span className="shrink-0 text-[10px] font-bold uppercase tracking-wide text-[#0D47A1] bg-white border border-blue-200 px-2 py-1 rounded-lg">
              View Mode
            </span>
          </div>
        )}

        {isEditing && (
          <div className="flex items-center justify-between gap-4 px-4 py-3 bg-amber-50 border border-amber-200 rounded-2xl">
            <div
              className="flex items-center gap-2 text-xs text-amber-900"
              style={{ fontFamily: RB }}
            >
              <Edit3 size={15} />
              <span>
                <strong>Editing all consultation details.</strong> Doctor,
                department, and audit metadata remain read-only.
              </span>
            </div>
            <span className="shrink-0 text-[10px] font-bold uppercase tracking-wide text-amber-800 bg-white border border-amber-200 px-2 py-1 rounded-lg">
              Edit Mode
            </span>
          </div>
        )}

        {/* VALIDATION ERROR BANNER */}
        {validationErrors.length > 0 && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-2xl space-y-1">
            <div
              className="flex items-center gap-2 text-xs font-bold text-red-700"
              style={{ fontFamily: PP }}
            >
              <AlertCircle size={16} />
              Please resolve the following required fields before updating
              consultation:
            </div>
            <ul
              className="list-disc list-inside text-xs text-red-600 pl-6 space-y-0.5"
              style={{ fontFamily: RB }}
            >
              {validationErrors.map((err) => (
                <li key={err}>{err}</li>
              ))}
            </ul>
          </div>
        )}

        <EditConsultationMetadataCard
          consultationId={formData.consultationId}
          appointmentId={formData.encounterId}
          doctorName={formData.doctorName}
          department={formData.department}
          status={formData.status}
          createdBy={formData.createdBy}
          createdDate={formData.createdDate}
          lastUpdatedBy={formData.lastUpdatedBy}
          lastUpdatedDate={formData.lastUpdatedDate}
          revisionNumber={formData.revisionNumber}
        />

        {/* 2-COLUMN ENTERPRISE WORKSPACE GRID */}
        <div className="grid grid-cols-1  gap-6 items-start">
          {/* LEFT WORKSPACE (70% on desktop: col-span-8) */}
          <div className="lg:col-span-8 space-y-5">
            <EditConsultationVisitInfoCard
              collapsed={collapsedSections.visitInfo}
              onToggle={() => toggleSection("visitInfo")}
              isEditing={isEditing}
              formData={formData}
              setFormData={setFormData}
            />

            <EditConsultationVitalsCard
              collapsed={collapsedSections.vitals}
              onToggle={() => toggleSection("vitals")}
              isEditing={isEditing}
              calculatedBmi={calculatedBmi}
              formData={formData}
              setFormData={setFormData}
            />

            <EditConsultationExaminationCard
              collapsed={collapsedSections.examination}
              onToggle={() => toggleSection("examination")}
              isEditing={isEditing}
              formData={formData}
              setFormData={setFormData}
            />

            {/* ── SECTION 04: PRESCRIPTION ── */}
            <div className="bg-white rounded-2xl border border-[#E5E7EB] shadow-sm overflow-hidden">
              <button
                onClick={() => toggleSection("prescription")}
                className="w-full px-5 py-4 bg-slate-50/50 flex items-center justify-between border-b border-gray-100 cursor-pointer"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center font-bold text-xs">
                    04
                  </div>
                  <h3
                    className="text-sm font-bold text-[#111827]"
                    style={{ fontFamily: PP }}
                  >
                    Prescription
                  </h3>
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className="text-[11px] font-bold text-[#0D47A1] bg-blue-50 px-2 py-0.5 rounded-full"
                    style={{ fontFamily: PP }}
                  >
                    Total: {formData.medicines.length} Medicines
                  </span>
                  <ChevronDown
                    size={18}
                    className={`text-slate-400 transition-transform ${collapsedSections.prescription ? "-rotate-90" : ""}`}
                  />
                </div>
              </button>

              {!collapsedSections.prescription && (
                <div className="p-5 space-y-4">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr
                          className="bg-slate-50 border-b border-gray-100 text-[11px] font-bold text-[#64748B] uppercase"
                          style={{ fontFamily: PP }}
                        >
                          <th className="py-2.5 px-3">Medicine</th>
                          <th className="py-2.5 px-3">Dosage</th>
                          <th className="py-2.5 px-3">Frequency</th>
                          <th className="py-2.5 px-3">Duration</th>
                          <th className="py-2.5 px-3">Instructions</th>
                          <th className="py-2.5 px-3 text-right">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {formData.medicines.map((m) => (
                          <tr key={m.id} className="hover:bg-slate-50">
                            <td className="py-2 px-3">
                              <input
                                disabled={!isEditing}
                                type="text"
                                value={m.name}
                                onChange={(e) =>
                                  handleUpdateMedicine(
                                    m.id,
                                    "name",
                                    e.target.value,
                                  )
                                }
                                className="w-full px-2.5 py-1.5 bg-slate-50 border border-[#E5E7EB] rounded-lg text-xs font-semibold text-[#111827] disabled:opacity-65 disabled:bg-slate-100"
                                style={{ fontFamily: RB }}
                              />
                            </td>
                            <td className="py-2 px-3">
                              <input
                                disabled={!isEditing}
                                type="text"
                                value={m.dosage}
                                onChange={(e) =>
                                  handleUpdateMedicine(
                                    m.id,
                                    "dosage",
                                    e.target.value,
                                  )
                                }
                                className="w-full px-2.5 py-1.5 bg-slate-50 border border-[#E5E7EB] rounded-lg text-xs text-[#111827] disabled:opacity-65 disabled:bg-slate-100"
                                style={{ fontFamily: RB }}
                              />
                            </td>
                            <td className="py-2 px-3">
                              <select
                                disabled={!isEditing}
                                value={m.frequency}
                                onChange={(e) =>
                                  handleUpdateMedicine(
                                    m.id,
                                    "frequency",
                                    e.target.value,
                                  )
                                }
                                className="w-full px-2 py-1.5 bg-slate-50 border border-[#E5E7EB] rounded-lg text-xs text-[#111827] disabled:opacity-65 disabled:bg-slate-100"
                                style={{ fontFamily: RB }}
                              >
                                <option value="Once Daily">Once Daily</option>
                                <option value="Twice Daily">Twice Daily</option>
                                <option value="Thrice Daily">
                                  Thrice Daily
                                </option>
                                <option value="PRN (As Needed)">
                                  PRN (As Needed)
                                </option>
                              </select>
                            </td>
                            <td className="py-2 px-3">
                              <input
                                disabled={!isEditing}
                                type="text"
                                value={m.duration}
                                onChange={(e) =>
                                  handleUpdateMedicine(
                                    m.id,
                                    "duration",
                                    e.target.value,
                                  )
                                }
                                className="w-full px-2.5 py-1.5 bg-slate-50 border border-[#E5E7EB] rounded-lg text-xs text-[#111827] disabled:opacity-65 disabled:bg-slate-100"
                                style={{ fontFamily: RB }}
                              />
                            </td>
                            <td className="py-2 px-3">
                              <input
                                disabled={!isEditing}
                                type="text"
                                value={m.instructions}
                                onChange={(e) =>
                                  handleUpdateMedicine(
                                    m.id,
                                    "instructions",
                                    e.target.value,
                                  )
                                }
                                className="w-full px-2.5 py-1.5 bg-slate-50 border border-[#E5E7EB] rounded-lg text-xs text-[#111827] disabled:opacity-65 disabled:bg-slate-100"
                                style={{ fontFamily: RB }}
                              />
                            </td>
                            <td className="py-2 px-3 text-right">
                              <button
                                onClick={() => handleRemoveMedicine(m.id)}
                                disabled={!isEditing}
                                className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg hover:bg-red-50 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                              >
                                <Trash2 size={15} />
                              </button>
                            </td>
                          </tr>
                        ))}
                        {formData.medicines.length === 0 && (
                          <tr>
                            <td
                              colSpan={6}
                              className="py-4 text-center text-xs text-slate-400"
                              style={{ fontFamily: RB }}
                            >
                              No medicines added yet.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>

                  <button
                    onClick={handleAddMedicine}
                    disabled={!isEditing}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-[#0D47A1] hover:bg-blue-100 rounded-xl text-xs font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                    style={{ fontFamily: PP }}
                  >
                    <Plus size={14} />+ Add Medicine
                  </button>
                </div>
              )}
            </div>

            {/* ── SECTION 05: INVESTIGATION RECOMMENDATION (READ-ONLY) ── */}
            <div className="bg-white rounded-2xl border border-[#E5E7EB] shadow-sm overflow-hidden">
              <button
                onClick={() => toggleSection("investigation")}
                className="w-full px-5 py-4 bg-slate-50/50 flex items-center justify-between border-b border-gray-100 cursor-pointer"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-purple-50 text-purple-700 flex items-center justify-center font-bold text-xs">
                    05
                  </div>
                  <h3
                    className="text-sm font-bold text-[#111827]"
                    style={{ fontFamily: PP }}
                  >
                    Investigation Recommendation
                  </h3>
                </div>
                <ChevronDown
                  size={18}
                  className={`text-slate-400 transition-transform ${collapsedSections.investigation ? "-rotate-90" : ""}`}
                />
              </button>

              {!collapsedSections.investigation && (
                <div
                  className="p-5 space-y-4 text-xs"
                  style={{ fontFamily: RB }}
                >
                  <div>
                    <label
                      className="block text-[11px] font-semibold text-[#64748B] mb-2"
                      style={{ fontFamily: PP }}
                    >
                      Recommended Investigations
                    </label>
                    <div className="flex flex-wrap gap-4">
                      {[
                        { key: "cbc", label: "CBC" },
                        { key: "ecg", label: "ECG" },
                        { key: "xray", label: "X-Ray" },
                        { key: "ultrasound", label: "Ultrasound" },
                        { key: "other", label: "Other" },
                      ].map((item) => (
                        <label
                          key={item.key}
                          className="flex items-center gap-2 font-medium text-[#111827] cursor-pointer"
                        >
                          <input
                            disabled={!isEditing}
                            type="checkbox"
                            checked={Boolean(
                              (
                                formData.investigations as Record<
                                  string,
                                  boolean
                                >
                              )[item.key],
                            )}
                            onChange={(e) =>
                              setFormData((prev) => ({
                                ...prev,
                                investigations: {
                                  ...prev.investigations,
                                  [item.key]: e.target.checked,
                                },
                              }))
                            }
                            className="w-4 h-4 rounded text-[#0D47A1] focus:ring-[#0D47A1] disabled:opacity-65"
                          />
                          <span>{item.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label
                        className="block text-[11px] font-semibold text-[#64748B] mb-1"
                        style={{ fontFamily: PP }}
                      >
                        Custom Investigation
                      </label>
                      <input
                        disabled={!isEditing}
                        type="text"
                        value={formData.customInvestigation}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            customInvestigation: e.target.value,
                          }))
                        }
                        className="w-full px-3 py-2 bg-slate-50 border border-[#E5E7EB] rounded-xl text-xs text-[#111827] disabled:opacity-65 disabled:bg-slate-100"
                      />
                    </div>
                    <div>
                      <label
                        className="block text-[11px] font-semibold text-[#64748B] mb-1"
                        style={{ fontFamily: PP }}
                      >
                        Remarks
                      </label>
                      <input
                        disabled={!isEditing}
                        type="text"
                        value={formData.investigationRemarks}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            investigationRemarks: e.target.value,
                          }))
                        }
                        className="w-full px-3 py-2 bg-slate-50 border border-[#E5E7EB] rounded-xl text-xs text-[#111827] disabled:opacity-65 disabled:bg-slate-100"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            <EditConsultationClinicalNotesCard
              collapsed={collapsedSections.clinicalNotes}
              onToggle={() => toggleSection("clinicalNotes")}
              isEditing={isEditing}
              formData={formData}
              setFormData={setFormData}
            />

            <EditConsultationFollowupCard
              collapsed={collapsedSections.followup}
              onToggle={() => toggleSection("followup")}
              isEditing={isEditing}
              formData={formData}
              setFormData={setFormData}
            />

            {/* ── SECTION 08: CONSULTATION SUMMARY ── */}
            <div className="bg-white rounded-2xl border border-[#E5E7EB] shadow-sm p-5 space-y-4">
              <h3
                className="text-sm font-bold text-[#111827] flex items-center gap-2 border-b border-gray-100 pb-3"
                style={{ fontFamily: PP }}
              >
                <CheckCircle2 size={16} className="text-[#009688]" />
                Consultation Summary Preview
              </h3>

              <div
                className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs"
                style={{ fontFamily: RB }}
              >
                <div>
                  <span
                    className="text-[10px] text-slate-400 uppercase font-bold"
                    style={{ fontFamily: PP }}
                  >
                    Patient
                  </span>
                  <p className="font-bold text-[#111827]">
                    {formData.patientName}
                  </p>
                  <p className="text-[11px] text-slate-500">{formData.mrn}</p>
                </div>
                <div>
                  <span
                    className="text-[10px] text-slate-400 uppercase font-bold"
                    style={{ fontFamily: PP }}
                  >
                    Doctor
                  </span>
                  <p className="font-bold text-[#111827]">
                    {formData.doctorName}
                  </p>
                </div>
                <div>
                  <span
                    className="text-[10px] text-slate-400 uppercase font-bold"
                    style={{ fontFamily: PP }}
                  >
                    Diagnosis
                  </span>
                  <p className="font-bold text-[#0D47A1]">
                    {formData.finalDiagnosis || "—"}
                  </p>
                </div>
                <div>
                  <span
                    className="text-[10px] text-slate-400 uppercase font-bold"
                    style={{ fontFamily: PP }}
                  >
                    Prescription
                  </span>
                  <p className="font-bold text-[#009688]">
                    {formData.medicines.length} Medicines
                  </p>
                  <p className="text-[11px] text-slate-500">
                    {activeInvestigationsCount} Recommended Tests
                  </p>
                </div>
              </div>
            </div>

            {/* ── SECTION 09: REVISION NOTES (MANDATORY FOR SAVING) ── */}
            <div className="bg-white rounded-2xl border-2 border-amber-200 shadow-sm overflow-hidden">
              <button
                onClick={() => toggleSection("revisionNotes")}
                className="w-full px-5 py-4 bg-amber-50/60 flex items-center justify-between border-b border-amber-100 cursor-pointer"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-amber-500 text-white flex items-center justify-center font-bold text-xs">
                    09
                  </div>
                  <h3
                    className="text-sm font-bold text-amber-900 flex items-center gap-2"
                    style={{ fontFamily: PP }}
                  >
                    <Edit3 size={15} />
                    Revision Notes & Change Audit Log
                  </h3>
                </div>
                <ChevronDown
                  size={18}
                  className={`text-amber-600 transition-transform ${collapsedSections.revisionNotes ? "-rotate-90" : ""}`}
                />
              </button>

              {!collapsedSections.revisionNotes && (
                <div
                  className="p-5 space-y-4 text-xs"
                  style={{ fontFamily: RB }}
                >
                  <div>
                    <label
                      className="block text-[11px] font-semibold text-amber-900 mb-1"
                      style={{ fontFamily: PP }}
                    >
                      Revision Reason{" "}
                      <span className="text-red-500">
                        * (Mandatory to save update)
                      </span>
                    </label>
                    <textarea
                      disabled={!isEditing}
                      rows={2}
                      value={formData.revisionReason}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          revisionReason: e.target.value,
                        }))
                      }
                      placeholder="Specify clear clinical rationale for updating this consultation..."
                      className="w-full p-3 bg-white border border-amber-300 rounded-xl text-xs text-[#111827] focus:outline-none focus:ring-2 focus:ring-amber-500/20 disabled:opacity-65 disabled:bg-slate-100"
                    />
                  </div>

                  <div>
                    <span
                      className="text-[10px] font-bold text-slate-400 uppercase"
                      style={{ fontFamily: PP }}
                    >
                      Auto-Generated Changes Summary
                    </span>
                    <div className="flex flex-wrap gap-2 mt-1.5">
                      <span className="px-2.5 py-1 bg-amber-50 text-amber-800 border border-amber-200 rounded-lg text-[11px] font-semibold">
                        Medication dosage adjusted
                      </span>
                      <span className="px-2.5 py-1 bg-blue-50 text-[#0D47A1] border border-blue-200 rounded-lg text-[11px] font-semibold">
                        Follow-up notes updated
                      </span>
                      <span className="px-2.5 py-1 bg-teal-50 text-[#009688] border border-teal-200 rounded-lg text-[11px] font-semibold">
                        Lifestyle advice extended
                      </span>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-gray-100 flex items-center justify-between text-[11px] text-slate-500">
                    <span>
                      Last Modified By:{" "}
                      <strong className="text-slate-800">
                        {formData.lastUpdatedBy}
                      </strong>
                    </span>
                    <span>
                      Last Modified Date:{" "}
                      <strong className="text-slate-800">
                        {formData.lastUpdatedDate}
                      </strong>
                    </span>
                    <EditConsultationFooter
                      isEditing={isEditing}
                      saving={saving}
                      onCancel={handleCancelEditing}
                      onSave={handleUpdateConsultation}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── STICKY FOOTER ACTION BAR ── */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-[#E5E7EB] px-6 py-3 shadow-lg flex items-center justify-between">
        <div className="text-xs text-[#64748B]" style={{ fontFamily: RB }}>
          Consultation{" "}
          <strong className="text-[#0D47A1]">{formData.consultationId}</strong>{" "}
          · Revision #{formData.revisionNumber}
        </div>

        <div className="flex items-center gap-3">
          {isEditing ? (
            <>
              <button
                onClick={handleCancelEditing}
                disabled={saving}
                className="px-4 py-2 border border-[#E5E7EB] text-slate-700 hover:bg-slate-50 text-xs font-semibold rounded-xl transition-colors cursor-pointer disabled:opacity-50"
                style={{ fontFamily: PP }}
              >
                Cancel Edit
              </button>
              <button
                onClick={handleSaveDraft}
                disabled={saving}
                className="px-4 py-2 border border-[#E5E7EB] bg-slate-50 text-slate-700 hover:bg-slate-100 text-xs font-semibold rounded-xl transition-colors cursor-pointer disabled:opacity-50"
                style={{ fontFamily: PP }}
              >
                Save Draft
              </button>
              <button
                onClick={handleUpdateConsultation}
                disabled={saving}
                className="px-5 py-2 bg-[#0D47A1] hover:bg-[#0a3880] text-white text-xs font-semibold rounded-xl shadow-sm transition-colors flex items-center gap-2 cursor-pointer disabled:opacity-50"
                style={{ fontFamily: PP }}
              >
                {saving ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <CheckCircle2 size={16} />
                    Update Consultation
                  </>
                )}
              </button>
            </>
          ) : (
            <button
              onClick={handleStartEditing}
              className="px-5 py-2 bg-[#0D47A1] hover:bg-[#0a3880] text-white text-xs font-semibold rounded-xl shadow-sm transition-colors flex items-center gap-2 cursor-pointer"
              style={{ fontFamily: PP }}
            >
              <Edit3 size={16} />
              Edit All Details
            </button>
          )}
        </div>
      </div>

      {showHistoryModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm p-4 md:p-8 flex items-center justify-center no-print">
          <div className="bg-white rounded-2xl w-full max-w-6xl max-h-[90vh] overflow-y-auto shadow-2xl relative flex flex-col">
            <div className="sticky top-0 z-10 bg-white border-b border-slate-200 px-6 py-3 flex items-center justify-between">
              <h2
                className="text-base font-bold text-slate-800"
                style={{ fontFamily: PP }}
              >
                Patient Consultation History — {formData.patientName} (
                {formData.mrn})
              </h2>
              <button
                onClick={() => setShowHistoryModal(false)}
                className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
                style={{ fontFamily: PP }}
              >
                Close History
              </button>
            </div>
            <div className="p-4 flex-1">
              <ConsultationHistoryScreen
                patientId={formData.mrn}
                role="doctor"
                onBack={() => setShowHistoryModal(false)}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default EditConsultationScreen;
