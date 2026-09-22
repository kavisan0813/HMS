/**
 * PatientOnboardingRoute – First-login gate for PATIENT accounts.
 * After the patient logs in for the first time, their backend patient record
 * only contains the details collected during account registration (name, email,
 * mobile). If the record is missing the mandatory clinical details
 * (gender, date of birth), the Patient Registration form is shown automatically
 * in self-completion mode. Once completed, the patient lands on their profile.
 */
import { useEffect, useState } from "react";
import { Outlet, useNavigate } from "react-router";
import { useAuthStore } from "../../auth/store/auth.store";
import { patientsApi } from "../api/patient.api";
import { lazy, Suspense } from "react";

const RegisterPatientScreen = lazy(() =>
  import("../pages/RegisterPatientScreen").then((m) => ({
    default: m.RegisterPatientScreen,
  })),
);
import { ROUTES } from "../../../app/routes/routes";
import { usePatientPortal } from "../context/usePatientPortal";

type OnboardingState = "checking" | "complete" | "incomplete";

export function PatientOnboardingRoute() {
  const user = useAuthStore((s) => s.user);
  const navigate = useNavigate();
  const portal = usePatientPortal();
  const isPatient = String(user?.role ?? "").toUpperCase() === "PATIENT";
  const [state, setState] = useState<OnboardingState>("checking");

  const effectiveState = !isPatient ? "complete" : state;

  useEffect(() => {
    if (!isPatient) {
      return;
    }
    let cancelled = false;

    const checkProfile = async () => {
      try {
        // /my is tied to the authenticated account, unlike user.id which is
        // not guaranteed to be the patient's MRN.
        const patients = await patientsApi.getMyPatients();
        const patient =
          patients.find(
            (entry) => String(entry.relationship).toUpperCase() === "SELF",
          ) ||
          patients.find((entry) => entry.mrn === user?.patientId) ||
          patients[0];

        if (cancelled) return;
        setState(
          patient?.gender && (patient.dateOfBirth || patient.dob)
            ? "complete"
            : "incomplete",
        );
      } catch (err) {
        console.log(err);
        if (!cancelled) setState("incomplete");
      }
    };

    void checkProfile();
    return () => {
      cancelled = true;
    };
  }, [isPatient, user?.patientId, user?.id]);

  if (!isPatient || effectiveState === "complete") {
    return <Outlet />;
  }

  if (effectiveState === "checking") {
    return (
      <div className="flex-1 min-h-screen bg-[#F4F6F9] flex items-center justify-center">
        <div className="text-xs text-[#64748B]">Loading your profile...</div>
      </div>
    );
  }

  const handleCompleteAndNavigate = () => {
    setState("complete");
    portal?.refresh();
    navigate(ROUTES.DASHBOARD, { replace: true });
  };

  return (
    <Suspense
      fallback={
        <div className="flex-1 min-h-screen bg-[#F4F6F9] flex items-center justify-center">
          <div className="text-xs text-[#64748B]">
            Loading registration form...
          </div>
        </div>
      }
    >
      <RegisterPatientScreen
        registrationMode="PATIENT_SELF"
        primaryPatientMrn={portal?.primaryMrn || undefined}
        onRegistered={handleCompleteAndNavigate}
        onViewProfile={handleCompleteAndNavigate}
      />
    </Suspense>
  );
}
