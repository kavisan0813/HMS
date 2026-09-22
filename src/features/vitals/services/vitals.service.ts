import { vitalsApi } from "../api/vitals.api";
import { appointmentsApi } from "../../appointments/api/appointments.api";
import type {
  NurseVitalsPayload,
  NurseWaitingPatient,
  RecordedVitalsData,
} from "../types/vitals.types";

export const vitalsService = {
  async getWaitingPatients(date?: string): Promise<NurseWaitingPatient[]> {
    return vitalsApi.getNurseQueue(date);
  },

  async getVitals(
    appointmentId: string | number,
  ): Promise<RecordedVitalsData | null> {
    try {
      const res = await vitalsApi.getVitals(appointmentId);
      if (!res?.success || !res.data) return null;
      const d = res.data;

      // Map backend response fields to RecordedVitalsData UI model
      const formatAuditDate = (dateStr?: string) => {
        if (!dateStr) return "";
        try {
          return new Date(dateStr).toLocaleString("en-IN", {
            hour: "2-digit",
            minute: "2-digit",
            hour12: true,
            day: "2-digit",
            month: "short",
            year: "numeric",
          });
        } catch (err) {
          console.log(err);
          return dateStr;
        }
      };

      let systolic = "";
      let diastolic = "";
      if (
        d.bloodPressure &&
        typeof d.bloodPressure === "string" &&
        d.bloodPressure.includes("/")
      ) {
        const parts = d.bloodPressure.split("/");
        systolic = parts[0]?.trim() || "";
        diastolic = parts[1]?.trim() || "";
      } else {
        systolic =
          d.bloodPressureSystolic != null
            ? String(d.bloodPressureSystolic)
            : "";
        diastolic =
          d.bloodPressureDiastolic != null
            ? String(d.bloodPressureDiastolic)
            : "";
      }

      const pulseVal = d.pulse ?? d.heartRate;
      const spo2Val = d.spo2 ?? d.oxygenSaturation;
      const respVal = d.respRate ?? d.respiratoryRate;
      const sugarVal = d.sugar ?? d.bloodSugar;

      const recordedByName = d.recordedBy?.name
        ? `${d.recordedBy.name}${d.recordedBy.employeeId ? ` (${d.recordedBy.employeeId})` : ""}`
        : d.recordedBy?.employeeId || "";
      const lastUpdatedByName = d.lastUpdatedBy?.name
        ? `${d.lastUpdatedBy.name}${d.lastUpdatedBy.employeeId ? ` (${d.lastUpdatedBy.employeeId})` : ""}`
        : d.lastUpdatedBy?.employeeId || "";
      const lastReviewedByName = d.lastReviewedBy?.name
        ? `${d.lastReviewedBy.name}${d.lastReviewedBy.employeeId ? ` (${d.lastReviewedBy.employeeId})` : ""}`
        : d.lastReviewedBy?.employeeId || "";

      return {
        vitalsId: d.vitalsId,
        height: d.height != null ? String(d.height) : "",
        weight: d.weight != null ? String(d.weight) : "",
        bmi:
          d.height && d.weight
            ? (
                (d.weight as number) /
                ((d.height as number) / 100) ** 2
              ).toFixed(1)
            : "",
        temp: d.temperature != null ? String(d.temperature) : "",
        temperature: d.temperature != null ? String(d.temperature) : "",
        systolic,
        diastolic,
        pulse: pulseVal != null ? String(pulseVal) : "",
        resp: respVal != null ? String(respVal) : "",
        spo2: spo2Val != null ? String(spo2Val) : "",
        sugar: sugarVal != null ? String(sugarVal) : "",
        bloodSugar: sugarVal != null ? String(sugarVal) : "",
        chiefComplaint: d.chiefComplaint || "",
        symptoms: d.symptoms || "",
        diagnosis: d.diagnosis || "",
        clinicalNotes: d.clinicalNotes || d.notes || "",
        observation: d.clinicalNotes || d.notes || "Vitals recorded by nurse.",
        appearance: "Normal / Healthy",
        consciousness: "Alert & Oriented",
        status: d.status || "COMPLETED",
        version: d.version,
        recordedBy: recordedByName,
        recordedAt: formatAuditDate(d.recordedAt),
        lastUpdatedBy: lastUpdatedByName,
        lastUpdatedAt: formatAuditDate(d.lastUpdatedAt),
        lastReviewedBy: lastReviewedByName,
        lastReviewedAt: formatAuditDate(d.lastReviewedAt),
      };
    } catch (err) {
      console.log(err);
      return null;
    }
  },

  async checkAppointmentVitals(
    appointmentId: string | number,
  ): Promise<{ hasVitals: boolean; vitals: RecordedVitalsData | null }> {
    try {
      const data = await this.getVitals(appointmentId);
      return {
        hasVitals: Boolean(data),
        vitals: data,
      };
    } catch (err: unknown) {
      const errObj = err as {
        status?: number;
        response?: { status?: number; data?: { code?: string } };
        code?: string;
      };
      const status = errObj.status || errObj.response?.status;
      const code = errObj.code || errObj.response?.data?.code;

      if (status === 404 || code === "RESOURCE_NOT_FOUND") {
        return {
          hasVitals: false,
          vitals: null,
        };
      }
      throw err;
    }
  },

  /**
   * Create an encounter for an appointment (backend contract: POST /api/v1/encounters)
   * Then record vitals for the encounter (POST /api/v1/encounters/{encounterId}/vitals)
   */
  async submitVitalsWithEncounter(
    appointmentId: string | number,
    formData:
      | NurseVitalsPayload
      | (RecordedVitalsData & {
          chiefComplaint?: string;
          symptoms?: string;
          diagnosis?: string;
          clinicalNotes?: string;
          notes?: string;
        }),
    currentStatus?: string,
  ): Promise<{ encounterId: string | number; success: boolean }> {
    // 1. Create encounter for the appointment
    const encounterResult = await vitalsApi.createEncounter(appointmentId);
    const encounterId = encounterResult.encounterId;

    if (!encounterId) {
      throw new Error("Failed to create encounter for appointment");
    }

    // 2. Extract numeric values from form data
    const extractNumber = (val: unknown, defaultVal: number): number => {
      if (typeof val === "number") return val;
      if (typeof val === "string") {
        const parsed = parseFloat(val.replace(/[^0-9.-]/g, ""));
        return isNaN(parsed) ? defaultVal : parsed;
      }
      return defaultVal;
    };

    const extractBpParts = (
      bp?: string,
    ): { systolic: number; diastolic: number } => {
      if (bp && bp.includes("/")) {
        const parts = bp.split("/").map((p) => parseFloat(p.trim()));
        if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
          return { systolic: parts[0], diastolic: parts[1] };
        }
      }
      return { systolic: 120, diastolic: 80 };
    };

    const f = formData as Record<string, unknown>;
    const tempVal = extractNumber(f.temperature ?? f.temp, 98.6);
    const weightVal = extractNumber(f.weight, 70);
    const heightVal = extractNumber(f.height, 170);
    const pulseVal = extractNumber(f.pulse ?? f.pulseRate, 72);
    const spo2Val = extractNumber(f.spo2, 98);

    let bpStr = f.bloodPressure as string | undefined;
    if (!bpStr) {
      const sys = extractNumber(f.systolic ?? f.bpSystolic, 120);
      const dia = extractNumber(f.diastolic ?? f.bpDiastolic, 80);
      bpStr = `${sys}/${dia}`;
    }
    const { systolic, diastolic } = extractBpParts(bpStr);

    // 3. Record vitals for the encounter (backend contract format)
    const vitalsPayload = {
      tempValue: tempVal,
      bpSystolicVal: systolic,
      bpDiastolicVal: diastolic,
      pulseVal: pulseVal,
      spo2Val: spo2Val,
      weightVal: weightVal,
      heightVal: heightVal,
    };

    const vitalsRes = await vitalsApi.recordEncounterVitals(
      encounterId,
      vitalsPayload,
    );

    // Transition appointment status to WAITING_FOR_DOCTOR after vitals are recorded
    if (vitalsRes?.success !== false) {
      if (
        !currentStatus ||
        currentStatus === "CHECKED_IN" ||
        currentStatus === "WAITING_FOR_VITALS"
      ) {
        try {
          await appointmentsApi.updateAppointmentStatus(
            appointmentId,
            "WAITING_FOR_DOCTOR",
          );
        } catch (statusErr) {
          console.warn(
            "Vitals recorded but failed to transition status to WAITING_FOR_DOCTOR:",
            statusErr,
          );
        }
      } else {
        console.info(
          `Status transition skipped: Appointment is already in ${currentStatus}.`,
        );
      }
    }

    return {
      encounterId,
      success: vitalsRes?.success !== false,
    };
  },

  /**
   * Legacy submit vitals using appointment-based endpoint
   * Use submitVitalsWithEncounter for the new backend contract flow
   */
  async submitVitals(
    appointmentId: string | number,
    formData:
      | NurseVitalsPayload
      | (RecordedVitalsData & {
          chiefComplaint?: string;
          symptoms?: string;
          diagnosis?: string;
          clinicalNotes?: string;
          notes?: string;
        }),
    currentStatus?: string,
  ): Promise<boolean> {
    let payload: NurseVitalsPayload;

    if (
      "bloodPressure" in formData &&
      typeof (formData as NurseVitalsPayload).temperature === "number"
    ) {
      payload = formData as NurseVitalsPayload;
    } else {
      interface RelaxedVitalsData {
        chiefComplaint?: string;
        notes?: string;
        symptoms?: string;
        diagnosis?: string;
        clinicalNotes?: string;
        observation?: string;
        temperature?: number | string;
        temp?: number | string;
        weight?: number | string;
        height?: number | string;
        bloodPressure?: string;
        systolic?: string;
        bpSystolic?: string;
        diastolic?: string;
        bpDiastolic?: string;
        pulse?: number | string;
        pulseRate?: number | string;
        spo2?: number | string;
      }
      const f = formData as RelaxedVitalsData;
      payload = {
        chiefComplaint:
          f.chiefComplaint ||
          f.notes ||
          "Pre-consultation routine vitals check",
        symptoms: f.symptoms || "None reported",
        diagnosis: f.diagnosis || "Under evaluation",
        clinicalNotes:
          f.clinicalNotes ||
          f.notes ||
          f.observation ||
          "Vitals recorded by Nurse",
        temperature:
          typeof f.temperature === "number"
            ? f.temperature
            : parseFloat(String(f.temp || f.temperature || "98.6")) || 98.6,
        weight:
          typeof f.weight === "number"
            ? f.weight
            : parseFloat(String(f.weight || "70")) || 70,
        height:
          typeof f.height === "number"
            ? f.height
            : parseFloat(String(f.height || "170")) || 170,
        bloodPressure:
          f.bloodPressure ||
          `${f.systolic || f.bpSystolic || "120"}/${f.diastolic || f.bpDiastolic || "80"}`,
        pulse:
          typeof f.pulse === "number"
            ? f.pulse
            : parseInt(String(f.pulse || f.pulseRate || "72"), 10) || 72,
        spo2:
          typeof f.spo2 === "number"
            ? f.spo2
            : parseInt(String(f.spo2 || "98"), 10) || 98,
      };
    }

    const res = await vitalsApi.recordVitals(appointmentId, payload);
    if (res?.success !== false) {
      // Transition appointment status to WAITING_FOR_DOCTOR after vitals are recorded
      if (
        !currentStatus ||
        currentStatus === "CHECKED_IN" ||
        currentStatus === "WAITING_FOR_VITALS"
      ) {
        try {
          await appointmentsApi.updateAppointmentStatus(
            appointmentId,
            "WAITING_FOR_DOCTOR",
          );
        } catch (statusErr) {
          console.warn(
            "Vitals recorded but failed to transition status to WAITING_FOR_DOCTOR:",
            statusErr,
          );
        }
      } else {
        console.info(
          `Status transition skipped: Appointment is already in ${currentStatus}.`,
        );
      }
      return true;
    }
    return false;
  },

  /**
   * Update/amend recorded vitals for an appointment using PUT /api/v1/nurse/appointments/{appointmentId}/vitals
   */
  async updateVitals(
    appointmentId: string | number,
    formData:
      | NurseVitalsPayload
      | (RecordedVitalsData & {
          chiefComplaint?: string;
          symptoms?: string;
          diagnosis?: string;
          clinicalNotes?: string;
          notes?: string;
        }),
  ): Promise<boolean> {
    let payload: NurseVitalsPayload;

    if (
      "bloodPressure" in formData &&
      typeof (formData as NurseVitalsPayload).temperature === "number"
    ) {
      payload = formData as NurseVitalsPayload;
    } else {
      interface RelaxedVitalsData {
        chiefComplaint?: string;
        notes?: string;
        symptoms?: string;
        diagnosis?: string;
        clinicalNotes?: string;
        observation?: string;
        temperature?: number | string;
        temp?: number | string;
        weight?: number | string;
        height?: number | string;
        bloodPressure?: string;
        systolic?: string;
        bpSystolic?: string;
        diastolic?: string;
        bpDiastolic?: string;
        pulse?: number | string;
        pulseRate?: number | string;
        spo2?: number | string;
      }
      const f = formData as RelaxedVitalsData;
      payload = {
        chiefComplaint:
          f.chiefComplaint ||
          f.notes ||
          "Pre-consultation routine vitals check",
        symptoms: f.symptoms || "None reported",
        diagnosis: f.diagnosis || "Under evaluation",
        clinicalNotes:
          f.clinicalNotes ||
          f.notes ||
          f.observation ||
          "Vitals updated by Nurse",
        temperature:
          typeof f.temperature === "number"
            ? f.temperature
            : parseFloat(String(f.temp || f.temperature || "98.6")) || 98.6,
        weight:
          typeof f.weight === "number"
            ? f.weight
            : parseFloat(String(f.weight || "70")) || 70,
        height:
          typeof f.height === "number"
            ? f.height
            : parseFloat(String(f.height || "170")) || 170,
        bloodPressure:
          f.bloodPressure ||
          `${f.systolic || f.bpSystolic || "120"}/${f.diastolic || f.bpDiastolic || "80"}`,
        pulse:
          typeof f.pulse === "number"
            ? f.pulse
            : parseInt(String(f.pulse || f.pulseRate || "72"), 10) || 72,
        spo2:
          typeof f.spo2 === "number"
            ? f.spo2
            : parseInt(String(f.spo2 || "98"), 10) || 98,
      };
    }

    const res = await vitalsApi.updateVitals(appointmentId, payload);
    return res?.success !== false;
  },
};
