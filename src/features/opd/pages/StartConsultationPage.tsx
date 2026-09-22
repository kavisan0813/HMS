import { useState, useMemo, useEffect, useRef } from "react";
import { CheckCircle2, AlertCircle, ChevronDown } from "lucide-react";
import { usePermissions } from "../../../permissions/usePermissions";
import { useConsultation } from "../hooks/useConsultation";
import { useEncounter } from "../hooks/useEncounter";
import { useVitals } from "../hooks/useVitals";
import { useDiagnosis } from "../hooks/useDiagnosis";
import { useInvoice } from "../../billing/hooks/useBilling";
import type { ConsultationFormData, MedicineItem } from "../types/consultation";
import { encountersApi } from "../../encounters/api/encounters.api";
import { consultationApi } from "../api/consultationApi";
import { ConsultationHeader } from "../components/ConsultationHeader";
import { PatientSummaryCard } from "../components/PatientSummaryCard";
import { VitalsCard } from "../components/VitalsCard";
import { ConsultationForm } from "../components/ConsultationForm";
import { DiagnosisForm } from "../components/DiagnosisForm";
import { MedicineTable } from "../components/MedicineTable";
import { InvestigationTable } from "../components/InvestigationTable";
import { FollowupForm } from "../components/FollowupForm";
import { ConsultationFooter } from "../components/ConsultationFooter";
import { EncounterPrescriptionViewModal } from "../../prescriptions/components/EncounterPrescriptionViewModal";
import { ConsultationDetailsScreen } from "../components/ConsultationDetailsScreen";
import { useNavigate, useParams } from "react-router";
import { appointmentsApi } from "../../appointments/api/appointments.api";
import { consultationService } from "../services/consultationService";

const PP = "'Poppins', system-ui, sans-serif";
const RB = "'Roboto', system-ui, sans-serif";

const emptyFormData: ConsultationFormData = {
  visitDate: "",
  doctorName: "",
  department: "",
  visitType: "New Consultation",
  chiefComplaint: "",
  durationOfSymptoms: "",
  height: "",
  weight: "",
  temperature: "",
  bp: "",
  pulse: "",
  respiratoryRate: "",
  spo2: "",
  bloodSugar: "",
  clinicalExamination: "",
  provisionalDiagnosis: "",
  finalDiagnosis: "",
  icdCode: "",
  medicines: [],
  investigations: {
    cbc: false,
    ecg: false,
    xray: false,
    ultrasound: false,
    other: false,
  },
  customInvestigation: "",
  investigationRemarks: "",
  symptoms: "",
  assessment: "",
  advice: "",
  lifestyleRecommendations: "",
  followupRequired: false,
  nextVisitDate: "",
  followupNotes: "",
  followUpType: "ROUTINE",
  followUpIntervalValue: 7,
  followUpIntervalUnit: "DAYS",
};

const TODAY_STR = new Date().toISOString().split("T")[0];
const NEXT_VISIT_STR = new Date(Date.now() + 7 * 86400000)
  .toISOString()
  .split("T")[0];

const saveMedications = async (
  prescriptionId: string | number,
  medicines: MedicineItem[],
) => {
  const validMeds = medicines.filter((m) => m.name.trim() !== "");
  console.log("SAVE MEDICATIONS CALLED:", {
    prescriptionId,
    medicines: validMeds,
  });
  console.log("SAVE MEDICATIONS CALLED:", {
    prescriptionId,
    medicines: validMeds,
  });

  if (validMeds.length === 0) {
    console.warn("No valid medicines to save");
    return;
  }

  await Promise.all(
    validMeds.map(async (med) => {
      console.log("ADDING MEDICATION ITEM:", med);
      const res = await encountersApi.addMedication(prescriptionId, {
        source: "FREE_TEXT",
        medicineName: med.name,
        doseValue: parseInt(med.dosage) || 500,
        doseUnit: "MG",
        frequencyCode: med.frequency || "1-0-1",
        durationValue: parseInt(med.duration) || 7,
        durationUnit: "DAYS",
        route: "ORAL",
        instructions: med.instructions || "After food",
      });
      console.log("ADD MEDICATION RESPONSE:", res);
      return res;
    }),
  );
};

export function StartConsultationPage({
  patientId,
  onBack,
  onCompleteSuccess,
  onViewHistory,
  onViewPatientProfile,
}: {
  patientId?: string;
  onBack?: () => void;
  onCompleteSuccess?: () => void;
  onViewHistory?: (patientId?: string) => void;
  onViewPatientProfile?: (mrn?: string) => void;
}) {
  const navigate = useNavigate();
  const { consultationId: urlConsultationId } = useParams<{
    consultationId?: string;
  }>();
  const activeConsultationId =
    urlConsultationId ||
    patientId ||
    (typeof window !== "undefined"
      ? sessionStorage.getItem("hms-active-consultation-id")
      : null) ||
    undefined;

  const { can } = usePermissions();
  const { selectedAppointment, selectedConsultation } = useConsultation();
  const { selectedEncounter, selectedPrescription, finalizeConsultation } =
    useEncounter();

  const { createBill } = useInvoice();

  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const triggerToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  };

  const [restoredPatientData, setRestoredPatientData] = useState<{
    patientName?: string;
    mrn?: string;
    age?: number;
    gender?: string;
    phone?: string;
    bloodGroup?: string;
    allergies?: string[];
    doctor?: string;
    opdRoom?: string;
    visitType?: string;
    appointmentTime?: string;
  } | null>(null);
  const todayStr = TODAY_STR;
  const nextVisitStr = NEXT_VISIT_STR;

  const dept =
    selectedAppointment?.departmentName ||
    (typeof selectedAppointment?.department === "string"
      ? selectedAppointment.department
      : selectedAppointment?.department?.name ||
        selectedAppointment?.department?.departmentName) ||
    "";

  const [formData, setFormData] = useState<ConsultationFormData>({
    ...emptyFormData,
    visitDate: todayStr,
    nextVisitDate: nextVisitStr,
    doctorName: selectedAppointment?.doctorName || "",
    department: dept,
    visitType:
      selectedAppointment?.visitType === "Follow-up"
        ? "Follow-up"
        : "New Consultation",
    chiefComplaint:
      selectedAppointment?.chiefComplaint ||
      selectedConsultation?.chiefComplaint ||
      "",
  });

  useEffect(() => {
    if (!activeConsultationId) return;

    try {
      sessionStorage.setItem(
        "hms-active-consultation-id",
        String(activeConsultationId),
      );
    } catch (err) {
      console.log(err);
      // ignore
    }

    let cancelled = false;

    const loadContext = async () => {
      try {
        const res = await consultationService
          .loadFullConsultationDetails(activeConsultationId)
          .catch(() => null);
        if (cancelled) return;

        if (res) {
          const c = (res.consultation || res) as unknown as Record<
            string,
            unknown
          >;
          const pSub = (c.patient || {}) as Record<string, unknown>;
          const docSub = (c.doctor || {}) as Record<string, unknown>;
          const pName = String(
            c.patientName ||
              c.patient_name ||
              pSub.name ||
              pSub.fullName ||
              pSub.full_name ||
              "",
          );
          const pMrn = String(
            c.mrn || c.patientMrn || c.patient_mrn || pSub.mrn || "",
          );

          if (pName || pMrn) {
            setRestoredPatientData({
              patientName: pName,
              mrn: pMrn,
              age: Number(c.age || c.patientAge || pSub.age || 0),
              gender: String(c.gender || c.patientGender || pSub.gender || ""),
              phone: String(
                c.phone ||
                  c.mobile ||
                  pSub.phone ||
                  pSub.registeredMobile ||
                  "",
              ),
              bloodGroup: String(c.bloodGroup || pSub.bloodGroup || ""),
              allergies: Array.isArray(c.allergies)
                ? (c.allergies as string[])
                : Array.isArray(pSub.allergies)
                  ? (pSub.allergies as string[])
                  : [],
              doctor: String(
                c.doctor ||
                  c.doctorName ||
                  docSub.name ||
                  docSub.fullName ||
                  "",
              ),
              opdRoom: String(c.opdRoom || c.roomNumber || ""),
              visitType: String(
                c.visitType || c.appointmentType || "New Consultation",
              ),
              appointmentTime: String(c.appointmentTime || c.time || ""),
            });

            const vObj = (c.vitals ||
              (res as Record<string, unknown>).vitals ||
              {}) as Record<string, unknown>;
            const toStr = (v: unknown) => (v != null ? String(v) : "");

            setFormData((prev) => ({
              ...prev,
              doctorName: String(
                c.doctor || c.doctorName || docSub.name || prev.doctorName,
              ),
              department: String(
                c.department || c.departmentName || prev.department,
              ),
              chiefComplaint: String(c.chiefComplaint || prev.chiefComplaint),
              visitType:
                (c.visitType as "New Consultation" | "Follow-up") ||
                prev.visitType,
              height: vObj.height
                ? toStr(vObj.height).replace(" cm", "")
                : prev.height,
              weight: vObj.weight
                ? toStr(vObj.weight).replace(" kg", "")
                : prev.weight,
              temperature:
                vObj.temp || vObj.temperature
                  ? toStr(vObj.temp || vObj.temperature)
                      .replace(" °C", "")
                      .replace("°C", "")
                  : prev.temperature,
              bp:
                vObj.bp || vObj.bloodPressure
                  ? toStr(vObj.bp || vObj.bloodPressure).replace(" mmHg", "")
                  : prev.bp,
              pulse:
                vObj.pulse || vObj.heartRate
                  ? toStr(vObj.pulse || vObj.heartRate).replace(" bpm", "")
                  : prev.pulse,
              respiratoryRate:
                vObj.respiratoryRate || vObj.respRate
                  ? toStr(vObj.respiratoryRate || vObj.respRate).replace(
                      " /min",
                      "",
                    )
                  : prev.respiratoryRate,
              spo2:
                vObj.spo2 || vObj.oxygenSaturation
                  ? toStr(vObj.spo2 || vObj.oxygenSaturation)
                      .replace(" %", "")
                      .replace("%", "")
                  : prev.spo2,
              bloodSugar:
                vObj.bloodSugar ||
                vObj.sugar ||
                vObj.bloodSugarMgDl ||
                vObj.randomBloodSugar ||
                vObj.fastingBloodSugar ||
                vObj.glucose ||
                vObj.rbs ||
                vObj.fbs
                  ? toStr(
                      vObj.bloodSugar ||
                        vObj.sugar ||
                        vObj.bloodSugarMgDl ||
                        vObj.randomBloodSugar ||
                        vObj.fastingBloodSugar ||
                        vObj.glucose ||
                        vObj.rbs ||
                        vObj.fbs,
                    ).replace(" mg/dL", "")
                  : prev.bloodSugar,
            }));

            // Restore existing prescription medicines (only for completed consultations)
            const cStatus = String(
              c.status || c.consultationStatus || c.state || "",
            ).toUpperCase();
            const isCompletedConsultation =
              cStatus === "COMPLETED" || cStatus === "FINISHED";

            if (isCompletedConsultation) {
              try {
                let existingMeds: MedicineItem[] = [];
                const rxRes = await encountersApi
                  .getPrescriptionByEncounterId(activeConsultationId)
                  .catch(() => null);
                if (rxRes) {
                  const rxObj = rxRes as unknown as Record<string, unknown>;
                  const rawMeds = (rxObj.medications ||
                    rxObj.medicines ||
                    rxObj.items ||
                    rxObj.prescriptionItems ||
                    []) as unknown[];
                  if (Array.isArray(rawMeds) && rawMeds.length > 0) {
                    existingMeds = rawMeds.map((m: unknown, idx: number) => {
                      const item = (
                        m && typeof m === "object" ? m : {}
                      ) as Record<string, unknown>;
                      return {
                        id: String(item.id || item.medicationId || idx + 1),
                        name: String(
                          item.name ||
                            item.medicineName ||
                            item.drugName ||
                            "Medication",
                        ),
                        dosage: String(
                          item.dosage || item.dose || item.doseValue || "1 tab",
                        ),
                        frequency: String(
                          item.frequency ||
                            item.frequencyCode ||
                            item.frequencyDisplay ||
                            "1-0-1",
                        ),
                        duration: String(
                          item.duration || item.durationValue || "5 days",
                        ),
                        instructions: String(
                          item.instructions || item.notes || "After food",
                        ),
                      };
                    });
                  }
                }
                if (existingMeds.length === 0) {
                  const rawCached = localStorage.getItem(
                    `hms-completed-meds:${activeConsultationId}`,
                  );
                  if (rawCached) {
                    existingMeds = JSON.parse(rawCached);
                  }
                }
                if (!cancelled && existingMeds.length > 0) {
                  setFormData((prev) => ({
                    ...prev,
                    medicines: existingMeds,
                  }));
                }
              } catch (err) {
                console.log(err);
                // non-blocking
              }
            }

            return;
          }
        }

        let numericId: number | undefined;
        if (typeof activeConsultationId === "number") {
          numericId = activeConsultationId;
        } else if (typeof activeConsultationId === "string") {
          const clean = activeConsultationId
            .replace(/^BL-|^APP-|^ENC-/, "")
            .replace(/[^0-9]/g, "");
          if (clean) numericId = parseInt(clean, 10);
        }

        const idToTry = numericId || activeConsultationId;
        const apptRes = await appointmentsApi
          .getAppointmentById(idToTry)
          .catch(() => null);

        if (cancelled) return;

        if (apptRes) {
          const rawData = (apptRes as unknown as Record<string, unknown>)?.data;
          const appt = ((rawData as Record<string, unknown>)?.data ||
            rawData ||
            apptRes) as Record<string, unknown>;
          const patientObj = (appt.patient || {}) as Record<string, unknown>;
          const doctorObj = (appt.doctor || {}) as Record<string, unknown>;
          const deptObj = (appt.department || {}) as Record<string, unknown>;

          const pName = String(
            appt.patientName ||
              appt.patient_name ||
              patientObj.name ||
              patientObj.fullName ||
              patientObj.full_name ||
              "",
          );
          const pMrn = String(
            appt.mrn ||
              appt.patientMrn ||
              appt.patient_mrn ||
              patientObj.mrn ||
              "",
          );
          const deptName = String(
            appt.departmentName ||
              appt.department_name ||
              deptObj.departmentName ||
              deptObj.name ||
              (typeof appt.department === "string" ? appt.department : "") ||
              "",
          );

          setRestoredPatientData({
            patientName: pName,
            mrn: pMrn,
            age: Number(appt.patientAge || appt.age || patientObj.age || 0),
            gender: String(
              appt.patientGender || appt.gender || patientObj.gender || "",
            ),
            phone: String(
              appt.patientPhone ||
                appt.mobile ||
                patientObj.phone ||
                patientObj.registeredMobile ||
                "",
            ),
            bloodGroup: String(patientObj.bloodGroup || ""),
            allergies: Array.isArray(patientObj.allergies)
              ? (patientObj.allergies as string[])
              : [],
            doctor: String(
              appt.doctorName ||
                appt.doctor_name ||
                doctorObj.name ||
                doctorObj.fullName ||
                appt.doctor ||
                "",
            ),
            opdRoom: String(appt.opdRoom || appt.roomNumber || ""),
            visitType: String(
              appt.appointmentType || appt.visitType || "New Consultation",
            ),
            appointmentTime: String(appt.appointmentTime || appt.time || ""),
          });

          setFormData((prev) => ({
            ...prev,
            doctorName: String(
              appt.doctorName ||
                appt.doctor_name ||
                doctorObj.name ||
                prev.doctorName,
            ),
            department: deptName || prev.department,
            chiefComplaint: String(appt.chiefComplaint || prev.chiefComplaint),
            visitType:
              appt.appointmentType === "Follow-up" ||
              appt.visitType === "Follow-up"
                ? "Follow-up"
                : "New Consultation",
          }));
        }
      } catch (err) {
        console.warn("Failed to load consultation context:", err);
      }
    };

    void loadContext();

    return () => {
      cancelled = true;
    };
  }, [activeConsultationId, selectedAppointment, selectedConsultation]);

  const activeEncounterId =
    selectedEncounter?.encounterId || selectedConsultation?.encounterId;
  const activeAppointmentId =
    selectedAppointment?.id || selectedConsultation?.id;
  const activePrescriptionId = selectedPrescription?.id;

  const { saveVitals } = useVitals(activeEncounterId);
  const { addDiagnosis } = useDiagnosis(activeEncounterId);

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

  const toggleSection = (key: string) => {
    setCollapsedSections((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  useEffect(() => {
    const targetVitalsId =
      activeEncounterId ||
      selectedEncounter?.encounterId ||
      selectedConsultation?.encounterId ||
      activeConsultationId ||
      selectedAppointment?.id;

    if (!targetVitalsId) return;

    let active = true;

    consultationService.loadEncounterContext(targetVitalsId).then((data) => {
      if (active && data) {
        const toStr = (v: unknown) => (v != null ? String(v) : "");
        setFormData((prev) => ({
          ...prev,
          height: data.height
            ? toStr(data.height).replace(" cm", "")
            : prev.height,
          weight: data.weight
            ? toStr(data.weight).replace(" kg", "")
            : prev.weight,
          temperature: data.temp
            ? toStr(data.temp).replace(" °C", "").replace("°C", "")
            : prev.temperature,
          bp: data.bp ? toStr(data.bp).replace(" mmHg", "") : prev.bp,
          pulse: data.pulse
            ? toStr(data.pulse).replace(" bpm", "")
            : prev.pulse,
          respiratoryRate: data.respiratoryRate
            ? toStr(data.respiratoryRate).replace(" /min", "")
            : prev.respiratoryRate,
          spo2: data.spo2
            ? toStr(data.spo2).replace(" %", "").replace("%", "")
            : prev.spo2,
          bloodSugar: data.bloodSugar
            ? toStr(data.bloodSugar).replace(" mg/dL", "")
            : prev.bloodSugar,
        }));
      }
    });

    return () => {
      active = false;
    };
  }, [
    activeEncounterId,
    activeConsultationId,
    selectedEncounter,
    selectedConsultation,
    selectedAppointment,
  ]);

  const calculatedBmi = useMemo(() => {
    const h = parseFloat(formData.height) / 100;
    const w = parseFloat(formData.weight);
    if (h > 0 && w > 0) return (w / (h * h)).toFixed(1);
    return "--";
  }, [formData.height, formData.weight]);

  const [showToast, setShowToast] = useState(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [isDraftSaved, setIsDraftSaved] = useState(false);
  const [isFinalizing, setIsFinalizing] = useState(false);
  const [showCompleteModal, setShowCompleteModal] = useState(false);
  const createdBillIdRef = useRef<string | null>(null);
  const [finalizedData, setFinalizedData] = useState<{
    date: string;
    patientName: string;
    mrn: string;
    age: number | string;
    gender: string;
    phone: string;
    encounterId: string | number;
    appointmentId?: string | number;
    doctor: string;
    department: string;
    visitType: string;
    vitals: {
      height: string;
      weight: string;
      bp: string;
      pulse: string;
      temp: string;
      spo2: string;
      respiratoryRate?: string;
      bloodSugar?: string;
      bmi: string;
    };
    chiefComplaint: string;
    clinicalExamination?: string;
    finalDiagnosis: string;
    icdCode?: string;
    medicines: MedicineItem[];
    advice?: string;
    dietAdvice?: string;
    nextVisitDate?: string;
    followupNotes?: string;
  } | null>(null);

  const [viewPrescriptionEncounterId, setViewPrescriptionEncounterId] =
    useState<string | number | null>(null);

  const handleCloseCompleteModal = () => {
    setShowCompleteModal(false);
    if (onCompleteSuccess) {
      onCompleteSuccess();
    } else if (onBack) {
      onBack();
    } else {
      navigate("/consultation", { replace: true });
    }
  };

  const handleAddMedicine = () => {
    const newMed: MedicineItem = {
      id: Date.now().toString(),
      name: "",
      dosage: "",
      frequency: "Once Daily",
      duration: "7 Days",
      instructions: "",
    };
    setFormData((prev) => ({
      ...prev,
      medicines: [...prev.medicines, newMed],
    }));
  };

  const handleUpdateMedicine = (
    id: string,
    field: keyof MedicineItem,
    val: string,
  ) => {
    setFormData((prev) => ({
      ...prev,
      medicines: prev.medicines.map((m) =>
        m.id === id ? { ...m, [field]: val } : m,
      ),
    }));
  };

  const handleRemoveMedicine = (id: string) => {
    setFormData((prev) => ({
      ...prev,
      medicines: prev.medicines.filter((m) => m.id !== id),
    }));
  };

  const handleFieldChange = (field: string, val: unknown) => {
    setFormData((prev) => ({ ...prev, [field]: val }));
  };

  const handleVitalsChange = (field: string, val: string) => {
    const fieldMap: Record<string, string> = {
      temp: "temperature",
    };
    const actualField = fieldMap[field] || field;
    setFormData((prev) => ({ ...prev, [actualField]: val }));
  };

  const handleSaveDraft = async () => {
    setIsDraftSaved(true);
    try {
      if (activeEncounterId) {
        const consultationPayload = {
          chiefComplaint: formData.chiefComplaint || formData.symptoms,
          historyOfPresentIllness: formData.symptoms || formData.chiefComplaint,
          generalExamination: formData.clinicalExamination,
          assessmentSummary: formData.assessment,
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
        await encountersApi
          .initConsultationPut(activeEncounterId, consultationPayload)
          .catch(() => null);
        await consultationApi.saveDraft(activeEncounterId, {
          chiefComplaint: formData.chiefComplaint,
          symptoms: formData.symptoms,
          clinicalExamination: formData.clinicalExamination,
          assessment: formData.assessment,
          advice: formData.advice,
        });
        await saveVitals({
          height: formData.height ? formData.height + " cm" : undefined,
          weight: formData.weight ? formData.weight + " kg" : undefined,
          temp: formData.temperature ? formData.temperature + "°C" : undefined,
          bp: formData.bp || undefined,
          pulse: formData.pulse ? formData.pulse + " bpm" : undefined,
          spo2: formData.spo2 ? formData.spo2 + "%" : undefined,
          respiratoryRate: formData.respiratoryRate || undefined,
          bloodSugar: formData.bloodSugar || undefined,
        });
      }
      if (activePrescriptionId) {
        await saveMedications(activePrescriptionId, formData.medicines);
      }
      if (selectedConsultation?.id) {
        await consultationApi.saveClinicalNotes(selectedConsultation.id, {
          chiefComplaint: formData.chiefComplaint || formData.symptoms,
          historyOfPresentIllness: formData.symptoms || formData.chiefComplaint,
          generalExamination: formData.clinicalExamination,
          assessmentSummary: formData.assessment,
          advice: formData.advice,
        });
      }
    } catch (err) {
      console.log(err);
      // non-blocking
    } finally {
      setTimeout(() => setIsDraftSaved(false), 2500);
    }
  };
  const patientName =
    selectedAppointment?.patientName ||
    selectedConsultation?.patientName ||
    restoredPatientData?.patientName ||
    "";
  const patientMrn =
    selectedAppointment?.mrn ||
    selectedConsultation?.mrn ||
    restoredPatientData?.mrn ||
    "";
  const patientAge =
    selectedAppointment?.patientAge ||
    selectedAppointment?.patient?.age ||
    selectedConsultation?.age ||
    restoredPatientData?.age ||
    0;
  const patientGender =
    selectedAppointment?.patientGender ||
    selectedAppointment?.patient?.gender ||
    selectedConsultation?.gender ||
    restoredPatientData?.gender ||
    "";
  const patientPhone =
    selectedAppointment?.patientPhone ||
    selectedAppointment?.patient?.phone ||
    selectedAppointment?.patient?.mobile ||
    selectedConsultation?.phone ||
    restoredPatientData?.phone ||
    "";
  const patientBloodGroup =
    selectedConsultation?.bloodGroup ||
    (selectedAppointment?.patient as { bloodGroup?: string })?.bloodGroup ||
    restoredPatientData?.bloodGroup ||
    "";
  const patientAllergies =
    selectedConsultation?.allergies ||
    (selectedAppointment?.patient as { allergies?: string[] })?.allergies ||
    restoredPatientData?.allergies ||
    [];
  const primaryDoctorName =
    formData.doctorName ||
    selectedAppointment?.doctorName ||
    selectedConsultation?.doctor ||
    restoredPatientData?.doctor ||
    "";
  const opdRoomNumber =
    selectedAppointment?.opdRoom ||
    selectedConsultation?.opdRoom ||
    restoredPatientData?.opdRoom ||
    "";
  const appointmentTimeStr =
    selectedAppointment?.appointmentTime ||
    selectedConsultation?.appointmentTime ||
    restoredPatientData?.appointmentTime ||
    "";

  const handleFinalize = async () => {
    if (isFinalizing) return;
    const errors: string[] = [];
    if (!formData.chiefComplaint.trim())
      errors.push("Chief Complaint is required.");
    if (!formData.finalDiagnosis.trim())
      errors.push("Final Diagnosis is required.");

    if (errors.length > 0) {
      setValidationErrors(errors);
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    setValidationErrors([]);
    setIsFinalizing(true);
    setShowToast(true);

    try {
      if (can("DIAGNOSIS_CREATE") && activeEncounterId) {
        try {
          await addDiagnosis(
            formData.icdCode || "R69",
            formData.finalDiagnosis ||
              "Documented clinical conclusion/assessment",
            activeEncounterId,
          );
        } catch (diagErr) {
          console.warn("Non-blocking diagnosis save warning:", diagErr);
          triggerToast("Warning: Diagnosis could not be saved. Please retry.");
        }
      }
      let rxIdToUse: string | number | null = activePrescriptionId || null;
      const validMeds = formData.medicines.filter((m) => m.name.trim() !== "");

      if (!rxIdToUse && validMeds.length > 0) {
        const targetEncId =
          activeEncounterId ||
          selectedConsultation?.encounterId ||
          selectedConsultation?.id;
        if (targetEncId) {
          try {
            const createdRx = await encountersApi.createPrescription(
              targetEncId,
              { outcome: "MEDICATION_PRESCRIBED", encounterId: targetEncId },
            );
            console.log("CREATE PRESCRIPTION RAW RESPONSE:", createdRx);

            const rxObj = createdRx as unknown as Record<string, unknown>;
            const rxData = (rxObj?.data as Record<string, unknown>) || {};
            const rxIdResolved =
              createdRx?.id ??
              createdRx?.prescriptionId ??
              rxData.id ??
              rxData.prescriptionId ??
              null;

            console.log("RESOLVED PRESCRIPTION ID:", rxIdResolved);
            // CRITICAL FIX: Only accept rxIdResolved if it is NOT equal to targetEncId
            if (
              rxIdResolved != null &&
              String(rxIdResolved) !== String(targetEncId)
            ) {
              rxIdToUse = rxIdResolved as string | number;
            } else {
              console.warn(
                "Prescription creation did not return a distinct prescription ID:",
                createdRx,
              );
              rxIdToUse = null;
            }
          } catch (e) {
            console.error("Could not create prescription for medicines:", e);
            rxIdToUse = null; // NEVER fallback to targetEncId!
          }
        }
      }

      if (validMeds.length > 0) {
        // CRITICAL FIX: Only call saveMedications if we have a valid prescription ID
        if (rxIdToUse && String(rxIdToUse) !== String(activeEncounterId)) {
          try {
            await saveMedications(rxIdToUse, formData.medicines);
          } catch (medErr) {
            console.error("MEDICATION SAVE FAILED:", medErr);
          }
        } else {
          console.warn(
            "Skipping saveMedications: No valid prescription ID available (encounter has no linked prescription).",
          );
        }

        try {
          const encKey =
            activeEncounterId ||
            selectedConsultation?.encounterId ||
            selectedConsultation?.id ||
            activeAppointmentId;
          if (encKey) {
            localStorage.setItem(
              `hms-completed-meds:${encKey}`,
              JSON.stringify(validMeds),
            );
          }
        } catch (err) {
          console.log(err);
          // ignore
        }
      }
      if (activeEncounterId) {
        try {
          const consultationPayload = {
            chiefComplaint: formData.chiefComplaint || formData.symptoms,
            historyOfPresentIllness:
              formData.symptoms || formData.chiefComplaint,
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
          await encountersApi
            .initConsultationPut(activeEncounterId, consultationPayload)
            .catch(() => null);
        } catch (putErr) {
          console.warn("Non-blocking PUT consultation warning:", putErr);
        }
      }
      if (selectedConsultation?.id) {
        try {
          await consultationApi.saveClinicalNotes(selectedConsultation.id, {
            chiefComplaint: formData.chiefComplaint || formData.symptoms,
            historyOfPresentIllness:
              formData.symptoms || formData.chiefComplaint,
            generalExamination: formData.clinicalExamination,
            assessmentSummary: formData.assessment,
            advice: formData.advice,
          });
        } catch (notesErr) {
          console.warn("Non-blocking clinical notes warning:", notesErr);
        }
      }
      if (can("CONSULTATION_FINALIZE")) {
        const encId =
          activeEncounterId ||
          selectedConsultation?.encounterId ||
          selectedConsultation?.id ||
          "";
        const aptId = activeAppointmentId || selectedConsultation?.id || 0;

        if (encId && String(encId) !== "ENC-TEMP") {
          const hasMeds = validMeds.length > 0;
          // CRITICAL FIX: Only set outcome to PRESCRIPTION_CREATED if a real prescription ID exists!
          const outcome =
            hasMeds && rxIdToUse
              ? "PRESCRIPTION_CREATED"
              : "NO_PRESCRIPTION_REQUIRED";
          try {
            await consultationApi.setPrescriptionResolution(encId, { outcome });
          } catch (resErr) {
            console.warn("Prescription resolution pre-check warning:", resErr);
          }

          const checkRes = await encountersApi
            .getFinalizationCheck(encId)
            .catch(() => null);
          if (
            checkRes &&
            checkRes.ready === false &&
            Array.isArray(checkRes.checks)
          ) {
            const failedMsgs = checkRes.checks
              .filter((c) => !c.passed)
              .map((c) => c.code || "Finalization readiness check failed");
            if (failedMsgs.length > 0) {
              setValidationErrors(failedMsgs);
              setIsFinalizing(false);
              setShowToast(false);
              window.scrollTo({ top: 0, behavior: "smooth" });
              return;
            }
          }
        }

        if (rxIdToUse) {
          try {
            await encountersApi.finalizePrescription(rxIdToUse, {
              generalAdvice: formData.advice,
              dietAdvice: formData.lifestyleRecommendations || "",
              followUpNotes: formData.followupNotes || "",
              followUpDate: formData.nextVisitDate || "",
            });
          } catch (rxFinErr) {
            console.warn("Prescription finalize warning:", rxFinErr);
          }
        }

        await finalizeConsultation(encId, aptId, {
          generalAdvice: formData.advice,
          dietAdvice: formData.lifestyleRecommendations || "",
          precautions: formData.followupNotes || "",
        });

        const patientMrn =
          selectedAppointment?.mrn || selectedConsultation?.mrn || "";
        const doctorId =
          selectedAppointment?.doctorId ||
          (selectedConsultation as { doctorId?: string | number })?.doctorId;
        if (encId && aptId && patientMrn && doctorId) {
          try {
            const bill = await createBill({
              appointmentId: Number(aptId),
              encounterId: Number(encId),
              patientMrn,
              doctorId: Number(doctorId),
            });
            createdBillIdRef.current = String(bill.billId);
          } catch (billErr) {
            console.warn("Auto bill creation warning:", billErr);
          }
        }
      }

      setFinalizedData({
        encounterId:
          activeEncounterId ||
          selectedConsultation?.encounterId ||
          selectedConsultation?.id ||
          "N/A",
        appointmentId: activeAppointmentId || selectedConsultation?.id || 0,
        patientName,
        mrn: patientMrn,
        age: patientAge ?? 0,
        gender: patientGender,
        phone: patientPhone,
        doctor: formData.doctorName,
        department: formData.department,
        visitType: formData.visitType,
        date: formData.visitDate,
        vitals: {
          height: formData.height,
          weight: formData.weight,
          temp: formData.temperature,
          bp: formData.bp,
          pulse: formData.pulse,
          spo2: formData.spo2,
          respiratoryRate: formData.respiratoryRate,
          bloodSugar: formData.bloodSugar,
          bmi: calculatedBmi,
        },
        chiefComplaint: formData.chiefComplaint,
        clinicalExamination: formData.clinicalExamination,
        finalDiagnosis: formData.finalDiagnosis,
        icdCode: formData.icdCode,
        medicines: formData.medicines,
        advice: formData.advice,
        dietAdvice: formData.lifestyleRecommendations,
        followupNotes: formData.followupNotes,
        nextVisitDate: formData.nextVisitDate,
      });

      setShowToast(false);
      setShowCompleteModal(true);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to finalize consultation";
      console.error("Error finalizing consultation:", err);
      triggerToast(errorMessage);
      setShowToast(false);
      setIsFinalizing(false);
    }
  };

  if (showCompleteModal && finalizedData) {
    return (
      <ConsultationDetailsScreen
        encounterId={finalizedData.encounterId}
        initialRecord={{
          id: `ENC-${finalizedData.encounterId}`,
          visitDate: finalizedData.date,
          completionTime: new Date().toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          }),
          patientName: finalizedData.patientName,
          mrn: finalizedData.mrn,
          age: finalizedData.age,
          gender: finalizedData.gender,
          doctorName: finalizedData.doctor,
          department: finalizedData.department,
          visitType: finalizedData.visitType,
          chiefComplaint: finalizedData.chiefComplaint || "None recorded",
          vitals: {
            height: finalizedData.vitals?.height || "—",
            weight: finalizedData.vitals?.weight || "—",
            bmi: finalizedData.vitals?.bmi || "—",
            temperature: finalizedData.vitals?.temp || "—",
            bp: finalizedData.vitals?.bp || "—",
            pulse: finalizedData.vitals?.pulse || "—",
            respiratoryRate: finalizedData.vitals?.respiratoryRate || "—",
            spo2: finalizedData.vitals?.spo2 || "—",
            bloodSugar: finalizedData.vitals?.bloodSugar || "—",
          },
          clinicalExamination: finalizedData.clinicalExamination || "—",
          provisionalDiagnosis: formData.provisionalDiagnosis || "Recorded",
          finalDiagnosis: finalizedData.finalDiagnosis || "Recorded",
          icdCode: finalizedData.icdCode || "—",
          medicines: (finalizedData.medicines || []).map((m, idx) => ({
            id: String(m.id || idx + 1),
            name: m.name,
            dosage: m.dosage,
            frequency: m.frequency,
            duration: m.duration,
            instructions: m.instructions || "After food",
          })),
          investigations: formData.customInvestigation
            ? [formData.customInvestigation]
            : [],
          investigationRemarks: formData.investigationRemarks || "—",
          symptoms: formData.symptoms || "—",
          assessment: formData.assessment || "—",
          advice: finalizedData.advice || "Follow doctor advice",
          lifestyleRecommendations: finalizedData.dietAdvice || "—",
          followupRequired: formData.followupRequired ? "Yes" : "No",
          nextVisitDate: finalizedData.nextVisitDate || "—",
          followupNotes: finalizedData.followupNotes || "—",
          status: "Completed",
          tokenNo: selectedAppointment?.tokenNumber
            ? `TK-${selectedAppointment.tokenNumber}`
            : "TK-01",
        }}
        onBack={handleCloseCompleteModal}
        onViewHistory={onViewHistory}
        onViewPatientProfile={onViewPatientProfile}
      />
    );
  }

  return (
    <div className="flex-1 bg-[#F1F5F9] overflow-y-auto flex flex-col font-sans relative pb-24">
      {showToast && (
        <div
          className="fixed top-5 right-5 z-50 bg-[#66BB6A] text-white px-5 py-3.5 rounded-2xl shadow-xl flex items-center gap-3 transition-opacity fade-in slide-in-from-top-4"
          style={{ fontFamily: PP }}
        >
          <CheckCircle2 size={20} />
          <div>
            <div className="font-bold text-sm">
              Consultation completed successfully.
            </div>
            <div className="text-xs text-white/95">
              Encounter records saved & finalized.
            </div>
          </div>
        </div>
      )}
      {toastMsg && !showToast && (
        <div
          className="fixed top-5 right-5 z-50 bg-red-600 text-white px-5 py-3.5 rounded-2xl shadow-xl flex items-center gap-3 transition-opacity fade-in slide-in-from-top-4"
          style={{ fontFamily: PP }}
        >
          <AlertCircle size={20} />
          <div className="font-bold text-sm">{toastMsg}</div>
        </div>
      )}

      <ConsultationHeader
        roleLabel="Doctor"
        pageTitle="Start Outpatient Consultation"
        subtitle="Record symptoms, evaluate vitals, diagnosis, prescribe medicines and finalize session."
        breadcrumbs={[{ label: "Workspace", active: true }]}
        onBack={onBack ? onBack : () => navigate(-1)}
      />

      <div className="p-6 space-y-6 flex-1">
        {validationErrors.length > 0 && (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-4 flex gap-3 text-red-700">
            <AlertCircle size={20} className="shrink-0 mt-0.5" />
            <div>
              <div className="font-bold text-sm" style={{ fontFamily: PP }}>
                Please correct the following errors before finalization:
              </div>
              <ul
                className="list-disc pl-5 mt-1.5 text-xs space-y-1"
                style={{ fontFamily: RB }}
              >
                {validationErrors.map((err) => (
                  <li key={err}>{err}</li>
                ))}
              </ul>
            </div>
          </div>
        )}

        <PatientSummaryCard
          patientName={patientName}
          mrn={patientMrn}
          age={patientAge || 0}
          gender={patientGender}
          bloodGroup={patientBloodGroup}
          allergies={patientAllergies}
          phone={patientPhone}
          primaryDoctor={primaryDoctorName}
          opdRoom={opdRoomNumber}
          visitType={formData.visitType}
          appointmentTime={appointmentTimeStr}
        />

        <div className="grid grid-cols-1 gap-6">
          <div className="space-y-3">
            <button
              onClick={() => toggleSection("vitals")}
              className="w-full flex items-center justify-between p-4 bg-white rounded-2xl border border-[#E5E7EB] hover:bg-slate-50 transition-colors shadow-sm"
            >
              <div className="flex items-center gap-2.5">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-600" />
                <span
                  className="font-bold text-sm text-slate-800"
                  style={{ fontFamily: PP }}
                >
                  Vitals Recording
                </span>
              </div>
              <ChevronDown
                className={`text-slate-400 transition-transform ${collapsedSections.vitals ? "-rotate-90" : ""}`}
                size={18}
              />
            </button>
            {!collapsedSections.vitals && (
              <VitalsCard
                isEditable
                values={{
                  height: formData.height,
                  weight: formData.weight,
                  bp: formData.bp,
                  pulse: formData.pulse,
                  temp: formData.temperature,
                  spo2: formData.spo2,
                  respiratoryRate: formData.respiratoryRate,
                  bloodSugar: formData.bloodSugar,
                  bmi: calculatedBmi,
                }}
                onChange={handleVitalsChange}
              />
            )}
          </div>

          <div className="space-y-3">
            <button
              onClick={() => toggleSection("clinicalNotes")}
              className="w-full flex items-center justify-between p-4 bg-white rounded-2xl border border-[#E5E7EB] hover:bg-slate-50 transition-colors shadow-sm"
            >
              <div className="flex items-center gap-2.5">
                <span className="w-2.5 h-2.5 rounded-full bg-teal-600" />
                <span
                  className="font-bold text-sm text-slate-800"
                  style={{ fontFamily: PP }}
                >
                  Clinical Symptoms & SOAP
                </span>
              </div>
              <ChevronDown
                className={`text-slate-400 transition-transform ${collapsedSections.clinicalNotes ? "-rotate-90" : ""}`}
                size={18}
              />
            </button>
            {!collapsedSections.clinicalNotes && (
              <ConsultationForm
                values={{
                  chiefComplaint: formData.chiefComplaint,
                  durationOfSymptoms: formData.durationOfSymptoms,
                  clinicalExamination: formData.clinicalExamination,
                  symptoms: formData.symptoms,
                  assessment: formData.assessment,
                  advice: formData.advice,
                  lifestyleRecommendations: formData.lifestyleRecommendations,
                }}
                onChange={handleFieldChange}
              />
            )}
          </div>

          <div className="space-y-3">
            <button
              onClick={() => toggleSection("examination")}
              className="w-full flex items-center justify-between p-4 bg-white rounded-2xl border border-[#E5E7EB] hover:bg-slate-50 transition-colors shadow-sm"
            >
              <div className="flex items-center gap-2.5">
                <span className="w-2.5 h-2.5 rounded-full bg-indigo-600" />
                <span
                  className="font-bold text-sm text-slate-800"
                  style={{ fontFamily: PP }}
                >
                  Diagnoses & ICD Codes
                </span>
              </div>
              <ChevronDown
                className={`text-slate-400 transition-transform ${collapsedSections.examination ? "-rotate-90" : ""}`}
                size={18}
              />
            </button>
            {!collapsedSections.examination && (
              <DiagnosisForm
                provisionalDiagnosis={formData.provisionalDiagnosis}
                finalDiagnosis={formData.finalDiagnosis}
                icdCode={formData.icdCode}
                onChange={handleFieldChange}
              />
            )}
          </div>

          <div className="space-y-3">
            <button
              onClick={() => toggleSection("prescription")}
              className="w-full flex items-center justify-between p-4 bg-white rounded-2xl border border-[#E5E7EB] hover:bg-slate-50 transition-colors shadow-sm"
            >
              <div className="flex items-center gap-2.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-600" />
                <span
                  className="font-bold text-sm text-slate-800"
                  style={{ fontFamily: PP }}
                >
                  SOAP Prescriptions
                </span>
              </div>
              <ChevronDown
                className={`text-slate-400 transition-transform ${collapsedSections.prescription ? "-rotate-90" : ""}`}
                size={18}
              />
            </button>
            {!collapsedSections.prescription && (
              <MedicineTable
                medicines={formData.medicines}
                onAdd={handleAddMedicine}
                onUpdate={handleUpdateMedicine}
                onRemove={handleRemoveMedicine}
              />
            )}
          </div>

          <div className="space-y-3">
            <button
              onClick={() => toggleSection("investigation")}
              className="w-full flex items-center justify-between p-4 bg-white rounded-2xl border border-[#E5E7EB] hover:bg-slate-50 transition-colors shadow-sm"
            >
              <div className="flex items-center gap-2.5">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                <span
                  className="font-bold text-sm text-slate-800"
                  style={{ fontFamily: PP }}
                >
                  Investigations Recommendations
                </span>
              </div>
              <ChevronDown
                className={`text-slate-400 transition-transform ${collapsedSections.investigation ? "-rotate-90" : ""}`}
                size={18}
              />
            </button>
            {!collapsedSections.investigation && (
              <InvestigationTable
                values={formData.investigations}
                customInvestigation={formData.customInvestigation}
                remarks={formData.investigationRemarks}
                onChange={handleFieldChange}
              />
            )}
          </div>

          <div className="space-y-3">
            <button
              onClick={() => toggleSection("followup")}
              className="w-full flex items-center justify-between p-4 bg-white rounded-2xl border border-[#E5E7EB] hover:bg-slate-50 transition-colors shadow-sm"
            >
              <div className="flex items-center gap-2.5">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                <span
                  className="font-bold text-sm text-slate-800"
                  style={{ fontFamily: PP }}
                >
                  Follow-up Scheduling
                </span>
              </div>
              <ChevronDown
                className={`text-slate-400 transition-transform ${collapsedSections.followup ? "-rotate-90" : ""}`}
                size={18}
              />
            </button>
            {!collapsedSections.followup && (
              <FollowupForm
                required={formData.followupRequired}
                nextVisitDate={formData.nextVisitDate}
                notes={formData.followupNotes}
                followUpType={formData.followUpType}
                followUpIntervalValue={formData.followUpIntervalValue}
                followUpIntervalUnit={formData.followUpIntervalUnit}
                onChange={handleFieldChange}
                patientMrn={patientMrn}
                encounterId={activeEncounterId}
              />
            )}
          </div>
        </div>
      </div>

      <ConsultationFooter
        onCancel={onBack || (() => {})}
        onSaveDraft={handleSaveDraft}
        onFinalize={handleFinalize}
        isSavingDraft={isDraftSaved}
        isFinalizing={isFinalizing}
      />

      {/* View Prescription Modal */}
      <EncounterPrescriptionViewModal
        encounterId={viewPrescriptionEncounterId}
        isOpen={Boolean(viewPrescriptionEncounterId)}
        onClose={() => setViewPrescriptionEncounterId(null)}
      />
    </div>
  );
}
