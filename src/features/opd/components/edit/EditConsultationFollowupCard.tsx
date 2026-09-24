import React from "react";
import { ChevronDown } from "lucide-react";

const PP = "'Poppins', system-ui, sans-serif";
const RB = "'Roboto', system-ui, sans-serif";

export interface FollowupFormData {
  followupRequired: boolean;
  nextVisitDate: string;
  followupNotes: string;
}

interface EditConsultationFollowupCardProps<
  T extends FollowupFormData = FollowupFormData,
> {
  collapsed: boolean;
  onToggle: () => void;
  isEditing: boolean;
  formData: T;
  setFormData: React.Dispatch<React.SetStateAction<T>>;
}

export const EditConsultationFollowupCard = <T extends FollowupFormData>({
  collapsed,
  onToggle,
  isEditing,
  formData,
  setFormData,
}: EditConsultationFollowupCardProps<T>) => {
  return (
    <div className="bg-white rounded-2xl border border-[#E5E7EB] shadow-sm overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full px-5 py-4 bg-slate-50/50 flex items-center justify-between border-b border-gray-100 cursor-pointer"
      >
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center font-bold text-xs">
            07
          </div>
          <h3
            className="text-sm font-bold text-[#111827]"
            style={{ fontFamily: PP }}
          >
            Follow-up Schedule
          </h3>
        </div>
        <ChevronDown
          size={18}
          className={`text-slate-400 transition-transform ${collapsed ? "-rotate-90" : ""}`}
        />
      </button>

      {!collapsed && (
        <div className="p-5 space-y-4 text-xs" style={{ fontFamily: RB }}>
          <label className="flex items-center gap-2 font-medium text-[#111827] cursor-pointer">
            <input
              disabled={!isEditing}
              type="checkbox"
              checked={formData.followupRequired}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  followupRequired: e.target.checked,
                }))
              }
              className="w-4 h-4 rounded text-[#0D47A1] focus:ring-[#0D47A1] disabled:opacity-65"
            />
            <span>Follow-up Visit Required</span>
          </label>

          {formData.followupRequired && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label
                  className="block text-[11px] font-semibold text-[#64748B] mb-1"
                  style={{ fontFamily: PP }}
                >
                  Next Visit Date
                </label>
                <input
                  disabled={!isEditing}
                  type="date"
                  value={formData.nextVisitDate}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      nextVisitDate: e.target.value,
                    }))
                  }
                  className="w-full px-3 py-2 bg-slate-50 border border-[#E5E7EB] rounded-xl text-xs text-[#111827] disabled:opacity-65 disabled:bg-slate-100"
                />
              </div>
              <div>
                <label
                  className="block text-[11px] font-semibold text-[#64748B] mb-1"
                  style={{ fontFamily: PP }}
                >
                  Follow-up Instructions / Notes
                </label>
                <input
                  disabled={!isEditing}
                  type="text"
                  value={formData.followupNotes}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      followupNotes: e.target.value,
                    }))
                  }
                  className="w-full px-3 py-2 bg-slate-50 border border-[#E5E7EB] rounded-xl text-xs text-[#111827] disabled:opacity-65 disabled:bg-slate-100"
                />
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
