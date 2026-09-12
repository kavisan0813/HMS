import React from "react";
import { AlertCircle } from "lucide-react";

const PP = "'Poppins', system-ui, sans-serif";
const RB = "'Roboto', system-ui, sans-serif";

interface EditConsultationPatientBannerProps {
  patientInitials: string;
  patientName: string;
  mrn: string;
  consultationId: string;
  age: string | number;
  gender: string;
  bloodGroup: string;
  tokenNo: string;
  doctorName: string;
  department: string;
  visitDate: string;
  allergies: string[];
  onViewPatientProfile?: (mrn: string) => void;
  onViewHistory?: (mrn?: string) => void;
}

export const EditConsultationPatientBanner: React.FC<
  EditConsultationPatientBannerProps
> = ({
  patientInitials,
  patientName,
  mrn,
  consultationId,
  age,
  gender,
  bloodGroup,
  tokenNo,
  doctorName,
  department,
  visitDate,
  allergies,
  onViewPatientProfile,
  onViewHistory,
}) => {
  return (
    <div className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-[#E5E7EB] px-6 py-3 shadow-sm">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        <div className="flex items-center gap-3 overflow-x-auto">
          <div
            className="w-10 h-10 rounded-full bg-[#0D47A1] text-white flex items-center justify-center font-bold text-sm shrink-0"
            style={{ fontFamily: PP }}
          >
            {patientInitials}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span
                className="font-bold text-sm text-[#111827]"
                style={{ fontFamily: PP }}
              >
                {patientName}
              </span>
              <span className="font-mono text-[10px] bg-blue-50 text-[#0D47A1] px-2 py-0.5 rounded font-bold">
                {mrn}
              </span>
              <span className="font-mono text-[10px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-bold">
                {consultationId.startsWith("ENC-") ||
                consultationId.startsWith("CNS-")
                  ? consultationId
                  : `CNS-${consultationId}`}
              </span>
            </div>
            <div
              className="flex items-center gap-3 text-xs text-[#64748B] mt-0.5"
              style={{ fontFamily: RB }}
            >
              <span>
                {age} yrs / {gender}
              </span>
              <span>•</span>
              <span>
                Blood:{" "}
                <strong className="text-[#111827]">{bloodGroup || "—"}</strong>
              </span>
              <span>•</span>
              <span>
                Token:{" "}
                <strong className="text-[#0D47A1]">{tokenNo || "—"}</strong>
              </span>
              <span>•</span>
              <span>
                Doctor:{" "}
                <strong className="text-[#111827]">{doctorName || "—"}</strong>
              </span>
              {department && (
                <>
                  <span>•</span>
                  <span>
                    Department:{" "}
                    <strong className="text-[#0D47A1]">{department}</strong>
                  </span>
                </>
              )}
              <span>•</span>
              <span>
                Date:{" "}
                <strong className="text-[#111827]">{visitDate || "—"}</strong>
              </span>
            </div>
          </div>

          {allergies && allergies.length > 0 && (
            <div
              className="flex items-center gap-1.5 px-2.5 py-1 bg-red-50 text-red-600 border border-red-100 rounded-full text-[11px] font-semibold shrink-0"
              style={{ fontFamily: PP }}
            >
              <AlertCircle size={13} />
              <span>Allergies: {allergies.join(", ")}</span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {onViewPatientProfile && mrn && (
            <button
              onClick={() => onViewPatientProfile(mrn)}
              className="px-3 py-1.5 rounded-lg border border-[#E5E7EB] bg-white text-xs font-semibold text-[#111827] hover:bg-slate-50 transition-colors cursor-pointer"
              style={{ fontFamily: PP }}
            >
              View Patient Profile
            </button>
          )}

          <button
            onClick={() => onViewHistory?.(mrn)}
            className="px-3 py-1.5 rounded-lg bg-blue-50 text-[#0D47A1] hover:bg-blue-100 text-xs font-semibold transition-colors cursor-pointer"
            style={{ fontFamily: PP }}
          >
            View Consultation History
          </button>
        </div>
      </div>
    </div>
  );
};
