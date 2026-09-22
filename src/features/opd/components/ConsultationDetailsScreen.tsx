import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import {
  CheckCircle2,
  AlertCircle,
  ChevronDown,
  Printer,
  Edit3,
  Loader2,
  ArrowLeft,
} from "lucide-react";
import { encountersApi } from "../../encounters/api/encounters.api";
import { consultationApi } from "../api/consultationApi";
import { patientsApi } from "../../patients/api/patient.api";
import { doctorsApi } from "../../doctors/api/doctors.api";
import { vitalsApi } from "../../vitals/api/vitals.api";
import { EditConsultationScreen } from "./EditConsultationScreen";
import { ConsultationHistoryScreen } from "./ConsultationHistoryScreen";

// --- Design System Tokens ---
const PP = "'Poppins', system-ui, sans-serif";
const RB = "'Roboto', system-ui, sans-serif";

export interface ConsultationRecordData {
  id: string;
  appointmentId?: string | number;
  createdDate?: string;
  completedDate?: string;
  duration?: string;
  visitDate: string;
  completionTime: string;
  patientName: string;
  mrn: string;
  age: number | string;
  gender: string;
  bloodGroup: string;
  allergies: string[];
  doctorName: string;
  doctorSpecialty: string;
  department: string;
  visitType: string;
  chiefComplaint: string;
  durationOfSymptoms: string;
  vitals: {
    height: string;
    weight: string;
    bmi: string;
    temperature: string;
    bp: string;
    pulse: string;
    respiratoryRate: string;
    spo2: string;
    bloodSugar: string;
  };
  clinicalExamination: string;
  provisionalDiagnosis: string;
  finalDiagnosis: string;
  icdCode: string;
  medicines: Array<{
    id: string;
    name: string;
    dosage: string;
    frequency: string;
    duration: string;
    instructions: string;
  }>;
  investigations: string[];
  investigationRemarks: string;
  symptoms: string;
  assessment: string;
  advice: string;
  lifestyleRecommendations: string;
  followupRequired: string;
  nextVisitDate: string;
  followupNotes: string;
  followUpType?: string;
  consultationFee: string;
  status: string;
  tokenNo: string;
}

interface ConsultationDetailsScreenProps {
  consultationId?: string;
  encounterId?: string | number;
  initialRecord?: Partial<ConsultationRecordData>;
  onBack?: () => void;
  onEditConsultation?: (id: string) => void;
  onViewHistory?: (patientId?: string) => void;
  onViewPatientProfile?: (mrn: string) => void;
}

const unwrapApiData = (response: unknown): unknown => {
  if (!response) return null;
  const obj = response as Record<string, unknown>;
  return obj.data ?? response;
};

const asRecord = (value: unknown): Record<string, unknown> => {
  return value && typeof value === "object"
    ? (value as Record<string, unknown>)
    : {};
};

const asArray = (value: unknown): unknown[] => {
  return Array.isArray(value) ? value : [];
};

const formatVitalValue = (val: unknown, unit: string) => {
  if (!val || val === "—" || val === "N/A" || val === "") return "—";
  const str = String(val).trim();
  if (!str || str === "—") return "—";
  if (str.toLowerCase().includes(unit.toLowerCase())) return str;
  return `${str} ${unit}`;
};

const formatDateTime = (value?: string | null) => {
  if (!value || value === "—") return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  const day = date.getDate().toString().padStart(2, "0");
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
  const month = months[date.getMonth()];
  const year = date.getFullYear();
  let hours = date.getHours();
  const minutes = date.getMinutes().toString().padStart(2, "0");
  const ampm = hours >= 12 ? "PM" : "AM";
  hours = hours % 12 || 12;
  return `${day} ${month} ${year}, ${hours.toString().padStart(2, "0")}:${minutes} ${ampm}`;
};

const formatDateOnly = (value?: string | null) => {
  if (!value || value === "—" || value === "None" || value === "") return "—";
  const trimmed = String(value).split("T")[0].split(" ")[0].trim();
  const match = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (match) {
    const [, year, month, day] = match;
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
    return `${day} ${months[Number(month) - 1]} ${year}`;
  }
  return trimmed || "—";
};

const handlePrint = () => {
  window.print();
};

export function ConsultationDetailsScreen({
  consultationId,
  encounterId,
  initialRecord,
  onBack,
  onEditConsultation,
  onViewHistory,
  onViewPatientProfile,
}: ConsultationDetailsScreenProps) {
  const [loading, setLoading] = useState<boolean>(!initialRecord);
  const [record, setRecord] = useState<ConsultationRecordData>(() => {
    return {
      id: consultationId || String(encounterId || ""),
      appointmentId: initialRecord?.appointmentId || "",
      createdDate:
        initialRecord?.createdDate ||
        initialRecord?.visitDate ||
        new Date().toISOString(),
      completedDate: initialRecord?.completedDate || "",
      duration: initialRecord?.duration || "",
      status: initialRecord?.status || "",
      tokenNo: initialRecord?.tokenNo || "",
      visitDate:
        initialRecord?.visitDate ||
        initialRecord?.createdDate ||
        new Date().toISOString().split("T")[0],
      completionTime: initialRecord?.completionTime || "",
      patientName: initialRecord?.patientName || "",
      mrn: initialRecord?.mrn || "",
      age: initialRecord?.age || "—",
      gender: initialRecord?.gender || "—",
      bloodGroup: initialRecord?.bloodGroup || "—",
      allergies: initialRecord?.allergies || [],
      doctorName: initialRecord?.doctorName || "",
      doctorSpecialty: initialRecord?.doctorSpecialty || "",
      department: initialRecord?.department || "",
      visitType: initialRecord?.visitType || "",
      chiefComplaint: initialRecord?.chiefComplaint || "",
      durationOfSymptoms: initialRecord?.durationOfSymptoms || "—",
      vitals: {
        height: formatVitalValue(initialRecord?.vitals?.height, "cm"),
        weight: formatVitalValue(initialRecord?.vitals?.weight, "kg"),
        bmi: formatVitalValue(initialRecord?.vitals?.bmi, "kg/m²"),
        temperature: formatVitalValue(initialRecord?.vitals?.temperature, "°C"),
        bp: formatVitalValue(initialRecord?.vitals?.bp, "mmHg"),
        pulse: formatVitalValue(initialRecord?.vitals?.pulse, "bpm"),
        respiratoryRate: formatVitalValue(
          initialRecord?.vitals?.respiratoryRate,
          "/min",
        ),
        spo2: formatVitalValue(initialRecord?.vitals?.spo2, "%"),
        bloodSugar: formatVitalValue(
          initialRecord?.vitals?.bloodSugar,
          "mg/dL",
        ),
      },
      clinicalExamination: initialRecord?.clinicalExamination || "",
      provisionalDiagnosis: initialRecord?.provisionalDiagnosis || "",
      finalDiagnosis: initialRecord?.finalDiagnosis || "",
      icdCode: initialRecord?.icdCode || "",
      medicines: initialRecord?.medicines || [],
      investigations: initialRecord?.investigations || [],
      investigationRemarks: initialRecord?.investigationRemarks || "",
      symptoms: initialRecord?.symptoms || "",
      assessment: initialRecord?.assessment || "",
      advice: initialRecord?.advice || "",
      lifestyleRecommendations: initialRecord?.lifestyleRecommendations || "",
      followupRequired: initialRecord?.followupRequired || "",
      nextVisitDate: initialRecord?.nextVisitDate || "",
      followupNotes: initialRecord?.followupNotes || "",
      consultationFee: initialRecord?.consultationFee || "",
    };
  });

  // Collapsible sections state
  const [collapsedSections, setCollapsedSections] = useState<
    Record<string, boolean>
  >({
    visitInfo: false,
    vitals: false,
    examination: false,
    prescription: false,
    investigation: false,
    clinicalNotes: false,
    followup: false,
    summary: false,
  });

  const [isEditing, setIsEditing] = useState(false);
  const [reloadCounter, setReloadCounter] = useState(0);
  const [showHistoryModal, setShowHistoryModal] = useState(false);

  const handleViewHistoryClick = () => {
    if (onViewHistory) {
      onViewHistory(record.mrn);
    }
    setShowHistoryModal(true);
  };

  const handleStartEdit = () => {
    if (onEditConsultation) {
      onEditConsultation(
        record.id || String(encounterId || consultationId || ""),
      );
    }
    setIsEditing(true);
  };

  const toggleSection = (key: string) => {
    setCollapsedSections((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  // Fetch real API data if encounterId or consultationId is provided
  useEffect(() => {
    let isMounted = true;
    const targetEncId = encounterId || consultationId;
    if (!targetEncId) return;

    async function loadRealEncounterData() {
      try {
        setLoading(true);
        const rawEncIdStr = String(targetEncId).trim();
        const encIdNum =
          Number(rawEncIdStr.replace(/\D+/g, "")) || Number(targetEncId) || 0;
        if (encIdNum <= 0) return;

        // 1. Load workspace context (patient, appointment, vitals, consultation notes, diagnoses)
        const workspaceResponse = await consultationApi
          .getWorkspace(encIdNum)
          .catch(() => null);
        const workspaceData = asRecord(unwrapApiData(workspaceResponse));
        if (!workspaceData || Object.keys(workspaceData).length === 0) {
          console.warn(`Workspace not found for encounter ${encIdNum}`);
          return;
        }

        const encSub = asRecord(workspaceData.encounter);
        const apptSub = asRecord(workspaceData.appointment);
        const patSub = asRecord(workspaceData.patient);
        const docSub = asRecord(workspaceData.doctor);

        const realEncounterId = Number(
          encSub.encounterId || encSub.id || encIdNum,
        );
        const realAppointmentId = Number(
          apptSub.id || apptSub.appointmentId || encSub.appointmentId || 0,
        );

        // 2. Fetch Consultation / Clinical Notes
        let consultationData = asRecord(workspaceData.consultation);
        if (!consultationData.id && realEncounterId > 0) {
          try {
            const consultationRes = await consultationApi
              .getConsultation(realEncounterId)
              .catch(() => null);
            if (consultationRes) {
              consultationData = asRecord(unwrapApiData(consultationRes));
            }
          } catch (e) {
            console.warn("Could not fetch consultation notes:", e);
          }
        }

        // 3. Fetch Diagnoses
        interface DiagnosisItem {
          diagnosisType?: string;
          type?: string;
          active?: boolean;
          diagnosisName?: string;
          diagnosisCode?: string;
        }
        let diagnosesData: DiagnosisItem[] = asArray(
          workspaceData.diagnoses,
        ) as DiagnosisItem[];
        if (realEncounterId > 0) {
          try {
            const diagnosisRes = await encountersApi
              .getDiagnoses(realEncounterId)
              .catch(() => null);
            const diagList = unwrapApiData(diagnosisRes);
            if (Array.isArray(diagList) && diagList.length > 0) {
              diagnosesData = diagList as DiagnosisItem[];
            }
          } catch (e) {
            console.warn("Could not fetch diagnoses:", e);
          }
        }

        // 4. Fetch Prescription Directly (Unconditional)
        let prescriptionData: Record<string, unknown> | null = null;
        if (realEncounterId > 0) {
          try {
            const rxRes =
              await encountersApi.getPrescriptionByEncounterId(realEncounterId);
            if (rxRes) {
              prescriptionData = asRecord(unwrapApiData(rxRes));
            }
          } catch (e) {
            console.error("PRESCRIPTION API FAILED", {
              encounterId: realEncounterId,
              error: e,
            });
          }
        }

        // 5. Fetch Patient Blood Group if MRN present
        let fetchedBloodGroup: string | null = null;
        const targetMrn = (patSub.mrn as string) || initialRecord?.mrn;
        if (targetMrn && targetMrn !== "MRN-000000") {
          try {
            const patRes = await patientsApi
              .getPatientByMrn(targetMrn)
              .catch(() => null);
            const p = asRecord(unwrapApiData(patRes));
            if (p?.bloodGroup) {
              fetchedBloodGroup = String(p.bloodGroup);
            }
          } catch (e) {
            console.warn("Could not fetch patient details for blood group:", e);
          }
        }

        // 6. Fetch Doctor Profile if doctor details missing
        let fetchedDoctor: Record<string, unknown> | null = null;
        const targetDocId =
          apptSub.doctorId || encSub.doctorId || docSub.id || docSub.doctorId;
        if (
          targetDocId &&
          !docSub.name &&
          !docSub.fullName &&
          !encSub.doctorName &&
          !apptSub.doctorName
        ) {
          try {
            const docRes = await doctorsApi
              .getById(String(targetDocId))
              .catch(() => null);
            if (docRes) {
              fetchedDoctor = asRecord(unwrapApiData(docRes));
            }
          } catch (e) {
            console.warn(
              "Could not fetch doctor details for doctorId:",
              targetDocId,
              e,
            );
          }
        }

        // 7. Fetch Vitals Fallback if workspace vitals missing
        let fetchedVitals = asRecord(workspaceData.vitals);
        if (
          !fetchedVitals.height &&
          !fetchedVitals.weight &&
          !fetchedVitals.temperature
        ) {
          try {
            const encVitalsRes = await vitalsApi
              .getVitalsByEncounterId(realEncounterId)
              .catch(() => null);
            const encVData = asRecord(unwrapApiData(encVitalsRes));
            if (
              encVData.height ||
              encVData.weight ||
              encVData.temperature ||
              encVData.pulse
            ) {
              fetchedVitals = encVData;
            } else if (realAppointmentId > 0) {
              const nurseVRes = await vitalsApi
                .getVitals(realAppointmentId)
                .catch(() => null);
              const nurseVData = asRecord(unwrapApiData(nurseVRes));
              if (
                nurseVData.height ||
                nurseVData.weight ||
                nurseVData.temperature ||
                nurseVData.pulse
              ) {
                fetchedVitals = nurseVData;
              }
            }
          } catch (e) {
            console.warn("Could not fetch vitals via fallback:", e);
          }
        }

        if (isMounted) {
          const rawV = fetchedVitals;
          const h = rawV.height ?? rawV.heightCm ?? rawV.height_cm ?? null;
          const w = rawV.weight ?? rawV.weightKg ?? rawV.weight_kg ?? null;
          const temp =
            rawV.temperature ?? rawV.temperatureC ?? rawV.temp ?? null;
          const temperatureUnit = String(rawV.temperatureUnit || "FAHRENHEIT");
          const sys =
            rawV.bpSystolic ?? rawV.bloodPressureSystolic ?? rawV.systolicBp;
          const dia =
            rawV.bpDiastolic ?? rawV.bloodPressureDiastolic ?? rawV.diastolicBp;
          const bp =
            rawV.bloodPressure ||
            rawV.bp ||
            (sys != null && dia != null ? `${sys}/${dia}` : null);
          const pulse = rawV.pulse ?? rawV.heartRate ?? rawV.pulseBpm ?? null;
          const resp = rawV.respiratoryRate ?? rawV.respRate ?? null;
          const spo2 =
            rawV.spo2 ?? rawV.oxygenSaturation ?? rawV.spo2Percent ?? null;
          const sugar =
            rawV.bloodSugar ??
            rawV.sugar ??
            rawV.bloodSugarMgDl ??
            rawV.randomBloodSugar ??
            rawV.fastingBloodSugar ??
            rawV.blood_sugar ??
            rawV.rbs ??
            rawV.fbs ??
            rawV.bloodSugarVal ??
            rawV.bloodSugarLevel ??
            rawV.glucose ??
            rawV.bloodGlucose ??
            null;
          const bmiCalc =
            rawV.bmi ??
            (h && w && Number(h) > 0 && Number(w) > 0
              ? (Number(w) / Math.pow(Number(h) / 100, 2)).toFixed(1)
              : null);

          // Diagnosis Extraction
          const primaryDiag =
            diagnosesData.find(
              (d) =>
                (d.diagnosisType === "PRIMARY" || d.type === "PRIMARY") &&
                d.active !== false,
            ) ||
            diagnosesData.find((d) => d.active !== false) ||
            diagnosesData[0] ||
            null;

          // Prescription Extraction per Swagger specification
          const rxRoot = asRecord(
            prescriptionData?.data ||
              prescriptionData ||
              workspaceData.prescription ||
              workspaceData.prescriptions,
          );
          const rxAdvice = asRecord(rxRoot.advice || rxRoot.adviceDto);
          let medicationList = asArray(
            rxRoot.medications ||
              rxRoot.medicines ||
              rxRoot.items ||
              rxRoot.prescriptionItems ||
              workspaceData.medications ||
              workspaceData.medicines ||
              workspaceData.prescriptionItems,
          );

          if (medicationList.length === 0) {
            try {
              const savedMedsStr =
                localStorage.getItem(`hms-completed-meds:${realEncounterId}`) ||
                localStorage.getItem(`hms-completed-meds:${targetEncId}`);
              if (savedMedsStr) {
                const parsed = JSON.parse(savedMedsStr);
                if (Array.isArray(parsed) && parsed.length > 0) {
                  medicationList = parsed;
                }
              }
            } catch (err) {
              console.log(err);
              // ignore
            }
          }

          if (
            medicationList.length === 0 &&
            initialRecord?.medicines &&
            initialRecord.medicines.length > 0
          ) {
            medicationList = initialRecord.medicines;
          }

          const meds = medicationList.map((item: unknown, idx: number) => {
            const m = asRecord(item);
            const doseVal = (() => {
              const d = m.dose as Record<string, unknown> | undefined;
              if (d && typeof d === "object") {
                const val = d.value != null ? String(d.value) : "";
                const unit = d.unit != null ? String(d.unit) : "";
                const text = `${val} ${unit}`.trim();
                if (text) return text;
              }
              if (m.doseValue != null || m.doseUnit != null) {
                const val = m.doseValue != null ? String(m.doseValue) : "";
                const unit = m.doseUnit != null ? String(m.doseUnit) : "";
                const text = `${val} ${unit}`.trim();
                if (text) return text;
              }
              if (typeof m.dosage === "string" && m.dosage.trim())
                return m.dosage.trim();
              if (typeof m.dose === "string" && m.dose.trim())
                return m.dose.trim();
              if (typeof m.strength === "string" && m.strength.trim())
                return m.strength.trim();
              if (typeof m.doseQuantity === "string" && m.doseQuantity.trim())
                return m.doseQuantity.trim();
              return "—";
            })();

            const freqObj = m.frequency as
              | { display?: unknown; code?: unknown }
              | undefined;
            const freqVal =
              m.frequency && typeof m.frequency === "object"
                ? (freqObj?.display as string) ||
                  (freqObj?.code as string) ||
                  ""
                : m.frequencyDisplay ||
                  m.frequencyCode ||
                  m.frequency ||
                  m.freq ||
                  "";

            const durObj = m.duration as
              | { value?: unknown; unit?: unknown }
              | undefined;
            const durVal =
              m.duration && typeof m.duration === "object"
                ? `${durObj?.value ?? ""} ${durObj?.unit ?? ""}`.trim()
                : m.durationValue
                  ? `${m.durationValue} ${m.durationUnit || ""}`.trim()
                  : null;

            return {
              id: String(
                m.medicationId ||
                  m.prescriptionItemId ||
                  m.medicineId ||
                  m.id ||
                  idx + 1,
              ),
              name: String(
                m.medicineName ||
                  m.medicationName ||
                  m.drugName ||
                  m.name ||
                  m.medicine ||
                  "Medication",
              ),
              dosage: String(doseVal || m.dosage || m.strength || "—"),
              frequency: String(freqVal || "—"),
              duration: String(durVal || m.duration || "—"),
              instructions: String(
                m.instructions || m.specialInstructions || m.notes || "—",
              ),
            };
          });

          // Investigations Extraction
          const rawInvestigations =
            workspaceData.investigations ||
            workspaceData.orders ||
            workspaceData.labOrders ||
            workspaceData.radiologyOrders ||
            [];
          let investigations: string[] = asArray(rawInvestigations)
            .map((item: unknown): string => {
              if (typeof item === "string") return item;
              const itemObj = item as
                | Record<string, unknown>
                | null
                | undefined;
              return String(
                itemObj?.testName ||
                  itemObj?.investigationName ||
                  itemObj?.name ||
                  itemObj?.displayName ||
                  itemObj?.testCode ||
                  "",
              );
            })
            .filter(Boolean);

          if (
            investigations.length === 0 &&
            initialRecord?.investigations &&
            initialRecord.investigations.length > 0
          ) {
            investigations = initialRecord.investigations;
          }

          const clinicalExamText =
            [
              consultationData.generalExamination,
              consultationData.physicalExamination,
            ]
              .filter(Boolean)
              .join("\n") || String(consultationData.examinationNotes || "");

          setRecord((prev) => {
            const docSub = asRecord(
              workspaceData.doctor ||
                (typeof encSub.doctor === "object" ? encSub.doctor : null) ||
                (typeof apptSub.doctor === "object" ? apptSub.doctor : null),
            );

            const realDoctorName = String(
              (typeof encSub.doctorName === "string"
                ? encSub.doctorName
                : "") ||
                (typeof encSub.doctor === "string" ? encSub.doctor : "") ||
                (typeof apptSub.doctorName === "string"
                  ? apptSub.doctorName
                  : "") ||
                (typeof apptSub.doctor === "string" ? apptSub.doctor : "") ||
                docSub.name ||
                docSub.fullName ||
                docSub.doctorName ||
                fetchedDoctor?.name ||
                fetchedDoctor?.fullName ||
                initialRecord?.doctorName ||
                prev.doctorName ||
                "",
            );

            const realDepartment = String(
              (typeof encSub.department === "string"
                ? encSub.department
                : (encSub.department as Record<string, unknown>)?.name ||
                  (encSub.department as Record<string, unknown>)
                    ?.departmentName ||
                  "") ||
                (typeof apptSub.department === "string"
                  ? apptSub.department
                  : (apptSub.department as Record<string, unknown>)?.name ||
                    (apptSub.department as Record<string, unknown>)
                      ?.departmentName ||
                    "") ||
                docSub.department ||
                docSub.departmentName ||
                docSub.specialty ||
                docSub.doctorSpecialty ||
                fetchedDoctor?.department ||
                fetchedDoctor?.departmentName ||
                initialRecord?.department ||
                prev.department ||
                "",
            );

            const realAge = (() => {
              if (
                patSub.age != null &&
                patSub.age !== "" &&
                patSub.age !== "—"
              ) {
                const n = Number(patSub.age);
                if (!Number.isNaN(n) && n >= 0) return n;
                if (typeof patSub.age === "string" && patSub.age.trim())
                  return patSub.age.trim();
              }
              if (patSub.dob && typeof patSub.dob === "string") {
                try {
                  const birth = new Date(patSub.dob);
                  if (!Number.isNaN(birth.getTime())) {
                    const ageDifMs = Date.now() - birth.getTime();
                    const ageDate = new Date(ageDifMs);
                    const calc = Math.abs(ageDate.getUTCFullYear() - 1970);
                    if (!Number.isNaN(calc) && calc >= 0) return calc;
                  }
                } catch (err) {
                  console.log(err);
                  // ignore
                }
              }
              if (apptSub.patientAge != null) {
                const n = Number(apptSub.patientAge);
                if (!Number.isNaN(n) && n >= 0) return n;
              }
              if (apptSub.age != null) {
                const n = Number(apptSub.age);
                if (!Number.isNaN(n) && n >= 0) return n;
              }
              return initialRecord?.age || prev.age || "—";
            })();
            const realDoctorSpecialty = String(
              (typeof encSub.doctorSpecialty === "string"
                ? encSub.doctorSpecialty
                : "") ||
                docSub.specialty ||
                fetchedDoctor?.specialty ||
                fetchedDoctor?.specialization ||
                initialRecord?.doctorSpecialty ||
                prev.doctorSpecialty ||
                "",
            );

            const followUpDt =
              rxAdvice.followUpDate ??
              consultationData.followUpDate ??
              consultationData.nextVisitDate;
            const followUpNt =
              rxAdvice.followUpNotes ??
              consultationData.followUpNotes ??
              consultationData.followUpInstructions;
            const followUpTp =
              consultationData.followUpType ||
              rxAdvice.followUpType ||
              "ROUTINE";

            const rawFollowUpReq =
              rxAdvice.followUpRequired ??
              consultationData.followUpRequired ??
              consultationData.followupRequired ??
              initialRecord?.followupRequired;

            const hasFollowUpDateOrNotes = Boolean(
              (followUpDt &&
                followUpDt !== "—" &&
                followUpDt !== "None" &&
                followUpDt !== "") ||
              (followUpNt &&
                followUpNt !== "—" &&
                followUpNt !== "None" &&
                followUpNt !== "None recorded" &&
                followUpNt !== ""),
            );

            const isExplicitlyNo =
              rawFollowUpReq === false ||
              String(rawFollowUpReq).toLowerCase() === "no" ||
              String(rawFollowUpReq).toLowerCase() === "false";

            const isExplicitlyYes =
              rawFollowUpReq === true ||
              String(rawFollowUpReq).toLowerCase() === "yes" ||
              String(rawFollowUpReq).toLowerCase() === "true";

            const isFollowUpRequiredYes = isExplicitlyNo
              ? false
              : isExplicitlyYes || hasFollowUpDateOrNotes;

            return {
              ...prev,
              id: String(realEncounterId).startsWith("ENC-")
                ? String(realEncounterId)
                : `ENC-${realEncounterId}`,
              appointmentId: realAppointmentId || prev.appointmentId,
              doctorName: realDoctorName || prev.doctorName,
              doctorSpecialty: realDoctorSpecialty || prev.doctorSpecialty,
              department: realDepartment || prev.department,
              visitType: String(
                encSub.visitType ||
                  apptSub.visitType ||
                  apptSub.appointmentType ||
                  prev.visitType ||
                  "",
              ),
              patientName: String(
                patSub.fullName || patSub.name || prev.patientName || "",
              ),
              mrn: String(patSub.mrn || prev.mrn || ""),
              age: realAge,
              gender: String(patSub.gender || prev.gender || ""),
              status: String(
                apptSub.status || encSub.status || prev.status || "—",
              ),
              tokenNo: String(
                apptSub.queueNumber ||
                  apptSub.tokenNo ||
                  apptSub.tokenNumber ||
                  prev.tokenNo ||
                  "",
              ),
              visitDate: String(
                apptSub.appointmentDate ||
                  apptSub.date ||
                  apptSub.visitDate ||
                  encSub.visitDate ||
                  encSub.encounterDate ||
                  encSub.createdAt ||
                  encSub.createdDate ||
                  consultationData.visitDate ||
                  consultationData.createdDate ||
                  consultationData.finalizedAt ||
                  initialRecord?.visitDate ||
                  initialRecord?.createdDate ||
                  prev.visitDate ||
                  prev.createdDate ||
                  new Date().toISOString().split("T")[0],
              ),
              createdDate: String(
                encSub.createdAt ||
                  encSub.createdDate ||
                  consultationData.createdAt ||
                  consultationData.createdDate ||
                  consultationData.finalizedAt ||
                  encSub.finalizedAt ||
                  encSub.completedAt ||
                  apptSub.createdDate ||
                  apptSub.createdAt ||
                  apptSub.appointmentDate ||
                  encSub.visitDate ||
                  initialRecord?.createdDate ||
                  initialRecord?.visitDate ||
                  prev.createdDate ||
                  prev.visitDate ||
                  new Date().toISOString(),
              ),
              completedDate: String(
                encSub.completedAt ||
                  encSub.completedDate ||
                  prev.completedDate ||
                  "",
              ),
              completionTime: String(
                encSub.completedAt || prev.completionTime || "",
              ),

              chiefComplaint: String(
                consultationData.chiefComplaint ||
                  encSub.chiefComplaint ||
                  apptSub.chiefComplaint ||
                  prev.chiefComplaint ||
                  "",
              ),
              durationOfSymptoms: String(
                consultationData.durationOfSymptoms ||
                  prev.durationOfSymptoms ||
                  "",
              ),

              bloodGroup:
                fetchedBloodGroup ||
                String(patSub.bloodGroup || prev.bloodGroup || "—"),
              allergies: Array.isArray(patSub.allergies)
                ? (patSub.allergies as string[])
                : prev.allergies,

              medicines:
                meds.length > 0
                  ? meds
                  : initialRecord?.medicines &&
                      initialRecord.medicines.length > 0
                    ? initialRecord.medicines
                    : prev.medicines,
              vitals: {
                height: formatVitalValue(
                  h || initialRecord?.vitals?.height || prev.vitals?.height,
                  "cm",
                ),
                weight: formatVitalValue(
                  w || initialRecord?.vitals?.weight || prev.vitals?.weight,
                  "kg",
                ),
                bmi: formatVitalValue(
                  bmiCalc || initialRecord?.vitals?.bmi || prev.vitals?.bmi,
                  "kg/m²",
                ),
                temperature: formatVitalValue(
                  temp ||
                    initialRecord?.vitals?.temperature ||
                    prev.vitals?.temperature,
                  temperatureUnit === "CELSIUS" ? "°C" : "°F",
                ),
                bp: formatVitalValue(
                  bp || initialRecord?.vitals?.bp || prev.vitals?.bp,
                  "mmHg",
                ),
                pulse: formatVitalValue(
                  pulse || initialRecord?.vitals?.pulse || prev.vitals?.pulse,
                  "bpm",
                ),
                respiratoryRate: formatVitalValue(
                  resp ||
                    initialRecord?.vitals?.respiratoryRate ||
                    prev.vitals?.respiratoryRate,
                  "/min",
                ),
                spo2: formatVitalValue(
                  spo2 || initialRecord?.vitals?.spo2 || prev.vitals?.spo2,
                  "%",
                ),
                bloodSugar: formatVitalValue(
                  sugar ||
                    initialRecord?.vitals?.bloodSugar ||
                    prev.vitals?.bloodSugar,
                  "mg/dL",
                ),
              },

              clinicalExamination:
                clinicalExamText ||
                initialRecord?.clinicalExamination ||
                prev.clinicalExamination ||
                "",
              provisionalDiagnosis: String(
                consultationData.provisionalDiagnosis ||
                  primaryDiag?.diagnosisName ||
                  initialRecord?.provisionalDiagnosis ||
                  prev.provisionalDiagnosis ||
                  "",
              ),
              finalDiagnosis: String(
                consultationData.finalDiagnosis ||
                  primaryDiag?.diagnosisName ||
                  consultationData.assessmentSummary ||
                  initialRecord?.finalDiagnosis ||
                  prev.finalDiagnosis ||
                  "",
              ),
              icdCode: String(
                primaryDiag?.diagnosisCode ||
                  consultationData.icdCode ||
                  initialRecord?.icdCode ||
                  prev.icdCode ||
                  "",
              ),

              investigations:
                investigations.length > 0
                  ? investigations
                  : initialRecord?.investigations &&
                      initialRecord.investigations.length > 0
                    ? initialRecord.investigations
                    : prev.investigations,
              investigationRemarks: String(
                workspaceData.investigationRemarks ||
                  consultationData.investigationRemarks ||
                  initialRecord?.investigationRemarks ||
                  prev.investigationRemarks ||
                  "",
              ),

              symptoms: String(
                consultationData.historyOfPresentIllness ||
                  consultationData.subjective ||
                  initialRecord?.symptoms ||
                  prev.symptoms ||
                  "",
              ),
              assessment: String(
                consultationData.assessmentSummary ||
                  consultationData.assessment ||
                  initialRecord?.assessment ||
                  prev.assessment ||
                  "",
              ),
              advice: String(
                consultationData.advice ||
                  initialRecord?.advice ||
                  prev.advice ||
                  "",
              ),
              lifestyleRecommendations: String(
                rxAdvice.diet ||
                  consultationData.lifestyleRecommendations ||
                  initialRecord?.lifestyleRecommendations ||
                  prev.lifestyleRecommendations ||
                  "",
              ),

              followupRequired: isFollowUpRequiredYes ? "Yes" : "No",
              nextVisitDate: String(
                followUpDt ||
                  initialRecord?.nextVisitDate ||
                  prev.nextVisitDate ||
                  "",
              ),
              followupNotes: String(
                followUpNt ||
                  initialRecord?.followupNotes ||
                  prev.followupNotes ||
                  "",
              ),
              followUpType: String(
                followUpTp ||
                  initialRecord?.followUpType ||
                  prev.followUpType ||
                  "ROUTINE",
              ),
            };
          });
        }
      } catch (err) {
        console.error("Error loading consultation details:", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadRealEncounterData();
    return () => {
      isMounted = false;
    };
  }, [encounterId, consultationId, initialRecord, reloadCounter]);

  const patientInitials = (record.patientName || "PT")
    .split(" ")
    .map((n) => n[0])
    .join("")
    .substring(0, 2)
    .toUpperCase();

  const navigate = useNavigate();

  const handleViewPatientProfile = () => {
    if (onViewPatientProfile) {
      onViewPatientProfile(record.mrn);
    }
    navigate(`/patients?search=${encodeURIComponent(record.mrn)}`);
  };

  if (isEditing) {
    return (
      <EditConsultationScreen
        consultationId={
          record.id || String(encounterId || consultationId || "")
        }
        encounterId={encounterId || record.id}
        initialRecord={record as unknown as Record<string, unknown>}
        onBack={() => setIsEditing(false)}
        onUpdateSuccess={() => {
          setIsEditing(false);
          setReloadCounter((c) => c + 1);
        }}
        onViewHistory={onViewHistory}
      />
    );
  }

  if (loading) {
    return (
      <div className="flex-1 bg-[#F1F5F9] p-12 flex flex-col items-center justify-center min-h-100">
        <Loader2 size={32} className="animate-spin text-[#0D47A1] mb-3" />
        <p
          className="text-sm font-semibold text-slate-600"
          style={{ fontFamily: PP }}
        >
          Loading Consultation Details...
        </p>
      </div>
    );
  }

  return (
    <div className="flex-1 bg-[#F1F5F9] overflow-y-auto flex flex-col font-sans relative pb-24">
      {/* ── BREADCRUMB & HEADER SECTION ── */}
      <div className="bg-white border-b border-[#E5E7EB] px-6 py-4 no-print">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h1
                className="text-2xl font-bold text-[#111827]"
                style={{ fontFamily: PP }}
              >
                Consultation Details
              </h1>
              <span
                className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-green-50 text-[#66BB6A] border border-green-200"
                style={{ fontFamily: PP }}
              >
                {record.status}
              </span>
            </div>
            <p
              className="text-sm text-[#64748B] mt-0.5"
              style={{ fontFamily: RB }}
            >
              Review completed consultation records.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onBack ? onBack : () => navigate(-1)}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-[#E5E7EB] bg-white text-[#111827] hover:bg-slate-50 text-xs font-semibold transition-all shadow-sm cursor-pointer"
              style={{ fontFamily: PP }}
            >
              <ArrowLeft size={14} />
              Back
            </button>
          </div>
        </div>
      </div>

      {/* ── STICKY PATIENT SUMMARY BAR ── */}
      <div className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-[#E5E7EB] px-6 py-3 shadow-sm no-print">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          {/* Patient Info Group */}
          <div className="flex items-center gap-3 overflow-x-auto">
            <div
              className="w-10 h-10 rounded-full bg-[#0D47A1] text-white flex items-center justify-center font-bold text-sm shrink-0"
              style={{ fontFamily: PP }}
            >
              {patientInitials}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span
                  className="font-bold text-sm text-[#111827]"
                  style={{ fontFamily: PP }}
                >
                  {record.patientName}
                </span>
                <span className="font-mono text-[10px] bg-blue-50 text-[#0D47A1] px-2 py-0.5 rounded font-bold">
                  {record.mrn}
                </span>
                <span className="font-mono text-[10px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-bold">
                  {record.id}
                </span>
              </div>
              <div
                className="flex items-center gap-3 text-xs text-[#64748B] mt-0.5"
                style={{ fontFamily: RB }}
              >
                <span>
                  {record.age} yrs / {record.gender}
                </span>
                <span>•</span>
                <span>
                  Blood:{" "}
                  <strong className="text-[#111827]">
                    {record.bloodGroup}
                  </strong>
                </span>
                <span>•</span>
                <span>
                  Token:{" "}
                  <strong className="text-[#0D47A1]">{record.tokenNo}</strong>
                </span>
                <span>•</span>
                <span>
                  Doctor:{" "}
                  <strong className="text-[#111827]">
                    {record.doctorName || "—"}
                  </strong>
                </span>
                {record.department && (
                  <>
                    <span>•</span>
                    <span>
                      Department:{" "}
                      <strong className="text-[#0D47A1]">
                        {record.department}
                      </strong>
                    </span>
                  </>
                )}
                <span>•</span>
                <span>
                  Date:{" "}
                  <strong className="text-[#111827]">
                    {formatDateOnly(record.visitDate || record.createdDate)}
                  </strong>
                </span>
              </div>
            </div>

            {/* Allergy Indicator */}
            {record.allergies.length > 0 && (
              <div
                className="flex items-center gap-1.5 px-2.5 py-1 bg-red-50 text-red-600 border border-red-100 rounded-full text-[11px] font-semibold shrink-0"
                style={{ fontFamily: PP }}
              >
                <AlertCircle size={13} />
                <span>Allergies: {record.allergies.join(", ")}</span>
              </div>
            )}
          </div>

          {/* Quick Buttons */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handleViewPatientProfile}
              className="px-3 py-1.5 rounded-lg border border-[#E5E7EB] bg-white text-xs font-semibold text-[#111827] hover:bg-slate-50 transition-colors cursor-pointer"
              style={{ fontFamily: PP }}
            >
              View Patient Profile
            </button>
            <button
              onClick={handleViewHistoryClick}
              className="px-3 py-1.5 rounded-lg border border-[#E5E7EB] bg-white text-xs font-semibold text-[#0D47A1] hover:bg-blue-50 transition-colors cursor-pointer"
              style={{ fontFamily: PP }}
            >
              View Consultation History
            </button>
          </div>
        </div>
      </div>

      {/* ── MAIN WORKSPACE CONTENT CONTAINER ── */}
      <div className="p-6 space-y-6">
        <div className="w-full space-y-5">
          {/* ── ADMINISTRATIVE & OPERATIONAL RECORD METADATA HEADER ── */}
          <div className="bg-white rounded-2xl border border-[#E5E7EB] shadow-sm p-5 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-blue-600" />
                <h3
                  className="text-sm font-bold text-slate-800"
                  style={{ fontFamily: PP }}
                >
                  Administrative & Operational Record Metadata
                </h3>
              </div>
              <span
                className="px-2.5 py-0.5 rounded text-[10px] font-bold tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200 uppercase"
                style={{ fontFamily: PP }}
              >
                READ-ONLY AUDIT MODE
              </span>
            </div>

            <div
              className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-8 gap-4 text-xs pt-1"
              style={{ fontFamily: RB }}
            >
              <div>
                <span
                  className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1"
                  style={{ fontFamily: PP }}
                >
                  Consultation ID
                </span>
                <p className="font-mono font-bold text-[#0D47A1] text-xs">
                  {record.id.startsWith("ENC-") || record.id.startsWith("CNS-")
                    ? record.id
                    : `CNS-${record.id}`}
                </p>
              </div>

              <div>
                <span
                  className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1"
                  style={{ fontFamily: PP }}
                >
                  Appointment ID
                </span>
                <p className="font-mono font-bold text-slate-700 text-xs">
                  {record.appointmentId &&
                  String(record.appointmentId) !== "0" &&
                  String(record.appointmentId) !== ""
                    ? String(record.appointmentId).startsWith("APT-")
                      ? record.appointmentId
                      : `APT-${record.appointmentId}`
                    : "—"}
                </p>
              </div>

              <div>
                <span
                  className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1"
                  style={{ fontFamily: PP }}
                >
                  Doctor
                </span>
                <p className="font-semibold text-slate-800 text-xs">
                  {record.doctorName || "—"}
                </p>
              </div>

              <div>
                <span
                  className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1"
                  style={{ fontFamily: PP }}
                >
                  Department
                </span>
                <p className="font-semibold text-slate-700 text-xs">
                  {record.department || "—"}
                </p>
              </div>

              <div>
                <span
                  className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1"
                  style={{ fontFamily: PP }}
                >
                  Visit Type
                </span>
                <p className="font-semibold text-blue-600 text-xs">
                  {record.visitType || "—"}
                </p>
              </div>

              <div>
                <span
                  className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1"
                  style={{ fontFamily: PP }}
                >
                  Status
                </span>
                <p className="font-bold text-emerald-600 text-xs">
                  {record.status || "—"}
                </p>
              </div>

              <div>
                <span
                  className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1"
                  style={{ fontFamily: PP }}
                >
                  Created Date
                </span>
                <p className="font-semibold text-slate-700 text-xs">
                  {formatDateTime(record.createdDate || record.visitDate)}
                </p>
              </div>

              <div>
                <span
                  className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1"
                  style={{ fontFamily: PP }}
                >
                  Completed Date
                </span>
                <p className="font-semibold text-slate-700 text-xs">
                  {formatDateTime(
                    record.completedDate || record.completionTime,
                  )}
                </p>
              </div>
            </div>
          </div>

          {/* ── SECTION 01: VISIT INFORMATION ── */}
          <div className="bg-white rounded-2xl border border-[#E5E7EB] shadow-sm overflow-hidden">
            <button
              onClick={() => toggleSection("visitInfo")}
              className="w-full px-5 py-4 bg-slate-50/50 flex items-center justify-between border-b border-gray-100 no-print"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-blue-50 text-[#0D47A1] flex items-center justify-center font-bold text-xs">
                  01
                </div>
                <h3
                  className="text-sm font-bold text-[#111827]"
                  style={{ fontFamily: PP }}
                >
                  Visit Information
                </h3>
              </div>
              <ChevronDown
                size={18}
                className={`text-slate-400 transition-transform ${collapsedSections.visitInfo ? "-rotate-90" : ""}`}
              />
              <ChevronDown
                size={18}
                className={`text-slate-400 transition-transform ${collapsedSections.visitInfo ? "-rotate-90" : ""}`}
              />
            </button>

            {!collapsedSections.visitInfo && (
              <div
                className="p-5 grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs"
                style={{ fontFamily: RB }}
              >
                <div>
                  <span
                    className="text-[10px] font-bold text-slate-400 uppercase"
                    style={{ fontFamily: PP }}
                  >
                    Consultation ID
                  </span>
                  <p className="font-mono font-bold text-[#0D47A1] text-sm mt-0.5">
                    {record.id}
                  </p>
                </div>
                <div>
                  <span
                    className="text-[10px] font-bold text-slate-400 uppercase"
                    style={{ fontFamily: PP }}
                  >
                    Visit Date
                  </span>
                  <p className="font-semibold text-slate-800 text-sm mt-0.5">
                    {formatDateOnly(record.visitDate || record.createdDate)}
                  </p>
                </div>
                <div>
                  <span
                    className="text-[10px] font-bold text-slate-400 uppercase"
                    style={{ fontFamily: PP }}
                  >
                    Doctor
                  </span>
                  <p className="font-semibold text-slate-800 text-sm mt-0.5">
                    {record.doctorName || "—"}
                  </p>
                </div>
                <div>
                  <span
                    className="text-[10px] font-bold text-slate-400 uppercase"
                    style={{ fontFamily: PP }}
                  >
                    Department
                  </span>
                  <p className="font-medium text-slate-700 mt-0.5">
                    {record.department || record.doctorSpecialty || "—"}
                  </p>
                </div>

                <div className="col-span-2 sm:col-span-4 pt-2 border-t border-gray-100">
                  <span
                    className="text-[10px] font-bold text-slate-400 uppercase"
                    style={{ fontFamily: PP }}
                  >
                    Chief Complaint
                  </span>
                  <p className="font-semibold text-[#111827] text-sm mt-0.5 bg-slate-50 p-3 rounded-xl border border-slate-100">
                    "{record.chiefComplaint}"
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* ── SECTION 02: PATIENT VITALS ── */}
          <div className="bg-white rounded-2xl border border-[#E5E7EB] shadow-sm overflow-hidden">
            <button
              onClick={() => toggleSection("vitals")}
              className="w-full px-5 py-4 bg-slate-50/50 flex items-center justify-between border-b border-gray-100 no-print"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-teal-50 text-[#009688] flex items-center justify-center font-bold text-xs">
                  02
                </div>
                <h3
                  className="text-sm font-bold text-[#111827]"
                  style={{ fontFamily: PP }}
                >
                  Patient Vitals
                </h3>
              </div>
              <ChevronDown
                size={18}
                className={`text-slate-400 transition-transform ${collapsedSections.vitals ? "-rotate-90" : ""}`}
              />
              <ChevronDown
                size={18}
                className={`text-slate-400 transition-transform ${collapsedSections.vitals ? "-rotate-90" : ""}`}
              />
            </button>

            {!collapsedSections.vitals && (
              <div
                className="p-5 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 text-xs"
                style={{ fontFamily: RB }}
              >
                <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl">
                  <div
                    className="text-[10px] text-slate-400 font-bold uppercase"
                    style={{ fontFamily: PP }}
                  >
                    Height
                  </div>
                  <div className="font-bold text-slate-800 text-sm mt-1">
                    {record.vitals.height}
                  </div>
                </div>
                <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl">
                  <div
                    className="text-[10px] text-slate-400 font-bold uppercase"
                    style={{ fontFamily: PP }}
                  >
                    Weight
                  </div>
                  <div className="font-bold text-slate-800 text-sm mt-1">
                    {record.vitals.weight}
                  </div>
                </div>
                <div className="p-3 bg-teal-50/60 border border-teal-100 rounded-xl">
                  <div
                    className="text-[10px] text-teal-600 font-bold uppercase"
                    style={{ fontFamily: PP }}
                  >
                    BMI
                  </div>
                  <div className="font-bold text-[#009688] text-sm mt-1">
                    {record.vitals.bmi}
                  </div>
                </div>
                <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl">
                  <div
                    className="text-[10px] text-slate-400 font-bold uppercase"
                    style={{ fontFamily: PP }}
                  >
                    Temperature
                  </div>
                  <div className="font-bold text-slate-800 text-sm mt-1">
                    {record.vitals.temperature}
                  </div>
                </div>
                <div className="p-3 bg-red-50/50 border border-red-100 rounded-xl">
                  <div
                    className="text-[10px] text-red-600 font-bold uppercase"
                    style={{ fontFamily: PP }}
                  >
                    Blood Pressure
                  </div>
                  <div className="font-bold text-red-700 text-sm mt-1">
                    {record.vitals.bp}
                  </div>
                </div>
                <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl">
                  <div
                    className="text-[10px] text-slate-400 font-bold uppercase"
                    style={{ fontFamily: PP }}
                  >
                    Pulse Rate
                  </div>
                  <div className="font-bold text-slate-800 text-sm mt-1">
                    {record.vitals.pulse}
                  </div>
                </div>
                {/* <div className="p-3 bg-fuchsia-50/50 border border-fuchsia-100 rounded-xl">
                  <div
                    className="text-[10px] text-fuchsia-700 font-bold uppercase"
                    style={{ fontFamily: PP }}
                  >
                    Blood Sugar
                  </div>
                  <div className="font-bold text-fuchsia-800 text-sm mt-1">
                    {record.vitals.bloodSugar || "—"}
                  </div>
                </div> */}
                <div className="p-3 bg-green-50/50 border border-green-100 rounded-xl">
                  <div
                    className="text-[10px] text-green-600 font-bold uppercase"
                    style={{ fontFamily: PP }}
                  >
                    SpO₂
                  </div>
                  <div className="font-bold text-green-700 text-sm mt-1">
                    {record.vitals.spo2}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* ── SECTION 03: CLINICAL EXAMINATION ── */}
          <div className="bg-white rounded-2xl border border-[#E5E7EB] shadow-sm overflow-hidden">
            <button
              onClick={() => toggleSection("examination")}
              className="w-full px-5 py-4 bg-slate-50/50 flex items-center justify-between border-b border-gray-100 no-print"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-700 flex items-center justify-center font-bold text-xs">
                  03
                </div>
                <h3
                  className="text-sm font-bold text-[#111827]"
                  style={{ fontFamily: PP }}
                >
                  Clinical Examination & Diagnosis
                </h3>
              </div>
              <ChevronDown
                size={18}
                className={`text-slate-400 transition-transform ${collapsedSections.examination ? "-rotate-90" : ""}`}
              />
              <ChevronDown
                size={18}
                className={`text-slate-400 transition-transform ${collapsedSections.examination ? "-rotate-90" : ""}`}
              />
            </button>

            {!collapsedSections.examination && (
              <div className="p-5 space-y-4 text-xs" style={{ fontFamily: RB }}>
                <div>
                  <span
                    className="text-[10px] font-bold text-slate-400 uppercase"
                    style={{ fontFamily: PP }}
                  >
                    Clinical Examination Findings
                  </span>
                  <p className="font-medium text-slate-700 mt-1 p-3 bg-slate-50 rounded-xl border border-slate-100">
                    {record.clinicalExamination}
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <span
                      className="text-[10px] font-bold text-slate-400 uppercase"
                      style={{ fontFamily: PP }}
                    >
                      Provisional Diagnosis
                    </span>
                    <p className="font-semibold text-slate-800 text-sm mt-1">
                      {record.provisionalDiagnosis}
                    </p>
                  </div>
                  <div>
                    <span
                      className="text-[10px] font-bold text-slate-400 uppercase"
                      style={{ fontFamily: PP }}
                    >
                      Final Diagnosis
                    </span>
                    <p className="font-bold text-[#0D47A1] text-sm mt-1">
                      {record.finalDiagnosis}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* ── SECTION 04: PRESCRIPTION ── */}
          <div className="bg-white rounded-2xl border border-[#E5E7EB] shadow-sm overflow-hidden">
            <button
              onClick={() => toggleSection("prescription")}
              className="w-full px-5 py-4 bg-slate-50/50 flex items-center justify-between border-b border-gray-100 no-print"
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
                  className="text-[11px] font-bold text-[#009688] bg-teal-50 px-2.5 py-0.5 rounded-full"
                  style={{ fontFamily: PP }}
                >
                  Total: {record.medicines.length} Prescribed Medications
                </span>
                <ChevronDown
                  size={18}
                  className={`text-slate-400 transition-transform ${collapsedSections.prescription ? "-rotate-90" : ""}`}
                />
              </div>
            </button>

            {!collapsedSections.prescription && (
              <div className="p-5">
                {record.medicines.length === 0 ? (
                  <p className="text-xs text-slate-500 italic p-3 bg-slate-50 rounded-xl border border-slate-100">
                    No medications prescribed for this encounter.
                  </p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr
                          className="bg-slate-50 border-b border-gray-100 text-[11px] font-bold text-[#64748B] uppercase"
                          style={{ fontFamily: PP }}
                        >
                          <th className="py-2.5 px-4">Medicine</th>
                          <th className="py-2.5 px-4">Dosage</th>
                          <th className="py-2.5 px-4">Frequency</th>
                          <th className="py-2.5 px-4">Duration</th>
                          <th className="py-2.5 px-4">Instructions</th>
                        </tr>
                      </thead>
                      <tbody
                        className="divide-y divide-gray-100"
                        style={{ fontFamily: RB }}
                      >
                        {record.medicines.map((m) => (
                          <tr key={m.id} className="hover:bg-slate-50">
                            <td
                              className="py-3 px-4 font-bold text-[#111827]"
                              style={{ fontFamily: PP }}
                            >
                              {m.name}
                            </td>
                            <td className="py-3 px-4 font-semibold text-slate-700">
                              {m.dosage}
                            </td>
                            <td className="py-3 px-4">
                              <span className="px-2 py-0.5 bg-blue-50 text-[#0D47A1] rounded font-semibold text-[11px]">
                                {m.frequency}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-slate-700">
                              {m.duration}
                            </td>
                            <td className="py-3 px-4 text-slate-600 italic">
                              {m.instructions}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* ── SECTION 05: INVESTIGATION RECOMMENDATION ── */}
          <div className="bg-white rounded-2xl border border-[#E5E7EB] shadow-sm overflow-hidden">
            <button
              onClick={() => toggleSection("investigation")}
              className="w-full px-5 py-4 bg-slate-50/50 flex items-center justify-between border-b border-gray-100 no-print"
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
              <ChevronDown
                size={18}
                className={`text-slate-400 transition-transform ${collapsedSections.investigation ? "-rotate-90" : ""}`}
              />
            </button>

            {!collapsedSections.investigation && (
              <div className="p-5 space-y-4 text-xs" style={{ fontFamily: RB }}>
                <div>
                  <span
                    className="text-[10px] font-bold text-slate-400 uppercase"
                    style={{ fontFamily: PP }}
                  >
                    Recommended Investigations
                  </span>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {record.investigations.length === 0 ? (
                      <span className="text-slate-500 italic">
                        None recommended
                      </span>
                    ) : (
                      record.investigations.map((inv) => (
                        <span
                          key={inv}
                          className="px-3 py-1 bg-purple-50 text-purple-700 border border-purple-200 rounded-xl font-bold text-xs"
                          style={{ fontFamily: PP }}
                        >
                          {inv}
                        </span>
                      ))
                    )}
                  </div>
                </div>

                {record.investigationRemarks &&
                  record.investigationRemarks !== "—" && (
                    <div>
                      <span
                        className="text-[10px] font-bold text-slate-400 uppercase"
                        style={{ fontFamily: PP }}
                      >
                        Remarks
                      </span>
                      <p className="font-medium text-slate-700 mt-1 p-3 bg-slate-50 rounded-xl border border-slate-100">
                        {record.investigationRemarks}
                      </p>
                    </div>
                  )}
              </div>
            )}
          </div>

          {/* ── SECTION 06: CLINICAL NOTES ── */}
          <div className="bg-white rounded-2xl border border-[#E5E7EB] shadow-sm overflow-hidden">
            <button
              onClick={() => toggleSection("clinicalNotes")}
              className="w-full px-5 py-4 bg-slate-50/50 flex items-center justify-between border-b border-gray-100 no-print"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-green-50 text-[#66BB6A] flex items-center justify-center font-bold text-xs">
                  06
                </div>
                <h3
                  className="text-sm font-bold text-[#111827]"
                  style={{ fontFamily: PP }}
                >
                  Clinical Notes
                </h3>
              </div>
              <ChevronDown
                size={18}
                className={`text-slate-400 transition-transform ${collapsedSections.clinicalNotes ? "-rotate-90" : ""}`}
              />
              <ChevronDown
                size={18}
                className={`text-slate-400 transition-transform ${collapsedSections.clinicalNotes ? "-rotate-90" : ""}`}
              />
            </button>

            {!collapsedSections.clinicalNotes && (
              <div
                className="p-5 grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs"
                style={{ fontFamily: RB }}
              >
                <div>
                  <span
                    className="text-[10px] font-bold text-slate-400 uppercase"
                    style={{ fontFamily: PP }}
                  >
                    Symptoms
                  </span>
                  <p className="font-medium text-slate-700 mt-1 p-3 bg-slate-50 rounded-xl border border-slate-100">
                    {record.symptoms}
                  </p>
                </div>
                <div>
                  <span
                    className="text-[10px] font-bold text-slate-400 uppercase"
                    style={{ fontFamily: PP }}
                  >
                    Assessment
                  </span>
                  <p className="font-medium text-slate-700 mt-1 p-3 bg-slate-50 rounded-xl border border-slate-100">
                    {record.assessment}
                  </p>
                </div>
                <div>
                  <span
                    className="text-[10px] font-bold text-slate-400 uppercase"
                    style={{ fontFamily: PP }}
                  >
                    Advice
                  </span>
                  <p className="font-medium text-slate-700 mt-1 p-3 bg-slate-50 rounded-xl border border-slate-100">
                    {record.advice}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* ── SECTION 07: FOLLOW-UP ── */}
          <div className="bg-white rounded-2xl border border-[#E5E7EB] shadow-sm overflow-hidden">
            <button
              onClick={() => toggleSection("followup")}
              className="w-full px-5 py-4 bg-slate-50/50 flex items-center justify-between border-b border-gray-100 no-print"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center font-bold text-xs">
                  07
                </div>
                <h3
                  className="text-sm font-bold text-[#111827]"
                  style={{ fontFamily: PP }}
                >
                  Follow-up
                </h3>
              </div>
              <ChevronDown
                size={18}
                className={`text-slate-400 transition-transform ${collapsedSections.followup ? "-rotate-90" : ""}`}
              />
              <ChevronDown
                size={18}
                className={`text-slate-400 transition-transform ${collapsedSections.followup ? "-rotate-90" : ""}`}
              />
            </button>

            {!collapsedSections.followup &&
              (() => {
                const isRequiredYes =
                  record.followupRequired === "Yes" ||
                  (record.followupRequired as unknown) === true ||
                  String(record.followupRequired).toLowerCase() === "yes" ||
                  String(record.followupRequired).toLowerCase() === "true";

                return (
                  <div
                    className="p-5 grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs"
                    style={{ fontFamily: RB }}
                  >
                    <div>
                      <span
                        className="text-[10px] font-bold text-slate-400 uppercase block mb-1"
                        style={{ fontFamily: PP }}
                      >
                        Follow-up Required
                      </span>
                      {isRequiredYes ? (
                        <span className="inline-flex items-center gap-1.5 font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200 text-xs">
                          <CheckCircle2
                            size={15}
                            className="text-emerald-600"
                          />{" "}
                          Yes (Follow-up Scheduled)
                        </span>
                      ) : (
                        <span className="font-semibold text-slate-500 text-xs">
                          No
                        </span>
                      )}
                    </div>

                    {isRequiredYes && (
                      <>
                        <div>
                          <span
                            className="text-[10px] font-bold text-slate-400 uppercase"
                            style={{ fontFamily: PP }}
                          >
                            Follow-up Type
                          </span>
                          <p className="font-semibold text-slate-800 mt-1">
                            {record.followUpType === "ROUTINE"
                              ? "Routine Follow-up"
                              : record.followUpType === "SPECIALIST"
                                ? "Specialist Referral"
                                : record.followUpType === "TELECONSULT"
                                  ? "Teleconsultation"
                                  : record.followUpType === "EMERGENCY"
                                    ? "Urgent / Emergency"
                                    : record.followUpType ||
                                      "Routine Follow-up"}
                          </p>
                        </div>
                        {record.nextVisitDate &&
                          record.nextVisitDate !== "—" &&
                          record.nextVisitDate !== "None" &&
                          record.nextVisitDate !== "" && (
                            <div>
                              <span
                                className="text-[10px] font-bold text-slate-400 uppercase"
                                style={{ fontFamily: PP }}
                              >
                                Next Visit Date
                              </span>
                              <p className="font-bold text-[#0D47A1] text-sm mt-1">
                                {formatDateOnly(record.nextVisitDate)}
                              </p>
                            </div>
                          )}
                        <div className="sm:col-span-3 border-t border-gray-100 pt-2">
                          <span
                            className="text-[10px] font-bold text-slate-400 uppercase"
                            style={{ fontFamily: PP }}
                          >
                            Follow-up Notes
                          </span>
                          <p className="font-medium text-slate-700 mt-1 p-3 bg-slate-50 rounded-xl border border-slate-100">
                            {record.followupNotes || "None recorded"}
                          </p>
                        </div>
                      </>
                    )}
                  </div>
                );
              })()}
          </div>

          {/* ── SECTION 08: CONSULTATION SUMMARY ── */}
          <div className="bg-white rounded-2xl border border-[#E5E7EB] shadow-sm p-5 space-y-4">
            <h3
              className="text-sm font-bold text-[#111827] flex items-center gap-2 border-b border-gray-100 pb-3"
              style={{ fontFamily: PP }}
            >
              <CheckCircle2 size={16} className="text-[#66BB6A]" />
              Consultation Final Summary
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
                  {record.patientName || "—"}
                </p>
                <p className="text-[11px] text-slate-500">{record.mrn}</p>
              </div>
              <div>
                <span
                  className="text-[10px] text-slate-400 uppercase font-bold"
                  style={{ fontFamily: PP }}
                >
                  Doctor
                </span>
                <p className="font-bold text-[#111827]">
                  {record.doctorName || "—"}
                </p>
                {record.department && (
                  <p className="text-[11px] text-slate-500">
                    {record.department}
                  </p>
                )}
              </div>
              <div>
                <span
                  className="text-[10px] text-slate-400 uppercase font-bold"
                  style={{ fontFamily: PP }}
                >
                  Final Diagnosis
                </span>
                <p className="font-bold text-[#0D47A1]">
                  {record.finalDiagnosis || "—"}
                </p>
              </div>
              <div>
                <span
                  className="text-[10px] text-slate-400 uppercase font-bold"
                  style={{ fontFamily: PP }}
                >
                  Prescription & Tests
                </span>
                <p className="font-bold text-[#009688]">
                  {record.medicines.length} Medicines
                </p>
                <p className="text-[11px] text-slate-500">
                  {record.investigations.length} Recommended Tests
                </p>
              </div>
            </div>

            <div className="pt-3 border-t border-gray-100 flex flex-wrap items-center justify-between text-xs gap-3">
              <div className="flex items-center gap-4">
                {record.nextVisitDate &&
                  record.nextVisitDate !== "—" &&
                  record.nextVisitDate !== "None" &&
                  record.nextVisitDate !== "" && (
                    <span>
                      Follow-up Date:{" "}
                      <strong className="text-[#111827]">
                        {formatDateOnly(record.nextVisitDate)}
                      </strong>
                    </span>
                  )}
                <span>
                  Completed Time:{" "}
                  <strong className="text-slate-700">
                    {formatDateTime(
                      record.completedDate ||
                        record.completionTime ||
                        record.createdDate ||
                        record.visitDate,
                    )}
                  </strong>
                </span>
              </div>
              <span
                className="px-3 py-1 bg-green-50 text-[#66BB6A] border border-green-200 rounded-full font-bold text-[11px]"
                style={{ fontFamily: PP }}
              >
                Status: {record.status}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ── STICKY FOOTER ACTION BAR ── */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-[#E5E7EB] px-6 py-3 shadow-lg flex items-center justify-between no-print">
        <div className="text-xs text-[#64748B]" style={{ fontFamily: RB }}>
          Consultation Record{" "}
          <strong className="text-[#0D47A1]">{record.id}</strong> ·{" "}
          {record.patientName}
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => (onBack ? onBack() : navigate(-1))}
            className="px-4 py-2 border border-[#E5E7EB] bg-white text-slate-700 hover:bg-slate-50 text-xs font-semibold rounded-xl transition-colors shadow-sm cursor-pointer"
            style={{ fontFamily: PP }}
          >
            Cancel
          </button>
          <button
            onClick={handlePrint}
            className="px-4 py-2 border border-[#E5E7EB] bg-slate-50 text-slate-700 hover:bg-slate-100 text-xs font-semibold rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer"
            style={{ fontFamily: PP }}
          >
            <Printer size={15} className="text-[#009688]" />
            Print Prescription
          </button>
          <button
            onClick={handleStartEdit}
            className="px-4 py-2 bg-[#0D47A1] hover:bg-[#0a3880] text-white text-xs font-semibold rounded-xl transition-colors flex items-center gap-1.5 shadow-sm cursor-pointer"
            style={{ fontFamily: PP }}
          >
            <Edit3 size={15} />
            Edit Consultation
          </button>
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
                Patient Consultation History — {record.patientName} (
                {record.mrn})
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
                patientId={record.mrn}
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
