import { useState, useRef } from "react";
import { useNavigate } from "react-router";
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
  Camera,
} from "lucide-react";
import type { Patient } from "../types/patient.types";
import { PP, RB } from "../constants/patient.fonts";
import { useAuthStore } from "../../auth/store/auth.store";
import { PatientSearchScreen } from "./PatientSearchScreen";
import { ROUTES } from "../../../app/routes/routes";

interface ActivePatientProfile extends Omit<
  Patient,
  "emergencyContact" | "registeredMobile"
> {
  patientName?: string;
  registeredMobile?: string;
  emergencyContact?: {
    name?: string;
    mobileNumber?: string;
    contactName?: string;
    relationship?: string;
    phone?: string;
    contactNumber?: string;
    mobile?: string;
    alternativeMobileNumber?: string;
  } | null;
}

const getInitials = (nameStr: string) => {
  if (!nameStr) return "P";
  const parts = nameStr.trim().split(" ");
  if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  return nameStr.substring(0, 2).toUpperCase();
};

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

export function PatientProfileCenterScreen({
  activePatient,
  onAddFamilyMember,
  onPatientSelect,
  onRegisterPatient,
}: {
  activePatient?: ActivePatientProfile | null;
  onAddFamilyMember?: () => void;
  onPatientSelect?: (id: number | string) => void;
  onRegisterPatient?: () => void;
}) {
  const navigate = useNavigate();
  const avatarInputRef = useRef<HTMLInputElement | null>(null);
  const [activeTab, setActiveTab] = useState<"info" | "edit" | "password">(
    "info",
  );
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const user = useAuthStore((s) => s.user);

  const patientKey = activePatient
    ? String(
        activePatient.mrn ||
          activePatient.id ||
          activePatient.patientName ||
          activePatient.name ||
          activePatient.fullName ||
          "",
      )
    : "";

  const buildInitialData = () => {
    let custom: Record<string, unknown> = {};
    try {
      const keys = [
        patientKey,
        activePatient?.mrn,
        activePatient?.id,
        user?.mrn,
        user?.id,
        "me",
      ].filter(Boolean);
      for (const k of keys) {
        const stored = localStorage.getItem(`patient_profile_custom_${k}`);
        if (stored) {
          custom = { ...custom, ...JSON.parse(stored) };
        }
      }
    } catch (err) {
      console.log(err);
      // Ignore
    }

    const resolvedEmail =
      (custom.email as string) ||
      (activePatient?.email && activePatient.email !== "family@example.com"
        ? activePatient.email
        : "") ||
      user?.email ||
      "";

    return {
      name: String(
        custom.name ||
          activePatient?.patientName ||
          activePatient?.name ||
          activePatient?.fullName ||
          user?.name ||
          user?.fullName ||
          "Patient",
      ),
      patientId: String(
        activePatient?.mrn || activePatient?.id || user?.mrn || "Generating...",
      ),
      email: resolvedEmail,
      photoUrl: String(
        custom.photoUrl ||
          activePatient?.photoUrl ||
          activePatient?.photo ||
          "",
      ),
      phone: String(
        custom.phone ||
          activePatient?.registeredMobile ||
          activePatient?.phone ||
          user?.phone ||
          user?.mobile ||
          "",
      ),
      dob: String(
        custom.dob || activePatient?.dob || user?.dob || "1990-06-14",
      ),
      gender: String(
        custom.gender || activePatient?.gender || user?.gender || "Female",
      ),
      bloodGroup: String(
        custom.bloodGroup || activePatient?.bloodGroup || "O+",
      ),
      address: String(
        custom.address ||
          (typeof activePatient?.address === "string"
            ? activePatient.address
            : user?.address || "Springfield"),
      ),
      emergencyName: String(
        custom.emergencyName ||
          activePatient?.emergencyContact?.name ||
          "Family Member",
      ),
      emergencyRelation: String(
        custom.emergencyRelation ||
          activePatient?.relationship ||
          activePatient?.emergencyContact?.relationship ||
          "Spouse",
      ),
      emergencyPhone: String(
        custom.emergencyPhone ||
          activePatient?.emergencyContact?.mobileNumber ||
          activePatient?.emergencyContact?.phone ||
          "",
      ),
    };
  };

  // Profile Data State
  const [profileData, setProfileData] = useState(buildInitialData);

  const [prevPatientKey, setPrevPatientKey] = useState<string>("");

  if (patientKey !== prevPatientKey) {
    setPrevPatientKey(patientKey);
    if (activePatient) {
      setProfileData(buildInitialData());
    }
  }

  // Edit Form Draft State
  const [editForm, setEditForm] = useState({ ...profileData });

  // Password Form States
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // If no specific single patient profile is passed, render Patient Management & Patient Table!
  if (!activePatient) {
    return (
      <PatientSearchScreen
        onPatientSelect={onPatientSelect}
        onRegisterClick={onRegisterPatient}
      />
    );
  }

  const triggerToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      triggerToast("Please select a valid image file.");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      if (!dataUrl) return;

      const updated = { ...profileData, photoUrl: dataUrl };
      setProfileData(updated);
      setEditForm(updated);

      const userState = useAuthStore.getState().user;
      if (userState) {
        useAuthStore.setUser({
          ...userState,
          photoUrl: dataUrl,
          photo: dataUrl,
        });
      }

      try {
        if (patientKey) {
          const keys = [
            patientKey,
            activePatient?.mrn,
            activePatient?.id,
            user?.mrn,
            user?.id,
            "me",
          ].filter(Boolean);
          for (const k of keys) {
            const existing = localStorage.getItem(
              `patient_profile_custom_${k}`,
            );
            const obj = existing ? JSON.parse(existing) : {};
            localStorage.setItem(
              `patient_profile_custom_${k}`,
              JSON.stringify({ ...obj, photoUrl: dataUrl }),
            );
          }
        }
      } catch (err) {
        console.log(err);
        // Ignore
      }

      triggerToast("Profile picture updated successfully!");
    };
    reader.readAsDataURL(file);
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    setProfileData({ ...editForm });

    // Sync authStore state if current user is this patient
    const user = useAuthStore.getState().user;
    if (user) {
      useAuthStore.setUser({
        ...user,
        fullName: editForm.name,
        name: editForm.name,
        email: editForm.email,
        mobile: editForm.phone,
        phone: editForm.phone,
      });
    }

    // Persist to localStorage
    try {
      if (patientKey) {
        localStorage.setItem(
          `patient_profile_custom_${patientKey}`,
          JSON.stringify(editForm),
        );
      }
    } catch (err) {
      console.log(err);
      // Ignore
    }

    triggerToast("Profile information updated successfully!");
    setActiveTab("info");
  };

  const handleUpdatePassword = (e: React.FormEvent) => {
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
    triggerToast("Password changed successfully!");
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setActiveTab("info");
  };

  // Password Strength Score

  const passStrength = getPasswordStrength(newPassword);

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
            <button
              type="button"
              onClick={() => navigate(ROUTES.DASHBOARD)}
              className="hover:text-[#0D47A1] transition-colors font-medium cursor-pointer"
            >
              Patient Portal
            </button>
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
            <input
              ref={avatarInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleAvatarChange}
            />
            <div
              className="w-16 h-16 rounded-2xl bg-[#0D47A1] text-white font-bold text-xl flex items-center justify-center shadow-md overflow-hidden"
              style={{ fontFamily: PP }}
            >
              {profileData.photoUrl ? (
                <img
                  src={profileData.photoUrl}
                  alt={profileData.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                getInitials(profileData.name)
              )}
            </div>
            <button
              type="button"
              onClick={() => avatarInputRef.current?.click()}
              className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-[#0D47A1] text-white border border-white flex items-center justify-center shadow-sm hover:bg-blue-900 transition-colors cursor-pointer"
              title="Change Avatar"
            >
              <Camera size={12} />
            </button>
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
              <span>
                <strong className="text-[#111827]">
                  {profileData.patientId}
                </strong>
              </span>
              <span>•</span>
              <span>{profileData.email}</span>
              <span>•</span>
              <span>{profileData.phone}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {onAddFamilyMember && (
            <button
              onClick={onAddFamilyMember}
              className="px-4 py-2 rounded-xl bg-blue-50 text-[#0D47A1] text-xs font-bold hover:bg-blue-100 transition-colors flex items-center gap-2 shrink-0 shadow-sm"
              style={{ fontFamily: PP }}
            >
              + Add Family Member
            </button>
          )}
          <button
            onClick={() => {
              setEditForm({ ...profileData });
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
                <div>
                  <span className="text-[#64748B] text-[11px] block">
                    Date of Birth
                  </span>
                  <span className="font-semibold text-[#111827]">
                    {profileData.dob}
                  </span>
                </div>
                <div>
                  <span className="text-[#64748B] text-[11px] block">
                    Gender
                  </span>
                  <span className="font-semibold text-[#111827]">
                    {profileData.gender}
                  </span>
                </div>
                <div>
                  <span className="text-[#64748B] text-[11px] block">
                    Blood Group
                  </span>
                  <span className="font-bold text-[#0D47A1]">
                    {profileData.bloodGroup}
                  </span>
                </div>
                <div>
                  <span className="text-[#64748B] text-[11px] block">
                    Primary Language
                  </span>
                  <span className="font-semibold text-[#111827]">English</span>
                </div>
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
                <div>
                  <span className="text-[#64748B] text-[11px] block">
                    Phone Number
                  </span>
                  <span className="font-semibold text-[#111827] flex items-center gap-1.5 mt-0.5">
                    <Phone size={13} className="text-[#0D47A1]" />{" "}
                    {profileData.phone}
                  </span>
                </div>
                <div>
                  <span className="text-[#64748B] text-[11px] block">
                    Email Address
                  </span>
                  <span className="font-semibold text-[#111827] flex items-center gap-1.5 mt-0.5">
                    <Mail size={13} className="text-[#0D47A1]" />{" "}
                    {profileData.email}
                  </span>
                </div>
                <div className="sm:col-span-2">
                  <span className="text-[#64748B] text-[11px] block">
                    Residential Address
                  </span>
                  <span className="font-semibold text-[#111827] flex items-center gap-1.5 mt-0.5">
                    <MapPin size={13} className="text-[#0D47A1] shrink-0" />{" "}
                    {profileData.address}
                  </span>
                </div>
              </div>
            </div>

            {/* Emergency Contact */}
            <div className="bg-white p-5 rounded-2xl border border-[#E5E7EB] shadow-sm space-y-3">
              <div
                className="text-xs font-bold text-[#0D47A1] uppercase tracking-wider pb-2 border-b border-gray-100"
                style={{ fontFamily: PP }}
              >
                Emergency Contact
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs">
                <div>
                  <span className="text-[#64748B] text-[11px] block">
                    Contact Name
                  </span>
                  <span className="font-semibold text-[#111827]">
                    {profileData.emergencyName}
                  </span>
                </div>
                <div>
                  <span className="text-[#64748B] text-[11px] block">
                    Relationship
                  </span>
                  <span className="font-semibold text-[#111827]">
                    {profileData.emergencyRelation}
                  </span>
                </div>
                <div>
                  <span className="text-[#64748B] text-[11px] block">
                    Emergency Phone
                  </span>
                  <span className="font-semibold text-red-600">
                    {profileData.emergencyPhone}
                  </span>
                </div>
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
                  Residential Address *
                  <input
                    aria-label="Input field"
                    type="text"
                    required
                    value={editForm.address}
                    onChange={(e) =>
                      setEditForm({ ...editForm, address: e.target.value })
                    }
                    className="w-full px-3 py-2 bg-slate-50 border border-[#E5E7EB] rounded-xl text-[#111827] outline-none focus:border-[#0D47A1]"
                  />
                </span>
              </div>

              <div>
                <span className="block text-[#111827] font-semibold mb-1">
                  Emergency Contact Name
                  <input
                    aria-label="Input field"
                    type="text"
                    value={editForm.emergencyName}
                    onChange={(e) =>
                      setEditForm({
                        ...editForm,
                        emergencyName: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 bg-slate-50 border border-[#E5E7EB] rounded-xl text-[#111827] outline-none focus:border-[#0D47A1]"
                  />
                </span>
              </div>

              <div>
                <span className="block text-[#111827] font-semibold mb-1">
                  Emergency Contact Phone
                  <input
                    aria-label="Input field"
                    type="text"
                    value={editForm.emergencyPhone}
                    onChange={(e) =>
                      setEditForm({
                        ...editForm,
                        emergencyPhone: e.target.value,
                      })
                    }
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
                <Save size={14} /> Save Changes
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
              <Key size={16} className="text-[#0D47A1]" /> Change Portal
              Password
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
