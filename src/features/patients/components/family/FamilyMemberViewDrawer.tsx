import React from "react";
import { X, Edit3, UserX, Clock, CheckCircle2 } from "lucide-react";
import type { FamilyMember } from "../../types/family.types";

const PP = "'Poppins', system-ui, sans-serif";
const RB = "'Roboto', system-ui, sans-serif";

function calculateAge(dob?: string, ageVal?: number): number {
  if (typeof ageVal === "number" && ageVal > 0) return ageVal;
  if (!dob) return 0;
  try {
    const birthDate = new Date(dob);
    if (isNaN(birthDate.getTime())) return 0;
    const today = new Date();
    let computedAge = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (
      monthDiff < 0 ||
      (monthDiff === 0 && today.getDate() < birthDate.getDate())
    ) {
      computedAge--;
    }
    return Math.max(0, computedAge);
  } catch (err) {
    console.log(err);
    return 0;
  }
}

interface FamilyMemberViewDrawerProps {
  member: FamilyMember | null;
  modalData: {
    basicInfo?: Record<string, unknown>;
    loading: boolean;
  };
  onClose: () => void;
  onOpenEdit: (member: FamilyMember) => void;
  onOpenRemove: (member: FamilyMember) => void;
}

export const FamilyMemberViewDrawer: React.FC<FamilyMemberViewDrawerProps> = ({
  member,
  modalData,
  onClose,
  onOpenEdit,
  onOpenRemove,
}) => {
  if (!member) return null;

  const info = modalData.basicInfo || {};
  const fullName = String(info.fullName || member.patientName || "Patient");
  const mrn = member.mrn;
  const relationship = String(
    info.relationship || member.relationship || "Family Member",
  );
  const dob = String(info.dateOfBirth || member.dateOfBirth || "");
  const computedAge = member.age > 0 ? member.age : calculateAge(dob);
  const gender = String(info.gender || member.gender || "Other");
  const bloodGroup = String(info.bloodGroup || member.bloodGroup || "");
  const phone = String(info.phone || member.registeredMobile || "");
  const email = String(info.email || "");
  const maritalStatus = String(info.maritalStatus || "");
  const nationalId = String(info.nationalId || "");
  const patientCategory = String(info.patientCategory || "");
  const registrationType = String(info.registrationType || "");
  const knownAllergies = Array.isArray(info.knownAllergies)
    ? (info.knownAllergies as string[]).join(", ")
    : String(info.knownAllergies || "");
  const chronicDiseases = Array.isArray(info.chronicDiseases)
    ? (info.chronicDiseases as string[]).join(", ")
    : String(info.chronicDiseases || "");
  const specialNotes = String(info.specialNotes || "");

  const address =
    typeof info.address === "object" && info.address
      ? Object.values(info.address as Record<string, unknown>)
          .filter(Boolean)
          .join(", ")
      : String(info.address || "");

  const emergency =
    typeof info.emergencyContact === "object" && info.emergencyContact
      ? (info.emergencyContact as Record<string, unknown>)
      : null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/40 backdrop-blur-xs transition-opacity animate-in fade-in duration-200">
      <div className="absolute inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-white shadow-2xl flex flex-col border-l border-slate-200">
          {/* ── DRAWER HEADER ── */}
          <div className="p-5 border-b border-slate-200 bg-slate-50 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3.5 min-w-0">
              <div className="w-11 h-11 rounded-full bg-[#0D47A1] text-white flex items-center justify-center font-bold text-base shadow-sm shrink-0">
                {fullName[0]?.toUpperCase() || "P"}
              </div>
              <div className="min-w-0">
                <h3
                  className="text-base font-bold text-[#111827] truncate"
                  style={{ fontFamily: PP }}
                >
                  {fullName}
                </h3>
                <div
                  className="flex items-center gap-2 text-xs text-[#64748B] mt-0.5"
                  style={{ fontFamily: RB }}
                >
                  <span className="font-mono bg-blue-50 text-[#0D47A1] px-2 py-0.5 rounded-md font-semibold text-[11px]">
                    {mrn}
                  </span>
                  <span>·</span>
                  <span className="font-medium text-[#0D47A1]">
                    {relationship}
                  </span>
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer shrink-0"
              title="Close Drawer"
            >
              <X size={18} />
            </button>
          </div>

          {/* ── DRAWER BODY (SCROLLABLE) ── */}
          <div className="flex-1 overflow-y-auto p-5 space-y-5">
            {/* Header Action Bar */}
            <div className="flex items-center justify-between bg-blue-50/60 border border-blue-100 p-3 rounded-xl">
              <div
                className="flex items-center gap-2 text-xs text-[#0D47A1] font-semibold"
                style={{ fontFamily: PP }}
              >
                <CheckCircle2 size={15} />
                <span>Patient Profile Details</span>
              </div>
              <button
                type="button"
                onClick={() => onOpenEdit(member)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#0D47A1] text-white rounded-lg text-xs font-semibold hover:bg-[#0c3d8a] transition-colors cursor-pointer shadow-2xs"
                style={{ fontFamily: PP }}
              >
                <Edit3 size={13} />
                Edit Details
              </button>
            </div>

            {/* Section: Basic Demographics */}
            <div>
              <h4
                className="text-xs font-bold text-[#64748B] uppercase tracking-wider mb-2.5"
                style={{ fontFamily: PP }}
              >
                Demographic Information
              </h4>
              <div
                className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2.5 text-xs"
                style={{ fontFamily: RB }}
              >
                <div className="flex justify-between items-center">
                  <span className="text-[#64748B]">Full Name:</span>
                  <span className="font-semibold text-[#111827]">
                    {fullName}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[#64748B]">MRN:</span>
                  <span className="font-mono font-semibold text-[#111827]">
                    {mrn}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[#64748B]">Relationship:</span>
                  <span className="font-semibold text-[#0D47A1] bg-blue-50 px-2 py-0.5 rounded-md">
                    {relationship}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[#64748B]">Age / DOB:</span>
                  <span className="font-semibold text-[#111827]">
                    {dob ? `${dob} (${computedAge} yrs)` : `${computedAge} yrs`}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[#64748B]">Gender:</span>
                  <span className="font-semibold text-[#111827]">{gender}</span>
                </div>
                {bloodGroup && (
                  <div className="flex justify-between items-center">
                    <span className="text-[#64748B]">Blood Group:</span>
                    <span className="font-bold text-[#EF4444] bg-red-50 px-2 py-0.5 rounded-md">
                      {bloodGroup}
                    </span>
                  </div>
                )}
                {maritalStatus && (
                  <div className="flex justify-between items-center">
                    <span className="text-[#64748B]">Marital Status:</span>
                    <span className="font-semibold text-[#111827]">
                      {maritalStatus}
                    </span>
                  </div>
                )}
                {nationalId && (
                  <div className="flex justify-between items-center">
                    <span className="text-[#64748B]">National ID:</span>
                    <span className="font-mono font-semibold text-[#111827]">
                      {nationalId}
                    </span>
                  </div>
                )}
                <div className="flex justify-between items-center pt-1 border-t border-slate-200">
                  <span className="text-[#64748B]">Verification Status:</span>
                  <span
                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                      member.verificationStatus === "Verified"
                        ? "bg-emerald-100 text-[#66BB6A]"
                        : member.verificationStatus === "Pending"
                          ? "bg-amber-100 text-[#F59E0B]"
                          : "bg-slate-100 text-[#64748B]"
                    }`}
                  >
                    {member.verificationStatus === "Pending" && (
                      <Clock size={10} />
                    )}
                    {member.verificationStatus}
                  </span>
                </div>
              </div>
            </div>

            {/* Section: Contact & Address */}
            <div>
              <h4
                className="text-xs font-bold text-[#64748B] uppercase tracking-wider mb-2.5"
                style={{ fontFamily: PP }}
              >
                Contact & Location
              </h4>
              <div
                className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2.5 text-xs"
                style={{ fontFamily: RB }}
              >
                <div className="flex justify-between items-center">
                  <span className="text-[#64748B]">Phone Number:</span>
                  <span className="font-mono font-semibold text-[#111827]">
                    {phone || "N/A"}
                  </span>
                </div>
                {email && (
                  <div className="flex justify-between items-center">
                    <span className="text-[#64748B]">Email Address:</span>
                    <span className="font-semibold text-[#111827] truncate max-w-50">
                      {email}
                    </span>
                  </div>
                )}
                {address && (
                  <div className="flex justify-between items-start">
                    <span className="text-[#64748B] shrink-0">Address:</span>
                    <span className="font-semibold text-[#111827] text-right ml-4">
                      {address}
                    </span>
                  </div>
                )}
                {emergency && (
                  <div className="pt-2 border-t border-slate-200 space-y-1.5">
                    <div className="text-[11px] font-bold text-[#0D47A1] uppercase tracking-wide">
                      Emergency Contact
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#64748B]">Name:</span>
                      <span className="font-semibold text-[#111827]">
                        {String(emergency.name || "N/A")} (
                        {String(emergency.relationship || "Contact")})
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#64748B]">Mobile:</span>
                      <span className="font-mono font-semibold text-[#111827]">
                        {String(emergency.mobileNumber || "N/A")}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Section: Clinical & Registration */}
            {(patientCategory ||
              registrationType ||
              knownAllergies ||
              chronicDiseases ||
              specialNotes) && (
              <div>
                <h4
                  className="text-xs font-bold text-[#64748B] uppercase tracking-wider mb-2.5"
                  style={{ fontFamily: PP }}
                >
                  Medical & Category Info
                </h4>
                <div
                  className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2.5 text-xs"
                  style={{ fontFamily: RB }}
                >
                  {patientCategory && (
                    <div className="flex justify-between items-center">
                      <span className="text-[#64748B]">Patient Category:</span>
                      <span className="font-semibold text-[#0D47A1]">
                        {patientCategory}
                      </span>
                    </div>
                  )}
                  {registrationType && (
                    <div className="flex justify-between items-center">
                      <span className="text-[#64748B]">Registration Type:</span>
                      <span className="font-semibold text-[#111827]">
                        {registrationType}
                      </span>
                    </div>
                  )}
                  {knownAllergies && (
                    <div className="flex justify-between items-center">
                      <span className="text-[#64748B]">Known Allergies:</span>
                      <span className="font-semibold text-amber-700">
                        {knownAllergies}
                      </span>
                    </div>
                  )}
                  {chronicDiseases && (
                    <div className="flex justify-between items-center">
                      <span className="text-[#64748B]">Chronic Diseases:</span>
                      <span className="font-semibold text-red-700">
                        {chronicDiseases}
                      </span>
                    </div>
                  )}
                  {specialNotes && (
                    <div className="pt-1 border-t border-slate-200">
                      <span className="text-[#64748B] block mb-1">
                        Special Notes:
                      </span>
                      <p className="text-[#111827] bg-white p-2.5 rounded-lg border border-slate-200 text-xs">
                        {specialNotes}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* ── DRAWER FOOTER ── */}
          <div className="p-4 border-t border-slate-200 bg-slate-50 space-y-2 shrink-0">
            <div className="flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-[#64748B] hover:bg-slate-100 transition-colors cursor-pointer"
                style={{ fontFamily: PP }}
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => onOpenEdit(member)}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#0D47A1] text-white rounded-xl text-xs font-semibold hover:bg-[#0c3d8a] transition-colors cursor-pointer shadow-xs"
                style={{ fontFamily: PP }}
              >
                <Edit3 size={14} />
                Edit Profile
              </button>
            </div>
            {member.relationship !== "Self" && (
              <button
                type="button"
                onClick={() => onOpenRemove(member)}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-white border border-red-200 rounded-xl text-xs font-semibold text-[#EF4444] hover:bg-red-50 transition-colors cursor-pointer"
                style={{ fontFamily: PP }}
              >
                <UserX size={14} />
                Remove Link
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
