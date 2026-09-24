import React, { useState, useRef } from "react";
import { getToken, removeToken } from "../../../lib/cookie-token-storage";
import { useNavigate } from "react-router";
import { useAuthStore } from "../store/auth.store";
import { ROUTES } from "../../../app/routes/routes";
import { BrandingPanel } from "../components/BrandingPanel";
import { LoginForm } from "../components/LoginForm";
import { PatientRegisterForm } from "../components/PatientRegisterForm";
import { ForgotPasswordPage } from "./ForgotPasswordPage";
import { OTPPage } from "./OTPPage";
import { ResetPasswordPage } from "./ResetPasswordPage";
import { ChangePasswordPage } from "./ChangePasswordPage";
import { SuccessPage } from "./SuccessPage";
import type {
  AuthScreen,
  LoginResponse,
  PatientRegistrationResponse,
  User,
  AuthTokens,
} from "../types/auth.types";

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const [currentScreen, setCurrentScreen] = useState<AuthScreen>(() => {
    if (getToken("force_change_password") === "true") {
      removeToken("force_change_password");
      return "change-password";
    }
    return "login";
  });

  const [resetEmail, setResetEmail] = useState("");
  const [successInfo, setSuccessInfo] = useState<{
    title: string;
    message: string;
  } | null>(null);

  const pendingUserRef = useRef<User | null>(null);
  const pendingTokensRef = useRef<AuthTokens | null>(null);

  const handleLoginSuccess = (response: LoginResponse) => {
    const resAny = response as unknown as Record<string, unknown>;
    const authData = (response.data || resAny) as Record<string, unknown>;
    const rawUser = (authData.user || resAny.user || {}) as Record<
      string,
      unknown
    >;

    let loggedInUser: User | null;
    if (rawUser && rawUser.id) {
      const docId =
        rawUser.doctorId ??
        (rawUser.doctorProfile as { doctorId?: number })?.doctorId;

      let pendingDob = "";
      let pendingGender = "";
      try {
        const userEmail = String(rawUser.email || "")
          .trim()
          .toLowerCase();
        const raw1 = userEmail
          ? localStorage.getItem(`hms-pending-patient:${userEmail}`)
          : null;
        const raw2 =
          localStorage.getItem("hms-pending-patient-last:v1") ||
          localStorage.getItem("hms-pending-patient-last");
        const raw3 = localStorage.getItem("hms-pending-patient-profile:v1");
        const stored = raw1 || raw2 || raw3;
        if (stored) {
          const parsed = JSON.parse(stored);
          pendingDob = parsed?.dateOfBirth || parsed?.dob || "";
          pendingGender = parsed?.gender || "";
        }
      } catch (err) {
        void err;
      }

      const userDob = rawUser.dateOfBirth || rawUser.dob || pendingDob;
      const userGender = rawUser.gender || pendingGender;

      loggedInUser = {
        ...rawUser,
        dateOfBirth: userDob ? String(userDob) : "",
        dob: userDob ? String(userDob) : "",
        gender: userGender ? String(userGender) : "",
        doctorId: docId ? Number(docId) : undefined,
        doctorProfile:
          (rawUser.doctorProfile as { doctorId?: number }) ||
          (docId ? { doctorId: Number(docId) } : undefined),
      } as User;
    } else {
      loggedInUser = useAuthStore.getState().user;
    }

    if (loggedInUser) {
      const tokens: AuthTokens = {
        accessToken: String(authData.accessToken || resAny.accessToken || ""),
        refreshToken: String(
          authData.refreshToken || resAny.refreshToken || "",
        ),
        tokenType: String(authData.tokenType || resAny.tokenType || "Bearer"),
        expiresIn: Number(authData.expiresIn || resAny.expiresIn || 86400),
      };

      // Endpoint 11 Check: Forced Password Change required
      if (loggedInUser.mustChangePassword) {
        pendingUserRef.current = loggedInUser;
        pendingTokensRef.current = tokens;
        setCurrentScreen("change-password");
        return;
      }

      // Complete login directly and navigate to dashboard for all roles
      useAuthStore.login(loggedInUser, tokens);
      navigate(ROUTES.DASHBOARD);
      return;
    }

    navigate(ROUTES.DASHBOARD);
  };

  const handlePatientRegisterSuccess = (
    response: PatientRegistrationResponse,
  ) => {
    // Backend may return `accountId` at the root instead of a `data` object
    const email = response.data?.email || "your registered email";
    const patientId =
      response.data?.patientId ||
      (response as unknown as Record<string, string | number>).accountId ||
      "your new ID";

    setSuccessInfo({
      title: "Registration Successful!",
      message:
        response.message ||
        `Account created for ${email} with Patient ID ${patientId}. Please check your inbox for verification.`,
    });
    setCurrentScreen("success");
  };

  return (
    <div className="auth-page-container min-h-screen lg:h-screen w-full flex flex-col lg:flex-row bg-[#F8FAFC] overflow-y-auto lg:overflow-hidden font-body">
      {/* Left Branding Panel (50% width, full height) */}
      <BrandingPanel />

      {/* Right Form Area (50% width, centered container layout) */}
      <main className="auth-right-panel w-full lg:w-1/2 min-h-screen lg:h-full flex flex-col items-center justify-center p-3 sm:p-6 lg:p-8 bg-slate-50 relative overflow-y-auto lg:overflow-hidden">
        {/* Soft glowing ambient backgrounds */}
        <div className="absolute top-0 right-0 w-120 h-120 bg-[#0D47A1]/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-120 h-120 bg-secondary/5 rounded-full blur-3xl pointer-events-none" />

        {/* Card Container wrapper for form screens */}
        <div className="auth-card w-full max-w-xl bg-white rounded-2xl border border-slate-100/80 shadow-xl shadow-slate-200/50 p-4 sm:p-6 md:p-7 relative z-10 transition-colors duration-300 my-auto">
          {/* 1. Login Screen */}
          {currentScreen === "login" && (
            <LoginForm
              onSuccess={handleLoginSuccess}
              onForgotPassword={() => setCurrentScreen("forgot")}
              onGoToRegister={() => setCurrentScreen("register")}
            />
          )}

          {/* 2. Register Screen */}
          {currentScreen === "register" && (
            <PatientRegisterForm
              onSuccess={handlePatientRegisterSuccess}
              onGoToLogin={() => setCurrentScreen("login")}
            />
          )}

          {/* 3. Forgot Password Screen */}
          {currentScreen === "forgot" && (
            <ForgotPasswordPage
              onBackToLogin={() => setCurrentScreen("login")}
              onSendOTP={(email) => {
                setResetEmail(email);
                setCurrentScreen("otp");
              }}
            />
          )}

          {/* 4. OTP Verification Screen */}
          {currentScreen === "otp" && (
            <OTPPage
              email={resetEmail}
              onBack={() => setCurrentScreen("forgot")}
              onVerified={() => {
                setCurrentScreen("reset");
              }}
            />
          )}

          {/* 5. Reset Password Screen */}
          {currentScreen === "reset" && (
            <ResetPasswordPage
              onSuccess={() => {
                setSuccessInfo({
                  title: "Password Reset Successfully!",
                  message:
                    "Your password has been updated. You can now sign in with your new password.",
                });
                setCurrentScreen("success");
              }}
            />
          )}

          {/* 6. Forced Password Change Screen */}
          {currentScreen === "change-password" && (
            <ChangePasswordPage
              onSuccess={() => {
                if (pendingUserRef.current && pendingTokensRef.current) {
                  useAuthStore.login(
                    pendingUserRef.current,
                    pendingTokensRef.current,
                  );
                  pendingUserRef.current = null;
                  pendingTokensRef.current = null;
                }
                navigate(ROUTES.DASHBOARD);
              }}
            />
          )}

          {/* 7. Success Screen */}
          {currentScreen === "success" && (
            <SuccessPage
              title={successInfo?.title || "Action Completed!"}
              message={successInfo?.message || "Operation successful."}
              onContinue={() => {
                if (pendingUserRef.current && pendingTokensRef.current) {
                  useAuthStore.login(
                    pendingUserRef.current,
                    pendingTokensRef.current,
                  );
                  pendingUserRef.current = null;
                  pendingTokensRef.current = null;
                }
                const isAuthenticated = useAuthStore.getState().isAuthenticated;
                setSuccessInfo(null);
                if (isAuthenticated) {
                  if (navigate) {
                    navigate(ROUTES.DASHBOARD);
                  }
                } else {
                  setCurrentScreen("login");
                }
              }}
            />
          )}
        </div>
      </main>
    </div>
  );
};
