import { prescriptionApi } from "../api/prescription.api";
import { encountersApi } from "../../encounters/api/encounters.api";
import { prescriptionStoreActions } from "../store/prescription.store";
import type {
  UnifiedPrescription,
  RxStatus,
  PatientPrescriptionSummary,
} from "../types/prescription.types";
import type { ApiPatientPrescription } from "../../patients/types/patient.types";

function parseDiagnosis(diag: unknown): string {
  if (!diag) return "";
  if (typeof diag === "string") return diag;
  if (typeof diag === "object" && diag !== null) {
    const d = diag as Record<string, unknown>;
    return (
      (d.finalDiagnosis as string) ||
      (d.primaryDiagnosis as string) ||
      (d.diagnosis as string) ||
      (d.chiefComplaint as string) ||
      (d.clinicalFindings as string) ||
      (d.icdCode ? `ICD: ${d.icdCode}` : "") ||
      ""
    );
  }
  return String(diag);
}

export const prescriptionService = {
  mapApiToUnified: (
    apiRx: Record<string, unknown> | ApiPatientPrescription,
    fallbackPatientName?: string,
  ): UnifiedPrescription => {
    const rx = apiRx as Record<string, unknown>;
    const statusRaw = String(
      rx.status ?? rx.prescriptionStatus ?? "",
    ).toUpperCase();
    let status: RxStatus = "Issued";
    if (statusRaw.startsWith("DRAFT")) {
      status = "Draft";
    } else if (
      statusRaw.startsWith("FINALIZED") ||
      statusRaw.startsWith("COMPLETED")
    ) {
      status = "Completed";
    } else if (statusRaw.startsWith("CANCELLED")) {
      status = "Cancelled";
    } else if (statusRaw.startsWith("ARCHIVED")) {
      status = "Archived";
    }

    const patientObj = (rx.patient as Record<string, unknown>) || {};
    const doctorObj = (rx.doctor as Record<string, unknown>) || {};
    const diagObj = (rx.diagnosis as Record<string, unknown>) || {};
    const adviceObj = (rx.advice as Record<string, unknown>) || {};
    const followUpObj =
      (rx.followUp as Record<string, unknown>) ||
      (rx.followup as Record<string, unknown>) ||
      {};

    const patientName =
      (patientObj.fullName as string) ||
      (rx.patientName as string) ||
      fallbackPatientName ||
      "Patient";
    const mrn =
      (patientObj.mrn as string) ||
      (rx.mrn as string) ||
      (rx.patientMrn as string) ||
      "";
    const doctorName =
      (doctorObj.fullName as string) ||
      (doctorObj.doctorName as string) ||
      (rx.doctorName as string) ||
      "";
    const department =
      (doctorObj.department as string) || (rx.department as string) || "";

    const rawMeds = Array.isArray(rx.medicines)
      ? rx.medicines
      : Array.isArray(rx.medications)
        ? rx.medications
        : [];

    const medicines = (rawMeds as Array<Record<string, unknown>>).map((m) => {
      const doseVal =
        m.doseValue != null
          ? `${m.doseValue} ${m.doseUnit || ""}`.trim()
          : m.dose || m.dosage || m.strength;

      const freqVal =
        m.frequencyDisplay ||
        m.frequencyCode ||
        m.frequencyLabel ||
        m.frequency;

      const durVal =
        m.durationValue != null
          ? `${m.durationValue} ${m.durationUnit || "DAYS"}`.trim()
          : m.duration;

      const qtyVal =
        m.quantityValue != null
          ? `${m.quantityValue} ${m.quantityUnit || ""}`.trim()
          : m.quantity;

      const formatComplex = (v: unknown): string => {
        if (v == null) return "";
        if (typeof v === "string" || typeof v === "number") return String(v);
        if (typeof v === "object") {
          const o = v as Record<string, unknown>;
          if (o.display) return String(o.display);
          if (o.label) return String(o.label);
          if (o.value != null) {
            const unitStr = o.unit ? ` ${o.unit}` : "";
            return `${o.value}${unitStr}`.trim();
          }
          if (o.code) return String(o.code);
        }
        return String(v);
      };

      return {
        name: String(m.medicineName || m.name || m.medicine || ""),
        strength: String(m.strength || formatComplex(doseVal) || ""),
        route: String(m.route || m.form || "ORAL"),
        dosage: formatComplex(doseVal),
        frequency: formatComplex(freqVal),
        duration: formatComplex(durVal),
        quantity: formatComplex(qtyVal),
        instructions: String(
          m.instructions || m.specialInstructions || m.notes || "",
        ),
      };
    });

    const followupDate =
      (followUpObj.nextVisitDate as string) ||
      (followUpObj.followUpDate as string) ||
      (rx.followUpDate as string) ||
      (rx.followupDate as string) ||
      "";

    const followupRequired =
      followUpObj.required !== undefined
        ? Boolean(followUpObj.required)
        : !!followupDate;

    return {
      id: String(rx.prescriptionId || rx.id || rx.prescriptionNumber || ""),
      patientName,
      mrn,
      consultationId: String(
        rx.consultationId || rx.encounterId || rx.appointmentId || "",
      ),
      department,
      consultationDate: String(
        rx.consultationDate ||
          rx.date ||
          rx.visitDateTime ||
          rx.createdAt ||
          "",
      ),
      medicineCount: (rx.medicineCount as number) || medicines.length,
      followup: followupRequired,
      followupDate,
      status,
      doctorName,
      diagnosis: parseDiagnosis(rx.diagnosis),
      medicines,
      age: patientObj.age
        ? String(patientObj.age)
        : rx.age
          ? String(rx.age)
          : undefined,
      gender: (patientObj.gender as string) || (rx.gender as string),
      bloodGroup:
        (patientObj.bloodGroup as string) || (rx.bloodGroup as string),
      allergies: Array.isArray(patientObj.allergies)
        ? (patientObj.allergies as string[])
        : Array.isArray(rx.allergies)
          ? (rx.allergies as string[])
          : undefined,
      chiefComplaint:
        (diagObj.chiefComplaint as string) || (rx.chiefComplaint as string),
      clinicalFindings:
        (diagObj.clinicalFindings as string) || (rx.clinicalFindings as string),
      finalDiagnosis:
        (diagObj.finalDiagnosis as string) || (rx.finalDiagnosis as string),
      icdCode: (diagObj.icdCode as string) || (rx.icdCode as string),
      doctorNotes:
        (diagObj.doctorNotes as string) || (rx.doctorNotes as string),
      dietAdvice:
        (adviceObj.diet as string) ||
        (adviceObj.dietAdvice as string) ||
        (rx.dietAdvice as string),
      lifestyleAdvice:
        (adviceObj.lifestyle as string) ||
        (adviceObj.lifestyleAdvice as string) ||
        (rx.lifestyleAdvice as string),
      exerciseAdvice:
        (adviceObj.exercise as string) ||
        (adviceObj.exerciseAdvice as string) ||
        (rx.exerciseAdvice as string),
      specialInstructions:
        (adviceObj.specialInstructions as string) ||
        (adviceObj.precautions as string) ||
        (rx.specialInstructions as string),
      followupNotes:
        (followUpObj.notes as string) ||
        (followUpObj.instructions as string) ||
        (rx.followupNotes as string),
    } as UnifiedPrescription;
  },

  mapPatientSummaryToUnified: (
    rx: PatientPrescriptionSummary,
  ): UnifiedPrescription => {
    const statusRaw = String(rx.prescriptionStatus ?? "").toUpperCase();
    let status: RxStatus = "Issued";
    if (statusRaw === "DRAFT") status = "Draft";
    else if (statusRaw === "FINALIZED" || statusRaw === "COMPLETED")
      status = "Completed";
    else if (statusRaw === "CANCELLED") status = "Cancelled";
    else if (statusRaw === "ARCHIVED") status = "Archived";

    const medicineCount = rx.medications?.totalMedicines ?? 0;
    const sampleMedicines = rx.medications?.sampleMedicines ?? [];

    return {
      id: String(rx.prescriptionId ?? ""),
      patientName: "Patient",
      mrn: "",
      consultationId: String(rx.encounterId || rx.appointmentId || ""),
      department: rx.department?.departmentName || "",
      consultationDate: rx.visitDateTime || rx.createdAt || "",
      medicineCount,
      followup: !!rx.followUp?.required,
      followupDate: rx.followUp?.followUpDate || "",
      status,
      doctorName: rx.doctor?.doctorName || "",
      diagnosis: parseDiagnosis(rx.diagnosis),
      medicines: sampleMedicines.map((name) => ({
        name,
        strength: "",
        route: "ORAL",
        dosage: "",
        frequency: "",
        duration: "",
        instructions: "",
      })),
    };
  },

  loadPrescriptions: async (
    mrn?: string,
    doctorNameFilter?: string,
  ): Promise<UnifiedPrescription[]> => {
    prescriptionStoreActions.setLoading(true);
    try {
      const records = await prescriptionApi.getPrescriptions(mrn);
      let mapped = records.map((rx) =>
        prescriptionService.mapApiToUnified(
          rx,
          mrn ? undefined : "General Patient",
        ),
      );

      if (doctorNameFilter) {
        const query = doctorNameFilter.toLowerCase();
        mapped = mapped.filter((rx) =>
          rx.doctorName.toLowerCase().includes(query),
        );
      }

      prescriptionStoreActions.setPrescriptions(mapped);
      return mapped;
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : "Failed to load prescriptions";
      prescriptionStoreActions.setError(msg);
      return [];
    } finally {
      prescriptionStoreActions.setLoading(false);
    }
  },

  loadPatientPrescriptions: async (
    mrn: string,
    params?: {
      page?: number;
      size?: number;
      status?: string;
      fromDate?: string;
      toDate?: string;
    },
  ): Promise<UnifiedPrescription[]> => {
    prescriptionStoreActions.setLoading(true);
    try {
      const result = await prescriptionApi.getPatientPrescriptions(mrn, params);
      let mapped = (result.content || []).map((rx) =>
        prescriptionService.mapPatientSummaryToUnified(rx),
      );

      if (mapped.length === 0) {
        const records = await prescriptionApi.getPrescriptions(mrn);
        mapped = records.map((rx) =>
          prescriptionService.mapApiToUnified(
            rx,
            mrn ? undefined : "General Patient",
          ),
        );
      }

      prescriptionStoreActions.setPrescriptions(mapped);
      return mapped;
    } catch {
      try {
        const records = await prescriptionApi.getPrescriptions(mrn);
        const mapped = records.map((rx) =>
          prescriptionService.mapApiToUnified(
            rx,
            mrn ? undefined : "General Patient",
          ),
        );
        prescriptionStoreActions.setPrescriptions(mapped);
        return mapped;
      } catch {
        prescriptionStoreActions.setPrescriptions([]);
        return [];
      }
    } finally {
      prescriptionStoreActions.setLoading(false);
    }
  },

  getPrescriptionDetails: async (
    id: string | number,
  ): Promise<UnifiedPrescription | null> => {
    prescriptionStoreActions.setLoading(true);
    try {
      const apiRx =
        (await prescriptionApi.getPrescriptionById(id)) ||
        (await prescriptionApi.getPrescriptionDetails(id));
      if (apiRx) {
        const unified = prescriptionService.mapApiToUnified(
          apiRx as Record<string, unknown>,
        );
        prescriptionStoreActions.setSelectedPrescription(unified);
        return unified;
      }
      return null;
    } catch {
      return null;
    } finally {
      prescriptionStoreActions.setLoading(false);
    }
  },

  getEncounterPrescription: async (
    encounterId: string | number,
  ): Promise<UnifiedPrescription | null> => {
    try {
      const apiRx = await prescriptionApi.getEncounterPrescription(encounterId);
      if (apiRx) {
        const unified = prescriptionService.mapApiToUnified(apiRx);
        prescriptionStoreActions.setSelectedPrescription(unified);
        return unified;
      }
      return null;
    } catch {
      return null;
    }
  },

  createPrescription: async (
    encounterId: string | number,
    payload: { outcome: string },
  ) => {
    try {
      return await encountersApi.createPrescription(encounterId, payload);
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : "Failed to create prescription";
      prescriptionStoreActions.setError(msg);
      throw err;
    }
  },

  addMedication: async (
    prescriptionId: string | number,
    payload: Record<string, unknown>,
  ) => {
    try {
      return await encountersApi.addMedication(prescriptionId, payload);
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : "Failed to add medication";
      prescriptionStoreActions.setError(msg);
      throw err;
    }
  },

  saveAdvice: async (
    prescriptionId: string | number,
    payload: {
      generalAdvice?: string;
      dietAdvice?: string;
      precautions?: string;
    },
  ) => {
    try {
      return await encountersApi.savePrescriptionAdvice(
        prescriptionId,
        payload,
      );
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to save advice";
      prescriptionStoreActions.setError(msg);
      throw err;
    }
  },

  validatePrescription: async (prescriptionId: string | number) => {
    try {
      return await encountersApi.validatePrescription(prescriptionId);
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : "Failed to validate prescription";
      prescriptionStoreActions.setError(msg);
      throw err;
    }
  },

  finalizePrescription: async (id: string | number): Promise<boolean> => {
    try {
      await prescriptionApi.finalizePrescription(id);
      return true;
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : "Failed to finalize prescription";
      prescriptionStoreActions.setError(msg);
      return false;
    }
  },

  createAmendment: async (
    prescriptionId: string | number,
    payload?: { reason?: string },
  ) => {
    try {
      return await prescriptionApi.createAmendment(prescriptionId, payload);
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : "Failed to create amendment";
      prescriptionStoreActions.setError(msg);
      throw err;
    }
  },

  reprintPrescription: async (
    prescriptionId: string | number,
    payload?: { reason?: string },
  ) => {
    try {
      return await prescriptionApi.reprintPrescription(prescriptionId, payload);
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : "Failed to reprint prescription";
      prescriptionStoreActions.setError(msg);
      throw err;
    }
  },

  getPrintOutput: async (prescriptionId: string | number) => {
    try {
      return await prescriptionApi.getPrintOutput(prescriptionId);
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : "Failed to load print layout";
      prescriptionStoreActions.setError(msg);
      return null;
    }
  },
};
