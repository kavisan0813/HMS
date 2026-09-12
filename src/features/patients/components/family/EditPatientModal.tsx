import React, { useState, useEffect } from "react";
import { X, Edit3, Loader2, CheckCircle2 } from "lucide-react";
import type { FamilyMember } from "../../types/family.types";
import { apiClient } from "../../../../lib/axios";

const PP = "'Poppins', system-ui, sans-serif";
const RB = "'Roboto', system-ui, sans-serif";

interface EditPatientModalProps {
  member: FamilyMember | null;
  onClose: () => void;
  onSaved: (updatedName: string) => void;
  onError: (msg: string) => void;
}

function buildFormFromMember(m: FamilyMember | null) {
  if (!m) {
    return {
      fullName: "",
      gender: "MALE",
      dateOfBirth: "",
      bloodGroup: "A_POSITIVE",
      phone: "",
      email: "",
      addressLine1: "",
      addressLine2: "",
      city: "",
      state: "",
      pincode: "",
      country: "India",
      maritalStatus: "SINGLE",
      nationalId: "",
      photoUrl: "",
      emergencyName: "",
      emergencyRel: "",
      emergencyMobile: "",
      emergencyAltMobile: "",
      patientCategory: "GENERAL",
      registrationType: "WALK_IN",
      knownAllergies: "",
      chronicDiseases: "",
      specialNotes: "",
      changeReason: "Updated via Patient Portal Family Management",
    };
  }
  return {
    fullName: m.patientName || "",
    gender: m.gender ? String(m.gender).toUpperCase() : "MALE",
    dateOfBirth: m.dateOfBirth || "",
    bloodGroup: m.bloodGroup
      ? String(m.bloodGroup)
          .replace("+", "_POSITIVE")
          .replace("-", "_NEGATIVE")
          .toUpperCase()
      : "A_POSITIVE",
    phone: m.registeredMobile || "",
    email: "",
    addressLine1: "",
    addressLine2: "",
    city: "",
    state: "",
    pincode: "",
    country: "India",
    maritalStatus: "SINGLE",
    nationalId: "",
    photoUrl: "",
    emergencyName: "",
    emergencyRel: "",
    emergencyMobile: "",
    emergencyAltMobile: "",
    patientCategory: "GENERAL",
    registrationType: "WALK_IN",
    knownAllergies: "",
    chronicDiseases: "",
    specialNotes: "",
    changeReason: "Updated via Patient Portal Family Management",
  };
}

export const EditPatientModal: React.FC<EditPatientModalProps> = ({
  member,
  onClose,
  onSaved,
  onError,
}) => {
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [form, setForm] = useState(() => buildFormFromMember(member));

  useEffect(() => {
    if (!member) return;

    let cancelled = false;

    async function loadFullDetails() {
      try {
        const res = await apiClient.get(
          `/api/v1/patients/${encodeURIComponent(member!.mrn)}`,
        );
        if (cancelled) return;
        const rawData = ((res.data as { data?: Record<string, unknown> })
          ?.data || res.data) as Record<string, unknown>;

        if (rawData) {
          const em =
            (rawData.emergencyContact as Record<string, unknown>) || {};
          const addr =
            typeof rawData.address === "object" && rawData.address
              ? (rawData.address as Record<string, unknown>)
              : { addressLine1: String(rawData.address || "") };

          setForm((prev) => ({
            ...prev,
            fullName: String(rawData.fullName || member!.patientName || ""),
            gender: String(
              rawData.gender || member!.gender || "MALE",
            ).toUpperCase(),
            dateOfBirth: String(
              rawData.dateOfBirth || member!.dateOfBirth || "",
            ),
            bloodGroup: String(
              rawData.bloodGroup || member!.bloodGroup || "A_POSITIVE",
            ),
            phone: String(rawData.phone || member!.registeredMobile || ""),
            email: String(rawData.email || ""),
            addressLine1: String(addr.addressLine1 || ""),
            addressLine2: String(addr.addressLine2 || ""),
            city: String(addr.city || ""),
            state: String(addr.state || ""),
            pincode: String(addr.pincode || ""),
            country: String(addr.country || "India"),
            maritalStatus: String(
              rawData.maritalStatus || "SINGLE",
            ).toUpperCase(),
            nationalId: String(rawData.nationalId || ""),
            photoUrl: String(rawData.photoUrl || ""),
            emergencyName: String(em.name || ""),
            emergencyRel: String(em.relationship || ""),
            emergencyMobile: String(em.mobileNumber || ""),
            emergencyAltMobile: String(em.alternativeMobileNumber || ""),
            patientCategory: String(
              rawData.patientCategory || "GENERAL",
            ).toUpperCase(),
            registrationType: String(
              rawData.registrationType || "WALK_IN",
            ).toUpperCase(),
            knownAllergies: Array.isArray(rawData.knownAllergies)
              ? rawData.knownAllergies.join(", ")
              : String(rawData.knownAllergies || ""),
            chronicDiseases: Array.isArray(rawData.chronicDiseases)
              ? rawData.chronicDiseases.join(", ")
              : String(rawData.chronicDiseases || ""),
            specialNotes: String(rawData.specialNotes || ""),
          }));
        }
      } catch {
        // Fallback to basic member details already set
      }
    }

    loadFullDetails();

    return () => {
      cancelled = true;
    };
  }, [member]);

  if (!member) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!member.mrn) return;

    setIsSaving(true);
    try {
      const payload: Record<string, unknown> = {
        fullName: form.fullName,
        gender: form.gender,
        dateOfBirth: form.dateOfBirth,
        bloodGroup: form.bloodGroup,
        phone: form.phone,
        mobileNumber: form.phone,
        address: {
          addressLine1: form.addressLine1,
          addressLine2: form.addressLine2,
          city: form.city,
          state: form.state,
          pincode: form.pincode,
          country: form.country,
        },
        maritalStatus: form.maritalStatus,
        patientCategory: form.patientCategory,
        registrationType: form.registrationType,
        knownAllergies: form.knownAllergies
          ? form.knownAllergies
              .split(",")
              .map((s) => s.trim())
              .filter(Boolean)
          : [],
        chronicDiseases: form.chronicDiseases
          ? form.chronicDiseases
              .split(",")
              .map((s) => s.trim())
              .filter(Boolean)
          : [],
        specialNotes: form.specialNotes,
        changeReason:
          form.changeReason || "Updated via Patient Portal Family Management",
      };

      if (form.email?.trim()) {
        payload.email = form.email.trim();
      }
      if (form.nationalId?.trim()) {
        payload.nationalId = form.nationalId.trim();
      }
      if (form.photoUrl?.trim()) {
        payload.photoUrl = form.photoUrl.trim();
      }

      if (form.emergencyName?.trim() && form.emergencyMobile?.trim()) {
        const ec: Record<string, string> = {
          name: form.emergencyName.trim(),
          relationship: form.emergencyRel || "OTHER",
          mobileNumber: form.emergencyMobile.trim(),
          phone: form.emergencyMobile.trim(),
        };
        if (form.emergencyAltMobile?.trim()) {
          ec.alternativeMobileNumber = form.emergencyAltMobile.trim();
        }
        payload.emergencyContact = ec;
      }

      await apiClient.put(
        `/api/v1/patients/${encodeURIComponent(member.mrn)}`,
        payload,
      );

      onSaved(form.fullName);
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : "Failed to update patient details";
      onError(msg);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl border border-slate-200 max-w-3xl w-full my-8 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-5 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#0D47A1] text-white font-bold flex items-center justify-center text-sm shrink-0">
              <Edit3 size={18} />
            </div>
            <div>
              <h3
                className="text-base font-bold text-[#111827]"
                style={{ fontFamily: PP }}
              >
                Edit Patient Details
              </h3>
              <div
                className="flex items-center gap-2 text-xs text-[#64748B] mt-0.5"
                style={{ fontFamily: RB }}
              >
                <span>
                  MRN:{" "}
                  <strong className="font-mono text-[#0D47A1]">
                    {member.mrn}
                  </strong>
                </span>
                <span>·</span>
                <span>{member.patientName}</span>
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Form Body */}
        <form
          onSubmit={handleSubmit}
          className="flex-1 overflow-y-auto p-6 space-y-6"
        >
          {/* Section 1: Personal Details */}
          <div className="space-y-3">
            <h4
              className="text-xs font-bold text-[#0D47A1] uppercase tracking-wider border-b border-blue-100 pb-1.5"
              style={{ fontFamily: PP }}
            >
              Personal Details
            </h4>
            <div
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs"
              style={{ fontFamily: RB }}
            >
              <div>
                <label className="block text-[#64748B] font-medium mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  value={form.fullName}
                  onChange={(e) =>
                    setForm({ ...form, fullName: e.target.value })
                  }
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-[#111827] focus:outline-none focus:border-[#0D47A1] focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-[#64748B] font-medium mb-1">
                  Gender *
                </label>
                <select
                  value={form.gender}
                  onChange={(e) => setForm({ ...form, gender: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-[#111827] focus:outline-none focus:border-[#0D47A1] focus:bg-white"
                >
                  <option value="MALE">Male</option>
                  <option value="FEMALE">Female</option>
                  <option value="OTHER">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-[#64748B] font-medium mb-1">
                  Date of Birth
                </label>
                <input
                  type="date"
                  value={form.dateOfBirth}
                  onChange={(e) =>
                    setForm({ ...form, dateOfBirth: e.target.value })
                  }
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-[#111827] focus:outline-none focus:border-[#0D47A1] focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-[#64748B] font-medium mb-1">
                  Blood Group
                </label>
                <select
                  value={form.bloodGroup}
                  onChange={(e) =>
                    setForm({ ...form, bloodGroup: e.target.value })
                  }
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-[#111827] focus:outline-none focus:border-[#0D47A1] focus:bg-white"
                >
                  <option value="A_POSITIVE">A+</option>
                  <option value="A_NEGATIVE">A-</option>
                  <option value="B_POSITIVE">B+</option>
                  <option value="B_NEGATIVE">B-</option>
                  <option value="AB_POSITIVE">AB+</option>
                  <option value="AB_NEGATIVE">AB-</option>
                  <option value="O_POSITIVE">O+</option>
                  <option value="O_NEGATIVE">O-</option>
                </select>
              </div>

              <div>
                <label className="block text-[#64748B] font-medium mb-1">
                  Marital Status
                </label>
                <select
                  value={form.maritalStatus}
                  onChange={(e) =>
                    setForm({ ...form, maritalStatus: e.target.value })
                  }
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-[#111827] focus:outline-none focus:border-[#0D47A1] focus:bg-white"
                >
                  <option value="SINGLE">Single</option>
                  <option value="MARRIED">Married</option>
                  <option value="DIVORCED">Divorced</option>
                  <option value="WIDOWED">Widowed</option>
                </select>
              </div>

              <div>
                <label className="block text-[#64748B] font-medium mb-1">
                  National ID
                </label>
                <input
                  type="text"
                  value={form.nationalId}
                  onChange={(e) =>
                    setForm({ ...form, nationalId: e.target.value })
                  }
                  placeholder="e.g. Aadhar / SSN"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-[#111827] focus:outline-none focus:border-[#0D47A1] focus:bg-white font-mono"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Contact & Address */}
          <div className="space-y-3">
            <h4
              className="text-xs font-bold text-[#0D47A1] uppercase tracking-wider border-b border-blue-100 pb-1.5"
              style={{ fontFamily: PP }}
            >
              Contact & Address Details
            </h4>
            <div
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs"
              style={{ fontFamily: RB }}
            >
              <div>
                <label className="block text-[#64748B] font-medium mb-1">
                  Phone Number *
                </label>
                <input
                  type="tel"
                  required
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-[#111827] focus:outline-none focus:border-[#0D47A1] focus:bg-white font-mono"
                />
              </div>

              <div>
                <label className="block text-[#64748B] font-medium mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="patient@example.com"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-[#111827] focus:outline-none focus:border-[#0D47A1] focus:bg-white"
                />
              </div>

              <div className="sm:col-span-2 lg:col-span-1">
                <label className="block text-[#64748B] font-medium mb-1">
                  Address Line 1
                </label>
                <input
                  type="text"
                  value={form.addressLine1}
                  onChange={(e) =>
                    setForm({ ...form, addressLine1: e.target.value })
                  }
                  placeholder="Street name, house/apt #"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-[#111827] focus:outline-none focus:border-[#0D47A1] focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-[#64748B] font-medium mb-1">
                  City
                </label>
                <input
                  type="text"
                  value={form.city}
                  onChange={(e) => setForm({ ...form, city: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-[#111827] focus:outline-none focus:border-[#0D47A1] focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-[#64748B] font-medium mb-1">
                  State / Province
                </label>
                <input
                  type="text"
                  value={form.state}
                  onChange={(e) => setForm({ ...form, state: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-[#111827] focus:outline-none focus:border-[#0D47A1] focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-[#64748B] font-medium mb-1">
                  Pincode / Zipcode
                </label>
                <input
                  type="text"
                  value={form.pincode}
                  onChange={(e) =>
                    setForm({ ...form, pincode: e.target.value })
                  }
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-[#111827] focus:outline-none focus:border-[#0D47A1] focus:bg-white font-mono"
                />
              </div>
            </div>
          </div>

          {/* Section 3: Emergency Contact */}
          <div className="space-y-3">
            <h4
              className="text-xs font-bold text-[#0D47A1] uppercase tracking-wider border-b border-blue-100 pb-1.5"
              style={{ fontFamily: PP }}
            >
              Emergency Contact Details
            </h4>
            <div
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs"
              style={{ fontFamily: RB }}
            >
              <div>
                <label className="block text-[#64748B] font-medium mb-1">
                  Contact Name
                </label>
                <input
                  type="text"
                  value={form.emergencyName}
                  onChange={(e) =>
                    setForm({ ...form, emergencyName: e.target.value })
                  }
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-[#111827] focus:outline-none focus:border-[#0D47A1] focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-[#64748B] font-medium mb-1">
                  Relationship
                </label>
                <input
                  type="text"
                  value={form.emergencyRel}
                  onChange={(e) =>
                    setForm({ ...form, emergencyRel: e.target.value })
                  }
                  placeholder="e.g. Spouse / Parent"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-[#111827] focus:outline-none focus:border-[#0D47A1] focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-[#64748B] font-medium mb-1">
                  Mobile Number
                </label>
                <input
                  type="tel"
                  value={form.emergencyMobile}
                  onChange={(e) =>
                    setForm({ ...form, emergencyMobile: e.target.value })
                  }
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-[#111827] focus:outline-none focus:border-[#0D47A1] focus:bg-white font-mono"
                />
              </div>

              <div>
                <label className="block text-[#64748B] font-medium mb-1">
                  Alt Mobile Number
                </label>
                <input
                  type="tel"
                  value={form.emergencyAltMobile}
                  onChange={(e) =>
                    setForm({ ...form, emergencyAltMobile: e.target.value })
                  }
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-[#111827] focus:outline-none focus:border-[#0D47A1] focus:bg-white font-mono"
                />
              </div>
            </div>
          </div>

          {/* Section 4: Medical Info */}
          <div className="space-y-3">
            <h4
              className="text-xs font-bold text-[#0D47A1] uppercase tracking-wider border-b border-blue-100 pb-1.5"
              style={{ fontFamily: PP }}
            >
              Medical & Registration Information
            </h4>
            <div
              className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs"
              style={{ fontFamily: RB }}
            >
              <div>
                <label className="block text-[#64748B] font-medium mb-1">
                  Patient Category
                </label>
                <select
                  value={form.patientCategory}
                  onChange={(e) =>
                    setForm({ ...form, patientCategory: e.target.value })
                  }
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-[#111827] focus:outline-none focus:border-[#0D47A1] focus:bg-white"
                >
                  <option value="GENERAL">General</option>
                  <option value="VIP">VIP</option>
                  <option value="SENIOR_CITIZEN">Senior Citizen</option>
                  <option value="STAFF">Staff</option>
                  <option value="DEPENDENT">Dependent</option>
                </select>
              </div>

              <div>
                <label className="block text-[#64748B] font-medium mb-1">
                  Registration Type
                </label>
                <select
                  value={form.registrationType}
                  onChange={(e) =>
                    setForm({ ...form, registrationType: e.target.value })
                  }
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-[#111827] focus:outline-none focus:border-[#0D47A1] focus:bg-white"
                >
                  <option value="WALK_IN">Walk-In</option>
                  <option value="ONLINE">Online</option>
                  <option value="REFERRAL">Referral</option>
                  <option value="EMERGENCY">Emergency</option>
                </select>
              </div>

              <div>
                <label className="block text-[#64748B] font-medium mb-1">
                  Known Allergies (comma-separated)
                </label>
                <input
                  type="text"
                  value={form.knownAllergies}
                  onChange={(e) =>
                    setForm({ ...form, knownAllergies: e.target.value })
                  }
                  placeholder="e.g. Penicillin, Peanuts"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-[#111827] focus:outline-none focus:border-[#0D47A1] focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-[#64748B] font-medium mb-1">
                  Chronic Diseases (comma-separated)
                </label>
                <input
                  type="text"
                  value={form.chronicDiseases}
                  onChange={(e) =>
                    setForm({ ...form, chronicDiseases: e.target.value })
                  }
                  placeholder="e.g. Diabetes, Hypertension"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-[#111827] focus:outline-none focus:border-[#0D47A1] focus:bg-white"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-[#64748B] font-medium mb-1">
                  Special Notes
                </label>
                <textarea
                  rows={2}
                  value={form.specialNotes}
                  onChange={(e) =>
                    setForm({ ...form, specialNotes: e.target.value })
                  }
                  placeholder="Any additional clinical or administrative notes"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-[#111827] focus:outline-none focus:border-[#0D47A1] focus:bg-white resize-none"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-[#64748B] font-medium mb-1">
                  Reason for Change
                </label>
                <input
                  type="text"
                  value={form.changeReason}
                  onChange={(e) =>
                    setForm({ ...form, changeReason: e.target.value })
                  }
                  placeholder="e.g. Family details updated via Patient Portal"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-[#111827] focus:outline-none focus:border-[#0D47A1] focus:bg-white"
                />
              </div>
            </div>
          </div>

          {/* Footer Buttons */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-[#64748B] hover:bg-slate-100 transition-colors"
              style={{ fontFamily: PP }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="px-6 py-2 bg-[#0D47A1] text-white rounded-xl text-xs font-bold hover:bg-[#0c3d8a] transition-colors shadow-sm flex items-center gap-2 disabled:opacity-60 cursor-pointer"
              style={{ fontFamily: PP }}
            >
              {isSaving ? (
                <>
                  <Loader2 size={14} className="animate-spin" /> Saving...
                </>
              ) : (
                <>
                  <CheckCircle2 size={14} /> Save Patient Details
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
