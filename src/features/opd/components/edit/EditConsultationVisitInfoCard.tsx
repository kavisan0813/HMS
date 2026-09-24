import React from "react";
import { ChevronDown } from "lucide-react";

const PP = "'Poppins', system-ui, sans-serif";
const RB = "'Roboto', system-ui, sans-serif";

export interface VisitInfoFormData {
  visitDate: string;
  doctorName: string;
  department: string;
  visitType: string;
  chiefComplaint: string;
}

interface EditConsultationVisitInfoCardProps<
  T extends VisitInfoFormData = VisitInfoFormData,
> {
  collapsed: boolean;
  onToggle: () => void;
  isEditing: boolean;
  formData: T;
  setFormData: React.Dispatch<React.SetStateAction<T>>;
}

export const EditConsultationVisitInfoCard = <T extends VisitInfoFormData>({
  collapsed,
  onToggle,
  isEditing,
  formData,
  setFormData,
}: EditConsultationVisitInfoCardProps<T>) => {
  return (
    <div className="bg-white rounded-2xl border border-[#E5E7EB] shadow-sm overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full px-5 py-4 bg-slate-50/50 flex items-center justify-between border-b border-gray-100 cursor-pointer"
      >
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-blue-50 text-[#0D47A1] flex items-center justify-center font-bold text-xs">
            01
          </div>
          <h3
            className="text-sm font-bold text-[#111827]"
            style={{ fontFamily: PP }}
          >
            Visit Information
          </h3>
        </div>
        <ChevronDown
          size={18}
          className={`text-slate-400 transition-transform ${collapsed ? "-rotate-90" : ""}`}
        />
      </button>

      {!collapsed && (
        <div className="p-5 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div>
              <label
                className="block text-[11px] font-semibold text-[#64748B] mb-1"
                style={{ fontFamily: PP }}
              >
                Visit Date
              </label>
              <input
                disabled
                type="text"
                readOnly
                value={formData.visitDate}
                className="w-full px-3 py-2 bg-gray-100 border border-[#E5E7EB] rounded-xl text-xs font-semibold text-slate-700 cursor-not-allowed"
                style={{ fontFamily: RB }}
              />
            </div>
            <div>
              <label
                className="block text-[11px] font-semibold text-[#64748B] mb-1"
                style={{ fontFamily: PP }}
              >
                Doctor
              </label>
              <input
                disabled
                type="text"
                readOnly
                value={formData.doctorName}
                className="w-full px-3 py-2 bg-gray-100 border border-[#E5E7EB] rounded-xl text-xs font-semibold text-slate-700 cursor-not-allowed"
                style={{ fontFamily: RB }}
              />
            </div>
            <div>
              <label
                className="block text-[11px] font-semibold text-[#64748B] mb-1"
                style={{ fontFamily: PP }}
              >
                Department
              </label>
              <input
                disabled
                type="text"
                readOnly
                value={formData.department}
                className="w-full px-3 py-2 bg-gray-100 border border-[#E5E7EB] rounded-xl text-xs font-semibold text-slate-700 cursor-not-allowed"
                style={{ fontFamily: RB }}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div>
              <label
                className="block text-[11px] font-semibold text-[#64748B] mb-1"
                style={{ fontFamily: PP }}
              >
                Visit Type
              </label>
              <select
                disabled={!isEditing}
                value={formData.visitType}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    visitType: e.target.value,
                  }))
                }
                className="w-full px-3 py-2 bg-slate-50 border border-[#E5E7EB] rounded-xl text-xs text-[#111827] focus:outline-none focus:border-[#0D47A1] disabled:opacity-65 disabled:bg-slate-100"
                style={{ fontFamily: RB }}
              >
                <option value="New Consultation">New Consultation</option>
                <option value="Follow-up">Follow-up</option>
                <option value="First Visit">First Visit</option>
              </select>
            </div>
          </div>

          <div>
            <label
              className="block text-[11px] font-semibold text-[#64748B] mb-1"
              style={{ fontFamily: PP }}
            >
              Chief Complaint <span className="text-red-500">*</span>
            </label>
            <textarea
              disabled={!isEditing}
              rows={2}
              value={formData.chiefComplaint}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  chiefComplaint: e.target.value,
                }))
              }
              className="w-full p-3 bg-slate-50 border border-[#E5E7EB] rounded-xl text-xs text-[#111827] focus:outline-none focus:border-[#0D47A1] disabled:opacity-65 disabled:bg-slate-100"
              style={{ fontFamily: RB }}
            />
          </div>
        </div>
      )}
    </div>
  );
};
