import React from "react";
import { useNavigate } from "react-router";
import { ROUTES } from "../../../app/routes/routes";
import {
  Calendar,
  CheckSquare,
  Clock,
  TrendingDown,
  TrendingUp,
  UserPlus,
  CreditCard,
  Loader2,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import {
  useReceptionSummary,
  useReceptionRegistrationTrend,
  useReceptionAppointmentStatus,
  useReceptionPatientsByDepartment,
  useReceptionRegistrationCategories,
  useReceptionPerformanceSummary,
} from "../hooks/useReceptionDashboard";
import { receptionDashboardApi } from "../api/receptionDashboard.api";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  Cell,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
} from "../../../common/components/recharts-lazy";

const PP = "Poppins, system-ui, sans-serif";
const RB = "Roboto, system-ui, sans-serif";

function DKpi({
  title,
  value,
  sub,
  trend,
  up,
  data,
  color,
  gid,
  Icon,
  onClick,
}: {
  title: string;
  value: string;
  sub: string;
  trend: string;
  up: boolean;
  data: { v: number }[];
  color: string;
  gid: string;
  Icon: React.ElementType;
  onClick?: () => void;
}) {
  return (
    <div
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          (e.currentTarget as HTMLElement).click();
        }
      }}
      role="button"
      onClick={onClick}
      className={`bg-white rounded-2xl border border-[#E5E7EB] p-5 flex flex-col gap-3 shadow-sm ${
        onClick
          ? "cursor-pointer hover:shadow-md hover:border-[#0D47A1]/30 transition-colors duration-200"
          : ""
      }`}
    >
      <div className="flex items-start justify-between">
        <div>
          <div
            className="text-xs font-medium text-[#64748B] mb-1"
            style={{ fontFamily: RB }}
          >
            {title}
          </div>
          <div
            className={`${value.length > 12 ? "text-base" : value.length > 8 ? "text-lg" : "text-xl"} font-bold text-[#111827] leading-tight truncate`}
            style={{ fontFamily: PP }}
          >
            {value}
          </div>
          <div
            className="text-xs text-slate-400 mt-1 truncate"
            style={{ fontFamily: RB }}
          >
            {sub}
          </div>
        </div>
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
          style={{ background: color + "18" }}
        >
          <Icon size={16} style={{ color }} />
        </div>
      </div>
      <ResponsiveContainer width="100%" height={40}>
        <AreaChart
          data={data}
          margin={{ top: 2, right: 0, bottom: 0, left: 0 }}
        >
          <defs>
            <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.18} />
              <stop offset="100%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <Area
            type="monotone"
            dataKey="v"
            stroke={color}
            strokeWidth={1.5}
            fill={`url(#${gid})`}
            dot={false}
          />
        </AreaChart>
      </ResponsiveContainer>
      <div
        className={`flex items-center gap-1 text-xs font-medium ${up ? "text-[#66BB6A]" : "text-[#EF4444]"}`}
        style={{ fontFamily: RB }}
      >
        {up ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
        {trend}
      </div>
    </div>
  );
}

const RECEPTION_AVATAR_PALETTE = [
  "bg-[#0D47A1]",
  "bg-[#009688]",
  "bg-violet-600",
  "bg-rose-500",
  "bg-amber-600",
];

function Av({
  name,
  size = "sm",
}: {
  name?: string;
  size?: "sm" | "md" | "lg";
}) {
  const safeName = (name || "??").trim() || "??";
  const initials = safeName
    .split(" ")
    .filter(Boolean)
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
  const bg =
    RECEPTION_AVATAR_PALETTE[
      (safeName?.charCodeAt(0) ?? "?".charCodeAt(0)) %
        RECEPTION_AVATAR_PALETTE.length
    ];
  const sz = {
    sm: "w-7 h-7 text-xs",
    md: "w-9 h-9 text-sm",
    lg: "w-11 h-11 text-base",
  }[size];
  return (
    <div
      className={`${sz} ${bg} rounded-full flex items-center justify-center text-white font-semibold shrink-0`}
      style={{ fontFamily: PP }}
    >
      {initials}
    </div>
  );
}

type ChipVariant =
  | "success"
  | "warning"
  | "error"
  | "info"
  | "teal"
  | "default";
const RECEPTION_CHIP_MAP: Record<ChipVariant, string> = {
  success: "bg-green-50 text-[#66BB6A]",
  warning: "bg-amber-50 text-[#F59E0B]",
  error: "bg-red-50 text-[#EF4444]",
  info: "bg-blue-50 text-[#0D47A1]",
  teal: "bg-teal-50 text-[#009688]",
  default: "bg-slate-50 text-[#64748B]",
};

function Chip({
  label,
  variant = "default",
}: {
  label: string;
  variant?: ChipVariant;
}) {
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${RECEPTION_CHIP_MAP[variant]}`}
      style={{ fontFamily: RB }}
    >
      {label}
    </span>
  );
}

function SH({
  title,
  sub,
  action,
}: {
  title: string;
  sub?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex items-start justify-between mb-4">
      <div>
        <div
          className="text-sm font-semibold text-[#111827]"
          style={{ fontFamily: PP }}
        >
          {title}
        </div>
        {sub && (
          <div
            className="text-xs text-[#64748B] mt-0.5"
            style={{ fontFamily: RB }}
          >
            {sub}
          </div>
        )}
      </div>
      {action}
    </div>
  );
}

// Quick Actions strictly aligned with requirements
const REC_QUICK_ACTIONS = [
  {
    label: "Register Patient",
    Icon: UserPlus,
    color: "#0D47A1",
    action: "register",
  },
  {
    label: "Book Appointment",
    Icon: Calendar,
    color: "#009688",
    action: "appointment",
  },
  {
    label: "Check Patient In",
    Icon: CheckSquare,
    color: "#4DB6AC",
    action: "checkin",
  },
  {
    label: "Start Billing",
    Icon: CreditCard,
    color: "#0D47A1",
    action: "billing",
  },
];

export function ReceptionDashboard({
  onCheckInClick,
  userRole = "Receptionist",
  onPatientSelect,
}: {
  onRegisterPatient?: () => void;
  onPatientSearch?: () => void;
  onCheckInClick?: (token?: string, mrn?: string) => void;
  userRole?: string;
  onNavigateNav?: (nav: string) => void;
  onPatientSelect?: (mrn: string) => void;
  onEditPatient?: (mrn: string) => void;
  onCreateInvoiceClick?: () => void;
}) {
  const navigate = useNavigate();
  const {
    data: summary,
    isLoading: loadingSummary,
    error: summaryError,
  } = useReceptionSummary();
  const { data: regTrend, error: regTrendError } =
    useReceptionRegistrationTrend();
  const { data: apptStatus, error: apptStatusError } =
    useReceptionAppointmentStatus();
  const { data: deptData, error: deptDataError } =
    useReceptionPatientsByDepartment();
  const { data: regCategories, error: regCategoriesError } =
    useReceptionRegistrationCategories();
  const { data: perfSummary, error: perfSummaryError } =
    useReceptionPerformanceSummary();

  const { data: queueData } = useQuery({
    queryKey: ["reception-dashboard", "queue"],
    queryFn: receptionDashboardApi.getQueue,
    refetchInterval: 30000,
  });

  const hasError =
    summaryError ||
    regTrendError ||
    apptStatusError ||
    deptDataError ||
    regCategoriesError ||
    perfSummaryError;

  // Map API data to chart formats
  const registrationTrend =
    regTrend?.registrations?.map((r) => ({
      hour: r.hour,
      registered: r.count,
      walkins: 0,
    })) || [];

  const apptStatusDist = apptStatus
    ? [
        { name: "Scheduled", value: apptStatus.scheduled, color: "#0D47A1" },
        { name: "Checked In", value: apptStatus.checkedIn, color: "#4DB6AC" },
        {
          name: "In Consultation",
          value: apptStatus.inConsultation,
          color: "#009688",
        },
        { name: "Completed", value: apptStatus.completed, color: "#66BB6A" },
        { name: "Cancelled", value: apptStatus.cancelled, color: "#EF4444" },
        { name: "No Show", value: apptStatus.noShow, color: "#F59E0B" },
      ]
    : [];

  const deptDistribution =
    deptData?.departments?.map((d) => ({
      dept: d.departmentName,
      count: d.patientCount,
    })) || [];

  const regTypes = regCategories
    ? [
        {
          category: "New Patient",
          count: regCategories.newPatients,
          color: "#0D47A1",
        },
        {
          category: "Returning Patient",
          count: regCategories.returningPatients,
          color: "#009688",
        },
        { category: "Walk-In", count: regCategories.walkIn, color: "#4DB6AC" },
        {
          category: "Follow-Up",
          count: regCategories.followUp,
          color: "#F59E0B",
        },
      ]
    : [];

  const regTotal = regTypes.reduce((acc, curr) => acc + curr.count, 0);

  const performanceMetrics = perfSummary
    ? [
        {
          metric: "Patients Registered",
          today: String(perfSummary.patientsRegistered.today),
          yesterday: String(perfSummary.patientsRegistered.yesterday),
          status: `${perfSummary.patientsRegistered.status} (${perfSummary.patientsRegistered.changePercentage > 0 ? "+" : ""}${perfSummary.patientsRegistered.changePercentage}%)`,
        },
        {
          metric: "Appointments Booked",
          today: String(perfSummary.appointmentsBooked.today),
          yesterday: String(perfSummary.appointmentsBooked.yesterday),
          status: `${perfSummary.appointmentsBooked.status} (${perfSummary.appointmentsBooked.changePercentage > 0 ? "+" : ""}${perfSummary.appointmentsBooked.changePercentage}%)`,
        },
        {
          metric: "Patients Checked In",
          today: String(perfSummary.patientsCheckedIn.today),
          yesterday: String(perfSummary.patientsCheckedIn.yesterday),
          status: perfSummary.patientsCheckedIn.status,
        },
        {
          metric: "Appointments Rescheduled",
          today: String(perfSummary.appointmentsRescheduled.today),
          yesterday: String(perfSummary.appointmentsRescheduled.yesterday),
          status: perfSummary.appointmentsRescheduled.status,
        },
        {
          metric: "Billing Initiated",
          today: String(perfSummary.billingInitiated.today),
          yesterday: String(perfSummary.billingInitiated.yesterday),
          status: perfSummary.billingInitiated.status,
        },
        {
          metric: "Cancelled Appointments",
          today: String(perfSummary.cancelledAppointments.today),
          yesterday: String(perfSummary.cancelledAppointments.yesterday),
          status: perfSummary.cancelledAppointments.status,
        },
      ]
    : [];

  if (loadingSummary) {
    return (
      <div
        className="flex-1 overflow-y-auto p-6 flex items-center justify-center"
        style={{ background: "#F1F5F9" }}
      >
        <div className="flex items-center gap-3 text-[#64748B]">
          <Loader2 size={20} className="animate-spin" />
          <span className="text-sm font-medium" style={{ fontFamily: RB }}>
            Loading reception dashboard...
          </span>
        </div>
      </div>
    );
  }

  if (hasError && !summary) {
    return (
      <div
        className="flex-1 overflow-y-auto p-6 flex items-center justify-center"
        style={{ background: "#F1F5F9" }}
      >
        <div className="text-center">
          <div
            className="text-red-500 text-sm font-medium mb-2"
            style={{ fontFamily: PP }}
          >
            Failed to load dashboard data
          </div>
          <div className="text-xs text-[#64748B]" style={{ fontFamily: RB }}>
            Please try refreshing the page
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className="flex-1 overflow-y-auto p-6 space-y-6"
      style={{ background: "#F1F5F9" }}
    >
      {/* ── QUICK ACTIONS ── */}
      <div className="flex items-center gap-3 flex-wrap">
        <span
          className="text-xs font-semibold text-[#64748B] uppercase tracking-wider mr-1"
          style={{ fontFamily: PP }}
        >
          Quick Actions : {userRole}
        </span>
        {REC_QUICK_ACTIONS.map(({ label, Icon, color, action }) => (
          <button
            key={label}
            onClick={() => {
              if (action === "register") {
                navigate(ROUTES.PATIENT_REGISTER);
              } else if (action === "billing") {
                navigate(ROUTES.BILLING);
              } else if (action === "appointment") {
                navigate(ROUTES.BOOK_APPOINTMENT);
              } else if (action === "checkin") {
                navigate(ROUTES.APPOINTMENTS);
              }
            }}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-[#E5E7EB] text-xs font-medium text-[#64748B] hover:border-[#0D47A1]/40 hover:text-[#0D47A1] hover:bg-blue-50 transition-colors shadow-sm"
            style={{ fontFamily: RB }}
          >
            <Icon size={13} style={{ color }} />
            {label}
          </button>
        ))}
        <div className="ml-auto flex items-center gap-2"></div>
      </div>

      {/* ── KPI Row — 5 Reception KPI Cards ── */}
      <div className="grid grid-cols-2 xl:grid-cols-5 gap-4">
        <DKpi
          title="Today's Registrations"
          value={String(summary?.registrations?.today ?? 0)}
          sub="New Patients Registered Today"
          trend={
            summary?.registrations
              ? `${summary.registrations.change > 0 ? "+" : ""}${summary.registrations.change} vs Yesterday`
              : "Loading..."
          }
          up={(summary?.registrations?.change ?? 0) >= 0}
          data={registrationTrend.slice(-6).map((r) => ({ v: r.registered }))}
          color="#0D47A1"
          gid="rec1"
          Icon={UserPlus}
        />
        <DKpi
          title="Today's Appointments"
          value={String(summary?.appointments?.today ?? 0)}
          sub="Appointments Scheduled Today"
          trend={
            summary?.appointments
              ? `${summary.appointments.completionPercentage}% Completion Progress`
              : "Loading..."
          }
          up={(summary?.appointments?.completionPercentage ?? 0) >= 50}
          data={registrationTrend.slice(-6).map((r) => ({ v: r.registered }))}
          color="#009688"
          gid="rec2"
          Icon={Calendar}
        />
        <DKpi
          title="Patients Waiting"
          value={String(summary?.waitingPatients?.count ?? 0)}
          sub="Current Waiting Queue"
          trend={
            summary?.waitingPatients
              ? `Avg Wait: ${summary.waitingPatients.averageWaitMinutes} mins`
              : "Loading..."
          }
          up={false}
          data={[
            { v: (summary?.waitingPatients?.count ?? 0) + 5 },
            { v: (summary?.waitingPatients?.count ?? 0) + 3 },
            { v: summary?.waitingPatients?.count ?? 0 },
          ]}
          color="#F59E0B"
          gid="rec3"
          Icon={Clock}
        />
        <DKpi
          title="Billing Pending"
          value={String(summary?.billingPending?.count ?? 0)}
          sub="Patients Waiting for Billing"
          trend={
            summary?.billingPending
              ? `${summary.billingPending.difference > 0 ? "+" : ""}${summary.billingPending.difference} vs Yesterday`
              : "Loading..."
          }
          up={(summary?.billingPending?.difference ?? 0) <= 0}
          data={[
            { v: (summary?.billingPending?.count ?? 0) + 5 },
            { v: (summary?.billingPending?.count ?? 0) + 3 },
            { v: summary?.billingPending?.count ?? 0 },
          ]}
          color="#EF4444"
          gid="rec4"
          Icon={CreditCard}
        />
        <DKpi
          title="Check-ins Completed"
          value={String(summary?.checkedIn?.count ?? 0)}
          sub="Patients Successfully Checked In"
          trend="Today's Progress"
          up={true}
          data={[
            { v: (summary?.checkedIn?.count ?? 0) - 10 },
            { v: (summary?.checkedIn?.count ?? 0) - 5 },
            { v: summary?.checkedIn?.count ?? 0 },
          ]}
          color="#4DB6AC"
          gid="rec5"
          Icon={CheckSquare}
        />
      </div>

      {/* ── Section 01 & 02: Registration Trend & Appointment Status ── */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
        {/* Section 01: Patient Registration Trend (Large Line Chart) */}
        <div className="xl:col-span-2 bg-white rounded-2xl border border-[#E5E7EB] p-5 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <div>
              <div
                className="text-sm font-semibold text-[#111827]"
                style={{ fontFamily: PP }}
              >
                Patient Registrations Throughout the Day
              </div>
              <div
                className="text-xs text-[#64748B] mt-0.5"
                style={{ fontFamily: RB }}
              >
                Shows new patient registrations by hour (08 AM - 05 PM)
              </div>
            </div>
            <span
              className="text-[10px] font-semibold text-[#0D47A1] bg-blue-50 px-2 py-0.5 rounded-full"
              style={{ fontFamily: RB }}
            >
              Today: {summary?.registrations?.today ?? 0} Registrations
            </span>
          </div>
          <ResponsiveContainer width="100%" height={210}>
            <AreaChart
              data={
                registrationTrend.length > 0
                  ? registrationTrend
                  : [{ hour: "No Data", registered: 0, walkins: 0 }]
              }
              margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
            >
              <defs>
                <linearGradient id="recRegGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#0D47A1" stopOpacity={0.2} />
                  <stop offset="100%" stopColor="#0D47A1" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis
                dataKey="hour"
                tick={{ fontSize: 11, fill: "#64748B", fontFamily: RB }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 10, fill: "#94A3B8" }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                contentStyle={{
                  background: "#fff",
                  border: "1px solid #E5E7EB",
                  borderRadius: 12,
                  fontSize: 12,
                }}
                formatter={(val: unknown, name: unknown) => [
                  `${val} Patients`,
                  name === "registered"
                    ? "Registered Patients"
                    : "Walk-in Patients",
                ]}
              />
              <Area
                type="monotone"
                dataKey="registered"
                stroke="#0D47A1"
                strokeWidth={2.5}
                fill="url(#recRegGrad)"
                dot={{ r: 3, fill: "#0D47A1" }}
              />
            </AreaChart>
          </ResponsiveContainer>
          <div
            className="mt-3 pt-3 border-t border-gray-50 flex items-center justify-between text-xs text-[#64748B]"
            style={{ fontFamily: RB }}
          >
            <span>
              {registrationTrend.length > 0
                ? `Peak: ${registrationTrend.reduce((max, r) => (r.registered > max.registered ? r : max), registrationTrend[0]).hour}`
                : "No trend data"}
            </span>
            <span className="font-semibold text-[#111827]">
              {summary?.registrations?.today ?? 0} Registered Patients Today
            </span>
          </div>
        </div>

        {/* Section 02: Appointment Status (Donut / Status Chart) */}
        <div className="bg-white rounded-2xl border border-[#E5E7EB] p-5 shadow-sm flex flex-col justify-between">
          <SH
            title="Today's Appointment Status"
            sub="Current Appointment Progress"
          />
          <ResponsiveContainer width="100%" height={170}>
            <BarChart
              data={
                apptStatusDist.length > 0
                  ? apptStatusDist
                  : [{ name: "No Data", value: 0, color: "#64748B" }]
              }
              layout="vertical"
              margin={{ top: 0, right: 15, left: 10, bottom: 0 }}
            >
              <XAxis type="number" hide />
              <YAxis
                dataKey="name"
                type="category"
                tick={{ fontSize: 11, fill: "#111827", fontFamily: RB }}
                axisLine={false}
                tickLine={false}
                width={90}
              />
              <Tooltip
                contentStyle={{
                  background: "#fff",
                  border: "1px solid #E5E7EB",
                  borderRadius: 12,
                  fontSize: 12,
                }}
                formatter={(v: unknown) => [`${v} Patients`, "Count"]}
              />
              <Bar dataKey="value" radius={[0, 6, 6, 0]} barSize={13}>
                {(apptStatusDist.length > 0
                  ? apptStatusDist
                  : [{ name: "No Data", value: 0, color: "#64748B" }]
                ).map((entry) => (
                  <Cell key={entry.name} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          <div
            className="grid grid-cols-2 gap-1.5 mt-2 pt-3 border-t border-gray-50 text-xs"
            style={{ fontFamily: RB }}
          >
            {(apptStatusDist.length > 0
              ? apptStatusDist
              : [{ name: "No Data", value: 0, color: "#64748B" }]
            ).map((s) => (
              <div
                key={s.name}
                className="flex items-center justify-between p-1.5 rounded-lg bg-slate-50"
              >
                <div className="flex items-center gap-1.5">
                  <span
                    className="w-2 h-2 rounded-full shrink-0"
                    style={{ background: s.color }}
                  />
                  <span className="text-[#64748B] text-[11px]">{s.name}</span>
                </div>
                <span className="font-bold text-[#111827]">{s.value}</span>
              </div>
            ))}
          </div>
          <div
            className="mt-2 text-[11px] text-center text-[#64748B]"
            style={{ fontFamily: RB }}
          >
            {summary?.appointments?.today ?? 0} Total Appointments Scheduled
            Today
          </div>
        </div>
      </div>

      {/* ── Section 03: Current Patient Queue Table ── */}
      <div className="bg-white rounded-2xl border border-[#E5E7EB] shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-50 flex items-center justify-between">
          <div>
            <div
              className="text-sm font-semibold text-[#111827]"
              style={{ fontFamily: PP }}
            >
              Current Patient Queue
            </div>
            <div
              className="text-xs text-[#64748B] mt-0.5"
              style={{ fontFamily: RB }}
            >
              Monitor current front desk queue and patient arrivals
            </div>
          </div>
          <span
            className="text-xs font-semibold text-[#009688] bg-teal-50 px-2.5 py-1 rounded-lg"
            style={{ fontFamily: RB }}
          >
            {summary?.waitingPatients?.count ?? 0} Patients Waiting
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-50 bg-slate-50/50">
                {[
                  "Token",
                  "Patient Name",
                  "Doctor",
                  "Department",
                  "Appt Time",
                  "Queue Position",
                  "Status",
                  "Action",
                ].map((h) => (
                  <th
                    key={h}
                    className="px-5 py-3 text-left text-xs font-semibold text-[#64748B]"
                    style={{ fontFamily: RB }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {queueData && queueData.length > 0 ? (
                queueData.map((q) => (
                  <tr
                    key={q.token}
                    className="hover:bg-slate-50 transition-colors"
                  >
                    <td className="px-5 py-3 font-mono text-xs font-bold text-[#0D47A1]">
                      {q.token}
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2">
                        <Av name={q.patientName} size="sm" />
                        <span
                          className="text-xs font-medium text-[#111827]"
                          style={{ fontFamily: RB }}
                        >
                          {q.patientName}
                        </span>
                      </div>
                    </td>
                    <td
                      className="px-5 py-3 text-xs text-[#64748B]"
                      style={{ fontFamily: RB }}
                    >
                      {q.doctorName}
                    </td>
                    <td
                      className="px-5 py-3 text-xs text-[#64748B]"
                      style={{ fontFamily: RB }}
                    >
                      {q.departmentName}
                    </td>
                    <td className="px-5 py-3 font-mono text-xs text-slate-600">
                      {q.appointmentTime}
                    </td>
                    <td className="px-5 py-3 font-mono text-xs font-bold text-[#009688]">
                      {q.queuePosition}
                    </td>
                    <td className="px-5 py-3">
                      <Chip
                        label={q.status}
                        variant={
                          q.status === "Scheduled"
                            ? "default"
                            : q.status === "Checked In" ||
                                q.status === "CHECKED_IN"
                              ? "info"
                              : q.status === "Waiting" || q.status === "WAITING"
                                ? "warning"
                                : q.status === "Completed"
                                  ? "success"
                                  : q.status === "Cancelled" ||
                                      q.status === "CANCELLED"
                                    ? "error"
                                    : "default"
                        }
                      />
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-1.5">
                        {q.status === "Scheduled" ? (
                          <button
                            onClick={() => {
                              if (onCheckInClick)
                                onCheckInClick(q.token, q.mrn);
                              else navigate(ROUTES.APPOINTMENTS);
                            }}
                            className="px-2.5 py-1 rounded-lg bg-[#009688] text-white text-[11px] font-semibold hover:bg-teal-700 transition-colors"
                            style={{ fontFamily: PP }}
                          >
                            Check-In
                          </button>
                        ) : (
                          <span className="text-xs text-slate-400 font-medium">
                            Logged
                          </span>
                        )}
                        <button
                          onClick={() => {
                            if (onPatientSelect) onPatientSelect(q.mrn);
                            else
                              navigate(
                                ROUTES.PATIENT_PROFILE.replace(":mrn", q.mrn),
                              );
                          }}
                          className="px-2 py-1 rounded-lg bg-slate-100 text-[#0D47A1] text-[11px] font-semibold hover:bg-blue-50 transition-colors"
                        >
                          View
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={8}
                    className="px-5 py-8 text-center text-xs text-[#64748B]"
                    style={{ fontFamily: RB }}
                  >
                    No patients in queue
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Section 04, 05 & 06: Doctor Availability & Distribution & Registration Categories ── */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
        {/* Section 04: Doctor Availability (Summary Cards) */}
        <div className="bg-white rounded-2xl border border-[#E5E7EB] p-5 shadow-sm flex flex-col justify-between">
          <SH
            title="Doctor Availability"
            sub="Help Reception Assign Appointments Efficiently"
          />
          <div className="space-y-2.5 my-auto">
            {(
              [] as Array<{
                name: string;
                dept: string;
                status: string;
                color: string;
              }>
            ).length === 0 ? (
              <div
                className="text-center text-xs text-[#64748B] py-4"
                style={{ fontFamily: RB }}
              >
                No doctor availability data
              </div>
            ) : (
              (
                [] as Array<{
                  name: string;
                  dept: string;
                  status: string;
                  color: string;
                }>
              ).map((d) => (
                <div
                  key={d.name}
                  className="flex items-center justify-between p-2.5 rounded-xl border border-gray-100 bg-slate-50"
                >
                  <div>
                    <div
                      className="text-xs font-semibold text-[#111827]"
                      style={{ fontFamily: PP }}
                    >
                      {d.name}
                    </div>
                    <div
                      className="text-[10px] text-[#64748B]"
                      style={{ fontFamily: RB }}
                    >
                      {d.dept}
                    </div>
                  </div>
                  <Chip
                    label={d.status}
                    variant={
                      d.status === "Available"
                        ? "success"
                        : d.status === "In Consultation"
                          ? "teal"
                          : "error"
                    }
                  />
                </div>
              ))
            )}
          </div>
          <div
            className="mt-3 pt-2 text-xs text-[#64748B] text-center"
            style={{ fontFamily: RB }}
          >
            Real-time Roster Status
          </div>
        </div>

        {/* Section 05: Department Patient Distribution (Horizontal Bar Chart) */}
        <div className="bg-white rounded-2xl border border-[#E5E7EB] p-5 shadow-sm flex flex-col justify-between">
          <SH
            title="Patients by Department"
            sub="Today's Registered Patient Distribution"
          />
          <ResponsiveContainer width="100%" height={180}>
            <BarChart
              data={
                deptDistribution.length > 0
                  ? deptDistribution
                  : [{ dept: "No Data", count: 0 }]
              }
              layout="vertical"
              margin={{ top: 0, right: 20, left: 15, bottom: 0 }}
            >
              <XAxis
                type="number"
                tick={{ fontSize: 10, fill: "#94A3B8" }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                dataKey="dept"
                type="category"
                tick={{ fontSize: 11, fill: "#111827", fontFamily: RB }}
                axisLine={false}
                tickLine={false}
                width={90}
              />
              <Tooltip
                contentStyle={{
                  background: "#fff",
                  border: "1px solid #E5E7EB",
                  borderRadius: 12,
                  fontSize: 12,
                }}
                formatter={(v: unknown) => [`${v} Patients`, "Volume"]}
              />
              <Bar
                dataKey="count"
                fill="#0D47A1"
                radius={[0, 4, 4, 0]}
                barSize={13}
              />
            </BarChart>
          </ResponsiveContainer>
          <div
            className="mt-2 pt-2 border-t border-gray-50 text-xs text-[#64748B] flex items-center justify-between"
            style={{ fontFamily: RB }}
          >
            <span>
              {deptDistribution.length > 0
                ? `Busiest: ${deptDistribution.reduce((max, d) => (d.count > max.count ? d : max), deptDistribution[0]).dept} (${deptDistribution.reduce((max, d) => (d.count > max.count ? d : max), deptDistribution[0]).count})`
                : "No department data"}
            </span>
            <span className="font-semibold text-[#0D47A1]">
              {deptDistribution.reduce((sum, d) => sum + d.count, 0)} Total
              Patients
            </span>
          </div>
        </div>

        {/* Section 06: Registration Category Summary (Pie Chart) */}
        <div className="bg-white rounded-2xl border border-[#E5E7EB] p-5 shadow-sm flex flex-col justify-between">
          <SH
            title="Registration Categories"
            sub="Understand Registration Mix Today"
          />
          <ResponsiveContainer width="100%" height={160}>
            <BarChart
              data={
                regTypes.length > 0
                  ? regTypes
                  : [{ category: "No Data", count: 0, color: "#64748B" }]
              }
              margin={{ top: 10, right: 10, left: 10, bottom: 0 }}
            >
              <XAxis
                dataKey="category"
                tick={{ fontSize: 10, fill: "#64748B", fontFamily: RB }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 10, fill: "#94A3B8" }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                contentStyle={{
                  background: "#fff",
                  border: "1px solid #E5E7EB",
                  borderRadius: 12,
                  fontSize: 12,
                }}
                formatter={(v: unknown) => [`${v} Registrations`, "Count"]}
              />
              <Bar dataKey="count" radius={[4, 4, 0, 0]} barSize={22}>
                {(regTypes.length > 0
                  ? regTypes
                  : [{ category: "No Data", count: 0, color: "#64748B" }]
                ).map((entry) => (
                  <Cell key={entry.category} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          <div
            className="grid grid-cols-2 gap-1.5 mt-2 pt-2 border-t border-gray-50 text-xs"
            style={{ fontFamily: RB }}
          >
            {(regTypes.length > 0
              ? regTypes
              : [{ category: "No Data", count: 0, color: "#64748B" }]
            ).map((r) => (
              <div
                key={r.category}
                className="flex items-center justify-between"
              >
                <span className="text-[#64748B] text-[11px]">
                  {r.category}:
                </span>
                <span className="font-bold text-[#111827]">{r.count}</span>
              </div>
            ))}
          </div>
          <div
            className="mt-2 text-xs font-semibold text-center text-[#0D47A1]"
            style={{ fontFamily: PP }}
          >
            Total Registrations: {regTotal}
          </div>
        </div>
      </div>

      {/* ── Section 09: Reception Performance Summary ── */}
      <div className="bg-white rounded-2xl border border-[#E5E7EB] shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-50 flex items-center justify-between">
          <div>
            <div
              className="text-sm font-semibold text-[#111827]"
              style={{ fontFamily: PP }}
            >
              Today's Reception Performance Summary
            </div>
            <div
              className="text-xs text-[#64748B] mt-0.5"
              style={{ fontFamily: RB }}
            >
              Front desk operational statistics and daily efficiency metrics
            </div>
          </div>
        </div>
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-50 bg-slate-50/50">
              {["Metric", "Today", "Yesterday", "Status"].map((h) => (
                <th
                  key={h}
                  className="px-5 py-3 text-left text-xs font-semibold text-[#64748B]"
                  style={{ fontFamily: RB }}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {(performanceMetrics.length > 0
              ? performanceMetrics
              : [
                  {
                    metric: "No Data",
                    today: "0",
                    yesterday: "0",
                    status: "N/A",
                  },
                ]
            ).map((m) => (
              <tr
                key={m.metric}
                className="hover:bg-slate-50 transition-colors"
              >
                <td
                  className="px-5 py-3 text-xs font-medium text-[#111827]"
                  style={{ fontFamily: PP }}
                >
                  {m.metric}
                </td>
                <td className="px-5 py-3 font-mono text-xs font-bold text-[#0D47A1]">
                  {m.today}
                </td>
                <td className="px-5 py-3 font-mono text-xs font-semibold text-[#64748B]">
                  {m.yesterday}
                </td>
                <td className="px-5 py-3">
                  <Chip
                    label={m.status}
                    variant={
                      m.status.includes("Ahead") ||
                      m.status.includes("Optimal") ||
                      m.status.includes("Efficient")
                        ? "success"
                        : m.status.includes("Low")
                          ? "info"
                          : "default"
                    }
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
