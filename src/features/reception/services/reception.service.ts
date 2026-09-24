import { appointmentsApi } from "../../appointments/api/appointments.api";
import { receptionApi } from "../api/reception.api";
import type {
  ReceptionQueueItem,
  WalkInRegistrationPayload,
  ArrivalCheckInPayload,
  QueueStatus,
} from "../types/reception.types";

export interface CheckInResponseData {
  success: boolean;
  appointmentId: string | number;
  tokenNumber: string;
  queueNumber?: number;
  status: string;
  checkInTime: string;
  message?: string;
}

export const receptionService = {
  async fetchWorklist(params?: {
    date?: string;
    departmentId?: string;
    doctorId?: string;
    status?: string;
    search?: string;
  }): Promise<ReceptionQueueItem[]> {
    return receptionApi.getWorklist(params);
  },

  async fetchQueue(): Promise<ReceptionQueueItem[]> {
    return receptionApi.getReceptionQueue();
  },

  async checkInPatient(
    payloadOrId: ArrivalCheckInPayload | string | number,
  ): Promise<CheckInResponseData> {
    const appointmentId =
      (typeof payloadOrId === "object"
        ? payloadOrId.appointmentId || payloadOrId.queueItemId
        : payloadOrId) || "";
    try {
      // 1. Send PATCH check-in request to backend
      const patchRes = await receptionApi.patchCheckIn(appointmentId);

      // 2. Fetch token details from backend
      const tokenRes = await receptionApi.getAppointmentToken(appointmentId);
      const tokenNumber =
        tokenRes?.tokenNumber ||
        tokenRes?.token ||
        patchRes?.tokenNumber ||
        `TK-${String(appointmentId).slice(-4)}`;

      // 3. Update status to WAITING_FOR_VITALS via appointment status API
      await appointmentsApi.updateAppointmentStatus(
        appointmentId,
        "WAITING_FOR_VITALS",
      );

      // 4. Fetch queue position from backend worklist
      let queueNumber: number | undefined;
      try {
        const worklist = await receptionApi.getWorklist();
        const idx = worklist.findIndex(
          (item) =>
            item.appointmentId === appointmentId || item.id === appointmentId,
        );
        if (idx >= 0) {
          queueNumber = idx + 1;
        }
      } catch (err) {
        console.log(err);
        // queue position is optional
      }

      return {
        success: true,
        appointmentId,
        tokenNumber,
        queueNumber,
        status: "Waiting for Vitals",
        checkInTime: new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
      };
    } catch (error: unknown) {
      console.warn("[receptionService] Check-in service error:", error);

      if (error instanceof Error) {
        throw error;
      }

      return {
        success: true,
        appointmentId,
        tokenNumber: `TK-${100 + (window.crypto.getRandomValues(new Uint32Array(1))[0] % 900)}`,
        status: "Waiting for Vitals",
        checkInTime: new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
      };
    }
  },

  async updateStatus(
    appointmentId: string | number,
    status: QueueStatus,
  ): Promise<boolean> {
    return receptionApi.updateQueueStatus(appointmentId, status);
  },

  async getAppointmentToken(appointmentId: string | number): Promise<string> {
    const res = await receptionApi.getAppointmentToken(appointmentId);
    return (
      res?.tokenNumber || res?.token || `TK-${String(appointmentId).slice(-4)}`
    );
  },

  async registerWalkIn(
    payload: WalkInRegistrationPayload,
  ): Promise<ReceptionQueueItem> {
    return receptionApi.registerWalkIn(payload);
  },

  async transitionToVitals(appointmentId: string | number) {
    await appointmentsApi.updateAppointmentStatus(
      appointmentId,
      "WAITING_FOR_VITALS",
    );
  },

  async transitionToWaitingForDoctor(appointmentId: string | number) {
    await appointmentsApi.updateAppointmentStatus(
      appointmentId,
      "WAITING_FOR_DOCTOR_CALL",
    );
  },

  async transitionToCalled(appointmentId: string | number) {
    await appointmentsApi.updateAppointmentStatus(appointmentId, "CALLED");
  },

  async transitionToInConsultation(appointmentId: string | number) {
    await appointmentsApi.updateAppointmentStatus(
      appointmentId,
      "IN_CONSULTATION",
    );
  },

  async transitionToConsultationCompleted(appointmentId: string | number) {
    await appointmentsApi.updateAppointmentStatus(
      appointmentId,
      "CONSULTATION_COMPLETED",
    );
  },

  async transitionToCompleted(appointmentId: string | number) {
    await appointmentsApi.updateAppointmentStatus(appointmentId, "COMPLETED");
  },
};
