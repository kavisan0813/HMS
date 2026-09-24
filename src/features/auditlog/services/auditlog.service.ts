import { apiClient } from "../../../lib/axios";
import type {
  ApiEnvelope,
  AuditCategory,
  AuditDashboardData,
  AuditFilterOptions,
  AuditLogListParams,
  AuditMetric,
  AuditRecord,
  AuditSeverity,
  AuditWorkspace,
  DataChangesDashboard,
  DeletedRecordsDashboard,
  LoginHistoryDashboard,
  PaginatedData,
  RawActiveSession,
  RawAuditEvent,
  RawDataChangeLog,
  RawDeletedRecord,
  RawFailedAttempt,
  RawLockedAccount,
  RawLoginLog,
  RawSystemLog,
  SystemLogsDashboard,
  UserActivitiesDashboard,
} from "../types/auditlog.types";

const AUDIT_API = "/api/v1/admin/audit";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function unwrap<T>(response: { data: unknown }): T {
  const body = response.data;

  if (isRecord(body) && body.success === false) {
    throw new Error(
      typeof body.message === "string"
        ? body.message
        : "The audit service returned an unsuccessful response.",
    );
  }

  if (isRecord(body) && "data" in body) {
    return (body as unknown as ApiEnvelope<T>).data;
  }

  return body as T;
}

function unwrapPaginated<T>(response: { data: unknown }): PaginatedData<T> {
  const page = unwrap<unknown>(response);

  const content = Array.isArray(page)
    ? page
    : isRecord(page) && Array.isArray(page.content)
      ? page.content
      : isRecord(page) && Array.isArray(page.items)
        ? page.items
        : isRecord(page) && Array.isArray(page.records)
          ? page.records
          : isRecord(page) && Array.isArray(page.logs)
            ? page.logs
            : [];

  const pageObject = isRecord(page) ? page : undefined;

  return {
    content: content as T[],
    totalElements:
      typeof pageObject?.totalElements === "number"
        ? pageObject.totalElements
        : content.length,
    totalPages:
      typeof pageObject?.totalPages === "number"
        ? pageObject.totalPages
        : content.length
          ? 1
          : 0,
    size:
      typeof pageObject?.size === "number" ? pageObject.size : content.length,
    number: typeof pageObject?.number === "number" ? pageObject.number : 0,
    first:
      typeof pageObject?.first === "boolean" ? pageObject.first : undefined,
    last: typeof pageObject?.last === "boolean" ? pageObject.last : undefined,
    numberOfElements:
      typeof pageObject?.numberOfElements === "number"
        ? pageObject.numberOfElements
        : undefined,
  };
}

function buildQuery(params?: AuditLogListParams): string {
  if (!params) return "";

  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== "") {
      search.set(key, String(value));
    }
  }

  const query = search.toString();
  return query ? `?${query}` : "";
}

function asText(value: unknown): string {
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean")
    return String(value);
  return "";
}

function formatValue(value: unknown): string {
  if (value === null || value === undefined) return "";
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean")
    return String(value);

  try {
    return JSON.stringify(value);
  } catch (err) {
    console.log(err);
    return String(value);
  }
}

function normalizeSeverity(value: unknown): AuditSeverity {
  const severity = asText(value).trim().toUpperCase();
  if (severity === "CRITICAL" || severity === "ERROR") return "Critical";
  if (severity === "WARNING" || severity === "WARN") return "Warning";
  if (severity === "SUCCESS") return "Success";
  return "Information";
}

function normalizeStatus(value: unknown): string {
  const status = asText(value).trim();
  if (!status) return "Unknown";

  return status
    .toLowerCase()
    .split(/[_\s-]+/)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function normalizeCategory(
  value: unknown,
  fallback?: AuditCategory,
): AuditCategory {
  if (fallback && fallback !== "All Logs") return fallback;

  const category = asText(value)
    .toUpperCase()
    .replace(/[\s_-]/g, "");
  if (category.includes("CRITICAL") || category.includes("SECURITY")) {
    return "Critical Events";
  }
  if (category.includes("LOGIN") || category.includes("AUTH")) {
    return "Login History";
  }
  if (category.includes("USERACTIVITY") || category.includes("ACTIVITY")) {
    return "User Activities";
  }
  if (category.includes("DATACHANGE") || category.includes("UPDATE")) {
    return "Data Changes";
  }
  if (category.includes("DELETE") || category.includes("DELETION")) {
    return "Deleted Records";
  }
  if (category.includes("SYSTEM")) return "System Logs";

  return "User Activities";
}

function rawPayload(value: unknown): Record<string, unknown> | undefined {
  return isRecord(value) ? value : undefined;
}

function getUserName(
  user: { fullName?: string; userId?: string } | undefined,
  fallback = "—",
): string {
  return user?.fullName || user?.userId || fallback;
}

function getUserRole(user: { role?: string } | undefined): string {
  return user?.role || "—";
}

function getDepartment(
  metadata: Record<string, unknown> | undefined,
): string | undefined {
  const department = metadata?.department;
  return typeof department === "string" && department.trim()
    ? department
    : undefined;
}

function adaptAuditEvent(
  raw: RawAuditEvent,
  fallbackCategory?: AuditCategory,
): AuditRecord {
  const user = raw.user ?? raw.performedBy;
  const entity = raw.entity ?? {
    type: raw.entityType,
    id: raw.entityId,
  };
  const changes = Array.isArray(raw.changes)
    ? raw.changes.map((change) => ({
        field: change.field || "Changed field",
        before: formatValue(change.before),
        after: formatValue(change.after),
      }))
    : [];
  const firstChange = changes[0];

  return {
    id: raw.eventId,
    timestamp: raw.timestamp || "",
    category: normalizeCategory(raw.category, fallbackCategory),
    categoryCode: raw.category,
    module: raw.module || "—",
    user: getUserName(user),
    userId: user?.userId,
    userRole: getUserRole(user),
    department: getDepartment(raw.metadata),
    action: raw.action || raw.eventType || raw.title || "—",
    description:
      raw.description || raw.title || raw.action || raw.eventType || "",
    severity: normalizeSeverity(raw.severity),
    severityCode: raw.severity,
    status: normalizeStatus(raw.status),
    statusCode: raw.status,
    ipAddress: raw.ipAddress,
    device: raw.device,
    browser: raw.userAgent,
    userAgent: raw.userAgent,
    recordId: entity.id,
    recordType: entity.type,
    fieldChanged: firstChange?.field,
    oldValue: firstChange?.before,
    newValue: firstChange?.after,
    eventType: raw.eventType,
    requestId: raw.requestId,
    changes: changes.length ? changes : undefined,
    metadata: raw.metadata,
    raw: rawPayload(raw),
  };
}

function adaptLoginLog(raw: RawLoginLog): AuditRecord {
  const rawLogin = raw as RawLoginLog & {
    id?: string;
    timestamp?: string;
    userId?: string;
    userName?: string;
    role?: string;
    name?: string;
  };
  const user = rawLogin.user || {
    userId: rawLogin.userId,
    fullName: rawLogin.userName || rawLogin.name,
    role: rawLogin.role,
  };
  const loginTime = rawLogin.loginTime || rawLogin.timestamp || "";

  return {
    id: rawLogin.eventId || rawLogin.id || loginTime,
    timestamp: loginTime,
    category: "Login History",
    categoryCode: "LOGIN_HISTORY",
    module: "AUTH",
    user: getUserName(user),
    userId: user?.userId,
    userRole: getUserRole(user),
    action: raw.eventType || "LOGIN",
    description: raw.failureReason || raw.eventType || "",
    severity: normalizeSeverity(
      raw.status === "SUCCESS" ? "SUCCESS" : "WARNING",
    ),
    severityCode: raw.status === "SUCCESS" ? "SUCCESS" : "WARNING",
    status: normalizeStatus(raw.status),
    statusCode: raw.status,
    ipAddress: raw.ipAddress,
    device: raw.device,
    browser: raw.userAgent,
    userAgent: raw.userAgent,
    sessionId: raw.sessionId,
    loginTime,
    logoutTime: raw.logoutTime,
    authenticationMethod: raw.authenticationMethod,
    eventType: raw.eventType,
    requestId: raw.requestId,
    failureReason: raw.failureReason || undefined,
    failedAttemptCount: raw.failedAttemptCount,
    metadata: raw.location ? { location: raw.location } : undefined,
    raw: rawPayload(raw),
  };
}

function adaptDataChangeLog(raw: RawDataChangeLog): AuditRecord {
  const oldValue = formatValue(raw.oldValue);
  const newValue = formatValue(raw.newValue);

  return {
    id: raw.eventId,
    timestamp: raw.timestamp || "",
    category: "Data Changes",
    categoryCode: "DATA_CHANGES",
    module: raw.module || "—",
    user: getUserName(raw.modifiedBy),
    userId: raw.modifiedBy?.userId,
    userRole: getUserRole(raw.modifiedBy),
    action: raw.field ? "DATA_UPDATE" : "DATA_CHANGE",
    description: raw.field ? `Changed ${raw.field}` : "",
    severity: normalizeSeverity(raw.severity),
    severityCode: raw.severity,
    status: normalizeStatus(raw.status),
    statusCode: raw.status,
    recordId: raw.record?.id,
    recordType: raw.record?.type,
    fieldChanged: raw.field,
    oldValue,
    newValue,
    changes: raw.field
      ? [
          {
            field: raw.field,
            before: oldValue,
            after: newValue,
          },
        ]
      : undefined,
    raw: rawPayload(raw),
  };
}

function adaptDeletedRecord(raw: RawDeletedRecord): AuditRecord {
  return {
    id: raw.eventId,
    timestamp: raw.deletedAt || raw.timestamp || "",
    category: "Deleted Records",
    categoryCode: raw.category || "DELETION",
    module: raw.module || "—",
    user: getUserName(raw.deletedBy),
    userId: raw.deletedBy?.userId,
    userRole: getUserRole(raw.deletedBy),
    action: raw.action || "DELETE_RECORD",
    description: raw.reason || "",
    severity: normalizeSeverity(raw.severity),
    severityCode: raw.severity,
    status: normalizeStatus(raw.status),
    statusCode: raw.status,
    ipAddress: raw.ipAddress,
    recordId: raw.record?.id,
    recordType: raw.record?.type,
    deletionReason: raw.reason,
    requestId: raw.requestId,
    raw: rawPayload(raw),
  };
}

function adaptSystemLog(raw: RawSystemLog): AuditRecord {
  return {
    id: raw.eventId,
    timestamp: raw.timestamp || "",
    category: "System Logs",
    categoryCode: "SYSTEM_LOGS",
    module: raw.module || "—",
    user: "System",
    userRole: "SYSTEM",
    action: raw.event || "—",
    description: raw.description || "",
    severity: normalizeSeverity(raw.severity),
    severityCode: raw.severity,
    status: normalizeStatus(raw.status),
    statusCode: raw.status,
    systemEventCode: raw.eventId,
    requestId: raw.requestId,
    source: raw.source,
    service: raw.service,
    raw: rawPayload(raw),
  };
}

export async function fetchCriticalEvents(
  params?: AuditLogListParams,
): Promise<PaginatedData<AuditRecord>> {
  const response = await apiClient.get(
    `${AUDIT_API}/critical-events${buildQuery(params)}`,
  );
  const page = unwrapPaginated<RawAuditEvent>(response);
  return {
    ...page,
    content: page.content.map((event) =>
      adaptAuditEvent(event, "Critical Events"),
    ),
  };
}

export async function fetchAuditDashboard(
  fromDate?: string,
  toDate?: string,
): Promise<AuditDashboardData> {
  const response = await apiClient.get(
    `${AUDIT_API}/dashboard${buildQuery({ fromDate, toDate })}`,
  );
  return unwrap(response);
}

export async function fetchAuditFilterOptions(): Promise<AuditFilterOptions> {
  const response = await apiClient.get(`${AUDIT_API}/filter-options`);
  return unwrap(response);
}

export async function fetchMainAuditLogs(
  params?: AuditLogListParams,
): Promise<PaginatedData<AuditRecord>> {
  const response = await apiClient.get(
    `${AUDIT_API}/logs${buildQuery(params)}`,
  );
  const page = unwrapPaginated<RawAuditEvent>(response);
  return {
    ...page,
    content: page.content.map((event) => adaptAuditEvent(event)),
  };
}

async function fetchAuditEventDetail(eventId: string): Promise<AuditRecord> {
  const response = await apiClient.get(`${AUDIT_API}/logs/${eventId}`);
  return adaptAuditEvent(unwrap<RawAuditEvent>(response));
}

export async function fetchAuditMetrics(
  fromDate?: string,
  toDate?: string,
): Promise<AuditMetric[]> {
  const response = await apiClient.get(
    `${AUDIT_API}/metrics${buildQuery({ fromDate, toDate })}`,
  );
  const data = unwrap<AuditMetric[]>(response);
  return Array.isArray(data) ? data : [];
}

export async function fetchAuditWorkspaces(): Promise<AuditWorkspace[]> {
  const response = await apiClient.get(`${AUDIT_API}/workspaces`);
  const data = unwrap<AuditWorkspace[]>(response);
  return Array.isArray(data) ? data : [];
}

export async function fetchActiveSessions(
  params?: AuditLogListParams,
): Promise<PaginatedData<RawActiveSession>> {
  const response = await apiClient.get(
    `${AUDIT_API}/login-history/active-sessions${buildQuery(params)}`,
  );
  return unwrapPaginated(response);
}

export async function fetchLoginHistoryDashboard(
  fromDate?: string,
  toDate?: string,
): Promise<LoginHistoryDashboard> {
  const response = await apiClient.get(
    `${AUDIT_API}/login-history/dashboard${buildQuery({ fromDate, toDate })}`,
  );
  return unwrap(response);
}

export async function fetchFailedLoginAttempts(
  params?: AuditLogListParams,
): Promise<PaginatedData<RawFailedAttempt>> {
  const response = await apiClient.get(
    `${AUDIT_API}/login-history/failed-attempts${buildQuery(params)}`,
  );
  return unwrapPaginated(response);
}

export async function fetchLoginHistoryFilterOptions(): Promise<AuditFilterOptions> {
  const response = await apiClient.get(
    `${AUDIT_API}/login-history/filter-options`,
  );
  return unwrap(response);
}

export async function fetchLockedAccounts(
  params?: AuditLogListParams,
): Promise<PaginatedData<RawLockedAccount>> {
  const response = await apiClient.get(
    `${AUDIT_API}/login-history/locked-accounts${buildQuery(params)}`,
  );
  return unwrapPaginated(response);
}

export async function fetchLoginHistoryLogs(
  params?: AuditLogListParams,
): Promise<PaginatedData<AuditRecord>> {
  try {
    const response = await apiClient.get(
      `${AUDIT_API}/login-history/logs${buildQuery(params)}`,
    );
    const page = unwrapPaginated<RawLoginLog>(response);
    if (page.content.length > 0) {
      return { ...page, content: page.content.map(adaptLoginLog) };
    }
  } catch (error) {
    // Some backend deployments expose login events only through the main
    // audit stream. Try that stream before surfacing an empty workspace.
    try {
      const fallback = await fetchMainAuditLogs(params);
      const loginRecords = fallback.content.filter((record) => {
        const value =
          `${record.categoryCode || ""} ${record.module} ${record.action} ${record.eventType || ""}`.toUpperCase();
        return (
          record.category === "Login History" ||
          value.includes("LOGIN") ||
          value.includes("LOGOUT") ||
          value.includes("AUTH")
        );
      });
      return {
        ...fallback,
        content: loginRecords,
        totalElements: loginRecords.length,
        totalPages: loginRecords.length ? 1 : 0,
        numberOfElements: loginRecords.length,
      };
    } catch (err) {
      console.log(err);
      throw error;
    }
  }

  // The endpoint is available but returned no rows. Populate the workspace
  // from the main stream when that stream contains login/authentication rows.
  const fallback = await fetchMainAuditLogs(params);
  const loginRecords = fallback.content.filter((record) => {
    const value =
      `${record.categoryCode || ""} ${record.module} ${record.action} ${record.eventType || ""}`.toUpperCase();
    return (
      record.category === "Login History" ||
      value.includes("LOGIN") ||
      value.includes("LOGOUT") ||
      value.includes("AUTH")
    );
  });
  return {
    ...fallback,
    content: loginRecords,
    totalElements: loginRecords.length,
    totalPages: loginRecords.length ? 1 : 0,
    numberOfElements: loginRecords.length,
  };
}

async function fetchLoginEventDetail(eventId: string): Promise<AuditRecord> {
  const response = await apiClient.get(
    `${AUDIT_API}/login-history/logs/${eventId}`,
  );
  return adaptLoginLog(unwrap<RawLoginLog>(response));
}

export async function fetchUserActivitiesDashboard(
  fromDate?: string,
  toDate?: string,
): Promise<UserActivitiesDashboard> {
  const response = await apiClient.get(
    `${AUDIT_API}/user-activities/dashboard${buildQuery({ fromDate, toDate })}`,
  );
  return unwrap(response);
}

export async function fetchUserActivityLogs(
  params?: AuditLogListParams,
): Promise<PaginatedData<AuditRecord>> {
  const response = await apiClient.get(
    `${AUDIT_API}/user-activities/logs${buildQuery(params)}`,
  );
  const page = unwrapPaginated<RawAuditEvent>(response);
  return {
    ...page,
    content: page.content.map((event) =>
      adaptAuditEvent(event, "User Activities"),
    ),
  };
}

async function fetchUserActivityDetail(eventId: string): Promise<AuditRecord> {
  const response = await apiClient.get(
    `${AUDIT_API}/user-activities/logs/${eventId}`,
  );
  return adaptAuditEvent(unwrap<RawAuditEvent>(response), "User Activities");
}

export async function fetchDataChangesDashboard(
  fromDate?: string,
  toDate?: string,
): Promise<DataChangesDashboard> {
  const response = await apiClient.get(
    `${AUDIT_API}/data-changes/dashboard${buildQuery({ fromDate, toDate })}`,
  );
  return unwrap(response);
}

export async function fetchDataChangeLogs(
  params?: AuditLogListParams,
): Promise<PaginatedData<AuditRecord>> {
  const response = await apiClient.get(
    `${AUDIT_API}/data-changes/logs${buildQuery(params)}`,
  );
  const page = unwrapPaginated<RawDataChangeLog>(response);
  return { ...page, content: page.content.map(adaptDataChangeLog) };
}

async function fetchDataChangeDetail(eventId: string): Promise<AuditRecord> {
  const response = await apiClient.get(
    `${AUDIT_API}/data-changes/logs/${eventId}`,
  );
  return adaptAuditEvent(unwrap<RawAuditEvent>(response), "Data Changes");
}

export async function fetchDeletedRecordsDashboard(
  fromDate?: string,
  toDate?: string,
): Promise<DeletedRecordsDashboard> {
  const response = await apiClient.get(
    `${AUDIT_API}/deleted-records/dashboard${buildQuery({ fromDate, toDate })}`,
  );
  return unwrap(response);
}

export async function fetchDeletedRecordLogs(
  params?: AuditLogListParams,
): Promise<PaginatedData<AuditRecord>> {
  const response = await apiClient.get(
    `${AUDIT_API}/deleted-records/logs${buildQuery(params)}`,
  );
  const page = unwrapPaginated<RawDeletedRecord>(response);
  return { ...page, content: page.content.map(adaptDeletedRecord) };
}

async function fetchDeletedRecordDetail(eventId: string): Promise<AuditRecord> {
  const response = await apiClient.get(
    `${AUDIT_API}/deleted-records/logs/${eventId}`,
  );
  return adaptDeletedRecord(unwrap<RawDeletedRecord>(response));
}

export async function fetchSystemLogsDashboard(
  fromDate?: string,
  toDate?: string,
): Promise<SystemLogsDashboard> {
  const response = await apiClient.get(
    `${AUDIT_API}/system-logs/dashboard${buildQuery({ fromDate, toDate })}`,
  );
  return unwrap(response);
}

export async function fetchSystemLogLogs(
  params?: AuditLogListParams,
): Promise<PaginatedData<AuditRecord>> {
  const response = await apiClient.get(
    `${AUDIT_API}/system-logs/logs${buildQuery(params)}`,
  );
  const page = unwrapPaginated<RawSystemLog>(response);
  return { ...page, content: page.content.map(adaptSystemLog) };
}

async function fetchSystemLogDetail(eventId: string): Promise<AuditRecord> {
  const response = await apiClient.get(
    `${AUDIT_API}/system-logs/logs/${eventId}`,
  );
  return adaptSystemLog(unwrap<RawSystemLog>(response));
}

export async function fetchAuditRecordDetail(
  eventId: string,
  category: AuditCategory = "All Logs",
): Promise<AuditRecord> {
  switch (category) {
    case "Login History":
      return fetchLoginEventDetail(eventId);
    case "User Activities":
      return fetchUserActivityDetail(eventId);
    case "Data Changes":
      return fetchDataChangeDetail(eventId);
    case "Deleted Records":
      return fetchDeletedRecordDetail(eventId);
    case "System Logs":
      return fetchSystemLogDetail(eventId);
    default:
      return fetchAuditEventDetail(eventId);
  }
}
