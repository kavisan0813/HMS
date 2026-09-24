export type AuthRole =
  | "ADMIN"
  | "DOCTOR"
  | "PATIENT"
  | "NURSE"
  | "RECEPTIONIST"
  | "SUPER_ADMIN";

export type AuthScreen =
  | "login"
  | "register"
  | "forgot"
  | "otp"
  | "reset"
  | "change-password"
  | "success";

export interface User {
  age?: number | string;
  address: string;
  dob: string;
  mobileNumber: string;
  professionalBio: string;
  dateOfBirth: string;
  residentialAddress: string;
  gender: string;
  photoUrl: string;
  photo: string;
  mrn: string;
  phone: string;
  name: string;
  id: number;
  employeeId: string | null;
  patientId: string | null;
  fullName: string;
  email: string;
  mobile: string;
  role: AuthRole | string;
  hospitalId: number;
  mustChangePassword: boolean;
  profileCompleted?: boolean;
  permissions?: string[];
  status?: "ACTIVE" | "INACTIVE" | "SUSPENDED";
  lastLogin?: string | null;
  lastSuccessfulLogin?: string | null;

  doctorId?: number;

  primaryDepartmentId?: number;
  departmentId?: number;
  departmentName?: string;
  department?: string;

  doctorProfile?: {
    doctorId?: number;
    [key: string]: unknown;
  };
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  expiresIn: number;
}

export interface AuthState {
  user: User | null;
  tokens: AuthTokens | null;
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
}

// 1. Patient Registration
export interface PatientRegistrationData {
  fullName: string;
  email?: string;
  mobile: string;
  dateOfBirth?: string;
  gender?: string;
  photoUrl?: string;
  password: string;
  confirmPassword: string;
}

export interface PatientLinkData {
  mrn: string;
  mobile: string;
  password: string;
  confirmPassword: string;
}

export interface PatientRegistrationResponse {
  success: boolean;
  message: string;
  data: {
    patientId: string;
    email: string;
    emailVerified: boolean;
  };
}

// 2. Resend Verification
export interface ResendVerificationData {
  email: string;
}

// 3. Login
export interface LoginCredentials {
  email: string;
  password: string;
  remember?: boolean;
}

export interface LoginResponse {
  success: boolean;
  message: string;
  data: {
    accessToken: string;
    refreshToken: string;
    tokenType: string;
    expiresIn: number;
    user: User;
  };
}

// 4. Token Refresh
export interface TokenRefreshData {
  refreshToken: string;
}

export interface TokenRefreshResponse {
  success: boolean;
  message: string;
  data: {
    accessToken: string;
    tokenType: string;
    expiresIn: number;
  };
}

// 7. Forgot Password
export interface ForgotPasswordData {
  email: string;
}

// 8. Verify Reset OTP
export interface VerifyResetOTPData {
  email: string;
  otp: string;
}

export interface VerifyResetOTPResponse {
  success: boolean;
  message: string;
  data: {
    resetToken: string;
  };
}

// 9. Reset Password
export interface ResetPasswordData {
  resetToken: string;
  newPassword: string;
  confirmPassword: string;
}

// 12. Change Password (Forced / General)
export interface ChangePasswordData {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

// 13. Verify Email
export interface VerifyEmailData {
  email: string;
  otp: string;
}

// Generic API Response
export interface ApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data?: T;
}
