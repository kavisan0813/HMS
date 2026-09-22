import { useState, useEffect } from "react";
import { Save, X } from "lucide-react";
import { TimeSelect } from "../../../../components/TimeSelect";
import type {
  DoctorRecord,
  ApiWeeklyScheduleDay,
  UpdateScheduleDayPayload,
} from "../../types/doctors.types";
import { PP } from "../../constants/doctors.constants";
import { doctorsService } from "../../services/doctors.service";
import { resolveDoctorId } from "../../services/doctorProfile.service";
import type { DayOfWeek } from "../../types/doctors.types";

export interface AvailabilityScheduleTabProps {
  doctor: DoctorRecord;
  canEdit: boolean;
  onClose?: () => void;
}

const DAY_LABELS: Record<string, string> = {
  MONDAY: "Monday",
  TUESDAY: "Tuesday",
  WEDNESDAY: "Wednesday",
  THURSDAY: "Thursday",
  FRIDAY: "Friday",
  SATURDAY: "Saturday",
  SUNDAY: "Sunday",
};

export function AvailabilityScheduleTab({
  doctor,
  canEdit,
  onClose,
}: AvailabilityScheduleTabProps) {
  const [schedule, setSchedule] = useState<ApiWeeklyScheduleDay[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const loadSchedule = async () => {
      try {
        const targetId = resolveDoctorId(doctor);
        const data = await doctorsService.getWeeklySchedule(targetId);
        if (!cancelled) setSchedule(data?.weeklySchedule || []);
      } catch (err) {
        console.log(err);
        if (!cancelled) setSchedule([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void loadSchedule();

    return () => {
      cancelled = true;
    };
  }, [doctor]);

  const toggleWorkingDay = (dayIndex: number) => {
    setSchedule((prev) =>
      prev.map((d, i) =>
        i === dayIndex ? { ...d, workingDay: !d.workingDay } : d,
      ),
    );
  };

  const updatePeriod = (
    dayIndex: number,
    periodIndex: number,
    field: "startTime" | "endTime" | "slotDurationMinutes",
    value: string | number,
  ) => {
    setSchedule((prev) =>
      prev.map((d, i) => {
        if (i !== dayIndex) return d;
        const periods = [...d.workingPeriods];
        periods[periodIndex] = { ...periods[periodIndex], [field]: value };
        return { ...d, workingPeriods: periods };
      }),
    );
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // PUT /api/v1/doctors/{doctorId}/schedules/{dayOfWeek} replaces the whole
      // day config, so each day must be submitted — including days toggled OFF
      // so the backend persists isWorkingDay=false.
      const targetId = resolveDoctorId(doctor);
      await Promise.all(
        schedule.map(async (day) => {
          const payload: UpdateScheduleDayPayload = {
            isWorkingDay: day.workingDay,
            workingPeriods: day.workingPeriods.map((p) => ({
              startTime: p.startTime,
              endTime: p.endTime,
              slotDurationMinutes: p.slotDurationMinutes,
            })),
          };
          const ok = await doctorsService.updateWeeklyScheduleDay(
            targetId,
            day.dayOfWeek as DayOfWeek,
            payload,
          );
          if (!ok) throw new Error(`Failed to update ${day.dayOfWeek}`);
        }),
      );
      onClose?.();
    } catch (err) {
      console.warn("[AvailabilityScheduleTab] Failed to save schedule:", err);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8 text-xs text-[#64748B]">
        Loading schedule...
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3
          className="text-sm font-bold text-[#111827]"
          style={{ fontFamily: PP }}
        >
          Weekly Availability Schedule
        </h3>
        {canEdit && (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="px-3 py-1.5 rounded-lg bg-[#0D47A1] text-white text-[11px] font-bold hover:bg-[#0c3d8a] transition-colors disabled:opacity-60 flex items-center gap-1"
            >
              <Save size={12} /> {saving ? "Saving..." : "Save"}
            </button>
            {onClose && (
              <button
                aria-label="Close"
                type="button"
                onClick={onClose}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X size={14} />
              </button>
            )}
          </div>
        )}
      </div>

      <div className="border border-[#E5E7EB] rounded-xl overflow-hidden text-xs">
        <table className="w-full text-left border-collapse">
          <thead className="bg-slate-50 border-b border-[#E5E7EB]">
            <tr className="text-[#64748B] font-bold" style={{ fontFamily: PP }}>
              <th className="px-3.5 py-2.5 w-24">Day</th>
              <th className="px-3.5 py-2.5 w-12">Active</th>
              <th className="px-3.5 py-2.5">Start</th>
              <th className="px-3.5 py-2.5">End</th>
              <th className="px-3.5 py-2.5">Slot (min)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 text-[#111827]">
            {(schedule.length > 0
              ? schedule
              : [
                  {
                    dayOfWeek: "MONDAY" as DayOfWeek,
                    workingDay: true,
                    workingPeriods: [
                      {
                        startTime: "09:00",
                        endTime: "17:00",
                        slotDurationMinutes: 15,
                      },
                    ],
                  },
                  {
                    dayOfWeek: "TUESDAY" as DayOfWeek,
                    workingDay: true,
                    workingPeriods: [
                      {
                        startTime: "09:00",
                        endTime: "17:00",
                        slotDurationMinutes: 15,
                      },
                    ],
                  },
                  {
                    dayOfWeek: "WEDNESDAY" as DayOfWeek,
                    workingDay: true,
                    workingPeriods: [
                      {
                        startTime: "09:00",
                        endTime: "17:00",
                        slotDurationMinutes: 15,
                      },
                    ],
                  },
                  {
                    dayOfWeek: "THURSDAY" as DayOfWeek,
                    workingDay: true,
                    workingPeriods: [
                      {
                        startTime: "09:00",
                        endTime: "17:00",
                        slotDurationMinutes: 15,
                      },
                    ],
                  },
                  {
                    dayOfWeek: "FRIDAY" as DayOfWeek,
                    workingDay: true,
                    workingPeriods: [
                      {
                        startTime: "09:00",
                        endTime: "17:00",
                        slotDurationMinutes: 15,
                      },
                    ],
                  },
                  {
                    dayOfWeek: "SATURDAY" as DayOfWeek,
                    workingDay: false,
                    workingPeriods: [
                      {
                        startTime: "09:00",
                        endTime: "13:00",
                        slotDurationMinutes: 15,
                      },
                    ],
                  },
                  {
                    dayOfWeek: "SUNDAY" as DayOfWeek,
                    workingDay: false,
                    workingPeriods: [
                      {
                        startTime: "09:00",
                        endTime: "13:00",
                        slotDurationMinutes: 15,
                      },
                    ],
                  },
                ]
            ).map((day, idx) => (
              <tr
                key={day.dayOfWeek}
                className="hover:bg-slate-50 transition-colors"
              >
                <td className="px-3.5 py-2.5 font-bold">
                  {DAY_LABELS[day.dayOfWeek] || day.dayOfWeek}
                </td>
                <td className="px-3.5 py-2.5">
                  {canEdit ? (
                    <span className="relative inline-flex items-center cursor-pointer">
                      <input
                        aria-label="Toggle option"
                        type="checkbox"
                        checked={day.workingDay}
                        onChange={() => toggleWorkingDay(idx)}
                        className="sr-only peer"
                      />
                      <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-colors peer-checked:bg-[#009688]" />
                    </span>
                  ) : (
                    <span
                      className={
                        day.workingDay
                          ? "text-emerald-600 font-medium"
                          : "text-slate-400"
                      }
                    >
                      {day.workingDay ? "Yes" : "No"}
                    </span>
                  )}
                </td>
                <td className="px-3.5 py-2.5">
                  {canEdit && day.workingDay ? (
                    <TimeSelect
                      value={day.workingPeriods[0]?.startTime || "09:00"}
                      onChange={(val) => updatePeriod(idx, 0, "startTime", val)}
                      className="w-28"
                    />
                  ) : (
                    <span className="text-[#111827]">
                      {day.workingPeriods[0]?.startTime || "09:00"}
                    </span>
                  )}
                </td>
                <td className="px-3.5 py-2.5">
                  {canEdit && day.workingDay ? (
                    <TimeSelect
                      value={day.workingPeriods[0]?.endTime || "17:00"}
                      onChange={(val) => updatePeriod(idx, 0, "endTime", val)}
                      className="w-28"
                    />
                  ) : (
                    <span className="text-[#111827]">
                      {day.workingPeriods[0]?.endTime || "17:00"}
                    </span>
                  )}
                </td>
                <td className="px-3.5 py-2.5 font-semibold text-[#0D47A1]">
                  {day.workingPeriods[0]?.slotDurationMinutes || 15} min
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
