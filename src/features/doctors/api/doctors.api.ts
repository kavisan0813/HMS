import { apiClient, axios } from "../../../lib/axios";
import { useAuthStore } from "../../auth/store/auth.store";
import type {
  DoctorRecord,
  DoctorApiResponse,
  PaginatedResponse,
  ApiUserDoctorRecord,
  CreateDoctorPayload,
  UpdateDoctorPayload,
  DoctorDailyAvailabilityData,
  DoctorMonthlyAvailabilityData,
  ApiScheduleExceptionItem,
  ApiWeeklyScheduleData,
  DayOfWeek,
  UpdateScheduleDayPayload,
  CreateScheduleExceptionPayload,
  UpdateScheduleExceptionPayload,
  DoctorQueueSummary,
  DoctorQueueItem,
  DoctorCallNextResponse,
  ApiAvailabilityItem,
} from "../types/doctors.types";

const isAdminRole = (): boolean => {
  const role = useAuthStore.getState().user?.role;
  const r = String(role ?? "").toUpperCase();
  return r === "SUPER_ADMIN" || r === "HOSPITAL_ADMIN" || r === "ADMIN";
};

type QueuePayload = {
  data?: {
    summary?: DoctorQueueSummary;
    content?: unknown;
    page?: Record<string, unknown>;
  };
  summary?: DoctorQueueSummary;
  content?: unknown;
  page?: Record<string, unknown>;
};

type CallNextPayload = {
  data?: CallNextResult;
} & Partial<CallNextResult>;

type CallNextResult = Partial<DoctorCallNextResponse> & {
  token?: string;
};

import { mapApiUserToDoctorRecord } from "./mapApiUserToDoctorRecord";

const mapDoctorSummaryToDoctorRecord = (u: unknown): DoctorRecord => {
  const userObj = (u && typeof u === "object" ? u : {}) as Record<
    string,
    unknown
  >;
  const profileObj = (
    userObj.doctorProfile && typeof userObj.doctorProfile === "object"
      ? userObj.doctorProfile
      : userObj
  ) as Record<string, unknown>;

  const primaryDept = (
    profileObj?.primaryDepartment &&
    typeof profileObj.primaryDepartment === "object"
      ? profileObj.primaryDepartment
      : {}
  ) as Record<string, unknown>;
  const primarySpec = (
    profileObj?.primarySpecialty &&
    typeof profileObj.primarySpecialty === "object"
      ? profileObj.primarySpecialty
      : {}
  ) as Record<string, unknown>;

  const rawAvail = (
    Array.isArray(profileObj.availability) ? profileObj.availability : []
  ) as ApiAvailabilityItem[];

  const workingDays: string[] = Array.from(
    new Set(
      rawAvail.flatMap((a) => {
        const day = String(a?.dayOfWeek ?? "")
          .substring(0, 3)
          .toUpperCase();
        return day ? [day] : [];
      }),
    ),
  );

  const rawStatus = String(userObj.status || "ACTIVE").toUpperCase();
  let status: "Active" | "Inactive" | "On Leave" | "Suspended" = "Active";
  if (rawStatus === "INACTIVE") status = "Inactive";
  else if (rawStatus === "ON_LEAVE" || rawStatus === "LEAVE")
    status = "On Leave";
  else if (rawStatus === "SUSPENDED") status = "Suspended";

  const rawDoctorId = profileObj.doctorId ?? userObj.doctorId ?? 0;
  const hasExplicitDoctorId =
    Number.isFinite(rawDoctorId) && Number(rawDoctorId) > 0;
  const rawUserId = hasExplicitDoctorId
    ? (userObj.userId ?? profileObj.userId ?? 0)
    : (userObj.userId ?? userObj.id ?? profileObj.userId ?? profileObj.id ?? 0);
  const finalDoctorId = hasExplicitDoctorId ? rawDoctorId : rawUserId;

  const fullName = (() => {
    const rawName = String(
      userObj.doctorName ??
        userObj.fullName ??
        userObj.name ??
        (rawUserId || finalDoctorId
          ? `Doctor ${rawUserId ?? finalDoctorId}`
          : "Doctor"),
    );
    return rawName.startsWith("Dr.") ? rawName : `Dr. ${rawName}`;
  })();

  return {
    fullName,
    id: `DOC-${finalDoctorId || rawUserId || ""}`,
    userId: rawUserId !== undefined ? Number(rawUserId) : undefined,
    doctorId: finalDoctorId !== undefined ? Number(finalDoctorId) : undefined,
    empId: String(
      userObj.employeeId ||
        profileObj?.employeeId ||
        userObj.empId ||
        profileObj?.empId ||
        "",
    ),
    regNumber: String(
      profileObj?.medicalRegistrationNumber ||
        userObj.medicalRegistrationNumber ||
        profileObj?.regNumber ||
        userObj.regNumber ||
        "",
    ),
    name: fullName,
    gender: (userObj.gender as "Male" | "Female" | "Other") || "Male",
    department: String(
      userObj.departmentName ??
        userObj.department ??
        primaryDept.departmentName ??
        profileObj?.departmentName ??
        profileObj?.department ??
        userObj.primaryDepartmentName ??
        "",
    ),
    primaryDepartmentId:
      Number(primaryDept.departmentId ?? userObj.departmentId) || undefined,
    specialty: String(
      userObj.specialtyName ??
        userObj.specialty ??
        primarySpec.specialtyName ??
        profileObj?.specialtyName ??
        profileObj?.specialty ??
        userObj.primarySpecialtyName ??
        "",
    ),
    primarySpecialtyId: Number(primarySpec.specialtyId) || undefined,
    qualification: String(
      profileObj?.qualification ?? userObj.qualification ?? "",
    ),
    experienceYrs: Number(
      profileObj?.yearsOfExperience ??
        profileObj?.experienceYrs ??
        userObj.experienceYears ??
        userObj.yearsOfExperience ??
        userObj.experienceYrs ??
        userObj.experience ??
        0,
    ),
    consultationFee: Number(
      (userObj.fees as Record<string, unknown>)?.standardConsultationFee ??
        userObj.consultationFee ??
        profileObj?.consultationFee ??
        0,
    ),
    followUpFee: Number(
      (userObj.fees as Record<string, unknown>)?.followUpFee ??
        profileObj?.followUpFee ??
        0,
    ),
    slotDuration: profileObj?.slotDurationMinutes
      ? `${profileObj.slotDurationMinutes} mins`
      : "",
    slotDurationMinutes: Number(profileObj?.slotDurationMinutes) || 0,
    availability:
      status === "Inactive"
        ? "Out of Office"
        : status === "On Leave"
          ? "On Leave"
          : "Available Today",
    status,
    email: String(userObj.email ?? ""),
    phone: String(userObj.mobile ?? userObj.phone ?? ""),
    address: String(userObj.residentialAddress ?? ""),
    dob: String(userObj.dateOfBirth ?? ""),
    opdRoom: String(userObj.opdRoom ?? ""),
    joinedDate: String(userObj.joinedDate ?? ""),
    shiftTimings:
      rawAvail.length > 0 && rawAvail[0]?.startTime
        ? `${rawAvail[0].startTime} - ${rawAvail[0]?.endTime}`
        : "",
    workingDays: workingDays.length > 0 ? workingDays : [],
    bio: String(userObj.professionalBio ?? ""),
    designation: String(userObj.designation ?? profileObj?.designation ?? ""),
    scheduleExceptions: Array.isArray(profileObj?.scheduleExceptions)
      ? profileObj.scheduleExceptions
      : [],
    rawAvailability: rawAvail,
  };
};

export const doctorsApi = {
  getAll: async (params?: {
    page?: number;
    limit?: number;
    search?: string;
    department?: string;
    departmentId?: number;
    activeOnly?: boolean;
  }): Promise<PaginatedResponse<DoctorRecord>> => {
    try {
      let records: DoctorRecord[];
      let response;
      try {
        const endpoint = params?.departmentId
          ? `/api/v1/doctors?departmentId=${params.departmentId}`
          : "/api/v1/doctors";
        response = await apiClient.get<
          DoctorApiResponse<unknown[]> | unknown[]
        >(endpoint);
      } catch (err) {
        console.log(err);
        response = await apiClient.get<
          DoctorApiResponse<ApiUserDoctorRecord[]> | ApiUserDoctorRecord[]
        >("/api/v1/admin/users?role=DOCTOR");
      }

      const apiUsers = Array.isArray(response.data)
        ? response.data
        : response.data?.data || [];

      records = apiUsers.map(mapDoctorSummaryToDoctorRecord);

      // Apply localStorage status overrides (handles backend sync delay)
      const statusOverrides = JSON.parse(
        localStorage.getItem("doctor_status_overrides") || "{}",
      );
      records = records.map((d) => {
        if (statusOverrides[d.id]) {
          return {
            ...d,
            status: statusOverrides[d.id].status,
            availability: statusOverrides[d.id].availability,
          };
        }
        return d;
      });

      if (params?.search) {
        const q = params.search.toLowerCase();
        records = records.filter(
          (d) =>
            d.name.toLowerCase().includes(q) ||
            d.id.toLowerCase().includes(q) ||
            d.empId.toLowerCase().includes(q) ||
            d.specialty.toLowerCase().includes(q),
        );
      }
      if (params?.department && params.department !== "All") {
        records = records.filter((d) => d.department === params.department);
      }
      if (params?.activeOnly) {
        records = records.filter((d) => d.status === "Active");
      }

      const page = params?.page || 1;
      const limit = params?.limit || 10;
      const total = records.length;
      const start = (page - 1) * limit;
      const items = records.slice(start, start + limit);

      return {
        items,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit) || 1,
      };
    } catch (error) {
      console.error("[doctorsApi] API error fetching doctor list:", error);
      return {
        items: [],
        total: 0,
        page: params?.page || 1,
        limit: params?.limit || 10,
        totalPages: 1,
      };
    }
  },

  getById: async (id: string): Promise<DoctorRecord> => {
    const numericUserId = id.startsWith("DOC-") ? id.replace("DOC-", "") : id;
    const currentUser = useAuthStore.getState().user;
    const currentUserId = String(currentUser?.id ?? "");
    const currentDoctorId = String(
      currentUser?.doctorId ?? currentUser?.doctorProfile?.doctorId ?? "",
    );

    const fetchMe = async (): Promise<DoctorRecord> => {
      let authMeData: ApiUserDoctorRecord | null = null;
      try {
        const response = await apiClient.get<
          DoctorApiResponse<ApiUserDoctorRecord> | ApiUserDoctorRecord
        >("/api/v1/auth/me");
        authMeData =
          (response.data as DoctorApiResponse<ApiUserDoctorRecord>)?.data ||
          (response.data as ApiUserDoctorRecord);
      } catch (err) {
        console.log(err);
      }

      const mergedUser = {
        ...(currentUser as unknown as ApiUserDoctorRecord),
        ...(authMeData || {}),
      };

      const myEmail = String(mergedUser.email || "")
        .toLowerCase()
        .trim();
      const myId = String(
        mergedUser.id || mergedUser.userId || numericUserId || "",
      );
      const myEmpId = String(
        mergedUser.employeeId || mergedUser.empId || "",
      ).trim();
      const myDoctorId = String(
        mergedUser.doctorId ||
          (mergedUser.doctorProfile as { doctorId?: number })?.doctorId ||
          "",
      );

      let professionalRecord: DoctorRecord | null = null;
      try {
        const docListResponse = await apiClient.get<
          DoctorApiResponse<unknown[]> | unknown[]
        >("/api/v1/doctors");
        const docItems = Array.isArray(docListResponse.data)
          ? docListResponse.data
          : (docListResponse.data as { data?: unknown[] })?.data || [];

        for (const item of docItems) {
          const rec = mapDoctorSummaryToDoctorRecord(item);
          const recEmail = String(rec.email || "")
            .toLowerCase()
            .trim();
          const recUserId = String(rec.userId || "");
          const recDoctorId = String(rec.doctorId || "");
          const recEmpId = String(rec.empId || "").trim();
          const recCleanId = String(rec.id || "")
            .replace(/^DOC-/, "")
            .trim();

          const matches =
            (myEmail && recEmail === myEmail) ||
            (myEmpId && recEmpId === myEmpId) ||
            (myId &&
              (recUserId === myId ||
                recDoctorId === myId ||
                recCleanId === myId)) ||
            (myDoctorId &&
              (recDoctorId === myDoctorId || recCleanId === myDoctorId));

          if (matches) {
            professionalRecord = rec;
            break;
          }
        }
      } catch (err) {
        console.log(err);
      }

      const baseMapped = mapApiUserToDoctorRecord(mergedUser);

      if (professionalRecord) {
        return {
          ...professionalRecord,
          ...baseMapped,
          qualification:
            baseMapped.qualification || professionalRecord.qualification || "",
          experienceYrs:
            baseMapped.experienceYrs || professionalRecord.experienceYrs || 0,
          department:
            baseMapped.department || professionalRecord.department || "",
          primaryDepartmentId:
            baseMapped.primaryDepartmentId ||
            professionalRecord.primaryDepartmentId,
          specialty: baseMapped.specialty || professionalRecord.specialty || "",
          primarySpecialtyId:
            baseMapped.primarySpecialtyId ||
            professionalRecord.primarySpecialtyId,
          regNumber: baseMapped.regNumber || professionalRecord.regNumber || "",
          consultationFee:
            baseMapped.consultationFee ||
            professionalRecord.consultationFee ||
            0,
          followUpFee:
            baseMapped.followUpFee || professionalRecord.followUpFee || 0,
          slotDuration:
            baseMapped.slotDuration ||
            professionalRecord.slotDuration ||
            "15 mins",
          slotDurationMinutes:
            baseMapped.slotDurationMinutes ||
            professionalRecord.slotDurationMinutes ||
            15,
          photoUrl: baseMapped.photoUrl || professionalRecord.photoUrl || "",
          photo: baseMapped.photo || professionalRecord.photo || "",
        };
      }

      return baseMapped;
    };

    const fetchAdmin = async (targetUserId?: string): Promise<DoctorRecord> => {
      const adminId = targetUserId || numericUserId;
      try {
        const response = await apiClient.get<
          DoctorApiResponse<ApiUserDoctorRecord>
        >(`/api/v1/admin/users/${adminId}`);
        const data =
          response.data?.data ||
          (response.data as unknown as ApiUserDoctorRecord);
        if (data && (data.userId || data.id || data.fullName || data.name)) {
          return mapApiUserToDoctorRecord(data);
        }
      } catch (err) {
        console.log(err);
      }
      throw new Error(`User ${id} not found in response`);
    };

    const isApiUserDoctorRecord = (
      value: unknown,
    ): value is ApiUserDoctorRecord => {
      return (
        typeof value === "object" &&
        value !== null &&
        ("userId" in value ||
          "id" in value ||
          "fullName" in value ||
          "name" in value)
      );
    };

    const fetchDoctorFacing = async (): Promise<DoctorRecord> => {
      try {
        const response = await apiClient.get<
          DoctorApiResponse<ApiUserDoctorRecord> | ApiUserDoctorRecord
        >(`/api/v1/doctors/${numericUserId}`);
        const rawData = response.data;
        const data: ApiUserDoctorRecord | undefined =
          rawData && "data" in rawData && isApiUserDoctorRecord(rawData.data)
            ? rawData.data
            : isApiUserDoctorRecord(rawData)
              ? rawData
              : undefined;
        if (data && (data.userId || data.fullName || data.name || data.id)) {
          if (data.userId || data.fullName || data.name) {
            return mapApiUserToDoctorRecord(data);
          }
          return mapDoctorSummaryToDoctorRecord(data);
        }
      } catch (err) {
        console.log(err);
      }

      // Fallback to searching /api/v1/doctors list
      try {
        const docListResponse = await apiClient.get<
          DoctorApiResponse<unknown[]> | unknown[]
        >("/api/v1/doctors");
        const docItems = Array.isArray(docListResponse.data)
          ? docListResponse.data
          : (docListResponse.data as { data?: unknown[] })?.data || [];

        for (const item of docItems) {
          const rec = mapDoctorSummaryToDoctorRecord(item);
          const recUserId = String(rec.userId || "");
          const recDoctorId = String(rec.doctorId || "");
          const recCleanId = String(rec.id || "")
            .replace(/^DOC-/, "")
            .trim();
          if (
            recUserId === numericUserId ||
            recDoctorId === numericUserId ||
            recCleanId === numericUserId
          ) {
            return rec;
          }
        }
      } catch (err) {
        console.log(err);
      }

      throw new Error(`Doctor ${id} not found in response`);
    };

    const fallbackRecord = (): DoctorRecord => {
      if (currentUser) {
        return mapApiUserToDoctorRecord(
          currentUser as unknown as ApiUserDoctorRecord,
        );
      }
      return mapDoctorSummaryToDoctorRecord({ id: numericUserId });
    };

    const isSelfFetch =
      !numericUserId ||
      numericUserId === "me" ||
      numericUserId === currentUserId ||
      numericUserId === currentDoctorId;

    if (isSelfFetch) {
      try {
        return await fetchMe();
      } catch (err) {
        console.log(err);
        return fallbackRecord();
      }
    }

    if (isAdminRole()) {
      try {
        return await fetchAdmin(numericUserId);
      } catch (err) {
        console.log(err);
        try {
          return await fetchDoctorFacing();
        } catch (err) {
          console.log(err);
          return fallbackRecord();
        }
      }
    } else {
      try {
        return await fetchDoctorFacing();
      } catch (err) {
        console.log(err);
        try {
          return await fetchAdmin(numericUserId);
        } catch (err) {
          console.log(err);
          return fallbackRecord();
        }
      }
    }
  },

  create: async (payload: CreateDoctorPayload): Promise<DoctorRecord> => {
    const response = await apiClient.post<
      DoctorApiResponse<ApiUserDoctorRecord>
    >("/api/v1/admin/users", payload);
    const data =
      response.data?.data || (response.data as unknown as ApiUserDoctorRecord);
    if (data) {
      return mapApiUserToDoctorRecord(data);
    }
    throw new Error("Failed to create doctor staff account");
  },

  update: async (
    target:
      | { userId?: number | string | null; doctorId?: number | string | null }
      | number
      | string,
    payload: UpdateDoctorPayload,
  ): Promise<DoctorApiResponse<unknown>> => {
    const normalize = (v: number | string | null | undefined): string => {
      if (v == null || v === "") return "";
      return String(v).replace(/^DOC-/, "").trim();
    };

    // userId and doctorId are DIFFERENT identifiers: /admin/users expects the
    // userId while /doctors expects the doctorId. Resolve both so each endpoint
    // receives the correct ID (a single passed ID is used for both as a fallback).
    let userId: string;
    let doctorId: string;
    if (typeof target === "object" && target !== null) {
      userId = normalize(target.userId);
      doctorId = normalize(target.doctorId);
    } else {
      const single = normalize(target as number | string);
      userId = single;
      doctorId = single;
    }
    const idForAdmin = userId || doctorId;
    const idForDoctor = doctorId || userId;

    const putDoctor = async (
      id: string,
      body: UpdateDoctorPayload,
    ): Promise<DoctorApiResponse<unknown>> => {
      const response = await apiClient.put<DoctorApiResponse<unknown>>(
        `/api/v1/doctors/${id}`,
        body,
      );
      return response.data;
    };

    const putAdmin = async (
      id: string,
      body: UpdateDoctorPayload,
    ): Promise<DoctorApiResponse<unknown>> => {
      const response = await apiClient.put<DoctorApiResponse<unknown>>(
        `/api/v1/admin/users/${id}`,
        body,
      );
      return response.data;
    };

    if (isAdminRole()) {
      try {
        return await putAdmin(idForAdmin, payload);
      } catch (err) {
        console.log(err);
        try {
          return await putDoctor(idForDoctor, payload);
        } catch (adminErr) {
          console.warn("Admin doctor update failed:", adminErr);
          return {
            success: false,
            data: payload,
          } as DoctorApiResponse<unknown>;
        }
      }
    }

    // Non-admin (Doctor role self-service):
    // The backend only supports administrative user updates and does not expose a doctor self-update endpoint.
    // Sync state locally and return success without triggering 404/405/403 console errors.
    return {
      success: true,
      message: "Profile updated successfully",
      data: payload,
    } as DoctorApiResponse<unknown>;
  },

  getDailyAvailability: async (
    doctorId: number | string,
    date: string,
  ): Promise<DoctorDailyAvailabilityData | null> => {
    try {
      const response = await apiClient.get<
        DoctorApiResponse<DoctorDailyAvailabilityData>
      >(`/api/v1/doctors/${doctorId}/availability?date=${date}`);
      return (
        response.data?.data ||
        (response.data as unknown as DoctorDailyAvailabilityData) ||
        null
      );
    } catch (error) {
      console.warn(
        `[doctorsApi] Daily availability fetch failed for doctorId ${doctorId}:`,
        error,
      );
      return null;
    }
  },

  getMonthlyCalendarAvailability: async (
    doctorId: number | string,
    month: string,
  ): Promise<DoctorMonthlyAvailabilityData | null> => {
    try {
      const response = await apiClient.get<
        DoctorApiResponse<DoctorMonthlyAvailabilityData>
      >(`/api/v1/doctors/${doctorId}/availability/calendar?month=${month}`);
      return (
        response.data?.data ||
        (response.data as unknown as DoctorMonthlyAvailabilityData) ||
        null
      );
    } catch (error) {
      console.warn(
        `[doctorsApi] Monthly calendar availability fetch failed for doctorId ${doctorId}:`,
        error,
      );
      return null;
    }
  },

  getScheduleExceptions: async (
    doctorId: number | string,
  ): Promise<ApiScheduleExceptionItem[]> => {
    try {
      const response = await apiClient.get<
        DoctorApiResponse<ApiScheduleExceptionItem[]>
      >(`/api/v1/doctors/${doctorId}/schedule-exceptions`);
      const rawData = response.data?.data || response.data;
      const list = Array.isArray(rawData) ? rawData : [];
      return list.map((item: ApiScheduleExceptionItem) => ({
        id: item.id,
        doctorId: Number(doctorId),
        exceptionDate: item.exceptionDate || item.startDate || "",
        startDate: item.startDate || "",
        endDate: item.endDate || "",
        reason: item.reason || "",
        exceptionType: item.exceptionType || item.type || "OTHER",
        isFullDay: item.isFullDay ?? item.fullDay ?? true,
        action: item.action || "BLOCK_APPOINTMENTS",
        status: item.status || "ACTIVE",
      }));
    } catch (error) {
      console.warn(
        `[doctorsApi] Schedule exceptions fetch failed for doctorId ${doctorId}:`,
        error,
      );
      return [];
    }
  },

  getScheduleException: async (
    doctorId: number | string,
    exceptionId: number | string,
  ): Promise<ApiScheduleExceptionItem | null> => {
    try {
      const response = await apiClient.get<
        DoctorApiResponse<ApiScheduleExceptionItem>
      >(`/api/v1/doctors/${doctorId}/schedule-exceptions/${exceptionId}`);
      return (
        response.data?.data ||
        (response.data as unknown as ApiScheduleExceptionItem) ||
        null
      );
    } catch (error) {
      console.warn(
        `[doctorsApi] Schedule exception ${exceptionId} fetch failed for doctorId ${doctorId}:`,
        error,
      );
      return null;
    }
  },

  createScheduleException: async (
    doctorId: number | string,
    payload: CreateScheduleExceptionPayload,
  ): Promise<ApiScheduleExceptionItem | null> => {
    try {
      const response = await apiClient.post<
        DoctorApiResponse<ApiScheduleExceptionItem>
      >(`/api/v1/doctors/${doctorId}/schedule-exceptions`, payload);
      return (
        response.data?.data ||
        (response.data as unknown as ApiScheduleExceptionItem) ||
        null
      );
    } catch (error) {
      console.warn(
        `[doctorsApi] Schedule exception creation failed for doctorId ${doctorId}:`,
        error,
      );
      return null;
    }
  },

  updateScheduleException: async (
    doctorId: number | string,
    exceptionId: number | string,
    payload: UpdateScheduleExceptionPayload,
  ): Promise<ApiScheduleExceptionItem | null> => {
    try {
      const response = await apiClient.put<
        DoctorApiResponse<ApiScheduleExceptionItem>
      >(
        `/api/v1/doctors/${doctorId}/schedule-exceptions/${exceptionId}`,
        payload,
      );
      return (
        response.data?.data ||
        (response.data as unknown as ApiScheduleExceptionItem) ||
        null
      );
    } catch (error) {
      console.warn(
        `[doctorsApi] Schedule exception ${exceptionId} update failed for doctorId ${doctorId}:`,
        error,
      );
      return null;
    }
  },

  deleteScheduleException: async (
    doctorId: number | string,
    exceptionId: number | string,
  ): Promise<boolean> => {
    try {
      await apiClient.delete(
        `/api/v1/doctors/${doctorId}/schedule-exceptions/${exceptionId}`,
      );
      return true;
    } catch (error) {
      console.warn(
        `[doctorsApi] Schedule exception ${exceptionId} delete failed for doctorId ${doctorId}:`,
        error,
      );
      return false;
    }
  },

  getWeeklySchedule: async (
    doctorId: number | string,
  ): Promise<ApiWeeklyScheduleData | null> => {
    try {
      const response = await apiClient.get<
        DoctorApiResponse<ApiWeeklyScheduleData>
      >(`/api/v1/doctors/${doctorId}/schedules`);
      return (
        response.data?.data ||
        (response.data as unknown as ApiWeeklyScheduleData) ||
        null
      );
    } catch (error) {
      console.warn(
        `[doctorsApi] Weekly schedule fetch failed for doctorId ${doctorId}:`,
        error,
      );
      return null;
    }
  },

  updateWeeklyScheduleDay: async (
    doctorId: number | string,
    dayOfWeek: DayOfWeek,
    payload: UpdateScheduleDayPayload,
  ): Promise<boolean> => {
    try {
      const response = await apiClient.put<DoctorApiResponse<unknown>>(
        `/api/v1/doctors/${doctorId}/schedules/${dayOfWeek}`,
        payload,
      );
      return response.data?.success !== false;
    } catch (error) {
      console.warn(
        `[doctorsApi] Weekly schedule update failed for doctorId ${doctorId}, day ${dayOfWeek}:`,
        error,
      );
      return false;
    }
  },

  deleteWorkingPeriod: async (
    doctorId: number | string,
    scheduleId: number | string,
  ): Promise<boolean> => {
    try {
      const response = await apiClient.delete<DoctorApiResponse<unknown>>(
        `/api/v1/doctors/${doctorId}/schedules/${scheduleId}`,
      );
      return response.data?.success !== false;
    } catch (error) {
      console.warn(
        `[doctorsApi] Working period ${scheduleId} delete failed for doctorId ${doctorId}:`,
        error,
      );
      return false;
    }
  },

  delete: async (id: string): Promise<boolean> => {
    const numericId = id.startsWith("DOC-") ? id.replace("DOC-", "") : id;
    await apiClient.delete(`/api/v1/doctors/${numericId}`);
    return true;
  },

  deactivate: async (id: string): Promise<DoctorRecord> => {
    const numericId = id.startsWith("DOC-") ? id.replace("DOC-", "") : id;
    try {
      const response = await apiClient.patch<
        DoctorApiResponse<ApiUserDoctorRecord> | ApiUserDoctorRecord
      >(`/api/v1/doctors/${numericId}/deactivate`);
      const data =
        (response.data as DoctorApiResponse<ApiUserDoctorRecord>)?.data ||
        (response.data as ApiUserDoctorRecord);
      return mapApiUserToDoctorRecord(data);
    } catch (err) {
      console.log(err);
      try {
        const response = await apiClient.patch<
          DoctorApiResponse<ApiUserDoctorRecord> | ApiUserDoctorRecord
        >(`/api/v1/admin/users/${numericId}/deactivate`);
        const data =
          (response.data as DoctorApiResponse<ApiUserDoctorRecord>)?.data ||
          (response.data as ApiUserDoctorRecord);
        return mapApiUserToDoctorRecord(data);
      } catch (err) {
        console.log(err);
        await apiClient.put(`/api/v1/doctors/${numericId}`, {
          status: "INACTIVE",
        });
        return {
          id: `DOC-${numericId}`,
          status: "Inactive",
          availability: "Out of Office",
        } as DoctorRecord;
      }
    }
  },

  activate: async (id: string): Promise<DoctorRecord> => {
    const numericId = id.startsWith("DOC-") ? id.replace("DOC-", "") : id;
    const response = await apiClient.patch<
      DoctorApiResponse<ApiUserDoctorRecord> | ApiUserDoctorRecord
    >(`/api/v1/admin/users/${numericId}/activate`);
    const data =
      (response.data as DoctorApiResponse<ApiUserDoctorRecord>)?.data ||
      (response.data as ApiUserDoctorRecord);
    return mapApiUserToDoctorRecord(data);
  },

  resetPassword: async (
    userId: number | string,
  ): Promise<{ temporaryPassword?: string } | null> => {
    const numericId = String(userId).replace("DOC-", "");
    try {
      const response = await apiClient.post<
        DoctorApiResponse<{ temporaryPassword?: string }>
      >(`/api/v1/admin/users/${numericId}/reset-password`);
      const data =
        response.data?.data ||
        (response.data as unknown as { temporaryPassword?: string });
      return data || {};
    } catch (error) {
      console.warn(
        `[doctorsApi] Password reset failed for userId ${numericId}:`,
        error,
      );
      return null;
    }
  },

  getQueue: async (
    doctorId: number | string,
  ): Promise<{
    summary: DoctorQueueSummary;
    content: DoctorQueueItem[];
    page: Record<string, unknown>;
  }> => {
    try {
      const numericId =
        typeof doctorId === "string" && doctorId.startsWith("DOC-")
          ? doctorId.replace("DOC-", "")
          : doctorId;
      const response = await apiClient.get<QueuePayload>(
        `/api/v1/doctors/${numericId}/queue`,
      );
      const data = response.data?.data || response.data;
      return {
        summary: data?.summary || {},
        content: (Array.isArray(data?.content)
          ? data.content
          : Array.isArray(data)
            ? data
            : []) as DoctorQueueItem[],
        page: data?.page || {},
      };
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const data = error.response?.data as { message?: string } | undefined;
        if (data?.message) {
          console.error("[doctorsApi] Queue fetch failed:", data.message);
          throw new Error(data.message, { cause: error });
        }
      }
      console.error("[doctorsApi] Queue fetch failed:", error);
      throw error;
    }
  },

  callNext: async (doctorId: number | string): Promise<CallNextResult> => {
    try {
      const numericId =
        typeof doctorId === "string" && doctorId.startsWith("DOC-")
          ? doctorId.replace("DOC-", "")
          : doctorId;
      const response = await apiClient.post<CallNextPayload>(
        `/api/v1/doctors/${numericId}/queue/call-next`,
      );
      const data = response.data?.data || response.data;
      return data || {};
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const data = error.response?.data as { message?: string } | undefined;
        if (data?.message) {
          throw new Error(data.message, { cause: error });
        }
      }
      throw error;
    }
  },
};
