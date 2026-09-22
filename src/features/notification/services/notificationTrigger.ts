import { triggerInternalNotification } from "../api/notification.api";

function isEventAlreadyTriggered(eventId: string): boolean {
  try {
    const list = JSON.parse(
      localStorage.getItem("hms_triggered_notifications:v1") || "[]",
    );
    return list.includes(eventId);
  } catch (err) {
    console.log(err);
    return false;
  }
}

function markEventAsTriggered(eventId: string): void {
  try {
    const list = JSON.parse(
      localStorage.getItem("hms_triggered_notifications:v1") || "[]",
    );
    if (!list.includes(eventId)) {
      list.push(eventId);
      localStorage.setItem(
        "hms_triggered_notifications:v1",
        JSON.stringify(list),
      );
    }
  } catch (e) {
    console.error("[NotificationTrigger] Failed to save triggered event:", e);
  }
}

function getNotificationType(eventType: string): string {
  const et = String(eventType).toUpperCase();
  if (
    [
      "APPOINTMENT_CREATED_PATIENT",
      "APPOINTMENT_CREATED_DOCTOR",
      "APPOINTMENT_CREATED_ADMIN",
      "APPOINTMENT_RESCHEDULED",
      "APPOINTMENT_CANCELLED",
      "APPOINTMENT_NO_SHOW",
      "APPOINTMENT_REMINDER",
    ].includes(et)
  ) {
    return "APPOINTMENT";
  }
  if (et === "PRESCRIPTION_CREATED") {
    return "PRESCRIPTION";
  }
  if (
    [
      "INVOICE_GENERATED",
      "PAYMENT_COMPLETED",
      "PAYMENT_FAILED",
      "BILL_FINALIZED",
      "REFUND_PROCESSED",
    ].includes(et)
  ) {
    return "BILLING";
  }
  if (
    [
      "QUEUE_TOKEN_GENERATED",
      "PATIENT_CALLED",
      "PATIENT_CHECKED_IN",
      "PATIENT_SKIPPED",
    ].includes(et)
  ) {
    return "QUEUE";
  }
  if (["VITALS_COMPLETED", "VITALS_UPDATED"].includes(et)) {
    return "QUEUE";
  }
  if (
    [
      "CONSULTATION_STARTED",
      "CONSULTATION_COMPLETED",
      "FOLLOW_UP_RECOMMENDED",
    ].includes(et)
  ) {
    return "SYSTEM";
  }
  if (
    [
      "PATIENT_REGISTERED",
      "PATIENT_UPDATED_PATIENT",
      "PATIENT_UPDATED_ADMIN",
      "DOCTOR_SCHEDULE_UPDATED_DOCTOR",
      "DOCTOR_SCHEDULE_UPDATED_RECEPTIONIST",
      "DOCTOR_UNAVAILABLE",
    ].includes(et)
  ) {
    return "SYSTEM";
  }
  if (["FAILED_LOGINS", "ACCOUNT_LOCKED"].includes(et)) {
    return "CRITICAL_ALERT";
  }
  if (["QUEUE_WAITING_THRESHOLD_EXCEEDED"].includes(et)) {
    return "CRITICAL_ALERT";
  }
  return "SYSTEM";
}

function getSourceModule(eventType: string): string {
  const et = String(eventType).toUpperCase();
  if (
    [
      "PATIENT_REGISTERED",
      "PATIENT_UPDATED_PATIENT",
      "PATIENT_UPDATED_ADMIN",
    ].includes(et)
  ) {
    return "PATIENT";
  }
  if (
    [
      "DOCTOR_SCHEDULE_UPDATED_DOCTOR",
      "DOCTOR_SCHEDULE_UPDATED_RECEPTIONIST",
      "DOCTOR_UNAVAILABLE",
    ].includes(et)
  ) {
    return "DOCTOR";
  }
  if (
    [
      "APPOINTMENT_CREATED_PATIENT",
      "APPOINTMENT_CREATED_DOCTOR",
      "APPOINTMENT_CREATED_ADMIN",
      "APPOINTMENT_RESCHEDULED",
      "APPOINTMENT_CANCELLED",
      "APPOINTMENT_NO_SHOW",
      "APPOINTMENT_REMINDER",
    ].includes(et)
  ) {
    return "APPOINTMENT";
  }
  if (et === "PATIENT_CHECKED_IN") {
    return "RECEPTION";
  }
  if (
    [
      "QUEUE_TOKEN_GENERATED",
      "PATIENT_CALLED",
      "PATIENT_SKIPPED",
      "QUEUE_WAITING_THRESHOLD_EXCEEDED",
    ].includes(et)
  ) {
    return "QUEUE";
  }
  if (["VITALS_COMPLETED", "VITALS_UPDATED"].includes(et)) {
    return "QUEUE";
  }
  if (et === "PRESCRIPTION_CREATED") {
    return "PRESCRIPTION";
  }
  if (
    [
      "INVOICE_GENERATED",
      "PAYMENT_COMPLETED",
      "PAYMENT_FAILED",
      "BILL_FINALIZED",
      "REFUND_PROCESSED",
    ].includes(et)
  ) {
    return "BILLING";
  }
  if (
    [
      "CONSULTATION_STARTED",
      "CONSULTATION_COMPLETED",
      "FOLLOW_UP_RECOMMENDED",
    ].includes(et)
  ) {
    return "CONSULTATION";
  }
  if (["FAILED_LOGINS", "ACCOUNT_LOCKED"].includes(et)) {
    return "SECURITY";
  }
  return "SYSTEM";
}

export interface TriggerNotificationParams {
  eventId: string;
  title: string;
  message: string;
  module?: string;
  eventType: string;
  type?: string;
  priority?: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  referenceType?: string;
  referenceId?: string;
  actionLabel?: string;
  actionUrl?: string;
  receivers: Array<{
    role:
      | "Hospital Admin"
      | "Doctor"
      | "Receptionist"
      | "Accountant"
      | "Nurse"
      | "Patient Portal";
    userId?: number | string;
    messageOverride?: string;
    titleOverride?: string;
    eventTypeOverride?: string;
    typeOverride?: string;
    moduleOverride?: string;
  }>;
}

export async function triggerNotificationMatrix(
  params: TriggerNotificationParams,
): Promise<void> {
  if (isEventAlreadyTriggered(params.eventId)) {
    return;
  }

  const currentUser = (await import("../../auth")).useAuthStore.getState().user;
  const currentUserId = currentUser?.id;
  let anyDeliverySucceeded = false;

  await Promise.all(
    params.receivers.map(async (receiver) => {
      const title = receiver.titleOverride || params.title;
      const message = receiver.messageOverride || params.message;
      const priority = params.priority || "MEDIUM";

      const eventType = receiver.eventTypeOverride || params.eventType;
      const resolvedType =
        receiver.typeOverride || params.type || getNotificationType(eventType);
      const resolvedModule =
        receiver.moduleOverride || params.module || getSourceModule(eventType);

      if (
        receiver.userId !== undefined &&
        receiver.userId !== null &&
        String(receiver.userId) !== ""
      ) {
        if (
          currentUserId !== undefined &&
          String(receiver.userId) === String(currentUserId)
        ) {
          return;
        }
        try {
          await triggerInternalNotification({
            eventId: params.eventId,
            userId: receiver.userId,
            title,
            message,
            type: resolvedType,
            priority,
            referenceType: params.referenceType,
            referenceId: params.referenceId,
            sourceModule: resolvedModule,
            eventType: eventType,
            receiverRole: receiver.role,
            actionLabel: params.actionLabel,
            actionUrl: params.actionUrl,
          });
          anyDeliverySucceeded = true;
        } catch (err) {
          console.error(
            `[NotificationTrigger] Failed to send to specific user ${receiver.userId}:`,
            err,
          );
        }
      } else {
        console.warn(
          `[NotificationTrigger] Skipped role-based notification for "${receiver.role}" because recipient resolution requires /api/v1/admin/users.`,
        );
      }
    }),
  );

  if (anyDeliverySucceeded) {
    markEventAsTriggered(params.eventId);
  }
}
