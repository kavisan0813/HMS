import { triggerInternalNotification } from "../api/notification.api";
import { normalizeRole } from "./role.mapper";
import { usersApi } from "../../users/api/users.api";
import type { User } from "../../auth/types/auth.types";
import { queryClient } from "../../../lib/queryClient";

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

function isUserActive(user: User): boolean {
  if (!user || (!user.id && !(user as unknown as { userId?: number }).userId)) {
    return false;
  }
  if (!user.status) return true;
  const s = String(user.status).toUpperCase();
  return (
    s === "ACTIVE" ||
    s === "ENABLED" ||
    s === "VERIFIED"
  );
}

let cachedUsers: User[] | null = null;
let cacheExpiry = 0;

async function getActiveUsers(): Promise<User[]> {
  const now = Date.now();
  if (cachedUsers && now < cacheExpiry) {
    return cachedUsers;
  }
  try {
    const res = await usersApi.adminGetUsers();
    const list = Array.isArray(res?.data) ? res.data : [];
    cachedUsers = list;
    cacheExpiry = now + 30000;
    return list;
  } catch (err) {
    console.error("[NotificationTrigger] Failed to fetch users for role resolution:", err);
    return cachedUsers || [];
  }
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

interface ResolvedTarget {
  userId: number | string;
  role: string;
  title: string;
  message: string;
  eventType: string;
  resolvedType: string;
  resolvedModule: string;
  priority: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  actionLabel?: string;
  actionUrl?: string;
}

export async function triggerNotificationMatrix(
  params: TriggerNotificationParams,
): Promise<void> {
  if (isEventAlreadyTriggered(params.eventId)) {
    return;
  }

  const needsRoleResolution = params.receivers.some(
    (r) =>
      r.userId === undefined ||
      r.userId === null ||
      String(r.userId).trim() === "",
  );

  let activeUsers: User[] = [];
  if (needsRoleResolution) {
    activeUsers = await getActiveUsers();
  }

  const targetMap = new Map<string, ResolvedTarget>();

  for (const receiver of params.receivers) {
    const title = receiver.titleOverride || params.title;
    const message = receiver.messageOverride || params.message;
    const priority = params.priority || "MEDIUM";

    const eventType = receiver.eventTypeOverride || params.eventType;
    const resolvedType =
      receiver.typeOverride || params.type || getNotificationType(eventType);
    const resolvedModule =
      receiver.moduleOverride || params.module || getSourceModule(eventType);

    const hasSpecificUserId =
      receiver.userId !== undefined &&
      receiver.userId !== null &&
      String(receiver.userId).trim() !== "";

    if (hasSpecificUserId) {
      const uId = String(receiver.userId).trim();
      if (!targetMap.has(uId)) {
        targetMap.set(uId, {
          userId: receiver.userId!,
          role: receiver.role,
          title,
          message,
          eventType,
          resolvedType,
          resolvedModule,
          priority,
          actionLabel: params.actionLabel,
          actionUrl: params.actionUrl,
        });
      }
    } else {
      const targetNormalizedRole = normalizeRole(receiver.role);
      const matchingUsers = activeUsers.filter(
        (u) => isUserActive(u) && normalizeRole(u.role) === targetNormalizedRole,
      );

      for (const u of matchingUsers) {
        const uIdNum = u.id ?? (u as unknown as { userId?: number }).userId;
        if (uIdNum === undefined || uIdNum === null) continue;
        const uIdStr = String(uIdNum).trim();
        if (!targetMap.has(uIdStr)) {
          targetMap.set(uIdStr, {
            userId: uIdNum,
            role: receiver.role,
            title,
            message,
            eventType,
            resolvedType,
            resolvedModule,
            priority,
            actionLabel: params.actionLabel,
            actionUrl: params.actionUrl,
          });
        }
      }
    }
  }

  let anyDeliverySucceeded = false;
  const targets = Array.from(targetMap.values());

  await Promise.all(
    targets.map(async (target) => {
      try {
        await triggerInternalNotification({
          eventId: params.eventId,
          userId: target.userId,
          title: target.title,
          message: target.message,
          type: target.resolvedType,
          priority: target.priority,
          referenceType: params.referenceType,
          referenceId: params.referenceId,
          sourceModule: target.resolvedModule,
          eventType: target.eventType,
          receiverRole: target.role,
          actionLabel: target.actionLabel,
          actionUrl: target.actionUrl,
        });
        anyDeliverySucceeded = true;
      } catch (err) {
        console.error(
          `[NotificationTrigger] Failed to send notification to user ${target.userId} (${target.role}):`,
          err,
        );
      }
    }),
  );

  if (anyDeliverySucceeded) {
    markEventAsTriggered(params.eventId);
    queryClient.invalidateQueries({ queryKey: ["notifications"] });
  }
}
