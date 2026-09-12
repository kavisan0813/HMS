import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router";
import {
  Stethoscope,
  Clock,
  Pill,
  CheckCircle2,
  AlertCircle,
  Calendar,
  ChevronRight,
  ChevronDown,
  Printer,
  Download,
  Search,
  RotateCcw,
  ArrowLeft,
  ChevronUp,
  X,
  FileText,
} from "lucide-react";
import { consultationApi } from "../api/consultationApi";
import { patientsApi } from "../../patients/api/patient.api";
import { departmentsApi } from "../../users/api/departments.api";
import { apiClient } from "../../../lib/axios";

// --- Design System Tokens ---
const PP = "'Poppins', system-ui, sans-serif";
const RB = "'Roboto', system-ui, sans-serif";

function calculateAge(dobStr: string): number | string {
  try {
    const birth = new Date(dobStr);
    if (Number.isNaN(birth.getTime())) return "—";
    const ageDifMs = Date.now() - birth.getTime();
    const ageDate = new Date(ageDifMs);
    const calculated = Math.abs(ageDate.getUTCFullYear() - 1970);
    return Number.isNaN(calculated) ? "—" : calculated;
  } catch {
    return "—";
  }
}
function handlePrintHistory() {
  window.print();
}

function unwrapApiData<T>(res: unknown): T {
  if (
    res &&
    typeof res === "object" &&
    "data" in res &&
    (res as Record<string, unknown>).data !== undefined
  ) {
    return (res as Record<string, unknown>).data as T;
  }
  return res as T;
}
export interface TimelineConsultationItem {
  id: string;
  date: string;
  time: string;
  doctor: string;
  department: string;
  patientAge?: number | string;
  visitType: "First Visit" | "Follow-up" | "Walk-In";
  status: "Completed" | "In Progress" | "Cancelled" | "Follow-up Scheduled";
  chiefComplaint: string;
  diagnosis: string;
  icdCode: string;
  medicinesCount: number;
  investigationsCount: number;
  followupStatus: string;
  nextFollowupDate?: string;
  vitals: {
    bp: string;
    pulse: string;
    temp: string;
    spo2: string;
    bmi: string;
  };
  medicines: { name: string; dosage: string; freq: string; duration: string }[];
  investigations: string[];
  examinationFindings: string;
  clinicalNotes: string;
}

export function ConsultationHistoryScreen({
  patientId = "",
  role = "doctor",
  onBack,
  onViewFullConsultation,
  onPatientSelect,
}: {
  patientId?: string;
  role?: "doctor" | "admin" | "nurse";
  onBack?: () => void;
  onStartNewConsultation?: () => void;
  onViewFullConsultation?: (consultationId: string) => void;
  onPatientSelect?: (patientId: string) => void;
}) {
  const navigate = useNavigate();
  const isReadOnly = role === "admin" || role === "nurse";

  // Dynamic API state
  const [loading, setLoading] = useState<boolean>(true);
  const [patientData, setPatientData] = useState<{
    name: string;
    mrn: string;
    age: number | string;
    gender: string;
    bloodGroup: string;
    allergies: string[];
    primaryDoctor: string;
    department: string;
  }>({
    name: "Patient",
    mrn: patientId,
    age: "—",
    gender: "—",
    bloodGroup: "—",
    allergies: [],
    primaryDoctor: "—",
    department: "—",
  });

  const [consultations, setConsultations] = useState<
    TimelineConsultationItem[]
  >([]);

  // Search & Filter States
  const [searchQuery, setSearchQuery] = useState("");
  const [filterDoctor, setFilterDoctor] = useState("All");
  const [filterDepartment, setFilterDepartment] = useState("All");
  const [filterVisitType, setFilterVisitType] = useState("All");
  const [filterStatus, setFilterStatus] = useState("All");

  // Expanded Timeline Cards State
  const [expandedCardIds, setExpandedCardIds] = useState<
    Record<string, boolean>
  >({});

  // Fetch real patient and encounters data from API
  useEffect(() => {
    let cancelled = false;

    async function loadHistoryData() {
      if (!patientId) {
        if (!cancelled) setLoading(false);
        return;
      }

      try {
        if (!cancelled) setLoading(true);

        // 1. Fetch real Patient Profile
        try {
          const patRes = await patientsApi.getPatientByMrn(patientId);
          if (cancelled) return;
          const p = unwrapApiData<Record<string, unknown>>(patRes) || {};
          if (p && !cancelled) {
            const rawAge = p.age ?? p.patientAge ?? p.ageYears;
            const rawDob = p.dob || p.dateOfBirth || p.birthDate;
            const computedAge = (() => {
              if (rawAge != null && rawAge !== "" && rawAge !== "—") {
                const n = Number(rawAge);
                if (!Number.isNaN(n) && n >= 0) return n;
                if (typeof rawAge === "string" && rawAge.trim())
                  return rawAge.trim();
              }
              if (rawDob && typeof rawDob === "string" && rawDob.trim()) {
                const calc = calculateAge(rawDob);
                if (calc !== "—") return calc;
              }
              return "—";
            })();

            const primaryDocName = String(
              p.primaryDoctorName ||
                p.assignedDoctor ||
                p.doctorName ||
                p.primaryDoctor ||
                "—",
            );
            const primaryDeptName = String(
              p.department ||
                p.departmentName ||
                p.doctorSpecialty ||
                p.specialty ||
                "—",
            );

            if (!cancelled) {
              setPatientData({
                name: String(p.fullName || p.name || p.patientName || "—"),
                mrn: String(p.mrn || patientId),
                age: computedAge,
                gender: String(p.gender || "—"),
                bloodGroup:
                  p.bloodGroup && p.bloodGroup !== "N/A"
                    ? String(p.bloodGroup)
                    : "—",
                allergies: Array.isArray(p.allergies)
                  ? (p.allergies as string[])
                  : p.allergies
                    ? [String(p.allergies)]
                    : [],
                primaryDoctor: primaryDocName,
                department: primaryDeptName,
              });
            }
          }
        } catch (e) {
          console.warn("Patient profile fetch notice:", e);
        }

        // 2. Pre-fetch Doctor and Department Lookups for doctorId & departmentId
        const doctorMap: Record<string, { name: string; department: string }> =
          {};
        const departmentMap: Record<string, string> = {};

        try {
          const docRes = await apiClient
            .get("/api/v1/doctors")
            .catch(() => null);
          const docList =
            unwrapApiData<Record<string, unknown>[]>(docRes?.data) ||
            (Array.isArray(docRes?.data) ? docRes.data : []);
          if (Array.isArray(docList)) {
            docList.forEach((d) => {
              const dId = String(d.id || d.doctorId || d.userId || "");
              const dName = String(d.fullName || d.name || d.doctorName || "");
              const dDept = String(
                (typeof d.department === "string"
                  ? d.department
                  : (d.department as Record<string, unknown>)?.name ||
                    (d.department as Record<string, unknown>)
                      ?.departmentName) ||
                  d.departmentName ||
                  d.specialty ||
                  d.doctorSpecialty ||
                  "",
              );
              if (dId && dName) {
                doctorMap[dId] = { name: dName, department: dDept };
              }
            });
          }
        } catch {
          // ignore
        }

        try {
          const deptRes = await departmentsApi
            .getDepartments({ page: 0, size: 100 })
            .catch(() => null);
          const deptObj = deptRes as {
            content?: unknown[];
            items?: unknown[];
          } | null;
          const deptList = (deptObj?.content || deptObj?.items || []) as Array<
            Record<string, unknown>
          >;
          if (Array.isArray(deptList)) {
            deptList.forEach((dp) => {
              const dpId = String(dp.id || dp.departmentId || "");
              const dpName = String(
                dp.departmentName || dp.name || dp.label || "",
              );
              if (dpId && dpName) {
                departmentMap[dpId] = dpName;
              }
            });
          }
        } catch {
          // ignore
        }

        // 3. Fetch Encounters via GET /api/v1/patients/{mrn}/encounters
        const encountersList =
          await consultationApi.getPatientEncounters(patientId);

        if (!cancelled) {
          if (Array.isArray(encountersList) && encountersList.length > 0) {
            const mappedItems: TimelineConsultationItem[] = await Promise.all(
              encountersList.map(async (rawEnc: Record<string, unknown>) => {
                const encounterId = String(
                  rawEnc.encounterId ||
                    rawEnc.id ||
                    rawEnc.encounterNumber ||
                    "—",
                );
                const appointmentId = rawEnc.appointmentId || rawEnc.apptId;

                // 1. Fetch consultation details
                const consultationDetails =
                  encounterId !== "—"
                    ? await consultationApi
                        .getConsultation(encounterId)
                        .catch(() => null)
                    : null;

                // 2. Fetch workspace details
                const workspaceDetails =
                  encounterId !== "—"
                    ? await consultationApi
                        .getWorkspace(encounterId)
                        .catch(() => null)
                    : null;

                const ws = (workspaceDetails || {}) as Record<string, unknown>;
                const cons = (consultationDetails ||
                  ws.consultation ||
                  {}) as Record<string, unknown>;
                const vit = (ws.vitals || rawEnc.vitals || {}) as Record<
                  string,
                  unknown
                >;
                const diagList = Array.isArray(ws.diagnoses)
                  ? (ws.diagnoses as Record<string, unknown>[])
                  : [];
                const primaryDiag =
                  diagList.find(
                    (d) =>
                      (d.diagnosisType === "PRIMARY" || d.type === "PRIMARY") &&
                      d.active !== false,
                  ) ||
                  diagList.find((d) => d.active !== false) ||
                  diagList[0] ||
                  {};

                const rx = (ws.prescription ||
                  ws.prescriptions ||
                  {}) as Record<string, unknown>;
                const rxPrescriber = (rx.prescriber ||
                  rx.doctor ||
                  {}) as Record<string, unknown>;

                let rawMeds =
                  Array.isArray(rx.medications) && rx.medications.length > 0
                    ? rx.medications
                    : Array.isArray(rx.medicines) && rx.medicines.length > 0
                      ? rx.medicines
                      : Array.isArray(rx.items) && rx.items.length > 0
                        ? rx.items
                        : Array.isArray(rx.prescriptionItems) &&
                            rx.prescriptionItems.length > 0
                          ? rx.prescriptionItems
                          : Array.isArray(ws.medications) &&
                              ws.medications.length > 0
                            ? ws.medications
                            : Array.isArray(ws.medicines) &&
                                ws.medicines.length > 0
                              ? ws.medicines
                              : Array.isArray(rawEnc.medications) &&
                                  rawEnc.medications.length > 0
                                ? rawEnc.medications
                                : Array.isArray(rawEnc.medicines) &&
                                    rawEnc.medicines.length > 0
                                  ? rawEnc.medicines
                                  : [];

                if (rawMeds.length === 0) {
                  try {
                    const saved =
                      localStorage.getItem(
                        `hms-completed-meds:${encounterId}`,
                      ) ||
                      localStorage.getItem(
                        `hms-completed-meds:${appointmentId}`,
                      );
                    if (saved) {
                      const parsed = JSON.parse(saved);
                      if (Array.isArray(parsed) && parsed.length > 0) {
                        rawMeds = parsed;
                      }
                    }
                  } catch {
                    // ignore
                  }
                }

                const medsList = (rawMeds as Record<string, unknown>[]).map(
                  (m) => {
                    const doseVal = (() => {
                      const d = m.dose as Record<string, unknown> | undefined;
                      if (d && typeof d === "object") {
                        const val = d.value != null ? String(d.value) : "";
                        const unit = d.unit != null ? String(d.unit) : "";
                        const text = `${val} ${unit}`.trim();
                        if (text) return text;
                      }
                      if (m.doseValue != null || m.doseUnit != null) {
                        const val =
                          m.doseValue != null ? String(m.doseValue) : "";
                        const unit =
                          m.doseUnit != null ? String(m.doseUnit) : "";
                        const text = `${val} ${unit}`.trim();
                        if (text) return text;
                      }
                      if (typeof m.dosage === "string" && m.dosage.trim())
                        return m.dosage.trim();
                      if (typeof m.dose === "string" && m.dose.trim())
                        return m.dose.trim();
                      if (typeof m.strength === "string" && m.strength.trim())
                        return m.strength.trim();
                      if (
                        typeof m.doseQuantity === "string" &&
                        m.doseQuantity.trim()
                      )
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
                          "—"
                        : m.frequencyDisplay ||
                          m.frequencyCode ||
                          m.frequency ||
                          m.freq ||
                          "—";

                    const durObj = m.duration as
                      | { value?: unknown; unit?: unknown }
                      | undefined;
                    const durVal =
                      m.duration && typeof m.duration === "object"
                        ? `${durObj?.value ?? ""} ${durObj?.unit ?? ""}`.trim()
                        : m.durationValue
                          ? `${m.durationValue} ${m.durationUnit || ""}`.trim()
                          : m.duration || "—";

                    return {
                      name: String(
                        m.medicineName ||
                          m.medicationName ||
                          m.drugName ||
                          m.name ||
                          "Medication",
                      ),
                      dosage: String(doseVal || "—"),
                      freq: String(freqVal || "—"),
                      duration: String(durVal || "—"),
                    };
                  },
                );

                // Map Investigations from workspace / consultation / orders
                const rawInv =
                  ws.investigations ||
                  ws.orders ||
                  ws.labOrders ||
                  ws.radiologyOrders ||
                  cons.investigations ||
                  rawEnc.investigations ||
                  [];
                const invList = Array.isArray(rawInv)
                  ? rawInv
                      .map((item: unknown) => {
                        if (typeof item === "string") return item;
                        const obj = item as Record<string, unknown>;
                        return String(
                          obj.testName ||
                            obj.investigationName ||
                            obj.name ||
                            obj.displayName ||
                            obj.testCode ||
                            "",
                        );
                      })
                      .filter(Boolean)
                  : [];

                const startDateStr = String(
                  rawEnc.startedAt ||
                    rawEnc.createdAt ||
                    rawEnc.encounterDate ||
                    rawEnc.date ||
                    "",
                );
                const displayDate = startDateStr
                  ? new Date(startDateStr).toLocaleDateString("en-GB", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                    })
                  : "—";
                const displayTime = startDateStr
                  ? new Date(startDateStr).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })
                  : "—";

                const bpStr = vit.bloodPressure
                  ? typeof vit.bloodPressure === "object"
                    ? `${(vit.bloodPressure as Record<string, unknown>).systolic}/${(vit.bloodPressure as Record<string, unknown>).diastolic}`
                    : String(vit.bloodPressure)
                  : vit.bpSystolic != null && vit.bpDiastolic != null
                    ? `${vit.bpSystolic}/${vit.bpDiastolic}`
                    : vit.bp
                      ? String(vit.bp)
                      : "—";

                const vtRaw = String(
                  rawEnc.encounterType ||
                    rawEnc.visitType ||
                    rawEnc.appointmentType ||
                    cons.visitType ||
                    "",
                ).toUpperCase();
                const mappedVisitType: "First Visit" | "Follow-up" | "Walk-In" =
                  vtRaw.includes("FOLLOW")
                    ? "Follow-up"
                    : vtRaw.includes("WALK")
                      ? "Walk-In"
                      : "First Visit";

                const sRaw = String(
                  rawEnc.status || cons.status || ws.status || "",
                ).toUpperCase();
                const mappedStatus:
                  | "Completed"
                  | "In Progress"
                  | "Cancelled"
                  | "Follow-up Scheduled" =
                  sRaw === "COMPLETED" ||
                  sRaw === "FINALIZED" ||
                  sRaw === "CLOSED"
                    ? "Completed"
                    : sRaw === "CANCELLED" || sRaw === "CANCELED"
                      ? "Cancelled"
                      : sRaw.includes("SCHEDULED") || sRaw.includes("FOLLOW")
                        ? "Follow-up Scheduled"
                        : "In Progress";

                const examFindings =
                  [cons.generalExamination, cons.physicalExamination]
                    .filter(Boolean)
                    .join("\n") || String(cons.examinationNotes || "—");

                const notesArr = [
                  cons.historyOfPresentIllness
                    ? `HPI: ${cons.historyOfPresentIllness}`
                    : "",
                  cons.assessmentSummary
                    ? `Assessment: ${cons.assessmentSummary}`
                    : "",
                  cons.advice ? `Advice: ${cons.advice}` : "",
                  cons.lifestyleRecommendations
                    ? `Lifestyle: ${cons.lifestyleRecommendations}`
                    : "",
                ].filter(Boolean);
                const clinicalNotesText =
                  notesArr.join(" • ") ||
                  String(cons.clinicalNotes || cons.subjective || "—");

                const fuDate =
                  cons.followUpDate || cons.nextVisitDate || rx.followUpDate;

                const encSub = (ws.encounter || rawEnc) as Record<
                  string,
                  unknown
                >;
                const apptSub = (ws.appointment ||
                  rawEnc.appointment ||
                  {}) as Record<string, unknown>;
                const docSub = (ws.doctor ||
                  rawEnc.doctor ||
                  encSub.doctor ||
                  apptSub.doctor ||
                  {}) as Record<string, unknown>;

                const targetDocId = String(
                  rawEnc.doctorId ||
                    rawEnc.finalizedByUserId ||
                    encSub.doctorId ||
                    apptSub.doctorId ||
                    "",
                );
                const targetDeptId = String(
                  rawEnc.departmentId ||
                    encSub.departmentId ||
                    apptSub.departmentId ||
                    "",
                );

                const docFromMap = doctorMap[targetDocId];
                const deptFromMap = departmentMap[targetDeptId];

                const doctorNameVal = String(
                  (typeof encSub.doctorName === "string" &&
                    encSub.doctorName) ||
                    (typeof encSub.doctor === "string" && encSub.doctor) ||
                    (typeof apptSub.doctorName === "string" &&
                      apptSub.doctorName) ||
                    (typeof apptSub.doctor === "string" && apptSub.doctor) ||
                    (typeof ws.doctorName === "string" && ws.doctorName) ||
                    (typeof ws.doctor === "string" && ws.doctor) ||
                    (typeof cons.doctorName === "string" && cons.doctorName) ||
                    (typeof cons.doctor === "string" && cons.doctor) ||
                    docFromMap?.name ||
                    rxPrescriber.fullName ||
                    rxPrescriber.name ||
                    docSub.fullName ||
                    docSub.name ||
                    docSub.doctorName ||
                    patientData.primaryDoctor ||
                    "—",
                );

                const departmentVal = String(
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
                    (typeof ws.department === "string"
                      ? ws.department
                      : (ws.department as Record<string, unknown>)?.name ||
                        (ws.department as Record<string, unknown>)
                          ?.departmentName ||
                        "") ||
                    (typeof cons.department === "string"
                      ? cons.department
                      : "") ||
                    (typeof cons.doctorSpecialty === "string"
                      ? cons.doctorSpecialty
                      : "") ||
                    deptFromMap ||
                    docFromMap?.department ||
                    rxPrescriber.department ||
                    docSub.department ||
                    docSub.departmentName ||
                    docSub.specialty ||
                    docSub.doctorSpecialty ||
                    patientData.department ||
                    "—",
                );

                const patAge = (() => {
                  const pObj = (ws.patient || rawEnc.patient || {}) as Record<
                    string,
                    unknown
                  >;
                  const a =
                    pObj.age ??
                    pObj.patientAge ??
                    ws.patientAge ??
                    apptSub.patientAge ??
                    apptSub.age;
                  if (a != null && a !== "" && a !== "—") {
                    const n = Number(a);
                    if (!Number.isNaN(n) && n >= 0) return n;
                    if (typeof a === "string" && a.trim()) return a.trim();
                  }
                  const dob = pObj.dob || pObj.dateOfBirth;
                  if (dob && typeof dob === "string") {
                    const calc = calculateAge(dob);
                    if (calc !== "—") return calc;
                  }
                  return "—";
                })();

                return {
                  id: encounterId,
                  date: displayDate,
                  time: displayTime,
                  doctor: doctorNameVal,
                  department: departmentVal,
                  patientAge: patAge,
                  visitType: mappedVisitType,
                  status: mappedStatus,
                  chiefComplaint: String(
                    cons.chiefComplaint ||
                      rawEnc.chiefComplaint ||
                      ws.chiefComplaint ||
                      "—",
                  ),
                  diagnosis: String(
                    primaryDiag.diagnosisName ||
                      cons.assessmentSummary ||
                      rawEnc.diagnosis ||
                      "—",
                  ),
                  icdCode: String(
                    primaryDiag.diagnosisCode || rawEnc.icdCode || "—",
                  ),
                  medicinesCount: medsList.length,
                  investigationsCount: invList.length,
                  followupStatus: fuDate
                    ? `Scheduled for ${fuDate}`
                    : mappedStatus === "Completed"
                      ? "Completed"
                      : "No Follow-up Scheduled",
                  nextFollowupDate: fuDate ? String(fuDate) : undefined,
                  vitals: {
                    bp: bpStr,
                    pulse: vit.pulseRate
                      ? `${(vit.pulseRate as Record<string, unknown>).value || vit.pulseRate} bpm`
                      : vit.pulse
                        ? `${vit.pulse} bpm`
                        : "—",
                    temp: vit.temperature
                      ? `${(vit.temperature as Record<string, unknown>).value || vit.temperature}°C`
                      : "—",
                    spo2: vit.oxygenSaturation
                      ? `${(vit.oxygenSaturation as Record<string, unknown>).value || vit.oxygenSaturation}%`
                      : vit.spo2
                        ? `${vit.spo2}%`
                        : "—",
                    bmi: vit.bmi ? `${vit.bmi} kg/m²` : "—",
                  },
                  medicines: medsList,
                  investigations: invList,
                  examinationFindings: examFindings,
                  clinicalNotes: clinicalNotesText,
                };
              }),
            );

            setConsultations(mappedItems);
            if (mappedItems.length > 0) {
              setExpandedCardIds({ [mappedItems[0].id]: true });
              setPatientData((prev) => {
                const firstItem = mappedItems[0];
                const resolvedAge =
                  prev.age && prev.age !== "—"
                    ? prev.age
                    : firstItem.patientAge && firstItem.patientAge !== "—"
                      ? firstItem.patientAge
                      : "—";
                return {
                  ...prev,
                  age: resolvedAge,
                  primaryDoctor:
                    prev.primaryDoctor !== "—"
                      ? prev.primaryDoctor
                      : firstItem.doctor,
                  department:
                    prev.department !== "—"
                      ? prev.department
                      : firstItem.department,
                };
              });
            }
          } else {
            setConsultations([]);
          }
        }
      } catch (err) {
        console.error("Error fetching consultation history:", err);
      } finally {
        setLoading(false);
      }
    }

    loadHistoryData();

    return () => {
      cancelled = true;
    };
  }, [patientData.department, patientData.primaryDoctor, patientId]);

  const toggleExpand = (id: string) => {
    setExpandedCardIds((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  // Doctor & Department dropdown options derived from live consultations
  const doctorOptions = useMemo(() => {
    const set = new Set(consultations.map((c) => c.doctor));
    return Array.from(set);
  }, [consultations]);

  const departmentOptions = useMemo(() => {
    const set = new Set(consultations.map((c) => c.department));
    return Array.from(set);
  }, [consultations]);

  // Filtered Timeline
  const filteredTimeline = useMemo(() => {
    return consultations.filter((item) => {
      if (filterDoctor !== "All" && item.doctor !== filterDoctor) return false;
      if (filterDepartment !== "All" && item.department !== filterDepartment)
        return false;
      if (filterVisitType !== "All" && item.visitType !== filterVisitType)
        return false;
      if (filterStatus !== "All" && item.status !== filterStatus) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchId = item.id.toLowerCase().includes(q);
        const matchDx = item.diagnosis.toLowerCase().includes(q);
        const matchDate = item.date.toLowerCase().includes(q);
        const matchMeds = item.medicines.some((m) =>
          m.name.toLowerCase().includes(q),
        );
        const matchDoc = item.doctor.toLowerCase().includes(q);
        if (!matchId && !matchDx && !matchDate && !matchMeds && !matchDoc)
          return false;
      }
      return true;
    });
  }, [
    searchQuery,
    filterDoctor,
    filterDepartment,
    filterVisitType,
    filterStatus,
    consultations,
  ]);

  // Reset Filters
  const handleResetFilters = () => {
    setSearchQuery("");
    setFilterDoctor("All");
    setFilterDepartment("All");
    setFilterVisitType("All");
    setFilterStatus("All");
  };

  // Breadcrumb label based on role
  const breadcrumbRoleLabel =
    role === "admin" ? "Hospital Admin" : role === "nurse" ? "Nurse" : "Doctor";

  return (
    <div className="flex-1 bg-[#F1F5F9] overflow-y-auto flex flex-col font-sans relative pb-24">
      {/* ── BREADCRUMB & HEADER SECTION ── */}
      <div className="bg-white border-b border-[#E5E7EB] px-6 py-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div
              className="flex items-center gap-2 text-xs text-[#64748B] mb-1"
              style={{ fontFamily: RB }}
            >
              <span>{breadcrumbRoleLabel}</span>
              <ChevronRight size={12} className="text-slate-400" />
              <span>OPD Consultation</span>
              <ChevronRight size={12} className="text-slate-400" />
              <span className="font-semibold text-[#0D47A1]">
                Consultation History
              </span>
            </div>
            <div className="flex items-center gap-3">
              <h1
                className="text-2xl font-bold text-[#111827]"
                style={{ fontFamily: PP }}
              >
                Consultation History
              </h1>
              {isReadOnly && (
                <span
                  className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-50 text-[#0D47A1] border border-blue-200"
                  style={{ fontFamily: PP }}
                >
                  {role === "admin"
                    ? "Hospital Admin (Read Only)"
                    : "Nurse (Read Only)"}
                </span>
              )}
            </div>
            <p
              className="text-sm text-[#64748B] mt-0.5"
              style={{ fontFamily: RB }}
            >
              {isReadOnly
                ? "Review patient's previous consultation records."
                : "Review previous consultations, diagnoses and treatments."}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onBack ? onBack : () => navigate(-1)}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-[#E5E7EB] bg-white text-[#111827] hover:bg-slate-50 text-xs font-semibold transition-colors shadow-sm cursor-pointer"
              style={{ fontFamily: PP }}
            >
              <ArrowLeft size={14} />
              Back
            </button>

            {isReadOnly && (
              <>
                <button
                  onClick={handlePrintHistory}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-[#E5E7EB] bg-white text-[#0D47A1] hover:bg-blue-50 text-xs font-semibold transition-colors shadow-sm"
                  style={{ fontFamily: PP }}
                >
                  <Printer size={15} />
                  Print Medical History
                </button>
                <button
                  onClick={handlePrintHistory}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#0D47A1] hover:bg-[#0a3880] text-white text-xs font-semibold transition-colors shadow-sm"
                  style={{ fontFamily: PP }}
                >
                  <Download size={15} />
                  Download PDF
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* ── STICKY PATIENT SUMMARY BAR ── */}
      <div className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-[#E5E7EB] px-6 py-3 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          <div className="flex items-center gap-3 overflow-x-auto">
            <div
              className="w-10 h-10 rounded-full bg-[#0D47A1] text-white flex items-center justify-center font-bold text-sm shrink-0"
              style={{ fontFamily: PP }}
            >
              {patientData.name.slice(0, 2).toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span
                  className="font-bold text-sm text-[#111827]"
                  style={{ fontFamily: PP }}
                >
                  {patientData.name}
                </span>
                <span className="font-mono text-[10px] bg-blue-50 text-[#0D47A1] px-2 py-0.5 rounded font-bold">
                  {patientData.mrn}
                </span>
                <span
                  className="text-[11px] font-bold text-[#009688] bg-teal-50 px-2 py-0.5 rounded-full"
                  style={{ fontFamily: PP }}
                >
                  {consultations.length} Total Visits
                </span>
              </div>
              <div
                className="flex items-center gap-3 text-xs text-[#64748B] mt-0.5"
                style={{ fontFamily: RB }}
              >
                <span>
                  {patientData.age} yrs / {patientData.gender}
                </span>
                <span>•</span>
                <span>
                  Blood:{" "}
                  <strong className="text-[#111827]">
                    {patientData.bloodGroup}
                  </strong>
                </span>
                <span>•</span>
                <span>
                  Last Visit:{" "}
                  <strong className="text-[#111827]">
                    {consultations[0]?.date || "Today"}
                  </strong>
                </span>
                <span>•</span>
                <span>
                  Primary Doctor:{" "}
                  <strong className="text-[#0D47A1]">
                    {patientData.primaryDoctor}
                  </strong>
                </span>
                <span>•</span>
                <span>
                  Department:{" "}
                  <strong className="text-slate-800">
                    {patientData.department && patientData.department !== "—"
                      ? patientData.department
                      : consultations[0]?.department || "—"}
                  </strong>
                </span>
              </div>
            </div>

            {patientData.allergies.length > 0 && (
              <div
                className="flex items-center gap-1.5 px-2.5 py-1 bg-red-50 text-red-600 border border-red-100 rounded-full text-[11px] font-semibold shrink-0"
                style={{ fontFamily: PP }}
              >
                <AlertCircle size={13} />
                <span>Allergies: {patientData.allergies.join(", ")}</span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => onPatientSelect?.(patientData.mrn)}
              className="px-3 py-1.5 rounded-lg border border-[#E5E7EB] bg-white text-xs font-semibold text-[#111827] hover:bg-slate-50 transition-colors"
              style={{ fontFamily: PP }}
            >
              View Patient Profile
            </button>
          </div>
        </div>
      </div>

      {/* ── MAIN WORKSPACE CONTENT CONTAINER ── */}
      <div className="p-6 space-y-6">
        {loading ? (
          <div className="bg-white rounded-2xl p-12 border border-[#E5E7EB] text-center flex flex-col items-center justify-center">
            <div className="w-8 h-8 border-3 border-[#0D47A1] border-t-transparent rounded-full animate-spin mb-3"></div>
            <p className="text-xs font-semibold text-slate-600">
              Loading patient consultation history...
            </p>
          </div>
        ) : (
          <>
            {/* SUMMARY KPI CARDS (5 CARDS) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
              <div className="bg-white rounded-2xl p-4 border border-[#E5E7EB] shadow-sm flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <span
                    className="text-xs font-semibold text-[#64748B]"
                    style={{ fontFamily: PP }}
                  >
                    Total Consultations
                  </span>
                  <div className="w-8 h-8 rounded-xl bg-blue-50 text-[#0D47A1] flex items-center justify-center">
                    <RotateCcw size={16} />
                  </div>
                </div>
                <div className="mt-2">
                  <div
                    className="text-2xl font-bold text-[#111827]"
                    style={{ fontFamily: PP }}
                  >
                    {consultations.length}
                  </div>
                  <div
                    className="text-[11px] text-slate-500 mt-0.5"
                    style={{ fontFamily: RB }}
                  >
                    Recorded in system
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-2xl p-4 border border-[#E5E7EB] shadow-sm flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <span
                    className="text-xs font-semibold text-[#64748B]"
                    style={{ fontFamily: PP }}
                  >
                    Completed Consultations
                  </span>
                  <div className="w-8 h-8 rounded-xl bg-green-50 text-[#66BB6A] flex items-center justify-center">
                    <CheckCircle2 size={16} />
                  </div>
                </div>
                <div className="mt-2">
                  <div
                    className="text-2xl font-bold text-[#111827]"
                    style={{ fontFamily: PP }}
                  >
                    {
                      consultations.filter((c) => c.status === "Completed")
                        .length
                    }
                  </div>
                  <div
                    className="text-[11px] text-emerald-600 font-medium mt-0.5"
                    style={{ fontFamily: RB }}
                  >
                    {
                      consultations.filter((c) => c.status === "Completed")
                        .length
                    }{" "}
                    Verified Records
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-2xl p-4 border border-[#E5E7EB] shadow-sm flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <span
                    className="text-xs font-semibold text-[#64748B]"
                    style={{ fontFamily: PP }}
                  >
                    Follow-up Visits
                  </span>
                  <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
                    <Calendar size={16} />
                  </div>
                </div>
                <div className="mt-2">
                  <div
                    className="text-2xl font-bold text-[#111827]"
                    style={{ fontFamily: PP }}
                  >
                    {
                      consultations.filter((c) => c.visitType === "Follow-up")
                        .length
                    }
                  </div>
                  <div
                    className="text-[11px] text-purple-600 font-medium mt-0.5"
                    style={{ fontFamily: RB }}
                  >
                    Follow-up Records
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-2xl p-4 border border-[#E5E7EB] shadow-sm flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <span
                    className="text-xs font-semibold text-[#64748B]"
                    style={{ fontFamily: PP }}
                  >
                    Last Consultation
                  </span>
                  <div className="w-8 h-8 rounded-xl bg-teal-50 text-[#009688] flex items-center justify-center">
                    <Clock size={16} />
                  </div>
                </div>
                <div className="mt-2">
                  <div
                    className="text-sm font-bold text-[#111827]"
                    style={{ fontFamily: PP }}
                  >
                    {consultations[0]?.date || "—"}
                  </div>
                  <div
                    className="text-[11px] text-slate-500 mt-0.5 truncate"
                    style={{ fontFamily: RB }}
                  >
                    {consultations[0]?.doctor || "—"}
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-2xl p-4 border border-[#E5E7EB] shadow-sm flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <span
                    className="text-xs font-semibold text-[#64748B]"
                    style={{ fontFamily: PP }}
                  >
                    Total Prescriptions
                  </span>
                  <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                    <Pill size={16} />
                  </div>
                </div>
                <div className="mt-2">
                  <div
                    className="text-2xl font-bold text-[#111827]"
                    style={{ fontFamily: PP }}
                  >
                    {consultations.filter((c) => c.medicinesCount > 0).length}
                  </div>
                  <div
                    className="text-[11px] text-slate-500 mt-0.5"
                    style={{ fontFamily: RB }}
                  >
                    Prescriptions Issued (
                    {consultations.reduce(
                      (acc, curr) => acc + curr.medicinesCount,
                      0,
                    )}{" "}
                    Meds Total)
                  </div>
                </div>
              </div>
            </div>

            {/* SEARCH AND FILTER BAR */}
            <div className="bg-white rounded-2xl p-5 border border-[#E5E7EB] shadow-sm space-y-4">
              <div>
                <label
                  htmlFor="consultation-history-search"
                  className="block text-[11px] font-semibold text-[#64748B] mb-1"
                  style={{ fontFamily: PP }}
                >
                  Search Consultations
                </label>
                <div className="relative">
                  <Search
                    size={18}
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                  />
                  <input
                    id="consultation-history-search"
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search by Consultation ID, Diagnosis, Doctor or Date..."
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-[#E5E7EB] rounded-xl text-sm text-[#111827] focus:outline-none focus:ring-2 focus:ring-[#0D47A1]/20 focus:border-[#0D47A1]"
                    style={{ fontFamily: RB }}
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      aria-label="Clear search"
                      onClick={() => setSearchQuery("")}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      <X size={16} />
                    </button>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 pt-2 border-t border-gray-100">
                <div>
                  <label
                    htmlFor="filter-doctor"
                    className="block text-[11px] font-semibold text-[#64748B] mb-1"
                    style={{ fontFamily: PP }}
                  >
                    Doctor
                  </label>
                  <select
                    id="filter-doctor"
                    value={filterDoctor}
                    onChange={(e) => setFilterDoctor(e.target.value)}
                    className="w-full px-3 py-1.5 bg-slate-50 border border-[#E5E7EB] rounded-lg text-xs text-[#111827]"
                    style={{ fontFamily: RB }}
                  >
                    <option value="All">All Doctors</option>
                    {doctorOptions.map((doc) => (
                      <option key={doc} value={doc}>
                        {doc}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="filter-department"
                    className="block text-[11px] font-semibold text-[#64748B] mb-1"
                    style={{ fontFamily: PP }}
                  >
                    Department
                  </label>
                  <select
                    id="filter-department"
                    value={filterDepartment}
                    onChange={(e) => setFilterDepartment(e.target.value)}
                    className="w-full px-3 py-1.5 bg-slate-50 border border-[#E5E7EB] rounded-lg text-xs text-[#111827]"
                    style={{ fontFamily: RB }}
                  >
                    <option value="All">All Departments</option>
                    {departmentOptions.map((dept) => (
                      <option key={dept} value={dept}>
                        {dept}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="filter-visit-type"
                    className="block text-[11px] font-semibold text-[#64748B] mb-1"
                    style={{ fontFamily: PP }}
                  >
                    Visit Type
                  </label>
                  <select
                    id="filter-visit-type"
                    value={filterVisitType}
                    onChange={(e) => setFilterVisitType(e.target.value)}
                    className="w-full px-3 py-1.5 bg-slate-50 border border-[#E5E7EB] rounded-lg text-xs text-[#111827]"
                    style={{ fontFamily: RB }}
                  >
                    <option value="All">All Visit Types</option>
                    <option value="First Visit">First Visit</option>
                    <option value="Follow-up">Follow-up</option>
                    <option value="Walk-In">Walk-In</option>
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="filter-status"
                    className="block text-[11px] font-semibold text-[#64748B] mb-1"
                    style={{ fontFamily: PP }}
                  >
                    Status
                  </label>
                  <select
                    id="filter-status"
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="w-full px-3 py-1.5 bg-slate-50 border border-[#E5E7EB] rounded-lg text-xs text-[#111827]"
                    style={{ fontFamily: RB }}
                  >
                    <option value="All">All Statuses</option>
                    <option value="Completed">Completed</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Cancelled">Cancelled</option>
                    <option value="Follow-up Scheduled">
                      Follow-up Scheduled
                    </option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2">
                <div
                  className="text-xs text-[#64748B]"
                  style={{ fontFamily: RB }}
                >
                  Showing{" "}
                  <span className="font-semibold text-[#111827]">
                    {filteredTimeline.length}
                  </span>{" "}
                  historical consultations
                </div>
                <button
                  onClick={handleResetFilters}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#E5E7EB] text-xs font-semibold text-[#64748B] hover:text-[#111827] hover:bg-slate-50 transition-colors"
                  style={{ fontFamily: PP }}
                >
                  <RotateCcw size={13} />
                  Reset Filters
                </button>
              </div>
            </div>

            {/* EXPANDABLE CLINICAL TIMELINE */}
            <div className="w-full space-y-6">
              {filteredTimeline.length === 0 ? (
                <div className="bg-white rounded-2xl p-12 border border-[#E5E7EB] text-center flex flex-col items-center justify-center">
                  <div className="w-14 h-14 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mb-3">
                    <Stethoscope size={28} />
                  </div>
                  <h3
                    className="text-base font-bold text-[#111827]"
                    style={{ fontFamily: PP }}
                  >
                    No consultation history available.
                  </h3>
                  <p
                    className="text-xs text-slate-500 max-w-sm mt-1 mb-4"
                    style={{ fontFamily: RB }}
                  >
                    No previous consultation records match your selected
                    filters.
                  </p>
                  <button
                    onClick={handleResetFilters}
                    className="px-4 py-2 bg-[#0D47A1] text-white text-xs font-semibold rounded-xl hover:bg-[#0a3880]"
                    style={{ fontFamily: PP }}
                  >
                    Reset Filters
                  </button>
                </div>
              ) : (
                <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-3 before:bottom-3 before:w-0.5 before:bg-slate-200">
                  {filteredTimeline.map((item) => {
                    const isExpanded = expandedCardIds[item.id];
                    return (
                      <div key={item.id} className="relative">
                        {/* Timeline Node Icon */}
                        <div className="absolute -left-7.75 top-4 w-5 h-5 rounded-full bg-[#0D47A1] text-white flex items-center justify-center font-bold text-[10px] ring-4 ring-[#F1F5F9] shadow-sm">
                          <CheckCircle2 size={12} />
                        </div>

                        {/* Expandable Timeline Card */}
                        <div className="bg-white rounded-2xl border border-[#E5E7EB] shadow-sm overflow-hidden">
                          {/* Card Header Bar */}
                          <div
                            role="button"
                            tabIndex={0}
                            onClick={() => toggleExpand(item.id)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter" || e.key === " ") {
                                e.preventDefault();
                                toggleExpand(item.id);
                              }
                            }}
                            className="p-5 bg-slate-50/60 cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50 border-b border-gray-100"
                          >
                            <div className="space-y-1">
                              <div className="flex flex-wrap items-center gap-2">
                                <span
                                  className="font-bold text-sm text-[#111827]"
                                  style={{ fontFamily: PP }}
                                >
                                  {item.date}
                                </span>
                                <span className="text-xs text-slate-400 font-mono">
                                  ({item.time})
                                </span>
                                <span className="font-mono text-xs bg-blue-50 text-[#0D47A1] px-2 py-0.5 rounded font-bold">
                                  {item.id}
                                </span>
                                <span
                                  className="px-2 py-0.5 bg-green-50 text-[#66BB6A] border border-green-200 rounded-full text-[10px] font-bold"
                                  style={{ fontFamily: PP }}
                                >
                                  {item.status}
                                </span>
                              </div>
                              <div
                                className="flex flex-wrap items-center gap-3 text-xs text-[#64748B]"
                                style={{ fontFamily: RB }}
                              >
                                <span>
                                  Doctor:{" "}
                                  <strong className="text-[#111827]">
                                    {item.doctor}
                                  </strong>
                                </span>
                                <span>•</span>
                                <span>
                                  Dept:{" "}
                                  <strong className="text-slate-700">
                                    {item.department}
                                  </strong>
                                </span>
                                <span>•</span>
                                <span>
                                  Type:{" "}
                                  <strong className="text-slate-700">
                                    {item.visitType}
                                  </strong>
                                </span>
                              </div>
                            </div>

                            <div className="flex items-center gap-3 shrink-0">
                              <div
                                className="text-right text-xs hidden md:block"
                                style={{ fontFamily: RB }}
                              >
                                <div className="font-bold text-[#0D47A1]">
                                  {item.diagnosis}
                                </div>
                                <div className="text-[11px] text-slate-500">
                                  {item.medicinesCount} Meds ·{" "}
                                  {item.investigationsCount} Tests
                                </div>
                              </div>

                              <div className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 bg-white border border-gray-200">
                                {isExpanded ? (
                                  <ChevronUp size={18} />
                                ) : (
                                  <ChevronDown size={18} />
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Summary Line when collapsed */}
                          {!isExpanded && (
                            <div
                              className="p-4 text-xs space-y-1 bg-white"
                              style={{ fontFamily: RB }}
                            >
                              <div>
                                <strong className="text-[#64748B]">
                                  Chief Complaint:
                                </strong>{" "}
                                <span className="text-slate-800">
                                  "{item.chiefComplaint}"
                                </span>
                              </div>
                              <div>
                                <strong className="text-[#64748B]">
                                  Diagnosis:
                                </strong>{" "}
                                <span className="font-bold text-[#0D47A1]">
                                  {item.diagnosis}
                                </span>{" "}
                                ({item.icdCode})
                              </div>
                            </div>
                          )}

                          {/* EXPANDED SECTION CARDS */}
                          {isExpanded && (
                            <div
                              className="p-5 space-y-5 bg-white border-t border-gray-100 text-xs"
                              style={{ fontFamily: RB }}
                            >
                              {/* Section: Complaint & Vitals */}
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="p-3 bg-slate-50 rounded-xl space-y-1">
                                  <span
                                    className="text-[10px] font-bold text-slate-400 uppercase"
                                    style={{ fontFamily: PP }}
                                  >
                                    Chief Complaint
                                  </span>
                                  <p className="font-semibold text-slate-800">
                                    "{item.chiefComplaint}"
                                  </p>
                                </div>
                                <div className="p-3 bg-teal-50/50 border border-teal-100 rounded-xl space-y-1">
                                  <span
                                    className="text-[10px] font-bold text-[#009688] uppercase"
                                    style={{ fontFamily: PP }}
                                  >
                                    Patient Vitals
                                  </span>
                                  <div className="grid grid-cols-4 gap-1 text-[11px] font-bold text-slate-700">
                                    <span>BP: {item.vitals.bp}</span>
                                    <span>Pulse: {item.vitals.pulse}</span>
                                    <span>Temp: {item.vitals.temp}</span>
                                    <span>SpO₂: {item.vitals.spo2}</span>
                                  </div>
                                </div>
                              </div>

                              {/* Section: Examination & Diagnosis */}
                              <div className="space-y-2">
                                <span
                                  className="text-[10px] font-bold text-slate-400 uppercase"
                                  style={{ fontFamily: PP }}
                                >
                                  Examination & Diagnosis
                                </span>
                                <div className="p-3 bg-slate-50 rounded-xl space-y-1.5">
                                  <p>
                                    <strong className="text-slate-700">
                                      Findings:
                                    </strong>{" "}
                                    {item.examinationFindings}
                                  </p>
                                  <p>
                                    <strong className="text-slate-700">
                                      Final Diagnosis:
                                    </strong>{" "}
                                    <strong className="text-[#0D47A1]">
                                      {item.diagnosis}
                                    </strong>{" "}
                                    ({item.icdCode})
                                  </p>
                                </div>
                              </div>

                              {/* Section: Prescription Summary */}
                              <div className="space-y-2">
                                <div className="flex justify-between items-center">
                                  <span
                                    className="text-[10px] font-bold text-slate-400 uppercase"
                                    style={{ fontFamily: PP }}
                                  >
                                    Prescription Summary
                                  </span>
                                  <span className="text-[10px] font-bold text-[#009688] bg-teal-50 px-2 py-0.5 rounded">
                                    {item.medicines.length} Prescribed
                                  </span>
                                </div>
                                <div className="overflow-x-auto border border-gray-100 rounded-xl">
                                  <table className="w-full text-left text-[11px]">
                                    <thead
                                      className="bg-slate-50 text-slate-500 font-bold"
                                      style={{ fontFamily: PP }}
                                    >
                                      <tr>
                                        <th className="py-2 px-3">Medicine</th>
                                        <th className="py-2 px-3">Dosage</th>
                                        <th className="py-2 px-3">Frequency</th>
                                        <th className="py-2 px-3">Duration</th>
                                      </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100 font-medium text-slate-700">
                                      {item.medicines.length === 0 ? (
                                        <tr>
                                          <td
                                            colSpan={4}
                                            className="py-2 px-3 italic text-slate-500"
                                          >
                                            No medications prescribed.
                                          </td>
                                        </tr>
                                      ) : (
                                        item.medicines.map((m) => (
                                          <tr
                                            key={`${m.name}-${m.dosage}-${m.freq}`}
                                          >
                                            <td
                                              className="py-1.5 px-3 font-bold text-[#111827]"
                                              style={{ fontFamily: PP }}
                                            >
                                              {m.name}
                                            </td>
                                            <td className="py-1.5 px-3">
                                              {m.dosage}
                                            </td>
                                            <td className="py-1.5 px-3 text-blue-700">
                                              {m.freq}
                                            </td>
                                            <td className="py-1.5 px-3">
                                              {m.duration}
                                            </td>
                                          </tr>
                                        ))
                                      )}
                                    </tbody>
                                  </table>
                                </div>
                              </div>

                              {/* Section: Investigations & Notes */}
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                  <span
                                    className="text-[10px] font-bold text-slate-400 uppercase"
                                    style={{ fontFamily: PP }}
                                  >
                                    Recommended Investigations
                                  </span>
                                  <div className="flex flex-wrap gap-1.5 mt-1">
                                    {item.investigations.length === 0 ? (
                                      <span className="text-slate-500 italic">
                                        None recommended
                                      </span>
                                    ) : (
                                      item.investigations.map((inv) => (
                                        <span
                                          key={inv}
                                          className="px-2.5 py-0.5 bg-purple-50 text-purple-700 border border-purple-200 rounded font-semibold text-[11px]"
                                          style={{ fontFamily: PP }}
                                        >
                                          {inv}
                                        </span>
                                      ))
                                    )}
                                  </div>
                                </div>
                                <div>
                                  <span
                                    className="text-[10px] font-bold text-slate-400 uppercase"
                                    style={{ fontFamily: PP }}
                                  >
                                    Follow-up Details
                                  </span>
                                  <p className="text-[#0D47A1] font-semibold mt-1 bg-blue-50 px-2.5 py-1 rounded-lg inline-block">
                                    {item.followupStatus}
                                  </p>
                                </div>
                              </div>

                              {/* Action Buttons */}
                              <div className="pt-3 border-t border-gray-100 flex items-center justify-end gap-2">
                                <button
                                  onClick={handlePrintHistory}
                                  className="px-3 py-1.5 rounded-lg border border-[#E5E7EB] bg-white text-[#009688] font-semibold hover:bg-teal-50 transition-colors flex items-center gap-1.5 text-xs"
                                  style={{ fontFamily: PP }}
                                >
                                  <Printer size={14} />
                                  Print Prescription
                                </button>
                                <button
                                  onClick={() =>
                                    onViewFullConsultation?.(item.id)
                                  }
                                  className="px-3 py-1.5 rounded-lg bg-[#0D47A1] text-white font-semibold hover:bg-[#0a3880] transition-colors flex items-center gap-1.5 text-xs"
                                  style={{ fontFamily: PP }}
                                >
                                  <FileText size={14} />
                                  View Full Consultation
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* ── STICKY FOOTER ACTION BAR ── */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-[#E5E7EB] px-6 py-3 shadow-lg flex items-center justify-between">
        <div className="text-xs text-[#64748B]" style={{ fontFamily: RB }}>
          Consultation History for{" "}
          <strong className="text-[#111827]">{patientData.name}</strong> (
          {patientData.mrn})
        </div>

        <div className="flex items-center gap-3">
          {onBack && (
            <button
              onClick={onBack}
              className="px-4 py-2 border border-[#E5E7EB] text-slate-700 hover:bg-slate-50 text-xs font-semibold rounded-xl transition-colors"
              style={{ fontFamily: PP }}
            >
              Back
            </button>
          )}
          <button
            onClick={handlePrintHistory}
            className="px-4 py-2 border border-[#E5E7EB] bg-slate-50 text-slate-700 hover:bg-slate-100 text-xs font-semibold rounded-xl transition-colors flex items-center gap-1.5"
            style={{ fontFamily: PP }}
          >
            <Printer size={15} className="text-[#009688]" />
            Print Medical History
          </button>
          <button
            onClick={handlePrintHistory}
            className="px-5 py-2 bg-[#0D47A1] hover:bg-[#0a3880] text-white text-xs font-semibold rounded-xl shadow-sm transition-colors flex items-center gap-2"
            style={{ fontFamily: PP }}
          >
            <Download size={15} />
            Export Consultation History PDF
          </button>
        </div>
      </div>
    </div>
  );
}
