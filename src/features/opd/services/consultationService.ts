import type { AppointmentRecord } from "../../appointments/types/appointment.types";
import { consultationApi } from "../api/consultationApi";
import { consultationStoreActions } from "../store/consultationStore";
import type { PatientVitals } from "../types/vitals";
import type {
  ConsultationRecord,
  VisitType,
  ConsultationStatus,
} from "../types/consultation";
import { encountersApi } from "../../encounters/api/encounters.api";
import { appointmentsApi } from "../../appointments/api/appointments.api";

export const consultationService = {
  /**
   * Action: Doctor calls patient from queue
   * PATCH /api/v1/queue/{appointmentId}/call → transitions to CALLED
   * Falls back to PATCH /api/v1/appointments/{id}/status
   */
  callPatient: async (
    appointmentId: string | number,
    alternateId?: string | number,
  ) => {
    let numericId: string | number = appointmentId;
    if (typeof appointmentId === "string" && appointmentId.includes("-")) {
      const parsed = parseInt(appointmentId.split("-").pop() || "", 10);
      if (!isNaN(parsed) && parsed > 0) {
        numericId = parsed;
      }
    }

    let altNumericId: string | number | undefined = alternateId;
    if (typeof alternateId === "string" && alternateId.includes("-")) {
      const parsed = parseInt(alternateId.split("-").pop() || "", 10);
      if (!isNaN(parsed) && parsed > 0) {
        altNumericId = parsed;
      }
    }

    const idsToTry = Array.from(
      new Set(
        [numericId, appointmentId, altNumericId, alternateId].filter(
          (id): id is string | number =>
            id !== undefined && id !== null && id !== "" && id !== 0,
        ),
      ),
    );

    let lastError: unknown;
    for (const id of idsToTry) {
      try {
        await consultationApi.callPatientFromQueue(id);
        consultationStoreActions.setStatus("CALLED");
        return;
      } catch (err) {
        lastError = err;
      }
    }

    for (const id of idsToTry) {
      try {
        await appointmentsApi.updateAppointmentStatus(id, "CALLED");
        consultationStoreActions.setStatus("CALLED");
        return;
      } catch (err) {
        lastError = err;
      }
    }

    if (lastError) throw lastError;
  },

  /**
   * Action: Doctor starts the consultation
   * 1. POST /api/v1/encounters
   * 2. GET /api/v1/encounters/{encounterId}/vitals (load patient vitals)
   * 3. POST /api/v1/encounters/{encounterId}/consultation (init draft)
   * 4. PATCH /api/v1/appointments/{id}/status → IN_CONSULTATION
   */
  startConsultation: async (
    appointment: AppointmentRecord,
    chiefComplaint: string = "",
  ): Promise<{
    encounterId: string | number;
    consultationId: string | number;
  }> => {
    consultationStoreActions.setLoading(true);
    try {
      const appointmentId = appointment.id || appointment.appointmentId;
      if (!appointmentId) {
        throw new Error("Appointment ID is missing");
      }

      // 1. Transition appointment status to IN_CONSULTATION in backend (PATCH /api/v1/doctor/appointments/{id}/start)
      try {
        await appointmentsApi.doctorStartConsultation(appointmentId);
      } catch (startErr) {
        console.warn(
          "Transition appointment to IN_CONSULTATION warning:",
          startErr,
        );
      }

      // 2. Create / Open Encounter with linked appointment & patient (POST /api/v1/encounters)
      const rawApt = appointment as unknown as Record<string, unknown>;
      const pSub = (
        rawApt.patient && typeof rawApt.patient === "object"
          ? rawApt.patient
          : {}
      ) as Record<string, unknown>;
      const patientId =
        appointment.patientId ||
        (rawApt.patientId as string | number) ||
        (rawApt.patient_id as string | number) ||
        (rawApt.patientID as string | number) ||
        (pSub.id as string | number) ||
        (pSub.patientId as string | number) ||
        (pSub.patient_id as string | number) ||
        undefined;

      const encounter = await consultationApi.createEncounter(
        appointmentId,
        patientId,
      );
      consultationStoreActions.setEncounter(encounter);

      // 3. Fetch aggregated Encounter Workspace context (GET /api/v1/encounters/{id}/workspace)
      try {
        await consultationApi.getWorkspace(encounter.encounterId);
      } catch (err) {
        // non-blocking fallback - log error but continue
        console.warn("Failed to fetch encounter workspace:", err);
      }

      // 4. Load patient vitals for the encounter
      let vitals: PatientVitals | null = null;
      try {
        vitals = await consultationApi.loadEncounterVitals(
          encounter.encounterId,
        );
        if (vitals) {
          consultationStoreActions.setVitals(vitals);
        }
      } catch (err) {
        console.log(err);
        // Vitals may not exist yet for new encounters — continue
      }

      // 5. Initialize Consultation Draft (POST /api/v1/encounters/{id}/consultation)
      const consultation = await consultationApi.initializeConsultation(
        encounter.encounterId,
        chiefComplaint || appointment.chiefComplaint || "",
      );

      // 6. Initialize empty prescription draft for active consultation
      const prescription = null;
      consultationStoreActions.setPrescription(prescription);

      // 5. Build consultation record (status already IN_CONSULTATION from queue/encounter)
      const record: ConsultationRecord = {
        id: String(consultation.id),
        appointmentId,
        tokenNo: String(
          appointment.tokenNo ||
            appointment.tokenNumber ||
            appointment.queueToken ||
            "",
        ),
        patientName: appointment.patientName,
        mrn: appointment.mrn || appointment.patientMrn || "",
        age: Number(appointment.patientAge || appointment.age || 30),
        gender: (appointment.patientGender || appointment.gender || "Other") as
          | "Male"
          | "Female"
          | "Other",
        phone: String(appointment.patientPhone || appointment.mobile || ""),
        doctor: appointment.doctorName,
        department:
          appointment.departmentName ||
          (typeof appointment.department === "string"
            ? appointment.department
            : appointment.department?.name ||
              appointment.department?.departmentName) ||
          "",
        appointmentTime: appointment.appointmentTime || "",
        visitType: (appointment.appointmentType ||
          appointment.visitType ||
          "New Consultation") as VisitType,
        status: "IN_CONSULTATION" as ConsultationStatus,
        chiefComplaint:
          consultation.chiefComplaint ||
          chiefComplaint ||
          appointment.chiefComplaint ||
          "",
        opdRoom: String(appointment.opdRoom || ""),
        date:
          appointment.appointmentDate || new Date().toISOString().split("T")[0],
        vitals: vitals || undefined,
        clinicalExamination:
          consultation.generalExamination ||
          consultation.physicalExamination ||
          undefined,
        advice: consultation.advice,
        doctorName: "",
        completionTime: "",
        allergies: [],
        bloodGroup: "",
        durationOfSymptoms: "",
      };

      consultationStoreActions.setConsultation(record);
      consultationStoreActions.setAppointment(appointment);
      consultationStoreActions.setStatus("IN_CONSULTATION");

      return {
        encounterId: encounter.encounterId,
        consultationId: consultation.id,
      };
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to start consultation";
      consultationStoreActions.setError(errorMessage);
      throw err;
    } finally {
      consultationStoreActions.setLoading(false);
    }
  },

  /**
   * Action: Load patient details and vitals for consultation
   */
  loadEncounterContext: async (
    encounterId: string | number,
  ): Promise<PatientVitals | null> => {
    consultationStoreActions.setLoading(true);
    try {
      const vitals = await consultationApi.loadEncounterVitals(encounterId);
      return vitals;
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to load vitals";
      consultationStoreActions.setError(errorMessage);
      return null;
    } finally {
      consultationStoreActions.setLoading(false);
    }
  },

  /**
   * Action: Update Vitals
   */
  saveVitals: async (
    encounterId: string | number,
    vitals: Partial<PatientVitals>,
  ): Promise<PatientVitals> => {
    try {
      return await consultationApi.updateVitals(encounterId, vitals);
    } catch (err) {
      console.error("saveVitals failed:", err);
      throw err;
    }
  },

  /**
   * Action: Update vitals via appointment endpoint (for Doctor edit)
   * PUT /api/v1/nurse/appointments/{appointmentId}/vitals
   */
  updateAppointmentVitals: async (
    appointmentId: string | number,
    vitals: Record<string, unknown>,
  ): Promise<{ success: boolean; data: unknown }> => {
    try {
      return await consultationApi.updateAppointmentVitals(
        appointmentId,
        vitals,
      );
    } catch (err) {
      console.error("updateAppointmentVitals failed:", err);
      throw err;
    }
  },

  /**
   * Action: Save SOAP clinical notes
   * PUT /api/v1/consultations/{consultationId}/clinical-notes
   */
  saveClinicalNotes: async (
    consultationId: string | number,
    clinicalNotes: Record<string, unknown>,
  ): Promise<{ success: boolean; data: unknown }> => {
    try {
      return await consultationApi.saveClinicalNotes(
        consultationId,
        clinicalNotes,
      );
    } catch (err) {
      console.error("saveClinicalNotes failed:", err);
      throw err;
    }
  },

  /**
   * Action: Add Diagnosis
   */
  addDiagnosis: async (
    encounterId: string | number,
    code: string,
    label: string,
  ) => {
    try {
      return await consultationApi.addDiagnosis(encounterId, {
        diagnosisCode: code,
        diagnosisName: label,
      });
    } catch (err) {
      console.error("addDiagnosis failed:", err);
      throw err;
    }
  },

  /**
   * Action: Finalize Consultation
   * 1. Validate prescription (if exists)
   * 2. Finalize prescription (if exists)
   * 3. Set prescription resolution on encounter (PRESCRIPTION_CREATED)
   * 4. Finalize encounter → auto-completes appointment
   */
  finalizeConsultation: async (
    encounterId: string | number,
    appointmentId: string | number,
    advicePayload?: {
      generalAdvice?: string;
      dietAdvice?: string;
      precautions?: string;
    },
  ) => {
    consultationStoreActions.setLoading(true);
    try {
      const { selectedPrescription } = consultationStoreActions.getState();
      // Use numeric id for API calls (not the string prescriptionId like RX-20260806-2292)
      const rxId = selectedPrescription?.id;
      const hasValidRxId =
        rxId !== undefined && rxId !== null && !String(rxId).startsWith("RX-");

      // Step 16: Save prescription advice (if exists and payload provided)
      if (hasValidRxId && rxId && advicePayload) {
        try {
          await encountersApi.savePrescriptionAdvice(rxId, advicePayload);
        } catch (err) {
          console.log(err);
          // non-blocking
        }
      }

      // Step 17: Validate prescription (if exists) — non-critical
      if (hasValidRxId && rxId) {
        try {
          await encountersApi.validatePrescription(rxId);
        } catch (err) {
          console.log(err);
          // Validation failure is non-blocking
        }
      }

      // Step 18: Finalize prescription (if exists) — non-critical
      if (hasValidRxId && rxId) {
        try {
          await encountersApi.finalizePrescription(rxId, {
            confirmation: true,
          });
        } catch (err) {
          console.log(err);
          // Prescription finalize failure is non-blocking
        }
      }

      // Step 14: Set prescription resolution (PRESCRIPTION_CREATED if meds exist, else NO_PRESCRIPTION_REQUIRED)
      const hasMeds =
        selectedPrescription?.medications &&
        selectedPrescription.medications.length > 0;
      if (encounterId && String(encounterId) !== "ENC-TEMP") {
        try {
          await consultationApi.setPrescriptionResolution(encounterId, {
            outcome: hasMeds
              ? "PRESCRIPTION_CREATED"
              : "NO_PRESCRIPTION_REQUIRED",
          });
        } catch (resErr) {
          console.warn("Prescription resolution warning:", resErr);
        }

        // Step 19: Finalization check (non-blocking)
        try {
          await encountersApi.getFinalizationCheck(encounterId);
        } catch (err) {
          console.log(err);
          // non-blocking
        }

        let encounterFinalized = false;
        const MAX_RETRIES = 3;
        for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
          try {
            // Always fetch the freshest encounter right before finalizing
            const freshEncounter = await consultationApi
              .getEncounter(encounterId)
              .catch(() => null);
            const freshVersion = freshEncounter?.version;
            if (freshEncounter) {
              consultationStoreActions.setEncounter(freshEncounter);
            }

            await encountersApi.finalizeEncounter(encounterId, {
              confirmation: true,
              version: freshVersion,
            });
            encounterFinalized = true;
            break; // Success — exit retry loop
          } catch (finalizeErr: unknown) {
            const errMsg = String(
              (finalizeErr as { message?: string })?.message || finalizeErr,
            );
            const isStale =
              errMsg.includes("STALE_ENCOUNTER") ||
              errMsg.includes("modified") ||
              errMsg.includes("409");
            if (isStale && attempt < MAX_RETRIES - 1) {
              // Brief delay to let any pending DB writes settle, then retry
              await new Promise((r) => setTimeout(r, 200 * (attempt + 1)));
              continue;
            }

            // Fallback to legacy adapter endpoint: POST /api/v1/encounters/appointment/{appointmentId}/finalize
            if (appointmentId) {
              try {
                const legacyRes =
                  await encountersApi.finalizeEncounterByAppointment(
                    appointmentId,
                  );
                if (legacyRes) {
                  encounterFinalized = true;
                  break;
                }
              } catch (err) {
                console.log(err);
                // non-blocking
              }
            }

            // Fallback to appointment status completion endpoint if encounter finalization failed due to state
            if (!encounterFinalized && appointmentId) {
              try {
                const compRes =
                  await consultationApi.completeAppointment(appointmentId);
                if (compRes?.success) {
                  encounterFinalized = true;
                  break;
                }
              } catch (aptErr) {
                console.warn(
                  "Appointment completion fallback warning:",
                  aptErr,
                );
              }
            }

            if (!encounterFinalized) {
              throw finalizeErr;
            }
          }
        }

        // If encounter finalization didn't run or wasn't applicable, complete appointment as fallback
        if (appointmentId && !encounterFinalized) {
          try {
            await consultationApi.completeAppointment(appointmentId);
          } catch (aptErr) {
            console.warn(
              "Non-blocking appointment status completion warning:",
              aptErr,
            );
          }
        }
      } else if (appointmentId) {
        // No encounter exists, complete appointment directly
        try {
          await consultationApi.completeAppointment(appointmentId);
        } catch (aptErr) {
          console.warn(
            "Non-blocking appointment status completion warning:",
            aptErr,
          );
        }
      }

      const currentStoreState = consultationStoreActions.getState();
      if (currentStoreState.selectedAppointment) {
        consultationStoreActions.setAppointment({
          ...currentStoreState.selectedAppointment,
          status: "COMPLETED",
        });
      }
      if (currentStoreState.selectedConsultation) {
        consultationStoreActions.setConsultation({
          ...currentStoreState.selectedConsultation,
          status: "COMPLETED",
        });
      }
      consultationStoreActions.setStatus("COMPLETED");
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to finalize consultation";
      consultationStoreActions.setError(errorMessage);
      throw err;
    } finally {
      consultationStoreActions.setLoading(false);
    }
  },

  /**
   * Action: Load Full Consultation Details from unified workspace
   */
  loadFullConsultationDetails: async (
    targetId: string | number,
  ): Promise<Record<string, unknown> | null> => {
    consultationStoreActions.setLoading(true);
    try {
      let workspace: Record<string, unknown> | null = null;
      let realEncounterId = targetId;

      // 1. Try fetching workspace assuming targetId is encounterId
      try {
        workspace = await consultationApi.getWorkspace(targetId);
      } catch (err) {
        console.log(err);
        workspace = null;
      }

      // 2. Fallback: if workspace is null, targetId is likely an appointmentId. Resolve encounterId first.
      if (!workspace) {
        try {
          const encRes = await consultationApi.createEncounter(targetId);
          if (encRes?.encounterId) {
            realEncounterId = encRes.encounterId;
            workspace = await consultationApi.getWorkspace(realEncounterId);
          }
        } catch (err) {
          console.log(err);
          workspace = null;
        }
      }

      if (!workspace) return null;

      const pSub = (workspace.patient || {}) as Record<string, unknown>;
      const aSub = (workspace.appointment || {}) as Record<string, unknown>;
      const eSub = (workspace.encounter || {}) as Record<string, unknown>;
      const vSub = (workspace.vitals || {}) as Record<string, unknown>;

      const toStr = (v: unknown) => (v != null ? String(v) : "");

      const normalizedVitals: PatientVitals = {
        height: toStr(vSub.height),
        weight: toStr(vSub.weight),
        bmi: toStr(vSub.bmi),
        temp: toStr(vSub.temperature || vSub.temp),
        bp: toStr(vSub.bloodPressure || vSub.bp),
        pulse: toStr(vSub.pulse || vSub.heartRate),
        spo2: toStr(vSub.spo2 || vSub.oxygenSaturation),
        respiratoryRate: toStr(vSub.respiratoryRate || vSub.respRate),
        bloodSugar: toStr(vSub.bloodSugar || vSub.sugar),
      };

      // Hydrate Redux store
      if (eSub.encounterId) {
        consultationStoreActions.setEncounter(
          eSub as unknown as Parameters<
            typeof consultationStoreActions.setEncounter
          >[0],
        );
      }
      consultationStoreActions.setVitals(normalizedVitals);
      consultationStoreActions.setStatus("IN_CONSULTATION");

      return {
        encounter: eSub,
        patient: pSub,
        appointment: aSub,
        vitals: normalizedVitals,
        consultation: workspace,
      };
    } catch (err) {
      console.warn("loadFullConsultationDetails error:", err);
      return null;
    } finally {
      consultationStoreActions.setLoading(false);
    }
  },
};
