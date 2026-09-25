import { getToken, setToken, removeToken } from "./cookie-token-storage";

export const API_BASE_URL =
  (typeof import.meta !== "undefined" && import.meta.env?.VITE_API_BASE_URL) ||
  "";

export interface ApiResponseData<T = unknown> {
  data: T;
  status: number;
  statusText: string;
  headers: Record<string, string>;
}

export class ApiError extends Error {
  response?: {
    status: number;
    data?: unknown;
  };
  config?: unknown;
  isAxiosError?: boolean;
  status: number = 0;

  constructor(message: string, status?: number, data?: unknown) {
    super(message);
    this.name = "ApiError";
    this.isAxiosError = true;
    if (status) {
      this.status = status;
      this.response = { status, data };
    }
  }
}

let isRefreshing = false;
let failedQueue: Array<{
  resolve: (token: string) => void;
  reject: (error: unknown) => void;
}> = [];

const processQueue = (error: unknown, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (token) {
      prom.resolve(token);
    } else {
      prom.reject(error);
    }
  });
  failedQueue = [];
};

async function customFetch<T = unknown>(
  url: string,
  options: RequestInit = {},
): Promise<ApiResponseData<T>> {
  const fullUrl = url.startsWith("http") ? url : `${API_BASE_URL}${url}`;
  let token = getToken("accessToken");
  if (!token && typeof localStorage !== "undefined") {
    try {
      const rawStorage = localStorage.getItem("hms-auth-storage:v1");
      if (rawStorage) {
        const parsed = JSON.parse(rawStorage);
        token = parsed?.tokens?.accessToken || null;
      }
    } catch (err) {
      console.log(err);
      // Ignore parse errors
    }
  }

  const isFormData =
    typeof FormData !== "undefined" && options.body instanceof FormData;
  const headers: Record<string, string> = {
    ...(isFormData ? {} : { "Content-Type": "application/json" }),
    ...(options.headers as Record<string, string>),
  };

  if (token && !headers.Authorization) {
    headers.Authorization = `Bearer ${token}`;
  }

  let response: Response;
  try {
    response = await fetch(fullUrl, {
      ...options,
      headers,
    });
  } catch (networkError) {
    console.log(networkError);

    const errorObj = networkError as { message?: string } | undefined;
    throw new ApiError(
      "Unable to connect to the server. Please check your network connection and try again.",
      0,
      { originalError: errorObj?.message },
    );
  }

  let responseData: unknown;
  const contentType = response.headers.get("content-type");
  if (contentType && contentType.includes("application/json")) {
    responseData = await response.json();
  } else {
    responseData = await response.text();
  }

  if (!response.ok) {
    // 401 Token Refresh Logic (exclude login and public auth endpoints)
    const isPublicAuthEndpoint =
      url.includes("/api/v1/auth/login") ||
      url.includes("/api/v1/auth/patient/register") ||
      url.includes("/api/v1/auth/forgot-password") ||
      url.includes("/api/v1/auth/verify-reset-otp") ||
      url.includes("/api/v1/auth/reset-password") ||
      url.includes("/api/v1/auth/refresh");

    if (response.status === 401 && !isPublicAuthEndpoint) {
      if (isRefreshing) {
        return new Promise<string>((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then((newToken) => {
          return customFetch<T>(url, {
            ...options,
            headers: {
              ...headers,
              Authorization: `Bearer ${newToken}`,
            },
          });
        });
      }

      isRefreshing = true;
      try {
        let refreshToken = getToken("refreshToken");
        if (!refreshToken && typeof localStorage !== "undefined") {
          try {
            const rawStorage = localStorage.getItem("hms-auth-storage:v1");
            if (rawStorage) {
              const parsed = JSON.parse(rawStorage);
              refreshToken = parsed?.tokens?.refreshToken || null;
            }
          } catch {
            // Ignore parse errors
          }
        }

        if (!refreshToken) {
          throw new ApiError(
            "Your session has expired. Please log in again.",
            401,
          );
        }

        const refreshResponse = await fetch(
          `${API_BASE_URL}/api/v1/auth/refresh`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Accept: "application/json",
            },
            body: JSON.stringify({ refreshToken }),
          },
        );

        let refreshData: Record<string, unknown> | string | undefined;
        const refreshContentType = refreshResponse.headers.get("content-type");

        if (
          refreshContentType &&
          refreshContentType.includes("application/json")
        ) {
          refreshData = await refreshResponse.json();
        } else {
          refreshData = await refreshResponse.text();
        }

        if (!refreshResponse.ok) {
          const refreshErrorMsg =
            (typeof refreshData === "object" &&
              refreshData !== null &&
              ("message" in refreshData
                ? String(refreshData.message)
                : (refreshData as { data?: { message?: string } })?.data
                    ?.message)) ||
            `Refresh token request failed: ${refreshResponse.status}`;

          throw new ApiError(
            refreshErrorMsg,
            refreshResponse.status,
            refreshData,
          );
        }

        // Backend returns: { data: { accessToken: "...", refreshToken: "..." } } or { accessToken: "...", refreshToken: "..." }
        const tokenData =
          typeof refreshData === "object" && refreshData !== null
            ? ((refreshData as { data?: Record<string, string> }).data ??
              (refreshData as Record<string, string>))
            : undefined;

        const newAccessToken = tokenData?.accessToken;
        const newRefreshToken = tokenData?.refreshToken;

        if (!newAccessToken || !newRefreshToken) {
          throw new ApiError(
            "Invalid refresh response: accessToken or refreshToken is missing.",
            401,
            refreshData,
          );
        }

        // IMPORTANT: Backend uses refresh-token rotation (RTR).
        // Save BOTH newly issued tokens.
        setToken("accessToken", newAccessToken);
        setToken("refreshToken", newRefreshToken);

        processQueue(null, newAccessToken);

        return customFetch<T>(url, {
          ...options,
          headers: {
            ...headers,
            Authorization: `Bearer ${newAccessToken}`,
          },
        });
      } catch (refreshErr) {
        processQueue(refreshErr, null);

        removeToken("accessToken");
        removeToken("refreshToken");
        removeToken("force_change_password");

        try {
          localStorage.removeItem("hms-auth-storage:v1");
          localStorage.removeItem("hms-user:v1");
        } catch (err) {
          console.log(err);
          // ignore
        }

        console.error(
          "[Auth] Refresh token failed. Session expired.",
          refreshErr,
        );

        if (
          typeof window !== "undefined" &&
          window.location.pathname !== "/login"
        ) {
          window.location.replace("/login");
        }

        if (refreshErr instanceof ApiError) {
          throw refreshErr;
        }

        throw new ApiError(
          "Session expired. Please log in again.",
          401,
          responseData,
        );
      } finally {
        isRefreshing = false;
      }
    }

    if (response.status === 403) {
      if (
        typeof responseData === "object" &&
        responseData !== null &&
        "message" in responseData &&
        typeof (responseData as { message: unknown }).message === "string" &&
        (responseData as { message: string }).message.includes(
          "Password change required",
        )
      ) {
        setToken("force_change_password", "true");
      }
    }

    const errorMsg =
      (typeof responseData === "object" &&
        responseData !== null &&
        "message" in responseData &&
        typeof (responseData as { message: unknown }).message === "string" &&
        (responseData as { message: string }).message) ||
      (response.status === 502
        ? "Backend server is unavailable. Check that the HMS API is running."
        : response.statusText) ||
      `Request failed with status ${response.status}`;

    const isIgnored404 =
      response.status === 404 &&
      (url.includes("/patients/me/queue") ||
        url.includes("/prescription") ||
        url.includes("/vitals"));

    if (!isIgnored404) {
      console.error(`[API Error ${response.status}] ${url}:`, responseData);
    }
    throw new ApiError(errorMsg, response.status, responseData);
  }

  const responseHeaders: Record<string, string> = {};
  response.headers.forEach((val, key) => {
    responseHeaders[key] = val;
  });

  return {
    data: responseData as T,
    status: response.status,
    statusText: response.statusText,
    headers: responseHeaders,
  };
}

export const apiClient = {
  get: <T = unknown>(url: string, config: RequestInit = {}) =>
    customFetch<T>(url, { ...config, method: "GET" }),

  post: <T = unknown>(url: string, body?: unknown, config: RequestInit = {}) =>
    customFetch<T>(url, {
      ...config,
      method: "POST",
      body:
        body instanceof FormData
          ? body
          : body
            ? JSON.stringify(body)
            : undefined,
    }),

  put: <T = unknown>(url: string, body?: unknown, config: RequestInit = {}) =>
    customFetch<T>(url, {
      ...config,
      method: "PUT",
      body:
        body instanceof FormData
          ? body
          : body
            ? JSON.stringify(body)
            : undefined,
    }),

  patch: <T = unknown>(url: string, body?: unknown, config: RequestInit = {}) =>
    customFetch<T>(url, {
      ...config,
      method: "PATCH",
      body:
        body instanceof FormData
          ? body
          : body
            ? JSON.stringify(body)
            : undefined,
    }),

  delete: <T = unknown>(url: string, config: RequestInit = {}) =>
    customFetch<T>(url, { ...config, method: "DELETE" }),
};

export const axios = {
  isAxiosError: (err: unknown): err is ApiError => {
    return (
      typeof err === "object" &&
      err !== null &&
      (("isAxiosError" in err &&
        (err as { isAxiosError: boolean }).isAxiosError === true) ||
        err instanceof ApiError)
    );
  },
};
