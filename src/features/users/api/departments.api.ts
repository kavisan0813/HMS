import { apiClient, axios } from "../../../lib/axios";
import type {
  ApiSpecialtyItem,
  ApiDepartmentSpecialtiesItem,
  ApiDepartment,
  ApiDepartmentLookupItem,
  ApiSpecialty,
  DepartmentSpecialtiesPageResponse,
  DepartmentListParams,
} from "../types/departments.types";

export type {
  ApiSpecialtyItem,
  ApiDepartmentSpecialtiesItem,
  ApiDepartment,
  ApiDepartmentLookupItem,
  ApiSpecialty,
  DepartmentSpecialtiesPageResponse,
  DepartmentListParams,
};

const unwrapList = <T>(resData: unknown): T[] => {
  if (!resData) return [];
  if (Array.isArray(resData)) return resData as T[];

  const obj = resData as Record<string, unknown>;

  if (Array.isArray(obj.data)) {
    return obj.data as T[];
  }

  if (obj.data && typeof obj.data === "object") {
    const innerData = obj.data as Record<string, unknown>;
    if (Array.isArray(innerData.content)) {
      return innerData.content as T[];
    }
  }

  if (Array.isArray(obj.content)) {
    return obj.content as T[];
  }

  return [];
};

const unwrapPaginated = <T>(
  resData: unknown,
): {
  items: T[];
  pagination: Omit<DepartmentSpecialtiesPageResponse, "content">;
} => {
  const defaultPagination = {
    totalElements: 0,
    totalPages: 0,
    size: 10,
    number: 0,
    first: true,
    last: true,
    empty: true,
  };

  if (!resData) return { items: [], pagination: defaultPagination };

  // Check if it's a direct paginated response
  const obj = resData as Record<string, unknown>;
  if (obj.content && Array.isArray(obj.content)) {
    return {
      items: obj.content as T[],
      pagination: {
        totalElements: (obj.totalElements as number) || 0,
        totalPages: (obj.totalPages as number) || 0,
        size: (obj.size as number) || 10,
        number: (obj.number as number) || 0,
        first: (obj.first as boolean) ?? true,
        last: (obj.last as boolean) ?? true,
        empty: (obj.empty as boolean) ?? false,
      },
    };
  }

  // Check if wrapped in { data: { content: [] } }
  if (obj.data && typeof obj.data === "object") {
    const innerData = obj.data as Record<string, unknown>;
    if (innerData.content && Array.isArray(innerData.content)) {
      return {
        items: innerData.content as T[],
        pagination: {
          totalElements: (innerData.totalElements as number) || 0,
          totalPages: (innerData.totalPages as number) || 0,
          size: (innerData.size as number) || 10,
          number: (innerData.number as number) || 0,
          first: (innerData.first as boolean) ?? true,
          last: (innerData.last as boolean) ?? true,
          empty: (innerData.empty as boolean) ?? false,
        },
      };
    }
  }

  // Fallback: treat as array response
  return {
    items: unwrapList<T>(resData),
    pagination: defaultPagination,
  };
};

const sanitizeCode = (code?: string, fallbackPrefix = "CODE"): string => {
  if (!code || !code.trim()) {
    return `${fallbackPrefix}_${Date.now().toString(36).toUpperCase()}`;
  }
  return code.replace(/[^a-zA-Z0-9_]/g, "_").toUpperCase();
};

export const departmentsApi = {
  /**
   * GET /api/v1/admin/department-specialties
   * List Departments and Specialties (paginated)
   */
  async getDepartments(
    params?: DepartmentListParams,
  ): Promise<DepartmentSpecialtiesPageResponse> {
    try {
      let res;
      const queryParams = new URLSearchParams();
      if (params?.search) queryParams.append("search", params.search);
      if (params?.activeOnly !== undefined)
        queryParams.append("activeOnly", String(params.activeOnly));
      if (params?.page !== undefined)
        queryParams.append("page", String(params.page));
      if (params?.size !== undefined)
        queryParams.append("size", String(params.size));
      const queryString = queryParams.toString()
        ? `?${queryParams.toString()}`
        : "";

      try {
        res = await apiClient.get<unknown>(
          `/api/v1/admin/department-specialties${queryString}`,
        );
      } catch (err: unknown) {
        if (
          axios.isAxiosError(err) &&
          (err.response?.status === 404 || err.response?.status === 403)
        ) {
          try {
            res = await apiClient.get<unknown>(
              `/api/v1/admin/department-specialties${queryString}`,
            );
          } catch (err) {
            console.log(err);
            res = await apiClient.get<unknown>(
              `/api/v1/admin/department-specialties${queryString}`,
            );
          }
        } else {
          throw err;
        }
      }
      const { items, pagination } =
        unwrapPaginated<ApiDepartmentSpecialtiesItem>(res.data);
      const normalizedItems = items.map(
        (item: ApiDepartmentSpecialtiesItem) => ({
          ...item,
          id: item.id ?? item.departmentId,
          departmentId: item.departmentId ?? item.id,
          departmentName: item.departmentName ?? item.name ?? "",
          name: item.name ?? item.departmentName ?? "",
          departmentCode: item.departmentCode ?? item.code ?? "",
          code: item.code ?? item.departmentCode ?? "",
          specialties: (item.specialties || []).map((s: ApiSpecialtyItem) => ({
            ...s,
            id: s.id,
          })),
        }),
      );
      return {
        content: normalizedItems,
        totalElements: pagination.totalElements,
        totalPages: pagination.totalPages,
        size: pagination.size,
        number: pagination.number,
        first: pagination.first,
        last: pagination.last,
        empty: pagination.empty,
      };
    } catch (error) {
      console.warn(
        "[departmentsApi] Failed to fetch department specialties:",
        error,
      );
      return {
        content: [],
        totalElements: 0,
        totalPages: 0,
        size: 10,
        number: 0,
        first: true,
        last: true,
        empty: true,
      };
    }
  },

  /**
   * GET /api/v1/admin/department-specialties/lookup
   * Get Department and Specialties Lookup List
   */
  async getDepartmentLookup(
    activeOnly = true,
  ): Promise<ApiDepartmentLookupItem[]> {
    try {
      let res;
      try {
        res = await apiClient.get<unknown>(
          `/api/v1/admin/department-specialties/lookup?activeOnly=${activeOnly}`,
        );
      } catch (err: unknown) {
        if (
          axios.isAxiosError(err) &&
          (err.response?.status === 404 || err.response?.status === 403)
        ) {
          res = await apiClient.get<unknown>(
            `/api/v1/admin/department-specialties`,
          );
        } else {
          throw err;
        }
      }
      const rawList = unwrapList<ApiDepartmentLookupItem>(res.data);
      return rawList.map((item: ApiDepartmentLookupItem) => ({
        ...item,
        id: item.departmentId,
        departmentId: item.departmentId,
        departmentName: item.departmentName ?? "",
        active: item.active !== undefined ? item.active : true,
        specialties: (item.specialties || []).map(
          (s: ApiSpecialtyItem & ApiSpecialty) => ({
            id: s.id ?? "",
            name: s.name || s.specialtyName || "",
            active: s.active !== undefined ? s.active : true,
          }),
        ),
      }));
    } catch (error) {
      console.warn(
        "[departmentsApi] Failed to fetch department lookup:",
        error,
      );
      return [];
    }
  },

  /**
   * GET /api/v1/admin/department-specialties/{departmentId}
   * Get Department Details
   */
  async getDepartmentDetails(
    departmentId: number | string,
  ): Promise<ApiDepartmentSpecialtiesItem | null> {
    try {
      let res;
      try {
        res = await apiClient.get<
          ApiDepartmentSpecialtiesItem | { data: ApiDepartmentSpecialtiesItem }
        >(`/api/v1/admin/department-specialties/${departmentId}`);
      } catch (err: unknown) {
        if (
          axios.isAxiosError(err) &&
          (err.response?.status === 404 || err.response?.status === 403)
        ) {
          res = await apiClient.get<
            | ApiDepartmentSpecialtiesItem
            | { data: ApiDepartmentSpecialtiesItem }
          >(`/api/v1/admin/departments/${departmentId}`);
        } else {
          throw err;
        }
      }
      const data = res.data;
      if (!data) return null;
      if ("data" in data && data.data) {
        return data.data;
      }
      return data as ApiDepartmentSpecialtiesItem;
    } catch (error) {
      console.warn(
        `[departmentsApi] Failed to fetch department details for ${departmentId}:`,
        error,
      );
      return null;
    }
  },

  /**
   * POST /api/v1/admin/department-specialties
   * Create Department and Specialties
   */
  async createDepartment(
    payload: Partial<ApiDepartmentSpecialtiesItem>,
  ): Promise<ApiDepartmentSpecialtiesItem> {
    try {
      let res;
      const deptName = payload.departmentName || payload.name || "DEPARTMENT";
      const formattedPayload = {
        departmentName: deptName,
        departmentCode: sanitizeCode(
          payload.departmentCode || payload.code || deptName,
          "DEP",
        ),
        description: payload.description,
        active: payload.active !== undefined ? payload.active : true,
        specialties: (payload.specialties || []).map((s, idx) => ({
          ...s,
          code: sanitizeCode(
            s.code || `${deptName}_${s.name || idx + 1}`,
            "SPEC",
          ),
        })),
        headOfDepartment: payload.headOfDepartment || payload.head,
      };

      try {
        res = await apiClient.post<
          ApiDepartmentSpecialtiesItem | { data: ApiDepartmentSpecialtiesItem }
        >("/api/v1/admin/department-specialties", formattedPayload);
      } catch (err: unknown) {
        if (
          axios.isAxiosError(err) &&
          (err.response?.status === 404 || err.response?.status === 403)
        ) {
          try {
            res = await apiClient.post<
              | ApiDepartmentSpecialtiesItem
              | { data: ApiDepartmentSpecialtiesItem }
            >("/api/v1/admin/department-specialties", formattedPayload);
          } catch (err) {
            console.log(err);
            res = await apiClient.post<
              | ApiDepartmentSpecialtiesItem
              | { data: ApiDepartmentSpecialtiesItem }
            >("/api/v1/admin/department-specialties", formattedPayload);
          }
        } else {
          throw err;
        }
      }
      const data = res.data;
      if (data && "data" in data && data.data) {
        return data.data;
      }
      return data as ApiDepartmentSpecialtiesItem;
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

  /**
   * PUT /api/v1/admin/department-specialties/{departmentId}
   * Update Department and Specialties
   */
  async updateDepartment(
    departmentId: number | string,
    payload: Partial<ApiDepartmentSpecialtiesItem>,
  ): Promise<ApiDepartmentSpecialtiesItem> {
    try {
      let res;
      const deptName = payload.departmentName || payload.name || "DEPARTMENT";
      const formattedPayload = {
        departmentName: deptName,
        departmentCode: sanitizeCode(
          payload.departmentCode || payload.code || deptName,
          "DEP",
        ),
        description: payload.description,
        active: payload.active !== undefined ? payload.active : true,
        specialties: (payload.specialties || []).map((s, idx) => ({
          ...s,
          code: sanitizeCode(
            s.code || `${deptName}_${s.name || idx + 1}`,
            "SPEC",
          ),
        })),
        headOfDepartment: payload.headOfDepartment || payload.head,
      };

      try {
        res = await apiClient.put<
          ApiDepartmentSpecialtiesItem | { data: ApiDepartmentSpecialtiesItem }
        >(
          `/api/v1/admin/department-specialties/${departmentId}`,
          formattedPayload,
        );
      } catch (err: unknown) {
        if (
          axios.isAxiosError(err) &&
          (err.response?.status === 404 || err.response?.status === 403)
        ) {
          try {
            res = await apiClient.put<
              | ApiDepartmentSpecialtiesItem
              | { data: ApiDepartmentSpecialtiesItem }
            >(
              `/api/v1/admin/departments-specialties/${departmentId}`,
              formattedPayload,
            );
          } catch (err) {
            console.log(err);
            res = await apiClient.put<
              | ApiDepartmentSpecialtiesItem
              | { data: ApiDepartmentSpecialtiesItem }
            >(
              `/api/v1/admin/department-specialties/${departmentId}`,
              formattedPayload,
            );
          }
        } else {
          throw err;
        }
      }
      const data = res.data;
      if (data && "data" in data && data.data) {
        return data.data;
      }
      return data as ApiDepartmentSpecialtiesItem;
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

  /**
   * DELETE /api/v1/admin/department-specialties/{departmentId}
   * Delete Department
   */
  async deleteDepartment(
    departmentId: number | string,
  ): Promise<{ success: boolean; message?: string }> {
    try {
      let res;
      try {
        res = await apiClient.delete<{ success: boolean; message?: string }>(
          `/api/v1/admin/department-specialties/${departmentId}`,
        );
      } catch (err: unknown) {
        if (
          axios.isAxiosError(err) &&
          (err.response?.status === 404 || err.response?.status === 403)
        ) {
          res = await apiClient.delete<{ success: boolean; message?: string }>(
            `/api/v1/admin/department-departments/${departmentId}`,
          );
        } else {
          throw err;
        }
      }
      return res.data ?? { success: true };
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

  /**
   * GET /api/v1/admin/specialties
   */
  async getSpecialties(): Promise<ApiSpecialty[]> {
    try {
      let res;
      try {
        res = await apiClient.get<unknown>("/api/v1/admin/specialties");
      } catch (err: unknown) {
        if (
          axios.isAxiosError(err) &&
          (err.response?.status === 404 || err.response?.status === 403)
        ) {
          res = await apiClient.get<unknown>("/api/v1/specialties");
        } else {
          throw err;
        }
      }
      return unwrapList<ApiSpecialty>(res.data);
    } catch (error) {
      console.warn("[departmentsApi] Failed to fetch specialties:", error);
      return [];
    }
  },

  /**
   * POST /api/v1/admin/specialties
   */
  async createSpecialty(payload: Partial<ApiSpecialty>): Promise<ApiSpecialty> {
    try {
      let res;
      try {
        res = await apiClient.post<ApiSpecialty | { data: ApiSpecialty }>(
          "/api/v1/admin/specialties",
          payload,
        );
      } catch (err: unknown) {
        if (
          axios.isAxiosError(err) &&
          (err.response?.status === 404 || err.response?.status === 403)
        ) {
          res = await apiClient.post<ApiSpecialty | { data: ApiSpecialty }>(
            "/api/v1/specialties",
            payload,
          );
        } else {
          throw err;
        }
      }
      const data = res.data;
      if (data && "data" in data && data.data) {
        return data.data;
      }
      return data as ApiSpecialty;
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
