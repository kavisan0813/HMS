import { useNavigate } from "react-router";
import {
  CheckCircle2,
  RefreshCw,
  Settings,
  Download,
  ArrowLeft,
} from "lucide-react";
import { PP, RB } from "../constants/notifications.constants";

export interface NotificationPageHeaderProps {
  currentRole: string;
  onMarkAllAsRead: () => void;
  markAllPending?: boolean;
  onRefresh: () => void;
  onOpenSettings: () => void;
  canExport?: boolean;
  onExport: () => void;
}

export function NotificationPageHeader({
  currentRole,
  onMarkAllAsRead,
  markAllPending,
  onRefresh,
  onOpenSettings,
  canExport,
  onExport,
}: NotificationPageHeaderProps) {
  const navigate = useNavigate();
  return (
    <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
      <div>
        <button
            type="button"
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-2 px-3.5 py-2 mb-3 text-xs font-semibold text-slate-700 hover:text-slate-900 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl shadow-xs transition-all cursor-pointer"
            style={{ fontFamily: RB }}
          >
            <ArrowLeft size={16} />
            Back
          </button>
        <div className="flex items-center gap-3">
          <h1
            style={{ fontFamily: PP }}
            className="text-2xl font-bold tracking-tight text-[#111827]"
          >
            Notification Center
          </h1>
          <span className="rounded-full bg-[#0D47A1]/10 px-3 py-1 text-xs font-semibold text-[#0D47A1]">
            Role: {currentRole}
          </span>
        </div>
        <p className="text-sm text-[#64748B] mt-0.5">
          View and manage all application notifications, alerts, reminders, and
          workflow updates relevant to your role.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <button
          onClick={onMarkAllAsRead}
          disabled={markAllPending}
          className="flex items-center gap-1.5 rounded-lg border border-[#E5E7EB] bg-white px-3 py-2 text-xs font-semibold text-[#111827] shadow-sm hover:bg-slate-50 transition"
        >
          <CheckCircle2 className="w-4 h-4 text-[#66BB6A]" />
          Mark All as Read
        </button>

        <button
          onClick={onRefresh}
          className="flex items-center gap-1.5 rounded-lg border border-[#E5E7EB] bg-white px-3 py-2 text-xs font-semibold text-[#111827] shadow-sm hover:bg-slate-50 transition"
        >
          <RefreshCw className="w-4 h-4 text-[#0D47A1]" />
          Refresh
        </button>

        <button
          onClick={onOpenSettings}
          className="flex items-center gap-1.5 rounded-lg border border-[#E5E7EB] bg-white px-3 py-2 text-xs font-semibold text-[#111827] shadow-sm hover:bg-slate-50 transition"
        >
          <Settings className="w-4 h-4 text-[#64748B]" />
          Notification Settings
        </button>

        {canExport && (
          <button
            onClick={onExport}
            className="flex items-center gap-1.5 rounded-lg bg-[#0D47A1] px-3.5 py-2 text-xs font-semibold text-white shadow-sm hover:bg-[#0b3882] transition"
          >
            <Download className="w-4 h-4" />
            Export Notification Log
          </button>
        )}
      </div>
    </div>
  );
}
