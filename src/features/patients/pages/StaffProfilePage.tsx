import { useState, useEffect, useRef } from "react";
import {
  ChevronRight,
  Edit,
  Phone,
  Mail,
  MapPin,
  CheckCircle2,
  Lock,
  Key,
  Save,
  Briefcase,
  BadgeCheck,
  Camera,
  Upload,
  Trash2,
  Loader2,
  Image as ImageIcon,
  AlertTriangle,
} from "lucide-react";
import { PP, RB } from "../constants/patient.fonts";
import { useAuthStore } from "../../auth/store/auth.store";
import { usersApi } from "../../users/api/users.api";
import { authService } from "../../auth/services/auth.service";
import { UserAvatar } from "../../../common/components/UserAvatar";
import type { UserDetailData } from "../../users/types/users.types";
import type { Role } from "../utils/patientPermissions";

const ROLE_DISPLAY: Record<string, string> = {
  NURSE: "Nurse",
  RECEPTIONIST: "Receptionist",
  ACCOUNTANT: "Accountant",
};

const ROLE_PORTAL_LABEL: Record<string, string> = {
  NURSE: "Staff Portal",
  RECEPTIONIST: "Staff Portal",
  ACCOUNTANT: "Finance Portal",
};

interface StaffProfileData {
  name: string;
  email: string;
  phone: string;
  gender: string;
  dob: string;
  address: string;
  employeeId: string;
  role: string;
  status: string;
  userId: number | string;
  photoUrl?: string | null;
  photo?: string | null;
}

function mapUserDetailToProfile(
  detail: UserDetailData | Record<string, unknown>,
  fallbackRole: string,
): StaffProfileData {
  const d = (detail || {}) as Record<string, unknown>;
  return {
    name: String(d.fullName || d.name || "Staff Member"),
    email: String(d.email || ""),
    phone: String(d.mobile || d.phone || ""),
    gender: String(d.gender || ""),
    dob: String(d.dateOfBirth || d.dob || ""),
    address: String(d.residentialAddress || d.address || ""),
    employeeId: String(d.employeeId || d.empId || ""),
    role: String(d.role || fallbackRole),
    status: String(d.status || "ACTIVE"),
    userId: (d.userId || d.id || "") as number | string,
    photoUrl: (d.photoUrl || d.photo || null) as string | null,
    photo: (d.photo || d.photoUrl || null) as string | null,
  };
}

const getPasswordStrength = (pass: string) => {
  if (!pass) return { score: 0, label: "None", color: "bg-slate-200" };
  let score = 0;
  if (pass.length >= 8) score += 33;
  if (/[a-z]/.test(pass) && /[A-Z]/.test(pass) && /[0-9]/.test(pass))
    score += 33;
  if (/[^A-Za-z0-9]/.test(pass)) score += 34;
  if (score <= 33) return { score: 33, label: "Weak", color: "bg-[#EF4444]" };
  if (score <= 66) return { score: 66, label: "Medium", color: "bg-[#F59E0B]" };
  return { score: 100, label: "Strong", color: "bg-[#66BB6A]" };
};

export function StaffProfilePage({ currentRole }: { currentRole: Role }) {
  const user = useAuthStore((s) => s.user);
  const userId = user?.id;
  const roleUpper = String(currentRole).toUpperCase();

  const [profileData, setProfileData] = useState<StaffProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [activeTab, setActiveTab] = useState<"info" | "edit" | "password">(
    "info",
  );
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // Edit form state
  const [editForm, setEditForm] = useState({
    name: "",
    email: "",
    phone: "",
    gender: "",
    dob: "",
    address: "",
    photoUrl: "",
    photo: "",
  });

  // Photo upload states
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [photoUploadError, setPhotoUploadError] = useState<string | null>(null);
  const photoInputRef = useRef<HTMLInputElement>(null);

  // Password form state
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // Fetch profile data
  useEffect(() => {
    if (!userId) return;

    let cancelled = false;

    const loadProfile = async () => {
      try {
        let data: UserDetailData | null = null;
        try {
          const response = await usersApi.adminGetUserById(userId);
          data = response.data || null;
        } catch (err) {
          console.log(err);
          // If non-admin (Nurse, Receptionist, Accountant), admin endpoint will 403.
          // Fall back to authService.getProfile() / auth/me or current authStore user:
          try {
            const meRes = await authService.getProfile();
            data = meRes.data as unknown as UserDetailData;
          } catch (err) {
            console.log(err);
            data = user as unknown as UserDetailData;
          }
        }

        // Apply local storage custom overrides if any
        try {
          const stored = localStorage.getItem(`staff_profile_custom_${userId}`);
          if (stored) {
            const parsed = JSON.parse(stored);
            if (parsed && typeof parsed === "object") {
              data = { ...(data || {}), ...parsed } as UserDetailData;
            }
          }
        } catch (err) {
          console.log(err);
          // Ignore
        }

        if (cancelled) return;

        if (data) {
          const mapped = mapUserDetailToProfile(data, roleUpper);
          setProfileData(mapped);
          setEditForm({
            name: mapped.name,
            email: mapped.email,
            phone: mapped.phone,
            gender: mapped.gender,
            dob: mapped.dob,
            address: mapped.address,
            photoUrl: mapped.photoUrl || mapped.photo || "",
            photo: mapped.photo || mapped.photoUrl || "",
          });
          setError(null);
        } else {
          setError("Profile data not found");
        }
      } catch (err: unknown) {
        if (cancelled) return;
        console.error("Failed to load staff profile:", err);
        setError(
          err instanceof Error ? err.message : "Failed to load staff profile",
        );
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void loadProfile();

    return () => {
      cancelled = true;
    };
  }, [userId, roleUpper, user]);

  if (!userId) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#F1F5F9]">
        <div className="bg-white p-8 rounded-2xl border border-[#E5E7EB] shadow-sm text-center">
          <p className="text-sm text-[#64748B]">
            User ID not found. Please log in again.
          </p>
        </div>
      </div>
    );
  }

  const triggerToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  };

  const handlePhotoUpload = async (file: File) => {
    if (!file) return;
    const validTypes = [
      "image/jpeg",
      "image/jpg",
      "image/png",
      "image/webp",
      "image/gif",
      "image/svg+xml",
    ];
    if (!validTypes.includes(file.type.toLowerCase())) {
      setPhotoUploadError(
        "Please upload a valid image file (JPG, PNG, WEBP, GIF, SVG).",
      );
      return;
    }
    const maxSizeBytes = 5 * 1024 * 1024;
    if (file.size > maxSizeBytes) {
      setPhotoUploadError(
        `Image file size (${(file.size / (1024 * 1024)).toFixed(1)}MB) exceeds maximum limit of 5MB.`,
      );
      return;
    }

    setIsUploadingPhoto(true);
    setPhotoUploadError(null);
    try {
      const uploadedUrl = await usersApi.uploadPhoto(file);
      setEditForm((prev) => ({
        ...prev,
        photoUrl: uploadedUrl,
        photo: uploadedUrl,
      }));
    } catch (err: unknown) {
      setPhotoUploadError(
        err instanceof Error ? err.message : "Failed to upload profile photo.",
      );
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  const handleRemovePhoto = () => {
    setEditForm((prev) => ({
      ...prev,
      photoUrl: "",
      photo: "",
    }));
    setPhotoUploadError(null);
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId) return;
    if (isUploadingPhoto) {
      triggerToast("Please wait for photo upload to finish before saving.");
      return;
    }

    const r = String(user?.role ?? "").toUpperCase();
    const isAdmin =
      r === "SUPER_ADMIN" || r === "HOSPITAL_ADMIN" || r === "ADMIN";

    if (isAdmin) {
      try {
        await usersApi.adminUpdateStaff(userId, {
          fullName: editForm.name,
          email: editForm.email,
          mobile: editForm.phone,
          gender: editForm.gender || undefined,
          dateOfBirth: editForm.dob || undefined,
          residentialAddress: editForm.address || undefined,
          photo: editForm.photo || editForm.photoUrl || undefined,
          photoUrl: editForm.photoUrl || editForm.photo || undefined,
        });
      } catch (err) {
        console.warn("Admin update staff fallback:", err);
      }
    }

    // Sync authStore state
    if (user) {
      useAuthStore.setUser({
        ...user,
        fullName: editForm.name,
        name: editForm.name,
        email: editForm.email,
        mobile: editForm.phone,
        phone: editForm.phone,
        photoUrl: editForm.photoUrl || editForm.photo,
        photo: editForm.photo || editForm.photoUrl,
      });
    }

    // Persist to localStorage
    try {
      localStorage.setItem(
        `staff_profile_custom_${userId}`,
        JSON.stringify(editForm),
      );
    } catch (err) {
      console.log(err);
      // Ignore
    }

    setProfileData((prev) =>
      prev
        ? {
            ...prev,
            name: editForm.name,
            email: editForm.email,
            phone: editForm.phone,
            gender: editForm.gender,
            dob: editForm.dob,
            address: editForm.address,
            photoUrl: editForm.photoUrl || editForm.photo,
            photo: editForm.photo || editForm.photoUrl,
          }
        : null,
    );

    triggerToast("Profile information updated successfully!");
    setActiveTab("info");
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword) {
      triggerToast("Please enter your current password.");
      return;
    }
    if (newPassword.length < 8) {
      triggerToast("New password must be at least 8 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      triggerToast("New password and confirmation do not match.");
      return;
    }

    try {
      await authService.changePassword({
        currentPassword,
        newPassword,
        confirmPassword,
      });
      triggerToast("Password changed successfully!");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setActiveTab("info");
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : "Failed to change password";
      triggerToast(msg);
    }
  };

  // Password Strength Score

  const passStrength = getPasswordStrength(newPassword);

  if (loading) {
    return (
      <div
        className="flex-1 flex items-center justify-center p-12 bg-[#F1F5F9]"
        style={{ fontFamily: RB }}
      >
        <div className="text-center space-y-3">
          <div className="w-8 h-8 border-3 border-[#0D47A1] border-t-transparent rounded-full animate-spin mx-auto" />
          <p
            className="text-xs font-semibold text-[#64748B]"
            style={{ fontFamily: PP }}
          >
            Loading profile...
          </p>
        </div>
      </div>
    );
  }

  if (error && !profileData) {
    return (
      <div
        className="flex-1 flex items-center justify-center p-12 bg-[#F1F5F9]"
        style={{ fontFamily: RB }}
      >
        <div className="max-w-xl mx-auto mt-10 bg-white rounded-2xl border border-[#E5E7EB] p-8 shadow-sm space-y-5 text-center">
          <h2
            className="text-lg font-bold text-[#111827]"
            style={{ fontFamily: PP }}
          >
            Profile Not Found
          </h2>
          <p className="text-xs text-[#64748B]">{error}</p>
        </div>
      </div>
    );
  }

  if (!profileData) return null;

  const displayRole = ROLE_DISPLAY[roleUpper] || roleUpper;
  const portalLabel = ROLE_PORTAL_LABEL[roleUpper] || "Staff Portal";

  return (
    <div
      className="flex-1 overflow-y-auto p-6 space-y-6 bg-[#F1F5F9]"
      style={{ fontFamily: RB }}
    >
      {/* Toast Feedback */}
      {toastMsg && (
        <div className="fixed top-5 right-5 z-50 bg-[#111827] text-white text-xs font-semibold px-4 py-3 rounded-xl shadow-xl flex items-center gap-2 transition-opacity duration-200">
          <CheckCircle2 size={16} className="text-[#66BB6A]" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* ── 1. HEADER & BREADCRUMB ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1
            className="text-xl font-bold text-[#111827]"
            style={{ fontFamily: PP }}
          >
            My Profile
          </h1>
          <div
            className="flex items-center gap-1.5 text-xs text-[#64748B] mt-1"
            style={{ fontFamily: RB }}
          >
            <span>{portalLabel}</span>
            <ChevronRight size={13} className="text-slate-300" />
            <span className="font-medium text-[#111827]">My Profile</span>
          </div>
        </div>
      </div>

      {/* ── 2. PROFILE HEADER BANNER ── */}
      <div className="bg-white rounded-2xl border border-[#E5E7EB] p-6 shadow-sm flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-5">
          {/* Avatar */}
          <div className="relative">
            <UserAvatar
              name={profileData.name}
              size="lg"
              src={profileData.photoUrl || profileData.photo || undefined}
            />
          </div>

          {/* Profile Details */}
          <div>
            <h2
              className="text-lg font-bold text-[#111827]"
              style={{ fontFamily: PP }}
            >
              {profileData.name}
            </h2>
            <div className="flex items-center gap-3 text-xs text-[#64748B] mt-0.5">
              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-50 text-[#0D47A1] rounded-full text-[10px] font-bold">
                <BadgeCheck size={11} />
                {displayRole}
              </span>
              {profileData.employeeId && (
                <>
                  <span>•</span>
                  <span>
                    ID:{" "}
                    <strong className="text-[#111827]">
                      {profileData.employeeId}
                    </strong>
                  </span>
                </>
              )}
              <span>•</span>
              <span>{profileData.email}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => {
              setEditForm({
                name: profileData.name,
                email: profileData.email,
                phone: profileData.phone,
                gender: profileData.gender,
                dob: profileData.dob,
                address: profileData.address,
                photoUrl: profileData.photoUrl || "",
                photo: profileData.photo || "",
              });
              setActiveTab("edit");
            }}
            className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 text-xs font-bold hover:bg-slate-200 transition-colors flex items-center gap-2 shrink-0 shadow-sm"
            style={{ fontFamily: PP }}
          >
            <Edit size={14} /> Edit Profile
          </button>
        </div>
      </div>

      {/* ── 3. MAIN WORKSPACE ── */}
      <div className="space-y-6">
        {/* Tab Navigation */}
        <div className="flex items-center gap-2 border-b border-[#E5E7EB] pb-0.5">
          {[
            { id: "info", label: "Personal Information" },
            { id: "edit", label: "Edit Profile" },
            { id: "password", label: "Change Password" },
          ].map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() =>
                  setActiveTab(tab.id as "info" | "edit" | "password")
                }
                className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold transition-colors border-b-2 -mb-0.5 ${
                  isActive
                    ? "border-[#0D47A1] text-[#0D47A1]"
                    : "border-transparent text-[#64748B] hover:text-[#111827]"
                }`}
                style={{ fontFamily: PP }}
              >
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* TAB 1: PERSONAL INFORMATION (Read-only cards) */}
        {activeTab === "info" && (
          <div className="space-y-4">
            {/* Basic Details */}
            <div className="bg-white p-5 rounded-2xl border border-[#E5E7EB] shadow-sm space-y-3">
              <div
                className="text-xs font-bold text-[#0D47A1] uppercase tracking-wider pb-2 border-b border-gray-100"
                style={{ fontFamily: PP }}
              >
                Basic Personal Details
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs">
                <div>
                  <span className="text-[#64748B] text-[11px] block">
                    Full Name
                  </span>
                  <span className="font-semibold text-[#111827]">
                    {profileData.name}
                  </span>
                </div>
                {profileData.dob && (
                  <div>
                    <span className="text-[#64748B] text-[11px] block">
                      Date of Birth
                    </span>
                    <span className="font-semibold text-[#111827]">
                      {profileData.dob}
                    </span>
                  </div>
                )}
                {profileData.gender && (
                  <div>
                    <span className="text-[#64748B] text-[11px] block">
                      Gender
                    </span>
                    <span className="font-semibold text-[#111827]">
                      {profileData.gender}
                    </span>
                  </div>
                )}
                <div>
                  <span className="text-[#64748B] text-[11px] block">
                    Status
                  </span>
                  <span className="inline-flex items-center gap-1 font-semibold text-[#16A34A]">
                    <CheckCircle2 size={12} />
                    {profileData.status}
                  </span>
                </div>
              </div>
            </div>

            {/* Employment Details */}
            <div className="bg-white p-5 rounded-2xl border border-[#E5E7EB] shadow-sm space-y-3">
              <div
                className="text-xs font-bold text-[#0D47A1] uppercase tracking-wider pb-2 border-b border-gray-100"
                style={{ fontFamily: PP }}
              >
                Employment Details
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs">
                <div>
                  <span className="text-[#64748B] text-[11px] block">Role</span>
                  <span className="font-semibold text-[#111827] flex items-center gap-1.5 mt-0.5">
                    <Briefcase size={13} className="text-[#0D47A1]" />{" "}
                    {displayRole}
                  </span>
                </div>
                {profileData.employeeId && (
                  <div>
                    <span className="text-[#64748B] text-[11px] block">
                      Employee ID
                    </span>
                    <span className="font-bold text-[#0D47A1]">
                      {profileData.employeeId}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Contact Details */}
            <div className="bg-white p-5 rounded-2xl border border-[#E5E7EB] shadow-sm space-y-3">
              <div
                className="text-xs font-bold text-[#0D47A1] uppercase tracking-wider pb-2 border-b border-gray-100"
                style={{ fontFamily: PP }}
              >
                Contact Details
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                {profileData.phone && (
                  <div>
                    <span className="text-[#64748B] text-[11px] block">
                      Phone Number
                    </span>
                    <span className="font-semibold text-[#111827] flex items-center gap-1.5 mt-0.5">
                      <Phone size={13} className="text-[#0D47A1]" />{" "}
                      {profileData.phone}
                    </span>
                  </div>
                )}
                <div>
                  <span className="text-[#64748B] text-[11px] block">
                    Email Address
                  </span>
                  <span className="font-semibold text-[#111827] flex items-center gap-1.5 mt-0.5">
                    <Mail size={13} className="text-[#0D47A1]" />{" "}
                    {profileData.email}
                  </span>
                </div>
                {profileData.address && (
                  <div className="sm:col-span-2">
                    <span className="text-[#64748B] text-[11px] block">
                      Residential Address
                    </span>
                    <span className="font-semibold text-[#111827] flex items-center gap-1.5 mt-0.5">
                      <MapPin size={13} className="text-[#0D47A1] shrink-0" />{" "}
                      {profileData.address}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: EDIT PROFILE FORM */}
        {activeTab === "edit" && (
          <form
            onSubmit={handleSaveProfile}
            className="bg-white p-6 rounded-2xl border border-[#E5E7EB] shadow-sm space-y-5"
          >
            <h2
              className="text-sm font-bold text-[#111827] pb-3 border-b border-gray-100"
              style={{ fontFamily: PP }}
            >
              Edit Personal & Contact Profile
            </h2>

            {/* Profile Photo Upload Section */}
            <div className="bg-slate-50 border border-[#E5E7EB] rounded-2xl p-4 flex items-center gap-4">
              <div className="relative group shrink-0">
                <div className="w-16 h-16 rounded-2xl overflow-hidden border border-slate-200 bg-white flex items-center justify-center relative shadow-xs">
                  {editForm.photoUrl || editForm.photo ? (
                    <img
                      src={editForm.photoUrl || editForm.photo}
                      alt={editForm.name || "Staff"}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <UserAvatar
                      name={editForm.name || profileData.name || "Staff"}
                      size="lg"
                      src={editForm.photoUrl || editForm.photo || undefined}
                    />
                  )}

                  {isUploadingPhoto && (
                    <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-xs flex flex-col items-center justify-center text-white">
                      <Loader2 size={16} className="animate-spin text-white" />
                      <span className="text-[8px] font-bold mt-0.5">
                        Uploading
                      </span>
                    </div>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => photoInputRef.current?.click()}
                  disabled={isUploadingPhoto}
                  title="Upload Photo"
                  className="absolute -bottom-1 -right-1 p-1 bg-[#0D47A1] text-white rounded-lg shadow-sm hover:bg-[#0c3d8a] transition-colors cursor-pointer disabled:opacity-50 border border-white"
                >
                  <Camera size={11} />
                </button>
              </div>

              <div className="flex-1 space-y-1">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                      <ImageIcon size={13} className="text-[#0D47A1]" />
                      Profile Photo
                    </h4>
                    <p className="text-[10px] text-slate-400 font-medium">
                      JPG, PNG, WEBP, GIF up to 5MB
                    </p>
                  </div>

                  <div className="flex items-center gap-1.5">
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
                      className="px-2.5 py-1 bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 text-[11px] font-bold rounded-lg transition-colors flex items-center gap-1 cursor-pointer disabled:opacity-50"
                    >
                      {isUploadingPhoto ? (
                        <>
                          <Loader2
                            size={11}
                            className="animate-spin text-[#0D47A1]"
                          />
                          Uploading
                        </>
                      ) : editForm.photoUrl || editForm.photo ? (
                        <>
                          <Upload size={11} /> Replace
                        </>
                      ) : (
                        <>
                          <Upload size={11} /> Upload
                        </>
                      )}
                    </button>

                    {(editForm.photoUrl || editForm.photo) &&
                      !isUploadingPhoto && (
                        <button
                          type="button"
                          onClick={handleRemovePhoto}
                          className="p-1 text-red-500 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                          title="Remove photo"
                        >
                          <Trash2 size={13} />
                        </button>
                      )}
                  </div>
                </div>

                {photoUploadError && (
                  <div className="p-1.5 rounded-lg bg-red-50 border border-red-200 text-[10px] text-red-600 font-semibold flex items-center gap-1">
                    <AlertTriangle size={11} className="shrink-0" />
                    <span>{photoUploadError}</span>
                  </div>
                )}

                {editForm.photoUrl &&
                  !photoUploadError &&
                  !isUploadingPhoto && (
                    <div className="text-[10px] text-emerald-700 font-semibold flex items-center gap-1">
                      <CheckCircle2 size={11} className="text-[#66BB6A]" />
                      Photo attached
                    </div>
                  )}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <span className="block text-[#111827] font-semibold mb-1">
                  Full Name *
                  <input
                    aria-label="Input field"
                    type="text"
                    required
                    value={editForm.name}
                    onChange={(e) =>
                      setEditForm({ ...editForm, name: e.target.value })
                    }
                    className="w-full px-3 py-2 bg-slate-50 border border-[#E5E7EB] rounded-xl text-[#111827] outline-none focus:border-[#0D47A1]"
                  />
                </span>
              </div>

              <div>
                <span className="block text-[#111827] font-semibold mb-1">
                  Phone Number *
                  <input
                    aria-label="Input field"
                    type="text"
                    required
                    value={editForm.phone}
                    onChange={(e) =>
                      setEditForm({ ...editForm, phone: e.target.value })
                    }
                    className="w-full px-3 py-2 bg-slate-50 border border-[#E5E7EB] rounded-xl text-[#111827] outline-none focus:border-[#0D47A1]"
                  />
                </span>
              </div>

              <div>
                <span className="block text-[#111827] font-semibold mb-1">
                  Email Address *
                  <input
                    aria-label="Input field"
                    type="email"
                    required
                    value={editForm.email}
                    onChange={(e) =>
                      setEditForm({ ...editForm, email: e.target.value })
                    }
                    className="w-full px-3 py-2 bg-slate-50 border border-[#E5E7EB] rounded-xl text-[#111827] outline-none focus:border-[#0D47A1]"
                  />
                </span>
              </div>

              <div>
                <span className="block text-[#111827] font-semibold mb-1">
                  Gender
                  <select
                    aria-label="Select option"
                    value={editForm.gender}
                    onChange={(e) =>
                      setEditForm({ ...editForm, gender: e.target.value })
                    }
                    className="w-full px-3 py-2 bg-slate-50 border border-[#E5E7EB] rounded-xl text-[#111827] outline-none focus:border-[#0D47A1]"
                  >
                    <option value="">Select</option>
                    <option value="MALE">Male</option>
                    <option value="FEMALE">Female</option>
                    <option value="OTHER">Other</option>
                  </select>
                </span>
              </div>

              <div>
                <span className="block text-[#111827] font-semibold mb-1">
                  Date of Birth
                  <input
                    aria-label="Input field"
                    type="date"
                    value={editForm.dob}
                    onChange={(e) =>
                      setEditForm({ ...editForm, dob: e.target.value })
                    }
                    className="w-full px-3 py-2 bg-slate-50 border border-[#E5E7EB] rounded-xl text-[#111827] outline-none focus:border-[#0D47A1]"
                  />
                </span>
              </div>

              <div className="sm:col-span-2">
                <span className="block text-[#111827] font-semibold mb-1">
                  Residential Address
                  <input
                    aria-label="Input field"
                    type="text"
                    value={editForm.address}
                    onChange={(e) =>
                      setEditForm({ ...editForm, address: e.target.value })
                    }
                    className="w-full px-3 py-2 bg-slate-50 border border-[#E5E7EB] rounded-xl text-[#111827] outline-none focus:border-[#0D47A1]"
                  />
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-3 border-t border-gray-100">
              <button
                type="submit"
                disabled={isUploadingPhoto}
                className="px-5 py-2.5 rounded-xl bg-[#0D47A1] text-white text-xs font-bold hover:bg-[#0c3d8a] transition-colors flex items-center gap-2 shadow-sm disabled:opacity-60 disabled:cursor-not-allowed"
                style={{ fontFamily: PP }}
              >
                {isUploadingPhoto ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  <Save size={14} />
                )}
                Save Changes
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("info")}
                className="px-4 py-2.5 rounded-xl border border-[#E5E7EB] text-xs font-medium text-[#64748B] hover:bg-slate-50"
              >
                Cancel
              </button>
            </div>
          </form>
        )}

        {/* TAB 3: CHANGE PASSWORD */}
        {activeTab === "password" && (
          <form
            onSubmit={handleUpdatePassword}
            className="bg-white p-6 rounded-2xl border border-[#E5E7EB] shadow-sm space-y-5"
          >
            <h2
              className="text-sm font-bold text-[#111827] pb-3 border-b border-gray-100 flex items-center gap-2"
              style={{ fontFamily: PP }}
            >
              <Key size={16} className="text-[#0D47A1]" /> Change Password
            </h2>

            <div className="space-y-4 max-w-md text-xs">
              <div>
                <span className="block text-[#111827] font-semibold mb-1">
                  Current Password *
                  <input
                    aria-label="Enter current password"
                    type="password"
                    required
                    placeholder="Enter current password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-[#E5E7EB] rounded-xl text-[#111827] outline-none focus:border-[#0D47A1]"
                  />
                </span>
              </div>

              <div>
                <span className="block text-[#111827] font-semibold mb-1">
                  New Password *
                  <input
                    aria-label="Enter new password"
                    type="password"
                    required
                    placeholder="Enter new password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-[#E5E7EB] rounded-xl text-[#111827] outline-none focus:border-[#0D47A1]"
                  />
                </span>
              </div>

              {/* Password Strength Meter */}
              {newPassword && (
                <div className="space-y-1.5">
                  <div className="flex justify-between text-[11px]">
                    <span className="text-[#64748B]">Password Strength</span>
                    <span className="font-bold text-[#111827]">
                      {passStrength.label}
                    </span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-[width] duration-300 ${passStrength.color}`}
                      style={{ width: `${passStrength.score}%` }}
                    />
                  </div>
                </div>
              )}

              <div>
                <span className="block text-[#111827] font-semibold mb-1">
                  Confirm New Password *
                  <input
                    aria-label="Re-enter new password"
                    type="password"
                    required
                    placeholder="Re-enter new password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-[#E5E7EB] rounded-xl text-[#111827] outline-none focus:border-[#0D47A1]"
                  />
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-3 border-t border-gray-100">
              <button
                type="submit"
                className="px-5 py-2.5 rounded-xl bg-[#0D47A1] text-white text-xs font-bold hover:bg-[#0c3d8a] transition-colors flex items-center gap-2 shadow-sm"
                style={{ fontFamily: PP }}
              >
                <Lock size={14} /> Update Password
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("info")}
                className="px-4 py-2.5 rounded-xl border border-[#E5E7EB] text-xs font-medium text-[#64748B] hover:bg-slate-50"
              >
                Cancel
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
