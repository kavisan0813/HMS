import { authApi } from "../api/auth.api";
import { getToken, setToken } from "../../../lib/cookie-token-storage";
import type {
  PatientRegistrationData,
  PatientLinkData,
  LoginCredentials,
  ForgotPasswordData,
  VerifyResetOTPData,
  ResetPasswordData,
  ChangePasswordData,
  User,
} from "../types/auth.types";
import { useAuthStore } from "../store/auth.store";

export const authService = {
  // Patient Registration (Endpoint 1)
  // Note: Backend auto-creates the patient record during auth registration.
  // No need to call patientService.createPatientFromAuth() here since the user
  // has no auth token at this point (registration is unauthenticated).
  async registerPatient(data: PatientRegistrationData) {
    return await authApi.registerPatient(data);
  },

  // Upload Patient Photo (POST /api/v1/upload)
  async uploadPhoto(file: File) {
    return await authApi.uploadPhoto(file);
  },

  // Link Existing Patient (Endpoint Stub)
  async linkPatient(data: PatientLinkData) {
    return await authApi.linkPatient(data);
  },

  // Resend Verification (Endpoint 2)
  async resendVerificationOTP(email: string) {
    return await authApi.resendVerificationOTP({ email });
  },

  // User Login (Endpoints 3, 11, 13)
  async login(credentials: LoginCredentials) {
    const response = await authApi.login(credentials);
    const resAny = response as unknown as Record<string, unknown>;
    const authData = (response.data || resAny) as Record<string, unknown>;

    const accessToken = (authData.accessToken || resAny.accessToken) as string;
    const refreshToken = (authData.refreshToken ||
      resAny.refreshToken) as string;
    const user = (authData.user || resAny.user) as User;

    if (user && accessToken) {
      // We save tokens to localStorage so subsequent API calls (like change-password) work,
      // but we DO NOT call useAuthStore.login() here.
      // Calling it here would instantly unmount the LoginPage and bypass the Success/Change Password screens.
      // LoginPage will call useAuthStore.login() when the user clicks "Continue".
      setToken("accessToken", accessToken);
      if (refreshToken) {
        setToken("refreshToken", refreshToken);
      }
    }

    return response;
  },

  // Token Refresh (Endpoint 4)
  async refreshToken() {
    const storedRefreshToken = getToken("refreshToken");
    if (!storedRefreshToken) throw new Error("No refresh token found");

    const response = await authApi.refreshToken(storedRefreshToken);
    const newAccessToken = response.data?.accessToken || "";

    if (newAccessToken) {
      useAuthStore.updateTokens({
        accessToken: newAccessToken,
      });
    }

    return response;
  },

  // Get Profile (Endpoint 5)
  async getProfile() {
    const response = await authApi.getProfile();
    if (response.data) {
      useAuthStore.setUser(response.data);
    }
    return response;
  },

  // User Logout (Endpoint 6)
  async logout() {
    try {
      await authApi.logout();
    } catch (err) {
      console.error(err);
    } finally {
      useAuthStore.logout();
    }
  },

  // Forgot Password Trigger (Endpoint 7)
  async forgotPassword(data: ForgotPasswordData) {
    return await authApi.forgotPassword(data);
  },

  // Verify Reset OTP (Endpoint 8)
  async verifyResetOTP(data: VerifyResetOTPData) {
    return await authApi.verifyResetOTP(data);
  },

  // Reset Password (Endpoint 9)
  async resetPassword(data: ResetPasswordData) {
    return await authApi.resetPassword(data);
  },

  // Verify Email (POST /api/v1/auth/verify-email)
  async verifyEmail(email: string, otp: string) {
    return await authApi.verifyEmail({ email, otp });
  },

  // Forced / General Password Change (Endpoint 12)
  async changePassword(data: ChangePasswordData) {
    const response = await authApi.changePassword(data);
    useAuthStore.setMustChangePassword(false);
    return response;
  },
};
