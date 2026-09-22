import React from "react";
import { ChevronRight, Edit3, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router";

const PP = "'Poppins', system-ui, sans-serif";
const RB = "'Roboto', system-ui, sans-serif";

interface EditConsultationHeaderProps {
  isEditing: boolean;
  saving: boolean;
  revisionNumber: number;
  onStartEditing: () => void;
  onCancelEditing: () => void;
  onBack?: () => void;
}

export const EditConsultationHeader: React.FC<EditConsultationHeaderProps> = ({
  isEditing,
  saving,
  revisionNumber,
  onStartEditing,
  onCancelEditing,
  onBack,
}) => {
  const navigate = useNavigate();

  const handleBackClick = () => {
    if (onBack) {
      onBack();
    } else {
      try {
        navigate(-1);
      } catch (err) {
        console.log(err);
        window.history.back();
      }
    }
  };

  return (
    <div className="bg-white border-b border-[#E5E7EB] px-6 py-4">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div
            className="flex items-center gap-2 text-xs text-[#64748B] mb-1"
            style={{ fontFamily: RB }}
          >
            <span>Doctor</span>
            <ChevronRight size={12} className="text-slate-400" />
            <span>OPD Consultation</span>
            <ChevronRight size={12} className="text-slate-400" />
            <span className="font-semibold text-[#0D47A1]">
              Edit Consultation
            </span>
          </div>
          <div className="flex items-center gap-3">
            <h1
              className="text-2xl font-bold text-[#111827]"
              style={{ fontFamily: PP }}
            >
              Edit Consultation
            </h1>
            <span
              className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200"
              style={{ fontFamily: PP }}
            >
              Revision #{revisionNumber}
            </span>
          </div>
          <p
            className="text-sm text-[#64748B] mt-0.5"
            style={{ fontFamily: RB }}
          >
            Review and update consultation details.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleBackClick}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-[#E5E7EB] bg-white text-[#111827] hover:bg-slate-50 text-xs font-semibold transition-all shadow-sm cursor-pointer"
            style={{ fontFamily: PP }}
          >
            <ArrowLeft size={14} />
            Back
          </button>

          {!isEditing ? (
            <button
              onClick={onStartEditing}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#0D47A1] text-white hover:bg-[#0a3880] text-xs font-semibold transition-all shadow-sm cursor-pointer"
              style={{ fontFamily: PP }}
            >
              <Edit3 size={14} />
              Edit All Details
            </button>
          ) : (
            <button
              onClick={onCancelEditing}
              disabled={saving}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-[#E5E7EB] bg-white text-[#111827] hover:bg-slate-50 text-xs font-semibold transition-all shadow-sm cursor-pointer disabled:opacity-50"
              style={{ fontFamily: PP }}
            >
              <ArrowLeft size={14} />
              Cancel Edit
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
