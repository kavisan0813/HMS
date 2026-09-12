import React, { useMemo } from "react";
import { useNavigate } from "react-router";
import {
  Calendar,
  Clock,
  Pill,
  Receipt,
  TrendingDown,
  TrendingUp,
  Download,
  Bell,
  Stethoscope,
  User,
  Loader2,
} from "lucide-react";
import { PatientQueueCard } from "../../patients/components/PatientQueueCard";
import {
  usePatientDashboard,
  usePatientAppointmentsTimeline,
  usePatientPrescriptionSummary,
  usePatientConsultationHistory,
  usePatientUnreadNotificationsCount,
} from "../hooks/usePatientDashboard";
import { formatTime } from "../../../lib/time-utils";
import { ROUTES } from "../../../app/routes/routes";

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
  const chartData =
    !data || data.length < 2
      ? [
          { v: (data?.[0]?.v ?? 0) * 0.4 },
          { v: (data?.[0]?.v ?? 0) * 0.7 },
          { v: (data?.[0]?.v ?? 0) * 0.5 },
          { v: (data?.[0]?.v ?? 0) * 0.9 },
          { v: data?.[0]?.v ?? 0 },
        ]
      : data;

  return (
    <div className="bg-white rounded-2xl border border-[#E5E7EB] p-4 flex flex-col justify-between shadow-sm hover:shadow-md transition-shadow h-full">
      {/* Top Title & Icon */}
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="min-w-0 flex-1">
          <div
            className="text-[11px] font-semibold text-[#64748B] uppercase tracking-wider truncate mb-1"
            title={title}
            style={{ fontFamily: PP }}
          >
            {title}
          </div>
          <div
            className={`${
              value.length > 14
                ? "text-sm"
                : value.length > 10
                  ? "text-base"
                  : "text-xl"
            } font-bold text-[#111827] leading-snug truncate`}
            title={value}
            style={{ fontFamily: PP }}
          >
            {value}
          </div>
          <div
            className="text-xs text-[#94A3B8] font-normal truncate mt-0.5"
            title={sub}
            style={{ fontFamily: RB }}
          >
            {sub}
          </div>
        </div>
        <div
          className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
          style={{ background: color + "15" }}
        >
          <Icon size={15} style={{ color }} />
        </div>
      </div>

      {/* Sparkline & Trend Badge Footer */}
      <div className="mt-2 pt-2 border-t border-slate-50 flex items-center justify-between gap-2">
        <div className="w-20 h-7 shrink-0">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={chartData}
              margin={{ top: 2, right: 2, bottom: 2, left: 2 }}
            >
              <defs>
                <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={color} stopOpacity={0.25} />
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
        </div>

        <div
          className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full shrink-0 ${
            up ? "text-[#009688] bg-teal-50" : "text-[#EF4444] bg-red-50"
          }`}
          style={{ fontFamily: RB }}
        >
          {up ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
          <span>{trend}</span>
        </div>
      </div>
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

type DashboardRecord = Record<string, unknown> & {
  prescriptionId?: string | number;
  id?: string | number;
  items?: unknown[];
  billId?: string | number;
  billNumber?: string | number;
  invoiceId?: string | number;
};

const PATIENT_DASHBOARD_CHIP_MAP: Record<ChipVariant, string> = {
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
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${PATIENT_DASHBOARD_CHIP_MAP[variant]}`}
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
const PAT_STATUS_CHIP: Record<
  string,
  "success" | "warning" | "info" | "error" | "teal" | "default"
> = {
  Upcoming: "teal",
  Confirmed: "success",
  Completed: "success",
  Active: "success",
  Paid: "success",
  Unpaid: "error",
  Pending: "warning",
  Cancelled: "error",
  Expired: "error",
  Downloaded: "info",
  Success: "success",
  Booked: "teal",
  Scheduled: "teal",
  "Checked-In": "info",
  "In Consultation": "warning",
  "No Show": "error",
};

const PAT_QUICK_ACTIONS = [
  {
    label: "View Appointments",
    Icon: Clock,
    color: "#0D47A1",
    action: "appts",
  },
  {
    label: "View Prescriptions",
    Icon: Pill,
    color: "#4DB6AC",
    action: "prescriptions",
  },
  { label: "View Bills", Icon: Receipt, color: "#F59E0B", action: "bills" },
  {
    label: "Download Invoice",
    Icon: Download,
    color: "#66BB6A",
    action: "download",
  },
  { label: "Update Profile", Icon: User, color: "#64748B", action: "profile" },
];

import type { FamilyMember } from "../../patients/types/family.types";

export function PatientDashboard({
  activePatient,
  onAddFamilyMember,
}: {
  onBookAppointmentClick?: () => void;
  onViewBillsClick?: () => void;
  onNavigateNav?: (nav: string) => void;
  activePatient?: FamilyMember | null;
  familyMembers?: FamilyMember[];
  onSwitchPatient?: (member: FamilyMember) => void;
  onAddFamilyMember?: () => void;
}) {
  const navigate = useNavigate();
  const dashboardQuery = usePatientDashboard();
  const appointmentsQuery = usePatientAppointmentsTimeline();
  const prescriptionQuery = usePatientPrescriptionSummary();
  const consultationQuery = usePatientConsultationHistory();
  const unreadQuery = usePatientUnreadNotificationsCount();

  const dashboard = dashboardQuery.data;
  const appointments = appointmentsQuery.data?.items || [];
  const nextVisit = appointmentsQuery.data?.nextVisit;
  const prescriptions = prescriptionQuery.data;
  const consultations = consultationQuery.data;
  const unreadCount = unreadQuery.data?.count ?? 0;

  const upcomingApt = appointments.find(
    (a) =>
      a.status === "SCHEDULED" ||
      a.status === "Confirmed" ||
      a.status === "BOOKED" ||
      a.status === "Booked",
  );

  const upcomingStr = nextVisit
    ? `${nextVisit.appointmentDate} ${nextVisit.appointmentTime || ""}`
    : upcomingApt
      ? `${upcomingApt.appointmentDate} ${upcomingApt.appointmentTime || ""}`
      : "No Upcoming Visit";

  const prescriptionSummaryData = useMemo(() => {
    if (!prescriptions) return [];
    return [
      { name: "Active", count: prescriptions.active, color: "#66BB6A" },
      { name: "Completed", count: prescriptions.completed, color: "#0D47A1" },
      { name: "Expired", count: prescriptions.expired, color: "#EF4444" },
    ].filter((d) => d.count > 0);
  }, [prescriptions]);

  const consultationTrendData = useMemo(() => {
    if (!consultations?.monthlyVisits) return [];
    return consultations.monthlyVisits.map((m) => ({
      month: m.month,
      visits: m.count,
    }));
  }, [consultations]);

  const billingSummaryData = useMemo(() => {
    if (!dashboard?.billingSummary) return [];
    const bs = dashboard.billingSummary;
    const items: { name: string; amount: number; color: string }[] = [];
    if (bs.pendingAmount > 0)
      items.push({
        name: "Pending",
        amount: bs.pendingAmount,
        color: "#F59E0B",
      });
    if (bs.paidAmount > 0)
      items.push({ name: "Paid", amount: bs.paidAmount, color: "#66BB6A" });
    return items;
  }, [dashboard]);

  if (dashboardQuery.isLoading) {
    return (
      <div
        className="flex-1 overflow-y-auto p-6 flex items-center justify-center"
        style={{ background: "#F1F5F9" }}
      >
        <div className="flex items-center gap-3 text-[#64748B]">
          <Loader2 size={20} className="animate-spin" />
          <span className="text-sm font-medium" style={{ fontFamily: RB }}>
            Loading patient dashboard...
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
      {/* ── ACTIVE PATIENT CONTEXT BANNER ── */}
      {activePatient && (
        <div className="bg-white rounded-2xl border border-blue-100 p-4 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#0D47A1] text-white flex items-center justify-center font-bold text-sm">
              {(activePatient.patientName || activePatient.name || "P")[0]}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold text-[#111827]">
                  Active Patient:{" "}
                  {activePatient.patientName || activePatient.name}
                </h2>
                <span className="px-2 py-0.5 rounded-full bg-blue-50 text-[#0D47A1] text-[10px] font-semibold border border-blue-100">
                  {activePatient.relationship || "Self"}
                </span>
              </div>
              <p className="text-xs text-slate-500 font-mono">
                MRN: {activePatient.mrn || "Generating..."}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {onAddFamilyMember && (
              <button
                onClick={onAddFamilyMember}
                className="px-3 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-[#0D47A1] text-xs font-semibold transition-colors flex items-center gap-1"
              >
                + Add Family Member
              </button>
            )}
          </div>
        </div>
      )}

      {/* ── ACTIVE QUEUE STATUS ── */}
      <PatientQueueCard />

      {/* ── HEADER & QUICK ACTIONS ── */}
      <div className="flex items-center gap-3 flex-wrap">
        <span
          className="text-xs font-semibold text-[#64748B] uppercase tracking-wider mr-1"
          style={{ fontFamily: PP }}
        >
          Personal Healthcare Actions
        </span>
        {PAT_QUICK_ACTIONS.map(({ label, Icon, color, action }) => (
          <button
            key={label}
            onClick={() => {
              if (action === "book") navigate(ROUTES.PATIENT_APPOINTMENTS);
              else if (action === "appts")
                navigate(ROUTES.PATIENT_APPOINTMENTS);
              else if (action === "prescriptions")
                navigate(ROUTES.PATIENT_PRESCRIPTIONS);
              else if (action === "bills")
                navigate(ROUTES.PATIENT_PORTAL_BILLING);
              else if (action === "download")
                navigate(ROUTES.PATIENT_PORTAL_BILLING);
              else if (action === "profile")
                navigate(ROUTES.PATIENT_MY_PROFILE);
            }}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-[#E5E7EB] text-xs font-medium text-[#64748B] hover:border-[#0D47A1]/40 hover:text-[#0D47A1] hover:bg-blue-50 transition-colors shadow-sm"
            style={{ fontFamily: RB }}
          >
            <Icon size={13} style={{ color }} />
            {label}
          </button>
        ))}
      </div>

      {/* ── KPI Row — 5 Personal Healthcare KPI Cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 items-stretch">
        <DKpi
          title="Upcoming Appointment"
          value={upcomingStr}
          sub={upcomingApt ? "Scheduled Visit" : "No Visit Scheduled"}
          trend={upcomingApt ? "Confirmed" : "No Schedule"}
          up={true}
          data={[{ v: upcomingApt ? 1 : 0 }]}
          color="#0D47A1"
          gid="pt1"
          Icon={Calendar}
        />
        <DKpi
          title="Active Prescriptions"
          value={String(prescriptions?.active ?? 0)}
          sub={
            prescriptionQuery.isLoading
              ? "Loading..."
              : (prescriptions?.active ?? 0) > 0
                ? `${prescriptions?.active} Active Medications`
                : "No Active Medications"
          }
          trend={(prescriptions?.active ?? 0) > 0 ? "Active" : "Up to Date"}
          up={true}
          data={
            prescriptionSummaryData.length > 0
              ? prescriptionSummaryData.slice(0, 5).map((p) => ({ v: p.count }))
              : [{ v: prescriptions?.active ?? 0 }]
          }
          color="#009688"
          gid="pt2"
          Icon={Pill}
        />
        <DKpi
          title="Outstanding Bills"
          value={
            dashboard?.billingSummary
              ? `₹${(dashboard.billingSummary.pendingAmount ?? 0).toLocaleString()}`
              : "₹0"
          }
          sub={
            dashboardQuery.isLoading
              ? "Loading..."
              : `${dashboard?.billingSummary?.pendingInvoiceCount ?? 0} Pending Invoices`
          }
          trend={
            dashboard && (dashboard.billingSummary?.pendingAmount ?? 0) > 0
              ? "Action Required"
              : "All Clear"
          }
          up={
            dashboard
              ? (dashboard.billingSummary?.pendingAmount ?? 0) === 0
              : true
          }
          data={[{ v: dashboard?.billingSummary?.pendingAmount ?? 0 }]}
          color="#F59E0B"
          gid="pt3"
          Icon={Receipt}
        />
        <DKpi
          title="Completed Consultations"
          value={String(consultations?.totalVisits ?? 0)}
          sub={
            consultationQuery.isLoading
              ? "Loading..."
              : `${consultations?.totalVisits ?? 0} Total OPD Visits`
          }
          trend={
            (consultations?.totalVisits ?? 0) > 0
              ? "OPD History"
              : "No OPD Visits"
          }
          up={true}
          data={
            consultationTrendData.length > 0
              ? consultationTrendData.slice(-6).map((c) => ({ v: c.visits }))
              : [{ v: consultations?.totalVisits ?? 0 }]
          }
          color="#66BB6A"
          gid="pt4"
          Icon={Stethoscope}
        />
        <DKpi
          title="Health Notifications"
          value={String(unreadCount)}
          sub={
            unreadQuery.isLoading
              ? "Loading..."
              : unreadCount > 0
                ? `${unreadCount} Unread Alerts`
                : "No Unread Alerts"
          }
          trend={unreadCount > 0 ? `${unreadCount} New` : "All Clear"}
          up={unreadCount === 0}
          data={[{ v: unreadCount }]}
          color="#EF4444"
          gid="pt5"
          Icon={Bell}
        />
      </div>

      {/* ── Main Personal Healthcare Grid 1 ── */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
        {/* Section 01: My Appointment Timeline */}
        <div className="xl:col-span-2 bg-white rounded-2xl border border-[#E5E7EB] p-5 shadow-sm flex flex-col justify-between">
          <SH
            title="My Appointment Timeline"
            sub="View Appointment History & Future Appointments"
            action={
              <button
                onClick={() => navigate(ROUTES.PATIENT_APPOINTMENTS)}
                className="text-xs text-[#0D47A1] font-semibold hover:underline"
                style={{ fontFamily: PP }}
              >
                + Book New
              </button>
            }
          />
          <div className="space-y-3.5 my-auto">
            {appointments.length > 0 ? (
              appointments.map((item) => (
                <div
                  key={
                    item.appointmentId ||
                    `apt-${item.appointmentDate}-${item.appointmentTime}`
                  }
                  className="flex items-center justify-between p-3 rounded-xl border border-gray-100 bg-slate-50 hover:bg-white transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-blue-50 text-[#0D47A1] font-bold text-xs">
                      <Calendar size={16} />
                    </div>
                    <div>
                      <div
                        className="text-xs font-bold text-[#111827]"
                        style={{ fontFamily: PP }}
                      >
                        {item.doctorName} ·{" "}
                        <span className="text-[#64748B] font-normal">
                          {item.specialty}
                        </span>
                      </div>
                      <div
                        className="text-[11px] text-[#64748B] mt-0.5"
                        style={{ fontFamily: RB }}
                      >
                        {item.appointmentDate} at{" "}
                        <span className="font-mono font-semibold text-[#0D47A1]">
                          {formatTime(item.appointmentTime)}
                        </span>
                      </div>
                    </div>
                  </div>
                  <Chip
                    label={item.displayStatus || item.status}
                    variant={
                      PAT_STATUS_CHIP[item.displayStatus || item.status] ||
                      "default"
                    }
                  />
                </div>
              ))
            ) : (
              <div className="text-center text-xs text-[#64748B] py-4">
                {appointmentsQuery.isLoading
                  ? "Loading appointments..."
                  : "No appointments found"}
              </div>
            )}
          </div>
          <div
            className="mt-3 pt-2 border-t border-gray-50 text-xs text-[#64748B] text-center"
            style={{ fontFamily: RB }}
          >
            Next Visit:{" "}
            <span className="font-semibold text-[#0D47A1]">{upcomingStr}</span>
          </div>
        </div>

        {/* Section 02: Consultation History Trend (Line Chart) */}
        <div className="bg-white rounded-2xl border border-[#E5E7EB] p-5 shadow-sm flex flex-col justify-between">
          <SH title="Consultation History" sub="Monthly OPD Visit Frequency" />
          <ResponsiveContainer width="100%" height={180}>
            <AreaChart
              data={consultationTrendData}
              margin={{ top: 10, right: 10, left: -15, bottom: 0 }}
            >
              <defs>
                <linearGradient id="patVisitGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#0D47A1" stopOpacity={0.25} />
                  <stop offset="100%" stopColor="#0D47A1" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis
                dataKey="month"
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
                formatter={(val: unknown) => [`${val} Visits`, "Consultations"]}
              />
              <Area
                type="monotone"
                dataKey="visits"
                stroke="#0D47A1"
                strokeWidth={2.5}
                fill="url(#patVisitGrad)"
                dot={{ r: 3, fill: "#0D47A1" }}
              />
            </AreaChart>
          </ResponsiveContainer>
          <div
            className="mt-2 pt-2 border-t border-gray-50 text-xs text-[#64748B] flex items-center justify-between"
            style={{ fontFamily: RB }}
          >
            <span>
              Total OPD Visits:{" "}
              <span className="font-semibold text-[#111827]">
                {consultations?.totalVisits ?? 0} Visits
              </span>
            </span>
            <span className="font-semibold text-[#0D47A1]">
              Avg {(consultations?.averageVisitsPerMonth ?? 0).toFixed(1)}/Month
            </span>
          </div>
        </div>
      </div>

      {/* ── Section 03 & 04: Prescription Summary & Billing Summary Charts ── */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
        {/* Section 03: Prescription Summary (Pie / Bar Chart) */}
        <div className="bg-white rounded-2xl border border-[#E5E7EB] p-5 shadow-sm flex flex-col justify-between">
          <SH
            title="Prescription Status"
            sub="Quick Overview of Medication Status"
          />
          <ResponsiveContainer width="100%" height={160}>
            <BarChart
              data={prescriptionSummaryData}
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
              />
              <Tooltip
                contentStyle={{
                  background: "#fff",
                  border: "1px solid #E5E7EB",
                  borderRadius: 12,
                  fontSize: 12,
                }}
                formatter={(val: unknown) => [`${val} Prescriptions`, "Count"]}
              />
              <Bar dataKey="count" radius={[4, 4, 0, 0]} barSize={26}>
                {prescriptionSummaryData.map((entry) => (
                  <Cell key={entry.name} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          <div
            className="grid grid-cols-3 gap-2 mt-2 pt-2 border-t border-gray-50 text-xs"
            style={{ fontFamily: RB }}
          >
            {prescriptionSummaryData.map((p) => (
              <div
                key={p.name}
                className="text-center p-1.5 rounded-lg bg-slate-50"
              >
                <span className="text-[10px] text-[#64748B] block">
                  {p.name}
                </span>
                <span className="font-bold text-[#111827]">{p.count}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Section 04: Billing Summary (Donut / Bar Chart) */}
        <div className="bg-white rounded-2xl border border-[#E5E7EB] p-5 shadow-sm flex flex-col justify-between">
          <SH title="Billing Overview" sub="Display Personal Payment Status" />
          <ResponsiveContainer width="100%" height={160}>
            <BarChart
              data={billingSummaryData}
              layout="vertical"
              margin={{ top: 0, right: 20, left: 10, bottom: 0 }}
            >
              <XAxis
                type="number"
                tick={{ fontSize: 10, fill: "#94A3B8" }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v: unknown) => `₹${Number(v).toLocaleString()}`}
              />
              <YAxis
                dataKey="name"
                type="category"
                tick={{ fontSize: 11, fill: "#111827", fontFamily: RB }}
                axisLine={false}
                tickLine={false}
                width={70}
              />
              <Tooltip
                contentStyle={{
                  background: "#fff",
                  border: "1px solid #E5E7EB",
                  borderRadius: 12,
                  fontSize: 12,
                }}
                formatter={(val: unknown) => [
                  `₹${Number(val).toLocaleString()}`,
                  "Amount",
                ]}
              />
              <Bar dataKey="amount" radius={[0, 6, 6, 0]} barSize={16}>
                {billingSummaryData.map((entry) => (
                  <Cell key={entry.name} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          <div
            className="mt-2 pt-2 border-t border-gray-50 text-xs text-[#64748B] text-center"
            style={{ fontFamily: RB }}
          >
            {dashboard?.billingSummary?.currency === "INR" ? "₹" : "$"}
            {(
              dashboard?.billingSummary?.pendingAmount ?? 0
            ).toLocaleString()}{" "}
            Pending ·{" "}
            {(dashboard?.billingSummary?.paidAmount ?? 0).toLocaleString()} Paid
          </div>
        </div>
      </div>

      {/* ── Section 05: Recent Prescriptions Table ── */}
      <div className="bg-white rounded-2xl border border-[#E5E7EB] shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-50 flex items-center justify-between">
          <div>
            <div
              className="text-sm font-semibold text-[#111827]"
              style={{ fontFamily: PP }}
            >
              Recent Prescriptions
            </div>
            <div
              className="text-xs text-[#64748B] mt-0.5"
              style={{ fontFamily: RB }}
            >
              Issued medical prescriptions and active orders
            </div>
          </div>
          <span
            className="text-xs font-semibold text-[#009688] bg-teal-50 px-2.5 py-1 rounded-lg"
            style={{ fontFamily: RB }}
          >
            {prescriptions?.active ?? 0} Active Meds
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-50 bg-slate-50/50">
                {[
                  "Prescription ID",
                  "Prescribing Doctor",
                  "Issued Date",
                  "Medicine Count",
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
              {(dashboard?.recentPrescriptions?.length ?? 0) > 0 ? (
                (
                  (dashboard?.recentPrescriptions || []) as DashboardRecord[]
                ).map((rx, idx) => (
                  <tr
                    key={String(
                      rx.prescriptionId ||
                        rx.id ||
                        rx.prescriptionNumber ||
                        rx.issuedAt ||
                        rx.doctorName ||
                        "rx",
                    )}
                    className="hover:bg-slate-50 transition-colors"
                  >
                    <td className="px-5 py-3 font-mono text-xs font-bold text-[#0D47A1]">
                      {String(
                        rx.prescriptionId ||
                          rx.prescriptionNumber ||
                          rx.id ||
                          `RX-${idx + 1}`,
                      )}
                    </td>
                    <td
                      className="px-5 py-3 text-xs font-medium text-[#111827]"
                      style={{ fontFamily: RB }}
                    >
                      {String(rx.doctorName || rx.doctor || "N/A")}
                    </td>
                    <td className="px-5 py-3 font-mono text-xs text-slate-500">
                      {String(rx.issuedAt || rx.createdAt || rx.date || "--")}
                    </td>
                    <td className="px-5 py-3 font-mono text-xs font-bold text-[#111827]">
                      {Number(
                        rx.medicinesCount ??
                          rx.medsCount ??
                          rx.items?.length ??
                          0,
                      )}{" "}
                      Medicines
                    </td>
                    <td className="px-5 py-3">
                      <Chip
                        label={String(rx.status || "Active")}
                        variant={
                          PAT_STATUS_CHIP[String(rx.status || "Active")] ||
                          "success"
                        }
                      />
                    </td>
                    <td className="px-5 py-3">
                      <button
                        className="px-3 py-1 rounded-lg bg-blue-50 text-[#0D47A1] text-[11px] font-semibold hover:bg-blue-100 transition-colors"
                        style={{ fontFamily: PP }}
                      >
                        View Prescription
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={6}
                    className="px-5 py-8 text-center text-xs text-[#64748B]"
                    style={{ fontFamily: RB }}
                  >
                    No prescriptions found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Section 06: Recent Bills Table ── */}
      <div className="bg-white rounded-2xl border border-[#E5E7EB] shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-50 flex items-center justify-between">
          <div>
            <div
              className="text-sm font-semibold text-[#111827]"
              style={{ fontFamily: PP }}
            >
              Recent Bills
            </div>
            <div
              className="text-xs text-[#64748B] mt-0.5"
              style={{ fontFamily: RB }}
            >
              Personal billing statements & payment history
            </div>
          </div>
          <button
            onClick={() => navigate(ROUTES.PATIENT_PORTAL_BILLING)}
            className="text-xs text-[#0D47A1] font-semibold hover:underline"
            style={{ fontFamily: RB }}
          >
            Pay Pending Bills →
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-50 bg-slate-50/50">
                {[
                  "Invoice Number",
                  "Visit Date",
                  "Amount",
                  "Payment Status",
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
              {(dashboard?.recentBills?.length ?? 0) > 0 ? (
                (
                  (dashboard?.recentBills || []) as Record<string, unknown>[]
                ).map((b, idx) => (
                  <tr
                    key={String(
                      b.billId ||
                        b.billNumber ||
                        b.invoiceId ||
                        b.id ||
                        b.billDate ||
                        b.date ||
                        b.generatedAt ||
                        "bill",
                    )}
                    className="hover:bg-slate-50 transition-colors"
                  >
                    <td className="px-5 py-3 font-mono text-xs font-bold text-[#0D47A1]">
                      {String(
                        b.billNumber ||
                          b.invoiceId ||
                          b.invoice ||
                          `BILL-${idx + 1}`,
                      )}
                    </td>
                    <td className="px-5 py-3 font-mono text-xs text-slate-500">
                      {String(b.billDate || b.generatedAt || b.date || "--")}
                    </td>
                    <td className="px-5 py-3 font-mono text-xs font-bold text-[#111827]">
                      ₹{Number(b.netAmount ?? b.amount ?? 0).toLocaleString()}
                    </td>
                    <td className="px-5 py-3">
                      <Chip
                        label={String(b.paymentStatus || b.status || "Pending")}
                        variant={
                          String(b.paymentStatus || b.status || "") === "PAID"
                            ? "success"
                            : String(b.paymentStatus || b.status || "") ===
                                "PARTIALLY_PAID"
                              ? "info"
                              : "warning"
                        }
                      />
                    </td>
                    <td className="px-5 py-3">
                      <button
                        className="px-3 py-1 rounded-lg bg-slate-100 text-[#0D47A1] text-[11px] font-semibold hover:bg-blue-50 transition-colors"
                        style={{ fontFamily: PP }}
                      >
                        View Invoice
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={5}
                    className="px-5 py-8 text-center text-xs text-[#64748B]"
                    style={{ fontFamily: RB }}
                  >
                    No billing history found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
