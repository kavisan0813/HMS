import React from "react";
import { useNavigate } from "react-router";
import { ROUTES } from "../../../app/routes/routes";
import {
  Activity,
  Clock,
  ClipboardList,
  TrendingDown,
  TrendingUp,
  Users,
  Stethoscope,
  Loader2,
} from "lucide-react";
import {
  useNurseDashboardSummary,
  useNurseVitalsTrend,
  useNursePreparationStatus,
  useNurseQueue,
  useNurseDoctorAssistance,
  useNurseDepartments,
  useNurseVitalsStatus,
  useNursePerformance,
} from "../hooks/useNurseDashboard";

import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  LineChart,
  Line,
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
}) {
  return (
    <div className="bg-white rounded-2xl border border-[#E5E7EB] p-5 flex flex-col gap-3 shadow-sm">
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

const NURSE_AVATAR_PALETTE = [
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
    NURSE_AVATAR_PALETTE[
      (safeName?.charCodeAt(0) ?? "?".charCodeAt(0)) %
        NURSE_AVATAR_PALETTE.length
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
const NURSE_CHIP_MAP: Record<ChipVariant, string> = {
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
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${NURSE_CHIP_MAP[variant]}`}
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

const NURSE_QUICK_ACTIONS = [
  {
    label: "Record Vitals",
    Icon: Activity,
    color: "#009688",
    action: "vitals",
  },

  {
    label: "Appointments",
    Icon: Stethoscope,
    color: "#66BB6A",
    action: "Appointments",
  },
  {
    label: "OPD Patients",
    Icon: ClipboardList,
    color: "#F59E0B",
    action: "OPD Patients",
  },
];

export function NurseDashboard() {
  const navigate = useNavigate();
  const summaryQuery = useNurseDashboardSummary();
  const vitalsTrendQuery = useNurseVitalsTrend();
  const prepStatusQuery = useNursePreparationStatus();
  const queueQuery = useNurseQueue(0, 10);
  const doctorAssistQuery = useNurseDoctorAssistance();
  const deptQuery = useNurseDepartments();
  const vitalsStatusQuery = useNurseVitalsStatus();
  const performanceQuery = useNursePerformance();

  const summary = summaryQuery.data?.summary;
  const vitalsTrend = vitalsTrendQuery.data;
  const prepStatus = prepStatusQuery.data;
  const queueData = queueQuery.data;
  const doctorAssist = doctorAssistQuery.data;
  const deptData = deptQuery.data;
  const vitalsStatus = vitalsStatusQuery.data;
  const performance = performanceQuery.data;

  const pipelineData = [
    {
      name: "Waiting Vitals",
      value: prepStatus?.waitingForVitals ?? 0,
      color: "#F59E0B",
    },
    {
      name: "Vitals Done",
      value: prepStatus?.vitalsCompleted ?? 0,
      color: "#009688",
    },
    {
      name: "Ready for Dr",
      value: prepStatus?.readyForConsultation ?? 0,
      color: "#0D47A1",
    },
    {
      name: "Completed",
      value: prepStatus?.consultationCompleted ?? 0,
      color: "#66BB6A",
    },
  ].filter((d) => d.value > 0);

  const visitTypeData = [
    {
      name: "New Patients",
      value: performance?.today.patientsAssisted ?? 0,
      percentage: "N/A",
      color: "#0D47A1",
    },
    {
      name: "Follow-up",
      value: performance?.yesterday.patientsAssisted ?? 0,
      percentage: "N/A",
      color: "#009688",
    },
    {
      name: "Walk-in",
      value: Math.max(
        0,
        (performance?.today.patientsAssisted ?? 0) -
          (performance?.yesterday.patientsAssisted ?? 0),
      ),
      percentage: "N/A",
      color: "#F59E0B",
    },
  ].filter((d) => d.value > 0);

  const deptDist = (deptData?.departments || []).map((d) => ({
    department: d.department,
    assisted: d.patients,
  }));

  const queueItems = React.useMemo(() => {
    if (!queueData) return [];
    if (Array.isArray(queueData)) return queueData;
    const qData = queueData as unknown as Record<string, unknown>;
    if (Array.isArray(qData.content)) return qData.content;
    if (Array.isArray(qData.patients)) return qData.patients;
    if (Array.isArray(qData.data)) return qData.data;
    return [];
  }, [queueData]);

  const waitingVitalsCount = React.useMemo(() => {
    if (queueItems && queueItems.length > 0) {
      return queueItems.filter((q: Record<string, unknown>) => {
        const isDone = Boolean(
          q.vitalsRecorded === true ||
          q.hasVitals === true ||
          q.vitalsStatus === "COMPLETED" ||
          q.vitalsStatus === "Vitals Recorded" ||
          q.vitalsId != null,
        );
        return !isDone;
      }).length;
    }
    return (
      summary?.waitingForVitals ||
      prepStatus?.waitingForVitals ||
      vitalsStatus?.pending ||
      0
    );
  }, [queueItems, summary, prepStatus, vitalsStatus]);

  const totalAssisted = deptData?.totalAssisted ?? 0;

  if (summaryQuery.isLoading) {
    return (
      <div
        className="flex-1 overflow-y-auto p-6 flex items-center justify-center"
        style={{ background: "#F1F5F9" }}
      >
        <div className="flex items-center gap-3 text-[#64748B]">
          <Loader2 size={20} className="animate-spin" />
          <span className="text-sm font-medium" style={{ fontFamily: RB }}>
            Loading nurse dashboard...
          </span>
        </div>
      </div>
    );
  }

  return (
    <div
      className="flex-1 overflow-y-auto p-6 space-y-6"
      style={{ background: "#F1F5F9" }}
    >
      {/* ── HEADER & QUICK ACTIONS ── */}
      <div className="flex items-center gap-3 flex-wrap">
        <span
          className="text-xs font-semibold text-[#64748B] uppercase tracking-wider mr-1"
          style={{ fontFamily: PP }}
        >
          Clinical Support Quick Actions
        </span>
        {NURSE_QUICK_ACTIONS.map(({ label, Icon, color, action }) => (
          <button
            key={label}
            onClick={() => {
              if (action === "vitals") {
                navigate(ROUTES.VITALS);
              } else if (action === "Appointments") {
                navigate(ROUTES.APPOINTMENTS);
              } else if (action === "OPD Patients") {
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
      </div>

      {/* ── KPI Row — 5 Clinical Support KPI Cards ── */}
      <div className="grid grid-cols-2 xl:grid-cols-5 gap-4">
        <DKpi
          title="Patients Assigned Today"
          value={String(summary?.patientsAssignedToday ?? 0)}
          sub={summaryQuery.isLoading ? "Loading..." : "Total assigned today"}
          trend="--"
          up={true}
          data={
            vitalsTrend?.hours?.slice(-6).map((h) => ({ v: h.count })) || [
              { v: 0 },
            ]
          }
          color="#0D47A1"
          gid="nr1"
          Icon={Users}
        />
        <DKpi
          title="Vitals Recorded"
          value={String(summary?.vitalsRecorded ?? 0)}
          sub={summaryQuery.isLoading ? "Loading..." : "Completed today"}
          trend={vitalsStatus && vitalsStatus.completed > 0 ? "Active" : "--"}
          up={true}
          data={
            vitalsTrend?.hours?.slice(-6).map((h) => ({ v: h.count })) || [
              { v: 0 },
            ]
          }
          color="#009688"
          gid="nr2"
          Icon={Activity}
        />
        <DKpi
          title="Waiting for Vitals"
          value={String(waitingVitalsCount)}
          sub={summaryQuery.isLoading ? "Loading..." : "Pending recording"}
          trend={waitingVitalsCount > 0 ? "Action Required" : "All Clear"}
          up={waitingVitalsCount === 0}
          data={[{ v: waitingVitalsCount }]}
          color="#F59E0B"
          gid="nr3"
          Icon={Clock}
        />
        <DKpi
          title="Doctor Assistances"
          value={String(doctorAssist?.doctorsAssistedToday ?? 0)}
          sub={summaryQuery.isLoading ? "Loading..." : "Today"}
          trend={
            doctorAssist && doctorAssist.doctorAssistances > 0 ? "Active" : "--"
          }
          up={true}
          data={[{ v: doctorAssist?.doctorsAssistedToday ?? 0 }]}
          color="#009688"
          gid="nr4"
          Icon={Stethoscope}
        />
        <DKpi
          title="Completed Tasks"
          value={String(summary?.completedTasks ?? 0)}
          sub={summaryQuery.isLoading ? "Loading..." : "Finished today"}
          trend="--"
          up={true}
          data={[{ v: summary?.completedTasks ?? 0 }]}
          color="#66BB6A"
          gid="nr5"
          Icon={ClipboardList}
        />
      </div>

      {/* ── Main Clinical Operations Grid 1 ── */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
        {/* Section 01: Today's Nursing Workload Trend (Line Chart) */}
        <div className="xl:col-span-2 bg-white rounded-2xl border border-[#E5E7EB] p-5 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <div>
              <div
                className="text-sm font-semibold text-[#111827]"
                style={{ fontFamily: PP }}
              >
                Today's Nursing Workload Trend
              </div>
              <div
                className="text-xs text-[#64748B] mt-0.5"
                style={{ fontFamily: RB }}
              >
                Hourly patients handled by nursing team throughout OPD session
                (08 AM - 05 PM)
              </div>
            </div>
            <span
              className="text-[10px] font-semibold text-[#0D47A1] bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-100"
              style={{ fontFamily: RB }}
            >
              {summary?.patientsAssignedToday ?? 0} Patients Total Today
            </span>
          </div>
          <ResponsiveContainer width="100%" height={210}>
            <LineChart
              data={vitalsTrend?.hours || []}
              margin={{ top: 10, right: 15, left: -15, bottom: 0 }}
            >
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
                formatter={(val: unknown) => [`${val} Patients`, "Assisted"]}
              />
              <Line
                type="monotone"
                dataKey="count"
                stroke="#0D47A1"
                strokeWidth={2.5}
                dot={{ r: 4, fill: "#0D47A1" }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
          <div
            className="mt-3 pt-3 border-t border-gray-100 grid grid-cols-3 gap-2 text-xs"
            style={{ fontFamily: RB }}
          >
            <div className="bg-slate-50 p-2 rounded-xl text-center">
              <span className="text-[#64748B] text-[10px] block">
                Total Vitals Recorded
              </span>
              <strong
                className="text-[#0D47A1] font-bold text-xs"
                style={{ fontFamily: PP }}
              >
                {vitalsTrend?.completed ?? 0}
              </strong>
              <span className="text-[10px] text-[#64748B] block">Today</span>
            </div>
            <div className="bg-slate-50 p-2 rounded-xl text-center">
              <span className="text-[#64748B] text-[10px] block">
                Average Vitals/Hour
              </span>
              <strong
                className="text-[#009688] font-bold text-xs"
                style={{ fontFamily: PP }}
              >
                {vitalsTrend?.hours && vitalsTrend.hours.length > 0
                  ? (vitalsTrend.completed / vitalsTrend.hours.length).toFixed(
                      1,
                    )
                  : "0"}
                / Hour
              </strong>
              <span className="text-[10px] text-[#64748B] block">
                Active Session
              </span>
            </div>
            <div className="bg-slate-50 p-2 rounded-xl text-center">
              <span className="text-[#64748B] text-[10px] block">
                Pending Vitals
              </span>
              <strong
                className="text-[#111827] font-bold text-xs"
                style={{ fontFamily: PP }}
              >
                {vitalsStatus?.pending ?? 0}
              </strong>
              <span className="text-[10px] text-[#66BB6A] block">Awaiting</span>
            </div>
          </div>
        </div>

        {/* Section 02: Current Patient Pipeline (Doughnut Chart) */}
        <div className="bg-white rounded-2xl border border-[#E5E7EB] p-5 shadow-sm flex flex-col justify-between">
          <SH
            title="Current Patient Pipeline"
            sub="Real-time OPD Patient Flow Breakdown"
          />
          <div className="h-44 relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pipelineData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={75}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {pipelineData.map((entry) => (
                    <Cell key={entry.name} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    background: "#fff",
                    border: "1px solid #E5E7EB",
                    borderRadius: 12,
                    fontSize: 12,
                  }}
                  formatter={(v: unknown) => [`${v} Patients`, "Count"]}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span
                className="text-xl font-bold text-[#111827]"
                style={{ fontFamily: PP }}
              >
                {prepStatus?.totalPatients ?? 0}
              </span>
              <span className="text-[10px] text-[#64748B]">Total Flow</span>
            </div>
          </div>

          <div
            className="grid grid-cols-2 gap-1.5 mt-2 pt-3 border-t border-gray-100 text-xs"
            style={{ fontFamily: RB }}
          >
            <div className="flex items-center justify-between p-1.5 rounded-lg bg-amber-50/60 border border-amber-100">
              <span className="text-[#64748B] text-[10px]">
                Waiting For Vitals:
              </span>
              <span className="font-bold text-[#F59E0B]">
                {waitingVitalsCount}
              </span>
            </div>
            <div className="flex items-center justify-between p-1.5 rounded-lg bg-teal-50/60 border border-teal-100">
              <span className="text-[#64748B] text-[10px]">
                Patients Recorded:
              </span>
              <span className="font-bold text-[#4DB6AC]">
                {prepStatus?.vitalsCompleted ?? 0}
              </span>
            </div>
            <div className="flex items-center justify-between p-1.5 rounded-lg bg-blue-50/60 border border-blue-100">
              <span className="text-[#64748B] text-[10px]">
                Ready for Doctor:
              </span>
              <span className="font-bold text-[#0D47A1]">
                {prepStatus?.readyForConsultation ?? 0}
              </span>
            </div>
            <div className="flex items-center justify-between p-1.5 rounded-lg bg-green-50/60 border border-green-100">
              <span className="text-[#64748B] text-[10px]">
                Completed Today:
              </span>
              <span className="font-bold text-[#66BB6A]">
                {prepStatus?.consultationCompleted ?? 0}
              </span>
            </div>
          </div>

          <div
            className="mt-2 text-[11px] text-center font-medium text-[#0D47A1]"
            style={{ fontFamily: PP }}
          >
            Total Patients in Queue:{" "}
            {prepStatus?.totalPatients ?? queueItems.length} (Active OPD)
          </div>
        </div>
      </div>

      {/* ── Section 03: Current Nursing Queue Table ── */}
      <div className="bg-white rounded-2xl border border-[#E5E7EB] shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-50 flex items-center justify-between">
          <div>
            <div
              className="text-sm font-semibold text-[#111827]"
              style={{ fontFamily: PP }}
            >
              Current Nursing Queue
            </div>
            <div
              className="text-xs text-[#64748B] mt-0.5"
              style={{ fontFamily: RB }}
            >
              Monitor patients requiring vital recording and consultation
              support
            </div>
          </div>
          <span
            className="text-xs font-semibold text-[#009688] bg-teal-50 px-2.5 py-1 rounded-lg"
            style={{ fontFamily: RB }}
          >
            {waitingVitalsCount} Waiting for Vitals
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-50 bg-slate-50/50">
                {[
                  "Token",
                  "Patient Name",
                  "Assigned Doctor",
                  "Department",
                  "Appointment Time",
                  "Vitals Status",
                  "Consultation Status",
                  "Priority",
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
              {queueItems.length > 0 ? (
                queueItems.map((q: Record<string, unknown>, idx: number) => {
                  const token = String(q.token || q.tokenNo || `#${idx + 1}`);
                  const patientObj = q.patient as
                    | { name?: string; fullName?: string }
                    | undefined;
                  const doctorObj = q.doctor as
                    | { name?: string; fullName?: string }
                    | undefined;
                  const pName =
                    typeof q.patientName === "string"
                      ? q.patientName
                      : String(patientObj?.name || patientObj?.fullName || "—");
                  const dName =
                    typeof q.doctorName === "string"
                      ? q.doctorName
                      : String(doctorObj?.name || doctorObj?.fullName || "—");
                  const dept =
                    typeof q.departmentName === "string"
                      ? q.departmentName
                      : typeof q.department === "string"
                        ? q.department
                        : String(q.doctorDepartment || "—");
                  const time = String(
                    q.appointmentTime ||
                      q.timeSlot ||
                      q.startTime ||
                      q.time ||
                      "—",
                  );
                  const vitalsDone = Boolean(
                    q.vitalsRecorded === true ||
                    q.hasVitals === true ||
                    q.vitalsStatus === "COMPLETED" ||
                    q.vitalsStatus === "Vitals Recorded" ||
                    q.vitalsId != null,
                  );
                  const queueStatus = String(
                    q.queueStatus ||
                      q.status ||
                      (vitalsDone ? "Vitals Recorded" : "Waiting for Vitals"),
                  );
                  const priority = String(q.priority || "NORMAL");

                  return (
                    <tr
                      key={String(
                        q.appointmentId ||
                          q.id ||
                          q.token ||
                          `${pName}-${dName}-${time}`,
                      )}
                      className="hover:bg-slate-50 transition-colors"
                    >
                      <td className="px-5 py-3 font-mono text-xs font-bold text-[#0D47A1]">
                        {token}
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-2">
                          <Av name={pName} size="sm" />
                          <span
                            className="text-xs font-medium text-[#111827]"
                            style={{ fontFamily: RB }}
                          >
                            {pName}
                          </span>
                        </div>
                      </td>
                      <td
                        className="px-5 py-3 text-xs text-[#111827]"
                        style={{ fontFamily: RB }}
                      >
                        {dName}
                      </td>
                      <td
                        className="px-5 py-3 text-xs text-[#64748B]"
                        style={{ fontFamily: RB }}
                      >
                        {dept}
                      </td>
                      <td className="px-5 py-3 font-mono text-xs text-slate-500">
                        {time}
                      </td>
                      <td className="px-5 py-3">
                        <Chip
                          label={vitalsDone ? "Completed" : "Pending"}
                          variant={vitalsDone ? "success" : "warning"}
                        />
                      </td>
                      <td className="px-5 py-3">
                        <Chip
                          label={queueStatus}
                          variant={
                            queueStatus === "COMPLETED" ||
                            queueStatus === "Vitals Recorded" ||
                            queueStatus === "Ready for Consultation"
                              ? "success"
                              : queueStatus === "IN_CONSULTATION" ||
                                  queueStatus === "RECORDING_IN_PROGRESS"
                                ? "teal"
                                : "warning"
                          }
                        />
                      </td>
                      <td className="px-5 py-3">
                        <Chip
                          label={priority}
                          variant={
                            priority === "URGENT" || priority === "HIGH"
                              ? "error"
                              : "default"
                          }
                        />
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td
                    colSpan={8}
                    className="px-5 py-8 text-center text-xs text-[#64748B]"
                    style={{ fontFamily: RB }}
                  >
                    {queueQuery.isLoading
                      ? "Loading queue..."
                      : "No patients in queue"}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Section 04 & 05: Nursing Analytics Grid ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Section 04: Patient Visit Type Distribution (Doughnut Chart) */}
        <div className="bg-white rounded-2xl border border-[#E5E7EB] p-5 shadow-sm flex flex-col justify-between">
          <SH
            title="Patient Visit Type Distribution"
            sub="Today's OPD Patient Visit Mix"
          />
          <div className="flex items-center gap-4 my-auto">
            {/* Doughnut Chart */}
            <div className="w-36 h-36 relative shrink-0">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={visitTypeData}
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={65}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {visitTypeData.map((entry) => (
                      <Cell key={entry.name} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      background: "#fff",
                      border: "1px solid #E5E7EB",
                      borderRadius: 12,
                      fontSize: 11,
                    }}
                    formatter={(v: unknown) => [`${v} Patients`, "Count"]}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span
                  className="text-lg font-bold text-[#111827]"
                  style={{ fontFamily: PP }}
                >
                  {visitTypeData.reduce((acc, d) => acc + d.value, 0)}
                </span>
                <span className="text-[9px] text-[#64748B]">Total</span>
              </div>
            </div>

            {/* Vertical Legend */}
            <div
              className="flex-1 space-y-1.5 text-xs"
              style={{ fontFamily: RB }}
            >
              {visitTypeData.map((item) => (
                <div
                  key={item.name}
                  className="flex items-center justify-between p-1.5 rounded-lg bg-slate-50 border border-slate-100"
                >
                  <div className="flex items-center gap-1.5">
                    <span
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{ background: item.color }}
                    />
                    <span className="text-[#111827] font-medium text-[11px]">
                      {item.name}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <strong className="text-[#111827] text-xs font-bold">
                      {item.value}
                    </strong>
                    <span className="text-[10px] text-[#64748B] font-semibold w-7 text-right">
                      {item.percentage}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Bottom Compact Summary Cards */}
          <div
            className="grid grid-cols-3 gap-2 mt-3 pt-3 border-t border-gray-100 text-xs"
            style={{ fontFamily: RB }}
          >
            <div className="bg-slate-50 p-2 rounded-xl text-center border border-slate-100">
              <span className="text-[#64748B] text-[9px] block mb-0.5">
                Most Common Visit
              </span>
              <strong
                className="text-[#009688] font-bold text-xs block"
                style={{ fontFamily: PP }}
              >
                {visitTypeData.length > 0 ? visitTypeData[0].name : "--"}
              </strong>
              <span className="text-[9px] text-[#009688] font-semibold">
                {visitTypeData.length > 0 ? `${visitTypeData[0].value}` : "0"}
              </span>
            </div>
            <div className="bg-slate-50 p-2 rounded-xl text-center border border-slate-100">
              <span className="text-[#64748B] text-[9px] block mb-0.5">
                New Patients Today
              </span>
              <strong
                className="text-[#0D47A1] font-bold text-xs block"
                style={{ fontFamily: PP }}
              >
                {performance?.today.patientsAssisted ?? 0}
              </strong>
              <span className="text-[9px] text-[#64748B]">First Visits</span>
            </div>
            <div className="bg-slate-50 p-2 rounded-xl text-center border border-slate-100">
              <span className="text-[#64748B] text-[9px] block mb-0.5">
                Returning Patients
              </span>
              <strong
                className="text-[#111827] font-bold text-xs block"
                style={{ fontFamily: PP }}
              >
                {performance?.yesterday.patientsAssisted ?? 0}
              </strong>
              <span className="text-[9px] text-[#64748B]">
                Follow-up & Consult
              </span>
            </div>
          </div>
        </div>

        {/* Section 05: Patient Distribution by Department (UNTOUCHED) */}
        <div className="bg-white rounded-2xl border border-[#E5E7EB] p-5 shadow-sm flex flex-col justify-between">
          <SH
            title="Patients Assisted by Dept"
            sub="Nursing Workload Distribution"
          />
          <ResponsiveContainer width="100%" height={180}>
            <BarChart
              data={deptDist}
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
                dataKey="department"
                type="category"
                tick={{ fontSize: 10, fill: "#111827", fontFamily: RB }}
                axisLine={false}
                tickLine={false}
                width={85}
              />
              <Tooltip
                contentStyle={{
                  background: "#fff",
                  border: "1px solid #E5E7EB",
                  borderRadius: 12,
                  fontSize: 12,
                }}
                formatter={(v: unknown) => [`${v} Patients`, "Assisted"]}
              />
              <Bar
                dataKey="assisted"
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
            <span>{deptDist.length > 0 ? "Live data" : "No Data"}</span>
            <span className="font-semibold text-[#0D47A1]">
              {totalAssisted} Total Assisted
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
