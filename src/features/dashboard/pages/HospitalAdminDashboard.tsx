import React, { useMemo } from "react";
import { useNavigate } from "react-router";
import { ROUTES } from "../../../app/routes/routes";
// React imports
import {
  Calendar,
  Clock,
  TrendingDown,
  TrendingUp,
  UserPlus,
  Users,
  DollarSign,
  Bell,
  Stethoscope,
  BarChart2,
} from "lucide-react";
import {
  useHospitalAdminSummary,
  useHospitalAdminAppointmentFlow,
  useHospitalAdminStatusDistribution,
  useHospitalAdminDepartmentWorkload,
  useHospitalAdminDoctorAvailability,
  useHospitalAdminTodayTimeline,
  useHospitalAdminRevenueDistribution,
  useHospitalAdminDepartmentSummary,
} from "../hooks/useHospitalAdminDashboard";

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

// ─── Mini Shared Components ────────────────────────────────────────────────
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

const ADMIN_AVATAR_PALETTE = [
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
    ADMIN_AVATAR_PALETTE[
      (safeName?.charCodeAt(0) ?? "?".charCodeAt(0)) %
        ADMIN_AVATAR_PALETTE.length
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
const ADMIN_CHIP_MAP: Record<ChipVariant, string> = {
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
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${ADMIN_CHIP_MAP[variant]}`}
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

const HA_STATUS_COLOR: Record<string, string> = {
  Completed: "#66BB6A",
  "In Consultation": "#009688",
  Waiting: "#F59E0B",
  Scheduled: "#0D47A1",
  Cancelled: "#EF4444",
};

const HA_QUICK_ACTIONS = [
  { label: "View Patients", Icon: Users, color: "#0D47A1", nav: "patients" },
  { label: "View Queue", Icon: Clock, color: "#009688", nav: "appointments" },
  {
    label: "Appointment Management",
    Icon: Calendar,
    color: "#0D47A1",
    nav: "appointments",
  },
  {
    label: "Operational Reports",
    Icon: BarChart2,
    color: "#64748B",
    nav: "reports",
  },
];

interface HospitalAdminDashboardProps {
  onRegisterPatient?: () => void;
  onNavigateNav?: (nav: string) => void;
}

const safeNum = (val: unknown, fallback = 0): number => {
  const num = Number(val);
  return isNaN(num) ? fallback : num;
};

const safeVal = (val: unknown, fallback = 0): string => {
  const num = Number(val);
  return isNaN(num) ? String(fallback) : String(num);
};

export function HospitalAdminDashboard({
  onRegisterPatient,
  onNavigateNav,
}: HospitalAdminDashboardProps = {}) {
  const navigate = useNavigate();

  const summaryQuery = useHospitalAdminSummary();
  const flowQuery = useHospitalAdminAppointmentFlow();
  const statusQuery = useHospitalAdminStatusDistribution();
  const workloadQuery = useHospitalAdminDepartmentWorkload();
  const availabilityQuery = useHospitalAdminDoctorAvailability();
  const timelineQuery = useHospitalAdminTodayTimeline();
  const revenueQuery = useHospitalAdminRevenueDistribution();
  const deptSummaryQuery = useHospitalAdminDepartmentSummary();

  const summary = summaryQuery.data;
  const apptFlow = flowQuery.data?.flow || [];
  const statusDist = statusQuery.data || [];
  const deptWorkload = workloadQuery.data || [];
  const docAvailability = availabilityQuery.data || [];
  const timeline = timelineQuery.data || [];
  const revenueDist = revenueQuery.data || [];
  const deptSummary = deptSummaryQuery.data || [];

  const totalRevenue = revenueDist.reduce(
    (acc, curr) => acc + (Number(curr.value) || 0),
    0,
  );
  const totalDoctors = docAvailability.reduce(
    (acc, curr) => acc + (Number(curr.count) || 0),
    0,
  );
  const pendingAppointments = deptSummary.reduce(
    (acc, d) => acc + (Number(d.waiting) || 0),
    0,
  );

  const currencyFormatter = useMemo(
    () =>
      new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
        maximumFractionDigits: 0,
      }),
    [],
  );

  const formatCurrency = (val: unknown) => {
    const num = safeNum(val);
    return currencyFormatter.format(num);
  };

  const todayStr = summary?.date || new Date().toISOString().split("T")[0];

  return (
    <div
      className="flex-1 overflow-y-auto p-6 space-y-6"
      style={{ background: "#F1F5F9" }}
    >
      {/* ── Quick Actions ── */}
      <div className="flex items-center gap-3 flex-wrap">
        <span
          className="text-xs font-semibold text-[#64748B] uppercase tracking-wider mr-1"
          style={{ fontFamily: PP }}
        >
          Quick Actions
        </span>
        <button
          onClick={() => {
            if (onRegisterPatient) {
              onRegisterPatient();
            } else {
              navigate(ROUTES.PATIENT_REGISTER);
            }
          }}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#0D47A1] text-white text-xs font-semibold hover:bg-[#1565C0] transition-colors shadow-sm"
          style={{ fontFamily: PP }}
        >
          <UserPlus size={13} />
          Register Patient
        </button>
        {HA_QUICK_ACTIONS.map(({ label, Icon, color, nav }) => (
          <button
            key={label}
            onClick={() => {
              if (nav === "reports") {
                navigate(ROUTES.REPORTS);
              } else if (nav === "patients") {
                navigate(ROUTES.PATIENTS);
              } else if (nav === "appointments") {
                navigate(ROUTES.APPOINTMENTS);
              } else if (onNavigateNav) {
                onNavigateNav(nav);
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

      {/* ── KPI Row — 5 Operational Cards ── */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-4">
        <DKpi
          title="Today's OPD Patients"
          value={safeVal(
            summary?.todayOpdPatients ?? summary?.opdPatients?.today,
          )}
          sub={summaryQuery.isLoading ? "Loading..." : `Updated ${todayStr}`}
          trend={
            safeNum(summary?.todayOpdPatients ?? summary?.opdPatients?.today) >
            0
              ? "+100%"
              : "--"
          }
          up={true}
          data={
            apptFlow.length > 0
              ? apptFlow.map((h) => ({ v: h.completed }))
              : [{ v: 0 }]
          }
          color="#0D47A1"
          gid="ha1"
          Icon={Users}
        />
        <DKpi
          title="Today's Appointments"
          value={safeVal(
            summary?.todayAppointments ?? summary?.appointments?.today,
          )}
          sub={summaryQuery.isLoading ? "Loading..." : "All departments"}
          trend={
            safeNum(
              summary?.todayAppointments ?? summary?.appointments?.today,
            ) > 0
              ? "+100%"
              : "--"
          }
          up={true}
          data={
            apptFlow.length > 0
              ? apptFlow.map((h) => ({ v: h.completed }))
              : [{ v: 0 }]
          }
          color="#009688"
          gid="ha2"
          Icon={Calendar}
        />
        <DKpi
          title="Today's Revenue"
          value={formatCurrency(
            summary?.todayRevenue ?? summary?.revenue?.today,
          )}
          sub={summaryQuery.isLoading ? "Loading..." : "Gross collections"}
          trend={
            safeNum(summary?.todayRevenue ?? summary?.revenue?.today) > 0
              ? "+100%"
              : "--"
          }
          up={true}
          data={
            revenueDist.length > 0
              ? revenueDist.map((r) => ({ v: r.value }))
              : [{ v: 0 }]
          }
          color="#66BB6A"
          gid="ha3"
          Icon={DollarSign}
        />
        <DKpi
          title="Pending Appointments"
          value={String(pendingAppointments)}
          sub={summaryQuery.isLoading ? "Loading..." : "Awaiting consultation"}
          trend={pendingAppointments > 0 ? "Action Required" : "All Clear"}
          up={pendingAppointments === 0}
          data={
            apptFlow.length > 0
              ? apptFlow.map((h) => ({ v: h.completed }))
              : [{ v: 0 }]
          }
          color="#F59E0B"
          gid="ha4"
          Icon={Bell}
        />
        <DKpi
          title="Doctors Available Today"
          value={String(
            summary?.doctorsAvailable ?? summary?.doctors?.available ?? 0,
          )}
          sub={summaryQuery.isLoading ? "Loading..." : "On duty"}
          trend={
            (summary?.doctorsAvailable ?? summary?.doctors?.available ?? 0) > 0
              ? "Active"
              : "--"
          }
          up={true}
          data={
            docAvailability.length > 0
              ? docAvailability.map((d) => ({ v: d.count }))
              : [{ v: 0 }]
          }
          color="#0D47A1"
          gid="ha5"
          Icon={Stethoscope}
        />
      </div>

      {/* ── Analytics Grid 1 ── */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
        {/* Section 01: Appointment Flow Today (Line Chart) */}
        <div className="xl:col-span-2 bg-white rounded-2xl border border-[#E5E7EB] p-5 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <div>
              <div
                className="text-sm font-semibold text-[#111827]"
                style={{ fontFamily: PP }}
              >
                Appointment Flow Today
              </div>
              <div
                className="text-xs text-[#64748B] mt-0.5"
                style={{ fontFamily: RB }}
              >
                Completed appointments movement by hour · Today (8 AM - 5 PM)
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span
                className="text-[10px] font-semibold text-[#0D47A1] bg-blue-50 px-2 py-0.5 rounded-full"
                style={{ fontFamily: RB }}
              >
                Current Period: Today
              </span>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart
              data={apptFlow}
              margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
            >
              <defs>
                <linearGradient id="flowGrad" x1="0" y1="0" x2="0" y2="1">
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
                formatter={(val: unknown) => [
                  `${val} Completed`,
                  "Appointments",
                ]}
              />
              <Area
                type="monotone"
                dataKey="completed"
                stroke="#0D47A1"
                strokeWidth={2.5}
                fill="url(#flowGrad)"
                dot={{ r: 3, fill: "#0D47A1" }}
              />
            </AreaChart>
          </ResponsiveContainer>
          <div
            className="mt-3 pt-3 border-t border-gray-50 flex items-center justify-between text-xs text-[#64748B]"
            style={{ fontFamily: RB }}
          >
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#0D47A1]" /> Peak
              Patient Flow:{" "}
              {flowQuery.data
                ? `${flowQuery.data.peakAppointments} at ${flowQuery.data.peakHour}`
                : "No Data"}
            </span>
            <span className="font-semibold text-[#111827]">
              Total: {flowQuery.data?.totalCompleted ?? 0} Completed
            </span>
          </div>
        </div>

        {/* Section 02: Patient Status Distribution (Pie / Donut Chart) */}
        <div className="bg-white rounded-2xl border border-[#E5E7EB] p-5 shadow-sm flex flex-col justify-between">
          <SH
            title="Patient Status Distribution"
            sub="Current OPD Workflow Status"
          />
          <ResponsiveContainer width="100%" height={170}>
            <BarChart
              data={statusDist}
              layout="vertical"
              margin={{ top: 0, right: 20, left: 10, bottom: 0 }}
            >
              <XAxis type="number" hide />
              <YAxis
                dataKey="name"
                type="category"
                tick={{ fontSize: 11, fill: "#111827", fontFamily: RB }}
                axisLine={false}
                tickLine={false}
                width={100}
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
              <Bar dataKey="value" radius={[0, 6, 6, 0]} barSize={14}>
                {statusDist.map((entry) => (
                  <Cell key={entry.name} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          <div
            className="grid grid-cols-2 gap-2 mt-2 pt-3 border-t border-gray-50 text-xs"
            style={{ fontFamily: RB }}
          >
            {statusDist.map((s) => (
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
            Period: Today ·{" "}
            {statusDist.reduce((acc, s) => acc + safeNum(s.value), 0)} Total
            Recorded Visits
          </div>
        </div>
      </div>

      {/* ── Analytics Grid 2 ── */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
        {/* Section 03: Department Workload (Horizontal Bar Chart) */}
        <div className="bg-white rounded-2xl border border-[#E5E7EB] p-5 shadow-sm flex flex-col justify-between">
          <SH
            title="Department Workload"
            sub="Today's Scheduled Appointments"
          />
          <ResponsiveContainer width="100%" height={200}>
            <BarChart
              data={deptWorkload}
              layout="vertical"
              margin={{ top: 0, right: 20, left: 10, bottom: 0 }}
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
                formatter={(v: unknown) => [`${v} Appointments`, "Volume"]}
              />
              <Bar
                dataKey="appts"
                fill="#0D47A1"
                radius={[0, 4, 4, 0]}
                barSize={14}
              />
            </BarChart>
          </ResponsiveContainer>
          <div
            className="mt-3 pt-3 border-t border-gray-50 text-xs text-[#64748B] flex items-center justify-between"
            style={{ fontFamily: RB }}
          >
            <span>{deptWorkload.length > 0 ? "Live data" : "No Data"}</span>
            <span className="font-semibold text-[#0D47A1]">
              {deptWorkload.reduce((acc, d) => acc + d.appts, 0)} Total Patients
            </span>
          </div>
        </div>

        {/* Section 04: Doctor Availability (Stacked Card) */}
        <div className="bg-white rounded-2xl border border-[#E5E7EB] p-5 shadow-sm flex flex-col justify-between">
          <SH title="Doctor Availability" sub="Current Staffing Overview" />
          <div className="space-y-3 my-auto">
            {docAvailability.map((d) => {
              const pct =
                totalDoctors > 0
                  ? Math.round((d.count / totalDoctors) * 100)
                  : 0;
              return (
                <div key={d.status}>
                  <div
                    className="flex items-center justify-between text-xs mb-1"
                    style={{ fontFamily: RB }}
                  >
                    <div className="flex items-center gap-1.5">
                      <span
                        className="w-2.5 h-2.5 rounded-full"
                        style={{ background: d.color }}
                      />
                      <span className="font-medium text-[#111827]">
                        {d.status}
                      </span>
                    </div>
                    <span className="font-semibold text-[#111827]">
                      {d.count} ({pct}%)
                    </span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-colors"
                      style={{ width: `${pct}%`, background: d.color }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
          <div
            className="mt-4 pt-3 border-t border-gray-50 text-xs text-[#64748B] flex items-center justify-between"
            style={{ fontFamily: RB }}
          >
            <span>Available + In Consult: {totalDoctors} Active</span>
            <span className="font-semibold text-[#66BB6A]">
              {totalDoctors > 0 ? "100" : "0"}% On Duty
            </span>
          </div>
        </div>

        {/* Section 06: Revenue Collection Summary (Donut Chart) */}
        <div className="bg-white rounded-2xl border border-[#E5E7EB] p-5 shadow-sm flex flex-col justify-between">
          <SH
            title="Revenue Collection Summary"
            sub="Collection Method Distribution"
          />
          <div className="flex items-center justify-center relative py-2">
            <ResponsiveContainer width="100%" height={150}>
              <BarChart
                data={revenueDist}
                margin={{ top: 10, right: 10, left: 10, bottom: 0 }}
              >
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 11, fill: "#64748B", fontFamily: RB }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 10, fill: "#94A3B8" }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v) => `₹${v}`}
                />
                <Tooltip
                  contentStyle={{
                    background: "#fff",
                    border: "1px solid #E5E7EB",
                    borderRadius: 12,
                    fontSize: 12,
                  }}
                  formatter={(v: unknown) => [`₹${v}`, "Amount"]}
                />
                <Bar dataKey="value" radius={[4, 4, 0, 0]} barSize={24}>
                  {revenueDist.map((entry) => (
                    <Cell key={entry.name} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div
            className="grid grid-cols-2 gap-2 mt-2 pt-3 border-t border-gray-50 text-xs"
            style={{ fontFamily: RB }}
          >
            {revenueDist.map((r) => (
              <div key={r.name} className="flex items-center justify-between">
                <span className="text-[#64748B]">{r.name}:</span>
                <span className="font-bold text-[#111827]">
                  ₹{(r.value ?? 0).toLocaleString()}
                </span>
              </div>
            ))}
          </div>
          <div
            className="mt-2 text-xs font-semibold text-center text-[#0D47A1]"
            style={{ fontFamily: PP }}
          >
            Total Gross Collections: {formatCurrency(totalRevenue)}
          </div>
        </div>
      </div>

      {/* ── Section 05: Today's Appointment Timeline ── */}
      <div className="bg-white rounded-2xl border border-[#E5E7EB] shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-50 flex items-center justify-between">
          <div>
            <div
              className="text-sm font-semibold text-[#111827]"
              style={{ fontFamily: PP }}
            >
              Today's Appointment Timeline
            </div>
            <div
              className="text-xs text-[#64748B] mt-0.5"
              style={{ fontFamily: RB }}
            >
              Real-time patient flow tracker · {timeline.length} tracked records
            </div>
          </div>
          <div
            className="flex items-center gap-3 text-xs"
            style={{ fontFamily: RB }}
          >
            {[
              "Completed",
              "In Consultation",
              "Waiting",
              "Scheduled",
              "Cancelled",
            ].map((st) => (
              <div key={st} className="flex items-center gap-1 text-[#64748B]">
                <span
                  className="w-2 h-2 rounded-full shrink-0"
                  style={{ background: HA_STATUS_COLOR[st] }}
                />
                <span>{st}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-50 bg-slate-50/50">
                {[
                  "Time",
                  "Token",
                  "Patient",
                  "Doctor",
                  "Department",
                  "Room",
                  "Current Stage",
                  "Status",
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
              {timeline.map((a) => (
                <tr
                  key={a.token || a.time}
                  className="hover:bg-slate-50 transition-colors"
                >
                  <td className="px-5 py-3 font-mono text-xs font-bold text-[#0D47A1]">
                    {a.time}
                  </td>
                  <td className="px-5 py-3 font-mono text-xs font-semibold text-slate-600">
                    {a.token}
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2">
                      <Av name={a.patient} size="sm" />
                      <span
                        className="text-xs font-medium text-[#111827]"
                        style={{ fontFamily: RB }}
                      >
                        {a.patient}
                      </span>
                    </div>
                  </td>
                  <td
                    className="px-5 py-3 text-xs text-[#64748B]"
                    style={{ fontFamily: RB }}
                  >
                    {a.doctor}
                  </td>
                  <td
                    className="px-5 py-3 text-xs text-[#64748B]"
                    style={{ fontFamily: RB }}
                  >
                    {a.dept}
                  </td>
                  <td className="px-5 py-3">
                    <span className="font-mono text-[10px] font-semibold text-[#009688] bg-teal-50 px-1.5 py-0.5 rounded">
                      {a.room}
                    </span>
                  </td>
                  <td
                    className="px-5 py-3 text-xs text-[#111827] font-medium"
                    style={{ fontFamily: RB }}
                  >
                    {a.stage}
                  </td>
                  <td className="px-5 py-3">
                    <Chip
                      label={a.status}
                      variant={
                        a.status === "Completed"
                          ? "success"
                          : a.status === "In Consultation"
                            ? "teal"
                            : a.status === "Waiting"
                              ? "warning"
                              : a.status === "Cancelled"
                                ? "error"
                                : "info"
                      }
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Section 09: Quick Department Summary ── */}
      <div className="bg-white rounded-2xl border border-[#E5E7EB] shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-50 flex items-center justify-between">
          <div>
            <div
              className="text-sm font-semibold text-[#111827]"
              style={{ fontFamily: PP }}
            >
              Quick Department Summary
            </div>
          </div>
        </div>
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-50 bg-slate-50/50">
              {[
                "Department",
                "Appointments",
                "Completed",
                "Waiting",
                "Doctors Available",
                "Status",
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
            {deptSummary.map((d) => (
              <tr
                key={d.departmentId}
                className="hover:bg-slate-50 transition-colors"
              >
                <td
                  className="px-5 py-3 text-xs font-medium text-[#111827]"
                  style={{ fontFamily: PP }}
                >
                  {d.departmentName}
                </td>
                <td className="px-5 py-3 font-mono text-xs font-semibold text-[#111827]">
                  {d.appointments}
                </td>
                <td className="px-5 py-3 font-mono text-xs font-semibold text-[#66BB6A]">
                  {d.completed}
                </td>
                <td className="px-5 py-3 font-mono text-xs font-semibold text-[#F59E0B]">
                  {d.waiting}
                </td>
                <td className="px-5 py-3 font-mono text-xs font-semibold text-[#0D47A1]">
                  {d.doctorsAvailable}
                </td>
                <td className="px-5 py-3">
                  <Chip
                    label={d.status}
                    variant={
                      d.status === "LOW"
                        ? "success"
                        : d.status === "MODERATE"
                          ? "info"
                          : d.status === "HIGH"
                            ? "warning"
                            : d.status === "CRITICAL"
                              ? "error"
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
