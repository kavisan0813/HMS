import { useState, useEffect, useRef } from "react";
import {
  User,
  Phone,
  Mail,
  Lock,
  Save,
  Edit,
  Eye,
  EyeOff,
  Stethoscope,
  GraduationCap,
  Building2,
  Hash,
  CheckCircle2,
  MapPin,
  Camera,
  Trash2,
  Loader2,
} from "lucide-react";
import { useAuthStore } from "../../auth/store/auth.store";
import { authApi } from "../../auth/api/auth.api";
import { apiClient } from "../../../lib/axios";
import { usersApi } from "../../users/api/users.api";
import { doctorProfileService } from "../services/doctorProfile.service";
import { mapApiUserToDoctorRecord } from "../api/mapApiUserToDoctorRecord";
import type {
  DoctorRecord,
  ApiUserDoctorRecord,
  DoctorApiResponse,
} from "../types/doctors.types";
import { PP, RB } from "../constants/doctors.constants";
import { UserAvatar } from "../../../common/components/UserAvatar";

const GENDER_OPTIONS = ["MALE", "FEMALE", "OTHER"];

interface AuthUser {
  id: number;
  doctorId?: number;
  employeeId?: string | null;
  fullName?: string;
  name?: string;
  email?: string;
  mobile?: string;
  role?: string;
  photoUrl?: string;
  photo?: string;
  doctorProfile?: {
    doctorId?: number;
    [key: string]: unknown;
  };
}

const fmt = (v: string | number | undefined | null, fallback = "—") =>
  v != null && v !== "" ? String(v) : fallback;

export function DoctorProfilePage() {
  const user = useAuthStore((state) => state.user);
  const [doctor, setDoctor] = useState<DoctorRecord | null>(null);
  const [authUser, setAuthUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [editingPersonal, setEditingPersonal] = useState(false);
  const [personalForm, setPersonalForm] = useState({
    fullName: "",
    email: "",
    mobile: "",
    gender: "",
    dateOfBirth: "",
    address: "",
    bio: "",
    photoUrl: "",
    photo: "",
  });
  const [savingPersonal, setSavingPersonal] = useState(false);
  const [personalSuccess, setPersonalSuccess] = useState(false);

  const photoInputRef = useRef<HTMLInputElement>(null);
  const [photoUploading, setPhotoUploading] = useState(false);
  const [photoUploadError, setPhotoUploadError] = useState<string | null>(null);

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [showCurrentPw, setShowCurrentPw] = useState(false);
  const [showNewPw, setShowNewPw] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState(false);

  const handlePhotoUpload = async (file: File) => {
    if (!file) return;
    setPhotoUploading(true);
    setPhotoUploadError(null);
    try {
      const uploadedUrl = await usersApi.uploadPhoto(file);
      setPersonalForm((prev) => ({
        ...prev,
        photoUrl: uploadedUrl,
        photo: uploadedUrl,
      }));
    } catch (err: unknown) {
      setPhotoUploadError(
        err instanceof Error ? err.message : "Failed to upload photo",
      );
    } finally {
      setPhotoUploading(false);
    }
  };

  const handleRemovePhoto = () => {
    setPersonalForm((prev) => ({
      ...prev,
      photoUrl: "",
      photo: "",
    }));
  };

  const fetchProfile = async () => {
    try {
      setLoading(true);
      setError(null);

      const meResponse = await authApi.getProfile();
      const me = meResponse.data as unknown as AuthUser;
      if (me) setAuthUser(me);

      const docId =
        me?.doctorId ||
        me?.doctorProfile?.doctorId ||
        user?.doctorId ||
        user?.doctorProfile?.doctorId ||
        me?.id ||
        user?.id ||
        "me";

      const doctorRecord = await doctorProfileService.getDoctorProfile(docId);
      setDoctor(doctorRecord);
      setPersonalForm({
        fullName:
          doctorRecord.fullName || doctorRecord.name.replace(/^Dr\.\s*/, ""),
        email: doctorRecord.email || "",
        mobile: doctorRecord.phone || "",
        gender: doctorRecord.gender || "",
        dateOfBirth: doctorRecord.dob || "",
        address: doctorRecord.address || "",
        bio: doctorRecord.bio || "",
        photoUrl: doctorRecord.photoUrl || doctorRecord.photo || "",
        photo: doctorRecord.photo || doctorRecord.photoUrl || "",
      });
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load doctor profile",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let cancelled = false;

    const loadProfile = async () => {
      setLoading(true);
      setError(null);
      try {
        const meResponse = await authApi.getProfile();
        if (cancelled) return;

        const me = meResponse.data as unknown as AuthUser;
        if (!cancelled && me) setAuthUser(me);

        const uid = me?.id || user?.id;
        const docId =
          me?.doctorId ||
          me?.doctorProfile?.doctorId ||
          user?.doctorId ||
          user?.doctorProfile?.doctorId;

        if (docId) {
          try {
            const response = await apiClient.get<
              DoctorApiResponse<ApiUserDoctorRecord> | ApiUserDoctorRecord
            >(`/api/v1/doctors/${docId}`);

            if (cancelled) return;

            const data =
              (response.data as DoctorApiResponse<ApiUserDoctorRecord>)?.data ||
              (response.data as ApiUserDoctorRecord);

            if (
              !cancelled &&
              data &&
              (data.fullName || data.name || data.doctorProfile)
            ) {
              const doctorRecord = mapApiUserToDoctorRecord(data);
              setDoctor(doctorRecord);
              setPersonalForm({
                fullName: doctorRecord.name.replace(/^Dr\.\s*/, ""),
                email: doctorRecord.email || "",
                mobile: doctorRecord.phone || "",
                gender: doctorRecord.gender || "",
                dateOfBirth: doctorRecord.dob || "",
                address: doctorRecord.address || "",
                bio: doctorRecord.bio || "",
                photoUrl: doctorRecord.photoUrl || doctorRecord.photo || "",
                photo: doctorRecord.photo || doctorRecord.photoUrl || "",
              });
              return;
            }
          } catch (err) {
            console.log(err);
            // fallback below
          }
        }

        if (uid) {
          try {
            const response = await apiClient.get<
              DoctorApiResponse<ApiUserDoctorRecord>
            >(`/api/v1/admin/users/${uid}`);

            if (cancelled) return;

            const data =
              response.data?.data ||
              (response.data as unknown as ApiUserDoctorRecord);

            if (
              !cancelled &&
              data &&
              (data.fullName || data.name || data.doctorProfile)
            ) {
              const doctorRecord = mapApiUserToDoctorRecord(data);
              setDoctor(doctorRecord);
              setPersonalForm({
                fullName: doctorRecord.name.replace(/^Dr\.\s*/, ""),
                email: doctorRecord.email || "",
                mobile: doctorRecord.phone || "",
                gender: doctorRecord.gender || "",
                dateOfBirth: doctorRecord.dob || "",
                address: doctorRecord.address || "",
                bio: doctorRecord.bio || "",
                photoUrl: doctorRecord.photoUrl || doctorRecord.photo || "",
                photo: doctorRecord.photo || doctorRecord.photoUrl || "",
              });
              return;
            }
          } catch (err) {
            console.log(err);
            // fallback below
          }
        }

        if (me && !cancelled) {
          const doctorRecord = mapApiUserToDoctorRecord(
            me as unknown as ApiUserDoctorRecord,
          );
          setDoctor(doctorRecord);
          setPersonalForm({
            fullName: doctorRecord.name.replace(/^Dr\.\s*/, ""),
            email: doctorRecord.email || "",
            mobile: doctorRecord.phone || "",
            gender: doctorRecord.gender || "",
            dateOfBirth: doctorRecord.dob || "",
            address: doctorRecord.address || "",
            bio: doctorRecord.bio || "",
            photoUrl: doctorRecord.photoUrl || doctorRecord.photo || "",
            photo: doctorRecord.photo || doctorRecord.photoUrl || "",
          });
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error ? err.message : "Failed to load profile",
          );
        }
      } finally {
        setLoading(false);
      }
    };

    void loadProfile();

    return () => {
      cancelled = true;
    };
  }, [user?.id, user?.doctorId, user?.doctorProfile?.doctorId]);

  const handleSavePersonal = async () => {
    if (!doctor) return;
    setSavingPersonal(true);
    setPersonalSuccess(false);
    setError(null);
    try {
      const updatedDoctor: DoctorRecord = {
        ...doctor,
        fullName: personalForm.fullName,
        name: personalForm.fullName.startsWith("Dr.")
          ? personalForm.fullName
          : `Dr. ${personalForm.fullName}`,
        email: personalForm.email,
        phone: personalForm.mobile,
        gender:
          (personalForm.gender as "Male" | "Female" | "Other") || doctor.gender,
        dob: personalForm.dateOfBirth || doctor.dob,
        address: personalForm.address || doctor.address,
        bio: personalForm.bio || doctor.bio,
        photoUrl:
          personalForm.photoUrl || personalForm.photo || doctor.photoUrl,
        photo: personalForm.photo || personalForm.photoUrl || doctor.photo,
      };
      await doctorProfileService.updateDoctor(updatedDoctor);
      setDoctor(updatedDoctor);
      setEditingPersonal(false);
      setPersonalSuccess(true);
      setTimeout(() => setPersonalSuccess(false), 3000);
      fetchProfile();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save profile");
    } finally {
      setSavingPersonal(false);
    }
  };

  const handleChangePassword = async () => {
    setPasswordError(null);
    setPasswordSuccess(false);

    if (
      !passwordForm.currentPassword ||
      !passwordForm.newPassword ||
      !passwordForm.confirmPassword
    ) {
      setPasswordError("All password fields are required");
      return;
    }
    if (passwordForm.newPassword.length < 6) {
      setPasswordError("New password must be at least 6 characters");
      return;
    }
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordError("New passwords do not match");
      return;
    }

    setSavingPassword(true);
    try {
      await authApi.changePassword({
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
        confirmPassword: passwordForm.confirmPassword,
      });
      setPasswordSuccess(true);
      setPasswordForm({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
      setTimeout(() => setPasswordSuccess(false), 3000);
    } catch (err) {
      setPasswordError(
        err instanceof Error ? err.message : "Failed to change password",
      );
    } finally {
      setSavingPassword(false);
    }
  };

  if (loading) {
    return (
      <div
        className="flex-1 overflow-y-auto p-6 bg-[#F1F5F9]"
        style={{ fontFamily: RB }}
      >
        <div className="flex items-center justify-center p-12">
          <div className="flex items-center gap-2 text-xs text-[#64748B]">
            <span className="w-4 h-4 border-2 border-[#0D47A1] border-t-transparent rounded-full animate-spin" />
            Loading profile...
          </div>
        </div>
      </div>
    );
  }

  if (error && !doctor) {
    return (
      <div
        className="flex-1 overflow-y-auto p-6 bg-[#F1F5F9]"
        style={{ fontFamily: RB }}
      >
        <div className="max-w-2xl mx-auto mt-10 bg-white rounded-2xl border border-[#E5E7EB] p-8 shadow-sm text-center">
          <h2
            className="text-lg font-bold text-[#111827] mb-2"
            style={{ fontFamily: PP }}
          >
            Unable to Load Profile
          </h2>
          <p className="text-xs text-[#64748B] mb-4">{error}</p>
          <button
            onClick={fetchProfile}
            className="px-4 py-2 rounded-xl bg-[#0D47A1] text-white text-xs font-bold"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const name =
    doctor?.name ||
    authUser?.fullName ||
    authUser?.name ||
    user?.fullName ||
    user?.name ||
    "Doctor";

  return (
    <div
      className="flex-1 overflow-y-auto p-6 bg-[#F1F5F9]"
      style={{ fontFamily: RB }}
    >
      <div className="max-w-3xl mx-auto space-y-5">
        {/* Profile Header */}
        <div className="bg-white rounded-2xl border border-[#E5E7EB] shadow-sm p-6">
          <div className="flex items-center gap-4">
            <UserAvatar
              name={name}
              size="lg"
              src={
                personalForm.photoUrl ||
                personalForm.photo ||
                doctor?.photoUrl ||
                doctor?.photo ||
                authUser?.photoUrl ||
                authUser?.photo ||
                undefined
              }
            />
            <div className="flex-1 min-w-0">
              <h1
                className="text-lg font-bold text-[#111827] truncate"
                style={{ fontFamily: PP }}
              >
                {name}
              </h1>
              <div className="flex items-center gap-2 mt-1 flex-wrap">
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#E3F2FD] text-[#0D47A1] text-[11px] font-semibold">
                  <Stethoscope size={11} />
                  {fmt(doctor?.specialty, "Doctor")}
                </span>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 text-[11px] font-semibold">
                  {fmt(
                    authUser?.role || user?.role || doctor?.status,
                    "DOCTOR",
                  )}
                </span>
                {doctor?.department && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 text-[11px] font-semibold">
                    <Building2 size={10} />
                    {doctor.department}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Personal Information */}
        <div className="bg-white rounded-2xl border border-[#E5E7EB] shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h3
              className="text-sm font-bold text-[#111827]"
              style={{ fontFamily: PP }}
            >
              Personal Information
            </h3>
            {editingPersonal ? (
              <div className="flex items-center gap-2">
                {personalSuccess && (
                  <span className="flex items-center gap-1 text-[11px] text-green-600 font-semibold">
                    <CheckCircle2 size={12} /> Saved
                  </span>
                )}
                <button
                  onClick={handleSavePersonal}
                  disabled={savingPersonal || photoUploading}
                  className="px-3 py-1.5 rounded-lg bg-[#0D47A1] text-white text-[11px] font-bold hover:bg-[#0c3d8a] transition-colors disabled:opacity-60 flex items-center gap-1"
                >
                  <Save size={12} />
                  {savingPersonal ? "Saving..." : "Save"}
                </button>
                <button
                  onClick={() => {
                    if (doctor) {
                      setPersonalForm({
                        fullName: doctor.name.replace(/^Dr\.\s*/, ""),
                        email: doctor.email || "",
                        mobile: doctor.phone || "",
                        gender: doctor.gender || "",
                        dateOfBirth: doctor.dob || "",
                        address: doctor.address || "",
                        bio: doctor.bio || "",
                        photoUrl: doctor.photoUrl || doctor.photo || "",
                        photo: doctor.photo || doctor.photoUrl || "",
                      });
                    }
                    setEditingPersonal(false);
                  }}
                  className="px-3 py-1.5 rounded-lg border border-[#E5E7EB] text-slate-600 text-[11px] font-semibold hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <button
                onClick={() => setEditingPersonal(true)}
                className="px-3 py-1.5 rounded-lg bg-[#0D47A1] text-white text-[11px] font-bold hover:bg-[#0c3d8a] transition-colors flex items-center gap-1"
              >
                <Edit size={12} />
                Edit Profile
              </button>
            )}
          </div>

          {editingPersonal && (
            <div className="mb-5 p-4 bg-slate-50 border border-[#E2E8F0] rounded-xl">
              <span className="block text-[11px] font-bold text-[#1E293B] mb-2">
                Profile Photo
              </span>
              <div className="flex items-center gap-4">
                <UserAvatar
                  name={personalForm.fullName || name}
                  size="lg"
                  src={personalForm.photoUrl || personalForm.photo || undefined}
                />
                <div className="space-y-1.5">
                  <input
                    type="file"
                    ref={photoInputRef}
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handlePhotoUpload(file);
                    }}
                  />
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      disabled={photoUploading}
                      onClick={() => photoInputRef.current?.click()}
                      className="px-3 py-1.5 bg-white border border-[#CBD5E1] hover:border-[#0D47A1] text-[#0D47A1] rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors disabled:opacity-60 shadow-xs"
                    >
                      {photoUploading ? (
                        <Loader2 size={13} className="animate-spin" />
                      ) : (
                        <Camera size={13} />
                      )}
                      {personalForm.photoUrl || personalForm.photo
                        ? "Change Photo"
                        : "Upload Photo"}
                    </button>
                    {(personalForm.photoUrl || personalForm.photo) && (
                      <button
                        type="button"
                        onClick={handleRemovePhoto}
                        className="px-3 py-1.5 bg-white border border-red-200 text-red-600 hover:bg-red-50 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-xs"
                      >
                        <Trash2 size={13} />
                        Remove
                      </button>
                    )}
                  </div>
                  <p className="text-[10px] text-[#64748B]">
                    JPG, PNG, WebP up to 5MB. Photo will be saved when you click
                    Save.
                  </p>
                  {photoUploadError && (
                    <p className="text-xs text-red-600 font-medium">
                      {photoUploadError}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {error && editingPersonal && (
            <div className="mb-3 px-3 py-2 rounded-lg bg-red-50 border border-red-200 text-red-600 text-xs font-semibold">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <span className="block text-[11px] font-bold text-[#64748B] mb-1">
                <User size={11} className="inline mr-1" />
                Full Name
              </span>
              {editingPersonal ? (
                <input
                  aria-label="Input field"
                  type="text"
                  value={personalForm.fullName}
                  onChange={(e) =>
                    setPersonalForm({
                      ...personalForm,
                      fullName: e.target.value,
                    })
                  }
                  className="w-full bg-white border border-[#E5E7EB] rounded-lg px-3 py-2 text-xs text-[#111827] outline-none focus:border-[#0D47A1]"
                />
              ) : (
                <div className="bg-slate-50 border border-transparent rounded-lg px-3 py-2 text-xs text-[#111827]">
                  {fmt(personalForm.fullName)}
                </div>
              )}
            </div>
            <div>
              <span className="block text-[11px] font-bold text-[#64748B] mb-1">
                <Mail size={11} className="inline mr-1" />
                Email
              </span>
              {editingPersonal ? (
                <input
                  aria-label="Input field"
                  type="email"
                  value={personalForm.email}
                  onChange={(e) =>
                    setPersonalForm({ ...personalForm, email: e.target.value })
                  }
                  className="w-full bg-white border border-[#E5E7EB] rounded-lg px-3 py-2 text-xs text-[#111827] outline-none focus:border-[#0D47A1]"
                />
              ) : (
                <div className="bg-slate-50 border border-transparent rounded-lg px-3 py-2 text-xs text-[#111827]">
                  {fmt(personalForm.email)}
                </div>
              )}
            </div>
            <div>
              <span className="block text-[11px] font-bold text-[#64748B] mb-1">
                <Phone size={11} className="inline mr-1" />
                Phone
              </span>
              {editingPersonal ? (
                <input
                  aria-label="Input field"
                  type="text"
                  value={personalForm.mobile}
                  onChange={(e) =>
                    setPersonalForm({ ...personalForm, mobile: e.target.value })
                  }
                  className="w-full bg-white border border-[#E5E7EB] rounded-lg px-3 py-2 text-xs text-[#111827] outline-none focus:border-[#0D47A1]"
                />
              ) : (
                <div className="bg-slate-50 border border-transparent rounded-lg px-3 py-2 text-xs text-[#111827]">
                  {fmt(personalForm.mobile)}
                </div>
              )}
            </div>
            <div>
              <span className="block text-[11px] font-bold text-[#64748B] mb-1">
                Gender
              </span>
              {editingPersonal ? (
                <select
                  aria-label="Select option"
                  value={personalForm.gender}
                  onChange={(e) =>
                    setPersonalForm({ ...personalForm, gender: e.target.value })
                  }
                  className="w-full bg-white border border-[#E5E7EB] rounded-lg px-3 py-2 text-xs text-[#111827] outline-none focus:border-[#0D47A1]"
                >
                  <option value="">Select</option>
                  {GENDER_OPTIONS.map((g) => (
                    <option key={g} value={g}>
                      {g.charAt(0) + g.slice(1).toLowerCase()}
                    </option>
                  ))}
                </select>
              ) : (
                <div className="bg-slate-50 border border-transparent rounded-lg px-3 py-2 text-xs text-[#111827]">
                  {fmt(personalForm.gender)}
                </div>
              )}
            </div>
            <div>
              <span className="block text-[11px] font-bold text-[#64748B] mb-1">
                Date of Birth
              </span>
              {editingPersonal ? (
                <input
                  aria-label="Input field"
                  type="date"
                  value={personalForm.dateOfBirth}
                  onChange={(e) =>
                    setPersonalForm({
                      ...personalForm,
                      dateOfBirth: e.target.value,
                    })
                  }
                  className="w-full bg-white border border-[#E5E7EB] rounded-lg px-3 py-2 text-xs text-[#111827] outline-none focus:border-[#0D47A1]"
                />
              ) : (
                <div className="bg-slate-50 border border-transparent rounded-lg px-3 py-2 text-xs text-[#111827]">
                  {fmt(personalForm.dateOfBirth)}
                </div>
              )}
            </div>
            <div>
              <span className="block text-[11px] font-bold text-[#64748B] mb-1">
                Employee ID
              </span>
              <div className="bg-slate-50 border border-transparent rounded-lg px-3 py-2 text-xs text-[#111827]">
                {fmt(doctor?.empId || authUser?.employeeId)}
              </div>
            </div>
          </div>

          <div className="mt-3">
            <span className="block text-[11px] font-bold text-[#64748B] mb-1">
              <MapPin size={11} className="inline mr-1" />
              Address
            </span>
            {editingPersonal ? (
              <input
                aria-label="Input field"
                type="text"
                value={personalForm.address}
                onChange={(e) =>
                  setPersonalForm({ ...personalForm, address: e.target.value })
                }
                className="w-full bg-white border border-[#E5E7EB] rounded-lg px-3 py-2 text-xs text-[#111827] outline-none focus:border-[#0D47A1]"
              />
            ) : (
              <div className="bg-slate-50 border border-transparent rounded-lg px-3 py-2 text-xs text-[#111827]">
                {fmt(personalForm.address)}
              </div>
            )}
          </div>

          <div className="mt-3">
            <span className="block text-[11px] font-bold text-[#64748B] mb-1">
              Professional Bio
            </span>
            {editingPersonal ? (
              <textarea
                aria-label="Text input"
                rows={3}
                value={personalForm.bio}
                onChange={(e) =>
                  setPersonalForm({ ...personalForm, bio: e.target.value })
                }
                className="w-full bg-white border border-[#E5E7EB] rounded-lg px-3 py-2 text-xs text-[#111827] outline-none focus:border-[#0D47A1]"
              />
            ) : (
              <div className="bg-slate-50 border border-transparent rounded-lg px-3 py-2 text-xs text-[#111827]">
                {fmt(personalForm.bio)}
              </div>
            )}
          </div>
        </div>

        {/* Professional Information */}
        <div className="bg-white rounded-2xl border border-[#E5E7EB] shadow-sm p-6">
          <h3
            className="text-sm font-bold text-[#111827] mb-4"
            style={{ fontFamily: PP }}
          >
            Professional Information
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <span className="block text-[11px] font-bold text-[#64748B] mb-1">
                <Stethoscope size={11} className="inline mr-1" />
                Specialty
              </span>
              <div className="bg-slate-50 border border-transparent rounded-lg px-3 py-2 text-xs text-[#111827]">
                {fmt(doctor?.specialty)}
              </div>
            </div>
            <div>
              <span className="block text-[11px] font-bold text-[#64748B] mb-1">
                <Building2 size={11} className="inline mr-1" />
                Department
              </span>
              <div className="bg-slate-50 border border-transparent rounded-lg px-3 py-2 text-xs text-[#111827]">
                {fmt(doctor?.department)}
              </div>
            </div>
            <div>
              <span className="block text-[11px] font-bold text-[#64748B] mb-1">
                <GraduationCap size={11} className="inline mr-1" />
                Qualification
              </span>
              <div className="bg-slate-50 border border-transparent rounded-lg px-3 py-2 text-xs text-[#111827]">
                {fmt(doctor?.qualification)}
              </div>
            </div>
            <div>
              <span className="block text-[11px] font-bold text-[#64748B] mb-1">
                Experience
              </span>
              <div className="bg-slate-50 border border-transparent rounded-lg px-3 py-2 text-xs text-[#111827]">
                {doctor?.experienceYrs ? `${doctor.experienceYrs} years` : "—"}
              </div>
            </div>
            <div>
              <span className="block text-[11px] font-bold text-[#64748B] mb-1">
                <Hash size={11} className="inline mr-1" />
                Registration Number
              </span>
              <div className="bg-slate-50 border border-transparent rounded-lg px-3 py-2 text-xs text-[#111827]">
                {fmt(doctor?.regNumber)}
              </div>
            </div>
            <div>
              <span className="block text-[11px] font-bold text-[#64748B] mb-1">
                Consultation Fee
              </span>
              <div className="bg-slate-50 border border-transparent rounded-lg px-3 py-2 text-xs text-[#111827]">
                {doctor?.consultationFee ? `₹${doctor.consultationFee}` : "—"}
              </div>
            </div>
          </div>
        </div>

        {/* Change Password */}
        <div className="bg-white rounded-2xl border border-[#E5E7EB] shadow-sm p-6">
          <h3
            className="text-sm font-bold text-[#111827] mb-4"
            style={{ fontFamily: PP }}
          >
            <Lock size={14} className="inline mr-1.5 text-[#0D47A1]" />
            Change Password
          </h3>

          {passwordSuccess && (
            <div className="mb-3 flex items-center gap-2 px-3 py-2 rounded-lg bg-green-50 border border-green-200 text-green-700 text-xs font-semibold">
              <CheckCircle2 size={14} />
              Password changed successfully
            </div>
          )}
          {passwordError && (
            <div className="mb-3 px-3 py-2 rounded-lg bg-red-50 border border-red-200 text-red-600 text-xs font-semibold">
              {passwordError}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="sm:col-span-2">
              <span className="block text-[11px] font-bold text-[#64748B] mb-1">
                Current Password
              </span>
              <div className="relative">
                <input
                  type={showCurrentPw ? "text" : "password"}
                  value={passwordForm.currentPassword}
                  onChange={(e) =>
                    setPasswordForm({
                      ...passwordForm,
                      currentPassword: e.target.value,
                    })
                  }
                  placeholder="Enter current password"
                  className="w-full bg-white border border-[#E5E7EB] rounded-lg px-3 py-2 pr-9 text-xs text-[#111827] outline-none focus:border-[#0D47A1]"
                />
                <button
                  aria-label="View details"
                  type="button"
                  onClick={() => setShowCurrentPw(!showCurrentPw)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showCurrentPw ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
            </div>
            <div>
              <span className="block text-[11px] font-bold text-[#64748B] mb-1">
                New Password
              </span>
              <div className="relative">
                <input
                  type={showNewPw ? "text" : "password"}
                  value={passwordForm.newPassword}
                  onChange={(e) =>
                    setPasswordForm({
                      ...passwordForm,
                      newPassword: e.target.value,
                    })
                  }
                  placeholder="Enter new password"
                  className="w-full bg-white border border-[#E5E7EB] rounded-lg px-3 py-2 pr-9 text-xs text-[#111827] outline-none focus:border-[#0D47A1]"
                />
                <button
                  aria-label="View details"
                  type="button"
                  onClick={() => setShowNewPw(!showNewPw)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showNewPw ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
            </div>
            <div>
              <span className="block text-[11px] font-bold text-[#64748B] mb-1">
                Confirm New Password
                <input
                  aria-label="Input field"
                  type="password"
                  value={passwordForm.confirmPassword}
                  onChange={(e) =>
                    setPasswordForm({
                      ...passwordForm,
                      confirmPassword: e.target.value,
                    })
                  }
                  placeholder="Confirm new password"
                  className="w-full bg-white border border-[#E5E7EB] rounded-lg px-3 py-2 text-xs text-[#111827] outline-none focus:border-[#0D47A1]"
                />
              </span>
            </div>
          </div>

          <div className="mt-4">
            <button
              onClick={handleChangePassword}
              disabled={savingPassword}
              className="px-4 py-2 rounded-xl bg-[#0D47A1] text-white text-xs font-bold hover:bg-[#0c3d8a] transition-colors disabled:opacity-60 flex items-center gap-1.5"
            >
              <Lock size={13} />
              {savingPassword ? "Changing..." : "Change Password"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
