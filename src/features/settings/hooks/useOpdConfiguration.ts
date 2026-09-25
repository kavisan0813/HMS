import { useCallback, useEffect, useState } from "react";
import {
  createOpdHoliday,
  fetchOpdHolidays,
  fetchOpdWeeklySchedule,
  saveOpdWeeklySchedule,
  updateOpdBreaks,
  updateOpdHoliday,
  updateOpdHolidayStatus,
} from "../services/settings.service";
import type {
  OpdBreak,
  OpdHoliday,
  OpdHolidayPayload,
  OpdWeeklySchedule,
  OpdWeeklyScheduleDay,
} from "../types/settings.types";

const DEFAULT_OPD_DAYS: OpdWeeklyScheduleDay[] = [
  "MONDAY",
  "TUESDAY",
  "WEDNESDAY",
  "THURSDAY",
  "FRIDAY",
  "SATURDAY",
  "SUNDAY",
].map((day) => ({
  dayOfWeek: day,
  isOpen: day !== "SUNDAY",
  workingIntervals: [
    {
      startTime: "09:00",
      endTime: "17:00",
    },
  ],
  breaks: [
    {
      breakName: "Lunch Break",
      startTime: "13:00",
      endTime: "14:00",
    },
  ],
}));

const DEFAULT_SCHEDULE: OpdWeeklySchedule = {
  weeklySchedule: DEFAULT_OPD_DAYS,
};

function normalizeScheduleDay(day: OpdWeeklyScheduleDay): OpdWeeklyScheduleDay {
  const raw = day as unknown as Record<string, unknown>;
  return {
    ...day,
    isOpen:
      typeof raw.isOpen === "boolean"
        ? raw.isOpen
        : typeof raw.open === "boolean"
          ? raw.open
          : false,
  };
}

function normalizeSchedule(schedule: OpdWeeklySchedule): OpdWeeklySchedule {
  if (!schedule?.weeklySchedule || schedule.weeklySchedule.length === 0) {
    return DEFAULT_SCHEDULE;
  }
  return {
    weeklySchedule: schedule.weeklySchedule.map(normalizeScheduleDay),
  };
}

export function useOpdConfiguration(year = new Date().getFullYear()) {
  const [schedule, setSchedule] = useState<OpdWeeklySchedule>(DEFAULT_SCHEDULE);
  const [holidays, setHolidays] = useState<OpdHoliday[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [scheduleResult, holidayResult] = await Promise.all([
        fetchOpdWeeklySchedule(),
        fetchOpdHolidays(year),
      ]);
      setSchedule(normalizeSchedule(scheduleResult));
      setHolidays(holidayResult);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load OPD settings",
      );
    } finally {
      setLoading(false);
    }
  }, [year]);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);

      try {
        const [scheduleResult, holidayResult] = await Promise.all([
          fetchOpdWeeklySchedule(),
          fetchOpdHolidays(year),
        ]);
        if (cancelled) return;
        setSchedule(normalizeSchedule(scheduleResult));
        setHolidays(holidayResult);
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error ? err.message : "Failed to load OPD settings",
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void load();

    return () => {
      cancelled = true;
    };
  }, [year]);

  const saveSchedule = useCallback(async (next: OpdWeeklySchedule) => {
    setSaving(true);
    setError(null);
    try {
      const normalized = normalizeSchedule(next);
      const result = await saveOpdWeeklySchedule(normalized);
      setSchedule(normalizeSchedule(result));
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to save OPD schedule",
      );
      throw err;
    } finally {
      setSaving(false);
    }
  }, []);

  const saveBreaks = useCallback(
    async (dayOfWeek: string, breaks: OpdBreak[]) => {
      setSaving(true);
      setError(null);
      try {
        const result = await updateOpdBreaks({ dayOfWeek, breaks });
        setSchedule(result);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to save OPD breaks",
        );
        throw err;
      } finally {
        setSaving(false);
      }
    },
    [],
  );

  const addHoliday = useCallback(async (payload: OpdHolidayPayload) => {
    setSaving(true);
    setError(null);
    try {
      const result = await createOpdHoliday(payload);
      setHolidays((current) => [...current, result]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create holiday");
      throw err;
    } finally {
      setSaving(false);
    }
  }, []);

  const editHoliday = useCallback(
    async (id: number, payload: OpdHolidayPayload) => {
      setSaving(true);
      setError(null);
      try {
        const result = await updateOpdHoliday(id, payload);
        setHolidays((current) =>
          current.map((item) => (item.id === id ? result : item)),
        );
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to update holiday",
        );
        throw err;
      } finally {
        setSaving(false);
      }
    },
    [],
  );

  const toggleHoliday = useCallback(async (holiday: OpdHoliday) => {
    setSaving(true);
    setError(null);
    try {
      const result = await updateOpdHolidayStatus(
        holiday.id,
        holiday.status === "ACTIVE" ? "INACTIVE" : "ACTIVE",
      );
      setHolidays((current) =>
        current.map((item) => (item.id === holiday.id ? result : item)),
      );
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to update holiday status",
      );
      throw err;
    } finally {
      setSaving(false);
    }
  }, []);

  return {
    schedule,
    holidays,
    loading,
    saving,
    error,
    reload,
    saveSchedule,
    saveBreaks,
    addHoliday,
    editHoliday,
    toggleHoliday,
  };
}
