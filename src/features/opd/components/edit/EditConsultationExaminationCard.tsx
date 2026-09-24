import React from "react";
import { ChevronDown } from "lucide-react";

const PP = "'Poppins', system-ui, sans-serif";
const RB = "'Roboto', system-ui, sans-serif";

export interface ExaminationFormData {
  clinicalExamination: string;
  provisionalDiagnosis: string;
  finalDiagnosis: string;
  icdCode?: string;
}

interface EditConsultationExaminationCardProps<
  T extends ExaminationFormData = ExaminationFormData,
> {
  collapsed: boolean;
  onToggle: () => void;
  isEditing: boolean;
  formData: T;
  setFormData: React.Dispatch<React.SetStateAction<T>>;
}

export const EditConsultationExaminationCard = <T extends ExaminationFormData>({
  collapsed,
  onToggle,
  isEditing,
  formData,
  setFormData,
}: EditConsultationExaminationCardProps<T>) => {
  return (
    <div className="bg-white rounded-2xl border border-[#E5E7EB] shadow-sm overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full px-5 py-4 bg-slate-50/50 flex items-center justify-between border-b border-gray-100 cursor-pointer"
      >
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-700 flex items-center justify-center font-bold text-xs">
            03
          </div>
          <h3
            className="text-sm font-bold text-[#111827]"
            style={{ fontFamily: PP }}
          >
            Clinical Examination & Diagnosis
          </h3>
        </div>
        <ChevronDown
          size={18}
          className={`text-slate-400 transition-transform ${collapsed ? "-rotate-90" : ""}`}
        />
      </button>

      {!collapsed && (
        <div className="p-5 space-y-4">
          <div>
            <label
              className="block text-[11px] font-semibold text-[#64748B] mb-1"
              style={{ fontFamily: PP }}
            >
              Clinical Examination Findings
            </label>
            <textarea
              disabled={!isEditing}
              rows={2}
              value={formData.clinicalExamination}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  clinicalExamination: e.target.value,
                }))
              }
              className="w-full p-3 bg-slate-50 border border-[#E5E7EB] rounded-xl text-xs text-[#111827] focus:outline-none focus:border-[#0D47A1] disabled:opacity-65 disabled:bg-slate-100"
              style={{ fontFamily: RB }}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label
                className="block text-[11px] font-semibold text-[#64748B] mb-1"
                style={{ fontFamily: PP }}
              >
                Provisional Diagnosis
              </label>
              <input
                disabled={!isEditing}
                type="text"
                value={formData.provisionalDiagnosis}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    provisionalDiagnosis: e.target.value,
                  }))
                }
                className="w-full px-3 py-2 bg-slate-50 border border-[#E5E7EB] rounded-xl text-xs text-[#111827] disabled:opacity-65 disabled:bg-slate-100"
                style={{ fontFamily: RB }}
              />
            </div>
            <div>
              <label
                className="block text-[11px] font-semibold text-[#64748B] mb-1"
                style={{ fontFamily: PP }}
              >
                Final Diagnosis <span className="text-red-500">*</span>
              </label>
              <input
                disabled={!isEditing}
                type="text"
                value={formData.finalDiagnosis}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    finalDiagnosis: e.target.value,
                  }))
                }
                className="w-full px-3 py-2 bg-slate-50 border border-[#E5E7EB] rounded-xl text-xs text-[#111827] disabled:opacity-65 disabled:bg-slate-100"
                style={{ fontFamily: RB }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
