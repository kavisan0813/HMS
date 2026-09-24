import React, { useEffect } from "react";
import { Calendar } from "lucide-react";
import { consultationApi } from "../api/consultationApi";

const PP = "'Poppins', system-ui, sans-serif";
const RB = "'Roboto', system-ui, sans-serif";

interface FollowupFormProps {
  required: boolean;
  nextVisitDate: string;
  notes: string;
  followUpType?: string;
  followUpIntervalValue?: number | string;
  followUpIntervalUnit?: string;
  onChange: (field: string, val: unknown) => void;
  patientMrn?: string;
  encounterId?: string | number;
}

export const FollowupForm: React.FC<FollowupFormProps> = ({
  required,
  nextVisitDate,
  notes,
  followUpType = "ROUTINE",
  followUpIntervalValue = 7,
  followUpIntervalUnit = "DAYS",
  onChange,
  patientMrn,
  encounterId,
}) => {
  // Load existing consultation follow-up data from GET /api/v1/encounters/{encounterId}/consultation
  useEffect(() => {
    let isMounted = true;
    const encId = Number(encounterId) || 0;
    if (encId <= 0) return;

    async function loadConsultationFollowup() {
      try {
        const consData = await consultationApi.getConsultation(encId);
        if (consData && isMounted) {
          const fuDate = String(
            consData.followUpDate || consData.nextVisitDate || "",
          );
          const fuInstructions = String(
            consData.followUpInstructions || consData.followupNotes || "",
          );
          const fuType = String(consData.followUpType || "ROUTINE");
          const fuVal =
            consData.followUpIntervalValue != null
              ? Number(consData.followUpIntervalValue)
              : undefined;
          const fuUnit = String(consData.followUpIntervalUnit || "DAYS");

          if (
            fuDate ||
            fuInstructions ||
            consData.followUpType ||
            consData.followUpIntervalValue
          ) {
            onChange("followupRequired", true);
            if (fuDate) onChange("nextVisitDate", fuDate);
            if (fuInstructions) onChange("followupNotes", fuInstructions);
            if (fuType) onChange("followUpType", fuType);
            if (fuVal) onChange("followUpIntervalValue", fuVal);
            if (fuUnit) onChange("followUpIntervalUnit", fuUnit);
          }
        }
      } catch (err) {
        console.warn("Could not load consultation follow-up data:", err);
      }
    }

    loadConsultationFollowup();
    return () => {
      isMounted = false;
    };
  }, [encounterId, onChange]);

  return (
    <div className="space-y-4">
      {/* ── FOLLOW-UP SCHEDULING CARD ── */}
      <div className="bg-white rounded-2xl p-5 border border-[#E5E7EB] shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-gray-100 pb-3">
          <div className="flex items-center gap-2">
            <Calendar size={16} className="text-[#F59E0B]" />
            <h3
              className="text-sm font-bold text-[#111827]"
              style={{ fontFamily: PP }}
            >
              Follow-Up Scheduling
            </h3>
          </div>
          {patientMrn && patientMrn !== "—" && (
            <span
              className="text-xs text-slate-500 font-medium px-2.5 py-1 bg-slate-100 rounded-lg"
              style={{ fontFamily: RB }}
            >
              MRN: <strong className="text-slate-800">{patientMrn}</strong>
            </span>
          )}
        </div>

        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <label className="flex items-center gap-2.5 p-3 border border-[#E5E7EB] rounded-xl hover:bg-slate-50 transition-colors cursor-pointer select-none bg-slate-50/50">
            <input
              type="checkbox"
              checked={required}
              onChange={(e) => onChange("followupRequired", e.target.checked)}
              className="rounded border-[#E5E7EB] text-[#0D47A1] focus:ring-[#0D47A1]/20 w-4 h-4"
            />
            <span
              className="text-xs font-semibold text-slate-700"
              style={{ fontFamily: PP }}
            >
              Follow-Up Required
            </span>
          </label>

          {required && (
            <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
              <div>
                <label
                  className="block text-[10px] font-bold text-slate-400 uppercase mb-0.5"
                  style={{ fontFamily: PP }}
                >
                  Follow-Up Date
                </label>
                <input
                  aria-label="Follow-Up Date"
                  type="date"
                  value={nextVisitDate}
                  onChange={(e) => onChange("nextVisitDate", e.target.value)}
                  className="px-3 py-1.5 text-xs border border-[#E5E7EB] rounded-xl bg-slate-50 outline-none focus:border-[#0D47A1] focus:bg-white transition-colors"
                  style={{ fontFamily: RB }}
                />
              </div>

              <div>
                <label
                  className="block text-[10px] font-bold text-slate-400 uppercase mb-0.5"
                  style={{ fontFamily: PP }}
                >
                  Follow-Up Type
                </label>
                <select
                  aria-label="Follow-Up Type"
                  value={followUpType}
                  onChange={(e) => onChange("followUpType", e.target.value)}
                  className="px-3 py-1.5 text-xs border border-[#E5E7EB] rounded-xl bg-slate-50 outline-none focus:border-[#0D47A1] focus:bg-white transition-colors"
                  style={{ fontFamily: RB }}
                >
                  <option value="ROUTINE">Routine</option>
                  <option value="SPECIALIST">Specialist</option>
                  <option value="TELECONSULT">Teleconsult</option>
                  <option value="EMERGENCY">Emergency</option>
                </select>
              </div>

              <div>
                <label
                  className="block text-[10px] font-bold text-slate-400 uppercase mb-0.5"
                  style={{ fontFamily: PP }}
                >
                  Interval
                </label>
                <div className="flex items-center gap-1">
                  <input
                    aria-label="Interval Value"
                    type="number"
                    min={1}
                    max={365}
                    value={followUpIntervalValue}
                    onChange={(e) =>
                      onChange(
                        "followUpIntervalValue",
                        Number(e.target.value) || 1,
                      )
                    }
                    className="w-16 px-2 py-1.5 text-xs border border-[#E5E7EB] rounded-xl bg-slate-50 outline-none focus:border-[#0D47A1] focus:bg-white transition-colors"
                    style={{ fontFamily: RB }}
                  />
                  <select
                    aria-label="Interval Unit"
                    value={followUpIntervalUnit}
                    onChange={(e) =>
                      onChange("followUpIntervalUnit", e.target.value)
                    }
                    className="px-2 py-1.5 text-xs border border-[#E5E7EB] rounded-xl bg-slate-50 outline-none focus:border-[#0D47A1] focus:bg-white transition-colors"
                    style={{ fontFamily: RB }}
                  >
                    <option value="DAYS">Days</option>
                    <option value="WEEKS">Weeks</option>
                    <option value="MONTHS">Months</option>
                  </select>
                </div>
              </div>
            </div>
          )}
        </div>

        {required && (
          <div>
            <span
              className="block text-[11px] font-semibold text-[#64748B] mb-1"
              style={{ fontFamily: PP }}
            >
              Follow-Up Notes & Instructions (followUpInstructions)
            </span>
            <textarea
              aria-label="Follow-Up Notes & Instructions"
              value={notes}
              onChange={(e) => onChange("followupNotes", e.target.value)}
              placeholder="e.g. Return to clinic if symptoms worsen or vision changes occur"
              rows={2}
              className="w-full px-3 py-2 text-sm border border-[#E5E7EB] rounded-xl bg-slate-50 outline-none focus:border-[#0D47A1] focus:bg-white transition-colors resize-none"
              style={{ fontFamily: RB }}
            />
          </div>
        )}
      </div>
    </div>
  );
};
