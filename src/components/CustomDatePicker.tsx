import React, { useState, useRef, useEffect } from "react";
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  X,
  AlertCircle,
} from "lucide-react";

interface CustomDatePickerProps {
  value: string; // YYYY-MM-DD or ""
  onChange: (dateStr: string) => void;
  label?: string;
  labelClassName?: string;
  placeholder?: string;
  maxDate?: string; // YYYY-MM-DD
  minDate?: string; // YYYY-MM-DD
  error?: string;
  disabled?: boolean;
  className?: string;
  inputClassName?: string;
}

type DatePickerViewMode = "calendar" | "month" | "year";

interface CalendarDay {
  day: number;
  isCurrentMonth: boolean;
  dateStr: string;
}

interface DatePickerTriggerProps {
  iconSize: number;
  iconLeftClass: string;
  error?: string;
  isLargeInput?: boolean;
  isOpen: boolean;
  setIsOpen: React.Dispatch<React.SetStateAction<boolean>>;
  setViewMode: React.Dispatch<React.SetStateAction<DatePickerViewMode>>;
  disabled: boolean;
  inputClassName?: string;
  textPaddingLeftClass: string;
  value: string;
  placeholder: string;
  handleClear: (event?: React.MouseEvent<HTMLButtonElement>) => void;
  clearRightClass: string;
}

interface DatePickerYearViewProps {
  setViewMode: React.Dispatch<React.SetStateAction<DatePickerViewMode>>;
  yearListRef: React.RefObject<HTMLDivElement | null>;
  years: number[];
  viewYear: number;
  setViewYear: React.Dispatch<React.SetStateAction<number>>;
}

interface DatePickerMonthViewProps {
  setViewMode: React.Dispatch<React.SetStateAction<DatePickerViewMode>>;
  viewMonth: number;
  setViewMonth: React.Dispatch<React.SetStateAction<number>>;
}

interface DatePickerCalendarViewProps {
  setViewMode: React.Dispatch<React.SetStateAction<DatePickerViewMode>>;
  viewMonth: number;
  viewYear: number;
  handlePrevMonth: () => void;
  handleNextMonth: () => void;
  allCalendarDays: CalendarDay[];
  value: string;
  todayStr: string;
  isDateDisabled: (dateStr: string) => boolean;
  handleSelectDay: (dateStr: string) => void;
  handleClear: (event?: React.MouseEvent<HTMLButtonElement>) => void;
  handleToday: () => void;
}

const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const WEEKDAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

const formatDisplay = (dateStr: string) => {
  if (!dateStr) return "";
  const parts = dateStr.split("-");
  if (parts.length === 3) {
    return `${parts[2]} / ${parts[1]} / ${parts[0]}`;
  }
  return dateStr;
};

// Extracted: DatePickerTrigger
const DatePickerTrigger = ({
  iconSize,
  iconLeftClass,
  error,
  isLargeInput,
  isOpen,
  setIsOpen,
  setViewMode,
  disabled,
  inputClassName,
  textPaddingLeftClass,
  value,
  placeholder,
  handleClear,
  clearRightClass,
}: DatePickerTriggerProps) => {
  return (
    <div className="relative w-full group">
      <CalendarIcon
        size={iconSize}
        className={`absolute ${iconLeftClass} top-1/2 -translate-y-1/2 pointer-events-none transition-colors z-10 ${
          error
            ? "text-red-500"
            : isLargeInput
              ? "text-[#0D47A1]/70 group-focus-within:text-[#0D47A1]"
              : "text-slate-400 group-focus-within:text-[#0D47A1]"
        }`}
      />

      <button
        type="button"
        onClick={() => {
          if (!disabled) {
            setIsOpen((prev) => !prev);
            setViewMode("calendar");
          }
        }}
        className={`${
          inputClassName ||
          `w-full px-3.5 py-2.5 text-[13px] bg-white border rounded-xl transition-colors duration-200 ${
            error
              ? "border-red-300 bg-white text-red-900 focus:ring-2 focus:ring-red-400/10"
              : isOpen
                ? "border-[#0D47A1] bg-white ring-2 ring-[#0D47A1]/10 text-[#111827]"
                : "border-gray-200 bg-white text-[#111827] hover:border-gray-300"
          }`
        } ${textPaddingLeftClass} pr-8! cursor-pointer flex items-center select-none ${
          disabled ? "opacity-60 bg-slate-100 cursor-not-allowed" : ""
        }`}
      >
        {value ? (
          <span className="font-medium text-[#111827]">
            {formatDisplay(value)}
          </span>
        ) : (
          <span className="text-slate-400 font-normal">{placeholder}</span>
        )}
      </button>

      {value && !disabled && (
        <button
          type="button"
          onClick={handleClear}
          className={`absolute ${clearRightClass} top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors z-10`}
          title="Clear date"
        >
          <X size={14} />
        </button>
      )}
    </div>
  );
};

// Extracted: DatePickerYearView
const DatePickerYearView = ({
  setViewMode,
  yearListRef,
  years,
  viewYear,
  setViewYear,
}: DatePickerYearViewProps) => {
  return (
    <div>
      <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100">
        <button
          type="button"
          onClick={() => setViewMode("calendar")}
          className="text-xs font-bold text-[#0D47A1] flex items-center gap-1 hover:underline"
        >
          <ChevronLeft size={16} /> Back to Calendar
        </button>
        <span className="text-xs font-bold text-slate-700">Select Year</span>
      </div>
      <div
        ref={yearListRef}
        className="grid grid-cols-3 sm:grid-cols-4 gap-2 max-h-56 overflow-y-auto p-1 pr-1.5 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:bg-slate-300 [&::-webkit-scrollbar-thumb]:rounded-full"
      >
        {years.map((y: number) => {
          const isSelected = y === viewYear;
          return (
            <button
              key={y}
              type="button"
              data-selected={isSelected ? "true" : "false"}
              onClick={() => {
                setViewYear(y);
                setViewMode("calendar");
              }}
              className={`py-2 text-xs font-bold rounded-xl transition-colors ${
                isSelected
                  ? "bg-[#0D47A1] text-white shadow-md shadow-[#0D47A1]/20 scale-105"
                  : "bg-slate-50 text-slate-700 hover:bg-slate-100 hover:text-[#0D47A1]"
              }`}
            >
              {y}
            </button>
          );
        })}
      </div>
    </div>
  );
};

// Extracted: DatePickerMonthView
const DatePickerMonthView = ({
  setViewMode,
  viewMonth,
  setViewMonth,
}: DatePickerMonthViewProps) => {
  return (
    <div>
      <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100">
        <button
          type="button"
          onClick={() => setViewMode("calendar")}
          className="text-xs font-bold text-[#0D47A1] flex items-center gap-1 hover:underline"
        >
          <ChevronLeft size={16} /> Back to Calendar
        </button>
        <span className="text-xs font-bold text-slate-700">Select Month</span>
      </div>
      <div className="grid grid-cols-3 gap-2 max-h-56 overflow-y-auto p-1 pr-1.5 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:bg-slate-300 [&::-webkit-scrollbar-thumb]:rounded-full">
        {MONTH_NAMES.map((name, index) => {
          const isSelected = index === viewMonth;
          return (
            <button
              key={name}
              type="button"
              onClick={() => {
                setViewMonth(index);
                setViewMode("calendar");
              }}
              className={`py-2.5 px-1 text-xs font-bold rounded-xl transition-colors ${
                isSelected
                  ? "bg-[#0D47A1] text-white shadow-md shadow-[#0D47A1]/20 scale-105"
                  : "bg-slate-50 text-slate-700 hover:bg-slate-100 hover:text-[#0D47A1]"
              }`}
            >
              {name}
            </button>
          );
        })}
      </div>
    </div>
  );
};

// Extracted: DatePickerCalendarView
const DatePickerCalendarView = ({
  setViewMode,
  viewMonth,
  viewYear,
  handlePrevMonth,
  handleNextMonth,
  allCalendarDays,
  value,
  todayStr,
  isDateDisabled,
  handleSelectDay,
  handleClear,
  handleToday,
}: DatePickerCalendarViewProps) => {
  return (
    <>
      {/* Header Controls: Month & Year Selectors + Nav */}
      <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
        <div className="flex items-center gap-1.5">
          {/* Clickable Month Button */}
          <button
            type="button"
            onClick={() => setViewMode("month")}
            className="text-xs sm:text-sm font-bold text-[#1E293B] bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl px-2.5 py-1.5 outline-none cursor-pointer transition-colors flex items-center gap-1"
            title="Click to select month"
          >
            {MONTH_NAMES[viewMonth]}
          </button>

          {/* Clickable Year Button */}
          <button
            type="button"
            onClick={() => setViewMode("year")}
            className="text-xs sm:text-sm font-bold text-[#0D47A1] bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl px-2.5 py-1.5 outline-none cursor-pointer transition-colors flex items-center gap-1"
            title="Click to scroll & select year"
          >
            {viewYear}
          </button>
        </div>

        {/* Prev / Next Arrows */}
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={handlePrevMonth}
            className="p-1.5 text-slate-500 hover:text-[#0D47A1] hover:bg-blue-50 rounded-xl transition-colors"
            title="Previous Month"
          >
            <ChevronLeft size={18} />
          </button>
          <button
            type="button"
            onClick={handleNextMonth}
            className="p-1.5 text-slate-500 hover:text-[#0D47A1] hover:bg-blue-50 rounded-xl transition-colors"
            title="Next Month"
          >
            <ChevronRight size={18} />
          </button>
        </div>
      </div>

      {/* Weekday Names */}
      <div className="grid grid-cols-7 text-center text-xs font-bold text-slate-400 mb-2">
        {WEEKDAYS.map((day) => (
          <div key={day} className="py-1">
            {day}
          </div>
        ))}
      </div>

      {/* Days Grid */}
      <div className="grid grid-cols-7 gap-1 text-center text-xs">
        {allCalendarDays.map((item) => {
          const isSelected = value === item.dateStr;
          const isToday = todayStr === item.dateStr;
          const disabledDay = isDateDisabled(item.dateStr);

          return (
            <button
              key={item.dateStr}
              type="button"
              disabled={disabledDay}
              onClick={() => handleSelectDay(item.dateStr)}
              className={`h-8 sm:h-9 w-8 sm:w-9 mx-auto flex items-center justify-center rounded-xl font-semibold transition-colors duration-150 ${
                disabledDay
                  ? "text-slate-200 opacity-40 cursor-not-allowed"
                  : isSelected
                    ? "bg-[#0D47A1] text-white shadow-md shadow-[#0D47A1]/25 scale-105"
                    : isToday
                      ? "bg-blue-50 text-[#0D47A1] border-2 border-[#0D47A1]/40 font-bold"
                      : item.isCurrentMonth
                        ? "text-[#1E293B] hover:bg-slate-100 hover:text-[#0D47A1]"
                        : "text-slate-300 hover:bg-slate-50"
              }`}
            >
              {item.day}
            </button>
          );
        })}
      </div>

      {/* Action Footer */}
      <div className="flex items-center justify-between border-t border-slate-100 pt-3 mt-3 px-1 text-xs">
        <button
          type="button"
          onClick={(e) => handleClear(e)}
          className="text-slate-500 font-semibold hover:text-red-600 transition-colors"
        >
          Clear
        </button>
        <button
          type="button"
          disabled={isDateDisabled(todayStr)}
          onClick={handleToday}
          className="text-[#0D47A1] font-bold hover:underline disabled:opacity-40 disabled:no-underline"
        >
          Today
        </button>
      </div>
    </>
  );
};

export const CustomDatePicker: React.FC<CustomDatePickerProps> = ({
  value,
  onChange,
  label,
  labelClassName,
  placeholder = "dd / mm / yyyy",
  maxDate,
  minDate,
  error,
  disabled = false,
  className = "",
  inputClassName,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [viewMode, setViewMode] = useState<DatePickerViewMode>("calendar");
  const containerRef = useRef<HTMLDivElement>(null);
  const yearListRef = useRef<HTMLDivElement>(null);

  // Active view date (month / year currently being viewed in popover)
  const initialDate = value ? new Date(value) : new Date();
  const validInitial = !isNaN(initialDate.getTime()) ? initialDate : new Date();

  const [viewYear, setViewYear] = useState<number>(validInitial.getFullYear());
  const [viewMonth, setViewMonth] = useState<number>(validInitial.getMonth());
  const [prevValue, setPrevValue] = useState(value);

  // Sync view month/year if value changes externally
  if (value !== prevValue) {
    setPrevValue(value);
    if (value) {
      const d = new Date(value);
      if (!isNaN(d.getTime())) {
        setViewYear(d.getFullYear());
        setViewMonth(d.getMonth());
      }
    }
  }

  // Click outside to close
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
        setViewMode("calendar");
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Auto scroll to active year when year mode opens
  useEffect(() => {
    if (viewMode === "year" && yearListRef.current) {
      const selectedYearEl = yearListRef.current.querySelector(
        "[data-selected='true']",
      );
      if (selectedYearEl) {
        selectedYearEl.scrollIntoView({ block: "center", behavior: "smooth" });
      }
    }
  }, [viewMode]);

  // Generate Year options (e.g. 1920 to currentYear)
  const currentYear = new Date().getFullYear();
  const startYear = 1920;
  const endYear = maxDate
    ? new Date(maxDate).getFullYear() || currentYear
    : currentYear + 5;
  const years: number[] = [];
  for (let y = endYear; y >= startYear; y--) {
    years.push(y);
  }

  // Prev / Next month navigation
  const handlePrevMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear((prev) => prev - 1);
    } else {
      setViewMonth((prev) => prev - 1);
    }
  };

  const handleNextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear((prev) => prev + 1);
    } else {
      setViewMonth((prev) => prev + 1);
    }
  };

  // Calendar Day Grid calculations
  const firstDayOfMonth = new Date(viewYear, viewMonth, 1).getDay();
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const daysInPrevMonth = new Date(viewYear, viewMonth, 0).getDate();

  const prevMonthDays: CalendarDay[] = [];
  for (let i = firstDayOfMonth - 1; i >= 0; i--) {
    const pDay = daysInPrevMonth - i;
    const pMonth = viewMonth === 0 ? 11 : viewMonth - 1;
    const pYear = viewMonth === 0 ? viewYear - 1 : viewYear;
    const mStr = String(pMonth + 1).padStart(2, "0");
    const dStr = String(pDay).padStart(2, "0");
    prevMonthDays.push({
      day: pDay,
      isCurrentMonth: false,
      dateStr: `${pYear}-${mStr}-${dStr}`,
    });
  }

  const currentMonthDays: CalendarDay[] = [];
  for (let d = 1; d <= daysInMonth; d++) {
    const mStr = String(viewMonth + 1).padStart(2, "0");
    const dStr = String(d).padStart(2, "0");
    currentMonthDays.push({
      day: d,
      isCurrentMonth: true,
      dateStr: `${viewYear}-${mStr}-${dStr}`,
    });
  }

  const totalGridCells =
    prevMonthDays.length + currentMonthDays.length <= 35 ? 35 : 42;
  const remainingCells =
    totalGridCells - (prevMonthDays.length + currentMonthDays.length);
  const nextMonthDays: CalendarDay[] = [];
  for (let n = 1; n <= remainingCells; n++) {
    const nMonth = viewMonth === 11 ? 0 : viewMonth + 1;
    const nYear = viewMonth === 11 ? viewYear + 1 : viewYear;
    const mStr = String(nMonth + 1).padStart(2, "0");
    const dStr = String(n).padStart(2, "0");
    nextMonthDays.push({
      day: n,
      isCurrentMonth: false,
      dateStr: `${nYear}-${mStr}-${dStr}`,
    });
  }

  const allCalendarDays: CalendarDay[] = [
    ...prevMonthDays,
    ...currentMonthDays,
    ...nextMonthDays,
  ];

  const todayStr = new Date().toISOString().split("T")[0];

  const isDateDisabled = (dateStr: string) => {
    if (maxDate && dateStr > maxDate) return true;
    if (minDate && dateStr < minDate) return true;
    return false;
  };

  const handleSelectDay = (dateStr: string) => {
    if (isDateDisabled(dateStr)) return;
    onChange(dateStr);
    setIsOpen(false);
    setViewMode("calendar");
  };

  const handleToday = () => {
    if (!isDateDisabled(todayStr)) {
      onChange(todayStr);
      const d = new Date(todayStr);
      setViewYear(d.getFullYear());
      setViewMonth(d.getMonth());
      setIsOpen(false);
      setViewMode("calendar");
    }
  };

  const handleClear = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    onChange("");
  };

  const isLargeInput =
    inputClassName?.includes("py-5") || inputClassName?.includes("py-5.5");
  const iconLeftClass = isLargeInput ? "left-5" : "left-3";
  const iconSize = isLargeInput ? 22 : 16;
  const textPaddingLeftClass = isLargeInput ? "!pl-14 sm:!pl-16" : "!pl-9";
  const clearRightClass = isLargeInput ? "right-4" : "right-2.5";

  return (
    <div className={`w-full relative ${className}`} ref={containerRef}>
      {label && (
        <span
          className={
            labelClassName ||
            "block text-xs font-semibold text-slate-600 mb-1.5"
          }
        >
          {label}
        </span>
      )}

      {/* Input Field Trigger */}
      <DatePickerTrigger
        iconSize={iconSize}
        iconLeftClass={iconLeftClass}
        error={error}
        isLargeInput={isLargeInput}
        isOpen={isOpen}
        setIsOpen={setIsOpen}
        setViewMode={setViewMode}
        disabled={disabled}
        inputClassName={inputClassName}
        textPaddingLeftClass={textPaddingLeftClass}
        value={value}
        placeholder={placeholder}
        handleClear={handleClear}
        clearRightClass={clearRightClass}
      />

      {error && (
        <div className="mt-1 flex items-center gap-1 text-[11px] text-red-500 font-normal transition-opacity duration-200">
          <AlertCircle size={12} className="shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Styled Custom Calendar Popover: w-full matches input field width */}
      {isOpen && (
        <div className="absolute left-0 top-full mt-2 z-50 bg-white border border-slate-200/90 rounded-2xl shadow-2xl p-4 sm:p-5 w-full min-w-70 max-w-md transition-transform duration-150">
          {/* YEAR VIEW MODE */}
          {viewMode === "year" && (
            <DatePickerYearView
              setViewMode={setViewMode}
              yearListRef={yearListRef}
              years={years}
              viewYear={viewYear}
              setViewYear={setViewYear}
            />
          )}

          {/* MONTH VIEW MODE */}
          {viewMode === "month" && (
            <DatePickerMonthView
              setViewMode={setViewMode}
              viewMonth={viewMonth}
              setViewMonth={setViewMonth}
            />
          )}

          {/* CALENDAR VIEW MODE */}
          {viewMode === "calendar" && (
            <DatePickerCalendarView
              setViewMode={setViewMode}
              viewMonth={viewMonth}
              viewYear={viewYear}
              handlePrevMonth={handlePrevMonth}
              handleNextMonth={handleNextMonth}
              allCalendarDays={allCalendarDays}
              value={value}
              todayStr={todayStr}
              isDateDisabled={isDateDisabled}
              handleSelectDay={handleSelectDay}
              handleClear={handleClear}
              handleToday={handleToday}
            />
          )}
        </div>
      )}
    </div>
  );
};
