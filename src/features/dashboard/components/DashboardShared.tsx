import React from "react";
import { TrendingDown, TrendingUp } from "lucide-react";

import {
  AreaChart,
  Area,
  ResponsiveContainer,
} from "../../../common/components/recharts-lazy";

export const PP = "Poppins, system-ui, sans-serif";
export const RB = "Roboto, system-ui, sans-serif";

// ─── Mini Shared Components ────────────────────────────────────────────────
export function DKpi({
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
            className="text-2xl font-bold text-[#111827] leading-none"
            style={{ fontFamily: PP }}
          >
            {value}
          </div>
          <div
            className="text-xs text-slate-400 mt-1"
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

export type ChipVariant =
  | "success"
  | "warning"
  | "error"
  | "info"
  | "teal"
  | "default";
const DASHBOARD_CHIP_MAP: Record<ChipVariant, string> = {
  success: "bg-green-50 text-[#66BB6A]",
  warning: "bg-amber-50 text-[#F59E0B]",
  error: "bg-red-50 text-[#EF4444]",
  info: "bg-blue-50 text-[#0D47A1]",
  teal: "bg-teal-50 text-[#009688]",
  default: "bg-slate-50 text-[#64748B]",
};

export function Chip({
  label,
  variant = "default",
}: {
  label: string;
  variant?: ChipVariant;
}) {
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${DASHBOARD_CHIP_MAP[variant]}`}
      style={{ fontFamily: RB }}
    >
      {label}
    </span>
  );
}

export function SH({
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

export function ProgressBar({
  label,
  value,
  total,
  color,
  sub,
}: {
  label: string;
  value: number;
  total: number;
  color: string;
  sub?: string;
}) {
  const pct = Math.round((value / total) * 100);
  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <div className="flex items-center gap-2">
          <span
            className="w-2 h-2 rounded-full shrink-0"
            style={{ background: color }}
          />
          <span
            className="text-xs font-medium text-[#111827]"
            style={{ fontFamily: RB }}
          >
            {label}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {sub && (
            <span className="text-xs text-[#64748B]" style={{ fontFamily: RB }}>
              {sub}
            </span>
          )}
          <span className="font-mono text-xs font-semibold text-[#64748B]">
            {pct}%
          </span>
        </div>
      </div>
      <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-colors"
          style={{ width: `${pct}%`, background: color }}
        />
      </div>
    </div>
  );
}
