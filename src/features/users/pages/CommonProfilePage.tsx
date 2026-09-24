import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { useParams, useNavigate } from "react-router";
import {
  User,
  Mail,
  Phone,
  Calendar,
  MapPin,
  Stethoscope,
  Clock,
  Camera,
  Trash2,
  Edit2,
  Save,
  X,
  Lock,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  KeyRound,
  Plus,
  Briefcase,
  ArrowLeft,
} from "lucide-react";
import { useAuthStore, authStoreActions } from "../../auth/store/auth.store";
import { usersApi } from "../api/users.api";
import { authApi } from "../../auth/api/auth.api";
import { departmentsApi } from "../api/departments.api";
import { to24Hour } from "../../../lib/time-utils";
import { UserAvatar } from "../../../common/components/UserAvatar";
import type {
  UserDetailData,
  AdminUpdateStaffData,
  BackendAvailabilityItem,
  ScheduleException,
} from "../types/users.types";
import type {
  ApiDepartmentLookupItem,
  ApiSpecialty,
} from "../api/departments.api";

const PP = "Poppins, sans-serif";
const RB = "Roboto, sans-serif";

const DAYS_OF_WEEK = [
  "MONDAY",
  "TUESDAY",
  "WEDNESDAY",
  "THURSDAY",
  "FRIDAY",
  "SATURDAY",
  "SUNDAY",
];

const DAY_LABELS: Record<string, string> = {
  MONDAY: "Monday",
  TUESDAY: "Tuesday",
  WEDNESDAY: "Wednesday",
  THURSDAY: "Thursday",
  FRIDAY: "Friday",
  SATURDAY: "Saturday",
  SUNDAY: "Sunday",
};

export function CommonProfilePage() {
  const { userId: urlUserId } = useParams<{ userId?: string }>();
  const navigate = useNavigate();
  const authUser = useAuthStore((s) => s.user);

  const authUserId =
    authUser?.id ?? (authUser as unknown as { userId?: number })?.userId;

  // Target User ID to fetch
  const targetUserId = useMemo(() => {
    if (urlUserId && !isNaN(Number(urlUserId))) {
      return Number(urlUserId);
    }
    if (authUserId) return Number(authUserId);
    return null;
  }, [urlUserId, authUserId]);

  const isSelfProfile = useMemo(() => {
    if (!targetUserId || !authUser) return true;
    return String(authUserId) === String(targetUserId);
  }, [targetUserId, authUser, authUserId]);

  // Page States
  const [profile, setProfile] = useState<UserDetailData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Toast / Alert notifications
  const [toast, setToast] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  // Department & Specialty options for Doctor editing
  const [departments, setDepartments] = useState<ApiDepartmentLookupItem[]>([]);
  const [specialties] = useState<ApiSpecialty[]>([]);

  // Form State
  const [form, setForm] = useState({
    fullName: "",
    email: "",
    mobile: "",
    gender: "MALE",
    dateOfBirth: "",
    residentialAddress: "",
    professionalBio: "",
    photo: "",
    photoUrl: "",
    // Doctor fields
    medicalRegistrationNumber: "",
    qualification: "",
    yearsOfExperience: 0,
    primaryDepartmentId: 0,
    secondaryDepartmentIds: [] as number[],
    primarySpecialtyId: 0,
    secondarySpecialtyIds: [] as number[],
    consultationFee: 0,
    slotDurationMinutes: 15,
    availability: [] as BackendAvailabilityItem[],
    scheduleExceptions: [] as ScheduleException[],
    changeReason: "Profile update",
  });

  // Photo Uploading State
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const photoInputRef = useRef<HTMLInputElement>(null);

  // Password Change Form State
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);

  // Schedule Exception Input state
  const [newExceptionDate, setNewExceptionDate] = useState("");
  const [newExceptionReason, setNewExceptionReason] = useState("");

  const showToast = useCallback(
    (type: "success" | "error", message: string) => {
      setToast({ type, message });
      setTimeout(() => setToast(null), 4000);
    },
    [],
  );

  const isDoctorRole = useMemo(() => {
    if (!profile) return false;
    return (
      String(profile.role).toUpperCase().includes("DOCTOR") ||
      !!profile.doctorProfile
    );
  }, [profile]);

  const isPatientRole = useMemo(() => {
    if (!profile) return false;
    return String(profile.role).toUpperCase() === "PATIENT";
  }, [profile]);

  // Fetch Departments lookup (only for Doctor roles)
  useEffect(() => {
    if (!isDoctorRole) return;

    departmentsApi
      .getDepartmentLookup(true)
      .then((list) => {
        if (list && list.length > 0) setDepartments(list);
      })
      .catch(() => {});
  }, [isDoctorRole]);

  // Fetch Profile Data from GET /api/v1/admin/users/{userId}
  const loadProfile = useCallback(async () => {
    if (!targetUserId) {
      setLoading(false);
      setError("No user ID identified to fetch profile.");
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const response = await usersApi.adminGetUserById(targetUserId);
      if (response.success && response.data) {
        const data = response.data;

        const rawGender =
          data.gender ||
          (data as unknown as { sex?: string }).sex ||
          authUser?.gender ||
          "";

        const rawDob =
          data.dateOfBirth ||
          (data as unknown as { dob?: string }).dob ||
          (data as unknown as { birthDate?: string }).birthDate ||
          authUser?.dateOfBirth ||
          authUser?.dob ||
          "";

        const normalizedData: UserDetailData = {
          ...data,
          gender: rawGender || data.gender,
          dateOfBirth: rawDob || data.dateOfBirth,
        };

        setProfile(normalizedData);
        const doc = data.doctorProfile;

        // Initialize form with backend values
        setForm({
          fullName: data.fullName || authUser?.fullName || authUser?.name || "",
          email: data.email || authUser?.email || "",
          mobile: data.mobile || authUser?.mobile || "",
          gender: (rawGender || "MALE").toUpperCase(),
          dateOfBirth: rawDob ? String(rawDob).split("T")[0] : "",
          residentialAddress: data.residentialAddress || "",
          professionalBio: data.professionalBio || "",
          photo: data.photo || "",
          photoUrl: data.photoUrl || data.photo || "",
          medicalRegistrationNumber: doc?.medicalRegistrationNumber || "",
          qualification: doc?.qualification || "",
          yearsOfExperience: doc?.yearsOfExperience || 0,
          primaryDepartmentId: doc?.primaryDepartment?.departmentId || 0,
          secondaryDepartmentIds: (doc?.secondaryDepartments || []).map(
            (d) => d.departmentId,
          ),
          primarySpecialtyId: doc?.primarySpecialty?.specialtyId || 0,
          secondarySpecialtyIds: (doc?.secondarySpecialties || []).map(
            (s) => s.specialtyId,
          ),
          consultationFee: doc?.consultationFee || 0,
          slotDurationMinutes: doc?.slotDurationMinutes || 15,
          availability: doc?.availability || [],
          scheduleExceptions: doc?.scheduleExceptions || [],
          changeReason: "Profile update",
        });
      } else {
        setError(response.message || "Failed to load user profile details.");
      }
    } catch (err: unknown) {
      setError(
        err instanceof Error
          ? err.message
          : "Error fetching user profile details.",
      );
    } finally {
      setLoading(false);
    }
  }, [targetUserId, authUser]);

  useEffect(() => {
    Promise.resolve().then(() => {
      loadProfile();
    });
  }, [loadProfile]);

  // Handle Photo Upload (POST /api/v1/upload -> PUT /api/v1/admin/users/{userId} -> GET)
  const handlePhotoUpload = async (file: File) => {
    if (!file || !targetUserId) return;
    const validTypes = [
      "image/jpeg",
      "image/jpg",
      "image/png",
      "image/webp",
      "image/gif",
      "image/svg+xml",
    ];
    if (!validTypes.includes(file.type.toLowerCase())) {
      showToast(
        "error",
        "Please upload a valid image file (JPG, PNG, WEBP, GIF, SVG).",
      );
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      showToast("error", "Image file size exceeds maximum limit of 5MB.");
      return;
    }

    setIsUploadingPhoto(true);
    try {
      const uploadedUrl = await usersApi.uploadPhoto(file);
      if (!uploadedUrl) {
        throw new Error("Uploaded photo URL was empty.");
      }

      // Update local form & save profile with new photo URL
      setForm((prev) => ({
        ...prev,
        photoUrl: uploadedUrl,
        photo: uploadedUrl,
      }));

      const isDoctorRole = profile
        ? String(profile.role).toUpperCase().includes("DOCTOR") ||
          !!profile.doctorProfile
        : false;

      const safeFullName =
        form.fullName ||
        profile?.fullName ||
        authUser?.fullName ||
        authUser?.name ||
        "Staff Member";
      const safeEmail =
        form.email ||
        profile?.email ||
        authUser?.email ||
        "staff@safehands.org";
      const safeMobile =
        form.mobile ||
        profile?.mobile ||
        authUser?.mobile ||
        "+1 (555) 000-0000";

      const payload: AdminUpdateStaffData = {
        fullName: safeFullName,
        email: safeEmail,
        mobile: safeMobile,
        gender:
          form.gender ||
          (profile?.gender ? profile.gender.toUpperCase() : "MALE"),
        dateOfBirth:
          form.dateOfBirth ||
          (profile?.dateOfBirth
            ? profile.dateOfBirth.split("T")[0]
            : "2000-01-01"),
        photo: uploadedUrl,
        photoUrl: uploadedUrl,
        residentialAddress:
          form.residentialAddress || profile?.residentialAddress || undefined,
        professionalBio:
          form.professionalBio || profile?.professionalBio || undefined,
        changeReason: "Updated profile photo",
        ...(isDoctorRole && profile?.doctorProfile
          ? {
              medicalRegistrationNumber:
                form.medicalRegistrationNumber ||
                profile.doctorProfile.medicalRegistrationNumber,
              qualification:
                form.qualification || profile.doctorProfile.qualification,
              yearsOfExperience:
                Number(form.yearsOfExperience) ||
                profile.doctorProfile.yearsOfExperience ||
                0,
              primaryDepartmentId: form.primaryDepartmentId
                ? Number(form.primaryDepartmentId)
                : profile.doctorProfile.primaryDepartment?.departmentId ||
                  undefined,
              secondaryDepartmentIds: form.secondaryDepartmentIds,
              primarySpecialtyId: form.primarySpecialtyId
                ? Number(form.primarySpecialtyId)
                : profile.doctorProfile.primarySpecialty?.specialtyId ||
                  undefined,
              secondarySpecialtyIds: form.secondarySpecialtyIds,
              consultationFee:
                Number(form.consultationFee) ||
                profile.doctorProfile.consultationFee ||
                0,
              slotDurationMinutes:
                Number(form.slotDurationMinutes) ||
                profile.doctorProfile.slotDurationMinutes ||
                15,
              availability: form.availability.map((item) => ({
                ...item,
                startTime: to24Hour(item.startTime),
                endTime: to24Hour(item.endTime),
              })),
              scheduleExceptions: form.scheduleExceptions,
            }
          : {}),
      };

      const response = await usersApi.adminUpdateStaff(targetUserId, payload);
      if (response.success) {
        showToast(
          "success",
          "Profile photo uploaded and updated successfully!",
        );
        if (isSelfProfile && authUser) {
          authStoreActions.setUser({
            ...authUser,
            photoUrl: uploadedUrl,
            photo: uploadedUrl,
          });
        }
        await loadProfile();
      } else {
        showToast(
          "error",
          response.message || "Failed to update profile photo.",
        );
      }
    } catch (err: unknown) {
      showToast(
        "error",
        err instanceof Error
          ? err.message
          : "Failed to upload and update profile photo.",
      );
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  // Handle Profile Save (PUT /api/v1/admin/users/{userId})
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetUserId || !profile) return;

    setIsSaving(true);
    try {
      const isDoctorRole =
        String(profile.role).toUpperCase().includes("DOCTOR") ||
        !!profile.doctorProfile;

      const safeFullName =
        form.fullName ||
        profile?.fullName ||
        authUser?.fullName ||
        authUser?.name ||
        "Staff Member";
      const safeEmail =
        form.email ||
        profile?.email ||
        authUser?.email ||
        "staff@safehands.org";
      const safeMobile =
        form.mobile ||
        profile?.mobile ||
        authUser?.mobile ||
        "+1 (555) 000-0000";

      const payload: AdminUpdateStaffData = {
        fullName: safeFullName,
        email: safeEmail,
        mobile: safeMobile,
        gender: form.gender,
        dateOfBirth: form.dateOfBirth,
        photo: form.photoUrl || form.photo || undefined,
        photoUrl: form.photoUrl || form.photo || undefined,
        residentialAddress: form.residentialAddress,
        professionalBio: form.professionalBio,
        changeReason: form.changeReason || "Profile update",
        ...(isDoctorRole
          ? {
              medicalRegistrationNumber: form.medicalRegistrationNumber,
              qualification: form.qualification,
              yearsOfExperience: Number(form.yearsOfExperience) || 0,
              primaryDepartmentId: form.primaryDepartmentId
                ? Number(form.primaryDepartmentId)
                : undefined,
              secondaryDepartmentIds: form.secondaryDepartmentIds,
              primarySpecialtyId: form.primarySpecialtyId
                ? Number(form.primarySpecialtyId)
                : undefined,
              secondarySpecialtyIds: form.secondarySpecialtyIds,
              consultationFee: Number(form.consultationFee) || 0,
              slotDurationMinutes: Number(form.slotDurationMinutes) || 15,
              availability: form.availability.map((item) => ({
                ...item,
                startTime: to24Hour(item.startTime),
                endTime: to24Hour(item.endTime),
              })),
              scheduleExceptions: form.scheduleExceptions,
            }
          : {}),
      };

      const response = await usersApi.adminUpdateStaff(targetUserId, payload);
      if (response.success) {
        showToast("success", "Profile updated successfully!");
        setIsEditing(false);
        if (isSelfProfile && authUser) {
          authStoreActions.setUser({
            ...authUser,
            fullName: form.fullName || authUser.fullName,
            name: form.fullName || authUser.name,
            email: form.email || authUser.email,
            mobile: form.mobile || authUser.mobile,
            gender: form.gender || authUser.gender,
            photoUrl: form.photoUrl || form.photo || authUser.photoUrl,
            photo: form.photo || form.photoUrl || authUser.photo,
          });
        }
        await loadProfile();
      } else {
        showToast("error", response.message || "Failed to update profile.");
      }
    } catch (err: unknown) {
      showToast(
        "error",
        err instanceof Error ? err.message : "Error saving profile details.",
      );
    } finally {
      setIsSaving(false);
    }
  };

  // Handle Change Password (POST /api/v1/auth/change-password)
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError(null);
    setPasswordSuccess(null);

    const { currentPassword, newPassword, confirmPassword } = passwordForm;

    if (!currentPassword) {
      setPasswordError("Current password is required.");
      return;
    }
    if (!newPassword) {
      setPasswordError("New password is required.");
      return;
    }
    if (newPassword.length < 6) {
      setPasswordError("New password must be at least 6 characters long.");
      return;
    }
    if (newPassword === currentPassword) {
      setPasswordError("New password cannot be identical to current password.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError("New password and confirm password do not match.");
      return;
    }

    setPasswordLoading(true);
    try {
      const response = await authApi.changePassword({
        currentPassword,
        newPassword,
        confirmPassword,
      });

      if (response.success) {
        setPasswordSuccess(
          response.message || "Password changed successfully!",
        );
        setPasswordForm({
          currentPassword: "",
          newPassword: "",
          confirmPassword: "",
        });
      } else {
        setPasswordError(response.message || "Failed to change password.");
      }
    } catch (err: unknown) {
      setPasswordError(
        err instanceof Error ? err.message : "Failed to change password.",
      );
    } finally {
      setPasswordLoading(false);
    }
  };

  // Doctor Availability helpers
  const toggleAvailabilityDay = (day: string) => {
    setForm((prev) => {
      const exists = prev.availability.find(
        (a) => a.dayOfWeek.toUpperCase() === day.toUpperCase(),
      );
      if (exists) {
        return {
          ...prev,
          availability: prev.availability.filter(
            (a) => a.dayOfWeek.toUpperCase() !== day.toUpperCase(),
          ),
        };
      } else {
        return {
          ...prev,
          availability: [
            ...prev.availability,
            {
              dayOfWeek: day.toUpperCase(),
              startTime: "09:00",
              endTime: "17:00",
            },
          ],
        };
      }
    });
  };

  const updateAvailabilityTime = (
    day: string,
    field: "startTime" | "endTime",
    value: string,
  ) => {
    setForm((prev) => ({
      ...prev,
      availability: prev.availability.map((item) =>
        item.dayOfWeek.toUpperCase() === day.toUpperCase()
          ? { ...item, [field]: value }
          : item,
      ),
    }));
  };

  // Schedule Exceptions helpers
  const addScheduleException = () => {
    if (!newExceptionDate) return;
    setForm((prev) => ({
      ...prev,
      scheduleExceptions: [
        ...prev.scheduleExceptions,
        {
          exceptionDate: newExceptionDate,
          reason: newExceptionReason || "Leave / Off Day",
        },
      ],
    }));
    setNewExceptionDate("");
    setNewExceptionReason("");
  };

  const removeScheduleException = (index: number) => {
    setForm((prev) => ({
      ...prev,
      scheduleExceptions: prev.scheduleExceptions.filter((_, i) => i !== index),
    }));
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[500px] p-8 text-slate-500">
        <Loader2 className="w-10 h-10 animate-spin text-[#0D47A1] mb-3" />
        <p className="text-sm font-semibold" style={{ fontFamily: PP }}>
          Loading user profile details...
        </p>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <div className="p-6 bg-red-50 border border-red-200 rounded-2xl text-center space-y-3">
          <AlertTriangle className="w-10 h-10 text-[#EF4444] mx-auto" />
          <h3
            className="text-base font-bold text-red-900"
            style={{ fontFamily: PP }}
          >
            Unable to Load User Profile
          </h3>
          <p
            className="text-xs text-red-700 font-medium"
            style={{ fontFamily: RB }}
          >
            {error || "Profile data was not returned by backend service."}
          </p>
          <button
            onClick={loadProfile}
            className="px-4 py-2 bg-[#0D47A1] text-white rounded-xl text-xs font-semibold hover:bg-blue-800 transition-colors shadow-sm"
          >
            Retry Loading
          </button>
        </div>
      </div>
    );
  }

  const displayPhoto =
    form.photoUrl || form.photo || profile.photoUrl || profile.photo;

  const handleBack = () => {
    navigate(-1);
  };

  return (
    <div
      className="flex-1 p-6 space-y-6 w-full"
      style={{ fontFamily: RB }}
    >
      {/* Toast Banner */}
      {toast && (
        <div
          className={`fixed top-5 right-5 z-50 flex items-center gap-3 px-5 py-3 rounded-2xl shadow-2xl border text-xs font-semibold transition-all ${
            toast.type === "success"
              ? "bg-emerald-900 text-white border-emerald-700"
              : "bg-red-900 text-white border-red-700"
          }`}
        >
          {toast.type === "success" ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          ) : (
            <AlertTriangle className="w-5 h-5 text-red-400 shrink-0" />
          )}
          <span>{toast.message}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-gradient-to-r from-[#0D47A1] via-[#1565C0] to-[#1E88E5] text-white rounded-3xl p-6 shadow-xl relative overflow-hidden">
        <button
              type="button"
              onClick={handleBack}
              className="inline-flex items-center gap-2 px-3.5 py-2 mb-3 text-xs font-semibold text-slate-700 hover:text-slate-900 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl shadow-xs transition-all cursor-pointer"
              style={{ fontFamily: RB }}
            >
              <ArrowLeft size={16} />
              Back
            </button>
        <div className="absolute -right-10 -bottom-10 opacity-10 pointer-events-none">
          <User size={200} />
        </div>

        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 relative z-10">
          <div className="flex items-center gap-2">
            <div>
              <h1
                className="text-xl sm:text-2xl font-bold tracking-tight"
                style={{ fontFamily: PP }}
              >
                {isSelfProfile
                  ? "My Account Profile"
                  : `${profile.fullName}'s Profile`}
              </h1>
              <p className="text-xs text-blue-100 mt-1">
                Manage personal credentials, professional details, and security
                settings
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {isEditing ? (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  disabled={isSaving}
                  className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <X size={15} /> Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveProfile}
                  disabled={isSaving || isUploadingPhoto}
                  className="px-5 py-2 bg-white text-[#0D47A1] rounded-xl text-xs font-bold hover:bg-blue-50 transition-colors shadow-md flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {isSaving ? (
                    <>
                      <Loader2
                        size={15}
                        className="animate-spin text-[#0D47A1]"
                      />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save size={15} /> Save Changes
                    </>
                  )}
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setIsEditing(true)}
                className="px-4 py-2 bg-white text-[#0D47A1] rounded-xl text-xs font-bold hover:bg-blue-50 transition-colors shadow-md flex items-center gap-1.5 cursor-pointer"
              >
                <Edit2 size={15} /> Edit Profile
              </button>
            )}
          </div>
        </div>

        {/* Profile Header Summary Box */}
        <div className="mt-6 pt-6 border-t border-white/20 flex flex-col md:flex-row items-center gap-6">
          {/* Avatar & Photo Upload */}
          <div className="relative group shrink-0">
            <div className="w-24 h-24 rounded-2xl overflow-hidden border-2 border-white/80 bg-white/10 shadow-lg flex items-center justify-center relative">
              <UserAvatar
                name={profile.fullName}
                photoUrl={displayPhoto}
                size="xl"
                className="w-full h-full text-2xl"
              />

              {isUploadingPhoto && (
                <div className="absolute inset-0 bg-slate-900/70 backdrop-blur-xs flex flex-col items-center justify-center text-white">
                  <Loader2 size={20} className="animate-spin text-white mb-1" />
                  <span className="text-[9px] font-bold">Uploading</span>
                </div>
              )}
            </div>

            <input
              ref={photoInputRef}
              type="file"
              accept="image/png,image/jpeg,image/jpg,image/webp,image/gif,image/svg+xml"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handlePhotoUpload(file);
                e.target.value = "";
              }}
            />

            <button
              type="button"
              onClick={() => photoInputRef.current?.click()}
              disabled={isUploadingPhoto}
              title="Change Profile Photo"
              className="absolute -bottom-1 -right-1 p-2 bg-white text-[#0D47A1] rounded-xl shadow-lg hover:bg-blue-50 transition-all cursor-pointer border border-blue-100 disabled:opacity-50"
            >
              <Camera size={14} />
            </button>
          </div>

          {/* Key Identity Info */}
          <div className="flex-1 text-center md:text-left space-y-2">
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-2">
              <h2
                className="text-xl font-bold text-white"
                style={{ fontFamily: PP }}
              >
                {profile.fullName}
              </h2>
              <span className="px-2.5 py-0.5 bg-white/20 text-white rounded-full text-[10px] font-bold uppercase tracking-wider">
                {profile.role}
              </span>
              <span
                className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                  String(profile.status).toUpperCase() === "ACTIVE"
                    ? "bg-emerald-400/30 text-emerald-100 border border-emerald-300/40"
                    : "bg-amber-400/30 text-amber-100 border border-amber-300/40"
                }`}
              >
                ● {profile.status}
              </span>
            </div>

            <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 text-xs text-blue-100 font-medium">
              {profile.employeeId && !isPatientRole && (
                <div className="flex items-center gap-1.5">
                  <Briefcase size={14} className="text-blue-200" />
                  <span>
                    Employee ID:{" "}
                    <strong className="text-white">{profile.employeeId}</strong>
                  </span>
                </div>
              )}
              <div className="flex items-center gap-1.5">
                <Mail size={14} className="text-blue-200" />
                <span>{profile.email}</span>
              </div>
              {profile.mobile && (
                <div className="flex items-center gap-1.5">
                  <Phone size={14} className="text-blue-200" />
                  <span>{profile.mobile}</span>
                </div>
              )}
            </div>

            {profile.lastSuccessfulLogin && (
              <div className="text-[11px] text-blue-200/90 flex items-center justify-center md:justify-start gap-1 pt-1">
                <Clock size={12} />
                <span>
                  Last Login:{" "}
                  {new Date(profile.lastSuccessfulLogin).toLocaleString()}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Profile Content Grid */}
      <form onSubmit={handleSaveProfile} className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Card 1: Personal Information */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
            <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
              <div className="w-8 h-8 rounded-xl bg-blue-50 text-[#0D47A1] flex items-center justify-center font-bold">
                <User size={18} />
              </div>
              <div>
                <h3
                  className="text-sm font-bold text-slate-800"
                  style={{ fontFamily: PP }}
                >
                  Personal Information
                </h3>
                <p className="text-[11px] text-slate-500">
                  Basic personal demographics
                </p>
              </div>
            </div>

            <div className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Full Name
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    required
                    value={form.fullName}
                    onChange={(e) =>
                      setForm({ ...form, fullName: e.target.value })
                    }
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-xl outline-none focus:border-[#0D47A1]"
                  />
                ) : (
                  <p className="text-xs font-semibold text-slate-800 bg-slate-50 px-3 py-2 rounded-xl border border-slate-100">
                    {profile.fullName || "-"}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Gender
                  </label>
                  {isEditing ? (
                    <select
                      value={form.gender}
                      onChange={(e) =>
                        setForm({ ...form, gender: e.target.value })
                      }
                      className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-xl outline-none focus:border-[#0D47A1]"
                    >
                      <option value="MALE">Male</option>
                      <option value="FEMALE">Female</option>
                      <option value="OTHER">Other</option>
                    </select>
                  ) : (
                    <p className="text-xs font-semibold text-slate-800 bg-slate-50 px-3 py-2 rounded-xl border border-slate-100 capitalize">
                      {profile.gender ||
                        (profile as unknown as { sex?: string }).sex ||
                        authUser?.gender ||
                        "-"}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Date of Birth
                  </label>
                  {isEditing ? (
                    <input
                      type="date"
                      value={form.dateOfBirth}
                      onChange={(e) =>
                        setForm({ ...form, dateOfBirth: e.target.value })
                      }
                      className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-xl outline-none focus:border-[#0D47A1]"
                    />
                  ) : (
                    <p className="text-xs font-semibold text-slate-800 bg-slate-50 px-3 py-2 rounded-xl border border-slate-100">
                      {profile.dateOfBirth
                        ? String(profile.dateOfBirth).split("T")[0]
                        : (profile as unknown as { dob?: string }).dob
                          ? String(
                              (profile as unknown as { dob?: string }).dob,
                            ).split("T")[0]
                          : authUser?.dateOfBirth || authUser?.dob || "-"}
                    </p>
                  )}
                </div>
              </div>

              <div
                className={`grid ${isPatientRole ? "grid-cols-1" : "grid-cols-2"} gap-3`}
              >
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Role
                  </label>
                  <p className="text-xs font-semibold text-slate-600 bg-slate-100 px-3 py-2 rounded-xl border border-slate-200">
                    {profile.role}
                  </p>
                </div>

                {!isPatientRole && (
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Employee ID
                    </label>
                    <p className="text-xs font-semibold text-slate-600 bg-slate-100 px-3 py-2 rounded-xl border border-slate-200">
                      {profile.employeeId || "-"}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Card 2: Contact & Address Information */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
            <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
              <div className="w-8 h-8 rounded-xl bg-blue-50 text-[#0D47A1] flex items-center justify-center font-bold">
                <MapPin size={18} />
              </div>
              <div>
                <h3
                  className="text-sm font-bold text-slate-800"
                  style={{ fontFamily: PP }}
                >
                  Contact & Residential Address
                </h3>
                <p className="text-[11px] text-slate-500">
                  Contact detail details & residential location
                </p>
              </div>
            </div>

            <div className="space-y-3.5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Email Address{" "}
                    {isEditing && (
                      <span className="text-[10px] text-slate-400 font-normal">
                        (Locked)
                      </span>
                    )}
                  </label>
                  {isEditing ? (
                    <input
                      type="email"
                      readOnly
                      disabled
                      value={form.email || profile.email || "-"}
                      className="w-full px-3 py-2 text-xs bg-slate-100 border border-slate-200 rounded-xl text-slate-500 font-semibold cursor-not-allowed outline-none"
                    />
                  ) : (
                    <p className="text-xs font-semibold text-slate-800 bg-slate-50 px-3 py-2 rounded-xl border border-slate-100 truncate">
                      {profile.email || "-"}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Mobile Phone
                  </label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={form.mobile}
                      onChange={(e) =>
                        setForm({ ...form, mobile: e.target.value })
                      }
                      className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-xl outline-none focus:border-[#0D47A1]"
                    />
                  ) : (
                    <p className="text-xs font-semibold text-slate-800 bg-slate-50 px-3 py-2 rounded-xl border border-slate-100">
                      {profile.mobile || "-"}
                    </p>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Residential Address
                </label>
                {isEditing ? (
                  <textarea
                    rows={2}
                    value={form.residentialAddress}
                    onChange={(e) =>
                      setForm({ ...form, residentialAddress: e.target.value })
                    }
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-xl outline-none focus:border-[#0D47A1]"
                    placeholder="Enter residential address..."
                  />
                ) : (
                  <p className="text-xs font-medium text-slate-800 bg-slate-50 px-3 py-2 rounded-xl border border-slate-100 min-h-12">
                    {profile.residentialAddress || "No address provided"}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Professional Bio
                </label>
                {isEditing ? (
                  <textarea
                    rows={2}
                    value={form.professionalBio}
                    onChange={(e) =>
                      setForm({ ...form, professionalBio: e.target.value })
                    }
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-xl outline-none focus:border-[#0D47A1]"
                    placeholder="Enter professional bio or summary..."
                  />
                ) : (
                  <p className="text-xs font-medium text-slate-800 bg-slate-50 px-3 py-2 rounded-xl border border-slate-100 min-h-12">
                    {profile.professionalBio || "No bio provided"}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Card 3: Doctor Professional Information & Schedule (DOCTOR role only) */}
        {isDoctorRole && (
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-6">
            <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
              <div className="w-8 h-8 rounded-xl bg-teal-50 text-[#009688] flex items-center justify-center font-bold">
                <Stethoscope size={18} />
              </div>
              <div>
                <h3
                  className="text-sm font-bold text-slate-800"
                  style={{ fontFamily: PP }}
                >
                  Doctor Clinical & Practice Profile
                </h3>
                <p className="text-[11px] text-slate-500">
                  Qualifications, fees, availability, and exceptions
                </p>
              </div>
            </div>

            {/* Qualifications & Fees */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Medical Reg. Number
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    value={form.medicalRegistrationNumber}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        medicalRegistrationNumber: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-xl outline-none focus:border-[#0D47A1]"
                  />
                ) : (
                  <p className="text-xs font-semibold text-slate-800 bg-slate-50 px-3 py-2 rounded-xl border border-slate-100">
                    {profile.doctorProfile?.medicalRegistrationNumber || "-"}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Qualification
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    value={form.qualification}
                    onChange={(e) =>
                      setForm({ ...form, qualification: e.target.value })
                    }
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-xl outline-none focus:border-[#0D47A1]"
                  />
                ) : (
                  <p className="text-xs font-semibold text-slate-800 bg-slate-50 px-3 py-2 rounded-xl border border-slate-100">
                    {profile.doctorProfile?.qualification || "-"}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Experience (Years)
                </label>
                {isEditing ? (
                  <input
                    type="number"
                    min={0}
                    value={form.yearsOfExperience}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        yearsOfExperience: Number(e.target.value),
                      })
                    }
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-xl outline-none focus:border-[#0D47A1]"
                  />
                ) : (
                  <p className="text-xs font-semibold text-slate-800 bg-slate-50 px-3 py-2 rounded-xl border border-slate-100">
                    {profile.doctorProfile?.yearsOfExperience ?? 0} yrs
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Consultation Fee (₹)
                </label>
                {isEditing ? (
                  <input
                    type="number"
                    min={0}
                    value={form.consultationFee}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        consultationFee: Number(e.target.value),
                      })
                    }
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-xl outline-none focus:border-[#0D47A1]"
                  />
                ) : (
                  <p className="text-xs font-semibold text-slate-800 bg-slate-50 px-3 py-2 rounded-xl border border-slate-100">
                    ₹{profile.doctorProfile?.consultationFee ?? 0}
                  </p>
                )}
              </div>
            </div>

            {/* Departments & Specialties */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Primary Department
                </label>
                {isEditing ? (
                  <select
                    value={form.primaryDepartmentId}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        primaryDepartmentId: Number(e.target.value),
                      })
                    }
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-xl outline-none focus:border-[#0D47A1]"
                  >
                    <option value={0}>Select Department...</option>
                    {departments.map((d) => (
                      <option key={d.departmentId} value={d.departmentId}>
                        {d.departmentName}
                      </option>
                    ))}
                  </select>
                ) : (
                  <p className="text-xs font-semibold text-slate-800 bg-slate-50 px-3 py-2 rounded-xl border border-slate-100">
                    {profile.doctorProfile?.primaryDepartment?.departmentName ||
                      "General Medicine"}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Primary Specialty
                </label>
                {isEditing ? (
                  <select
                    value={form.primarySpecialtyId}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        primarySpecialtyId: Number(e.target.value),
                      })
                    }
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-xl outline-none focus:border-[#0D47A1]"
                  >
                    <option value={0}>Select Specialty...</option>
                    {specialties.map((s) => {
                      const specObj = s as unknown as {
                        specialtyId?: number;
                        id?: number;
                        specialtyName?: string;
                        name?: string;
                      };
                      const specId = specObj.specialtyId || specObj.id || 0;
                      const specName =
                        specObj.specialtyName || specObj.name || "";
                      return (
                        <option key={specId} value={specId}>
                          {specName}
                        </option>
                      );
                    })}
                  </select>
                ) : (
                  <p className="text-xs font-semibold text-slate-800 bg-slate-50 px-3 py-2 rounded-xl border border-slate-100">
                    {profile.doctorProfile?.primarySpecialty?.specialtyName ||
                      "-"}
                  </p>
                )}
              </div>
            </div>

            {/* Weekly Availability Schedule */}
            <div className="space-y-3 pt-2">
              <h4
                className="text-xs font-bold text-slate-800 flex items-center gap-1.5"
                style={{ fontFamily: PP }}
              >
                <Clock size={15} className="text-[#0D47A1]" /> Weekly OPD
                Consultation Schedule
              </h4>

              {isEditing ? (
                <div className="space-y-2 bg-slate-50 p-4 rounded-xl border border-slate-200">
                  {DAYS_OF_WEEK.map((day) => {
                    const activeItem = form.availability.find(
                      (a) => a.dayOfWeek.toUpperCase() === day.toUpperCase(),
                    );
                    const isSelected = !!activeItem;

                    return (
                      <div
                        key={day}
                        className="flex items-center gap-4 text-xs py-1 border-b border-slate-200 last:border-0"
                      >
                        <label className="w-28 font-bold flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleAvailabilityDay(day)}
                            className="rounded border-slate-300 text-[#0D47A1] focus:ring-blue-500"
                          />
                          <span>{DAY_LABELS[day]}</span>
                        </label>

                        {isSelected ? (
                          <div className="flex items-center gap-2">
                            <input
                              type="time"
                              value={activeItem?.startTime || "09:00"}
                              onChange={(e) =>
                                updateAvailabilityTime(
                                  day,
                                  "startTime",
                                  e.target.value,
                                )
                              }
                              className="px-2 py-1 bg-white border border-slate-300 rounded-lg text-xs"
                            />
                            <span className="text-slate-400">to</span>
                            <input
                              type="time"
                              value={activeItem?.endTime || "17:00"}
                              onChange={(e) =>
                                updateAvailabilityTime(
                                  day,
                                  "endTime",
                                  e.target.value,
                                )
                              }
                              className="px-2 py-1 bg-white border border-slate-300 rounded-lg text-xs"
                            />
                          </div>
                        ) : (
                          <span className="text-slate-400 italic text-[11px]">
                            Not Available
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {DAYS_OF_WEEK.map((day) => {
                    const activeItem =
                      profile.doctorProfile?.availability?.find(
                        (a) => a.dayOfWeek.toUpperCase() === day.toUpperCase(),
                      );
                    return (
                      <div
                        key={day}
                        className={`p-2.5 rounded-xl border text-xs text-center ${
                          activeItem
                            ? "bg-blue-50/70 border-blue-200 text-blue-900"
                            : "bg-slate-50 border-slate-100 text-slate-400"
                        }`}
                      >
                        <div className="font-bold">{DAY_LABELS[day]}</div>
                        <div className="text-[11px] font-mono mt-0.5">
                          {activeItem
                            ? `${activeItem.startTime} - ${activeItem.endTime}`
                            : "Off"}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Schedule Exceptions */}
            <div className="space-y-3 pt-2">
              <h4
                className="text-xs font-bold text-slate-800 flex items-center gap-1.5"
                style={{ fontFamily: PP }}
              >
                <Calendar size={15} className="text-[#0D47A1]" /> Schedule
                Exceptions & Leave Days
              </h4>

              {isEditing && (
                <div className="flex flex-wrap items-center gap-2 bg-slate-50 p-3 rounded-xl border border-slate-200">
                  <input
                    type="date"
                    value={newExceptionDate}
                    onChange={(e) => setNewExceptionDate(e.target.value)}
                    className="px-3 py-1.5 bg-white border border-slate-300 rounded-xl text-xs"
                  />
                  <input
                    type="text"
                    placeholder="Reason (e.g. Leave / Conference)"
                    value={newExceptionReason}
                    onChange={(e) => setNewExceptionReason(e.target.value)}
                    className="flex-1 px-3 py-1.5 bg-white border border-slate-300 rounded-xl text-xs"
                  />
                  <button
                    type="button"
                    onClick={addScheduleException}
                    className="px-3 py-1.5 bg-[#0D47A1] text-white rounded-xl text-xs font-bold hover:bg-blue-800 flex items-center gap-1 cursor-pointer"
                  >
                    <Plus size={14} /> Add Exception
                  </button>
                </div>
              )}

              {form.scheduleExceptions.length > 0 ? (
                <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                  {form.scheduleExceptions.map((ex, idx) => (
                    <div
                      key={`${ex.exceptionDate}-${ex.reason}`}
                      className="flex items-center justify-between p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                    >
                      <div className="flex items-center gap-3">
                        <span className="font-bold text-slate-800 font-mono">
                          {ex.exceptionDate}
                        </span>
                        <span className="text-slate-600">{ex.reason}</span>
                      </div>
                      {isEditing && (
                        <button
                          type="button"
                          onClick={() => removeScheduleException(idx)}
                          className="p-1 text-red-500 hover:bg-red-50 rounded-lg cursor-pointer"
                          title="Remove exception"
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-400 italic">
                  No schedule exceptions defined.
                </p>
              )}
            </div>
          </div>
        )}
      </form>

      {/* Card 4: Security & Password Change */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
        <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
          <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center font-bold">
            <Lock size={18} />
          </div>
          <div>
            <h3
              className="text-sm font-bold text-slate-800"
              style={{ fontFamily: PP }}
            >
              Account Security & Password
            </h3>
            <p className="text-[11px] text-slate-500">
              Update your account authentication credentials
            </p>
          </div>
        </div>

        <form onSubmit={handleChangePassword} className="space-y-4 max-w-xl">
          {passwordSuccess && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-semibold flex items-center gap-2">
              <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
              <span>{passwordSuccess}</span>
            </div>
          )}

          {passwordError && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-800 rounded-xl text-xs font-semibold flex items-center gap-2">
              <AlertTriangle size={16} className="text-red-600 shrink-0" />
              <span>{passwordError}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Current Password *
            </label>
            <input
              type="password"
              required
              value={passwordForm.currentPassword}
              onChange={(e) =>
                setPasswordForm({
                  ...passwordForm,
                  currentPassword: e.target.value,
                })
              }
              className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-xl outline-none focus:border-[#0D47A1]"
              placeholder="••••••••••••"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                New Password *
              </label>
              <input
                type="password"
                required
                value={passwordForm.newPassword}
                onChange={(e) =>
                  setPasswordForm({
                    ...passwordForm,
                    newPassword: e.target.value,
                  })
                }
                className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-xl outline-none focus:border-[#0D47A1]"
                placeholder="••••••••••••"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Confirm New Password *
              </label>
              <input
                type="password"
                required
                value={passwordForm.confirmPassword}
                onChange={(e) =>
                  setPasswordForm({
                    ...passwordForm,
                    confirmPassword: e.target.value,
                  })
                }
                className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-xl outline-none focus:border-[#0D47A1]"
                placeholder="••••••••••••"
              />
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={passwordLoading}
              className="px-5 py-2.5 bg-[#0D47A1] text-white rounded-xl text-xs font-bold hover:bg-blue-800 transition-colors shadow-sm flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {passwordLoading ? (
                <>
                  <Loader2 size={15} className="animate-spin text-white" />
                  <span>Changing Password...</span>
                </>
              ) : (
                <>
                  <KeyRound size={15} />
                  <span>Update Password</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
