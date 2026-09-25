import { useState } from "react";
import { AppointmentSubHeader } from "../components/appointments/AppointmentSubHeader";
import { AppointmentKpiCards } from "../components/appointments/AppointmentKpiCards";
import { GeneralAppointmentSettings } from "../components/appointments/GeneralAppointmentSettings";
import { SlotConfigurationSettings } from "../components/appointments/SlotConfigurationSettings";
import { WorkingHoursSchedule } from "../components/appointments/WorkingHoursSchedule";
import { QueueTokenSettings } from "../components/appointments/QueueTokenSettings";
import { HolidayCalendar } from "../components/appointments/HolidayCalendar";
import { AppointmentStatusSettings } from "../components/appointments/AppointmentStatusSettings";
import { AppointmentAnalyticsCharts } from "../components/appointments/AppointmentAnalyticsCharts";
import { AppointmentSaveToast } from "../components/appointments/AppointmentSaveToast";
import { useOpdConfiguration } from "../hooks/useOpdConfiguration";

export function AppointmentConfigurationPage() {
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const opd = useOpdConfiguration();

  const handleSave = () => {
    setToastMessage(
      "Appointment configuration is managed in the live OPD sections below.",
    );
    setTimeout(() => setToastMessage(null), 3000);
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        width: "100%",
        gap: "20px",
      }}
    >
      {/* MAIN CONTENT SECTIONS */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "20px",
          width: "100%",
        }}
      >
        {/* SUB-HEADER ACTION BAR */}
        <AppointmentSubHeader onSave={handleSave} />

        {/* TOP KPI CARDS (4 CARDS) */}
        <AppointmentKpiCards />

        {/* SECTION 01: GENERAL APPOINTMENT SETTINGS */}
        <GeneralAppointmentSettings />

        {/* SECTION 02: CONSULTATION SLOT CONFIGURATION */}
        <SlotConfigurationSettings />

        {/* SECTION 03: WORKING HOURS CONFIGURATION TABLE */}
        <WorkingHoursSchedule
          schedule={opd.schedule}
          loading={opd.loading}
          saving={opd.saving}
          onSave={async (next) => {
            await opd.saveSchedule(next);
            setToastMessage("OPD weekly schedule saved successfully!");
          }}
          onSaveBreaks={async (day, breaks) => {
            await opd.saveBreaks(day, breaks);
            setToastMessage(`${day} OPD breaks saved successfully!`);
          }}
        />

        {/* SECTION 04: QUEUE & TOKEN CONFIGURATION */}
        <QueueTokenSettings />

        {/* SECTION 05: HOLIDAY & LEAVE CALENDAR */}
        <HolidayCalendar
          holidays={opd.holidays}
          loading={opd.loading}
          saving={opd.saving}
          onAdd={async (payload) => {
            await opd.addHoliday(payload);
            setToastMessage("OPD holiday created successfully!");
          }}
          onToggle={async (holiday) => {
            await opd.toggleHoliday(holiday);
            setToastMessage("OPD holiday status updated successfully!");
          }}
        />

        {opd.error && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {opd.error}
          </div>
        )}

        {/* SECTION 06: APPOINTMENT STATUS CONFIGURATION */}
        <AppointmentStatusSettings />

        {/* SECTION 07: APPOINTMENT ANALYTICS CHARTS */}
        <AppointmentAnalyticsCharts />
      </div>

      {/* SAVE TOAST */}
      <AppointmentSaveToast message={toastMessage} />
    </div>
  );
}
