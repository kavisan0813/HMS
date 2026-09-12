import { apiClient, axios } from "../../../lib/axios";
import type {
  PatientRegistrationData,
  PatientLinkData,
  PatientRegistrationResponse,
  ResendVerificationData,
  LoginCredentials,
  LoginResponse,
  TokenRefreshResponse,
  ForgotPasswordData,
  VerifyResetOTPData,
  VerifyResetOTPResponse,
  ResetPasswordData,
  ChangePasswordData,
  ApiResponse,
  User,
  VerifyEmailData,
} from "../types/auth.types";

export const authApi = {
  // 1. Patient Registration (POST /api/v1/auth/patient/register)
  registerPatient: async (
    data: PatientRegistrationData,
  ): Promise<PatientRegistrationResponse> => {
    try {
      const response = await apiClient.post<PatientRegistrationResponse>(
        "/api/v1/auth/patient/register",
        data,
      );
      return response.data;
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        const resData = error.response?.data as
          | { message?: string; errors?: Array<{ message?: string }> }
          | undefined;
        if (resData?.message) {
          let errorMessage = resData.message;
          if (resData.errors && resData.errors.length > 0) {
            errorMessage +=
              ": " +
              resData.errors
                .map(
                  (e: { message?: string }) => e.message || JSON.stringify(e),
                )
                .join(", ");
          }
          throw new Error(errorMessage, { cause: error });
        }
      }
      const msg =
        error instanceof Error ? error.message : "Failed to register patient";
      throw new Error(msg, { cause: error });
    }
  },

  // Upload Patient Photo (POST /api/v1/upload)
  uploadPhoto: async (file: File): Promise<string> => {
    try {
      const formData = new FormData();
      formData.append("file", file);
      const response = await apiClient.post<Record<string, unknown>>(
        "/api/v1/upload",
        formData,
      );
      const resData = response.data;
      const uploadedUrl =
        (resData?.url as string) ||
        (resData?.path as string) ||
        (resData?.fileUrl as string) ||
        ((resData?.data as Record<string, unknown>)?.url as string) ||
        ((resData?.data as Record<string, unknown>)?.path as string) ||
        "";
      if (!uploadedUrl && typeof resData === "string") return resData;
      if (!uploadedUrl) {
        throw new Error(
          "Upload succeeded but did not return a valid file URL.",
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
        error instanceof Error ? error.message : "Failed to upload photo";
      throw new Error(msg, { cause: error });
    }
  },

  // Link Existing Patient (POST /api/v1/auth/patient/link)
  linkPatient: async (
    data: PatientLinkData,
  ): Promise<PatientRegistrationResponse> => {
    try {
      const response = await apiClient.post<PatientRegistrationResponse>(
        "/api/v1/auth/patient/link",
        data,
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
        error instanceof Error ? error.message : "Failed to link patient";
      throw new Error(msg, { cause: error });
    }
  },

  // 2. Resend Verification OTP (POST /api/v1/auth/resend-verification)
  resendVerificationOTP: async (
    data: ResendVerificationData,
  ): Promise<ApiResponse> => {
    try {
      const response = await apiClient.post<ApiResponse>(
        "/api/v1/auth/resend-verification",
        data,
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
          : "Failed to resend verification OTP";
      throw new Error(msg, { cause: error });
    }
  },

  // 3. User / Doctor / Patient Login (POST /api/v1/auth/login)
  login: async (credentials: LoginCredentials): Promise<LoginResponse> => {
    try {
      const response = await apiClient.post<LoginResponse>(
        "/api/v1/auth/login",
        {
          email: credentials.email,
          password: credentials.password,
        },
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
        error instanceof Error ? error.message : "Invalid email or password";
      throw new Error(msg, { cause: error });
    }
  },

  // 4. Access Token Refresh (POST /api/v1/auth/refresh)
  refreshToken: async (refreshToken: string): Promise<TokenRefreshResponse> => {
    try {
      const response = await apiClient.post<TokenRefreshResponse>(
        "/api/v1/auth/refresh",
        { refreshToken },
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
        error instanceof Error ? error.message : "Failed to refresh token";
      throw new Error(msg, { cause: error });
    }
  },

  // 5. Get Profile Details (GET /api/v1/auth/me)
  getProfile: async (): Promise<ApiResponse<User>> => {
    try {
      const response =
        await apiClient.get<ApiResponse<User>>("/api/v1/auth/me");
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
          : "Failed to retrieve profile details";
      throw new Error(msg, { cause: error });
    }
  },

  // 6. User Logout (POST /api/v1/auth/logout)
  logout: async (): Promise<ApiResponse> => {
    try {
      const response = await apiClient.post<ApiResponse>("/api/v1/auth/logout");
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
      const msg = error instanceof Error ? error.message : "Failed to logout";
      throw new Error(msg, { cause: error });
    }
  },

  // 7. Forgot Password Trigger (POST /api/v1/auth/forgot-password)
  forgotPassword: async (data: ForgotPasswordData): Promise<ApiResponse> => {
    try {
      const response = await apiClient.post<ApiResponse>(
        "/api/v1/auth/forgot-password",
        data,
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
          : "Failed to send reset instructions";
      throw new Error(msg, { cause: error });
    }
  },

  // 8. Verify Forgot Password OTP (POST /api/v1/auth/verify-reset-otp)
  verifyResetOTP: async (
    data: VerifyResetOTPData,
  ): Promise<VerifyResetOTPResponse> => {
    try {
      const response = await apiClient.post<VerifyResetOTPResponse>(
        "/api/v1/auth/verify-reset-otp",
        data,
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
        error instanceof Error ? error.message : "Failed to verify OTP";
      throw new Error(msg, { cause: error });
    }
  },

  // 9. Reset Password using Reset Token (POST /api/v1/auth/reset-password)
  resetPassword: async (data: ResetPasswordData): Promise<ApiResponse> => {
    try {
      const response = await apiClient.post<ApiResponse>(
        "/api/v1/auth/reset-password",
        data,
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
        error instanceof Error ? error.message : "Failed to reset password";
      throw new Error(msg, { cause: error });
    }
  },

  // 10. Verify Email (POST /api/v1/auth/verify-email)
  verifyEmail: async (data: VerifyEmailData): Promise<ApiResponse> => {
    try {
      const response = await apiClient.post<ApiResponse>(
        "/api/v1/auth/verify-email",
        data,
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
        error instanceof Error ? error.message : "Failed to verify email";
      throw new Error(msg, { cause: error });
    }
  },

  // 11. Forced / General Password Change (POST /api/v1/auth/change-password)
  changePassword: async (data: ChangePasswordData): Promise<ApiResponse> => {
    try {
      const response = await apiClient.post<ApiResponse>(
        "/api/v1/auth/change-password",
        data,
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
        error instanceof Error ? error.message : "Failed to change password";
      throw new Error(msg, { cause: error });
    }
  },
};
