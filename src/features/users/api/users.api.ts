import { apiClient, axios } from "../../../lib/axios";
import type { User, ApiResponse } from "../../auth/types/auth.types";
import { to24Hour } from "../../../lib/time-utils";
import type {
  AdminCreateStaffData,
  AdminCreateDoctorStaffData,
  AdminCreateStaffResponse,
  AdminUpdateStaffData,
  UserDetailData,
  OpdWeeklySchedule,
} from "../types/users.types";

const unwrapUserCollection = (body: unknown): User[] => {
  if (Array.isArray(body)) return body as User[];
  if (!body || typeof body !== "object") return [];
  const obj = body as Record<string, unknown>;

  if (Array.isArray(obj.data)) return obj.data as User[];
  if (Array.isArray(obj.content)) return obj.content as User[];
  if (Array.isArray(obj.users)) return obj.users as User[];

  const innerData = obj.data as Record<string, unknown> | null | undefined;
  if (innerData && typeof innerData === "object") {
    if (Array.isArray(innerData.content)) return innerData.content as User[];
    if (Array.isArray(innerData.users)) return innerData.users as User[];
    if (Array.isArray(innerData.data)) return innerData.data as User[];
  }

  return [];
};

export const usersApi = {
  // 1. Admin Creates Staff User (POST /api/v1/admin/users)
  /**
   * cURL:
   * curl -X POST http://192.168.1.44:8081/api/v1/admin/users \
   *   -H "Content-Type: application/json" \
   *   -H "Authorization: Bearer <ACCESS_TOKEN>" \
   *   -d '{"email":"<staff-email>","password":"<temporary-password>","fullName":"<staff-full-name>","role":"DOCTOR","mobile":"+919876543210","gender":"MALE","dateOfBirth":"1980-05-15","residentialAddress":"123 Main St, City","doctorProfile":{"medicalRegistrationNumber":"MED12345","qualification":"MBBS, MD","yearsOfExperience":15,"primaryDepartmentId":2,"primarySpecialtyId":1,"consultationFee":800,"followUpFee":500,"slotDurationMinutes":15,"availability":[{"dayOfWeek":"MONDAY","startTime":"09:00","endTime":"17:00"}]}}'
   */
  adminCreateStaff: async (
    data: AdminCreateStaffData | AdminCreateDoctorStaffData,
  ): Promise<AdminCreateStaffResponse> => {
    try {
      const formattedData = {
        ...data,
        availability: data.availability?.map((item) => ({
          ...item,
          startTime: to24Hour(item.startTime),
          endTime: to24Hour(item.endTime),
        })),
        ...("doctorProfile" in data && data.doctorProfile?.availability
          ? {
              doctorProfile: {
                ...data.doctorProfile,
                availability: data.doctorProfile.availability.map((item) => ({
                  ...item,
                  startTime: to24Hour(item.startTime),
                  endTime: to24Hour(item.endTime),
                })),
              },
            }
          : {}),
      };
      const response = await apiClient.post<AdminCreateStaffResponse>(
        "/api/v1/admin/users",
        formattedData,
      );
      return response.data;
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        const resData = error.response?.data as
          | { message?: string }
          | undefined;
        if (resData?.message) {
          throw new Error(resData.message, { cause: error });
        }
      }
      const msg =
        error instanceof Error
          ? error.message
          : "Failed to create staff account";
      throw new Error(msg, { cause: error });
    }
  },

  // 2. Admin Deactivates User (PATCH /api/v1/admin/users/{userId}/deactivate)
  adminDeactivateUser: async (
    userId: number | string,
    reason: string,
  ): Promise<ApiResponse> => {
    try {
      const response = await apiClient.patch<ApiResponse>(
        `/api/v1/admin/users/${userId}/deactivate`,
        { reason },
      );
      return response.data;
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        const resData = error.response?.data as
          | { message?: string }
          | undefined;
        if (resData?.message) {
          throw new Error(resData.message, { cause: error });
        }
      }
      const msg =
        error instanceof Error ? error.message : "Failed to deactivate user";
      throw new Error(msg, { cause: error });
    }
  },

  // 3. Admin Activates User (PATCH /api/v1/admin/users/{userId}/activate)
  adminActivateUser: async (userId: number | string): Promise<ApiResponse> => {
    try {
      const response = await apiClient.patch<ApiResponse>(
        `/api/v1/admin/users/${userId}/activate`,
      );
      return response.data;
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        const resData = error.response?.data as
          | { message?: string }
          | undefined;
        if (resData?.message) {
          throw new Error(resData.message, { cause: error });
        }
      }
      const msg =
        error instanceof Error ? error.message : "Failed to activate user";
      throw new Error(msg, { cause: error });
    }
  },

  // 4. Admin Updates Staff Profile (PUT /api/v1/admin/users/{userId})
  adminUpdateStaff: async (
    userId: number | string,
    data: AdminUpdateStaffData,
  ): Promise<ApiResponse<UserDetailData>> => {
    try {
      const formattedData = {
        ...data,
        availability: data.availability?.map((item) => ({
          ...item,
          startTime: to24Hour(item.startTime),
          endTime: to24Hour(item.endTime),
        })),
      };
      const response = await apiClient.put<ApiResponse<UserDetailData>>(
        `/api/v1/admin/users/${userId}`,
        formattedData,
      );
      return response.data;
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        const resData = error.response?.data as
          | { message?: string }
          | undefined;
        if (resData?.message) {
          throw new Error(resData.message, { cause: error });
        }
      }
      const msg =
        error instanceof Error
          ? error.message
          : "Failed to update staff profile";
      throw new Error(msg, { cause: error });
    }
  },

  // 5. Admin Resets User Password (POST /api/v1/admin/users/{userId}/reset-password)
  adminResetPassword: async (
    userId: number | string,
  ): Promise<ApiResponse<{ temporaryPassword: string }>> => {
    try {
      const response = await apiClient.post<
        ApiResponse<{ temporaryPassword: string }>
      >(`/api/v1/admin/users/${userId}/reset-password`);
      return response.data;
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        const resData = error.response?.data as
          | { message?: string }
          | undefined;
        if (resData?.message) {
          throw new Error(resData.message, { cause: error });
        }
      }
      const msg =
        error instanceof Error ? error.message : "Failed to reset password";
      throw new Error(msg, { cause: error });
    }
  },
  // 6. Admin Gets All Users (GET /api/v1/admin/users)
  adminGetUsers: async (): Promise<ApiResponse<User[]>> => {
    try {
      let response;
      try {
        response = await apiClient.get<ApiResponse<User[]> | User[]>(
          "/api/v1/admin/users",
        );
      } catch (e) {
        console.warn(
          "Primary GET /api/v1/admin/users failed, trying fallback /api/v1/users...",
          e,
        );
        response = await apiClient.get<ApiResponse<User[]> | User[]>(
          "/api/v1/users",
        );
      }

      let usersList = unwrapUserCollection(response.data);

      if (usersList.length === 0) {
        try {
          const fallbackRes = await apiClient.get<ApiResponse<User[]> | User[]>(
            "/api/v1/users",
          );
          const fallbackUsers = unwrapUserCollection(fallbackRes.data);
          if (fallbackUsers.length > 0) {
            usersList = fallbackUsers;
          }
        } catch {
          // ignore fallback error
        }
      }

      return {
        success: true,
        data: usersList,
        message: "",
      };
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        const resData = error.response?.data as
          | { message?: string }
          | undefined;
        if (resData?.message) {
          throw new Error(resData.message, { cause: error });
        }
      }
      const msg =
        error instanceof Error
          ? error.message
          : "Failed to retrieve user accounts";
      throw new Error(msg, { cause: error });
    }
  },

  // 7. Admin Gets User By ID (GET /api/v1/admin/users/{userId})
  adminGetUserById: async (
    userId: number | string,
  ): Promise<ApiResponse<UserDetailData>> => {
    try {
      const response = await apiClient.get<
        ApiResponse<UserDetailData> | { data: UserDetailData }
      >(`/api/v1/admin/users/${userId}`);
      const res = response.data as Record<string, unknown>;
      if (res && typeof res === "object") {
        if (
          "data" in res &&
          res.data &&
          typeof res.data === "object" &&
          "userId" in (res.data as Record<string, unknown>)
        ) {
          return {
            success: true,
            data: res.data as UserDetailData,
            message: String(res.message || "User fetched successfully"),
          };
        }
        if (
          "data" in res &&
          res.data &&
          typeof res.data === "object" &&
          "data" in (res.data as Record<string, unknown>)
        ) {
          return {
            success: true,
            data: (res.data as Record<string, unknown>).data as UserDetailData,
            message: String(res.message || "User fetched successfully"),
          };
        }
      }
      return response.data as ApiResponse<UserDetailData>;
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        const resData = error.response?.data as
          | { message?: string }
          | undefined;
        if (resData?.message) {
          throw new Error(resData.message, { cause: error });
        }
      }
      const msg =
        error instanceof Error ? error.message : "Failed to fetch user details";
      throw new Error(msg, { cause: error });
    }
  },

  // 8. Fetch Hospital OPD Weekly Schedule (GET /api/v1/admin/opd/weekly-schedule)
  fetchOpdWeeklySchedule: async (): Promise<OpdWeeklySchedule> => {
    try {
      const response = await apiClient.get<
        { data: OpdWeeklySchedule } | OpdWeeklySchedule
      >("/api/v1/admin/opd/weekly-schedule");
      const body = response.data;
      if (body && typeof body === "object" && "data" in body) {
        return (body as { data: OpdWeeklySchedule }).data;
      }
      return body as OpdWeeklySchedule;
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        const resData = error.response?.data as
          | { message?: string }
          | undefined;
        if (resData?.message) {
          throw new Error(resData.message, { cause: error });
        }
      }
      const msg =
        error instanceof Error
          ? error.message
          : "Failed to fetch OPD weekly schedule";
      throw new Error(msg, { cause: error });
    }
  },

  // 9. Upload Staff Profile Photo (POST /api/v1/upload)
  uploadPhoto: async (file: File): Promise<string> => {
    try {
      const formData = new FormData();
      formData.append("file", file);
      const response = await apiClient.post<Record<string, unknown>>(
        "/api/v1/upload",
        formData,
      );
      const resData = response.data;
      const uploadedUrl = extractUploadedUrl(resData);
      if (!uploadedUrl) {
        throw new Error(
          "Upload response did not return a valid file URL/path.",
        );
      }
      return uploadedUrl;
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        const resData = error.response?.data as
          | { message?: string }
          | undefined;
        if (resData?.message) {
          throw new Error(resData.message, { cause: error });
        }
      }
      const msg =
        error instanceof Error ? error.message : "Failed to upload image";
      throw new Error(msg, { cause: error });
    }
  },
};

function extractUploadedUrl(result: unknown): string {
  if (!result) return "";
  if (typeof result === "string") return result.trim();
  if (typeof result === "object") {
    const res = result as Record<string, unknown>;
    if (res.data && typeof res.data === "object") {
      const nested = extractUploadedUrl(res.data);
      if (nested) return nested;
    }
    const candidates = [
      res.url,
      res.photoUrl,
      res.photo,
      res.fileUrl,
      res.path,
      res.filePath,
      res.uploadUrl,
      res.publicUrl,
      res.location,
      res.logoUrl,
      res.headerBannerUrl,
    ];
    for (const cand of candidates) {
      if (typeof cand === "string" && cand.trim().length > 0) {
        return cand.trim();
      }
    }
    for (const val of Object.values(res)) {
      if (val && typeof val === "object") {
        const nested = extractUploadedUrl(val);
        if (nested) return nested;
      }
    }
  }
  return "";
}
